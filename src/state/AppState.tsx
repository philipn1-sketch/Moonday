import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { predict, type Prediction } from '../core/cycle';
import { today } from '../core/days';
import { DEFAULT_SETTINGS, type DayKey, type DayLog, type Settings } from '../core/types';
import * as db from '../data/db';
import { planReminders } from '../core/reminders';
import * as notify from '../services/notify';
import { glanceDays } from '../core/glance';
import { shareGlance } from '../services/glance';
import * as health from '../services/health';
import { hasPlus } from '../core/plus';
import { owned } from '../services/purchases';
import { makeCode, mergeDays, sharedOf, type Vault } from '../core/sync';
import { deleteVault, fetchVault, newCodeBytes, storeVault, vaultAvailable } from '../services/vault';

export interface SnackAction {
  label: string;
  onPress: () => void;
}
interface Snack {
  id: number;
  message: string;
  actions: SnackAction[];
}

interface App {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  days: DayLog[];
  /** One day's log; an empty one for a day with nothing on it yet. */
  dayLog: (date: DayKey) => DayLog;
  /** Changes part of a day's log; fields set to undefined are cleared. */
  saveDay: (date: DayKey, patch: Partial<DayLog>) => void;
  todayKey: DayKey;
  prediction: Prediction;
  /** Moonday Plus is on: bought, or within the free week. */
  plus: boolean;
  /** Backup and partner sharing. */
  sync: { state: 'off' | 'syncing' | 'ok' | 'offline'; lastOk?: number };
  startSharing: () => Promise<string>;
  /** Joins with a code from her phone: as her partner (view only) or as her own new phone (restore). */
  joinFamily: (code: string, role: 'owner' | 'partner') => Promise<'joined' | 'notFound' | 'offline'>;
  stopSharing: () => void;
  deleteBackup: () => Promise<boolean>;
  /** Turns Apple Health on: asks permission, sends her period days, and brings in ones logged elsewhere. */
  connectHealth: () => Promise<boolean>;
  /** A partner's phone views her cycle but doesn't log. */
  viewOnly: boolean;
  snack: Snack | null;
  showSnack: (message: string, actions?: SnackAction[]) => void;
  hideSnack: () => void;
}

const Ctx = createContext<App | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const s = { ...DEFAULT_SETTINGS, ...db.loadSettings() };
    // the free week of Plus starts the first time Moonday opens, and is saved so a restart can't restart it
    if (!s.plus?.trialStartedAt) {
      s.plus = { ...s.plus, trialStartedAt: Date.now() };
      db.putSettings(s);
    }
    return s;
  });
  const [days, setDays] = useState<DayLog[]>(() => db.loadDays());
  const [todayKey, setTodayKey] = useState(() => today());
  const [snack, setSnack] = useState<Snack | null>(null);
  const daysRef = useRef(days);
  const healthOn = useRef(!!settings.health);
  healthOn.current = !!settings.health;
  daysRef.current = days;
  const snackId = useRef(0);

  // a new day can start while the app is open or in the background
  useEffect(() => {
    const check = () => setTodayKey(today());
    const timer = setInterval(check, 60_000);
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && check());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      db.putSettings(next);
      return next;
    });
  }, []);

  const dayLog = useCallback((date: DayKey) => daysRef.current.find((d) => d.date === date) ?? { date }, []);

  const saveDay = useCallback((date: DayKey, patch: Partial<DayLog>) => {
    const before = daysRef.current.find((d) => d.date === date) ?? { date };
    const next: DayLog = { ...before, ...patch, date, updatedAt: Date.now() };
    for (const k of Object.keys(next) as (keyof DayLog)[]) if (next[k] === undefined) delete next[k];
    db.putDay(next);
    const rest = daysRef.current.filter((d) => d.date !== date);
    daysRef.current = [...rest, next];
    setDays(daysRef.current);
    // a change to the flow goes to Apple Health, when she has it on
    if (healthOn.current && (before.flow ?? null) !== (next.flow ?? null)) health.writeDay(daysRef.current, next).catch(() => {});
  }, []);

  const prediction = useMemo(() => predict(days, settings, todayKey), [days, settings, todayKey]);

  // reminders follow her log and settings: an early or late period moves them
  useEffect(() => {
    const plan = planReminders(prediction, settings.reminders, Date.now(), settings.goal === 'pregnant');
    notify.syncReminders(plan, settings.reminders).catch(() => {});
  }, [prediction, settings.reminders, settings.goal]);

  const plus = hasPlus(settings, Date.now());

  // the widget, Watch and Siri follow her log
  useEffect(() => {
    shareGlance(glanceDays(days, settings, todayKey), plus, settings.lock);
  }, [days, settings, todayKey, plus]);

  // period days logged in other apps come in when Moonday opens
  const pullHealth = useCallback(async () => {
    if (!healthOn.current || settings.sync?.role === 'partner') return;
    const fresh = await health.readNewDays(daysRef.current, today());
    if (fresh.length === 0) return;
    for (const d of fresh) db.putDay(d);
    daysRef.current = [...daysRef.current, ...fresh];
    setDays(daysRef.current);
  }, [settings.sync?.role]);
  useEffect(() => {
    pullHealth().catch(() => {});
    const sub = RNAppState.addEventListener('change', (st) => st === 'active' && pullHealth().catch(() => {}));
    return () => sub.remove();
  }, [pullHealth, settings.health]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [syncState, setSyncState] = useState<App['sync']['state']>(settings.sync ? 'syncing' : 'off');
  const replaceDays = useCallback((next: DayLog[]) => {
    for (const d of next) db.putDay(d);
    daysRef.current = next;
    setDays(next);
  }, []);

  /** Fetch, merge, and (on her own phone) send back. Safe to call often; a newer backup always wins day by day. */
  const syncNow = useCallback(async () => {
    const s = settingsRef.current;
    if (!s.sync || !vaultAvailable) return;
    setSyncState('syncing');
    try {
      const remote = await fetchVault(s.sync.code);
      const merged = mergeDays(daysRef.current, remote?.days ?? []);
      replaceDays(merged);
      if (s.sync.role === 'partner') {
        if (remote) updateSettings({ ...remote.shared });
      } else {
        await storeVault(s.sync.code, { version: 1, days: merged, shared: sharedOf(s), sharedAt: Date.now() });
      }
      updateSettings({ sync: { ...s.sync, lastOk: Date.now() } });
      setSyncState('ok');
    } catch {
      setSyncState('offline');
    }
  }, [replaceDays, updateSettings]);

  // on opening, on coming back, and a moment after she logs something
  useEffect(() => {
    syncNow();
    const sub = RNAppState.addEventListener('change', (st) => st === 'active' && syncNow());
    return () => sub.remove();
  }, [syncNow]);
  useEffect(() => {
    if (!settings.sync || settings.sync.role === 'partner') return;
    const timer = setTimeout(syncNow, 2_000);
    return () => clearTimeout(timer);
  }, [days, settings.name, settings.goal, settings.usualCycle, settings.usualPeriod, settings.pregnancyStart, syncNow, settings.sync]);

  const startSharing = useCallback(async () => {
    const code = makeCode(newCodeBytes());
    const s = settingsRef.current;
    const v: Vault = { version: 1, days: daysRef.current, shared: sharedOf(s), sharedAt: Date.now() };
    await storeVault(code, v);
    updateSettings({ sync: { code, role: 'owner', lastOk: Date.now() } });
    setSyncState('ok');
    return code;
  }, [updateSettings]);

  const joinFamily = useCallback(async (code: string, role: 'owner' | 'partner') => {
    try {
      const remote = await fetchVault(code);
      if (!remote) return 'notFound' as const;
      replaceDays(mergeDays(daysRef.current, remote.days));
      updateSettings({ ...remote.shared, onboarded: true, sync: { code, role, lastOk: Date.now() } });
      setSyncState('ok');
      return 'joined' as const;
    } catch {
      return 'offline' as const;
    }
  }, [replaceDays, updateSettings]);

  const connectHealth = useCallback(async () => {
    if (!(await health.connectHealth())) return false;
    updateSettings({ health: true });
    healthOn.current = true;
    await health.writeAll(daysRef.current);
    await pullHealth();
    return true;
  }, [updateSettings, pullHealth]);

  const stopSharing = useCallback(() => {
    updateSettings({ sync: undefined });
    setSyncState('off');
  }, [updateSettings]);

  const deleteBackup = useCallback(async () => {
    const s = settingsRef.current;
    if (!s.sync) return false;
    const gone = await deleteVault(s.sync.code);
    stopSharing();
    return gone;
  }, [stopSharing]);

  // what this Apple ID owns, checked whenever Moonday opens: a cancelled subscription ends, a restore comes back
  useEffect(() => {
    const check = () =>
      owned()
        .then((o) => setSettings((s) => {
          if ((s.plus?.owned ?? null) === o || (s.plus?.owned === 'lifetime' && o === null)) return s;
          const next = { ...s, plus: { ...s.plus, owned: o ?? undefined } };
          db.putSettings(next);
          return next;
        }))
        .catch(() => {});
    check();
    const sub = RNAppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);

  const showSnack = useCallback((message: string, actions: SnackAction[] = []) => {
    snackId.current += 1;
    setSnack({ id: snackId.current, message, actions });
  }, []);
  const hideSnack = useCallback(() => setSnack(null), []);

  const value = useMemo<App>(
    () => ({
      settings, updateSettings, days, dayLog, saveDay, todayKey, prediction, plus, snack, showSnack, hideSnack,
      sync: { state: syncState, lastOk: settings.sync?.lastOk }, startSharing, joinFamily, stopSharing, deleteBackup, connectHealth,
      viewOnly: settings.sync?.role === 'partner',
    }),
    [settings, updateSettings, days, dayLog, saveDay, todayKey, prediction, plus, snack, showSnack, hideSnack, syncState, startSharing, joinFamily, stopSharing, deleteBackup, connectHealth],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}

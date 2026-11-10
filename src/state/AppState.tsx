import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { predict, type Prediction } from '../core/cycle';
import { today } from '../core/days';
import { DEFAULT_SETTINGS, type DayKey, type DayLog, type Settings } from '../core/types';
import * as db from '../data/db';
import { planReminders } from '../core/reminders';
import * as notify from '../services/notify';

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
  snack: Snack | null;
  showSnack: (message: string, actions?: SnackAction[]) => void;
  hideSnack: () => void;
}

const Ctx = createContext<App | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...db.loadSettings() }));
  const [days, setDays] = useState<DayLog[]>(() => db.loadDays());
  const [todayKey, setTodayKey] = useState(() => today());
  const [snack, setSnack] = useState<Snack | null>(null);
  const daysRef = useRef(days);
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
  }, []);

  const prediction = useMemo(() => predict(days, settings, todayKey), [days, settings, todayKey]);

  // reminders follow her log and settings: an early or late period moves them
  useEffect(() => {
    const plan = planReminders(prediction, settings.reminders, Date.now(), settings.goal === 'pregnant');
    notify.syncReminders(plan, settings.reminders).catch(() => {});
  }, [prediction, settings.reminders, settings.goal]);

  const showSnack = useCallback((message: string, actions: SnackAction[] = []) => {
    snackId.current += 1;
    setSnack({ id: snackId.current, message, actions });
  }, []);
  const hideSnack = useCallback(() => setSnack(null), []);

  const value = useMemo<App>(
    () => ({ settings, updateSettings, days, dayLog, saveDay, todayKey, prediction, snack, showSnack, hideSnack }),
    [settings, updateSettings, days, dayLog, saveDay, todayKey, prediction, snack, showSnack, hideSnack],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}

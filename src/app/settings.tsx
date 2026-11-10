import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MonthPicker } from '../components/MonthPicker';
import { Stepper } from '../components/Stepper';
import { TabBar } from '../components/TabBar';
import { Toggle } from '../components/Toggle';
import { Card, Choice, Screen, T } from '../components/ui';
import { dateOf } from '../core/days';
import type { ClockMinutes, Goal, Reminders, Settings as S, ThemeChoice } from '../core/types';
import { canLock, unlock } from '../services/lock';
import { askPermission } from '../services/notify';
import { t, tn } from '../i18n';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { radius, space, TAP, type } from '../theme';

/** Who she is, what she tracks for, and how Moonday looks. */
export default function Settings() {
  const { settings, updateSettings, todayKey, prediction } = useApp();
  const p = usePalette();
  const [picking, setPicking] = useState(false);
  const learned = prediction.stats.cycles.length >= 3;
  const r = settings.reminders;
  const setR = async (patch: Partial<Reminders>) => {
    // turning a reminder on is the moment to ask for notifications
    if (Object.values(patch).some((v) => v === true || typeof v === 'number')) await askPermission().catch(() => {});
    updateSettings({ reminders: { ...r, ...patch } });
  };
  const clock = (m: ClockMinutes) => new Date(2024, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const time = (label: string, m: ClockMinutes, onChange: (m: ClockMinutes) => void, testID: string) => (
    <Stepper label={label} value={m / 15} display={clock(m)} onChange={(n) => onChange(n * 15)} min={0} max={95} testID={testID} />
  );
  return (
    <Screen>
      <View style={styles.head}><T style={[type.title, { fontSize: 28 }]} accessibilityRole="header">{t('Settings')}</T></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: space.m }}>
          <T tone="muted" style={type.label}>{t('Your name')}</T>
          <TextInput testID="name" value={settings.name} onChangeText={(name) => updateSettings({ name: name.slice(0, 30) })} placeholder={t('Optional')}
            placeholderTextColor={p.muted} autoCapitalize="words" style={[type.body, styles.field, { color: p.ink, backgroundColor: p.raised }]} accessibilityLabel={t('Your name')} />
        </Card>

        <Card style={{ gap: space.m }}>
          <T tone="muted" style={type.label}>{t('What are you tracking for?')}</T>
          <Choice<Goal> label={t('Goal')} value={settings.goal} onChange={(goal) => updateSettings({ goal })}
            options={[{ value: 'track', label: t('My cycle') }, { value: 'conceive', label: t('Conceiving') }, { value: 'pregnant', label: t('Pregnant') }]} />
          {settings.goal === 'pregnant' && (
            <View style={{ gap: space.s }}>
              <Pressable onPress={() => setPicking((x) => !x)} accessibilityRole="button" testID="pregnancy-start" style={styles.row}>
                <T tone="muted">{t('Last period before pregnancy')}</T>
                <T style={{ fontWeight: '700' }}>
                  {settings.pregnancyStart ? dateOf(settings.pregnancyStart).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : t('Set')} ›
                </T>
              </Pressable>
              {picking && (
                <MonthPicker value={settings.pregnancyStart ?? null} max={todayKey} onChange={(d) => {
                  updateSettings({ pregnancyStart: d });
                  setPicking(false);
                }} />
              )}
            </View>
          )}
        </Card>

        {settings.goal !== 'pregnant' && (
          <Card style={{ gap: space.s }}>
            <T tone="muted" style={type.label}>{t('Usual cycle length')}</T>
            <Stepper label={t('Cycle length')} value={settings.usualCycle} display={tn('{n} day', '{n} days', settings.usualCycle)}
              onChange={(usualCycle) => updateSettings({ usualCycle })} min={18} max={50} testID="cycle" />
            <T tone="muted" style={[type.label, { marginTop: space.s }]}>{t('Usual period length')}</T>
            <Stepper label={t('Period length')} value={settings.usualPeriod} display={tn('{n} day', '{n} days', settings.usualPeriod)}
              onChange={(usualPeriod) => updateSettings({ usualPeriod })} min={1} max={12} testID="period" />
            <T tone="muted" style={type.small}>
              {learned ? t('Moonday now uses your own logged cycles, so these only fill gaps.') : t('Used until you have logged three cycles.')}
            </T>
          </Card>
        )}

        {settings.goal !== 'pregnant' && (
          <Card style={{ gap: space.xs }}>
            <T tone="muted" style={type.label}>{t('Reminders')}</T>
            <Toggle label={t('Period coming')} note={t('Two days before it is due')} value={r.period} onChange={(period) => setR({ period })} testID="remind-period" />
            <Toggle label={t('Fertile window')} note={t('On its first day')} value={r.fertile} onChange={(fertile) => setR({ fertile })} testID="remind-fertile" />
            {(r.period || r.fertile) && time(t('Reminder time'), r.at, (at) => setR({ at }), 'remind-at')}
            <Toggle label={t('Daily pill')} value={r.pill !== null} onChange={(on) => setR({ pill: on ? 21 * 60 : null })} testID="remind-pill" />
            {r.pill !== null && time(t('Pill time'), r.pill, (pill) => setR({ pill }), 'pill-at')}
            <Toggle label={t('Daily check in')} note={t('A nudge to log how you feel')} value={r.log !== null} onChange={(on) => setR({ log: on ? 20 * 60 : null })} testID="remind-log" />
            {r.log !== null && time(t('Check in time'), r.log, (log) => setR({ log }), 'log-at')}
            <Toggle label={t('Discreet reminders')} note={t('Lock screen wording never mentions periods or fertility')} value={r.discreet} onChange={(discreet) => updateSettings({ reminders: { ...r, discreet } })} testID="remind-discreet" />
          </Card>
        )}

        <Card style={{ gap: space.xs }}>
          <T tone="muted" style={type.label}>{t('Privacy')}</T>
          <Toggle label={t('Lock Moonday')} note={t('Face ID or your phone passcode each time it opens')} value={settings.lock} testID="lock"
            onChange={async (on) => {
              // check it works before turning it on, so she can never lock herself out
              if (on && !((await canLock()) && (await unlock()))) return;
              updateSettings({ lock: on });
            }} />
        </Card>

        <Card style={{ gap: space.m }}>
          <T tone="muted" style={type.label}>{t('Units')}</T>
          <Choice<S['units']> label={t('Units')} value={settings.units} onChange={(units) => updateSettings({ units })}
            options={[{ value: 'metric', label: t('°C and kg') }, { value: 'imperial', label: t('°F and lb') }]} />
          <T tone="muted" style={[type.label, { marginTop: space.s }]}>{t('Look')}</T>
          <Choice<ThemeChoice> label={t('Look')} value={settings.theme} onChange={(theme) => updateSettings({ theme })}
            options={[{ value: 'night', label: t('Night') }, { value: 'day', label: t('Day') }, { value: 'system', label: t('Auto') }]} />
        </Card>

        <T tone="muted" style={[type.small, { textAlign: 'center' }]}>
          {t('Everything you log stays on this phone. Moonday is not a form of contraception or a medical device.')}
        </T>
      </ScrollView>
      <TabBar current="settings" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.side, paddingTop: space.m, paddingBottom: space.s },
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.l },
  field: { minHeight: TAP, borderRadius: radius.row, paddingHorizontal: space.l },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: TAP },
});

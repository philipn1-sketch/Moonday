import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CycleDial } from '../components/CycleDial';
import { TabBar } from '../components/TabBar';
import { Card, PrimaryButton, Screen, SnackbarSlot, T } from '../components/ui';
import { flagsFor } from '../core/cycle';
import { addDays, dateOf, diff } from '../core/days';
import { PHASE_NAME, PHASE_TIP } from '../core/options';
import { t, tn } from '../i18n';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { phaseColor, radius, space, type, wash } from '../theme';

const weekday = (d: string) => dateOf(d).toLocaleDateString(undefined, { weekday: 'narrow' });

/** Where she is in her cycle today, what comes next, and one tap to log. */
export default function Today() {
  const { prediction: pr, todayKey, dayLog, saveDay, showSnack, settings } = useApp();
  const p = usePalette();
  const [area, setArea] = useState(0);
  const flags = flagsFor(pr);
  const accent = phaseColor(p, pr.phase);
  const log = dayLog(todayKey);

  const headline = pr.phase === null
    ? t('Log your period to start')
    : pr.inPeriod
      ? t('Period day {n}', { n: diff(pr.lastPeriod!.start, todayKey) + 1 })
      : pr.daysLate > 0
        ? tn('{n} day late', '{n} days late', pr.daysLate)
        : pr.daysUntilPeriod === 0
          ? t('Period expected today')
          : tn('Period in {n} day', 'Period in {n} days', pr.daysUntilPeriod ?? 0);

  const togglePeriod = () => {
    if (log.flow) {
      saveDay(todayKey, { flow: undefined });
      showSnack(t('Removed today from your period.'));
    } else {
      saveDay(todayKey, { flow: 'medium' });
      showSnack(pr.inPeriod ? t('Logged today as a period day.') : t('Period started. Predictions updated.'), [
        { label: t('Undo'), onPress: () => saveDay(todayKey, { flow: undefined }) },
      ]);
    }
  };

  const dial = Math.min(320, Math.max(220, area - 40));
  return (
    <Screen>
      <View style={styles.top}>
        <T tone="muted" style={type.label}>{dateOf(todayKey).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</T>
        {settings.name ? <T style={type.title}>{t('Hi {name}', { name: settings.name })}</T> : null}
      </View>
      <ScrollView contentContainerStyle={styles.body} onLayout={(e) => setArea(e.nativeEvent.layout.width)}>
        <View style={styles.week} accessibilityLabel={t('This week')}>
          {Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 3)).map((d) => {
            const on = d === todayKey;
            const logged = dayLog(d);
            return (
              <Pressable key={d} onPress={() => router.push(`/log/${d}`)} style={[styles.weekDay, on && { backgroundColor: p.surface }]} accessibilityRole="button"
                accessibilityLabel={dateOf(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
                <T tone="muted" style={type.small}>{weekday(d)}</T>
                <T style={[type.body, on && { fontWeight: '800' }]}>{dateOf(d).getDate()}</T>
                <View style={[styles.weekDot, { backgroundColor: logged.flow ? p.period : Object.keys(logged).length > 1 ? p.muted : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ alignItems: 'center' }}>
          <CycleDial prediction={pr} day={todayKey} size={dial}>
            <View style={styles.centre} accessible accessibilityLabel={`${headline}. ${pr.phase ? t(PHASE_NAME[pr.phase]) : ''}`}>
              {pr.cycleDay !== null && <T tone="muted" style={type.label}>{t('Cycle day {n}', { n: pr.cycleDay })}</T>}
              <T style={[type.hero, styles.headline, { fontSize: dial > 280 ? 34 : 28 }]} numberOfLines={2} adjustsFontSizeToFit>{headline}</T>
              {pr.phase && (
                <View style={[styles.phase, { backgroundColor: wash(accent, '33') }]}>
                  <T style={[type.small, { color: accent }]}>{t(PHASE_NAME[pr.phase])}</T>
                </View>
              )}
            </View>
          </CycleDial>
        </View>

        <PrimaryButton label={log.flow ? t('Remove today from period') : pr.inPeriod ? t('Log period today') : t('Log period')} onPress={togglePeriod} testID="period-today" />

        {pr.phase && (
          <Card style={{ gap: space.s }}>
            <T style={type.title}>{t(PHASE_NAME[pr.phase])}</T>
            <T tone="muted" style={type.label}>{t(PHASE_TIP[pr.phase])}</T>
            {pr.fertile && !pr.inPeriod && pr.daysLate === 0 && (
              <T tone="muted" style={type.small}>
                {t('Fertile window {from} to {to}', {
                  from: dateOf(pr.fertile.start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                  to: dateOf(pr.fertile.end).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                })}
              </T>
            )}
          </Card>
        )}

        <Pressable onPress={() => router.push(`/log/${todayKey}`)} testID="log-today" accessibilityRole="button"
          style={({ pressed }) => [styles.logCard, { backgroundColor: p.surface, opacity: pressed ? 0.85 : 1 }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={type.title}>{t('How are you today?')}</T>
            <T tone="muted" style={type.label}>{t('Symptoms, mood, discharge, sex, tests and more')}</T>
          </View>
          <View style={[styles.plus, { backgroundColor: p.accent }]}><T tone="onAccent" style={type.title}>+</T></View>
        </Pressable>

        {flags.length > 0 && (
          <Card style={{ gap: space.xs, borderWidth: 1.5, borderColor: wash(p.period, '80') }}>
            <T style={type.body}>{t('Worth mentioning to a doctor')}</T>
            <T tone="muted" style={type.label}>{t('Your recent cycles show a pattern a doctor or nurse may want to know about. See Insights.')}</T>
          </Card>
        )}
        <T tone="muted" style={[type.small, { textAlign: 'center' }]}>
          {pr.stats.confidence === 'high' ? t('Predictions are based on your last cycles.') : t('Predictions get better with each cycle you log.')}
        </T>
      </ScrollView>
      <View style={{ paddingHorizontal: space.side }}><SnackbarSlot /></View>
      <TabBar current="today" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: space.side, paddingTop: space.s, paddingBottom: space.s, gap: 2 },
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.l },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', paddingVertical: space.s, width: 44, borderRadius: radius.chip, gap: 2 },
  weekDot: { width: 6, height: 6, borderRadius: 3 },
  centre: { alignItems: 'center', paddingHorizontal: space.xxl + space.l, gap: space.xs },
  headline: { textAlign: 'center' },
  phase: { borderRadius: 999, paddingHorizontal: space.m, paddingVertical: 4, marginTop: space.xs },
  logCard: { flexDirection: 'row', alignItems: 'center', gap: space.m, borderRadius: radius.card, padding: space.l, paddingLeft: space.xl },
  plus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TabBar } from '../components/TabBar';
import { PillButton, Screen, T } from '../components/ui';
import { periodsFrom, upcoming } from '../core/cycle';
import { dateOf, diff, keyOf } from '../core/days';
import type { DayKey } from '../core/types';
import { t } from '../i18n';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { line, radius, space, type, wash } from '../theme';

type Mark = 'period' | 'predicted' | 'fertile' | 'ovulation' | null;

const inside = (d: DayKey, a: DayKey, b: DayKey) => diff(a, d) >= 0 && diff(d, b) >= 0;

/** A month at a time: her logged periods, the predicted ones, the fertile window and ovulation. Tap a day to log it. */
export default function Calendar() {
  const { days, prediction, todayKey, dayLog } = useApp();
  const p = usePalette();
  const [month, setMonth] = useState(() => {
    const d = dateOf(todayKey);
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  });
  const periods = periodsFrom(days);
  const future = upcoming(prediction, 8, todayKey);
  // the current cycle's fertile window, then the predicted ones
  const windows = [...(prediction.fertile && prediction.ovulation ? [{ fertile: prediction.fertile, ovulation: prediction.ovulation }] : []), ...future];

  const markOf = (d: DayKey): Mark => {
    if (periods.some((x) => inside(d, x.start, x.end)) || dayLog(d).flow) return 'period';
    if (diff(todayKey, d) > 0 && future.some((c) => inside(d, c.period.start, c.period.end))) return 'predicted';
    if (windows.some((w) => w.ovulation === d)) return 'ovulation';
    if (windows.some((w) => inside(d, w.fertile.start, w.fertile.end))) return 'fertile';
    return null;
  };

  const first = new Date(month);
  // weeks start on Monday
  const lead = (first.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (DayKey | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => keyOf(new Date(month.getFullYear(), month.getMonth(), i + 1, 12)))];
  while (cells.length % 7) cells.push(null);
  const heads = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));
  const move = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1, 12));

  return (
    <Screen>
      <View style={styles.head}>
        <PillButton label="‹" a11yLabel={t('Previous month')} onPress={() => move(-1)} testID="month-back" />
        <T style={type.title} accessibilityRole="header">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</T>
        <PillButton label="›" a11yLabel={t('Next month')} onPress={() => move(1)} testID="month-next" />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.row}>{heads.map((h, i) => <T key={i} tone="muted" style={[type.small, styles.cellText]}>{h}</T>)}</View>
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const m = markOf(d);
            const isToday = d === todayKey;
            const logged = Object.keys(dayLog(d)).length > 1;
            const fill = m === 'period' ? p.period : m === 'fertile' ? wash(p.fertile, '66') : m === 'ovulation' ? p.ovulation : 'transparent';
            const ink = m === 'period' || m === 'ovulation' ? p.onAccent : m === 'fertile' ? p.ink : p.ink;
            return (
              <Pressable key={d} style={styles.cell} onPress={() => router.push(`/log/${d}`)} testID={`day-${d}`} accessibilityRole="button"
                accessibilityLabel={dateOf(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
                <View style={[styles.dayCircle, {
                  backgroundColor: fill,
                  borderColor: m === 'predicted' ? p.period : isToday ? p.ink : 'transparent',
                  borderStyle: m === 'predicted' ? 'dashed' : 'solid',
                }]}>
                  <T style={[type.body, { color: ink }, isToday && { fontWeight: '800' }]}>{dateOf(d).getDate()}</T>
                </View>
                <View style={[styles.logDot, { backgroundColor: logged ? p.muted : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.legend, { borderTopColor: line(p) }]}>
          {[
            { label: t('Period'), view: <View style={[styles.key, { backgroundColor: p.period }]} /> },
            { label: t('Predicted period'), view: <View style={[styles.key, { borderWidth: 2, borderStyle: 'dashed', borderColor: p.period }]} /> },
            { label: t('Fertile window'), view: <View style={[styles.key, { backgroundColor: wash(p.fertile, '66') }]} /> },
            { label: t('Ovulation'), view: <View style={[styles.key, { backgroundColor: p.ovulation }]} /> },
            { label: t('Something logged'), view: <View style={[styles.logDot, { backgroundColor: p.muted, marginHorizontal: 7 }]} /> },
          ].map((k) => (
            <View key={k.label} style={styles.legendItem}>{k.view}<T tone="muted" style={type.label}>{k.label}</T></View>
          ))}
          <T tone="muted" style={[type.small, { marginTop: space.s }]}>{t('Predictions are estimates and are not a form of contraception.')}</T>
        </View>
      </ScrollView>
      <TabBar current="calendar" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.side, paddingVertical: space.s },
  body: { paddingHorizontal: space.m, paddingBottom: space.xl },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  cellText: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: space.s },
  dayCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  logDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  legend: { marginTop: space.l, paddingTop: space.l, paddingHorizontal: space.s, borderTopWidth: StyleSheet.hairlineWidth, gap: space.s },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  key: { width: 20, height: 20, borderRadius: radius.chip },
});

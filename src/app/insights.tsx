import { ScrollView, StyleSheet, View } from 'react-native';

import { TabBar } from '../components/TabBar';
import { Card, Screen, T } from '../components/ui';
import { flagsFor, periodsFrom, predict, type Flag, type Phase } from '../core/cycle';
import { diff } from '../core/days';
import { PHASE_NAME, SYMPTOMS } from '../core/options';
import { t, tk, tn } from '../i18n';
import { useApp } from '../state/AppState';
import { usePalette } from '../state/theme';
import { line, radius, space, type, wash } from '../theme';

const FLAG_TEXT: Record<Flag, string> = {
  irregular: tk('Your cycle length changes by more than a week from cycle to cycle.'),
  short: tk('Some cycles were shorter than 21 days.'),
  long: tk('Some cycles were longer than 35 days.'),
  longPeriod: tk('Some periods lasted longer than 7 days.'),
  late: tk('Your period is a week or more late.'),
};

/** Her own patterns: how long her cycles and periods run, how steady they are, and what she feels when. */
export default function Insights() {
  const { days, prediction: pr, settings } = useApp();
  const p = usePalette();
  const { stats } = pr;
  const flags = flagsFor(pr);
  const periods = periodsFrom(days);
  const recent = periods.slice(1).map((x, i) => ({ start: periods[i].start, length: diff(periods[i].start, x.start) })).slice(-6);
  const max = Math.max(36, ...recent.map((r) => r.length));

  // which symptoms she logs most in each phase, from the day's phase as it was predicted at the time
  const byPhase = new Map<Phase, Map<string, number>>();
  for (const d of days) {
    if (!d.symptoms?.length) continue;
    const phase = predict(days, settings, d.date).phase;
    if (!phase) continue;
    const m = byPhase.get(phase) ?? new Map<string, number>();
    for (const s of d.symptoms) m.set(s, (m.get(s) ?? 0) + 1);
    byPhase.set(phase, m);
  }
  const label = (id: string) => t(SYMPTOMS.find((s) => s.id === id)?.label ?? id);

  return (
    <Screen>
      <View style={styles.head}><T style={[type.title, { fontSize: 28 }]} accessibilityRole="header">{t('Insights')}</T></View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.tiles}>
          {[
            { k: t('Cycle'), v: tn('{n} day', '{n} days', stats.avgCycle), color: p.accent },
            { k: t('Period'), v: tn('{n} day', '{n} days', stats.avgPeriod), color: p.period },
            { k: t('Varies by'), v: stats.cycles.length >= 2 ? t('± {n}', { n: stats.spread }) : t('Not yet'), color: p.fertile },
          ].map((x) => (
            <View key={x.k} style={[styles.tile, { backgroundColor: p.surface }]} accessible accessibilityLabel={`${x.k}: ${x.v}`}>
              <T tone="muted" style={type.small}>{x.k}</T>
              <T style={[type.title, { color: x.color }]} numberOfLines={1} adjustsFontSizeToFit>{x.v}</T>
            </View>
          ))}
        </View>

        <Card style={{ gap: space.m }}>
          <T style={type.body}>{t('Cycle length')}</T>
          {recent.length === 0 ? (
            <T tone="muted" style={type.label}>{t('Log two periods to see your cycle lengths here.')}</T>
          ) : (
            <View style={styles.bars}>
              {recent.map((r) => (
                <View key={r.start} style={styles.barCol} accessible accessibilityLabel={tn('{n} day', '{n} days', r.length)}>
                  <T style={type.small}>{r.length}</T>
                  <View style={[styles.bar, { height: (r.length / max) * 120, backgroundColor: r.length < 21 || r.length > 35 ? p.period : p.accent }]} />
                </View>
              ))}
            </View>
          )}
          <View style={[styles.normal, { borderColor: line(p) }]}>
            <T tone="muted" style={type.small}>{t('Typical for adults: 21 to 35 days')}</T>
          </View>
        </Card>

        <Card style={{ gap: space.m }}>
          <T style={type.body}>{t('Common symptoms by phase')}</T>
          {byPhase.size === 0 ? (
            <T tone="muted" style={type.label}>{t('Log symptoms for a cycle or two to see your patterns.')}</T>
          ) : (
            (['period', 'follicular', 'fertile', 'ovulation', 'luteal'] as Phase[]).filter((ph) => byPhase.has(ph)).map((ph) => {
              const top = [...byPhase.get(ph)!.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
              return (
                <View key={ph} style={{ gap: 4 }}>
                  <T tone="muted" style={type.small}>{t(PHASE_NAME[ph])}</T>
                  <View style={styles.pills}>
                    {top.map(([id]) => (
                      <View key={id} style={[styles.pill, { backgroundColor: wash(p.accent, '26') }]}><T style={type.label}>{label(id)}</T></View>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card style={{ gap: space.s }}>
          <T style={type.body}>{t('For your doctor')}</T>
          {flags.length === 0 ? (
            <T tone="muted" style={type.label}>{t('Nothing unusual in your recent cycles.')}</T>
          ) : (
            flags.map((f) => <T key={f} tone="muted" style={type.label}>{`• ${t(FLAG_TEXT[f])}`}</T>)
          )}
          <T tone="muted" style={type.small}>{t('Moonday spots patterns but cannot diagnose. A doctor or nurse can tell you what they mean for you.')}</T>
        </Card>
      </ScrollView>
      <TabBar current="insights" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: space.side, paddingTop: space.m, paddingBottom: space.s },
  body: { paddingHorizontal: space.side, paddingBottom: space.xl, gap: space.l },
  tiles: { flexDirection: 'row', gap: space.s },
  tile: { flex: 1, borderRadius: radius.row, padding: space.m, gap: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.m, height: 150 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  bar: { width: '70%', borderRadius: 8 },
  normal: { borderTopWidth: 1, borderStyle: 'dashed', paddingTop: space.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  pill: { borderRadius: 999, paddingHorizontal: space.m, paddingVertical: 4 },
});

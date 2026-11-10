import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { nextMilestone, pregnancyFrom } from '../core/cycle';
import { dateOf } from '../core/days';
import type { DayKey } from '../core/types';
import { t, tn } from '../i18n';
import { usePalette } from '../state/theme';
import { space, type, wash } from '../theme';
import { Ring } from './Ring';
import { Card, SecondaryButton, T } from './ui';

/** Pregnancy mode's Today: how far along she is, counted from her last period as doctors count it. */
export function PregnancyView({ start, day, name }: { start: DayKey; day: DayKey; name: string }) {
  const p = usePalette();
  const g = pregnancyFrom(start, day);
  const next = nextMilestone(g.weeks);
  const due = dateOf(g.due).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  const trimester = { 1: t('First trimester'), 2: t('Second trimester'), 3: t('Third trimester') }[g.trimester];
  return (
    <ScrollView contentContainerStyle={styles.body}>
      {name ? <T style={type.title}>{t('Hi {name}', { name })}</T> : null}
      <View style={{ alignItems: 'center' }}>
        <Ring size={260} width={16} progress={(280 - g.daysToGo) / 280} color={p.accent} track={wash(p.muted, '33')}>
          <View style={styles.centre} accessible accessibilityLabel={t('{weeks} weeks and {days} days pregnant', { weeks: g.weeks, days: g.days })}>
            <T tone="muted" style={type.label}>{t('Week')}</T>
            <T style={type.hero} testID="pregnancy-week">{g.weeks}</T>
            <T tone="muted" style={type.label}>{tn('and {n} day', 'and {n} days', g.days)}</T>
          </View>
        </Ring>
      </View>
      <Card style={{ gap: space.s }}>
        <T style={type.title}>{trimester}</T>
        <T tone="muted" style={type.label}>{t('Due date {date}', { date: due })}</T>
        <T tone="muted" style={type.label}>{tn('{n} day to go', '{n} days to go', g.daysToGo)}</T>
      </Card>
      {next && (
        <Card style={{ gap: space.xs }}>
          <T tone="muted" style={type.small}>{t('NEXT MILESTONE')}</T>
          <T style={type.body}>{t(next.label)}</T>
          <T tone="muted" style={type.label}>{t('Week {n}', { n: next.week })}</T>
        </Card>
      )}
      <SecondaryButton strong label={t('Log how you feel today')} onPress={() => router.push(`/log/${day}`)} testID="log-today" />
      <T tone="muted" style={[type.small, { textAlign: 'center' }]}>{t('Your midwife or doctor may date the pregnancy from a scan instead. You can change the start in Settings.')}</T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.side, paddingTop: space.m, paddingBottom: space.xl, gap: space.l },
  centre: { alignItems: 'center' },
});

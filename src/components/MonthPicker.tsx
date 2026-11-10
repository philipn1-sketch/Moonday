import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { dateOf, diff, keyOf } from '../core/days';
import type { DayKey } from '../core/types';
import { t } from '../i18n';
import { usePalette } from '../state/theme';
import { space, type } from '../theme';
import { PillButton, T } from './ui';

/** A month of days to pick one from, for her last period or a pregnancy start. Days after `max` can't be picked. */
export function MonthPicker({ value, onChange, max }: { value: DayKey | null; onChange: (d: DayKey) => void; max: DayKey }) {
  const p = usePalette();
  const [month, setMonth] = useState(() => {
    const d = dateOf(value ?? max);
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  });
  const lead = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (DayKey | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => keyOf(new Date(month.getFullYear(), month.getMonth(), i + 1, 12)))];
  while (cells.length % 7) cells.push(null);
  const move = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1, 12));
  const atEnd = diff(max, keyOf(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))) > 0;
  return (
    <View style={{ gap: space.s }}>
      <View style={styles.head}>
        <PillButton label="‹" a11yLabel={t('Previous month')} onPress={() => move(-1)} />
        <T style={type.body}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</T>
        {atEnd ? <View style={{ width: 52 }} /> : <PillButton label="›" a11yLabel={t('Next month')} onPress={() => move(1)} />}
      </View>
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const future = diff(max, d) > 0;
          const on = d === value;
          return (
            <Pressable key={d} disabled={future} onPress={() => onChange(d)} style={styles.cell} testID={`pick-${d}`} accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: future }} accessibilityLabel={dateOf(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}>
              <View style={[styles.day, on && { backgroundColor: p.period }]}>
                <T style={[type.body, { color: on ? p.onAccent : future ? `${p.muted}66` : p.ink }]}>{dateOf(d).getDate()}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

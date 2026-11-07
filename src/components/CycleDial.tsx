import type { ReactNode } from 'react';
import { View } from 'react-native';

import { addDays, diff } from '../core/days';
import type { Prediction } from '../core/cycle';
import type { DayKey } from '../core/types';
import { usePalette } from '../state/theme';
import { line } from '../theme';

/**
 * Her cycle as a ring of days, starting at the top with day 1 and running clockwise: rose for period
 * days, teal for the fertile window, violet for ovulation, and a larger ring around today.
 */
export function CycleDial({ prediction, day, size, children }: { prediction: Prediction; day: DayKey; size: number; children?: ReactNode }) {
  const p = usePalette();
  const { lastPeriod, stats, fertile, ovulation, nextPeriod } = prediction;
  const length = Math.max(stats.avgCycle, prediction.cycleDay ?? 0, 20);
  const dot = Math.max(7, Math.min(13, (Math.PI * size) / length / 1.9));
  const r = size / 2 - 14;
  const start = lastPeriod?.start ?? day;
  const color = (d: DayKey) => {
    if (lastPeriod && diff(lastPeriod.start, d) >= 0 && diff(d, lastPeriod.end) >= 0) return p.period;
    if (nextPeriod && diff(nextPeriod.start, d) >= 0 && diff(d, nextPeriod.end) >= 0) return `${p.period}66`;
    if (d === ovulation) return p.ovulation;
    if (fertile && diff(fertile.start, d) >= 0 && diff(d, fertile.end) >= 0) return p.fertile;
    return line(p);
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible={false}>
      {Array.from({ length }, (_, i) => {
        const d = addDays(start, i);
        const a = (i / length) * Math.PI * 2 - Math.PI / 2;
        const isToday = d === day;
        const s = isToday ? dot * 1.9 : dot;
        return (
          <View key={i} style={{
            position: 'absolute', width: s, height: s, borderRadius: s / 2,
            left: size / 2 + r * Math.cos(a) - s / 2, top: size / 2 + r * Math.sin(a) - s / 2,
            backgroundColor: color(d), borderWidth: isToday ? 3 : 0, borderColor: p.ink,
          }} />
        );
      })}
      {children}
    </View>
  );
}

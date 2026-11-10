import { tk } from '../i18n';
import type { Prediction } from './cycle';
import { addDays, dateOf } from './days';
import type { ClockMinutes, DayKey, Reminders } from './types';

/** A one off reminder on a day; daily ones (pill, log) are scheduled as repeating by the phone. */
export interface Planned {
  id: 'period' | 'fertile';
  at: number;
  /** English text, translated when scheduled. */
  body: string;
}

const atTime = (day: DayKey, m: ClockMinutes) => {
  const d = dateOf(day);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d.getTime();
};

export const PERIOD_SOON = tk('Your period may start in 2 days.');
export const FERTILE_SOON = tk('Your fertile window starts today.');
/** Shown instead when she asks for discreet reminders. */
export const DISCREET = tk('A reminder from Moonday.');
export const PILL = tk('Time for your pill.');
export const PILL_DISCREET = tk('Your daily reminder.');
export const LOG = tk('How are you today? Take a moment to log it.');

/**
 * The next period and fertile window reminders still to come. Rebuilt whenever her log or settings change,
 * so a period that comes early or late moves them.
 */
export function planReminders(p: Prediction, r: Reminders, now: number, pregnant: boolean): Planned[] {
  if (pregnant || !p.nextPeriod) return [];
  const out: Planned[] = [];
  if (r.period && p.daysLate === 0) {
    out.push({ id: 'period', at: atTime(addDays(p.nextPeriod.start, -2), r.at), body: r.discreet ? DISCREET : PERIOD_SOON });
  }
  if (r.fertile && p.fertile) {
    // this cycle's window if it is still ahead, otherwise the next cycle's
    const start = atTime(p.fertile.start, r.at) > now ? p.fertile.start : addDays(p.fertile.start, p.stats.avgCycle);
    out.push({ id: 'fertile', at: atTime(start, r.at), body: r.discreet ? DISCREET : FERTILE_SOON });
  }
  return out.filter((x) => x.at > now);
}

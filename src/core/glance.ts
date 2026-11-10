import { t, tn } from '../i18n';
import { chanceOn, predict, pregnancyFrom, type Phase } from './cycle';
import { addDays, dateOf } from './days';
import { PHASE_NAME } from './options';
import type { DayKey, DayLog, Settings } from './types';

/**
 * What the widget, the Watch and Siri show for one day. Plain, already translated strings: they run outside
 * the app and can't work anything out themselves.
 */
export interface Glance {
  day: DayKey;
  name: string;
  /** "Period in 5 days", "Period day 2", "3 days late", "Week 21". */
  headline: string;
  /** "Cycle day 12" or "and 3 days"; empty when there is nothing logged. */
  detail: string;
  /** "Fertile window", "Luteal phase". */
  phase: string;
  /** Which colour the phase is drawn in. */
  tone: 'period' | 'fertile' | 'ovulation' | 'calm';
  /** "Next period Nov 24", or the due date in pregnancy. */
  next: string;
  /** Short form for small spaces: "5d", "D2", "W21". */
  short: string;
}

const toneOf = (phase: Phase | null): Glance['tone'] =>
  phase === 'period' || phase === 'late' ? 'period' : phase === 'fertile' ? 'fertile' : phase === 'ovulation' ? 'ovulation' : 'calm';

const shortDate = (d: DayKey) => dateOf(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function glanceFor(days: DayLog[], s: Settings, day: DayKey): Glance {
  const base = { day, name: s.name };
  if (s.goal === 'pregnant' && s.pregnancyStart) {
    const g = pregnancyFrom(s.pregnancyStart, day);
    return {
      ...base,
      headline: t('Week {n}', { n: g.weeks }),
      detail: tn('and {n} day', 'and {n} days', g.days),
      phase: { 1: t('First trimester'), 2: t('Second trimester'), 3: t('Third trimester') }[g.trimester],
      tone: 'calm',
      next: t('Due {date}', { date: shortDate(g.due) }),
      short: `W${g.weeks}`,
    };
  }
  const p = predict(days, s, day);
  if (p.phase === null || p.cycleDay === null || !p.nextPeriod) {
    return { ...base, headline: t('Log your period to start'), detail: '', phase: '', tone: 'calm', next: '', short: '' };
  }
  const periodDay = p.inPeriod && p.lastPeriod ? p.cycleDay : 0;
  const headline = periodDay ? t('Period day {n}', { n: periodDay })
    : p.daysLate > 0 ? tn('{n} day late', '{n} days late', p.daysLate)
      : p.daysUntilPeriod === 0 ? t('Period expected today')
        : tn('Period in {n} day', 'Period in {n} days', p.daysUntilPeriod ?? 0);
  const chance = s.goal === 'conceive' ? chanceOn(p, day) : null;
  return {
    ...base,
    headline,
    detail: t('Cycle day {n}', { n: p.cycleDay }),
    phase: chance && chance !== 'low' ? t(chance === 'high' ? 'High chance of conceiving' : 'Medium chance of conceiving') : t(PHASE_NAME[p.phase]),
    tone: toneOf(p.phase),
    next: p.daysLate > 0 ? t('Period was due {date}', { date: shortDate(p.nextPeriod.start) }) : t('Next period {date}', { date: shortDate(p.nextPeriod.start) }),
    short: periodDay ? `D${periodDay}` : p.daysLate > 0 ? `+${p.daysLate}` : `${p.daysUntilPeriod}d`,
  };
}

/** Today and the next days, so the widget moves on at midnight without the app being opened. */
export const glanceDays = (days: DayLog[], s: Settings, from: DayKey, count = 7): Glance[] =>
  Array.from({ length: count }, (_, i) => glanceFor(days, s, addDays(from, i)));

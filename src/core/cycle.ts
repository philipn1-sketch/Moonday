import { addDays, diff } from './days';
import type { DayKey, DayLog, Settings } from './types';

/**
 * How Moonday reads a cycle. Everything here is an estimate from her own logs and is never a form of
 * contraception: the app says so wherever it shows a fertile window.
 */

/** A period as she logged it: from its first bleeding day to its last, spotting at either end included. */
export interface Period {
  start: DayKey;
  end: DayKey;
  /** Days from start to end, both included. */
  length: number;
}

/** Days without bleeding that still count as the same period (a light day she didn't log, say). */
const GAP_WITHIN_PERIOD = 2;
/** The luteal phase, from ovulation to the next period, is the steadiest part of a cycle. */
const LUTEAL_DAYS = 14;
/** Cycles outside this range are almost always a missed or extra log, so they don't shape predictions. */
const PLAUSIBLE_CYCLE = [15, 60] as const;
/** How many recent cycles predictions learn from. */
const RECENT = 6;

/** Her periods, oldest first. Spotting alone never starts one; it joins a period it touches. */
export function periodsFrom(logs: DayLog[]): Period[] {
  const bleeding = logs.filter((l) => l.flow).sort((a, b) => (a.date < b.date ? -1 : 1));
  const out: Period[] = [];
  let cur: { start: DayKey; end: DayKey; real: boolean } | null = null;
  const close = () => {
    if (cur?.real) out.push({ start: cur.start, end: cur.end, length: diff(cur.start, cur.end) + 1 });
  };
  for (const l of bleeding) {
    const real = l.flow !== 'spotting';
    if (cur && diff(cur.end, l.date) <= GAP_WITHIN_PERIOD + 1) {
      cur.end = l.date;
      if (real && !cur.real) cur.real = true;
      continue;
    }
    close();
    cur = { start: l.date, end: l.date, real };
  }
  close();
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

export type Confidence = 'low' | 'medium' | 'high';

export interface CycleStats {
  /** Lengths of her recent complete cycles, oldest first. */
  cycles: number[];
  periods: number[];
  avgCycle: number;
  avgPeriod: number;
  /** How many days her cycles usually vary, for "give or take" wording. */
  spread: number;
  confidence: Confidence;
}

/** Her averages, learned from her own cycles. With fewer than three, what she told us at the start fills in. */
export function statsFrom(periods: Period[], s: Pick<Settings, 'usualCycle' | 'usualPeriod'>): CycleStats {
  const all = periods.slice(1).map((p, i) => diff(periods[i].start, p.start));
  const cycles = all.filter((c) => c >= PLAUSIBLE_CYCLE[0] && c <= PLAUSIBLE_CYCLE[1]).slice(-RECENT);
  const lengths = periods.map((p) => p.length).filter((n) => n <= 12).slice(-RECENT);
  const fill = (xs: number[], usual: number) => (xs.length >= 3 ? xs : [...xs, ...Array(3 - xs.length).fill(usual)]);
  const spread = Math.max(1, Math.round(sd(cycles)));
  const confidence: Confidence = cycles.length < 2 ? 'low' : cycles.length >= 3 && spread <= 2 ? 'high' : spread <= 5 ? 'medium' : 'low';
  return {
    cycles,
    periods: lengths,
    avgCycle: Math.round(mean(fill(cycles, s.usualCycle))),
    avgPeriod: Math.round(mean(fill(lengths, s.usualPeriod))),
    spread,
    confidence,
  };
}

export type Phase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'late';

export interface Window {
  start: DayKey;
  end: DayKey;
}

export interface Prediction {
  stats: CycleStats;
  lastPeriod: Period | null;
  /** Day 1 is the first day of her last period. */
  cycleDay: number | null;
  phase: Phase | null;
  inPeriod: boolean;
  nextPeriod: Window | null;
  daysUntilPeriod: number | null;
  /** Days past the expected start, 0 when not late. */
  daysLate: number;
  ovulation: DayKey | null;
  fertile: Window | null;
}

/** Ovulation and fertile window for a cycle that starts on `start` and lasts `length` days. */
export function fertileFor(start: DayKey, length: number): { ovulation: DayKey; fertile: Window } {
  // two weeks before the next period: day 15 of a 28 day cycle
  const ovulation = addDays(start, Math.max(length - LUTEAL_DAYS, 7));
  return { ovulation, fertile: { start: addDays(ovulation, -5), end: addDays(ovulation, 1) } };
}

const within = (d: DayKey, w: Window | null) => !!w && diff(w.start, d) >= 0 && diff(d, w.end) >= 0;

/** Where she is today and what comes next. Nothing is predicted until she has logged one period. */
export function predict(logs: DayLog[], s: Pick<Settings, 'usualCycle' | 'usualPeriod'>, day: DayKey): Prediction {
  const periods = periodsFrom(logs);
  const stats = statsFrom(periods, s);
  const last = periods.filter((p) => diff(p.start, day) >= 0).at(-1) ?? null;
  if (!last) {
    return { stats, lastPeriod: null, cycleDay: null, phase: null, inPeriod: false, nextPeriod: null, daysUntilPeriod: null, daysLate: 0, ovulation: null, fertile: null };
  }
  const cycleDay = diff(last.start, day) + 1;
  // still bleeding, or within her usual length of a period whose end she may not have logged yet
  const loggedToday = logs.some((l) => l.date === day && l.flow);
  const inPeriod = diff(day, last.end) >= 0 || (loggedToday && cycleDay <= 12);
  const nextStart = addDays(last.start, stats.avgCycle);
  const daysUntil = diff(day, nextStart);
  const daysLate = daysUntil < 0 && !inPeriod ? -daysUntil : 0;
  const { ovulation, fertile } = fertileFor(last.start, stats.avgCycle);
  let phase: Phase;
  if (inPeriod) phase = 'period';
  else if (daysLate > 0) phase = 'late';
  else if (day === ovulation) phase = 'ovulation';
  else if (within(day, fertile)) phase = 'fertile';
  else if (diff(day, fertile.start) > 0) phase = 'follicular';
  else phase = 'luteal';
  return {
    stats,
    lastPeriod: last,
    cycleDay,
    phase,
    inPeriod,
    nextPeriod: { start: nextStart, end: addDays(nextStart, stats.avgPeriod - 1) },
    daysUntilPeriod: Math.max(daysUntil, 0),
    daysLate,
    ovulation,
    fertile,
  };
}

export interface FutureCycle {
  period: Window;
  ovulation: DayKey;
  fertile: Window;
}

/** The next few predicted cycles, for the calendar. A late period moves them all to start from today. */
export function upcoming(p: Prediction, count = 6, day?: DayKey): FutureCycle[] {
  if (!p.nextPeriod) return [];
  const out: FutureCycle[] = [];
  let start = p.daysLate > 0 && day ? day : p.nextPeriod.start;
  for (let i = 0; i < count; i++) {
    const period = { start, end: addDays(start, p.stats.avgPeriod - 1) };
    out.push({ period, ...fertileFor(start, p.stats.avgCycle) });
    start = addDays(start, p.stats.avgCycle);
  }
  return out;
}

export type Flag = 'irregular' | 'short' | 'long' | 'longPeriod' | 'late';

/**
 * Patterns worth mentioning to a doctor, from common clinical ranges for adults: cycles of 21 to 35 days,
 * periods up to 7 days, and cycle lengths that vary by up to about a week. Never a diagnosis.
 */
export function flagsFor(p: Prediction): Flag[] {
  const { cycles, periods } = p.stats;
  const out: Flag[] = [];
  if (cycles.length >= 3 && Math.max(...cycles) - Math.min(...cycles) > 7) out.push('irregular');
  if (cycles.some((c) => c < 21)) out.push('short');
  if (cycles.some((c) => c > 35)) out.push('long');
  if (periods.some((n) => n > 7)) out.push('longPeriod');
  if (p.daysLate >= 7) out.push('late');
  return out;
}

export interface Pregnancy {
  weeks: number;
  days: number;
  due: DayKey;
  trimester: 1 | 2 | 3;
  daysToGo: number;
}

/** Counted from the first day of her last period, as doctors do: 40 weeks to the due date. */
export function pregnancyFrom(start: DayKey, day: DayKey): Pregnancy {
  const gone = Math.max(0, diff(start, day));
  const weeks = Math.floor(gone / 7);
  return { weeks, days: gone % 7, due: addDays(start, 280), trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3, daysToGo: Math.max(0, 280 - gone) };
}

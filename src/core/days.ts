import type { DayKey } from './types';

/** Calendar day arithmetic on "YYYY-MM-DD" keys, done at noon so daylight saving never skips a day. */
const parse = (d: DayKey): Date => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day, 12);
};

export const keyOf = (t: Date | number): DayKey => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const today = (now = Date.now()): DayKey => keyOf(now);

export const addDays = (d: DayKey, n: number): DayKey => {
  const x = parse(d);
  x.setDate(x.getDate() + n);
  return keyOf(x);
};

/** Whole days from a to b: diff('2026-11-01', '2026-11-03') is 2. */
export const diff = (a: DayKey, b: DayKey): number => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);

export const dateOf = parse;

/** Every day from a to b, both included. */
export function range(a: DayKey, b: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let d = a; diff(d, b) >= 0; d = addDays(d, 1)) out.push(d);
  return out;
}

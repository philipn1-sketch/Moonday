import type { DayLog, Settings } from './types';

/**
 * What a backup holds: her logged days and the few settings a partner's phone needs to show her cycle.
 * It is encrypted on the phone before it is sent (see services/vault.ts).
 */
export interface Vault {
  version: 1;
  days: DayLog[];
  shared: SharedSettings;
  sharedAt: number;
}

export type SharedSettings = Pick<Settings, 'name' | 'goal' | 'usualCycle' | 'usualPeriod' | 'pregnancyStart'>;

export const sharedOf = (s: Settings): SharedSettings => ({
  name: s.name, goal: s.goal, usualCycle: s.usualCycle, usualPeriod: s.usualPeriod, pregnancyStart: s.pregnancyStart,
});

/** Day by day, the newer edit wins; a day only one phone has is kept. */
export function mergeDays(a: DayLog[], b: DayLog[]): DayLog[] {
  const out = new Map<string, DayLog>();
  for (const d of [...a, ...b]) {
    const have = out.get(d.date);
    if (!have || (d.updatedAt ?? 0) > (have.updatedAt ?? 0)) out.set(d.date, d);
  }
  return [...out.values()].sort((x, y) => (x.date < y.date ? -1 : 1));
}

/** A cleared day is kept as an empty entry with a time, so the clearing reaches the other phone too. */
export const isEmptyDay = (d: DayLog): boolean =>
  Object.entries(d).every(([k, v]) => k === 'date' || k === 'updatedAt' || v === undefined || (Array.isArray(v) && v.length === 0));

/** Twelve letters and digits without look alikes (no 0, O, 1, I, L), shown in groups of four. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 12;

export function makeCode(random: Uint8Array): string {
  return Array.from(random.slice(0, CODE_LENGTH), (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const cleanCode = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isCode = (s: string): boolean => cleanCode(s).length === CODE_LENGTH && [...cleanCode(s)].every((c) => ALPHABET.includes(c));
export const showCode = (c: string): string => cleanCode(c).match(/.{1,4}/g)?.join(' ') ?? c;

import { addDays } from './days';
import type { DayKey, DayLog, Flow } from './types';

export interface HealthDay {
  date: DayKey;
  flow: Exclude<Flow, 'spotting'>;
  source: string;
}

/** Moonday's own bundle id: what it wrote to Health is never read back in as new days. */
export const OWN_SOURCE = 'com.philipnader.moonday';

/**
 * Days from Apple Health that Moonday doesn't have yet. A day she already logged here, period or not,
 * is never changed by what another app wrote.
 */
export function importFromHealth(local: DayLog[], health: HealthDay[], now: number): DayLog[] {
  const have = new Set(local.map((d) => d.date));
  const out = new Map<DayKey, DayLog>();
  for (const h of health) {
    if (h.source === OWN_SOURCE || have.has(h.date)) continue;
    out.set(h.date, { date: h.date, flow: h.flow, updatedAt: now });
  }
  return [...out.values()];
}

/** Whether a day is the first of a period, which Health records with the sample. */
export const isFirstDay = (days: DayLog[], date: DayKey): boolean => {
  const before = days.find((d) => d.date === addDays(date, -1));
  return !before?.flow;
};

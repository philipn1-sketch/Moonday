import * as native from '../../modules/moonday-native';
import { addDays } from '../core/days';
import { importFromHealth, isFirstDay, type HealthDay } from '../core/health';
import type { DayKey, DayLog } from '../core/types';

export const healthAvailable = native.healthAvailable;
export const connectHealth = native.requestHealth;

/** New days from Health in the last year, ready to save. */
export async function readNewDays(local: DayLog[], today: DayKey): Promise<DayLog[]> {
  const got = (await native.readFlows(addDays(today, -365))) as HealthDay[];
  return importFromHealth(local, got, Date.now());
}

/** Writes one day's flow to Health, or removes Moonday's entry for it. */
export async function writeDay(all: DayLog[], d: DayLog): Promise<void> {
  await native.saveFlow(d.date, d.flow ?? null, !!d.flow && isFirstDay(all, d.date));
}

/** Writes every period day she has, for when Health is first turned on. */
export async function writeAll(all: DayLog[]): Promise<void> {
  for (const d of all.filter((x) => x.flow)) await writeDay(all, d);
}

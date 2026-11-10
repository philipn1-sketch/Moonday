// The web preview has no Apple Health.
import type { DayKey, DayLog } from '../core/types';
export const healthAvailable = (): boolean => false;
export const connectHealth = async (): Promise<boolean> => false;
export const readNewDays = async (_local: DayLog[], _today: DayKey): Promise<DayLog[]> => [];
export const writeDay = async (_all: DayLog[], _d: DayLog): Promise<void> => {};
export const writeAll = async (_all: DayLog[]): Promise<void> => {};

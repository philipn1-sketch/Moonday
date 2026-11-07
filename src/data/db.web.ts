// Stand in for the web preview used to design and screenshot the screens. Phone builds use db.ts.
import type { DayLog, Settings } from '../core/types';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {}
};

export const loadDays = (): DayLog[] => read<DayLog[]>('moonday.days', []);
export const putDay = (d: DayLog): void => write('moonday.days', [...loadDays().filter((x) => x.date !== d.date), d]);
export const loadSettings = (): Partial<Settings> => read('moonday.settings', {});
export const putSettings = (s: Settings): void => write('moonday.settings', s);

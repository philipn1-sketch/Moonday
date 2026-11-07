/** A calendar day on her phone, as "2026-11-07". Days, not timestamps, so time zones never move a period. */
export type DayKey = string;

export type Flow = 'spotting' | 'light' | 'medium' | 'heavy';

/** Everything she can note about one day. Only `date` is required. */
export interface DayLog {
  date: DayKey;
  flow?: Flow;
  symptoms?: string[];
  moods?: string[];
  energy?: 'low' | 'ok' | 'high';
  sleep?: 'poor' | 'ok' | 'good';
  discharge?: 'none' | 'sticky' | 'creamy' | 'watery' | 'eggWhite' | 'unusual';
  sex?: 'protected' | 'unprotected' | 'none';
  drive?: 'low' | 'medium' | 'high';
  digestion?: string[];
  ovulationTest?: 'positive' | 'negative';
  pregnancyTest?: 'positive' | 'negative' | 'faint';
  /** Basal body temperature in degrees Celsius. */
  temperature?: number;
  /** Grams. */
  weight?: number;
  /** Glasses of water. */
  water?: number;
  pillTaken?: boolean;
  note?: string;
  updatedAt?: number;
}

export type Goal = 'track' | 'conceive' | 'pregnant';
export type ThemeName = 'night' | 'day';
export type ThemeChoice = ThemeName | 'system';

export interface Settings {
  name: string;
  goal: Goal;
  /** What she told us when she started, used until her own cycles say otherwise. */
  usualCycle: number;
  usualPeriod: number;
  /** Pregnancy mode: the first day of her last period before the pregnancy. */
  pregnancyStart?: DayKey;
  theme: ThemeChoice;
  units: 'metric' | 'imperial';
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  goal: 'track',
  usualCycle: 28,
  usualPeriod: 5,
  theme: 'system',
  units: 'metric',
  onboarded: false,
};

import { t, tk, tn } from '../i18n';
import type { Settings } from './types';

/**
 * Moonday Plus. Everything she needs to track her period stays free: logging, predictions, the calendar,
 * the daily log and reminders. Plus adds the extras below, after a free week on every new phone.
 */
export type PlusFeature = 'insights' | 'modes' | 'sharing' | 'widgets';

export const PLUS_FEATURES: { id: PlusFeature; title: string; line: string }[] = [
  { id: 'insights', title: tk('Insights and doctor report'), line: tk('Cycle charts, symptoms by phase, and a one page PDF to share with your doctor.') },
  { id: 'modes', title: tk('Conceiving and pregnancy'), line: tk('Your chance of conceiving each day, and your pregnancy week by week.') },
  { id: 'sharing', title: tk('Partner sharing and backup'), line: tk('Let your partner see your phase and next period, and keep a private, encrypted backup.') },
  { id: 'widgets', title: tk('Widgets and Apple Watch'), line: tk('Your cycle day and next period on your home screen, lock screen and wrist.') },
];

export const TRIAL_DAYS = 7;
const DAY = 86_400_000;

/** Shown until the App Store's own prices are loaded. Australian dollars. */
export const PRICES = { monthly: tk('A$2.99 a month'), lifetime: tk('A$14.99 once') } as const;

export const trialEndsAt = (s: Settings): number | null => (s.plus?.trialStartedAt ? s.plus.trialStartedAt + TRIAL_DAYS * DAY : null);

export function hasPlus(s: Settings, now: number): boolean {
  if (s.plus?.owned) return true;
  const end = trialEndsAt(s);
  return end !== null && now < end;
}

export function trialDaysLeft(s: Settings, now: number): number {
  const end = trialEndsAt(s);
  if (s.plus?.owned || end === null || now >= end) return 0;
  return Math.ceil((end - now) / DAY);
}

export function plusStatus(s: Settings, now: number): string {
  if (s.plus?.owned === 'lifetime') return t('You have Moonday Plus for life.');
  if (s.plus?.owned === 'monthly') return t('You have Moonday Plus.');
  const left = trialDaysLeft(s, now);
  if (left > 0) return tn('Free week of Moonday Plus: {n} day left.', 'Free week of Moonday Plus: {n} days left.', left);
  return t('Your free week has ended. Period tracking, predictions and reminders stay free.');
}

import { t, tn } from '../i18n';

/** 1h 40m, 40m, 2h, or "just now". */
export function span(ms: number): string {
  const m = Math.floor(Math.abs(ms) / 60_000);
  if (m < 1) return t('just now');
  const h = Math.floor(m / 60);
  if (h >= 48) return tn('{n} day', '{n} days', Math.floor(h / 24));
  const r = m % 60;
  if (h === 0) return t('{m}m', { m: r });
  return r === 0 ? t('{h}h', { h }) : t('{h}h {m}m', { h, m: r });
}

import { flagsFor, periodsFrom, type Flag, type Prediction } from './cycle';
import { dateOf, diff } from './days';
import { SYMPTOMS } from './options';
import type { DayLog } from './types';
import { currentLanguage, t, tk, tn } from '../i18n';

export const FLAG_TEXT: Record<Flag, string> = {
  irregular: tk('Your cycle length changes by more than a week from cycle to cycle.'),
  short: tk('Some cycles were shorter than 21 days.'),
  long: tk('Some cycles were longer than 35 days.'),
  longPeriod: tk('Some periods lasted longer than 7 days.'),
  late: tk('Your period is a week or more late.'),
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const date = (d: string) => dateOf(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * A one page summary for a doctor or nurse: her averages, the last twelve cycles, her most logged symptoms
 * and any patterns flagged. Only what she logged; no advice or diagnosis.
 */
export function reportHtml(o: { name: string; days: DayLog[]; prediction: Prediction }): string {
  const { stats } = o.prediction;
  const periods = periodsFrom(o.days).slice(-13);
  const rows = periods.map((p, i) => {
    const next = periods[i + 1];
    return `<tr><td>${date(p.start)}</td><td>${tn('{n} day', '{n} days', p.length)}</td><td>${next ? tn('{n} day', '{n} days', diff(p.start, next.start)) : t('Current')}</td></tr>`;
  }).reverse().join('');
  const counts = new Map<string, number>();
  for (const d of o.days) for (const s of d.symptoms ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([id, n]) => `<li>${esc(t(SYMPTOMS.find((s) => s.id === id)?.label ?? id))}: ${tn('{n} day', '{n} days', n)}</li>`).join('');
  const flags = flagsFor(o.prediction).map((f) => `<li>${esc(t(FLAG_TEXT[f]))}</li>`).join('');
  const first = periods[0]?.start;
  return `<!doctype html><html lang="${currentLanguage()}"><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#221F3D;margin:32px;font-size:12pt}
h1{font-size:20pt;margin:0}h2{font-size:13pt;margin:20px 0 6px}p{margin:4px 0;color:#66618A}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E3DEF2;font-size:11pt}
th{color:#66618A;font-weight:600}.facts td{border:none;padding:2px 16px 2px 0}ul{margin:4px 0;padding-left:20px}
</style></head><body>
<h1>${esc(o.name || t('Cycle summary'))}</h1>
<p>${esc(first ? t('{from} to {to} · from Moonday', { from: date(first), to: date(o.days.length ? o.days.map((d) => d.date).sort().at(-1)! : first) }) : t('From Moonday'))}</p>
<h2>${esc(t('Averages'))}</h2>
<table class="facts"><tr><td>${esc(t('Cycle length'))}</td><td><b>${tn('{n} day', '{n} days', stats.avgCycle)}</b></td></tr>
<tr><td>${esc(t('Period length'))}</td><td><b>${tn('{n} day', '{n} days', stats.avgPeriod)}</b></td></tr>
<tr><td>${esc(t('Cycles vary by'))}</td><td><b>${stats.cycles.length >= 2 ? `± ${stats.spread}` : esc(t('Not enough cycles yet'))}</b></td></tr></table>
<h2>${esc(t('Recent cycles'))}</h2>
<table><thead><tr><th>${esc(t('Period started'))}</th><th>${esc(t('Period length'))}</th><th>${esc(t('Cycle length'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="3">${esc(t('No periods logged yet'))}</td></tr>`}</tbody></table>
${top ? `<h2>${esc(t('Most logged symptoms'))}</h2><ul>${top}</ul>` : ''}
${flags ? `<h2>${esc(t('Patterns noted'))}</h2><ul>${flags}</ul>` : ''}
<p style="margin-top:20px">${esc(t('Logged by the patient in Moonday. Predictions are estimates and not a diagnosis.'))}</p>
</body></html>`;
}

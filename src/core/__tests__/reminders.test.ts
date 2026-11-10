import { addDays, dateOf } from '../days';
import { predict } from '../cycle';
import { DISCREET, FERTILE_SOON, PERIOD_SOON, planReminders } from '../reminders';
import type { DayLog, Reminders } from '../types';

const USUAL = { usualCycle: 28, usualPeriod: 5 };
const bleed = (starts: string[]): DayLog[] => starts.flatMap((s) => Array.from({ length: 5 }, (_, i) => ({ date: addDays(s, i), flow: 'medium' as const })));
const logs = bleed(['2026-09-29', '2026-10-27']);
const R: Reminders = { period: true, fertile: true, pill: null, log: null, at: 9 * 60, discreet: false };
const at = (day: string, h: number) => { const d = dateOf(day); d.setHours(h, 0, 0, 0); return d.getTime(); };

describe('reminders', () => {
  it('reminds two days before the period and on the first fertile day', () => {
    const now = at('2026-11-02', 12);
    expect(planReminders(predict(logs, USUAL, '2026-11-02'), R, now, false)).toEqual([
      { id: 'period', at: at('2026-11-22', 9), body: PERIOD_SOON },
      { id: 'fertile', at: at('2026-11-05', 9), body: FERTILE_SOON },
    ]);
  });

  it('moves the fertile reminder to the next cycle once this window has started', () => {
    const now = at('2026-11-07', 12);
    const plan = planReminders(predict(logs, USUAL, '2026-11-07'), R, now, false);
    expect(plan.find((x) => x.id === 'fertile')?.at).toBe(at('2026-12-03', 9));
  });

  it('keeps the lock screen discreet when asked', () => {
    const plan = planReminders(predict(logs, USUAL, '2026-11-02'), { ...R, discreet: true }, at('2026-11-02', 12), false);
    expect(plan.every((x) => x.body === DISCREET)).toBe(true);
  });

  it('sends nothing while pregnant, late, or turned off', () => {
    expect(planReminders(predict(logs, USUAL, '2026-11-02'), R, at('2026-11-02', 12), true)).toEqual([]);
    expect(planReminders(predict(logs, USUAL, '2026-11-02'), { ...R, period: false, fertile: false }, at('2026-11-02', 12), false)).toEqual([]);
    expect(planReminders(predict(logs, USUAL, '2026-11-30'), { ...R, fertile: false }, at('2026-11-30', 12), false)).toEqual([]);
  });
});

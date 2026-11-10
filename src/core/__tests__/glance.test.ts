import { addDays } from '../days';
import { glanceDays, glanceFor } from '../glance';
import { DEFAULT_SETTINGS, type DayLog } from '../types';

const s = { ...DEFAULT_SETTINGS, name: 'Emma', onboarded: true };
const bleed = (starts: string[]): DayLog[] => starts.flatMap((st) => Array.from({ length: 5 }, (_, i) => ({ date: addDays(st, i), flow: 'medium' as const })));
const logs = bleed(['2026-09-29', '2026-10-27']);

describe('what the widget shows', () => {
  it('counts down to the next period, with the phase', () => {
    expect(glanceFor(logs, s, '2026-11-07')).toMatchObject({ headline: 'Period in 17 days', detail: 'Cycle day 12', phase: 'Fertile window', tone: 'fertile', short: '17d' });
  });
  it('counts period days during a period', () => {
    expect(glanceFor(logs, s, '2026-10-28')).toMatchObject({ headline: 'Period day 2', tone: 'period', short: 'D2' });
  });
  it('says when a period is late', () => {
    expect(glanceFor(logs, s, '2026-11-27')).toMatchObject({ headline: '3 days late', short: '+3' });
  });
  it('shows the pregnancy week in pregnancy mode', () => {
    expect(glanceFor([], { ...s, goal: 'pregnant', pregnancyStart: '2026-06-01' }, '2026-11-07')).toMatchObject({ headline: 'Week 22', short: 'W22' });
  });
  it('lays out the coming week so the widget moves on by itself', () => {
    expect(glanceDays(logs, s, '2026-11-07', 3).map((g) => g.short)).toEqual(['17d', '16d', '15d']);
  });
  it('asks for a first period when nothing is logged', () => {
    expect(glanceFor([], s, '2026-11-07').headline).toBe('Log your period to start');
  });
});

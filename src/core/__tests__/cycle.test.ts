import { addDays } from '../days';
import { flagsFor, periodsFrom, predict, pregnancyFrom, statsFrom, upcoming } from '../cycle';
import type { DayLog, Flow } from '../types';

const USUAL = { usualCycle: 28, usualPeriod: 5 };

/** Periods of `len` days starting on each date. */
const bleed = (starts: string[], len = 5, flow: Flow = 'medium'): DayLog[] =>
  starts.flatMap((s) => Array.from({ length: len }, (_, i) => ({ date: addDays(s, i), flow })));

describe('finding periods', () => {
  it('joins bleeding days into periods', () => {
    expect(periodsFrom(bleed(['2026-09-01', '2026-09-29']))).toEqual([
      { start: '2026-09-01', end: '2026-09-05', length: 5 },
      { start: '2026-09-29', end: '2026-10-03', length: 5 },
    ]);
  });

  it('keeps a period together across a missed day', () => {
    const logs = [{ date: '2026-09-01', flow: 'heavy' }, { date: '2026-09-02', flow: 'medium' }, { date: '2026-09-04', flow: 'light' }] as DayLog[];
    expect(periodsFrom(logs)).toEqual([{ start: '2026-09-01', end: '2026-09-04', length: 4 }]);
  });

  it('never starts a period from spotting alone', () => {
    const logs = [{ date: '2026-09-10', flow: 'spotting' }, ...bleed(['2026-09-29'])] as DayLog[];
    expect(periodsFrom(logs).map((p) => p.start)).toEqual(['2026-09-29']);
  });

  it('counts spotting that runs into a period as part of it', () => {
    const logs = [{ date: '2026-09-28', flow: 'spotting' }, ...bleed(['2026-09-29'])] as DayLog[];
    expect(periodsFrom(logs)[0].start).toBe('2026-09-28');
  });
});

describe('learning her averages', () => {
  it('uses what she told us until there are cycles', () => {
    expect(statsFrom([], USUAL)).toMatchObject({ avgCycle: 28, avgPeriod: 5, confidence: 'low' });
  });

  it('learns from regular cycles and grows confident', () => {
    const p = periodsFrom(bleed(['2026-06-01', '2026-06-30', '2026-07-29', '2026-08-27'], 4));
    expect(statsFrom(p, USUAL)).toMatchObject({ cycles: [29, 29, 29], avgCycle: 29, avgPeriod: 4, confidence: 'high' });
  });

  it('ignores a cycle that is really a missed log', () => {
    const p = periodsFrom(bleed(['2026-03-01', '2026-03-29', '2026-06-20', '2026-07-18']));
    expect(statsFrom(p, USUAL).cycles).toEqual([28, 28]);
  });
});

describe('today and what comes next', () => {
  const logs = bleed(['2026-08-04', '2026-09-01', '2026-09-29', '2026-10-27']);

  it('knows the cycle day, the next period and the fertile window', () => {
    const p = predict(logs, USUAL, '2026-11-07');
    expect(p).toMatchObject({
      cycleDay: 12,
      phase: 'fertile',
      nextPeriod: { start: '2026-11-24', end: '2026-11-28' },
      daysUntilPeriod: 17,
      ovulation: '2026-11-10',
      fertile: { start: '2026-11-05', end: '2026-11-11' },
      daysLate: 0,
    });
  });

  it('marks ovulation day, the luteal phase and her period', () => {
    expect(predict(logs, USUAL, '2026-11-10').phase).toBe('ovulation');
    expect(predict(logs, USUAL, '2026-11-15').phase).toBe('luteal');
    expect(predict(logs, USUAL, '2026-10-28').phase).toBe('period');
    expect(predict(logs, USUAL, '2026-11-02').phase).toBe('follicular');
  });

  it('says when a period is late', () => {
    const p = predict(logs, USUAL, '2026-11-27');
    expect(p).toMatchObject({ phase: 'late', daysLate: 3, daysUntilPeriod: 0 });
    expect(flagsFor(p)).not.toContain('late');
    expect(flagsFor(predict(logs, USUAL, '2026-12-02'))).toContain('late');
  });

  it('predicts nothing before the first period', () => {
    expect(predict([], USUAL, '2026-11-07')).toMatchObject({ phase: null, nextPeriod: null });
  });

  it('lays out the next cycles for the calendar', () => {
    const next = upcoming(predict(logs, USUAL, '2026-11-07'), 2);
    expect(next.map((c) => c.period.start)).toEqual(['2026-11-24', '2026-12-22']);
    expect(next[1].ovulation).toBe('2027-01-05');
  });
});

describe('flags for a doctor', () => {
  it('notices cycles that vary a lot', () => {
    const p = predict(bleed(['2026-05-01', '2026-05-23', '2026-07-01', '2026-07-25']), USUAL, '2026-07-29');
    expect(flagsFor(p)).toEqual(expect.arrayContaining(['irregular', 'long']));
  });

  it('notices long periods', () => {
    expect(flagsFor(predict(bleed(['2026-10-01'], 9), USUAL, '2026-10-12'))).toContain('longPeriod');
  });

  it('stays quiet for typical cycles', () => {
    expect(flagsFor(predict(bleed(['2026-08-04', '2026-09-01', '2026-09-29']), USUAL, '2026-10-05'))).toEqual([]);
  });
});

describe('pregnancy', () => {
  it('counts weeks from the last period, with the due date at 40 weeks', () => {
    expect(pregnancyFrom('2026-08-01', '2026-11-07')).toEqual({ weeks: 14, days: 0, due: '2027-05-08', trimester: 2, daysToGo: 182 });
  });
});

describe('trying to conceive', () => {
  const logs = bleed(['2026-08-04', '2026-09-01', '2026-09-29', '2026-10-27']);
  const { chanceOn } = require('../cycle') as typeof import('../cycle');
  it('is highest on ovulation day and the two days before', () => {
    const p = predict(logs, USUAL, '2026-11-07');
    expect(['2026-11-08', '2026-11-09', '2026-11-10'].map((d) => chanceOn(p, d))).toEqual(['high', 'high', 'high']);
    expect(chanceOn(p, '2026-11-06')).toBe('medium');
    expect(chanceOn(p, '2026-11-11')).toBe('medium');
    expect(chanceOn(p, '2026-11-20')).toBe('low');
  });
  it('is low during a period', () => {
    expect(chanceOn(predict(logs, USUAL, '2026-10-28'), '2026-10-28')).toBe('low');
  });
});

describe('pregnancy milestones', () => {
  const { nextMilestone } = require('../cycle') as typeof import('../cycle');
  it('names the next one', () => {
    expect(nextMilestone(14)?.week).toBe(20);
    expect(nextMilestone(41)).toBeNull();
  });
});

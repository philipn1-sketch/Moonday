import { cleanCode, isCode, isEmptyDay, makeCode, mergeDays, showCode } from '../sync';

describe('merging two phones', () => {
  it('keeps the newer edit of each day and every day either phone has', () => {
    const a = [{ date: '2026-11-01', flow: 'heavy' as const, updatedAt: 10 }, { date: '2026-11-02', flow: 'medium' as const, updatedAt: 10 }];
    const b = [{ date: '2026-11-02', flow: 'light' as const, updatedAt: 20 }, { date: '2026-11-03', moods: ['calm'], updatedAt: 5 }];
    expect(mergeDays(a, b)).toEqual([a[0], b[0], b[1]]);
  });
  it('lets a cleared day win when it is newer', () => {
    const merged = mergeDays([{ date: '2026-11-01', flow: 'heavy', updatedAt: 1 }], [{ date: '2026-11-01', updatedAt: 2 }]);
    expect(isEmptyDay(merged[0])).toBe(true);
  });
});

describe('family codes', () => {
  it('are twelve easy to read characters', () => {
    const c = makeCode(new Uint8Array(Array.from({ length: 16 }, (_, i) => i * 17)));
    expect(c).toHaveLength(12);
    expect(isCode(c)).toBe(true);
    expect(c).not.toMatch(/[01OIL]/);
  });
  it('are forgiving about spaces and case when typed', () => {
    expect(cleanCode('abcd efgh jkmn')).toBe('ABCDEFGHJKMN');
    expect(isCode('abcd efgh jkmn')).toBe(true);
    expect(isCode('ABCD EFGH JKM0')).toBe(false);
    expect(showCode('ABCDEFGHJKMN')).toBe('ABCD EFGH JKMN');
  });
});

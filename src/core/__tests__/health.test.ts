import { importFromHealth, isFirstDay, OWN_SOURCE } from '../health';

describe('Apple Health', () => {
  it('brings in period days logged by other apps', () => {
    const got = importFromHealth([], [{ date: '2026-10-27', flow: 'heavy', source: 'com.apple.Health' }], 5);
    expect(got).toEqual([{ date: '2026-10-27', flow: 'heavy', updatedAt: 5 }]);
  });
  it('never reads back what Moonday wrote, or changes a day she logged here', () => {
    const got = importFromHealth([{ date: '2026-10-28', moods: ['calm'] }], [
      { date: '2026-10-27', flow: 'medium', source: OWN_SOURCE },
      { date: '2026-10-28', flow: 'light', source: 'com.apple.Health' },
    ], 5);
    expect(got).toEqual([]);
  });
  it('knows the first day of a period', () => {
    const days = [{ date: '2026-10-27', flow: 'heavy' as const }, { date: '2026-10-28', flow: 'medium' as const }];
    expect(isFirstDay(days, '2026-10-27')).toBe(true);
    expect(isFirstDay(days, '2026-10-28')).toBe(false);
  });
});

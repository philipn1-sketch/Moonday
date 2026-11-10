import { hasPlus, trialDaysLeft } from '../plus';
import { DEFAULT_SETTINGS } from '../types';

const DAY = 86_400_000;
const start = Date.UTC(2026, 10, 1);
const s = { ...DEFAULT_SETTINGS, plus: { trialStartedAt: start } };

describe('Moonday Plus', () => {
  it('is on for a free week, then off', () => {
    expect(hasPlus(s, start + 3 * DAY)).toBe(true);
    expect(trialDaysLeft(s, start + 3 * DAY)).toBe(4);
    expect(hasPlus(s, start + 7 * DAY)).toBe(false);
  });
  it('stays on once bought', () => {
    expect(hasPlus({ ...s, plus: { ...s.plus, owned: 'lifetime' } }, start + 400 * DAY)).toBe(true);
  });
  it('is off before the free week has started', () => {
    expect(hasPlus(DEFAULT_SETTINGS, start)).toBe(false);
  });
});

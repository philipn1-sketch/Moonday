// Screenshots of the welcome flow, the conceiving and pregnancy views, and Settings.
const { chromium } = require('playwright');
const out = process.argv[2];
const PORT = process.env.PORT || 8812;
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const add = (k, n) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n, 12)); };
(async () => {
  const today = key(new Date());
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  const seed = async (days, settings) => { await pg.goto(`http://localhost:${PORT}/`); await pg.evaluate(([d, s]) => { localStorage.clear(); if (d) localStorage.setItem('moonday.days', JSON.stringify(d)); if (s) localStorage.setItem('moonday.settings', JSON.stringify(s)); }, [days, settings]); };
  const go = async (path) => { await pg.goto(`http://localhost:${PORT}${path}`); await pg.waitForTimeout(1500); };
  const tap = async (id) => { await pg.click(`[data-testid="${id}"]`); await pg.waitForTimeout(500); };
  const snap = (n) => pg.screenshot({ path: `${out}/r1-${n}.png` });
  // first launch
  await seed(null, null); await go('/');
  await pg.fill('[data-testid="welcome-name"]', 'Emma'); await snap('1-welcome-name'); await tap('welcome-next');
  await snap('2-welcome-goal'); await tap('welcome-next');
  await tap(`pick-${add(today, -9)}`); await snap('3-welcome-period'); await tap('welcome-next');
  await snap('4-welcome-lengths'); await tap('welcome-finish'); await pg.waitForTimeout(800); await snap('5-today-after-welcome');
  // trying to conceive, on a fertile day
  const days = [];
  for (const s of [add(today, -68), add(today, -40), add(today, -12)]) for (let i = 0; i < 5; i++) days.push({ date: add(s, i), flow: i < 2 ? 'heavy' : 'medium' });
  await seed(days, { name: 'Emma', goal: 'conceive', usualCycle: 28, usualPeriod: 5, theme: 'night', units: 'metric', onboarded: true });
  await go('/'); await pg.mouse.move(200, 450); await pg.mouse.wheel(0, 500); await pg.waitForTimeout(400); await snap('6-today-conceiving');
  // pregnant
  await seed([], { name: 'Emma', goal: 'pregnant', pregnancyStart: add(today, -150), usualCycle: 28, usualPeriod: 5, theme: 'night', units: 'metric', onboarded: true });
  await go('/'); await snap('7-today-pregnant');
  await go('/settings'); await snap('8-settings');
  console.log('errors', errs);
  await b.close();
})();

// Screenshots of Settings with reminders and privacy, Insights with the report button, and the report itself.
const { chromium } = require('playwright');
const out = process.argv[2];
const PORT = process.env.PORT || 8812;
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const add = (k, n) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n, 12)); };
(async () => {
  const today = key(new Date());
  const days = [];
  let s = add(today, -12);
  const starts = [s];
  for (const l of [29, 28, 30, 27, 29, 28]) { s = add(s, -l); starts.unshift(s); }
  for (const st of starts) for (let i = 0; i < 5; i++) days.push({ date: add(st, i), flow: i < 2 ? 'heavy' : 'medium', ...(i < 2 ? { symptoms: ['cramps', 'fatigue'] } : {}) });
  const settings = { name: 'Emma', goal: 'track', usualCycle: 28, usualPeriod: 5, theme: 'night', units: 'metric', onboarded: true,
    reminders: { period: true, fertile: true, pill: 21 * 60, log: null, at: 9 * 60, discreet: true }, lock: false };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.evaluate(([d, st]) => { localStorage.clear(); localStorage.setItem('moonday.days', JSON.stringify(d)); localStorage.setItem('moonday.settings', JSON.stringify(st)); }, [days, settings]);
  await pg.goto(`http://localhost:${PORT}/settings`); await pg.waitForTimeout(1500);
  await pg.mouse.move(200, 450); await pg.mouse.wheel(0, 600); await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${out}/r2-1-settings-reminders.png` });
  await pg.goto(`http://localhost:${PORT}/insights`); await pg.waitForTimeout(1500);
  await pg.mouse.move(200, 450); await pg.mouse.wheel(0, 900); await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${out}/r2-2-insights-report.png` });
  const [popup] = await Promise.all([ctx.waitForEvent('page'), pg.click('[data-testid="share-report"]')]);
  await popup.waitForTimeout(800);
  await popup.setViewportSize({ width: 794, height: 1123 });
  await popup.screenshot({ path: `${out}/r2-3-report.png` });
  console.log('errors', errs);
  await b.close();
})();

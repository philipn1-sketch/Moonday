// Screenshots of the paywall, Partner and backup, and the Plus card once the free week has ended.
const { chromium } = require('playwright');
const out = process.argv[2];
const PORT = process.env.PORT || 8812;
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const add = (k, n) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n, 12)); };
(async () => {
  const today = key(new Date());
  const days = [];
  for (const st of [add(today, -40), add(today, -12)]) for (let i = 0; i < 5; i++) days.push({ date: add(st, i), flow: 'medium' });
  const base = { name: 'Emma', goal: 'track', usualCycle: 28, usualPeriod: 5, theme: 'night', units: 'metric', onboarded: true,
    reminders: { period: true, fertile: false, pill: null, log: null, at: 540, discreet: false }, lock: false };
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  const seed = async (s) => { await pg.goto(`http://localhost:${PORT}/`); await pg.evaluate(([d, st]) => { localStorage.clear(); localStorage.setItem('moonday.days', JSON.stringify(d)); localStorage.setItem('moonday.settings', JSON.stringify(st)); }, [days, s]); };
  const go = async (path) => { await pg.goto(`http://localhost:${PORT}${path}`); await pg.waitForTimeout(1500); };
  await seed({ ...base, plus: { trialStartedAt: Date.now() - 2 * 86400000 } });
  await go('/plus'); await pg.screenshot({ path: `${out}/r3-1-plus.png` });
  await go('/sharing'); await pg.screenshot({ path: `${out}/r3-2-sharing.png` });
  await seed({ ...base, plus: { trialStartedAt: Date.now() - 20 * 86400000 } });
  await go('/insights'); await pg.screenshot({ path: `${out}/r3-3-insights-locked.png` });
  await seed({ ...base, plus: { trialStartedAt: Date.now() }, sync: { code: 'ABCDEFGHJKMN', role: 'partner', lastOk: Date.now() } });
  await go('/'); await pg.screenshot({ path: `${out}/r3-4-partner-today.png` });
  console.log('errors', errs);
  await b.close();
})();

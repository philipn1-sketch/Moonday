// Screenshots of the main screens with sample cycles, for design reviews.
// Run: npx expo export --platform web, node scripts/serve-web.js 8812, then node scripts/design-screens.js <out> [night|day]
const { chromium } = require('playwright');
const out = process.argv[2];
const theme = process.argv[3] || 'night';
const PORT = process.env.PORT || 8812;

const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const add = (k, n) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n, 12)); };

(async () => {
  const today = key(new Date());
  // six cycles of 27 to 30 days ending with a period that started 11 days ago
  const lengths = [29, 28, 30, 27, 29, 28];
  let start = add(today, -11);
  const starts = [start];
  for (const l of lengths) { start = add(start, -l); starts.unshift(start); }
  const days = [];
  const sym = [['cramps', 'tired'], ['cramps', 'backache'], ['headache'], [], []];
  for (const s of starts) {
    ['heavy', 'heavy', 'medium', 'light', 'spotting'].forEach((flow, i) => days.push({ date: add(s, i), flow, ...(sym[i].length ? { symptoms: sym[i].map((x) => x === 'tired' ? 'fatigue' : x) } : {}), ...(i === 0 ? { moods: ['sensitive'] } : {}) }));
    days.push({ date: add(s, 13), discharge: 'eggWhite', ovulationTest: 'positive', moods: ['energetic', 'happy'] });
    days.push({ date: add(s, 22), symptoms: ['bloating', 'cravings'], moods: ['irritable'] });
    days.push({ date: add(s, 25), symptoms: ['bloating', 'tender', 'acne'], moods: ['low'] });
  }
  days.push({ date: add(today, -1), sleep: 'good', energy: 'high', water: 6, temperature: 36.4 });
  const settings = { name: 'Emma', goal: 'track', usualCycle: 28, usualPeriod: 5, theme, units: 'metric', onboarded: true };

  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.evaluate(([d, s]) => { localStorage.clear(); localStorage.setItem('moonday.days', JSON.stringify(d)); localStorage.setItem('moonday.settings', JSON.stringify(s)); }, [days, settings]);
  const go = async (path) => { await pg.goto(`http://localhost:${PORT}${path}`); await pg.waitForTimeout(1500); };
  const snap = async (name) => pg.screenshot({ path: `${out}/${theme}-${name}.png` });
  await go('/'); await snap('1-today');
  await go('/calendar'); await snap('2-calendar');
  await go(`/log/${add(today, -1)}`); await snap('3-log');
  await pg.mouse.move(200, 450); await pg.mouse.wheel(0, 900); await pg.waitForTimeout(400); await snap('3b-log-more');
  await go('/insights'); await snap('4-insights');
  await pg.mouse.move(200, 450); await pg.mouse.wheel(0, 700); await pg.waitForTimeout(400); await snap('4b-insights-more');
  console.log(theme, 'errors', errs);
  await b.close();
})();

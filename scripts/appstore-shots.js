// App Store screenshots for the 6.9 inch iPhone (1320 x 2868), in every language, with a caption.
// Run: npx expo export --platform web, node scripts/serve-web.js 8812, then node scripts/appstore-shots.js
// Optionally pass languages to make: node scripts/appstore-shots.js fr de
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs', 'appstore', 'screenshots');
const PORT = process.env.PORT || 8812;

const LANGS = {
  en: { locale: 'en-AU', captions: ['Know where you are in your cycle', 'Your periods and fertile days, month by month', 'Log how you feel in a few taps', 'Patterns from your own cycles', 'Your best days to conceive', 'Your pregnancy, week by week'] },
  fr: { locale: 'fr-FR', captions: ['Sache où tu en es de ton cycle', 'Tes règles et jours fertiles, mois par mois', 'Note ton ressenti en quelques gestes', 'Les tendances de tes propres cycles', 'Tes meilleurs jours pour concevoir', 'Ta grossesse, semaine après semaine'] },
  de: { locale: 'de-DE', captions: ['Wisse, wo du in deinem Zyklus stehst', 'Periode und fruchtbare Tage, Monat für Monat', 'Trag mit wenigen Tipps ein, wie es dir geht', 'Muster aus deinen eigenen Zyklen', 'Deine besten Tage, um schwanger zu werden', 'Deine Schwangerschaft, Woche für Woche'] },
  es: { locale: 'es-ES', captions: ['Sabe en qué punto de tu ciclo estás', 'Tu regla y tus días fértiles, mes a mes', 'Anota cómo te sientes en pocos toques', 'Patrones de tus propios ciclos', 'Tus mejores días para concebir', 'Tu embarazo, semana a semana'] },
  it: { locale: 'it-IT', captions: ['Sai sempre a che punto è il tuo ciclo', 'Mestruazioni e giorni fertili, mese per mese', 'Annota come ti senti in pochi tocchi', 'Le tendenze dei tuoi cicli', 'I tuoi giorni migliori per concepire', 'La tua gravidanza, settimana per settimana'] },
  pt: { locale: 'pt-BR', captions: ['Saiba em que ponto do ciclo você está', 'Sua menstruação e dias férteis, mês a mês', 'Registre como você se sente em poucos toques', 'Padrões dos seus próprios ciclos', 'Seus melhores dias para engravidar', 'Sua gravidez, semana a semana'] },
  nl: { locale: 'nl-NL', captions: ['Weet waar je in je cyclus zit', 'Je menstruatie en vruchtbare dagen per maand', 'Noteer in een paar tikken hoe je je voelt', 'Patronen uit je eigen cycli', 'Je beste dagen om zwanger te worden', 'Je zwangerschap, week na week'] },
  ja: { locale: 'ja-JP', captions: ['いまの周期がひと目でわかる', '生理と妊娠しやすい日を月ごとに', '体調を数タップで記録', 'あなたの周期から見えるパターン', '妊娠しやすい日がわかる', '妊娠中も週ごとに見守る'] },
  ko: { locale: 'ko-KR', captions: ['지금 내 주기를 한눈에', '생리와 가임기를 달마다 한눈에', '컨디션을 몇 번의 탭으로 기록', '내 주기에서 찾은 패턴', '임신하기 좋은 날을 알려 줘요', '임신 기간도 주마다 함께'] },
  zh: { locale: 'zh-CN', captions: ['随时了解你的周期', '每月的经期和易孕期一目了然', '轻点几下记录身体感受', '来自你自己周期的规律', '你最容易受孕的日子', '孕期每一周都陪着你'] },
};

const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const add = (k, n) => { const [y, m, d] = k.split('-').map(Number); return key(new Date(y, m - 1, d + n, 12)); };

/** Six cycles of 27 to 30 days, the last period 13 days ago, with symptoms and moods so Insights has patterns. */
function sample() {
  const today = key(new Date());
  const days = [];
  const lengths = [29, 27, 30, 28, 29, 28];
  let start = add(today, -13);
  const starts = [start];
  for (const l of lengths) { start = add(start, -l); starts.push(start); }
  for (const st of starts) {
    ['heavy', 'heavy', 'medium', 'light', 'spotting'].forEach((flow, i) => days.push({ date: add(st, i), flow,
      symptoms: i < 2 ? ['cramps', 'backache'] : i === 2 ? ['fatigue'] : undefined, moods: i === 0 ? ['sensitive'] : undefined, updatedAt: 1 }));
    days.push({ date: add(st, 13), symptoms: ['bloating'], moods: ['happy'], energy: 'high', updatedAt: 1 });
    days.push({ date: add(st, -3), symptoms: ['headache', 'tender'], moods: ['irritable'], updatedAt: 1 });
  }
  days.push({ date: today, moods: ['calm'], energy: 'high', sleep: 'good', updatedAt: 1 });
  return days.map((d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)));
}

const page = (caption, img, font) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:440px;height:956px;overflow:hidden;background:#14132B}
body{display:flex;flex-direction:column;align-items:center;background:radial-gradient(120% 70% at 50% 0%,#3A3170 0%,#14132B 70%)}
h1{font-family:${font};font-weight:800;color:#F1EEFB;font-size:31px;line-height:1.18;text-align:center;margin:52px 30px 26px;height:74px;display:flex;align-items:center;justify-content:center;letter-spacing:-0.3px}
.phone{width:356px;height:774px;border-radius:52px;background:#000;padding:10px;box-shadow:0 30px 70px rgba(0,0,0,.55),0 0 0 2px #2E2B55}
.phone img{width:100%;height:100%;border-radius:43px;display:block;object-fit:cover;object-position:top}
</style></head><body><h1>${caption}</h1><div class="phone"><img src="${img}"></div></body></html>`;

(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch();
  const errs = [];
  for (const [lang, { locale, captions }] of Object.entries(LANGS)) {
    if (only.length && !only.includes(lang)) continue;
    const dir = path.join(OUT, lang);
    fs.mkdirSync(dir, { recursive: true });
    const pg = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, locale });
    pg.on('pageerror', (e) => errs.push(`${lang}: ${e.message}`));
    const raw = [];
    const shoot = async () => raw.push(`data:image/png;base64,${(await pg.screenshot()).toString('base64')}`);
    const days = sample();
    const today = key(new Date());
    const base = { name: 'Emma', goal: 'track', usualCycle: 28, usualPeriod: 5, theme: 'night', units: 'metric', onboarded: true,
      reminders: { period: true, fertile: true, pill: null, log: null, at: 540, discreet: false }, lock: false, plus: { trialStartedAt: Date.now() } };
    const seed = async (s) => {
      await pg.goto(`http://localhost:${PORT}/`);
      await pg.evaluate(([d, st]) => { localStorage.clear(); localStorage.setItem('moonday.days', JSON.stringify(d)); localStorage.setItem('moonday.settings', JSON.stringify(st)); }, [days, s]);
    };
    const go = async (p) => { await pg.goto(`http://localhost:${PORT}${p}`); await pg.waitForTimeout(1800); };

    await seed(base);
    await go('/'); await shoot();
    await go('/calendar'); await shoot();
    await go(`/log/${today}`); await shoot();
    await go('/insights'); await shoot();
    await seed({ ...base, goal: 'conceive' }); await go('/'); await shoot();
    await seed({ ...base, goal: 'pregnant', pregnancyStart: add(today, -150) }); await go('/'); await shoot();
    await pg.close();

    const font = ['ja', 'zh', 'ko'].includes(lang) ? "'Hiragino Sans','PingFang SC','Apple SD Gothic Neo','Noto Sans CJK JP','WenQuanYi Zen Hei',sans-serif" : 'Nunito,ui-rounded,sans-serif';
    const card = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
    for (let i = 0; i < raw.length; i++) {
      await card.setContent(page(captions[i], raw[i], font), { waitUntil: 'networkidle' });
      await card.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 90 });
    }
    await card.close();
    console.log(lang, raw.length, 'screenshots');
  }
  console.log('errors', errs);
  await b.close();
})();

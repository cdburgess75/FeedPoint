/* FEEDPOINT headless functional suite.
   Run: npm i playwright && npx playwright install chromium && node tests/app.test.mjs */
import { chromium } from 'playwright';

const PAGE_URL = new URL('../feedpoint.html', import.meta.url).href;
const VERSION = 'v2026.08.03.023';
const errors = [];
let failed = 0;
const check = (name, cond, extra = '') => {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  [' + extra + ']' : ''));
  if (!cond) failed++;
};

const browser = await chromium
  .launch({ executablePath: '/opt/pw-browsers/chromium' })
  .catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

await page.goto(PAGE_URL);
await page.waitForTimeout(600);

// --- shell ---
check('title', await page.title() === 'FeedPoint');
const icons = await page.evaluate(() => ({
  favicon: !!document.querySelector('link[rel="icon"][href^="data:image/svg+xml"]'),
  touch: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
  iosTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content
}));
check('favicon + apple-touch-icon wired', icons.favicon && icons.touch === 'https://cdburgess75.github.io/FeedPoint/touch-icon-180-v13.png' && icons.iosTitle === 'FeedPoint', JSON.stringify(icons));
const manifest = await page.$eval('link[rel="manifest"]', e => e.getAttribute('href'));
check('PWA manifest linked', manifest === 'manifest.webmanifest', manifest);
const desktopIcons = await page.evaluate(() => ({
  p32: document.querySelector('link[rel="icon"][sizes="32x32"]')?.getAttribute('href'),
  p16: document.querySelector('link[rel="icon"][sizes="16x16"]')?.getAttribute('href'),
  mask: document.querySelector('link[rel="mask-icon"]')?.getAttribute('href')
}));
check('desktop favicon set wired', desktopIcons.p32 === 'favicon-32.png' && desktopIcons.p16 === 'favicon-16.png' && desktopIcons.mask === 'mask-icon.svg', JSON.stringify(desktopIcons));

// --- theme changer (FlockOff pattern) ---
const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check('boots in dark theme', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');
await page.click('#btnTheme');
await page.waitForTimeout(200);
const lightState = await page.evaluate(() => ({
  attr: document.documentElement.getAttribute('data-theme'),
  bg: getComputedStyle(document.body).backgroundColor,
  metaColor: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
  btn: document.getElementById('btnTheme').textContent
}));
check('toggle switches to light', lightState.attr === 'light' && lightState.bg !== darkBg && lightState.btn === '☀', JSON.stringify(lightState));
check('meta theme-color follows scheme', lightState.metaColor.toLowerCase() === '#e9f1f4', lightState.metaColor);
await page.reload();
await page.waitForTimeout(700);
check('light theme survives reload (pre-paint stamp)', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'light');
await page.click('#btnTheme');
await page.waitForTimeout(200);
const circuitState = await page.evaluate(() => ({
  attr: document.documentElement.getAttribute('data-theme'),
  metaColor: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
  btn: document.getElementById('btnTheme').textContent,
  markBg: getComputedStyle(document.querySelector('.mark')).backgroundColor
}));
check('third click reaches Circuit (navy/lime)',
  circuitState.attr === 'circuit' && circuitState.metaColor.toLowerCase() === '#070f1e' &&
  circuitState.btn === '⚡' && circuitState.markBg === 'rgb(198, 241, 53)',
  JSON.stringify(circuitState));
await page.reload();
await page.waitForTimeout(700);
check('Circuit survives reload (pre-paint stamp)', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'circuit');
await page.click('#btnTheme');
await page.waitForTimeout(200);
check('cycle wraps back to dark', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');

// --- AA text size ---
await page.click('#btnTextSize');
await page.waitForTimeout(100);
check('AA steps to 2', await page.evaluate(() => document.documentElement.getAttribute('data-uiscale')) === '2');
await page.click('#btnTextSize');
await page.click('#btnTextSize');
await page.waitForTimeout(100);
check('AA wraps to 1', await page.evaluate(() => document.documentElement.getAttribute('data-uiscale')) === '1');

// --- K-factor presets ---
const kChip = await page.$$eval('.kpre button', els => els.map(e => [e.dataset.k, e.classList.contains('on')]));
check('K preset 0.95 active by default', JSON.stringify(kChip) === JSON.stringify([["0.95",true],["0.91",false],["0.92",false]]), JSON.stringify(kChip));
await page.click('.kpre button[data-k="0.91"]');
await page.waitForTimeout(150);
const kVal = await page.$eval('#kf', e => e.value);
const kOn = await page.$eval('.kpre button[data-k="0.91"]', e => e.classList.contains('on'));
check('K preset click sets value + active', kVal === '0.91' && kOn, kVal);
await page.click('.kpre button[data-k="0.95"]');
await page.waitForTimeout(150);

// --- ITU region band plans ---
const bandRange = async (name) => page.$$eval('#bandList .li', (els, n) => {
  const row = els.find(e => e.querySelector('.t1').textContent.startsWith(n));
  return row ? row.querySelector('.t2').textContent : null;
}, name);
check('R2 80m default', (await bandRange('80m')).includes('3.500 – 4.000'), await bandRange('80m'));
await page.click('#rg1');
await page.waitForTimeout(200);
check('R1 80m narrows', (await bandRange('80m')).includes('3.500 – 3.800'), await bandRange('80m'));
check('R1 40m narrows', (await bandRange('40m')).includes('7.000 – 7.200'), await bandRange('40m'));
await page.reload();
await page.waitForTimeout(700);
check('region persists reload', (await bandRange('80m')).includes('3.500 – 3.800'), await bandRange('80m'));
const r1on = await page.$eval('#rg1', e => e.classList.contains('on'));
check('region seg restored', r1on);
await page.click('#rg2');
await page.waitForTimeout(200);
check('back to R2', (await bandRange('80m')).includes('3.500 – 4.000'));

// --- coil winding calculator ---
const coil = await page.evaluate(() => ({
  air: airTurns(34, 2, 19.4),          // ~28.3 turns
  tor: torTurns(34, 952)               // FT140-43 ≈ 6 turns
}));
check('air-core turns math', coil.air > 27.5 && coil.air < 29, coil.air.toFixed(2));
check('toroid turns math', coil.tor > 5.5 && coil.tor < 6.5, coil.tor.toFixed(2));
const coilOut = await page.$eval('#coilOut', e => e.textContent);
check('coil output rendered', coilOut.includes('turns'), coilOut);
const labels = await page.$$eval('#rail .nav-lbl', els => els.map(e => e.textContent));
check('sidebar labels', JSON.stringify(labels) === JSON.stringify(['Calculator','Wire check','Ununs & baluns','End-fed antennas','Field notes','Build log']), JSON.stringify(labels));
const groups = await page.$$eval('#rail .rail-lbl', els => els.map(e => e.textContent));
check('sidebar groups', JSON.stringify(groups) === JSON.stringify(['Workbench','Reference','Records']), JSON.stringify(groups));
const ver = await page.$eval('.verpill', e => e.textContent);
check('version pill', ver === VERSION, ver);
const foot = await page.$eval('#railFoot .db-lbl', e => e.textContent);
check('storage indicator', foot === 'LOCAL DB' || foot === 'NO STORAGE', foot);
const footVer = await page.$eval('#railFoot .ver', e => e.textContent);
check('footer version', footVer === VERSION, footVer);

// --- keyboard nav ---
await page.keyboard.press('3');
await page.waitForTimeout(150);
check('key 3 -> unun view', await page.$eval('#view-unun', e => e.classList.contains('on')));
await page.keyboard.press('1');
await page.waitForTimeout(150);

// --- fractional inches ---
const f1 = await page.evaluate(() => fmt(10.354));
check('fmt quarter inch', f1.includes('10') && f1.includes('4¼'), f1);
const f2 = await page.evaluate(() => fmt(9.999));
check('fmt carry to next foot', f2.startsWith('10') && f2.includes(' 0<small>″'), f2);
const l1 = await page.evaluate(() => fmtLogLen(65.708));
check('log fmt quarter inch', l1.includes('8½″') && l1.includes('20.03 m'), l1);

// --- band-span wire verdicts ---
// 71 ft on 40 m: multiple spans 1.062–1.107 across 7.0–7.3 MHz, worst case
// 0.062 from 1×½λ -> AVOID even though band center alone would say MARGINAL.
await page.keyboard.press('2');
await page.waitForTimeout(150);
await page.fill('#wire', '71');
await page.waitForTimeout(200);
const v40 = await page.$$eval('#verdict .li', els => {
  const row = els.find(e => e.querySelector('.t1') && e.querySelector('.t1').textContent === '40m');
  return row ? row.querySelector('.pill').textContent : null;
});
check('71 ft AVOID on 40m (band edge)', v40 === 'AVOID', v40);
const wireRows = await page.$$eval('#verdict .li', els => ({
  n: els.length,
  first: els[0].querySelector('.t1').textContent,
  pill: els[0].querySelector('.pill').textContent
}));
check('wire check covers 160m (SHORT at 71 ft)', wireRows.n === 10 && wireRows.first === '160m' && wireRows.pill === 'SHORT', JSON.stringify(wireRows));
check('clocks removed from header', await page.evaluate(() => !document.getElementById('clkUtc') && !document.getElementById('clocks')));
const shared = await page.evaluate(async () => {
  const btn = document.getElementById('btnShare');
  if (!btn || btn.parentElement.id !== 'hdBtns') return null;
  let captured = null;
  navigator.share = d => { captured = d; return Promise.resolve(); };
  btn.click();
  await new Promise(r => setTimeout(r, 80));
  return { captured, label: btn.getAttribute('aria-label') };
});
check('share button in header uses Web Share with live URL',
  !!shared && shared.label === 'Share FeedPoint' && shared.captured &&
  shared.captured.url === 'https://cdburgess75.github.io/FeedPoint/' && shared.captured.title === 'FeedPoint',
  JSON.stringify(shared));
const copied = await page.evaluate(async () => {
  delete navigator.share;
  let text = null;
  navigator.clipboard.writeText = t => { text = t; return Promise.resolve(); };
  document.getElementById('btnShare').click();
  await new Promise(r => setTimeout(r, 80));
  return { text, toast: document.querySelector('#toasts .toast')?.textContent || '' };
});
check('share falls back to clipboard + toast',
  !!copied && copied.text === 'https://cdburgess75.github.io/FeedPoint/' && copied.toast.includes('Link copied'),
  JSON.stringify(copied));
const topbarSafe = await page.evaluate(() => {
  const s = getComputedStyle(document.getElementById('topbar'));
  return { minH: s.minHeight, padTop: s.paddingTop };
});
check('header reserves iOS safe area (60px min, env pad)', topbarSafe.minH === '60px' && topbarSafe.padTop === '0px', JSON.stringify(topbarSafe));
check('update banner present, hidden by default', await page.evaluate(() => {
  const b = document.getElementById('updateBar');
  return !!b && !b.classList.contains('show') && getComputedStyle(b).display === 'none' && !!document.getElementById('updateBtn');
}));
const pinned = await page.evaluate(() => ({
  body: getComputedStyle(document.body).position,
  overscroll: getComputedStyle(document.documentElement).overscrollBehaviorY,
  mainScrolls: getComputedStyle(document.getElementById('main')).overflowY
}));
check('document pinned, main scrolls', pinned.body === 'fixed' && pinned.overscroll === 'none' && pinned.mainScrolls === 'auto', JSON.stringify(pinned));
const mainLayer = await page.evaluate(() => {
  const s = getComputedStyle(document.getElementById('main'));
  return { over: s.overscrollBehaviorY, tf: s.transform };
});
check('main pane: no bounce, own layer', mainLayer.over === 'none' && mainLayer.tf !== 'none', JSON.stringify(mainLayer));

// --- long proven lengths + wide suggestion search ---
const chipTexts = await page.$$eval('#goodLens button', els => els.map(e => e.textContent));
check('chips extend past 119 ft', chipTexts.length === 12 && chipTexts.includes('203 ft') && chipTexts.at(-1) === '423 ft', JSON.stringify(chipTexts.slice(-4)));
await page.fill('#wire', '150');
await page.waitForTimeout(250);
const longFix = await page.evaluate(() => ({
  shown: !document.getElementById('wireFix').hidden,
  label: document.querySelector('#wireFix button')?.textContent
}));
check('suggestion reaches far for long wires', longFix.shown && longFix.label.includes('107.5 ft'), JSON.stringify(longFix));

// --- band-set length recommender ---
const pickCount = await page.$$eval('#bandPick button', els => els.length);
check('band picker shows 10 bands', pickCount === 10, String(pickCount));
const clickBand = async (name) => page.$$eval('#bandPick button', (els, n) => {
  els.find(e => e.textContent === n).click();
}, name);
await clickBand('40m'); await clickBand('20m'); await clickBand('10m');
await page.waitForTimeout(250);
const recs = await page.$$eval('#recLens button', els => els.map(e => parseFloat(e.querySelector('b').textContent)));
check('recommendations produced', recs.length >= 3, JSON.stringify(recs));
const recsClear = await page.evaluate((vals) => {
  const sel = wireBands().filter(b => ['40m','20m','10m'].includes(b.n));
  return vals.every(ft => sel.every(b => { const r = bandOffset(ft, b); return r.n > 0 && r.off >= 0.15; }));
}, recs);
check('every recommendation CLEAR on selected bands', recsClear);
const lowestFloor = await page.evaluate(() => 234 / 7.15);
check('recommendations respect quarter-wave floor', recs.every(v => v >= Math.floor(lowestFloor)), JSON.stringify([recs[0], lowestFloor.toFixed(1)]));
await page.click('#recLens button');
await page.waitForTimeout(250);
const recLoaded = await page.evaluate((first) => parseFloat(document.getElementById('wire').value) === first, recs[0]);
check('tapping a recommendation loads it', recLoaded);
await page.reload();
await page.waitForTimeout(700);
const selRestored = await page.$$eval('#bandPick button.on', els => els.map(e => e.textContent).sort().join(','));
check('band selection persists reload', selRestored === '10m,20m,40m', selRestored);
await clickBand('40m'); await clickBand('20m'); await clickBand('10m'); // reset selection
await page.fill('#wire', '71');   // restore the state the next section expects
await page.waitForTimeout(250);
const fixShown = await page.$eval('#wireFix', e => !e.hidden);
check('all-clear suggestion offered', fixShown);
await page.click('#wireFix button');
await page.waitForTimeout(200);
const sugClean = await page.evaluate(() => {
  const ft = parseFloat(document.getElementById('wire').value);
  return !hasAvoid(ft);
});
check('suggestion is actually spike-free', sugClean);
const fixHidden = await page.$eval('#wireFix', e => e.hidden);
check('suggestion hides once clear', fixHidden);

// --- chips convert in meters mode ---
await page.fill('#wire', '71');
await page.waitForTimeout(150);
let chip0 = await page.$eval('#goodLens button', e => e.textContent);
check('chips imperial', chip0 === '25.5 ft', chip0);
await page.click('#wM');
await page.waitForTimeout(150);
chip0 = await page.$eval('#goodLens button', e => e.textContent);
check('chips metric', chip0 === '7.8 m', chip0);
await page.click('#goodLens button');
await page.waitForTimeout(150);
const wireVal = await page.$eval('#wire', e => e.value);
check('metric chip sets metric value', wireVal === '7.8', wireVal);
await page.click('#wFt');
await page.waitForTimeout(150);

// --- import validation: legacy casings ---
const importResult = async (obj) => page.evaluate(async (o) => {
  document.getElementById('toasts').innerHTML = '';
  importBackup(new Blob([JSON.stringify(o)], { type: 'application/json' }));
  await new Promise(r => setTimeout(r, 300));
  const t = document.querySelector('#toasts .toast');
  return t ? { text: t.textContent, err: t.classList.contains('err') } : null;
}, obj);

let r = await importResult({ app: 'FEEDPOINT', log: [] });
check('import FEEDPOINT casing', r && !r.err && r.text.includes('Restored 0'), r && r.text);
r = await importResult({ app: 'halfwave', log: [{ ts: 123, items: [['a','b']], kind: 'cut', title: 'legacy' }] });
check('import legacy halfwave', r && !r.err && r.text.includes('Restored 1'), r && r.text);
r = await importResult({ app: 'Feedpoint', log: [] });
check('import mixed case', r && !r.err, r && r.text);
r = await importResult({ app: 'other', log: [] });
check('import rejects wrong app', r && r.err, r && r.text);
r = await importResult({ app: 'feedpoint' });
check('import rejects missing log', r && r.err, r && r.text);

// --- imported strings are escaped, not injected ---
r = await importResult({ app: 'feedpoint', log: [{ ts: 456, kind: 'cut',
  title: '<img src=x onerror=window.__pwned=1>', items: [['<b>k</b>', '<i>v</i>']] }] });
check('import of markup title accepted', r && !r.err, r && r.text);
await page.keyboard.press('6');
await page.waitForTimeout(200);
const injected = await page.evaluate(() => ({
  img: !!document.querySelector('#logList img'),
  pwned: '__pwned' in window,
  titleText: document.querySelector('#logList .t1').textContent,
  specHasBold: !!document.querySelector('#logList .spec b, #logList .spec i')
}));
check('markup rendered as text', !injected.img && !injected.pwned && !injected.specHasBold
  && injected.titleText.includes('<img'), JSON.stringify(injected));

// --- toast is aria-live ---
const live = await page.$eval('#toasts', e => e.getAttribute('aria-live'));
check('toasts aria-live', live === 'polite', live);

// --- save cut + delete with undo ---
await importResult({ app: 'feedpoint', log: [] }); // reset log
await page.keyboard.press('1');
await page.waitForTimeout(150);
await page.click('#saveCut');
await page.waitForTimeout(200);
check('save flash', await page.$eval('#saveCut', e => e.textContent === 'Saved'));
await page.keyboard.press('6');
await page.waitForTimeout(200);
let count = await page.$$eval('#logList details.k', els => els.length);
check('log has entry', count === 1, String(count));
await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
await page.click('#logList .del');
await page.waitForTimeout(200);
count = await page.$$eval('#logList details.k', els => els.length);
check('entry deleted', count === 0, String(count));
const undoBtn = await page.$('#toasts .t-act');
check('undo offered', !!undoBtn);
await undoBtn.click();
await page.waitForTimeout(200);
count = await page.$$eval('#logList details.k', els => els.length);
check('undo restores entry', count === 1, String(count));

// --- per-band cut memory dot ---
await page.keyboard.press('1');
await page.waitForTimeout(150);
const dot40 = await page.$$eval('#bandList .li', els => {
  const row = els.find(e => e.querySelector('.t1').textContent.startsWith('40m'));
  return !!row.querySelector('.cutdot');
});
check('40m shows cut-memory dot', dot40);

// --- load log entry back into calculator ---
await page.fill('#freq', '14.175');
await page.waitForTimeout(150);
await page.evaluate(() => go('log'));
await page.waitForTimeout(150);
await page.$eval('#logList details.k', e => e.open = true);
await page.click('#logList .load');
await page.waitForTimeout(200);
const loaded = await page.evaluate(() => ({
  view: document.getElementById('view-calc').classList.contains('on'),
  freq: document.getElementById('freq').value
}));
check('load restores freq + switches view', loaded.view && loaded.freq === '7.150', JSON.stringify(loaded));

// --- per-entry notes persist ---
await page.evaluate(() => go('log'));
await page.waitForTimeout(150);
await page.$eval('#logList details.k', e => e.open = true);
await page.fill('#logList textarea.note', 'Backyard EFHW, tuned flat on 40');
await page.waitForTimeout(800);
await page.reload();
await page.waitForTimeout(700);
await page.$eval('#logList details.k', e => e.open = true);
const noteVal = await page.$eval('#logList textarea.note', e => e.value);
check('note persists across reload', noteVal === 'Backyard EFHW, tuned flat on 40', noteVal);

// --- print cut sheet isolates the entry ---
await page.evaluate(() => { window.print = () => {}; });
await page.click('#logList .print');
await page.waitForTimeout(100);
const during = await page.evaluate(() => ({
  one: document.body.classList.contains('print-one'),
  target: !!document.querySelector('#logList details.k.print-target')
}));
check('print marks single entry', during.one && during.target, JSON.stringify(during));
await page.waitForTimeout(1100);
const after = await page.evaluate(() => document.body.classList.contains('print-one'));
check('print state cleaned up', !after);

// --- backup includes build stamp ---
const build = await page.evaluate(() => APP_VERSION);
check('APP_VERSION accessible', build === VERSION, build);

// --- responsive: collapsed rail at 900px ---
await page.setViewportSize({ width: 900, height: 800 });
await page.waitForTimeout(200);
const railW = await page.$eval('#rail', e => e.getBoundingClientRect().width);
check('rail collapses at 900px', railW < 80, railW + 'px');
const lblVisible = await page.$eval('#rail .nav-lbl', e => getComputedStyle(e).display);
check('labels hidden collapsed', lblVisible === 'none', lblVisible);

// --- responsive: mobile dock at 400px ---
await page.setViewportSize({ width: 400, height: 800 });
await page.waitForTimeout(200);
const dockShown = await page.$eval('#dock', e => getComputedStyle(e).display);
const railShown = await page.$eval('#rail', e => getComputedStyle(e).display);
check('mobile: dock shown, rail hidden', dockShown === 'flex' && railShown === 'none');
const pillMobile = await page.$eval('.verpill', e => {
  const r = e.getBoundingClientRect();
  return getComputedStyle(e).display !== 'none' && r.width > 0
    && r.right <= window.innerWidth && e.textContent.startsWith('v20');
});
check('version pill visible on mobile', pillMobile);
await page.setViewportSize({ width: 320, height: 700 });
await page.waitForTimeout(300);
const narrowFit = await page.evaluate(() => {
  const t = document.getElementById('btnTheme').getBoundingClientRect();
  const s = document.getElementById('btnShare').getBoundingClientRect();
  const p = document.querySelector('.verpill').getBoundingClientRect();
  return { themeRight: Math.round(t.right), shareOn: s.left >= 0, pillOn: p.width > 0, vw: innerWidth };
});
check('header buttons fit on the narrowest phones (320px)',
  narrowFit.themeRight <= narrowFit.vw && narrowFit.shareOn && narrowFit.pillOn,
  JSON.stringify(narrowFit));

// --- persistence across reload ---
await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.waitForTimeout(700);
count = await page.$$eval('#logList details.k', els => els.length);
check('log persists across reload', count === 1, String(count));

console.log(errors.length ? 'JS ERRORS:\n' + errors.join('\n') : 'NO JS ERRORS');
console.log(failed ? failed + ' FAILURES' : 'ALL PASS');
await browser.close();
process.exit(failed || errors.length ? 1 : 0);

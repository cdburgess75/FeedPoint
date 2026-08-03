/* FEEDPOINT headless functional suite.
   Run: npm i playwright && npx playwright install chromium && node tests/app.test.mjs */
import { chromium } from 'playwright';

const PAGE_URL = new URL('../feedpoint.html', import.meta.url).href;
const VERSION = 'v2026.08.03.006';
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
check('title', await page.title() === 'FEEDPOINT');
const icons = await page.evaluate(() => ({
  favicon: !!document.querySelector('link[rel="icon"][href^="data:image/svg+xml"]'),
  touch: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
  iosTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content
}));
check('favicon + apple-touch-icon wired', icons.favicon && icons.touch === 'apple-touch-icon.png' && icons.iosTitle === 'FEEDPOINT', JSON.stringify(icons));
const manifest = await page.$eval('link[rel="manifest"]', e => e.getAttribute('href'));
check('PWA manifest linked', manifest === 'manifest.webmanifest', manifest);

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

/* FEEDPOINT headless functional suite (v2 antenna-first flow).
   Run: npm i playwright && npx playwright install chromium && node tests/app.test.mjs */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const PAGE_URL = new URL('../feedpoint.html', import.meta.url).href;
const VERSION = 'v2026.09.07.001';
const SRC = readFileSync(new URL('../feedpoint.html', import.meta.url), 'utf8');
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
check('favicon + apple-touch-icon wired (wave badge v16)', icons.favicon && icons.touch === 'https://cdburgess75.github.io/FeedPoint/touch-icon-180-v16.png' && icons.iosTitle === 'FeedPoint', JSON.stringify(icons));
check('no stale v15 icon references in the page', !SRC.includes('v15.png'));
const manifest = await page.$eval('link[rel="manifest"]', e => e.getAttribute('href'));
check('PWA manifest linked', manifest === 'manifest.webmanifest', manifest);
const desktopIcons = await page.evaluate(() => ({
  p32: document.querySelector('link[rel="icon"][sizes="32x32"]')?.getAttribute('href'),
  p16: document.querySelector('link[rel="icon"][sizes="16x16"]')?.getAttribute('href'),
  mask: document.querySelector('link[rel="mask-icon"]')?.getAttribute('href')
}));
check('desktop favicon set wired', desktopIcons.p32 === 'favicon-32.png' && desktopIcons.p16 === 'favicon-16.png' && desktopIcons.mask === 'mask-icon.svg', JSON.stringify(desktopIcons));
const labels = await page.$$eval('#rail .nav-lbl', els => els.map(e => e.textContent));
check('four labeled sections', JSON.stringify(labels) === JSON.stringify(['Cut','Wire','Log','Learn']), JSON.stringify(labels));
const dockLabels = await page.$$eval('#dock .nav-lbl', els => els.map(e => e.textContent));
check('mobile tab bar carries the same labels', JSON.stringify(dockLabels) === JSON.stringify(labels), JSON.stringify(dockLabels));
const ver = await page.$eval('#topbar .verpill', e => e.textContent);
check('version shown in the header', ver === VERSION, ver);
const foot = await page.$eval('#railFoot .db-lbl', e => e.textContent);
check('storage indicator', foot === 'LOCAL DB' || foot === 'NO STORAGE', foot);
check('header mark is the wave badge, not the lambda', await page.evaluate(() => {
  const s = document.querySelector('.mark svg');
  return !!s && s.innerHTML.includes('c2.5 0 2.5-6') && !s.innerHTML.includes('Q25.11');
}));

// --- first run: antenna picker ---
const firstRun = await page.evaluate(() => ({
  pick: !document.getElementById('pickWrap').hidden,
  cut: document.getElementById('cutWrap').hidden,
  view: document.getElementById('view-cut').classList.contains('on'),
  cards: [...document.querySelectorAll('#pick button .name')].map(e => e.textContent)
}));
check('first run opens on the antenna picker', firstRun.pick && firstRun.cut && firstRun.view, JSON.stringify(firstRun));
check('picker lists the five antennas', JSON.stringify(firstRun.cards) === JSON.stringify(['End-fed half-wave','Dipole','Quarter-wave vertical','Random wire','Full-wave loop']), JSON.stringify(firstRun.cards));
await page.click('#pick button[data-ant="rw"]');
await page.waitForTimeout(150);
check('Random wire card goes straight to Wire', await page.$eval('#view-wire', e => e.classList.contains('on')));
await page.keyboard.press('1');
await page.waitForTimeout(150);
check('Cut still shows the picker until an antenna is chosen', await page.$eval('#pickWrap', e => !e.hidden));
await page.click('#pick button[data-ant="efhw"]');
await page.waitForTimeout(200);
const cutState = await page.evaluate(() => ({
  pick: document.getElementById('pickWrap').hidden,
  name: document.getElementById('antName').textContent,
  band: document.querySelector('#bandRail .chip.on')?.textContent,
  freq: document.getElementById('freq').value,
  hero: document.querySelector('#heroBig .val').textContent,
  lbl: document.querySelector('#heroBig .lbl').textContent,
  ratio: document.querySelector('#build .ratio').textContent,
  rows: document.querySelectorAll('#build dt').length
}));
check('choosing EFHW opens the cut screen on 40m',
  cutState.pick && cutState.name === 'End-fed half-wave' && cutState.band === '40m' && cutState.freq === '7.150', JSON.stringify(cutState));
check('EFHW hero = 468/f (65′ 5½″ at 7.150)', cutState.hero === '65′ 5½″' && cutState.lbl.startsWith('Total wire'), cutState.hero);
check('build recipe names the 49:1', cutState.ratio === '49:1' && cutState.rows >= 4, JSON.stringify(cutState));
const colors = await page.evaluate(() => {
  const on = document.querySelector('#bandRail .chip.on');
  const cs = getComputedStyle(on);
  return { band: on.dataset.band, bg: cs.backgroundColor, ink: cs.color, dot: !!on.querySelector('.sw'),
           hero: getComputedStyle(document.querySelector('#heroBig .val')).color,
           ratio: getComputedStyle(document.querySelector('#build .ratio')).color,
           tune: document.getElementById('tune').style.accentColor,
           unsel: document.querySelectorAll('#bandRail .chip .sw').length };
});
check('selected 40m chip wears Firemist Gold with dark ink; every band chip has a swatch',
  colors.band === '40m' && colors.bg === 'rgb(212, 185, 90)' && colors.ink === 'rgb(18, 18, 18)' && colors.dot && colors.unsel === 11 && colors.tune === 'rgb(212, 185, 90)',
  JSON.stringify(colors));
check('EFHW hero and its 49:1 wear Candy Apple Red', colors.hero === 'rgb(185, 42, 51)' && colors.ratio === 'rgb(185, 42, 51)', JSON.stringify(colors));
await page.reload();
await page.waitForTimeout(700);
check('chosen antenna persists reload (no picker again)', await page.evaluate(() => document.getElementById('pickWrap').hidden && document.getElementById('antName').textContent === 'End-fed half-wave'));

// --- per-antenna heroes ---
await page.click('#changeAnt');
await page.waitForTimeout(100);
check('CHANGE returns to the picker', await page.$eval('#pickWrap', e => !e.hidden));
await page.click('#pick button[data-ant="dip"]');
await page.waitForTimeout(150);
const dip = await page.evaluate(() => ({
  lbl: document.querySelector('#heroBig .lbl').textContent,
  leg: document.querySelector('#heroBig .val').textContent,
  total: document.querySelectorAll('#heroPair .mid .val')[0].textContent,
  ratio: document.querySelector('#build .ratio').textContent
}));
check('dipole hero is per leg (234/f) with total span alongside',
  dip.lbl.startsWith('Each leg') && dip.leg === '32′ 8¾″' && dip.total === '65′ 5½″' && dip.ratio === '1:1', JSON.stringify(dip));
await page.click('#changeAnt'); await page.click('#pick button[data-ant="vert"]');
await page.waitForTimeout(150);
const vert = await page.evaluate(() => [document.querySelector('#heroBig .lbl').textContent, document.querySelector('#heroBig .val').textContent, document.querySelectorAll('#heroPair .mid .val')[1].textContent]);
check('vertical hero: radiator 234/f, ⅝ option 585/f', vert[0].startsWith('Radiator') && vert[1] === '32′ 8¾″' && vert[2] === '81′ 9¾″', JSON.stringify(vert));
await page.click('#changeAnt'); await page.click('#pick button[data-ant="loop"]');
await page.waitForTimeout(150);
const loop = await page.evaluate(() => [document.querySelector('#heroBig .val').textContent, document.querySelectorAll('#heroPair .mid .val')[0].textContent]);
check('loop hero: 1005/f with square side', loop[0] === '140′ 6¾″' && loop[1] === '35′ 1¾″', JSON.stringify(loop));
await page.click('#changeAnt'); await page.click('#pick button[data-ant="efhw"]');
await page.waitForTimeout(150);

// --- band rail + tune slider ---
await page.click('#bandRail .chip[data-band="20m"]');
await page.waitForTimeout(150);
const b20 = await page.evaluate(() => ({ f: document.getElementById('freq').value, on: document.querySelector('#bandRail .chip.on').textContent, tune: document.getElementById('tune').value }));
check('band chip sets center frequency and centers the tune slider', b20.f === '14.175' && b20.on === '20m' && b20.tune === '500', JSON.stringify(b20));
await page.evaluate(() => { const t = document.getElementById('tune'); t.value = 0; t.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(150);
check('tune slider at 0 = band edge', await page.$eval('#freq', e => e.value) === '14.000');
await page.fill('#freq', '7.150');
await page.waitForTimeout(150);
const typed = await page.evaluate(() => ({ on: document.querySelector('#bandRail .chip.on')?.textContent, hero: document.querySelector('#heroBig .val').textContent }));
check('typing a frequency re-marks the band and recomputes', typed.on === '40m' && typed.hero === '65′ 5½″', JSON.stringify(typed));
await page.fill('#freq', '9.000');
await page.waitForTimeout(150);
const offBand = await page.evaluate(() => ({ on: !!document.querySelector('#bandRail .chip.on'), dis: document.getElementById('tune').disabled }));
check('out-of-band frequency: no chip lit, slider disabled', !offBand.on && offBand.dis, JSON.stringify(offBand));
await page.fill('#freq', '7.150');
await page.waitForTimeout(150);

// --- units + K presets ---
await page.click('#uM');
await page.waitForTimeout(150);
const mHero = await page.$eval('#heroBig .val', e => e.textContent);
check('metric hero', mHero === '19.95 m', mHero);
await page.click('#uFt');
await page.waitForTimeout(150);
const kChip = await page.$$eval('.kpre button', els => els.map(e => [e.dataset.k, e.classList.contains('on')]));
check('K preset 0.95 active by default', JSON.stringify(kChip) === JSON.stringify([["0.95",true],["0.91",false],["0.92",false]]), JSON.stringify(kChip));
await page.click('.kpre button[data-k="0.91"]');
await page.waitForTimeout(150);
const k91 = await page.evaluate(() => ({ kf: document.getElementById('kf').value, on: document.querySelector('.kpre button[data-k="0.91"]').classList.contains('on'), hero: document.querySelector('#heroBig .val').textContent }));
check('K preset click sets value, active chip, shorter wire', k91.kf === '0.91' && k91.on && k91.hero === '62′ 8½″', JSON.stringify(k91));
await page.click('.kpre button[data-k="0.95"]');
await page.waitForTimeout(150);

// --- settings sheet: theme / text size / region / K ---
check('settings sheet closed by default', await page.$eval('#sheet', e => !e.classList.contains('on')));
await page.click('#btnSettings');
await page.waitForTimeout(150);
check('gear opens the settings sheet', await page.$eval('#sheet', e => e.classList.contains('on')));
const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check('boots in dark theme', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark');
await page.click('#themeSeg button[data-theme="light"]');
await page.waitForTimeout(200);
const lightState = await page.evaluate(() => ({
  attr: document.documentElement.getAttribute('data-theme'),
  bg: getComputedStyle(document.body).backgroundColor,
  metaColor: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
  on: document.querySelector('#themeSeg button.on').dataset.theme
}));
check('Daylight selected', lightState.attr === 'light' && lightState.bg !== darkBg && lightState.on === 'light', JSON.stringify(lightState));
check('meta theme-color follows scheme', lightState.metaColor.toLowerCase() === '#e9f1f4', lightState.metaColor);
await page.click('#themeSeg button[data-theme="circuit"]');
await page.waitForTimeout(200);
const circuitState = await page.evaluate(() => ({
  attr: document.documentElement.getAttribute('data-theme'),
  metaColor: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
  markBg: getComputedStyle(document.querySelector('.mark')).backgroundColor
}));
check('Circuit theme (navy/lime badge)', circuitState.attr === 'circuit' && circuitState.metaColor.toLowerCase() === '#070f1e' && circuitState.markBg === 'rgb(198, 241, 53)', JSON.stringify(circuitState));
await page.reload();
await page.waitForTimeout(700);
check('Circuit survives reload (pre-paint stamp)', await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'circuit');
await page.click('#btnSettings');
await page.click('#sizeSeg button[data-size="2"]');
await page.waitForTimeout(100);
check('AA text size 2', await page.evaluate(() => document.documentElement.getAttribute('data-uiscale')) === '2');
await page.click('#sizeSeg button[data-size="1"]');
await page.click('#themeSeg button[data-theme="dark"]');
await page.waitForTimeout(100);
const bandRange = async (name) => page.evaluate(n => { const b = BANDS.find(x => x.n === n); return b.lo.toFixed(3) + ' – ' + b.hi.toFixed(3); }, name);
check('R2 80m default', (await bandRange('80m')) === '3.500 – 4.000', await bandRange('80m'));
await page.click('#rg1');
await page.waitForTimeout(200);
check('R1 80m narrows', (await bandRange('80m')) === '3.500 – 3.800', await bandRange('80m'));
check('R1 40m narrows (rail chip title too)', (await bandRange('40m')) === '7.000 – 7.200' && (await page.$eval('#bandRail .chip[data-band="40m"]', e => e.title)).includes('7.200'));
await page.reload();
await page.waitForTimeout(700);
check('region persists reload', (await bandRange('80m')) === '3.500 – 3.800');
check('region seg restored', await page.$eval('#rg1', e => e.classList.contains('on')));
await page.click('#btnSettings');
await page.click('#rg2');
await page.waitForTimeout(200);
check('back to R2', (await bandRange('80m')) === '3.500 – 4.000');
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
check('Escape closes the sheet', await page.$eval('#sheet', e => !e.classList.contains('on')));

// --- coil winding calculator + Learn ---
const coil = await page.evaluate(() => ({ air: airTurns(34, 2, 19.4), tor: torTurns(34, 952) }));
check('air-core turns math', coil.air > 27.5 && coil.air < 29, coil.air.toFixed(2));
check('toroid turns math', coil.tor > 5.5 && coil.tor < 6.5, coil.tor.toFixed(2));
check('coil output rendered', (await page.$eval('#coilOut', e => e.textContent)).includes('turns'));
await page.keyboard.press('4');
await page.waitForTimeout(150);
check('key 4 -> Learn', await page.$eval('#view-learn', e => e.classList.contains('on')));
const learnBits = await page.evaluate(() => ({
  ununs: [...document.querySelectorAll('#view-learn details.k .ratio')].map(e => e.textContent),
  notes: document.querySelectorAll('#notesList details').length,
  table: !!document.querySelector('#view-learn table')
}));
check('Learn keeps transformers, notes, core table', learnBits.ununs.slice(0, 4).join() === '1:1,4:1,9:1,49:1' && learnBits.notes === 6 && learnBits.table, JSON.stringify(learnBits));
const pal = await page.evaluate(() => ({
  bands: document.querySelectorAll('#palBands .chip').length, ants: document.querySelectorAll('#palAnts .chip').length,
  r49: getComputedStyle(document.querySelector('#k-49 .ratio')).color, r91: getComputedStyle(document.querySelector('#k-91 .ratio')).color,
  txt: document.querySelector('#palBands').textContent
}));
check('Learn color card lists 11 bands + 5 antennas; transformer ratios match their antenna color',
  pal.bands === 11 && pal.ants === 5 && pal.r49 === 'rgb(185, 42, 51)' && pal.r91 === 'rgb(201, 162, 62)' && pal.txt.includes('Burgundy Mist') && pal.txt.includes('Sonic Blue'),
  JSON.stringify(pal));
await page.keyboard.press('1');
await page.click('#build .more');
await page.waitForTimeout(200);
check('"Winding details" opens the matching Learn card', await page.evaluate(() => document.getElementById('view-learn').classList.contains('on') && document.getElementById('k-49').open));
await page.evaluate(() => { location.hash = '#calc'; });
await page.waitForTimeout(200);
check('legacy #calc deep link lands on Cut', await page.$eval('#view-cut', e => e.classList.contains('on')));

// --- fractional inches ---
const f1 = await page.evaluate(() => fmt(10.354));
check('fmt quarter inch', f1.includes('10') && f1.includes('4¼'), f1);
const f2 = await page.evaluate(() => fmt(9.999));
check('fmt carry to next foot', f2.startsWith('10') && f2.includes(' 0<small>″'), f2);
const l1 = await page.evaluate(() => fmtLogLen(65.708));
check('log fmt quarter inch', l1.includes('8½″') && l1.includes('20.03 m'), l1);

// --- band-span wire verdicts ---
await page.keyboard.press('2');
await page.waitForTimeout(150);
await page.fill('#wire', '71');
await page.waitForTimeout(200);
const v40 = await page.$$eval('#verdict .v', els => {
  const row = els.find(e => e.firstElementChild.textContent.startsWith('40m'));
  return row ? row.querySelector('.pill').textContent : null;
});
check('71 ft AVOID on 40m (band edge)', v40 === 'AVOID', v40);
const wireRows = await page.$$eval('#verdict .v', els => ({
  n: els.length, first: els[0].firstElementChild.textContent.slice(0, 4), pill: els[0].querySelector('.pill').textContent,
  dimmed: els.filter(e => e.classList.contains('dim')).length
}));
check('verdicts cover 10 bands, 160m SHORT at 71 ft, unselected bands dimmed', wireRows.n === 10 && wireRows.first === '160m' && wireRows.pill === 'SHORT' && wireRows.dimmed === 7, JSON.stringify(wireRows));
const vcol = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#verdict .v')];
  return { b160: getComputedStyle(rows[0]).borderLeftColor, b40: getComputedStyle(rows[3]).borderLeftColor,
           pick40: getComputedStyle(document.querySelector('#bandPick .chip.on')).backgroundColor };
});
check('verdict rows and band picker carry the band colors', vcol.b160 === 'rgb(126, 78, 94)' && vcol.b40 === 'rgb(212, 185, 90)' && vcol.pick40 === 'rgb(212, 185, 90)', JSON.stringify(vcol));
const ruler = await page.evaluate(() => {
  const c = document.getElementById('rulerC');
  const ctx = c.getContext('2d');
  const px = ctx.getImageData(Math.round(c.width * 0.05), Math.round(c.height / 2), 1, 1).data;
  return { w: c.width, ticks: document.getElementById('rulerTicks').textContent, painted: px[3] > 0 };
});
check('safe-window ruler is drawn', ruler.w > 300 && ruler.ticks.startsWith('0') && ruler.ticks.endsWith('150 ft') && ruler.painted, JSON.stringify(ruler));
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
check('header reserves iOS safe area (58px + env pad)', topbarSafe.minH === '58px' && topbarSafe.padTop === '0px', JSON.stringify(topbarSafe));
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
check('proven-length chips are all genuinely spike-free', JSON.stringify(chipTexts) === JSON.stringify(['41 ft','58 ft','107 ft']), JSON.stringify(chipTexts));
const noFalseClear = await page.evaluate(() => bandOffset(423, wireBands().find(b => b.n === '10m')).off === 0);
check('423 ft correctly flagged resonant in the 10m span (old false-CLEAR)', noFalseClear);
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
const selDefault = await page.$$eval('#bandPick button.on', els => els.map(e => e.textContent).sort().join(','));
check('first run pre-selects 40/20/10', selDefault === '10m,20m,40m', selDefault);
const recs = await page.$$eval('#recLens .rec', els => els.map(e => parseFloat(e.querySelector('b').textContent)));
check('recommendation tiles produced', recs.length >= 3, JSON.stringify(recs));
const recsClear = await page.evaluate((vals) => {
  const sel = wireBands().filter(b => ['40m','20m','10m'].includes(b.n));
  return vals.every(ft => sel.every(b => { const r = bandOffset(ft, b); return r.n > 0 && r.off >= 0.15; }));
}, recs);
check('every recommendation CLEAR on selected bands', recsClear);
const lowestFloor = await page.evaluate(() => 234 / 7.15);
check('recommendations respect quarter-wave floor', recs.every(v => v >= Math.floor(lowestFloor)), JSON.stringify([recs[0], lowestFloor.toFixed(1)]));
await page.click('#recLens .rec');
await page.waitForTimeout(250);
const recLoaded = await page.evaluate((first) => parseFloat(document.getElementById('wire').value) === first && document.querySelector('#recLens .rec').classList.contains('on'), recs[0]);
check('tapping a recommendation loads it and lights the tile', recLoaded);
const clickBand = async (name) => page.$$eval('#bandPick button', (els, n) => { els.find(e => e.textContent === n).click(); }, name);
await clickBand('80m');
await page.waitForTimeout(200);
await page.reload();
await page.waitForTimeout(700);
const selRestored = await page.$$eval('#bandPick button.on', els => els.map(e => e.textContent).sort().join(','));
check('band selection persists reload', selRestored === '10m,20m,40m,80m', selRestored);
await clickBand('80m');
await page.fill('#wire', '71');
await page.waitForTimeout(250);
const fixShown = await page.$eval('#wireFix', e => !e.hidden);
check('all-clear suggestion offered', fixShown);
await page.click('#wireFix button');
await page.waitForTimeout(200);
check('suggestion is actually spike-free', await page.evaluate(() => !hasAvoid(parseFloat(document.getElementById('wire').value))));
check('suggestion hides once clear', await page.$eval('#wireFix', e => e.hidden));

// --- chips convert in meters mode ---
await page.fill('#wire', '71');
await page.waitForTimeout(150);
let chip0 = await page.$eval('#goodLens button', e => e.textContent);
check('chips imperial', chip0 === '41 ft', chip0);
await page.click('#wM');
await page.waitForTimeout(150);
chip0 = await page.$eval('#goodLens button', e => e.textContent);
check('chips metric', chip0 === '12.5 m', chip0);
check('ruler relabels in metres', (await page.$eval('#rulerTicks', e => e.textContent)).endsWith('50 m'));
await page.click('#goodLens button');
await page.waitForTimeout(150);
check('metric chip sets metric value', (await page.$eval('#wire', e => e.value)) === '12.50');
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
await page.keyboard.press('3');
await page.waitForTimeout(200);
const injected = await page.evaluate(() => ({
  img: !!document.querySelector('#logList img'),
  pwned: '__pwned' in window,
  titleText: document.querySelector('#logList .entry .t').textContent,
  specHasBold: !!document.querySelector('#logList .spec b, #logList .spec i')
}));
check('markup rendered as text', !injected.img && !injected.pwned && !injected.specHasBold && injected.titleText.includes('<img'), JSON.stringify(injected));
check('legacy entry without a length still gets a headline', await page.$eval('#logList .entry .n', e => e.textContent.length > 0));
check('toasts aria-live', (await page.$eval('#toasts', e => e.getAttribute('aria-live'))) === 'polite');

// --- save cut + delete with undo ---
await importResult({ app: 'feedpoint', log: [] }); // reset log
await page.keyboard.press('1');
await page.waitForTimeout(150);
await page.click('#saveCut');
await page.waitForTimeout(200);
check('save flash', await page.$eval('#saveCut', e => e.textContent === 'Saved ✓'));
await page.keyboard.press('3');
await page.waitForTimeout(200);
const entry = await page.evaluate(() => {
  const e = document.querySelector('#logList .entry');
  return { n: document.querySelectorAll('#logList .entry').length, title: e.querySelector('.t').textContent,
           head: e.querySelector('.n').textContent, detail: e.querySelector('.d').textContent };
});
check('log entry is headline-first (EFHW · 40m / 65′ 5½″)', entry.n === 1 && entry.title === 'EFHW · 40m' && entry.head === '65′ 5½″' && entry.detail.startsWith('7.150 MHz'), JSON.stringify(entry));
const ecol = await page.evaluate(() => { const e = document.querySelector('#logList .entry'); return { edge: getComputedStyle(e).borderLeftColor, n: getComputedStyle(e.querySelector('.n')).color, dot: e.querySelector('.t .sw')?.style.background }; });
check('log entry edged in the antenna color with the band dot', ecol.edge === 'rgb(185, 42, 51)' && ecol.n === 'rgb(185, 42, 51)' && ecol.dot === 'rgb(212, 185, 90)', JSON.stringify(ecol));
await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; document.querySelector('#logList .entry').open = true; });
await page.click('#logList .del');
await page.waitForTimeout(200);
let count = await page.$$eval('#logList .entry', els => els.length);
check('entry deleted', count === 0, String(count));
const undoBtn = await page.$('#toasts .t-act');
check('undo offered', !!undoBtn);
await undoBtn.click();
await page.waitForTimeout(200);
count = await page.$$eval('#logList .entry', els => els.length);
check('undo restores entry', count === 1, String(count));

// --- per-band cut memory dot ---
await page.keyboard.press('1');
await page.waitForTimeout(150);
check('40m rail chip shows the saved dot', await page.$eval('#bandRail .chip[data-band="40m"]', e => e.classList.contains('saved')));

// --- load log entry back into Cut ---
await page.click('#changeAnt'); await page.click('#pick button[data-ant="loop"]');
await page.fill('#freq', '14.175');
await page.waitForTimeout(150);
await page.evaluate(() => go('log'));
await page.waitForTimeout(150);
await page.$eval('#logList .entry', e => e.open = true);
await page.click('#logList .load');
await page.waitForTimeout(200);
const loaded = await page.evaluate(() => ({
  view: document.getElementById('view-cut').classList.contains('on'),
  freq: document.getElementById('freq').value, ant: document.getElementById('antName').textContent
}));
check('load restores antenna + freq and switches to Cut', loaded.view && loaded.freq === '7.150' && loaded.ant === 'End-fed half-wave', JSON.stringify(loaded));

// --- per-entry notes persist ---
await page.evaluate(() => go('log'));
await page.waitForTimeout(150);
await page.$eval('#logList .entry', e => e.open = true);
await page.fill('#logList textarea.note', 'Backyard EFHW, tuned flat on 40');
await page.waitForTimeout(800);
await page.reload();
await page.waitForTimeout(700);
await page.$eval('#logList .entry', e => e.open = true);
const noteVal = await page.$eval('#logList textarea.note', e => e.value);
check('note persists across reload', noteVal === 'Backyard EFHW, tuned flat on 40', noteVal);

// --- print cut sheet isolates the entry ---
await page.evaluate(() => { window.print = () => {}; });
await page.click('#logList .print');
await page.waitForTimeout(100);
const during = await page.evaluate(() => ({
  one: document.body.classList.contains('print-one'),
  target: !!document.querySelector('#logList .entry.print-target')
}));
check('print marks single entry', during.one && during.target, JSON.stringify(during));
await page.waitForTimeout(1100);
check('print state cleaned up', !(await page.evaluate(() => document.body.classList.contains('print-one'))));

// --- wire save ---
await page.keyboard.press('2');
await page.fill('#wire', '58');
await page.waitForTimeout(150);
await page.click('#saveWire');
await page.waitForTimeout(200);
await page.keyboard.press('3');
await page.waitForTimeout(150);
const wEntry = await page.evaluate(() => { const e = document.querySelector('#logList .entry'); return { t: e.querySelector('.t').textContent, n: e.querySelector('.n').textContent, d: e.querySelector('.d').textContent }; });
check('wire entry headline-first with clear count', wEntry.t.startsWith('Wire check · 58.0 ft') && wEntry.n === '58′ 0″' && /\d+ of 10 bands clear/.test(wEntry.d), JSON.stringify(wEntry));

const build = await page.evaluate(() => APP_VERSION);
check('APP_VERSION accessible', build === VERSION, build);

// --- responsive: mobile tab bar below 900px ---
await page.setViewportSize({ width: 899, height: 800 });
await page.waitForTimeout(200);
check('tab bar takes over below 900px', await page.evaluate(() => getComputedStyle(document.getElementById('dock')).display === 'flex' && getComputedStyle(document.getElementById('rail')).display === 'none'));
await page.setViewportSize({ width: 400, height: 800 });
await page.waitForTimeout(200);
const dockFooter = await page.evaluate(() => {
  const d = document.getElementById('dock');
  const s = getComputedStyle(d);
  const r = d.getBoundingClientRect();
  const main = document.getElementById('main').getBoundingClientRect();
  return { bottom: Math.round(r.bottom), vh: innerHeight, left: Math.round(r.left),
           right: Math.round(r.right), vw: innerWidth, borderTop: s.borderTopWidth !== '0px',
           position: s.position, mainBottom: Math.round(main.bottom), top: Math.round(r.top),
           labels: [...d.querySelectorAll('.nav-lbl')].every(l => getComputedStyle(l).display !== 'none') };
});
check('footer is an in-flow grid row reaching the true bottom, with labels',
  dockFooter.position !== 'fixed' && dockFooter.bottom === dockFooter.vh &&
  dockFooter.left === 0 && dockFooter.right === dockFooter.vw && dockFooter.borderTop && dockFooter.labels,
  JSON.stringify(dockFooter));
check('content ends exactly where the footer begins (no gap, no overlap)', dockFooter.mainBottom === dockFooter.top, JSON.stringify(dockFooter));
const measurePill = () => page.evaluate(() => {
  const p = document.querySelector('#topbar .verpill');
  const r = document.createRange(); r.selectNodeContents(p);
  const cs = getComputedStyle(p), box = p.getBoundingClientRect();
  const inner = box.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
  return { textW: +r.getBoundingClientRect().width.toFixed(1), inner: +inner.toFixed(1), right: Math.round(box.right), vw: innerWidth, text: p.textContent };
});
const pillFits = await measurePill();
check('full version string fits under the wordmark and stays on screen',
  pillFits.inner >= pillFits.textW - 0.5 && pillFits.right <= pillFits.vw && /^v\d{4}\.\d{2}\.\d{2}\.\d{3}$/.test(pillFits.text), JSON.stringify(pillFits));
check('iOS text inflation disabled', (await page.evaluate(() => getComputedStyle(document.documentElement).webkitTextSizeAdjust)) === '100%');
const dockPad = await page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-display'), padBottom: parseFloat(getComputedStyle(document.getElementById('dock')).paddingBottom) }));
check('footer keeps home-indicator padding in every display mode', !!dockPad.attr && dockPad.padBottom >= 6, JSON.stringify(dockPad));
check('app box is sized to the dynamic viewport, not the physical screen', SRC.includes('height:100dvh'));
const vvFit = await page.evaluate(() => {
  const d = document.getElementById('dock').getBoundingClientRect();
  return { appH: document.documentElement.style.getPropertyValue('--app-h'), vv: Math.round(visualViewport.height), dockBottom: Math.round(d.bottom) };
});
check('app fills the visible area, footer lands on its bottom edge', vvFit.appH === vvFit.vv + 'px' && vvFit.dockBottom === vvFit.vv, JSON.stringify(vvFit));
const noGap = await page.evaluate(() => {
  const d = document.getElementById('dock').getBoundingClientRect();
  const biggest = Math.max(visualViewport.height, document.documentElement.clientHeight, innerHeight);
  return { dockBottom: Math.round(d.bottom), biggest: Math.round(biggest) };
});
check('no dead space below the footer on any reported viewport measure', noGap.dockBottom === noGap.biggest, JSON.stringify(noGap));
const vvBefore = await page.evaluate(() => document.documentElement.style.getPropertyValue('--app-h'));
await page.setViewportSize({ width: 400, height: 860 });
await page.waitForTimeout(350);
const vvAfter = await page.evaluate(() => {
  const d = document.getElementById('dock').getBoundingClientRect();
  return { appH: document.documentElement.style.getPropertyValue('--app-h'), vv: Math.round(visualViewport.height), dockBottom: Math.round(d.bottom) };
});
check('app re-measures when the visible area changes', vvAfter.appH !== vvBefore && vvAfter.appH === vvAfter.vv + 'px' && vvAfter.dockBottom === vvAfter.vv, JSON.stringify({ vvBefore, vvAfter }));
await page.setViewportSize({ width: 400, height: 800 });
await page.waitForTimeout(350);
const diagOpen = await page.evaluate(async () => {
  location.hash = '#debug';
  await new Promise(r => setTimeout(r, 250));
  const b = document.getElementById('diagBox');
  const txt = b ? b.textContent : '';
  if (b) b.click();
  await new Promise(r => setTimeout(r, 100));
  location.hash = '';
  return { had: !!b, closed: !document.getElementById('diagBox'), hasVV: txt.includes('visualViewport'), hasFooter: txt.includes('footer vs visualVP') };
});
check('#debug diagnostics panel opens, reports viewport truth, and closes', diagOpen.had && diagOpen.closed && diagOpen.hasVV && diagOpen.hasFooter, JSON.stringify(diagOpen));
const dvhBox = await page.evaluate(() => ({ bodyH: Math.round(document.body.getBoundingClientRect().height), vh: innerHeight }));
check('app box height tracks the viewport', dvhBox.bodyH === dvhBox.vh, JSON.stringify(dvhBox));
await page.addStyleTag({ content: '#topbar{padding-top:59px!important;min-height:119px!important}#dock{padding-bottom:40px!important}' });
await page.waitForTimeout(200);
const inset = await page.evaluate(() => {
  const d = document.getElementById('dock').getBoundingClientRect();
  const m = document.getElementById('main').getBoundingClientRect();
  return { dockBottom: Math.round(d.bottom), vh: innerHeight, dockTop: Math.round(d.top), mainBottom: Math.round(m.bottom),
           btnsRight: Math.round(document.getElementById('hdBtns').getBoundingClientRect().right), vw: innerWidth,
           hOverflow: document.documentElement.scrollWidth > innerWidth };
});
check('layout holds with simulated safe-area insets', inset.dockBottom === inset.vh && inset.mainBottom === inset.dockTop && inset.btnsRight <= inset.vw && !inset.hOverflow, JSON.stringify(inset));
await page.reload(); await page.waitForTimeout(600);
const mobileCut = await page.evaluate(() => {
  const seg = document.querySelector('.hero-top .seg').getBoundingClientRect();
  const big = document.querySelector('#heroBig .val').getBoundingClientRect();
  const btns = [...document.querySelectorAll('.hero-top .seg button')].map(b => b.getBoundingClientRect().height);
  return { segOn: seg.right <= innerWidth, oneLine: Math.max(...btns) < 40, bigOn: big.right <= innerWidth, hOverflow: document.getElementById('main').scrollWidth > document.getElementById('main').clientWidth };
});
check('phone Cut screen: hero + units fit on one line, no horizontal scroll', mobileCut.segOn && mobileCut.oneLine && mobileCut.bigOn && !mobileCut.hOverflow, JSON.stringify(mobileCut));
await page.setViewportSize({ width: 320, height: 700 });
await page.waitForTimeout(300);
const narrowFit = await page.evaluate(() => {
  const t = document.getElementById('btnSettings').getBoundingClientRect();
  const s = document.getElementById('btnShare').getBoundingClientRect();
  const p = document.querySelector('#topbar .verpill').getBoundingClientRect();
  return { gearRight: Math.round(t.right), shareOn: s.left >= 0, pillRight: Math.round(p.right), vw: innerWidth,
           hOverflow: document.documentElement.scrollWidth > innerWidth };
});
check('header fits on the narrowest phones (320px)', narrowFit.gearRight <= narrowFit.vw && narrowFit.shareOn && narrowFit.pillRight <= narrowFit.vw && !narrowFit.hOverflow, JSON.stringify(narrowFit));

// --- persistence across reload ---
await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.waitForTimeout(700);
count = await page.$$eval('#logList .entry', els => els.length);
check('log persists across reload', count === 2, String(count));

// --- iOS small-viewport regression -------------------------------------
const iosPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await iosPage.addInitScript(() => { Object.defineProperty(window.visualViewport, 'height', { get: () => 760 }); });
await iosPage.goto(PAGE_URL);
await iosPage.waitForTimeout(1500);
const iosFit = await iosPage.evaluate(() => {
  const d = document.getElementById('dock').getBoundingClientRect();
  return { appH: document.documentElement.style.getPropertyValue('--app-h'), vvReports: visualViewport.height, innerH: innerHeight,
           dockBottom: Math.round(d.bottom), gapBelow: innerHeight - Math.round(d.bottom) };
});
check('iOS short-viewport report leaves no dead band below the footer', iosFit.gapBelow === 0 && iosFit.dockBottom === iosFit.innerH, JSON.stringify(iosFit));
await iosPage.close();

// --- standalone: iOS under-reports every viewport height ---------------
const saPage = await browser.newPage({ viewport: { width: 375, height: 768 } });
await saPage.addInitScript(() => {
  const mm = window.matchMedia;
  window.matchMedia = q => q.includes('display-mode: standalone') ? { matches: true, addEventListener(){}, removeEventListener(){} } : mm.call(window, q);
  Object.defineProperty(screen, 'height', { get: () => 812 });
  Object.defineProperty(screen, 'width', { get: () => 375 });
});
await saPage.goto(PAGE_URL);
await saPage.waitForTimeout(1500);
const saFit = await saPage.evaluate(() => ({ mode: document.documentElement.getAttribute('data-display'), appH: document.documentElement.style.getPropertyValue('--app-h') }));
check('standalone uses the full physical screen height', saFit.mode === 'standalone' && saFit.appH === '812px', JSON.stringify(saFit));
const saInset = await saPage.evaluate(() => ({ stretched: document.documentElement.getAttribute('data-stretched'), padBottom: getComputedStyle(document.getElementById('dock')).paddingBottom }));
check('stretched standalone restores home-indicator clearance (40px floor)', saInset.stretched === '1' && saInset.padBottom === '40px', JSON.stringify(saInset));
await saPage.close();

const brPage = await browser.newPage({ viewport: { width: 375, height: 666 } });
await brPage.addInitScript(() => {
  Object.defineProperty(screen, 'height', { get: () => 812 });
  Object.defineProperty(screen, 'width', { get: () => 375 });
});
await brPage.goto(PAGE_URL);
await brPage.waitForTimeout(1500);
const brFit = await brPage.evaluate(() => ({ mode: document.documentElement.getAttribute('data-display'), appH: document.documentElement.style.getPropertyValue('--app-h') }));
check('browser mode ignores screen height (footer stays above browser chrome)', brFit.mode === 'browser' && brFit.appH === '666px', JSON.stringify(brFit));
const brInset = await brPage.evaluate(() => ({ stretched: document.documentElement.getAttribute('data-stretched'), padBottom: getComputedStyle(document.getElementById('dock')).paddingBottom }));
check('un-stretched footer keeps its slim padding', brInset.stretched === null && brInset.padBottom === '6px', JSON.stringify(brInset));
await brPage.close();

console.log(errors.length ? 'JS ERRORS:\n' + errors.join('\n') : 'NO JS ERRORS');
console.log(failed ? failed + ' FAILURES' : 'ALL PASS');
await browser.close();
process.exit(failed || errors.length ? 1 : 0);

<!-- ═══════════════════════════ HERO ═══════════════════════════ -->

<div align="center">

<img src="docs/mark.svg" width="110" alt="FeedPoint mark — the Wave badge: lime disc with a navy sine on navy">

# FeedPoint

### **Cut the wire right the first time.**

The wire-antenna workbench that lives in a **single file** — cut charts,
band-span resonance verdicts, transformer recipes, and a build log for the
ham bands, **160–6 m**. Fully offline. Zero dependencies. One `.html` you
can keep forever.

<br>

<!-- ────────────── MASSIVE CALL TO ACTION ────────────── -->

<a href="https://cdburgess75.github.io/FeedPoint/">
  <img src="docs/open-app.svg" width="340" alt="TRY THE LIVE APP — opens FeedPoint at cdburgess75.github.io/FeedPoint">
</a>

### 👉 **[cdburgess75.github.io/FeedPoint](https://cdburgess75.github.io/FeedPoint/)** 👈

*…or download [`feedpoint.html`](feedpoint.html) and double-click it.
That is the entire install.*

<br>

[![CI](https://github.com/cdburgess75/FeedPoint/actions/workflows/ci.yml/badge.svg)](https://github.com/cdburgess75/FeedPoint/actions/workflows/ci.yml)
[![Deploy](https://github.com/cdburgess75/FeedPoint/actions/workflows/pages.yml/badge.svg)](https://github.com/cdburgess75/FeedPoint/actions/workflows/pages.yml)
![Single file](https://img.shields.io/badge/single_file-~210_KB-FF9500)
![Offline](https://img.shields.io/badge/offline-100%25-2FC898)
![Tests](https://img.shields.io/badge/checks-122_passing-62CA40)

<br>

<!-- 📸 PLACEHOLDER — replace with a 10–15 s GIF of the live app:
     open the calculator, tap a band, watch the cut cards fill in,
     then switch to the wire check and show a verdict flip.
     Until then, the static hero screenshot below stands in. -->
<img src="docs/hero.png" width="880" alt="FeedPoint element calculator — band list on the left, quarter-inch cut-length cards on the right, dark enterprise UI with orange accents">

</div>

---

## ⚡ What it does

- **📐 Cut** — pick the antenna (EFHW, dipole, ¼-wave vertical, full-wave
  loop), tap a band, slide across it, and read one big number to the quarter
  inch (or metric) with its companions — counterpoise, harmonics, total
  span, radials, ⅝-wave, loop sides — plus the transformer recipe to build
  it. K-factor presets for bare / insulated / inverted-V wire, ITU region
  band plans (R1/R2/R3), and a dot on every band you've already cut for.
- **📊 Wire** — pick the bands you want and get **recommended random-wire
  lengths** sitting dead-center in the safe windows, drawn on a 0–150 ft
  safe-window ruler with your wire marked. Verdicts for a 9:1 random wire
  are computed across the *entire band span* on every band 160–10 m, with
  the nearest spike-free length offered when yours fails.
- **📒 Log** — every saved cut and wire check, headline first: antenna,
  band, the length in big type. Expand for the spec sheet, per-entry notes,
  reload into Cut, a printable cut sheet, delete with undo, JSON
  export/import.
- **🧲 Learn** — winding recipes for the 1:1 choke, 4:1, 9:1, and 49:1 EFHW
  autotransformer, a toroid core cheat sheet, a coil winding calculator
  (Wheeler air-core + ferrite A·L), EFHW vs EFRW, and the field notes
  datasheets skip.
- **📴 Works with zero signal** — it's a file, not a website. On a summit,
  at field day, or in 2040, it still cuts wire.
- **🔔 Update-aware PWA** — installed copies quietly check for new builds
  and offer a one-tap **Update now** banner. Your data never leaves the
  device: settings and log live in IndexedDB, exportable as plain JSON.

### Built with

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla,_zero_deps-F7DF1E?logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-installable_+_offline-5A0FC8)
![IndexedDB](https://img.shields.io/badge/IndexedDB-local_storage-orange)
![Playwright](https://img.shields.io/badge/Playwright-122_checks-2EAD33?logo=playwright&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI_+_deploy-2088FF?logo=githubactions&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-hosting-222?logo=github)

No framework, no bundler, no CDN, no tracking. View source and you can read
the entire application — fonts included.

---

## 🚀 Getting started

### Just want to use it?

Open **[the live app](https://cdburgess75.github.io/FeedPoint/)**. Done.
(Or grab [`feedpoint.html`](feedpoint.html) and open it from anywhere —
thumb drive, email attachment, shack laptop with no internet.)

### Run it locally / hack on it

**Prerequisites:** any modern browser. Node.js 18+ only if you want to run
the test suite.

```sh
# 1. Clone
git clone https://github.com/cdburgess75/FeedPoint.git
cd FeedPoint

# 2. "Install"
#    (there is nothing to install — the app is one file)

# 3. Run
open feedpoint.html        # macOS
xdg-open feedpoint.html    # Linux
start feedpoint.html       # Windows
```

Edit `feedpoint.html`, refresh the tab, done — there is no build step.

**Run the functional suite** (122 headless checks: navigation, verdict math,
theming, import validation, XSS escaping, undo, persistence, responsive
breakpoints — the same gate every PR passes in CI):

```sh
npm install playwright
npx playwright install chromium
node tests/app.test.mjs
```

---

## 📱 Install it on your phone

The live site is a full PWA: saved to your home screen it launches
full-screen with its own icon, works completely offline, and tells you when
a new version ships.

<!-- 📸 PLACEHOLDER — side-by-side phone screenshots:
     (1) iOS Share sheet with "Add to Home Screen" highlighted,
     (2) the FeedPoint icon sitting on a home screen,
     (3) the app running full-screen.
     Suggested file: docs/install-guide.png, ~900px wide composite. -->

### 🍎 iPhone / iPad (Safari)

1. Open **[cdburgess75.github.io/FeedPoint](https://cdburgess75.github.io/FeedPoint/)** in **Safari**.
2. Tap the **Share** button (the square with the arrow, bottom center).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. That's it — the λ icon is on your home screen and the app
   now opens full-screen, works offline, and shows an **Update now** banner
   whenever a new build ships.

### 🤖 Android (Chrome)

1. Open **[cdburgess75.github.io/FeedPoint](https://cdburgess75.github.io/FeedPoint/)** in **Chrome**.
2. Tap the **⋮ menu** (top right).
3. Tap **Add to Home screen** (on newer versions: **Install app**).
4. Confirm with **Install / Add**. FeedPoint appears in your launcher and
   app drawer like any native app — offline included.

> 💻 **Desktop too:** Chrome and Edge show an install icon in the address
> bar on the live site — one click gives you FeedPoint in its own window.

---

## 🎯 The verdict engine doesn't flatter you

<img src="docs/wire.png" width="880" alt="Random-wire check: 71 feet flagged AVOID on 40 m across the full band span, with the nearest spike-free length suggested">

A random wire near a half-wave multiple presents an impedance spike no tuner
can match. Most charts check band centers; FeedPoint checks the **entire
band span** — a wire that's clear at 7.150 can still spike at 7.000. That's
why the classic 71-footer honestly flags AVOID on 40 m above, and why the
app offers the nearest **spike-free** length instead of pretending. (Fun
fact the math forced us to document: past ~13 ft, *no* length avoids even
MARGINAL on all nine bands. Antennas are compromises. FeedPoint just refuses
to lie about which one you're making.)

## 🏕️ Made for the field

<img src="docs/mobile.png" align="right" width="230" alt="FeedPoint build log rendered one-handed on a phone, labeled tab bar at the bottom">

- **Phone-first when it needs to be** — the sidebar becomes a labeled tab
  bar pinned to the true bottom of the screen, touch targets stay 44 px+,
  the header respects the iPhone notch, and the layout works one-handed on
  a summit.
- **Keyboard-driven at home** — number keys <kbd>1</kbd>–<kbd>4</kbd> switch
  sections; every control is focusable and screen-reader labeled
  (`aria-live` toasts, visible focus rings, reduced-motion respected).
- **Three themes** (Macro Dark, Daylight, Circuit) and a text-size stepper
  in the settings sheet — all persist, all apply before first paint.
- **Storage honesty** — a status dot tells you whether IndexedDB is really
  persisting. If it isn't, saves say *"Session only"* instead of a
  comforting lie.

<br clear="right">

## 💾 Your data is a file too

Backups are human-readable JSON — versioned, portable, and accepted back
case-insensitively (including backups from the app's earlier life as
`halfwave`):

```json
{
  "app": "feedpoint",
  "version": 1,
  "build": "v2026.08.03.020",
  "exported": "2026-08-03T14:30:00.000Z",
  "settings": { "metric": false, "freq": "7.150", "kf": "0.95" },
  "log": [ { "ts": 1786064460000, "kind": "cut", "title": "Cuts · 40m · 7.150 MHz · K 0.95", "items": [] } ]
}
```

## 🔩 Under the hood

**The formulas** (f in MHz, feet out, all scaled by K/0.95):

| Element | Formula | | Element | Formula |
|---------|:-------:|-|---------|:-------:|
| Half wave | `468 / f` | | Full-wave loop | `1005 / f` |
| Quarter wave | `234 / f` | | ⅝ wave | `585 / f` |
| Counterpoise 0.05 λ | `0.05 × 984 / f` | | Verdict thresholds | ±7% AVOID · ±15% MARGINAL |

**The look** is Macro Dark by default — warm near-black, orange accent,
hairline edges, embedded Inter / Roboto Mono / Chakra Petch (latin subsets;
~110 KB of the file is fonts) — with Daylight and Circuit (navy + lime
`#C6F135`) alongside. The brand mark is the Wave badge: a lime disc carrying
a navy sine on a navy tile.

**Storage** is raw IndexedDB — one database, one key-value store, every
access wrapped so the app degrades gracefully anywhere it runs.

**Updates** ship themselves: the deploy workflow stamps the build version
into the service worker, installed copies detect the new worker, and the
in-app banner swaps versions on tap.

Project history, conventions, and the design contract live in
[`HANDOFF.md`](HANDOFF.md).

---

<div align="center">

**73** — now go cut some wire. 📻

<sub>Found a bug or want a feature? [Open an issue](https://github.com/cdburgess75/FeedPoint/issues).</sub>

</div>

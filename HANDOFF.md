# FeedPoint — Session Handoff

Read this first if you are picking up work on FeedPoint in a new session.
This repository (`cdburgess75/FeedPoint`) is a **standalone project** — it has
no relationship to FlockOff or any other repository. All work happens here.

## What FeedPoint is

A single-file, fully offline antenna calculator and wire-antenna knowledge app
for the ham bands, 160–6 m, styled on Macro's dark theme.

## Repository state (as of 2026-08-03, branch `claude/project-setup-ywd1x6`)

| Path | What it is |
|---|---|
| `feedpoint.html` | **The implementation** — the owner's v2 draft plus the v1 port items and an enterprise-shell pass (see below). Working; verified headless with a 29-check functional suite (navigation, formatting, import validation, undo, persistence, responsive breakpoints), zero console/page errors. ~220 KB. |
| `README.md` | The public-facing README: hero, live-app button (GitHub Pages), tour, verdict-engine explainer, formulas, dev guide. **The owner's original spec README was never pushed to this repo and is not recovered** — this HANDOFF now carries the conventions that survived. |
| `HANDOFF.md` | This file. |
| `tests/app.test.mjs` | Headless functional suite (35 checks), run by CI on every PR. |
| `.github/workflows/ci.yml` | GitHub Actions: runs the suite headless. |
| `.github/workflows/pages.yml` | GitHub Actions: deploys `feedpoint.html` as `index.html` to GitHub Pages on push to `main` (self-enabling). |
| `docs/` | README assets: screenshots (`hero/wire/mobile.png`) and brand SVGs (`mark`, `open-app` button, `palette`). |

History note: a prior session produced a "v1" implementation and the owner's
spec README on a branch (`claude/feedpoint-repo-afu64a`) that was never pushed
to this repository. Neither file exists here. The owner's v2 draft was uploaded
directly in chat and is now `feedpoint.html`. Its four base64 font payloads
could not be copied byte-perfect from a chat message, so they were re-embedded
from freshly downloaded latin-subset variable woff2s of the same four families
(Inter var, Roboto Mono var, Playfair Display var, Chakra Petch 700).
Everything else — markup, CSS, JS — is the owner's verbatim.

## Release notes

**`v2026.08.20.002` — dock sits lower:** the floating dock stacked 12px on
top of the home-indicator inset, leaving it hovering ~46px off the bottom
on iPhones. Now `bottom:max(env(safe-area-inset-bottom),8px)` — it hugs
the safe area directly (34px on notched iPhones, 8px floor elsewhere) and
mobile toasts follow it down.

**`v2026.08.20.001` — versioning corrected:** the version string is meant
to be the release date plus that day's revision, but the `2026.08.03` date
had been carried forward across two and a half weeks of releases. From here
the date is the owner's local calendar day (US Central) and the revision
resets to `.001` each day. No functional changes beyond the number itself
(pill, footer, backup `build`, stamped service worker).

**`v2026.08.03.023` — header fits every phone:** the share button had tipped
the header past narrow viewports (the app grid's `1fr` columns carry an
implicit `auto` minimum, so the column refused to shrink below the header's
natural width and the buttons slid off-screen). All three `#app` grid
column definitions now use `minmax(0,1fr)`; on mobile the brand group
flexes and the version pill truncates with an ellipsis before the
share/AA/theme buttons can be pushed off. Verified 320–430 px.

**`v2026.08.03.022` — Circuit theme:** third theme in the toggle rotation
(Macro Dark ☾ → Daylight ☀ → Circuit ⚡ → …), from the owner's "Keep React"
ad reference: deep navy surfaces, neon lime `#C6F135` accent, electric-blue
data colors, teal-leaning success so verdicts don't fight the lime. The
header λ chip goes lime/navy under Circuit only. Pre-paint stamp, settings
persistence, and meta theme-color all handle the third value; theme cycling
is table-driven now (`THEME_NEXT`/`THEME_GLYPH`), so a fourth theme is a
CSS block + two table entries.

**`v2026.08.03.021` — share button:** new header button (left of AA) that
shares the canonical live URL. Uses the native share sheet
(`navigator.share` — text, email, AirDrop, whatever the OS offers); on
browsers without it, copies the link to the clipboard with a toast. Always
shares the live-site URL even when running from a local file, so the
recipient lands on the installable PWA.

**`v2026.08.03.020` — iOS safe area:** when installed to the home screen
(`viewport-fit=cover` + translucent status bar) the header sat under the
iPhone status bar/notch, so its buttons couldn't be tapped. The topbar now
pads down by `env(safe-area-inset-top)` (grid row `60px`→`auto`, min-height
includes the inset because of border-box), and the update banner drops
below it too. Desktop/Safari-browser layout unchanged (inset is 0 there).

**`v2026.08.03.019` — v13 brand, owner's pick:** flat pale sky `#9FDEFF`
tile with LED amber `#FF9500` λ/grid/rule (option 2 of the pale-sky × LED-
amber board — no gradients). Rolled out everywhere: touch/512 icons (v13
URLs for iOS cache-busting), favicons + .ico, inline SVG favicon, mark.svg,
open-app.svg, header `.mark` chip, mask-icon tint, manifest, sw.js ASSETS,
Pages staging/verify.

**`v2026.08.03.018` — update notifications (FlockOff methodology):** the
service worker now carries a `__BUILD_VERSION__` placeholder that the Pages
workflow stamps with `APP_VERSION` at deploy time, so every release ships a
byte-different worker — no more manual cache-name bumps in `docs/sw.js`.
An updated worker *waits* (no skipWaiting on install); the page detects the
waiting worker and shows an in-app banner ("A new version of FeedPoint is
ready" + **Update now**), which posts `SKIP_WAITING` and reloads on
`controllerchange`. `reg.update()` runs on load and whenever the tab becomes
visible, so installed-PWA users hear about updates without an app-store.

**`v2026.08.03.010` — header & wire range:** clocks removed from the header
at the owner's request (theme + AA buttons now sit alone on the right); the
random-wire check now includes 160 m (6 m still excluded) — short wires get
an honest SHORT verdict there, and long-wire verdicts account for topband.

**`v2026.08.03.005` — the full roadmap:** log↔calculator loop (load any
entry back into its view; per-entry notes saved debounced; print a single
entry as a clean black-on-white cut sheet via `@media print` + `.print-one`
body class); K-factor preset chips (bare 0.95 / insulated 0.91 / inverted-V
0.92) synced to the K input; ITU region band plans (R1/R2/R3 seg next to
Bands — R1 narrows 160/80/60/40/6 m, R3 widens 80 m to 3.9 and narrows 40 m;
verdicts and centers all recompute; persisted in settings and backups);
per-band cut memory (orange dot on band rows with cuts in the log, `band`
field stored on cut entries, `f`/`k`/`ft` stored for load-back); coil winding
calculator in view 03 (Wheeler air-core closed-form turns solve +
ferrite-toroid turns from A·L, values from the Amidon tables); PWA
(manifest.webmanifest + network-first sw.js + icon-512, all deployed to the
site root; SW registers only over https so the single-file story is
untouched). Suite: 53 checks.

**`v2026.08.03.004` — brand & home-screen:** new "feed point" mark (center-fed
dipole: two wire halves, feed dot bridging the gap, feedline drop, radiating
arc) replacing the zigzag, applied to the topbar, SVG data-URI favicon,
`docs/mark.svg`, and the README button; `docs/apple-touch-icon.png` (180×180)
deployed to the site root by the Pages workflow so iPhone add-to-home-screen
gets a proper icon, plus iOS web-app meta (standalone, black-translucent,
titled FeedPoint). **`v2026.08.03.003`:** version pill always visible in the
header, including mobile (tightened mobile topbar to fit).

**`v2026.08.03.002` — correctness & trust:** band-span wire verdicts with a
nearest-spike-free suggestion chip; save buttons report "Session only" plus an
error toast when IndexedDB is unavailable instead of a false "Saved"; log
titles/items are HTML-escaped at render (imported backups are untrusted
input); the functional suite (35 checks) now lives in `tests/app.test.mjs`
with GitHub Actions CI (`.github/workflows/ci.yml`) running it on every PR.

## v1 port checklist — DONE (2026-08-03, `v2026.08.03.001`)

All four lost-v1 features were re-implemented:

- ✅ Import validation is case-insensitive and accepts `feedpoint` and legacy
  `halfwave` app names in any casing
- ✅ Toast notifications (aria-live `polite` region) for import/export/delete
  feedback — save buttons keep their flash feedback
- ✅ Proven-length chips render converted (e.g. `7.8 m`) in meters mode and
  set the input in the active unit
- ✅ Fractional inches (¼/½/¾, nearest quarter) in imperial formatting,
  both live results and saved log entries

The same pass added an enterprise shell: labeled sidebar grouped
Workbench / Reference / Records (collapses to icon rail 801–1079px, mobile
dock below), numbered key badges matching the 1–6 shortcuts, `APP_VERSION`
constant stamped in the topbar pill + sidebar footer + backup JSON (`build`
field), a storage-health dot in the sidebar footer, and delete-with-undo on
log entries.

Things the current file already has (don't regress them): hash-based navigation surviving reload, numbered view tags (01–06)
with serif Playfair titles, per-card SVG icons and contextual notes, 49:1
recipe as 2:14-turn autotransformer with QRP/100 W build table and core cheat
sheet (FT50→2×FT240), expandable spec-sheet log rows with per-entry × delete,
save-button flash feedback, storage-health note detecting sandboxed IndexedDB,
independent per-context unit toggles, and a wire check that covers 160-10 m
(6 m excluded) and adds a SHORT verdict below a half wave.

**Verdict-formula note:** within 7% of an integer half-wave multiple = AVOID,
within 15% = MARGINAL. Since `v2026.08.03.002` this is computed across the
whole band span (lo–hi, worst case), not just band center — a wire clear at
center can still spike at a band edge, so verdicts got stricter, not looser.
Some of the eight "proven" lengths flag AVOID on a band or two (71 ft and
84 ft do, once edges are honored) — that is the formula being honest, not a
bug. Don't "fix" it by loosening thresholds without the owner's say-so.
When a length has an AVOID band, the app offers the nearest "spike-free"
length (no AVOID anywhere; no-MARGINAL-anywhere is unsatisfiable past ~13 ft).

## Conventions

- **One file.** No build step, no CDN, no runtime dependencies. Fonts embedded
  as base64 woff2 (latin subsets keep the file ~215 KB).
- **Storage:** raw IndexedDB, db `feedpoint`, one `kv` store, keys `settings`
  and `log`. Wrap every access; degrade gracefully when sandboxed.
- **Backups:** JSON `{app, version, exported, settings, log}`; import
  validates shape and accepts legacy `halfwave` backups.
- **Versioning:** `v2026.08.20.001` style — the OWNER'S LOCAL DATE
  (US Central) + 3-digit revision of the day, resetting to `.001` each new
  day. The date must be the day the release actually ships — do NOT carry
  yesterday's date forward. (Releases `.004`–`.023` were all mislabeled
  `2026.08.03` while actually shipping Aug 3–20; corrected from
  `v2026.08.20.001` on.)
  Stamp it in the UI and in backup JSON.
- **Design tokens:** Macro Dark. Accent `#FF8600`, warm near-black `#050403`
  base, 0.5px hairlines, orange left-bar + fading tint band on
  headers/selected rows, `color-scheme: dark` at the root.
- **Accessibility floor:** 16px base, secondary text ≥ `#9D9793`, 48–52px
  touch targets, visible focus rings, reduced-motion respected.
- Formulas (feet, f in MHz): half-wave `468/f` · quarter `234/f` · loop
  `1005/f` · 5/8 `585/f` · counterpoise `0.05×984/f` — all × `K/0.95`.

## Ideas parked for later

Per-band cut memory keyed to the log, coil/inductor winding calculator,
printable cut sheet from a log entry, PWA manifest + service worker.

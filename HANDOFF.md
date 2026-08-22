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

**`v2026.08.20.013` — home-indicator clearance in stretched standalone:**
.012 put the installed app's footer on the physical bottom, but the owner
reported it a "little too far": when iOS under-reports the standalone
viewport it ALSO reports `env(safe-area-inset-bottom)` as 0, so the
stretched bar's buttons rode ~30pt low, into the home-indicator zone.
`fit()` now stamps `data-stretched="1"` whenever the screen-height stretch
actually applies, and CSS gives the footer
`padding-bottom:max(calc(env()+6px),40px)` in that state only — the real
`env()` still wins wherever it reports, browsers and honest standalone
keep the slim padding. Tests assert 40px when stretched, 6px otherwise.

**`v2026.08.20.012` — standalone fills the physical screen:** two owner
`#debug`/screenshot reports after .011: in Safari the footer is now
pixel-perfect (`footer vs visualVP = 0`; the space below is Safari's own
URL bar, unreachable by any page). In the INSTALLED app a ~44pt black band
remained at the bottom: iOS under-reports every readable viewport height
in standalone by roughly the status-bar area, anchoring the app at the top
and leaving the shortfall at the bottom. Since the standalone web view
covers the entire screen, `fit()` now also considers the physical screen
dimension — `data-display="standalone"` only, orientation-guarded because
iOS keeps `screen.*` in portrait terms. A browser must never do this (the
footer would land under its toolbar — the original bug), and a regression
test asserts both directions.

**`v2026.08.20.011` — the dead band below the footer, finally diagnosed:**
an owner screenshot showed the footer drawn correctly but with a ~85px band
of page background BELOW it. Cause: iOS exposes several viewport heights,
and the smallest — the layout viewport, sized as if the browser toolbar
were showing — is what `position:fixed` and (at some moments)
`visualViewport.height` resolve to. With the toolbar collapsed the screen is
taller than that, so the app box ended short and the strip showed through.
Every prior attempt (.002/.004/.005/.006/.008/.009/.010) moved the footer
WITHIN that short box, which is why none of them fixed it.
Fix: `fit()` now takes the LARGEST of `visualViewport.height`,
`documentElement.clientHeight` and `window.innerHeight`, so the app always
fills what the user can see; the footer keeps `env(safe-area-inset-bottom)`
padding in every mode so its buttons stay clear of the home indicator
(the browser-mode 6px override is gone). It also re-measures at
DOMContentLoaded, load, rAF and 150/500/1200ms, because a height read during
launch can be stale and iOS does not always fire a resize afterwards.
Regression test reproduces the exact condition (visualViewport stubbed to
report 760 on an 844 screen) and asserts zero gap below the footer.

**`v2026.08.20.010` — measure the viewport instead of guessing at it:**
`.009` (dvh) still did not satisfy the owner. Rather than a ninth CSS
assumption about iOS, the app now sizes itself from `window.visualViewport`
— the browser's own report of the area the user can actually see, which
excludes browser toolbars. A pre-paint script sets `--app-h` from
`visualViewport.height` and re-measures on its `resize`/`scroll`,
`orientationchange` and `pageshow`; `html,body{height:var(--app-h,100dvh)}`
with `100%` beneath. Skipped while a field is focused (the keyboard shrinks
the visual viewport) and while pinch-zoomed (`scale != 1`), where the
reading is not a layout size.
**New: `#debug` diagnostics.** Opening the app with `#debug` (or `?debug`)
overlays what the DEVICE measures: mode, innerHeight, visualViewport
h/w/offset/scale, `--app-h`, dvh support, safe-area insets, footer
top→bottom, and the two deltas that matter — `footer vs innerH` and
`footer vs visualVP`. **`footer vs visualVP` should read 0.** Tap to close;
also opens on hashchange in an already-loaded app. This exists because the
headless suite cannot see browser chrome — it is how a device report gets
settled in one screenshot instead of another guess.

**`v2026.08.20.009` — the footer fix that actually addresses the cause:**
review of .008 surfaced that converting the dock to an in-flow row did NOT
move it. `html,body{position:fixed;inset:0}` resolves against the initial
containing block — the same box a `position:fixed;bottom:0` dock used — so
old and new sat on the identical pixel. With `viewport-fit=cover` that edge
is the PHYSICAL screen bottom, which in Safari lies behind the browser
toolbar. Fix: `@supports(height:100dvh){html,body{height:100dvh}}` — height
wins over `inset`'s `bottom:0`, so the app box ends at the DYNAMIC viewport
bottom (excludes browser chrome, re-resolves as the toolbar minimizes).
`height:100%` remains the fallback. If dvh reflow reintroduces scroll
wobble on iOS, switch to `svh`.
Also from the review: removed the dead `#dock::after` slab (clipped since
the dock left fixed positioning) and its now-false comment; corrected the
`.verpill` comment (it no longer ellipsis-truncates — `.brand` wraps);
dropped a no-op duplicate `#topbar{align-items:center}`.
Tests: the "never truncated" pill check was near-vacuous (compared
`scrollWidth` to border-box width) — replaced with a Range-measured text
vs. content-box comparison plus right-edge assertions at 400px AND 320px;
restored the deleted `data-display` / browser-pad coverage; added a
simulated-inset layout guard and a `100dvh` source assertion.
**Known limit:** headless Chromium has no browser chrome, so no test here
can prove the footer clears a real Safari toolbar. Device check is manual.

**`v2026.08.20.008` — footer is a real footer; header stops overflowing:**
the root cause of both complaints. The dock was a `position:fixed` overlay,
which on iOS argues with browser chrome and the home indicator no matter
how it is padded — five releases of padding tweaks never fixed it. It is
now an **in-flow grid row** of `#app` (`grid-template-rows:auto minmax(0,1fr)
auto`, `#dock{position:relative}`): since `html,body` are pinned to
`inset:0`, row 3 IS the physical bottom of whatever area the browser grants
the page. `#main` bottom padding drops 130px→28px (nothing to clear now).
Header: `-webkit-text-size-adjust:100%` stops iOS inflating small text (a
silent cause of on-device overflow that desktop testing cannot reproduce),
and the version pill is `flex:none` with `.brand{flex-wrap:wrap}` — the
full build string is now guaranteed readable at every width, wrapping to a
second line rather than ever truncating. (Correction: the .008 note claimed
simulated-inset verification that existed only as a manual check — .009 adds
it to the suite.)

**`v2026.08.20.007` — v15 icons + full audit:** icons redone per the owner
(solid `#C6F135` tile, navy λ only — no grid/frame/rule) across favicons,
touch/512 v15 URLs, mark.svg, open-app.svg, and the header chip. Then a
two-reviewer audit; every confirmed finding fixed:
- **bandOffset false-CLEAR (serious):** only the band endpoints were
  rounded, so a multiple lying strictly inside a wide band was missed —
  423 ft was called CLEAR on 10 m while sitting exactly on the 26th
  half-wave in-band. Now any integer inside [mLo,mHi] → off 0. The proven-
  lengths chips are filtered through the corrected math (41/58/107 ft
  survive across 160–10 m).
- **Import soft-brick:** malformed backup items crashed logRender at boot;
  items are validated element-wise and boot's logRender is guarded (bad
  stored log → fresh log + honest toast).
- Keyboard view shortcuts no longer fire from TEXTAREA/SELECT; export now
  round-trips wireSel; K factor clamped to 0.5–1.1; recommendation ±range
  clamped to the true window; metric chip/suggestion values set with 2
  decimals so a spike-free pick stays spike-free; DB.set settles on
  transaction abort; loadEntry survives titleless entries; stale
  "nearest spike-free" chip actually hides ([hidden] beat by .chips rule);
  #updateBar hidden in print; visible focus on inputs/selects/textareas;
  hardcoded Macro-orange borders (btn/updateBar/feature card) now
  theme-accent; Daylight accent + muted text and Circuit --c4 darkened/
  lightened for AA contrast; mobile verpill override finally applies
  (base rule later in source was winning — now .brand .verpill) so the
  full version string fits on phones.
Known-not-fixed (documented): AA text-size doesn't scale header/dock
chrome; uiscale 3 on ≤320px can pan horizontally (cards min 265px);
Daylight band/card icon strokes are dark-theme hues; sub-44px targets on
header buttons and log delete.

**`v2026.08.20.006` — footer knows where it's running:** the pre-paint
script now stamps `data-display="standalone"|"browser"` (from
`navigator.standalone` / `display-mode: standalone`). In a browser the
footer drops the home-indicator inset (6px pad) — the browser's own chrome
guards that zone, so the buttons sit as low as the browser allows. The
installed app keeps the full inset. Hard limit worth remembering: Safari's
minimized-toolbar strip is browser chrome; no page content can occupy it —
only the installed home-screen app is truly edge-to-edge.

**`v2026.08.20.005` — footer reads flush in Safari too:** in-browser
Safari reserves a strip at the bottom for its minimized toolbar; a page
cannot place content there, but Safari shows the page's background behind
it — which read as a navy gap under the footer. A `#dock::after` slab now
paints 200px of chrome color below the bar: offscreen (invisible) in the
installed app, and filling the behind-toolbar strip in Safari so the
footer visually reaches the physical bottom. The installed home-screen
app was already flush.

**`v2026.08.20.004` — footer tab bar:** the mobile floating dock island is
now a full-width footer flush to the bottom edge — hairline top border,
buttons spread evenly, and the home-indicator inset padded INSIDE the bar
so its background runs under the indicator like a native tab bar.

**`v2026.08.20.003` — v14 icons, Circuit lime:** the whole icon set redone
in the Circuit accent at the owner's request — lime `#C6F135` tile, deep
navy `#08111F` λ/grid/rule, matching the in-app chip. Applies to desktop
favicons (16/32/.ico + inline SVG), touch/512 icons (fresh v14 URLs for
iOS cache-busting), manifest, sw ASSETS, mask-icon tint, mark.svg,
open-app.svg (lime button, navy chip), and the header `.mark` chip in
every theme (the Circuit-only chip override is gone — it's the default
now).

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

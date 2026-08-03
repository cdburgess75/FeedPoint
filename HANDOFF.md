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

Things the current file already has (don't regress them): dual UTC + local
clocks, hash-based navigation surviving reload, numbered view tags (01–06)
with serif Playfair titles, per-card SVG icons and contextual notes, 49:1
recipe as 2:14-turn autotransformer with QRP/100 W build table and core cheat
sheet (FT50→2×FT240), expandable spec-sheet log rows with per-entry × delete,
save-button flash feedback, storage-health note detecting sandboxed IndexedDB,
independent per-context unit toggles, and a wire check that skips 160 m/6 m
and adds a SHORT verdict below a half wave.

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
- **Versioning:** `v2026.08.02.001` style — date + revision of the day.
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

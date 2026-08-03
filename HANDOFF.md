# FEEDPOINT — Session Handoff

Read this first if you are picking up work on FEEDPOINT in a new session.
This repository (`cdburgess75/FeedPoint`) is a **standalone project** — it has
no relationship to FlockOff or any other repository. All work happens here.

## What FEEDPOINT is

A single-file, fully offline antenna calculator and wire-antenna knowledge app
for the ham bands, 160–6 m, styled on Macro's dark theme.

## Repository state (as of 2026-08-03, branch `claude/project-setup-ywd1x6`)

| Path | What it is |
|---|---|
| `feedpoint.html` | **The implementation** — the owner's v2 draft, adopted directly. Working; smoke-tested headless (title, hash navigation across views, all four embedded fonts load, zero console/page errors). ~216 KB. |
| `README.md` | Short project description. **The owner's full product spec README was never pushed to this repo and is not recovered** — if the owner still has it, restore it here; it was the contract for scope and design. |
| `HANDOFF.md` | This file. |

History note: a prior session produced a "v1" implementation and the owner's
spec README on a branch (`claude/feedpoint-repo-afu64a`) that was never pushed
to this repository. Neither file exists here. The owner's v2 draft was uploaded
directly in chat and is now `feedpoint.html`. Its four base64 font payloads
could not be copied byte-perfect from a chat message, so they were re-embedded
from freshly downloaded latin-subset variable woff2s of the same four families
(Inter var, Roboto Mono var, Playfair Display var, Chakra Petch 700).
Everything else — markup, CSS, JS — is the owner's verbatim.

## Features from the lost v1 worth re-adding (port checklist)

v1 had a few things the current file lacks. Treat these as candidate
improvements, not obligations:

- Import validation that also accepts legacy `app:"halfwave"` backups **and**
  `app:"FEEDPOINT"` casing (current file accepts `feedpoint`/`halfwave`;
  unify the accepted set)
- Toast notifications (aria-live region) for log/import feedback
- Proven-length chips shown converted when in meters mode
- Fractional inches (¼/½/¾) in imperial formatting

Things the current file already has (don't regress them): dual UTC + local
clocks, hash-based navigation surviving reload, numbered view tags (01–06)
with serif Playfair titles, per-card SVG icons and contextual notes, 49:1
recipe as 2:14-turn autotransformer with QRP/100 W build table and core cheat
sheet (FT50→2×FT240), expandable spec-sheet log rows with per-entry × delete,
save-button flash feedback, storage-health note detecting sandboxed IndexedDB,
independent per-context unit toggles, and a wire check that skips 160 m/6 m
and adds a SHORT verdict below a half wave.

**Verdict-formula note:** within 7% of an integer half-wave multiple = AVOID,
within 15% = MARGINAL, computed at band center. Some of the eight "proven"
lengths still flag AVOID on a band or two (e.g. 71 ft on 12 m lands at
3.78×λ/2) — that is the formula being honest, not a bug. Don't "fix" it by
loosening thresholds without the owner's say-so.

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

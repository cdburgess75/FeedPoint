# FEEDPOINT

A single-file, fully offline antenna calculator and wire-antenna knowledge app
for the amateur radio bands, 160–6 m, styled on the Macro dark theme.

**To use it:** open [`feedpoint.html`](feedpoint.html) in any modern browser.
No install, no build step, no network — everything (including fonts) is
embedded in the one file. Saved settings and the cut log persist locally via
IndexedDB; backups export/import as JSON.

## What's inside

- Wavelength calculators — half-wave, quarter-wave, full-wave loop, 5/8-wave,
  counterpoise — with adjustable velocity factor (K), per-band presets, and
  imperial/metric unit toggles
- A 49:1 EFHW transformer build recipe (2:14-turn autotransformer) with
  QRP/100 W build table and toroid core cheat sheet
- Random-wire length checker with AVOID/MARGINAL verdicts against half-wave
  multiples, plus proven non-resonant lengths
- A persistent cut log with export/import backup
- Dual UTC + local clocks, hash-based navigation, dark theme throughout

Core formulas (feet, f in MHz): half-wave `468/f` · quarter `234/f` · loop
`1005/f` · 5/8 `585/f` · counterpoise `0.05×984/f` — all scaled by `K/0.95`.

See [`HANDOFF.md`](HANDOFF.md) for project history, conventions, and the
current work checklist.

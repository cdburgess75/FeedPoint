# FEEDPOINT

Antenna calculator and wire-antenna knowledge app for the ham bands, 160–6 m. One HTML file, fully offline, styled on Macro's dark theme. Where every antenna decision starts.

## What it does

FEEDPOINT is six views behind an icon rail (desktop) or floating dock (mobile), switchable with keys 1–6:

1. **Element calculator** — Enter a frequency or tap a band row (160m–6m, with band edges and centers). Returns cut lengths for the EFHW/half-wave, dipole per leg, quarter-wave vertical, 0.05 λ counterpoise, full-wave loop, and 5/8-wave vertical, in feet-and-inches or meters, with an adjustable K factor for insulation and height effects.

2. **Random-wire check** — Enter a wire length and see, per band, whether it lands on a half-wave multiple (impedance spike a 9:1 can't tame). Verdicts are CLEAR / MARGINAL / AVOID, with tappable proven lengths (25.5, 35.5, 41, 58, 71, 84, 107, 119 ft).

3. **Ununs & baluns** — Expandable build recipes for the 1:1 common-mode choke, 4:1 Guanella, 9:1 trifilar, and 49:1 autotransformer: cores, turns, power ratings, plus a mix-43 / mix-61 core cheat sheet.

4. **End-fed antennas** — EFHW and EFRW deep dives: harmonic band tables, the ~34 µH loading-coil trick for 80 m on a 67 ft wire, counterpoise sizing, and choke placement.

5. **Field notes** — The stuff datasheets skip: unun vs balun, doublet feeding, heat-equals-loss, enclosure practice, NVIS, and FT8 duty-cycle derating.

6. **Build log** — Snapshot the current cuts or a wire check with one tap. Entries persist in IndexedDB and survive restarts. Export a dated JSON backup; import restores and reports the entry count.

Settings (units, K factor, last frequency, last wire length) persist automatically.

## Formulas

Half-wave 468/f · quarter-wave 234/f · full-wave loop 1005/f · 5/8-wave 585/f · counterpoise 0.05 × 984/f. All scaled by K/0.95, f in MHz, output in feet. The wire check computes wire ÷ (468/f) per band; within 7% of an integer multiple is AVOID, within 15% is MARGINAL. These are starting points — final trim belongs to the analyzer.

## Architecture

Single-file, offline-first, zero dependencies at runtime. Vanilla HTML/CSS/JS — no framework, no CDN, no build step. The reactive surface is small enough that a dozen event listeners beat shipping Vue.

Storage is raw IndexedDB (~25 lines, no idb-keyval), database `feedpoint`, one `kv` object store holding `settings` and `log`. Everything storage-related is wrapped so the app degrades gracefully where storage is sandboxed. Backups are plain JSON (`{app, version, exported, settings, log}`); import validates the shape and accepts legacy `halfwave` backups.

Fonts are embedded as base64 woff2 so typography survives with no network: Inter Variable (UI), Roboto Mono Variable (data), Playfair Display Variable (display serif), Chakra Petch 700 (wordmark). Total file ~215 KB.

## Design system

The theme is Macro's shipped "Macro Dark" from their open-source repo (macro-inc/macro, `apps/web/src/features/theme/constants.ts`), warmed to match their marketing artwork and lightened one step for readability.

| Token | Value | Role |
|---|---|---|
| a0 | `#FF8600` | accent orange — oklch(0.75 0.20 59°), verbatim from Macro |
| a1–a4 | `#CFAD00` `#62CA40` `#00D4B0` `#00C7FF` | icon hue ramp (accent hue +40° steps) |
| b0 | `#050403` | page (warm near-black) |
| b1 / b2 | `#171310` / `#241E1A` | panel / hover |
| b4 | `#3B342F` | hairline edges (0.5px borders, Macro's signature) |
| c0–c4 | `#F7F0EC` → `#857F7B` | warm cream ink ramp |
| status | `#2FC898` `#F5B93B` `#F26D6D` | CLEAR / MARGINAL / AVOID |

Signature elements: the orange left-bar + fading tint band on view headers and selected rows (the "like MACRO" highlight from the ad), inbox-style rows with tinted icon tiles cycling the accent ramp, a live UTC clock in the top bar, and `color-scheme: dark` declared at the root so nothing ever paints white.

Accessibility floor: 16px base type, secondary text no dimmer than `#9D9793`, 48–52px touch targets, visible focus rings, reduced-motion respected.

## Files

- `feedpoint.html` — the entire app; copy it anywhere, open it in any browser
- `feedpoint-backup-YYYY-MM-DD.json` — user-generated backups from the Build log view

## Ideas for later

Per-band cut memory keyed to the log, a coil/inductor winding calculator (turns for a target µH on common cores), printable cut sheet from a log entry, and PWA manifest + service worker if home-screen install ever matters.
Versioning like this v2026.08.02.001 (date and revision of the day).

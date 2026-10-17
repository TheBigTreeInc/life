# ADR-0057 — Closing-week food traces, goal presets and locale isolation

**Status:** Accepted

## Context

The 0.5.56 game charges the prior week’s living requirements from `newWeek()` after incrementing the week counter. The existing engine satisfies the compatibility rule, but a week-associated food trace must identify the week actually closed. Short matches should not be prolonged by artificial animation or changing historic mechanics. Browser-local language may differ between Looprd peers.

## Decisions

1. Capture `closedWeek` once at the weekly boundary and supply it to a pure, bounded Classic food-step reducer. Keep the old exact pantry/hunger/happiness deltas, source event order and 0.5.56 food-spoilage switch. Record additive `food-week-close` telemetry in the existing bounded event history, leaving RNG unchanged. The trace is diagnostic, not proven DOS food-inventory parity.
2. Game length is represented by user-selectable four-goal targets (Quick 30, Standard 50, Extended 75, Custom sliders). Use existing goal and rival difficulty logic; no new time or network/save fields. Existing saves continue to load.
3. Locale EN/NL is stored under a separate browser key, not in multiplayer snapshots. Translate the initial setup controls and goal captions through key-based dictionaries with English fallback. Do not localize authoritative engine result strings in this iteration.
4. `looprd.yaml` release advances only because existing verifier binds metadata to package version; component routes/schemas unchanged. Operator controls upload/push.

## Verification

- `tests/life-pass-057.test.cjs` covers pure reducers, preset equality, fallbacks and engine/source wiring.
- `tests/classic-weekly-source-order.test.cjs`, `tests/home-return-rules.test.cjs`, `tests/house-rules-weekly.test.cjs` prevent regressions to Classic events, forced home and rules.
- `node tools/verify.mjs` regenerates `PLAY.html` and tests full source; `tools/package-ziprunner.py` packages complete source.

## Open work

DOS original food RNG/inventory IDs, actual target-pacing benchmark in weeks, full gameplay localization, browser smoke and live Looprd host/guest testing remain open.

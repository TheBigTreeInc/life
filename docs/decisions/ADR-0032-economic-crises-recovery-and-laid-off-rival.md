# ADR-0032 — Economic crises, weekly event phase, and laid-off Jones

**Status:** Accepted  
**Date:** 2026-10-13  
**Release:** 0.5.31

## Context and verified source

The user's original DOS Pass-2 research (`docs/reference/original-dos-pass2/weekly_events.json`, `PASS2_MECHANICS.md`) traces `startTrn.sc:596–775` into the downturn headline and per-player `doScandal(strength)` branch. At severity 1, bank balance becomes zero and employed workers are dismissed. At severity 2, employed workers use a binary draw to select dismissal or hourly wage truncated to 80%, minimum $1. Dismissals cost 7 happiness; wage cuts cost 3. The complete event trigger probability, exact macro-market relation, and happiness/stock interaction for recovery are not verified.

## Decision

1. Model source-supported crisis **results** in a pure `ClassicEconomicEvents.scandal` reducer; let `LifeGame` apply outcomes and journal losses for all Classic participants. Modern never invokes this reducer.
2. Use an isolated provisional weekly classifier, driven by the shared 8-domain general index. It emits stable/downturn/recovery/boom, generates rare shocks under negative signals, and enforces a serialized cooldown. These **probabilities and thresholds are not Sierra claims**.
3. Keep savings and salaried contracts intact outside actual crisis events; log crises as auditable, seed-replayable transactions. Recession events add modest food reserves to Jones's *advisory* planning.
4. Close the unemployed ACNE–market routing loop: after Jones travels to ACNE, consider a qualified application first, before the food-market branch. Keep original place IDs and travel graph.
5. Add a strictly validated optional `classicEconomicPulse` snapshot field. Old Classic saves initialize a neutral cycle at their saved week. Loading has zero event side effects; reject malformed/future cycle fields. Clone imported players so separate local/Looprd restorations do not share mutable objects.

## Tests and tradeoffs

- Pure source-state severity 1/2 branch tests, deterministic RNG/cooldown, bounded validation, incident journaling, save migration/replay, AI office application and Modern isolation run under `tests/classic-economic-events.test.cjs`.
- Quantitative 60-week campaigns tolerate exceptional hardship/final-week layoffs from source-backed shocks. Avoid adapting the AI to perfectly win every crisis by inventing income.
- Future: derive exact SCI trigger frequencies, investment-sensitive headline effects, original event order and interest/garnishment using emulator traces. Do not claim exact parity until those traces are available.

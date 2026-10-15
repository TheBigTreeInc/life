# ADR-0030 — Pass-2 source-driven Classic economy, lottery, and opponent rules

**Status:** Accepted (v0.5.29)  
**Evidence:** user-provided `jones-dos-original-mechanics-pass2` reference for DOS 1.000.060; published version-matched SCI decompilation, **not** a DOS emulator trace or bytecode equivalence guarantee.

## Decision

Use a small, independently tested Classic rules module for the `n109.sc` adjusted goods price and split multiplication, `startTrn.sc` lottery tiers, `rentOffice.sc` d12 extension probabilities, and `n108.sc` partial wage truncation. Human player and Classic rival consume the *same live price quotes* and route registry. Fixed-cost purchases are exempt from price-index scaling. Consumer price index starts at 100 and moves with a deterministic provisional weekly drift while full `EconomicIndex` port is pending. Do **not** silently rebalance saved wages to DOS base pay at this stage.

The classic opponent adds **ordered, source-tagged, nonmutating** branches for unemployment/ACNE, rent, bank withdrawals, food, workwear, and emergency wages. These precede the existing career/education planner. Logging includes the original branch identifier, `placeNum`, actual outcome and an estimate in route ticks; predicted ticks are an AI planning metric, not proven actual travel action hours. Branches omitted from the recovery remain explicit fallback heuristics.

Keep Classic-only state for `classicGoodsIndex`, `classicWeekEvents` (96 entries), `classicDecisionTrace` (64). `LifeGame.load` assigns safe defaults to legacy saves and validates inbound journals. Modern pricing and progression remain independent. No new remote endpoints or board graphics.

## Known differences

- The exact original multi-index trend dependencies, salary adjustment, 16-bit overflow, lottery event ordering relative to all start-turn effects, and rent debt garnishment implementation are not implemented.
- Original work-stat increments for late partial shifts may differ from the existing accumulated six-unit credit model; this is deliberately not migrated until interaction timing has emulator confirmation.
- Original AI has 38 recovered representative tags (and more unextracted branches). Only the core emergency subset is ported as a traceable precedence layer; career scoring remains a documented heuristic, not original DOS AI.
- AI hardship outcomes are allowed in stochastic simulations: we test bounded state, robust hiring and a minimum survival rate rather than asserting a guaranteed perfect opponent.

## Acceptance

`tests/classic-pass2-source.test.cjs`, 100 seeded Classic simulation checks, original source-reference model's 47 Python tests, full verification including offline/Pages build. The user can open the Classic Career Roadmap to inspect price index and recent rival tags. No silent update to Modern or existing role identities.

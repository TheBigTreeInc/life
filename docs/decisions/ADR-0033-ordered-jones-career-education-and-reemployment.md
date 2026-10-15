# ADR-0033 — Ordered Jones career, education and re-employment

**Status:** Accepted  
**Date:** 2026-10-13  
**Release:** 0.5.32

## Source provenance and unresolved details

The user-supplied DOS pass-2 `ai_branch_map.json` identifies first-match Jones branches 20 (work clothing), 28 (raise), 29 (promotion), 30 (work for experience/reliability), 32 / 37 (rest), 44 (education), and 46 (productive work). `WhereShouldIGo.sc` has many more branches and randomized gates. The source proves the branch identifiers, broad priorities and place-based movement; **it does not justify the exact thresholds chosen below**. Historic office = original place #6; university = #7; all actions use the existing 170-waypoint Classic travel oracle.

## Decision

1. Keep employment/rent/food/pawn emergencies first, and add a source-tagged ordered career decision family. The planner is pure and does **not** alter shared seeded RNG. Each chosen action remains subject to venue ownership, actual action enablement and available time; travelling to a venue does not award work, salary, or lessons automatically.
2. Salary branch 28 considers **actual contracted pay** and an attainable improved offer. Original engine requirements still determine whether the application or raise can occur. The AI waits for work history and a reasonable interval after the previous raise; **interval is provisional**.
3. Promotion branch 29 checks credentials, travel and required work clothing. Only a demonstrably higher offered rate than the existing contract is worthwhile; this avoids changing jobs at a lower salary during downturns. Experience branch 30 and work branch 46 maintain earning capacity.
4. Education branch 44 uses original source-linked diploma prerequisites and existing paid course enrollment, never bypasses credit/tuition costs, and respects an advisory two-week rent/food/uniform reserve. Course-selection payoff scoring and cadence are provisional.
5. Work clothing branch 20 checks **all qualifying attire tiers**, with a two-week expiry window. The previous casual-only check stranded the rival with expiring formal wear; renew before optional study. No gifts or artificial income are injected.
6. Record unemployed weeks and rejected applications per Classic player in optional additive save fields. On two weeks unemployed or two failed attempts, seek a qualifying **guaranteed-roll Cook occupation (#44)** first. Its guaranteed hiring roll does not waive degree/reliability/experience gates, four-hour application cost, or real board travel. Recovery threshold is provisional.
7. Modern gameplay and Looprd HTTP/WebSocket protocol remain unchanged. The same validated snapshot data reaches multiplayer clients; no new endpoint or player identity.

## Acceptance

`tests/classic-ai-career-recovery.test.cjs` asserts branch ordering, pure previews, source degree attendance, legitimate raise/promotion, early workwear replacement, 2-hour travel+action infeasibility, recovery selection, hiring resets, old-save migration and Modern isolation. Existing 100-seed 60-week survival/endurance scenarios must retain strict runaway-debt thresholds. ZipRunner's mandatory verifier includes the new tests and offline/Pages rebuild.

## Still open

DOS branch 1–50+ full priority ordering, original random gates, salary negotiation odds, exact study choice utility, precise travel-time conversion and macroeconomic wage mapping require DOS emulator replay. These numbers must remain explicitly approximate until measured.

# ADR-0019 — Classic goal points, Jones difficulty and employer-first office

**Status:** Accepted

**Decision:** Use documented Classic goal points and starting economy rather than placeholder wealth/education/career formulas. Preserve Modern Story economic simulation as an independent ruleset. Keep the game's stable 13-location IDs, transport actions and server schema unchanged.

## Confirmed source rules

- Classic player begins with $200 cash (DOS gameplay screenshots and a first-hand historical review). Starting bank savings are zero.
- Original goal statistic formulas are wealth = liquid assets ÷ 100, happiness = current Happiness, education = 1 + 9 × Degrees, career = 1.25 × Dependability when employed. Fulfilling all four independent thresholds is required.
- Classic opponent Jones receives goal budget +40 / 0 / −40 compared with the human's total goals for Take It Easy / Play Fair / Go For Broke. Original defaults sum to 200 goal points. Individual Jones goals are seeded and semirandom; exact Sierra RNG sequence is not available.
- Players can submit unqualified job applications and be rejected. Each original job is associated with an employer, so our UI selects employer first and offers optional future-job inspection. It does not change engine rejection logic.

## Implementation

- `src/engine.js` creates Classic $200/$0 players, maintains per-rival `classicGoals`, validates them in snapshots, and computes original-style score statistics separately from Modern.
- To match the documented difficulty budget, the rival allocator takes the player's 4 goals, adjusts the total by ±40 as applicable, and distributes changes in five-point steps; wealth is held within ±10 where possible, with deterministic tie-breaking via the saved game seed. Extreme budgets are clamped to 40–400. **This is not claimed to reproduce the exact Jones generator.**
- `src/setup-preferences.js` remembers default 50/50/50/50 and selected Jones difficulty locally; `src/app.js` exposes Classic-only difficulty, opponent budget UI, and employer selector.
- AI purchases replacement clothing before it runs out, to avoid a uniform/cash income deadlock under the corrected opening economy.
- No new Looprd model or DB column is needed; room snapshots include new engine settings and rival goals. Both client versions should match for live play.

## Unverified and future work

- Whether outstanding bank loans and unpaid rent count against original *liquid assets* and exact currency rounding.
- Exact Sierra Jones goal distribution and seeded randomness; save screenshots for each difficulty.
- The game's original point-of-turn win check versus our current checks after relevant actions.
- The original employer selection UI's detailed sorting, openings odds and failure wording.

## Reference sources

- https://jonesinthefastlane.fandom.com/wiki/Goals
- https://jonesinthefastlane.fandom.com/wiki/Jones
- https://jonesinthefastlane.fandom.com/wiki/Jobs
- https://jonesinthefastlane.fandom.com/wiki/Dependibility
- https://www.pcgamer.com/saturday-crapshoot-jones-in-the-fast-lane/

# ADR-0059 — DOS clock-end venue actions and evidence-first route accounting

**Status:** Accepted  
**Release:** v0.5.59  
**Scope:** Classic gameplay, Custom Classic optional house rule; no changes to Modern Story or Looprd endpoints.

## Evidence

- [Jones DOS turn account](https://jonesinthefastlane.fandom.com/wiki/Turn): Once the 60-unit clock is exhausted, the player may continue making *zero-time* transactions inside the current location (such as item purchases and bank deposits). A turn completes on leaving the location or when traveling after clock runs out. This community observation is stronger than our earlier guessed blanket prohibition; the original DOS executable should still be checked on venue-specific edge cases.
- `room1.sc timeKeep.doit` (ADR-0053) clamps the original explicit time charges at 60; `employment.sc` and `university.sc` show a nonzero entry/action requirement. The browser's 'hours remaining' is the inverse of the original elapsed counter.
- `docs/reference/original-dos-pass1/original_route.json`, source version **1.000.060**, documents the **170 original waypoints** and original 13 place indices. `WhereShouldIGo.sc` uses an AI *estimated* leg duration, `steps + 2 × global475`; it is **not** a human playable movement-time rule.
- No version-matched SCI procedure has been demonstrated that caps venue interactions at exactly ten. The former ten-action restriction was an undocumented interpretation, not justified as authentic DOS behavior.

## Decision

1. In Classic, zero-time **store and banking transactions** are allowed when `hours = 0`, subject to its usual location, stock, cash, eligibility and optional house-rule gates. All timed actions remain blocked. Job applications and raises with capped-at-zero nominal duration cannot begin at 0 remaining hours; university enrollment continues to require an active clock as a compatibility exception pending DOS evidence. Traveling to a different building at zero remaining hours remains blocked, while ending a week still uses the existing user-requested homeward rule; no implicit auto-advance is added to the server protocol.
2. The **ten venue actions** compatibility limit is moved into a new boolean per-game house rule `weeklyActionLimit`, off by default for both rule families; Modern ignores it. When enabled, Classic's previous ten-choice restrictions, including AI checks, are preserved. A 65,535 saturating diagnostic counter prevents unbounded snapshot values; old counters (0–10) are accepted, higher values up to the cap can now be restored.
3. In `classic-time.js` expose a **read-only** `routeClockScenario` built exclusively from original AI per-leg tick estimator and `timeKeep` frame counter. It explicitly reports `calibrated:false` to avoid mistaking model output for player travel-hour parity. The actual game travel quote, return-home charge and route animation remain unchanged.
4. Cover at least seven source-identified locations/routes with original indices, including reverse direction and Employment entry. Add regression tests for clock=0 transactions, custom limit, saves, stable scripted routing and Modern isolation. Prepare an observation CSV for original DOSBox run comparisons.

## Remaining gaps and next step

- **LL-175 remains blocked:** Need at least five original DOSBox traces showing departure, arrival and clock before/after, ideally with speed (`global475`) and tick carry. Without these observations, no claimed 'original exact movement cost' is appropriate.
- The community account says the turn can end when leaving a building at zero. Current Classic engine refuses nonzero travel and expects explicit End Week; a separate authoritative-turn transition and online-protocol QA is needed before implementing implicit end-turn on a failed travel click.
- The old ten-action restriction can still be selected for custom games. Existing saved games without `weeklyActionLimit` receive new Classic default (off); this is a deliberate parity-oriented migration, without rewriting `classicChoicesThisWeek` or earlier history.

## Operator QA

Run `TEST-TIME.bat`, `node tools/verify.mjs`, and open the generated `PLAY.html`. At the bank, spend time to zero then deposit/withdraw $100; verify no clock or location change. At Black's Market, purchase one food bundle at zero time if affordable. Attempt a timed action or travel: refuse without mutation. Enable the optional ten-action limit: eleven deposits should be blocked. Repeat at equal time budgets in Modern and restore old/online snapshots. For route calibration, fill in the empty observed fields in `docs/reference/dos-time-observation-template.csv`; these observations are **not included in the source build**.

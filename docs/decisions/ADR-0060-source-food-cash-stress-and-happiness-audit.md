# ADR-0060 — Classic hunger, cash stress and happiness audit

**Status:** Accepted as a **source-limited implementation candidate**, not full DOS runtime parity.
**Release:** v0.5.60. **Rules:** EVT-001, ECON-002, GOAL-002, MOD-001.

## Decision and source grounding

Jones DOS 1.000.060 decompiled `startTrn.sc`, script #111 (sluicebox/sci-scripts), states **12** lines 384–400 and **14** lines 405–433, provides:

- No food (`local6 == 0`) reduces Happiness **2**, then draws 0–3; **zero** qualifies for the follow-on state-14 expense.
- In state 14, if relaxation is at floor **10**, another 0–4 draw of zero forces eligibility. An eligible player with positive cash loses **4 happiness** and a cash amount. For cash under $500, cap at $50, otherwise cap at $200; cap cannot exceed available cash. If cap exceeds $30, expense is drawn uniformly from $30 to cap inclusive; otherwise expense is cap.
- Source state **6** lines 265–276: relaxation loses 1/week to floor 10 without item #28. Our no-hot-tub compatibility policy remains unchanged because item #28 is not yet represented.
- Source state **24** lines 596–644: source event codes 1/2/3 deduct base happiness 3/2/1 plus 5/2/1 for qualifying investments; the boom branch may grant +5 for invested players. The pure `headlineHappiness` table is exposed, but **not applied** to our approximation-based macro phase. Original global373/global444 mapping still needs evidence.
- `Main.sc`, script #0, `proc0_13` lines 1100–1109 clamps source Happiness changes to 0…100.

Authoritative reference: [startTrn.sc](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/startTrn.sc), [Main.sc](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/Main.sc).

## Implementation limits

Classic now uses **−2** on actual pantry/meal shortage. A deterministic no-food-only reducer applies the state-14 cash event and a second **−4** if triggered. It consumes the original d4 and optional d5 rolls in source order; skip the branch and RNG for satisfied meals. Since Life currently merges original food consumables #1 and #3–#5, other DOS `local6` branches (especially `local6==-1` for spoiled food) remain unresolved. This avoids asserting a full consumables port. Money/relaxation are fully bounded and event journals are saved via the existing bounded `classicWeekEvents` field.

The existing weekly +home comfort−2, outings and household appliance recovery, hunger-to-hours effect and event probabilities remain **Life Loop compatibility approximations**. The week-close wellbeing record is a transparent audit, not a gameplay effect. Classic custom house rules (`foodSpoilage`, `overdueRentPenalty`, `marketFluctuations`, `forcedReturnHome`) retain their existing semantics. Modern code and social/Looprd endpoints are unchanged. Old saves need no schema change.

## Deterministic operator evidence

`TEST-HAPPINESS.bat` runs exact 4-week source-state tests. With Classic sandbox (market fluctuation off), initial $200, happiness 62 and relax 16, no food and a zero RNG sequence, weekly cash/happiness/relaxation after weeks 1–4 are **(170,54,15)**, **(140,46,14)**, **(110,38,13)**, **(80,23,12)**. Week 4 also includes provisional unpaid-rent happiness −7; food state 12 is −2 and state 14 is −4 on each week. Compare the finite event history in Finances. Test state-14 d4/d5 boundary, no-food/no-cash, state-24 pure table, snapshots, Modern isolation, and local + Pages builds.

Remaining before exact DOS parity: full source consumable identities, hot tub item #28, original rest/initial happiness, real economic trigger `global373`, household risk distributions, and DOSBox session captures. Do not silently change those coefficients.

# Jones in the Fast Lane — Original DOS Mechanics: Pass 2

**Date:** 2026-10-13  
**Target:** The Life Loop, classic-compatible ruleset  
**Input:** `Jones-in-the-Fast-Lane_DOS_EN (1).zip`, 22-file installation, original version **1.000.060** verified in Pass 1.  
**Secondary evidence:** published, **version-matched** disassembly/decompilation of original SCI scripts in [`sluicebox/sci-scripts/jones-dos-1.000.060/src`](https://github.com/sluicebox/sci-scripts/tree/main/jones-dos-1.000.060/src).  
**What this release is not:** it does **not** contain copyrighted original graphics/audio/DOS binaries, a full emulator, or changes to the modern game project. Nothing was executed from the historical DOS archive. Matching version != binary equality; runtime-specific tests are still needed.

## Executive result

Pass 1 established the **170-point circular route**, **13 place identities**, **37 jobs**, and **11 degrees**. Pass 2 provides:

- Detailed turn-and-week lifecycle; monthly housing and debt checks; clothing and food decay.
- The original wage/work time calculation, hiring/dependability rules, and emergency unemployment conditions.
- A reproducible goods-price formula with separate values for base prices and live economic readings.
- A machine-readable catalogue of **25 selected** goods and accommodations, including food, clothes, appliances, lottery, and housing. This is **not** yet every product/action in every shop.
- The *ordered* AI rules behind Jones's survival tactics. `ai_branch_map.json` documents **38 representative labeled decision branches** and maps them to line numbers in the version-matched decompilation. The full source has additional branches.
- A 13-category random/weekly event inventory, including lottery odds, theft, economic downturns, loan notices, bankruptcy vulnerability, and a conditional welfare rescue.
- Exact goal-gating and progress-meter formulas.
- `classic_rules.py` plus **47 passing tests** checking selected mathematical rules. Tests validate the *reference* and input data; they do **not** prove that the actual DOS runtime will always behave identically under integer overflow, save/load, and RNG behavior.

Confidence levels used below:

- **High:** a method/formula is directly visible in the published decompiled *matching version*.
- **Medium:** formula is high-confidence but textual meaning, script state, or SCI interpreter specifics remain uncertain.
- **Unverified:** the actual uploaded script bytecode has not been directly decompressed and compared to source or run under DOSBox/ScummVM.

## 1. Gameplay turn clock, week and month

**Sources:** `room1.sc:730–810`, `room1.sc:958–1008`, `room1.sc:1473–1507`, `Main.sc:608`, `startTrn.sc:57–850`.

- The active action-time counter `global323` is capped at **60**. A timing quantum uses `global475`, initialized to **20** clock ticks. The visual timer loops across **six tens and ten units**, not a modern seconds/minutes world clock.
- Actions can add explicit costs. **Entering Employment = +2**, **applying for a job = +4**, **attending University = +6**, **newspaper = +1**. Working = **+6** time units, subject to partial pay when starting late. Travel also advances gameplay ticks as the board pawn moves: do not treat movement animation as completely free.
- `Player.endTurn()` always subtracts **3 dependability** (minimum zero), updates career standing, performs item-related state transitions and tracks unpaid rent/loan schedules.
- `Player.startTurn()` starts the time display and calls economic index and start-of-turn event scripts. `startTrn` has **37 numbered states (0–36)**, some used for delays/notifications and others for actual game rules.
- The `global372` week/round counter advances once per full player cycle. Many obligations are checked when `global372 % 4 == 0`. **The calendar uses four-week rent cycles**, not real calendar months.
- Weekly consumables are decremented individually; the item 1 (groceries) may be restricted by owned kitchen appliances. Clothes are consumables too.

**Proposed deterministic phase ordering for implementation** (this is a clean modern migration ordering, **not** a literal claim of event order for all SCI state-machine branches):

```text
turnEnd(player):
  adjustDependability(-3)
  adjustCareerScore()
  updateDurableItemState()
  updateRentAndLoanCarryovers()
  advanceToNextEligiblePlayer()
  if roundCompleted: weekCounter++

turnStart(player):
  resetActionTime()
  updateEconomicIndices(seedableRNG)
  calculateNetWorthAndStatus()
  processWeeklyConsumablesAndEventsInSourceOrder()
  processQuarterCycleRentAndLoanEffectsIfDue()
  updatePlayerAppearance()
  allowInteraction()
```

The exact game calls `endTurn` on turn switch and `startTrn` in a scripted state sequence. Preserve event ordering when exact classic emulation becomes the goal; do not run monthly fees twice from both handlers.

## 2. The employment/pay loop

**Sources:** `n108.sc:17–173`, `employment.sc:117–286`, `room1.sc:672–701`, `room1.sc:739–754`.

### Work action

```text
if currentTime == 60: cannot work
if not dressedForWork: cannot work (no immediate dismissal)
if dependability < minDependability - 5: fired
if dependability < minDependability - 2 AND firstWorkOfTurn: warning
otherwise: work
    experience += 1, up to maxExperience + experienceCredit
    dependability += 1, up to minDependability + 20 + educationCredit
    careerStat = min(100, floor(dependability/8) * 10)
    fullGross = wagePerHour * 8
    if timeRemaining < 6:
         gross = floor(fullGross * timeRemaining / 6)
    else:
         gross = fullGross
    [garnish rent debts using special handling]
    cash += gross or garnished amount
    time += 6
```

The original `global329` flag gates the early-work warning so it doesn't necessarily show on every work action. In this reference, `work_outcome()` reports `warning_if_eligible` to make the additional state requirement explicit.

**Important subtlety:** `n108.sc` calculates a `fullGross = wage*8`, then derives partial-pay `temp1` from remaining action time. The garnishment branch uses `temp0` (the full gross) for some deductions and can overwrite `temp1`; do not simplify this to an ordinary percentage off the already-partial paycheck. Port the entire garnishment branch and confirm its behavior with a game trace.

**Job applications:** tests include all education, dependability and experience checks. The random hire threshold is:

```text
chanceThreshold = 30 + trunc((dependability + experience + (8*completedDegrees + 10)) / 3)
accept if Random(1,100) <= chanceThreshold, if all hard requirements passed
```

The **Cook** (`occupationIndex=44`) bypasses only the random gate; it does *not* bypass other qualification checks. Same-job raises and switching jobs have distinct code paths. Job base wages are further adjusted by the dynamic economic price model.

### Paycheck, clothes and reliability interactions

- Low, middle, and formal workwear categories are IDs **36 casual**, **35 dress**, **34 business suit**. These are **not decorative**: `dressedForWork` requires the owned (highest available) clothing index to satisfy the `uniform` tier for the current occupation.
- Basic clothes cost `basePrice=73` and grant 11 weeks; dress and business clothes cost **125** and **295**, both granting 13 weeks.
- Dependability loses 3 at end turn, and successful work may add 1. This encourages regular attendance; passively waiting may eventually cause dismissal or reduce job eligibility.
- Consecutive work also raises experience, with job-dependent ceilings, and helps build career score; wages and career rating must not be conflated.

## 3. Price scaling, inflation and the macro economy

**Sources:** `n109.sc:10–47`, `WButton.sc:162–256`, `economicIndex.sc:28–146;202–278`, `Main.sc:408`.

The goods price is not a simple `basePrice * index / 100` formula. The original game first bends the index farther from 100, clamping the low end:

```text
adjusted =
    index - trunc((100 - index)*2/3)    if index < 100
    index + trunc((index - 100)*2/3)    if index >= 100
adjusted = max(50, adjusted)
price = max(1, trunc(base * trunc(adjusted/10)/10)
                  + trunc(base * (adjusted mod 10)/100))
```

`trunc()` is integer division toward zero. Some compound SCI operations can overflow or wrap at signed 16-bit limits, so the Python reference intentionally handles **normal-range positive inputs only** and does not claim exact compatibility for huge prices.

Example for **one week of food**, base $55:

| Goods-index reading | Effective index | Source-style price |
|---:|---:|---:|
| 70 | 50 | $27 |
| 80 | 67 | $36 |
| 100 | 100 | $55 |
| 120 | 133 | $72 |

The `CostDItem` class only applies this conversion where `fixedPrice` is false. Lottery tickets ($10 per 10 tickets) and newspaper ($1) are explicitly fixed-price items. Rent is initially base $325 or $475 and may be adjusted when obtaining a new accommodation; the rent-payment button uses the player's current negotiated rent rather than recalculating it as an ordinary market purchase.

### Original economic engine

`EconomicIndex` holds: `index`, `reading`, `high`, `low`, `lowerRange`, `upperRange`, `adjustment`, `risk`. A turn step calculates a new trend index, a random adjustment, and a reading clamped to **10–190**. The initial index readings are **100** in Main. Separate indices update:

- Main/general economy (`global307`), investments (`308`), consumer goods (`309`)
- Gold (`310`), silver (`311`), pork (`312`), Blue Chip (`313`), penny stock (`314`)

Index updates are interdependent: goods tracks the main trend; investment classes use the investment trend. The system occasionally triggers a downturn (`global373`) or boom (`global444`) and creates headlines/event modifiers. Distinct `risk` values affect some stock/commodity indices.

**Port decision:** implement **one seeded economy system** with multiple index domains and a goods-price resolver. Keep all price-bearing interactions attached to the current index, not static shop prices; leave random event effects in a separate source-ordered resolver.

## 4. Survival needs, rent and payment extensions

**Sources:** `Goods.sc:16–25`, `startTrn.sc:265–504`, `rentOffice.sc:233–359`, `room1.sc:775–810`.

- Groceries have options for one/two/four weeks at base **55/100/190**. The game has bulk-storage constraints: without a refrigerator (durable item **21**), bulk groceries can spoil; without a freezer (**22**), groceries beyond six units are capped, and with both relevant goods there is a 12-week ceiling.
- Fast-food product IDs 2–5 and drinks/other categories have separate consumption rules. The weekly script checks which food is available and can apply a negative happiness or money event when the player cannot eat.
- Basic apartment = type **0**, lease product **40**, initial monthly rent **$325**. Security apartment = type **2**, product **41**, base rent **$475**. The rent system uses prepaid weekly quantity and periodic account checks.
- When behind, players may ask for one-week extensions. The success chance declines as extensions accumulate:

| Prior extension count | Chance of approval (with preconditions met) |
|---:|---:|
| -1 | 0% |
| 0 | 100% |
| 1 | 75% (roll 4–12 of 1–12) |
| 2 | 50% (roll 7–12) |
| 3+ | 25% (roll 10–12) |

- `triedExt` prevents freely repeating an unsuccessful request within the same rental cycle. Unpaid rent can result in a debt balance, income garnishment, and further consequences.
- Relaxation is **not** identical to the four victory statistics: it is another player state. At the start of the turn it may decrease by one if an expensive home item is missing (ID 28, Hot Tub), with floor 10; low relaxation steers Jones toward home and may increase exposure to negative events.

## 5. Random events, lottery, risk and recovery

**Sources:** `startTrn.sc:214–832`, `room1.sc:812–830`, `weekend.sc:91–135;241–324`.

The machine-readable file `weekly_events.json` includes 13 categorized event branches, source state and evidence range. Key newly recovered mechanisms:

**Lottery draw.** At the start of a turn with `ticketQuantity` tickets, choose `R` uniformly from **0..500 inclusive**. If `ticketQuantity > R`, the player wins:

- `R <= floor(tickets/20)` -> **$5,000**
- Else `R <= floor(tickets/5)` -> **$500**
- Otherwise -> **$200**

The ticket quantity is set to **zero** after the draw, regardless of result. For the shop's 10-ticket pack, there are **10 winning outcomes out of 501** possible integer draws: one $5,000, two $500 and seven $200 outcomes. This is code-model probability, assuming each SCI `Random` output is uniformly distributed as intended.

**Household/financial risk.** In low-cost housing, certain property is vulnerable to rare theft. Appliance ID 29 gives a chance of a random **$20–$100** cash bonus in an earlier event state. Expensive/eligible durables can also cause rare money loss; the event branch examines item attribute flags that still need semantic reverse engineering before implementation.

**Economic crisis.** The economy can generate downturn strengths 1 or 2. `Player.doScandal(strength)` can zero the bank balance, fire an employee, or cut wages:

- At strength 1, bank account reset to 0 and employed player loses job.
- At strength 2, employed player is dismissed on `Random(0,1)==0`; otherwise wage becomes approximately **80%** (`trunc(wage*8/10)`, with a minimum of 1).
- The start-of-turn event handler applies corresponding happiness decreases (`-7` for dismissal, `-3` for wage reduction).

**Extreme need recovery.** A player with no nonnegative cash, no wearable clothing, and very little remaining durable value may receive conditional funds after repeated detection. This prevents indefinite deadlock and is worth replicating faithfully rather than adding invisible infinite loans.

**Weekend events.** `weekend.sc` has recurring narrative activities and randomized small spending, with conditions based on possessions and consumable leisure goods. It is not simply an end-of-week summary screen.

## 6. Jones's AI is a branching planner, not a single utility score

**Source:** `WhereShouldIGo.sc:13–1107`, particularly first priority branch `230–237`, rent `240–388`, clothing/food `392–755`, career `759–829`, goals/discretionary actions `833–1107`.

The **exact** original AI design is an **ordered first-matching sequence** that returns the next board `placeNum`. Its helper procedures estimate circular-route distance on the 170-index ring and test remaining time. It sometimes checks two- and three-stop permutations to choose the shorter plan, without a full general-purpose pathfinder.

**Priorities visible in decompilation:**

1. Unemployed: go to location **6** (ACNE Employment).
2. Rent cycle: secure food/clothes where possible; try to pay rent; work extra shifts, withdraw, request extension, or pawn things if funds are short.
3. Food/workwear: get cash or supplies, work first if required, and chain errands in minimal route order.
4. Career: ask for raises, look for promotion, work for more experience/reliability.
5. Relaxation: go home if critically exhausted; balance workplace with home when approaching a floor.
6. Education: fund, travel to and attend university, subject to timing and degree eligibility.
7. Growth: optionally buy expensive appliances, leisure goods, make investments, or redeem pawned goods, in conditions affected by goal achievement.
8. Fallback: go home when nothing else meets the time/availability checks.

These are **priority families**, not one guaranteed strict priority ranking across all branches. For exact sequence and conditions see `ai_branch_map.json`, source line numbers and `WhereShouldIGo.sc`. Several decision paths are explicitly randomized and there are additional boolean global flags which require trace-based interpretation.

**Important correction to an overly generic implementation:** classic-compatibility should use an *ordered rule engine*, not a generic scored weighted policy. A weighted planner may be a good **Modern AI** option, but is not faithful to Jones's original choice order.

### Routing/time reasoning

`WhereShouldIGo.localproc_1` compares place waypoint indices and uses:

```text
routeTicks(A..N) = sum_over_legs(
    min(abs(index_i-index_next), 170-abs(...)) + 2*global475
)
```

At the game's initial `global475=20`, even an immediate nearby trip carries **40 additional ticks per leg** in the AI's time estimate. Alternative orderings (2 or 3 destinations) are compared by estimated ticks. The modern board needs the **same place identity registry** and **same travel-time oracle** for player and opponent. The rendered road can be smoother without altering logical waypoint steps.

### AI integration contract

```text
ClassicJonesController.decide(snapshot, routing, rng):
    snapshot includes: current place, time, cash, accessible assets,
       monthly rent, food quantities, work-clothing weeks, wage,
       employer place ID, dependability, experience, completed degrees,
       relaxation, inventory of durables, investments, player goals
    for sourceOrderRule in orderedOriginalRules:
       if prerequisites(snapshot) and canFitRemainingTime(snapshot, route):
          return {placeNum, actionCode, quantity, plannedStops,
                  ruleId, reason, predictedTimeTicks}
    return {placeNum: home, actionCode: rest}
```

Keep a **decision-trace mode** recording which source tag (`global403` equivalent) triggered each choice, including rejects. This is more important for debugging than merely logging a final destination.

## 7. Progress and victory

**Sources:** `Main.sc:1038–1109`, `room1.sc:739–754`, `university.sc:202–333`, `viewGoals.sc:22–59`, `startTrn.sc:57–164`.

Four goals are required **individually**: money, happiness, education, career. Winning checks all four `currentStat >= currentGoal` thresholds, not a combined average. The UI progress percentage is:

```text
sumClamped = sum(min(stat[i], goal[i]) for i in 4 dimensions)
progress% = min(100, trunc(100*sumClamped / sum(goal[i])))
```

Equivalent to the decompiled two-term division method under normal integer range. The display gauge can show 99% even when a particular goal is still short; don't confuse a progress gauge with a victory predicate.

- Money status is derived from *liquid asset fields* (`lqAss/100`, capped 0..100, or 100 with nonzero high word) when certain cash/state mutations run. It is **not** raw cash alone. Precise recalc order around deposits and inventory values still needs runtime validation.
- Happiness (`hapStat`) is mutated by events/actions and clamped 0..100.
- Education awards recalculate `eduStat = 1 + 9*numberOfDegrees`, reaching 100 with all 11. A new player with zero degrees starts at `eduStat=0`, not 1.
- Career status is `min(100, floor(dependability/8)*10)` while employed, else 0. It uses discrete steps.

## 8. Proposed migration order and test strategy

**No modern-game patch was applied in this pass.** The reference is ready for use when integrating with the latest The Life Loop ZIP.

**Next migration** should be staged:

1. **Game model:** centralize player, workplace and place IDs; import the Pass 1 route/job/degree data; fail loudly on missing employer locations.
2. **Classic `TimeBudget` and work flow:** add remaining-time checks, partial pay, clothing qualification, reliability decay, employment eligibility and deterministic seeded dice outcomes.
3. **Economic core:** goods/market indices, `economic_price`, mutable stocks, weekly consumption and two housing types; `fixedPrice` honored.
4. **Weekly event engine:** source-ordered event dispatch with no double processing of rent; reproducible seeded RNG and an event journal with before/after state.
5. **Classic AI:** ordered priorities with explicit trace `decisionTag` + `targetPlaceNum`, then route through the original ring-index travel estimator.
6. **Victory:** exact four-gate predicate plus source-derived display percent.

**Regression scenarios to automate in The Life Loop** (example expected behavior):

| Scenario | Expected behavior |
|---|---|
| Unemployed, day start | Jones routes to employment office location 6 |
| New cook seeking Monolith | Employer=10, 4-dollar *base* wage, no disconnected employer record |
| Repeated idle weeks | Dependability loses 3 per completed turn, bottoms at 0 |
| Work at t=57 and $7/hr | 3/6 of eight-hour gross = $28 before any garnishment |
| Purchase basic groceries at goods-index 80 | $36 for one-week base-$55 option |
| Food stock 4 after weekly consumption | Stock becomes 3 |
| 10 lottery tickets, random roll 3 | Win $200 and consume all tickets |
| Rent extension count 2, roll 6 | Declined |
| Housing changed to security | `livesAt=2`, appropriate rent item = 41 |
| Goals (100,100,100,49), target (50,50,50,50) | Not a winner despite high combined score |
| Pawn shop target | Location 12, not a separate AI-only address |
| Scandal severity 2 and wage 10 without dismissal | Wage becomes 8 |

## 9. Remaining open questions and evidence limits

**Not fully resolved:**

1. Exact side-effect and script interactions of all 37 start-of-turn states, including nested `setScript` callbacks.
2. Entire `WhereShouldIGo.sc` AI execution semantics and all action codes (`global407`) when bridging to separate dialog scripts.
3. Integer overflow and `Random` distribution/seed compatibility of the old SCI interpreter. `classic_rules.py` intentionally models nonoverflowing arithmetic, NOT 16-bit VM internals.
4. Exact order of `monStat` updates versus `calcLiquidAssets` and all bank/stock recalculations.
5. The detailed price tables of the remaining shops and all individual durable attribute flags.
6. Script bytecode in the actual uploaded `resource.001/.002` has not been independently decompiled and compared against the published source. The first pass verified archive structure and version, not each gameplay routine's bytecode.
7. A live DOSBox/ScummVM behavioral comparison has not been run.

**Conclusion:** We now have enough evidence to **implement and test the core classic rules**, preserving a clean separation between *exactly decompiled numeric mechanics*, *gameplay interpretations*, and *modern replacement policies*. Further source investigation should be **targeted** at discrepancies revealed by emulator comparisons, rather than blocking implementation until every screen and random branch is exhaustively reconstructed.

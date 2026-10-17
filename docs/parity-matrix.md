## v0.5.61 source-obligation migration

- **ECON-002:** The original executes fresh-food storage state 10 **before** consumables state 12. Life preserves meal-first compatibility until the original consumable IDs and opponent food decisions are modeled, but now applies the source-verified `−2` spoiled-food and `−1` over-cap happiness effects. No invented doctor bill.
- **ECON-003:** Original state 20 evaluates at the **completed fourth week** and distinguishes schedule-zero notices from negative-schedule −1 happiness. The Life saved `classicLoanPaidThrough` translates to a monthly approximation; no claim of true `paySched` equivalence.
- **ECON-001:** Original `n108.sc:localproc_0` garnishment uses full 6-unit pay as its debt basis, even for partial shifts, and can result in disproportionate net cash. A pure comparator now exposes it, while the live bounded compatibility paycheck remains unchanged, with original runtime evidence still required.
- **EVT-001:** State-14 `local6==-1` random 0…1 cash-stress outcome is representable as a pure reducer, not wired until food-item identity can distinguish spoilage from other consumables.



# Original gameplay parity matrix — architectural backlog

**Architecture revision:** 1.3 · **Implementation baseline:** v0.5.0 · **Evidence:** guide-based, pending binary side-by-side verification.

See [`parity-contract.json`](parity-contract.json), the [documented DOS jobs](classic-job-table.md) and [ADR-0004](decisions/ADR-0004-original-jobs-and-manual-rent.md).

| ID | Mechanic | Original target | v0.5.0 implementation | Status | Priority |
|---|---|---|---|---|---|
| TURN-001 | Per-player weekly turns | One turn per player; week advances after all players finish. | Turn order supports 1–2 humans and AI; 4-human original maximum unavailable. | partial | P1 |
| TIME-001 | 60-hour weekly budget | Start each player turn with 60 hours, original modifier exceptions recorded. | Classic uses 60h (Modern retains 40h), hunger penalties still simplified. | partial | P0 |
| TIME-002 | Movement and building entry | Distance-based movement; entering a building costs 2h. | Classic uses 170 original waypoints, source-derived tick estimator (steps + 40 per nonempty leg), and +2 Employment entry; playable waypoint-to-clock conversion remains provisional. | partial | P0 |
| TIME-003 | Action time accounting | Full work 6h pays 8h; applications 4h; relax/study 6h; Classic actions stop at zero time. | v0.5.33 gives +1 work progression per successful action (full or partial), integer-truncated wages, and original agency/application time charges; the ten-action weekly limit and several action costs remain provisional. | partial | P0 |
| JOB-001 | Single job, workplace locking | Exactly one primary job; work only at its workplace; switching replaces role. | Implemented with explicit switch confirmation. | implemented | P0 |
| JOB-002 | Applications and openings | Requirements + chance-based no openings; failed applications still consume time. | Classic now uses the 37-job DOS/floppy catalog, stat/diploma qualification rejection (+4h/-1 Happiness), qualification-sensitive openings chance and same-week rejection lockout; original RNG order still unverified. | partial | P0 |
| JOB-003 | Work-stat gains and caps | +1 experience/+1 dependability per work session up to job/degree caps. | Classic stat caps now use the DOS 37-job requirement data and completed diploma counts; XP/Dependability capped per authentic role. Work/dismissal edge cases still require DOS comparison. | partial | P0 |
| JOB-004 | Dependability and firing | 20 initial, -3 per week; low stat warnings and dismissal on work attempts. | Classic starts Dependability 20 and decays 3/week; hiring below 10 resets it, low reliability warns, and work attempts below job requirement−5 dismiss without pay. Exact messages/DOS edges unverified. | partial | P0 |
| JOB-006 | DOS-floppy employment catalog | 37 original DOS positions with employer, base wage, XP, Dependability, diplomas and uniforms; preserve CD-only distinction. | 37 documented floppy positions implemented in Classic data; two CD-only jobs omitted; shared modern building venues not 1:1; exact DOS binary comparison pending. | partial | P0 |
| JOB-005 | Wages and raises | 8h pay for full 6h work, current wage; raise and risk rules. | v0.5.23 prorated partial wages carry a sixth-dollar remainder so 6 × 1h equals one 6h shift; exact DOS rounding and wage economy still provisional. | partial | P1 |
| EDU-001 | Eleven branching degrees | 11 permanent named degrees with prerequisite edges and possible multi-course progress. | 11 named diplomas and original prerequisite graph now feed 37 DOS job qualifications; course availability/end-condition and original implementation variants still unverified. | partial | P1 |
| EDU-002 | Course time and benefits | Enroll fees and 6h lessons, usually 10 lessons; studies can benefit from durables. | Classic enrollment $50, ten 6h lessons (1–5h partial final time permitted), computer and three-book study aids, graduation +5 happiness/reliability. Enrollment queue and item details require DOS validation. | partial | P1 |
| ITEM-001 | Weekly uniform consumption | Three tiers, weekly wear including unworn; higher tier satisfies lower; budget/premium durations. | Implemented week-based casual/formal/business clothing with tier substitution. | implemented | P1 |
| ITEM-002 | Durables and supply market | Durables have benefits, wear/breakage/theft risks; shops rotate stock. | Ownable items but limited damage and original stock variety. | partial | P2 |
| ECON-001 | Rent cycle and debt | Rent due every 4th week; manual payment/extensions; garnishment/arrears consequences. | Classic cash-paid $325 rent due week 4, four-week billing, extensions, arrears and half-shift wage garnishment with $2 remaining-debt fee. Advanced payments, rental switching, DOS exact timing still partial. | partial | P1 |
| ECON-002 | Weekly food and storage | 1/2/4 fresh-food portions at $55/$100/$190; refrigerator 6, freezer 12; weekly use and spoilage. | Classic food bundles, weekly consumption and 6/12-cap storage implemented. Unrefrigerated leftovers spoil. Medical bill formula and restaurant menus approximate. | partial | P2 |
| ECON-003 | Bank, loans and investments | $100 transfers at no hour cost, loan 2h/$45 principal+$5 interest, 2h broker, 6 markets and fixed $100/$97 T-Bills. | Distinct Classic bank menu, 6 separate prices/holdings, monthly repayments/default tracking, legacy investment recovery. Stock volatility, lending formula and robbery/crash still approximated/not implemented. | partial | P2 |
| ECON-004 | Pawn, repossession and durable economy | Pawn valuables, redeem within time window, other players can buy unredeemed goods. | v0.5.16 provisional pawn/redeem/expired resale for six durables at a second-hand counter on the Circuit City tile; timing and rates require original verification. | missing | P2 |
| EVT-001 | Economic cycles and random losses | Events may cause robberies, job loss, weekends; timing differs by DOS edition. | Classic disables non-original civic modifiers/opportunities; original economic/random event distribution absent. | partial | P2 |
| GOAL-001 | Four adjustable goals | Wealth, happiness, education and career; win when all chosen thresholds achieved. | Four configurable goals exist, but advancement formulas differ. | partial | P1 |
| GOAL-002 | Education/career scoring | Education ≈1+9/degrees; career ≈1.25×dependability in secondary reference. | Classic degree score 1+9×diplomas and employed career score 1.25×Dependability; Modern story keeps tier and linear education scoring. Other goal formulas still simplified. | partial | P1 |
| MOD-001 | Optional modern content isolation | Original rule outcomes must be same with cosmetic/UI modernizations. | Classic economy now distinct from Modern generic bank/food model. 3 eras purely cosmetic; missing Classic rules still partial. | partial | P0 |

## Acceptance checks

- **TURN-001 · Per-player weekly turns:** Four humans complete a week in correct order without taking actions for each other. [Reference](https://jonesinthefastlane.fandom.com/wiki/Week).
- **TIME-001 · 60-hour weekly budget:** Fresh game starts with 60 hours; no duplicated time deductions; imported games handled by migration policy. [Reference](https://jonesinthefastlane.fandom.com/wiki/Locations).
- **TIME-002 · Movement and building entry:** Move around ring, reenter building, track exact expected time with original observations. [Reference](https://jonesinthefastlane.fandom.com/wiki/Hour).
- **TIME-003 · Action time accounting:** Full and partial work, success/failure application and study action charge documented hours. [Reference](https://jonesinthefastlane.fandom.com/wiki/Hour).
- **JOB-001 · Single job, workplace locking:** Two hired positions never coexist; former employer denies shifts; current one allows work. [Reference](https://jonesinthefastlane.fandom.com/wiki/Jobs).
- **JOB-002 · Applications and openings:** Under-qualified and no-opening attempts use original rejection/time rules. [Reference](https://jonesinthefastlane.fandom.com/wiki/Employment_Office).
- **JOB-003 · Work-stat gains and caps:** Repeated entry-job shifts reach cap, not infinity; changing jobs/degrees affects cap. [Reference](https://jonesinthefastlane.fandom.com/wiki/Jobs).
- **JOB-004 · Dependability and firing:** Week decay, hire minimum, warning threshold and firing reproduced with seeded results. [Reference](https://jonesinthefastlane.fandom.com/wiki/Dependibility).
- **JOB-005 · Wages and raises:** Pay matches applied wage, raise refusal/cost, garnishment and role switching exact. [Reference](https://jonesinthefastlane.fandom.com/wiki/Jobs).
- **EDU-001 · Eleven branching degrees:** All 11 degrees reachable through correct graph; job-specific combinations enforced. [Reference](https://jonesinthefastlane.fandom.com/wiki/Degrees).
- **EDU-002 · Course time and benefits:** Enroll, alternate courses, complete 10 lessons, adjust for valid aids, graduate. [Reference](https://jonesinthefastlane.fandom.com/wiki/Hi-Tech_U).
- **ITEM-001 · Weekly uniform consumption:** An unused outfit ages each week; expired uniform blocks work; superior outfit substitutes. [Reference](https://jonesinthefastlane.fandom.com/wiki/Week).
- **ITEM-002 · Durables and supply market:** Buying durable modifies right mechanic; breakdown, theft and changing stock reproducible. [Reference](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane).
- **ECON-001 · Rent cycle and debt:** Choose rent office payment; miss it and observe prescribed arrears, garnishment, extension. [Reference](https://jonesinthefastlane.fandom.com/wiki/Week).
- **ECON-002 · Weekly food and storage:** Compare 4-week food inventory with/without fridge; validate spoiled food and week events. [Reference](https://jonesinthefastlane.fandom.com/wiki/Week).
- **ECON-003 · Bank, loans and investments:** Document and replicate loan interest/default, 6 markets, cash theft exposure. [Reference](https://jonesinthefastlane.fandom.com/wiki/Bank).
- **ECON-004 · Pawn, repossession and durable economy:** Pawn item, redeem within window, let it expire, other player buys it. [Reference](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane).
- **EVT-001 · Economic cycles and random losses:** Edition-specific seeded economic/robbery weekend events follow original windows and effects. [Reference](https://jonesinthefastlane.fandom.com/wiki/Week).
- **GOAL-001 · Four adjustable goals:** Known reference states produce expected goal scores and victory trigger. [Reference](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane).
- **GOAL-002 · Education/career scoring:** Compare all four formula outputs against original observations, including unemployment. [Reference](https://jonesinthefastlane.fandom.com/wiki/Dependibility).
- **MOD-001 · Optional modern content isolation:** Classic ruleset suppresses non-original mechanical bonuses while keeping dialog optional. [Reference](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane).

## Implementation sequencing

1. **P0:** Make 60h turns and action travel costs faithful, implement job application randomness, +1/stat caps/decay and dismissal, isolate modern bonuses. Ensure costs/time aren't charged more than once and random outcomes are seeded.
2. **P1:** Implement the eleven-degree graph with multi-course enrollment, job-specific qualification gates, original career/education scoring, rent decision timing and raise/loan interactions.
3. **P2:** Restore item/perishability/repair/pawn/investment breadth, events and risks, plus up to four human players.
4. **Acceptance:** Add engine regression and parity tests with exact expected deltas; compare with original DOS observations when possible; create an ADR for any knowingly changed rule.

**Explicit non-goal for classic mechanics:** reproducing Sierra's UI pixels, fonts, voices, trademarked game name or distributing proprietary game assets. All modern additions and QoL remain welcome when they do not silently change core calculations.

## Rule and world settings — v0.4.5

**Classic Rules** is default when starting a new game, yet it is only **partially** mechanically faithful; the detailed discrepancies above continue to govern future work. **Modern Story** deliberately retains the v0.4.3 features. The era selector (Historical / Contemporary / Sci-Fi) affects only SVG scenes, NPC outfits, building names and presentation; it must not alter results under the same ruleset and seed. See [ADR-0002](decisions/ADR-0002-rulesets-and-world-eras.md).

## v0.4.6 check status

Classic diploma graph, registration, cap formulas, hiring reset and work-time firing now have executable tests. The original job catalog and exact probability tuning are **not** complete. See ADR-0003.


- **JOB-006 · Classic 37-job catalog:** Original floppy table roles and diploma/wage uniform fields pass per-role checks. [Reference](https://jonesinthefastlane.fandom.com/wiki/List_of_Jobs).

## v0.5.1 — Banking, food, stock prices

The published original-market prices, bundles and loan installment values are now covered by `tests/classic-banking-food.test.cjs`. Classic mode retains **partial** ECON-002/ECON-003 status until credit underwriting, exact stock-volatility distributions, market crash risk and doctor fees have been compared with DOS runs. Modern Story remains behaviorally separate; imports include a redemption path for pre-v0.5.1 Classic generic investments.


## 0.5.16 — Core mechanic progress (source-based, not binary certified)

- **TIME-003/JOB-005:** When a Classic employed player has 1–5 hours left, the game permits a partial shift and credits `floor((hourly_wage × 8) × hours / 6)` gross. A full six-hour session still pays eight hours. This follows the documented proportional-pay pattern but the original DOS rounding has not been measured.
- **JOB-003:** Completed cumulative six-hour blocks grant one capped experience and dependability credit. This anti-exploit rule is a modern implementation choice, **not** a claim about Sierra's treatment of short sessions. Progress resets when leaving a job.
- **ECON-004:** Six eligible durables can be pledged, redeemed through two weeks, or purchased by a different human after expiry. A single Circuit City counter represents a pawn shop because the contemporary 12-location city does not yet have a dedicated pawn tile. Advance 45% of the reference price; redeem at principal +10% rounded up (at least $5). **These figures are provisional** and remain to be checked against the original game.
- Modern Story and eras are unaffected. Full DOS mechanical parity remains incomplete. See ADR-0017 and `tests/classic-work-pawn.test.cjs`.


### v0.5.24 original Classic geography and risk update

Classic now has the original named thirteen-venue layout independent from Modern Story's thirteen-venue city. Z-Mart Discount and Black's Market are distinct physical destinations; Monolith Burger, Socket City, QT Clothing, the Factory, Rent Office and both apartment sites are correctly named. All original employer IDs remain. This resolves the **location identity gap**, but does not yet verify *original map movement cost arithmetic* or exact source sprites. Broken equipment, repair services, Wild Willy's bank/market robbery and insecure-housing burglary are present, but their rates are provisional. See ADR-0025 and `tests/classic-map-risk.test.cjs`.

**v0.5.28 precision:** Classic `JOB-001/002` numeric degree identities, qualifications and hiring draw use attached DOS-derived source; economy wages are still balanced Life Loop rates rather than an exact `CostDItem` emulation. Rival future-income weighting and two-week reserves are explicitly heuristic (not verified original AI coefficients). See ADR-0029.

## v0.5.34 — Reliability preflight and transparent paychecks

Classic employer work checks now follow source ordering: dismiss at `dependability < required-5`, warn once per week at `< required-2` without consuming time or earning pay, otherwise perform work. After the warning, an eligible retry works. Pure `ClassicTime.paycheck` exposes full-shift gross versus partial-shift gross, arrears deduction, estimated fee and net; **garnishment is still provisional** pending the exact n108.sc temp0/temp1 flow and should not be claimed original parity. The rival reserves an action unit after the commute and does not travel after reaching the provisional ten-venue-action cap. Save marker is bounded by current week, old saves migrate with no warning already shown, Modern work unchanged. See ADR-0035.

## v0.5.35 — Paycheck journal and opponent net-wage accounting

`n108.sc` source confirms gross pay = hourly×8 for six action units and truncating proportionally for partial shifts. The deployed half-gross debt deduction and fee remain **provisional**; no substitution of unverified full-shift overwrite. Reconciled payroll writes a bounded/validated history for Classic shifts and exposes it in Finances. Jones forecasts actual *net* cash from two successive contracted shifts after arrears/fees and protects immediate bills before optional old-debt clearance. Old snapshots migrate; Modern remains isolated. Operator parity request: matched DOS 1/3/6-unit shifts with identical debt and wages. ADR-0036.

## v0.5.36 — Classic turn boundary timing

- **TURN-001:** Player-specific Classic closure now deducts 3 dependability once before control passes to the next player, including hotseat and AI; week reset no longer duplicates it.
- **ECON-*/EVT-001:** Shared weekly economy, living, rent and loan phases now produce a deterministic bounded journal, without claiming original `startTrn` branch order.
- **TIME-001:** The 60-unit game clock and route-time adapter have no new conversion assumptions. Modern mode unaffected. DOSBox empirical timing and full SCI state traces are still open.


### v0.5.38 Classic board/event migration note

- TIME-002: mobile Overview inspect is presentation-only, Explore travel spends the unchanged host-calculated time; mobile camera follows source-waypoint pawn.
- TURN-001: Classic startTrn source states 10 (food storage) and 18 (uniform warning) emit bounded trace entries; spoil probability and full DOS event scheduling are not yet exact.

### v0.5.39 Classic board journey and DOS states

- Presentation-only departure/arrival and swipe override; board geography and 170-step planner unmodified.
- State 12 source-labeled food-shortage journal (existing hunger rule, DOS consumable IDs not yet tracked).
- State 34 source-labeled emergency clothing aid (two-week shortage heuristic, $90 award and eight-week cooldown **not source verified**).

### v0.5.40 Classic relaxation, loan due and skippable journeys

- DOS `startTrn.sc` state 6: source-backed relaxation −1 to floor 10 when item 28 absent. Separate saved Classic scalar; initial/rest values and original hot-tub store item are pending research.
- State 20: record existing four-week loan check as due/covered/missed, no extra penalty or invented repayment formula.
- Board travel: allow skipping the visual animation while preserving the one authoritative time deduction and centered arrival entry; Modern unaffected.


### v0.5.41 Classic household and entrance presentation

- Working household projection prevents broken computer project income, preserves household comfort from intact entertainment equipment, and avoids extra save/wire state. Equipment breakdown probability is a **compatibility approximation**.
- Rest is actionable for isolated relaxation deficits; its +6 restoration is **not yet DOS verified**. Modern behavior is unchanged.
- Original road stops determine board entrance overlays independently from production artwork; optional 13 × card/detail artwork contract is in `docs/classic-designer-handoff.md`.

### v0.5.43 — Lifecycle transparency and optional household maintenance

The source workboard records full item lifecycle states; ZipRunner v1 import remains implemented/remaining only. Classic AI maintenance is a provisional feature protecting essential cash reserves and using existing Socket City repairs; this does not establish new DOS-equivalent coefficients. No changes to source-backed travel, economic events or Modern modes.

### v0.5.53 — Source-backed late Employment actions

- **TIME-003:** DOS `employment.sc` checks only that action time has not reached 60 before it calls `gTimeKeep doit: visitTime`; `room1.sc` then caps elapsed time at 60. Classic applications/raises may therefore use the last 1–3 units of a nominal 4-unit interaction, while Modern retains its ordinary minimum-cost rule. Action at zero is blocked. `node tools/dos-time-audit.mjs` generates a 156-leg source AI tick/estimated player-unit comparison without claiming exact route time parity. See ADR-0053.

### v0.5.57 — Weekly food audit and selectable match-length goals

- **ECON-002:** Classic food step now receives the previous week ID and records it in bounded weekly events; pure meal reducer covers prior pantry availability, hunger and food happiness exactly as current compatibility model. State 10 storage follows unchanged, including v0.5.56 custom food-spoilage rule. DOS exact food IDs/chance remain partial.
- **GOAL-001:** Four goal presets: Quick=30, Standard=50, Extended=75 per goal, Custom=existing manual sliders; race equations unchanged, no claims about original match lengths.
- **MOD-001:** Locale is browser-local, gameplay snapshots/network wire language-neutral; only select New Game text is currently translated (English/Dutch).


### v0.5.58 — Goal scoring correction

- **GOAL-001:** Classic viewGoals.sc progress is now `floor(100 * sum(min(integer stat, goal)) / sum(goal))`, while victory still requires all four raw thresholds. The earlier equally weighted average was incorrect when sliders differed.
- **GOAL-002:** Career uses source discrete `min(100,floor(Dependability/8) * 10)` while employed, zero unemployed. Education now follows `0` for no diplomas, or `1 + 9 × completed` after the first award. The printed Quick Reference's partial-study language conflicts with this source interpretation; verify in original DOS runtime before claiming parity for partial credits. Cash/owned goods valuation and starting Happiness are still provisional.
- **MOD-001:** Modern scores untouched; Classic per-game custom house rules and historical saves retain their configuration.
- **Worklog:** `docs/classic-parity-worklog.md`, ADR-0058, LL-303–LL-310.


### v0.5.59 — Clock-end behavior and action count

- **TIME-001/TIME-003:** Classic zero-time actions at zero remaining weekly clock now work inside the current venue, as documented for the original game; positive-time actions and new travel still require available time. The old generic 0h action lockout was an implementation discrepancy.
- **TIME-003:** The former fixed 'ten actions per week' interpretation was not source-verified. This release removes it from Classic defaults and preserves it as an opt-in house rule (`weeklyActionLimit`). Multiplayer snapshot and browser preference normalize this option; Modern's clock remains separate.
- **TIME-002:** Seven source-indexed journey tests and SCI hypothetical frame estimator were added. **Game travel costs are deliberately unchanged and provisional:** AI route tick estimates cannot establish human clock units without original DOS runtime observations. See ADR-0059, LL-175, `docs/reference/dos-time-observation-template.csv`.

### v0.5.60 — DOS weekly happiness and food stress

EVT-001 / ECON-002: no-food state 12 now charges **−2 happiness**; verified no-food state 14 conditionally charges **−4 happiness** plus cash, using the original discrete rolls and fixed $50/$200 caps. Other consumable identities (3–5), rare homeowner/asset accidents and original full state-24 event-code mapping remain unresolved. Pure state-24 happiness deductions are tested but not applied to Life's provisional macro-index events. Classic Finances shows four-week wellbeing; Modern remains unchanged. See ADR-0060.

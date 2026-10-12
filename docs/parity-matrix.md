# Original gameplay parity matrix — architectural backlog

**Architecture revision:** 1.3 · **Implementation baseline:** v0.5.0 · **Evidence:** guide-based, pending binary side-by-side verification.

See [`parity-contract.json`](parity-contract.json), the [documented DOS jobs](classic-job-table.md) and [ADR-0004](decisions/ADR-0004-original-jobs-and-manual-rent.md).

| ID | Mechanic | Original target | v0.5.0 implementation | Status | Priority |
|---|---|---|---|---|---|
| TURN-001 | Per-player weekly turns | One turn per player; week advances after all players finish. | Turn order supports 1–2 humans and AI; 4-human original maximum unavailable. | partial | P1 |
| TIME-001 | 60-hour weekly budget | Start each player turn with 60 hours, original modifier exceptions recorded. | Classic uses 60h (Modern retains 40h), hunger penalties still simplified. | partial | P0 |
| TIME-002 | Movement and building entry | Distance-based movement; entering a building costs 2h. | Classic adds 2h per travel entry on top of simplified ring distance; DOS distance is unverified. | partial | P0 |
| TIME-003 | Action time accounting | Full work session 6h paid for 8h; job application 4h; study 6h; relaxing 6h. | Classic 4h application and 6h relaxation; work 6h/8h pay, study 6h. Partial-work handling unimplemented. | partial | P0 |
| JOB-001 | Single job, workplace locking | Exactly one primary job; work only at its workplace; switching replaces role. | Implemented with explicit switch confirmation. | implemented | P0 |
| JOB-002 | Applications and openings | Requirements + chance-based no openings; failed applications still consume time. | Classic now uses the 37-job DOS/floppy catalog, stat/diploma qualification rejection (+4h/-1 Happiness), qualification-sensitive openings chance and same-week rejection lockout; original RNG order still unverified. | partial | P0 |
| JOB-003 | Work-stat gains and caps | +1 experience/+1 dependability per work session up to job/degree caps. | Classic stat caps now use the DOS 37-job requirement data and completed diploma counts; XP/Dependability capped per authentic role. Work/dismissal edge cases still require DOS comparison. | partial | P0 |
| JOB-004 | Dependability and firing | 20 initial, -3 per week; low stat warnings and dismissal on work attempts. | Classic starts Dependability 20 and decays 3/week; hiring below 10 resets it, low reliability warns, and work attempts below job requirement−5 dismiss without pay. Exact messages/DOS edges unverified. | partial | P0 |
| JOB-006 | DOS-floppy employment catalog | 37 original DOS positions with employer, base wage, XP, Dependability, diplomas and uniforms; preserve CD-only distinction. | 37 documented floppy positions implemented in Classic data; two CD-only jobs omitted; shared modern building venues not 1:1; exact DOS binary comparison pending. | partial | P0 |
| JOB-005 | Wages and raises | 8h pay for full 6h work, current wage; raise prerequisites, wage changes and risks. | Classic uses documented $5–$25 base hourly wages, listed-wage raises (+4h) and half-shift garnishment/$2 interest. Original macroeconomy pricing curve and partial shifts remain different. | partial | P1 |
| EDU-001 | Eleven branching degrees | 11 permanent named degrees with prerequisite edges and possible multi-course progress. | 11 named diplomas and original prerequisite graph now feed 37 DOS job qualifications; course availability/end-condition and original implementation variants still unverified. | partial | P1 |
| EDU-002 | Course time and benefits | Enroll fees and 6h lessons, usually 10 lessons; studies can benefit from durables. | Classic enrollment $50, ten 6h lessons (1–5h partial final time permitted), computer and three-book study aids, graduation +5 happiness/reliability. Enrollment queue and item details require DOS validation. | partial | P1 |
| ITEM-001 | Weekly uniform consumption | Three tiers, weekly wear including unworn; higher tier satisfies lower; budget/premium durations. | Implemented week-based casual/formal/business clothing with tier substitution. | implemented | P1 |
| ITEM-002 | Durables and supply market | Durables have benefits, wear/breakage/theft risks; shops rotate stock. | Ownable items but limited damage and original stock variety. | partial | P2 |
| ECON-001 | Rent cycle and debt | Rent due every 4th week; manual payment/extensions; garnishment/arrears consequences. | Classic cash-paid $325 rent due week 4, four-week billing, extensions, arrears and half-shift wage garnishment with $2 remaining-debt fee. Advanced payments, rental switching, DOS exact timing still partial. | partial | P1 |
| ECON-002 | Weekly food and storage | 1/2/4 fresh-food portions at $55/$100/$190; refrigerator 6, freezer 12; weekly use and spoilage. | Classic food bundles, weekly consumption and 6/12-cap storage implemented. Unrefrigerated leftovers spoil. Medical bill formula and restaurant menus approximate. | partial | P2 |
| ECON-003 | Bank, loans and investments | $100 transfers at no hour cost, loan 2h/$45 principal+$5 interest, 2h broker, 6 markets and fixed $100/$97 T-Bills. | Distinct Classic bank menu, 6 separate prices/holdings, monthly repayments/default tracking, legacy investment recovery. Stock volatility, lending formula and robbery/crash still approximated/not implemented. | partial | P2 |
| ECON-004 | Pawn, repossession and durable economy | Pawn valuables, redeem within time window, other players can buy unredeemed goods. | No equivalent pawn-shop simulation. | missing | P2 |
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

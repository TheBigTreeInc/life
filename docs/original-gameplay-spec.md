# Original *Jones in the Fast Lane* — evidence-backed mechanic specification

**Status:** Reference specification, **not** original binary reverse engineering. Written 2026-10-12. The Sierra DOS archive was provided for this project, but no emulator-based behavior capture has been performed here. Details can differ by 1991 floppy/VGA vs 1992 CD-ROM version (especially event timing).

**Evidence labels:** `documented` = a game guide/rules reference explicitly describes the rule; `cross-check` = multiple independent references agree; `pending` = must be established via manual/direct play. Sources are URLs, cited per topic so that an implementer can re-evaluate them.

## Core weekly loop — TIME-001, TIME-002, TURN-001

- Each player takes one turn per **week**; order cycles through 1–4 human players and/or Jones, depending on setup. **Documented.**
- A normal turn has **60 in-game hours**. Movement consumes distance-based time, with roughly 4h to cross the board and 2h **each time a building is entered**. Running out of time ends the turn when transitioning out. **Documented.**
- Work: up to **6 hours** per action; full shift yields **8 × current hourly wage**, with proportional partial pay when fewer than 6h remain. **Documented.**
- Job and raise applications cost **4 hours**, whether successful or not. A study lesson costs **6 hours**; relaxing costs **6 hours**. Loan application: 2 hours; broker visit: 2 hours. Some actions are possible with at least 1h remaining but deduct the nominal time. **Documented; edge cases should be directly tested.**
- A week is not a turn when multiple players participate. One week advances after every player has finished their current turn. **Documented.**

Sources: [Hour](https://jonesinthefastlane.fandom.com/wiki/Hour), [Locations](https://jonesinthefastlane.fandom.com/wiki/Locations), [Week](https://jonesinthefastlane.fandom.com/wiki/Week), [Turn](https://jonesinthefastlane.fandom.com/wiki/Turn).

## Employment, shifts, dependability and raises — JOB-001…JOB-005

- A character is unemployed or holds **one** job at a particular workplace and wage. Applications happen at the Employment Office; taking a different job replaces the old one. **Cross-check.**
- Each job specifies minimum Experience, Dependability (the original sources often spell it *Dependibility*), required one or more degrees, and uniform. Qualification alone is insufficient: applications may be refused for **no openings**. **Documented.**
- **+1 Experience and +1 Dependability per successful work session**, subject to job- and degree-dependent caps. **Documented.**
- **Experience starts at 10, gaining +2 when a player takes a new job; Dependability starts at 20, loses 3 each week**, and degrees grant +5 on completion. Source reference gives `20 + job.requiredDependability + 5 × totalDegrees` for Dependability and `10 + job.requiredExperience + 5 × totalDegrees` for Experience; DOS overflow handling remains unverified. **Documented.**
- Working warns when Dependability is 3–5 below a job requirement and fires when it falls below requirement minus 5 (not a passive weekly termination). Jobs requiring 10 Dependability can be applied for even below that number; successful hiring brings scores below 10 up to 10. A market crash can terminate jobs as well. Raise applications depend on job, raises already granted, dependability and the economy. **Documented.**
- Original career progress relates to **Dependability** (community reference reports `1.25 × dependability`), not merely the job's title/tier. **Documented in secondary reference, DOS check pending.**

Sources: [Jobs](https://jonesinthefastlane.fandom.com/wiki/Jobs), [Experience](https://jonesinthefastlane.fandom.com/wiki/Experience), [Dependibility](https://jonesinthefastlane.fandom.com/wiki/Dependibility), [Employment Office](https://jonesinthefastlane.fandom.com/wiki/Employment_Office), [Factory job table](https://jonesinthefastlane.fandom.com/wiki/Factory), [Giant Bomb guide](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane).

## Education — EDU-001, EDU-002

Eleven permanent course completions in two roots, with a branching prerequisite graph:

```text
Trade School
├── Electronics
└── Pre-Engineering
    └── Engineering

Junior College
├── Business Administration
└── Academic
    └── Graduate School
        └── Post Doctoral
            └── Research
                └── Publishing
```

The original permits enrollment in multiple courses and accumulating progress toward courses across turns. A $50 enrollment fee purchases a course registration; up to 4 courses may be active, progress persists. Each needs 10 six-hour lessons (computer -1; complete Encyclopedia/Dictionary/Atlas set -1), and graduation grants +5 Happiness and +5 Dependability. With 1–5 hours left, a lesson may use the rest of the available turn, yet still count as a whole lesson. Degrees can unlock specific jobs, and high-end jobs sometimes require **two** degrees. The documented education scoring rule is `1 + 9 × numberOfDegrees`, capped by game constraints; confirm DOS behavior and goal thresholds before implementing exact parity. **Documented.**

Sources: [Degrees](https://jonesinthefastlane.fandom.com/wiki/Degrees), [Hi-Tech U](https://jonesinthefastlane.fandom.com/wiki/Hi-Tech_U), [Sierra Chest walkthrough](https://www.sierrachest.com/index.php?a=games&fld=walkthrough&id=331&title=jones-in-the-fast-lane).

## Clothing and weekly consumables — ITEM-001, ITEM-002

- There are **casual**, **dress**, and **business** clothes. A higher tier satisfies lower-tier uniform requirements. Clothing lasts a number of **weeks**, including weeks when not worn. The player initially has casual clothes for approximately six weeks. Budget clothes are cheaper and expire sooner; quality clothes cost more and last longer. **Documented.**
- Clothing may prevent work, but is not itself the main employment-contract system. Fresh food, some tickets, and other consumables also expire on weekly boundaries. Durable items (refrigerator, computer, books, etc.) have meaningful utility and may be damaged or stolen. **Documented; item-specific rates pending.**

Sources: [Clothes](https://jonesinthefastlane.fandom.com/wiki/Clothes), [Week](https://jonesinthefastlane.fandom.com/wiki/Week), [Giant Bomb guide](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane).

## Food, rent, banking, pawn and random risk — ECON-001…ECON-005

- A monthly cycle is **four weeks**; rent and loan payments become due on the fourth week, with rent extensions, arrears, garnishment and/or default effects if not handled. It is **not** simply a frictionless automatic deduction of all available assets. **Documented.**
- Eating fast food vs buying fresh food, freshness, refrigeration, and weekend events have different economic implications. **Documented; numeric details pending.**
- The Bank supports cash storage, loans, debt payments, and multiple distinct investment markets (e.g., bills, precious metals, stock categories). Bank cash and carried cash differ in theft risk. **Documented.**
- The pawn shop lets players pawn possessions and redeem them within a short period; another player may buy unredeemed goods. **Documented.**
- Weekend surprises, robberies and macroeconomic changes introduce risk. Some events are gated by game week and original edition. **Documented; exact distributions need direct testing.**

Sources: [Week](https://jonesinthefastlane.fandom.com/wiki/Week), [Bank](https://jonesinthefastlane.fandom.com/wiki/Bank), [Giant Bomb guide](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane), [Wikipedia](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane).

## Goals and competition — GOAL-001, GOAL-002

- At setup, participants choose thresholds for **wealth, happiness, education and career**. The first participant to meet all selected targets wins. **Cross-check.**
- Career is tied to a dependability-derived progression in the reference wiki; education is based on earned degrees. Wealth includes multiple liquid/invested balances. Happiness is influenced by goals, activities, goods and events. Formula and cap details for each goal need recorded source-derived tests before claiming numerical parity. **Documented except exact unverified arithmetic.**
- Up to **four human players** could play; Jones can serve as a computerized rival. **Cross-check.**

Sources: [Wikipedia](https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane), [Giant Bomb guide](https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane), [contemporary LA Times review](https://www.latimes.com/archives/la-xpm-1991-02-16-ca-813-story.html), [Degrees](https://jonesinthefastlane.fandom.com/wiki/Degrees), [Dependibility](https://jonesinthefastlane.fandom.com/wiki/Dependibility).

## Version/version-variant and evidence gaps

1. Verify the provided DOS executable build and determine floppy/VGA/CD behavior before hardcoding event probabilities or dates.
2. Create an **original-play observation log** recording build, starting goals, player state, actions and state deltas; prefer screenshots/manual transcripts over guesses.
3. Extract complete job and item tables from attributable references or observed gameplay, then add specific parity tests for each.
4. Confirm the full four-goal score formula and victory timing directly; these are especially prone to inaccurate community summaries.
5. Keep this reference material paraphrased; do not import original expressive dialogue, art, audio or other protected game assets into the published successor.

## v0.5.0 baseline: original employment and rent (JOB-002, JOB-005, ECON-001)

The [37-position DOS job table](classic-job-table.md) is recorded as independently checkable data, keeping the CD-only jobs excluded. Qualified application luck is `30 + (10 + Dependability + Experience + 8×degree count)/3`. Failed applications spend 4 hours and lock the specific no-opening job for the remainder of the turn. Monolith Cook cannot receive a no-opening refusal. Successfully hired job changes replace the existing contract. Exact DOS RNG ordering and econometric fluctuations remain to be verified.

The first Classic low-cost apartment has fixed rent **$325**, first due during week four. The Rent Office processes cash payments (not auto-withdrawals), one-week extensions (first automatic approval; 75%, 50%, 25% thereafter), arrears, and wage garnishment (half gross earnings toward rent debt plus $2 interest if balance remains). Due-week/extension fees and expiration must still be compared against the supplied DOS binary.

References: [Job list](https://jonesinthefastlane.fandom.com/wiki/List_of_Jobs), [Employment Office](https://jonesinthefastlane.fandom.com/wiki/Employment_Office), [Rent](https://jonesinthefastlane.fandom.com/wiki/Rent).

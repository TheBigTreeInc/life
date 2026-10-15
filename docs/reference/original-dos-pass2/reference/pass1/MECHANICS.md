# Jones in the Fast Lane (DOS 1.000.060) — Mechanics Recovery, Pass 1

**Date:** 2026-10-13  
**Purpose:** reference material for *The Life Loop* classic-compatible gameplay and its road/pawn movement system.

## What was checked

The user-provided ZIP contains 22 files (game version `1.000.060`) and two SCI resource packages, `resource.001` and `resource.002`. The `resource.map` has a valid 6-byte SCI0-style index of **299 resources**, ending with a six-byte `FF` terminator. Every indexed resource header was cross-checked against the index. The index exposes **85 script resources**, **92 views**, **50 texts**, **35 sounds**, **14 vocabularies**, **9 fonts**, **7 pictures**, **3 cursors**, **3 patches**, and **1 palette**.

The interpreter file is `sciv256.exe` (DOS executable, LZEXE-packed); `resource.cfg` selects `VGA320.DRV` and `STD.DRV` for video/audio. The original ZIP does **not** contain original human-authored source files. The gameplay findings below are taken from an independently available **decompilation** of the matching game version:

- [Main room and players (`room1.sc`, script 1)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/room1.sc)
- [Board route (`marblePath.sc`, script 101)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/marblePath.sc)
- [Employment (`employment.sc`, script 206)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/employment.sc)
- [Employment's employer-specific job records (`*Jobs.sc`, scripts 216–224)](https://github.com/sluicebox/sci-scripts/tree/main/jones-dos-1.000.060/src)
- [University (`university.sc`, script 207)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/university.sc)
- [AI route planning (`WhereShouldIGo.sc`, script 300)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/WhereShouldIGo.sc)
- [Opening/end-of-turn processing (`startTrn.sc`, script 111)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/startTrn.sc)
- [Market (`market.sc`, script 203)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/market.sc)
- [Economy (`economicIndex.sc`, script 107)](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/economicIndex.sc)

**Confidence:** file types/counts, version, and resource integrity are directly verified against the uploaded binary; the specific gameplay methods are **version-matched decompilation evidence**. The full decompiled text has *not* been bytewise compared against newly decompressed scripts from this ZIP, nor was the game executed in an emulator in this pass.

## 1. The original board route

**Source:** `marblePath.sc` script 101 and `room1.sc` script 1.

- There are exactly **170 path indices**, each defining a `(x, y)` coordinate on the **320 × 200** original board.
- `Place` instances have stable `placeNum` (0–12) and `index` (a waypoint index) properties. They also have separate clickable bounding rectangles and door/presentation coordinates.
- Clicking a destination routes the marble/pawn through script 101, which advances by one indexed waypoint per movement step. It chooses clockwise or anticlockwise based on the **shorter number of waypoint transitions** on the circular route. It does **not** navigate freely across board pixels.
- Path index wraps between 170 and 1. The pawn has an explicit stopping callback when its target index is reached. The renderer can change independently of movement logic.
- The active character is selected from four player records, and the marble changes appearance by player.

### Original 13 board destination anchors

| placeNum | Place | Path index | Path coordinate (px) |
|---:|---|---:|---|
| 0 | Apartments | 1 | (144, 37) |
| 1 | Rent Office | 164 | (104, 39) |
| 2 | Security | 151 | (29, 45) |
| 3 | Black's Market | 134 | (43, 110) |
| 4 | Bank | 120 | (24, 149) |
| 5 | Factory | 107 | (49, 186) |
| 6 | ACNE Employment | 99 | (97, 188) |
| 7 | Hi-Tech University | 75 | (222, 188) |
| 8 | Socket City Appliance | 66 | (276, 187) |
| 9 | QT Clothing | 47 | (276, 121) |
| 10 | Monolith Burgers | 35 | (282, 81) |
| 11 | Z-Mart Discount | 24 | (282, 39) |
| 12 | Pawn Shop | 14 | (222, 40) |

The full waypoint data, normalized `u/v` locations, and these anchors are in `original_route.json`. The click rectangles and door coordinates are **not** the exact same thing as the route anchor. For a new board, bind click targets to place identities, not to nearest arbitrary waypoint.

**Algorithm to port:**

```text
route(originIndex, destinationIndex):
    forward  = (destinationIndex - originIndex + 170) % 170
    backward = (originIndex - destinationIndex + 170) % 170
    direction = choose smaller route; resolve ties deterministically
    emit each waypoint along that direction, including the destination
    on arrival: stop movement, then trigger destination interaction
```

**Example:** Apartments (index 1) → Rent Office (164) = 7 reverse-index transitions rather than 163 forward-index transitions. Monolith Burgers (35) → Z-Mart (24) = 11 reverse transitions. The associated original path does not require A*.

**Modern-board recommendation:** keep a semantic `routeIndex` and a `businessId` on each board location. Define a vector/curve visually independent from game rules and resample it to 170 evenly indexed logical positions for classic mode, or map the historic points' normalized `(u,v)` onto a new route spline. Do *not* assign jobs to a separate list of businesses disconnected from the places.

## 2. Time and turn lifecycle

**Source:** `room1.sc`, class `Player`, method `startTurn`, instance `timeKeep`, `startTrn.sc`.

- In-board time is measured with a counter (`global323`) whose maximum is **60**. `timeKeep` increments it from either an explicit action cost or the game's tick pacing (`global475`).
- A job application in `employment.sc` charges a **4-unit** visit cost when processing a job action. Entering the employment screen adds **2 units** in the decompiled script.
- The `Place` click handler gates movement/interactions depending on time remaining and whether a pawn is already moving.
- `Player.startTurn` initializes the time display, sets the current home-related route start, runs `economicIndex`, then runs `startTrn` events.
- `Player.endTurn` applies reliability loss of **3**, with a floor of 0; it also contains rent, late payment, and item-state processing. Financial actions are not just cosmetic.

**Implementation:** centralize action time costs in `TimeBudget`. Do not make CSS animation duration the authoritative game clock. UI can interpolate pawn movement, but game state and time budget must progress deterministically.

## 3. Employment: 37 jobs / 9 employer locations

**Source:** `employment.sc` (`JobDItem`) and employer-specific job scripts `discountJobs.sc`, `fastFoodJobs.sc`, `clothingJobs.sc`, `applianceJobs.sc`, `universityJobs.sc`, `factoryJobs.sc`, `bankJobs.sc`, `marketJobs.sc`, `rentJobs.sc`.

Each job has a unique `jobNum`, an occupation type, a **base hourly wage**, minimum dependability, minimum experience, up to **two degree IDs**, and a clothing/uniform tier. `original_jobs.json` and `original_jobs.csv` contain all 37 records.

**Hiring evaluation, derived from `JobDItem.qualify`:**

1. Verify required degrees (`education` and `education2`).
2. Verify dependability against the job requirement. There is a special rule for minimum-10 jobs: required dependability 10 is effectively reduced to 0.
3. Verify experience against the job minimum.
4. Calculate the random hiring threshold `30 + floor((dependability + experience + (8 × degreeCount + 10)) / 3)` and compare with a random integer in `[1, 100]`.
5. The cook role (occupation index **44**) has its random acceptance flag forced to success.
6. Failed randomly evaluated applications can be remembered by job number for the current application context.
7. On success set the **actual workplace ID**, `occupation`, `wage`, uniform requirement, and experience adjustments; on promotion/raise some parameters change again.

In the original `JobDItem`, `basePrice` is not guaranteed to be the displayed wage at every economic state: the object is a `CostDItem`, whose `price` may incorporate economic adjustments. Preserve distinct *base pay* and *current pay*.

**Direct relevance to prior prototype issue:** original Monolith Burgers (location 10, script 217) offers Cook, Clerk, Assistant Manager, Manager at base hourly **$4, $5, $6, $7**. Assigning a Monolith job while no Monolith exists on the modern board is a model-integrity bug. Require `job.employerPlaceNum` to point to a registered place. For classic mode, make the job board a view of registered location businesses, not a free-standing catalog.

## 4. Education dependencies

**Source:** `university.sc`, script 207. `original_education.csv` contains 11 degree IDs and direct prerequisites:

- Trade School (10) → Electronics (11) or Pre-Engineering (12) → Engineering (13).
- Junior College (14) → BA (15) or Academic (16) → Graduate (17) → Post Doctoral (18) → Research (19) → Publishing (20).
- The university's course action consumes **6 time units** and has a separate enrolment state. Course completion can increase education progress, experience-credit, and dependability; it is not just a purchased unlock.

The ID values of degree prerequisites in `original_jobs.csv` link directly to these IDs, so we can validate the career/education graph at startup.

## 5. Store and economy examples

**Source:** `market.sc` (script 203), `economicIndex.sc` (script 107).

| Product/action | Base price | Notes |
|---|---:|---|
| Food for one week | $55 | Dynamic basePrice |
| Food for two weeks | $100 | Dynamic basePrice; quantity 2 |
| Food for four weeks | $190 | Dynamic basePrice; quantity 4 |
| 10 lottery tickets | $10 | Fixed price |
| Newspaper | $1 | Fixed price; 1 time unit |

`EconomicIndex` updates an integer `index` (with low/high range influences and random variation), then a `reading` clamped to **10–190**. This is evidence for a central economy service driving market variables rather than keeping unchanging hard-coded shop prices. Further work is needed to trace the exact dependency from economic index readings into every `CostDItem.price`.

## 6. Computer opponent behaviour

**Source:** `WhereShouldIGo.sc`, script 300.

This is **not** an entirely random opponent. Its decision logic examines money, ongoing employment, rent obligations, clothing, available food, owned durables, and what goals have already been reached. The source includes helpers to:

- Find a nearby destination by shortest circular-route index distance.
- Compare candidate sequences of two or three stops and choose the least expensive route (using the same 170-point ring topology).
- Disqualify actions when insufficient time remains.
- Prioritize getting a job when unemployed, and consider food/clothing/rent needs before some other actions.

**Implementation:** use a legible decision policy that generates possible actions, filters by constraints, and ranks them by needs, goals, cost, route distance, and available time. Keep classic heuristics as a selectable profile, and put more sophisticated modern AI behind another strategy profile.

## 7. Goals and player defaults

**Source:** `room1.sc` Player properties; `startTrn.sc` game ending.

- Four independently tracked goals: **money, happiness, education, career**. Each defaults to 50 on the Player instance.
- Winning requires all four current stats to be at least their respective goals.
- Initial Player defaults include **$200 cash**, **$325 current rent**, **20 dependability**, **10 experience**, no current employer, and no outstanding loans.
- The game supports four player slots, with the computer player encoded as a particular `playing` state in the scripts.

## Suggested implementation sequence for The Life Loop

1. **Board identity registry:** add `placeNum`, `businessId`, `routeIndex`, and `interactionHandler` to every board location. Reject jobs whose employer location does not exist. Add runtime data validation.
2. **Classic route implementation:** import `original_route.json`; animate pawn position using waypoint indices and a separate animation clock; enter the scene when the pawn reaches the destination. Include wrap-around and tie-case regression tests.
3. **Employment:** import `original_jobs.json` and `original_education.csv`; implement qualification evaluation, random hiring chance with a seedable RNG, clothing tiers, experience and promotion/raise rules.
4. **Time budget:** make all activities use a single authoritative action-cost service with explicit costs; distinguish travelling visually from actions performed at a business.
5. **Economy and needs:** data-driven goods, food, rent, bank, clothing, education, weekly/monthly processing, and a seeded dynamic economic index.
6. **AI:** port the classic needs/affordability heuristic, with routes scored against the same board travel model as the player.
7. **Victory/QA:** track the four stats independently, test all-win requirements, and add replayable scenario fixtures for classic and modern modes.

## What remains uncertain

- Precise relationship between real movement animation ticks and time-counter increments under all speed settings.
- Full action catalogue and retail price adjustment formulas for every item.
- Exact AI priority weights for all branches of `WhereShouldIGo`, beyond inspected representative branches.
- Byte-for-byte compatibility of the published decompiled game version with these particular installed resource archives.
- Modern project integration was **not** performed: no *The Life Loop* source archive was attached in this conversation turn.

This reference contains **derived numeric/structural gameplay data**, not a repackage of the original game's binaries, graphics, or third-party decompiled scripts.

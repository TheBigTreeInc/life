## v0.5.72 — Mobile gameplay experience

On phones the Classic city always opens in Overview. Tap a building to zoom and highlight it, then tap again to travel. A fixed Work button sits beside Done at valid workplaces and uses the same activity rules. Career and money panels prioritize gameplay information over developer diagnostics. No game-economy or save-format changes.

## v0.5.69 — ZipRunner local-language contract repair

Artifact: `the-life-loop-0.5.72-ziprunner.zip` — full-source ZipRunner release, includes playable `PLAY.html`.

**v0.5.72 DOS timing audit:** corrected `global475` active source quantum to 14 from `room1.sc`; all 156 directed Classic legs have source-AI estimator frame bounds in `docs/reference/dos-route-clock-071.json`. **Playable travel costs are intentionally unchanged** until a DOSBox recording establishes original player clock conversion; no measured match-length parity is asserted.

- Shared `I18n.set(...)` API in `src/i18n.js`; both toolbar and New Game selectors persist and synchronize EN/NL.
- Local `language-campaign.test.cjs` was retained by ZipRunner, absent from the source archive, and previously failed on `/I18n\.set\(/`. This version integrates that call and adds a direct regression rather than suppressing the test.
- Tests, versioned handoff, package/Looprd/art/workboard metadata and release ledger updated to 0.5.69.
- No gameplay engine or save/Looprd API changes. Import v0.5.69 instead of retrying v0.5.65. Windows merged-project testing remains an operator check.

## v0.5.65 — ZipRunner versioned language compatibility repair

Artifact: `the-life-loop-0.5.65-ziprunner.zip` — full-source ZipRunner release with standalone `PLAY.html`.

- **Release ID:** v0.5.65 supersedes the previously distributed same-version v0.5.64 repair archive; all new patches and corrective distributions MUST advance the version.
- **Language:** preserves a functional, persistent `languageSelect` toolbar EN/NL control synchronized with the New Game selector.
- **Build/packaging:** the package builder includes its language compatibility tests; all release, parity, Looprd and asset version markers now agree.
- **Scope:** compatibility/packaging hotfix. Classic DOS mechanics, Modern Story, saves and Looprd API are unchanged.
- **Operator:** import the new 0.5.65 ZIP into ZipRunner (not the old 0.5.64 or repair files), and run tests on the actual merged local project. Original runtime DOS travel validation remains planned separately.

---

## v0.5.64 — Original starting stats and distinct DOS food identity

Artifact: `the-life-loop-0.5.64-ziprunner.zip` — complete ZipRunner source and offline `PLAY.html`.

- **Starting conditions:** Fresh Classic games use the recovered `room1.sc` Player defaults: Happiness **0**, Relaxation **25**, cash **$200**, and no food; this removes the old instant happiness-goal completion. Custom victory goal presets remain configurable; Modern starts unchanged.
- **DOS food model:** Classic distinguishes Black's Market fresh food from Monolith Burger's Astro Chicken, Hamburgers, Cheeseburgers and Fries. Week-end processing applies `startTrn.sc` states 8 → 10 → 12 → 14 → 16, including checking refrigerator/freezer storage **before** consuming a food unit. Fresh food without a refrigerator spoils even when a meal is due; takeout indices 3/4/5 expire each week; Astro Chicken (index 2) can carry forward.
- **Original clock:** Repeated hunger does not shorten a Classic player's 60-unit week. The Modern Story hunger/clock model is unchanged.
- **Save transition:** New Classic games use an explicitly versioned consumable identity; old saves continue on the legacy pantry calculations until a future opt-in migration. Jones emergency food purchases now select a viable diner food without a fridge. Existing saves, Modern, Custom Classic house rules and Looprd wire compatibility are protected.
- **Open:** Exact DOSBox start-screen confirmation, end-to-end game duration, original fast-food item price-paid history, all DOS illness probabilities, and Jones AI balancing from harder original starting conditions (27 of 30 deterministic campaigns meet the prior endurance criterion). Other original economic and multiplayer gaps remain outstanding.

Run `TEST-DOS-FOOD.bat` or `npm run test:dos-food` for the narrow acceptance suite, followed by `node tools/verify.mjs`. The full-source ZIP is for local ZipRunner import; no push/deployment.

## v0.5.63 — DOS pawn pricing and retail/economy source audit

Artifact: `the-life-loop-0.5.63-ziprunner.zip` — complete ZipRunner source and offline `PLAY.html`.

- **Pawn Shop:** New Classic pledges use the original formula (40% of goods-index-adjusted purchase price; redemption at 50% of purchase price), with the item's current **reference price as an explicit stand-in** until individual price-paid history exists. Pawning deducts one happiness; pledging the fridge loses remaining fresh food and another point. New quotes are pinned to the pawn date and protected against modified save payloads; old lots and Modern rates are unchanged. The two-week expiry and broker supply mechanics remain provisional.
- **Retail:** Source-verified Black's Market 1/2/4 week $55/$100/$190 food and ten-ticket lottery are retained and now tested across economic readings.
- **Economy and events:** Original per-index source arithmetic and random headline eligibility are available as a deterministic **read-only** comparator, without replacing the existing compatibility economy and risking saved state / changed RNG draws.
- **Remaining:** Precise per-item historical purchase prices, pawn counter six-slot rule, original resale lifecycle, source-driven eight-index economic migration, original event-probability integration and four-human Classic rounds.

Run `TEST-RETAIL-PAWN.bat`, then `node tools/verify.mjs`. See `docs/decisions/ADR-0063-source-retail-pawn-economic-audit.md`.

## v0.5.62 — Original Jones AI source gates, priority and replay

Artifact: `the-life-loop-0.5.62-ziprunner.zip` — complete ZipRunner source plus offline `PLAY.html`.

- **WhereShouldIGo.sc original branch gates:** Correct two-raise cap and dependability requirement (`minDepend+10+5×raises`); source-linked promotion cap check, work skill-gap estimate, relaxation-driven rest priorities and eligible study cash/enrollment precondition.
- **Survival decisions:** Correct Black's Market food-purchase branch identity to **#27**, retain playable food/rent/employment/clothing priority, and cap the two-check relative-aid streak to stay consistent with save/load. All readable in the Career Roadmap decision trace.
- **Parity honesty:** The recovered predicates and their order are source-grounded, but the entire DOS SCI branch tree, its random gates, original travel quantization and economic utility weights are **not** yet ported. Existing practical reserve and promotion-action heuristics remain explicit. See `docs/decisions/ADR-0062-jones-source-branch-priorities.md` and `docs/reference/dos-jones-branch-audit.md`.
- **Compatibility:** Classic and Custom Classic retain the existing house rules, forced return home, multiplayer snapshots, locally saved games and game versions. Modern employment/AI remains separate. No Git publish or Looprd protocol change.

Run `TEST-JONES-AI.bat` for focused cases, then `node tools/verify.mjs` to rebuild fully offline and Pages versions.

## v0.5.61 — Classic food storage penalties, loan schedule and rent-pay comparison

Artifact: `the-life-loop-0.5.61-ziprunner.zip` — complete ZipRunner source and offline `PLAY.html`.

- DOS **startTrn.sc state 10**: discard remaining unrefrigerated fresh food (−2 happiness) and trim excess fridge/freezer stock (−1 happiness). Existing meal-then-storage ordering remains temporarily for playable Classic + rival; reversing it prematurely caused hunger and rent-debt regressions in seeded games. `docs/decisions/ADR-0061-classic-food-loans-and-paycheck-evidence.md` tracks the remaining change.
- DOS **state 20**: loan monthly check is now keyed to the **completed week 4/8/12**, not the next week number. A first missed payment produces a notice, without our earlier invented −3 happiness; subsequent missed-month −1 is a documented approximation pending DOS `paySched` mapping. Existing payment amount, monthly credit model and rent bills are kept.
- **n108.sc rent wage garnishment**: expose an exact **read-only** source comparator for 1/3/6-unit paychecks, with the original full-six-unit basis and surprising partial-shift outcomes. Live transactions remain the bounded compatibility formula until DOSBox confirms the source's accounting (do not silently mint income). Includes tests and user-visible comparison in the work preview.
- Classic Custom no-spoilage rules, Modern, save/network schemas, economy and travel remain supported. No Git push or live deployment.

Run `TEST-OBLIGATIONS.bat`, then `node tools/verify.mjs` to regenerate offline and Pages artifacts. Source-recovered rules are labeled separately from still-provisional runtime behavior.

## v0.5.60 — DOS food-stress happiness and weekly wellbeing audit

Artifact: `the-life-loop-0.5.60-ziprunner.zip` (complete source, playable offline HTML, reproducible source-state tests).

- Classic missed-food Happiness now follows original `startTrn.sc` state 12 (−2), with a **conditional state 14** −4 happiness and a $30…capped cash loss; the verified branch is limited to no food (not all DOS consumable identities).
- A bounded four-week happiness/cash/relaxation audit appears in Classic Finances. The original economic headline state-24 numerical table is tested but is **not yet used** by our provisional market triggers.
- Modern remains unchanged, and original source ordering, return-home debt, house rules, saves, and social/Looprd interfaces are preserved. Starting happiness 62, housing comfort, rest and item effects still require original DOS runtime evidence.
- Run `TEST-HAPPINESS.bat` or `npm run test:happiness`, then `node tools/verify.mjs` for both offline and Pages. See [ADR-0060](docs/decisions/ADR-0060-source-food-cash-stress-and-happiness-audit.md).

## v0.5.59 — Clock boundaries, actions and audit harness

Artifact: `the-life-loop-0.5.59-ziprunner.zip` (complete source, offline PLAY.html and route evidence matrix).

- Classic's **zero-unit clock no longer prevents zero-time banking and shopping interactions** in the current building; timed actions and new travel still require sufficient clock. Original source/community turn description permits venue transactions after the meter reaches 60, until leaving the location.
- The previous ten-event-per-week cap is **optional** (`Game Settings → House Rules → Restrict to ten venue actions`), default **off** in Classic. It was never proven to be the original game rule. Old saved counts remain valid; Modern is unchanged.
- Added a source-identified **seven-route waypoint/clock scenario matrix** and a bounded SCI frame estimator. **Important:** this is an estimated original-AI tick model, *not* measured player travel hours. No unsupported conversion constant was installed; original walking clock charges stay provisional.
- Same gameplay environments, saved progress, homeward overtime, Social/Looprd API and translations. `docs/decisions/ADR-0059-clock-end-actions-and-route-evidence.md`, `docs/classic-parity-worklog.md`.
- Test: `TEST-TIME.bat` / `npm run test:time`, and `node tools/verify.mjs`. Open `PLAY.html` to check zero-time bank/food purchases and the new house-rule checkbox.

## v0.5.58 — Source-corrected Classic goal scoring and progress

Artifact: `the-life-loop-0.5.58-ziprunner.zip` (complete source, offline PLAY.html, workboard and parity worklog).

- Classic progress is now weighted by the **actual goals** (DOS `viewGoals.sc`), not an equal average of goal percentages. All four thresholds must still be achieved individually.
- The career stat advances in **10-point steps per 8 Dependability**, only while employed; completed diplomas contribute the original `0 / 1 + 9×degrees` education award formula. Partial-study goal credit is held for DOS runtime reconciliation.
- The Classic goal panel displays current score/target point values and weighted overall percentage. Modern scoring and current starting Happiness are untouched.
- Continued full offline/Pages builds, deterministic tests and old-save/Custom Classic house-rule isolation. Worklog: `docs/classic-parity-worklog.md`; ADR-0058.

## v0.5.57 — Closing-week food trace, match-length goals and Dutch setup

Artifact: `the-life-loop-0.5.57-ziprunner.zip` (complete source, offline PLAY.html and ZipRunner manifest).

- Classic food close now includes the *completed* week number in deterministic trace; the validated reducer preserves existing pantry, hunger, happiness and source state 2/4/6 order. No DOS-exact storage RNG is claimed.
- Game Settings supports **Quick (30), Standard (50), Extended (75), Custom** targets for each of the four life goals. Higher targets lengthen the *goal challenge*, not per-action animations or AI speed. These are selectable UX targets, **not historically verified Sierra modes**.
- Setup supports **English/Nederlands** for the new pacing controls and goal names, with English fallback and browser-local language storage. This is not yet an entirely translated game.
- Carry-home overtime, custom house rules and both Classic/Modern mode mechanics remain present; old saves retain their previously saved goals.
- Full suite: `node tools/verify.mjs`; Windows local: `TEST-LOCAL.bat`. The Looprd YAML release identifier advances to 0.5.57 by project version gate, but the component route/API is unchanged. No automatic push/deploy.

## v0.5.56 — Homeward animation and expanded house rules

Classic's forced trip home is now animated on the existing street route before the end-turn command is committed, so the next hotseat player is never revealed during the walk. Skip Travel and reduced-motion remain supported. **The engine still charges the full homeward travel cost and carries any overtime to the next week.** Three independent per-game switches now control leftover food spoilage, the happiness penalty for late rent (not the rent debt itself), and weekly market fluctuations. Classic/Modern remain distinct game families. Existing saves preserve their original behavior through defaulted rules. No Looprd/Social server migration.

Source checks: `node tools/build-pages.mjs && node tools/verify.mjs`. Interactive browser and real host/guest acceptance remain operator checks. See ADR-0056.

Artifact: `the-life-loop-0.5.56-ziprunner.zip`

# The Life Loop — v0.5.49

## v0.5.43 — Workboard lifecycle reconciliation and household maintenance

The source workboard now explicitly reconciles historical and current stable task IDs into Done, Blocked, In Progress and To Do; see `docs/workboard-reconciliation.md` and `docs/workboard-lifecycle.json`. The **active ZipRunner import remains v1**, which does not currently offer verified Blocked/In Progress transitions. This source record is not a claim that cards changed in the ZipRunner UI. `tools/reconcile-workboard.mjs --check` is mandatory for packaging. Classic household repair quotes and the rival protect a two-week survival reserve; Modern and saves are unchanged. Run `TEST-LIFECYCLE.bat`. See ADR-0043.

## v0.5.41 — Classic household and art-independent entrances

The Classic board now shows a road-anchored arrival door sign, independent of replacement art. Classic household item condition controls whether a computer can earn project income and stereo/VCR rest comfort. Relaxation-only rest is available as a venue action. Existing saves and Modern rules remain intact. The full **13-location designer handoff** is in `docs/classic-designer-handoff.md` with a board schematic (`docs/classic-board-layout-reference.png`), and a print-ready DOCX is distributed separately. The 26 custom card/detail WebPs remain optional until approved. Run `TEST-HOUSEHOLD.bat` or `node tools/verify.mjs`. See ADR-0042.


**Playable original browser game**, inspired by the rule loop of *Jones in the Fast Lane*. `Classic Rules` is an evidence-based reimplementation **in progress**, not yet a 1:1 binary match. `Modern Story` keeps its independent progression and city stories. Era choices (Historical, Contemporary, Sci-Fi) affect graphics, not mechanics.

## v0.5.33 — Classic time, original tick estimator and work-action progression

- **Original DOS route estimates:** `src/classic-time.js` models the original AI's per-leg waypoint tick estimate `steps + 2×20` for a traveled leg. Logical movement continues to follow the historical **170 original waypoints**; the adapter that deducts movement time from the playable **60-unit** weekly clock is deliberately still provisional until calibrated against the DOS runtime.
- **Employment Office entry:** A Classic trip into ACNE/Employment now spends **2 additional clock units**, included in the same **atomic movement quote** so a rejected trip spends nothing. The application itself remains a separate four-unit interaction, and visiting the current location costs nothing. All time costs are displayed before traveling.
- **Work progression recovered:** Each **successful work action** grants one experience and one reliability step (up to its job-dependent cap), even for late partial shifts. **Pay** still truncates the `8×hourly×remaining/6` amount independently each action, exactly as established in DOS pass-2 reference math. Historic six-hour pooled progression was a prototype approximation and is now retired; old save's unused pooled work credit is ignored.
- **Smarter source-compatible route decisions:** The Classic rival's two/three-stop itinerary comparator uses the DOS per-leg route-tick estimate, while feasibility continues to check **the same action clock** the human consumes. The roadmap and route preview distinguish estimates from real gameplay charges.
- **QA:** `TEST-TIME.bat` and `npm run test:time` run the time/work regressions; `node tools/verify.mjs` builds the **offline single HTML** and **GitHub Pages** versions and performs the full source gate. `src/classic-time.js` is included in both builds, with Modern behavior left independent. See ADR-0034 and the updated parity matrix.

**Reference limitation:** The recovered source provides the **AI route tick estimate** and fixed agency entry/work action costs. It does not yet establish a definitive mapping from animation speed/waypoints to each playable clock unit; avoid asserting complete DOS travel parity until an emulator trace confirms it.

## v0.5.32 — Jones career, education and long-unemployment migration

- **Ordered, source-tagged decisions:** After essential job/rent/food protection, Jones now follows recognizable `WhereShouldIGo.sc` branch families: 20 (renew uniform), 28 (seek raise), 29 (promotion), 30 / 46 (work), 32 / 37 (rest), and 44 (attend university). Only branch identifiers and general priorities are source evidenced: thresholds and cadence remain explicitly provisional.
- **Original employment recovery:** Count unemployment weeks and failed applications for each Classic player. A long-unemployed rival prioritizes the legitimately guaranteed hiring-roll Monolith Cook occupation #44, without bypassing qualifying requirements, travel, or application time. Successful hire resets counters. Additive save fields default to zero for old files.
- **More sustainable workwear:** Formal/business uniforms are included in the two-week renewal check, which supersedes discretionary coursework. This prevents a seeded campaign from permanently losing its income source after a formal uniform wears out.
- **Money and time safeguards:** Raise and promotion planning reference the worker's *actual signed wage*, not a listing alone; school uses existing original prerequisite paths and tuition/enrollment, with budgeted food/rent and required clothing. Traces appear in Classic Career Roadmap.
- **Testing:** Run `TEST-AI-CAREERS.bat` for focused cases, or `node tools/verify.mjs` for the full ZipRunner gate. See ADR-0033. Exact DOS wage negotiation odds, full AI branch ordering and route-hour conversion remain unverified. Modern is unchanged. No Git push.

## v0.5.31 — Economic crisis events and recovery-aware Jones

- **DOS-supported crisis outcomes:** `src/classic-economic-events.js` uses the supplied `startTrn.sc` pass-2 record for strength-1 savings loss plus dismissal, and strength-2 dismissal or truncated 80%-wage with integer binary draw. Source happiness penalties (−7 dismissed, −3 cut) are applied to Classic humans and rivals using the same reducer.
- **Source-inspired, intentionally provisional trigger:** The shared 8-index economic model now classifies weekly downturn, recovery, and boom signals; crisis chance, cooldown, phase thresholds, and recovery happiness magnitude are **not yet DOS verified**. Infrequent seeded shocks follow negative general-economic weeks. Incidents are journaled and affect all participating Classic players. Existing contracts otherwise remain stable.
- **Rival employment loop fix:** An unemployed Jones now **applies at the Employment Office before leaving for groceries**. Previously, a post-crisis rival could oscillate between the office and Black's Market. Job planning also compares advertised pay with real prior contracted wages. Downturn weeks add a small non-mutating food reserve to the opponent's spending plan.
- **Transparency & portability:** Classic Finances labels the economic phase and last shock week; source-linked economic events are in the existing bounded journal. `classicEconomicPulse` is a validated additive save field; older saves pick a neutral starting cycle at their existing week. `Game.load` now also clones player records so parallel restores cannot mutate each other through shared references.
- **Verification:** `TEST-CRISES.bat` runs focused source/recovery tests, `TEST-ECONOMY.bat` checks existing indices, and `TEST-LOCAL.bat` validates complete production source. See ADR-0032. Original DOS weekly event probabilities and scandal random order still require emulator traces; **Modern remains unaffected**. No automatic push to Git.

## v0.5.30 — Coupled Classic economic indices and contract-aware AI

- **Eight source-backed index identities:** A new pure, seed-replayable Classic economic model tracks the original general, investments, goods, gold, silver, pork, blue-chip and penny-stock domains. Readings start at 100, stay within 10–190, and update once per game week. **Their drift/correlation rates are designed approximations**, not yet recovered exact SCI formulas.
- **Connected financial gameplay:** Consumer goods keep their Pass-2 integer pricing; new job offers now respond to the general economic reading, while bank instruments use their own market index. T-Bills remain fixed-price. Previously negotiated hourly pay stays unchanged until a new hire or raise; existing portfolio units and saved prices are preserved.
- **Survival-aware rival:** Forecast food reserves account for potential near-term price increases. Job switches must improve *actual* contracted wages and cannot burn immediate food/rent reserves for a job title; the source-tagged emergency planner can use original pawn-branch identities 11/23 if essential money is otherwise unavailable.
- **Inspectability:** Classic Finances shows all eight readings and their most recent weekly changes. Career Roadmap shows current goods/general indices and advisory food outlook; economic week events and rival decision traces are preserved.
- **Backward compatibility:** Imports existing v0.5.29 Classic saves by deriving the new index object from prior goods reading and scalar; additive object is validated in incoming snapshots. Modern Story calculations are isolated. No Looprd endpoints or route/board IDs change.
- **Regression:** `TEST-ECONOMY.bat` or `npm run test:classic`; full `node tools/verify.mjs` now requires the new migration tests. Exact DOS salary binding, full original market variance, stock crashes and full AI precedence remain outstanding (ADR-0031).

## v0.5.29 — Original DOS Pass 2: economic prices, events and ordered Jones rules

- **New source module:** `src/classic-pass2-rules.js` implements integer-truncated DOS goods prices, partial wages, lottery prize thresholds and rent-extension d12 odds. Based on supplied pass-2 model, without claiming byte-for-byte SCI parity.
- **Economic price engine:** Classic shop goods now quote and charge against the live goods reading (initially 100; bounded 10–190). The index's *weekly drift* is seedable but provisional: source-level multi-index interdependencies and wage adjustments are not yet fully migrated. Modern pricing unchanged. Fixed-price 10-ticket bundles ($10) and newspapers ($1) do not inflate.
- **Lottery and rent:** Classic's lottery uses one 0–500 draw per ticket stack; winnings $5,000/$500/$200 follow the original thresholds, and the whole stack clears. Rent-extension approval follows original roll-on-d12 odds, without repeat-spamming after a refusal.
- **Work:** Pay from a 1–5 unit partial shift rounds **down per shift** instead of carrying fractional dollars between shifts. Full shift still pays 8× hourly wage. Stat-credit accumulation and overdue-rent garnishment remain explicitly provisional pending DOS runtime traces.
- **Rival priority and inspectability:** Added pure source-tagged ordered checks for unemployment, rent, liquidity, food, wardrobe, and emergency work; the original 170-waypoint route is reused. Existing qualified career planner remains fallback for uncovered branches. Decision trace, weekly lottery/economy events and current goods index are visible in Classic Career Roadmap; goods index shown in board ticker.
- **Save compatibility:** Older saves default to goods index 100 and empty event/AI journals; new snapshots retain these Classic-only fields for deterministic replay. Modern rules, board geometry, and existing job IDs are unchanged.
- **Reference and traceability:** `docs/reference/original-dos-pass2/` contains the full supplied mechanics/data/tests reference. ADR-0030 and the workboard distinguish *source-derived formulas* from *approximate gameplay*. The 47 Python reference tests are independent of the JavaScript regression suite.
- **Quick test:** `TEST-DOS-PASS2.bat` or `npm run test:classic`; full release gate `node tools/verify.mjs` regenerates offline PLAY.html and GitHub Pages. No automatic Git push.

## v0.5.28 — Source-linked Classic career and survival migration

- **Original numeric education:** all 11 `originalDegreeId` identifiers and prerequisites are verified against the user's original DOS educational reference. Classic job qualification uses the source requirements for every job, fixing four old experience discrepancies (Socket City Salesperson, Factory Janitor, Bank Janitor, Rent Office Groundskeeper). Durable Life Loop job/degree save IDs are unchanged.
- **Reproducible hiring:** seeded 1–100 integer draw follows the documented DOS threshold; Monolith Cook (occupation #44) is automatically accepted when otherwise qualified. An unqualified application still consumes the established Classic application action/time as before. Qualified hiring odds are shown in Employment and in the Career Roadmap.
- **Survival budget:** a *non-mutating* two-week reserve calculation distinguishes cash from withdrawable bank savings, considers impending rent, consumable fresh food, and expiring job uniforms. Figures are an actionable forecast, not automatic expenses. No save schema changes.
- **Career progression:** a deterministic job-linked degree planner scores studies by reachable improvements in earnings, missing degrees/stat thresholds, and real Classic waypoint travel. The rival uses the plan only when it has substantial discretionary cash after essential reserves.
- **Rival upgrades:** job changes now value several future paychecks rather than comparing an increased wage to a single shift's cost, preventing a long-term $5 starter-job trap. Classic can work partial shifts late in the week. Modern mode does not use this logic.
- **UI and transparency:** the Career Roadmap shows source DOS degree numbers, historic base wages separately from the still-playable values, and a two-week essentials forecast. Original exact economic-index salary transforms and full DOS AI priority weights remain unverified; no claim of full parity.
- **Fast Classic checks:** double-click `TEST-CAREERS.bat` (or run `npm run test:classic`) to test employment, education and rival survival, then launch the bundled HTML without rebuilding.
- **Verification:** `node tools/verify.mjs` builds offline and Pages editions and runs source, browser/wiring, and 100-seed Classic rival regressions. `TEST-LOCAL.bat` works for Windows. No Git push.

## v0.5.28 — Original DOS route, workplace identities and smarter Classic rival

- **Authentic IDs:** 13 original `placeNum` keys and matching 170 indexed `marblePath` waypoints, from the user-supplied reference data for DOS v1.000.060, are now imported. Original location identities are attached to Classic board venues and preserved independently of visuals/Modern Story.
- **Road travel:** closest clockwise or anticlockwise original waypoint route is calculated by the engine; desktop and mobile pawns interpolate those exact waypoint indices along the current 14-anchor visual road. Time costs are **provisional** (3h + floor(waypoint transitions / 25)); original DOS movement-hour equivalence is not yet established.
- **Careers:** all 37 Classic job IDs link to distinct original employers and actual Classic board locations. Original `jobNum`, base pay, numeric degree/stat requirements, uniform and occupation are available as reference metadata; the existing playable wages are intentionally unchanged. Job applications show the DOS role ID/reference base wage and current Life Loop offered wage separately.
- **Classic rival:** the AI plans up to three destinations with the same 170-waypoint route, scores employment choices using qualification, hiring probability, salary improvement, commute, outfit cost, food and rent reserves, and chooses cheaper two-stop rent+food itineraries. Modern AI untouched.
- **Validation:** run `TEST-ROUTES.bat` for reference+route smoke or `TEST-LOCAL.bat` for full checks. Reference source and confidence boundaries are in `docs/reference/original-dos-pass1/` and ADR-0028. No new save fields or Looprd protocol change.

## v0.5.24 — Original Classic board and financial hazards

- **Classic** uses Sierra's thirteen distinct location identities arranged around the original 5-column × 4-row map, with Low-Cost Housing and Le Security Apartments separate, and Z-Mart and Black's Market as independent shops and workplaces. **Modern Story** retains the existing New Day City map and location labels.
- Classic employment, moving, food purchasing, relaxation and travel now use the matching original-style Classic destination instead of a mismatched modern venue.
- Appliances/electronics now track store quality and broken state. Discount-purchased equipment fails more often than Socket City purchases; repair at Socket City restores its gameplay benefits. Rates are **provisional**, pending DOS observations.
- Wild Willy can steal carried money during Bank or Black's Market transactions, or durable goods during a Low-Cost Housing burglary. **Le Security Apartments** prevent home burglaries but not shop robberies. Probabilities are provisional.
- Classic board artwork uses an explicit thirteen-slot optional manifest. Until the new images are supplied, it uses bundled Contemporary art as placeholders; no image is requested from a remote server.
- Existing game logic, Modern balance and Looprd message protocol remain stable. Original rule formulas, physical board travel time and event probability exactness still need DOS verification.

See `docs/decisions/ADR-0025-classic-original-board-and-economic-risks.md`, `docs/classic-board-art-request.md`, and `tests/classic-map-risk.test.cjs`.

## v0.5.25 — Classic board route and quick local test

The Classic map now displays a source-defined road and visible pawn markers. After a successful travel command, your pawn moves on the road before the centered venue menu opens. All travel-hour calculations and turn constraints remain in the game engine; animation is cosmetic. `?debugRoutes=1` labels each route node. Modern Story remains on its original board without this overlay. Custom artwork is optional.

**Test locally on Windows, without GitHub or ZipRunner:**

- **Quick launch:** double-click `PLAY.bat` to open the included fully offline game **immediately**. No dependencies, web server or rebuild necessary.
- **Full local verification:** double-click `TEST-LOCAL.bat` (requires Node.js 22+). It runs `node tools/verify.mjs`, rebuilds `PLAY.html`, and opens the game only after the tests pass.
- **Terminal:** run `node tools/verify.mjs` and then `start PLAY.html` from PowerShell in the extracted folder.

The local test does not establish that a deployed Looprd server supports live two-device movement; that remains a separate acceptance test.

## v0.5.26 — One travel graph, route preview and mobile street layout

Classic now calculates movement hours and pawn animation distance from the same validated graph. **The familiar hourly costs do not change**; the graph merely prevents them from disagreeing with the road. Hover or keyboard-focus a Classic storefront to preview the highlighted shortest street, road segments and remaining-time warning **without spending hours**. All Classic cards display a small travel-cost label. On narrow viewports the Classic board arranges locations along a winding street instead of drawing long diagonal roads through neighboring buildings. The return lane runs outside the left edge; animation adapts to resizes. Modern locations and timing, saved games and the Looprd wire contract are unchanged.

**Fast local route smoke:** run `TEST-ROUTES.bat` from the extracted ZIP (requires Node 22+); it runs the route and clock unit tests, then opens the packaged `PLAY.html`. `TEST-LOCAL.bat` still runs the entire verifier and rebuilds offline files. Optional real-browser QA (Python + Playwright + Chromium): `python tests/qa_routes.py`. Use `?debugRoutes=1` to inspect route nodes when supplying final board art.

See [ADR-0027](docs/decisions/ADR-0027-shared-travel-graph-preview-and-responsive-streets.md), `tests/classic-route-clock.test.cjs` and `tests/qa_routes.py`.

## How to play

1. Open `PLAY.html` in Chrome/Edge (offline) or run `PLAY.bat` on Windows.
2. Start **New Game**, choose Classic or Modern, set era and goals.
3. Classic: visit Employment Office, apply through the employer filter, and work at the original named workplace.
4. Classic: in **week 4**, visit the Rent Office and pay the $325 rent in **cash**. The office reopens on future due weeks.
5. Export JSON save backups; browsers isolate local saves by origin, so file:// saves will not automatically appear on GitHub Pages.

## Verification and architecture

```sh
node tools/verify.mjs
```

Read `ARCHITECTURE.md`, `docs/parity-matrix.md`, `docs/classic-job-table.md` and `docs/decisions/ADR-0004-original-jobs-and-manual-rent.md` before gameplay changes. ZipRunner should apply `.ziprunner-workboard-update.json` only after verify succeeds. `node tools/build-pages.mjs` produces the static Pages site in `dist/`.

## Limitations

Original DOS gameplay has **not** been run side by side here. Era visuals are new, not extracted assets. Exact historical price swings and loan approvals, exact pawn rates/deadlines, spoilage medical bills, market crashes, equipment failure/robbery probabilities, four-player hotseat and original per-step travel timing remain unverified. Do not redistribute the original DOS archive in this package.

## GitHub Pages

Push the flat-root source to a public repository on `main` and set Settings → Pages → GitHub Actions. `.github/workflows/pages.yml` verifies and publishes the game automatically. No Git push or live Pages deployment is performed by the ZIP.

## ZipRunner

Project: `the-life-loop` · Artifact: `the-life-loop-0.5.53-ziprunner.zip` · Full source, flat-root ZIP. Drop into `C:\Users\dorbi\source\_ziprunner_inbox`; run `node tools/verify.mjs`. Preserve `.git` and machine-local settings.


## Classic economy improvements — v0.5.1

- At the **bank**, transfer $100 at a time at no action-hour cost. Apply for loans (2 hours); make recurring $45 principal + $5 interest payments. Enter the **broker** (2 hours) to trade one unit at a time across six separate instruments including 3%-fee T-Bills.
- At **Black’s Market** (the Fresh & Frugal board tile in Contemporary), purchase one, two or four portions of fresh food ($55/$100/$190 base), newspaper or lottery tickets. A fridge stores six; adding a freezer expands storage to twelve. Fresh food is consumed automatically at weekly transitions. Spoilage creates a provisional doctor charge.
- All six quoted base instrument prices are based on published gameplay references. Stock volatility, bank loan approval, doctor charge and original economic event probabilities remain **approximations**; consult ADR-0005 for scope.
- Prior Classic savings and generic investment saves continue to work; old investments can be redeemed through the broker. Existing Modern saves and rules are unaffected.

**Tests:** `node tools/verify.mjs` (includes `tests/classic-banking-food.test.cjs`).


## Online co-op with Looprd (v0.5.2)

You can host a game in the browser with **New Game → Online co-op**, choose a Looprd endpoint, and share a ten-character friend code. A second player uses **Online co-op → Join** or the generated link. Both browsers connect to Looprd WebSocket events; game commands use authenticated HTTP because dapi/Looprd v1 does not offer bidirectional WebSocket RPC. A persistent Looprd host (not GitHub Pages alone) is required. See [docs/looprd-multiplayer.md](docs/looprd-multiplayer.md) for source registration, CORS, HTTPS/WSS, security and tests. Legacy hotseat/single-player still work without a server.


## Mobile and Looprd FQDN improvements — v0.5.3

Phones and tablets use the City, Activities and My life bottom tabs. Tap a building in City to navigate and automatically see its actions. The top summary shows the active player, week, remaining hours and cash. On phones the city map becomes a two-column illustrated storefront grid; larger buttons, scrollable setup dialogs and safe-area padding make touch use practical. Nothing about these views changes Classic or Modern rules.

For **Online co-op**, enter only the Looprd API server FQDN, such as `api.server.country` (or `https://api.server.country`); the game appends `/looprd/the-life-loop/v1` and automatically uses `wss://` for event notifications. Invitations carry the FQDN and friend code, not participant credentials. GitHub Pages serves the frontend; multiplayer requires a separately running Looprd server with CORS/origin configuration.

Read [ADR-0007](docs/decisions/ADR-0007-responsive-mobile-layout.md). Desktop keeps the three-panel view. Full two-device, real iOS and real Android verification remains a deployment/operator check.


## GitHub Pages metadata repair (v0.5.3)

If GitHub Actions reports `Project/version mismatch` and missing workboard tasks despite the app being at v0.5.3, inspect `.ziprunner-workboard-update.json` in the **GitHub repository**. An old 0.4.1 copy remained on GitHub after later game changes were committed. ZipRunner processing a workboard update does not guarantee the JSON file was committed.

Commit `.ziprunner-workboard-update.json`, `ZIPRUNNER_HANDOFF.txt`, `WORKBOARD.md`, and `tools/verify.mjs` from this release to the repo `main` branch. Then run `node tools/verify.mjs` and check the Pages workflow. No gameplay changes were made in this repair.

## v0.5.4 — ZipRunner release metadata revision

This release corrects the previously unversioned v0.5.3 CI/workboard repair. All deployment-relevant version markers now agree (`package.json`, `.ziprunner-workboard-update.json`, `docs/parity-contract.json`, `looprd.yaml`, `ZIPRUNNER_HANDOFF.txt`, and the browser footer). The packaging script derives its artifact name from `package.json`. **No gameplay or save-format changes.** Commit the whole release to `main` to avoid the stale-manifest Pages error.

## Sliding panels and turn clarity — v0.5.5

On laptop and mid-size desktop displays (1025–1599px), Your Story and Your Destination are slide-out edge panels. Orange notification circles indicate new story information or newly available destination actions; viewing clears the indicator. On large desktop screens (1600px and above) both panels stay visible. The phone/tablet City/Activities/My life tabs continue to work and display the same notifications.

Save, Load and How to Play are now under the top-right Menu. The persistent turn banner states whose turn it is, whether you may act, host/guest identity, and live WebSocket versus HTTP fallback status. Open Online co-op for room diagnostics and a **Check Looprd component API** button; this requests `/looprd/the-life-loop/v1/info` and expects protocol `the-life-loop/1`. This is an API registration check, **not** proof of a production-ready deployment or correct two-machine synchronization; verify against a real Looprd instance. No simulation or protocol changes.

## Offline reusable characters — v0.5.7

Open **New Game → Your Character → Create / manage characters**, or **Menu → My characters**. Create up to sixteen profiles. Customize name, skin tone, hairstyle, hair color, outfit, favorite color, expression and personality; portrait preview updates immediately. Select any profile to start a new game, or continue using a quick name without saving a character. For local two-player games, a separate Player 2 character can be chosen. Online join lets guests reuse a locally saved display name; full guest portrait propagation is deferred until a compatible Looprd protocol change.

Profiles persist in the **current browser and site origin**, separate from game autosaves, under `the-life-loop-characters-v1`. Clearing site data removes profiles. Offline file:// and published HTTPS Pages do not share browser storage. Appearance chosen for a game is included in saved-game JSON and host snapshots; local profile IDs and the rest of the profile library are not. No gameplay attributes, costs, Classic rules or multiplayer server schemas changed.

## Multiplayer character appearance, chat, and viewport layout (v0.5.7)

On join, the guest's chosen character appearance and display name are validated and copied into the room's shared game state. All other locally saved profiles stay on the guest's device. The host and guest receive the same character through standard room status/snapshot updates.

When two people are in a room and their Looprd WebSocket is connected, **Chat** appears in the top bar. Chat sends authenticated, AES-GCM-encrypted packets using Looprd's existing HTTP handler, then uses its native WebSocket notifications to deliver immediately; Looprd does not support bidirectional RPC over WebSocket. The game stores no chat messages in SQLite, save data, localStorage, sessionStorage, or snapshots. Messages live in an in-memory browser panel while connected and are lost on disconnect, missed notifications, refresh or device reconnection. Because default Looprd event subscriptions are public, messages are encrypted with a random room key returned **only** to authenticated participants. The room key is kept server-side in private Room data and returned on authenticated join/status/create, and is never placed in the invitation link. See `docs/looprd-multiplayer.md` and ADR-0010 for operational guidance.

**Deployment requirement**: `looprd.yaml` database schema revision is **2**; the `Room.chatKey` field is new. Before replacing an existing Looprd component, back up the database and migrate the field (and consider existing active room keys). The live Looprd deployment has not been verified here. Deploying the HTML alone does not update the server.

The game shell now fits the browser viewport without body scroll. Long story/activity detail panels and modal dialogs have their own scrolling where needed. On mobile, the city becomes a compact 3-column grid and New Game is a three-step wizard. Keyboard-open on very small phones may still require internal dialog scrolling.

## Contemporary City artwork — v0.5.8

Eleven location-specific player-supplied paintings replace generic procedural building facades for Contemporary/New Day City. The rendered city cards load 448px WebP images, destination art loads 768px WebP, and the original SVG art remains the fallback and stays authoritative for Historical and Sci-Fi eras.

The **Your Place** image follows `player.home` independently for each player: Starter Studio (`studio`), Sunny Apartment (`apartment`), Skyline Loft (`loft`). All three now use user-supplied residence paintings with separate card/detail images; procedural SVGs remain a fallback if a tier is unrecognized. never assign the unrelated detached-house reference image to one of those tiers. The supplied detached-house illustration is included only as an unused reference. Changes to housing visuals do not modify comfort, rent, or mechanics.

The art pack is a source-owned, data-only manifest and optimized WebPs. `PLAY.html` embeds art as data URIs for offline use, while the Pages build emits separate cacheable assets. `src/art-assets.js` contains the browser mapping mirrored from the JSON pack manifest; the verifier checks that they agree. These are the first steps toward optional downloadable local packs, not an implemented pack-switching/downloader UI.

See ADR-0011 for details.


## v0.5.9 — Player residence paintings

Three player-supplied square illustrations are now the active Contemporary home artwork for the Starter Studio, Sunny Apartment and Skyline Loft. The manifest references `home-{studio,apartment,loft}-{card,detail}.webp` files, updated automatically based on the current player's `home` state. Home artwork and Realty office artwork remain different. Standalone `PLAY.html` embeds images; GitHub Pages publishes cacheable WebPs. Historical/Sci-Fi remain procedural.

**Classic port status:** 22 tracked mechanics; only 2 currently marked fully implemented. Work is still needed to reproduce DOS movement, employment and dependability formulas, scoring, pawn and financial events faithfully; visual releases do not claim or change gameplay parity.


## v0.5.11 — Quick Start and Game Settings

New Game now focuses on picking a character and play mode, with **Start new game** immediately available. An existing autosave exposes **Continue** as the primary button. Classic/Modern, visual era and all four goal values are under collapsed **Game settings**, with their values displayed in a summary. Adjustments are remembered per browser origin for future games; **Reset defaults** restores Classic, Contemporary and 40/55/50/45 goals. Preferences are not copied into the private character library or Looprd. Starting over confirms before replacing an autosave. The mobile dialog no longer demands a three-page setup wizard.

## v0.5.12 — Illustrated character portraits

The in-game Character Studio offers 16 modern illustrated portrait presets and 35 portraits from the supplied reference artwork, grouped under Illustrated and Classic. Gallery images are fixed painted looks; choose Custom drawn for fully editable SVG appearance. Saving a character saves a validated `portrait` ID, not the image or a URL. Images are bundled with the offline game and separately deployed with Pages. The optional `portrait` field is also sanitized by the Looprd Python handler; redeploy the updated handler for multiplayer portrait sharing (no database schema change).


## v0.5.17 — Dynamic Pixel Studio and appearance compiler

In **My Characters → Create / Edit**, use the **Pixel Studio** tab to build a character from reusable parts. Change three discrete body shapes, six hairstyles, hat/beanie/none, skin/hair/fabric palettes, clothing style, mood, and personality. The preview uses a tiny 32×40 pixel canvas, enlarged with nearest-neighbor sampling; direction arrows turn the sprite through north/west/south/east and Walk animates with one shared frame clock. **Export sprite sheet** downloads a 128×320 PNG containing all idle and walk poses. You can still choose any of the 51 fixed illustrated portraits or the previous Custom drawn SVG.

A versioned component catalog is in `assets/characters/pixel-v1/catalog.json`, generated JavaScript in `src/character-catalog.js`, and a pure compiler with Canvas/SVG adapters in `src/character-sprites.js`. It compiles when appearance changes and caches bounded compiled poses; the gameplay thumbnail uses exactly the same compiled pose as the studio. Appearance selections save locally and are embedded in the shared game snapshot, including validated `body`, `headwear`, `portrait: pixel`, `schemaVersion`, and `catalogVersion` fields. No private profile list or rendered pixel buffers go to Looprd. Update the server's `looprd.yaml` to accept the new guest options; the Room database schema is unchanged.

**Art limitation:** these are initial procedural pixel primitives and a complete runtime pipeline, *not* a finished bespoke sprite atlas. Authored sprite PNG atlases, masks, more complex accessories and animation clips remain a separate art-production milestone. See ADR-0014. Game balance and Classic mechanical parity remain unchanged.


### v0.5.17 — Simple characters again (creator paused)

The game has returned to the original emoji player icons, preserving the existing name input and all Classic/Modern game options. Customization controls and galleries are hidden and no character appearance is supplied when starting/joining a multiplayer game. All source, catalogs, images, and user-created browser-local profile records remain intact: `src/app.js` contains the `ENABLE_CHARACTER_CUSTOMIZATION=false` switch for later reactivation. Previously stored game appearance values are ignored in the interface, not deleted. This is a presentation rollback only; game rules and Looprd schema are unchanged.


### v0.5.17 toolbar and ticker

The Life Loop identity sits above the city in the same compact heading as Careers/Finances. On the right, Destination, WSS-only Chat, Co-op and Menu are available; Menu owns New Game, Save, Load and How to Play. Co-op owns room identity, current turn and WSS/HTTP transport health. The old top header and pale-green turn banner are removed; week, market, remaining hours and turn state appear in a single ticker beneath the buildings. Mobile keeps City / Activities / My Life tabs. No engine or Looprd handler changes.


## v0.5.17 — Classic partial shifts and pawned valuables

- Employed Classic players with **1–5 hours left** may now work those hours for proportional wages; full six-hour work still pays eight hours at the current rate. XP/dependability progression uses cumulative six-hour credit to discourage abuse.
- The **Classic pawn counter at Circuit City** accepts a fridge, freezer, computer, dictionary, atlas or encyclopedia. The pledged item is removed from your inventory until redeemed. Redemption is available through the second subsequent week; after expiry, another human player can buy it.
- **Pawn terms are provisional**, not verified against DOS: 45% of base price in cash, redemption of principal plus 10% (minimum $5 extra). The city still lacks an authentic dedicated pawn shop.
- Pawn lots are included in save and online game snapshots. No server schema change is required; test both browsers against your Looprd deployment after updating clients.
- Modern Story rules and character customization flag stay untouched. Additional tests: `tests/classic-work-pawn.test.cjs`.


## v0.5.19 — Classic starting economy, goal points and Jones competition

- **Original starting balances:** Classic begins at **$200 cash, $0 savings**, reflected in the finance ledger. Modern Story remains $250/$100.
- **Classic goal stat points:** wealth = liquid net assets/100 (liabilities approximation), happiness = Happiness stat, education = 1 + 9 × completed degrees, career = 1.25 × Dependability while employed; each is checked against its independent 10–100 goal-point threshold.
- **Jones difficulty:** Take It Easy = human goal budget +40; Play Fair = same total; Go For Broke = −40. Defaults: human 200 goal points → Jones 240/200/160. AI goals use a seeded, deterministic approximation biased toward the human wealth target. Distribution is serialized with game snapshot and shared by co-op. Sierra's exact distribution algorithm remains unverified.
- **Employment Office:** jobs shown for one employer by default, with eligible roles first and optional future jobs and requirements; the player can still attempt an underqualified application for the documented rejection and time cost. All 37 Classic jobs remain present.
- **AI survival:** preemptive clothing replenishment fixes an insolvency softlock exposed by the original starting balances; 100-seed 60-week Classic campaigns remain verified. No character creator reactivation, no UI/bar redesign, no Modern Story economic rule changes.

See [ADR-0019](docs/decisions/ADR-0019-classic-goals-jones-and-employer-office.md). Run `node tools/verify.mjs` and `python -m unittest discover -s tests -p test_looprd.py -q`; test with 2 clients against a deployed Looprd server before declaring production multiplayer accepted.

## v0.5.20 — Building actions over the city board

Select a building to open its actual actions in a centered decision window over the board. The permanent right destination pane and mobile Activities tab are gone; City / My Life remain. The ticker has End week. Done or Escape closes the menu without extra time cost. The engine rules, Classic/Modern modes, and Looprd protocol are unchanged. See ADR-0021.

## v0.5.21 — Board-linked Classic employers

Classic job IDs retain the original DOS employer names for rules parity, but hiring, working, character information, and the Career Center now use the business actually shown on the 13-location board. Example: Cook at *Monolith Burgers* (Classic job ID) appears as Cook at **The Good Fork**. The Good Fork board tile is visibly marked **WORK HERE**, and `work` is only available there. No new Classic/Modern rule differences.

The two historical employers Z-Mart and Black's Market are separate discount/grocery **departments** of Fresh & Frugal, the only remaining shared physical-workplace collision. Their names are maintained as original reference labels in the Career Center, while the actual work tile is highlighted. Full one-business-per-DOS-employer parity remains an architectural backlog rather than a hidden behavior. See ADR-0022.

## v0.5.22 — Classic Z-Mart / Black's Market retail systems

Within the existing shared thirteen-location city, Fresh & Frugal now has **two explicitly separate Classic shop departments**. Black's Market handles 1/2/4-week fresh groceries, newspapers and lottery tickets. Z-Mart Discount offers low-price clothing, reference books, home audio/video gear and optional weekend event tickets on a deterministic four-week stock rotation. The centered interaction overlay shows two merchant headings; their underlying employer IDs and work requirements remain independent.

The original reference confirms that Z-Mart stock changes each week and sells exclusive books and event tickets; exact price tables, stock odds, electronic breakdown risk and weekend charges are **not verified**. Our initial deterministic rotation and bonuses are documented approximations, not claimed DOS parity. Classic Socket City no longer sells books; Modern Story keeps its previous catalog. New `classicWeekendTicket` is a small optional save field, not a schema migration. Only current week actions can set it; invalid field values are rejected on snapshot load. Original book study bonuses and shared 13-city tile count remain. Full original separate physical stores remain workboard LL-147.

No change to Looprd room/server schema, Classic employment IDs, or gameplay of Modern Story. See ADR-0023.


### v0.5.23 Classic core mechanics

Classic now disables in-venue actions once the clock is exhausted, adds a visible provisional ten-decision weekly cap, and carries fractional work wages across partial shifts for consistent totals. Travel does not use a decision slot. New state is saved and checked on load. Modern and Looprd protocol are unchanged. The exact DOS rules for counting actions and rounding wages remain unverified; see [ADR-0024](docs/decisions/ADR-0024-classic-clock-event-budget-and-partial-wages.md).

## v0.5.34 — Employer reliability, net-pay estimates and Jones scheduling

- **Work reliability:** DOS-first ordering: first low-reliability attempt (`dependability < requirement−2`) warns **without clock/pay**, unless below `requirement−5` where dismissal takes priority. Warning is once per week and can be retried. Outfit and energy requirements still apply.
- **Transparent paychecks:** Pure Classic gross/partial-gross, garnishment, fee, net, and debt-after quote shared between UI and payout. **Historical gross calculation** is supported by source; the exact special-case arrears deduction/fees are **provisional** and must not be mistaken for a verified DOS translation.
- **Opponent routing:** Classic Jones only schedules a workplace trip if at least one playable clock unit remains after traveling and stops submitting errands at the week action cap.
- **Saves:** `classicWorkWarningWeek` carries only the warning gate. Existing saves default safely; malformed future-week markers are rejected. Modern economy/work is isolated.
- **Testing:** `TEST-WORK.bat` or `npm run test:work`; complete `node tools/verify.mjs` gate. Architecture/limitations: ADR-0035.

## v0.5.35 — Classic net pay, payroll audit and debt-aware Jones

- **Gross/net consistency:** Read-only estimates now match actual work settlements in a single pure pay calculator; every Classic shift reconciles wallet cash and rent debt.
- **Paycheck history:** Finances shows the most recent completed shifts, including gross pay, arrears deduction, fees, net received and remaining rent debt. Saved journal is bounded to 16 entries and validated on import; v0.5.34 saves get an empty journal.
- **Better Jones AI forecasts:** Two subsequent paychecks are simulated from contracted wages and take-home cash, accounting for debt already reduced by the first paycheck. The rival preserves immediate rent, food, uniform and downturn reserves before voluntarily paying off old arrears.
- **Provenance:** DOS gross/partial-gross rules are source-derived. Actual half-gross garnishment and a maximum $2 fee, plus the AI buffer, remain **compatibility approximations**. The `fullGrossBasis` diagnostic only shows why the unresolved `temp0`/`temp1` branch might differ. **No claim of exact DOS garnishment parity.**
- **Local validation:** Run `TEST-PAYCHECKS.bat`, `TEST-LOCAL.bat` or `node tools/verify.mjs`. Standalone `PLAY.html` is prebuilt. Modern mode and Looprd routes stay untouched.

## v0.5.36 — Classic turn boundaries and weekly source order

- Per-player DOS-derived **−3 dependability** is applied at turn closure, including Jones and hotseat users, not at the shared next-week reset. Existing job and clock actions remain unchanged.
- One-time rent assessment uses the original four-week deadlines, protects against duplicate processing, and retains optional payment/extension behavior.
- A bounded **72-event** phase journal in Classic Finances helps compare economic, living, rent, loans and reset sequencing against actual DOS traces; the phase order is a **migration approximation**.
- Save/Looprd snapshots remain additive and validate journal/boundary fields; prior saves receive safe defaults and Modern remains untouched. Run `TEST-TURNS.bat` or `npm run test:turns` for focused regressions.

See ADR-0037. Exact 37-state SCI `startTrn` ordering, garnishment and movement-time translation are still unresolved.

## v0.5.37 — Classic board layout first, plus weekly DOS event

- **Board architecture:** Classic always uses the original 5×4 city geography for all 13 locations, with one unoccupied southwest crossing. The 170-waypoint path and job/place identities stay authoritative. No mobile reordering or changes to game travel charges.
- **Phone layout:** The default Explore mode keeps building tiles readable in a 740px-wide horizontally pannable map inside the existing City view. Overview fits the whole map for orientation; a building jump select and My Pawn locator move the viewport **without initiating travel**. Mode preference is browser-local, never part of the save/Looprd snapshot.
- **Streets and movement:** The road SVG sits in the same scroll stage as the tiles, keeping waypoints/pawns aligned when panning or resizing. L-shaped gutter bends at three original corner joins avoid diagonals through buildings. Centered venue menus remain outside that pan viewport.
- **Core event migration:** Computer/appliance #29 uses recovered `startTrn.sc` **state 4**: a seeded 1-in-7 chance to award **$20–$100 cash**. This replaces the prototype's 33%-chance fixed $40 Classic bank deposit. Lottery is source-tagged as state 2. Most of the original 37-state weekly process remains **unimplemented or approximate**. The Modern bonus is deliberately unchanged.
- **QA:** `TEST-CLASSIC-BOARD.bat` runs the source tests. Run `node tools/verify.mjs` for all tests and both distributables. Browser checks cover 1440×900 desktop, 390×844 and 320×700 phones, scroll/finder/overview, and Monolith Burger centered interactions. Offline `PLAY.html` needs no HTTP server. No git push was performed.

See ADR-0038 and `docs/classic-board-art-request.md` for replacement building art slots.


## v0.5.38 — Readable Classic navigation and source state journals

The Classic 13-location city continues to use the same 5×4 geography and 170 source waypoints on all devices. On phones, tapping a small tile in **Overview** opens Explore and pans to it without spending game time; a second tap in Explore commits normal authoritative travel and opens the centered venue. During local pawn movement the map follows the pawn unless the player manually swipes. My Pawn restores the view. Modern rules and multiplayer commands remain unchanged.

Classic `startTrn.sc` state 10 food-storage losses and state 18 one-week/expired clothing warnings are recorded in the existing bounded event log, with pure event helpers and validation. The food spoilage **probability is not recovered**, and the provisional guaranteed-spoil behavior remains for now; a non-source-backed $25 medical charge has been removed. No save migration or new persistent fields were introduced. Run `TEST-CLASSIC-BOARD.bat` or `node tools/verify.mjs`.

## v0.5.39 — Classic journey and emergency/food event provenance

The fixed 13-place Classic board now shows a small, accessible travel-state pill during a trip, a road-aligned arrival marker, and the usual centered interaction menu after the authoritative travel action succeeds. Desktop, phone Explore and phone Overview semantics remain: Overview first tap is inspect/zoom and never charges time. Horizontal drag exceeding 9 pixels cancels the camera follow for that trip; taps do not. Arrival is presentation-only; route clock costs, saves and host control do not change.

Original DOS weekly source state 12 (food shortage) is journaled when the existing hunger routine encounters no food. Source state 34 (emergency work-clothing assistance) is journaled when the existing two-check rescue executes; the current $90 payout and eight-week cooldown are **provisional**, not recovered DOS constants. No new loss or rescue mechanic is added. Run `TEST-JOURNEY.bat` or `node tools/verify.mjs`.

## v0.5.41 — Classic relaxation and skippable pawn travel

Classic-only relaxation is now tracked independently of happiness and energy (DOS state 6: weekly −1 to minimum 10 without a hot tub). Rest restores it through a documented compatibility adapter (+6); the original starting amount and hot-tub item are not yet reproduced. Existing quarterly loan checks now write state-20 journal entries without additional charges. Travel has a presentation-only **Skip animation** button for quick repeat trips; all costs still come from the same host-authoritative travel command. Finances displays relaxation. See ADR-0041 and `TEST-RELAXATION.bat`.


## v0.5.43 — production Classic board, active turn center and weekly dial

The 26 commissioned WebP files from `convert_webp.zip` are installed as 13 full Classic card/detail pairs under `assets/art/styles/classic-modern/`. The original 13 place IDs and 170-route positions retain their stable five-by-four perimeter on desktop and mobile. The southwest corner remains a street crossing, not a new venue. On phones, **Explore** allows horizontal panning with readable shops; **Overview** shows all locations at once.

The center of the Classic board now displays the **active player**, week number and original-inspired **circular 60-unit weekly clock**. It updates from `game.player.hours`, never the system clock. The existing lower multiplayer turn ticker remains present for accessibility and diagnostics. Modern mode keeps its existing hub.

The designer's normalized door coordinates are preserved as `doorAnchor` metadata. Art and board placement are purely visual: they do not change historical route distance, actions, wages or hour costs.

Test via `node tools/verify.mjs`, then open `PLAY.html`. Verify local hotseat transitions and phone Explore/Overview. See `docs/classic-venue-art-acceptance.md` and ADR-0044.


## v0.5.45 — Modular Portrait Kit and cross-game Social profile

The top bar has a **Profile** button for the supplied JS renderer and its Everyday / DOMINION art packs. The game packages compact WebP previews, and can later load packs from an HTTPS art host via `window.LooprdPortraitAssetsBase` set before the scripts. Profiles store `looprd.social.profile/v1` appearance IDs and a display name separately in browser localStorage. Game stats and saves stay in Life Loop. Portraits also work in the self-contained PLAY.html with embedded packs.

The optional **Connect to Looprd Social** section requests a separate Social URL and bearer token at runtime, never stores tokens, and can explicitly fetch/publish the profile and use the development lobby chat. A separate `looprd-social` ZIP demonstrates the API on 127.0.0.1; it is not production-ready. Connecting this service does **not** authenticate Life Loop multiplayer, which retains its friend-code Looprd room. See `docs/decisions/ADR-0045-shared-modular-portrait-and-social-boundary.md` and `docs/looprd-social-integration.md`.

Use `python -m http.server 8080` for the local browser version or `PLAY.html` for the complete offline edition.


## v0.5.46 — Chat with Looprd Social in the game

The **Chat** button opens a Social lobby by default. Connect to your Looprd Social host with a development credential: use the HTTPS Looprd origin (for instance `https://api.example.org`), not the `/session` game endpoint. The game calls `/looprd/looprd-social/v1/social` directly, and the **Profile** panel reuses the connection. Social and private Co-op chat have independent tabs; you do not have to join a game to use Social.

Only the public Social server origin is remembered across reloads; development credentials must be entered again and are never saved to local storage, exports or game state. Native Social requires the game site's browser origin in `LOOPRD_ORIGINS` and HTTPS. For development, `http://127.0.0.1:8947` continues to select the local bridge.

Use `node tools/verify.mjs` and `python tests/qa_social_chat.py`. The browser test uses simulated Social responses, not your production account. No Looprd Social server source changes are needed. Production cross-game SSO is still blocked; do not forward Social development tokens as game-room tokens. The game Looprd descriptor includes the additive schema-v2 `Room.chatKey` migration.

## v0.5.49 — Classic hotseat privacy and mobile scenic board

- **Local Classic hotseat:** When the active human changes, the board, finances, Social chat and room controls are hidden behind a full-screen pass-the-device card. The next human confirms when ready. No additional game turn, clock deduction, network call or saved field. Modern mode and online co-op do not receive this local-device handoff.
- **Recovery:** Resuming/importing an existing Classic hotseat save requires the same explicit reveal, so opening a shared device does not casually expose current-player finances.
- **Original board:** The Public Garden clock and two tree-lined scenic road sections remain visible below 1024px in both Explore and Overview. Noninteractive landscaping; the original 13 venue identities/170 waypoint travel quotes remain authoritative.
- **QA:** `node --test tests/classic-hotseat-handover.test.cjs`, `python tests/qa_classic_handover.py`, `node tools/verify.mjs`.
- **Social:** No Looprd Social server changes, no new credentials and no game-server schema modifications.


## v0.5.49 — Garden clock and phone-only board camera

The Classic 60-unit clock is **at the Public Garden** (bottom center), not in the turn display; the middle retains current-player identity and week. The Explore/Overview camera toggle appears on phones (width <=720px). Larger displays always show the fitted city. The display-only road projection follows the top gutter of the actual fifth row. Original 170-waypoint costs, save format, rooms, Social chat and Modern game remain unchanged. Run `python tests/qa_classic_clock_garden.py` after `node tools/build-offline.mjs` to visually validate desktop and mobile. ADR-0048.


### v0.5.49 — Classic entrance alignment and in-venue time

- The Classic 13-venue road loop remains source-derived (170 DOS waypoints).
- Storefront-specific normalized doorway markers position pawns at the actual art entrance. During travel, walking animation uses a short visual sidewalk spur that never changes the original travel cost or saved location identity.
- Only the occupied, previewed or arriving shop shows its access spur to keep the board readable.
- During a Classic building visit, a compact live 60-unit clock appears in the menu header. It updates after spending time without leaving the building and matches the garden dial. Modern action panels are unchanged.
- Verify with `node tools/verify.mjs` and, when Chromium + Playwright are installed, `python tests/qa_entrances_clock.py`.


### v0.5.50 — Continuous Classic road preview

The 13 original Classic venues and source-derived 170-waypoint travel quotes are unchanged. The display-only sidewalk now runs between the 5x5 board tiles with continuous rounded corners. Hover shows only the street route and a separate doorway target; no long green preview line crosses shop windows or the tree-lined gaps. The pawn animates on this street and finishes at the appropriate illustrated doorway. Original game rules and Social server are unchanged. Run `python tests/qa_smooth_streets.py` for the visual regression at four sizes, and `node tools/verify.mjs` for the game suite.

Artifact: `the-life-loop-0.5.50-ziprunner.zip`


### v0.5.51 — Pawn doorway transitions

A Classic pawn now leaves its illustrated doorway with a short threshold movement and fade, reappears on the source-authoritative public road, walks the same 170-waypoint visual route, then fades back into the doorway with a short finish. Both endpoint positions are derived from the existing 13 artwork entrance coordinates. The preview remains street-only. Skip animation, reduced-motion mode, saved games, and social/co-op permissions have no game-time side effects.

**Test:** `node --test tests/classic-pawn-doorway.test.cjs`, `python tests/qa_pawn_doorway.py`, and `node tools/verify.mjs`. No server changes required.

Artifact: `the-life-loop-0.5.53-ziprunner.zip`


### v0.5.52 — Visible storefront frontage paths

The Classic street now follows the illustrated frontage apron near the foot of the top/bottom businesses, rather than only the perimeter of the central green. All 13 entrances have permanently visible paved sidewalk links. Hovered destinations highlight the complete path, from the current door through the public route to the chosen door. The pawn follows the same continuous visible footpath without fading across a hidden transfer.

The Public Garden clock stays visibly above the southern route. Original 170-waypoint path distances and provisional travel-to-clock conversion are **unchanged**, as are venue actions, Modern mode, game saves, Looprd Social and game-server schemas.

**Local browser QA:** `python tests/qa_storefront_frontage.py` at 320, 390, 768 and 1440px; check all 13 footpaths, the two frontage lanes, mobile Explore/Overview, the actual Bank walk (5 units), destination doorway and the in-venue clock. See ADR-0052.

Artifact: `the-life-loop-0.5.53-ziprunner.zip`

## v0.5.53 — DOS time-boundary parity

Classic Employment applications and raises use the original DOS time-cap behavior: a nominal four-unit interaction may finish with only 1–3 clock units remaining; it cannot begin at zero. Run `node tools/dos-time-audit.mjs` for 156 directional route quotes and the source tick-reference comparisons. The travel-cost converter is still provisional. `TEST-DOS-TIME-AUDIT.bat` runs the focused tests; see ADR-0053.

Artifact: `the-life-loop-0.5.53-ziprunner.zip`

## v0.5.54 — Classic weekly simulation and Social SDK integration

Artifact: `the-life-loop-0.5.54-ziprunner.zip`

- Source-supported weekly order: lottery → computer bonus → relaxation, then existing compatibility meal/storage and clothing. The invented random spending event is Modern-only. Note original food IDs and rent/loan timing remain provisional.
- Social account sign-in/register now imports the official pinned SDK from TheBigTreeInc/social at an immutable revision, verifies Git blob SHA before executing it, and uses the same page-scoped profile/lobby session. Credentials are never saved in Life. Disconnect signs out of Social and revokes that device session.
- The legacy token client code remains for the existing regression and local development bridge but is no longer the primary UI. No Life/Looprd server schema change required. The browser must be able to fetch the pinned SDK from raw.githubusercontent.com; remote network testing is operator-side until reachable.
- `node tools/verify.mjs` covers the new weekly/Social source tests, and the release ZIP carries the documentation and versioned workboard delta.

## v0.5.55 — Return home and per-game House Rules

Artifact: `the-life-loop-0.5.55-ziprunner.zip`

Classic games now return every player home at turn end, even with insufficient clock time. Excess travel is deducted from the player's next week. New Game → Game Settings → House Rules can disable the homeward return, forgive overtime or opt Modern into this mechanic. Default Modern keeps its own shops, events and free-end movement. Presets, overrides and per-player travel debt persist in save and multiplayer snapshots. No Looprd or Social schema changes. Exact DOS waypoint-to-clock equivalence is still provisional (ADR-0055).

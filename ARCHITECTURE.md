# The Life Loop — Game Architecture and Mechanical Fidelity Charter

**Status:** Accepted / normative for future development  
**Architecture revision:** 1.1 (2026-10-12)  
**Project release:** 0.4.6 (Classic education, job caps and dismissal; selectable rules/visual eras)  
**Original reference:** *Jones in the Fast Lane* (Sierra On-Line, 1991)  
**Owner intent:** Preserve the **original gameplay mechanics**, while bringing presentation, interaction, accessibility, and engineering up to modern standards.

> **Architectural north star:** If the same player makes the same meaningful decisions under the same starting conditions and random outcomes, the remake's **core economic and career consequences** should match those of the original as closely as evidence permits. Better visuals and ergonomics must not silently rewrite the game's strategy.

## 1. The contract: modernize the game, not its rules

**Core mechanics are the product.** Preserve the weekly time economy, actions and their opportunity costs, single-employer rule, actual workplace shifts, wage and qualification rules, education prerequisites, clothing deterioration, recurring costs, financial risks, four-goal victory race, and player turns.

**Modernize freely at the presentation layer.** Use an accessible responsive city board, readable prices and preconditions, keyboard/controller/touch support, modern artwork and animation, scalable UI, audio controls, localized copy, explicit notifications, financial history, save/resume, performance improvements, and reproducible CI/CD. These can explain or visualize the rules without changing their outcomes.

**Additional game systems must be separable.** v0.4.3 added NPC memories/favors, seasonal stories, civic bonuses and a financial dashboard. The dashboard is informational and should remain in the core. Story rewards and civic economic modifiers currently *alter mechanical balance*; they must ultimately be disabled or cosmetic in a **Classic Rules** ruleset, and enabled only in a clearly labeled **Modern Story** variant. This separation is **implemented in v0.4.5** through selectable Classic Rules (mechanical parity in progress) and Modern Story. See [ADR-0002](docs/decisions/ADR-0002-rulesets-and-world-eras.md).

**Original-inspired, not an asset transplant.** Do not embed Sierra game executables, resource archives, dialogue, music, sprites, or trademarks as downloadable game assets without rights. Source-derived gameplay facts can guide independent implementations; retain source links and provenance for each rule.

## 2. Authority and traceability

In descending priority when implementing or correcting behavior:

1. **Observed original gameplay** with recorded DOS/SCI build, reproducible save/seed/steps and captured result. This direct-run comparison is **pending**.
2. **Original manual / contemporary primary documentation**, where a verifiable copy is available. Not yet systematically parsed.
3. **Corroborated reference material** in [original-gameplay-spec.md](docs/original-gameplay-spec.md), especially the rules reference, historical game guide, and Sierra Chest walkthrough.
4. Existing implementation behavior in v0.4.3, **only** for mechanics with no stronger original evidence. No existing behavior is grandfathered in merely because a test currently passes.

Each parity item has a stable rule ID (`TIME-`, `JOB-`, etc.) in [parity-contract.json](docs/parity-contract.json). Maintain [parity-matrix.md](docs/parity-matrix.md) and the contract together. Record discrepancies; never silently label an approximation "original accurate".

## 3. Gameplay model

### 3.1 Deterministic turn state machine

```text
Create game / choose player count and adjustable four-goal targets
  -> Weekly start: economy/events/consumption/notifications for active player
  -> Player turn: navigate board and perform legally available actions
      -> evaluate prerequisite and availability
      -> charge time, money and risk exactly once
      -> apply deterministic state transition and seeded random results
      -> show consequences; persist
  -> Next player (including optional AI rival)
  -> After all active players: advance week; repeat
  -> Declare winner only when their selected goal thresholds are all met
```

Original-style **target**: 60 hours per turn; location movement is distance-based; entering a building costs 2 hours; a full work session takes up to 6 hours for 8 hours' pay; a job/raise application takes 4 hours; studying takes 6 hours. Partial-time edge cases must follow source evidence, not UI defaults. The current 40-hour week and several action costs are tracked as deviations, not features.

### 3.2 Domain boundaries

| Layer / module | Responsibility | Rule protection |
|---|---|---|
| `src/data.js` | Stable definitions: venues, jobs, courses, items, economic inputs | Carry reference rule IDs and separate classic from optional content |
| `src/engine.js` | Authoritative game state, event sequencing, preconditions, economy, employment, scores, AI actions | All state changes go through validated actions; no UI-side economic mutations |
| `src/app.js` | UI state, input, previews, dialogs, accessible explanation | Render engine results; do not duplicate or secretly override engine rules |
| `src/art.js`, `styles.css` | Art, visual clarity, responsiveness | Presentation independent of numerical state transitions |
| `tests/game.test.cjs` | Engine invariants, persistence, simulation | Add rule-ID-based parity tests; keep existing regression tests |
| `tools/verify.mjs` | Build, package metadata, test/architecture checks | Fail missing or malformed architecture/parity handoff |
| `.github/workflows/pages.yml` | Static site test + deploy | Publish only tested independent game files, no DOS assets or secrets |

### 3.3 State and isolation

A player has **one `job` at a time** (or no job), employer-specific work permission, current pay, career statistics, earned degrees, clothing inventory with remaining weeks, cash/bank/investment/debt, food/rent state, goals, and optional relationship/story fields. A game has week, economy, turn order, players and reproducible RNG/event state. Financial transfers must not create income. Save migrations must keep old progress where representable, but should never fake parity of older saves with a newly introduced classic mechanic.

**Ruleset isolation implemented (partial mechanical fidelity):** core rules run from an immutable `classic` configuration; optional modern story content is an overlay with explicit entitlements/flags. Rule evaluation should receive a ruleset instead of reaching into the UI. Do not fork the whole engine into two implementations; use one state machine plus data-driven mechanics and isolated optional hooks.

## 4. Non-negotiable gameplay invariants

1. **One paid primary job.** Applying for another job replaces the old one atomically. Only the current employer may offer regular shifts. Studies, shopping and other activities do not terminate a job.
2. **All choices have original opportunity costs.** Hours, money, prerequisites, risks and timing matter. For a failed application, time can still be charged as the original specifies; UI may warn without eliminating the risk.
3. **Progression is gated, not infinitely farmable.** Experience and Dependability have job/degree-dependent maximums. Dependability decreases each week; dismissal and hiring uncertainty are real game outcomes.
4. **Degrees are prerequisites, not a generic leveling bar.** There are eleven original degree subjects on a branching prerequisite graph; higher jobs can require combinations.
5. **Clothes are consumable by week.** Three uniform tiers; better clothes satisfy lower dress codes. Worn-out outfits block working, not possession of the employment contract itself unless original dismissal rules fire.
6. **Survival expenses are decisions.** Weekly food, four-week rent cycle, arrears and debt consequences affect strategy. Banking, investing and pawn/repair systems remain meaningful rather than one-click infinite buffers.
7. **Four race goals, configurable at setup.** Wealth, happiness, education and career must use the original scoring rules in the Classic ruleset, not the current generic levels/tier shortcuts.
8. **Multiplayer turns retain fairness.** All participants receive their turn for the current week; private hotseat handoff must not change game state or consume time.
9. **Seeded reproducibility.** State transitions are testable with deterministic random streams, permitting comparison to captured original behavior.
10. **No softlock masking of parity deviations.** Convenience aid (e.g., unlimited paid gigs) cannot quietly replace the original economy. Accessibility assists should be clearly labeled and configurable without breaking core equivalence.

## 5. Release and acceptance gates

A parity-changing PR or ZipRunner ZIP **must** contain:

- A mapping to one or more stable rule IDs in `docs/parity-contract.json` and an update to `docs/parity-matrix.md`.
- An evidence-backed expected outcome, including preconditions, action, time charged, money/stat changes, and edge-case handling; label uncertain evidence clearly.
- Automated tests for every rule newly marked `implemented`; red/pending test scenarios for gaps are described but **not** represented as passing tests.
- A saved-game migration decision, especially when changing turn budget, score formula, job/degree data, or finances.
- Reproducible verification via `node tools/verify.mjs` and a ZipRunner workboard update; the update applies only **after** verification succeeds.
- Manual desktop/mobile sanity checks when the change affects interactive actions. A UI that looks correct is not evidence that game math is faithful.

**Ordering:** P0 time/action/turn accounting and job/stat consequences; P1 education/career/score logic; P2 rent/food/banking/inventory/events; P3 four-player UX and optional modern stories. See the [matrix](docs/parity-matrix.md) for status and acceptance cases.

## 6. What this document does and does not assert

This charter specifies the **desired architectural target**. v0.4.5 introduced rulesets and eras. v0.4.6 implements eleven named Classic diploma paths, paid enrollment and time-based lessons, degree-dependent scoring and stat caps, and employment dismissal/raise thresholds. The v0.5.0 Classic occupation catalog replaces the previous 19-job provisional mapping with 37 documented DOS/floppy jobs. Some original building locations and exact randomness remain unverified, and the full original economy is not yet reproduced. The original risk distributions and rent/loan mechanics remain unfinished. Modern Story retains the v0.4.3 balance. Original-game claims are mostly backed by external guides; they are **not yet validated against the supplied DOS executable**. Exact price tables, probabilistic event distributions, hiring probabilities and all goal scoring formulas require further source/behavioral verification.

This charter governs later additions unless a documented architecture decision intentionally changes the project direction. See [ADR-0001](docs/decisions/ADR-0001-classic-mechanics-modern-presentation.md).

## 7. Gameplay settings (ADR-0002, v0.4.5)

At New Game, the player selects an independent **ruleset** (`classic` or `modern`) and **world era** (`historical`, `current`, `scifi`). The rule configuration is in `LifeData.RULESETS`, the era mapping is in `LifeData.worldEras`; `src/engine.js` uses ruleset config, `src/art.js` and `src/app.js` use visual era config. Both are serialized and validated on load. Classic is the new-game UI default. Legacy saves default to Modern/Contemporary for compatibility. **Visual eras must not modify economic or mechanical state, including RNG consumption.** Tests enforce this. New rule fidelity is incremental and clearly identified as such; see [ADR-0002](docs/decisions/ADR-0002-rulesets-and-world-eras.md).


## 8. Classic progression implementation (v0.4.6)

- `src/data.js`: `classicDegrees` has eleven explicitly identified diplomas and prerequisite edges, while `classicJobRequirements` maps them onto the existing Life Loop jobs. **This mapping is not the authentic Sierra jobs table**. Original catalog parity remains open.
- `src/engine.js`: Classic starts 10 Experience / 20 Dependability; each new job adds 2 Experience, minimum-10 employment resets reliability below 10; work raises each stat by 1 until the reference cap (`10 + requiredExperience + 5 × degrees` XP and `20 + requiredDependability + 5 × degrees` Dependability). Work below the employment threshold dismisses without wages/time charged; warning if lower than required but not dismissible. Raises require `requiredDependability + 5 × prior raises`.
- Enrollment is $50 per course, no hours. Lessons cost six hours (partial remaining hours allowed), 10 sessions minus a computer credit and complete three-book-set credit. Four concurrent courses at most. Completion yields +5 Happiness and +5 Dependability, permanent diploma ownership and work-stat cap capacity.
- Classic education = `1 + 9 × completed diplomas`; career = `1.25 × Dependability` while employed, zero while unemployed. Both compare to setup goal thresholds. Modern scores and course tree unchanged.
- Old Classic v0.4.5 saves map 1–4 linear credentials onto valid branches; old Modern saves retain their balance. Tests establish migrations and round trips.
- Original-game reference is documented/wiki-backed, not observed through direct DOS emulation. No implication of binary/mechanical 100% compatibility.

## 9. Classic core expansion (ADR-0004, v0.5.0)

- The DOS-floppy 37-role [employment contract](docs/classic-job-table.md) is independent of Modern Story's 19 fictional jobs. Employers are distinguished even when two Classic venues share a modern city tile. CD-specific employment additions remain excluded.
- Classic application attempts always spend four hours; known missing qualifications result in explicit rejection; eligible applicants use a seeded, Dependability/Experience/degree-sensitive openings roll. Per-role no-opening refusal is sticky until next week; the entry Cook job is guaranteed.
- Listed Classic wages are grounded in the source employment table, with an imperfect macroeconomy multiplier; raises cannot exceed the new listed wage. Dependability thresholds and +5-per-raise escalation persist.
- Classic rent begins at $325, due in week 4 and every fourth week. Rent is manually payable at the Rent Office in **cash**. Grace periods, debt garnishment, and $2 interest fees are testable. The rest of the rental market, loans and eviction-related content do not yet claim source fidelity. Modern rent remains automatic.
- The 3-era art selector stays cosmetic. Architecture checks and regression testing must prevent Classic-only employment/rent rules from leaking into Modern Story.

This is still *parity in progress*: no direct DOS-versus-browser deterministic play-through has been performed. See [ADR-0004](docs/decisions/ADR-0004-original-jobs-and-manual-rent.md).


## 10. Classic banking and food loop (ADR-0005, v0.5.1)

Classic has its own savings transfers, credit ledger, six-category stock broker and fresh-food inventory; none of these alter Modern Story's original bank or food model. The selected visual era remains cosmetic. Classic savings pay no interest; food must survive weekly refrigeration and portions are consumed at turn transition. All new state is snapshot-exported and validated on import. Original stock volatility, credit approval formula and spoilage medical bills remain source-approximate and explicitly marked **partial**, pending a DOS comparison. [ADR-0005](docs/decisions/ADR-0005-classic-banking-and-fresh-food.md) and the [parity matrix](docs/parity-matrix.md) govern future changes.

## 11. Networked co-op and Looprd (ADR-0006, v0.5.2)

The Life Loop supports a two-human remote hotseat session as an opt-in New Game mode. The game ruleset (Classic or Modern) and presentation era remain independent of transport. `looprd.yaml` is a self-contained `looprd/v1` contract consumable by pac-labs/dapi/Looprd; no application server exists on GitHub Pages. Looprd's subscription-only WebSocket is used for notifications, while authenticated `/session` HTTP commands carry create/join/turn/publish/status. Private hashed tokens provide room-scoped read/publish/command permissions; public event payloads never include game state or secrets. Host JavaScript is the game engine authority; server-level engine validation and host migration remain open security/fault-tolerance work. Source of truth for game mechanics stays `src/engine.js`; no default gameplay balancing or save schema fields changed. See [ADR-0006](docs/decisions/ADR-0006-online-multiplayer-looprd.md) and [operator guide](docs/looprd-multiplayer.md).


## 12. Mobile presentation and FQDN-only Looprd setup (ADR-0007, v0.5.3)

At phone/tablet widths the three desktop panels become independent accessible views for City, Activities and My life, with a persistent compact turn summary. Travel selects the local Activities view automatically; no engine state or online messages change. Small viewports display storefronts in a two-column illustrated grid. The backend address is supplied by the user as a Looprd API server FQDN; the browser derives the standard `/looprd/the-life-loop/v1` route (not the `/_looprd` management route). See [ADR-0007](docs/decisions/ADR-0007-responsive-mobile-layout.md).

## v0.5.7 — Local identities as presentation-only profiles

Reusable character profiles use a separate browser-local store, not the authoritative game engine's progression database. Only allowlisted appearance fields are embedded in a player snapshot; no character-creation field affects wages, goal progression, time, luck or Classic parity. See [ADR-0009](docs/decisions/ADR-0009-offline-reusable-character-profiles.md).


## v0.5.9: Player housing artwork is cosmetic

The Contemporary default art manifest now binds a separate user-supplied painting to each housing tier (studio/apartment/loft), providing card/detail resolutions. Render solely from the player's saved housing tier. No cost, score, comfort or rent changes. Keep Open Door Realty as a dedicated service location, not the player's home. Continue to use procedural art outside Contemporary. The original 1991 gameplay parity contract is unchanged by this release.


## Character compiler and pixel rendering (ADR-0014, v0.5.14)

The new browser source `src/character-sprites.js` compiles a small, catalog-versioned configuration into resolved parts and 24 deterministic idle/walk poses. The pure compiler resolves discrete bodies, hair/hat variants, material palette bindings and stable bands **before** rendering; a 32×40 Canvas adapter animates and exports sprites while an SVG adapter draws static in-game portraits from the same pose. `assets/characters/pixel-v1/catalog.json` is the authoritative component manifest. No PixiJS/TypeScript runtime or WebGL dependency is necessary for the initial 32×40 vertical slice. Existing painted portraits continue to be selectable separately. The art-production backlog includes PNG atlas authoring, masking and richer animation.


## ADR-0030 · DOS Pass-2 migration boundary (v0.5.29)

`src/classic-pass2-rules.js` is a standalone, deterministic reference-rules module for original integer-priced goods, one-roll lottery, rent-extension d12, and partial wage truncation. The Classic game uses one seeded bounded goods index and logs discrete source-derived events; index drift remains a documented approximation. Original numeric place IDs and shared route plans also drive ordered AI emergency branches and a compact, serializable decision trace. The existing salary baseline and full rival career planner are still playable adaptations rather than exact DOS ports. The Modern ruleset is isolated by `game.isClassic` conditions and retains its previous finance calculations. See ADR-0030 and `docs/reference/original-dos-pass2/`.


## ADR-0031 · Classic coupled eight-index engine (v0.5.30)

Classic uses `src/classic-economy.js` as one seed-replayable macro model with eight original DOS index identities and `10–190` bounded readings. Consumer price arithmetic remains source-derived, whereas economic drift, stock-index binding and wage-index binding remain explicitly provisional. `classicEconomicIndices` is an additive schema-validated snapshot field, with `classicGoodsIndex` and the old scalar used for v0.5.29 migration. All agreed player salary contracts stay stable until hire/raise. Modern Story bypasses this model. See [ADR-0031](docs/decisions/ADR-0031-coupled-classic-economy-and-contract-wages.md).

## ADR-0032 · Source-linked Classic economic event lifecycle (v0.5.31)

Classic's general index feeds a seeded and bounded economic event phase classifier (`src/classic-economic-events.js`); downturns can trigger the source-backed scandal outcome reducer. Each outcome is applied to human and rival players in the same weekly simulation and written to the bounded Classic journal, including account ledger entries for destroyed savings. The original **effects** of crisis strength 1 and 2 are sourced from the pass-2 `startTrn.sc` investigation, while trigger probabilities, the cooldown and recovery happiness are intentionally provisional. Snapshots carry `classicEconomicPulse` (validated optional), inherited saves default to a neutral current-week phase, and saves never process an event during import. Classic board routes/job identities and Modern economic state remain independent. The AI now commits to a valid job application after travelling to ACNE, preventing an employment-food route cycle following layoffs.

## ADR-0033 · Ordered Classic career and long-unemployment recovery (v0.5.32)

The Classic branch planner runs pure source-tagged career priorities after emergencies and before heuristic fallback. Career paths never bypass original prerequisite IDs, action-time checks, contracted wages, workplace identities or enrollment costs. The rival renews **any sufficient job clothing tier** when its remaining durability is at most two weeks, preventing complete labor lockout. Persisted per-player unemployment weeks and rejected application counts allow deterministic selection of the original Monolith Cook occupation (#44, hiring roll forced success only when qualified). Ordered tags and destinations originate from the DOS pass-2 `ai_branch_map.json`; the local urgency, education and fallback thresholds are explicitly provisional. Save migration adds only optional bounded fields; Modern remains unchanged. See ADR-0033.

## ADR-0034 · Original route tick estimate and per-action work progression (v0.5.33)

Classic's source time module (`src/classic-time.js`) keeps `TURN_UNITS=60`, `ROUTE_QUANTUM=20`, and the source-derived original AI estimate `steps + 2*ROUTE_QUANTUM` for each non-zero 170-point route leg. The historical tick estimate must **not** be silently substituted for the playable clock cost: the current ring-step quantizer remains provisional. Travel quotes and travel actions use the same pure adapter; Employment Office arrival adds 2 source-backed clock units once and is atomic with its trip. This surcharge is not charged to other storefronts, whose exact visit transitions remain unverified. Jones's itinerary planner compares the route tick metric without altering feasibility calculations. Partial work pays DOS-truncated proportionally and now awards exactly one capped experience/dependability step per *successful action*, regardless of late shift length. Legacy 0–5 pooled work credits are treated as obsolete and discarded during load/work, without changing saved job identities. Classic only; Modern clock/work retained. Decisions and movement still use normal host-authoritative Looprd snapshots; no protocol migration.

## ADR-0035: employer warning and payable paychecks (v0.5.34)

The Classic pre-work branch now uses a pure `ClassicTime.workStanding` to order dismissal, weekly first warning, and successful work before any money/time deduction. The warning consumes one provisional venue choice, but no clock time, so retry behavior survives save/reconnect; a bounded week marker defaults to 0 on legacy save import. `ClassicTime.paycheck` centralizes integer gross, approximate back-rent withholding/fee and net in one read-only quote to avoid disagreement between action UI and settlement. Exact SCI garnishment (`n108.sc` temp0/temp1) is explicitly unresolved. Classic Jones reserves work action clock beyond travel and honors the provisional ten-choice cap. The Modern clock/action implementation and Looprd payload structure remain otherwise unchanged.

## ADR-0036: auditable Classic pay and debt-recovery guard (v0.5.35)

`ClassicTime.paycheck` stays the sole preview formula; immutable `settlePaycheck` checks payout/debt conservation and drives wallet and arrears mutations. Last 16 successful shifts append a fully reconciled journal (validated, additive in old saves); no extra entry for warnings/dismissals. The rival forecast uses two sequential **net contracted** shifts, without changing state or random sequence, and only pays historical rent arrears voluntarily if cash remains for due food, housing and workwear. View details in Finances/Career Roadmap. The original SCI garnishment remains unknown and is **not** conflated with the compatibility withholding formula. Modern mode and Looprd interfaces remain separate.

## ADR-0037 · Classic per-player turn completion and week phases (v0.5.36)

`src/classic-turn-sequence.js` distinguishes **endTurn(player)** from the shared next-week economic/event cycle. Classic's original source-backed dependability −3 is applied and journaled immediately when each human or AI finishes; start-of-week no longer repeats it. The four-week missed rent transition is assessed via a pure, once-per-week guard, not through both handlers. A bounded, strictly validated 72-entry phase journal captures close/economy/living/rent/loan/reset/week-ready without consuming additional time or random numbers. This is a deterministic migration ordering only; it is not proof of the DOS 37-state SCI startTrn callback order. Older saves default cleanly, Modern uses previous semantics, and Looprd remains on its existing snapshot protocol. See ADR-0037.

## ADR-0038 summary — stable Classic board and source weekly bonus (v0.5.37)

The Classic board's **geography** is authoritative in `src/data.js` and `assets/boards/classic/routes.v1.json`. `#boardStage` contains the grid and its exact-size road/pawn SVG. `#boardViewport` is the bounded mobile pan surface; `#venueLayer` remains outside it. A device-width change never reorders Classic cells, and a viewport scroll never changes `Game.travelQuote` or the simulation. Modern layout stays independent.

The computer ownership bonus is now a pure `ClassicWeekly.computerBonus` calculation using two RNG calls only on a successful first draw. Source state 4 and awarded cash are appended to existing bounded `classicWeekEvents`, requiring no save migration. No inferred state-number ordering of other unrecovered SCI callbacks is claimed.


## ADR-0039 summary — Classic mobile travel intent and weekly source-state trace (v0.5.38)

UI projection/panning is independent of the state machine. Phone Overview tile taps change only presentation state, and local travel camera follows SVG projection (manual swipe overrides). The authoritative travel action, actor identity and remaining-clock deduction remain on the host, unaltered. Weekly state 10/18 are source-tagged observability events with bounded save journal, not a claim of source-complete event execution. See ADR-0039.

## ADR-0040 extension — v0.5.39

Board travel feedback is presentation-only and lives alongside `RouteOverlay`. A successful host-authoritative travel action still mutates time/location exactly once; the journey status and arrival marker only render that outcome. The centered venue sheet remains the only action executor. Classic phone Overview selects/zooms, phone Explore travels, manual horizontal drag overrides follow.

The Classic weekly journal now identifies DOS source states 12 and 34 without changing hunger or rescue economics. Payout and cooldown are provisional and documented. No snapshot schema or Modern rules change.

## ADR-0041 summary — Classic needs and skippable travel (v0.5.41)

Original `startTrn.sc` state 6 decays a Classic-only relaxation scalar by one toward ten without an authentic hot tub; its 16-point initial default and +6 rest recovery are compatibility choices. State 20 records the preexisting monthly loan status without altering default charges. `RouteOverlay.finishAnimation()` finishes visual motion without game-state or network mutations; a successful authoritative travel action has already paid the single movement cost. Validated legacy save defaults and five regression tests protect Modern isolation and do not alter the route data. See ADR-0041.


## ADR-0042: Classic household and route-owned entrance (v0.5.41)

`classic-household.js` is a deterministic derived view of Classic owned goods and already-saved breakage state. No new save or wire fields; Modern remains independent. Rest accounts for independent relaxation in both action availability and quote. Original DOS state-6 recovery magnitude is not verified. The entrance glyph is rendered by the independent SVG road layer using original stop anchors, not burned into store art. Designer slots are specified in `docs/classic-designer-handoff.md`; all 13 default illustrations keep working when no optional art is installed.

## ADR-0043: Verified task lifecycle and maintenance (v0.5.43)

Every known work item must appear once in the version-controlled lifecycle ledger. Done requires evidence; Blocked requires a reason and unblock condition; source verifier checks generated state before releasing. The existing ZipRunner v1 workboard update is kept for importer compatibility. This **does not imply UI status transitions have occurred**; those require an explicit, tested importer change. Classic household repair quotes and AI maintenance respect the two-week cash reserve and existing time/action gates; the 20% repair ratio is provisional.


## v0.5.48 — Classic presentation boundary

The turn-owner display remains a stable board-center element, while the actual Classic clock is independently positioned over the noninteractive Public Garden. `LifeClassicBoardHud` renders display data only. Phone Explore/Overview is a camera preference; the route renderer projects the original waypoints in the top gutter of the fifth row. Neither feature owns travel costs or persistent game state. See ADR-0048.


### Classic street visualization v0.5.50

The source route graph (`routes.v1.json`) and 170 historic DOS waypoint indexes own all travel identity and cost. `src/route-overlay.js` renders that graph on a continuous 5×5 tile-gutter promenade and rounds presentation corners without changing authoritative decisions. A visual doorway marker derived from artwork is separate from the public street preview, and arrival selects the original venue ID. No additional network or saved data field is introduced.

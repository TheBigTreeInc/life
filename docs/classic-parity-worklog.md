# Classic Original — Mechanical Parity Worklog

**Versioned baseline:** 0.5.71. **Scope:** Original DOS 1.000.060, current Classic mode, with separate Custom Classic/Modern content. A pass is complete only when source changes, tests and operator verification agree; this is *not* a promise of binary parity.

| Proposed version | Priority | System | Acceptance / expected evidence | Status |
|---|---|---|---|---|
| 0.5.58 | P0 | Classic goal stat formulas, weighted progress gauge, four-gate victory | Unequal targets + DOS reference tests; no Modern/save/house-rule regressions | **Implemented, awaiting operator QA** |
| 0.5.59 | P0 | Clock, route ticks, 10 action cap | Zero-cost end-clock transactions, optional 10-action house rule, 7 indexed route scenarios; original **observed** DOS timing still missing (LL-175) | **Implemented candidate; DOS route timing blocked** |
| 0.5.60 | P0/P1 | Happiness, household relaxation, weekend states | State-12 −2 food happiness, state-14 cash-stress with deterministic 4-week cash/joy/relaxation deltas, source-only state-24 table and Finances trace; complete weekend parity still open (LL-306) | **Implemented candidate; remaining original consumption/item/event branches blocked** |
| 0.5.61 | P1 | Food, storage, illness, rent, lending/garnishment | Source state-10 spoilage happiness, 4-week close loan notices, source-only n108 1/3/6-unit comparison; full item/order/paySched/garnishment parity remains blocked | **Implemented candidate; partial DOS parity** |
| 0.5.62 | P1 | Ordered Jones AI and goal-aware strategy | Executable predicates #28/#29/#30/#32/#37/#44/#46, original food branch #27, two-raise cap, seeded replay; rest of 1–49 remains an open source/RNG audit | **Implemented candidate; complete branch order still blocked (LL-308/190)** |
| 0.5.63 | P1/P2 | Source-market regression, pawn quote and read-only economy/event audit | DOS market/pawn prices, original pawn mood impacts, new lot validation and legacy load; source-only index RNG comparator | **Partial candidate; original paid-price data, live economic migration and four-human rounds remain open** |
| 0.5.64 | P0 | Original new-game defaults, food identities and state order | room1.sc starts 0 happiness/25 relaxation/$200/empty food; fastFood.sc IDs, storage before food consumption, 60-hour no-hunger-penalty Classic clock; Modern/legacy saves preserved | **Implemented candidate, DOSBox and browser acceptance pending** |
| 0.5.71 | P0 | DOS frame quantum and 13-place route/time audit | Active moveSpeed=1 yields global475=14, not prior provisional 20; 156 directed legs with read-only reference bounds, no unverified live movement cost change | **Source correction implemented; DOSBox runtime calibration still blocked** |
| 0.5.72+ | P0/P1 | DOSBox observed timing, match length, rival/weekend/economy and four-human rounds | Controlled DOS vs Life replay, item provenance, AI survival | Planned |

## Persistent evidence gaps

- Original **initial Happiness** and relaxation are source-confirmed in `room1.sc` Player class (0 and 25) and implemented for new Classic; a DOSBox observed launch is still required to rule out later overrides. Item valuation, fractional education from printed vs decompiled sources, original route-clock conversion and event probability distributions remain open. The former ten-action cap was provisional and is now an optional custom house rule; do not invent coefficients.
- 0.5.57 presets (Quick 30, Standard 50, Extended 75, Custom) are gameplay convenience settings, not verified original edition modes. Short-session browser durations may also reflect instant AI, quick input and faster animations, *not* only goal scoring.
- New Classic starts at happiness 0, so Standard Happiness 50 is no longer pre-completed. Existing saves preserve prior happiness (including 62); the full original-game duration still needs side-by-side evidence.
- Custom Classic deviations may produce intentionally different outcomes. Keep them user-visible and saved per game, while the original-compatible base stays stable.

## Release acceptance procedure

1. Use `docs/reference/original-dos-pass2/` and executable/version-matched source for formulas; record precise source state and confidence in an ADR.
2. Add deterministic narrow tests, restore old saves and network snapshots, verify Modern isolation and custom house-rule toggles.
3. Run `node tools/verify.mjs`, regenerate and open `PLAY.html`, and rebuild GitHub Pages from source. Add a bounded, unique workboard item and verification steps.
4. Provide a flat-root full source ZIP to ZipRunner, preserving local .git/settings/runtime. Operator approves or returns the exact task; **never auto push/deploy**.

## v0.5.65 ZipRunner source-overlay compatibility release

The 0.5.64 same-version repair was superseded by the uniquely versioned 0.5.65 compatibility release; this is not another DOS mechanics pass. The Windows ZipRunner merged-project test suite retained an unshipped `tests/language-campaign.test.cjs` which expected a static `#languageSelect` control. The shipped game only exposed `#gameLanguage` in dynamically created New Game settings. Add an accessible main-toolbar `#languageSelect`, persist/sync EN/NL with the modal through the existing locale helper, and test both index.html and PLAY.html. The original DOS opening conditions, consumed-food rules and saved-game migration remain unchanged. This work does not assert that all local-only tests pass; retest against the real merged project after overlay.


## 0.5.65 release discipline

Each corrective source ZIP must increment the numeric version, including package, handoff, Looprd, parity, art and workboard. Release v0.5.65 carries forward the EN/NL toolbar repair previously mislabelled as 0.5.64; this does not close the outstanding travel-time or DOSBox validation gaps.

## v0.5.69 source overlay language repair

The local retained `language-campaign.test.cjs` now expects `I18n.set(...)`. This version adds a shared controller instead of writing only to locale storage. Core DOS time/AI/economy comparisons remain scheduled. No claim of testing the unshipped local test or DOSBox runtime.

## v0.5.70 — Dutch presentation repair (DOS parity unaffected)

A stored NL language preference previously translated only some static markers while the active game still displayed English. The renderer now calls localization on generated gameplay UI and restores English on toggling. This does not close DOS movement-clock, AI or simulation parity work. See ADR-0070; LL-301 remains for comprehensive story/event translation.

## v0.5.71 movement evidence

- `room1.sc` marble `moveSpeed 1` at line 1066 and active turn `global475 = moveSpeed * 14` at 1315; `Main.sc` initial global475=20 is overwritten.
- `timeKeep.doit` adds a unit when `++global324 > global475` (strict), making the active source threshold 15 for moveSpeed 1.
- `WhereShouldIGo.sc` AI route budget accumulates 170-point shortest distance and `2*global475` per leg. **This is an AI estimator, not a measured human travel duration.**
- The audit checks all 13*12 directed legs, ranges for all possible frame carries and reports differences from current playable travel charges. Actual travel charges, 60-unit weekly clock, saves and homeward debt remain unchanged until original runtime recordings can validate conversion.

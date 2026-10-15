> **Historical audit snapshot (v0.4.2–v0.4.3).** The authoritative long-term design is now [ARCHITECTURE.md](ARCHITECTURE.md) and [docs/parity-matrix.md](docs/parity-matrix.md) (architecture rev 1.0, 2026-10-12). Statements below record prior release decisions and are **not** a declaration of original gameplay parity.

# Jones in the Fast Lane (1991) vs. The Life Loop — gameplay parity audit

Audit date: 2026-10-11. Target: The Life Loop **v0.4.2**, from the last released **v0.4.1** baseline.

**Evidence and limits.** This is a rules-level comparison against documented behavior in the original, **not** a claim that the DOS binary has been emulated or instrumented. The supplied original Sierra archive contains DOS/SCI game resources but no included manual. This environment does not provide a DOSBox/ScummVM runtime. Reference descriptions:

- Giant Bomb's *Jones in the Fast Lane* game guide (one week/turn, recruitment at Acne Employment, jobs by venue, uniforms, rent, education, raises and events): https://wiki-origin.giantbomb.com/wiki/Games/Jones_in_the_Fast_Lane
- The Sierra Chest walkthrough: https://www.sierrachest.com/index.php?a=games&fld=walkthrough&id=331&title=jones-in-the-fast-lane
- MobyGames' game description: https://www.mobygames.com/game/370/jones-in-the-fast-lane/
- Wikipedia's gameplay outline: https://en.wikipedia.org/wiki/Jones_in_the_Fast_Lane

## Employment rule — answer to the player's question

A character should hold **one regular position with one employer**. Working means visiting **that employer's building** and spending time on a shift. Changing jobs is possible **by applying at the employment center**; it replaces the previous job rather than adding a second salary. Working and studying are compatible in the same week, but no person should be able to work regular shifts at competing employers without applying for a new job.

The v0.4.1 engine already had `player.job` as a **single ID**, and the `work` action required `job.place === player.location`. This was *functionally enforced* but obscured by the UI: job offers did not clearly say they replaced your employment, the change was immediate, and home freelance work could be repeated without a cap while employed.

### Parity matrix

| Behavior | Original reference | v0.4.1 | v0.4.2 | Follow-up |
|---|---|---|---|---|
| One active primary job | Employment progression via job applications | **Yes**, single `job` ID | **Yes**, explicit replacement | — |
| Work at hired employer only | Jobs tied to specific workplaces | **Yes** | **Yes**, labeled workplace and shift | — |
| Apply to change jobs | Employment center applications use time | **Yes**, silent overwrite | **Yes**, job-switch confirmation for human | — |
| Job requirements | Education, experience, proper clothing | **Yes**, simplified | **Yes**, covered by tests | More distinct qualification paths |
| On-the-job shifts | Work consumes weekly time, yields wages | **Yes**, 6h actions paid for 8h | **Yes** | Adjust time economy to closer original |
| One week per turn | Turns represent weeks | **Yes**, 40-hour abstraction | **Yes** | Original's turn/action pacing is different |
| Side income | Occasional computer/weekend earnings; not unrestricted second employment | **Different**: repeatable home gig while hired | **Constrained**: unemployed only, one/week; computer weekend income remains | Decide whether to retain unemployment safety net |
| University | Multiple courses with prerequisites, eleven named subjects | Four linear qualifications | Unchanged | Deepen degree tree |
| Job catalog | Multiple ladders across many workplaces | Eight simplified careers | Unchanged | Expand employers/jobs |
| Wage adjustment | Existing wages, economic cycles, raise applications | Raise action and economy effects | Unchanged | Salary persistence/layoffs |
| Workplace clothing | Clothing requirements and wear-out | Purchase/requirement, *no durability* | Unchanged | Clothing wear and replacement |
| Rent and food | Monthly rent (4 turns), eat every week | **Yes** | **Yes** | More varied meals/items |
| Travel and action time | Moving/working/applying/studying consume time | **Yes** | **Yes** | Board adjacency/turn pacing |
| Random weekends | Weekend events/risks, including theft | **Partial** | **Partial** | Wider event pool and pawn shop |
| Four life goals | Wealth, happiness, education, career | **Yes** | **Yes** | Goal formula tuning |
| Multiplayer | Up to four players; computer-controlled Jones | 1–2 human, plus AI | Unchanged | Four-player support |

**Conscious design difference:** The Life Loop is a modern *successor*, not a literal reimplementation, so new NPC relationships, seasonal civic events and financial history are additional systems.

## Implemented in v0.4.2

1. At the Career Center, roles now say **Apply** (unemployed) or **Switch to** (already employed). The offer explains that the old job is replaced.
2. Human job switches show the *current/new employer and hourly wage*, and ask for confirmation. Cancel leaves employment, money and time unchanged; the AI uses the same underlying atomic rule without a dialog.
3. The player profile and venue state the current employer, role, hourly wage and where work can actually be performed. A `work` button names the job.
4. Applying for a second job immediately replaces the first `job` ID; only the new location exposes `work`. Prior work progress does not qualify for a raise at the new job. Lateral switches cannot infinitely farm happiness.
5. Home paid errands are explicitly marked an unemployed safety net, at most once weekly, rather than a second unlimited employed job. Computer weekend income remains untouched.
6. Existing v0.1–v0.4.1 saves load, defaulting missing `oddJobWeek` safely.

## Tests and acceptance checklist

Use `node tools/verify.mjs`, including **57 automated tests** (previously 48). In addition, in-memory Chromium UI smoke checks passed at 1440px and 390px, covering hire, wrong-workplace denial, cancel/confirm, and post-switch enforcement with zero JavaScript errors. A deterministic 100-seed, 130-week AI stress check ended with no employment/rent/hunger failures. Direct local HTTP and `file://` browser navigation are blocked in this environment, and Windows opening still needs operator confirmation. The nine added tests specifically verify:

- An unemployed character cannot work at any shop.
- After hiring as Cafe Server, a work button is available only at The Good Fork; other workplaces refuse `work`.
- Switching to Store Associate via Career Center replaces Cafe Server, resets new-employer shift history, spends exactly 3 hours, and unlocks only Fresh & Frugal shifts at the new wage.
- Rejected/unqualified and same-role applications do not change employment or time.
- Alternating equivalent entry jobs cannot repeatedly raise happiness.
- Temporary paid errands are unemployed-only and limited to once per week.
- Education and banking do not change the active contract.
- Existing saves lacking the new fallback cooldown field restore with unchanged employment.
- The AI keeps a single active position through a long multiweek economic simulation.

### Manual operator walkthrough

1. New solo game → start unemployed. Visit the diner and confirm **no regular work shift** is offered.
2. Travel to Career Center → apply for Cafe Server; confirm title, employer and pay appear in your profile.
3. Visit Fresh & Frugal → **no Work** option; visit The Good Fork → Work as Cafe Server, confirm pay.
4. Return to Career Center → choose **Switch to Store Associate**. The modal should show **old/new job, workplaces, and wages**; choose Cancel and confirm no change.
5. Choose the same switch again → confirm. The profile and activity should change; return to The Good Fork and confirm you cannot work, then work at Fresh & Frugal.
6. Try another application you don't qualify for. It should remain unavailable, without consuming time.
7. Export and import your game save; verify the active job and wage persist.
8. Confirm GitHub Pages build via `npm run build:pages`; deploy only after operator Git review.

## Deferred fidelity items

**High:** clothing durability and workplace refusal after clothes wear out; more extensive career ladders and university prerequisites; original-style job loss/raise/rent edge cases.

**Medium:** dynamic week pacing to match the original action timer; broader consumer goods and pawn-shop mechanics; weekend/robbery balance; four human players.

**Not claimed:** pixel-by-pixel replication of the DOS game, original source recovery, and comparison with live DOS gameplay.


## v0.4.3 follow-up: fidelity improvements

Source cross-check against Sierra Chest and the Jones in the Fast Lane community wiki identifies **weekly clothing consumption**: three uniform tiers (casual/dress/business), 6 casual weeks at game start, cheap/short-lived and expensive/longer-lived sellers, weekly wear of each category even when not worn, and higher-tier outfits substituting for lower-tier uniforms. This corrects the earlier simplified permanent `owned` clothing unlock. The Life Loop v0.4.3 now models these mechanics, adapting the store names to its original city. Buying clothes adds a number of weeks; a worn-out uniform blocks paid shifts without cancelling the employee contract.

The remake now has 19 career positions and 4 specialist certificates while preserving its earlier 4-stage degree progression. Exact Sierra occupation lists and 11 original university qualifications are **not** claimed. The roadmap makes tier, pay, workplace, coursework and attire visible. Existing save migration converts legacy clothing flags and preserves active jobs. Added tests cover initial wardrobe, independent weekly wear, purchase stacking, substitution and workplace denial, short courses, migrations, local multiplayer isolation, and long-term AI viability.

Sources: https://jonesinthefastlane.fandom.com/wiki/Clothes ; https://jonesinthefastlane.fandom.com/wiki/Uniform ; https://www.sierrachest.com/index.php?a=games&fld=walkthrough&id=331&title=jones-in-the-fast-lane .

## v0.5.0 update — DOS jobs & cash rent

Prior references in this audit to 19 Classic occupations, flat vacancy probabilities or automatic Classic rent describe **older builds**. In v0.5.0, Classic has **37 documented floppy DOS occupations**, 4-hour applications with qualification and opening rejections, listed-wage raises, and manual $325 rent due on week 4, including extensions and garnishment. Modern Story remains on its existing 19 careers and automatic rent. See `docs/classic-job-table.md`, `docs/parity-matrix.md`, and ADR-0004.

Still incomplete: exact shop/building map parity (Z-Mart and Black’s Market share a tile), 2 CD-only jobs, original economy formula, partial shift time, advance rent/switch apartments, loans, pawn shop, full food systems, four-player hotseat, exact events and score formulas. These should **not** be marked one-to-one complete without running the original DOS executable.


## v0.5.1 — Original bank and food-service audit

- **Now implemented:** $100 savings increments with no time or deposit interest, 2-hour loan application, $45+$5 recurring installments, 2-hour broker and six individually owned/valued original instrument categories. Original market fresh-food bundles ($55/$100/$190), refrigerator 6-unit storage, freezer 12-unit storage and 1-unit weekly consumption. These systems are Classic-only.
- **Intentionally partial:** loan amount/acceptance mathematics, per-week stock price fluctuation, bank robberies/market crashes, doctor-bill spoilage charges, restaurant-specific food variety and item rarity, exact DOS action-zero-hour exceptions. Parity status remains partial.
- **Missing:** original Pawn Shop, original distinct ring tile layout, full durable/second-hand economy, 4-human hotseat.
- **Tests:** bank zero-hour transfers and T-Bill fees, default schedule, six instruments, food storage/spoilage, Modern isolation, save migration and long simulation.


## v0.5.18 — Verified Classic opening economy, goal points and Jones difficulty

Classic opening balance is now $200 cash and zero savings. The original goal stat equations are implemented explicitly: liquid assets / 100 (currently net debts, unverified), raw Happiness, 1 + 9 times completed diplomas, and 1.25 times Dependability only when employed. Win checks require all four configured goal thresholds independently. This replaces the old Life Loop proportional score estimates **only in Classic**. The player chooses 10–100 point goals; original defaults are 50 per goal, for 200 total points.

Jones difficulties use documented goal-point offsets (+40, 0, −40). A deterministic seeded allocator assigns Jones four separate goals and stores them in snapshots. **The original distribution and seed ordering are not verified**, nor are debt treatment and win evaluation timing. Employer selection is the default Career Center view; future-job exploration is opt-in. Modern Story job/score formulas remain unchanged. AI buys replacements before uniform depletion to avoid a cash-only softlock.

Regression: `tests/classic-goals-competition.test.cjs`, existing Classic banking/work/pawn/AI tests, UI viewport checks; ADR-0019.

## v0.5.19 reference reconciliation (Sierra Quick Reference)

Sierra's printed Quick Reference states that Money goal includes **owned goods**, and Education depends on **units of study**. Classic v0.5.19 now values owned durable goods using a provisional table and credits incomplete coursework proportionally. Original DOS rounding is unverified. A fallback emergency gift protects hopelessly stranded characters, but its $90 amount and eight-week cooldown are not claimed as original. Weekly economy shocks, clothing/electronics quality differences, robbery, security apartments and actual 13-location functional equivalence remain partial. Modern Story not changed.


## v0.5.22 — Classic merchandise placement and rotating stock (partial parity)

- Black’s Market food / newspaper / lottery is now separate from the Z-Mart counter within the shared Fresh & Frugal city tile. Independent Classic employer identities remain, but their physical travel and entrance cost is still shared and therefore **not** original DOS parity.
- Z-Mart sells clothes and a seeded, rotating four-week stock of dictionary, atlas, encyclopedia, VCR, stereo, baseball, concert and theater tickets. Books are no longer sold at Socket City (Classic). Stock is validated when executing the purchase and a player cannot buy duplicates of unique durable goods.
- A purchased ticket is limited to one at a time, persists in a snapshot, and is consumed at the next weekend for a small happiness effect. Home stereo and VCR add comfort when relaxing in Classic. Modern settings and store actions are unchanged.
- Current discount costs, stock schedule, weekend effects and lack of electronics breakage are **provisional approximations**. Original DOS store availability, separate business locations, equipment quality, bank/market robberies and exact happiness effects remain unverified, tracked under LL-147.
- Regression: `tests/classic-discount-market.test.cjs` and `tests/qa_discount_market.py`; no public server schema migration, workboard and ADR-0023.


## v0.5.23 Classic action-time and wage precision (partial parity)

- **Implemented:** All Classic in-venue decisions require positive hours remaining; zero-hour actions no longer permit cash/food operations after the clock expires.
- **Provisional:** Ten in-venue decisions per week; movement is excluded, while a selected failed/dismissal action counts. The player-provided original reference mentions ten events but does not establish precise counting criteria.
- **Implemented consistently:** Fractional wage remainder carries across split work actions; current gross pay preview equals settlement, so six 1h shifts pay the same as a full 6h shift at a fixed wage.
- **Not claimed:** DOS-exact partial-pay rounding, event classifications, dismissal timing, and original travel distance.


### v0.5.24 Classic location and risk audit

- Classic uses distinct original-named and geographically original-positioned thirteen destinations, with Black's Market groceries and Z-Mart discount supply at separate tiles. Modern retains the independent modern locations.
- Classic original employment IDs retain their qualifications and hourly pay; the gameplay and city marker now resolve the original named Classic business, not the modern alias.
- Moving into Le Security Apartments protects from residence burglaries, while Low-Cost Housing does not. Relaxation follows the actual residence. The moving charge and exact original rent adjustment remain provisional.
- Refrigerators, freezers, computers and VCRs/stereos have source-dependent malfunction checks, repairing restores benefits, and a broken item's value is discounted. All probabilities and resale fractions are provisional.
- Wild Willy can rob the Bank or Black's Market of carried cash, and may steal owned property during low-cost-housing weekends. Banked savings remain protected from transaction robbery.
- Classic artwork is a 13-slot optional collection with default modern art placeholders; no DOS graphics shipped. User-provided artwork remains an outstanding follow-up.
- Automated tests confirm consistency, not binary DOS rule equivalence. Original weekly movement arithmetic, device failure rates and robber outcomes are still unverified.


### v0.5.29 Pass-2 audit delta

Classic pricing and lottery actions are now directly source-calculated with deterministic 100→bounded 10–190 goods-index model; the evolution process is **not** Sierra's complete interdependent index machine. Rent-extension chances use original d12 cutoffs; partial gross wages no longer carry fractions. Prior Classic AI preferences now have source-tagged priority branches for emergency needs, followed by existing heuristics for career advancement. Weekly events and branch traces survive save/load. The opponent may still experience genuine hunger and arrears during volatile 60-week campaigns, so full original AI/financial parity remains **partial**.


### v0.5.30 economic integration audit

Eight index domains share a seeded update mechanism while retaining distinct readings; shop prices, offered (not contracted) wages and bank quotes consume these readings. Exact Sierra volatility/risk, wage-index binding and 16-bit rules remain unverified. A new guard prevents Classic Jones from abandoning a higher contracted wage for a title whose *market* offer has fallen. Conditional rent/food pawning uses original representative branch tags; full first-match AI remains incomplete. Stochastic long-run survival tests are unchanged in strictness, rather than relaxed to hide regressions. No Modern prices, original identities or route rules are changed.

## v0.5.31 Classic crisis mechanics audit (2026-10-13)

The supplied DOS pass-2 record of `startTrn.sc:596–775` supports a strength-1 event wiping bank savings and dismissing the employed, and strength-2 selecting dismissal versus truncated 80% wage with a binary draw. The game uses these exact **outcome branches** and the accompanying −7/−3 happiness penalties, but not the source's complete branch-trigger RNG or event scheduling; the live weekly phase model is provisional. All Classic participants receive outcomes in a deterministic, recorded order; cases of unemployment/recent job loss are tested. Legacy saves use a neutral pulse as of their saved week, do not replay earlier weeks, and preserve Modern state. Note: downturn-related hardship means no absolute 100-seed employment guarantee; see explicit quantitative endurance threshold in the regression suite.

## v0.5.32 Classic career and resilience audit (2026-10-13)

The current source-tagged rival has branches 20, 28, 29, 30, 32, 37, 44, 46, plus prior emergency/office priorities. Branch labels and broad venue choices match pass-2 research; precise DOS selection gates, wage negotiation mechanics and time conversion are **not** verified. A strict 100-seed, 60-week endurance test originally found seed 96 vulnerable to an expiring *formal* uniform despite available cash. Fix: renew any qualifying clothing rank at two weeks remaining and treat it as essential before schooling. No rescue money is injected; apply normal wardrobe prices and route costs. Persistent unemployment fields are additive and validated on load; modern mechanics are isolated. Focus tests assert source tags, career, move/act feasibility, save/replay and seed reproduction.

## v0.5.33 original clock and source tick audit (2026-10-13)

The Pass-2 DOS source shows the `WhereShouldIGo.localproc_1` ring route estimate as each leg's circular `min(abs(a-b),170-abs(a-b)) + 2*global475`, with initial `global475=20`; it is **an AI estimate in ticks, not evidence for dividing by 20 into user-facing hours**. `room1.sc` adds +2 for entering Employment, `employment.sc` charges +4 for applications, `n108.sc` charges a 6-unit shift with late partial gross and +1 capped work stat progression per successfully worked action. v0.5.33 models those as separate concerns, with independent tests for route ticks, new Employment surcharge, quote/commit atomicity, partial progression/pay, and Modern isolation. The older six-hour accumulated partial-shift progression and symmetric agency return travel were previous approximate mechanics. Save migration ignores any unused legacy pooled work credit, preserving employment and money. Exact DOS motion-speed-to-turn-unit conversion, work garnishment quirks, other storefront entry charges, and original weekly action limit remain unverified and should not be claimed complete.

## v0.5.34 work warning/garnishment and AI source ordering

DOS Pass-2 `n108.sc` describes `dep < req-5` dismissal; `dep < req-2` and one-time warning gate; successful shifts grant capped experience and dependability and compute partial gross with floor rounding. Prior Life Loop only warned after payment, which is not the recovered source ordering. Warning now occurs before clock/pay and is persistent for a week. Work previews disclose the net wage under the existing *provisional* 50% rent deduction and maximum $2 fee. The original garnishment special-case **cannot** be proven byte-exact from the available extracted text and has not been replaced with speculative logic; a same-wage/different-time DOS runtime trace is required. Classic opponent action planning now includes work-action feasibility after travel and respects 10 choices; this ten-choice cap itself is provisional. Modern untouched.

## v0.5.35 — payroll reconciliation and Classic rival finances

Fixed a practical forecast bug: the survival planner previously used `shiftPay` (gross) during garnishment. This now calls the same Classic net quote that actually pays shifts, projecting arrears clearance sequentially for two paydays. Work receipts expose gross/garnishment/fee/net and reconcile with wallet and rent debt on every completed shift. The finite 16-entry journal is validated during save and multiplayer snapshot import; older saves default to []. Rival no longer spends essential food/current rent/workwear buffer to pay old arrears voluntarily. The optional fullGrossBasis figure is a *sensitivity comparison only*; the recovered source explicitly warns of an alternative overwrite path but has insufficient code/evidence to infer exact outputs. Historic DOS payroll parity is not yet established.

## v0.5.36 Classic turn-sequence audit

The original DOS research places `Player.endTurn` dependability −3 before next-turn start, while our earlier game applied it at the common `newWeek` reset. v0.5.36 corrects the hotseat/AI timing, adds a pure rent assessment with a once-a-week guard, and journals the sequential Classic phases. The event log is validated across save/imports, bounded to 72 entries, and shown under Finances. The action clock, employer warnings, work pay, AI actions and Modern mechanics retain their existing behavior. **Not historically proven:** exact 37-step startTrn callback execution order, annual/periodic bonus effects, per-action count cap, and original garnishment. Revalidate against emulator traces.

## v0.5.37 migration check

Classic mobile no longer remaps 13 original venues into a serpentine. The same 5×4 geometry and 170-waypoint graph appear on desktop/phone and pan together with their SVG layer. Building finder and overview controls only change browser scroll/CSS. Venue actions still use existing `net.execute` / authoritative `Game.travel` and remain centered on the board. The Classic computer event uses verified state 4 1/7 $20–$100 cash outcome; other `startTrn` phases remain provisional.


## v0.5.38 migration audit

- Classic city 13/13 fixed place identities. 390px and 320px view tested, Overview inspect is free, Explore travel opens centered venue.
- `startTrn.sc` state 10: food storage loss journal; original limit 6 without freezer / 12 with freezer and existing provisional no-fridge spoil behavior, without the unsupported $25 medical charge. Actual event probability remains open.
- `startTrn.sc` state 18: one-week/expired clothing notices recorded in bounded Classic weekly event history. Same clothing aging rules and source-informed work-uniform checks; Modern unaffected.
- Save schema/Looprd HTTP and WebSocket protocol unchanged; no credentials or runtime files in ZIP.

## v0.5.39 Classic journey and provenance audit

- Departure → route animation → entry/arrival marker → centered venue; no animation side-effect spending.
- Mobile Overview remains zero-cost inspect-first. Camera follow stops only after a deliberate horizontal gesture (>9 px) during movement.
- DOS `startTrn` state 12 logged for existing missing-food outcome, without altering hunger or adding a penalty.
- DOS `startTrn` state 34 logged for two-check clothing assistance. The original award formula and cooldown have not been recovered, so the existing `$90 / 8-week` compatibility behavior is unchanged.
- Replay/save compatibility: presentation transient; only pre-existing bounded event journal gains source identifiers. Modern isolated.

## v0.5.40 Classic relaxation and animation audit

DOS source state 6 explicitly tracks relaxation independently of the victory statistics and lowers it by one per week toward ten without item-28 hot tub. The Life Loop's initial 16/rest +6/maximum 30 are provisional. Traces record every Classic check. State 20 is a source-linked four-week loan schedule check: existing penalties are not claimed DOS exact. Animation skip is a UI-only one-shot completion; no additional travel cost, RNG draw or venue action. Test save upgrades with missing `classicRelaxation`, forged out-of-range values and Modern-mode behavior.

### v0.5.43 maintenance and workboard safeguards

- Classic AI's optional repair choice uses a pure, stable appliance order and pays only from cash remaining after the two-week survival reserve. It uses the existing `classicRepair` action and normal travel clock. Modern rules remain untouched.
- The source release workboard is reconciled by stable ID and validated; ZipRunner v1 cannot yet update Blocked/In Progress statuses, so operator-side importer verification is still required.
- The original DOS machine-failure and repair probabilities/prices have **not** been recovered.


## v0.5.48 — Clock/camera display-only change

Classic HUD derives its only 60-unit clock from the authoritative active player's action budget; moved that dial to the non-playable Public Garden. Camera modes are phone-only; their switch never spends a unit. The south-row projected route visual follows the actual 5x5 garden board gutter. No movement/timing formula, Modern rules, multiplayer authority, save or Social schema changed. See ADR-0048 and `tests/qa_classic_clock_garden.py`.


### Street-rendering regression boundary v0.5.50

Classic route rendering does not modify waypoint counts, route quotes, clock consumption, employment actions, save snapshots, room authority or Social data. Browser QA checks that highlighted segments avoid all building tile interiors at four viewport widths. This is not evidence that the provisional original DOS waypoint-to-clock conversion is accurate; original runtime calibration remains in backlog.

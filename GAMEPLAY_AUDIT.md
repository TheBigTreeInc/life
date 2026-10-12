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

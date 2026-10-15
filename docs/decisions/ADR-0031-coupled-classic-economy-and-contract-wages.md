# ADR-0031 — Seeded multi-index Classic economy, wage contracts and survival priorities

**Status:** Accepted (v0.5.30)

## Evidence and scope

Pass-2 original DOS reference (`docs/reference/original-dos-pass2/PASS2_MECHANICS.md`) establishes eight separate `EconomicIndex` domains, initial readings of 100, and clamped readings 10–190. It confirms that goods prices use `n109.sc` integer-truncated math and that the market and salaries are related to economic conditions. The exact index volatility/correlation rules and which DOS index controls each job wage are **not yet emulator verified**.

## Decision

Create a small pure module `src/classic-economy.js` to hold the eight readings (general, investments, goods, gold, silver, pork, blue, penny) and a bounded trend per domain. Update it **once per completed player cycle** using the existing seeded generator. General economic movement contributes to investments and goods; the separate investments domain influences individual market domains. This is a **seeded compatibility approximation**, not the actual SCI `EconomicIndex` algorithm. The source-derived price calculation remains in `classic-pass2-rules.js`, applied to live consumer-goods quotes.

Bind newly offered Classic job rates to the **general reading** through the integer price transform as a provisional salary adapter, while preserving wages already in a player's `p.wage` contract. Job applications and raises can update contracted wage. Do not revert to unrelated `game.economy` fluctuations inside Classic. This prevents existing saves from silently losing money from a market downturn. Modern Story continues to use its established wage and `economy` path.

Market instruments update through the difference between their previous and new economic readings, preserving saved base quotes/portfolios rather than resetting market prices on the first migration week; T-Bills retain fixed quotes. The published initial bank prices and hard limits remain in `data.js`. The actual DOS investment pricing/volatility remains pending original-run comparisons.

Enhance the read-only Classic survival budget with a trend-informed two-week food estimate, without charging a forecast price. The opponent's job search compares an offered wage with its **actual contracted wage** (not an inflated/deflated virtual rate of its current occupation); it protects immediate needs before switching jobs and uses recovered source branch IDs 11/23 for emergency pawning, after checking more conservative options. These specific emergency branch conditions remain representative subsets of the original AI, not a full SCI interpreter.

## Persistence, migration and multiplayer

The optional `classicEconomicIndices` snapshot has schema `classic-economic-indices.v1`, fixed eight-key readings and trends, and strict validation. A v0.5.29 save without it adopts its prior goods reading and the legacy scalar as a general-index starting point. Old `classicGoodsIndex` remains a compatibility alias for existing consumable quotes and imported scenario snapshots. Existing player job IDs, work contracts, stock holdings, route identities and degrees are unchanged. Looprd host/guest snapshot transport carries the additive object, with no new API route or remote protocol. Never use this state for Modern actions.

## Verification

`tests/classic-economic-migration.test.cjs` covers 1,000 bounded steps, seed replay across 24 weeks, independent market quotes, integer goods prices, retained employee wages, legacy migration, invalid inbound snapshots, pawn choices and Modern isolation. Previously established 100-seed and 30-seed, 60-week rival endurance tests must still pass. Browser source and offline/Pages output must expose the new Classic model in Finances/Career Roadmap. The full release verifier must execute the new test file.

## Remaining gaps

Actual EconomicIndex drift, `EconomicIndex.sc` dependent state, DOS wage scaling, downturn/scandal state sequence, debt garnishment and full WhereShouldIGo precedence remain pending trace/replay. This release's new salary/index behavior is intentionally labelled approximate in both the UI and documentation; original wages retained as reference metadata.

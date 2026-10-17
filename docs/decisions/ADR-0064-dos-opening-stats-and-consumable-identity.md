# ADR-0064 — Source-backed DOS opening statistics and consumable identity

**Status:** Accepted
**Release:** v0.5.64
**Decision owner:** Classic rules and lifecycle

## Original authority

Version-matched decompiled Sierra SCI scripts, DOS Jones 1.000.060:

- [`room1.sc` Player defaults, init, and consumables](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/room1.sc): `hapStat 0`, `cash 200`, `relax 25`, `experience 10`, `dependibility 20`, `curRent 325`; initial consumables include rent and clothing but **no edible food**.
- [`fastFood.sc`](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/fastFood.sc): Astro Chicken #2 $124 +2 first-buyer happiness, Hamburger #3 $79 +0, Cheeseburger #4 $89 +1, Fries #5 $65 +0; prices are base prices prior to goods-index adjustment. Separate type-3 drinks #6/$102 and #7/$69 exist but are outside this milestone.
- [`market.sc`](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/market.sc): fresh groceries index #1, 1/2/4-week base-price bundles $55/$100/$190; distinct from restaurant food identities.
- [`startTrn.sc`](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/startTrn.sc): state 8 chooses highest stocked index #1–#5, state 10 checks item #1 storage (no fridge loses all/−2 happiness, fridge cap6, freezer cap12; overage −1), state12 discards food #3–#5, state14 handles shortage/spoilage stress, state16 decrements every remaining consumable.
- [`Goods.sc`](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/Goods.sc): `Consumable.doit` decrements a positive quantity by one.

## Decision

New Classic games start with 0 happiness, 25 relaxation, $200, and no edible food. Preserve original 60-unit weekly clock without Modern's hunger-time subtraction. A new separate `classicFoodV2` identity dictionary models #2/#3/#4/#5 purchases and week-end state order, while `groceries` remains fresh index #1 for compatible UI and existing store offers.

Food IDs #3/#4/#5 are discarded before week consumption; #2 survives to later weeks. For no-fridge food, the source chooses #1, then discards it and records a spoiled-food risk instead of treating it as an eaten meal. First purchase of Astro Chicken/Cheeseburger gets a source-authored happiness bonus once per week.

**Compatibility:** Previously saved Classic payloads without the new identity field retain the former v0.5.63 food/weekly algorithm. Their attributes are never reinitialized. Modern Story continues to use its original 40h initial clock and hunger effects. Networking and save schema remain wire-compatible (additional optional member).

## Evidence and caveats

Run `tests/classic-dos-consumables-064.test.cjs`, all tests through `node tools/verify.mjs`, and compare source runtime in DOSBox. The source proves *class defaults* but a DOSBox observed start state is still needed to certify that startup scripts do not override the class values. Source initial rent/clothing entries are not fully itemized in this pass. Original illness and cash-event RNG, paid purchase-price provenance, full consumable drink effects, and Jones's complete branch map remain separate gaps.

The original, harder new-game states reduced the old benchmark to **27/30** seeded Jones campaigns meeting the previous endurance threshold. The test now pins that outcome, rather than falsely claiming the previous **28/30**. This is a remaining AI/balance gap to address, not a verified DOS gameplay outcome. DOS runtime/interactive browser smoke tests remain operator acceptance checks, not assumed successful. No source auto-push or deployment.

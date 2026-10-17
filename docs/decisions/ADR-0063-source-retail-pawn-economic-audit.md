# ADR-0063 — Original pawn quotes and source-audited retail/economic randomness

**Status:** Accepted for bounded Classic candidate; complete original DOS parity not claimed.  
**Release:** 0.5.63  
**Source edition:** Jones DOS 1.000.060, decompiled SCI scripts published by sluicebox.

## Source evidence

- [`pawnShop.sc` at lines 775–815](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/pawnShop.sc): pawn payout = integer 40% of `proc109_0(goodsIndex, item.pricePaid)`; redemption = integer 50% of `item.pricePaid`; −1 happiness upon pawning; refrigerator loses remaining fresh food and another −1 happiness. The original also has a counter-capacity rule (six items) and original pawn ownership flags, which are **not** implemented here.
- [`market.sc` lines 270–409](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/market.sc): food bundles 1/2/4 units with base prices 55/100/190, ten lottery tickets for $10, newspaper $1. Those retail quotes/actions already existed in the current Classic build; this pass adds a source-catalog and price-index invariant regression, **not a false new catalog expansion**.
- [`economicIndex.sc` lines 28–145, 202–244](https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/economicIndex.sc): integer trend steps with distinct risk parameters, inclusive random bounds, parent index and crisis/boom scalers, eight index cascade order. New deterministic adapter is **read-only**. Also record the `global307/global372/global374` event eligibility test, without applying it to the live game.

## Implementation

New `src/classic-retail-pawn-063.js` provides pure, deterministic source predicates, available in CommonJS and browser/offline bundles. New Classic pawn lots persist the quote basis and snapshot validation checks payout and redemption consistency. **Old pawn lots** with no `sourceQuote` preserve their original fixed 45% loan plus surcharge; **Modern Story** also preserves the old mechanic. No existing lot is repriced if economic readings change. The transaction happiness effects are applied to new Classic pledges.

The current inventory represents owned appliance IDs, not their original item-specific `pricePaid`, and does not track whether each was bought discounted, at a pawn counter or at original price. Until that field can be migrated safely, the quote uses the declared item reference value as an explicit **proxy**, not a claim of exact paid-price parity. The current two-week redemption expiry, unrestricted pawn counter capacity (64 global save-bound), unclaimed resale and entire bank/share simulation remain game compatibility models. The DOS economic index and headline comparator do not affect game random rolls, live values, multiplayer state or saved snapshots.

## Acceptance and omissions

- `TEST-RETAIL-PAWN.bat`, `npm run test:retail-pawn`, `node tools/verify.mjs`, and a complete clean-extraction rebuild.
- Test 1/2/4 food tier invariants under seven goods-index values; new Classic quotes and persistence; rejected tampering; legacy/Modern lots; fridge edge case; deterministic economic index and event RNG comparator; no RNG mutation on preview.
- Original per-item paid-price history, six-item pawn shop limit, original pawn resales and original eight-index live drift/correlation require a separate migration. Exact source RNG replays and four-human rounds remain open.

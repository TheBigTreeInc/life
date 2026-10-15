# ADR-0023 — Classic discount shelves and grocery counter ownership

- **Status:** Accepted
- **Release:** 0.5.22
- **Scope:** Classic retail domain boundaries; Modern Story unaffected

## Problem and reference

The original Jones reference material distinguishes Z-Mart's weekly bargain-stock clothing, books, electronics and event tickets from Black's Market's groceries, newspaper and lottery. Existing Life Loop v0.5.21 had two original employer identities but one undifferentiated retail activity list. Classic books were incorrectly sold at Circuit City and discount clothes were available every week without a stock constraint.

## Decision

Preserve the current **13 shared locations** for both rulesets, as requested, without deleting another location or silently introducing a fourteenth. Treat Fresh & Frugal as a building hosting two separated counters. Add an explicit `classicDiscountGoods` source catalog and pure `classicDiscountStock(week)` deterministic four-week rotation. The engine validates selected SKUs and inventory at execution time, and the centered venue action list groups actions under two independent merchant headings. Modern continues to show its existing retail behavior.

Move dictionary/atlas/encyclopedia Classic purchases to Z-Mart, add VCR/stereo as durable pawnable wealth, and provide three single-use weekend tickets. New `classicWeekendTicket` is an optional snapshot field and is validated on load; it is consumed once at the next week transition. A stereo/VCR increases Classic home relaxation by a small amount; neither item changes Modern outcomes.

## Limitations and risks

Original price, availability roll, electronics quality/breakage probability and event expenditures are unverified against DOS. Week rotation, item costs and comfort values are explicit development approximations; do not label them exact Sierra rules. Z-Mart and Black's Market still share **one physical city tile and travel cost**. The separate employer identities and shelves are real but do not resolve original separate map parity. Track physical-location design and authentic risk/economy in LL-147.

## Acceptance

Test weekly stock changes, no out-of-stock purchases, spending exactly once, one ticket per player, weekend ticket consumption once, malformed snapshot rejection, book ownership and study progression, pawned VCR/stereo, Classic/Modern isolation and AI clothing sustainability. `node tools/verify.mjs` must call new tests explicitly. No new public API or server schema required.

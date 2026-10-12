# ADR-0020 — Original printed rules as primary Classic scoring evidence

**Status:** Accepted (2026-10-12)  
**Release:** 0.5.19  
**Scope:** Classic only. Modern Story unchanged.

## Sources and precedence

- **Primary:** original *Jones in the Fast Lane — Quick Reference Card*, published by Sierra, mirrored at https://www.dosdays.co.uk/media/games/jones/Jones_in_the_Fast_Lane_-_Quick_Reference_Card.pdf (the 8-page scan contains multiple print variants of the same two-page leaflet).
- **Secondary:** https://jonesinthefastlane.fandom.com/wiki/Economy and https://jonesinthefastlane.fandom.com/wiki/Dependibility.
- **Supporting user-provided gameplay synopsis:** describes the original family gift when a player becomes hopelessly insolvent, security-apartment immunity and Black's Market newspaper/lottery mechanics; the synopsis alone does *not* establish numeric probabilities.

The primary leaflet explicitly says $200 initial cash, no savings/education/job; one week per turn; Rent Office every four weeks; the Money goal includes cash, savings, investments, **and the value of goods owned**; Education goal depends on **units of study taken at Hi-Tech University**. The older v0.5.18 implementation excluded goods from wealth and gave no education progress until completing a diploma. These were source discrepancies.

## Implementation

1. Classic `classicOwnedValue()` includes independently owned durable items using the *current provisional purchase-price table*. One item is counted once; pledged pawn items are not owned and therefore contribute no goods value. It is an **asset goal valuation only**, not a cash ledger transaction.
2. Classic `classicStudyProgress()` adds fractional progress towards 9 education goal points per diploma using each in-progress course's completed lessons and current lesson requirement. On graduation, partial progress is removed and full diploma credit replaces it. This implementation remains a **provisional numerical interpolation**: the printed leaflet describes units but does not provide a points-per-lesson formula.
3. An explicit hardship safety net triggers after two consecutive weeks when the player cannot afford the cheapest required clothing, owns no serviceable clothing or pawnable goods, and has no investment assets. It gives $90 with an eight-week cooldown and records a finance transaction. The secondary prose confirms assistance from a relative; the **amount, two-week waiting time and cooldown are approximations**, not Sierra-certified rates.
4. Modern Story scoring and difficulty remain unchanged. Existing saves may continue loading; visual-era selection is presentation-only.

## Not included yet

- Weekly market index/crash/boom details in the Economy article; the game's current monthly economy oscillator does **not** match original week-to-week dynamics.
- Exact Dependibility raise thresholds and firing thresholds, plus Edition-specific random/robbery timing.
- Correct original locations and shop merchandise separation (Z-Mart vs Black's Market), item breakage by store quality and rental security against Wild Willy.
- The precise original item resale valuations, asset liquidity handling, and education fractional score rounding.

These remain tracked as LL-134 / parity-contract partial requirements. The test suite establishes *our* current rule consistency, **not DOS parity**.

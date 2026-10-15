# ADR-0040: Classic pawn arrivals and weekly event provenance

**Status:** Accepted

## Decision

Keep original route/board identities and source-derived time computation in the game engine, while moving trip feedback into a presentation-only journey phase. The board renders departure, completed arrival and building entry; the venue action modal remains centered and authoritative travel is charged only by `game.travel`. Mobile Overview cannot spend game time. A deliberate >9px horizontal swipe overrides auto-follow.

## Original DOS evidence

Jones pass-2 `startTrn.sc` state 12 cleans consumables and may trigger food shortage, while state 34 concerns emergency clothing assistance after repeated hardship. Existing hunger and rescue routines already approximate these outcomes; they are journaled with source identities without altering gameplay. The original state-34 award amount and cooldown have **not** been derived. No claim of byte-exact SCI sequencing is made.

## Invariants and testing

Existing save schema and Modern rules are unchanged; no extra RNG draws or charges. Add unit/DOM wiring checks and maintain mandatory full tests. ZIP metadata must conform to ZipRunner's maximum of 150 implemented and remaining items.

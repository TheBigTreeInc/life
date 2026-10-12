# ADR-0017 — Classic partial shifts and pawn lifecycle

**Status:** Accepted
**Date:** 2026-10-12
**Release:** 0.5.16

## Context

Classic must prioritize mechanics from *Jones in the Fast Lane*, not just cosmetic nostalgia. Original-play references describe six-hour work yielding eight-hour wages, proportional work when fewer than six hours remain, and a pawn broker that can hold valuables for redemption and sell unclaimed possessions to other players. The current source had no partial work or pawn option.

## Decision

1. The final 1–5h of a Classic week can be worked at the player's employer at the existing workplace. Gross income is floored to an integer dollar and proportional to (8 × hourly wage × worked hours / 6). Full work remains unchanged. Rent garnishment and the $2 fee never exceed gross earned that shift.
2. Work-stat progression is based on accumulated six hours of work within the current contract. This anti-exploit rule may differ from Sierra's rules; verify original short-session XP/dependability behavior before claiming fidelity.
3. A Classic-only second-hand/pawn desk operates at Circuit City because the modern 12-tile board has no pawn-shop tile. Eligible collateral: fridge, freezer, computer, dictionary, atlas, encyclopedia. A fridge cannot be pledged while the owner keeps a freezer.
4. Pledge principal is floor(45% × fixed reference price); redemption is principal + max($5, ceil(10% principal)). Redemption is possible up to and including the second subsequent week. After that, another human participant can purchase the unclaimed item. The original advance %, interest, duration, prices and pawn venue are **unverified**, so these are provisional rather than documented-original figures.
5. Pawn lots are room-global game state (bounded 64), with owner, item, principal, redemption price, and deadline. Include in save and online host snapshots; reject malformed/tampered state; no external bank account/profile state required.
6. Modern Story is unchanged. UI actions reuse the current venue activity list and existing ZIP/Pages builds.

## Acceptance and follow-up

- Verify 1h, 3h and 6h wages and remaining hours, prorated garnishment, experience caps and switch/dismissal resetting; verify no Modern change.
- Test pawn/collateral state, resale to another local human, funds and inventory movement, double-purchase resistance, save/load and two-browser synchronization.
- Compare the actual DOS executable with observed action tables, repayment deadlines, interest, release of the item, and original pawn shop location. This release intentionally does not assert exact numeric parity.

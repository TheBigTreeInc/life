# ADR-0042 — Classic household and art-independent arrivals

**Status:** Accepted

**Release:** 0.5.41

## Context
The original DOS gameplay tracks relaxation independently from energy and happiness. The Classic adaptation already reduced relaxation weekly but incorrectly hid the home rest action when other needs were full. Household equipment condition was not consistently applied to Classic computer income. The board already animates the pawn along original route geometry, so replacement storefront artwork must not displace the player.

## Decision
- Add a **pure** `src/classic-household.js` projection of working computer, cold storage, and entertainment appliances using existing owned/equipment state. This creates **no additional save fields** and draws **no random numbers**.
- Use working computer status for the existing Classic seeded computer bonus. The original source recognizes ownership, but the game's simulated breakage/repair state is an explicit **compatibility** restriction, not a claimed SCI condition branch.
- Classic rest is available when *any* of happiness, energy or relaxation has room to improve. The +6 relaxation recovery and entertainment comfort are provisional, while state-6 weekly decay remains source-grounded. Modern rest behavior remains unchanged.
- Render an SVG entrance sign from `routeOverlay.anchor(location)` only after an authoritative successful travel. Drawing is presentation-only; route graph, travel costs, multiplayer command and mobile fit/explore board layout are unchanged.
- Ship `docs/classic-designer-handoff.md` and `docs/classic-board-layout-reference.png` as production documentation. Future optional WebP pairs plug into the existing manifest.

## Validation
`TEST-HOUSEHOLD.bat`, the mandatory source verifier and generated standalone/Pages editions. No art generation, custom fonts, new Looprd API, private configs or Git push.

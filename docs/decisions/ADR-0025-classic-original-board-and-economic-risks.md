# ADR-0025 — Original Classic board geography, modern art slots and economic risk

**Status:** Accepted

## Context

Jones in the Fast Lane has 13 distinct locations with historically meaningful economic decisions. Our shared 13-tile New Day City could not represent separate Z-Mart and Black's Market workplaces or low-cost/secure residential locations. Appliance repairs and Wild Willy theft were also missing.

## Decision

- Keep **Classic** and **Modern Story** modes separate in venue identity and geography; share the already-working location IDs as stable action keys, but use a dedicated `classicPlaces` catalog for original DOS names and cells, and use source-based employer-to-Classic-place mapping.
- Original board: north (Le Security, Rent Office, Low-Cost Housing, Pawn Shop, Z-Mart); east (Monolith Burger, QT Clothing, Socket City); south (Hi-Tech U, Employment Office, Factory); west (Bank, Black's Market). Southwest bottom corner is decorative. The central board region contains the game status and hosts centered action menus.
- Home relaxation routes to Low-Cost Housing or Le Security based on actual Classic rental selection. Rent Office handles moves and periodic payment.
- Distinguish source quality of durable electronics: specialty devices have lower provisional failure chance than discount units. Repair at Socket City; broken items cannot deliver their usual benefits. The equipment state is snapshotted for local games and existing Looprd transport.
- Add seeded random financial risk to Classic only: in-shop Wild Willy wallet robberies, low-cost housing burglaries and protection for Le Security. Savings remain protected. Current percentages are estimates; **do not label these numbers verified Sierra formulas**.
- Use optional installed art pairs selected from `assets/art/styles/classic-modern/manifest.json` and fall back to the bundled contemporary art when no image is present. Keep the offline game self-contained and Pages cacheable.

## Consequences

Classic and Modern are both thirteen-location worlds but no longer share a one-to-one map. The same server command protocol and engine action authorization remain. Original DOS artwork is not included; all board art is new or existing Life Loop assets. Classic board *names and topology* are evidence-based; costs, probabilistic rules and visual placeholders are still approximate. Production two-device Looprd checks remain outstanding.

## References

- User-provided original Jones screenshots from the October 2026 Classic parity review.
- Sierra Jones in the Fast Lane printed Quick Reference Card (DOSDays), and the user-supplied Jones gameplay overview and wiki Economy/Dependibility descriptions.
- Local parity contract and v0.5.23 original implementation. No original DOS executable was automatically run.

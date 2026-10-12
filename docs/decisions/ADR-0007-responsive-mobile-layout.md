# ADR-0007 — Mobile views without changing the simulation

**Status:** Accepted

## Context

The original three-column desktop board put the player's status before the map and the destination's actions after it on narrow screens. That made it difficult to choose a building and act on it from a phone, especially when the Career Center contained dozens of jobs. Online co-op also needs usable join, server-FQDN and friend-code forms on touch devices.

## Decision

For screens at or below 1024 CSS px, present **City**, **Activities** and **My life** as independent panels switched by an accessible bottom navigation. Keep a four-value summary (week, remaining hours, cash, player) visible above the selected panel. When a player successfully travels, open Activities automatically; the persistent City tab returns to the map. At 600 px and below render the illustrated city as two-column cards, preserving all 12 buildings and their illustrations. Use minimum 44–58 px touch controls, readable type, safe-area bottom padding and mobile scrollable dialog sheets. The header remains accessible via horizontal scrolling; do not hide commands behind an unimplemented menu.

The selection is local interface state only. It **does not** modify the Game state schema, elapsed hours, prices, career rules, online snapshots, turn ownership, or shared lobby protocol. `inert` prevents focus entering panels hidden by the responsive layout. Desktop retains three columns at widths above 1024px. The site stays statically hosted and the existing Looprd server FQDN auto-generates `/looprd/the-life-loop/v1` for online co-op.

## Verification

`tests/mobile-ui.test.cjs` enforces the structural contract. Chromium smoke checks at 320, 390, 768, 1024 and 1280 px exercised New Game, travel, automatic Activities selection, My life view, and checked for horizontal overflow and unhandled JS errors. Also verify on real iOS/Android devices, including the soft keyboard and Wi-Fi/4G changes, before claiming complete device support. Live deployed Looprd connectivity remains a separate requirement.

# ADR-0047 — Classic hotseat privacy and mobile board landmarks

**Status:** Accepted

## Context

Two Classic hotseat humans pass one physical device. Rendering the next human's balances/actions immediately can expose private information before the handoff. Existing small-screen CSS also removed the clock/garden landmark and two tree-lined road gaps despite preserving a fixed 5×5 board.

## Decision

1. Put a blocking, keyboard-focused handover layer outside the main game shell. While visible the shell, modal layer, and chat panel are `inert`. Reveal requires a deliberate button; Escape and clicking outside do not dismiss it. It is intentionally presentation-only and does not call `endTurn` again.
2. Trigger only when successful **local Classic hotseat** actions transition between two different human players. Resume/import of Classic hotseat saves also requires a reveal. Never use for online Looprd co-op or solo/Modern rules.
3. The garden clock and scenic spaces are noninteractable board scenery across desktop and phone Overview/Explore. The historic route graph and original 170-waypoint schedule remain authoritative. Route costs, building entrances and game-state snapshots remain unchanged.
4. Build and bundle the handover module in offline and Pages targets; preserve Social connection and private game-room chat. Do not create browser credentials, server schemas, or new game-snapshot fields.

## Verification

- Pure handover tests cover Classic/Modern/solo/online isolation, saved snapshots and module wiring.
- Playwright acceptance tests cover 320px/390px and desktop, obscuring the board on a real turn change, unblocking via confirmation, and scenic area visibility.
- Mandatory verifier and ZipRunner clean extraction must pass; no new Looprd server deployment required.

## Caveats

- This is visual/local-input privacy, not encryption or OS-level device separation. An exported save still contains full game state and should not be distributed to untrusted players.
- The original DOS route-to-clock conversion and scene image geometry remain documented parity work.

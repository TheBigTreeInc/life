# ADR-0048 — Classic garden clock and phone-only camera modes

**Status:** Accepted

## Decision

- There is one 60-unit Classic action clock, rendered over the actual noninteractive Public Garden landmark at board cell (3,5). The board center shows active-player identity and current week only; it does not contain a redundant clock.
- The existing `LifeClassicBoardHud.model` remains the sole presentation projection of authoritative `LifeGame.player.hours`; no wall time, action costs, room commands, or snapshot fields change.
- Only phones (`max-width: 720px`) show the Explore/Overview toggle. The persisted phone preference is ignored visually on desktop and tablet (always fitted); crossing that breakpoint recalculates the board projection without changing gameplay.
- The southern road for original board row five follows the gutter immediately **above** the buildings (previously the row-four visual assumption caused the drawn road to bisect the garden and lower shops). The 170 historic waypoints and underlying route planner/timing remain unchanged.

## Acceptance

- Run `node tools/verify.mjs` and `python tests/qa_classic_clock_garden.py`.
- Check desktop 1440 and phones 320/390/720, plus tablet 768: a single accessible clock at Public Garden, center identity and week, phone-only toggle, road not bisecting garden, one in-game trip reduces dial units.
- Manual operator acceptance remains necessary for physical iOS/Android pinch/scroll and the deployed Looprd host.

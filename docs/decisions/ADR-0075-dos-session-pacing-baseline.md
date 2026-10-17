# ADR-0075 — Measurable Classic session pacing

**Status:** Accepted

## Decision

Establish a deterministic **read-only** baseline of all 156 Classic directed route charges and three repeatable itineraries with full travel units and remaining week budget. Generate `docs/reference/dos-session-pacing-075.json` using `node tools/dos-session-pacing-075.mjs --write`.

The existing DOS clock oracle uses `room1.sc` move speed 1 and 14-tick active quantum with strict greater-than carry. The `WhereShouldIGo.sc` route tick formula describes the *rival's estimate*, not a confirmed human player's movement accounting. Do not change playable clock charges based on that estimate.

## Runtime comparison protocol

Record a matched scripted session in DOSBox and Life Loop using the included `docs/reference/dos-session-observations-075.csv` columns. Record wall seconds separately from 60-unit turn charges; artificial instant AI decisions can shorten elapsed wall time without affecting week count. Match campaign goals, players, route, action sequence, and win week before calling a duration mismatch an engine bug. Only then calibrate timing or AI delays by mode.

## Limitations

The JSON contains **simulated game engine quotes**, not observed DOS movement or measured full game duration. This pass changes auditability, not gameplay speed. Original four-player behavior, RNG equivalence, and DOSBox validation remain outstanding.

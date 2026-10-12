# ADR-0010 — Shared multiplayer cosmetics, ephemeral chat and viewport-contained presentation

**Status:** Accepted
**Release:** v0.5.7

## Decision

The joining player's selected appearance becomes shared immutable-ish **game snapshot data**, not a remotely synchronized character-library record. The server validates enum values, sets the `friend` player portrait/name/color and increments the room version. Keep browser profile lists local and do not share private profile IDs.

The Looprd v1 transport allows WebSocket *subscriptions*, not arbitrary WebSocket commands, so authenticated chat sends use HTTP and receive live WSS notices. The server does not persist messages. Because the shared `pulses` resource is publicly subscribable, use AES-GCM with a random per-room 256-bit symmetric key available only to authorized room participants. The key lives in private Room storage and has no place in the invite URL. No history, fetch backlog or offline queue. This is best effort, not a guaranteed instant messenger.

The main page must not vertically scroll. Flexible city tiles scale with viewport height; mobile uses 3×4 building tiles with no repeated center hub. Panels and dialogs may independently scroll as content requires. The mobile new-game flow groups the original options into a stepper (Character, World, Goals). The engine and all Classic/Modern gameplay rules remain unchanged.

## Risks and follow-up

Looprd schemaVersion 2 adds Room.chatKey. Migration on a running production instance and WebSocket event delivery semantics must be validated with the actual Looprd service. Existing rooms without a chat key should be recreated. Hidden content below short-height dialogs must remain keyboard and screen-reader reachable. Verify Android/iOS device sizes and onscreen keyboard.

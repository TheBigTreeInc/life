# ADR-0046 — Shared Social lobby alongside authoritative Life Loop co-op

**Status:** Accepted

**Context.** Looprd Social is deployed separately and owns cross-game profiles and durable development lobby chat. Life Loop co-op still uses game-scoped capability tokens, authoritative room snapshots and transient encrypted chat.

**Decision.** Make Social lobby the default tab of the Life Loop Chat panel, with private Co-op Room as an explicitly separate tab. Reuse one opt-in, page-scoped Social connection across Chat and Profile; use native Looprd v1 POST handler endpoints for remote hosting and preserve localhost bridge compatibility. Persist only the Social origin; do not persist development tokens. Keep game simulation, saves and room authority unchanged. Display a bounded feed, poll while visible and protect against HTML injection.

**Constraints.** Production single sign-on remains blocked at LL-263; dev tokens are not account credentials for the game service. The Looprd host must allow the game origin via CORS. The game Looprd schema v2 additive chatKey migration must remain present in every generated descriptor.

**Verification.** Focused Social native transport/session tests and Chromium mocked-API smoke on 390px and 1440px. Confirm Room tab never displays Social messages and no Social connection changes player turns or Classic/Modern movement.

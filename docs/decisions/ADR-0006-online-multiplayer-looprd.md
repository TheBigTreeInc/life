# ADR-0006: Friend-code co-op using Looprd

**Status:** Accepted

## Decision

Add *Online co-op* as an opt-in New Game mode for two remote human participants and the existing AI rival. Preserve the exact selected Classic/Modern rules and historical/contemporary/Sci-Fi art. Keep hotseat and single-player modes working without a server.

`looprd.yaml` is a self-contained `looprd/v1` component conforming to [pac-labs/dapi](https://github.com/pac-labs/dapi) ([contract](https://github.com/pac-labs/dapi/blob/main/docs/specification.md)). No new component container or GitHub Pages backend is required; a deployed Looprd host provides persistence and events.

Looprd v1 WebSocket channels accept subscriptions and broadcast CRUD/custom notifications, not client-submitted RPC actions. Accordingly, all commands use a `POST /looprd/the-life-loop/v1/session` handler, and browsers use `WS /looprd/the-life-loop/v1/events` with `{"subscribe":"pulses"}` to know when to fetch the latest authoritative snapshot. A 5-second status reconciliation handles lost events. The host browser applies guest commands through the original `LifeGame` engine and publishes the accepted state. The server serializes commands and enforces participant capabilities and optimistic versions; it does not yet replicate all game rules server-side.

## Safety and constraints

- Random 10-character room code, random high-entropy host/guest tokens. Only SHA-256 hashes are stored server-side; tokens live in the browser's sessionStorage, never in the public repository, WebSocket payload, or invite URL.
- At most one guest, per-role permissions. Only host can publish snapshots; guest can submit commands only on guest's turn. One pending guest command at a time, version checks, 48-hour inactivity expiration on room lookup.
- The `Room` model is **not exposed as a public CRUD resource**. Only a non-sensitive `Pulse` subscription is declared; WebSocket metadata is not private. Exact room state requires participant token.
- Inline Python is trusted code on the shared Looprd host; `LOOPRD_ALLOW_PYTHON=true` is required, and source repository access is equivalent to code execution authority on that host.
- Public HTTP handler necessarily allows unauthenticated room creation/join. Rate limiting, origin policy and abuse protection must be configured at the reverse proxy. Do not assume a friend code grants confidential authentication; treat it as an invitation only.
- GitHub Pages hosting requires an independently deployed HTTPS/WSS Looprd endpoint and `LOOPRD_ORIGINS` configured for the site's exact origin.

## Known limitations

The host must remain connected to process guest turns; host migration and full server-side validation are out of scope. Network transport cannot prevent a deliberately modified host client from falsifying gameplay results. Durable game snapshots are on Looprd; disconnected clients reconcile by status. Persistent user accounts and cross-device token recovery are not implemented. One running ASGI worker is required by Looprd's event bus. A production server deployment is separate from shipping this game archive.

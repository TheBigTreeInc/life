# ADR-0045 — Shared modular portraits and a separate Looprd Social boundary

**Status:** Accepted

## Decision

Use the user-supplied Modular Portrait Kit JavaScript core unchanged as the portrait renderer. The editor is a separate, opt-in UI panel, not a replacement for game mechanics or the old disabled character creator. The profile schema is `looprd.social.profile/v1`, containing only a stable profile ID, display name and `modular-portraits.identity/v1` appearance (pack, revision, choices and colors). It does not own wealth, employment, turns, equipment, permissions or save state.

Store a browser-local fallback profile independent of the game autosave. Pack IDs resolve to local development assets or a configured HTTPS art host, not arbitrary URLs from profiles. Appearance is allowed to vary by art pack; a game can render only packs it knows.

Social runs as a **separate service/repository**. The Life Loop client uses explicit GET/PUT profile and lobby chat calls only after the user connects. Bearer access tokens remain in memory. The existing Looprd game-room controller and friend-code authorization are unchanged. A production SSO requires a proper OIDC issuer, PKCE client sign-in, short-lived game-scoped tokens, audience validation in each game service and revoked/expired session handling. Merely connecting Social cannot grant game-room access.

## Limits

The supplied looprd-social v0.1.0 server is a loopback-only token-protected **development harness**, not an internet-facing identity server. Shared chat in the local prototype is demonstration-only; production requires durable accounts, membership/ACLs, moderation, privacy, rate limits and deployment verification. New modular portraits are 2D profile artwork, not automatic 3D/pawn sprites.

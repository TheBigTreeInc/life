# Looprd Social integration handoff

`Looprd Social` is logically above game-specific Looprd instances, but must use distinct authentication scopes. Shared profile and avatar data are reusable across games; game inventories, actions and room tokens are not.

## APIs (v1 development)

- `GET /v1/me`: authenticated shared profile.
- `PUT /v1/me`: replace only caller's presentation profile.
- `GET/POST /v1/chat/lobby`: authenticated development lobby messages.
- `POST /v1/game-tickets`: deliberately **501** until issuer/game trust implementation is ready.

The profile editor can connect to Social using a user-supplied HTTPS URL (HTTP only for localhost) and access token. Local and remote appearances use the same `modular-portraits.identity/v1` schema. The browser never stores bearer tokens on disk; only the presentation record is cached locally. The game continues working if the social service or art CDN fails.

## Deploy next

Use the separate repository `looprd-social` for identity/social code. Introduce OIDC Authorization Code + PKCE for browser sign-in, validate issuer/audience/expiry and JWT signatures, and create short-lived game-scoped service tickets. Each game Looprd instance must validate those tickets and map a stable social subject to the local player ID before accepting a command. Do not forward the Social bearer token as a room access token. Use HTTPS, scoped CORS, rate limiting, account privacy, message retention/moderation policy, public revocation/logout and consent before production.

## Asset CDN

Set `window.LooprdPortraitAssetsBase='https://assets.example.org/portrait-kit/'` before game scripts to load pack manifests from that host. Each pack manifest references same-origin assets in its directory and a specific schema/revision. Self-contained `PLAY.html` also embeds the approved compact local demonstration art.


## Game-side chat integration — v0.5.46

The game Chat icon opens a two-channel panel. **Social lobby** can be used independently of co-op; **Co-op room** retains the existing ephemeral encrypted WebSocket chat. Selecting the Social tab never grants game command privileges. Social connection is page-scoped and reused by the Profile editor; disconnecting clears messages and credentials but leaves the locally saved portrait intact.

- Enter the **Looprd service origin**, e.g. `https://api.example.org`, or the component prefix `https://api.example.org/looprd/looprd-social/v1`. The game sends native JSON POSTs to `/looprd/looprd-social/v1/social` with the development credential in the request body. This is only appropriate under HTTPS and is not production OAuth/SSO.
- Loopback bridge `http://127.0.0.1:8947` remains supported for local development. It uses the older `/v1/me` and `/v1/chat/lobby` compatibility API.
- Only the server **origin** is saved to local storage; the token is held in memory, never in game saves, URLs, profile JSON or room messages. Re-enter it after page refresh.
- Social messages are fetched after connecting, on send and roughly every eight seconds while visible. Social history belongs to Social (7 days/100 records), unlike transient private co-op messages. The game shows up to the latest 50 messages.
- Browser origin must be allowed by the Looprd host CORS policy. `LOOPRD_ORIGINS` must include the deployed static game origin for direct browser POST; a locally served game requires its local origin. No special CORS bypass is provided.
- Disconnect or network failure must never block local gameplay or the game-room snapshot/turn path.

# Online multiplayer with pac-labs/dapi / Looprd

The browser code is **static**. GitHub Pages does not run WebSocket or database services. [Looprd](https://github.com/pac-labs/dapi) hosts the `looprd.yaml` component, per the [v1 specification](https://github.com/pac-labs/dapi/blob/main/docs/specification.md).

## Register the game

The root `looprd.yaml` is the complete self-contained contract with data models, persistent SQLite state, a room command handler, and change-notification WebSocket. Looprd reads it from a registered local path or GitHub repository:

```yaml
apiVersion: looprd/v1
components:
  - id: the-life-loop
    repository: https://github.com/YOUR-OWNER/the-life-loop.git
    ref: main
    specification: looprd.yaml
```

Or point `LOOPRD_SOURCES` to `server/sources.local.yaml` in the extracted project. Its local path references the root `looprd.yaml`. A GitHub source is usable after you push the complete project repository. Looprd polls for updates and preserves database storage between successful reloads.

Configure on the **Looprd host**:

```sh
LOOPRD_SOURCES=/path/to/the-life-loop/server/sources.local.yaml
LOOPRD_ALLOW_PYTHON=true
LOOPRD_ORIGINS=https://YOUR-OWNER.github.io,http://localhost:8080
LOOPRD_PORT=8080
```

`LOOPRD_ALLOW_PYTHON=true` allows **trusted Python** from every enabled source; only register repositories you control. The example origin values are placeholders, not real deployment configuration. For GitHub Pages use HTTPS reverse-proxy routing of `/looprd/the-life-loop/v1/` to your Looprd host, with WebSocket upgrades enabled. Configure Looprd origin and CORS. Single ASGI worker (do not start multiple separate workers); persistence lives in Looprd's data volume. Keep the management API behind restricted access.

### Host a session

1. Publish/open the HTML game from your HTTPS static site (or localhost for testing).
2. **New game → Online co-op · friend code + Looprd**. Choose Classic or Modern and your world era as before.
3. Enter only your Looprd host address, e.g. `api.server.country` or `https://api.server.country`. The game automatically appends `/looprd/the-life-loop/v1` and uses its `/events` route for WebSockets.
4. When creation succeeds, use **Online co-op** to copy the invitation link or share the 10-character code.
5. Your friend opens the same game site, chooses **Online co-op → Join**, uses the link (which contains the server FQDN and code but no token) or enters the server FQDN, code and a display name.
6. Each person plays on their turn. Guest actions are queued for host validation. Game state reaches both through `/events` signals and resynchronization.

A guest browser can reconnect on reload within the same browser tab/session; the token is not included in the invite URL. Reloads in a new browser profile require a new session, as Looprd permits only one guest. Save/export remains available separately. Host must be online to process actions. Game snapshots are stored server-side.

### Protocol summary

| HTTP/WS | Path | Body | Purpose |
|---|---|---|---|
| POST | `/session` | `{op:"create",state}` | Host: creates room; returns code, host token, version |
| POST | `/session` | `{op:"join",code,name}` | Guest: claims open seat; returns guest token |
| POST | `/session` | `{op:"status",code,token}` | Authorized current snapshot, pending host command, revision |
| POST | `/session` | `{op:"send",code,token,version,command}` | Guest queues a travel, act, endTurn or choose action |
| POST | `/session` | `{op:"publish",code,token,version,state,commandId?}` | Host commits a snapshot and acknowledges a remote command |
| WebSocket | `/events` | `{subscribe:"pulses"}` | Receive non-sensitive signals, then POST `/session` status |

Public `/info` states the component's protocol. No credentials are checked into project files. All application mutations pass through `POST /session` to avoid exposing the protected rooms via generated CRUD endpoints.

## Validation

- `node tools/verify.mjs` validates generated standalone game, regular gameplay regression and browser protocol adapter.
- With the Looprd Python environment available, run `python -m unittest discover -s tests -p test_looprd.py -v` for persistent SQLAlchemy room/turn/token tests.
- Run `python -m looprd validate looprd.yaml` against the real DAPI checkout/installation.
- From two distinct browsers: create/join, move, work, end turn, forcibly close guest then reload, disconnect/reconnect host, try stale versions and a wrong token.

**Limitations:** Real-server and remote-browser deployment has to be performed on your host. Current host-side JS simulates games; Looprd validates roles, not game mechanics. For untrusted public matchmaking, migrate engine logic into a server-authoritative implementation and add rate limiting before enabling public invites at scale.

### v0.5.7 — Live-only chat and guest identity

The guest sends `appearance` (only seven normalized cosmetic enum values) with the join request; the server validates it and commits it to `Room.state.players[1]` with an incremented version, instead of sending only the name. Guest profiles themselves remain local.

Chat is designed to be ephemeral: each room has a random 256-bit `chatKey` in the private `Room` model, returned only with the host create, guest join, and authenticated status responses. The browser uses WebCrypto AES-GCM with random 96-bit nonces to encrypt JSON `{from,name,text}`, and posts `{op:'chat',code,token,packet:{nonce,ciphertext}}`. The server authenticates the participant and immediately emits a `pulses` WebSocket event containing **ciphertext only**. No chat is written to any `Room` state, API history, local storage, game save, or recoverable backlog. Looprd WebSocket subscriptions are still notification-only. Chat requires a live WebSocket and both participants joined; localhost may use WS, production requires WSS. WebSocket events are not guaranteed to be received; this is an intentional best-effort chat without replay.

**Migration warning:** v0.5.7 upgrades Looprd schemaVersion 1 → 2 by adding nullable `Room.chatKey` (string, max 64). Before updating the running component, back up its database and verify Looprd applies migrations; if not, add the field through your supported database migration procedure. Preexisting rooms may lack a chat key and should be restarted/recreated to use chat. Re-register the generated `looprd.yaml`; HTML-only Pages upgrades do not update Looprd. Ensure `LOOPRD_ORIGINS` includes your Pages site and rate-limit anonymous room/chat operations at the gateway. Recheck `/looprd/the-life-loop/v1/info` and `/events` WebSocket subscriptions after deployment.

### v0.5.12 — Curated character portrait IDs

Guest appearance now includes an optional validated `portrait` identifier (`illustrated-01`…`illustrated-16`, `original-01`…`original-35`, or an empty string for Custom drawn). The Looprd handler validates this field before copying it into the shared game state. Portrait WebP files are served by the frontend, **not** stored in the room database. This is a handler/source update with no Room schema migration; redeploy `looprd.yaml` and test against a fresh room. Without redeployment, older Looprd code will drop the portrait selection from the guest.

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

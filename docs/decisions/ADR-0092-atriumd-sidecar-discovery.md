# ADR-0092 — Portable Atrium discovery sidecar

**Status:** Proposed for operator review, not production acceptance.

Life provides `atriumd.yaml` beside the root `looprd.yaml`, separate from the LoopRD strict component specification. Metadata follows Atrium's existing `atriumd/v1` example and DAPI's independent validator; no deployment URL, credentials, or public IPs are embedded. The named `game-web` origin is resolved by **deployment-owned configuration**, not the manifest. The LoopRD API origin and Pages/static game origin are not assumed identical.

Adding the sidecar alone **does not** publish a game or enable Atrium launch: DAPI discovery observation may be disabled, DAPI-to-Atrium automatic authenticated relay is not yet wired, and Atrium still requires a reviewed release and correct trusted launch binding. The game remains the authority for sessions, identity validation, actions, turns and persistence. Existing `server/atrium_launch_contract.py` remains internal and cannot serve public client requests.

## Compatibility and acceptance

1. Validate YAML against Atrium's `src/atriumd_contract.py` and DAPI's `looprd/atrium_sidecar.py` with component `the-life-loop`.
2. Confirm the sidecar is an archive-root sibling of `looprd.yaml`, included in the exact deployed source revision and ZipRunner full-source archive.
3. Verify metadata-only sidecar change is detected by the DAPI observer while API activation remains healthy; absence must not block a non-Atrium host.
4. With a trusted DAPI-to-Atrium relay deployed, test replay/idempotency/withdrawal/approval without automatically publishing, including local source provenance without fabricated Git SHA.
5. Bind `game-web` via trusted deployment configuration, verify Pages/static assets, and then run authenticated two-browser create/join/resume and restart acceptance.

The final three items are integration/operator acceptance tasks and **not demonstrated by this artifact**. No new LoopRD tables or schema migrations are needed for the metadata file.

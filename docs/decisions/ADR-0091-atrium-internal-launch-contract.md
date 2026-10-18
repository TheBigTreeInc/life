# ADR-0091 — Internal Atrium/Life launch and resume adapter

**Status:** Proposed (not operator accepted)

Life owns matches, rules, player seats, invitations and authoritative turns. Atrium owns game discovery, lobby and launch presentation. `server/atrium_launch_contract.py` is an internal integration adapter using the existing `SocialIdentityBoundary`, `MatchLifecycle` and `InternalPlayAPI` interfaces. It deliberately creates **no HTTP handler** and registers **no public /play endpoint**. The current LoopRD v3 schema is unchanged.

Capabilities use the proposed `looprd.game-play/v1` interchange shape. `publicPlayApiAvailable` and `agentPlaySupported` are false pending real Social signature verification, route/scopes provisioning, UI client consumption and headless server acceptance. There is no claim that Atrium 0.5.13 consumes this contract yet.

Each create and join produces a launch projection through independently authorized `InternalPlayAPI.inspect`. Resume and list operations reauthorize every match. URLs contain only an opaque match locator, never Social tokens, invitation bearer secrets, issuer/subject values, or game checkpoints. Invite secrets may only appear in a private authorized invite response and must never be copied into lobby metadata.

Production dependencies remain: real Social issuer and audience validation, actual Atrium-side integration, database uniqueness constraints, cross-process locking, secure invitation delivery, verified UI authentication and live multi-client/restart tests. Do not publicly mount these internal methods until those gates have passed.

Local test: `python -m unittest discover -s tests -p 'test_atrium_launch_contract.py' -v`.

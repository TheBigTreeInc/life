# ADR-0085 — Social identity verification boundary

**Status:** Accepted

## Decision

Life must not treat browser-supplied issuer, subject, room code, JWT payload or user name as verified identity. `SocialIdentityBoundary` accepts a configured trusted verifier, validates the expected issuer and `life-play` audience, and requires a nonempty subject. `AuthorizedAsyncCommandService` forwards only these verified claims to the internal `AsyncCommandService`, which resolves match seat membership.

## Limitations

There is no live Social ticket issuer, signing-key trust configuration, revocation integration, deployed DAPI transaction verification or public `/play` endpoint in this pass. A trusted verifier must be installed by the hosting runtime, and matching authenticated account-seat records must be available. No network endpoint is enabled. The legacy `/session` API remains intact.

## Verification

`tests/test_async_identity.py` covers verified forwarding, rejection of invalid tokens, wrong issuer/audience and failing verification.

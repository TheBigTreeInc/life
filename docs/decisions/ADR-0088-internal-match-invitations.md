# ADR-0088 — Internal match creation and invitation lifecycle

Status: candidate; production acceptance not claimed.

`server/async_lifecycle.py` creates the first GameMatch, GameCheckpoint, and creator GameParticipant within one transaction. The initial snapshot is supplied by a privileged game-owned factory, never by a player. Issuer/subject are taken only from a separately provisioned Social verifier. The match owner may issue a random invitation for a free seat; only its SHA-256 digest is stored in the new GameInvitation model. Join validates expiry and uniqueness, inserts the participant and redeems the invitation in one transaction. The same principal can safely replay a redeemed invitation, other principals cannot. Resume enumerates durable matches by verified issuer/subject.

## Production blockers

1. LoopRD `GameInvitation` is an additive *model proposal*; schemaVersion 3 does not contain a validated upgrade migration. Deployments already at schemaVersion 3 need a reviewed version 4 migration before enabling this feature.
2. SQL `GameParticipant` needs actual UNIQUE(matchId,seatId) and UNIQUE(matchId,issuer,subject), plus `GameInvitation` atomic consumption/unique token digest verified under production concurrency. SQLite unit tests cannot prove concurrent correctness.
3. The initial snapshot factory, pinned rules digest and real Social token verifier must be bound by the trusted server runtime. The current internal lifecycle does not register any HTTP endpoints or Atrium integration.
4. Invite credentials must only be sent over TLS and distributed via trusted authenticated flows. No unverified grant should issue a seat.
5. Create request idempotency and strict game rule setting validation need production design before publication.

Legacy `/session`, local games, standalone PLAY.html and offline mode are unaffected.

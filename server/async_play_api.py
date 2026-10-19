"""Internal, fail-closed /play service contract. No HTTP route is registered.

Only a separately verified SocialIdentityBoundary is allowed to authenticate.
Read operations must authorize match membership; mutations delegate to the
trusted authoritative evaluator/transactional command service.
"""
from async_identity import IdentityRejected
from async_match_repository import MatchConflict, MatchNotFound

class PlayAPIRejected(ValueError):
    pass

class InternalPlayAPI:
    def __init__(self, repository, identity_boundary, participant_seat, command_service, legal_action_provider=None):
        if any(x is None for x in (repository, identity_boundary, participant_seat, command_service)):
            raise ValueError('Repository, trusted authentication, roster, and commands required')
        self.repository = repository
        self.identity_boundary = identity_boundary
        self.participant_seat = participant_seat
        self.command_service = command_service
        self.legal_action_provider = legal_action_provider

    def _member(self, token, match_id):
        if not isinstance(match_id, str) or not match_id:
            raise PlayAPIRejected('Invalid match identifier')
        principal = self.identity_boundary.authenticate(token)
        seat = self.participant_seat(match_id, principal.issuer, principal.subject)
        if not isinstance(seat, int) or isinstance(seat, bool) or not 0 <= seat <= 1:
            raise PlayAPIRejected('Match membership required')
        return principal, seat

    def inspect(self, *, token, match_id):
        _, seat = self._member(token, match_id)
        match = self.repository.read(match_id)['match']
        return {'matchId': match_id, 'revision': match['revision'],
                'status': match['status'], 'turnIndex': match['turnIndex'],
                'activeSeat': int(match['activeSeat']) if match['activeSeat'] is not None else None, 'yourSeat': seat,
                'dueAtUtc': match['dueAtUtc'], 'engineRevision': match['engineRevision'],
                'state': self._player_view(self.repository.read(match_id)['checkpoint']['state'])}

    def _player_view(self, state):
        # Game snapshots are authored by the server's LifeGame, never received
        # from clients. Return the engine state needed to render the same rules;
        # refuse unexpected non-game authentication fields rather than leaking.
        if not isinstance(state, dict) or any(k in state for k in ('token', 'password', 'authorization', 'secret')):
            raise PlayAPIRejected('Invalid player state')
        return state

    def legal_actions(self, *, token, match_id):
        _, seat = self._member(token, match_id)
        record = self.repository.read(match_id)
        match = record['match']
        if not self.legal_action_provider:
            raise PlayAPIRejected('Trusted legal action provider not configured')
        if match['status'] != 'active' or str(match['activeSeat']) != str(seat):
            return {'matchId': match_id, 'revision': match['revision'], 'actions': []}
        actions = self.legal_action_provider(record['checkpoint']['state'], seat)
        if not isinstance(actions, list):
            raise PlayAPIRejected('Invalid trusted action result')
        return {'matchId': match_id, 'revision': match['revision'], 'actions': actions}

    def act(self, *, token, match_id, expected_revision, idempotency_key, command):
        self._member(token, match_id)
        # Identity verification again at the mutation boundary; command_service
        # does not accept actor-supplied issuer/subject in client payloads.
        principal = self.identity_boundary.authenticate(token)
        return self.command_service.process(match_id=match_id,
            expected_revision=expected_revision, issuer=principal.issuer,
            subject=principal.subject, idempotency_key=idempotency_key,
            command=command)

    def end_turn(self, *, token, match_id, expected_revision, idempotency_key):
        return self.act(token=token, match_id=match_id,
            expected_revision=expected_revision, idempotency_key=idempotency_key,
            command={'type':'end_turn'})

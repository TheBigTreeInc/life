"""Internal Atrium-to-Life launch contract, not a public LoopRD endpoint.

Atrium owns discovery/lobby presentation. Life alone owns matches, seats, rules,
invitation redemptions, and turn authority. Never put credentials in a launch URL.
"""
from urllib.parse import urlencode


class LaunchRejected(ValueError):
    pass


class AtriumLifeLaunch:
    SCHEMA = 'looprd.game-play/v1'
    COMPONENT = 'the-life-loop'

    def __init__(self, lifecycle, play_api, identity_boundary, *, trusted_client_origin):
        if not all((lifecycle, play_api, identity_boundary)):
            raise ValueError('Trusted lifecycle, play API and identity boundary required')
        if not isinstance(trusted_client_origin, str) or not trusted_client_origin.startswith('https://'):
            raise ValueError('Configured HTTPS game origin required')
        origin = trusted_client_origin.rstrip('/')
        if any(c in origin for c in ('?', '#', '@')):
            raise ValueError('Invalid game origin')
        self.lifecycle = lifecycle
        self.play_api = play_api
        self.identity = identity_boundary
        self.origin = origin

    def capabilities(self):
        # Deliberately advertise only operations that are implemented internally.
        # No exposed HTTP endpoints or agent headless acceptance are claimed.
        return {
            'schema': self.SCHEMA,
            'gameId': 'life.loop',
            'component': self.COMPONENT,
            'operations': ['create', 'invite', 'join', 'list_matches', 'resume'],
            'modes': ['private-async'],
            'actionExecution': 'server-evaluated',
            'agentPlaySupported': False,
            'publicPlayApiAvailable': False,
            'identityRequired': True,
        }

    def _launch(self, *, token, match_id):
        # Every return is reauthorized, including after creation/join.
        self.identity.authenticate(token)
        info = self.play_api.inspect(token=token, match_id=match_id)
        if info.get('matchId') != match_id or type(info.get('yourSeat')) is not int:
            raise LaunchRejected('Invalid trusted match projection')
        # Match IDs are untrusted URL input: disallow slash/path traversal or
        # arbitrary schemes, and avoid putting tokens, invitation or identities
        # in URLs. Only a match locator is allowed.
        if not isinstance(match_id, str) or len(match_id) > 128 or not match_id or any(c in match_id for c in '/\\?#'):
            raise LaunchRejected('Invalid match locator')
        return {
            'schema': self.SCHEMA,
            'component': self.COMPONENT,
            'gameId': 'life.loop',
            'matchId': match_id,
            'yourSeat': info['yourSeat'],
            'revision': info['revision'],
            'status': info['status'],
            'activeSeat': info['activeSeat'],
            'turnIndex': info['turnIndex'],
            'launchUrl': self.origin + '/?' + urlencode({'match': match_id}),
            'authentication': 'required-on-launch',
        }

    def create(self, *, token, engine_revision, rules_digest, seed, settings=None, request_id=None):
        response = self.lifecycle.create(token=token, engine_revision=engine_revision,
            rules_digest=rules_digest, seed=seed, settings=settings, request_id=request_id)
        return self._launch(token=token, match_id=response['matchId'])

    def invite(self, *, token, match_id, seat=1, expires_in_seconds=86400):
        # Invitation is a secret; only deliver to authenticated caller, never in
        # launch URL, logs, public catalogue or notification payload.
        return self.lifecycle.issue_invitation(token=token, match_id=match_id,
            seat=seat, expires_in_seconds=expires_in_seconds)

    def join(self, *, token, match_id, invitation):
        response = self.lifecycle.join(token=token, match_id=match_id, invitation=invitation)
        return self._launch(token=token, match_id=response['matchId'])

    def resume(self, *, token, match_id):
        return self._launch(token=token, match_id=match_id)

    def list_matches(self, *, token):
        self.identity.authenticate(token)
        rows = self.lifecycle.resume(token=token)
        if not isinstance(rows, list):
            raise LaunchRejected('Invalid trusted match list')
        # Per-match reauthorization prevents roster enumeration even if the
        # lifecycle's listing query or its future implementation regresses.
        return [self._launch(token=token, match_id=row['matchId']) for row in rows]

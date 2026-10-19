"""Atomic offline turn replay and SQL commit using Life's *existing* game engine.

This is a source-level migration slice. It is not a registered LoopRD handler;
LoopRD needs a separately reviewed on-demand JS evaluator execution capability.
No browser-proposed checkpoint is accepted as authoritative.
"""
import json
import subprocess
from pathlib import Path

from async_match_repository import MatchConflict, digest

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / 'server' / 'async_turn_bundle_cli.cjs'


class TurnBundleRejected(ValueError):
    pass


class TurnEvaluatorUnavailable(Exception):
    pass


class OneShotTurnEvaluator:
    def __init__(self, *, node='node', timeout=10):
        self.node, self.timeout = node, timeout

    def replay(self, checkpoint, commands, expected_digest, seat):
        payload = json.dumps({'checkpoint': checkpoint, 'commands': commands,
                              'expectedDigest': expected_digest, 'expectedSeat': seat},
                             separators=(',', ':'), allow_nan=False)
        if len(payload.encode('utf8')) > 750_000:
            raise TurnBundleRejected('Turn exceeds input limit')
        try:
            output = subprocess.run([self.node, str(CLI)], input=payload, text=True,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                    cwd=ROOT, timeout=self.timeout, check=False)
        except (OSError, subprocess.TimeoutExpired) as error:
            raise TurnEvaluatorUnavailable('Trusted evaluator unavailable') from error
        if len(output.stdout.encode('utf8')) > 750_000 or len(output.stderr.encode('utf8')) > 4096:
            raise TurnEvaluatorUnavailable('Trusted evaluator exceeded output limit')
        if output.returncode:
            raise TurnBundleRejected('Turn rejected by deterministic Life evaluator')
        try:
            result = json.loads(output.stdout)
            saved = result['checkpoint']['state']
            if digest(saved) != result['checkpoint']['stateDigest']:
                raise ValueError('Invalid computed digest')
            return result
        except (ValueError, KeyError, TypeError) as error:
            raise TurnEvaluatorUnavailable('Trusted evaluator produced an invalid result') from error


class AtomicTurnService:
    def __init__(self, repository, participant_seat, participant_players, *, engine_revision,
                 evaluator=None):
        if not engine_revision:
            raise ValueError('Pinned game engine revision required')
        self.repository = repository
        self.participant_seat = participant_seat
        self.participant_players = participant_players
        self.engine_revision = engine_revision
        self.evaluator = evaluator or OneShotTurnEvaluator()

    def submit(self, *, match_id, issuer, subject, expected_revision, idempotency_key,
               commands, expected_digest, client_result_digest=None):
        if not all(type(x) is str and x for x in (match_id, issuer, subject, idempotency_key, expected_digest)):
            raise TurnBundleRejected('Verified actor, match and checkpoint identity required')
        if type(expected_revision) is not int or expected_revision < 0:
            raise TurnBundleRejected('Invalid revision')
        if (not isinstance(commands, list) or not 1 <= len(commands) <= 128 or
                commands[-1] != {'type': 'end_turn'} or
                any(type(c) is not dict or set(c) - {'type', 'arg'} or
                    c.get('type') not in ('travel', 'action', 'end_turn') or
                    (c.get('type') == 'end_turn' and i != len(commands) - 1) or
                    (c.get('type') != 'end_turn' and
                     (type(c.get('arg')) is not str or not 1 <= len(c['arg']) <= 100))
                    for i, c in enumerate(commands))):
            raise TurnBundleRejected('Turn requires bounded legal commands ending in end_turn')
        command = {'type': 'turn_bundle', 'commands': commands}
        seat = self.participant_seat(match_id, issuer, subject)
        if type(seat) is not int or seat not in (0, 1):
            raise TurnBundleRejected('Match membership required')
        # A retry after the turn owner has changed must return the original result,
        # without running the evaluator again or creating another notification.
        replay = self.repository.replay_if_exists(match_id=match_id, issuer=issuer,
            subject=subject, idempotency_key=idempotency_key, command=command)
        if replay is not None:
            return replay
        saved = self.repository.read(match_id)
        match, point = saved['match'], saved['checkpoint']
        if match['engineRevision'] != self.engine_revision:
            raise TurnBundleRejected('Pinned rules version unavailable; install the matching evaluator')
        if match['revision'] != expected_revision or point['stateDigest'] != expected_digest:
            raise MatchConflict('Stale checkpoint; download the current match before retry')
        if match['status'] != 'active' or str(match['activeSeat']) != str(seat):
            raise TurnBundleRejected('Actor does not own the active turn')
        if digest(point['state']) != point['stateDigest']:
            raise TurnBundleRejected('Persisted checkpoint failed integrity validation')
        replayed = self.evaluator.replay(point['state'], commands, expected_digest, seat)
        if client_result_digest is not None and (type(client_result_digest) is not str or
                client_result_digest != replayed['checkpoint']['stateDigest']):
            raise TurnBundleRejected('Client result differs from authoritative deterministic replay')
        if replayed['activeSeat'] == seat and replayed['checkpoint']['state'].get('winner') is None:
            raise TurnBundleRejected('Turn failed to change ownership')
        notifications = []
        for player in self.participant_players(match_id):
            if str(player['seat']) == str(replayed['activeSeat']):
                notifications.append({'issuer': player['issuer'], 'subject': player['subject'],
                    'eventId': f'{match_id}:turn:{replayed["turnIndex"]}:revision:{expected_revision+1}',
                    'eventType': 'turn_ready'})
        # One SQL revision for the WHOLE locally staged turn. CAS, checkpoint,
        # action history and notification intent are one transaction.
        return self.repository.commit(match_id=match_id, expected_revision=expected_revision,
            issuer=issuer, subject=subject, idempotency_key=idempotency_key, command=command,
            resulting_snapshot=replayed['checkpoint']['state'], rng_state=replayed['checkpoint']['rngState'],
            turn_index=replayed['turnIndex'], active_seat=replayed['activeSeat'], outbox=notifications)

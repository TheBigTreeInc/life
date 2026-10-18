"""Internal Life async command processor; not a public HTTP handler.

Only a trusted, upstream authenticated service may call process(). The caller's
issuer/subject must already be verified by Social and resolved to a seat via
participant_seat. The game engine, not a browser, supplies resulting state.
"""
import json
import subprocess
from pathlib import Path
from async_match_repository import MatchConflict, digest

ROOT = Path(__file__).resolve().parents[1]

class CommandRejected(Exception):
    pass

class EvaluatorUnavailable(Exception):
    pass

class HeadlessEvaluator:
    def __init__(self, node='node', timeout=5, max_output=4 * 1024 * 1024):
        self.node, self.timeout, self.max_output = node, timeout, max_output

    def evaluate(self, state, command, expected_digest):
        payload=json.dumps({'snapshot':state,'command':command,
                            'expectedDigest':expected_digest}, separators=(',', ':'))
        if len(payload.encode('utf8')) > self.max_output:
            raise CommandRejected('Checkpoint exceeds evaluator input limit')
        try:
            # Internal source-controlled executable, no shell, finite timeout.
            done=subprocess.run([self.node,str(ROOT/'server/async_evaluator_cli.cjs')],
                input=payload, capture_output=True, text=True, timeout=self.timeout,
                cwd=ROOT, check=False)
        except (OSError,subprocess.TimeoutExpired) as exc:
            raise EvaluatorUnavailable('Headless evaluator unavailable') from exc
        if len(done.stdout.encode('utf8')) > self.max_output or len(done.stderr.encode('utf8')) > 4096:
            raise EvaluatorUnavailable('Evaluator output limit exceeded')
        if done.returncode:
            raise CommandRejected('Headless evaluator rejected command')
        try:
            result=json.loads(done.stdout)
            checkpoint=result['checkpoint']
            if digest(checkpoint['state']) != checkpoint['stateDigest']:
                raise ValueError('Inconsistent computed checkpoint')
            return result
        except (ValueError,KeyError,TypeError) as exc:
            raise EvaluatorUnavailable('Invalid evaluator result') from exc

class AsyncCommandService:
    def __init__(self, repository, participant_seat, evaluator=None):
        self.repository=repository
        self.participant_seat=participant_seat
        self.evaluator=evaluator or HeadlessEvaluator()

    def process(self, *, match_id, expected_revision, issuer, subject,
                idempotency_key, command):
        if not all(isinstance(v,str) and v for v in (match_id,issuer,subject,idempotency_key)):
            raise CommandRejected('Verified actor identity and command key required')
        if not isinstance(expected_revision,int) or expected_revision<0:
            raise CommandRejected('Expected revision required')
        if not isinstance(command,dict) or command.get('type') not in ('travel','action','end_turn'):
            raise CommandRejected('Unsupported game command')
        # A trusted identity resolver must never derive identity from the command.
        seat=self.participant_seat(match_id,issuer,subject)
        record=self.repository.read(match_id)
        match,checkpoint=record['match'],record['checkpoint']
        if seat is None:
            raise CommandRejected('Actor does not belong to match')
        replay=self.repository.replay_if_exists(match_id=match_id, issuer=issuer,subject=subject,
            idempotency_key=idempotency_key,command=command)
        if replay is not None:return replay
        if seat != match['activeSeat']:
            raise CommandRejected('Actor does not own active seat')
        if match['status']!='active':
            raise CommandRejected('Match not active')
        if match['revision']!=expected_revision:
            raise MatchConflict('Stale match revision')
        if digest(checkpoint['state'])!=checkpoint['stateDigest']:
            raise CommandRejected('Stored checkpoint integrity mismatch')
        calculated=self.evaluator.evaluate(checkpoint['state'],command,checkpoint['stateDigest'])
        state=calculated['checkpoint']['state']
        active=calculated['activeSeat']
        # This first pass cannot safely assign deadline and notification ownership:
        # those depend on the verified participant roster and scheduler contract.
        return self.repository.commit(match_id=match_id,expected_revision=expected_revision,
            issuer=issuer,subject=subject,idempotency_key=idempotency_key,
            command=command,resulting_snapshot=state,
            rng_state=calculated['checkpoint']['rngState'],
            turn_index=calculated['turnIndex'],active_seat=active,
            due_at=None,outbox=[])

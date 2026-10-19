"""Life-owned HTTP transport contract (looprd.game-play/v1).

This ASGI router is deliberately NOT installed as a LoopRD handler until a
real, deployable Social identity verifier and a trusted snapshot factory are
provisioned. No endpoint trusts supplied account IDs, seat numbers or states.
"""
from starlette.applications import Starlette
from starlette.routing import Route
from starlette.responses import JSONResponse
from starlette.requests import Request
from async_identity import IdentityRejected
from async_lifecycle import LifecycleRejected
from async_play_api import PlayAPIRejected
from async_match_repository import MatchConflict, MatchNotFound
from async_state_bridge import StateEngineUnavailable
from async_command_service import CommandRejected, EvaluatorUnavailable

SCHEMA = 'looprd.game-play/v1'


def create_app(lifecycle, play_api, *, game_id='life.loop'):
    """Pure composition root. Call only with real trusted verifier-backed services."""
    if lifecycle is None or play_api is None:
        raise ValueError('Verified services required')

    def failure(code, message, status):
        return JSONResponse({'ok': False, 'schema': SCHEMA, 'error': {'code': code, 'message': message}}, status_code=status)

    def bearer(request):
        value = request.headers.get('authorization', '')
        # No query, cookie, user header or body token fallback.
        if not value.startswith('Bearer ') or not value[7:] or len(value) > 8192:
            raise IdentityRejected('Bearer proof required')
        return value[7:]

    async def info(request):
        return JSONResponse({'schema': SCHEMA, 'gameId': game_id, 'component': 'the-life-loop',
            'operations': ['create', 'invite', 'join', 'decline', 'list_matches', 'resume', 'get', 'legal_actions', 'act', 'end_turn'],
            'modes': ['private-async'], 'actionExecution': 'server-evaluated',
            'agentPlaySupported': False, 'publicPlayApiAvailable': False,
            'identityRequired': True})

    async def play(request):
        try:
            token = bearer(request)
            # Authentication is performed by the externally provisioned, verified
            # issuer boundary. Every action must be authenticated before dispatch.
            play_api.identity_boundary.authenticate(token)
            if request.headers.get('content-type', '').split(';', 1)[0].strip() != 'application/json':
                return failure('BAD_REQUEST', 'JSON content type required', 415)
            if int(request.headers.get('content-length', '0')) > 32768:
                return failure('BAD_REQUEST', 'Request too large', 413)
            raw = await request.body()
            if len(raw) > 32768:
                return failure('BAD_REQUEST', 'Request too large', 413)
            import json
            body = json.loads(raw)
            if type(body) is not dict or body.get('schema') != SCHEMA:
                return failure('BAD_REQUEST', 'Invalid protocol envelope', 422)
            op = body.get('op')
            params = {key: value for key, value in body.items() if key not in ('schema', 'op')}
            if op == 'create':
                permitted = {'engineRevision', 'rulesDigest', 'seed', 'settings', 'requestId'}
                if set(params) - permitted: raise ValueError('Unsupported create fields')
                result = lifecycle.create(token=token, engine_revision=params['engineRevision'],
                    rules_digest=params['rulesDigest'], seed=params['seed'],
                    settings=params.get('settings'), request_id=params.get('requestId'))
            elif op == 'invite':
                if set(params) - {'matchId', 'seat', 'expiresInSeconds'}: raise ValueError('Unsupported invite fields')
                result = lifecycle.issue_invitation(token=token, match_id=params['matchId'],
                    seat=params.get('seat', 1), expires_in_seconds=params.get('expiresInSeconds', 86400))
            elif op == 'join':
                if set(params) != {'matchId', 'invitation'}: raise ValueError('Invalid join fields')
                result = lifecycle.join(token=token, match_id=params['matchId'], invitation=params['invitation'])
            elif op == 'decline':
                if set(params) != {'matchId', 'invitation'}: raise ValueError('Invalid decline fields')
                result = lifecycle.decline(token=token, match_id=params['matchId'], invitation=params['invitation'])
            elif op == 'list_matches':
                if params: raise ValueError('Unexpected list fields')
                result = {'matches': lifecycle.resume(token=token)}
            elif op == 'resume':
                if set(params) != {'matchId'}: raise ValueError('Invalid resume fields')
                result = play_api.inspect(token=token, match_id=params['matchId'])
            elif op == 'get':
                if set(params) != {'matchId'}: raise ValueError('Invalid get fields')
                result = play_api.inspect(token=token, match_id=params['matchId'])
            elif op == 'legal_actions':
                if set(params) != {'matchId'}: raise ValueError('Invalid legal-actions fields')
                result = play_api.legal_actions(token=token, match_id=params['matchId'])
            elif op in ('act', 'end_turn'):
                expected = {'matchId', 'expectedRevision', 'idempotencyKey'}
                if set(params) != (expected | ({'action'} if op == 'act' else set())):
                    raise ValueError('Invalid mutation envelope')
                if op == 'act':
                    result = play_api.act(token=token, match_id=params['matchId'],
                        expected_revision=params['expectedRevision'], idempotency_key=params['idempotencyKey'],
                        command=params['action'])
                else:
                    result = play_api.end_turn(token=token, match_id=params['matchId'],
                        expected_revision=params['expectedRevision'], idempotency_key=params['idempotencyKey'])
            else:
                return failure('UNKNOWN_OPERATION', 'Unsupported operation', 422)
            return JSONResponse({'ok': True, 'schema': SCHEMA, 'result': result})
        except IdentityRejected:
            return failure('UNAUTHENTICATED', 'Valid game-scoped identity required', 401)
        except (PlayAPIRejected, MatchNotFound):
            return failure('NOT_A_PARTICIPANT', 'Match unavailable', 404)
        except LifecycleRejected:
            return failure('OPERATION_REJECTED', 'Lifecycle request rejected', 403)
        except CommandRejected:
            return failure('ACTION_REJECTED', 'Action or seat rejected', 409)
        except MatchConflict:
            return failure('REVISION_CONFLICT', 'Match revision or operation conflict', 409)
        except (EvaluatorUnavailable, StateEngineUnavailable):
            return failure('EVALUATOR_UNAVAILABLE', 'Game evaluator unavailable', 503)
        except (ValueError, TypeError, KeyError, __import__('json').JSONDecodeError):
            return failure('BAD_REQUEST', 'Invalid request fields', 422)

    return Starlette(routes=[Route('/play/info', info, methods=['GET']), Route('/play', play, methods=['POST'])])

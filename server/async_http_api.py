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


def create_app(lifecycle, play_api, *, game_id='life.loop', server_create=None, atrium_host=None):
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
        # Atrium 0.5.20's strict game-play/v1 discovery validator requires
        # exactly these fields. False is intentional until operator acceptance.
        from pathlib import Path
        import hashlib
        root = Path(__file__).resolve().parents[1]
        import json
        release = json.loads((root / 'package.json').read_text())['version']
        hashed = hashlib.sha256()
        for file in sorted((root / 'src').glob('*.js')) + [root / 'assets/boards/classic/routes.v1.json']:
            hashed.update(file.relative_to(root).as_posix().encode())
            hashed.update(file.read_bytes())
        return JSONResponse({'protocol': SCHEMA, 'gameId': game_id, 'component': 'the-life-loop',
            'engine': {'version': release, 'digest': hashed.hexdigest()},
            'operations': ['create', 'invite', 'join', 'list_matches', 'resume', 'get', 'legal_actions', 'act', 'end_turn'],
            'capabilities': {'asyncTurns': True, 'agentPlaySupported': False}})

    def lobby_match(token, match_id):
        projection = play_api.inspect(token=token, match_id=match_id)
        deadline = projection.get('dueAtUtc')
        if isinstance(deadline, str) and deadline.endswith('+00:00'):
            deadline = deadline[:-6] + 'Z'
        return {'matchId': match_id, 'revision': projection['revision'],
                'status': projection['status'], 'yourTurn': projection['yourSeat'] == projection['activeSeat'],
                'deadline': deadline}

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
                if server_create is not None:
                    if set(params) - {'settings', 'requestId'}:
                        raise ValueError('Game engine revision and seed are server-owned')
                    result = server_create(token=token, settings=params.get('settings'),
                        request_id=params.get('requestId'))
                else:
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
                if set(params) not in ({'matchId', 'invitation'}, {'invitation'}):
                    raise ValueError('Invalid join fields')
                match_id = params.get('matchId') or lifecycle.match_for_invitation(token=token, invitation=params['invitation'])
                result = lifecycle.join(token=token, match_id=match_id, invitation=params['invitation'])
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
            # 'result' is the Life API's typed authoritative data; the limited
            # top-level match projection is the generic Atrium lobby facade.
            response = {'ok': True, 'schema': SCHEMA, 'result': result}
            if op in ('create', 'join', 'resume'):
                response['match'] = lobby_match(token, result['matchId'])
            elif op == 'list_matches':
                rows = result['matches']
                if len(rows) > 100:
                    raise ValueError('Match list exceeds supported page size')
                response['matches'] = [lobby_match(token, row['matchId']) for row in rows]
            elif op == 'invite':
                response['invitation'] = result['invitation']
            return JSONResponse(response)
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

    async def host(request):
        # This is a separate machine-to-machine audience. Never accept a
        # player's life-play credential for match/seat administration.
        from async_atrium_host import HostRejected, HostDependencyUnavailable, HOST_SCHEMA
        if atrium_host is None:
            return failure('HOST_UNAVAILABLE', 'Reviewed Atrium integration not installed', 503)
        try:
            token = bearer(request)
            atrium_host.authorize(token)
            if request.headers.get('content-type','').split(';',1)[0] != 'application/json':
                return failure('BAD_REQUEST', 'JSON content type required', 415)
            raw = await request.body()
            if len(raw) > 32768:
                return failure('BAD_REQUEST','Request too large',413)
            import json
            body = json.loads(raw)
            if not isinstance(body,dict) or body.get('schema') != HOST_SCHEMA:
                raise ValueError('Invalid host schema')
            op = body.get('op')
            allowed = {
                'create_match': ('lobbyId','deploymentId','creatorIssuer','creatorSubject','requestId','settings'),
                'admit_seat': ('matchId','lobbyId','challengeId','recipientSubject'),
                'verify_match': ('matchId','lobbyId'),
                'verify_seat': ('matchId','lobbyId','subject','seat'),
                'can_resume': ('matchId','lobbyId','subject'),
            }
            if op not in allowed:
                return failure('UNKNOWN_OPERATION','Unsupported host operation',422)
            params = {k:v for k,v in body.items() if k not in ('schema','op')}
            if set(params) - set(allowed[op]):
                raise ValueError('Unexpected host fields')
            required = set(allowed[op])-({'settings'} if op=='create_match' else set())
            if set(params) & required != required:
                raise ValueError('Missing host fields')
            fn = {'create_match':atrium_host.create,'admit_seat':atrium_host.admit,
                  'verify_match':atrium_host.verify_match,'verify_seat':atrium_host.verify_seat,
                  'can_resume':atrium_host.can_resume}[op]
            args = {
                'lobbyId':'lobby_id','deploymentId':'deployment_id','creatorIssuer':'creator_issuer',
                'creatorSubject':'creator_subject','requestId':'request_id','settings':'settings',
                'matchId':'match_id','challengeId':'challenge_id','recipientSubject':'recipient_subject',
                'subject':'subject','seat':'seat'
            }
            from starlette.concurrency import run_in_threadpool
            result = await run_in_threadpool(fn,**{args[k]:v for k,v in params.items()})
            return JSONResponse({'ok':True,'schema':HOST_SCHEMA,'result':result})
        except IdentityRejected:
            return failure('UNAUTHENTICATED','Verified Atrium service credential required',401)
        except MatchNotFound:
            return failure('MATCH_NOT_FOUND','Life match/lobby unavailable',404)
        except MatchConflict:
            return failure('CONFLICT','Life match/seat conflict',409)
        except HostDependencyUnavailable:
            return failure('SOCIAL_UNAVAILABLE', 'Trusted Social challenge lookup unavailable', 503)
        except HostRejected:
            return failure('FORBIDDEN','Atrium request or Social admission rejected',403)
        except (EvaluatorUnavailable, StateEngineUnavailable):
            return failure('EVALUATOR_UNAVAILABLE','Life game engine unavailable',503)
        except (ValueError,TypeError,KeyError,__import__('json').JSONDecodeError):
            return failure('BAD_REQUEST','Invalid host request',422)

    return Starlette(routes=[Route('/play/info', info, methods=['GET']),
        Route('/play', play, methods=['POST']), Route('/play/host', host, methods=['POST'])])

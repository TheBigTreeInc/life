"""Direct LoopRD cloud-save v1, TRUSTED-CLIENT game turns.

Generated verbatim into LoopRD's /cloud handler. No JavaScript worker, no
additional web backend, and no client-authorized identity fields.

This service deliberately operates ONLY on existing Life matches. Initial match
creation and Tavi invitation consent still use the established game lifecycle;
Tavi's one-use proof is exchangeable only after game subscription exists.
"""
import base64
import binascii
import hashlib
import hmac
import json
import re
import secrets
import time
import uuid
from datetime import datetime, timezone
import sqlalchemy as sa
from starlette.exceptions import HTTPException

SCHEMA = 'life.cloud-save/v1'
GAME_ID = 'life.loop'
MATCH = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$')
KEY = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$')
SESSION_TTL = 900
MAX_SNAPSHOT_BYTES = 360_000
SESSION_REF = 'life/cloud-session-key'


def _bad(status, message):
    raise HTTPException(status_code=status, detail=message)


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)


def _digest(value):
    return hashlib.sha256(_canonical(value).encode('utf-8')).hexdigest()


def _encoded(value):
    return base64.urlsafe_b64encode(value).rstrip(b'=').decode('ascii')


def _decode(value):
    return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))


def _key(ctx):
    try:
        key = ctx.secret(SESSION_REF)
        if not isinstance(key, str) or len(key.encode('utf-8')) < 32:
            raise ValueError('Short key')
        return key.encode('utf-8')
    except (ValueError, OSError, AttributeError, KeyError):
        _bad(503, 'Cloud-save identity exchange not configured')


def _session_token(key, identity):
    raw = _encoded(_canonical(identity).encode('utf-8'))
    sig = hmac.new(key, ('life-cloud-v1.' + raw).encode('ascii'), hashlib.sha256).hexdigest()
    return 'lcs1.' + raw + '.' + sig


def _identity(ctx, key, match_id):
    auth = ctx.request.headers.get('authorization', '')
    if not isinstance(auth, str) or not auth.startswith('Bearer ') or len(auth) > 8192:
        _bad(401, 'Match-scoped bearer required')
    token = auth[7:]
    parts = token.split('.')
    if len(parts) != 3 or parts[0] != 'lcs1' or not re.fullmatch(r'[A-Za-z0-9_-]{20,1500}', parts[1]) or not re.fullmatch(r'[0-9a-f]{64}', parts[2]):
        _bad(401, 'Invalid match session')
    want = hmac.new(key, ('life-cloud-v1.' + parts[1]).encode('ascii'), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(want, parts[2]):
        _bad(401, 'Invalid match session')
    try:
        data = json.loads(_decode(parts[1]))
        if (type(data) is not dict or set(data) != {'version', 'matchId', 'issuer', 'subject', 'expires', 'nonce'} or
                data['version'] != 1 or data['matchId'] != match_id or
                type(data['expires']) is not int or data['expires'] <= int(time.time()) or
                data['expires'] > int(time.time()) + SESSION_TTL + 30 or
                not all(type(data[k]) is str and 1 <= len(data[k]) <= 256 for k in ('issuer', 'subject', 'nonce'))):
            raise ValueError('Invalid claims')
    except (ValueError, TypeError, KeyError, UnicodeError, binascii.Error, json.JSONDecodeError):
        _bad(401, 'Invalid or expired match session')
    return data


def _member(db, match_id, issuer, subject):
    row = db.execute(sa.text('SELECT "seatId" FROM "GameParticipant" WHERE "matchId"=:m AND "issuer"=:i '
        'AND "subject"=:s AND "role"=\'player\' LIMIT 2'), {'m': match_id, 'i': issuer, 's': subject}).all()
    if len(row) != 1 or row[0][0] not in ('0', '1'):
        _bad(404, 'Match unavailable')
    return int(row[0][0])


def _record(db, match_id):
    # These tables may also be used by Life's trusted /play headless engine.
    # The old client-trusted whole-snapshot pilot MUST NOT mutate or expose a
    # server-authoritative match, even to an otherwise authorized seat.
    try:
        authoritative = db.execute(sa.text('SELECT "id" FROM "GameAtriumBinding" WHERE "matchId"=:m LIMIT 1'),
                                   {'m':match_id}).first()
    except sa.exc.DBAPIError:
        _bad(503, 'Life schema-4 authority gate not migrated')
    if authoritative is not None:
        _bad(409, 'Server-authoritative match requires Life /play')
    match = db.execute(sa.text('SELECT * FROM "GameMatch" WHERE "id"=:m'), {'m': match_id}).mappings().first()
    if match is None:
        _bad(404, 'Match unavailable')
    point = db.execute(sa.text('SELECT * FROM "GameCheckpoint" WHERE "matchId"=:m '
        'ORDER BY "revision" DESC LIMIT 1'), {'m': match_id}).mappings().first()
    if point is None or point['revision'] != match['revision']:
        _bad(409, 'Persisted revision inconsistent')
    state = point['state'] if isinstance(point['state'], dict) else json.loads(point['state'])
    if _digest(state) != point['stateDigest']:
        _bad(409, 'Persisted save checksum incorrect')
    return match, point, state


def _validate_snapshot(state, next_seat):
    try:
        if (type(state) is not dict or type(state.get('players')) is not list or
                len(state['players']) != 3 or
                [x.get('id') if type(x) is dict else None for x in state['players']] != ['player','friend','jones'] or
                type(state.get('settings')) is not dict or state['settings'].get('mode') != 'hotseat' or
                type(state.get('active')) is not int or state['active'] != next_seat or
                type(state.get('seed')) is not int or not 0 <= state['seed'] <= 2**53-1):
            _bad(422, 'Invalid completed-turn save shape')
        raw = _canonical(state).encode('utf-8')
        if len(raw) > MAX_SNAPSHOT_BYTES:
            _bad(413, 'Save exceeds cloud limit')
        return raw
    except (ValueError, TypeError, OverflowError):
        _bad(422, 'Invalid save JSON')


def _snapshot(db, match_id, identity):
    seat = _member(db, match_id, identity['issuer'], identity['subject'])
    match, point, state = _record(db, match_id)
    return {'schema': SCHEMA, 'ok': True, 'match': {
        'matchId':match_id, 'revision':match['revision'], 'stateDigest':point['stateDigest'],
        'engineRevision':match['engineRevision'], 'rulesDigest':match['rulesDigest'],
        'seed':match['initialSeed'], 'turnOwner': int(match['activeSeat']) if match['activeSeat'] is not None else None,
        'yourSeat': seat, 'turnIndex': match['turnIndex'], 'status':match['status'],
        'state':state}}


async def handle(ctx):
    body = ctx.body
    if (type(body) is not dict or body.get('schema') != SCHEMA or
            type(body.get('op')) is not str):
        _bad(422, 'Cloud-save protocol required')
    op = body['op']
    match_id = body.get('matchId')
    if type(match_id) is not str or not MATCH.fullmatch(match_id):
        _bad(422, 'Invalid match locator')
    try:
        if len(_canonical(body).encode('utf-8')) > MAX_SNAPSHOT_BYTES + 8192:
            _bad(413, 'Cloud request too large')
    except (ValueError, TypeError):
        _bad(422, 'Malformed JSON')
    key = _key(ctx)  # Fail closed if the private issuer key is absent.
    if op == 'exchange':
        if set(body) != {'schema', 'op', 'matchId', 'grant'} or not isinstance(body['grant'], str) or not re.fullmatch(r'[A-Za-z0-9_-]{42,128}', body['grant']):
            _bad(422, 'One-use Tavi grant required')
        try:
            proof = await ctx.call('looprd-social', 'tavi-game-grant-redeem', {
                'grant': body['grant'], 'gameId': GAME_ID, 'matchId': match_id})
        except Exception:
            _bad(503, 'Tavi identity service unavailable')
        if (type(proof) is not dict or proof.get('accepted') is not True or
                proof.get('scope') != 'game:identify' or proof.get('gameId') != GAME_ID or
                proof.get('matchId') != match_id or
                not isinstance(proof.get('issuer'), str) or not proof['issuer'] or
                not isinstance(proof.get('subject'), str) or not proof['subject']):
            _bad(403, 'Tavi identity proof refused')
        with ctx.session_factory() as db:
            seat = _member(db, match_id, proof['issuer'], proof['subject'])
            _record(db, match_id)
        token = _session_token(key, {'version': 1, 'matchId':match_id,
             'issuer':proof['issuer'], 'subject':proof['subject'],
             'expires':int(time.time()) + SESSION_TTL, 'nonce':secrets.token_hex(12)})
        return {'ok': True, 'schema':SCHEMA, 'matchId':match_id, 'yourSeat':seat,
                'session':token, 'expiresInSeconds':SESSION_TTL}
    identity = _identity(ctx, key, match_id)
    if op == 'get':
        if set(body) != {'schema', 'op', 'matchId'}:
            _bad(422, 'Unexpected state-read fields')
        with ctx.session_factory() as db:
            return _snapshot(db, match_id, identity)
    if op != 'commit':
        _bad(422, 'Unknown cloud-save operation')
    if set(body) != {'schema', 'op', 'matchId', 'expectedRevision', 'expectedDigest', 'engineRevision', 'idempotencyKey', 'state'}:
        _bad(422, 'Unexpected turn fields')
    revision, idem, state = body['expectedRevision'], body['idempotencyKey'], body['state']
    if type(body['expectedDigest']) is not str or not re.fullmatch(r'[a-f0-9]{64}', body['expectedDigest']):
        _bad(422, 'Expected checkpoint digest required')
    if type(body['engineRevision']) is not str or not 1 <= len(body['engineRevision']) <= 128:
        _bad(422, 'Pinned engine revision required')
    if type(revision) is not int or revision < 0 or type(idem) is not str or not KEY.fullmatch(idem):
        _bad(422, 'Invalid revision or retry key')
    # Snapshot is already played on the client. Trust its economics, never its
    # identity or turn ownership. Only its next-seat metadata is constrained.
    try:
        new_hash = _digest(state)
    except (ValueError, TypeError, OverflowError):
        _bad(422, 'Invalid save JSON')
    command = {'type':'cloud_save_turn', 'baseRevision':revision,
               'baseDigest':body['expectedDigest'], 'engineRevision':body['engineRevision'],
               'stateDigest':new_hash}
    command_hash = _digest(command)
    now = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    with ctx.session_factory.begin() as db:
        seat = _member(db, match_id, identity['issuer'], identity['subject'])
        match, point, previous_state = _record(db, match_id)
        # Replays must be checked before ownership/revision, because a correct
        # retry can arrive after the opponent's turn begins.
        old = db.execute(sa.text('SELECT "revisionAfter", "resultDigest", "commandDigest" FROM "GameAction" '
            'WHERE "matchId"=:m AND "actorIssuer"=:i AND "actorSubject"=:s AND "idempotencyKey"=:k'),
            {'m':match_id, 'i':identity['issuer'], 's':identity['subject'], 'k':idem}).mappings().first()
        if old:
            if old['commandDigest'] != command_hash:
                _bad(409, 'Retry key reused for different save')
            return {'ok':True, 'schema':SCHEMA, 'matchId':match_id, 'revision':old['revisionAfter'],
                    'stateDigest':old['resultDigest'], 'replayed':True}
        if match['engineRevision'] != body['engineRevision']:
            _bad(409, 'Pinned engine revision differs; download the matching client')
        if match['status'] != 'active' or str(match['activeSeat']) != str(seat):
            _bad(403, 'Not your turn')
        if match['revision'] != revision or point['stateDigest'] != body['expectedDigest']:
            _bad(409, 'Stale save revision or checkpoint')
        next_seat = 1 - seat
        _validate_snapshot(state, next_seat)
        if len(_canonical(previous_state).encode('utf-8')) > MAX_SNAPSHOT_BYTES:
            _bad(409, 'Stored game save is too large')
        target = db.execute(sa.text('SELECT "issuer","subject" FROM "GameParticipant" '
            'WHERE "matchId"=:m AND "seatId"=:seat AND "role"=\'player\''),
            {'m':match_id, 'seat':str(next_seat)}).mappings().all()
        if len(target) != 1:
            _bad(409, 'Opponent has not joined')
        changed = db.execute(sa.text('UPDATE "GameMatch" SET "revision"=:new, "rngState"=:rng, '
            '"activeSeat"=:seat, "turnIndex"=:turn, "updatedAtUtc"=:now '
            'WHERE "id"=:m AND "revision"=:previous AND "activeSeat"=:owner'), {
                'new':revision+1,'rng':state['seed'],'seat':str(next_seat), 'turn':match['turnIndex']+1,
                'now':now,'m':match_id,'previous':revision,'owner':str(seat)})
        if changed.rowcount != 1:
            _bad(409, 'Concurrent save update')
        db.execute(sa.text('INSERT INTO "GameCheckpoint" '
            '("id","matchId","revision","turnIndex","state","stateDigest","rngState","createdAtUtc") '
            'VALUES (:id,:m,:revision,:turn,:state,:digest,:rng,:now)'), {
            'id':str(uuid.uuid4()),'m':match_id,'revision':revision+1,'turn':match['turnIndex']+1,
            'state':_canonical(state),'digest':new_hash,'rng':state['seed'],'now':now})
        db.execute(sa.text('INSERT INTO "GameAction" '
            '("id","matchId","revisionBefore","revisionAfter","turnIndex","actorIssuer",'
            '"actorSubject","idempotencyKey","commandDigest","command","resultDigest","createdAtUtc") '
            'VALUES (:id,:m,:before,:after,:turn,:issuer,:subject,:idem,:commandDigest,:command,:resultDigest,:now)'), {
            'id':str(uuid.uuid4()),'m':match_id,'before':revision,'after':revision+1,
            'turn':match['turnIndex']+1,'issuer':identity['issuer'],'subject':identity['subject'],'idem':idem,
            'commandDigest':command_hash,'command':_canonical(command),'resultDigest':new_hash,'now':now})
        db.execute(sa.text('INSERT INTO "GameNotificationOutbox" '
            '("id","matchId","turnIndex","recipientIssuer","recipientSubject","eventId","eventType",'
            '"status","attempts","nextDispatchUtc","createdAtUtc") '
            'VALUES (:id,:m,:turn,:issuer,:subject,:event,\'turn_ready\',\'pending\',0,:now,:now)'), {
            'id':str(uuid.uuid4()),'m':match_id,'turn':match['turnIndex']+1,
            'issuer':target[0]['issuer'],'subject':target[0]['subject'],
            'event':f'{match_id}:turn:{match["turnIndex"]+1}:revision:{revision+1}', 'now':now})
    return {'ok':True,'schema':SCHEMA,'matchId':match_id, 'revision':revision+1,
            'stateDigest':new_hash,'replayed':False}

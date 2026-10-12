# Bundled inline in looprd.yaml. The Python handler is trusted Looprd code.
# Looprd v1 WebSockets are SUBSCRIPTION ONLY; mutations use HTTP.
import hashlib
import hmac
import json
import secrets
import time
import sqlalchemy as sa
from starlette.concurrency import run_in_threadpool

ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
TTL = 48 * 3600
Room = sa.table('Room',
    sa.column('id', sa.Integer), sa.column('codeHash', sa.String),
    sa.column('hostHash', sa.String), sa.column('guestHash', sa.String),
    sa.column('guestName', sa.String), sa.column('state', sa.JSON),
    sa.column('pending', sa.JSON), sa.column('lastResult', sa.JSON),
    sa.column('version', sa.Integer), sa.column('signal', sa.Integer),
    sa.column('touched', sa.Integer))

def digest(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()

def fail(reason):
    return {'ok': False, 'error': reason}

def valid_snapshot(state):
    if not isinstance(state, dict) or not isinstance(state.get('players'), list):
        return False
    if state.get('settings', {}).get('mode') != 'hotseat' or len(state['players']) != 3:
        return False
    if [x.get('id') for x in state['players']] != ['player', 'friend', 'jones']:
        return False
    try:
        return len(json.dumps(state, separators=(',', ':'))) < 360000
    except (TypeError, ValueError):
        return False

def execute(body, sessions):
    if not isinstance(body, dict):
        return fail('Invalid request'), None
    op = body.get('op')
    now = int(time.time())
    event = None
    with sessions.begin() as db:
        if op == 'create':
            state = body.get('state')
            if not valid_snapshot(state):
                return fail('A valid two-human hotseat game is required'), None
            db.execute(sa.delete(Room).where(Room.c.touched < now - TTL))
            host = secrets.token_urlsafe(32)
            code = ''.join(secrets.choice(ALPHABET) for _ in range(10))
            # The random join code is not used as the privileged host token.
            db.execute(sa.insert(Room).values(codeHash=digest(code), hostHash=digest(host),
                guestHash=None, guestName=None, state=state, pending=None, lastResult=None,
                version=1, signal=0, touched=now))
            return {'ok': True, 'code': code, 'token': host, 'role': 'host', 'version': 1, 'state': state, 'joined': False}, None
        code = str(body.get('code') or '').strip().upper()
        if len(code) != 10 or any(x not in ALPHABET for x in code):
            return fail('Invalid game code'), None
        record = db.execute(sa.select(Room).where(Room.c.codeHash == digest(code))).mappings().first()
        if record is None or record['touched'] < now - TTL:
            return fail('Session not found or expired'), None
        rid = record['id']
        if op == 'join':
            if record['guestHash']:
                return fail('This game already has two people'), None
            guest = secrets.token_urlsafe(32)
            name = str(body.get('name') or 'Friend').strip()[:24] or 'Friend'
            db.execute(sa.update(Room).where(Room.c.id == rid).values(guestHash=digest(guest),
                guestName=name, touched=now, signal=record['signal'] + 1))
            event = {'component':'the-life-loop', 'resource':'pulses', 'action':'updated',
                'id':rid, 'data':{'id':rid, 'signal':record['signal']+1}}
            return {'ok':True, 'role':'guest', 'code':code, 'token':guest,
                'state':record['state'], 'version':record['version'], 'joined':True}, event
        token = str(body.get('token') or '')
        hashed = digest(token)
        host = hmac.compare_digest(hashed, record['hostHash']) if token else False
        guest = bool(token and record['guestHash'] and hmac.compare_digest(hashed, record['guestHash']))
        if not (host or guest):
            return fail('Invalid or expired participant token'), None
        if op == 'status':
            return {'ok':True, 'role':'host' if host else 'guest', 'state':record['state'],
                'version':record['version'], 'joined':bool(record['guestHash']),
                'guestName':record['guestName'], 'pending':record['pending'] if host else None,
                'lastResult':record['lastResult']}, None
        if op == 'send':
            if not guest:
                return fail('Only the guest can submit remote turns'), None
            active = record['state'].get('active')
            players = record['state'].get('players', [])
            if not isinstance(active,int) or not 0<=active<len(players) or players[active].get('id')!='friend':
                return fail('It is not your turn'), None
            if record['pending'] is not None:
                return fail('Previous action is still processing'), None
            if body.get('version') != record['version']:
                return fail('State changed: resynchronize first'), None
            command = body.get('command')
            if not isinstance(command,dict) or command.get('type') not in ['travel','act','endTurn','choose']:
                return fail('Unknown game action'), None
            arg = command.get('arg')
            if command['type']!='endTurn' and (not isinstance(arg,str) or len(arg)>100 or not arg):
                return fail('Invalid action argument'), None
            action = {'id':secrets.token_hex(12), 'type':command['type'], 'arg':arg}
            db.execute(sa.update(Room).where(Room.c.id == rid).values(pending=action,
                touched=now, signal=record['signal']+1))
            event = {'component':'the-life-loop', 'resource':'pulses', 'action':'updated',
                'id':rid, 'data':{'id':rid, 'signal':record['signal']+1}}
            return {'ok':True, 'queued':action['id']}, event
        if op == 'publish':
            if not host:
                return fail('Only the host can publish game state'), None
            state = body.get('state')
            if not valid_snapshot(state):
                return fail('Invalid game snapshot'), None
            if body.get('version') != record['version']:
                return fail('Stale game version'), None
            pending = record['pending']
            if pending and body.get('commandId') != pending['id']:
                return fail('A remote command must be acknowledged first'), None
            new_version = record['version']+1
            last_result = {'commandId':pending['id'], 'ok':bool(body.get('actionOk')),
                'message':str(body.get('message') or '')[:300]} if pending else None
            db.execute(sa.update(Room).where(Room.c.id == rid).values(
                state=state, pending=None, version=new_version, signal=record['signal']+1,
                lastResult=last_result, touched=now))
            event = {'component':'the-life-loop', 'resource':'pulses', 'action':'updated',
                'id':rid, 'data':{'id':rid, 'signal':record['signal']+1}}
            return {'ok':True, 'version':new_version}, event
        return fail('Unknown operation'), None

async def handle(ctx):
    outcome, event = await run_in_threadpool(execute, ctx.body, ctx.session_factory)
    if event is not None:
        ctx.publish(event)   # after successful transaction commit
    return outcome

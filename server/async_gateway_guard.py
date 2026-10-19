"""Cryptographic transport guard for the headless Life ASGI server.

Protects the backend from being invoked directly (even if an otherwise-valid
player credential is supplied) without an operator-provisioned gateway key.
This is distinct from verified user identity and seat ownership.
"""
import hashlib
import hmac
import time
from starlette.responses import JSONResponse

SCHEMA = 'looprd.game-play/v1'


def sign(key, timestamp, method, path, body):
    line = f'{timestamp}\n{method}\n{path}\n{hashlib.sha256(body).hexdigest()}'
    return hmac.new(key.encode(), line.encode('ascii'), hashlib.sha256).hexdigest()


class SignedGatewayGuard:
    def __init__(self, app, key, *, skew=30):
        if not isinstance(key, str) or len(key.encode()) < 32:
            raise ValueError('Operator gateway secret (>=32 bytes) required')
        self.app, self.key, self.skew = app, key, skew

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        method, path = scope['method'], scope['path']
        if (method, path) not in (('GET', '/play/info'), ('POST', '/play')):
            response = JSONResponse({'ok': False, 'schema': SCHEMA, 'error': {'code':'NOT_FOUND'}}, status_code=404)
            await response(scope, receive, send)
            return
        headers = {k.lower(): v for k, v in scope.get('headers', [])}
        timestamp_raw = headers.get(b'x-life-timestamp', b'')
        signature_raw = headers.get(b'x-life-signature', b'')
        data = bytearray()
        overflow = False
        while True:
            message = await receive()
            if message['type'] != 'http.request':
                break
            chunk = message.get('body', b'')
            if len(data) + len(chunk) > 32768:
                overflow = True
                break
            data.extend(chunk)
            if not message.get('more_body', False):
                break
        try:
            timestamp = timestamp_raw.decode('ascii')
            signature = signature_raw.decode('ascii')
            valid_time = (timestamp.isdecimal() and len(timestamp) <= 12 and
                          abs(time.time() - int(timestamp)) <= self.skew)
            expected = sign(self.key, timestamp, method, path, data) if valid_time else ''
            authorized = (not overflow and valid_time and len(signature) == 64 and
                          hmac.compare_digest(signature, expected))
        except (ValueError, UnicodeDecodeError, OverflowError):
            authorized = False
        if not authorized:
            response = JSONResponse({'ok': False, 'schema': SCHEMA,
                'error': {'code':'GATEWAY_UNAUTHORIZED', 'message':'Gateway not authorized'}}, status_code=403)
            await response(scope, receive, send)
            return
        done = False
        async def replay():
            nonlocal done
            if done:
                return {'type':'http.request', 'body': b'', 'more_body': False}
            done = True
            return {'type':'http.request', 'body': bytes(data), 'more_body': False}
        await self.app(scope, replay, send)

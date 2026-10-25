"""LoopRD inline /play gateway. Generated verbatim into the component descriptor.

Only operator-supplied HTTPS or a shared Unix socket can be used. The upstream
performs its own Social verification and all game/seat authorization. This
transport does not derive an identity from HTTP headers or account UUIDs.
"""
import hashlib
import hmac
import json
import re
import time
from urllib.parse import urlsplit

import httpx
from starlette.exceptions import HTTPException

SCHEMA = 'looprd.game-play/v1'
SECRET_ORIGIN = 'life/play-backend'
SECRET_KEY = 'life/play-gateway-key'


def _endpoint(value):
    if not isinstance(value, str) or not value or len(value) > 512:
        raise ValueError('Missing trusted Life backend')
    if value.startswith('unix:'):
        path = value[5:]
        if not path.startswith('/') or '..' in path.split('/') or '?' in path or '#' in path or '\\' in path:
            raise ValueError('Unsafe Life socket location')
        return 'http://life.local', httpx.AsyncHTTPTransport(uds=path, retries=0)
    origin = urlsplit(value)
    if (origin.scheme != 'https' or not origin.hostname or origin.username or origin.password or
            origin.path not in ('', '/') or origin.query or origin.fragment or value.rstrip('/') !=
            f'https://{origin.netloc}'):
        raise ValueError('Life backend must be operator-configured HTTPS origin or Unix socket')
    return value.rstrip('/'), httpx.AsyncHTTPTransport(retries=0, trust_env=False)


def _signature(key, timestamp, method, path, data):
    canonical = f'{timestamp}\n{method}\n{path}\n{hashlib.sha256(data).hexdigest()}'
    return hmac.new(key.encode('utf-8'), canonical.encode('ascii'), hashlib.sha256).hexdigest()


async def handle(ctx):
    method = ctx.request.method
    path = ctx.request.url.path
    # LoopRD's authenticated outer dispatch selected this handler. No user
    # input may choose a different backend path or component.
    suffix = '/play/info' if method == 'GET' else ('/play/host' if path.endswith('/play/host') else '/play')
    if suffix not in ('/play/info', '/play', '/play/host') or not path.endswith(suffix) or method not in ('GET', 'POST'):
        raise HTTPException(404, 'Unknown Life play operation')
    try:
        raw = b'' if method == 'GET' else await ctx.request.body()
        if len(raw) > 32768:
            raise HTTPException(413, 'Life request too large')
        if method == 'POST':
            if ctx.request.headers.get('content-type', '').split(';', 1)[0] != 'application/json':
                raise HTTPException(415, 'JSON required')
            envelope = json.loads(raw)
            if not isinstance(envelope, dict) or envelope.get('schema') != ('life.atrium-host/v1' if suffix == '/play/host' else SCHEMA):
                raise HTTPException(422, 'Invalid Life envelope')
        origin, transport = _endpoint(ctx.secret(SECRET_ORIGIN))
        key = ctx.secret(SECRET_KEY)
        if not isinstance(key, str) or len(key.encode()) < 32:
            raise ValueError('Life gateway credential missing')
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, 'Life play gateway not configured') from None

    timestamp = str(int(time.time()))
    headers = {'X-Life-Timestamp': timestamp, 'X-Life-Signature': _signature(key, timestamp, method, suffix, raw)}
    if method == 'POST':
        headers['Content-Type'] = 'application/json'
    authorization = ctx.request.headers.get('authorization', '')
    if method == 'POST':
        if not authorization.startswith('Bearer ') or len(authorization) > 8192:
            raise HTTPException(401, 'Game-scoped bearer required')
        headers['Authorization'] = authorization
    try:
        async with httpx.AsyncClient(transport=transport, timeout=8, follow_redirects=False, trust_env=False) as client:
            response = await client.request(method, origin + suffix, content=raw, headers=headers)
        if response.status_code in (301, 302, 303, 307, 308):
            raise HTTPException(502, 'Life backend redirect refused')
        if len(response.content) > 1024 * 1024:
            raise HTTPException(502, 'Life backend response exceeds limit')
        result = response.json()
        if not isinstance(result, dict) or result.get('schema' if method == 'POST' else 'protocol') != ('life.atrium-host/v1' if suffix == '/play/host' else SCHEMA):
            raise HTTPException(502, 'Invalid Life backend response')
        if response.status_code >= 400:
            # DAPI handler contracts return a fixed HTTP status. Use a native
            # HTTPException to preserve the negative transport status; clients
            # should normalize its `detail` field to the game-play error.
            raise HTTPException(response.status_code, result)
        return result
    except HTTPException:
        raise
    except (httpx.HTTPError, ValueError, json.JSONDecodeError):
        raise HTTPException(503, 'Life backend unavailable') from None

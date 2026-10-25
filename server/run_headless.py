"""Start a trusted Life headless API in a separate service/volume.

Operator configuration is REQUIRED. Do not configure the test-only verifier
from tests; there is intentionally no fallback to unsigned account identifiers.
Run: python server/run_headless.py (after injecting secrets/issuer/plugin).
"""
import importlib
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


def bootstrap():
    from async_runtime import create_runtime
    module = os.environ.get('LIFE_SOCIAL_VERIFIER_MODULE', '')
    issuer = os.environ.get('LIFE_SOCIAL_ISSUER', '')
    database = os.environ.get('LIFE_PLAY_DATABASE_URL', '')
    gateway_key = os.environ.get('LIFE_PLAY_GATEWAY_KEY', '')
    if not all((module, issuer, database, gateway_key)) or not module.replace('_', '').replace('.', '').isalnum():
        raise RuntimeError('Trusted Life backend settings incomplete')
    # This module must be installed/provisioned by the operator, not uploaded by
    # players. The public Social/Tavi SDK is not itself a token verifier.
    implementation = importlib.import_module(module)
    verifier = getattr(implementation, 'verify_game_credential', None)
    # The server-only bridge cannot be activated without both independently
    # provisioned verifiers and an explicit deployment allowlist.
    atrium_issuer = os.environ.get('LIFE_ATRIUM_ISSUER')
    deployment = os.environ.get('LIFE_APPROVED_DEPLOYMENT_ID')
    verifier_atrium = getattr(implementation, 'verify_atrium_credential', None)
    verifier_challenge = getattr(implementation, 'lookup_accepted_social_challenge', None)
    if any((atrium_issuer, deployment, verifier_atrium, verifier_challenge)) and not all((
            atrium_issuer, deployment, callable(verifier_atrium), callable(verifier_challenge))):
        raise RuntimeError('Incomplete trusted Atrium integration; refusing to start')
    app, engine = create_runtime(database_url=database, verify_social=verifier,
        social_issuer=issuer, gateway_key=gateway_key,
        verify_atrium=verifier_atrium if atrium_issuer else None,
        atrium_issuer=atrium_issuer, verify_social_challenge=verifier_challenge if atrium_issuer else None,
        approved_life_deployments=[deployment] if deployment else None)
    return app, engine


if __name__ == '__main__':
    application, engine = bootstrap()
    try:
        import uvicorn
        socket = os.environ.get('LIFE_PLAY_UNIX_SOCKET', '')
        if not socket.startswith('/'):
            raise RuntimeError('Configure absolute private Unix socket (LIFE_PLAY_UNIX_SOCKET)')
        uvicorn.run(application, uds=socket, proxy_headers=False, access_log=False)
    finally:
        engine.dispose()

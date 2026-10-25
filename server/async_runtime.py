"""Operator-composed Life headless runtime. Never supplies a demo user verifier.

The Life backend is a separate process with its own durable database and Node
engine bundle. LoopRD's generated /play handlers act as authenticated transport
without forcing Tavi to know a Life URL. Social proof redemption/issuer
verification must be implemented in the operator-supplied verifier callable.
"""
import json
import hashlib
import hmac
import secrets
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

from async_identity import SocialIdentityBoundary
from async_lifecycle import MatchLifecycle
from async_match_repository import MatchRepository
from async_participants import ParticipantRoster
from async_command_service import AsyncCommandService
from async_state_bridge import TrustedLifeStateBridge
from async_play_api import InternalPlayAPI
from async_http_api import create_app
from async_gateway_guard import SignedGatewayGuard

ROOT = Path(__file__).resolve().parents[1]


def create_match_tables(engine):
    """Additive Game* tables only, no legacy Room writes or destructive migration."""
    import yaml
    spec = yaml.safe_load((ROOT / 'looprd.yaml').read_text(encoding='utf8'))
    meta = sa.MetaData()
    for name, definition in spec['models'].items():
        if not name.startswith('Game'):
            continue
        fields = []
        for column, options in definition['fields'].items():
            dtype = {'integer': sa.Integer, 'json': sa.JSON, 'boolean': sa.Boolean,
                     'datetime': sa.String, 'float': sa.Float, 'string': sa.String}[options['type']]
            if options['type'] == 'string':
                dtype = sa.String(options['maxLength'])
            fields.append(sa.Column(column, dtype, primary_key=options.get('primaryKey',False),
                autoincrement=options.get('generated',False), nullable=not options.get('required',False),
                unique=options.get('unique',False)))
        sa.Table(name, meta, *fields)
    with engine.begin() as db:
        meta.create_all(db, checkfirst=True)
    return meta


def create_runtime(*, database_url, verify_social, social_issuer, gateway_key,
                   verify_atrium=None, atrium_issuer=None, verify_social_challenge=None,
                   approved_life_deployments=None):
    if not callable(verify_social) or not isinstance(social_issuer, str) or not social_issuer:
        raise ValueError('Real operator-provisioned Social verifier and issuer required')
    if not isinstance(database_url,str) or not (database_url.startswith('sqlite:///') or database_url.startswith('postgresql+')):
        raise ValueError('Explicit persistent SQLite or PostgreSQL connection required')
    if database_url.startswith('sqlite:///') and database_url.endswith(':memory:'):
        raise ValueError('In-memory game storage is forbidden')
    # Never log the potentially credential-bearing database URL.
    engine = sa.create_engine(database_url, pool_pre_ping=True)
    create_match_tables(engine)
    sessions = sessionmaker(bind=engine, expire_on_commit=False)
    identity = SocialIdentityBoundary(verify_social, social_issuer)
    roster = ParticipantRoster(sessions)
    repository = MatchRepository(sessions)
    bridge = TrustedLifeStateBridge()
    lifecycle = MatchLifecycle(sessions, identity, bridge.snapshot_factory)
    command = AsyncCommandService(repository, roster.participant_seat, participant_players=roster.players)
    play = InternalPlayAPI(repository, identity, roster.participant_seat, command, bridge.legal_actions)
    def create_server_match(*, token, settings=None, request_id=None):
        # Atrium requests an ordinary private-async lobby, not an arbitrary
        # engine revision or attacker-specified checkpoint/seed.
        if not isinstance(request_id, str) or not 8 <= len(request_id) <= 128:
            raise ValueError('A stable create requestId is required')
        if settings is None:
            settings = {}
        if not isinstance(settings, dict):
            raise ValueError('Invalid match settings')
        allowed = {'mode', 'deadlineHours', 'ruleset', 'era', 'goals', 'jonesDifficulty', 'rules'}
        if set(settings) - allowed or settings.get('mode', 'private-async') != 'private-async' or settings.get('deadlineHours', 60) not in (None, 60):
            raise ValueError('Unsupported private-async settings')
        game_settings = {k: v for k, v in settings.items() if k not in ('mode', 'deadlineHours')}
        principal = identity.authenticate(token)
        # For a stable create request ID the seed is stable across retries and
        # restarts, while not chosen by the client or guessable from its UUID.
        material = f'{principal.issuer}\0{principal.subject}\0{request_id}'.encode()
        seed = int.from_bytes(hmac.new(gateway_key.encode(), material, hashlib.sha256).digest()[:4], 'big')
        version = json.loads((ROOT / 'package.json').read_text())['version']
        rules_digest = hashlib.sha256(json.dumps(game_settings, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        return lifecycle.create(token=token, engine_revision='life-' + version,
            rules_digest=rules_digest, seed=seed, settings=game_settings, request_id=request_id)
    host = None
    if verify_atrium is not None or verify_social_challenge is not None:
        from async_atrium_host import AtriumHostContract
        version = json.loads((ROOT/'package.json').read_text())['version']
        host = AtriumHostContract(sessions, bridge.snapshot_factory,
            verify_atrium=verify_atrium, atrium_issuer=atrium_issuer,
            verify_challenge=verify_social_challenge, social_issuer=social_issuer,
            approved_deployments=approved_life_deployments,
            seed_key=gateway_key, engine_revision='life-'+version)
    app = create_app(lifecycle, play, server_create=create_server_match, atrium_host=host)
    return SignedGatewayGuard(app, gateway_key), engine

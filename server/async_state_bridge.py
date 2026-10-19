"""Use the exact browser LifeGame engine for server snapshots/legal actions.

This worker must run with the matching game source available on disk; LoopRD's
inline handlers do not provide a JS source tree and cannot load it by magic.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / 'server' / 'async_state_cli.cjs'

class StateEngineUnavailable(Exception):
    pass

class TrustedLifeStateBridge:
    def __init__(self, *, node='node', timeout=6):
        self.node, self.timeout = node, timeout

    def _run(self, payload):
        raw = json.dumps(payload, separators=(',', ':'), allow_nan=False)
        if len(raw.encode('utf8')) > 750_000:
            raise StateEngineUnavailable('Input exceeds bound')
        try:
            completed = subprocess.run([self.node, str(CLI)], input=raw,
                text=True, capture_output=True, cwd=ROOT, timeout=self.timeout, check=False)
        except (OSError, subprocess.TimeoutExpired) as error:
            raise StateEngineUnavailable('State engine unavailable') from error
        if completed.returncode != 0 or len(completed.stdout.encode()) > 750_000:
            raise StateEngineUnavailable('State engine rejected request')
        try:
            return json.loads(completed.stdout)
        except (ValueError, TypeError) as error:
            raise StateEngineUnavailable('State engine returned invalid data') from error

    def snapshot_factory(self, seed, settings):
        return self._run({'op': 'create', 'seed': seed, 'settings': settings})

    def legal_actions(self, snapshot, seat):
        return self._run({'op': 'legal_actions', 'snapshot': snapshot, 'seat': seat})['actions']

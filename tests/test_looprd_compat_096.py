"""Migration slice must not stealth-activate a new LoopRD endpoint or change Atrium."""
import json
import unittest
from pathlib import Path
import yaml

ROOT=Path(__file__).resolve().parents[1]

class Compatibility(unittest.TestCase):
    def test_legacy_routes_and_atrium_sidecar_remain_unchanged(self):
        spec=yaml.safe_load((ROOT/'looprd.yaml').read_text())
        handlers={(h['path'],h.get('method','GET')) for h in spec['handlers']}
        self.assertIn(('/session','POST'),handlers)
        self.assertIn(('/play/info','GET'),handlers)
        self.assertIn(('/play','POST'),handlers)
        self.assertNotIn(('/commit_turn','POST'),handlers)
        self.assertEqual(spec['auth']['mode'],'public')
        self.assertEqual(spec['database']['schemaVersion'],4)
        self.assertEqual(spec['api']['version'],'v1')
        for model in ('Room','GameMatch','GameParticipant','GameAction','GameCheckpoint','GameNotificationOutbox'):
            self.assertIn(model,spec['models'])
        sidecar=yaml.safe_load((ROOT/'atriumd.yaml').read_text())
        self.assertEqual(sidecar['schema'],'atriumd/v1')
        self.assertEqual(sidecar['game']['id'],'life.loop')
        self.assertEqual(sidecar['game']['launch']['originRef'],'game-web')
        self.assertNotIn('url',json.dumps(sidecar).lower())

if __name__=='__main__':unittest.main()

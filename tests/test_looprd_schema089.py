import unittest
import sqlite3
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class TestLooprdSchema089(unittest.TestCase):
    def test_ordered_migration(self):
        data = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
        self.assertEqual(data['database']['schemaVersion'], 4)
        self.assertEqual([m['version'] for m in data['database']['migrations']], [2, 3, 4])
        self.assertEqual(len(data['database']['migrations'][1]['statements']), 6)
        self.assertTrue(all(x.startswith('CREATE TABLE IF NOT EXISTS') for x in data['database']['migrations'][1]['statements']))

    def test_v4_bindings_additive(self):
        data=yaml.safe_load((ROOT/'looprd.yaml').read_text())
        self.assertEqual(len(data['database']['migrations'][2]['statements']),2)
        self.assertTrue(all(x.startswith('CREATE TABLE IF NOT EXISTS') for x in data['database']['migrations'][2]['statements']))
        with sqlite3.connect(':memory:') as db:
            for x in data['database']['migrations'][1]['statements']+data['database']['migrations'][2]['statements']:
                db.execute(x)
            self.assertIn('lobbyId',[x[1] for x in db.execute('PRAGMA table_info("GameAtriumBinding")')])

    def test_generated_integer_primary_keys_and_stable_ids(self):
        data = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
        for name in ('GameMatch', 'GameParticipant', 'GameInvitation', 'GameAction', 'GameCheckpoint', 'GameNotificationOutbox'):
            with self.subTest(name=name):
                fields = data['models'][name]['fields']
                keys = [(n, f) for n, f in fields.items() if f.get('primaryKey')]
                self.assertEqual(len(keys), 1)
                self.assertEqual(keys[0][1]['type'], 'integer')
                self.assertTrue(keys[0][1].get('generated'))
                self.assertTrue(fields['id']['required'])
                self.assertTrue(fields['id']['unique'])
                self.assertNotIn('primaryKey', fields['id'])

    def test_v3_additive_ddl_on_sqlite(self):
        data = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
        with sqlite3.connect(':memory:') as db:
            db.execute('CREATE TABLE "Room" (id INTEGER PRIMARY KEY, state JSON NOT NULL)')
            db.execute("INSERT INTO \"Room\" (id,state) VALUES (1, '{}')")
            for statement in data['database']['migrations'][1]['statements']:
                db.execute(statement)
            for statement in data['database']['migrations'][1]['statements']:
                db.execute(statement)  # idempotent replay
            self.assertEqual(db.execute('SELECT count(*) FROM "Room"').fetchone()[0], 1)
            for name in ('GameMatch','GameParticipant','GameInvitation','GameAction','GameCheckpoint','GameNotificationOutbox'):
                fields=db.execute('PRAGMA table_info("'+name+'")').fetchall()
                self.assertTrue(any(f[1]=='recordId' and f[5]==1 for f in fields))

    def test_legacy_room_remains(self):
        data = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
        self.assertIn('Room', data['models'])
        self.assertTrue(data['models']['Room']['fields']['id']['generated'])
        self.assertIn('ALTER TABLE "Room" ADD COLUMN "chatKey" VARCHAR(64)', data['database']['migrations'][0]['statements'])

"""Minimal external-schema-aligned checks, independent of runtime dependencies."""
import pathlib,unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]

class SidecarContract(unittest.TestCase):
    def test_sibling_and_identity(self):
        import yaml
        doc=yaml.safe_load((ROOT/'atriumd.yaml').read_text())
        self.assertEqual(doc['schema'],'atriumd/v1')
        self.assertEqual(doc['component'],'the-life-loop')
        self.assertEqual(doc['game']['id'],'life.loop')
        self.assertEqual(doc['game']['launch']['originRef'],'game-web')
        self.assertEqual(doc['game']['launch']['entrypoint'],'index.html')
        self.assertEqual(doc['game']['integration']['state'],'game-owned')
        self.assertEqual(doc['game']['integration']['sessions'],'game-owned')
        self.assertEqual(doc['game']['integration']['identity'],'game-owned')
    def test_no_addresses_or_secrets(self):
        import re
        source=(ROOT/'atriumd.yaml').read_text()
        self.assertIsNone(re.search(r'(?i)\b(?:https?|wss?|file)://',source))
        self.assertNotIn('apiOrigin:',source)
        self.assertNotIn('token:',source)
        self.assertNotIn('secret:',source)
    def test_looprd_unchanged_schema(self):
        import re
        s=(ROOT/'looprd.yaml').read_text()
        self.assertRegex(s,r'(?m)^  schemaVersion: 4$')
        self.assertNotIn('atriumd:',s)

if __name__=='__main__':unittest.main()

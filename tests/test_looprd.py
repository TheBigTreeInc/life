"""Integration tests of the embedded Looprd component's real SQLAlchemy handler."""
import importlib.util
import json
import secrets
import sqlite3
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
from looprd_handler import execute, guest_appearance


def example_state(active=0):
    return {
        'settings': {'mode': 'hotseat', 'ruleset':'classic'}, 'week':1, 'active':active,
        'players': [{'id':'player', 'name':'Host'}, {'id':'friend','name':'Friend'}, {'id':'jones','isAI':True}]
    }

class LooprdTests(unittest.TestCase):
    def setUp(self):
        self.engine = sa.create_engine('sqlite+pysqlite:///:memory:')
        self.sessions = sessionmaker(self.engine)
        self.spec = yaml.safe_load((ROOT / 'looprd.yaml').read_text())
        md=sa.MetaData()
        for name,model in self.spec['models'].items():
            columns=[]
            for key,field in model['fields'].items():
                kind={'integer':sa.Integer,'string':sa.String(field.get('maxLength',128)), 'json':sa.JSON}[field['type']]
                columns.append(sa.Column(key,kind,primary_key=field.get('primaryKey',False),
                    autoincrement=field.get('generated',False),nullable=not field.get('required',False),unique=field.get('unique',False)))
            sa.Table(name,md,*columns)
        md.create_all(self.engine)

    def tearDown(self):
        self.engine.dispose()

    def call(self, **data):
        return execute(data,self.sessions)

    def test_dapi_spec_is_self_contained_and_exactly_embeds_handler(self):
        s=self.spec
        self.assertEqual(s['apiVersion'],'looprd/v1')
        self.assertEqual(s['component'],'the-life-loop')
        self.assertEqual(s['auth']['mode'],'public')
        self.assertEqual(s['websocket'],{'path':'/events','resources':['pulses']})
        self.assertEqual(s['resources']['pulses']['operations'],['get'])
        self.assertEqual(s['handlers'][0]['source'],(ROOT/'server/looprd_handler.py').read_text())
        self.assertNotIn('Room', [v['model'] for v in s['resources'].values()]) # credentials/state never public CRUD

    def test_create_join_issue_tokens_and_reject_third_player(self):
        c,event=self.call(op='create',state=example_state())
        self.assertTrue(c['ok'])
        self.assertEqual(len(c['code']),10)
        self.assertIsNone(event)
        j,event=self.call(op='join',code=c['code'],name='Remote Friend')
        self.assertTrue(j['ok'])
        self.assertEqual(j['role'],'guest')
        self.assertEqual(event['resource'],'pulses')
        self.assertNotIn('token',str(event))
        deny,_=self.call(op='join',code=c['code'],name='Intruder')
        self.assertFalse(deny['ok'])
        with self.sessions() as session:
            self.assertNotIn(c['token'], str(session.execute(sa.text('select * from "Room"')).fetchone()))

    def test_server_requires_token_to_fetch_snapshots(self):
        c,_=self.call(op='create',state=example_state())
        self.assertFalse(self.call(op='status',code=c['code'],token='wrong')[0]['ok'])
        self.assertTrue(self.call(op='status',code=c['code'],token=c['token'])[0]['ok'])

    def test_guest_actions_require_turn_one_pending_and_version(self):
        c,_=self.call(op='create',state=example_state())
        j,_=self.call(op='join',code=c['code'],name='Friend')
        code=c['code']
        command={'type':'travel','arg':'bank'}
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=1,command=command)[0]['ok'])
        changed=example_state(active=1)
        pub,event=self.call(op='publish',code=code,token=c['token'],version=2,state=changed)
        self.assertTrue(pub['ok'])
        self.assertEqual(pub['version'],3)
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=1,command=command)[0]['ok'])
        sent,event=self.call(op='send',code=code,token=j['token'],version=3,command=command)
        self.assertTrue(sent['ok'])
        self.assertEqual(event['action'],'updated')
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=3,command=command)[0]['ok'])
        status,_=self.call(op='status',code=code,token=c['token'])
        self.assertEqual(status['pending']['id'],sent['queued'])
        self.assertIsNone(self.call(op='status',code=code,token=j['token'])[0]['pending'])
        self.assertFalse(self.call(op='publish',code=code,token=c['token'],version=3,state=changed,commandId='fake')[0]['ok'])
        ack,event=self.call(op='publish',code=code,token=c['token'],version=3,state=changed,
            commandId=sent['queued'],actionOk=True,message='Moved to bank')
        self.assertEqual(ack['version'],4)
        status,_=self.call(op='status',code=code,token=j['token'])
        self.assertEqual(status['lastResult']['message'],'Moved to bank')
        self.assertIsNone(status['pending'])
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=4,command={'type':'hack','arg':''})[0]['ok'])
        self.assertFalse(self.call(op='publish',code=code,token=j['token'],version=4,state=changed)[0]['ok'])

    def test_published_state_is_authoritative_and_persistent(self):
        c,_=self.call(op='create',state=example_state())
        s=example_state(active=1)
        s['week']=24
        self.call(op='publish',code=c['code'],token=c['token'],version=1,state=s)
        self.assertEqual(self.call(op='status',code=c['code'],token=c['token'])[0]['state']['week'],24)

    def test_guest_character_is_persisted_in_shared_game_snapshot_and_validated(self):
        host,_=self.call(op='create',state=example_state())
        appearance={'skin':'olive','hair':'curly','hairColor':'silver','outfit':'sport',
                    'accent':'violet','mood':'focused','personality':'bold','portrait':'illustrated-12'}
        joined,event=self.call(op='join',code=host['code'],name='Guest New',appearance=appearance)
        self.assertTrue(joined['ok'])
        self.assertEqual(joined['version'],2)
        shared=joined['state']['players'][1]['appearance']
        self.assertTrue(all(shared.get(k)==v for k,v in appearance.items()))
        self.assertEqual(shared['schemaVersion'],1)
        self.assertEqual(shared['catalogVersion'],'2026-10-12.1')
        self.assertEqual(shared['body'],'standard')
        self.assertEqual(shared['headwear'],'none')
        self.assertEqual(joined['state']['players'][1]['appearance']['portrait'],'illustrated-12')
        self.assertEqual(joined['state']['players'][1]['color'],'#8274c7')
        self.assertEqual(event['resource'],'pulses')
        state,_=self.call(op='status',code=host['code'],token=host['token'])
        self.assertEqual(state['state']['players'][1]['name'],'Guest New')
        self.assertEqual(state['state']['players'][1]['appearance'],shared)
        self.assertNotIn('appearance',str(event))
        self.assertEqual(state['chatKey'],host['chatKey'])
        self.assertEqual(joined['chatKey'],host['chatKey'])

    def test_pixel_profile_body_and_hat_survive_guest_join(self):
        host,_=self.call(op='create',state=example_state())
        profile={'schemaVersion':1,'catalogVersion':'2026-10-12.1','portrait':'pixel',
                 'body':'broad','headwear':'beanie','hair':'long','accent':'violet','skin':'olive'}
        joined,_=self.call(op='join',code=host['code'],name='Sprite',appearance=profile)
        self.assertTrue(joined['ok'])
        result=joined['state']['players'][1]['appearance']
        for field,value in profile.items():self.assertEqual(result[field],value)
        self.assertNotIn('id',result)
        # Malformed nested values must not crash server-side character validation.
        self.assertEqual(guest_appearance({'headwear':{'unsafe':1}})['headwear'],'none')

    def test_chat_emits_encrypted_ephemeral_websocket_event_only(self):
        host,_=self.call(op='create',state=example_state())
        packet={'nonce':'1234567890123456','ciphertext':'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'}
        rejected,_=self.call(op='chat',code=host['code'],token=host['token'],packet=packet)
        self.assertFalse(rejected['ok'])  # Only once two players join
        guest,_=self.call(op='join',code=host['code'],name='Guest')
        rejected,_=self.call(op='chat',code=host['code'],token='not-a-token',packet=packet)
        self.assertFalse(rejected['ok'])
        rejected,_=self.call(op='chat',code=host['code'],token=guest['token'],packet={'nonce':'!','ciphertext':'oops'})
        self.assertFalse(rejected['ok'])
        original,_=self.call(op='status',code=host['code'],token=host['token'])
        result,event=self.call(op='chat',code=host['code'],token=guest['token'],packet=packet)
        self.assertTrue(result['ok'])
        self.assertEqual(event['data']['chat'],packet)
        self.assertNotIn('token',str(event))
        self.assertNotIn(host['chatKey'],str(event))
        after,_=self.call(op='status',code=host['code'],token=host['token'])
        self.assertEqual(after['version'],original['version'])
        self.assertEqual(after['state'],original['state'])
        self.assertEqual(after['lastResult'],original['lastResult'])
        with self.sessions() as db:
            self.assertNotIn(packet['ciphertext'],str(db.execute(sa.text('select * from "Room"')).fetchone()))

    def test_invalid_snapshot_rejected_without_exposing_code(self):
        bad,_=self.call(op='create',state={'settings':{'mode':'solo'},'players':[]})
        self.assertFalse(bad['ok'])

if __name__=='__main__':unittest.main()

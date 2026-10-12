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
from looprd_handler import execute


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
        pub,event=self.call(op='publish',code=code,token=c['token'],version=1,state=changed)
        self.assertTrue(pub['ok'])
        self.assertEqual(pub['version'],2)
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=1,command=command)[0]['ok'])
        sent,event=self.call(op='send',code=code,token=j['token'],version=2,command=command)
        self.assertTrue(sent['ok'])
        self.assertEqual(event['action'],'updated')
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=2,command=command)[0]['ok'])
        status,_=self.call(op='status',code=code,token=c['token'])
        self.assertEqual(status['pending']['id'],sent['queued'])
        self.assertIsNone(self.call(op='status',code=code,token=j['token'])[0]['pending'])
        self.assertFalse(self.call(op='publish',code=code,token=c['token'],version=2,state=changed,commandId='fake')[0]['ok'])
        ack,event=self.call(op='publish',code=code,token=c['token'],version=2,state=changed,
            commandId=sent['queued'],actionOk=True,message='Moved to bank')
        self.assertEqual(ack['version'],3)
        status,_=self.call(op='status',code=code,token=j['token'])
        self.assertEqual(status['lastResult']['message'],'Moved to bank')
        self.assertIsNone(status['pending'])
        self.assertFalse(self.call(op='send',code=code,token=j['token'],version=3,command={'type':'hack','arg':''})[0]['ok'])
        self.assertFalse(self.call(op='publish',code=code,token=j['token'],version=3,state=changed)[0]['ok'])

    def test_published_state_is_authoritative_and_persistent(self):
        c,_=self.call(op='create',state=example_state())
        s=example_state(active=1)
        s['week']=24
        self.call(op='publish',code=c['code'],token=c['token'],version=1,state=s)
        self.assertEqual(self.call(op='status',code=c['code'],token=c['token'])[0]['state']['week'],24)

    def test_invalid_snapshot_rejected_without_exposing_code(self):
        bad,_=self.call(op='create',state={'settings':{'mode':'solo'},'players':[]})
        self.assertFalse(bad['ok'])

if __name__=='__main__':unittest.main()

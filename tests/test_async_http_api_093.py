import sys, unittest, asyncio, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'server'))
from async_http_api import create_app, SCHEMA
from async_identity import SocialIdentityBoundary
from async_play_api import InternalPlayAPI

class Repo:
 def read(self,match_id): return {'match':{'revision':1,'status':'active','turnIndex':0,'activeSeat':0,'dueAtUtc':None,'engineRevision':'v1'},'checkpoint':{'state':{'players':[]}}}
class Cmd:
 def process(self, **kw): return {'revision':kw['expected_revision']+1,'actor':kw['subject']}
class Lifecycle:
 def __init__(self): self.invocations=0
 def create(self, **kw): self.invocations+=1;return {'matchId':'one','yourSeat':0,'revision':0}
 def resume(self,**kw): return [{'matchId':'one','yourSeat':0,'revision':1}]
 def issue_invitation(self,**kw): return {'matchId':'one','invitation':'secret'}
 def join(self,**kw): return {'matchId':'one','yourSeat':1}

async def request(app, body, token='alice', content_type='application/json', path='/play'):
 response=[]
 raw=json.dumps(body).encode()
 async def receive():return {'type':'http.request','body':raw,'more_body':False}
 async def send(message):response.append(message)
 headers=[(b'content-type',content_type.encode()),(b'authorization',('Bearer '+token).encode())] if token else [(b'content-type',content_type.encode())]
 await app({'type':'http','asgi':{'version':'3.0'},'method':'POST','scheme':'https','path':path,'raw_path':path.encode(),'query_string':b'', 'headers':headers,'client':('127.0.0.1',2345),'server':('localhost',443)},receive,send)
 return response[0]['status'],json.loads(b''.join(x.get('body',b'') for x in response if x['type']=='http.response.body'))

class ContractTests(unittest.TestCase):
 def setUp(self):
  self.life=Lifecycle()
  def verify(token):
   if token not in ('alice','bob'):raise ValueError('invalid token')
   return {'iss':'https://social.example','aud':'life-play','sub':token}
  boundary=SocialIdentityBoundary(verify,'https://social.example')
  self.api=InternalPlayAPI(Repo(),boundary,lambda m,i,s:0 if s=='alice' else None,Cmd(),lambda state,seat:[{'type':'end_turn'}])
  self.app=create_app(self.life,self.api)
 def call(self,op,token='alice',**params):return asyncio.run(request(self.app,{'schema':SCHEMA,'op':op,**params},token=token))
 def test_create_requires_verified_bearer(self):
  self.assertEqual(self.call('create', token='invalid',engineRevision='v1',rulesDigest='hash',seed=1)[0],401)
  self.assertEqual(self.life.invocations,0)
 def test_create(self):
  status,result=self.call('create',engineRevision='v1',rulesDigest='hash',seed=1)
  self.assertEqual(status,200);self.assertEqual(result['result']['matchId'],'one')
 def test_hidden_match_not_exposed_to_other_identity(self):
  status,result=self.call('get',token='bob',matchId='one')
  self.assertEqual(status,404);self.assertEqual(result['error']['code'],'NOT_A_PARTICIPANT')
 def test_legal_actions_and_end_turn(self):
  self.assertEqual(self.call('legal_actions',matchId='one')[1]['result']['actions'],[{'type':'end_turn'}])
  self.assertEqual(self.call('end_turn',matchId='one',expectedRevision=1,idempotencyKey='unique')[1]['result']['actor'],'alice')
 def test_unknown_and_extra_mutation_fields_rejected(self):
  self.assertEqual(self.call('delete',matchId='one')[0],422)
  self.assertEqual(self.call('end_turn',matchId='one',expectedRevision=1,idempotencyKey='unique',seat=0)[0],422)
 def test_missing_auth(self):
  status,_=asyncio.run(request(self.app,{'schema':SCHEMA,'op':'list_matches'},token=''))
  self.assertEqual(status,401)

if __name__=='__main__':unittest.main()

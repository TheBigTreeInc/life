#!/usr/bin/env python3
from pathlib import Path
import json
import yaml
root=Path(__file__).resolve().parent.parent
source=(root/'server/looprd_handler.py').read_text()
spec={
 'apiVersion':'looprd/v1', 'component':'the-life-loop', 'release':json.loads((root/'package.json').read_text())['version'], 'api':{'version':'v1'},
 'auth':{'mode':'public'}, 'database':{'backend':'sqlite','schemaVersion':3,'migrations':[{'version':2,'statements':['ALTER TABLE "Room" ADD COLUMN "chatKey" VARCHAR(64)']}]},
 'models':{
  'Room':{'fields':{
   'id':{'type':'integer','primaryKey':True,'generated':True},
   'codeHash':{'type':'string','maxLength':64,'required':True,'unique':True},
   'hostHash':{'type':'string','maxLength':64,'required':True},
   'guestHash':{'type':'string','maxLength':64},
   'guestName':{'type':'string','maxLength':24},
   'chatKey':{'type':'string','maxLength':64},
   'state':{'type':'json','required':True},
   'pending':{'type':'json'},
   'lastResult':{'type':'json'},
   'version':{'type':'integer','required':True},
   'signal':{'type':'integer','required':True},
   'touched':{'type':'integer','required':True}}},
  # Additive v3 game-owned persistence foundation. These are inert until /play
  # authentication, transactions, and an authoritative evaluator are implemented.
  'GameMatch':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'status':{'type':'string','maxLength':24,'required':True},
   'engineRevision':{'type':'string','maxLength':128,'required':True},
   'rulesDigest':{'type':'string','maxLength':128,'required':True},
   'initialSeed':{'type':'integer','required':True},
   'rngState':{'type':'integer','required':True},
   'revision':{'type':'integer','required':True},
   'turnIndex':{'type':'integer','required':True},
   'activeSeat':{'type':'string','maxLength':32},
   'dueAtUtc':{'type':'string','maxLength':40},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True},
   'updatedAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameParticipant':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'seatId':{'type':'string','maxLength':32,'required':True},
   'issuer':{'type':'string','maxLength':256,'required':True},
   'subject':{'type':'string','maxLength':256,'required':True},
   'role':{'type':'string','maxLength':32,'required':True},
   'joinedAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameInvitation':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'seatId':{'type':'string','maxLength':32,'required':True},
   'tokenDigest':{'type':'string','maxLength':64,'required':True,'unique':True},
   'createdByIssuer':{'type':'string','maxLength':256,'required':True},
   'createdBySubject':{'type':'string','maxLength':256,'required':True},
   'expiresAtUtc':{'type':'string','maxLength':40,'required':True},
   'redeemedByIssuer':{'type':'string','maxLength':256},
   'redeemedBySubject':{'type':'string','maxLength':256},
   'redeemedAtUtc':{'type':'string','maxLength':40},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameAction':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'revisionBefore':{'type':'integer','required':True},
   'revisionAfter':{'type':'integer','required':True},
   'turnIndex':{'type':'integer','required':True},
   'actorIssuer':{'type':'string','maxLength':256,'required':True},
   'actorSubject':{'type':'string','maxLength':256,'required':True},
   'idempotencyKey':{'type':'string','maxLength':128,'required':True},
   'commandDigest':{'type':'string','maxLength':128,'required':True},
   'command':{'type':'json','required':True},
   'resultDigest':{'type':'string','maxLength':128,'required':True},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameCheckpoint':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'revision':{'type':'integer','required':True},
   'turnIndex':{'type':'integer','required':True},
   'state':{'type':'json','required':True},
   'stateDigest':{'type':'string','maxLength':128,'required':True},
   'rngState':{'type':'integer','required':True},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameNotificationOutbox':{'fields':{
   'id':{'type':'string','maxLength':64,'primaryKey':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'turnIndex':{'type':'integer','required':True},
   'recipientIssuer':{'type':'string','maxLength':256,'required':True},
   'recipientSubject':{'type':'string','maxLength':256,'required':True},
   'eventId':{'type':'string','maxLength':128,'required':True},
   'eventType':{'type':'string','maxLength':80,'required':True},
   'status':{'type':'string','maxLength':24,'required':True},
   'attempts':{'type':'integer','required':True},
   'lastErrorClass':{'type':'string','maxLength':128},
   'nextDispatchUtc':{'type':'string','maxLength':40},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'Pulse':{'fields':{'id':{'type':'integer','primaryKey':True,'generated':True},
                     'signal':{'type':'integer','required':True}}}
 },
 'resources':{'pulses':{'model':'Pulse','path':'/pulses','operations':['get']}},
 'websocket':{'path':'/events','resources':['pulses']},
 'handlers':[
  {'path':'/session','method':'POST','kind':'python','source':source},
  {'path':'/info','kind':'response','response':{'protocol':'the-life-loop/1','transport':'HTTP commands + Looprd WebSocket notifications','auth':'room-scoped capability tokens'}}]
}
(root/'looprd.yaml').write_text('# Auto-embedded from server/looprd_handler.py using tools/generate-looprd.py\n'+yaml.safe_dump(spec,sort_keys=False,allow_unicode=True,width=110))

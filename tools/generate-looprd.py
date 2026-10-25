#!/usr/bin/env python3
from pathlib import Path
import json
import yaml
root=Path(__file__).resolve().parent.parent
source=(root/'server/looprd_handler.py').read_text()
play_source=(root/'server/async_looprd_gateway.py').read_text()
cloud_source=(root/'server/cloud_save_looprd.py').read_text()
spec={
 'apiVersion':'looprd/v1', 'component':'the-life-loop', 'release':json.loads((root/'package.json').read_text())['version'], 'api':{'version':'v1'},
 'auth':{'mode':'public'}, 'database':{'backend':'sqlite','schemaVersion':4,'migrations':[{'version':2,'statements':['ALTER TABLE "Room" ADD COLUMN "chatKey" VARCHAR(64)']},{'version':3,'statements':[]},{'version':4,'statements':[]}]},
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
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
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
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'seatId':{'type':'string','maxLength':32,'required':True},
   'issuer':{'type':'string','maxLength':256,'required':True},
   'subject':{'type':'string','maxLength':256,'required':True},
   'role':{'type':'string','maxLength':32,'required':True},
   'joinedAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameInvitation':{'fields':{
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
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
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
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
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
   'matchId':{'type':'string','maxLength':64,'required':True},
   'revision':{'type':'integer','required':True},
   'turnIndex':{'type':'integer','required':True},
   'state':{'type':'json','required':True},
   'stateDigest':{'type':'string','maxLength':128,'required':True},
   'rngState':{'type':'integer','required':True},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameAtriumBinding':{'fields':{
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
   'matchId':{'type':'string','maxLength':64,'required':True,'unique':True},
   'lobbyId':{'type':'string','maxLength':128,'required':True,'unique':True},
   'deploymentId':{'type':'string','maxLength':128,'required':True},
   'creatorIssuer':{'type':'string','maxLength':256,'required':True},
   'creatorSubject':{'type':'string','maxLength':256,'required':True},
   'requestId':{'type':'string','maxLength':128,'required':True},
   'settingsDigest':{'type':'string','maxLength':128,'required':True},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameSocialChallengeBinding':{'fields':{
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
   'matchId':{'type':'string','maxLength':64,'required':True,'unique':True},
   'challengeKey':{'type':'string','maxLength':64,'required':True,'unique':True},
   'challengeId':{'type':'string','maxLength':64,'required':True},
   'socialIssuer':{'type':'string','maxLength':256,'required':True},
   'senderSubject':{'type':'string','maxLength':256,'required':True},
   'recipientSubject':{'type':'string','maxLength':256,'required':True},
   'createdAtUtc':{'type':'string','maxLength':40,'required':True}}},
  'GameNotificationOutbox':{'fields':{
   'recordId':{'type':'integer','primaryKey':True,'generated':True},
   'id':{'type':'string','maxLength':64,'required':True,'unique':True},
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
 'dependencies':[{'component':'looprd-social','contract':'tavi-game-grant-redeem','version':1,
                  'credentialSecret':'tavi/services/the-life-loop','optional':True}],
 'handlers':[
  {'path':'/session','method':'POST','kind':'python','source':source},
  {'path':'/play/info','method':'GET','kind':'python','source':play_source},
  {'path':'/play','method':'POST','kind':'python','source':play_source},
  {'path':'/play/host','method':'POST','kind':'python','source':play_source},
  {'path':'/cloud','method':'POST','kind':'python','source':cloud_source},
  {'path':'/info','kind':'response','response':{'protocol':'the-life-loop/1','transport':'HTTP commands + Looprd WebSocket notifications','auth':'room-scoped capability tokens'}}]
}
# v3 explicitly creates new Game* tables on existing schema-2 installations.
# ALTER/DROP are deliberately absent: Room and prior data are never modified here.
# These statements are also safe if new-model provisioning already created tables.
_v3=[]
for _model_name in ('GameMatch','GameParticipant','GameInvitation','GameAction','GameCheckpoint','GameNotificationOutbox'):
    _cols=[]
    for _name,_field in spec['models'][_model_name]['fields'].items():
        _type = {'integer':'INTEGER','string':f'VARCHAR({_field.get("maxLength",255)})','json':'JSON'}[_field['type']]
        _col = f'"{_name}" {_type}'
        if _field.get('primaryKey'):
            _col += ' PRIMARY KEY AUTOINCREMENT'
        else:
            if _field.get('required'): _col += ' NOT NULL'
            if _field.get('unique'): _col += ' UNIQUE'
        _cols.append(_col)
    _v3.append(f'CREATE TABLE IF NOT EXISTS "{_model_name}" ('+', '.join(_cols)+')')
spec['database']['migrations'][1]['statements']=_v3
# v4 only adds Life-owned lobby/challenge bindings. Never delete older Game* data.
_v4=[]
for _model_name in ('GameAtriumBinding','GameSocialChallengeBinding'):
    _cols=[]
    for _name,_field in spec['models'][_model_name]['fields'].items():
        _type = {'integer':'INTEGER','string':f'VARCHAR({_field.get("maxLength",255)})','json':'JSON'}[_field['type']]
        _col = f'"{_name}" {_type}'
        if _field.get('primaryKey'): _col += ' PRIMARY KEY AUTOINCREMENT'
        else:
            if _field.get('required'): _col += ' NOT NULL'
            if _field.get('unique'): _col += ' UNIQUE'
        _cols.append(_col)
    _v4.append(f'CREATE TABLE IF NOT EXISTS "{_model_name}" ('+', '.join(_cols)+')')
spec['database']['migrations'][2]['statements']=_v4
(root/'looprd.yaml').write_text('# Auto-embedded from server/looprd_handler.py using tools/generate-looprd.py\n'+yaml.safe_dump(spec,sort_keys=False,allow_unicode=True,width=110))

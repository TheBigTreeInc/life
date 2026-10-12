#!/usr/bin/env python3
from pathlib import Path
import yaml
root=Path(__file__).resolve().parent.parent
source=(root/'server/looprd_handler.py').read_text()
spec={
 'apiVersion':'looprd/v1', 'component':'the-life-loop', 'release':'0.5.3', 'api':{'version':'v1'},
 'auth':{'mode':'public'}, 'database':{'backend':'sqlite','schemaVersion':1},
 'models':{
  'Room':{'fields':{
   'id':{'type':'integer','primaryKey':True,'generated':True},
   'codeHash':{'type':'string','maxLength':64,'required':True,'unique':True},
   'hostHash':{'type':'string','maxLength':64,'required':True},
   'guestHash':{'type':'string','maxLength':64},
   'guestName':{'type':'string','maxLength':24},
   'state':{'type':'json','required':True},
   'pending':{'type':'json'},
   'lastResult':{'type':'json'},
   'version':{'type':'integer','required':True},
   'signal':{'type':'integer','required':True},
   'touched':{'type':'integer','required':True}}},
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

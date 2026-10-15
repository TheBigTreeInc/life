"""Browser smoke: independent Looprd Social lobby, incoming messages, co-op isolation and mobile layout."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]

try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height in [(390,844),(1440,900)]:
   messages=[{'id':1,'authorId':'profile-guest','displayName':'Visitor','text':'Hello from Social','at':100}]
   request_ops=[]
   def router(route):
    payload=route.request.post_data_json or {}
    request_ops.append(payload)
    op=payload.get('op')
    if payload.get('token')!='valid-social-token-long-enough':result={'ok':False,'error':'Invalid development credential'}
    elif op=='me':result={'ok':True,'profile':{'schema':'looprd.social.profile/v1','profileId':'profile-person','displayName':'Dorbian','appearance':None},'revision':1}
    elif op=='chat_feed':result={'ok':True,'schema':'looprd.social.chat/v1','messages':list(messages)}
    elif op=='chat_send':
     messages.append({'id':len(messages)+1,'authorId':'profile-person','displayName':'Dorbian','text':payload['text'],'at':105})
     result={'ok':True,'message':messages[-1]}
    else:result={'ok':False,'error':'Unknown op'}
    route.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(result))
   page=browser.new_page(viewport={'width':width,'height':height})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(root.joinpath('PLAY.html').read_text(encoding='utf8'),wait_until='load')
   page.evaluate("""() => { const messages=[{id:1,authorId:'profile-guest',displayName:'Visitor',text:'Hello from Social',at:100}];
    window.fetch=async(url,opt)=>{const req=JSON.parse(opt.body);let result;
     if(req.token!=='valid-social-token-long-enough')result={ok:false,error:'Invalid development credential'};
     else if(req.op==='me')result={ok:true,profile:{schema:'looprd.social.profile/v1',profileId:'profile-person',displayName:'Dorbian',appearance:null},revision:1};
     else if(req.op==='chat_feed')result={ok:true,schema:'looprd.social.chat/v1',messages:[...messages]};
     else if(req.op==='chat_send'){const message={id:messages.length+1,authorId:'profile-person',displayName:'Dorbian',text:req.text,at:105};messages.push(message);result={ok:true,message};}
     else result={ok:false,error:'Unknown op'};
     return {ok:true,json:async()=>result};
    };
   }""")
   page.locator('#startNewGameBtn').click()
   page.locator('#chatToggle').click()
   assert page.locator('#chatPanel').is_visible(),('panel',width)
   assert page.locator('#chatSocialTab').get_attribute('aria-pressed')=='true'
   assert page.locator('#chatRoomTab').is_visible()
   page.locator('#chatSocialOrigin').fill('https://api.example.org')
   page.locator('#chatSocialToken').fill('valid-social-token-long-enough')
   page.locator('#chatSocialConnectForm button[type="submit"]').click()
   page.locator('#chatMessages').get_by_text('Hello from Social').wait_for(timeout=3000)
   assert page.locator('#chatSocialToken').input_value()==''
   assert page.locator('#chatSocialConnected').is_visible()
   page.locator('#chatInput').fill('Hi!')
   page.locator('#chatSend').click()
   page.locator('#chatMessages').get_by_text('Hi!').wait_for(timeout=3000)
   page.locator('#chatRoomTab').click()
   assert page.locator('#chatMessages').get_by_text('Hi!').count()==0
   assert page.locator('#chatForm').is_hidden()
   page.locator('#chatSocialTab').click()
   assert page.locator('#chatMessages').get_by_text('Hi!').count()==1
   page.locator('#chatSocialDisconnect').click()
   assert page.locator('#chatSocialConnectForm').is_visible()
   assert page.locator('#chatMessages').get_by_text('Hi!').count()==0
   assert not errors,(width,errors)
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),('horizontal overflow',width)
   assert page.locator('.board-tile').count()==13
   print(f'{width}px: Social direct Looprd chat & room isolation PASS, direct API flow, zero JS errors')
   page.close()
  browser.close()
finally:pass

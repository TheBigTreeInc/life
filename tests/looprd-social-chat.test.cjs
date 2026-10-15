const {test}=require('node:test');const assert=require('node:assert/strict');
const shared=require('../src/looprd-shared-profile.js');
const {SocialSession,safeMessages}=require('../src/looprd-social-session.js');
const PROFILE={schema:'looprd.social.profile/v1',profileId:'profile-alpha',displayName:'Alice',appearance:null};
const TOKEN='test-token-at-least-24-chars';
test('native Looprd Social uses the component POST handler and never puts credentials into URLs or headers',async()=>{
 const calls=[];const fetcher=async(url,opts)=>{calls.push({url,opts});const x=JSON.parse(opts.body);assert.equal(x.token,TOKEN);assert.equal(opts.method,'POST');assert.equal(url,'https://looprd.example/looprd/looprd-social/v1/social');return {ok:true,json:async()=>x.op==='me'?{ok:true,profile:PROFILE}:x.op==='save_profile'?{ok:true,profile:PROFILE}:x.op==='chat_feed'?{ok:true,schema:'looprd.social.chat/v1',messages:[]}:{ok:true,message:{id:1}}};};
 const c=new shared.SocialClient('https://looprd.example',TOKEN,{fetcher});
 assert.equal(c.mode,'native');assert.deepEqual(await c.me(),PROFILE);
 await c.saveProfile(PROFILE);assert.deepEqual(await c.chatFeed(),{schema:'looprd.social.chat/v1',messages:[]});await c.sendChat('hello');
 assert.deepEqual(calls.map(x=>JSON.parse(x.opts.body).op),['me','save_profile','chat_feed','chat_send']);
 assert.ok(!calls.some(x=>x.url.includes(TOKEN)||JSON.stringify(x.opts.headers).includes(TOKEN)));
 c.disconnect();assert.equal(c.token,'');
});
test('Social endpoints restrict credentials, paths and non-TLS remote origins',()=>{
 assert.equal(shared.socialAddress('https://api.example.org/looprd/looprd-social/v1').base,'https://api.example.org/looprd/looprd-social/v1');
 assert.equal(shared.socialAddress('http://127.0.0.1:8947').mode,'bridge');
 assert.equal(shared.socialAddress('https://api.example.org','native').mode,'native');
 for(const bad of ['http://api.example.org','https://a:secret@api.example.org','https://api.example.org/unsafe','https://api.example.org/?token=bad'])assert.throws(()=>shared.socialAddress(bad));
});
test('Looprd Social application errors are surfaced, not treated as successful HTTP 200',async()=>{
 const c=new shared.SocialClient('https://api.example.org',TOKEN,{fetcher:async()=>({ok:true,json:async()=>({ok:false,error:'Chat cooldown: wait 2 seconds'})})});
 await assert.rejects(c.sendChat('hi'),/Chat cooldown/);
});
test('Social session persists only origin, never secret; chat is bounded and independently cleared',async()=>{
 const storage=new Map();let messages=[{id:1,authorId:'profile-beta',displayName:'Bob',text:'hey',at:1}];let emissions=0;
 const store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const fetcher=async(_url,opts)=>{const data=JSON.parse(opts.body);return {ok:true,json:async()=>data.op==='me'?{ok:true,profile:PROFILE}:data.op==='chat_feed'?{ok:true,messages}:data.op==='chat_send'?{ok:true,message:{id:3}}:{ok:true,profile:PROFILE}};};
 const s=new SocialSession({Client:shared.SocialClient,fetcher,store,onChange:()=>emissions++});
 await s.connect('https://api.example.org',TOKEN);
 assert.equal(s.messages.length,1);assert.equal(s.unread,0);
 messages=[...messages,{id:2,authorId:'profile-beta',displayName:'Bob',text:'next',at:2}];
 await s.refresh();assert.equal(s.unread,1);
 s.setActive(true);assert.equal(s.unread,0);
 assert.deepEqual([...storage.entries()],[[require('../src/looprd-social-session.js').STORE_KEY, 'https://api.example.org']]);
 s.disconnect();assert.equal(s.client,null);assert.equal(s.messages.length,0);assert.ok(emissions>0);
 assert.equal(JSON.stringify([...storage.entries()]).includes(TOKEN),false);
});
test('Social chat sanitizes messages and does not accept unbounded payloads',()=>{
 assert.throws(()=>safeMessages({messages:'oops'}),/Invalid Social chat/);
 const input={messages:[{id:1,displayName:'x'.repeat(100),text:'<img src=x onerror=alert(1)>',authorId:'a'.repeat(100)}]};
 const [m]=safeMessages(input);assert.equal(m.name.length,24);assert.equal(m.authorId.length,72);assert.equal(m.text,'<img src=x onerror=alert(1)>');
});

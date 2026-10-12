const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const {webcrypto}=require('node:crypto');const {TextEncoder,TextDecoder}=require('node:util');
function makeNetwork(){
 const local=new Map(),session=new Map();let latest=null;
 const mem=(map)=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
 const ws=[];class WebSocket {constructor(url){this.url=url;ws.push(this);}send(s){this.sent=JSON.parse(s);}close(){}}
 let state={settings:{mode:'hotseat'},players:[{id:'player'},{id:'friend'},{id:'jones'}],active:0};let version=1;let pending=null;let joinAppearance=null;const chatKey='w'.repeat(43);
 const api=async(payload)=>{
  if(payload.op==='create'){latest=payload.state;return {ok:true,code:'AAAA234567',token:'hostsecret',role:'host',version:1,state:latest,chatKey};}
  if(payload.op==='join'){joinAppearance=payload.appearance;latest={...latest,players:latest.players.map((pl,i)=>i===1?{...pl,name:payload.name,appearance:joinAppearance}:pl)};version++;return {ok:true,code:'AAAA234567',token:'guestsecret',role:'guest',version,state:latest,chatKey};}
  if(payload.op==='status')return {ok:true,state:latest,version,pending:payload.token==='hostsecret'?pending:null,joined:true,guestName:latest.players[1].name,chatKey};
  if(payload.op==='publish'){if(payload.version!==version)return {ok:false,error:'Stale game version'};latest=payload.state;version++;pending=null;return {ok:true,version};}
  if(payload.op==='chat'){if(!payload.packet)throw Error('Missing chat envelope');return {ok:true};}
  if(payload.op==='send'){pending={id:'cmd1',...payload.command};return {ok:true,queued:'cmd1'};}
  throw Error('Bad operation '+payload.op);
 };
 const ctx={console,URL,location:{hostname:'localhost',href:'http://localhost:8080/game/',search:''},
  localStorage:mem(local),sessionStorage:mem(session),WebSocket,crypto:webcrypto,TextEncoder,TextDecoder,btoa,atob,setInterval:()=>1,clearInterval:()=>{},
  clearTimeout:()=>{},setTimeout:()=>1,fetch:async(url,opts)=>({ok:true,json:()=>api(JSON.parse(opts.body))})};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/network.js','utf8'),ctx);
 let count=0;const hook={getGame:()=>({players:state.players,player:state.players[state.active],snapshot:()=>state,
  travel:()=>({ok:true,message:'Travel complete'}),act:()=>({ok:true,message:'Worked'}),
  chooseEncounter:()=>({ok:true,message:'Chosen'}),endTurn:()=>{state={...state,active:0};return {ok:true,message:'Turn ended'};}}),
  setGame:next=>{state=next;},render:()=>count++,toast:()=>{}};
 return {Network:ctx.LifeOnline,hook,ws,ctx,change:s=>{state=s;},getState:()=>state,requests:api};
}
test('server FQDN normalizes to Looprd routes and rejects unsafe input',()=>{
 const {Network}=makeNetwork();
 assert.equal(Network.serverBase('api.server.country'),'https://api.server.country');
 assert.equal(Network.serverBase('https://api.server.country/'),'https://api.server.country');
 assert.equal(Network.validateEndpoint('api.server.country'),'https://api.server.country/looprd/the-life-loop/v1');
 assert.equal(Network.validateEndpoint('https://api.server.country:8443'),'https://api.server.country:8443/looprd/the-life-loop/v1');
 assert.equal(Network.validateEndpoint('localhost:8080'),'http://localhost:8080/looprd/the-life-loop/v1');
 assert.equal(Network.validateEndpoint('http://localhost:8080'),'http://localhost:8080/looprd/the-life-loop/v1');
 assert.equal(Network.validateEndpoint('https://api.server.country/looprd/the-life-loop/v1/'),'https://api.server.country/looprd/the-life-loop/v1'); // legacy session
 for(const bad of ['', 'http://api.server.country','ftp://api.server.country','https://user:pass@api.server.country','https://api.server.country/evil','https://api.server.country/?token=1','https://api.server.country/#fragment'])assert.throws(()=>Network.validateEndpoint(bad),bad);
});
test('invite link includes server and friend code but never tokens',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);
 await host.host('api.server.country');
 assert.equal(host.endpoint,'https://api.server.country/looprd/the-life-loop/v1');
 assert.equal(r.ws[0].url,'wss://api.server.country/looprd/the-life-loop/v1/events');
 const invite=new URL(host.inviteLink());
 assert.equal(invite.searchParams.get('join'),'AAAA234567');
 assert.equal(invite.searchParams.get('server'),'https://api.server.country');
 assert.ok(!invite.href.includes('hostsecret'));
 host.disconnect();
});
test('room create returns shareable 10-character code, guest joins and submits action',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);await host.host('localhost:8080');
 assert.equal(host.code,'AAAA234567');assert.equal(host.role,'host');assert.match(r.ws[0].url,/ws:\/\/localhost:8080\/looprd\/the-life-loop\/v1\/events/);
 const guest=new r.Network(r.hook);await guest.join('localhost:8080','AAAA-234567','Friend');
 assert.equal(guest.role,'guest');assert.equal(guest.ownTurn(),false);
 await host.sync();r.change({...r.getState(),active:1});await host.publish();await guest.sync();assert.equal(guest.ownTurn(),true);
 const outcome=await guest.execute('travel','bank',()=>{throw Error('Guest must not advance local engine')});
 assert.equal(outcome.ok,true);await host.sync();assert.equal(host.version,4);
 guest.disconnect();host.disconnect();
});
test('online client does not allow host to take guest turn',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);await host.host('localhost:8080');
 r.change({...r.getState(),active:1});let touched=false;
 const denied=await host.execute('travel','bank',()=>{touched=true;return {ok:true};});
 assert.equal(denied.ok,false);assert.equal(touched,false);host.disconnect();
});

test('Looprd component probe confirms the advertised protocol and rejects missing registration',async()=>{
 const r=makeNetwork(),client=new r.Network(r.hook);await client.host('localhost:8080');
 assert.equal(client.infoStatus,'Not checked');
 r.ctx.fetch=async(url,init)=>({ok:true,json:async()=>({protocol:'the-life-loop/1'})});
 assert.equal(await client.probe(),'Looprd component registered and responding');
 assert.equal(client.infoStatus,'Verified: the-life-loop/1');
 r.ctx.fetch=async()=>({ok:false,status:404});
 await assert.rejects(()=>client.probe(),/HTTP 404/);
 assert.equal(client.infoStatus,'HTTP 404');
 r.ctx.fetch=async()=>({ok:true,json:async()=>({protocol:'different-component/1'})});
 await assert.rejects(()=>client.probe(),/not recognized/);
 client.disconnect();
});

test('remote guest appearance is transmitted and persisted in shared room state',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);await host.host('localhost:8080');
 const p={skin:'olive',hair:'curly',hairColor:'silver',outfit:'sport',accent:'violet',mood:'focused',personality:'bold'};
 const guest=new r.Network(r.hook);await guest.join('localhost:8080','AAAA234567','A Guest',p);
 await host.sync();
 assert.equal(r.getState().players[1].appearance.hair,'curly');
 assert.equal(r.getState().players[1].name,'A Guest');
 assert.equal(host.chatKey,guest.chatKey);
 host.disconnect();guest.disconnect();
});
test('chat stays WSS-gated and encrypted with no game snapshot changes',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);await host.host('localhost:8080');
 const guest=new r.Network(r.hook);await guest.join('localhost:8080','AAAA234567','B');
 await assert.rejects(()=>host.sendChat('No WebSocket'),/active Looprd WebSocket/);
 r.ws[0].onopen();r.ws[1].onopen();await host.sync();
 assert.equal(host.canChat(),true);
 // Transport uses HTTP, but only accepts sends while WebSocket is open.
 const previous=r.getState();let envelope=null;
 r.ctx.fetch=async(_url,init)=>{const payload=JSON.parse(init.body);envelope=payload;return {ok:true,json:async()=>({ok:true})};};
 await host.sendChat('Hello from host');
 assert.equal(envelope.op,'chat');assert.ok(!JSON.stringify(envelope).includes('Hello from host'));
 await guest.receiveChat(envelope.packet);
 assert.equal(guest.chatLines.length,1);assert.equal(guest.chatLines[0].text,'Hello from host');
 assert.strictEqual(r.getState(),previous);
 r.ws[1].onclose();assert.equal(guest.chatLines.length,0);assert.equal(guest.canChat(),false);
 host.disconnect();guest.disconnect();
});

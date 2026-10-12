const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
function makeNetwork(){
 const local=new Map(),session=new Map();let latest=null;
 const mem=(map)=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
 const ws=[];class WebSocket {constructor(url){this.url=url;ws.push(this);}send(s){this.sent=JSON.parse(s);}close(){}}
 let state={settings:{mode:'hotseat'},players:[{id:'player'},{id:'friend'},{id:'jones'}],active:0};let version=1;let pending=null;
 const api=async(payload)=>{
  if(payload.op==='create'){latest=payload.state;return {ok:true,code:'AAAA234567',token:'hostsecret',role:'host',version:1,state:latest};}
  if(payload.op==='join')return {ok:true,code:'AAAA234567',token:'guestsecret',role:'guest',version,state:latest};
  if(payload.op==='status')return {ok:true,state:latest,version,pending:payload.token==='hostsecret'?pending:null,joined:true,guestName:'Friend'};
  if(payload.op==='publish'){if(payload.version!==version)return {ok:false,error:'Stale game version'};latest=payload.state;version++;pending=null;return {ok:true,version};}
  if(payload.op==='send'){pending={id:'cmd1',...payload.command};return {ok:true,queued:'cmd1'};}
  throw Error('Bad operation '+payload.op);
 };
 const ctx={console,URL,location:{hostname:'localhost',href:'http://localhost:8080/game/',search:''},
  localStorage:mem(local),sessionStorage:mem(session),WebSocket,setInterval:()=>1,clearInterval:()=>{},
  clearTimeout:()=>{},setTimeout:()=>1,fetch:async(url,opts)=>({ok:true,json:()=>api(JSON.parse(opts.body))})};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('src/network.js','utf8'),ctx);
 let count=0;const hook={getGame:()=>({players:state.players,player:state.players[state.active],snapshot:()=>state,
  travel:()=>({ok:true,message:'Travel complete'}),act:()=>({ok:true,message:'Worked'}),
  chooseEncounter:()=>({ok:true,message:'Chosen'}),endTurn:()=>{state={...state,active:0};return {ok:true,message:'Turn ended'};}}),
  setGame:next=>{state=next;},render:()=>count++,toast:()=>{}};
 return {Network:ctx.LifeOnline,hook,ws,change:s=>{state=s;},getState:()=>state,requests:api};
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
 r.change({...r.getState(),active:1});await host.publish();await guest.sync();assert.equal(guest.ownTurn(),true);
 const outcome=await guest.execute('travel','bank',()=>{throw Error('Guest must not advance local engine')});
 assert.equal(outcome.ok,true);await host.sync();assert.equal(host.version,3);
 guest.disconnect();host.disconnect();
});
test('online client does not allow host to take guest turn',async()=>{
 const r=makeNetwork(),host=new r.Network(r.hook);await host.host('localhost:8080');
 r.change({...r.getState(),active:1});let touched=false;
 const denied=await host.execute('travel','bank',()=>{touched=true;return {ok:true};});
 assert.equal(denied.ok,false);assert.equal(touched,false);host.disconnect();
});

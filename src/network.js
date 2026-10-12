/* Life Loop remote hotseat adapter for Looprd / dapi v1.
 * Commands use authenticated room HTTP requests; WebSockets announce durable version changes.
 * Looprd's native websocket is subscription-only, not a bidirectional RPC channel.
 * The host runs the existing deterministic LifeGame engine and publishes accepted snapshots.
 */
(function(root){
'use strict';
const STORAGE='life-loop-online-session';
const ENDPOINT='life-loop-server-url';
class LifeOnline {
 constructor(hooks){
  this.h=hooks;this.role=null;this.code='';this.token='';this.version=0;this.endpoint='';
  this.socket=null;this.busy=false;this.polling=false;this.timer=null;this.reconnectTimer=null;
  this.joined=false;this.guestName='';this.lastSyncAt=null;this.socketOpen=false;this.infoStatus='Not checked';this.lastResultId='';this.commandInFlight=null;this.unpublished=false;this.notice='Offline';
 }
 static serverBase(input){
  const raw=String(input??'').trim();
  if(!raw)throw Error('Enter your Looprd server address (for example api.server.country)');
  if(/[\\\s]/.test(raw))throw Error('Invalid server address');
  const hasScheme=/^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  const local=/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(raw);
  let u;
  try{u=new URL(hasScheme?raw:(local?'http://':'https://')+raw);}catch{throw Error('Invalid Looprd server address');}
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Enter only the server address, without credentials, query or fragment');
  if(u.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('Use HTTPS for a remote Looprd server');
  if(!u.hostname||u.hostname.includes('%'))throw Error('Invalid server hostname');
  // Accept the v0.5.2 stored component endpoint for seamless migration, but no arbitrary paths.
  if(!['/','/looprd/the-life-loop/v1','/looprd/the-life-loop/v1/'].includes(u.pathname))throw Error('Enter the base server FQDN only; /looprd/the-life-loop/v1 is automatic');
  return u.origin;
 }
 static suggestedServer(){
  const fromLink=new URLSearchParams(location.search||'').get('server');
  if(fromLink){try{return LifeOnline.serverBase(fromLink);}catch{return '';}}
  let saved=null;try{saved=localStorage.getItem(ENDPOINT);}catch{}
  if(saved){try{return LifeOnline.serverBase(saved);}catch{}}
  return '';
 }
 static validateEndpoint(input){return LifeOnline.serverBase(input)+'/looprd/the-life-loop/v1';}
 async api(payload){
  const response=await fetch(this.endpoint+'/session',{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!response.ok)throw Error('Looprd returned HTTP '+response.status);
  const data=await response.json();
  if(!data.ok)throw Error(data.error||'Session request rejected');
  return data;
 }
 persist(){
  try{sessionStorage.setItem(STORAGE,JSON.stringify({role:this.role,code:this.code,token:this.token,endpoint:this.endpoint}));localStorage.setItem(ENDPOINT,LifeOnline.serverBase(this.endpoint));}catch{ /* Browser storage can be disabled. Session still works while page stays open. */ }
 }
 forget(){try{sessionStorage.removeItem(STORAGE);}catch{}}
 connect(){
  this.socketOpen=false;if(this.socket){this.socket.onclose=null;this.socket.close();}
  clearTimeout(this.reconnectTimer);
  if(!this.role)return;
  const url=this.endpoint.replace(/^http/,'ws')+'/events';
  try{
   const socket=new WebSocket(url);this.socket=socket;
   socket.onopen=()=>{this.socketOpen=true;socket.send(JSON.stringify({subscribe:'pulses'}));this.notice='Connected';this.h.render();};
   socket.onmessage=event=>{try{const msg=JSON.parse(event.data);if(msg.resource==='pulses')this.sync();}catch{}};
   socket.onerror=()=>{this.socketOpen=false;this.notice='Reconnecting';this.h.render();};
   socket.onclose=()=>{if(this.socket!==socket||!this.role)return;this.socketOpen=false;this.notice='Reconnecting';this.h.render();this.reconnectTimer=setTimeout(()=>this.connect(),2500);};
  }catch(e){this.notice='WebSocket unavailable';this.h.toast(e.message,true);}
  clearInterval(this.timer);
  // Looprd events are best-effort; a status fetch also recovers missed updates.
  this.timer=setInterval(()=>this.sync(),5000);
 }
 disconnect(){
  this.role=null;this.code='';this.token='';this.version=0;this.joined=false;this.notice='Offline';this.busy=false;this.socketOpen=false;this.lastSyncAt=null;this.infoStatus='Not checked';
  clearInterval(this.timer);clearTimeout(this.reconnectTimer);
  if(this.socket){this.socket.onclose=null;this.socket.close();this.socket=null;}
  this.commandInFlight=null;this.unpublished=false;this.forget();this.h.render();
 }
 async host(url){
  this.disconnect();this.endpoint=LifeOnline.validateEndpoint(url);
  const initial=this.h.getGame().snapshot();
  const data=await this.api({op:'create',state:initial});
  Object.assign(this,{role:'host',code:data.code,token:data.token,version:data.version,joined:false,notice:'Waiting for friend'});
  this.persist();this.connect();this.h.render();return data;
 }
 async join(url,code,name){
  this.disconnect();this.endpoint=LifeOnline.validateEndpoint(url);
  const data=await this.api({op:'join',code:code.trim().toUpperCase().replace(/[-\s]/g,''),name});
  Object.assign(this,{role:'guest',code:data.code,token:data.token,version:data.version,joined:true,notice:'Connected'});
  this.h.setGame(data.state);this.persist();this.connect();this.h.render();return data;
 }
 async resume(){
  let saved;try{saved=JSON.parse(sessionStorage.getItem(STORAGE)||'null');}catch{return false;}
  if(!saved||!saved.role)return false;
  try{
   Object.assign(this,saved);this.endpoint=LifeOnline.validateEndpoint(saved.endpoint);
   const info=await this.api({op:'status',code:this.code,token:this.token});
   this.version=info.version;this.joined=info.joined;this.guestName=info.guestName;this.lastSyncAt=Date.now();
   this.h.setGame(info.state);this.connect();this.h.render();if(this.role==='host'){if(this.unpublished&&!info.pending&&!this.busy){try{await this.publish();this.unpublished=false;}catch{}}await this.process(info);}
   return true;
  }catch(err){this.disconnect();this.h.toast('Could not reconnect: '+err.message,true);return false;}
 }
 ownTurn(){
  if(!this.role)return true;
  const id=this.h.getGame().player.id;
  return (this.role==='host'&&id==='player')||(this.role==='guest'&&id==='friend');
 }
 async execute(type,arg,fn){
  if(this.busy)return {ok:false,message:'The previous action is still synchronizing.'};
  if(this.role&&!this.ownTurn())return {ok:false,message:'Your friend is taking their turn.'};
  if(this.role==='guest'){
   this.busy=true;
   try{
    await this.api({op:'send',code:this.code,token:this.token,version:this.version,command:{type,arg}});
    return {ok:true,message:'Sent to host · awaiting confirmation'};
   }catch(e){await this.sync();return {ok:false,message:e.message};}
   finally{this.busy=false;this.h.render();}
  }
  const result=fn();
  if(this.role==='host'&&result.ok){
   this.busy=true;
   try{await this.publish(null,result);this.unpublished=false;}catch(e){this.unpublished=true;this.h.toast('Network sync failed (will retry): '+e.message,true);}
   finally{this.busy=false;}
  }
  return result;
 }
 async publish(commandId=null,result={ok:true,message:'Updated'}){
  const info=await this.api({op:'publish',code:this.code,token:this.token,version:this.version,
   state:this.h.getGame().snapshot(),commandId,actionOk:result.ok,message:result.message});
  this.version=info.version;this.h.render();return info;
 }
 async process(info){
  if(this.busy||this.role!=='host')return;
  const g=this.h.getGame();
  if(info.guestName&&g.players.find(p=>p.id==='friend')?.name!==info.guestName&&!info.pending){
   g.players.find(p=>p.id==='friend').name=info.guestName;
   this.busy=true;try{await this.publish();}finally{this.busy=false;}
   return;
  }
  const cmd=info.pending;if(!cmd)return;
  this.busy=true;
  try{
   let result;
   if(this.commandInFlight?.id===cmd.id){result=this.commandInFlight.result;}
   else{
    result={ok:false,message:'It is not the friend’s turn'};
    if(g.player.id==='friend'){
     if(cmd.type==='travel')result=g.travel(cmd.arg);
     else if(cmd.type==='act')result=g.act(cmd.arg);
     else if(cmd.type==='choose')result=g.chooseEncounter(cmd.arg);
     else if(cmd.type==='endTurn')result=g.endTurn();
     else result={ok:false,message:'Unknown game action'};
    }
    this.commandInFlight={id:cmd.id,result};
   }
   // Preserve the applied command in memory until Looprd accepts the acknowledgement;
   // a lost HTTP reply must never cause a second local shift/expense.
   await this.publish(cmd.id,result);
   this.commandInFlight=null;
   this.h.toast('Friend: '+result.message,!result.ok);
  }catch(e){this.h.toast('Remote action failed: '+e.message,true);}
  finally{this.busy=false;this.h.render();}
 }
 async sync(){
  if(!this.role||this.polling)return;
  this.polling=true;
  try{
   const info=await this.api({op:'status',code:this.code,token:this.token});
   const previousStatus=[this.joined,this.guestName,this.notice].join('|');
   this.joined=info.joined;this.guestName=info.guestName;this.lastSyncAt=Date.now();this.notice=this.socketOpen?'Connected':'HTTP fallback active';
   if(previousStatus!==[this.joined,this.guestName,this.notice].join('|'))this.h.render();
   if(info.version>this.version){
    this.version=info.version;this.h.setGame(info.state);this.h.render();
   }
   if(this.role==='guest'&&info.lastResult?.commandId!==this.lastResultId&&info.lastResult){
    this.lastResultId=info.lastResult.commandId;
    this.h.toast(info.lastResult.message||'Turn updated',!info.lastResult.ok);
   }
   if(this.role==='host'){if(this.unpublished&&!info.pending&&!this.busy){try{await this.publish();this.unpublished=false;}catch{}}await this.process(info);}
  }catch(e){if(this.notice!=='Connection interrupted'){this.notice='Connection interrupted';this.h.render();}}
  finally{this.polling=false;}
 }
 async probe(){
  if(!this.endpoint)throw Error('Connect to a Looprd server first');
  let response;
  try{response=await fetch(this.endpoint+'/info',{method:'GET',mode:'cors',cache:'no-store'});}catch(e){this.infoStatus='Network / CORS failure';throw Error('Cannot reach the Looprd component info endpoint: '+e.message);}
  if(!response.ok){this.infoStatus='HTTP '+response.status;throw Error('Component info returned HTTP '+response.status+' — verify Looprd loaded looprd.yaml');}
  let data;try{data=await response.json();}catch{this.infoStatus='Invalid JSON';throw Error('Unexpected component info response');}
  if(data.protocol!=='the-life-loop/1'){this.infoStatus='Wrong component protocol';throw Error('The server responded, but the Life Loop component schema was not recognized');}
  this.infoStatus='Verified: the-life-loop/1';return 'Looprd component registered and responding';
 }
 indicator(){
  if(!this.role)return '◎ Online co-op';
  return `${this.role==='host'?'♟ Hosting':'♟ Joined'} · ${this.code} · ${this.notice}`;
 }
 inviteLink(){const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('join',this.code);url.searchParams.set('server',LifeOnline.serverBase(this.endpoint));return url.href;}
}
root.LifeOnline=LifeOnline;
})(typeof window!=='undefined'?window:globalThis);

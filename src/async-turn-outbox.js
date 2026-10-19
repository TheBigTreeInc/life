/* Durable, credential-free offline turn queue. Integration adapter only:
 * does NOT replace current hotseat/network UI or call a hard-coded Life URL.
 * A caller injects storage (e.g., localStorage) and an authenticated sender.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LifeAsyncTurnOutbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCHEMA='life.turn-outbox/v1';
 const TOKEN_FIELDS=new Set(['token','authorization','credential','grant','password','secret']);
 class TurnQueueError extends Error {constructor(message){super(message);this.name='TurnQueueError';}}
 function clone(value){return JSON.parse(JSON.stringify(value));}
 function assertString(value,name,max=128){
  if(typeof value!=='string'||!value.length||value.length>max)throw new TurnQueueError('Invalid '+name);
 }
 function commandAllowed(command){
  if(!command||typeof command!=='object'||Array.isArray(command)||Object.keys(command).some(k=>!['type','arg'].includes(k)))return false;
  if(command.type==='end_turn')return !Object.hasOwn(command,'arg');
  return ['travel','action'].includes(command.type)&&typeof command.arg==='string'&&command.arg.length>0&&command.arg.length<=100;
 }
 function verify(item){
  if(!item||item.schema!==SCHEMA||!['draft','ready','conflict'].includes(item.status))throw new TurnQueueError('Invalid queued turn');
  for(const key of ['matchId','engineRevision','baseDigest','idempotencyKey'])assertString(item[key],key);
  if(!/^[0-9a-f]{64}$/.test(item.baseDigest)||!Number.isSafeInteger(item.baseRevision)||item.baseRevision<0)throw new TurnQueueError('Invalid base checkpoint');
  if(!Array.isArray(item.commands)||item.commands.length>128||item.commands.some(c=>!commandAllowed(c)))throw new TurnQueueError('Invalid queued commands');
  if(item.commands.some((c,i)=>c.type==='end_turn'&&i!==item.commands.length-1))throw new TurnQueueError('Invalid command order');
  const ended=item.commands.length>0&&item.commands.at(-1).type==='end_turn';
  if((item.status==='draft'&&ended)||(item.status!=='draft'&&!ended))throw new TurnQueueError('Invalid turn completion');
  if(Object.keys(item).some(k=>TOKEN_FIELDS.has(k)))throw new TurnQueueError('Credentials must never be persisted');
 }
 class TurnOutbox {
  constructor(storage,key='life-async-pending-turn-v1'){
   if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.removeItem!=='function')throw new TypeError('Durable storage adapter required');
   this.storage=storage;this.key=key;this.inflight=false;
   const raw=storage.getItem(key);
   this.item=raw===null?null:JSON.parse(raw);
   if(this.item)verify(this.item);
  }
  current(){return this.item?clone(this.item):null;}
  _save(value){if(value)verify(value);if(value)this.storage.setItem(this.key,JSON.stringify(value));else this.storage.removeItem(this.key);this.item=value;return this.current();}
  begin(fields){
   if(!fields||Object.keys(fields).some(k=>!['matchId','engineRevision','baseRevision','baseDigest','idempotencyKey'].includes(k)))throw new TurnQueueError('Credentials or unsupported fields in queued turn');
   const {matchId,engineRevision,baseRevision,baseDigest,idempotencyKey}=fields;
   if(this.item)throw new TurnQueueError('A turn is already queued; resolve it before beginning another');
   return this._save({schema:SCHEMA,status:'draft',matchId,engineRevision,baseRevision,baseDigest,idempotencyKey,commands:[]});
  }
  append(command){
   if(!this.item||this.item.status!=='draft')throw new TurnQueueError('No editable turn');
   if(!commandAllowed(command)||command.type==='end_turn'||this.item.commands.length>=127)throw new TurnQueueError('Invalid local action');
   return this._save({...this.item,commands:[...this.item.commands,clone(command)]});
  }
  seal(){
   if(!this.item||this.item.status!=='draft')throw new TurnQueueError('No editable turn');
   return this._save({...this.item,commands:[...this.item.commands,{type:'end_turn'}],status:'ready'});
  }
  async deliver(send){
   if(this.inflight)throw new TurnQueueError('Submission already in progress');
   if(!this.item||this.item.status!=='ready')throw new TurnQueueError('No ready turn to submit');
   if(typeof send!=='function')throw new TypeError('Authenticated sender required');
   this.inflight=true;
   const queued=this.current();
   const body={schema:'looprd.game-play/v1',op:'commit_turn',matchId:queued.matchId,
    expectedRevision:queued.baseRevision,expectedDigest:queued.baseDigest,
    idempotencyKey:queued.idempotencyKey,commands:queued.commands};
   try{
    const result=await send(body);
    if(result&&result.ok===true&&result.result?.matchId===queued.matchId&&
     /^[0-9a-f]{64}$/.test(result.result?.resultDigest||'')&&
     Number.isSafeInteger(result.result?.revision)&&result.result.revision===queued.baseRevision+1){
     this._save(null);return {status:'committed',result};
    }
    if(result?.error?.code==='REVISION_CONFLICT'){
     this._save({...this.item,status:'conflict'});return {status:'conflict'};
    }
    return {status:'pending',result};
   }catch{return {status:'pending'};}
   finally{this.inflight=false;}
  }
  // Explicit, user-reviewed resolution only. No automatic rebase of money/time actions.
  discard(){if(this.inflight)throw new TurnQueueError('Submission in progress');this._save(null);}
 }
 return {TurnOutbox,TurnQueueError,SCHEMA};
});

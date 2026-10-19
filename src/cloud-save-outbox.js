/* Life cloud-save/v1: opt-in, credential-free offline End Turn queue.
 * Persist the full existing LifeGame save, never credentials or identities.
 * A caller supplies the authorized /cloud transport once online.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.LifeCloudSaveOutbox=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCHEMA='life.cloud-save/v1';
 const STORAGE_KEY='life-cloud-pending-turn-v1';
 class CloudQueueError extends Error{constructor(msg){super(msg);this.name='CloudQueueError';}}
 const copy=x=>JSON.parse(JSON.stringify(x));
 function check(value){
  if(!value||value.schema!==SCHEMA||!['ready','conflict'].includes(value.status))throw new CloudQueueError('Invalid cloud turn');
  if(typeof value.matchId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value.matchId))throw new CloudQueueError('Invalid match');
  if(!Number.isSafeInteger(value.expectedRevision)||value.expectedRevision<0)throw new CloudQueueError('Invalid revision');
  if(typeof value.expectedDigest!=='string'||!/^[a-f0-9]{64}$/.test(value.expectedDigest))throw new CloudQueueError('Invalid base checksum');
  if(typeof value.engineRevision!=='string'||!value.engineRevision||value.engineRevision.length>128)throw new CloudQueueError('Invalid engine revision');
  if(typeof value.idempotencyKey!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(value.idempotencyKey))throw new CloudQueueError('Invalid idempotency key');
  if(!value.state||typeof value.state!=='object'||Array.isArray(value.state))throw new CloudQueueError('Invalid save');
  if(JSON.stringify(value).length>360000)throw new CloudQueueError('Save too large for offline queue');
  const privateKeys=new Set(['token','credential','grant','session','authorization','secret','issuer','subject']);
  function containsPrivate(obj){return obj&&typeof obj==='object'&&Object.entries(obj).some(([k,v])=>privateKeys.has(k.toLowerCase())||containsPrivate(v));}
  if(containsPrivate(value))throw new CloudQueueError('Credentials must not be stored with save');
 }
 class CloudSaveOutbox{
  constructor(storage,key=STORAGE_KEY){
   if(!storage||['getItem','setItem','removeItem'].some(n=>typeof storage[n]!=='function'))throw new TypeError('Storage adapter required');
   this.storage=storage;this.key=key;this.inflight=false;
   const old=storage.getItem(key);this.item=old===null?null:JSON.parse(old);
   if(this.item)check(this.item);
  }
  pending(){return this.item?copy(this.item):null;}
  stage({matchId,expectedRevision,expectedDigest,engineRevision,idempotencyKey,state}){
   if(this.item)throw new CloudQueueError('Resolve existing offline turn first');
   const value={schema:SCHEMA,status:'ready',matchId,expectedRevision,expectedDigest,engineRevision,idempotencyKey,state:copy(state)};
   check(value);this.storage.setItem(this.key,JSON.stringify(value));this.item=value;return this.pending();
  }
  async deliver(send){
   if(this.inflight)throw new CloudQueueError('Send in progress');
   if(!this.item||this.item.status!=='ready')throw new CloudQueueError('No ready offline turn');
   if(typeof send!=='function')throw new TypeError('Authenticated sender required');
   this.inflight=true;
   const item=this.pending();
   try{
    const result=await send({schema:SCHEMA,op:'commit',matchId:item.matchId,
      expectedRevision:item.expectedRevision,expectedDigest:item.expectedDigest,engineRevision:item.engineRevision,idempotencyKey:item.idempotencyKey,state:item.state});
    if(result?.ok===true&&result.schema===SCHEMA&&result.matchId===item.matchId&&
       result.revision===item.expectedRevision+1&&/^[a-f0-9]{64}$/.test(result.stateDigest||'')){
      this.storage.removeItem(this.key);this.item=null;return {status:'committed',result};
    }
    if([409,403].includes(result?.status)||result?.error?.code==='REVISION_CONFLICT'){
      this.item={...item,status:'conflict'};this.storage.setItem(this.key,JSON.stringify(this.item));
      return {status:'conflict',result};
    }
    return {status:'pending',result};
   }catch{return {status:'pending'};}
   finally{this.inflight=false;}
  }
  discard(){if(this.inflight)throw new CloudQueueError('Send in progress');this.storage.removeItem(this.key);this.item=null;}
 }
 return {CloudSaveOutbox,CloudQueueError,SCHEMA,STORAGE_KEY};
});

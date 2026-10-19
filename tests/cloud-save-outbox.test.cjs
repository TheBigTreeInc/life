'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {CloudSaveOutbox}=require('../src/cloud-save-outbox.js');
function store(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,v),removeItem:k=>d.delete(k)};}
const state={players:[{id:'player'},{id:'friend'},{id:'jones'}],settings:{mode:'hotseat'},active:1,seed:123};
test('offline save persists across instance restart, without credentials',async()=>{
 const storage=store(),q=new CloudSaveOutbox(storage);
 q.stage({matchId:'match_001',expectedRevision:7,expectedDigest:'b'.repeat(64),engineRevision:'life-0.5.97',idempotencyKey:'turn-007-test',state});
 assert.equal(storage.getItem('life-cloud-pending-turn-v1').includes('authorization'),false);
 const resumed=new CloudSaveOutbox(storage);
 let attempt=0;
 const pending=await resumed.deliver(async body=>{attempt++; assert.equal(body.op,'commit');throw Error('Offline');});
 assert.equal(pending.status,'pending');assert.equal(attempt,1);
 const ok=await resumed.deliver(async body=>({ok:true,schema:body.schema,matchId:body.matchId,revision:8,stateDigest:'a'.repeat(64)}));
 assert.equal(ok.status,'committed');assert.equal(resumed.pending(),null);
});
test('conflict holds saved turn for manual resolution',async()=>{
 const q=new CloudSaveOutbox(store());q.stage({matchId:'match_001',expectedRevision:3,expectedDigest:'b'.repeat(64),engineRevision:'life-0.5.97',idempotencyKey:'turn-003-test',state});
 assert.equal((await q.deliver(async()=>({status:409}))).status,'conflict');
 assert.equal(q.pending().status,'conflict');q.discard();assert.equal(q.pending(),null);
});
test('credentials cannot enter the offline envelope',()=>{
 const q=new CloudSaveOutbox(store());
 assert.throws(()=>q.stage({matchId:'match_001',expectedRevision:1,expectedDigest:'b'.repeat(64),engineRevision:'life-0.5.97',idempotencyKey:'turn-001-test',state:{...state,settings:{mode:'hotseat',token:'test'}}}),/Invalid|Credential|Save/);
});

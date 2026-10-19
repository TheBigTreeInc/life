'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {TurnOutbox}=require('../src/async-turn-outbox.js');
const hash='a'.repeat(64);
function store(){const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
function draft(queue){queue.begin({matchId:'match-1',engineRevision:'life-0.5.96',baseRevision:7,baseDigest:hash,idempotencyKey:'unique-turn-1'});queue.append({type:'travel',arg:'bank'});queue.seal();}
test('offline turn survives reloading storage and retries exactly the same command and key',async()=>{
 const storage=store();const first=new TurnOutbox(storage);draft(first);
 const resumed=new TurnOutbox(storage);let count=0,received=[];
 assert.equal((await resumed.deliver(async b=>{count++;received.push(b);throw Error('offline');})).status,'pending');
 const next=new TurnOutbox(storage);
 assert.equal((await next.deliver(async b=>{count++;received.push(b);return {ok:true,result:{matchId:'match-1',revision:8,resultDigest:'b'.repeat(64)}};})).status,'committed');
 assert.equal(count,2);assert.deepEqual(received[0],received[1]);assert.equal(next.current(),null);
 assert.equal(JSON.stringify(received).includes('token'),false);
});
test('revision conflicts are retained for explicit resolution, never rebased',async()=>{
 const q=new TurnOutbox(store());draft(q);
 assert.equal((await q.deliver(async()=>({ok:false,error:{code:'REVISION_CONFLICT'}}))).status,'conflict');
 assert.equal(q.current().baseRevision,7);assert.equal(q.current().status,'conflict');
 await assert.rejects(()=>q.deliver(async()=>({ok:true,result:{matchId:'match-1',revision:8,resultDigest:'b'.repeat(64)}})),/No ready turn/);
 q.discard();assert.equal(q.current(),null);
});
test('bad storage fails before any action is submitted',async()=>{
 const q=new TurnOutbox({getItem:()=>null,setItem:()=>{throw Error('storage full')},removeItem:()=>{}});
 assert.throws(()=>draft(q),/storage full/);assert.equal(q.current(),null);
});
test('credential injection and malformed turn are rejected',()=>{
 const q=new TurnOutbox(store());
 assert.throws(()=>q.begin({matchId:'match',engineRevision:'life',baseRevision:0,baseDigest:'invalid',idempotencyKey:'request'}),/Invalid base checkpoint/);
 assert.throws(()=>q.begin({matchId:'match',engineRevision:'life',baseRevision:0,baseDigest:hash,idempotencyKey:'request',token:'bad'}),/Credentials/);
});

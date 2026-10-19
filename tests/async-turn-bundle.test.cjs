'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {replayTurn}=require('../src/async-turn-bundle.js');
const Game=require('../src/engine.js');const Replay=require('../src/async-replay.js');
function initial(){return new Game({mode:'hotseat',name:'Human',friend:'OpenClaw',seed:12345}).snapshot();}
test('turn bundle replays the exact Life engine, including seed and end of turn',()=>{
 const state=initial(),digest=Replay.digest(state),commands=[{type:'travel',arg:'bank'},{type:'end_turn'}];
 const result=replayTurn(state,commands,{expectedDigest:digest,expectedSeat:state.active});
 assert.equal(result.checkpoint.stateDigest,Replay.digest(result.checkpoint.state));
 assert.notEqual(result.checkpoint.stateDigest,digest);
 assert.equal(result.activeSeat,1);
 assert.deepEqual(replayTurn(state,commands,{expectedDigest:digest,expectedSeat:state.active}),result);
});
test('wrong seat, tampered checkpoint, unsupported commands and incomplete turns fail closed',()=>{
 const s=initial(),h=Replay.digest(s);
 assert.throws(()=>replayTurn(s,[{type:'end_turn'}],{expectedDigest:h,expectedSeat:1}),/Wrong active seat/);
 assert.throws(()=>replayTurn(s,[{type:'end_turn'}],{expectedDigest:'0'.repeat(64),expectedSeat:0}),/digest mismatch/);
 assert.throws(()=>replayTurn(s,[{type:'travel',arg:'bank'}],{expectedDigest:h,expectedSeat:0}),/finish with end_turn/);
 assert.throws(()=>replayTurn(s,[{type:'end_turn'},{type:'end_turn'}],{expectedSeat:0}),/last/);
 assert.throws(()=>replayTurn(s,[{type:'action',arg:'not-an-action'},{type:'end_turn'}],{expectedSeat:0}),/Illegal game action/);
});

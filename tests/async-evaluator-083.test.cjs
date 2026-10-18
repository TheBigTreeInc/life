'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const Game=require('../src/engine.js');
const replay=require('../src/async-replay.js');
const {evaluate,InvalidGameCommand}=require('../src/async-evaluator.js');
const initial=()=>new Game({mode:'sandbox',ruleset:'classic',seed:8341}).snapshot();
test('trusted headless action evaluates persisted state and is repeatable',()=>{
 const original=initial(),copy=JSON.stringify(original);
 const a=evaluate(original,{type:'end_turn'},{expectedDigest:replay.digest(original)});
 const b=evaluate(original,{type:'end_turn'},{expectedDigest:replay.digest(original)});
 assert.deepEqual(a,b);assert.equal(JSON.stringify(original),copy);
 assert.equal(a.checkpoint.stateDigest,replay.digest(a.checkpoint.state));
});
test('rejects incorrect digest, unknown actions and bad commands without mutation',()=>{
 const original=initial(),before=JSON.stringify(original);
 for(const command of [{type:'action',arg:'internal-cheat'},{type:'travel',arg:'__proto__'},{type:'end_turn',arg:'ignored'},{type:'unknown'}]){
  assert.throws(()=>evaluate(original,command),InvalidGameCommand);
 }
 assert.throws(()=>evaluate(original,{type:'end_turn'},{expectedDigest:'a'.repeat(64)}),/digest mismatch/);
 assert.equal(JSON.stringify(original),before);
});
test('isolated Node CLI matches in-process evaluation',()=>{
 const state=initial(),request={snapshot:state,command:{type:'end_turn'},expectedDigest:replay.digest(state)};
 const proc=spawnSync(process.execPath,['server/async_evaluator_cli.cjs'],{input:JSON.stringify(request),encoding:'utf8',cwd:require('node:path').join(__dirname,'..'),timeout:10000,maxBuffer:3*1024*1024});
 assert.equal(proc.status,0,proc.stderr);assert.deepEqual(JSON.parse(proc.stdout),evaluate(state,request.command,{expectedDigest:request.expectedDigest}));
});

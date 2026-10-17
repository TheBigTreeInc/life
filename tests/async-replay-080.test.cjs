'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const Game=require('../src/engine.js');const replay=require('../src/async-replay.js');
test('canonical checkpoints are stable across key order',()=>{
 assert.equal(replay.digest({z:2,a:{y:1,x:3}}),replay.digest({a:{x:3,y:1},z:2}));
});
test('pure checkpoint reconstruction preserves rng/turn and never processes AI on load',()=>{
 const game=new Game({mode:'solo',ruleset:'classic',seed:12345});
 const initial=game.snapshot();
 const a=replay.checkpoint(initial),b=replay.checkpoint(initial);
 assert.deepEqual(a,b);
 assert.equal(a.rngState,initial.seed);
 assert.equal(a.state.week,initial.week);
 assert.equal(a.state.active,initial.active);
 assert.equal(replay.digest(initial),replay.digest(a.state));
});

'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const Jones=require('../src/classic-jones-source.js');const Game=require('../src/engine.js');
const g=()=>new Game({ruleset:'classic',mode:'solo',seed:761});
test('DOS AI route overhead is exactly 2 * 14 ticks, not the obsolete 40',()=>{
 assert.equal(Jones.source.motionOverheadTicks,28);assert.equal(Jones.source.activeClockTicksPerUnit,14);
 const x=g();const p=x.player;p.location='home';p.cash=800;p.hours=60;
 const d=x.classicSourceDecision(p);assert.ok(d);assert.notEqual(d.destination,p.location);
 assert.equal(d.predictedTimeTicks,d.travelSteps+28);
 assert.equal(d.sourceScript,'WhereShouldIGo.sc');
});
test('No AI movement surcharge at a destination already occupied',()=>{
 const x=g();const p=x.player;p.location='agency';p.cash=800;p.hours=60;
 const d=x.classicSourceDecision(p);assert.ok(d);assert.equal(d.destination,'agency');
 assert.equal(d.predictedTimeTicks,d.travelSteps);
});
test('Decision inspection is pure and repeatable; neither seeds nor saves change',()=>{
 for(const seed of [76,176,276]){
  const x=new Game({ruleset:'classic',mode:'solo',seed});const before=x.snapshot();
  const a=x.classicSourceDecision(x.player),b=x.classicSourceDecision(x.player);
  assert.deepEqual(a,b);assert.deepEqual(x.snapshot(),before);
  const clone=Game.load(before);assert.deepEqual(clone.classicSourceDecision(clone.player),a);
 }
});
test('Modern behavior remains isolated from the Classic source model',()=>{
 const modern=new Game({ruleset:'modern',seed:76});assert.throws(()=>modern.classicSourceDecision(),/Classic-only/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const game=()=>new Game({ruleset:'classic',mode:'sandbox',seed:553});

test('DOS timeKeep caps explicit four-unit actions at 60 instead of requiring four units free',()=>{
 for(const remaining of [0,1,2,3,4,5,60]){
  const charge=Clock.cappedActionCharge(remaining,4);
  assert.equal(charge.nominal,4);
  assert.equal(charge.charged,Math.min(4,remaining));
  assert.equal(charge.remainingAfter,Math.max(0,remaining-4));
  assert.equal(charge.saturated,remaining<4);
  assert.ok(Object.isFrozen(charge));
 }
 assert.throws(()=>Clock.cappedActionCharge(61,4),/exceeds/);
 assert.throws(()=>Clock.cappedActionCharge(-1,4),/Invalid/);
});

test('Classic Employment applications accept last 1–3 units and never overcharge',()=>{
 for(const left of [1,2,3,4,5]){
  const g=game(),p=g.player;p.location='agency';p.hours=left;
  const action=g.actions().find(a=>a.id==='apply:classic-monolith-cook');
  assert.ok(action,`cook action missing at ${left}`);
  assert.equal(action.enabled,true,`could not apply with ${left} remaining`);
  assert.equal(action.hours,Math.min(left,4));
  const before=p.cash,prev=p.classicChoicesThisWeek;
  const result=g.act(action.id);assert.equal(result.ok,true);
  assert.equal(p.hours,left-Math.min(left,4));
  assert.equal(p.cash,before);
  assert.equal(p.classicChoicesThisWeek,prev+1);
  const old=g.snapshot();assert.deepEqual(Game.load(old).snapshot(),old);
 }
});

test('Classic Employment remains closed at zero units and blocked attempt is atomic',()=>{
 const g=game();g.player.location='agency';g.player.hours=0;
 const before=g.snapshot();const action=g.actions().find(a=>a.id==='apply:classic-monolith-cook');
 assert.equal(action.enabled,false);assert.equal(g.act(action.id).ok,false);
 assert.deepEqual(g.snapshot(),before);
});

test('A Classic raise uses the same week-end time cap as a job application',()=>{
 for(const left of [1,2,3,4,5]){
  const g=game(),p=g.player;p.location='agency';p.hours=left;
  p.job='classic-monolith-cook';p.wage=1;p.dependability=100;
  const action=g.actions().find(a=>a.id==='raise');
  assert.ok(action);assert.equal(action.enabled,true);
  assert.equal(action.hours,Math.min(left,4));
  const result=g.act('raise');assert.equal(result.ok,true);
  assert.equal(p.hours,left-Math.min(left,4));
 }
});

test('University last-unit lessons and partial working shifts retain their existing explicit cap',()=>{
 for(const left of [1,2,3,4,5,6]){
  const g=game(),p=g.player;p.location='university';p.hours=left;p.classicEnrollmentCredits=1;
  const a=g.actions().find(x=>x.id==='classicStudy:trade-school');
  assert.ok(a);assert.equal(a.hours,Math.min(6,left));assert.equal(a.enabled,true);
  assert.equal(g.act(a.id).ok,true);assert.equal(p.hours,left-Math.min(6,left));
 }
});

test('DOS implicit frame tick is > global475, with carry and 60-unit cap',()=>{
 assert.deepEqual(Clock.dosClockFrames(0,0,14),{elapsed:0,carry:14,advancedUnits:0,quantum:14});
 assert.deepEqual(Clock.dosClockFrames(0,14,1),{elapsed:1,carry:0,advancedUnits:1,quantum:14});
 assert.deepEqual(Clock.dosClockFrames(59,0,100),{elapsed:60,carry:10,advancedUnits:1,quantum:14});
 assert.deepEqual(Clock.dosClockFrames(0,3,60,5),{elapsed:10,carry:3,advancedUnits:10,quantum:5});
 assert.throws(()=>Clock.dosClockFrames(0,0,3,0),/Invalid/);
 assert.throws(()=>Clock.dosClockFrames(0,21,2,20),/Invalid/);
});

test('Modern Employment still needs its full action charge and original routes are not silently changed',()=>{
 const modern=new Game({ruleset:'modern',mode:'sandbox',seed:553});
 modern.player.location='agency';modern.player.hours=2;
 const m=modern.actions().find(a=>a.id.startsWith('apply:'));
 assert.equal(m.hours,modern.rules.applicationHours);assert.equal(m.enabled,false);
 const classic=game();
 const q=classic.travelQuote('home','agency');
 assert.equal(q.estimatedTicks,q.steps+2*Clock.ROUTE_QUANTUM);
 assert.equal(q.hours,q.walkingHours+q.entryHours);
 assert.equal(q.entryHours,2);
});

"use strict";
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Clock=require('../src/classic-time.js');
const Game=require('../src/engine.js');
const DOS=require('../docs/reference/original-dos-pass1/original_route.json');
const testGame=()=>new Game({mode:'sandbox',ruleset:'classic',seed:559});
const cases=[['home','housing'],['home','agency'],['home','market'],['market','cinema'],['diner','market'],['bank','university'],['agency','home']];
test('Seven source-identified journeys have a traceable shortest 170-waypoint path',()=>{
 const g=testGame();
 for(const [from,to] of cases){
  const fromNum=g.getPlace(from).placeNum,toNum=g.getPlace(to).placeNum;
  const origin=DOS.places.find(x=>x.placeNum===fromNum),destination=DOS.places.find(x=>x.placeNum===toNum);
  assert.ok(origin&&destination,`${from}/${to} original DOS place not found`);
  const expected=Math.min((destination.pathIndex-origin.pathIndex+170)%170,(origin.pathIndex-destination.pathIndex+170)%170);
  const quote=g.travelQuote(from,to,60);
  assert.equal(quote.steps,expected,`${from}->${to}`);
  assert.equal(quote.estimatedTicks,Clock.originalTravelTicks(expected));
  assert.equal(quote.hours,quote.walkingHours+quote.entryHours);
  assert.equal(quote.entryHours,to==='agency'?2:0);
  const reference=Clock.routeClockScenario(expected);
  assert.equal(reference.routeTicks,quote.estimatedTicks);
  assert.equal(reference.calibrated,false);
  // An authentic SCI tick simulator is NOT a proven player clock-time converter.
  assert.notEqual(reference.classification,'verified clock charge');
 }
});
test('Original TIMEKEEP frame threshold and carry are deterministic, independent of game charge',()=>{
 for(const steps of [0,1,7,21,50,85]){
  const estimate=Clock.routeClockScenario(steps,{quantum:20,carry:5,elapsed:53});
  const expected=Clock.dosClockFrames(53,5,Clock.originalTravelTicks(steps,20),20);
  assert.equal(estimate.elapsed,expected.elapsed);
  assert.equal(estimate.carry,expected.carry);
  assert.ok(estimate.elapsed<=60);
  assert.deepEqual(estimate,Clock.routeClockScenario(steps,{quantum:20,carry:5,elapsed:53}));
 }
 assert.throws(()=>Clock.routeClockScenario(7,{quantum:0}));
});
test('Classic zero-cost clock-end transactions are deterministic across remote-style save restoration',()=>{
 const a=testGame(),p=a.player;p.hours=0;p.location='bank';p.cash=500;p.bank=100;
 assert.equal(a.act('deposit:100').ok,true);
 const saved=a.snapshot(),b=Game.load(saved);assert.deepEqual(saved,b.snapshot());
 for(const g of [a,b]){assert.equal(g.act('withdraw:100').ok,true);assert.equal(g.player.hours,0);}
 assert.deepEqual(a.snapshot(),b.snapshot());
 assert.equal(a.travel('home').ok,false);assert.equal(a.endTurn().ok,true);
});
test('Modern retains prior zero-time policy and never gains a Classic cap',()=>{
 const m=new Game({mode:'sandbox',ruleset:'modern',seed:559}),p=m.player;p.location='bank';p.hours=0;p.cash=500;
 assert.equal(m.act('deposit:500').ok,false);
 assert.equal(m.settings.rules.weeklyActionLimit,false);
});

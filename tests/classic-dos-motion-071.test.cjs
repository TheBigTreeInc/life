'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{execFileSync}=require('node:child_process');
const Clock=require('../src/classic-time.js'),Game=require('../src/engine.js');
const make=()=>new Game({ruleset:'classic',mode:'sandbox',seed:714});
test('DOS active movement uses room1.sc global475=marble.moveSpeed * 14, not Main startup 20',()=>{
 assert.equal(Clock.ROUTE_QUANTUM,14);
 assert.equal(Clock.sourceMotionQuantum(1),14);
 assert.equal(Clock.sourceMotionQuantum(2),28);
 assert.equal(Clock.originalTravelTicks(0),0);
 assert.equal(Clock.originalTravelTicks(13),41);
 assert.equal(Clock.dosClockFrames(0,0,14).advancedUnits,0);
 assert.equal(Clock.dosClockFrames(0,14,1).advancedUnits,1);
 assert.equal(Clock.dosClockFrames(0,0,15).advancedUnits,1);
 assert.throws(()=>Clock.sourceMotionQuantum(0),/Invalid/);
 assert.throws(()=>Clock.routeClockBounds(3,{moveSpeed:101}),/Invalid/);
});
test('AI tick estimator bounds account for all 15 possible initial carries',()=>{
 for(const steps of [0,1,7,13,30,85])for(const speed of [1,2]){
  const bounds=Clock.routeClockBounds(steps,{moveSpeed:speed});
  const expectedTicks=steps===0?0:steps+2*Clock.sourceMotionQuantum(speed);
  assert.equal(bounds.aiEstimateTicks,expectedTicks);
  for(let carry=0;carry<=bounds.quantumTicks;carry++){
   const units=Clock.dosClockFrames(0,carry,expectedTicks,bounds.quantumTicks).advancedUnits;
   assert.ok(units>=bounds.minimumAdvances&&units<=bounds.maximumAdvances);
  }
  assert.equal(bounds.observedMovement,false);
  assert.equal(bounds.comparisonOnly,true);
 }
});
test('All Classic routes distinguish source estimator from playable cost, no gameplay mutations',()=>{
 const g=make(),before=g.snapshot(),routes=[];
 for(const from of g.places)for(const to of g.places){
  if(from.id===to.id)continue;
  const q=g.travelQuote(from.id,to.id,60),b=Clock.routeClockBounds(q.steps);
  assert.equal(q.estimatedTicks,b.aiEstimateTicks);
  assert.equal(q.sourceClockReference.minimum,b.minimumAdvances);
  assert.equal(q.sourceClockReference.maximum,b.maximumAdvances);
  assert.equal(q.sourceClockReference.observedMovement,false);
  assert.equal(q.hours,q.walkingHours+q.entryHours);
  routes.push(q);
 }
 assert.equal(routes.length,156);
 assert.deepEqual(g.snapshot(),before);
});
test('Actual Classic spending, homebound debt and Modern quote isolation survive timing correction',()=>{
 const g=make(),m=new Game({ruleset:'modern',mode:'sandbox',seed:714});
 const q=g.travelQuote('home','agency');assert.ok(q.ok);
 assert.equal(g.travel('agency').ok,true);assert.equal(g.player.hours,60-q.hours);
 assert.equal(m.travelQuote('home','agency').sourceClockReference,null);
 const saved=g.snapshot();assert.deepEqual(Game.load(saved).snapshot(),saved);
});
test('Shipped JSON timing audit is regenerated deterministically from the exact release source',()=>{
 const expected=JSON.parse(readFileSync('docs/reference/dos-route-clock-071.json','utf8'));
 const output=execFileSync(process.execPath,['tools/dos-time-audit.mjs','--json'],{encoding:'utf8'});
 const actual=JSON.parse(output);
 assert.deepEqual(actual,expected);
 assert.equal(actual.version,require('../package.json').version);
 assert.deepEqual(actual.coverage,{venues:13,directedLegs:156,legsOutsideSourceAiFrameEstimate:46,sourceEstimateNotPlayerCharge:true});
 assert.equal(actual.constants.defaultQuantum,14);
});

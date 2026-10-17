'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const make=(seed=321)=>new Game({ruleset:'classic',mode:'solo',seed});
function wellFunded(g){const p=g.player;p.cash=1700;p.groceries=1;p.fed=true;p.energy=95;p.clothing={casual:9,formal:9,business:9};p.classicRentDueWeek=g.week+4;p.hours=60;return p;}

test('Unemployment recovery chooses a qualified guaranteed original occupation after persistent search failure',()=>{
 const g=make(),p=wellFunded(g);p.classicUnemployedWeeks=3;p.classicJobSearchFailures=2;p.experience=90;p.dependability=95;
 const source=g.classicRecoveryOpening(p);assert.ok(source);
 assert.equal(source.originalOccupationIndex,44);assert.equal(g.jobReasons(p,source).length,0);
 p.location='agency';const d=g.classicSourceDecision(p);
 assert.equal(d.ruleId,1);assert.equal(d.actionCode,`apply:${source.id}`);
 assert.equal(d.placeNum,6);
 assert.equal(g.classicHiringChance(p,source),100);
});

test('Source career decision is pure and selects legitimate raise branch 28 without lowering contracted wage',()=>{
 const g=make(),p=wellFunded(g);g.week=5;p.classicRentDueWeek=9;p.job='classic-monolith-cook';p.wage=2;p.workSessions=4;p.dependability=80;
 const initial=g.snapshot();const career=g.classicCareerDecision(p);
 assert.equal(career.id,28);assert.equal(career.action,'raise');
 assert.deepEqual(g.snapshot(),initial);
 const d=g.classicSourceDecision(p);
 assert.equal(d.ruleId,28);assert.equal(d.destination,'agency');
 assert.equal(d.actionCode,'raise');
});

test('Source branch 29 uses qualified promotion that improves the current contract',()=>{
 const g=make(),p=wellFunded(g);p.job='classic-monolith-cook';p.wage=3;p.workSessions=4;p.experience=95;p.dependability=95;
 p.classicDegrees=D.classicDegrees.map(d=>d.id);p.raiseWeek=g.week;p.classicRaises=2;
 const signal=g.classicCareerDecision(p);
 assert.ok(signal,'career candidate exists');assert.equal(signal.id,29);
 assert.ok(signal.action.startsWith('apply:'));
 const upgrade=D.classicJobs.find(j=>signal.action===`apply:${j.id}`);
 assert.ok(upgrade);assert.ok(g.offeredWage(upgrade)>p.wage);
 assert.deepEqual(g.jobReasons(p,upgrade),[]);
});

test('Branch 20 renews expiring formal uniform BEFORE discretionary university courses',()=>{
 const g=make(),p=wellFunded(g);p.job='classic-blacks-assistant-manager';p.wage=15;p.workSessions=6;p.classicRaises=50;p.classicDegrees=['junior-college'];p.experience=95;p.dependability=95;
 p.clothing={casual:2,formal:2,business:0};p.cash=850;p.classicRentDueWeek=g.week+4;
 const d=g.classicSourceDecision(p);
 assert.equal(d.ruleId,20);assert.ok(d.actionCode.startsWith('clothes:formal:'));
 assert.equal(d.placeNum,g.getPlace(d.destination).placeNum);
});

test('Progress toward a source degree produces education branch 44 with a feasible action',()=>{
 const g=make(),p=wellFunded(g);g.week=2;
 p.job='classic-monolith-cook';p.wage=200;p.raiseWeek=g.week;p.workSessions=4;p.experience=10;p.dependability=30;
 p.classicEnrolled=['junior-college'];p.classicProgress={'junior-college':1};p.classicRelaxation=20;
 const decision=g.classicCareerDecision(p);
 assert.equal(decision.id,44);assert.ok(decision.action.startsWith('classicStudy:'));
 const snapshot=g.snapshot();g.classicCareerDecision(p);assert.deepEqual(g.snapshot(),snapshot,'source career lookups never consume RNG');
});

test('Time guard blocks source career visits that cannot afford travel plus the required action',()=>{
 const g=make(),p=wellFunded(g);p.job='classic-monolith-cook';p.wage=2;p.workSessions=4;p.dependability=70;p.location='home';p.hours=2;
 const branch=g.classicSourceDecision(p);
 assert.ok(!branch||branch.actionCode!=='raise','4h raise cannot be planned into 2h');
});

test('Rejected applications update explicit failed-search status; successful hiring clears it',()=>{
 const g=make(),p=wellFunded(g);p.location='agency';
 g.rand=()=>0.99999;
 const candidate=D.classicJobs.find(x=>x.id==='classic-monolith-clerk');
 assert.ok(candidate);assert.equal(g.actions().find(x=>x.id==='apply:'+candidate.id).enabled,true);
 const no=g.act('apply:'+candidate.id);assert.equal(no.ok,true);
 assert.equal(p.classicJobSearchFailures,1);assert.equal(p.classicRejectedOpenings[candidate.id],g.week);
 p.classicUnemployedWeeks=3;
 const cook=D.classicJobs.find(x=>x.originalOccupationIndex===44);assert.ok(cook);
 assert.equal(g.act('apply:'+cook.id).ok,true);
 assert.equal(p.classicJobSearchFailures,0);assert.equal(p.classicUnemployedWeeks,0);
});

test('Unemployment counters advance weekly, migrate old saves safely and roundtrip deterministically',()=>{
 const g=make(),p=g.player;g.newWeek();assert.equal(p.classicUnemployedWeeks,1);
 const saved=g.snapshot();delete saved.players[0].classicUnemployedWeeks;delete saved.players[0].classicJobSearchFailures;
 const legacy=Game.load(saved);assert.equal(legacy.players[0].classicUnemployedWeeks,0);assert.equal(legacy.players[0].classicJobSearchFailures,0);
 const actual=g.snapshot(),restored=Game.load(actual);assert.deepEqual(restored.snapshot(),actual);
});

test('Modern remains excluded from new Classic career/unemployment behavior',()=>{
 const g=new Game({ruleset:'modern',seed:5});
 for(const key of ['classicCareerDecision','classicRecoveryOpening'])assert.throws(()=>g[key](),/Classic-only/);
 g.newWeek();assert.equal(g.player.classicUnemployedWeeks,0);
});

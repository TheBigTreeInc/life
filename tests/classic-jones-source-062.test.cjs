'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Jones=require('../src/classic-jones-source.js');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const classic=(mode='sandbox',seed=620)=>new Game({ruleset:'classic',mode,seed});

test('DOS #28 exactly gates two raises, minDepend+10+5*n, and contracted wage improvement',()=>{
 assert.equal(Jones.raiseEligible(0,19,10,8,4),false);
 assert.equal(Jones.raiseEligible(0,20,10,8,4),true);
 assert.equal(Jones.raiseEligible(1,24,10,8,4),false);
 assert.equal(Jones.raiseEligible(1,25,10,8,4),true);
 assert.equal(Jones.raiseEligible(2,90,10,100,4),false);
 assert.equal(Jones.raiseEligible(1,35,10,8,8),false);
 assert.throws(()=>Jones.raiseEligible(-1,20,10,8,4));
});

test('Classic raise action matches #28 gates, including twice-raised former saves',()=>{
 const g=classic(),p=g.player;p.location='agency';p.job='classic-monolith-cook';p.wage=1;p.hours=60;p.dependability=19;
 const action=()=>g.actions().find(x=>x.id==='raise');
 assert.equal(action().enabled,false);
 p.dependability=20;assert.equal(action().enabled,true);
 p.classicRaises=1;p.dependability=24;assert.equal(action().enabled,false);
 p.dependability=25;assert.equal(action().enabled,true);
 p.classicRaises=2;p.dependability=99;assert.equal(action().enabled,false);
 const old=Game.load(g.snapshot());assert.equal(old.actions().find(a=>a.id==='raise').enabled,false);
 const modern=new Game({ruleset:'modern',mode:'sandbox',seed:620});
 assert.equal(modern.settings.ruleset,'modern');
});

test('DOS #29 only promotes after reaching the job-linked experience and dependability thresholds',()=>{
 assert.equal(Jones.promotionEligible(10,10,19,10,10,4),false);
 assert.equal(Jones.promotionEligible(9,10,50,10,10,4),false);
 assert.equal(Jones.promotionEligible(10,10,20,10,10,4),true);
 assert.equal(Jones.promotionEligible(90,80,99,10,10,4),false);
 assert.equal(Jones.promotionEligible(10,10,20,10,4,4),false);
});

test('DOS #30 estimated shifts uses the smaller relevant experience or reliability gap',()=>{
 assert.equal(Jones.reliabilityGap(8,14,13,10),6);
 assert.equal(Jones.reliabilityGap(13,14,13,10),1);
 assert.equal(Jones.reliabilityGap(14,14,20,10),1);
 assert.throws(()=>Jones.reliabilityGap(5,20,-1,10));
});

test('DOS #32/#37 rest from relaxation, not from happiness or energy',()=>{
 assert.equal(Jones.restBranch(10),32);
 assert.equal(Jones.restBranch(11),37);
 assert.equal(Jones.restBranch(16),37);
 assert.equal(Jones.restBranch(17),null);
 assert.equal(Jones.restBranch(30),null);
 assert.throws(()=>Jones.restBranch(9));
 const g=classic(),p=g.player;p.job='classic-monolith-cook';p.wage=5;p.experience=9;p.dependability=20;
 p.workSessions=8;p.raiseWeek=g.week;p.cash=500;p.groceries=1;p.fed=true;p.classicRentDueWeek=5;
 p.classicRaises=2;p.classicRelaxation=10;
 assert.equal(g.classicCareerDecision(p)?.id,32);
 p.classicRelaxation=16;assert.equal(g.classicCareerDecision(p)?.id,37);
 p.classicRelaxation=17;assert.notEqual(g.classicCareerDecision(p)?.id,37);
});

test('DOS #44 has 11-degree ceiling and an active-course or $400 liquidity threshold',()=>{
 assert.equal(Jones.educationCandidate(11,1,10000),false);
 assert.equal(Jones.educationCandidate(0,0,400),false);
 assert.equal(Jones.educationCandidate(0,0,401),true);
 assert.equal(Jones.educationCandidate(0,1,0),true);
});

test('Original no-food branch #27 carries correct source number and place',()=>{
 const g=classic(),p=g.player;p.job='classic-monolith-cook';p.wage=15;p.classicRaises=2;
 p.cash=1500;p.groceries=0;p.fed=false;p.location='cinema';p.clothing.casual=8;
 const d=g.classicSourceDecision(p);assert.equal(d.ruleId,27);assert.equal(d.placeNum,10); // DOS WhereShouldIGo.sc global498=10 without a fridge
 assert.equal(d.actionCode,'classicMeal:5');assert.equal(d.sourceScript,'WhereShouldIGo.sc');
 assert.equal(Jones.source.mapped[27],'food purchase');
});

test('seeded Jones simulations are deterministic across restored snapshots',()=>{
 for(const seed of [62,162,262,362]){
  const game=classic('solo',seed),cloned=Game.load(game.snapshot());
  for(let i=0;i<12;i++){
   game.endTurn();cloned.endTurn();
   assert.deepEqual(game.snapshot(),cloned.snapshot(),`seed ${seed}, week ${i}`);
  }
 }
});

test('legacy snapshots with pre-v0.5.62 raises remain valid, with source cap applied prospectively',()=>{
 const g=classic(),saved=g.snapshot(),p=saved.players[0];
 p.job='classic-monolith-cook';p.classicRaises=12;p.wage=1;p.location='agency';p.dependability=90;
 const imported=Game.load(saved);
 assert.equal(imported.player.classicRaises,12);
 assert.equal(imported.actions().find(a=>a.id==='raise').enabled,false);
 assert.equal(imported.player.wage,1);
 assert.deepEqual(imported.snapshot().players[0].classicRaises,12);
});


test('two-check hardship counter remains save-compatible during long cooldowns',()=>{
 const g=classic(),p=g.player;
 p.cash=0;p.bank=0;p.owned=[];p.job=null;p.clothing={casual:0,formal:0,business:0};
 p.classicHardshipWeeks=2;p.classicReliefWeek=g.week;
 for(let n=0;n<5;n++){
  g.classicEmergencyRelief(p,[]);
  assert.equal(p.classicHardshipWeeks,2);
  assert.deepEqual(Game.load(g.snapshot()).snapshot(),g.snapshot());
 }
});

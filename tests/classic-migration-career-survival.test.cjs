'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../src/data.js');
const Game=require('../src/engine.js');
const make=(seed=128)=>new Game({ruleset:'classic',mode:'solo',seed});

test('All 11 degrees use the DOS numeric identity and source prerequisite graph',()=>{
 assert.equal(D.classicDegrees.length,11);
 const ids=new Map(D.classicDegrees.map(d=>[d.originalDegreeId,d]));
 assert.deepEqual([...ids.keys()].sort((a,b)=>a-b),Array.from({length:11},(_,i)=>i+10));
 for(const ref of D.original.degrees){
  const degree=ids.get(Number(ref.degreeId));
  assert.ok(degree);
  assert.equal(degree.originalRequiredDegreeId,Number(ref.requiredDegreeId));
  assert.deepEqual(degree.requires,Number(ref.requiredDegreeId)?[ids.get(Number(ref.requiredDegreeId)).id]:[]);
 }
});

test('All 37 Classic jobs use original experience/dependability and diploma IDs',()=>{
 const byNum=new Map(D.original.degrees.map(d=>[Number(d.degreeId),D.classicDegrees.find(x=>x.originalDegreeId===Number(d.degreeId)).id]));
 for(const job of D.classicJobs){
  assert.equal(job.experience,job.originalRequiredExperience,job.id);
  assert.equal(job.dependability,job.originalRequiredDependability,job.id);
  assert.deepEqual(job.degrees,job.requiredDegreeIds.map(x=>byNum.get(x)));
  assert.equal(job.entryGuaranteed,job.originalOccupationIndex===44);
 }
 assert.equal(D.classicJobs.find(j=>j.originalJobNum===11).experience,20);
 assert.equal(D.classicJobs.find(j=>j.originalJobNum===18).experience,30);
 assert.equal(D.classicJobs.find(j=>j.originalJobNum===26).experience,20);
 assert.equal(D.classicJobs.find(j=>j.originalJobNum===36).experience,20);
});

test('Hiring odds are pure, qualification-gated, and success uses integer 1..100 roll',()=>{
 const g=make(188),p=g.player;
 const cook=D.classicJobs.find(j=>j.originalJobNum===4);
 const clerk=D.classicJobs.find(j=>j.originalJobNum===5);
 const manager=D.classicJobs.find(j=>j.originalJobNum===7);
 assert.equal(g.classicHiringChance(p,cook),100);
 assert.equal(g.classicHiringChance(p,clerk),g.classicLuck(p));
 assert.equal(g.classicHiringChance(p,manager),0);
 const seed=g.seed;g.classicHiringChance(p,clerk);assert.equal(seed,g.seed);
 let randomCount=0;
 g.rand=()=>{randomCount++;return 0.42;};
 assert.equal(g.classicHiringRoll(p,cook),true);assert.equal(randomCount,0,'guaranteed hire does not consume seed');
 const chance=g.classicHiringChance(p,clerk);
 g.rand=()=>{randomCount++;return (chance-1)/100;};
 assert.equal(g.classicHiringRoll(p,clerk),true,'roll equal threshold passes');
 g.rand=()=>{randomCount++;return chance/100;};
 assert.equal(g.classicHiringRoll(p,clerk),false,'roll above threshold fails');
 assert.equal(g.classicHiringRoll(p,manager),false,'unqualified job does not draw RNG');
});

test('Career plan is deterministic and points to qualified original study paths',()=>{
 const g=make(),p=g.player,save=g.snapshot();
 const plan=g.classicCareerPlan(p);
 assert.ok(plan.courses.length===2);
 for(const item of plan.courses){
  const degree=D.classicDegrees.find(d=>d.id===item.degreeId);
  assert.equal(item.originalDegreeId,degree.originalDegreeId);
  assert.ok(g.classicDegreeAvailable(p,degree));
  assert.ok(item.unlocks.every(opp=>D.classicJobs.some(j=>j.originalJobNum===opp.jobNum&&j.degrees.includes(degree.id))));
 }
 assert.equal(g.seed,save.seed);
 assert.deepEqual(g.snapshot(),save,'pure career lookup');
 p.classicDegrees=['trade-school'];
 assert.ok(g.classicCareerPlan(p).courses.some(x=>x.originalDegreeId===11));
 assert.ok(g.classicCareerPlan(p).courses.some(x=>x.originalDegreeId===12));
});

test('Survival budget includes cash, withdrawable savings, food, rent and wardrobe expiration',()=>{
 const g=make(),p=g.player;
 p.cash=50;p.bank=255;p.classicRentDueWeek=g.week;p.groceries=0;
 p.job='classic-monolith-cook';p.wage=5;p.clothing={casual:1,formal:0,business:0};
 const snapshot=g.snapshot();
 const budget=g.classicSurvivalBudget(p);
 assert.equal(budget.withdrawable,200);
 assert.equal(budget.liquidity,250);
 assert.equal(budget.rentReserve,325);
 assert.equal(budget.foodReserve,g.classicFoodPrice(1));
 assert.ok(budget.uniformReserve>0);
 assert.ok(budget.immediateBills>p.cash);
 assert.ok(budget.projectedGap>0);
 assert.deepEqual(g.snapshot(),snapshot,'budget calculations must never spend RNG or mutate save');
 p.job=null;p.clothing.casual=6;p.fed=true;p.groceries=1;
 const noCost=g.classicSurvivalBudget(p);
 assert.equal(noCost.uniformReserve,0);
 assert.equal(noCost.twoWeekFood,0);
});

test('Classic AI graduates from starter wage via a seed-replayable career ladder',()=>{
 const a=make(4),b=make(4);
 for(let week=0;week<20;week++){a.endTurn();b.endTurn();}
 const rival=a.players.find(x=>x.isAI);
 assert.ok(rival.job);
 assert.ok(rival.experience>10);
 assert.ok(rival.wage>5,'AI should not stay trapped at the initial $5 wage');
 assert.deepEqual(a.snapshot(),b.snapshot(),'same seed makes identical week-by-week simulation');
 assert.deepEqual(Game.load(a.snapshot()).snapshot(),a.snapshot(),'save restores deterministic state');
});

test('Modern economy, career, and hiring isolation remain untouched',()=>{
 const g=new Game({ruleset:'modern',seed:128});
 assert.equal(g.jobs,D.jobs);
 for(const method of ['classicSurvivalBudget','classicCareerPlan','classicHiringChance'])
  assert.throws(()=>g[method](g.player,D.classicJobs[0]),/Classic/);
});

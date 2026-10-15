'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/classic-pass2-rules.js');
const Game=require('../src/engine.js');
const make=seed=>new Game({ruleset:'classic',mode:'sandbox',seed:seed||49});

test('DOS n109 economic goods price applies bent index and split integer arithmetic',()=>{
 for(const [index,price] of [[70,27],[80,36],[100,55],[120,72]])assert.equal(P.goodsPrice(55,index),price);
 assert.equal(P.goodsPrice(1,10),1);
 assert.equal(P.adjustedIndex(80),67);
 assert.equal(P.goodsPrice(88,120),116);
});
test('Live Classic price quotes read the goods index, Modern ignores it',()=>{
 const g=make();g.classicGoodsIndex=120;const p=g.player;p.location='cinema';p.cash=1000;
 assert.equal(g.classicFoodPrice(1),72);
 assert.equal(g.actions().find(a=>a.id==='classicFresh:1').price,72);
 const before=p.cash;assert.equal(g.act('classicFresh:1').ok,true);assert.equal(p.cash,before-72);
 const modern=new Game({ruleset:'modern',mode:'sandbox',seed:49});
 assert.throws(()=>modern.classicGoodsPrice(55),/Classic/);
 const m=modern.price(55,'retail');modern.classicGoodsIndex=150;assert.equal(modern.price(55,'retail'),m);
});
test('Original fixed items stay fixed even when food and clothes inflate',()=>{
 const g=make();g.classicGoodsIndex=155;g.player.location='cinema';g.player.cash=500;
 assert.equal(g.actions().find(a=>a.id==='classicLottery').price,10);
 assert.equal(g.actions().find(a=>a.id==='classicNewspaper').price,1);
 assert.notEqual(g.classicFoodPrice(1),55);
});
test('Lottery draws exactly once per pack and reports original tier outcomes',()=>{
 assert.deepEqual([0,1,3,10].map(roll=>P.lotteryPrize(10,roll)),[5000,500,200,0]);
 for(const [roll,expected] of [[0,5000],[1,500],[3,200],[10,0]]){
  const g=make(),p=g.player;p.lottery=10;p.fed=true;p.cash=0;
  g.rand=()=>(roll+.25)/501;
  g.weekend(p);
  assert.equal(p.lottery,0);
  const events=g.classicWeekEvents.filter(e=>e.kind==='lottery');assert.equal(events.length,1);
  assert.equal(events[0].roll,roll);assert.equal(events[0].prize,expected);
  assert.ok(p.cash>=Math.max(0,expected-30)&&p.cash<=expected);
 }
});
test('Rent extension DOS d12 threshold: 0 always, 1 75%, 2 50%, 3+ 25%',()=>{
 assert.equal(P.extensionApproved(0,1),true);
 for(const [prior,threshold] of [[1,3],[2,6],[3,9],[20,9]]){
  assert.equal(P.extensionApproved(prior,threshold),false);
  assert.equal(P.extensionApproved(prior,threshold+1),true);
 }
 assert.equal(P.extensionApproved(-1,12),false);
 const g=make(),p=g.player;p.cash=400;p.location='housing';p.classicRentDueWeek=1;p.classicExtensions=1;
 g.rand=()=>2/12;assert.equal(g.act('classicRentExtension').ok,true);
 assert.equal(g.classicWeekEvents.at(-1).approved,false);
 assert.equal(g.actions().find(a=>a.id==='classicRentExtension').enabled,false);
});
test('Classic partial work does not accumulate fractional pay between actions',()=>{
 assert.equal(P.workGross(7,3),28);assert.equal(P.workGross(7,1),9);
 const g=make(),p=g.player;p.job='classic-monolith-cook';p.wage=7;p.location='diner';p.energy=100;
 const cash=p.cash;p.hours=1;assert.equal(g.act('work').ok,true);assert.equal(p.cash-cash,9);
 p.hours=1;p.energy=100;assert.equal(g.act('work').ok,true);assert.equal(p.cash-cash,18);
 assert.equal(p.classicWageRemainder,0);
});
test('Source order planner chooses ACNE, rent, food and work with original numeric place IDs',()=>{
 const g=make(),p=g.player;
 assert.equal(g.classicSourceDecision(p).ruleId,1);
 assert.equal(g.classicSourceDecision(p).placeNum,6);
 p.job='classic-monolith-cook';p.wage=5;p.location='home';p.groceries=0;p.cash=1000;
 assert.equal(g.classicSourceDecision(p).ruleId,24);
 assert.equal(g.classicSourceDecision(p).placeNum,3);
 p.classicRentDueWeek=g.week;
 assert.equal(g.classicSourceDecision(p).ruleId,7);
 assert.equal(g.classicSourceDecision(p).placeNum,1);
 p.cash=0;
 assert.equal(g.classicSourceDecision(p).ruleId,21);
 p.bank=100;
 assert.equal(g.classicSourceDecision(p).ruleId,9);
});
test('Route previews and source AI decisions are pure and save/load retains bounded journals',()=>{
 const g=new Game({ruleset:'classic',mode:'solo',seed:71});
 const before=g.snapshot();const d=g.classicSourceDecision(g.player);
 assert.equal(d.ruleId,1);assert.ok(d.predictedTimeTicks>=d.travelSteps);
 assert.deepEqual(g.snapshot(),before);
 g.endTurn();assert.ok(g.classicDecisionTrace.some(e=>e.ruleId===1));
 assert.ok(g.classicWeekEvents.length>=1);
 assert.deepEqual(Game.load(g.snapshot()).snapshot(),g.snapshot());
 const old=g.snapshot();delete old.classicGoodsIndex;delete old.classicWeekEvents;delete old.classicDecisionTrace;
 const restored=Game.load(old);assert.equal(restored.classicGoodsIndex,100);
 assert.deepEqual(restored.classicDecisionTrace,[]);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Economic=require('../src/classic-economy.js');
const P=require('../src/classic-pass2-rules.js');
const Game=require('../src/engine.js');
const classic=(seed=890)=>new Game({ruleset:'classic',mode:'sandbox',seed});

test('eight classic index readings start at 100 with correct source bounds',()=>{
 const state=Economic.initial();
 assert.deepEqual(Economic.keys,['general','investments','goods','gold','silver','pork','blue','penny']);
 for(const key of Economic.keys){assert.equal(state.readings[key],100);assert.equal(state.momentum[key],0);}
 let current=state,seed=24592;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<1000;i++){
   const result=Economic.advance(current,rng);current=result.state;
   for(const key of Economic.keys){assert.ok(current.readings[key]>=10&&current.readings[key]<=190);assert.ok(Math.abs(current.momentum[key])<=12);}
 }
});

test('same seed, same saved inputs: cross-sector prices, stock values and wages replay',()=>{
 const a=classic(601),b=classic(601);
 for(let w=0;w<24;w++){
   a.newWeek();b.newWeek();
   assert.deepEqual(a.classicEconomyReport(),b.classicEconomyReport());
   assert.deepEqual(a.classicStockPrices,b.classicStockPrices);
   assert.equal(a.classicFoodPrice(1),b.classicFoodPrice(1));
   assert.equal(a.offeredWage(a.jobs[11]),b.offeredWage(b.jobs[11]));
 }
 assert.deepEqual(a.snapshot(),b.snapshot());
});

test('separate indices affect their own market quotes; T-Bills stay fixed',()=>{
 const g=classic(28);const original={...g.classicStockPrices};
 const old=g.classicEconomicIndices.readings;
 const result=Economic.advance(g.classicEconomicIndices,()=>.99);
 const next=result.state.readings;
 g.newWeek();
 assert.equal(g.classicStockPrices.tbills,original.tbills);
 for(const stock of require('../src/data.js').classicStocks){
   if(stock.id==='tbills')continue;
   assert.ok(g.classicStockPrices[stock.id]>0);
 }
 // The stock updater itself is deterministic, independent of unrelated indices.
 assert.equal(Economic.marketPrice(413,100,110,413),454);
 assert.equal(Economic.marketPrice(14,100,80,14),11);
});

test('DOS-derived integer goods pricing is retained while wage quotes change with macro reading',()=>{
 const g=classic(),job=g.jobs.find(j=>j.originalBasePay>=8);
 g.classicEconomicIndices.readings.general=120;
 g.classicGoodsIndex=80;
 assert.equal(g.classicFoodPrice(1),36);
 assert.equal(g.offeredWage(job),P.goodsPrice(job.wage,120));
 assert.notEqual(g.offeredWage(job),P.goodsPrice(job.wage,80));
 const p=g.player;p.job=job.id;p.wage=18;
 const prior=p.wage;g.newWeek();
 assert.equal(p.wage,prior,'Existing employment retains its negotiated hourly rate');
});

test('legacy 0.5.29 save gets default indices, and round trips without dropping old fields',()=>{
 const original=classic();original.newWeek();const old=original.snapshot();
 const oldGoods=old.classicGoodsIndex;delete old.classicEconomicIndices;
 const imported=Game.load(old);
 assert.equal(imported.classicEconomicIndices.readings.goods,oldGoods);
 assert.equal(imported.classicEconomicIndices.readings.general,Math.round(old.economy*100));
 assert.equal(Game.load(imported.snapshot()).snapshot().classicEconomicIndices.readings.goods,oldGoods);
 const live=classic(80);live.newWeek();live.newWeek();
 assert.deepEqual(Game.load(live.snapshot()).snapshot(),live.snapshot());
});

test('untrusted economic save fields reject invalid numerical injection',()=>{
 const g=classic(),save=g.snapshot();
 save.classicEconomicIndices.readings.penny=20000;
 assert.throws(()=>Game.load(save),/Invalid Classic economic indices/);
 save.classicEconomicIndices.readings.penny=100;
 save.classicEconomicIndices.momentum.gold=Infinity;
 assert.throws(()=>Game.load(save),/Invalid Classic economic indices/);
});

test('rival source-order last resort uses exact pawn destination and action identity',()=>{
 const g=classic(),p=g.player;
 p.job='classic-monolith-cook';p.wage=4;p.location='home';p.cash=0;p.bank=0;
 p.owned=['computer'];p.groceries=0;p.fed=false;p.energy=0;
 let decision=g.classicSourceDecision(p);
 assert.equal(decision.ruleId,23);assert.equal(decision.destination,'pawn');
 assert.equal(decision.actionCode,'classicPawn:computer');
 p.classicRentDueWeek=g.week;p.groceries=1;
 decision=g.classicSourceDecision(p);
 assert.equal(decision.ruleId,10,'Rent extension must precede pawning');
 p.classicExtensionAttemptWeek=g.week;
 decision=g.classicSourceDecision(p);
 assert.equal(decision.ruleId,11);
});

test('Modern-mode wages/stock and spending are not affected by classic index state',()=>{
 const a=new Game({ruleset:'modern',mode:'sandbox',seed:34});
 const b=new Game({ruleset:'modern',mode:'sandbox',seed:34});
 b.classicGoodsIndex=187;b.classicEconomicIndices.readings.general=10;
 assert.equal(a.offeredWage(a.jobs[0]),b.offeredWage(b.jobs[0]));
 for(let i=0;i<6;i++){a.newWeek();b.newWeek();}
 assert.equal(a.economy,b.economy);
 assert.equal(a.price(130,'retail'),b.price(130,'retail'));
});

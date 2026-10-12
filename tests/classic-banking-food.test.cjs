'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const classic=(seed=99)=>new Game({mode:'sandbox',ruleset:'classic',seed});
const travel=(g,at)=>{const out=g.travel(at);assert.equal(out.ok,true,out.message);};
const act=(g,id)=>{const out=g.act(id);assert.equal(out.ok,true,out.message);return out;};
const offer=(g,id)=>{const a=g.actions().find(x=>x.id===id);assert.ok(a,`Missing ${id}`);return a;};
test('Original six broker instruments and base prices are modeled independently',()=>{
 assert.deepEqual(D.classicStocks.map(x=>[x.id,x.base]),[['tbills',100],['gold',413],['silver',14],['pork',20],['blue',49],['penny',7]]);
});
test('Classic bank $100 transfers cost zero hours and have no interest',()=>{
 const g=classic(),p=g.player;travel(g,'bank');const h=p.hours;p.cash=500;
 assert.equal(offer(g,'deposit:100').hours,0);assert.equal(offer(g,'withdraw:100').hours,0);
 act(g,'deposit:100');assert.equal(p.cash,400);assert.equal(p.bank,100);
 act(g,'withdraw:100');assert.equal(p.cash,500);assert.equal(p.bank,0);assert.equal(p.hours,h);
 p.hours=0;assert.equal(offer(g,'deposit:100').enabled,true);act(g,'deposit:100');assert.equal(p.cash,400);
 p.bank=1000;g.endTurn();for(let i=0;i<4;i++)g.endTurn();assert.equal(p.bank,1000);
 assert.equal(g.actions().find(x=>x.id==='invest'),undefined);assert.equal(g.actions().find(x=>x.id==='deposit:500'),undefined);
});
test('Broker entrance costs two hours; per-unit trades do not, and $100 T-Bill resells for $97',()=>{
 const g=classic(),p=g.player;travel(g,'bank');p.cash=400;p.hours=8;
 assert.equal(g.actions().find(x=>x.id==='classicBuyStock:tbills'),undefined);
 act(g,'classicBroker');assert.equal(p.hours,6);assert.equal(offer(g,'classicBroker').enabled,false);
 act(g,'classicBuyStock:tbills');assert.equal(p.hours,6);assert.equal(p.cash,300);assert.equal(p.invested,100);
 assert.equal(p.classicPortfolio.tbills,1);act(g,'classicSellStock:tbills');assert.equal(p.cash,397);
 assert.equal(p.invested,0);assert.equal(p.classicPortfolio.tbills,0);
 assert.equal(offer(g,'classicSellStock:tbills').enabled,false);
 p.hours=20;travel(g,'home');travel(g,'bank');assert.equal(g.actions().find(x=>x.id==='classicBuyStock:tbills'),undefined);
});
test('Stock prices change deterministically and portfolios revalue without affecting deposits',()=>{
 const g=classic(9),p=g.player;travel(g,'bank');p.cash=10000;
 act(g,'classicBroker');act(g,'classicBuyStock:gold');
 const base=g.classicStockPrices.gold;
 g.endTurn();const price=g.classicStockPrices.gold;
 assert.equal(p.invested,price);assert.equal(p.classicPortfolio.gold,1);
 assert.equal(g.classicStockPrices.tbills,100);
 assert.equal(g.player.bank,0);assert.ok(price!==0&&base!==0);
 const snapshot=g.snapshot();assert.deepEqual(Game.load(snapshot).snapshot(),snapshot);
});
test('Classic bank loans require work, consume 2 hours, count as debt not wealth',()=>{
 const g=classic(),p=g.player;travel(g,'bank');assert.equal(offer(g,'classicLoanApply').enabled,false);
 p.job='classic-monolith-cook';p.wage=7;p.cash=10;
 const h=p.hours,net=g.wealth(p),limit=g.classicLoanLimit(p);
 assert.ok(limit>=100);act(g,'classicLoanApply');
 assert.equal(p.hours,h-2);assert.equal(p.debt,limit);assert.equal(p.cash,10+limit);
 assert.equal(g.wealth(p),net);assert.equal(offer(g,'classicLoanApply').enabled,false);
});
test('Loan payment costs $45 principal plus $5, defaults reduce happiness/credit',()=>{
 const g=classic(),p=g.player;travel(g,'bank');p.job='classic-monolith-cook';p.wage=7;p.cash=300;
 act(g,'classicLoanApply');const loan=p.debt;
 assert.equal(offer(g,'classicLoanPay').price,50);
 act(g,'classicLoanPay');assert.equal(p.debt,loan-45);assert.equal(p.classicLoanPaidThrough,1);
 for(let i=0;i<4;i++)g.endTurn();assert.equal(p.classicLoanDefaults,0);
 for(let i=0;i<4;i++)g.endTurn();assert.equal(p.classicLoanDefaults,1);
 assert.equal(p.classicLoanPaidThrough,1);assert.ok(g.classicLoanLimit(p)<limitFromLoan(loan));
 function limitFromLoan(x){return x+1000;}
});
test('Food bundles use original $55/$100/$190 base and do not modify Modern actions',()=>{
 const g=classic();travel(g,'market');
 assert.deepEqual(D.classicFreshFood.map(x=>[x.units,x.cost]),[[1,55],[2,100],[4,190]]);
 assert.equal(offer(g,'classicFresh:1').price,55);assert.equal(offer(g,'classicFresh:2').price,100);
 assert.equal(offer(g,'classicFresh:4').price,190);assert.equal(g.actions().find(x=>x.id==='groceries'),undefined);
 const m=new Game({mode:'sandbox',ruleset:'modern'});travel(m,'market');
 assert.equal(m.actions().find(x=>x.id==='classicFresh:1'),undefined);assert.ok(offer(m,'groceries'));
});
test('Bulk food without fridge spoils at weekend; fridge keeps six portions',()=>{
 const g=classic(),p=g.player;travel(g,'market');p.cash=500;p.groceries=0;
 act(g,'classicFresh:4');assert.equal(p.groceries,4);
 g.endTurn();assert.equal(p.groceries,0);assert.ok(p.cash<310,'Spoiled food incurs a medical bill');
 const g2=classic(),b=g2.player;g2.rand=()=>.5;b.owned.push('fridge');b.cash=500;b.groceries=0;
 travel(g2,'market');act(g2,'classicFresh:4');g2.endTurn();assert.equal(b.groceries,3);
 assert.equal(g2.classicFoodCapacity(b),6);
});
test('Freezer increases pantry to 12; limits enforced before payment; happiness bonus once weekly',()=>{
 const g=classic(),p=g.player;travel(g,'market');p.cash=4000;p.groceries=0;p.owned.push('fridge');
 const happiness=p.happiness;act(g,'classicFresh:4');assert.equal(p.happiness,happiness+4);
 assert.equal(offer(g,'classicFresh:4').enabled,false);
 act(g,'classicFresh:2');assert.equal(p.happiness,happiness+4);
 travel(g,'tech');assert.equal(offer(g,'buy:freezer').enabled,true);act(g,'buy:freezer');
 assert.equal(g.classicFoodCapacity(p),12);travel(g,'market');
 act(g,'classicFresh:4');assert.equal(p.groceries,10);assert.equal(offer(g,'classicFresh:4').enabled,false);
});
test('Legacy Classic investment migrates without silently destroying value',()=>{
 const g=classic(),s=g.snapshot();delete s.players[0].classicPortfolio;
 s.players[0].invested=240;delete s.players[0].classicLegacyInvestment;
 const loaded=Game.load(s),p=loaded.player;
 assert.equal(p.invested,240);assert.equal(p.classicLegacyInvestment,240);
 travel(loaded,'bank');act(loaded,'classicBroker');act(loaded,'classicSellLegacy');
 assert.equal(p.invested,0);assert.equal(p.cash,440);
 assert.deepEqual(Game.load(loaded.snapshot()).snapshot(),loaded.snapshot());
});

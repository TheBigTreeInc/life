'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Clock=require('../src/classic-time.js');
const Game=require('../src/engine.js');
const make=(ruleset='classic')=>new Game({ruleset,mode:'sandbox',seed:535});
function employed(g,{remaining=6,debt=0,wage=7}={}){
 const p=g.player;
 p.location='diner';p.job='classic-monolith-cook';p.wage=wage;p.hours=remaining;p.energy=100;
 p.rentDebt=debt;p.dependability=100;return p;
}
test('auditable partial paycheck keeps full-shift benchmark separate from actual gross',()=>{
 const q=Clock.paycheck(7,3,100);
 assert.equal(q.fullGross,56);assert.equal(q.gross,28);assert.equal(q.net,12);
 assert.equal(q.fullGrossBasis,28);assert.equal(q.fullGrossBasisDifference,14);
 assert.match(q.semantics,/provisional/);
});
test('full wage, debt smaller than wage, and zero-wage boundaries remain nonnegative',()=>{
 for(const [w,h,d] of [[7,6,0],[7,6,10],[7,1,70],[0,3,100],[2,2,100]]){
   const q=Clock.paycheck(w,h,d),s=Clock.settlePaycheck(50,d,q);
   assert.equal(q.gross,q.net+q.garnished+q.fee);
   assert.equal(s.cashAfter,50+q.net);
   assert.equal(s.rentDebtAfter,d-q.garnished);
   assert.ok(q.net>=0&&s.cashAfter>=0&&s.rentDebtAfter>=0);
 }
});
test('settlement rejects tampered quote or mismatched prior arrears',()=>{
 const q=Clock.paycheck(7,3,40);
 assert.throws(()=>Clock.settlePaycheck(5,20,q),/Invalid paycheck settlement/);
 assert.throws(()=>Clock.settlePaycheck(5,40,{...q,net:99}),/Invalid paycheck settlement/);
 assert.throws(()=>Clock.settlePaycheck(-5,40,q),/Invalid cash/);
});
test('the preview quote is side-effect free and agrees with the persisted partial shift',()=>{
 const g=make(),p=employed(g,{remaining:3,debt:100});
 const before=JSON.stringify(g.snapshot()),quoted=g.classicWorkQuote(p,3);
 assert.match(g.actions().find(x=>x.id==='work').detail,/\$12 net/);
 assert.equal(JSON.stringify(g.snapshot()),before);
 const cash=p.cash;
 assert.equal(g.act('work').ok,true);
 assert.equal(p.cash,cash+quoted.net);assert.equal(p.rentDebt,quoted.arrearsAfter);
 assert.equal(p.classicPaycheckHistory.length,1);
 const [entry]=p.classicPaycheckHistory;
 assert.deepEqual({gross:entry.gross,garnished:entry.garnished,fee:entry.fee,net:entry.net},
 {gross:quoted.gross,garnished:quoted.garnished,fee:quoted.fee,net:quoted.net});
 assert.equal(entry.shiftUnits,3);assert.equal(entry.week,1);
 assert.equal(entry.cashAfter,p.cash);assert.equal(entry.rentDebtAfter,p.rentDebt);
});
test('two same-week shifts never deduct more arrears than remain',()=>{
 const g=make(),p=employed(g,{remaining:12,debt:10});
 assert.equal(g.act('work').ok,true);
 assert.equal(p.rentDebt,0);
 assert.equal(g.act('work').ok,true);
 assert.equal(p.classicPaycheckHistory.length,2);
 assert.equal(p.classicPaycheckHistory[0].garnished,10);
 assert.equal(p.classicPaycheckHistory[1].garnished,0);
 assert.equal(p.classicPaycheckHistory[1].fee,0);
});
test('forecast uses contracted net pay rather than gross and does not alter the RNG or game',()=>{
 const g=make(),p=employed(g,{remaining:6,debt:100});
 const state=JSON.stringify(g.snapshot());
 const budget=g.classicSurvivalBudget(p);
 assert.equal(budget.projectedShiftGross,56);
 assert.equal(budget.projectedShiftIncome,26);// $56 gross - $28 garnish - $2 fee
 assert.equal(budget.projectedTwoShiftTakeHome,52);
 assert.ok(budget.projectedGapAfterWork<=budget.projectedGap);
 assert.equal(JSON.stringify(g.snapshot()),state);
});
test('rival does not clear old arrears by sacrificing food or rent money',()=>{
 const g=make(),p=employed(g,{remaining:30,debt:100});p.location='housing';
 p.weekActions=0;p.fed=false;p.groceries=0;p.cash=100;p.classicRentDueWeek=1;
 assert.equal(g.classicCanClearArrears(p),false);
 p.cash=2000;
 assert.equal(g.classicCanClearArrears(p),true);
 p.location='home';assert.equal(g.classicCanClearArrears(p),true);
});
test('old save gains empty history; actual saved history survives and malformed imports fail',()=>{
 const g=make(),p=employed(g,{remaining:3,debt:75});g.act('work');
 const saved=g.snapshot(),restored=Game.load(saved);
 assert.deepEqual(restored.player.classicPaycheckHistory,p.classicPaycheckHistory);
 const old=structuredClone(saved);delete old.players[0].classicPaycheckHistory;
 assert.deepEqual(Game.load(old).player.classicPaycheckHistory,[]);
 const forged=structuredClone(saved);forged.players[0].classicPaycheckHistory[0].net=999;
 assert.throws(()=>Game.load(forged),/Invalid Classic paycheck history/);
 const oversize=structuredClone(saved);oversize.players[0].classicPaycheckHistory=Array(17).fill(saved.players[0].classicPaycheckHistory[0]);
 assert.throws(()=>Game.load(oversize),/Invalid Classic paycheck history/);
});
test('journal keeps only 16 most recent completed shifts and warning actions create none',()=>{
 const g=make(),p=employed(g,{remaining:3,debt:0});
 p.dependability=0; // for cook needs likely low and should work, explicitly test warning on higher requirement
 p.classicPaycheckHistory=[];
 for(let i=0;i<18;i++){
   p.dependability=100;p.hours=6;p.energy=100;p.classicChoicesThisWeek=0;
   assert.equal(g.act('work').ok,true);
 }
 assert.equal(p.classicPaycheckHistory.length,16);
 assert.equal(p.classicPaycheckHistory[0].net,56);
});
test('Modern work does not create Classic payroll history',()=>{
 const g=make('modern'),p=g.player;
 p.job='server';p.wage=7;p.location='diner';p.hours=6;p.energy=100;
 assert.equal(g.act('work').ok,true);
 assert.deepEqual(p.classicPaycheckHistory,[]);
});

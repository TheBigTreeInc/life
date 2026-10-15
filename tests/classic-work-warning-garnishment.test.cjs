'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Clock=require('../src/classic-time.js');
const make=()=>new Game({ruleset:'classic',mode:'sandbox',seed:534});
function hire(p){p.job='classic-monolith-cook';p.wage=7;p.location='diner';p.energy=100;p.hours=6;}
test('DOS boundary: warning at requirement minus three, dismissal below minus five',()=>{
 assert.equal(Clock.workStanding(8,10), 'ready');
 assert.equal(Clock.workStanding(7,10), 'warning');
 assert.equal(Clock.workStanding(7,10,true), 'ready');
 assert.equal(Clock.workStanding(5,10), 'warning');
 assert.equal(Clock.workStanding(4,10), 'dismissal');
 assert.throws(()=>Clock.workStanding(-1,10),/Invalid/);
});
test('first work attempt triggers non-paying non-timed warning; second pays/progresses',()=>{
 const g=make(),p=g.player;hire(p);p.dependability=7;p.experience=9;
 const before=g.snapshot(),cash=p.cash,hours=p.hours,experience=p.experience;
 assert.match(g.actions().find(a=>a.id==='work').detail,/First attempt triggers a reliability warning/);
 const warning=g.act('work');assert.equal(warning.ok,true);assert.match(warning.message,/warned/);
 assert.equal(p.job,'classic-monolith-cook');assert.equal(p.cash,cash);assert.equal(p.hours,hours);
 assert.equal(p.weekActions,0);assert.equal(p.workSessions,0);assert.equal(p.experience,experience);
 assert.equal(p.classicWorkWarningWeek,1);assert.equal(p.classicChoicesThisWeek,1);
 assert.equal(g.actions().find(a=>a.id==='work').enabled,true);
 assert.equal(g.act('work').ok,true);assert.equal(p.cash,cash+56);
 assert.equal(p.workSessions,1);assert.equal(p.experience,experience+1);
 assert.equal(p.classicChoicesThisWeek,2);assert.notDeepEqual(g.snapshot(),before);
});
test('severe reliability gap dismisses before work even if a warning was shown',()=>{
 const g=make(),p=g.player;hire(p);p.dependability=4;p.classicWorkWarningWeek=1;
 const oldCash=p.cash,hours=p.hours;assert.match(g.actions().find(a=>a.id==='work').detail,/dismissal/);
 const result=g.act('work');assert.equal(result.ok,true);assert.match(result.message,/Dismissed/);
 assert.equal(p.cash,oldCash);assert.equal(p.hours,hours);assert.equal(p.job,null);
 assert.equal(p.classicDismissals,1);
});
test('save restores warning exactly once during same week; earlier save migrates cleanly',()=>{
 const g=make(),p=g.player;hire(p);p.dependability=7;g.act('work');
 const restored=Game.load(g.snapshot());assert.equal(restored.player.classicWorkWarningWeek,1);
 assert.equal(restored.classicWorkStanding(restored.player),'ready');
 assert.equal(restored.act('work').ok,true);
 const legacy=g.snapshot();delete legacy.players[0].classicWorkWarningWeek;
 const migrated=Game.load(legacy);assert.equal(migrated.player.classicWorkWarningWeek,0);
 assert.equal(migrated.classicWorkStanding(migrated.player),'warning');
 const forged=g.snapshot();forged.players[0].classicWorkWarningWeek=999;
 assert.throws(()=>Game.load(forged),/Invalid Classic work warning/);
});
test('partial gross is source-derived, rent-garnishment remains explicit approximation',()=>{
 const quote=Clock.paycheck(7,3,100);
 assert.deepEqual({fullGross:quote.fullGross,gross:quote.gross,garnished:quote.garnished,fee:quote.fee,net:quote.net,arrearsAfter:quote.arrearsAfter},
   {fullGross:56,gross:28,garnished:14,fee:2,net:12,arrearsAfter:86});
 assert.match(quote.semantics,/provisional/);assert.throws(()=>Clock.paycheck(7,3,-2),/Invalid/);
 const g=make(),p=g.player;hire(p);p.hours=3;p.rentDebt=100;
 const preview=g.actions().find(a=>a.id==='work');assert.match(preview.detail,/\$12 net/);
 const before=g.snapshot();assert.deepEqual(g.classicWorkQuote(p,3),g.classicWorkQuote(p,3));
 assert.deepEqual(g.snapshot(),before,'preview must not mutate cash/debt or RNG');
 const cash=p.cash;assert.equal(g.act('work').ok,true);
 assert.equal(p.cash,cash+12);assert.equal(p.rentDebt,86);assert.equal(p.hours,0);
});
test('no rent arrears and partially garnished small debts do not create fictitious fees',()=>{
 assert.equal(Clock.paycheck(5,6,0).net,40);
 assert.deepEqual({net:Clock.paycheck(5,6,2).net,fee:Clock.paycheck(5,6,2).fee}, {net:38,fee:0});
 assert.equal(Clock.paycheck(0,1,20).net,0);
});
test('Classic source AI reserves post-travel action time and stops at ten action limit',()=>{
 const g=make(),p=g.player;hire(p);p.location='home';p.cash=0;p.bank=0;p.groceries=0;p.fed=false;
 const travel=g.travelCost('home','diner');p.hours=travel;
 assert.ok(!g.classicSourceDecision(p)||g.classicSourceDecision(p).actionCode!=='work');
 p.hours=travel+1;
 const ready=g.classicSourceDecision(p);assert.ok(ready);assert.equal(ready.actionCode,'work');
 assert.equal(ready.requiredActionHours,1);
 p.classicChoicesThisWeek=10;assert.equal(g.classicSourceDecision(p),null);
 const snap=g.snapshot();g.runAI();assert.deepEqual(g.snapshot().players[0],snap.players[0], 'AI at action cap cannot navigate anymore');
});
test('Modern work has no Classic warning or rent surcharge behavior',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox',seed:534}),p=g.player;
 p.job='server';p.wage=7;p.location='diner';p.dependability=0;p.energy=100;p.hours=6;
 assert.equal(g.actions().find(a=>a.id==='work').enabled,true);
 assert.equal(g.act('work').ok,true);assert.equal(p.cash,250+56);
 assert.equal(p.classicWorkWarningWeek,0);
});

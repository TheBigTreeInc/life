'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:882});
const modern=()=>new Game({ruleset:'modern',mode:'sandbox',seed:882});
const good=(g,id)=>{const result=g.act(id);assert.equal(result.ok,true,result.message);return result;};
const hire=(g)=>{const p=g.player;p.job='classic-monolith-cook';p.wage=5;p.location='diner';p.energy=100;return p;};

test('Classic full 6-hour work pays 8x hourly rate and grants one work stat credit',()=>{
 const g=classic(),p=hire(g),cash=p.cash,ex=p.experience,dep=p.dependability;
 p.experience=9;
 good(g,'work');assert.equal(p.cash-cash,40);assert.equal(p.hours,54);assert.equal(p.classicWorkHourCredit,0);
 assert.equal(p.experience,ex);assert.equal(p.dependability,dep+1);assert.equal(p.classicWageRemainder,0);
});

test('Six 1-hour Classic shifts truncate wages individually, never carry fractional dollars',()=>{
 const g=classic(),p=hire(g),cash=p.cash;
 for(let i=0;i<6;i++){
  p.hours=1;p.energy=100;
  const preview=g.actions().find(a=>a.id==='work');assert.equal(preview.enabled,true);
  const outcome=good(g,'work');assert.match(outcome.message,new RegExp('Worked 1h'));
  assert.equal(p.cash-cash,[6,12,18,24,30,36][i]);
 }
 assert.equal(p.cash-cash,36);assert.equal(p.classicWageRemainder,0);
 assert.equal(p.classicWorkHourCredit,0);assert.equal(p.workSessions,6);
});

test('Partial shift previews match independent DOS truncation, save retains zero wage remainder',()=>{
 const g=classic(),p=hire(g);p.wage=7;p.hours=2;
 assert.match(g.actions().find(a=>a.id==='work').title,/\$18/);good(g,'work');assert.equal(p.classicWageRemainder,0);
 const saved=Game.load(g.snapshot());const v=saved.player;assert.equal(v.classicWageRemainder,0);
 v.hours=4;v.energy=100;
 assert.match(saved.actions().find(a=>a.id==='work').title,/\$37/);good(saved,'work');assert.equal(v.cash,255);
 assert.equal(v.classicWageRemainder,0);
});

test('Switching employer clears saved legacy fractional work credits',()=>{
 const g=classic(),p=hire(g);p.hours=1;good(g,'work');p.hours=55;p.location='agency';g.rand=()=>0;
 assert.equal(p.classicWageRemainder,0);p.dependability=100;p.experience=100;p.classicDegrees=['junior-college','business-admin'];
 good(g,'apply:classic-zmart-clerk');assert.equal(p.job,'classic-zmart-clerk');
 assert.equal(p.classicWageRemainder,0);assert.equal(p.classicWorkHourCredit,0);
});

test('At zero hours all Classic actions are blocked, including zero-cost bank and food actions',()=>{
 const g=classic(),p=g.player;p.location='bank';p.cash=1000;p.bank=200;p.hours=0;
 const clockActions=['deposit:100','withdraw:100'];
 for(const id of clockActions){const a=g.actions().find(a=>a.id===id);assert.equal(a.enabled,false);assert.match(a.reason,/No hours left/);assert.equal(g.act(id).ok,false);}
 p.location='cinema';p.groceries=0;for(const id of ['classicLottery','classicFresh:1']){
  const a=g.actions().find(a=>a.id===id);assert.equal(a.enabled,false);assert.equal(g.act(id).ok,false);
 }
 assert.equal(p.cash,1000);assert.equal(p.bank,200);
});

test('A Classic week permits ten decisions but the eleventh is blocked even with hours left',()=>{
 const g=classic(),p=g.player;p.location='bank';p.cash=2000;
 for(let i=0;i<10;i++){good(g,'deposit:100');assert.equal(p.classicChoicesThisWeek,i+1);}
 assert.equal(p.hours,60);assert.equal(p.bank,1000);
 assert.equal(g.actions().find(a=>a.id==='deposit:100').enabled,false);
 assert.match(g.act('deposit:100').message,/Ten Classic actions/);
 assert.equal(p.bank,1000);
});

test('Walking and invalid actions do not use a Classic action slot; ending week resets limit',()=>{
 const g=classic(),p=g.player;p.location='bank';p.cash=2000;
 assert.equal(g.travel('market').ok,true);assert.equal(g.travel('bank').ok,true);
 assert.equal(p.classicChoicesThisWeek,0);
 const refused=g.act('definitely-not-real');assert.equal(refused.ok,false);assert.equal(p.classicChoicesThisWeek,0);
 for(let i=0;i<10;i++)good(g,'deposit:100');assert.equal(p.classicChoicesThisWeek,10);
 g.endTurn();assert.equal(g.week,2);assert.equal(p.classicChoicesThisWeek,0);
 assert.equal(g.actions().find(a=>a.id==='deposit:100').enabled,true);
});

test('Saved Classic weekly counters cannot be forged above cap',()=>{
 const g=classic();const bad=g.snapshot();bad.players[0].classicChoicesThisWeek=11;
 assert.throws(()=>Game.load(bad),/Invalid Classic clock\/work state/);
 const broken=g.snapshot();broken.players[0].classicWageRemainder=6;
 assert.throws(()=>Game.load(broken),/Invalid Classic clock\/work state/);
 const old=g.snapshot();delete old.players[0].classicChoicesThisWeek;delete old.players[0].classicWageRemainder;
 const migrated=Game.load(old).player;assert.equal(migrated.classicChoicesThisWeek,0);assert.equal(migrated.classicWageRemainder,0);
});

test('Modern time/money actions and work remain independent of the Classic action cap',()=>{
 const g=modern(),p=g.player;p.location='bank';p.cash=10000;p.classicChoicesThisWeek=10;
 // Legacy Modern banking is still governed by its own time/cash rules.
 const allowed=g.actions().find(a=>a.id==='deposit:500');assert.ok(allowed);
 assert.equal(allowed.enabled,true);assert.equal(g.act('deposit:500').ok,true);
 assert.equal(p.classicChoicesThisWeek,10);
});

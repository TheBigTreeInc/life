'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const Events=require('../src/classic-economic-events.js');
const Game=require('../src/engine.js');
const mk=(seed=53,mode='solo',ruleset='classic')=>new Game({mode,ruleset,seed});

test('DOS crisis strength 1 wipes savings and dismisses employed characters',()=>{
 const outcome=Events.scandal({job:'cook',wage:17,bank:520,happiness:60},1);
 assert.deepEqual(outcome,{next:{job:null,wage:0,bank:0,happiness:53},effect:'dismissed',savingsLost:520,wageLost:17});
 assert.equal(Events.scandal({job:null,wage:0,bank:20,happiness:80},1).effect,'savings-lost');
});
test('DOS crisis strength 2 uses one binary employment draw and rounds wages down',()=>{
 const p={job:'cook',wage:17,bank:250,happiness:60};
 assert.deepEqual(Events.scandal(p,2,0).next,{job:null,wage:0,bank:250,happiness:53});
 assert.deepEqual(Events.scandal(p,2,1).next,{job:'cook',wage:13,bank:250,happiness:57});
 assert.equal(Events.scandal({...p,wage:1},2,1).next.wage,1);
 assert.equal(Events.scandal({...p,job:null,wage:0},2,1).effect,'none');
 assert.deepEqual(p,{job:'cook',wage:17,bank:250,happiness:60},'Reducer does not mutate snapshot');
});
test('weekly economic phase/cooldown rolls are single-use and replayable',()=>{
 const previous=Events.initial(1);let draws=0;
 const a=Events.advance(previous,78,-5,2,()=>{draws++;return 0.01;});
 assert.equal(a.state.phase,'downturn');assert.equal(a.strength,2);assert.equal(draws,1);
 assert.equal(a.state.lastIncidentWeek,2);
 const b=Events.advance(a.state,74,-5,3,()=>{throw Error('No shock roll within eight-week cooldown')});
 assert.equal(b.strength,0);
 assert.equal(Events.advance(b.state,95,4,4,()=>0).state.phase,'recovery');
 assert.throws(()=>Events.advance(a.state,90,1,2,()=>0),/already processed/);
});
test('severe crisis has a second explicit seeded roll and rejects corrupted state',()=>{
 let calls=0;const result=Events.advance(Events.initial(1),70,-7,2,()=>{calls++;return 0;});
 assert.equal(calls,2);assert.equal(result.strength,1);
 assert.throws(()=>Events.validate({...result.state,lastIncidentWeek:900},2),/Invalid Classic/);
});
test('integrated scandal updates ALL Classic participants, journals and cash ledger once',()=>{
 const g=mk(55,'solo');for(const p of g.players){p.job='classic-monolith-cook';p.wage=13;p.bank=500;p.happiness=75;}
 g.classicApplyScandal(1);
 for(const p of g.players){assert.equal(p.job,null);assert.equal(p.wage,0);assert.equal(p.bank,0);assert.equal(p.happiness,68);assert.equal(p.classicDismissals,1);}
 assert.equal(g.classicWeekEvents.filter(e=>e.kind==='economic-scandal').length,2);
 assert.ok(g.players.every(p=>p.ledger.some(e=>e.category==='economic-crisis')));
});
test('save upgrade, deterministic replay and no extra shock on load',()=>{
 const g=mk(994),old=g.snapshot();delete old.classicEconomicPulse;
 assert.equal(Game.load(old).classicEconomicPulse.lastWeek,1);
 const a=Game.load(old),b=Game.load(old);
 for(let n=0;n<60;n++){a.newWeek();b.newWeek();assert.deepEqual(a.classicEconomicPulse,b.classicEconomicPulse);}
 assert.deepEqual(a.snapshot(),b.snapshot());
 const loaded=Game.load(a.snapshot());assert.deepEqual(loaded.classicEconomicPulse,a.classicEconomicPulse);
});
test('Classic downturn includes extra emergency food buffer, Modern has no impact',()=>{
 const g=mk(),p=g.player,stable=g.classicSurvivalBudget(p);
 g.classicEconomicPulse.phase='downturn';const crisis=g.classicSurvivalBudget(p);
 assert.equal(crisis.downturnBuffer,g.classicFoodPrice(1));assert.equal(crisis.reserve,stable.reserve+crisis.downturnBuffer);
 const m=mk(18,'sandbox','modern');m.classicEconomicPulse.phase='downturn';assert.equal(m.classicWeekEvents.length,0);
 m.newWeek();assert.equal(m.classicWeekEvents.length,0);assert.equal(m.classicEconomicPulse.lastWeek,1);
});
test('incoming economic event state cannot invent future weeks or invalid phases',()=>{
 const a=mk(),save=a.snapshot();save.classicEconomicPulse.phase='invented';
 assert.throws(()=>Game.load(save),/Invalid Classic economic event state/);
 save.classicEconomicPulse.phase='stable';save.classicEconomicPulse.lastWeek=19;
 assert.throws(()=>Game.load(save),/Invalid Classic economic event state/);
});

test('Jones applies for a replacement job before being pulled back to the food market',()=>{
 const g=mk(2),p=g.players.find(x=>x.isAI);
 p.job='classic-blacks-checker';p.wage=11;p.cash=230;p.groceries=0;p.location='cinema';
 g.classicApplyScandal(2); // Seed may cut wages or fire: force a dismissal for this scenario.
 p.job=null;p.wage=0;p.classicRejectedOpenings={};
 g.active=g.players.indexOf(p);g.runAI();
 assert.ok(p.job,'Rival should apply and accept a qualified opening at the office');
 assert.ok(g.classicDecisionTrace.some(x=>x.actionCode.startsWith('apply:')),'Application is source-tagged');
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Clock=require('../src/classic-turn-sequence.js');
const Game=require('../src/engine.js');
const classic=(mode='sandbox')=>new Game({ruleset:'classic',mode,seed:536});
test('source-backed closeTurn spends exactly three reliability per completed turn',()=>{
 assert.deepEqual({...Clock.closeTurn(4,11,3)},{applied:true,before:11,after:8,lastClosedWeek:4,decay:3});
 assert.equal(Clock.closeTurn(4,1,0).after,0);
 assert.equal(Clock.closeTurn(4,8,4).applied,false);
 assert.throws(()=>Clock.closeTurn(1,3,2),/Invalid Classic close ordering/);
});
test('rent is charged on the first week after a fourth-week due date once only',()=>{
 assert.equal(Clock.rentAssessment(4,4,325).due,false);
 const due=Clock.rentAssessment(5,4,325);
 assert.deepEqual({...due},{due:true,charge:325,nextDueWeek:8,lastChargedWeek:5});
 assert.equal(Clock.rentAssessment(5,4,325,5).charge,0);
 assert.equal(Clock.rentAssessment(5,8,325,5).due,false);
});
test('hotseat turn close applies before other player finishes; weekly reset does not double decay',()=>{
 const g=classic('hotseat'),first=g.players[0],second=g.players[1];
 first.dependability=20;second.dependability=18;
 const a=g.endTurn();assert.equal(a.ok,true);
 assert.equal(g.week,1);assert.equal(g.player.id,'friend');
 assert.equal(first.dependability,17);assert.equal(second.dependability,18);
 assert.equal(g.classicTurnJournal.length,1);
 assert.deepEqual({...g.classicTurnJournal[0]},{week:1,phase:'turn-close',playerId:'player',amount:3});
 g.endTurn();assert.equal(g.week,2);
 assert.equal(first.dependability,17);assert.equal(second.dependability,15);
 const events=g.classicTurnJournal;
 assert.deepEqual(events.filter(e=>e.phase==='turn-close').map(e=>e.playerId),['player','friend','jones']);
 assert.equal(events.at(-1).phase,'week-ready');
 assert.equal(events.filter(e=>e.phase==='rent').length,3);
});
test('solo opponent closes its turn and the phase order is stable',()=>{
 const g=classic('solo'),jones=g.players.find(p=>p.isAI),prior=jones.dependability;
 assert.equal(g.endTurn().ok,true);
 assert.equal(g.week,2);
 assert.equal(jones.classicLastClosedWeek,1);
 assert.ok(jones.dependability>=0); // Work may add reliability before the close-of-turn penalty
 const phases=g.classicTurnJournal.filter(e=>e.week===2).map(e=>e.phase);
 assert.equal(phases[0],'economy');assert.equal(phases.at(-1),'week-ready');
 assert.equal(phases.filter(x=>x==='reset').length,2);
});
test('a missed rent deadline creates exactly one debt charge and a journal entry',()=>{
 const g=classic(),p=g.player;
 p.classicRentDueWeek=4;p.classicRent=325;
 for(let i=0;i<4;i++)g.endTurn();
 assert.equal(g.week,5);assert.equal(p.rentDebt,325);assert.equal(p.classicLastRentChargeWeek,5);
 const rentEvents=g.classicTurnJournal.filter(e=>e.week===5&&e.phase==='rent'&&e.playerId===p.id);
 assert.equal(rentEvents.length,1);assert.equal(rentEvents[0].amount,325);
 for(let i=0;i<3;i++)g.endTurn();assert.equal(p.rentDebt,325);
});
test('turn journal and close marker survive save/load and cannot be tampered with',()=>{
 const g=classic('hotseat');g.endTurn();
 const saved=g.snapshot();assert.equal(saved.classicTurnJournal.length,1);
 const loaded=Game.load(saved);assert.deepEqual(loaded.classicTurnJournal,g.classicTurnJournal);
 assert.equal(loaded.players[0].classicLastClosedWeek,1);
 loaded.endTurn();assert.equal(loaded.players[0].dependability,g.players[0].dependability);
 const legacy=structuredClone(saved);delete legacy.classicTurnJournal;
 for(const p of legacy.players){delete p.classicLastClosedWeek;delete p.classicLastRentChargeWeek;}
 assert.deepEqual(Game.load(legacy).classicTurnJournal,[]);
 const corrupted=structuredClone(saved);corrupted.classicTurnJournal[0].amount=-1;
 assert.throws(()=>Game.load(corrupted),/Invalid Classic turn journal/);
 const marker=structuredClone(saved);marker.players[0].classicLastClosedWeek=10;
 assert.throws(()=>Game.load(marker),/Invalid Classic turn boundary/);
});
test('Modern end turn stays on its original mechanics with no Classic turn events',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox',seed:536}),p=g.player;
 const d=p.dependability;g.endTurn();
 assert.equal(p.dependability,d-g.rules.dependabilityDecay);
 assert.deepEqual(g.classicTurnJournal,[]);
});
test('journal is bounded, ordered, and rejects future events on restore',()=>{
 const g=classic();for(let i=0;i<15;i++)g.newWeek();
 assert.equal(g.classicTurnJournal.length,Clock.JOURNAL_LIMIT);
 const saved=g.snapshot();assert.deepEqual(Game.load(saved).classicTurnJournal,saved.classicTurnJournal);
 const forged=structuredClone(saved);forged.classicTurnJournal[0].week=saved.week+1;
 assert.throws(()=>Game.load(forged),/Invalid Classic turn journal/);
});

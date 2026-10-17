'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Presets=require('../src/rule-presets.js');
const Preferences=require('../src/setup-preferences.js');
function game(ruleset='classic',mode='sandbox',rules){return new Game({ruleset,mode,seed:772,rules});}
test('game families have separate immutable defaults; custom rules stay in the same game family',()=>{
 assert.deepEqual(Presets.normalize('classic'),{forcedReturnHome:true,carryReturnOvertime:true,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false});
 assert.deepEqual(Presets.normalize('modern'),{forcedReturnHome:false,carryReturnOvertime:false,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false});
 const prefs=Preferences.sanitize({ruleset:'classic',rules:{forcedReturnHome:false,carryReturnOvertime:true}});
 assert.deepEqual(prefs.rules,{forcedReturnHome:false,carryReturnOvertime:false,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false});
 assert.equal(Presets.customized('classic',prefs.rules),true);
 assert.equal(Presets.customized('classic',Presets.normalize('classic')),false);
 assert.equal(game('classic','sandbox',{forcedReturnHome:false}).places.length,game('classic').places.length);
 assert.notEqual(game('classic').places,game('modern').places);
});
test('Classic ends away from home, borrows leftover homeward time from next week',()=>{
 const g=game(),p=g.player,cost=g.travelCost('market','home');
 assert.ok(cost>1);p.location='market';p.hours=1;
 assert.equal(g.endTurn().ok,true);assert.equal(p.location,'home');assert.equal(g.week,2);
 assert.equal(p.hours,g.rules.hours-(cost-1));assert.equal(p.returnTravelDebt,0);
 assert.ok(g.messages.some(x=>String(x.message).includes('owed next week')));
});
test('Hotseat tracks each player debt independently until the next shared week',()=>{
 const g=game('classic','hotseat'),p=g.players[0],q=g.players[1],cost=g.travelCost('market','home');
 p.location='market';p.hours=0;
 g.endTurn();assert.equal(g.week,1);assert.equal(g.player.id,'friend');
 assert.equal(p.location,'home');assert.equal(p.returnTravelDebt,cost);
 assert.equal(q.returnTravelDebt,0);
 g.endTurn();assert.equal(g.week,2);assert.equal(p.hours,g.rules.hours-cost);assert.equal(p.returnTravelDebt,0);
});
test('No home rule: player remains at shop, receives a full next-week clock',()=>{
 const g=game('classic','sandbox',{forcedReturnHome:false,carryReturnOvertime:false,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false});const p=g.player;
 p.location='market';p.hours=0;g.endTurn();assert.equal(p.location,'market');assert.equal(p.hours,g.rules.hours);
});
test('Optional free overtime returns home without next-week debt',()=>{
 const g=game('classic','sandbox',{forcedReturnHome:true,carryReturnOvertime:false}),p=g.player;
 p.location='market';p.hours=0;g.endTurn();assert.equal(p.location,'home');assert.equal(p.hours,g.rules.hours);
});
test('Modern default preserves its no-return gameplay; Modern can opt in without Classic shops',()=>{
 const defaultModern=game('modern');defaultModern.player.location='market';defaultModern.endTurn();
 assert.equal(defaultModern.player.location,'market');
 const modern=game('modern','sandbox',{forcedReturnHome:true,carryReturnOvertime:true,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true,weeklyActionLimit:false}),p=modern.player,cost=modern.travelCost('market','home');
 p.location='market';p.hours=0;modern.endTurn();assert.equal(p.location,'home');assert.equal(p.hours,modern.rules.hours-cost);
 assert.equal(modern.settings.ruleset,'modern');assert.equal(modern.places.length,defaultModern.places.length);
});
test('Offline/remote snapshot keeps authoritative preset and staged debt, legacy saves default safely',()=>{
 const g=game('classic','hotseat'),p=g.player,cost=g.travelCost('market','home');p.location='market';p.hours=0;g.endTurn();
 const saved=g.snapshot();const restored=Game.load(saved);
 assert.deepEqual(restored.settings.rules,g.settings.rules);
 assert.equal(restored.players[0].returnTravelDebt,cost);
 restored.endTurn();assert.equal(restored.players[0].hours,g.rules.hours-cost);
 const forged=structuredClone(saved);forged.players[0].returnTravelDebt=-1;
 assert.throws(()=>Game.load(forged),/Invalid return travel debt/);
 const invalid=structuredClone(saved);invalid.settings.rules={forcedReturnHome:'all',carryReturnOvertime:true};
 assert.deepEqual(Game.load(invalid).settings.rules,Presets.normalize('classic'));
 const old=structuredClone(saved);delete old.settings.rules;
 for(const person of old.players)delete person.returnTravelDebt;
 const migrated=Game.load(old);assert.deepEqual(migrated.settings.rules,Presets.normalize('classic'));
 assert.equal(migrated.players[0].returnTravelDebt,0);
});

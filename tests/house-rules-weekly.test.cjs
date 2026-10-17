"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const Game=require('../src/engine.js');
const Presets=require('../src/rule-presets.js');
const Prefs=require('../src/setup-preferences.js');
const game=(ruleset='classic',rules={})=>new Game({ruleset,mode:'sandbox',seed:556,rules});
test('custom toggles remain separate from canonical game families and persist in old and new snapshots',()=>{
 for(const family of ['classic','modern']){
  const g=game(family,{foodSpoilage:false,overdueRentPenalty:false,marketFluctuations:false});
  assert.equal(g.settings.ruleset,family);
  assert.equal(Presets.customized(family,g.settings.rules),true);
  assert.equal(g.settings.rules.foodSpoilage,false);
  const restored=Game.load(g.snapshot());assert.deepEqual(restored.settings.rules,g.settings.rules);
  const old=g.snapshot();delete old.settings.rules.foodSpoilage;delete old.settings.rules.overdueRentPenalty;delete old.settings.rules.marketFluctuations;
  assert.deepEqual(Game.load(old).settings.rules,{...g.settings.rules,foodSpoilage:true,overdueRentPenalty:true,marketFluctuations:true});
  const prefs=Prefs.sanitize({ruleset:family,rules:g.settings.rules});assert.deepEqual(prefs.rules,g.settings.rules);
 }
});
test('disabling spoilage preserves unused food while consuming a meal normally',()=>{
 for(const family of ['classic','modern']){
  const a=game(family),b=game(family,{foodSpoilage:false});
  for(const g of [a,b]){g.player.groceries=4;g.player.fed=false;g.player.owned=g.player.owned.filter(x=>x!=='fridge'&&x!=='freezer');}
  a.endTurn();b.endTurn();
  assert.equal(a.player.groceries,0);
  assert.equal(b.player.groceries,3);
  assert.equal(b.player.hunger,a.player.hunger);
 }
});
test('rent penalty switch removes only happiness loss, not financial assessment',()=>{
 for(const family of ['classic','modern']){
  const a=game(family),b=game(family,{overdueRentPenalty:false});
  if(family==='classic'){
   for(const g of [a,b]){g.week=4;g.player.classicRentDueWeek=4;g.player.rentDebt=0;g.player.happiness=80;}
  }else{
   for(const g of [a,b]){g.week=4;g.player.cash=0;g.player.bank=0;g.player.happiness=80;}
  }
  a.endTurn();b.endTurn();
  assert.equal(b.player.rentDebt,a.player.rentDebt);
  assert.ok(b.player.rentDebt>0);
  assert.equal(b.player.happiness,a.player.happiness+7);
 }
});
test('static economy rule freezes Classic price indices and Modern economy without disabling other events',()=>{
 const c=game('classic',{marketFluctuations:false});
 const initial=structuredClone(c.classicEconomicIndices.readings),stock=structuredClone(c.classicStockPrices);
 for(let i=0;i<6;i++)c.endTurn();
 assert.deepEqual(c.classicEconomicIndices.readings,initial);assert.deepEqual(c.classicStockPrices,stock);
 const m=game('modern',{marketFluctuations:false});const event=m.cityEventId;
 for(let i=0;i<4;i++)m.endTurn();
 assert.equal(m.economy,1);assert.notEqual(m.cityEventId,event);
});
test('return-home animation happens before network action, never changes rules or time itself',()=>{
 const app=fs.readFileSync('src/app.js','utf8');
 const i=app.indexOf("$('endTurnBtn').addEventListener('click',async()=>{");
 const end=app.indexOf("$('classicHandoverContinue')",i);
 const handler=app.slice(i,end);
 assert.ok(handler.indexOf("routeOverlay?.animate(actorId,from,'home'")<handler.indexOf("net.execute('endTurn'"));
 assert.match(handler,/routeTravelBusy=true/);assert.match(handler,/routeTravelBusy=false/);
 assert.match(handler,/HotseatHandover.required/);
 assert.match(app,/id=\"foodSpoilage\"|name=\"foodSpoilage\"/);
 for(const key of ['foodSpoilage','overdueRentPenalty','marketFluctuations']) assert.match(app,new RegExp(`name=\"${key}\"`));
});

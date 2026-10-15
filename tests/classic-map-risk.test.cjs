const {test}=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const classic=()=>new Game({ruleset:'classic',mode:'sandbox',seed:42});
const act=(g,id)=>{const result=g.act(id);assert.ok(result.ok,result.message);};

test('Original Classic board has 13 distinct named venues and period-authentic geometry',()=>{
 const g=classic();
 assert.equal(g.places.length,13);
 assert.deepEqual(g.places.map(x=>x.name),['Le Security Apartments','Rent Office','Low-Cost Housing','Pawn Shop','Z-Mart Discount','Monolith Burger','QT Clothing','Socket City','Hi-Tech University','Employment Office','Factory','Bank',"Black's Market"]);
 assert.equal(new Set(g.places.map(x=>x.id)).size,13);
 assert.equal(new Set(g.places.map(x=>x.cell.join(','))).size,13);
 assert.deepEqual(g.getPlace('home').cell,[3,1]);
 assert.deepEqual(g.getPlace('cinema').cell,[1,3]);
 assert.deepEqual(g.getPlace('tech').cell,[5,5]);
 assert.equal(g.getPlace('market').name,'Z-Mart Discount');
 for(const loc of g.places)assert.ok(Number.isFinite(g.travelCost('home',loc.id)));
 assert.equal(g.travelCost('market','cinema'),g.travelCost('cinema','market'));
});

test('Modern retains original Life Loop businesses and board geometry',()=>{
 const g=new Game({ruleset:'modern',mode:'sandbox'});
 assert.deepEqual(g.places,D.places);
 assert.equal(g.getPlace('cinema').name,'Starlight Social');
 assert.equal(g.getPlace('clinic').name,'Wellbeing Clinic');
});

test('Classic Black Market and Z-Mart have separate shopping and work, not just different headings',()=>{
 const g=classic(),p=g.player;p.cash=1200;
 p.location='market';assert.ok(g.actions().some(a=>a.id==='classicDiscount:dictionary'));
 assert.equal(g.actions().some(a=>a.id==='classicFresh:1'),false);
 p.location='cinema';assert.equal(g.actions().some(a=>a.id==='classicDiscount:dictionary'),false);
 assert.ok(g.actions().some(a=>a.id==='classicFresh:1'));
 const blackJob=D.classicJobs.find(j=>j.employer==="Black's Market");
 const martJob=D.classicJobs.find(j=>j.employer==='Z-Mart');
 assert.equal(g.jobWorkplace(blackJob).place,'cinema');
 assert.equal(g.jobWorkplace(martJob).place,'market');
 p.job=blackJob.id;p.wage=blackJob.wage;
 assert.ok(g.actions().some(a=>a.id==='work'));
 p.location='market';assert.equal(g.actions().some(a=>a.id==='work'),false);
});

test('Classic low-cost and Le Security relaxation follow the actual residence',()=>{
 const g=classic(),p=g.player;p.cash=1000;
 assert.ok(g.actions().some(a=>a.id==='relax'));
 p.location='housing';const move=g.actions().find(a=>a.id==='classicMove:apartment');assert.ok(move.enabled);
 act(g,move.id);
 assert.equal(p.home,'apartment');assert.equal(p.classicRent,332);
 p.location='home';assert.equal(g.actions().some(a=>a.id==='relax'),false);
 p.location='clinic';assert.ok(g.actions().some(a=>a.id==='relax'));
 assert.equal(Game.load(g.snapshot()).player.home,'apartment');
});

test('Discount appliances are tracked separately, break sooner, and can be repaired',()=>{
 const g=classic(),p=g.player;p.cash=1000;p.location='market';
 act(g,'classicDiscount:vcr');assert.equal(p.classicEquipment.vcr.source,'discount');
 g.rand=()=>0;let notes=[];g.classicEquipmentBreakage(p,notes);
 assert.equal(p.classicEquipment.vcr.broken,true);assert.match(notes.join(' '),/broke down/);
 const damagedValue=g.classicOwnedValue(p);
 assert.ok(damagedValue<285);
 p.location='tech';const repair=g.actions().find(a=>a.id==='classicRepair:vcr');assert.ok(repair.enabled);
 act(g,repair.id);assert.equal(p.classicEquipment.vcr.broken,false);
 assert.equal(g.classicOwnedValue(p),285);
 assert.equal(Game.load(g.snapshot()).player.classicEquipment.vcr.broken,false);
});

test('Broken refrigeration loses its benefit until repaired',()=>{
 const g=classic(),p=g.player;p.location='tech';p.cash=1000;
 act(g,'buy:fridge');assert.equal(g.classicFoodCapacity(p),6);
 p.classicEquipment.fridge.broken=true;
 assert.equal(g.classicFoodCapacity(p),Infinity);
 p.groceries=3;g.rand=()=>.99;g.weekend(p);assert.equal(p.groceries,0);
 p.location='tech';act(g,'classicRepair:fridge');assert.equal(g.classicFoodCapacity(p),6);
});

test('Low-cost burglary removes an owned item; Le Security blocks the same forced event',()=>{
 const g=classic(),p=g.player;p.owned.push('computer');g.setEquipment(p,'computer','specialty');g.rand=()=>0;
 const notes=[];g.classicBurglar(p,notes);assert.ok(!p.owned.includes('computer'));
 assert.match(notes.join(' '),/Wild Willy/);
 assert.equal(p.classicBurglaryCount,1);
 p.owned.push('computer');g.setEquipment(p,'computer','specialty');p.home='apartment';
 const secured=[];g.classicBurglar(p,secured);assert.ok(p.owned.includes('computer'));
 assert.equal(secured.length,0);
});

test('Bank and Black Market robberies take only wallet cash, not savings',()=>{
 const g=classic(),p=g.player;p.location='bank';p.cash=200;p.bank=100;g.rand=()=>0;
 const result=g.act('deposit:100');assert.ok(result.ok);assert.match(result.message,/Wild Willy/);
 assert.equal(p.cash,0);assert.equal(p.bank,200);
 const g2=classic(),q=g2.player;q.cash=300;q.bank=250;q.location='cinema';g2.rand=()=>0;
 const food=g2.act('classicFresh:1');assert.ok(food.ok);assert.match(food.message,/Wild Willy/);
 assert.equal(q.cash,0);assert.equal(q.bank,250);
});

test('Equipment snapshot disallows forged sources, metadata and ownership mismatches',()=>{
 const g=classic();g.player.owned.push('fridge');g.setEquipment(g.player,'fridge','discount');
 for(const modify of [s=>s.players[0].classicEquipment.fridge.source='__proto__',s=>s.players[0].classicEquipment.fridge.broken='false',s=>s.players[0].owned=[]]){
  const s=g.snapshot();modify(s);assert.throws(()=>Game.load(s),/Invalid equipment state/);
 }
});

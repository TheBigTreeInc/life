'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const Weekly=require('../src/classic-weekly-events.js');
const classic=()=>{const g=new Game({mode:'sandbox',ruleset:'classic',seed:554});g.player.classicFoodV2=null;g.player.happiness=62;g.player.classicRelaxation=16;g.player.groceries=1;return g;};
test('Classic source states 2,4,6 and storage effects are audited with compatibility meal order',()=>{
 const g=classic(),p=g.player;p.cash=100;p.bank=0;p.owned.push('computer');
 p.classicEquipment.computer=0;p.groceries=2;p.fed=false;p.lottery=10;p.clothing.casual=2;
 g.rand=()=>0;g.newWeek();
 const e=g.classicWeekEvents.filter(e=>e.playerId===p.id&&e.week===2);
 const at=name=>e.findIndex(x=>x.kind===name);
 for(const name of ['lottery','computer-bonus','relaxation','food-storage','clothing-warning'])assert.ok(at(name)>=0,`${name} missing`);
 const order=['lottery','computer-bonus','relaxation','food-storage','clothing-warning'].map(at);
 assert.deepEqual(order,[...order].sort((a,b)=>a-b));
 assert.equal(p.groceries,0);assert.equal(p.hunger,0); // Compatibility meal precedes spoilage; source ordering remains open.
});
test('Classic never invents arbitrary coffee, subscription or concert cash events',()=>{
 const g=classic(),p=g.player;p.cash=150;p.fed=true;p.lottery=0;g.rand=()=>0;
 const notes=g.weekend(p);
 assert.equal(p.cash,150);assert.equal(notes.some(n=>/coffee|subscription|band played|hobby|quiet afternoon/.test(n)),false);
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:554}),q=modern.player;q.cash=150;q.fed=true;modern.rand=()=>0;
 const modernNotes=modern.weekend(q);
 assert.equal(q.cash,138);assert.ok(modernNotes.some(n=>n.includes('coffee')));
});
test('a week without a computer does not roll an invented bonus',()=>{
 const g=classic(),p=g.player;p.cash=100;p.fed=true;p.lottery=0;
 let calls=0;g.rand=()=>{calls++;return 0;};const notes=g.weekend(p);
 assert.equal(p.cash,100);assert.equal(notes.some(n=>n.includes('Computer project')),false);
});

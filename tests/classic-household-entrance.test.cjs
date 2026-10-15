'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),path=require('node:path');
const Game=require('../src/engine.js'),Home=require('../src/classic-household.js'),Weekly=require('../src/classic-weekly-events.js');
const root=path.resolve(__dirname,'..'),file=rel=>readFileSync(path.join(root,rel),'utf8');
const classic=()=>new Game({mode:'sandbox',ruleset:'classic',seed:541});
test('household state derives only from owned, unbroken appliances and is immutable',()=>{
 const g=classic(),p=g.player;
 p.owned=['computer','fridge','freezer','stereo','vcr'];
 assert.deepEqual(Home.inspect(p),{computer:true,fridge:true,freezer:true,stereo:true,vcr:true,coldStorage:12,comfortBonus:6});
 p.classicEquipment={computer:{source:'specialty',broken:true},fridge:{source:'discount',broken:true}};
 const h=Home.inspect(p);assert.equal(h.computer,false);assert.equal(h.coldStorage,0);
 assert.ok(Object.isFrozen(h));assert.throws(()=>Home.inspect({owned:[]}));
});
test('Classic relaxation is a reason to rest even when energy and happiness are full',()=>{
 const g=classic(),p=g.player;p.happiness=100;p.energy=100;p.classicRelaxation=10;
 let rest=g.actions().find(a=>a.id==='relax');assert.equal(rest.enabled,true);assert.match(rest.detail,/\+6 relaxation/);
 assert.deepEqual(Home.restQuote(p).relaxation,6);assert.equal(g.act('relax').ok,true);
 assert.equal(p.classicRelaxation,16);assert.equal(p.happiness,100);assert.equal(p.energy,100);
 p.classicRelaxation=30;
 rest=g.actions().find(a=>a.id==='relax');assert.equal(rest.enabled,false);
});
test('working entertainment affects Classic rest comfort; broken equipment gives no bonus',()=>{
 const g=classic(),p=g.player;p.owned=['stereo','vcr'];p.energy=20;p.happiness=20;
 assert.equal(Home.restQuote(p).happiness,22);
 p.classicEquipment={stereo:{source:'discount',broken:true}};
 assert.equal(Home.restQuote(p).happiness,19);
 assert.equal(g.act('relax').ok,true);assert.equal(p.happiness,39);
});
test('Classic household computer bonus eligibility respects broken/pawned items and Modern isolation',()=>{
 const g=classic(),p=g.player;p.owned=['computer'];p.classicEquipment={computer:{source:'discount',broken:true}};
 assert.equal(Home.inspect(p).computer,false);
 assert.equal(Weekly.computerBonus(Home.inspect(p).computer,()=>{throw Error('must not draw');}).eligible,false);
 p.classicEquipment.computer.broken=false;assert.equal(Home.inspect(p).computer,true);
 const m=new Game({mode:'sandbox',ruleset:'modern',seed:541});
 m.player.happiness=100;m.player.energy=100;
 assert.equal(m.actions().find(a=>a.id==='relax').enabled,false);
});
test('entrance marker is bound to the existing route stop and never changes travel time',()=>{
 const src=file('src/route-overlay.js'),css=file('styles.css'),art=file('docs/classic-designer-handoff.md');
 assert.match(src,/route-entry-marker/);assert.match(src,/data-entry-place/);
 assert.match(src,/this\.anchor\(this\.arrivalId\)/);assert.match(css,/pointer-events:none/);
 assert.match(css,/route-entry-door/);
 assert.match(art,/170-waypoint/);
 const g=classic(),before=g.player.hours;
 const target='market',quote=g.travelQuote('home',target,before);
 assert.equal(g.travel(target).ok,true);
 assert.equal(g.player.hours,before-quote.hours);
});

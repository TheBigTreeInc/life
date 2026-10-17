'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const Weekly=require('../src/classic-weekly-events.js');
const Game=require('../src/engine.js');
const root=path.resolve(__dirname,'..');
const read=rel=>readFileSync(path.join(root,rel),'utf8');
const classic=()=>new Game({mode:'sandbox',ruleset:'classic',seed:537});
test('Classic board has its own scrollable stage and route SVG; menu stays outside panning viewport',()=>{
 const html=read('index.html'),before=html.indexOf('id="boardStage"'),road=html.indexOf('id="routeOverlay"'),end=html.indexOf('id="boardViewport"');
 assert.ok(end<before&&before<road);
 assert.ok(html.indexOf('id="venueLayer"')>html.indexOf('</div>',road));
 assert.ok(html.includes('id="classicBoardExplore"')&&html.includes('id="classicBoardFit"'));
 assert.match(read('src/app.js'),/frame:\$\('boardStage'\)/);
});
test('Classic geography is a 5x4 route and does not become a 3x5 mobile serpentine',()=>{
 const css=read('styles.css');
 for(const [id,row,col] of [['clinic',1,1],['home',1,3],['market',1,5],['diner',2,5],['agency',4,3],['cinema',2,1]])
  assert.ok(css.includes(`.board-tile[data-travel="${id}"]{grid-area:${row}/${col}!important}`));
 assert.match(css,/data-classic-board-view="explore"/);
 assert.match(css,/width:740px/);
 assert.match(read('src/route-overlay.js'),/const gutter=\{/);
 assert.match(read('src/route-overlay.js'),/this\.gutter=gutter/);
});
test('computer bonus matches source state 4 and keeps the no-computer RNG sequence intact',()=>{
 let calls=0;const r=Weekly.computerBonus(false,()=>{calls++;return 0;});
 assert.equal(calls,0);assert.equal(r.awarded,0);assert.equal(r.sourceState,4);
 assert.equal(Weekly.computerBonus(true,()=>.3).awarded,0);
 const rolls=[0,.5];assert.equal(Weekly.computerBonus(true,()=>rolls.shift()).awarded,60);
 assert.equal(Weekly.computerBonus(true,()=>0).awarded,20);
 const win=[0,.999999];assert.equal(Weekly.computerBonus(true,()=>win.shift()).awarded,100);
});
test('DOS computer event awards cash, not bank, and records source identity',()=>{
 const g=classic(),p=g.player;
 p.cash=0;p.bank=10;p.fed=true;p.owned.push('computer');p.classicEquipment.computer=0; // Ownership, not working condition, is the recovered state-4 check
 const before=g.classicWeekEvents.length;
 g.rand=()=>0;
 const messages=g.weekend(p);
 assert.ok(messages.some(m=>m.includes('Computer project earned $20')));
 assert.equal(p.cash,20);assert.equal(p.bank,10);
 const event=g.classicWeekEvents.slice(before).find(e=>e.kind==='computer-bonus');
 assert.equal(event.sourceState,4);assert.equal(event.amount,20);
});
test('computer bonus does not modify Modern computer income and does not affect Classic without one',()=>{
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:537}),m=modern.player;
 m.cash=100;m.bank=10;m.fed=true;m.owned.push('computer');modern.rand=()=>0;
 modern.weekend(m);assert.equal(m.bank,50);
 const classicGame=classic(),p=classicGame.player;p.cash=0;p.bank=10;p.fed=true;classicGame.rand=()=>0;
 classicGame.weekend(p);assert.equal(p.bank,10);
 assert.equal(classicGame.classicWeekEvents.filter(e=>e.kind==='computer-bonus').length,0);
});

test('phone Overview first tap inspects rather than spending travel time; Explore is actionable',()=>{
 const code=read('src/app.js');
 assert.match(code,/game\.isClassic&&compactClassicBoard\(\)&&\(classicBoardView==='fit'\|\|classicBoardFocusTarget!==target\)/);
 assert.match(code,/classicBoardSetView\('explore',\{focusId:target\}\);\s*return;/);
 assert.match(code,/routeTravelBusy=true;boardManualPan=false/);
 assert.match(code,/onStep:point=>\{if\(game\.player\.id===actorId\)classicBoardFollowPawn\(point\);\}/);
 assert.match(read('src/route-overlay.js'),/typeof onStep==='function'/);
});
test('source-state food and clothing event contracts reject invalid input',()=>{
 const t=Weekly.foodStorageTrace(9,6,true,false);
 assert.equal(t.sourceState,10);assert.equal(t.lost,3);assert.equal(t.storageLimit,6);assert.equal(t.happinessDelta,-1);assert.equal(t.sourceVerified,true);
 assert.equal(Weekly.foodStorageTrace(3,0,false,false).storageLimit,null);
 assert.throws(()=>Weekly.foodStorageTrace(-1,0,false,false));
 assert.equal(Weekly.clothingWarning(2,1).oneWeekRemaining,true);
 assert.equal(Weekly.clothingWarning(1,0).expired,true);
 assert.equal(Weekly.clothingWarning(2,1).sourceState,18);
 assert.throws(()=>Weekly.clothingWarning(1,2));
});
test('Classic weekly food spoilage logs state 10, without invented medical charge',()=>{
 const g=classic(),p=g.player;p.fed=true;p.cash=25;p.groceries=3;
 const before=g.classicWeekEvents.length;
 const notes=g.weekend(p);
 assert.equal(p.groceries,0);assert.equal(p.cash,25);
 assert.ok(notes.some(n=>n.includes('Fresh food lost before consumption')));
 const event=g.classicWeekEvents.slice(before).find(e=>e.kind==='food-dos-064');
 assert.deepEqual(event.sourceStateOrder,[8,10,12,14,16]);assert.equal(event.storageLoss,3);
});
test('Classic clothing warnings have DOS state 18 in event history; Modern has no such event',()=>{
 const g=classic();g.player.clothing.casual=2;g.newWeek();
 assert.ok(g.classicWeekEvents.some(e=>e.kind==='clothing-warning'&&e.sourceState===18&&e.garment==='casual'&&e.weeks===1));
 const modern=new Game({mode:'sandbox',ruleset:'modern',seed:538});modern.player.clothing.casual=2;modern.newWeek();
 assert.equal(modern.classicWeekEvents.filter(e=>e.kind==='clothing-warning').length,0);
});

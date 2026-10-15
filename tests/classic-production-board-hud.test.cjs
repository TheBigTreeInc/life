'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {model}=require('../src/classic-board-hud.js');
const D=require('../src/data.js');
const layout=require('../assets/boards/classic/routes.v1.json');
const manifest=require('../assets/art/styles/classic-modern/manifest.json');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('all 13 approved exterior/interior pairs are present, correctly mapped and bounded',()=>{
 assert.equal(Object.keys(manifest.venues).length,13);
 for(const place of D.classicPlaces){
  const a=manifest.venues[place.id];assert.ok(a,place.id);
  for(const key of ['card','detail']){
   assert.ok(a[key].includes(a.slug),`${place.id} ${key}`);
   assert.ok(fs.statSync(path.join(root,a[key])).size<500*1024,`${place.id} size`);
  }
  assert.ok(Array.isArray(a.doorAnchor));
  assert.ok(a.doorAnchor.every(x=>x>=0&&x<=1));
 }
});

test('the Classic ring keeps the corrected five-row landmark and scenic gaps on every screen size',()=>{
 assert.equal(D.classicPlaces.length,13);
 assert.equal(Object.keys(layout.venues).length,13);
 const expected={clinic:[1,1],housing:[2,1],home:[3,1],pawn:[4,1],market:[5,1],
  diner:[5,2],boutique:[5,3],tech:[5,5],university:[4,5],agency:[2,5],office:[1,5],bank:[1,4],cinema:[1,3]};
 for(const p of D.classicPlaces){
  assert.deepEqual(p.cell,expected[p.id],p.id);
  const stop=layout.nodes.find(n=>n.id===layout.venues[p.id].stop);
  assert.deepEqual(stop.cell,p.cell,p.id);
  assert.equal(layout.venues[p.id].placeNum,p.placeNum,p.id);
 }
 assert.equal(new Set(D.classicPlaces.map(p=>p.cell.join(','))).size,13);
 const css=read('styles.css');
 assert.match(css,/data-classic-board-view="explore".*\.board-stage\{width:740px/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
});

test('Classic clock projects exactly 60 playable action units, never wall time',()=>{
 const g={isClassic:true,week:4,player:{id:'player',name:'Alpha',hours:60,color:'#445566'},rules:{hours:60}};
 const full=model(g);assert.equal(full.remaining,60);assert.equal(full.percent,100);assert.equal(full.degrees,0);
 g.player.hours=30;const half=model(g);assert.equal(half.remaining,30);assert.equal(half.degrees,180);
 g.player.hours=0;const empty=model(g);assert.equal(empty.percent,0);assert.equal(empty.degrees,360);
 assert.match(empty.accessibleLabel,/Alpha's turn, week 4, 0 of 60 clock units/);
 g.player.hours=72;assert.equal(model(g).remaining,60);
});

test('turn presentation follows active authority without affecting world state',()=>{
 const game={isClassic:true,week:9,player:{id:'jones',name:'Jones',hours:26,color:'#123456',isAI:true},rules:{hours:60}};
 const snapshot=JSON.stringify(game);
 assert.equal(model(game).ownerLabel,'JONES IS PLAYING');
 assert.equal(model(game,true,false).ownerLabel,'WAITING FOR PLAYER');
 game.player={id:'friend',name:'Alex',hours:59,color:'#ff8040',isAI:false};
 assert.equal(model(game,true,true).name,'Alex');
 assert.equal(model(game,true,true).ownerLabel,'YOUR TURN');
 assert.notEqual(JSON.stringify(game),snapshot);
});

test('Classic center clock and turn banner coexist with the Modern hub and centered venues',()=>{
 const html=read('index.html'),app=read('src/app.js'),styles=read('styles.css');
 for(const id of ['classicTurnCenter','classicTurnAvatar','classicTurnKicker','classicTurnName','classicTurnDial','classicDialValue','classicDialWeek','venueLayer','turnHeadline'])
  assert.ok(html.includes(`id="${id}"`),id);
 assert.match(app,/classicTurnCenterRender\(online,ours\)/);
 assert.match(app,/ClassicBoardHud\.model\(game,online,ownTurn\)/);
 assert.match(styles,/body:not\(\[data-ruleset="classic"\]\) \.classic-turn-center\{display:none!important\}/);
 assert.match(read('tools/build-offline.mjs'),/'classic-board-hud'/);
});

test('v0.5.48 Classic weekly dial lives on garden landmark and phone-only board switch is presentation only',()=>{
 const html=read('index.html'),app=read('src/app.js'),css=read('styles.css');
 const center=html.slice(html.indexOf('id="classicTurnCenter"'),html.indexOf('id="classicBoardClock"'));
 assert.doesNotMatch(center,/id="classicTurnDial"/);
 assert.match(html,/class="classic-board-clock" id="classicBoardClock"/);
 assert.match(html,/id="classicBoardClock"[^>]*>[\s\S]*id="classicTurnDial"/);
 assert.match(app,/\$\('classicBoardClock'\)\.hidden=!game\.isClassic/);
 assert.match(app,/const view=compactClassicBoard\(\)\?classicBoardView:'fit'/);
 assert.match(app,/if\(!compactClassicBoard\(\)\|\|/);
 assert.match(css,/@media\(min-width:721px\)\{[\s\S]*\.classic-board-modes\{display:none!important\}/);
 assert.match(css,/\.classic-board-clock\{position:absolute;left:50%;top:90%/);
 const roads=read('src/route-overlay.js');
 assert.match(roads,/south:frontageY\('agency'\)/);
});

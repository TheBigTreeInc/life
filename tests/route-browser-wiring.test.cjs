const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const styles=fs.readFileSync('styles.css','utf8');
const {pathPointAt}=require('../src/route-overlay.js');
test('route overlay persists outside re-rendered board tiles and before venue',()=>{
 assert.ok(html.includes('id="routeOverlay"'));
 assert.ok(html.indexOf('id="board"')<html.indexOf('id="routeOverlay"'));
 assert.ok(html.indexOf('id="routeOverlay"')<html.indexOf('id="venueLayer"'));
 assert.ok(styles.includes('.route-overlay{position:absolute'));
 assert.ok(styles.includes('pointer-events:none'));
});
test('a successful authoritative travel is charged once then animated then opens the venue',()=>{
 assert.ok(app.includes("net.execute('travel',target,()=>game.travel(target))"));
 assert.ok(app.includes('const arrived=await routeOverlay.animate(actorId,from,target,{onStep:'));
 assert.ok(app.includes('if(arrived&&game.player.id===actorId'));
 assert.ok(app.includes('if(from===target){openVenue(target);return;}'));
 assert.ok(app.includes('if(!btn||venueInteraction.open||routeTravelBusy)return'));
});
test('remote guest confirmation drives animation and stale location never opens actions',()=>{
 assert.ok(app.includes('pendingGuestRoute={from,to:target,actorId}'));
 assert.ok(app.includes('if(net.ownTurn()&&game.player.location===target)'));
 assert.ok(app.includes('routeOverlay.animate(actorId,journey?.from||target,target)'));
});
test('route interpolation stays on ordered segments and never overshoots',()=>{
 const points=[{x:0,y:0},{x:10,y:0},{x:10,y:10}];
 assert.deepEqual(pathPointAt(points,0),{x:0,y:0});
 assert.deepEqual(pathPointAt(points,.5),{x:10,y:0});
 assert.deepEqual(pathPointAt(points,1),{x:10,y:10});
 assert.deepEqual(pathPointAt(points,7),{x:10,y:10});
});
test('local launcher exists alongside offline PLAY and full verifier',()=>{
 assert.match(fs.readFileSync('TEST-LOCAL.bat','utf8'),/tools\\verify\.mjs/);
 assert.match(fs.readFileSync('PLAY.bat','utf8'),/PLAY\.html/);
});

test('Classic storefront entrances have distinct art geometry without changing historic path/clock authority',()=>{
 const layout=require('../assets/boards/classic/routes.v1.json');
 const routes=require('../src/route-graph.js');
 assert.equal(Object.keys(layout.venues).length,13);
 assert.equal(layout.originalRoute.waypointCount,170);
 for(const [id,entry] of Object.entries(layout.venues)){
  assert.ok(Array.isArray(entry.artEntrance),id);
  assert.equal(entry.artEntrance.length,2);
  assert.ok(entry.artEntrance.every(v=>Number.isFinite(v)&&v>=0&&v<=1),id);
  assert.ok(Number.isInteger(entry.routeIndex),id);
 }
 assert.deepEqual(routes.validate(layout,Object.keys(layout.venues)),[]);
 const modified=structuredClone(layout);
 modified.venues.market.artEntrance=[1.1,0.5];
 assert.match(routes.validate(modified).join(';'),/Invalid art entrance: market/);
 const overlay=fs.readFileSync('src/route-overlay.js','utf8');
 assert.match(overlay,/doorWalk\(id\)/);
 assert.match(overlay,/this\.doorWalk\(from\)/);
 assert.match(overlay,/\.\.\.road\.slice\(1,-1\)/);
 assert.match(overlay,/this\.projectedRoad\(from,to\)/);
 assert.match(overlay,/const activeDoors=new Set/);
});

test('The venue-clock remains available above the action menu and follows the shared Classic HUD state',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const app=fs.readFileSync('src/app.js','utf8');
 const css=fs.readFileSync('styles.css','utf8');
 for(const id of ['venueClock','venueClockValue','venueClockRemaining','venueClockWeek'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(app,/venueDial\.hidden=!venueInteraction\.open/);
 assert.match(app,/venueDial\.setAttribute\('aria-valuenow',String\(state\.remaining\)\)/);
 assert.match(app,/\$\('venueClockRemaining'\)\.textContent=`\$\{state\.remaining\} \/ \$\{state\.max\} units`/);
 assert.match(css,/\.venue-clock\[hidden\]\{display:none!important\}/);
});

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Game=require('../src/engine.js');
const D=require('../src/data.js');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('src/app.js','utf8');
const css=fs.readFileSync('styles.css','utf8');

test('the board owns one venue dialog, one actionable list and no destination sidebar',()=>{
 for(const token of ['id="venueLayer"','id="venueTitle"','id="venueActions"','id="venueDone"','id="venueFeedback"','id="venueClose"','id="venueScrim"'])assert.ok(html.includes(token),token);
 for(const token of ['id="gameActions"','id="destinationDrawerBtn"','id="mobileActionsBadge"','data-mobile-tab="actions"','id="actions"'])assert.ok(!html.includes(token),'old duplicate '+token);
 assert.equal((html.match(/id="endTurnBtn"/g)||[]).length,1);
 assert.equal((html.match(/id="venueActions"/g)||[]).length,1);
 assert.ok(html.indexOf('id="board"')<html.indexOf('id="venueLayer"'));
 assert.ok(html.indexOf('id="venueLayer"')<html.indexOf('class="status-ticker"'));
 assert.match(css,/\.game-layout\{grid-template-columns:minmax\(265px,310px\) minmax\(0,1fr\)!important/);
});
test('board click opens current venue free and navigates via the unchanged network command path',()=>{
 assert.ok(app.includes("game.player.location===target){openVenue(target);return;"));
 assert.ok(app.includes("net.execute('travel',target,()=>game.travel(target))"));
 assert.ok(app.includes('if(result.ok&&net.role!==\'guest\'){store();render();openVenue(target);}'));
 assert.ok(app.includes('if(net.role&&!net.ownTurn())'));
 assert.ok(app.includes('if(!venueInteraction.open)return;'));
});
test('action execution is gated, delegated, de-duplicated and rerendered',()=>{
 assert.ok(app.includes("$('venueActions').addEventListener('click'"));
 assert.ok(app.includes("net.execute('act',actionId,()=>game.act(actionId))"));
 assert.ok(app.includes('venueInteraction.pending=true'));
 assert.ok(app.includes('venueInteraction.pending=false'));
 assert.ok(app.includes('refreshVenueAfterAction(result)'));
 assert.ok(app.includes("$('venueActions').addEventListener('change'"));
 assert.ok(app.includes('if(actionId.startsWith(\'apply:\')&&confirmEmploymentSwitch(actionId))return;'));
 assert.ok(app.includes('a.enabled&&(!net?.role||net.ownTurn())&&!net?.busy&&!venueInteraction.pending'));
});
test('Escape, Done and focus return do not call Game actions or consume time',()=>{
 for(const token of ["$('venueClose').addEventListener('click',()=>closeVenue())","$('venueDone').addEventListener('click',()=>closeVenue())","$('venueScrim').addEventListener('click',()=>closeVenue())","venueFocusTrap(e)","if(venueInteraction.open){closeVenue();return;}"])assert.ok(app.includes(token),token);
 assert.ok(app.includes("$('overlay').dataset.kind!=='encounter'"));
 assert.ok(app.includes('function updateVenueAccessibility()'));
 assert.ok(app.includes("$('board').querySelectorAll('[data-travel]')"));
});
test('mobile retains City / My life with no Activities tab and an internally scrollable venue',()=>{
 assert.equal((html.match(/data-mobile-tab=/g)||[]).length,2);
 assert.match(css,/\.venue-menu \.actions-scroller\{flex:1 1 auto/);
 assert.match(css,/\.venue-window\{position:relative/);
 assert.match(css,/@media\(max-width:1024px\)/);
 assert.match(css,/\.mobile-nav\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}/);
});
test('game remains unchanged: thirteen destinations, travel cost and bank/agency actions',()=>{
 const g=new Game({ruleset:'classic',name:'Tester'});
 assert.equal(D.places.length,13);
 const at=g.player.location;
 const hours=g.player.hours;
 const reopen=g.travel(at);
 assert.ok(reopen.ok);assert.equal(g.player.hours,hours);
 const agency=g.travel('agency');assert.ok(agency.ok);assert.ok(g.player.hours<hours);
 assert.ok(g.actions().some(a=>a.id.startsWith('apply:')));
 assert.ok(g.actions().some(a=>a.id.startsWith('apply:')&&g.jobReasons(g.player,a.req).length>0),'unqualified applications remain discoverable');
});
test('all global shortcuts and WebSocket chat remain separate from venue interaction',()=>{
 for(const id of ['chatToggle','onlineBtn','coopMenu','financeBtn','careerBtn','newBtn','saveBtn','loadBtn','guideBtn'])assert.ok(html.includes(`id="${id}"`));
 assert.ok(app.includes("net.execute('endTurn',null,()=>game.endTurn())"));
 assert.ok(!app.includes("setMobileView('actions')"));
 assert.ok(app.includes('const ENABLE_CHARACTER_CUSTOMIZATION=false'));
});

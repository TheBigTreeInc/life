'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const read=file=>readFileSync(file,'utf8');
const html=read('index.html'),src=read('src/app.js'),css=read('styles.css');
test('building search panel is removed, phone End Week is at the top of the board',()=>{
 assert.doesNotMatch(html,/id="classicBoardJump"|classic-board-jump-label/);
 assert.doesNotMatch(src,/\$\('classicBoardJump'\)/);
 assert.equal((html.match(/id="mobileEndTurnBtn"/g)||[]).length,1);
 assert.ok(html.indexOf('id="mobileEndTurnBtn"')<html.indexOf('id="boardViewport"'));
 assert.ok(html.indexOf('id="mobileEndTurnBtn"')<html.indexOf('id="endTurnBtn"'));
 assert.match(html,/id="venueWork"[^>]*hidden/);
 assert.match(html,/id="venueDone"/);
 assert.match(css,/@media\(max-width:1024px\)[\s\S]*\.mobile-end-turn:not\(\[hidden\]\)/);
 assert.match(css,/\.mobile-end-turn:not\(\[hidden\]\)\{[^}]*min-height:44px/);
 assert.match(css,/\.status-ticker #endTurnBtn\{display:none\}/);
});
test('Classic and Modern use the same phone toolbar, while Classic map controls are hidden in Modern',()=>{
 assert.match(src,/\$\('classicBoardToolbar'\)\.hidden=!classic&&!mobileBreakpoint\.matches/);
 assert.match(src,/\$\('mobileEndTurnBtn'\)\.hidden=!mobileBreakpoint\.matches/);
 assert.match(css,/body:not\(\[data-ruleset="classic"\]\) \.classic-board-modes/);
 assert.match(src,/mobileBreakpoint\.addEventListener\('change',\(\)=>\{classicBoardSync\(\);render\(\);\}\)/);
});
test('phone End Week invokes the authoritative desktop action only when enabled',()=>{
 const from=src.indexOf("$('mobileEndTurnBtn').addEventListener('click',()=>{");
 const to=src.indexOf("$('boardViewport').addEventListener('pointerdown'",from);
 assert.ok(from>0&&to>from);
 const handler=src.slice(from,to);
 const registered={};let commandCalls=0;
 const mobile={disabled:false,addEventListener:(event,cb)=>{registered[event]=cb}};
 const canonical={disabled:false,click:()=>{commandCalls++}};
 const $=id=>id==='mobileEndTurnBtn'?mobile:canonical;
 vm.runInNewContext(handler,{$});
 registered.click();assert.equal(commandCalls,1);
 canonical.disabled=true;registered.click();assert.equal(commandCalls,1);
 canonical.disabled=false;mobile.disabled=true;registered.click();assert.equal(commandCalls,1);
 mobile.disabled=false;registered.click();assert.equal(commandCalls,2);
 assert.equal((src.match(/net\.execute\('endTurn',null,\(\)=>game\.endTurn\(\)\)/g)||[]).length,1);
});
test('phone button mirrors all authoritative turn-disabled states and adapts its label',()=>{
 assert.match(src,/\$\('mobileEndTurnBtn'\)\.disabled=\$\('endTurnBtn'\)\.disabled/);
 assert.match(src,/\$\('endTurnBtn'\)\.disabled=routeTravelBusy\|\|venueInteraction\.open\|\|!!game\.winner/);
 assert.match(src,/!!net\?\.busy\|\|venueInteraction\.pending/);
 assert.match(src,/\$\('mobileEndTurnBtn'\)\.querySelector\('span:first-child'\)\.textContent=I18n\.uiText\(/);
 assert.match(src,/mobileBreakpoint\.matches\?\$\('mobileEndTurnBtn'\):\$\('endTurnBtn'\)/);
});
test('offline build contains the phone action, no building dropdown, and the existing work button',()=>{
 const offline=read('PLAY.html');
 assert.match(offline,/id="mobileEndTurnBtn"/);
 assert.doesNotMatch(offline,/id="classicBoardJump"/);
 assert.match(offline,/id="venueWork"/);
 assert.match(offline,/\$\('mobileEndTurnBtn'\)\.addEventListener\('click'/);
});

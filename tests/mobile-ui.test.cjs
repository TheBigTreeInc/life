const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const html=readFileSync('index.html','utf8'),css=readFileSync('styles.css','utf8'),js=readFileSync('src/app.js','utf8');

test('mobile bottom navigation has three real accessible tab buttons',()=>{
 for(const [view,label] of [['city','City'],['actions','Activities'],['life','My life']]){
  assert.match(html,new RegExp(`data-mobile-tab="${view}"[^>]*aria-controls="game`));
  assert.ok(html.includes(`<strong>${label}</strong>`));
 }
 assert.ok(html.includes('aria-label="Game panels"'));
 assert.match(js,/setMobileView\(tab\.dataset\.mobileTab\)/);
 assert.match(js,/tab\.setAttribute\('aria-pressed',String\(active\)\)/);
});
test('mobile state affects presentation only, preserves engine and sync semantics',()=>{
 assert.match(js,/mobileView='city'/);
 assert.match(js,/mobileBreakpoint=window\.matchMedia\('\(max-width:1024px\)'\)/);
 assert.match(js,/\.inert=mobileBreakpoint\.matches&&view!==name/);
 assert.match(js,/mobileBreakpoint\.addEventListener\('change',updateLayout\)/);
 assert.match(js,/if\(result\.ok&&mobileBreakpoint\.matches\)setMobileView\('actions'\)/);
 assert.ok(!readFileSync('src/engine.js','utf8').includes('mobileView'));
});
test('status and control affordances work without changing weekly time',()=>{
 for(const id of ['mobileWeek','mobileHours','mobileCash','mobilePlayer','mobileNav','gameCity','gameActions','gameLife'])assert.ok(html.includes(`id="${id}"`),id);
 for(const code of ["$('mobileWeek').textContent", "$('mobileHours').textContent", "$('mobileCash').textContent", "$('mobilePlayer').textContent"])assert.ok(js.includes(code),code);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/\.mobile-nav button\[aria-pressed="true"\]/);
 assert.match(css, /min-height:58px/);
});
test('online setup uses only Looprd server FQDN, preserving friend-code protocol',()=>{
 assert.match(js,/LOOPRD SERVER FQDN/);
 assert.match(js,/api\.server\.country/);
 const network=readFileSync('src/network.js','utf8');
 assert.match(network,/serverBase\(input\)/);
 assert.match(network,/\+'\/looprd\/the-life-loop\/v1'/);
 assert.match(network,/inviteLink\(\)/);
});

test('top-right game menu contains save, load and help, with accessible toggle',()=>{
 for(const id of ['utilityMenuBtn','utilityMenu','saveBtn','loadBtn','guideBtn']) assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/aria-controls="utilityMenu"/);
 assert.match(js,/setUtilityMenu\(open\)/);
 assert.match(js,/setUtilityMenu\(false\);guide\(\)/);
 assert.match(css,/\.utility-menu\[hidden\]/);
});
test('story and destination have dock toggles and notification circles',()=>{
 for(const id of ['storyDrawerBtn','destinationDrawerBtn','storyBadge','destinationBadge','mobileStoryBadge','mobileActionsBadge','drawerScrim']) assert.ok(html.includes(`id="${id}"`),id);
 assert.match(css,/@media\(min-width:1025px\) and \(max-width:1599px\)/);
 assert.match(css,/@media\(min-width:1600px\)/);
 assert.match(js,/function setDrawer\(which\)/);
 assert.match(js,/function refreshBadges\(\)/);
 assert.match(js,/function markViewed\(which\)/);
});
test('active turn banner reports ownership and connection state for both players',()=>{
 for(const id of ['turnBanner','turnHeadline','turnDetails','turnConnection','turnLamp']) assert.ok(html.includes(`id="${id}"`),id);
 assert.match(js,/net\.ownTurn\(\)/);
 assert.match(js,/net\.role==='host'\?'Host':'Guest'/);
 assert.match(js,/net\.socketOpen\?'● WS live'/);
});
test('multiplayer room UI exposes an explicit Looprd component API probe',()=>{
 assert.match(js,/id="checkLooprd"/);
 assert.match(js,/net\.probe\(\)/);
 assert.match(js,/Room version:/);
 assert.match(js,/Component schema:/);
});

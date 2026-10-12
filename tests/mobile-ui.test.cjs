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
 assert.match(js,/mobileBreakpoint\.addEventListener\('change',updateMobileAccessibility\)/);
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

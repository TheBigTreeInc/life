const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles.css','utf8'),js=fs.readFileSync('src/app.js','utf8');
test('only one compact city heading and no old green or dark header',()=>{
 assert.ok(html.includes('class="city-toolbar"'));
 assert.ok(!html.includes('<header class="topbar"'));
 assert.ok(!html.includes('class="top-center"'));
 assert.equal((html.match(/id="turnBanner"/g)||[]).length,1);
 assert.ok(!html.includes('class="board-heading"'));
 assert.ok(html.indexOf('id="careerBtn"')<html.indexOf('id="financeBtn"'));
 assert.ok(html.includes('id="cityName"'));
 assert.ok(js.includes("$('cityName').textContent=eraMeta().city.toUpperCase()"));
});
test('chat unread indicator beside destination and new game inside utility menu',()=>{
 const d=html.indexOf('id="destinationDrawerBtn"'),c=html.indexOf('id="chatToggle"'),o=html.indexOf('id="onlineBtn"'),m=html.indexOf('id="utilityMenuBtn"');
 assert.ok(d<c&&c<o&&o<m);
 assert.ok(html.indexOf('id="utilityMenu"')<html.indexOf('id="newBtn"'));
 assert.ok(html.includes('id="chatBadge"')&&html.includes('id="destinationBadge"'));
 assert.ok(js.includes('badge.hidden=!net?.chatUnread'));
 assert.ok(js.includes('toggle.disabled=!live'));
 assert.ok(js.includes("setCoopMenu($('coopMenu').hidden)"));
});
test('co-op dropdown exposes room transport and entry into diagnostics',()=>{
 for(const id of ['coopMenu','coopOpenDetails','coopRoomTitle','coopRoomState','coopTurnState','coopTransport'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(js,/function setCoopMenu\(open\)/);
 assert.match(js,/net\.socketOpen\?'● WSS live'/);
 assert.match(js,/setCoopMenu\(false\);onlineDialog\(\)/);
});
test('one status ticker under buildings exposes week, market and multiplayer turn',()=>{
 const board=html.indexOf('id="board"'),ticker=html.indexOf('class="status-ticker"');
 assert.ok(board<ticker);
 for(const id of ['turnLamp','turnHeadline','turnDetails','timeStrip','topWeek','economy'])assert.ok(html.slice(ticker).includes(`id="${id}"`),id);
 assert.match(css,/\.status-ticker/);
 assert.ok(js.includes("$('economy').textContent="));
 assert.ok(js.includes("$('turnHeadline').textContent=turnTitle"));
});

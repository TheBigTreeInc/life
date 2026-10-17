const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const a=fs.readFileSync('src/app.js','utf8'),h=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles.css','utf8');
test('phone board always starts in overview, without persisted explore choice',()=>{
 assert.match(a,/let classicBoardView='fit'/);
 assert.doesNotMatch(a,/getItem\(CLASSIC_BOARD_PREF\)/);
 assert.doesNotMatch(a,/setItem\(CLASSIC_BOARD_PREF/);
 assert.match(a,/if\(compactClassicBoard\(\)\&\&game\.isClassic\)classicBoardSetView\('fit'\)/);
});
test('focus before travel uses two taps and does not call game.travel on first tap',()=>{
 assert.match(a,/classicBoardFocusTarget!==target/);
 assert.match(a,/classicBoardSetView\('explore',\{focusId:target\}\)/);
 assert.match(a,/classicBoardFocusTarget=mode==='explore'/);
 assert.match(a,/Tik nogmaals om te bezoeken/);
 assert.match(h,/id="classicBoardSelection"/);
 assert.match(css,/data-camera-focus="true"/);
});
test('mobile Work footer delegates to the existing authorized work card only',()=>{
 assert.match(h,/id="venueWork"[^>]*hidden/);
 assert.match(h,/id="venueDone"/);
 assert.match(a,/allActions\.find\(a=>a\.id==='work'\)/);
 assert.match(a,/workShortcut\.disabled=!workAction\?\.enabled\|\|!ours/);
 assert.match(a,/querySelectorAll\('\[data-act\]'\)/);
 assert.match(a,/if\(action\&\&!action\.disabled\)action\.click\(\)/);
 assert.match(css,/@media\(max-width:720px\)[\s\S]*\.venue-work:not\(\[hidden\]\)/);
});
test('normal career and finance views do not render source-level decision traces',()=>{
 assert.doesNotMatch(a,/DOS economy · market & rival diagnostics/);
 assert.doesNotMatch(a,/\$\{marketIndices\}\$\{classicNeeds\}/);
 assert.match(a,/\$\{classicNeeds\}\$\{wellbeing\}\$\{maintenancePanel\}\$\{paychecks\}/);
 assert.match(a,/Plan your next two weeks/);
 assert.match(a,/Your pay after rent deductions and other charges/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const GoalPresets=require('../src/goal-presets.js');
const UX57=require('../src/life-pass-057.js');
const Setup=require('../src/setup-preferences.js');
test('GoalPresets.goals(key) provides one authoritative four-dimensional target set',()=>{
 for(const [key,target] of [['quick',50],['standard',65],['extended',80]]){
  const actual=GoalPresets.goals(key);
  assert.notDeepEqual(actual,UX57.presetGoals(key)); // v057 pace helpers are a distinct legacy API
  assert.deepEqual(actual,{wealth:target,happiness:target,education:target,career:target});
  assert.equal(GoalPresets.total(key),4*target);
  assert.equal(GoalPresets.detect(actual),key);
  assert.ok(Object.isFrozen(actual));
 }
 assert.throws(()=>GoalPresets.goals('custom'),/Unknown goal preset/);
 assert.throws(()=>GoalPresets.goals('__proto__'),/Unknown goal preset/);
 assert.throws(()=>GoalPresets.goals(null),/Unknown goal preset/);
});
test('manual/custom goals and saved preferences remain unchanged',()=>{
 const mixed={wealth:30,happiness:65,education:80,career:50};
 assert.equal(GoalPresets.detect(mixed),'custom');
 const sanitized=Setup.sanitize({goals:mixed});
 assert.deepEqual(sanitized.goals,mixed);
 assert.deepEqual(GoalPresets.goals('standard'),{wealth:65,happiness:65,education:65,career:65});
});
test('ZipRunner retained local contract is implemented in BOTH browser outputs',()=>{
 const app=read('src/app.js'),html=read('index.html'),offline=read('PLAY.html');
 assert.match(app,/GoalPresets\.goals\(key\)/);
 assert.match(app,/GoalPresets\.detect\(/);
 assert.match(app,/I18n\.set\(/);
 assert.match(app,/id="campaignPreset"/);
 assert.match(html,/id="languageSelect"/);
 assert.match(html,/src\/goal-presets\.js/);
 assert.match(offline,/root\.LifeGoalPresets=api/);
 assert.match(offline,/GoalPresets\.goals\(key\)/);
});
test('new release version is distinct and packaging includes shipped contract tests',()=>{
 const pkg=JSON.parse(read('package.json'));
 const ledger=JSON.parse(read('docs/release-ledger.json')).releases;
 assert.ok(Number(pkg.version.split('.')[2])>=68);
 assert.equal(ledger.at(-1).version,pkg.version);
 assert.ok(ledger.some(entry=>entry.version==='0.5.68'&&entry.supersedes==='0.5.67'));
 assert.match(read('tools/package-ziprunner.py'),/src\/goal-presets\.js/);
 assert.match(read('tools/package-ziprunner.py'),/glob\('\*\.test\.cjs'\)/);
});

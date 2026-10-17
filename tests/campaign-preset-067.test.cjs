'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Rules=require('../src/rule-presets.js');
const Prefs=require('../src/setup-preferences.js');

test('retained ZipRunner campaignPreset contract is present in Quick Start and offline build',()=>{
 const app=read('src/app.js'),offline=read('PLAY.html');
 for(const html of [app,offline]){
  assert.match(html,/id="campaignPreset"/);
  for(const value of ['classic','custom','modern'])assert.match(html,new RegExp('<option value="'+value+'"'));
 }
 assert.match(app,/\$\('campaignPreset'\)\.addEventListener\('change'/);
 assert.match(app,/syncCampaignPreset\(\)/);
 assert.match(app,/I18n\.set\(/);
 assert.match(read('index.html'),/id="languageSelect"/);
});
test('campaign selection controls existing rule base without creating new save fields',()=>{
 const script=read('src/app.js');
 assert.match(script,/form\.querySelector\(`input\[name="ruleset"\]/);
 assert.match(script,/RulePresets\.normalize\(base\)/);
 assert.match(script,/updateMode\(\);updatePreferences\(\)/);
 assert.match(script,/selector\.dataset\.customRequested/);
 assert.equal(Prefs.DEFAULTS.ruleset,'classic');
 assert.equal(Rules.customized('classic',Rules.normalize('classic')),false);
 assert.equal(Rules.customized('modern',Rules.normalize('modern')),false);
 assert.equal('campaignPreset' in Prefs.DEFAULTS,false);
});
test('release 0.5.67 is unique and versioned; retained local tests may coexist',()=>{
 const pkg=JSON.parse(read('package.json'));
 const ledger=JSON.parse(read('docs/release-ledger.json')).releases;
 const entry=ledger.find(r=>r.version==='0.5.67');
 assert.ok(pkg.version>='0.5.67');
 assert.equal(entry.artifact,'the-life-loop-0.5.67-ziprunner.zip');
 assert.equal(entry.supersedes,'0.5.66');
 assert.equal(ledger.filter(r=>r.version==='0.5.67').length,1);
 // A merge may legitimately contain additional local-only tests.
 assert.ok(fs.existsSync(path.join(root,'tests/campaign-preset-067.test.cjs')));
});

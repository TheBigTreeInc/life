'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Game=require('../src/engine.js');
const Food=require('../src/classic-consumables-064.js');
const I18n=require('../src/i18n.js');
const GoalPresets=require('../src/goal-presets.js');
const root=path.resolve(__dirname,'..');
test('local-only tests do not invalidate the versioned release contract',()=>{
 const s=fs.readFileSync(path.join(root,'tests/campaign-preset-067.test.cjs'),'utf8');
 assert.doesNotMatch(s,/local test unexpectedly shipped/);
});
test('semantic locale keys work in EN, NL and unknown fallback without affecting Game saves',()=>{
 const game=new Game({ruleset:'classic',mode:'sandbox',seed:569});
 const snapshot=game.snapshot();
 assert.equal(I18n.t('newGame'),'New game');
 assert.equal(I18n.t('newGame','nl'),'Nieuw spel');
 assert.equal(I18n.t('nl','newGame'),'Nieuw spel');
 assert.equal(I18n.t('newGame','unknown'),'New game');
 assert.equal(I18n.translations.nl.newGame,'Nieuw spel');
 assert.ok(Object.keys(I18n.translations.nl).every(key=>Object.hasOwn(I18n.translations.en,key)));
 I18n.set('nl',null);
 assert.deepEqual(game.snapshot(),snapshot);
});
test('campaign preset values begin at original DOS 50, stay distinct and within bounds',()=>{
 for(const [k,n] of [['quick',50],['standard',65],['extended',80]]){
  assert.deepEqual(GoalPresets.goals(k),{wealth:n,happiness:n,education:n,career:n});
  assert.equal(GoalPresets.detect(GoalPresets.goals(k)),k);
 }
 const game=new Game({ruleset:'classic',mode:'sandbox',goals:GoalPresets.goals('quick')});
 assert.deepEqual(game.settings.goals,GoalPresets.goals('quick'));
});
test('typed DOS takeout survives save/reload and short-lived food clears at week boundary',()=>{
 const g=new Game({ruleset:'classic',mode:'sandbox',seed:569,rules:{marketFluctuations:false}});
 const p=g.player;
 p.classicFoodV2={'2':0,'3':1,'4':0,'5':1};
 assert.deepEqual(Food.legacyCategories(p.classicFoodV2),{'3':1,'4':0,'5':1});
 const loaded=Game.load(g.snapshot());
 assert.deepEqual(loaded.player.classicFoodV2,p.classicFoodV2);
 g.rand=()=>.99;
 g.newWeek();
 assert.deepEqual(Food.legacyCategories(p.classicFoodV2),{'3':0,'4':0,'5':0});
 assert.deepEqual(p.classicFoodV2,{'2':0,'3':0,'4':0,'5':0});
 assert.deepEqual(Food.legacyCategories(null),{'3':0,'4':0,'5':0});
});

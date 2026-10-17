'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const I=require('../src/i18n.js'),Goals=require('../src/goal-presets.js'),Prefs=require('../src/setup-preferences.js');
const Game=require('../src/engine.js');
const {readFileSync}=require('node:fs');
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('Localization changes labels without mutating game-state or saves',()=>{
 const store=storage(),g=new Game({ruleset:'classic',mode:'sandbox',goals:Goals.goals('standard'),seed:557});
 const before=g.snapshot(),English=I.t('newGame');
 assert.equal(English,'New game');I.set('nl',store);
 assert.equal(I.t('newGame'),'Nieuw spel');assert.equal(I.t('endWeek'),'Week beëindigen');
 assert.deepEqual(g.snapshot(),before);assert.equal(store.getItem(I.KEY),'nl');
 I.set('en',store);assert.equal(I.t('newGame'),English);
});
test('Unknown language falls back safely; every translated key has an English original',()=>{
 const store=storage();I.set('fr',store);assert.equal(I.get(),'en');
 for(const key of Object.keys(I.locales.nl)){assert.ok(I.locales.en[key],key);assert.ok(I.locales.nl[key],key);}
});
test('Quick/standard/extended campaign goals are distinct and obey existing score limits',()=>{
 assert.deepEqual(Goals.goals('quick'),{wealth:50,happiness:50,education:50,career:50});
 assert.deepEqual(Goals.goals('standard'),{wealth:65,happiness:65,education:65,career:65});
 assert.deepEqual(Goals.goals('extended'),{wealth:80,happiness:80,education:80,career:80});
 assert.equal(Goals.classify({wealth:50,happiness:60,education:50,career:50}),'custom');
 for(const preset of ['quick','standard','extended'])assert.equal(Goals.classify(Goals.goals(preset)),preset);
 assert.throws(()=>Goals.goals('nightmare'));
});
test('Increasing goal targets cannot increase progress for an identical player',()=>{
 const quick=new Game({ruleset:'classic',mode:'sandbox',goals:Goals.goals('quick')});
 const extended=new Game({ruleset:'classic',mode:'sandbox',goals:Goals.goals('extended')});
 for(const key of Goals.KEYS)assert.ok(quick.scores(quick.player)[key]>=extended.scores(extended.player)[key]);
 assert.ok(Prefs.DEFAULTS.goals.wealth>Goals.goals('quick').wealth);
});
test('Release source exposes both locale selector and campaign presets with saved goals',()=>{
 const app=readFileSync('src/app.js','utf8'),html=readFileSync('index.html','utf8');
 assert.match(html,/id="languageSelect"/);assert.match(app,/I18n\.set\(/);
 assert.match(app,/id="campaignPreset"/);assert.match(app,/GoalPresets\.goals\(key\)/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Game=require('../src/engine.js');
const Handover=require('../src/classic-hotseat-handover.js');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const before=g=>({isClassic:g.isClassic,mode:g.settings.mode,playerId:g.player.id});
test('Classic hotseat passes device only when the active human changes',()=>{
 const g=new Game({mode:'hotseat',ruleset:'classic',seed:547});
 const prior=before(g);const result=g.endTurn();assert.equal(result.ok,true);
 assert.equal(g.player.id,'friend');
 assert.equal(Handover.required(prior,g,false),true);
 assert.equal(Handover.required(prior,g,true),false);
 assert.equal(Handover.required(before(g),g,false),false);
 assert.equal(Handover.resumeRequired(g),true);
 assert.equal(Handover.resumeRequired(g,true),false);
 assert.equal(Game.load(g.snapshot()).player.id,'friend');
});
test('No pass screen in Modern, Solo or against AI',()=>{
 for(const options of [{mode:'hotseat',ruleset:'modern'},{mode:'solo',ruleset:'classic'},{mode:'sandbox',ruleset:'classic'}]){
  const g=new Game({...options,seed:547}),prior=before(g);g.endTurn();
  assert.equal(Handover.required(prior,g),false);
  assert.equal(Handover.resumeRequired(g),false);
 }
});
test('Pass screen contains no economy or actor private data and cannot be dismissed accidentally',()=>{
 const html=read('index.html'),js=read('src/app.js'),css=read('styles.css');
 assert.match(html,/id="classicHotseatHandover"/);
 assert.match(html,/id="classicHandoverContinue"/);
 assert.match(js,/document\.querySelector\('\.shell'\)\.inert=true/);
 assert.match(js,/document\.querySelector\('\.shell'\)\.inert=false/);
 assert.match(js,/HotseatHandover\.required\(before,game,Boolean\(net\.role\)\)/);
 assert.match(js,/HotseatHandover\.resumeRequired\(game,Boolean\(net\.role\)\)/);
 assert.match(css,/\.classic-hotseat-handover\{position:fixed;inset:0;z-index:1000/);
 assert.doesNotMatch(html.slice(html.indexOf('id="classicHotseatHandover"'),html.indexOf('id="chatPanel"')),/cash|rent|financial|wealth|happiness/i);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const I=require('../src/i18n.js');
const store=()=>{let values={};return {getItem:key=>values[key]??null,setItem:(key,val)=>{values[key]=val;},removeItem:key=>{delete values[key];}};};
function dom(){
  const labels=[
    {value:'CASH ON HAND',parentElement:{closest:()=>null}},
    {value:'NET WORTH',parentElement:{closest:()=>null}},
    {value:'Take a breather',parentElement:{closest:()=>null}},
    {value:'What would you like to do?',parentElement:{closest:()=>null}},
    {value:'Monolith Burger',parentElement:{closest:()=>null}},
    {value:'Buy 4 weeks of fresh food',parentElement:{closest:()=>null}},
    {value:'Hello from another player',parentElement:{closest:()=>({id:'chatMessages'})}}
  ];
  const nodes=labels.map(o=>({nodeValue:o.value,parentElement:o.parentElement}));
  const labelElement={v:'End week',getAttribute(n){return n==='title'?this.v:null;},hasAttribute(n){return n==='title';},setAttribute(n,v){if(n==='title')this.v=v;}};
  const doc={documentElement:{lang:'en'},body:{querySelectorAll:()=>[labelElement]},querySelectorAll:()=>[],createTreeWalker(){let i=0;return {nextNode:()=>nodes[i++]||null};}};
  return {doc,nodes,labelElement};
}
test('changing locale translates actual dynamically-rendered Classic UI, not just marked labels',()=>{
  const storage=store();I.set('nl',storage);
  const {doc,nodes,labelElement}=dom();I.apply(doc);
  assert.deepEqual(nodes.slice(0,4).map(n=>n.nodeValue),['CONTANT GELD','NETTOVERMOGEN','Even uitrusten','Wat wil je doen?']);
  assert.equal(nodes[4].nodeValue,'Monolith Burger'); // Original business identity is not changed.
  assert.equal(nodes[5].nodeValue,'Koop voor 4 weken vers voedsel');
  assert.equal(nodes[6].nodeValue,'Hello from another player'); // Chat content is NEVER translated.
  assert.equal(labelElement.v,'Week beëindigen');
  assert.equal(storage.getItem(I.KEY),'nl');
  assert.equal(doc.documentElement.lang,'nl');
  I.apply(doc); // Repeated renders must not translate the Dutch twice.
  assert.equal(nodes[2].nodeValue,'Even uitrusten');
  I.set('en',storage);I.apply(doc);
  assert.equal(nodes[0].nodeValue,'CASH ON HAND');
  assert.equal(nodes[2].nodeValue,'Take a breather');
  assert.equal(nodes[5].nodeValue,'Buy 4 weeks of fresh food');
  assert.equal(labelElement.v,'End week');
});
test('Dutch translations cover venue descriptions, menu, goals and dynamic weekly status',()=>{
  I.set('nl',store());
  assert.equal(I.uiText('Protected apartment complex. Your possessions are safe from residential burglary.'),'Beveiligd appartementencomplex. Je bezittingen zijn beschermd tegen woninginbraak.');
  assert.equal(I.uiText('WEEK 03 · 4 ACTIONS'),'WEEK 03 · 4 ACTIES');
  assert.equal(I.uiText('GOODS INDEX 106 · PRICES UP'),'GOEDERENINDEX 106 · PRIJZEN STIJGEN');
  assert.equal(I.uiText('Apply: Cook · Monolith Burger'),'Solliciteer: Cook · Monolith Burger');
  assert.equal(I.uiText('Your Story'),'Jouw verhaal');
  assert.equal(I.uiText('Game settings'),'Spelinstellingen');
  assert.equal(I.uiText('New game'),'Nieuw spel');
  assert.equal(I.uiText('Classic Original · DOS-inspired'),'Klassiek origineel · geïnspireerd op DOS');
  I.set('en',store());
});
test('both locale controls cause a live game re-render and dialog localization',()=>{
 const app=require('node:fs').readFileSync('src/app.js','utf8');
 assert.match(app,/function render\(\)[\s\S]*?I18n\.apply\(\);/);
 assert.match(app,/function showModal\([\s\S]*?I18n\.apply\(\);/);
 assert.match(app,/const applySetupLanguage=[\s\S]*?render\(\);/);
 assert.match(app,/\$\('languageSelect'\)\.addEventListener\('change'[\s\S]*?render\(\);/);
 assert.match(app,/I18n\.uiText\(msg\)/);
});
test('translation is display-only: Classic game state and save are unchanged',()=>{
 const Game=require('../src/engine.js');const g=new Game({ruleset:'classic',mode:'sandbox',seed:557});
 const before=g.snapshot();I.set('nl',store());I.uiText('Buy 4 weeks of fresh food');
 assert.deepEqual(g.snapshot(),before);I.set('en',store());
});

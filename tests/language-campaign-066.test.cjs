'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('ZipRunner retained language-campaign contract uses real I18n.set calls',()=>{
 const script=read('src/app.js');
 assert.match(read('index.html'),/id="languageSelect"/);
 assert.match(script,/I18n\.set\(/);
 assert.match(script,/const language=I18n\.set\(e\.target\.value\)/);
 assert.match(script,/const language=I18n\.set\(\$\('gameLanguage'\)\.value\)/);
 assert.match(read('index.html'),/src\/i18n\.js/);
 const builder=read('tools/build-offline.mjs');
 assert.match(builder,/'life-pass-057',(?:'goal-presets',)?'i18n'/); // New adapters may load after canonical presets.

});

test('locale controller persists and paints EN/NL static labels without changing game state',()=>{
 const key='the-life-loop-language-v1';
 const storage=new Map();
 const elements={
  languageSelect:{value:'en'}, gameLanguage:{value:'en'},
  careerLabel:{key:'Careers',textContent:'Careers'},
  summaryLabel:{key:'Life goals',textContent:'Life goals'},
 };
 const doc={documentElement:{lang:'en'},getElementById:k=>elements[k]||null,
   querySelectorAll:selector=>selector==='[data-i18n]'?[elements.careerLabel,elements.summaryLabel].map(el=>({...el,getAttribute:()=>el.key,set textContent(v){el.text=v;},get textContent(){return el.text;}})):
      selector==='[data-i18n-title]'?[]:[]};
 const fakeStore={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const win={document:doc,localStorage:fakeStore};
 vm.runInNewContext(read('src/life-pass-057.js'),{window:win});
 vm.runInNewContext(read('src/i18n.js'),{window:win});
 const I18n=win.LifeI18n;
 assert.equal(win.I18n,I18n);
 assert.equal(I18n.set('nl'),'nl');
 assert.equal(doc.documentElement.lang,'nl');
 assert.equal(elements.languageSelect.value,'nl');
 assert.equal(elements.gameLanguage.value,'nl');
 assert.equal(storage.get(key),'nl');
 assert.equal(I18n.t('Careers'),'Carrières');
 assert.equal(I18n.t('Life goals'),'Levensdoelen');
 assert.equal(I18n.set('en'),'en');
 assert.equal(elements.languageSelect.value,'en');
 assert.equal(storage.get(key),'en');
 assert.equal(I18n.set('invalid'),'en');
 assert.equal(I18n.restore(),'en');
});

test('offline playable distribution includes the controller and repaired UI binding',()=>{
 const source=read('PLAY.html');
 assert.match(source,/id="languageSelect"/);
 assert.match(source,/root\.LifeI18n=api/);
 assert.match(source,/I18n\.set\(/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const UX=require('../src/life-pass-057.js');
const read=path=>readFileSync(require('node:path').join(__dirname,'..',path),'utf8');
test('repaired distribution preserves the local languageSelect toolbar contract',()=>{
 const html=read('index.html');
 const offline=read('PLAY.html');
 for(const page of [html,offline]){
  assert.match(page,/id="languageSelect"/);
  assert.match(page,/value="en">EN<\/option>/);
  assert.match(page,/value="nl">NL<\/option>/);
 }
 assert.match(read('src/app.js'),/\$\('languageSelect'\)\.addEventListener\('change'/);
});
test('toolbar and new-game language controls share the persistent locale',()=>{
 const script=read('src/app.js');
 assert.match(script,/\$\('languageSelect'\)\.value=UX57\.savedLocale/);
 assert.match(script,/\$\('languageSelect'\)\.value=language/);
 assert.match(script,/setupLanguage\.dispatchEvent\(new Event\('change'/);
 const map=new Map();const store={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};
 assert.equal(UX.saveLocale(store,'nl'),'nl');
 assert.equal(UX.savedLocale(store),'nl');
 assert.equal(UX.saveLocale(store,'en'),'en');
 assert.equal(UX.savedLocale(store),'en');
});

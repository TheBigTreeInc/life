'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {parse,fromWindow,SCHEMA}=require('../src/embed-launch.js');
const read=(p)=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');

test('standalone Life remains playable without match metadata',()=>{
 const result=parse('https://example.org/life/',false);
 assert.deepEqual(result,{schema:SCHEMA,embedded:false,matchRequested:false,matchId:null,invalidMatch:false});
 assert.ok(Object.isFrozen(result));
});
test('opaque Atrium match is merely a selector, not proof or identity',()=>{
 const result=parse('https://example.org/life/?match=life_match-012_Ab',true);
 assert.equal(result.matchId,'life_match-012_Ab');
 assert.equal(result.embedded,true);
 assert.equal(result.invalidMatch,false);
 for(const prohibited of ['token','account','issuer','subject','proof','seat','url','auth'])assert.equal(prohibited in result,false);
});
test('malformed, duplicated, encoded-delimiter and empty match selectors fail closed',()=>{
 const base='https://example.org/life/?match=';
 for(const value of ['', 'a%2Fb','a%23secret','a%20b','a%2Bb','a%0Ab','%E2%98%83','a'.repeat(129)]){
   assert.equal(parse(base+value,true).invalidMatch,true, value);
   assert.equal(parse(base+value,true).matchId,null);
 }
 const duplicated=parse(base+'valid&match=valid2',true);
 assert.equal(duplicated.invalidMatch,true);
 assert.equal(duplicated.matchId,null);
});
test('embedded detection does not access parent document or bridge',()=>{
 const w={location:{href:'https://example.org/life/?match=m_17'}};w.self=w;w.top={};
 const result=fromWindow(w);assert.equal(result.embedded,true);assert.equal(result.matchId,'m_17');
});
test('game has a local embedded fixture, without impersonating Tavi or leaking credentials',()=>{
 const fixture=read('tests/fixtures/life-embed-smoke.html');
 assert.match(fixture,/sandbox="allow-scripts allow-forms"/);
 assert.match(fixture,/src="\.\.\/\.\.\/index\.html"/);
 assert.match(fixture,/Return to test host/);
 assert.doesNotMatch(fixture,/allow-same-origin|postMessage|Bearer /);
 const index=read('index.html'), build=read('tools/build-offline.mjs');
 assert.match(index,/src\/embed-launch\.js/);
 assert.match(build,/'embed-launch'/);
 assert.match(read('src/app.js'),/window\.LifeLaunchContext=LIFE_LAUNCH/);
 assert.doesNotMatch(read('src/embed-launch.js'),/postMessage|window\.top\.location|localStorage|fetch\(/);
});

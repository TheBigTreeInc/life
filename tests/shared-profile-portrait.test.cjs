const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const portraits=require('../src/modular-portrait-kit.js');
const shared=require('../src/looprd-shared-profile.js');
test('original kit is installed; two transparent art packs satisfy its validator',()=>{
 for(const id of Object.keys(shared.PACKS)){
  const pack=JSON.parse(fs.readFileSync(shared.PACKS[id],'utf8'));
  const assets=portraits.validatePack(pack);
  assert.ok(assets.length>=7);
  for(const p of assets)assert.ok(fs.statSync('assets/modular-portraits/packs/'+id+'/'+p).size>100);
  const identity=portraits.normalizeIdentity(pack);
  assert.deepEqual(JSON.parse(portraits.serialize(pack,identity)),identity);
  assert.equal(shared.validateProfile({displayName:'Alex',appearance:identity},portraits,pack).appearance.pack,id);
 }
});
test('shared profile stores only display/presentation information, not game economy',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const store=shared.createStore(storage);
 const saved=store.set({displayName:'A <Very> Cool Name',profileId:null,appearance:null,cash:999999,admin:true});
 assert.equal(saved.displayName,'A Very Cool Name');assert.ok(!('cash'in saved));assert.ok(!('admin'in saved));
 assert.deepEqual(store.get(),saved);store.clear();assert.equal(store.get(),null);
 assert.throws(()=>shared.validateProfile({displayName:'x',appearance:{schema:'wrong'}}));
 assert.throws(()=>shared.validateProfile({displayName:'x',profileId:'../../admin',appearance:null}));
});
test('Looprd Social URL requires HTTPS, except loopback, and token is not persisted',async()=>{
 assert.equal(shared.endpoint('https://social.example.org'),'https://social.example.org');
 assert.equal(shared.endpoint('http://127.0.0.1:8947'),'http://127.0.0.1:8947');
 assert.throws(()=>shared.endpoint('http://social.example.org'));
 assert.throws(()=>shared.endpoint('https://alice:secret@social.example.org'));
 const calls=[];const fetcher=async(url,opt)=>{calls.push({url,opt});return {ok:true,json:async()=>opt.method==='GET'?{displayName:'Alex',profileId:'profile-test',appearance:null}:{displayName:'Alex',profileId:'profile-test',appearance:null}}};
 const c=new shared.SocialClient('http://127.0.0.1:8947','secret-test',{fetcher});
 const p=await c.me();assert.equal(p.displayName,'Alex');await c.saveProfile(p);
 await c.sendChat('hello');assert.equal((await c.chatFeed()).displayName,'Alex');
 assert.equal(calls[0].opt.headers.Authorization,'Bearer secret-test');assert.equal(calls[1].opt.method,'PUT');
 c.disconnect();assert.equal(c.token,'');
});
test('browser scripts and new game selection are wired independently of old disabled creator',()=>{
 const app=fs.readFileSync('src/app.js','utf8'),index=fs.readFileSync('index.html','utf8'),offline=fs.readFileSync('PLAY.html','utf8');
 assert.match(index,/id="sharedProfileBtn"/);assert.match(index,/src\/shared-portrait-ui.js/);
 assert.match(app,/SharedPortrait\.defaultName\(\)/);assert.match(app,/SharedPortrait\.getPortrait\(\)/);
 assert.match(app,/const ENABLE_CHARACTER_CUSTOMIZATION=false/);
 assert.match(offline,/LifeEmbeddedPortraitPacks/);assert.match(offline,/root\.LooprdSharedProfile/);
});

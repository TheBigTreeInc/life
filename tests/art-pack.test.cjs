const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,statSync}=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(readFileSync('assets/art/styles/contemporary-default/manifest.json','utf8'));
const map=require('../src/art-assets.js');
const Art=require('../src/art.js');
const D=require('../src/data.js');
test('Default pack contains precisely the 12 non-home venue identities',()=>{
 const locations=new Set(D.places.map(x=>x.id));
 assert.deepEqual(new Set(Object.keys(manifest.venues)),new Set([...locations].filter(id=>id!=='home')));
 assert.deepEqual(map,manifest);
 assert.equal(manifest.era,'current');
 for(const [venue,images] of Object.entries(manifest.venues)){
  for(const [size,file] of Object.entries(images)){
   assert.ok(['card','detail'].includes(size));
   assert.match(file,/^assets\/art\/styles\/contemporary-default\/[a-z-]+\.webp$/);
   assert.ok(statSync(file).size>2000,`${venue} ${size} empty`);
  }
  assert.match(Art.scene(venue,true,'current'),new RegExp(`scene-photo.*${venue}-card\\.webp`));
  assert.match(Art.scene(venue,false,'current'),new RegExp(`scene-photo.*${venue}-detail\\.webp`));
  assert.match(Art.scene(venue,true,'historical'),/viewBox="0 0 640 340"/);
  assert.match(Art.scene(venue,false,'scifi'),/viewBox="0 0 640 340"/);
 }
});
test('Home art follows studio, apartment and loft separately',()=>{
 const tiers=['studio','apartment','loft'];
 const outputs=tiers.map(t=>Art.scene('home',true,'current',t));
 assert.equal(new Set(outputs).size,3);
 tiers.forEach((tier,index)=>{
  assert.deepEqual(Object.keys(manifest.homeTiers[tier]).sort(),['card','detail']);
  for(const kind of ['card','detail'])assert.ok(statSync(manifest.homeTiers[tier][kind]).size>2000); 
  assert.match(outputs[index],new RegExp(`data-home-tier="${tier}"`));
  assert.match(outputs[index],new RegExp(`home-${tier}-card\\.webp`));
  assert.match(Art.scene('home',false,'current',tier),new RegExp(`home-${tier}-detail\\.webp`));
 });
 // Invalid housing tiers from old saves use a studio vector fallback instead of showing the wrong residence.
 assert.match(Art.scene('home',false,'current','unrecognized'),/data-home-tier="studio"/);
 assert.doesNotMatch(Art.scene('home',true,'current','studio'),/reference-detached-house/);
 assert.equal(typeof manifest.references.detachedHouse,'string');
 for(const tier of tiers)for(const kind of ['card','detail']){
  const file=manifest.homeTiers[tier][kind];
  assert.ok(file.includes(`home-${tier}-${kind}.webp`));
  assert.ok(statSync(file).size<400*1024);
 }
});
test('Source board and destination art both read the active player home tier',()=>{
 const src=readFileSync('src/app.js','utf8');
 assert.ok(src.includes('Art.scene(loc.id,true,game.settings.era,p.home)'));
 assert.ok(src.includes('Art.scene(current.id,false,game.settings.era,p.home)'));
 assert.match(readFileSync('tools/build-offline.mjs','utf8'),/data:image\/webp;base64/);
 assert.match(readFileSync('tools/build-pages.mjs','utf8'),/copyFileSync/);
});
test('Bundled offline edition includes venue data and no runtime asset dependencies',()=>{
 const offline=readFileSync('PLAY.html','utf8');
 const pages=readFileSync('dist/index.html','utf8');
 const venue=manifest.venues.market;
 assert.ok(offline.includes('data:image/webp;base64,'));
 assert.ok(!offline.includes(venue.card));
 assert.ok(!offline.includes(venue.detail));
 assert.ok(pages.includes(venue.card));
 assert.ok(pages.includes(venue.detail));
 for(const tier of ['studio','apartment','loft']) {
  const home=manifest.homeTiers[tier];
  assert.ok(pages.includes(home.card));
  assert.ok(pages.includes(home.detail));
  assert.ok(!offline.includes(home.card));
  assert.ok(!offline.includes(home.detail));
  assert.ok(statSync(path.join('dist',home.card)).size>2000);
 }
 assert.ok(statSync(path.join('dist',venue.card)).size>2000);
 assert.ok(!offline.includes('<script src='));
});

test('All residence tiers use distinct player-supplied image assets, no extra venue called Home',()=>{
 const keys=['studio','apartment','loft'];
 for(const kind of ['card','detail'])assert.equal(new Set(keys.map(k=>manifest.homeTiers[k][kind])).size,3);
 for(const tier of keys){
  assert.match(Art.scene('home',true,'current',tier),/scene-photo/);
  assert.match(Art.scene('home',true,'current',tier),new RegExp(`data-home-tier="${tier}"`));
  assert.match(Art.scene('home',false,'current',tier),new RegExp(`data-home-tier="${tier}"`));
  assert.match(Art.scene('home',true,'historical',tier),/era-historical/);
  assert.match(Art.scene('home',true,'scifi',tier),/era-scifi/);
 }
});

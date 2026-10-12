const {test}=require('node:test');const a=require('node:assert/strict');const fs=require('node:fs');
const pipeline=require('../src/character-sprites.js');const Ch=require('../src/characters.js');const Game=require('../src/engine.js');
const manifest=JSON.parse(fs.readFileSync('assets/characters/pixel-v1/catalog.json','utf8'));
test('catalog defines discrete bodies, components, slots, bands and pose timing',()=>{
 a.equal(manifest.schema,'the-life-loop.character-parts.v1');a.deepEqual(Object.keys(manifest.bodyTemplates),['compact','standard','broad']);
 a.equal(manifest.canvas.width,32);a.equal(manifest.canvas.height,40);a.equal(manifest.canvas.origin[1],38);
 a.equal(manifest.directions.length,4);a.equal(manifest.animations.walk.durations.length,4);
 for(const item of Object.values(manifest.items)){a.ok(item.supportedBodies.length);a.ok(manifest.slots.includes(item.slot));}
});
test('small normalized character config is deterministic and rejects malicious options',()=>{
 const c=pipeline.normal({body:'giant',headwear:'<script>',hair:'long',accent:'invalid',mood:'focused'});
 a.equal(c.body,'standard');a.equal(c.headwear,'none');a.equal(c.hair,'long');a.equal(c.accent,'forest');a.equal(c.mood,'focused');
 a.equal(c.schemaVersion,1);a.equal(c.catalogVersion,manifest.revision);a.ok(JSON.stringify(c).length<300);
});
test('compiler resolves every idle/walk pose for four directions, with deterministic draw bands',()=>{
 const c=pipeline.compile({body:'broad',hair:'curly',headwear:'beanie',outfit:'sport'});a.equal(c.ok,true);
 a.equal(Object.keys(c.poses).length,24);a.match(c.adjustments.join('; '),/under_hat/);
 for(const cmds of Object.values(c.poses)){
  a.ok(cmds.length>8);a.ok(cmds.every(x=>Number.isInteger(x.x)&&Number.isInteger(x.y)&&Number.isInteger(x.w)&&Number.isInteger(x.h)));
  a.ok(cmds.every((x,i)=>i===0||cmds[i-1].band<=x.band));
 }
 a.deepEqual(pipeline.compile(c.config).poses,c.poses);a.equal(pipeline.compile(c.config).cacheKey,c.cacheKey);
});
test('headwear interaction yields explicit compressed hair rather than covering unchanged hair',()=>{
 const bare=pipeline.compile({hair:'long',headwear:'none'}),cap=pipeline.compile({hair:'long',headwear:'cap'});
 a.deepEqual(bare.adjustments,[]);a.match(cap.adjustments[0],/under_hat/);
 a.notDeepEqual(pipeline.resolvePose(bare),pipeline.resolvePose(cap));
 a.ok(pipeline.resolvePose(cap).some(x=>x.band===80));
});
test('one frame clock controls all components and supports negative elapsed time',()=>{
 a.equal(pipeline.frameAt(0,[170,170,170,170]),0);a.equal(pipeline.frameAt(200,[170,170,170,170]),1);
 a.equal(pipeline.frameAt(740,[170,170,170,170]),0);a.equal(pipeline.frameAt(-1,[170,170,170,170]),3);
 a.throws(()=>pipeline.frameAt(1,[0]),/Invalid/);
});
test('SVG adapter is bounded and escapes user-facing names',()=>{
 const c=pipeline.compile({body:'compact',headwear:'cap',skin:'deep'}),svg=pipeline.renderSvg(c,'walk','west',1,'<script>alert(1)</script>');
 a.match(svg,/<svg/);a.match(svg,/shape-rendering="crispEdges"/);a.doesNotMatch(svg,/<script>/);a.match(svg,/&lt;script&gt;/);
});
test('Canvas adapter and sheet share compiled pose data without needing a GPU renderer',()=>{
 let ops=[];
 const make=()=>({width:32,height:40,getContext(){return {clearRect(...a){ops.push(['clear',...a])},fillRect(...a){ops.push(['fill',...a])},drawImage(...a){ops.push(['draw',...a])},set imageSmoothingEnabled(v){},set fillStyle(v){}}}});
 const source=make();pipeline.renderToCanvas(source,pipeline.compile({}));a.ok(ops.some(o=>o[0]==='fill'));
 const output=pipeline.spriteSheet(pipeline.compile({}),{createElement(t){a.equal(t,'canvas');return make()}});
 a.equal(output.width,128);a.equal(output.height,320);a.ok(ops.some(o=>o[0]==='draw'));
});
test('pixel selection is saved locally, survives game snapshots and is accepted for multiplayer join',()=>{
 const st=new Map(),lib=Ch.createStore({getItem:k=>st.get(k)||null,setItem:(k,v)=>st.set(k,v)});
 const char=lib.upsert({name:'Sprite',portrait:'pixel',body:'broad',headwear:'beanie',hair:'long',skin:'olive'});
 a.equal(lib.selected().portrait,'pixel');a.equal(lib.selected().body,'broad');a.equal(lib.selected().headwear,'beanie');
 const game=new Game({name:char.name,character:char,mode:'hotseat',friend:'Friend'});
 const copy=Game.load(game.snapshot());a.equal(copy.players[0].appearance.portrait,'pixel');a.equal(copy.players[0].appearance.headwear,'beanie');
 a.equal(Ch.normalizeAppearance({portrait:'bogus'}).portrait,'');
 const server=fs.readFileSync('server/looprd_handler.py','utf8');a.match(server,/\'headwear\': \{/);a.match(server,/\'body\': \{/);a.match(server,/\'pixel\'/);
});
test('creator exposes Pixel Studio with four directions, live canvas and sprite export',()=>{
 const app=fs.readFileSync('src/app.js','utf8'),html=fs.readFileSync('index.html','utf8');
 for(const needle of ['data-portrait-tab="pixel"','id="pixelCharacterPreview"','id="spriteActionToggle"','id="spriteExportBtn"','id="pixelGeometryFields"','LifeSprites.spriteSheet(','LifeSprites.startPreview('])a.ok(app.includes(needle),needle);
 for(const src of ['character-catalog.js','character-sprites.js'])a.ok(html.includes(src));
});

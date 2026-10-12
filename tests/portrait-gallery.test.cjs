const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const Ch=require('../src/characters.js');
const manifest=JSON.parse(fs.readFileSync('assets/portraits/default/manifest.json','utf8'));
const app=fs.readFileSync('src/app.js','utf8');const css=fs.readFileSync('styles.css','utf8');const html=fs.readFileSync('index.html','utf8');
test('source portrait gallery includes 16 modern and 35 classic illustrations',()=>{
 const all=Object.entries(manifest.portraits);assert.equal(all.length,51);
 assert.equal(all.filter(([,p])=>p.collection==='illustrated').length,16);
 assert.equal(all.filter(([,p])=>p.collection==='original').length,35);
 for(const [id,p] of all){assert.match(id,Ch.PORTRAIT_ID);assert.equal(p.image,`assets/portraits/default/${id}.webp`);assert.ok(fs.statSync(p.image).size<120*1024);}
});
test('portraits persist via local profiles and game snapshots, invalid IDs are rejected',()=>{
 const store=new Map(),lib=Ch.createStore({getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)});
 const p=lib.upsert({name:'Dorb',portrait:'illustrated-09',skin:'olive',personality:'bold'});
 assert.equal(lib.selected().portrait,'illustrated-09');
 assert.equal(Ch.createStore({getItem:k=>store.get(k)||null}).selected().portrait,'illustrated-09');
 assert.equal(Ch.normalizeAppearance({...p,portrait:'javascript:alert(1)'}).portrait,'');
 const Game=require('../src/engine.js');const g=new Game({name:'Dorb',character:p,friend:'Friend',mode:'hotseat'});
 assert.equal(g.players[0].appearance.portrait,'illustrated-09');
 assert.equal(Game.load(g.snapshot()).players[0].appearance.portrait,'illustrated-09');
});
test('art module produces actual img nodes without user-provided URLs and falls back to custom SVG',()=>{
 const context={};context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync('src/portrait-assets.js','utf8'),context);
 vm.runInContext(fs.readFileSync('src/characters.js','utf8'),context);
 const rendered=context.LifeCharacters.avatar({name:'New',portrait:'illustrated-03'},'sidebar');
 assert.match(rendered,/class="character-avatar/);assert.match(rendered,/<img /);assert.match(rendered,/illustrated-03\.webp/);
 assert.match(context.LifeCharacters.avatar({name:'New',portrait:'original-35'},'editor'),/original-35\.webp/);
 assert.match(context.LifeCharacters.avatar({name:'New',portrait:'evil'},'editor'),/<svg /);
});
test('character creator has real portrait selection, view switching and editable fallback',()=>{
 for(const code of ['data-portrait-tab=','data-portrait-group=','data-field="portrait"','id="editorFineTune"','portraitList(\'illustrated\')','portraitList(\'original\')','setSelected(\'portrait\''])assert.ok(app.includes(code),code);
 assert.match(css,/\.portrait-collection-grid/);assert.match(css,/\.portrait-pick/);
 assert.ok(html.includes('src/portrait-assets.js'));
});

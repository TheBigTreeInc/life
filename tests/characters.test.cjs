const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Ch=require('../src/characters.js');
const Game=require('../src/engine.js');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
function storage(){let store=new Map();return {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k),raw:store};}
test('character library is empty and can create/select independent local profiles',()=>{
 const st=storage(),lib=Ch.createStore(st);assert.deepEqual(lib.all(),[]);assert.equal(lib.selected(),null);
 const a=lib.upsert({name:'Aria',skin:'brown',hair:'curly',hairColor:'silver',accent:'violet',personality:'thoughtful'});
 const b=lib.upsert({name:'Theo',skin:'deep',hair:'buzz',personality:'bold'});
 assert.equal(lib.all().length,2);assert.notEqual(a.id,b.id);assert.equal(lib.selected().name,'Theo');
 lib.choose(a.id);assert.equal(lib.selected().name,'Aria');
 assert.equal(Ch.createStore(st).selected().id,a.id);
});
test('editing is in place and removal does not erase other characters',()=>{
 const lib=Ch.createStore(storage());const a=lib.upsert({name:'First'}),b=lib.upsert({name:'Second'});
 lib.upsert({...a,name:'First edited',hair:'long'});assert.equal(lib.all().length,2);assert.equal(lib.selected().name,'First edited');
 lib.remove(a.id);assert.equal(lib.selected().name,'Second');assert.equal(lib.all().length,1);lib.remove(b.id);assert.deepEqual(lib.all(),[]);
});
test('limits and validation: malformed storage, 16 slots, empty names, IDs and enums',()=>{
 const st=storage(),lib=Ch.createStore(st);st.setItem(Ch.KEY,'{bad-json');assert.deepEqual(lib.all(),[]);
 assert.throws(()=>lib.upsert({name:'    '}),/name/);
 for(let i=0;i<16;i++)lib.upsert({name:'Person '+i,skin:'invalid',mood:'invalid'});
 assert.equal(lib.all().length,16);assert.equal(lib.all()[0].skin,'peach');assert.equal(lib.all()[0].mood,'smile');
 assert.throws(()=>lib.upsert({name:'Too many'}),/Maximum 16/);
 assert.throws(()=>lib.choose('not-real'),/not found/);
});
test('unavailable storage rejects writes without failing the game',()=>{
 const st={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
 const lib=Ch.createStore(st);assert.deepEqual(lib.all(),[]);assert.throws(()=>lib.upsert({name:'No storage'}),/unavailable/);
});
test('avatar supports appearance combinations without interpolating arbitrary markup',()=>{
 const avatar=Ch.avatar({name:'<script>Bad</script>',skin:'evil',accent:'red<svg',hair:'curly',hairColor:'mint',mood:'focused'});
 assert.ok(avatar.includes('<svg'));assert.ok(!avatar.includes('<script>'));assert.ok(avatar.includes('#f1bd91'));
 assert.ok(avatar.includes('#398e83'));assert.ok(avatar.includes('aria-label='));
});
test('game embeds appearance in snapshots, survives reload and does not affect classic rules',()=>{
 const profile=Ch.normalizeProfile({id:'char_abcdef',name:'Aria',skin:'tan',outfit:'creative',personality:'kind'});
 const game=new Game({name:profile.name,character:profile,friend:'Friend',friendCharacter:{skin:'deep',hair:'buzz'},mode:'hotseat',ruleset:'classic'});
 assert.equal(game.players[0].appearance.skin,'tan');assert.equal(game.players[1].appearance.skin,'deep');
 assert.equal(game.players[0].hours,60);assert.equal(game.players[0].cash,200);
 assert.equal(game.players[0].appearance.id,undefined,'local profile ID is not sent with game snapshots');
 const snap=game.snapshot();const loaded=Game.load(snap);
 assert.deepEqual(loaded.players[0].appearance,game.players[0].appearance);
 assert.equal(loaded.settings.ruleset,'classic');assert.equal(loaded.players[1].appearance.hair,'buzz');
 assert.equal(Game.load({...snap,players:snap.players.map(({appearance,...p})=>p)}).players[0].appearance,undefined,'legacy saves still load');
});
test('new game, local hotseat, online join and top-right menu expose saved profiles',()=>{
 for(const token of ['id="charactersBtn"','id="utilityMenu"','src/characters.js'])assert.ok(html.includes(token),token);
 for(const token of ['showCharacterLibrary(','editCharacter(','id="characterPick"','id="friendCharacterPick"','id="joinCharacterPick"','characters.upsert(','characters.remove(','characters.choose(','Characters.avatar('])assert.ok(app.includes(token),token);
 assert.match(css,/\.character-workspace/);assert.match(css,/@media\(max-width:600px\)/);
});

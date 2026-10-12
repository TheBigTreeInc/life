const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=require('../package.json');

test('character creator is explicitly behind an off-by-default feature flag',()=>{
 assert.match(app,/const ENABLE_CHARACTER_CUSTOMIZATION=false;/);
 assert.match(app,/if\(ENABLE_CHARACTER_CUSTOMIZATION\)\$\('charactersBtn'\)\.addEventListener/);
 assert.match(app,/\$\('charactersBtn'\)\.hidden=!ENABLE_CHARACTER_CUSTOMIZATION/);
 assert.match(html,/id="charactersBtn" hidden>/);
});

test('original icon fallback takes precedence and old appearance is untouched',()=>{
 assert.ok(app.includes("ENABLE_CHARACTER_CUSTOMIZATION&&p.appearance?Characters.avatar"));
 for(const token of ["p.id==='jones'?'😎'", "p.id==='friend'?'🧑‍🚀':'🧑‍🎨'"])
  assert.ok(app.includes(token),token);
 assert.doesNotMatch(app,/removeItem\(.*characters/);
});

test('new games and online guest joins do not supply character profiles while off',()=>{
 assert.match(app,/character:ENABLE_CHARACTER_CUSTOMIZATION\?characters\.all\(\)\.find/);
 assert.match(app,/friendCharacter:ENABLE_CHARACTER_CUSTOMIZATION\?characters\.all\(\)\.find/);
 assert.match(app,/ENABLE_CHARACTER_CUSTOMIZATION\?characters\.all\(\)\.find\(p=>p\.id===\$\('joinCharacterPick'\)\.value\)\|\|null:null/);
 assert.match(app,/ENABLE_CHARACTER_CUSTOMIZATION\?`<section class="quick-character"/);
 assert.match(app,/if\(ENABLE_CHARACTER_CUSTOMIZATION\)\$\('joinCharacterPick'\)/);
});

test('keep source assets and creator/engine available for future reactivation',()=>{
 assert.equal(pkg.version,require('../package.json').version);
 for(const file of ['src/characters.js','src/character-catalog.js','src/character-sprites.js','src/portrait-assets.js','assets/characters/pixel-v1/catalog.json'])
  assert.ok(fs.statSync(file).size>10,file);
 assert.ok(app.includes('function editCharacter('));
 assert.ok(app.includes('function showCharacterLibrary('));
});

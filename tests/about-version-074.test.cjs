const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/app.js','utf8');
test('version identity is visible from the mobile game menu',()=>{assert.match(html,/name="life-release-version" content="0\.5\.74"/);assert.match(html,/id="aboutLifeBtn"/);assert.match(html,/id="aboutLifeVersion"/);assert.match(app,/const LIFE_RELEASE=document\.querySelector/);assert.match(app,/aboutLifeDialog.*showModal/);});
test('diagnostics do not export credentials or room codes',()=>{const body=app.slice(app.indexOf('function aboutLifeDiagnostics()'),app.indexOf('function openAboutLife()'));assert.match(body,/Loaded bundle version/);assert.doesNotMatch(body,/password|token|net\.code|secret/i);});
test('mobile End Week and Work by Done remain',()=>{assert.match(html,/id="mobileEndTurnBtn"/);assert.match(html,/id="venueWork"/);assert.match(html,/id="venueDone"/);});

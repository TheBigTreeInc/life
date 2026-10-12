import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const load=rel=>readFileSync(resolve(root,rel),'utf8');
execFileSync(process.execPath,[resolve(root,'tools/build-offline.mjs')],{stdio:'inherit'});
const pkg=JSON.parse(load('package.json'));
const manifest=JSON.parse(load('.ziprunner-workboard-update.json'));
const tasks=[...manifest.implemented,...manifest.remaining];
const errors=[];
if(manifest.schema!=='ziprunner.workboard-update.v1')errors.push('Incorrect workboard schema');
if(manifest.project!==pkg.name||manifest.version!==pkg.version)errors.push(`Project/version mismatch: manifest ${manifest.project}@${manifest.version}, package ${pkg.name}@${pkg.version}. Commit the current .ziprunner-workboard-update.json to GitHub.`);
const handoff=load('ZIPRUNNER_HANDOFF.txt');
if(!handoff.includes(`version: ${pkg.version}`))errors.push(`Handoff version does not match package ${pkg.version}`);
const releaseName=`the-life-loop-${pkg.version}-ziprunner.zip`;
if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(pkg.version))errors.push('Version must be numeric major.minor.patch');
if(!handoff.split('\n').some(line=>line.trim()===`filename: ${releaseName}`))errors.push(`ZipRunner handoff filename mismatch: expected ${releaseName}`);
if(!load('WORKBOARD.md').includes(releaseName))errors.push(`Workboard release filename mismatch: expected ${releaseName}`);
if(!load('README.md').includes(`Artifact: \`${releaseName}\``))errors.push('README ZipRunner artifact/version mismatch');
const looprdRelease=load('looprd.yaml').match(/^release:\s*(\S+)\s*$/m)?.[1];
if(looprdRelease!==pkg.version)errors.push(`Looprd release mismatch: ${looprdRelease} vs ${pkg.version}`);
if(!load('index.html').includes(`ORIGINAL DEMO · V${pkg.version}`.toUpperCase()))errors.push('Game footer version mismatch');
if(!load('PLAY.html').includes(`ORIGINAL DEMO · V${pkg.version}`.toUpperCase()))errors.push('Offline build version mismatch');
if(!load('tools/generate-looprd.py').includes("(root/'package.json').read_text()"))errors.push('Looprd spec generator must obtain release from package.json');
if(!load('tools/package-ziprunner.py').includes("root.parent/f'the-life-loop-{version}-ziprunner.zip'"))errors.push('ZIP packager must derive artifact name from package version');

if(typeof manifest.summary!=='string'||!manifest.summary.trim())errors.push('Missing summary');
if(!Array.isArray(manifest.implemented)||!Array.isArray(manifest.remaining))errors.push('Invalid tasks');
if(new Set(tasks.map(t=>t.id)).size!==tasks.length)errors.push('Repeated workboard IDs');
for(const t of tasks){if(!t.id||!t.title||!t.summary)errors.push('Missing workboard fields');}
// ZipRunner's v1 workboard format uses critical/high/medium/low priority labels,
// unlike docs/parity-contract.json, which intentionally uses P0–P3 rankings.
const workboardPriorities=new Set(['critical','high','medium','low']);
for(const t of manifest.remaining){
 if(t.priority!==undefined && t.priority!==null && !workboardPriorities.has(t.priority)){
  errors.push(`Workboard update: invalid priority for ${t.id}: ${t.priority}`);
 }
}
for(const t of manifest.implemented){if(!Array.isArray(t.operator_checks)||!t.operator_checks.length)errors.push(`${t.id} missing checks`);}
if(statSync(resolve(root,'.ziprunner-workboard-update.json')).size>256*1024)errors.push('Manifest too large');
if(!load('GAMEPLAY_AUDIT.md').includes('one active') && !load('GAMEPLAY_AUDIT.md').includes('one regular'))errors.push('Employment audit not included');
// Mandatory architectural reference, independent from executable parity.
const architecture=load('ARCHITECTURE.md');
const originalRules=load('docs/original-gameplay-spec.md');
const matrix=load('docs/parity-matrix.md');
const adr=load('docs/decisions/ADR-0001-classic-mechanics-modern-presentation.md');
const scenarioAdr=load('docs/decisions/ADR-0002-rulesets-and-world-eras.md');
const classicAdr=load('docs/decisions/ADR-0003-classic-progression-education-employment.md');
const contract=JSON.parse(load('docs/parity-contract.json'));
if(!architecture.includes('Mechanical Fidelity Charter')||!architecture.includes('original gameplay mechanics'))errors.push('Architectural mechanics-first charter missing');
if(!adr.includes('Status:** Accepted')||!scenarioAdr.includes('Status:** Accepted')||!classicAdr.includes('Status:** Accepted'))errors.push('Accepted architecture decision missing');
if(!originalRules.includes('TIME-001')||!originalRules.includes('EDU-001'))errors.push('Reference specification incomplete');
if(contract.schema!=='the-life-loop.parity-contract.v1'||contract.release!==pkg.version)errors.push(`Parity contract schema/release mismatch: ${contract.release} vs ${pkg.version}`);
if(!Array.isArray(contract.mechanics)||contract.mechanics.length<21)errors.push('Parity registry missing required mechanics');
const requiredRuleIds=['TURN-001','TIME-001','TIME-002','TIME-003','JOB-001','JOB-002','JOB-003','JOB-004','JOB-005','EDU-001','EDU-002','ITEM-001','ITEM-002','ECON-001','ECON-002','ECON-003','ECON-004','EVT-001','GOAL-001','GOAL-002','MOD-001','JOB-006'];
const statuses=new Set(['implemented','partial','deviates','missing','unverified']);
const validPrios=new Set(['P0','P1','P2','P3']);
const ids=contract.mechanics.map(m=>m.id);
if(new Set(ids).size!==ids.length||requiredRuleIds.some(id=>!ids.includes(id)))errors.push('Incomplete/duplicate parity rule IDs');
for(const m of contract.mechanics){
 if(!m.title||!m.target||!m.current||!m.acceptance||!statuses.has(m.status)||!validPrios.has(m.priority)||!String(m.source_url).startsWith('https://'))errors.push('Invalid parity mechanic '+m.id);
 if(!matrix.includes('| '+m.id+' |'))errors.push('Parity matrix omits '+m.id);
}
if(!manifest.implemented.some(t=>t.id==='LL-037')||!manifest.implemented.some(t=>t.id==='LL-038'))errors.push('Architecture workboard tasks missing');
if(!['LL-043','LL-044','LL-045','LL-046','LL-047','LL-048'].every(id=>manifest.implemented.some(t=>t.id===id)))errors.push('New Game scenario workboard tasks missing');
if(!['LL-055','LL-056','LL-057','LL-058','LL-059'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-060'))errors.push('v0.5.0 workboard tasks missing');
if(!load('docs/classic-job-table.md').includes('General Manager')||!load('docs/decisions/ADR-0004-original-jobs-and-manual-rent.md').includes('**Status:** Accepted'))errors.push('Classic DOS job/architecture reference missing');
if(!['LL-061','LL-062','LL-063','LL-064','LL-065'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-066'))errors.push('v0.5.1 banking and food workboard tasks missing');
if(!load('docs/decisions/ADR-0005-classic-banking-and-fresh-food.md').includes('**Status:** Accepted'))errors.push('Missing Classic bank/food ADR');
if(!manifest.remaining.some(t=>t.id==='LL-039')||!manifest.remaining.some(t=>t.id==='LL-040'))errors.push('Parity implementation backlog missing');
const data=JSON.parse(execFileSync(process.execPath,['-e',`console.log(JSON.stringify(require('./src/data.js').classicJobs))`],{cwd:root,encoding:'utf8'}));
if(data.length!==37||!data.find(j=>j.id==='classic-factory-general-manager'&&j.wage===25))errors.push('Authentic 37-job catalog missing');
const play=load('PLAY.html');
for(const token of ['class="board-grid"','const encounters = {','class="modal story-modal"','function scene(id','class="npc-card"','id="cityPulse"','class="friendship"','const cityEvents = [','const favors = {','const storyArcs = [','id="financeBtn"','function showFinances(){','function showCareers(){','id="careerBtn"','const clothingOffers = {','const courses = [','const worldEras = {','function eraScene(id,compact,era)','name=\"ruleset\"']){
 if(!play.includes(token))errors.push('Offline game is missing '+token);
}
if(play.includes('<script src=')||play.includes('<link rel="stylesheet"'))errors.push('Offline edition uses dependencies');
if(!load('index.html').includes('src/art.js'))errors.push('Art dependency not declared');
const pages=load('.github/workflows/pages.yml');
if(!pages.includes('actions/deploy-pages@v4') || !pages.includes('actions/upload-pages-artifact@v4') || !pages.includes('node tools/verify.mjs'))errors.push('Pages deploy is missing the tested build and deployment actions');
if(!load('package.json').includes('build:pages'))errors.push('No GitHub Pages build script configured');
if(!manifest.implemented.some(t=>t.id==='LL-067')||!manifest.implemented.some(t=>t.id==='LL-070'))errors.push('Online co-op workboard tasks missing');
if(!load('looprd.yaml').includes('looprd/v1')||!load('looprd.yaml').includes('the-life-loop')||!load('looprd.yaml').includes('websocket:'))errors.push('Looprd component missing or invalid');
if(!load('src/network.js').includes('class LifeOnline')||!load('index.html').includes('id="onlineBtn"')||!play.includes('class LifeOnline'))errors.push('Online multiplayer browser adapter missing');
if(!load('docs/decisions/ADR-0006-online-multiplayer-looprd.md').includes('**Status:** Accepted'))errors.push('Online multiplayer architecture decision missing');
if(!load('docs/decisions/ADR-0007-responsive-mobile-layout.md').includes('**Status:** Accepted'))errors.push('Responsive UI architecture decision missing');
if(!load('docs/decisions/ADR-0008-adaptive-drawers-and-turn-ownership.md').includes('**Status:** Accepted'))errors.push('Sliding panels/turn ownership architecture decision missing');
if(!['LL-078','LL-079','LL-080','LL-081'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-082'))errors.push('v0.5.5 UI/Looprd workboard tasks missing');
if(!manifest.implemented.some(t=>t.id==='LL-073')||!manifest.implemented.some(t=>t.id==='LL-074')||!manifest.implemented.some(t=>t.id==='LL-075'))errors.push('Mobile UI workboard tasks missing');
if(!manifest.implemented.some(t=>t.id==='LL-076')||!manifest.implemented.some(t=>t.id==='LL-077'))errors.push('v0.5.4 release synchronization workboard tasks missing');
if(!load('index.html').includes('id="mobileNav"'))errors.push('Mobile panel controls missing');
if(!load('index.html').includes('src/characters.js')||!load('PLAY.html').includes('the-life-loop-characters-v1')||!load('src/app.js').includes('showCharacterLibrary('))errors.push('Browser-local character creator missing');
if(!load('docs/decisions/ADR-0009-offline-reusable-character-profiles.md').includes('**Status:** Accepted'))errors.push('Character creator architecture decision missing');
if(!['LL-083','LL-084','LL-085'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-086'))errors.push('Character creator workboard tasks missing');
if(!load('docs/decisions/ADR-0010-shared-multiplayer-cosmetics-ephemeral-chat-and-viewport.md').includes('**Status:** Accepted'))errors.push('Multiplayer cosmetics/chat architecture decision missing');
if(!['LL-087','LL-088','LL-089','LL-090','LL-091'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-092'))errors.push('v0.5.7 workboard tasks missing');
if(!load('looprd.yaml').includes('schemaVersion: 2')||!load('looprd.yaml').includes('chatKey:'))errors.push('Looprd v2 private chat key missing');
if(!load('server/looprd_handler.py').includes("if op == 'chat':")||!load('src/network.js').includes('async sendChat(')||!load('index.html').includes('id="chatPanel"'))errors.push('Ephemeral WSS chat implementation missing');
if(!load('src/app.js').includes('setup-wizard-progress')||!load('src/app.js').includes('characters.all().find(p=>p.id===$('))errors.push('Guest profile sharing or mobile stepper missing');
const artManifest=JSON.parse(load('assets/art/styles/contemporary-default/manifest.json'));
const artMap=JSON.parse(load('src/art-assets.js').match(/root\.LifeArtAssets=(\{.*\});/)?.[1]||'{}');
if(artManifest.schema!=='the-life-loop.art-pack.v1'||artManifest.version!==pkg.version||JSON.stringify(artManifest)!==JSON.stringify(artMap))errors.push('Contemporary art pack mapping out of sync');
if(Object.keys(artManifest.venues).length!==11||artManifest.venues.home)errors.push('Art pack must map eleven non-home venues');
for(const tier of ['studio','apartment','loft'])if(!Object.hasOwn(artManifest.homeTiers,tier))errors.push('Missing home artwork tier '+tier);
if(!load('docs/decisions/ADR-0011-distinct-venue-art-and-residence-tiers.md').includes('**Status:** Accepted'))errors.push('Art architecture decision missing');
if(!['LL-093','LL-094','LL-095','LL-096'].every(id=>manifest.implemented.some(t=>t.id===id))||!manifest.implemented.some(t=>t.id==='LL-097')||!manifest.remaining.some(t=>t.id==='LL-098')||!manifest.implemented.some(t=>t.id==='LL-099'))errors.push('v0.5.8 workboard tasks missing');
for(const tier of ['studio','apartment','loft']) {
 const home=artManifest.homeTiers[tier];
 if(!home || typeof home.card!=='string' || typeof home.detail!=='string')errors.push('Missing v0.5.9 housing images '+tier);
 else for(const path of [home.card,home.detail])if(statSync(resolve(root,path)).size>400*1024)errors.push('Oversize residence asset '+path);
}
if(!load('src/app.js').includes('Art.scene(loc.id,true,game.settings.era,p.home)')||!load('src/app.js').includes('Art.scene(current.id,false,game.settings.era,p.home)'))errors.push('Housing tier-aware visual wiring missing');
if(!load('tools/build-offline.mjs').includes('generate-art-assets.mjs'))errors.push('Art manifest generation not integrated');
if(errors.length)throw Error(errors.join('\n'));
console.log(`ZipRunner workboard OK; ${tasks.length} items; offline build OK.`);
// Verify Pages artifacts from a clean source checkout, not only the standalone offline build.
execFileSync(process.execPath,[resolve(root,'tools/build-pages.mjs')],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['--test','tests/game.test.cjs','tests/rules-era.test.cjs','tests/classic-parity.test.cjs','tests/classic-jobs-rent.test.cjs','tests/classic-banking-food.test.cjs','tests/multiplayer.test.cjs','tests/mobile-ui.test.cjs','tests/characters.test.cjs','tests/art-pack.test.cjs'],{cwd:root,stdio:'inherit'});
console.log('Verification succeeded.');

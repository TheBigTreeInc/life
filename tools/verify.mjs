import {readFileSync,statSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {reconcile} from './reconcile-workboard.mjs';
const root=resolve(import.meta.dirname,'..');
const load=rel=>readFileSync(resolve(root,rel),'utf8');
execFileSync(process.execPath,[resolve(root,'tools/build-offline.mjs')],{stdio:'inherit'});
const pkg=JSON.parse(load('package.json'));
const atLeast=baseline=>pkg.version.split('.').map(Number).reduce((n,v)=>n*1000+v,0)>=baseline.split('.').map(Number).reduce((n,v)=>n*1000+v,0);
const manifest=JSON.parse(load('.ziprunner-workboard-update.json'));
const tasks=[...manifest.implemented,...manifest.remaining];
// Workboard updates are incremental. ZipRunner rejects implemented/remaining lists
// outside 1..150 and there is no reason to resend the entire project history.
// Keep prior completed work in a version-controlled archive, not in the update.
const archived=JSON.parse(load('docs/workboard-history.json'));
const allImplemented=[...archived.implemented,...manifest.implemented];
const archivedIds=new Set(archived.implemented.map(t=>t.id));
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
if(!Array.isArray(manifest.implemented)||manifest.implemented.length<1||manifest.implemented.length>150)errors.push('ZipRunner workboard update: implemented must contain 1–150 entries');
if(!Array.isArray(manifest.remaining)||manifest.remaining.length>150)errors.push('ZipRunner workboard update: remaining must contain 0–150 entries');
if(archived.schema!=='the-life-loop.workboard-history.v1'||!Array.isArray(archived.implemented))errors.push('Historical workboard archive invalid');
if(new Set(allImplemented.map(t=>t.id)).size!==allImplemented.length)errors.push('Historical and current workboard entries overlap');
if(tasks.some(t=>archivedIds.has(t.id)))errors.push('Incremental workboard update repeats historical entries');
if(new Set(tasks.map(t=>t.id)).size!==tasks.length)errors.push('Repeated workboard IDs');
for(const t of [...allImplemented,...manifest.remaining]){if(!t.id||!t.title||!t.summary)errors.push('Missing workboard fields');}
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
if(contract.schema!=='the-life-loop.parity-contract.v1'||contract.release!==pkg.version||contract.version!==pkg.version)errors.push(`Parity contract schema/release mismatch: ${contract.release} vs ${pkg.version}`);
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
if(!allImplemented.some(t=>t.id==='LL-037')||!allImplemented.some(t=>t.id==='LL-038'))errors.push('Architecture workboard tasks missing');
if(!['LL-043','LL-044','LL-045','LL-046','LL-047','LL-048'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('New Game scenario workboard tasks missing');
if(!['LL-055','LL-056','LL-057','LL-058','LL-059'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-060'))errors.push('v0.5.0 workboard tasks missing');
if(!load('docs/classic-job-table.md').includes('General Manager')||!load('docs/decisions/ADR-0004-original-jobs-and-manual-rent.md').includes('**Status:** Accepted'))errors.push('Classic DOS job/architecture reference missing');
if(!['LL-061','LL-062','LL-063','LL-064','LL-065'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-066'))errors.push('v0.5.1 banking and food workboard tasks missing');
if(!load('docs/decisions/ADR-0005-classic-banking-and-fresh-food.md').includes('**Status:** Accepted'))errors.push('Missing Classic bank/food ADR');
if(!manifest.remaining.some(t=>t.id==='LL-039')||!manifest.remaining.some(t=>t.id==='LL-040'))errors.push('Parity implementation backlog missing');
const routeData=JSON.parse(load('assets/boards/classic/routes.v1.json'));
const generatedRoute=load('src/classic-routes.js');
if(!generatedRoute.includes('root.LifeClassicRoutes='+JSON.stringify(routeData)))errors.push('Embedded route graph is stale relative to route JSON');
if(!load('index.html').includes('id="routeOverlay"')||!load('src/app.js').includes('routeOverlay.animate')||!load('src/route-graph.js').includes('const api={validate,compile}')||!load('src/route-overlay.js').includes('class RouteOverlay'))errors.push('Route graph or pawn integration missing');
if(!load('PLAY.html').includes('class RouteOverlay')||!load('PLAY.html').includes('the-life-loop.board-route.v1'))errors.push('Offline route implementation not embedded');
if(!['LL-165','LL-166','LL-167','LL-168'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-169'))errors.push('Route improvement workboard tasks missing');
if(!load('docs/decisions/ADR-0027-shared-travel-graph-preview-and-responsive-streets.md').includes('**Status:** Accepted'))errors.push('Shared-route architecture decision missing');
const originalDOS=JSON.parse(load('assets/boards/classic/original-mechanics.v1.json'));
if(originalDOS.waypoints.length!==170||originalDOS.places.length!==13||originalDOS.jobs.length!==37)errors.push('Original DOS 170/13/37 reference inconsistent');
if(!load('PLAY.html').includes('root.LifeClassicOriginal=')||!load('src/engine.js').includes('classicAIPlan(p='))errors.push('Original Classic mechanics/AI missing from bundled edition');
if(!['LL-170','LL-171','LL-172','LL-173','LL-174'].every(id=>allImplemented.some(x=>x.id===id))||!manifest.remaining.some(x=>x.id==='LL-175')||!manifest.remaining.some(x=>x.id==='LL-176'))errors.push('Original route/career/AI workboard tasks missing');
if(!load('src/engine.js').includes('classicRouteGraph.plan(from,to).steps')||!load('src/app.js').includes('previewTravel')||!load('index.html').includes('id="routeHint"'))errors.push('Authoritative route quotes / browser preview missing');
if(!['LL-159','LL-160','LL-161','LL-162','LL-163'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-164'))errors.push('Route release workboard tasks missing');
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
if(atLeast('0.5.65')) {
  const ledger=JSON.parse(load('docs/release-ledger.json'));
  const records=ledger.releases;
  const compare=(a,b)=>a.split('.').map(Number).reduce((n,v)=>n*1000+v,0)-b.split('.').map(Number).reduce((n,v)=>n*1000+v,0);
  if(ledger.schema!=='the-life-loop.release-ledger.v1'||ledger.project!==pkg.name||!Array.isArray(records)||records.length<2||
    records.at(-1)?.version!==pkg.version||records.at(-1)?.artifact!==releaseName||
    records.some((r,i)=>i>0&&compare(r.version,records[i-1].version)<=0)||
    records.some((r,i)=>i>0&&r.supersedes!==records[i-1].version)) errors.push('Release ledger/version monotonicity failed: every correction must use a NEW version');
  if(!load('index.html').includes('id="languageSelect"')||!load('PLAY.html').includes('id="languageSelect"')||
     !load('src/app.js').includes("$('languageSelect').addEventListener('change'")||
     !load('tools/package-ziprunner.py').includes("glob('*.test.cjs')")||
     !['LL-324'].every(id=>manifest.implemented.some(x=>x.id===id)))errors.push('v0.5.65 toolbar repair, manifest task or complete test packaging missing');
}
if(atLeast('0.5.66')){
 if(!load('index.html').includes('src/i18n.js')||!load('PLAY.html').includes('root.LifeI18n=api')||
    !load('src/app.js').includes('I18n.set(')||
    !load('src/i18n.js').includes('function set(language,storage)')||
    !load('TEST-LANGUAGE-066.bat').includes('language-campaign-066.test.cjs')||
    !manifest.implemented.some(t=>t.id==='LL-325'))errors.push('v0.5.66 shared I18n.set locale contract missing');
}
if(atLeast('0.5.68')){
 if(!load('index.html').includes('src/goal-presets.js')||
    !load('src/app.js').includes('GoalPresets.goals(key)')||
    !load('PLAY.html').includes('root.LifeGoalPresets=api')||
    !load('src/goal-presets.js').includes('function goals(key)')||
    !load('TEST-MERGED-CONTRACT-068.bat').includes('goal-presets-068.test.cjs')||
    !manifest.implemented.some(t=>t.id==='LL-327'))
   errors.push('v0.5.68 GoalPresets.goals contract, browser bundle or regression gate missing');
}
if(atLeast('0.5.69')){
 if(!load('src/i18n.js').includes('translations=Object.freeze')||
    !load('src/goal-presets.js').includes('quick:50')||
    !load('tests/campaign-preset-067.test.cjs').includes('local tests may coexist')||
    !load('tests/ziprunner-merge-069.test.cjs').includes('typed DOS takeout survives save/reload')||
    !load('docs/v0.5.69-merged-tree-contract-failures.md').includes('six failures')||
    !manifest.implemented.some(t=>t.id==='LL-328'))errors.push('v0.5.69 merged-tree six-failure compatibility contract missing');
}
if(!load('package.json').includes('build:pages'))errors.push('No GitHub Pages build script configured');
if(!allImplemented.some(t=>t.id==='LL-067')||!allImplemented.some(t=>t.id==='LL-070'))errors.push('Online co-op workboard tasks missing');
if(!load('looprd.yaml').includes('looprd/v1')||!load('looprd.yaml').includes('the-life-loop')||!load('looprd.yaml').includes('websocket:'))errors.push('Looprd component missing or invalid');
if(!load('src/network.js').includes('class LifeOnline')||!load('index.html').includes('id="onlineBtn"')||!play.includes('class LifeOnline'))errors.push('Online multiplayer browser adapter missing');
if(!['LL-294','LL-295','LL-296'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('src/app.js').includes("await routeOverlay?.animate(actorId,from,'home'")||!load('src/rule-presets.js').includes('marketFluctuations')||!load('docs/decisions/ADR-0056-homeward-animation-and-house-rule-extensions.md').includes('**Status:** Accepted'))errors.push('v0.5.56 homeward animation and customizable weekly rules missing');
if(!load('docs/decisions/ADR-0006-online-multiplayer-looprd.md').includes('**Status:** Accepted'))errors.push('Online multiplayer architecture decision missing');
if(!load('docs/decisions/ADR-0007-responsive-mobile-layout.md').includes('**Status:** Accepted'))errors.push('Responsive UI architecture decision missing');
if(!load('docs/decisions/ADR-0008-adaptive-drawers-and-turn-ownership.md').includes('**Status:** Accepted'))errors.push('Sliding panels/turn ownership architecture decision missing');
if(!['LL-078','LL-079','LL-080','LL-081'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-082'))errors.push('v0.5.5 UI/Looprd workboard tasks missing');
if(!allImplemented.some(t=>t.id==='LL-073')||!allImplemented.some(t=>t.id==='LL-074')||!allImplemented.some(t=>t.id==='LL-075'))errors.push('Mobile UI workboard tasks missing');
if(!allImplemented.some(t=>t.id==='LL-076')||!allImplemented.some(t=>t.id==='LL-077'))errors.push('v0.5.4 release synchronization workboard tasks missing');
if(!load('index.html').includes('id="mobileNav"'))errors.push('Mobile panel controls missing');
if(!load('index.html').includes('src/characters.js')||!load('PLAY.html').includes('the-life-loop-characters-v1')||!load('src/app.js').includes('showCharacterLibrary('))errors.push('Browser-local character creator missing');
if(!load('docs/decisions/ADR-0009-offline-reusable-character-profiles.md').includes('**Status:** Accepted'))errors.push('Character creator architecture decision missing');
if(!['LL-083','LL-084','LL-085'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-086'))errors.push('Character creator workboard tasks missing');
if(!load('docs/decisions/ADR-0010-shared-multiplayer-cosmetics-ephemeral-chat-and-viewport.md').includes('**Status:** Accepted'))errors.push('Multiplayer cosmetics/chat architecture decision missing');
if(!['LL-087','LL-088','LL-089','LL-090','LL-091'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-092'))errors.push('v0.5.7 workboard tasks missing');
if(!load('looprd.yaml').includes('schemaVersion: 2')||!load('looprd.yaml').includes('chatKey:'))errors.push('Looprd v2 private chat key missing');
if(!load('server/looprd_handler.py').includes("if op == 'chat':")||!load('src/network.js').includes('async sendChat(')||!load('index.html').includes('id="chatPanel"'))errors.push('Ephemeral WSS chat implementation missing');
if(!load('src/app.js').includes('quick-start-form')||!load('src/app.js').includes('characters.all().find(p=>p.id===f.get('))errors.push('Guest profile sharing or quick start missing');
const artManifest=JSON.parse(load('assets/art/styles/contemporary-default/manifest.json'));
const artMap=JSON.parse(load('src/art-assets.js').match(/root\.LifeArtAssets=(\{.*\});/)?.[1]||'{}');
if(artManifest.schema!=='the-life-loop.art-pack.v1'||artManifest.version!==pkg.version||JSON.stringify(artManifest)!==JSON.stringify(artMap))errors.push('Contemporary art pack mapping out of sync');
if(Object.keys(artManifest.venues).length!==12||artManifest.venues.home)errors.push('Art pack must map twelve non-home venues');
for(const tier of ['studio','apartment','loft'])if(!Object.hasOwn(artManifest.homeTiers,tier))errors.push('Missing home artwork tier '+tier);
if(!load('docs/decisions/ADR-0011-distinct-venue-art-and-residence-tiers.md').includes('**Status:** Accepted'))errors.push('Art architecture decision missing');
if(!['LL-093','LL-094','LL-095','LL-096'].every(id=>allImplemented.some(t=>t.id===id))||!allImplemented.some(t=>t.id==='LL-097')||!manifest.remaining.some(t=>t.id==='LL-098')||!allImplemented.some(t=>t.id==='LL-099'))errors.push('v0.5.8 workboard tasks missing');
for(const tier of ['studio','apartment','loft']) {
 const home=artManifest.homeTiers[tier];
 if(!home || typeof home.card!=='string' || typeof home.detail!=='string')errors.push('Missing v0.5.9 housing images '+tier);
 else for(const path of [home.card,home.detail])if(statSync(resolve(root,path)).size>400*1024)errors.push('Oversize residence asset '+path);
}
if(!load('src/app.js').includes('Art.scene(loc.artId||loc.id,true,game.settings.era')||!load('src/app.js').includes('Art.scene(current.artId||current.id,false,game.settings.era'))errors.push('Housing tier-aware visual wiring missing');
if(!load('tools/build-offline.mjs').includes('generate-art-assets.mjs'))errors.push('Art manifest generation not integrated');
if(!load('index.html').includes('src/setup-preferences.js')||!load('PLAY.html').includes('the-life-loop-setup-preferences-v1')||!load('src/app.js').includes('id="setupAdvanced"'))errors.push('Quick Start preferences missing');
if(!load('docs/decisions/ADR-0012-quick-start-and-local-new-game-preferences.md').includes('**Status:** Accepted'))errors.push('Quick Start architecture decision missing');
if(!['LL-100','LL-101','LL-102'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('v0.5.10 workboard tasks missing');
const portraitManifest=JSON.parse(load('assets/portraits/default/manifest.json'));
if(portraitManifest.schema!=='the-life-loop.portrait-pack.v1'||portraitManifest.version!==pkg.version||Object.keys(portraitManifest.portraits).length!==51)errors.push('Portrait pack manifest invalid');
if(!load('src/portrait-assets.js').includes('LifePortraitAssets'))errors.push('Generated portrait asset map missing');
for(const item of Object.values(portraitManifest.portraits)){if(statSync(resolve(root,item.image)).size>120*1024)errors.push('Portrait image exceeds size budget '+item.image);}
if(!['LL-103','LL-104','LL-105'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('v0.5.12 portrait workboard tasks missing');
if(!load('docs/decisions/ADR-0013-illustrated-character-portrait-catalog.md').includes('**Status:** Accepted'))errors.push('Portrait catalog ADR missing');
if(!load('docs/decisions/ADR-0014-character-compiler-and-pixel-preview.md').includes('**Status:** Accepted'))errors.push('Character compiler architecture ADR missing');
if(!['LL-107','LL-108','LL-109','LL-110'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-111'))errors.push('v0.5.13 character compiler workboard tasks missing');
const characterCatalog=JSON.parse(load('assets/characters/pixel-v1/catalog.json'));
if(characterCatalog.schema!=='the-life-loop.character-parts.v1'||characterCatalog.canvas?.width!==32||characterCatalog.directions?.length!==4)errors.push('Pixel character catalog missing or invalid');
if(!load('index.html').includes('src/character-sprites.js')||!load('PLAY.html').includes('root.LifeSprites')||!load('src/app.js').includes('id="spriteExportBtn"'))errors.push('Compiled pixel character renderer missing');
if(!load('tools/build-offline.mjs').includes('generate-character-catalog.mjs'))errors.push('Character catalog generation not wired into offline build');
if(!load('docs/decisions/ADR-0015-pause-character-customization.md').includes('**Status:** Accepted'))errors.push('Customization pause ADR missing');
if(!['LL-112','LL-113'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('v0.5.14 rollback workboard tasks missing');
if(!['LL-117','LL-118','LL-119','LL-120'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('v0.5.16 Classic time and pawn workboard tasks missing');
if(!load('src/engine.js').includes('classicPawnLots')||!load('src/engine.js').includes('classicWorkHourCredit')||!load('docs/decisions/ADR-0017-classic-partial-work-and-pawn-lifecycle.md').includes('**Status:** Accepted'))errors.push('Classic partial work and pawn feature/ADR missing');
if(!['LL-121','LL-122','LL-123','LL-124'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('Shared map and eligible jobs release tasks missing');
if(!['LL-125','LL-126','LL-127','LL-128','LL-129'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-130'))errors.push('Classic Jones goals/economy release tasks missing');
if(!load('src/engine.js').includes('rivalGoalAllocation(')||!load('src/app.js').includes('id="jonesDifficulty"')||!load('src/engine.js').includes('classicGoalStats(p)'))errors.push('Original Classic rival-goal mechanics missing');
if(!load('docs/decisions/ADR-0019-classic-goals-jones-and-employer-office.md').includes('**Status:** Accepted'))errors.push('Classic goal/competition ADR missing');
if(!load('src/app.js').includes('showFutureJobApplications=false')||!load('src/data.js').includes("id:'pawn'"))errors.push('Shared 13-venue board and eligible-first careers not present');
if(!allImplemented.some(t=>t.id==='LL-131')||!allImplemented.some(t=>t.id==='LL-132')||!allImplemented.some(t=>t.id==='LL-133')||!manifest.remaining.some(t=>t.id==='LL-134'))errors.push('v0.5.19 printed-reference parity workboard tasks missing');
if(!load('docs/decisions/ADR-0020-printed-reference-classic-economy.md').includes('**Status:** Accepted'))errors.push('Original primary-source parity decision missing');
if(atLeast('0.5.57')&&(!load('src/app.js').includes('goalPreset')||!load('src/engine.js').includes('closeWeekFood')||!load('src/life-pass-057.js').includes('closeWeekFood')||!load('docs/decisions/ADR-0057-weekly-food-goals-and-localization.md').includes('**Status:** Accepted')))errors.push('v0.5.57 food goals and localization integration missing');
if(!load('src/engine.js').includes('classicOwnedValue(')||!load('src/engine.js').includes('classicStudyProgress(')||!load('src/engine.js').includes('classicEmergencyRelief('))errors.push('Classic reference parity gameplay missing');
if(atLeast('0.5.58')&&(!load('src/engine.js').includes('ClassicGoals.progress(')||!load('src/classic-goals.js').includes('careerStat')||!load('docs/decisions/ADR-0058-source-weighted-goal-parity.md').includes('**Status:** Accepted')||!['LL-303','LL-304'].every(id=>manifest.implemented.some(t=>t.id===id))))errors.push('v0.5.58 Classic source goal parity gate missing');
if(atLeast('0.5.59')&&(!load('src/app.js').includes('name="weeklyActionLimit"')||!load('src/engine.js').includes('hours===0')||!load('src/classic-time.js').includes('routeClockScenario')||!load('docs/decisions/ADR-0059-clock-end-actions-and-route-evidence.md').includes('**Status:** Accepted')||!manifest.implemented.some(t=>t.id==='LL-305')))errors.push('v0.5.59 clock parity gate missing');
if(atLeast('0.5.60')&&(!load('src/engine.js').includes('ClassicWeekly.cashStress(')||!load('src/app.js').includes('Classic happiness · last four weeks')||!load('src/classic-weekly-events.js').includes('headlineHappiness')||!load('docs/decisions/ADR-0060-source-food-cash-stress-and-happiness-audit.md').includes('**Status:** Accepted')||!manifest.implemented.some(t=>t.id==='LL-311')))errors.push('v0.5.60 source happiness parity gate missing');
if(atLeast('0.5.61')&&(!load('src/classic-time.js').includes('originalGarnishmentReference')||!load('src/classic-weekly-events.js').includes('happinessDelta:lost>0')||!load('src/engine.js').includes('ClassicWeekly.loanDueTrace(closedWeek')||!load('docs/decisions/ADR-0061-classic-food-loans-and-paycheck-evidence.md').includes('**Status:** Accepted')||!['LL-312','LL-313','LL-314'].every(id=>manifest.implemented.some(t=>t.id===id))))errors.push('v0.5.61 obligation parity contract missing');
if(!['LL-135','LL-136','LL-137','LL-138','LL-139'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('Centered venue workboard tasks missing');
if(!load('docs/decisions/ADR-0021-board-centered-venue-interactions.md').includes('**Status:** Accepted'))errors.push('Centered venue architecture decision missing');
if(load('index.html').includes('id="gameActions"')||load('index.html').includes('id="destinationDrawerBtn"')||load('index.html').includes('data-mobile-tab="actions"'))errors.push('Old destination pane or mobile Activities tab remains');
for(const id of ['venueLayer','venueTitle','venueActions','venueDone','endTurnBtn'])if(!load('index.html').includes(`id="${id}"`))errors.push('Missing board-centered control '+id);
if(!load('src/app.js').includes("$('venueActions').addEventListener('click'")||!load('src/app.js').includes("net.execute('act',actionId,()=>game.act(actionId))"))errors.push('Venue commands must use existing engine/network path');
if(!['LL-140','LL-141','LL-142'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('Employer board workplace workboard tasks missing');
if(!load('docs/decisions/ADR-0022-dos-employer-board-venue-contract.md').includes('**Status:** Accepted'))errors.push('Employer-to-board contract ADR missing');
if(!load('src/data.js').includes('classicEmployerVenues')||!load('src/data.js').includes('function jobWorkplace(job)'))errors.push('Canonical employer-to-venue mapping missing');
if(!load('src/app.js').includes('work-marker')||!load('src/app.js').includes('game.jobWorkplace(j)'))errors.push('Workplace tile/character display missing');
if(!['LL-143','LL-144','LL-145','LL-146'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-147'))errors.push('Classic Z-Mart/Black Market retail workboard tasks missing');
if(!load('docs/decisions/ADR-0023-classic-retail-counters-rotating-zmart-inventory.md').includes('**Status:** Accepted'))errors.push('Retail parity architecture decision missing');
if(!load('src/data.js').includes('classicDiscountStock')||!load('src/engine.js').includes('classicWeekendTicket')||!load('src/app.js').includes('venue-dept-heading'))errors.push('Retail split and rotated discount merchandise missing');
if(!allImplemented.some(t=>t.id==='LL-148')||!allImplemented.some(t=>t.id==='LL-151')||!manifest.remaining.some(t=>t.id==='LL-152'))errors.push('v0.5.23 clock/partial-wage workboard tasks missing');
if(!load('docs/decisions/ADR-0024-classic-clock-event-budget-and-partial-wages.md').includes('**Status:** Accepted'))errors.push('Clock and partial-wage architecture decision missing');
if(!load('src/engine.js').includes('CLASSIC_WEEKLY_ACTION_LIMIT'))errors.push('Classic weekly decision gate missing');
// The original-Jones map must not drift back into the Modern board.
const classicBoard=JSON.parse(load('assets/art/styles/classic-modern/manifest.json'));
if(classicBoard.schema!=='the-life-loop.classic-board-art.v1'||classicBoard.release!==pkg.version||Object.keys(classicBoard.venues).length!==13)errors.push('Classic board art manifest/version is invalid');
if(!load('src/data.js').includes('const classicPlaces = [')||!load('src/engine.js').includes('get places(){return this.isClassic?D.classicPlaces:D.places;}'))errors.push('Classic original map runtime/Modern isolation missing');
if(!load('src/app.js').includes("game.isClassic?loc.id:null")||!load('src/art.js').includes('classicArtAssets.venues'))errors.push('Classic board art fallback/override not wired');
if(!load('tools/build-offline.mjs').includes('generate-classic-art-assets.mjs')||!load('index.html').includes('src/classic-art-assets.js'))errors.push('Classic art generation missing in build');
if(!load('docs/decisions/ADR-0025-classic-original-board-and-economic-risks.md').includes('**Status:** Accepted')||!load('docs/classic-board-art-request.md').includes('Le Security Apartments'))errors.push('Classic board decision or art contract missing');
if(!['LL-153','LL-154','LL-155','LL-156','LL-157'].every(id=>allImplemented.some(t=>t.id===id))||!manifest.remaining.some(t=>t.id==='LL-158'))errors.push('Classic board/workplace/risk workboard tasks missing');
if(!load('src/engine.js').includes('classicEquipmentBreakage(')||!load('src/engine.js').includes('classicBurglar(')||!load('src/engine.js').includes('classicCrimeAfterAction('))errors.push('Classic risk mechanics missing');
if(!load('src/classic-pass2-rules.js').includes('lotteryPrize')||!load('docs/decisions/ADR-0030-source-derived-classic-economy-and-ordered-ai.md').includes('**Status:** Accepted'))errors.push('Classic Pass-2 source and ADR missing');
if(!['LL-183','LL-184','LL-185','LL-186','LL-187','LL-188'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('Classic Pass-2 workboard incomplete');
if(!load('src/classic-economy.js').includes('classic-economic-indices.v1')||!load('PLAY.html').includes('root.LifeClassicEconomy')||!load('index.html').includes('src/classic-economy.js')||!load('src/engine.js').includes('ClassicEconomy.advance('))errors.push('Classic multi-index economy not installed in source or offline build');
if(!load('docs/decisions/ADR-0031-coupled-classic-economy-and-contract-wages.md').includes('**Status:** Accepted')||!['LL-191','LL-192','LL-193','LL-194','LL-195'].every(id=>allImplemented.some(x=>x.id===id)))errors.push('Classic v0.5.30 ADR/workboard incomplete');
if(!load('src/classic-economic-events.js').includes('classic-economic-events.v1')||!load('PLAY.html').includes('root.LifeClassicEconomicEvents')||!load('index.html').includes('src/classic-economic-events.js')||!load('src/engine.js').includes('classicApplyScandal('))errors.push('Classic economic shock source/build wiring missing');
if(!load('docs/decisions/ADR-0032-economic-crises-recovery-and-laid-off-rival.md').includes('**Status:** Accepted')||!['LL-196','LL-197','LL-198','LL-199','LL-200'].every(id=>allImplemented.some(t=>t.id===id)))errors.push('Classic v0.5.31 release tasks or ADR missing');
if(!load('docs/decisions/ADR-0033-ordered-jones-career-education-and-reemployment.md').includes('**Status:** Accepted')||!['LL-201','LL-202','LL-203','LL-204','LL-205'].every(id=>allImplemented.some(t=>t.id===id))||!load('src/engine.js').includes('classicRecoveryOpening(')||!load('src/engine.js').includes('classicCareerDecision(')||!load('src/app.js').includes('classicJobSearchFailures'))errors.push('v0.5.32 Career/AI migration metadata or source missing');
if(!load('src/classic-time.js').includes('originalTravelTicks')||!load('src/engine.js').includes('ClassicTime.travelBreakdown')||!load('PLAY.html').includes('root.LifeClassicTime')||!load('index.html').includes('src/classic-time.js'))errors.push('Classic source time module not embedded in game');
if(!load('docs/decisions/ADR-0034-classic-source-time-ticks-and-work.md').includes('**Status:** Accepted')||!['LL-206','LL-207','LL-208','LL-209','LL-210'].every(id=>allImplemented.some(x=>x.id===id))||!load('TEST-TIME.bat').includes('classic-original-timing.test.cjs'))errors.push('Classic time migration metadata or tests missing');
if(!['LL-211','LL-212','LL-213','LL-214','LL-215'].every(id=>allImplemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0035-classic-work-warning-paycheck-and-ai-budget.md').includes('**Status:** Accepted')||!load('TEST-WORK.bat').includes('classic-work-warning-garnishment.test.cjs')||!load('src/classic-time.js').includes('workStanding')||!load('src/classic-time.js').includes('paycheck'))errors.push('v0.5.34 employer warning/paycheck/AI migration incomplete');
if(!['LL-221','LL-222','LL-223','LL-224','LL-225'].every(id=>allImplemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0037-source-informed-classic-turn-sequencing.md').includes('**Status:** Accepted')||!load('src/classic-turn-sequence.js').includes('closeTurn')||!load('PLAY.html').includes('root.LifeClassicTurnSequence')||!load('src/app.js').includes('Classic turn sequence')||!load('TEST-TURNS.bat').includes('classic-turn-sequence.test.cjs'))errors.push('v0.5.36 turn sequence missing');
if(!['LL-216','LL-217','LL-218','LL-219','LL-220'].every(id=>allImplemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0036-classic-paycheck-reconciliation-and-debt-recovery.md').includes('**Status:** Accepted')||!load('TEST-PAYCHECKS.bat').includes('classic-paycheck-audit.test.cjs')||!load('src/classic-time.js').includes('settlePaycheck')||!load('src/engine.js').includes('classicPaycheckHistory')||!load('src/app.js').includes('Classic paycheck ledger'))errors.push('v0.5.35 payroll audit/recovery migration incomplete');
if(!['LL-226','LL-227','LL-228','LL-229','LL-230'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0038-classic-geographic-board-and-weekly-computer-event.md').includes('**Status:** Accepted')||!load('index.html').includes('id="boardStage"')||!load('index.html').includes('src/classic-weekly-events.js')||!load('src/engine.js').includes('ClassicWeekly.computerBonus(')||!load('PLAY.html').includes('root.LifeClassicWeeklyEvents')||!load('TEST-CLASSIC-BOARD.bat').includes('classic-board-weekly.test.cjs'))errors.push('v0.5.37 Classic geographic board and weekly source event missing');
if(!['LL-231','LL-232','LL-233','LL-234','LL-235'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0039-classic-mobile-travel-intent-and-weekly-state-traces.md').includes('**Status:** Accepted')||!load('src/app.js').includes('classicBoardFollowPawn(')||!load('src/classic-weekly-events.js').includes('foodStorageTrace')||!load('src/classic-weekly-events.js').includes('clothingWarning'))errors.push('v0.5.38 board and DOS event migration missing');
if(!['LL-236','LL-237','LL-238','LL-239','LL-240'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0040-classic-pawn-arrivals-and-weekly-state-traces.md').includes('**Status:** Accepted')||!load('index.html').includes('src/classic-journey.js')||!load('PLAY.html').includes('root.LifeClassicJourney')||!load('src/app.js').includes("setClassicJourney('arrived'")||!load('src/classic-weekly-events.js').includes('emergencyClothingTrace')||!load('TEST-JOURNEY.bat').includes('classic-journey-entry.test.cjs'))errors.push('v0.5.39 journey and weekly source-state migration missing');
if(!['LL-246','LL-247','LL-248','LL-249','LL-250'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0042-classic-household-and-entrance-contract.md').includes('**Status:** Accepted')||!load('src/classic-household.js').includes('restQuote')||!load('src/route-overlay.js').includes('route-entry-door')||!load('docs/classic-designer-handoff.md').includes('170-waypoint')||!load('TEST-HOUSEHOLD.bat').includes('classic-household-entrance.test.cjs'))errors.push('v0.5.41 household/entrance/designer deliverables missing');
if(!['LL-241','LL-242','LL-243','LL-244','LL-245'].every(id=>manifest.implemented.some(t=>t.id===id))||!load('docs/decisions/ADR-0041-classic-relaxation-loan-audit-and-travel-skip.md').includes('**Status:** Accepted')||!load('TEST-RELAXATION.bat').includes('classic-relaxation-journey-skip.test.cjs')||!load('src/classic-weekly-events.js').includes('relaxationStep')||!load('src/route-overlay.js').includes('finishAnimation()')||!load('index.html').includes('classicTravelSkip'))errors.push('v0.5.40 relaxation, loan and animation-skip release incomplete');
if(!load('index.html').includes('id="sharedProfileBtn"')||!load('src/shared-portrait-ui.js').includes('ModularPortraitEditor')||!load('src/looprd-shared-profile.js').includes('SocialClient')||!load('PLAY.html').includes('LifeEmbeddedPortraitPacks'))errors.push('Shared portrait and Looprd Social adapter missing');
if(!['LL-264','LL-265','LL-266','LL-267'].every(id=>manifest.implemented.some(t=>t.id===id)))errors.push('v0.5.46 Social chat and migration tasks missing');
if(!load('index.html').includes('id="classicHotseatHandover"')||!load('PLAY.html').includes('LifeClassicHotseatHandover')||!load('docs/decisions/ADR-0047-classic-hotseat-privacy-and-mobile-road-scenery.md').includes('**Status:** Accepted'))errors.push('Classic hotseat privacy handover missing');
if(!load('index.html').includes('id="chatSocialTab"')||!load('index.html').includes('src/looprd-social-session.js')||!load('PLAY.html').includes('class SocialSession')||!load('docs/decisions/ADR-0046-game-chat-social-service-boundary.md').includes('**Status:** Accepted'))errors.push('Shared Social chat integration missing');
if(!load('looprd.yaml').includes('migrations:')||!load('looprd.yaml').includes('ADD COLUMN "chatKey"'))errors.push('Looprd game schema migration missing');
if(!load('PLAY.html').includes('LifeSocialSdkLoader')||!load('index.html').includes('id="chatSocialRegister"')||!load('docs/decisions/ADR-0054-classic-weekly-parity-and-social-js-sdk.md').includes('**Status:** Accepted'))errors.push('v0.5.54 Social SDK and Classic source release incomplete');
if(!load('src/rule-presets.js').includes('forcedReturnHome')||!load('PLAY.html').includes('LifeRulePresets')||!load('src/engine.js').includes('closeReturnJourney(')||!load('src/app.js').includes('id="restoreRulePreset"')||!load('docs/decisions/ADR-0055-homeward-time-debt-and-rule-presets.md').includes('**Status:** Accepted'))errors.push('v0.5.55 homeward rule or custom preset integration missing');
if(atLeast('0.5.62')&&(!load('src/classic-jones-source.js').includes('raiseEligible')||
   !load('src/engine.js').includes('ClassicJones.raiseEligible(')||
   !load('PLAY.html').includes('root.LifeClassicJonesSource=api')||
   !load('TEST-JONES-AI.bat').includes('classic-jones-source-062.test.cjs')||
   !load('docs/decisions/ADR-0062-jones-source-branch-priorities.md').includes('**Status:** Accepted')||
   !['LL-315','LL-316','LL-317'].every(id=>manifest.implemented.some(t=>t.id===id))))
  errors.push('v0.5.62 Jones source decision adapter/QA missing');
if(atLeast('0.5.63')&&(!load('src/classic-retail-pawn-063.js').includes('pawnQuote')||
   !load('src/engine.js').includes('ClassicRetailPawn.pawnQuote(')||
   !load('index.html').includes('src/classic-retail-pawn-063.js')||
   !load('PLAY.html').includes('root.LifeClassicRetailPawn=api')||
   !load('TEST-RETAIL-PAWN.bat').includes('classic-retail-pawn-economy-063.test.cjs')||
   !load('docs/decisions/ADR-0063-source-retail-pawn-economic-audit.md').includes('**Status:** Accepted')||
   !['LL-318','LL-319','LL-320'].every(id=>manifest.implemented.some(t=>t.id===id))))
  errors.push('v0.5.63 pawn source quotes, economic audit and release evidence missing');
if(atLeast('0.5.64')&&(!load('src/classic-consumables-064.js').includes('classic-consumables.v1')||
   !load('src/engine.js').includes('ClassicFood.week(')||
   !load('index.html').includes('src/classic-consumables-064.js')||
   !load('PLAY.html').includes('root.LifeClassicConsumables=api')||
   !load('TEST-DOS-FOOD.bat').includes('classic-dos-consumables-064.test.cjs')||
   !load('docs/decisions/ADR-0064-dos-opening-stats-and-consumable-identity.md').includes('**Status:** Accepted')||
   !['LL-321','LL-322','LL-323'].every(id=>manifest.implemented.some(t=>t.id===id))))
  errors.push('v0.5.64 DOS starting state, food identities and release evidence missing');
if(errors.length)throw Error(errors.join('\n'));
reconcile({check:true});
console.log(`ZipRunner workboard OK; ${tasks.length} items; offline build OK.`);
// Verify Pages artifacts from a clean source checkout, not only the standalone offline build.
execFileSync(process.execPath,[resolve(root,'tools/build-pages.mjs')],{cwd:root,stdio:'inherit'});
// Keep the release gate comprehensive as new regression files are added.
// A static hand-maintained list silently skipped recent house-rule tests.
const regressionFiles=readdirSync(resolve(root,'tests')).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>'tests/'+name);
execFileSync(process.execPath,['--test',...regressionFiles],{cwd:root,stdio:'inherit'});
console.log('Verification succeeded.');

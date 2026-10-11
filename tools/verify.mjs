import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const load=rel=>readFileSync(resolve(root,rel),'utf8');
execFileSync(process.execPath,[resolve(root,'tools/build-offline.mjs')],{stdio:'inherit'});
const manifest=JSON.parse(load('.ziprunner-workboard-update.json'));
const tasks=[...manifest.implemented,...manifest.remaining];
const errors=[];
if(manifest.schema!=='ziprunner.workboard-update.v1')errors.push('Incorrect workboard schema');
if(manifest.project!=='the-life-loop'||manifest.version!=='0.4.1')errors.push('Project/version mismatch');
if(typeof manifest.summary!=='string'||!manifest.summary.trim())errors.push('Missing summary');
if(!Array.isArray(manifest.implemented)||!Array.isArray(manifest.remaining))errors.push('Invalid tasks');
if(new Set(tasks.map(t=>t.id)).size!==tasks.length)errors.push('Repeated workboard IDs');
for(const t of tasks){if(!t.id||!t.title||!t.summary)errors.push('Missing workboard fields');}
for(const t of manifest.implemented){if(!Array.isArray(t.operator_checks)||!t.operator_checks.length)errors.push(`${t.id} missing checks`);}
if(statSync(resolve(root,'.ziprunner-workboard-update.json')).size>256*1024)errors.push('Manifest too large');
const play=load('PLAY.html');
for(const token of ['class="board-grid"','const encounters = {','class="modal story-modal"','function scene(id','class="npc-card"','id="cityPulse"','class="friendship"','const cityEvents = [','const favors = {','const storyArcs = [','id="financeBtn"','function showFinances(){']){
 if(!play.includes(token))errors.push('Offline game is missing '+token);
}
if(play.includes('<script src=')||play.includes('<link rel="stylesheet"'))errors.push('Offline edition uses dependencies');
if(!load('index.html').includes('src/art.js'))errors.push('Art dependency not declared');
const pages=load('.github/workflows/pages.yml');
if(!pages.includes('actions/deploy-pages@v4') || !pages.includes('actions/upload-pages-artifact@v4') || !pages.includes('node tools/verify.mjs'))errors.push('Pages deploy is missing the tested build and deployment actions');
if(!load('package.json').includes('build:pages'))errors.push('No GitHub Pages build script configured');
if(errors.length)throw Error(errors.join('\n'));
console.log(`ZipRunner workboard OK; ${tasks.length} items; offline build OK.`);
execFileSync(process.execPath,['--test','tests/game.test.cjs'],{cwd:root,stdio:'inherit'});
console.log('Verification succeeded.');

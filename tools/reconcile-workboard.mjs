import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
export function reconcile({check=false}={}){
 const manifest=read('.ziprunner-workboard-update.json');
 const archived=read('docs/workboard-history.json');
 const decisions=read('docs/workboard-classifications.json');
 const version=read('package.json').version;
 if(manifest.schema!=='ziprunner.workboard-update.v1'||decisions.schema!=='the-life-loop.workboard-classifications.v1')throw Error('Unsupported active workboard schema');
 if(manifest.version!==version||decisions.release!==version)throw Error('Release/version mismatch in workboard lifecycle');
 const done=[...archived.implemented.map(item=>({...item,source:'historical'})),...manifest.implemented.map(item=>({...item,source:'release-manifest'}))];
 const open=manifest.remaining;
 const idSet=new Set(),categories=new Map();
 for(const [status,ids] of [['blocked',Object.keys(decisions.blocked)],['in_progress',decisions.in_progress],['todo',decisions.todo]]){
  for(const id of ids){if(categories.has(id))throw Error(`Task classified twice: ${id}`);categories.set(id,status);}
 }
 for(const task of [...done,...open]){
  if(idSet.has(task.id))throw Error(`Duplicate work item ID ${task.id}`);
  idSet.add(task.id);
 }
 if(categories.size!==open.length)throw Error(`Lifecycle coverage mismatch: ${categories.size} classifications for ${open.length} open tasks`);
 for(const id of categories.keys())if(!open.some(t=>t.id===id))throw Error(`Classification for missing or already-completed task ${id}`);
 const items=[];
 for(const task of done){
  if(!task.operator_checks?.length)throw Error(`Completed item ${task.id} lacks verification instructions`);
  items.push({id:task.id,title:task.title,status:'done',verified_in:task.source==='historical'?'historical-source-record':version,
   evidence:{source:task.source==='historical'?'docs/workboard-history.json':'.ziprunner-workboard-update.json',operator_checks:task.operator_checks},
   caveat:task.source==='historical'?'Historical claim; not re-executed individually in this release.':undefined});
 }
 for(const task of open){
  const status=categories.get(task.id);
  if(!status)throw Error(`Unclassified open item ${task.id}`);
  const blocked=decisions.blocked[task.id];
  if(status==='blocked'&&(!blocked?.reason||!blocked?.unblock_when))throw Error(`Blocked item ${task.id} lacks reason and unblock condition`);
  items.push({id:task.id,title:task.title,status, ...(blocked?{reason:blocked.reason,unblock_when:blocked.unblock_when}:{acceptance_next:task.summary})});
 }
 const counts=Object.fromEntries(['done','blocked','in_progress','todo'].map(status=>[status,items.filter(item=>item.status===status).length]));
 const result={schema:'the-life-loop.workboard-lifecycle.v1',project:manifest.project,release:version,importer_contract:'ziprunner.workboard-update.v1',
  importer_limitation:'ZipRunner v1 implemented/remaining fields do not transport explicit blocked or in_progress transitions. This local ledger is authoritative for source planning, not proof that the ZipRunner UI applied statuses.',
  counts,items};
 const markdown=['# Workboard lifecycle reconciliation — v'+version,'',
  '**Scope:** Version-controlled reconciliation of stable LL IDs. The active ZipRunner importer still reads `.ziprunner-workboard-update.json` (v1), which does **not** implement explicit Blocked/In Progress transitions. Those require a verified ZipRunner importer update.','',
  `**Counts:** ${counts.done} done (historical claims included); ${counts.blocked} blocked; ${counts.in_progress} in progress; ${counts.todo} to do.`,'',
  '## Blocked — reason and unblock condition','',
  ...items.filter(item=>item.status==='blocked').map(t=>`- **${t.id} — ${t.title}:** ${t.reason} **Unblock:** ${t.unblock_when}`),'',
  '## In progress','', ...items.filter(item=>item.status==='in_progress').map(t=>`- **${t.id}:** ${t.title}`),'',
  '## To do','', ...items.filter(item=>item.status==='todo').map(t=>`- **${t.id}:** ${t.title}`),'',
  '## Done (current ZipRunner update)','',...items.filter(item=>item.status==='done'&&item.verified_in===version).map(t=>`- **${t.id}:** ${t.title}`),'',
  '## Importer handoff','',
  '- v1 `implemented` carries completed items; v1 `remaining` carries outstanding items. The importer might not alter pre-existing card statuses by stable ID; that is not verified here.',
  '- `docs/workboard-lifecycle.json` is the full-source lifecycle record. It does not masquerade as an accepted ZipRunner v2 schema.',
  '- An importer that supports statuses must reconcile by existing `id`, not by item title, and report applied transitions. See `docs/ziprunner-workboard-lifecycle-contract.md`.',''];
 const artifacts=[['docs/workboard-lifecycle.json',JSON.stringify(result,null,2)+'\n'],['docs/workboard-reconciliation.md',markdown.join('\n')]];
 for(const [name,value] of artifacts){
  if(check){if(!existsSync(resolve(root,name))||readFileSync(resolve(root,name),'utf8')!==value)throw Error(`Stale workboard lifecycle artifact: ${name}; run node tools/reconcile-workboard.mjs`);}
  else writeFileSync(resolve(root,name),value);
 }
 return counts;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 console.log('Reconciled lifecycle:',reconcile({check:process.argv.includes('--check')}));
}

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const {join}=require('node:path');
const root=join(__dirname,'..');
const script=readFileSync(join(root,'tools/generate-looprd.py'),'utf8');
const handler=readFileSync(join(root,'server/looprd_handler.py'),'utf8');
const spec=readFileSync(join(root,'looprd.yaml'),'utf8');
test('inert async-match persistence models are generated additively',()=>{
  assert.match(spec,/schemaVersion: 3/);
  for(const name of ['GameMatch','GameParticipant','GameAction','GameCheckpoint','GameNotificationOutbox']){
    assert.match(script,new RegExp("'"+name+"':\\{'fields'"));
    assert.match(spec,new RegExp('^  '+name+':','m'));
  }
  for(const field of ['initialSeed','rngState','rulesDigest','dueAtUtc','issuer','subject','idempotencyKey','revisionBefore','revisionAfter','stateDigest','nextDispatchUtc'])assert.ok(spec.includes(field+':'),field);
});
test('legacy session and v2 migration preserved; /play gated until verified identity',()=>{
  assert.match(spec,/ALTER TABLE \"Room\" ADD COLUMN \"chatKey\"/);
  assert.match(spec,/path: \/session/);
  assert.match(spec,/method: POST/);
  assert.ok(!/path: \/play(?:\/|\n)/.test(spec));
  assert.match(handler,/TTL = 48 \* 3600/);
});

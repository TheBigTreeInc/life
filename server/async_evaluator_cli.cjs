/* Internal, stdin-only JSON-lines-free evaluator adapter. Not a public API. */
'use strict';
const fs=require('node:fs');
const {evaluate}=require('../src/async-evaluator.js');
function main(){
 const payload=JSON.parse(fs.readFileSync(0,'utf8'));
 if(!payload||typeof payload!=='object'||!payload.snapshot||!payload.command)throw Error('Invalid evaluator request');
 const result=evaluate(payload.snapshot,payload.command,{expectedDigest:payload.expectedDigest});
 process.stdout.write(JSON.stringify(result));
}
try{main();}catch(err){process.stderr.write(`${err.name||'Error'}: ${err.message}\n`);process.exitCode=2;}

/* On-demand turn validator: one stdin request, one stdout result, then exit. */
'use strict';
const fs=require('node:fs');
const {replayTurn}=require('../src/async-turn-bundle.js');
try{
 const raw=fs.readFileSync(0,'utf8');
 if(Buffer.byteLength(raw)>750000)throw Error('Turn input too large');
 const request=JSON.parse(raw);
 if(!request||typeof request!=='object')throw Error('Invalid request');
 const result=replayTurn(request.checkpoint,request.commands,
  {expectedDigest:request.expectedDigest,expectedSeat:request.expectedSeat});
 process.stdout.write(JSON.stringify(result));
}catch(error){process.stderr.write(`${error.name||'Error'}: ${error.message}\n`);process.exitCode=2;}

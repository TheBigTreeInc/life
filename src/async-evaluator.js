/* LIFE-ASYNC-03 trusted evaluator primitive. Never pass client-produced snapshots to storage. */
'use strict';
const Replay=require('./async-replay.js');
class InvalidGameCommand extends Error {constructor(message){super(message);this.name='InvalidGameCommand';}}
function evaluate(snapshot,command,{expectedDigest}={}){
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw new InvalidGameCommand('Invalid persisted snapshot');
 if(!command||typeof command!=='object'||Array.isArray(command)||Object.keys(command).some(k=>!['type','arg'].includes(k)))throw new InvalidGameCommand('Invalid command envelope');
 if(expectedDigest!==undefined&&Replay.digest(snapshot)!==expectedDigest)throw new InvalidGameCommand('Persisted checkpoint digest mismatch');
 const game=Replay.restore(snapshot);
 const before=Replay.digest(game.snapshot());
 let result;
 switch(command.type){
  case 'travel':
   if(typeof command.arg!=='string'||!game.getPlace(command.arg))throw new InvalidGameCommand('Invalid destination');
   result=game.travel(command.arg);break;
  case 'action':
   if(typeof command.arg!=='string'||!game.actions().some(a=>a.id===command.arg&&a.enabled))throw new InvalidGameCommand('Action is not currently legal');
   result=game.act(command.arg);break;
  case 'end_turn':
   if('arg' in command)throw new InvalidGameCommand('Unexpected end-turn payload');
   result=game.endTurn();break;
  default:throw new InvalidGameCommand('Unsupported command type');
 }
 if(!result?.ok)throw new InvalidGameCommand(result?.message||'Game command rejected');
 const after=game.snapshot();
 return Object.freeze({result,checkpoint:Object.freeze({state:after,stateDigest:Replay.digest(after),rngState:after.seed}),beforeDigest:before,activeSeat:game.active,turnIndex:game.week});
}
module.exports={evaluate,InvalidGameCommand};

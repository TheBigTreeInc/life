/* LIFE-ASYNC-04: replay one complete turn with the existing deterministic LifeGame.
 * This is a validator, NOT a client-trusted snapshot or a new simulation.
 * The caller supplies a stored checkpoint, never the client's proposed state.
 */
'use strict';
const Replay = require('./async-replay.js');
const {evaluate, InvalidGameCommand} = require('./async-evaluator.js');
class InvalidTurnBundle extends Error {
 constructor(message){super(message);this.name='InvalidTurnBundle';}
}
function check(commands){
 if(!Array.isArray(commands)||commands.length<1||commands.length>128)
  throw new InvalidTurnBundle('A turn must contain 1 to 128 commands');
 commands.forEach((cmd,i)=>{
  if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)||Object.keys(cmd).some(k=>!['type','arg'].includes(k)))
   throw new InvalidTurnBundle('Invalid command');
  if(!['travel','action','end_turn'].includes(cmd.type))throw new InvalidTurnBundle('Unsupported command');
  if(cmd.type==='end_turn'){
   if(i!==commands.length-1||Object.hasOwn(cmd,'arg'))throw new InvalidTurnBundle('End turn must occur exactly once, last');
  }else if(typeof cmd.arg!=='string'||cmd.arg.length<1||cmd.arg.length>100)
   throw new InvalidTurnBundle('Invalid action argument');
 });
 if(commands[commands.length-1].type!=='end_turn')throw new InvalidTurnBundle('Turn must finish with end_turn');
}
function replayTurn(checkpoint,commands,{expectedDigest,expectedSeat}={}){
 check(commands);
 if(!checkpoint||typeof checkpoint!=='object'||Array.isArray(checkpoint))throw new InvalidTurnBundle('Invalid checkpoint');
 if(expectedDigest!==undefined&&Replay.digest(checkpoint)!==expectedDigest)
  throw new InvalidTurnBundle('Checkpoint digest mismatch');
 const game=Replay.restore(checkpoint);
 if(!Number.isInteger(expectedSeat)||expectedSeat<0||expectedSeat>1||game.active!==expectedSeat)
  throw new InvalidTurnBundle('Wrong active seat');
 let state=checkpoint;const before=Replay.digest(state);
 for(const command of commands){
  try{state=evaluate(state,command,{expectedDigest:Replay.digest(state)}).checkpoint.state;}
  catch(error){if(error instanceof InvalidGameCommand)throw new InvalidTurnBundle('Illegal game action');throw error;}
 }
 const after=Replay.restore(state);
 if(after.active===expectedSeat&&!after.winner)throw new InvalidTurnBundle('End turn did not rotate seat');
 return {checkpoint:{state,stateDigest:Replay.digest(state),rngState:state.seed},beforeDigest:before,
  activeSeat:after.active,turnIndex:after.week};
}
module.exports={replayTurn,check,InvalidTurnBundle};

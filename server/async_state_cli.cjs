/* Source-controlled, headless state factory and legal-action projection. */
'use strict';
const fs=require('node:fs');
const LifeGame=require('../src/engine.js');
const Replay=require('../src/async-replay.js');
function query(payload){
 if(!payload||typeof payload!=='object')throw Error('Invalid engine request');
 if(payload.op==='create'){
   if(!Number.isInteger(payload.seed)||payload.seed<0||payload.seed>0xffffffff)throw Error('Invalid game seed');
   const options=payload.settings||{};
   if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['ruleset','era','goals','jonesDifficulty','rules'].includes(k)))throw Error('Unknown initial rule setting');
   const game=new LifeGame({...options,mode:'hotseat',name:'Player 1',friend:'Player 2',seed:payload.seed});
   const state=game.snapshot();
   if(state.players.length!==3||state.players[0].isAI||state.players[1].isAI||!state.players[2].isAI)throw Error('Invalid two-human game');
   return {snapshot:state,rngState:state.seed,gameDigest:Replay.digest(state)};
 }
 if(payload.op==='legal_actions'){
   const game=Replay.restore(payload.snapshot);
   const seat=payload.seat;
   if(!Number.isInteger(seat)||seat!==game.active||game.player.isAI||game.winner)return {actions:[]};
   const actions=game.actions().filter(a=>a&&a.enabled&&typeof a.id==='string').map(a=>({type:'action',arg:a.id}));
   if(!game.pendingEncounter){
     for(const venue of game.places){
       if(venue?.id && venue.id!==game.player.location && game.travelQuote(game.player.location,venue.id,game.player.hours).ok)actions.push({type:'travel',arg:venue.id});
     }
     actions.push({type:'end_turn'});
   }
   return {actions};
 }
 throw Error('Unsupported state operation');
}
try{process.stdout.write(JSON.stringify(query(JSON.parse(fs.readFileSync(0,'utf8')))))}catch(error){process.stderr.write(`${error.name||'Error'}: ${error.message}\n`);process.exitCode=2}

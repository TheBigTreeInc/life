/* LIFE-ASYNC-01: Node-side replay foundation, not an authenticated /play service. */
'use strict';
const {createHash}=require('node:crypto');
const Game=require('./engine.js');
const stable=value=>{
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('Non-finite numeric state');
 return value;
};
function canonical(value){return JSON.stringify(stable(value));}
function digest(snapshot){return createHash('sha256').update(canonical(snapshot)).digest('hex');}
function restore(snapshot){return Game.load(snapshot,{advanceAI:false});}
function checkpoint(snapshot){const game=restore(snapshot),state=game.snapshot();return {state,digest:digest(state),rngState:state.seed};}
module.exports={canonical,digest,restore,checkpoint,prng:'lcg-1664525-1013904223-v1'};

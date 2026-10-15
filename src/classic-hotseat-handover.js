/* Optional Classic hotseat privacy handoff. Never modifies game state or sends network commands. */
(function(root){'use strict';
function required(before,after,online=false){
 if(!before||!after||online||!before.isClassic||before.mode!=='hotseat')return false;
 if(typeof before.playerId!=='string'||before.playerId===after.player?.id)return false;
 return Boolean(after.isClassic&&after.settings?.mode==='hotseat'&&after.player&&!after.player.isAI&&!after.winner);
}
function resumeRequired(game,online=false){
 return Boolean(!online&&game?.isClassic&&game.settings?.mode==='hotseat'&&!game.winner&&!game.player.isAI);
}
const api=Object.freeze({required,resumeRequired});
root.LifeClassicHotseatHandover=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

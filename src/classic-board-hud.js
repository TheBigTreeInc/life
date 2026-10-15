(function(root){
'use strict';
/* The DOS board keeps the player and Week clock in its OPEN CENTER. The dial
   represents Classic action-clock units, never real-world local time. */
function model(game, online=false, ownTurn=true){
 if(!game || !game.player)return null;
 const player=game.player;
 const max=game.isClassic?60:Number(game.rules?.hours)||60;
 const remaining=Math.max(0,Math.min(max,Math.trunc(Number(player.hours)||0)));
 const used=max-remaining;
 return {name:String(player.name),id:String(player.id),week:game.week,
  color:/^#[0-9a-fA-F]{6}$/.test(player.color||'')?player.color:'#a6d98e',
  used,remaining,max,percent:100*remaining/max,
  degrees:360*used/max, // 0 = full clock; sweep clockwise as time is spent
  ownerLabel:online&&!ownTurn?'WAITING FOR PLAYER':player.isAI?'JONES IS PLAYING':'YOUR TURN',
  accessibleLabel:`${player.name}'s turn, week ${game.week}, ${remaining} of ${max} clock units remaining`};
}
const api={model};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LifeClassicBoardHud=api;
})(typeof window!=='undefined'?window:globalThis);

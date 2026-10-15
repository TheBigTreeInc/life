/* Jones DOS 1.000.060 Pass-2 math. Derived reference only; not a byte-exact SCI interpreter. */
(function(root){'use strict';
  function integer(n,name){if(!Number.isSafeInteger(n))throw Error('Invalid '+name);return n;}
  function adjustedIndex(reading){
    integer(reading,'goods index');
    return Math.max(50,reading+(reading>=100?Math.trunc((reading-100)*2/3):-Math.trunc((100-reading)*2/3)));
  }
  function goodsPrice(base,reading=100){
    integer(base,'base price');if(base<0)throw Error('Negative base price');
    const i=adjustedIndex(reading);
    return Math.max(1,Math.trunc(base*Math.trunc(i/10)/10)+Math.trunc(base*(i%10)/100));
  }
  function lotteryPrize(tickets,roll){
    integer(tickets,'tickets');integer(roll,'lottery roll');
    if(tickets<0||roll<0||roll>500)throw Error('Invalid lottery draw');
    return tickets<=roll?0:roll<=Math.floor(tickets/20)?5000:roll<=Math.floor(tickets/5)?500:200;
  }
  function extensionApproved(previous,roll){
    integer(previous,'extensions');integer(roll,'extension roll');
    if(roll<1||roll>12)throw Error('Invalid extension roll');
    return previous!==-1&&(previous===0||roll>(previous===1?3:previous===2?6:9));
  }
  function workGross(hourly,remaining){
    integer(hourly,'hourly wage');integer(remaining,'work time');
    if(hourly<0||remaining<0)throw Error('Invalid work inputs');
    return Math.floor(hourly*8*Math.min(6,remaining)/6);
  }
  const api=Object.freeze({schema:'classic-pass2.v1',adjustedIndex,goodsPrice,lotteryPrize,extensionApproved,workGross});
  root.LifeClassicPass2=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

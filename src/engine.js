(function (root) {
'use strict';
const D = root.LifeData || (typeof require === 'function' ? require('./data.js') : null);
const Characters = root.LifeCharacters || (typeof require === 'function' ? require('./characters.js') : null);
const find = (arr,id)=>arr.find(x=>x.id===id);
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const money = n=>'$'+Math.floor(n).toLocaleString('en-US');
// Provisional Classic pawn broker model; source evidence establishes the lifecycle,
// but not the exact interest rate, loan ratio or two-week deadline.
const PAWN_VALUES=Object.freeze({fridge:255,freezer:330,computer:590,dictionary:90,atlas:110,encyclopedia:165});
const PAWN_NAMES=Object.freeze({fridge:'Refrigerator',freezer:'Freezer',computer:'Computer',dictionary:'Dictionary',atlas:'Atlas',encyclopedia:'Encyclopedia'});
const pawnLoan=item=>Math.floor(PAWN_VALUES[item]*.45);
const pawnRedemption=item=>pawnLoan(item)+Math.max(5,Math.ceil(pawnLoan(item)*.1));
// Documented Jones difficulty offsets. Sierra's exact goal distribution algorithm is
// unverified; our allocation preserves the budget, 5-point steps and close wealth target.
const CLASSIC_JONES_DIFFICULTY=Object.freeze({easy:40,fair:0,hard:-40});
const GOAL_MIN=10,GOAL_MAX=100;
function rivalGoalAllocation(human, difficulty, random){
  const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
  const source=Object.fromEntries(D.GOAL_KEYS.map(k=>[k,cap(Math.round(Number(human[k])/5)*5,GOAL_MIN,GOAL_MAX)]));
  const total=D.GOAL_KEYS.reduce((sum,k)=>sum+source[k],0);
  const desired=cap(total+CLASSIC_JONES_DIFFICULTY[difficulty],40,400);
  const wealthDeltas=[-10,-5,0,5,10].filter(delta=>source.wealth+delta>=GOAL_MIN&&source.wealth+delta<=GOAL_MAX);
  const wealth=source.wealth+wealthDeltas[Math.floor(random()*wealthDeltas.length)];
  const values={...source,wealth};
  const others=D.GOAL_KEYS.filter(k=>k!=='wealth');
  let remainder=desired-D.GOAL_KEYS.reduce((sum,k)=>sum+values[k],0);
  // Randomized ties only. Decisions are generated ONCE per new game and saved.
  for(let guard=0;remainder!==0&&guard<150;guard++){
    const eligible=others.filter(k=>remainder>0?values[k]<GOAL_MAX:values[k]>GOAL_MIN);
    if(!eligible.length){ // At extreme budgets, wealth must shift as well to hit exact sum.
      if(remainder>0&&values.wealth<GOAL_MAX){values.wealth+=5;remainder-=5;continue;}
      if(remainder<0&&values.wealth>GOAL_MIN){values.wealth-=5;remainder+=5;continue;}
      break;
    }
    // Bias to less-edited and lower/higher goals so allocation is balanced.
    const scored=eligible.map(k=>({k,score:(remainder>0?GOAL_MAX-values[k]:values[k]-GOAL_MIN)+(random()-.5)*45})).sort((a,b)=>b.score-a.score);
    const k=scored[0].k;values[k]+=Math.sign(remainder)*5;remainder-=Math.sign(remainder)*5;
  }
  if(remainder!==0)throw Error('Unable to allocate Classic Jones goal budget');
  return values;
}

const validRuleset = key=>Object.hasOwn(D.RULESETS,key)?key:'modern';
const validEra = key=>Object.hasOwn(D.worldEras,key)?key:'current';
class LifeGame {
  constructor(settings={}) {
    const goal = settings.goals || {};
    const mode = ['solo','hotseat','sandbox'].includes(settings.mode) ? settings.mode : 'solo';
    this.settings={mode, ruleset:validRuleset(settings.ruleset), era:validEra(settings.era),
      jonesDifficulty:Object.hasOwn(CLASSIC_JONES_DIFFICULTY,settings.jonesDifficulty)?settings.jonesDifficulty:'fair',
      goals:Object.fromEntries(D.GOAL_KEYS.map(k=>[k,clamp(Number(goal[k])|| (settings.ruleset==='classic'?50:60),10,100)]))};
    this.seed = Number.isSafeInteger(settings.seed) ? settings.seed : 314159;
    this.week=1; this.economy=1; this.active=0; this.winner=null; this.sequence=0; this.pendingEncounter=null; this.bulletin=D.headlines[0]; this.cityEventId=D.cityEvents[0].id; this.cityEventStart=1; this.cityProjects={};this.classicStockPrices=Object.fromEntries(D.classicStocks.map(x=>[x.id,x.base]));
    this.messages=[];this.classicPawnLots=[];this.classicPawnSequence=0;
    const name=(settings.name||'You').trim().slice(0,24)||'You';
    this.players=[this.createPlayer('player',name,false,'#b3f485')];
    if(settings.character)this.players[0].appearance=Characters.normalizeAppearance(settings.character);
    if(mode==='hotseat'){
      const friend=this.createPlayer('friend',(settings.friend||'Player 2').trim().slice(0,24)||'Player 2',false,'#f8b3df');
      if(settings.friendCharacter)friend.appearance=Characters.normalizeAppearance(settings.friendCharacter);
      this.players.push(friend);
    }
    if(mode!=='sandbox') {
      const rival=this.createPlayer('jones','The Rival',true,'#b6b0ff');
      if(this.isClassic)rival.classicGoals=rivalGoalAllocation(this.settings.goals,this.settings.jonesDifficulty,()=>this.rand());
      this.players.push(rival);
    }
    this.log(`Week 1. A fresh start, a pocketful of hope, and ${money(this.players[0].cash)} in cash.`, 'good');
  }
  createPlayer(id,name,isAI,color) {
    const initialCash=this.isClassic?200:250,initialBank=this.isClassic?0:100;
    return {id,name,isAI,color,location:'home',hours:this.rules.hours,cash:initialCash,bank:initialBank,invested:0,debt:0,rentDebt:0,
      happiness:62,energy:84,hunger:0,education:0,credits:0,experience:this.isClassic?10:0,dependability:this.rules.dependabilityStart,job:null,wage:0,workSessions:0,classicDegrees:[],classicProgress:{},classicEnrolled:[],classicEnrollmentCredits:0,classicDismissals:0,classicRaises:0,classicRejectedOpenings:{},classicWorkHourCredit:0,classicRent:325,classicRentDueWeek:4,classicExtensions:0,classicExtensionAttemptWeek:0,classicEverDebt:false,classicPortfolio:Object.fromEntries(D.classicStocks.map(x=>[x.id,0])),classicLegacyInvestment:0,classicBrokerOpen:false,classicLoanDefaults:0,classicLoanPaidThrough:0,classicFoodPurchasedWeek:0,classicHardshipWeeks:0,classicReliefWeek:0,classicReliefCount:0,
      home:'studio',groceries:1,fed:false,owned:[],clothing:{casual:6,formal:0,business:0},coursesCompleted:[],courseProgress:{},weekActions:0,raiseWeek:0,oddJobWeek:0,lottery:0,weekendPass:false,won:false,contacts:0,talkedWeek:{},seenEncounters:[],relationships:{},memories:{},favorsUsed:{},cityParticipation:{},storyProgress:{},ledger:[],history:[{week:1,cash:initialCash,bank:initialBank,invested:0,debt:0,netWorth:initialCash+initialBank}],milestones:[]};
  }
  get rules(){return D.RULESETS[this.settings.ruleset];}
  get isClassic(){return this.settings.ruleset==='classic';}
  get player(){return this.players[this.active];}
  get jobs(){return this.isClassic?D.classicJobs:D.jobs;}
  getJob(p){return find(this.jobs,p.job);}
  offeredWage(job){return Math.max(1,Math.round(job.wage*this.economy));}
  classicLuck(p){return clamp(30+(10+p.dependability+p.experience+8*this.degreeCount(p))/3,0,100);}
  rentServicesOpen(p){return this.week>=p.classicRentDueWeek;}

  degreeCount(p){return Array.isArray(p.classicDegrees)?p.classicDegrees.length:0;}
  jobRequirement(job){return this.isClassic?{experience:job.experience,dependability:job.dependability,degrees:job.degrees}:{experience:job.experience,dependability:job.dependability,degrees:[]};}
  classicLessons(p){return 10-(p.owned.includes('computer')?1:0)-( ['encyclopedia','dictionary','atlas'].every(id=>p.owned.includes(id))?1:0);}
  classicDegreeAvailable(p,d){return d.requires.every(id=>p.classicDegrees.includes(id));}
  classicWorkCaps(p,job){const r=this.jobRequirement(job),bonus=5*this.degreeCount(p);return {experience:10+r.experience+bonus,dependability:20+r.dependability+bonus};}
  classicFoodCapacity(p){return p.owned.includes('fridge')?(p.owned.includes('freezer')?12:6):Infinity;}
  classicStockValue(p){return D.classicStocks.reduce((n,s)=>n+(p.classicPortfolio[s.id]||0)*this.classicStockPrices[s.id],0)+(p.classicLegacyInvestment||0);}
  syncClassicInvested(p){if(this.isClassic)p.invested=this.classicStockValue(p);}
  classicFoodPrice(units){const item=D.classicFreshFood.find(x=>x.units===units);return Math.max(1,Math.round(item.cost*this.economy));}
  classicShiftHours(p){return this.isClassic?Math.min(6,p.hours):6;}
  classicShiftPay(p,hours){return Math.floor(this.shiftPay(p)*hours/6);}
  pawnEligible(p,item){return Object.hasOwn(PAWN_VALUES,item)&&p.owned.includes(item)&&!(item==='fridge'&&p.owned.includes('freezer'));}
  pawnLot(id){return this.classicPawnLots.find(l=>l.id===id);}
  classicLoanLimit(p){const job=this.getJob(p);return job?Math.max(0,Math.floor(((job.wage*32+p.cash+p.bank-p.debt)*0.75)*(0.8**p.classicLoanDefaults)/100)*100):0;}
  getPlace(id){return find(D.places,id);}
  clothingWeeks(p,tier){return Math.max(0,Math.floor(Number(p.clothing?.[tier])||0));}
  isDressedFor(p,job){
    if(!job)return false;
    const need=D.clothing[job.clothes]?.rank||1;
    return Object.keys(D.clothing).some(k=>D.clothing[k].rank>=need&&this.clothingWeeks(p,k)>0);
  }
  clothingSummary(p){return Object.entries(D.clothing).map(([k,v])=>({id:k,name:v.name,weeks:this.clothingWeeks(p,k)}));}
  canAffordClothes(p,job){
    if(this.isDressedFor(p,job))return true;
    const need=D.clothing[job.clothes]?.rank||1;
    const cheapest=[...D.clothingOffers.market,...D.clothingOffers.boutique].filter(x=>D.clothing[x.id].rank>=need).sort((a,b)=>a.cost-b.cost)[0];
    return !!cheapest&&p.cash>=this.price(cheapest.cost,'retail')+120;
  }
  cheapestClothingOffer(job){
    const rank=D.clothing[job.clothes]?.rank||1;
    return [...D.clothingOffers.market.map(x=>({...x,venue:'market'})),...D.clothingOffers.boutique.map(x=>({...x,venue:'boutique'}))].filter(x=>D.clothing[x.id].rank>=rank).sort((a,b)=>a.cost-b.cost)[0];
  }
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  get cityEvent(){return this.isClassic?D.cityEvents[0]:(D.cityEvents.find(e=>e.id===this.cityEventId)||D.cityEvents[0]);}
  get cityIndex(){return Math.floor((this.week-1)/4);}
  // A neutral public sector index and event-specific pricing. Whole-dollar tickets.
  price(base,sector){let multiplier=this.isClassic?1:(this.cityEvent.prices[sector]||1);for(const arc of (this.isClassic?[]:D.storyArcs))if(arc.sector===sector&&this.cityProjects[arc.id])multiplier*=arc.bonus;return Math.max(1,Math.round(base*multiplier));}
  shiftPay(p){return Math.max(1,Math.round(p.wage*8*(this.isClassic?1:this.cityEvent.wage)*(this.isClassic?1:(this.cityProjects.secondchance?1.05:1))));}
  relationship(p,placeId){return clamp(Number(p.relationships?.[placeId])||0,0,100);}
  relationshipName(p,placeId){const value=this.relationship(p,placeId);return value>=55?'Trusted friend':value>=18?'Friendly':value>=7?'Acquaintance':'Stranger';}
  npcLine(placeId,p=this.player){
    const npc=D.citizens[placeId];if(!npc)return '';
    const memory=p.memories?.[placeId];
    const intro=memory?`I remember when you chose to ${D.encounters[placeId].choices.find(c=>c.id===memory)?.label.toLowerCase()||'talk things through'}. `:'';
    const friendship=this.relationship(p,placeId)>=18?'It’s good to see a familiar face. ':'';
    return intro+friendship+npc.lines[(this.week+p.contacts)%npc.lines.length];
  }
  // The ledger records actual changes to accounts, never a synthetic price estimate.
  accounts(p){return {cash:p.cash,bank:p.bank,invested:p.invested,debt:p.debt+p.rentDebt};}
  recordChange(p,before,detail,category='other'){
    const after=this.accounts(p),net=(after.cash+after.bank+after.invested-after.debt)-(before.cash+before.bank+before.invested-before.debt);
    if(Object.keys(after).every(k=>after[k]===before[k]))return;
    p.ledger.unshift({week:this.week,detail,category,net:Math.round(net*100)/100,cash:after.cash-before.cash,bank:after.bank-before.bank,invested:after.invested-before.invested});
    p.ledger.length=Math.min(p.ledger.length,160);
  }
  recordHistory(p){const a=this.accounts(p);const row={week:this.week,...a,netWorth:this.wealth(p)};
    if(p.history.at(-1)?.week===this.week)p.history[p.history.length-1]=row;else p.history.push(row);
    if(p.history.length>260)p.history.splice(0,p.history.length-260);
  }
  milestone(p,text){p.milestones.unshift({week:this.week,text});p.milestones.length=Math.min(p.milestones.length,60);}
  finances(p){
    const last=p.ledger.filter(e=>this.week-e.week<4);
    return {income:Math.round(last.filter(e=>e.net>0).reduce((n,e)=>n+e.net,0)),
      expenses:Math.max(0,Math.round(-last.filter(e=>e.net<0).reduce((n,e)=>n+e.net,0))),
      netWorth:this.wealth(p),ledger:p.ledger.slice(0,18),history:p.history.slice(-23).concat([{week:this.week,cash:p.cash,bank:p.bank,invested:p.invested,netWorth:this.wealth(p),live:true}]),milestones:p.milestones.slice(0,12)};
  }
  storyStatus(p,arc){
    const progress=p.storyProgress[arc.id]||{chapter:0,lastWeek:0};const chapter=progress.chapter;
    if(chapter>=arc.chapters.length)return {chapter,enabled:false,reason:'This story is complete.'};
    if(!p.seenEncounters.includes(arc.host))return {chapter,enabled:false,reason:`Meet ${D.citizens[arc.host].name} and finish their introduction first.`};
    const needed=[18,25,35][chapter],trust=this.relationship(p,arc.host);
    if(trust<needed)return {chapter,enabled:false,reason:`Requires ${needed} trust with ${D.citizens[arc.host].name} (now ${trust}).`};
    if(chapter>0&&this.week-progress.lastWeek<2)return {chapter,enabled:false,reason:`Next chapter unlocks in week ${progress.lastWeek+2}.`};
    if(chapter===2&&this.relationship(p,arc.partner)<10)return {chapter,enabled:false,reason:`Requires 10 trust with ${D.citizens[arc.partner].name} (the partner).`};
    return {chapter,enabled:true,reason:''};
  }
  storyChapter(arc,chapter){
    const c=arc.chapters[chapter];const surge=this.cityEvent.venue===arc.host||this.cityEvent.venue===arc.partner;
    return {...c,story:c.story+(surge?' The citywide event has brought extra attention to your project.':''),arcTitle:arc.title,chapterIndex:chapter,chaptersTotal:arc.chapters.length,cityBoost:surge};
  }
  // Fixed allowlisted effects, also shared by civic opportunities and personal favors.
  applyEffects(p,e){
    for(const key of ['cash','bank','experience','groceries','dependability','happiness','energy']){
      if(!Number.isFinite(e[key]))continue;
      if(key==='happiness'||key==='energy'||key==='dependability')p[key]=clamp(p[key]+e[key],0,100);
      else p[key]=Math.max(0,p[key]+e[key]);
    }
    if(e.fed===true)p.fed=true;
  }
  log(message,type='info',actor=null) {
    this.messages.unshift({id:++this.sequence,week:this.week,message,type,actor:actor||this.player?.id||'system'});
    this.messages=this.messages.slice(0,70);
  }
  wealth(p){return Math.max(0,p.cash+p.bank+p.invested-p.debt-p.rentDebt+(this.isClassic?this.classicOwnedValue(p):0));}
  // The original printed Quick Reference includes the value of owned goods in
  // the Money goal. These proxy resale values are not yet an exact DOS appraisal.
  classicOwnedValue(p){return [...new Set(p.owned||[])].reduce((sum,item)=>sum+(PAWN_VALUES[item]||0),0);}
  classicStudyProgress(p){
    // Credit study already completed towards unearned diplomas. Nine goal
    // points per diploma remains the provisional scale, not a verified formula.
    const lessons=Math.max(1,this.classicLessons(p));
    return Object.entries(p.classicProgress||{}).filter(([id])=>!p.classicDegrees.includes(id))
      .reduce((sum,[,units])=>sum+9*clamp(Number(units)||0,0,lessons-1)/lessons,0);
  }
  classicStranded(p){
    if(!this.isClassic)return false;
    const cheapest=Math.min(...D.clothingOffers.market.map(o=>o.cost));
    return p.cash+p.bank<cheapest&&!Object.keys(D.clothing).some(id=>this.clothingWeeks(p,id)>0)
      && !p.owned.some(id=>this.pawnEligible(p,id))&&this.classicStockValue(p)<=0;
  }
  classicEmergencyRelief(p,notes){
    // The community reference confirms a relative sometimes rescues a player
    // after a couple of hopeless weeks. $90/2 weeks/8-week cooldown is our
    // explicit, tested approximation pending DOS observations.
    p.classicHardshipWeeks=this.classicStranded(p)?(p.classicHardshipWeeks||0)+1:0;
    if(p.classicHardshipWeeks<2||this.week-(p.classicReliefWeek||-100)<8)return;
    const before=this.accounts(p);
    p.cash+=90;p.classicReliefWeek=this.week;p.classicReliefCount=(p.classicReliefCount||0)+1;
    p.classicHardshipWeeks=0;
    this.recordChange(p,before,'Emergency gift from a relative','relief');
    notes.push('A relative sent you $90 to help you get back on your feet.');
  }
  goalTargets(p){return this.isClassic&&p.isAI&&p.classicGoals?p.classicGoals:this.settings.goals;}
  goalPoints(p){return D.GOAL_KEYS.reduce((sum,k)=>sum+this.goalTargets(p)[k],0);}
  // Printed Quick Reference: Money counts net worth including possessed goods;
  // Education rises with units of study, not only completed diplomas. Exact
  // DOS conversion constants and asset valuation remain unverified.
  classicGoalStats(p){return {wealth:this.wealth(p)/100,
    happiness:p.happiness,education:1+9*this.degreeCount(p)+this.classicStudyProgress(p),
    career:this.getJob(p)?1.25*p.dependability:0};}
  scores(p) {
    const g=this.goalTargets(p);
    const job=this.getJob(p);
    const actual=this.isClassic?Object.fromEntries(D.GOAL_KEYS.map(k=>[k,this.classicGoalStats(p)[k]/g[k]*100])):{
      wealth:Math.max(0,this.wealth(p)/ (600 + g.wealth*140) *100),
      happiness:p.happiness/(35+g.happiness*.6)*100,
      education:(p.education + (p.education<4?p.credits/D.degrees[p.education].sessions:0))/ (g.education/25)*100,
      career:(job?job.tier:0)/(Math.max(1,Math.ceil(g.career/15)))*100
    };
    const out={}; for(const key of D.GOAL_KEYS) out[key]=clamp(Math.floor(actual[key]),0,100);
    return out;
  }
  progress(p){const scores=this.scores(p);return Math.round(D.GOAL_KEYS.reduce((acc,k)=>acc+scores[k],0)/4);}
  checkWin() {
    if (this.winner) return;
    for(const p of this.players){
      if(D.GOAL_KEYS.every(k=>this.scores(p)[k]>=100)){
        this.winner=p.id; p.won=true;this.log(`${p.name} completed every life goal! What a run!`,'good',p.id);break;
      }
    }
  }
  travelCost(from,to){
    if(from===to)return 0;
    // The 4x5 city uses fourteen perimeter positions, thirteen businesses,
    // and one public square. Time is measured by actual board position rather
    // than the index a business happens to occupy in the location catalog.
    const ring=[[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4],[4,5],[3,5],[2,5],[1,5],[1,4],[1,3],[1,2]];
    const a=D.places.find(p=>p.id===from),b=D.places.find(p=>p.id===to);
    if(!a||!b)return Infinity;
    const ai=ring.findIndex(([x,y])=>a.cell[0]===x&&a.cell[1]===y),bi=ring.findIndex(([x,y])=>b.cell[0]===x&&b.cell[1]===y);
    if(ai<0||bi<0)return Infinity;
    const steps=Math.abs(ai-bi);
    return this.rules.entryHours+1+Math.floor(Math.min(steps,ring.length-steps)/3);
  }
  travel(target) {
    if(this.winner)return {ok:false,message:'This game is finished.'};
    if(this.pendingEncounter)return {ok:false,message:'Finish your conversation before leaving.'};
    const p=this.player, dest=this.getPlace(target);
    if(!dest)return {ok:false,message:'Unknown destination.'};
    const cost=this.travelCost(p.location,target);
    if(cost>p.hours)return {ok:false,message:`Need ${cost} hours to travel. End the week to continue.`};
    if(cost===0)return {ok:true,message:`Already at ${dest.name}.`};
    p.hours-=cost;p.location=target;p.weekActions++;if(this.isClassic)p.classicBrokerOpen=false;
    this.log(`${p.name} visited ${dest.name} · ${cost}h travel`,'travel',p.id);
    return {ok:true,message:`Welcome to ${dest.name}.`};
  }
  jobReasons(p,job){
    const reasons=[];
    if(this.isClassic){
      const req=this.jobRequirement(job);
      for(const id of req.degrees)if(!p.classicDegrees.includes(id))reasons.push(D.classicDegrees.find(d=>d.id===id).name);
      if(p.experience<req.experience)reasons.push(`${req.experience} experience`);
      // Original rule: minimum-10 jobs may be applied for even with zero reliability.
      if(p.dependability<req.dependability&&req.dependability!==10)reasons.push(`${req.dependability} reliability`);
    }else{
      if(p.education<job.education) reasons.push(`Education ${job.education}`);
      if(p.experience<job.experience) reasons.push(`${job.experience} experience`);
      if(p.dependability<job.dependability) reasons.push(`${job.dependability} reliability`);
      if(job.course&&!p.coursesCompleted?.includes(job.course))reasons.push(`${find(D.courses,job.course).name} course`);
    }
    return reasons;
  }
  actions(p=this.player){
    const t=[];const at=p.location;
    const push=(id,title,detail,hours=0,price=0,valid=true,reason='',meta={})=>{
      t.push({id,title,detail,hours,price,enabled:valid&&p.hours>=hours&&p.cash>=price,reason:!valid?reason:p.hours<hours?'Not enough time':p.cash<price?'Not enough cash':'',...meta});
    };
    if(!this.isClassic&&D.citizens[at])push('chat',`Talk to ${D.citizens[at].name}`,`Meet ${D.citizens[at].title.toLowerCase()}. Discover a little story.`,1,0,p.talkedWeek?.[at]!==this.week,'Already caught up this week');
    if(!this.isClassic&&!p.isAI){
      const friend=this.relationship(p,at),last=p.favorsUsed?.[at]||0,favor=D.favors[at];
      if(favor)push('favor',favor.title,favor.detail,favor.hours,0,friend>=18&&(!last||this.week-last>=4),friend<18?`Requires Friendly relationship (18 trust; now ${friend}).`: `Available again in week ${last+4}`,{special:'friend'});
      const event=this.cityEvent;
      if(event.venue===at){
        const done=p.cityParticipation?.[this.cityEventStart];
        push('pulse',event.opportunity.title,event.opportunity.detail,event.opportunity.hours,0,!done,done?'Already joined this city event':'',{special:'city'});
      }
    }
    if(!this.isClassic&&!p.isAI)for(const arc of D.storyArcs.filter(x=>x.host===at)){
      const status=this.storyStatus(p,arc);if(status.chapter>=arc.chapters.length)continue;
      push('arc:'+arc.id,`Story · ${arc.title}`,`Chapter ${status.chapter+1}/${arc.chapters.length} · ${arc.chapters[status.chapter].title}`,2,0,status.enabled,status.reason,{special:'story'});
    }
    if(at==='home'){
      push('relax','Take a breather','Get +16 happiness and +24 energy.',this.rules.restHours,0,p.happiness<100||p.energy<100,'Already feeling great');
      // Casual paid errands are a safety net for unemployment, not a second workplace.
      const gigReady=!p.job&&p.oddJobWeek!==this.week&&p.energy>=14;
      if(!this.isClassic)push('freelance',p.owned.includes('computer')?'One-off online contract':'Temporary odd job',p.owned.includes('computer')?'Unemployed fallback: earn $165 once this week.':'Unemployed fallback: earn $56 once this week.',6,0,gigReady,p.job?'You already have a primary job. Work at your employer instead.':p.oddJobWeek===this.week?'Only one odd job per week.':'Need more energy');
      if(!this.isClassic&&p.groceries>0) push('cook','Cook something nice','Use one grocery portion. Stay fed and feel better.',2,0,!p.fed,'Already fed this week');
    }
    if(at==='agency'){
      for(const job of this.jobs){
        const reasons=this.jobReasons(p,job);
        push('apply:'+job.id,p.job&&p.job!==job.id?`Switch to ${job.name} (${job.employer||this.getPlace(job.place).name})`:`Apply: ${job.name} (${job.employer||this.getPlace(job.place).name})`,`${money(this.offeredWage(job))}/hour · ${job.employer||this.getPlace(job.place).name} · Uniform: ${D.clothing[job.clothes].name}${!this.isClassic&&job.course?' · '+find(D.courses,job.course).name:''}${this.isClassic&&reasons.length?' · Unqualified: '+reasons.join(', '):''}${p.job&&p.job!==job.id?' · Replaces your current job if accepted':''}`,this.rules.applicationHours,0,(this.isClassic||reasons.length===0)&&p.job!==job.id,this.isClassic?(p.job===job.id?'See the raise action below':''):reasons.join(' · ')||(p.job===job.id?'Already employed in this position':''),{tier:job.tier,req:job,replacesJob:!!p.job&&p.job!==job.id});
      }
      const raiseReq=p.job&&this.isClassic?this.jobRequirement(this.getJob(p)).dependability+5*(p.classicRaises||0):0;
      const canRaise=p.job&&(this.isClassic?p.dependability>=raiseReq:p.workSessions>=3&&p.raiseWeek<=this.week-4);
      push('raise','Negotiate a raise',this.isClassic?`4 hours · listed wage ${money(p.job?this.offeredWage(this.getJob(p)):0)}/h · requires ${raiseReq} Dependability. Only awarded if offered rate exceeds current pay.`:`Request a higher wage at your current job.`,this.isClassic?4:2,0,!!canRaise&&(this.isClassic?(p.job&&p.wage<this.offeredWage(this.getJob(p))):(p.wage<Math.round(this.getJob(p).wage*1.5))),!p.job?'Get a job first':this.isClassic?`Need ${raiseReq} reliability and an improved listed wage`:p.workSessions<3?'Work 3 shifts first':p.raiseWeek>this.week-4?'Wait a few weeks before another raise':'Already near this role’s pay ceiling');
    }
    if(at==='market'){
      for(const offer of D.clothingOffers.market)push(`clothes:${offer.id}:market`,`Budget ${D.clothing[offer.id].name.toLowerCase()}`,`Add ${offer.weeks} weeks of clothing. All outfits age weekly, even if unworn.`,1,this.price(offer.cost,'retail'));
      if(this.isClassic){
        for(const offer of D.classicFreshFood)push('classicFresh:'+offer.units,`Buy ${offer.units} week${offer.units>1?'s':''} of fresh food`,`Black's Market · storage ${p.owned.includes('fridge')?(p.owned.includes('freezer')?'12':'6'):'none'} portions · prevents hunger. +${offer.units} happiness on first food purchase this week.`,0,this.classicFoodPrice(offer.units),p.groceries+offer.units<=this.classicFoodCapacity(p),'Fridge or freezer capacity exceeded');
        push('classicNewspaper','Read the weekly newspaper',this.bulletin,1,1);
        push('classicLottery','Buy 10 lottery tickets','Original-style $10 bundle; lottery results settle next week.',0,10);
      }else{
      push('groceries','Buy groceries','One week of food. Prevent hunger penalties.',1,this.price(24,'food'));
      push('bulkFood','Stock the fridge','Three food portions for less.',1,this.price(59,'food'),p.owned.includes('fridge'),'Requires a refrigerator');
      push('lottery','Try a lucky ticket','A $12 gamble. Drawn at the weekend.',1,12);}
    }
    if(at==='diner') push('meal','Enjoy a hot meal','Fill up, +7 happiness, +8 energy.',2,this.price(20,'food'),!p.fed,'Already eaten this week');
    if(at==='university') {
      if(this.isClassic){
        push('enroll','Pay university enrollment',`$50 buys one course enrollment; ${p.classicEnrollmentCredits} unused. No time required.`,0,50,true,'');
        for(const degree of D.classicDegrees){
          const done=p.classicDegrees.includes(degree.id),open=this.classicDegreeAvailable(p,degree);
          const prog=p.classicProgress[degree.id]||0,started=p.classicEnrolled.includes(degree.id);
          const slots=p.classicEnrolled.length<4;
          const prerequisite=degree.requires.filter(id=>!p.classicDegrees.includes(id)).map(id=>D.classicDegrees.find(d=>d.id===id).name).join(', ');
          const enabled=p.hours>0&&!done&&open&&(started||(p.classicEnrollmentCredits>0&&slots));
          push('classicStudy:'+degree.id,`Study: ${degree.name}`,`${prog}/${this.classicLessons(p)} lessons · 6h per lesson · ${started?'Enrolled':'Requires 1 paid enrollment'}${prerequisite?' · Prerequisite: '+prerequisite:''}`,
            Math.min(6,p.hours),0,enabled,done?'Degree completed':!open?'Requires '+prerequisite:!slots&&!started?'Four courses already active':'Pay the enrollment fee first');
          // The 6-hour lesson may use the last 1–5h, per the original rules; zero hours cannot study.
        }
      }else{
      if(p.education<4){const d=D.degrees[p.education];
        push('study',`Study: ${d.name}`,`Lesson ${p.credits+1}/${d.sessions} · Gain qualifications for better jobs.`,6,this.price(d.cost,'tuition'));
      } else push('studyDone','Education complete','You have earned every qualification.',0,0,false,'Maximum education');
      for(const course of D.courses){
        const done=p.coursesCompleted?.includes(course.id),prog=p.courseProgress?.[course.id]||0;
        push('course:'+course.id,`Short course: ${course.name}`,`${course.detail} · Lesson ${prog+1}/${course.sessions} · Education ${course.education}+`,5,this.price(course.cost,'tuition'),!done&&p.education>=course.education,done?'Certificate already earned':`Requires Education ${course.education}`);
      }
      }
    }
    if(this.jobs.some(j=>j.place===at)){
      const j=this.getJob(p);
      if(j&&j.place===at){
        const shiftHours=this.classicShiftHours(p),income=this.isClassic?this.classicShiftPay(p,shiftHours):this.shiftPay(p);
        const neededEnergy=this.isClassic?Math.max(2,Math.ceil(12*shiftHours/6)):12;
        push('work',`Work as ${j.name} · ${money(income)}`,`${this.isClassic&&shiftHours<6?`Partial shift · ${shiftHours}h remaining · ${money(income)} proportional pay.`:'6 hours on the clock, paid as an 8-hour shift.'} Requires ${D.clothing[j.clothes].name} or better; current wardrobe is ${this.clothingSummary(p).filter(x=>x.weeks>0).map(x=>x.name+' '+x.weeks+'w').join(', ')||'empty'}.`,shiftHours,0,shiftHours>0&&p.energy>=neededEnergy&&this.isDressedFor(p,j),p.energy<neededEnergy?'Exhausted. Rest first.':`Uniform required: ${D.clothing[j.clothes].name} or better; visit Fresh & Frugal or Thread Theory. All clothing expires by week.`);
      }
    }
    if(at==='bank'){
      if(this.isClassic){
        push('deposit:100','Deposit $100','Transfers in $100 portions. No bank interest or action time.',0,100);
        push('withdraw:100','Withdraw $100','Transfers in $100 portions. No action time.',0,0,p.bank>=100,'Insufficient savings');
        const loanLimit=this.classicLoanLimit(p);
        push('classicLoanApply','Apply for a bank loan',`2 hours · Approximate credit limit ${money(loanLimit)}; a poor job or existing debt may prevent approval.`,2,0,loanLimit>=100&&p.debt===0,p.debt>0?'Repay your current loan first':'A paying job and stronger finances are required');
        if(p.debt>0)push('classicLoanPay','Make a loan payment',`$${Math.min(45,p.debt)} toward principal plus $5 bank interest. Must pay at least once per month.`,0,Math.min(45,p.debt)+5);
        push('classicBroker','See the investment broker','2 hours to enter. Buy and sell one unit at a time, without extra hours.',2,0,!p.classicBrokerOpen,'Broker already open this visit');
        if(p.classicBrokerOpen){
          for(const stock of D.classicStocks){
            const value=this.classicStockPrices[stock.id],owned=p.classicPortfolio[stock.id]||0;
            push('classicBuyStock:'+stock.id,`Buy 1 ${stock.name}`,`${money(value)} each · owned ${owned}. Prices fluctuate by week.`,0,value);
            push('classicSellStock:'+stock.id,`Sell 1 ${stock.name}`,`Sell for ${money(stock.id==='tbills'?97:value)} · owned ${owned}.`,0,0,owned>0,'No holdings');
          }
          if(p.classicLegacyInvestment>0)push('classicSellLegacy','Liquidate legacy investment',`Convert old save portfolio (${money(p.classicLegacyInvestment)}) to cash.`,0,0);
        }
      }else{
        for(const amount of [100,500]){
          push('deposit:'+amount,`Deposit ${money(amount)}`,'Move cash into protected savings.',1,amount);
          push('withdraw:'+amount,`Withdraw ${money(amount)}`,'Take money out of savings.',1,0,p.bank>=amount,'Not enough savings');
        }
        push('deposit:all','Deposit all cash','Leave your wallet empty for a quieter weekend.',1,0,p.cash>0,'No cash to deposit');
        push('invest','Invest $200','Buy into a changing market. Potential gains or losses.',1,200);
        push('sell','Sell investments','Cash out your entire portfolio.',1,0,p.invested>0,'No investments');
      }
    }
    if(at==='housing'){
      if(this.isClassic){
        const open=this.rentServicesOpen(p);
        push('classicPayRent','Pay one month of rent',`$${p.classicRent} cash only · next due week ${p.classicRentDueWeek}. ${open?'Rent Office is open.':'Office opens when rent is due.'}`,1,p.classicRent,open,'Rent Office closed outside rent week / extension');
        if(p.rentDebt>0)push('classicClearArrears','Clear rent arrears',`Pay ${money(p.rentDebt)} in cash, stopping future wage garnishment.`,1,p.rentDebt,open,'Office closed');
        push('classicRentExtension','Request a one-week extension',`Chance: ${p.classicEverDebt?'0':Math.max(25,100-p.classicExtensions*25)}%. One request per week.`,1,0,open&&!p.classicEverDebt&&p.classicExtensionAttemptWeek!==this.week,p.classicEverDebt?'Already incurred rent debt; extensions unavailable.':p.classicExtensionAttemptWeek===this.week?'Already requested this week':'Available only when rent is due');
      }else{
      push('upgrade:apartment','Move into a sunny apartment','Better lifestyle · monthly rent $380 · deposit $440.',3,440,p.home==='studio','Available from starter studio');
      push('upgrade:loft','Move into a skyline loft','Luxury living · monthly rent $620 · deposit $950.',3,950,p.home!=='loft'&&p.home!=='studio','Requires sunny apartment');
      if(p.rentDebt>0)push('rentDebt','Pay back rent',`Clear overdue rent: ${money(p.rentDebt)}.`,1,p.rentDebt);
      }
    }
    if(at==='boutique'){
      for(const offer of D.clothingOffers.boutique)push(`clothes:${offer.id}:boutique`,`Quality ${D.clothing[offer.id].name.toLowerCase()}`,`Add ${offer.weeks} weeks. A better uniform also qualifies for lower-tier jobs.`,1,this.price(offer.cost,'retail'));
    }
    if(at==='pawn'){
      // One shared pawn location for Classic and Modern. Existing pawn lot
      // storage remains for cross-release saves and Looprd snapshots.
        for(const item of Object.keys(PAWN_VALUES))if(p.owned.includes(item)){
          const valid=this.pawnEligible(p,item);
          push('classicPawn:'+item,`Pawn ${PAWN_NAMES[item]} · receive ${money(pawnLoan(item))}`,`1 hour · redeem for ${money(pawnRedemption(item))} through week ${this.week+2}. Provisional Classic rates.`,1,0,valid,!valid?'Pawn the freezer first to release the refrigerator':'');
        }
        for(const lot of this.classicPawnLots){
          if(lot.ownerId===p.id&&this.week<=lot.dueWeek){
            push('classicRedeem:'+lot.id,`Redeem ${PAWN_NAMES[lot.item]} · ${money(lot.redemption)}`,`1 hour · recover your pledged item. Deadline: week ${lot.dueWeek}.`,1,lot.redemption);
          }else if(lot.ownerId!==p.id&&this.week>lot.dueWeek){
            const valid=!p.owned.includes(lot.item)&&!(lot.item==='freezer'&&!p.owned.includes('fridge'));
            push('classicBuyPawn:'+lot.id,`Buy unclaimed ${PAWN_NAMES[lot.item]} · ${money(lot.redemption)}`,`1 hour · another player's unredeemed pawned item.`,1,lot.redemption,valid,lot.item==='freezer'&&!p.owned.includes('fridge')?'Own a refrigerator first':'Already own this item');
          }
        }
    }
    if(at==='tech'){
      push('buy:fridge','Buy a refrigerator','Keep bulk groceries fresh across weeks.',2,this.price(255,'retail'),!p.owned.includes('fridge'),'Already owned');
      if(this.isClassic)push('buy:freezer','Buy a freezer', 'Expands fresh-food capacity from six to twelve portions. Requires a fridge.',2,this.price(330,'retail'),p.owned.includes('fridge')&&!p.owned.includes('freezer'),!p.owned.includes('fridge')?'Buy a refrigerator first':'Already owned');
      push('buy:computer','Get a home computer','Better side gigs and occasional online income.',2,this.price(590,'retail'),!p.owned.includes('computer'),'Already owned');
      if(this.isClassic)for(const [id,label,cost] of [['dictionary','Dictionary',90],['atlas','Atlas',110],['encyclopedia','Encyclopedia',165]])
        push('buy:'+id,'Buy '+label,'Collect all three books for one fewer lesson per Classic diploma.',2,this.price(cost,'retail'),!p.owned.includes(id),'Already owned');
    }
    if(at==='cinema'){
      push('movie','See a movie','A little escapism. +18 happiness.',3,this.price(42,'leisure'));
      push('pass','Plan a fun weekend','A lovely experience waiting after the week. +13 happiness.',2,this.price(55,'leisure'),!p.weekendPass,'Already planned');
    }
    if(at==='clinic')push('checkup','Take care of yourself','Restore +42 energy and recover from hunger.',3,this.price(65,'health'),p.energy<95||p.hunger>0,'Feeling healthy');
    return t;
  }
  act(id){
    if(this.winner)return {ok:false,message:'The race is over. Start a new game to play again.'};
    if(this.pendingEncounter)return {ok:false,message:'Choose an answer before doing anything else.'};
    const p=this.player;
    const a=this.actions().find(x=>x.id===id);
    if(!a)return {ok:false,message:'That action is not available here.'};
    if(!a.enabled)return {ok:false,message:a.reason||'Action is unavailable.'};
    if(id==='work'&&this.isClassic){
      const job=this.getJob(p),req=this.jobRequirement(job);
      if(p.dependability<req.dependability-5){
        p.job=null;p.wage=0;p.workSessions=0;p.classicWorkHourCredit=0;p.classicRaises=0;
        p.classicDismissals=(p.classicDismissals||0)+1;p.happiness=clamp(p.happiness-8,0,100);
        const message=`Dismissed from ${job.name}: reliability fell below ${Math.max(0,req.dependability-5)}. Reapply after improving your record.`;
        this.log(message,'warn',p.id);this.milestone(p,message);this.checkWin();return {ok:true,message};
      }
    }
    const before=this.accounts(p);p.cash-=a.price;p.hours-=a.hours;p.weekActions++;
    let msg='';const [key,arg]=id.split(':');
    switch(key){
      case 'arc':{
        const arc=D.storyArcs.find(x=>x.id===arg),status=arc&&this.storyStatus(p,arc);
        if(!status?.enabled)throw Error('Story action was not authorized.');
        this.pendingEncounter={playerId:p.id,placeId:arc.host,arcId:arc.id,chapter:status.chapter};
        msg=`${D.citizens[arc.host].name} wants to talk about ${arc.title}, chapter ${status.chapter+1}.`;
        break;
      }
      case 'chat':{
        const npc=D.citizens[p.location];
        p.talkedWeek[p.location]=this.week; p.contacts=clamp((p.contacts||0)+1,0,100);
        p.relationships[p.location]=clamp(this.relationship(p,p.location)+4,0,100);
        p.happiness=clamp(p.happiness+2,0,100);
        if(!p.seenEncounters.includes(p.location) && D.encounters[p.location]){
          this.pendingEncounter={playerId:p.id,placeId:p.location};
          p.seenEncounters.push(p.location);
          msg=`${npc.name} has a proposition for you.`;
        }else{
          const line=this.npcLine(p.location,p);
          msg=`${npc.name}: “${line}” (+2 happiness, +4 trust)`;
        }
        break;
      }
      case 'favor':{
        const f=D.favors[p.location];p.favorsUsed[p.location]=this.week;this.applyEffects(p,f.effects);
        msg=`${D.citizens[p.location].name} helped: ${f.title}. ${f.detail}`;break;
      }
      case 'pulse':{
        const event=this.cityEvent;p.cityParticipation[this.cityEventStart]=true;this.applyEffects(p,event.opportunity.effects);
        msg=`City opportunity: ${event.opportunity.title}. ${event.opportunity.detail}`;break;
      }
      case 'relax':p.happiness=clamp(p.happiness+16,0,100);p.energy=clamp(p.energy+24,0,100);msg='You took a well-earned break. Life feels lighter.';break;
      case 'freelance':{
        const income=p.owned.includes('computer')?165:56;
        p.cash+=income;p.energy=clamp(p.energy-12,0,100);p.experience+=1;p.oddJobWeek=this.week;
        msg=`Side hustle complete. Earned ${money(income)}.`;break;
      }
      case 'cook':p.groceries--;p.fed=true;p.happiness=clamp(p.happiness+5,0,100);p.energy=clamp(p.energy+7,0,100);msg='A homemade meal hits the spot.';break;
      case 'apply':{
        const job=find(this.jobs,arg),prior=this.getJob(p),oldTier=prior?.tier||0;
        if(this.isClassic){
          const missing=this.jobReasons(p,job);
          if(missing.length){p.happiness=clamp(p.happiness-1,0,100);msg='Application rejected for '+job.employer+' '+job.name+': '+missing.join(', ')+'. Four hours spent.';break;}
          if(!job.entryGuaranteed&&(p.classicRejectedOpenings[arg]===this.week||this.rand()*100>=this.classicLuck(p))){
            p.classicRejectedOpenings[arg]=this.week;p.happiness=clamp(p.happiness-1,0,100);
            msg='No openings for '+job.employer+' '+job.name+' this week. Try another role or return next week.';break;
          }
        }
        p.job=job.id;p.workSessions=0;p.classicWorkHourCredit=0;p.wage=this.offeredWage(job);
        if(this.isClassic){p.experience+=2;p.dependability=Math.max(10,p.dependability);p.classicRaises=0;}
        if(this.isClassic)p.happiness=clamp(p.happiness+3,0,100);
        else if(!prior||job.tier>oldTier)p.happiness=clamp(p.happiness+4,0,100);
        msg=prior?`Job changed: left ${prior.name} at ${prior.employer||this.getPlace(prior.place).name}. Now ${job.name} at ${job.employer||this.getPlace(job.place).name}, earning ${money(p.wage)}/hour. Your previous job is no longer available.`:`Hired! ${p.name} is now a ${job.name} at ${job.employer||this.getPlace(job.place).name}, earning ${money(p.wage)}/hour.`;break;
      }
      case 'raise':p.wage=this.isClassic?this.offeredWage(this.getJob(p)):p.wage+Math.max(2,Math.ceil(p.wage*.10));p.raiseWeek=this.week;if(this.isClassic)p.classicRaises=(p.classicRaises||0)+1;msg=`Raise approved! Your new wage is ${money(p.wage)}/hour.`;break;
      case 'classicFresh':{
        if(!this.isClassic)throw Error('Classic market action in Modern Story');
        const units=Number(arg);
        if(!D.classicFreshFood.some(o=>o.units===units)||p.groceries+units>this.classicFoodCapacity(p))throw Error('Food capacity exceeded');
        p.groceries+=units;
        if(p.classicFoodPurchasedWeek!==this.week){p.happiness=clamp(p.happiness+units,0,100);p.classicFoodPurchasedWeek=this.week;}
        msg=`Bought ${units} weeks of food. Pantry now has ${p.groceries} portions.`;break;
      }
      case 'classicNewspaper':msg=`Newspaper: ${this.bulletin}`;break;
      case 'classicLottery':p.lottery+=10;msg='Bought ten lottery tickets. The draw takes place next week.';break;
      case 'groceries':p.groceries++;msg='Groceries bought. You can cook at home or they will be used at the weekend.';break;
      case 'bulkFood':p.groceries+=3;msg='Your fridge is ready for several weeks of meals.';break;
      case 'lottery':p.lottery++;msg='Ticket bought! The draw is on Sunday.';break;
      case 'meal':p.fed=true;p.happiness=clamp(p.happiness+7,0,100);p.energy=clamp(p.energy+8,0,100);msg='A warm meal and a moment to breathe.';break;
      case 'clothes':{
        const offer=D.clothingOffers[p.location]?.find(x=>x.id===arg);
        // Guard against corrupted/forged action metadata.
        if(!offer||id!==`clothes:${arg}:${p.location}`)throw Error('Invalid outfit purchase');
        p.clothing[arg]=Math.min(260,this.clothingWeeks(p,arg)+offer.weeks);
        if(p.location==='boutique'&&arg!=='casual')p.happiness=clamp(p.happiness+(arg==='business'?7:4),0,100);
        msg=`Purchased ${D.clothing[arg].name.toLowerCase()}: +${offer.weeks} weeks (now ${p.clothing[arg]} weeks).`;
        break;
      }
      case 'enroll':{
        if(!this.isClassic)throw Error('Classic enrollment unavailable in Modern Story');
        p.classicEnrollmentCredits=Math.min(20,p.classicEnrollmentCredits+1);
        msg=`Enrollment paid: ${p.classicEnrollmentCredits} unused course enrollment${p.classicEnrollmentCredits===1?'':'s'}.`;
        break;
      }
      case 'classicStudy':{
        if(!this.isClassic)throw Error('Classic lessons unavailable in Modern Story');
        const degree=D.classicDegrees.find(x=>x.id===arg);
        if(!degree||p.classicDegrees.includes(arg)||!this.classicDegreeAvailable(p,degree))throw Error('Degree unavailable');
        if(!p.classicEnrolled.includes(arg)){
          if(!p.classicEnrollmentCredits||p.classicEnrolled.length>=4)throw Error('Enrollment required or four active courses');
          p.classicEnrollmentCredits--;p.classicEnrolled.push(arg);
        }
        p.classicProgress[arg]=(p.classicProgress[arg]||0)+1;
        p.energy=clamp(p.energy-8,0,100);
        if(p.classicProgress[arg]>=this.classicLessons(p)){
          p.classicDegrees.push(arg);delete p.classicProgress[arg];
          p.classicEnrolled=p.classicEnrolled.filter(id=>id!==arg);
          p.dependability=clamp(p.dependability+5,0,100);
          p.happiness=clamp(p.happiness+5,0,100);
          msg=`Graduated: ${degree.name}! +5 reliability, higher work-stat limits and new qualifications.`;
        }else msg=`Studied ${degree.name}: ${p.classicProgress[arg]}/${this.classicLessons(p)} lessons.`;
        break;
      }
      case 'course':{
        const course=find(D.courses,arg);
        if(!course||p.coursesCompleted.includes(course.id))throw Error('Invalid course');
        p.courseProgress[arg]=(p.courseProgress[arg]||0)+1;
        p.experience+=2;p.dependability=clamp(p.dependability+1,0,100);p.energy=clamp(p.energy-7,0,100);
        if(p.courseProgress[arg]>=course.sessions){
          p.coursesCompleted.push(arg);delete p.courseProgress[arg];p.happiness=clamp(p.happiness+5,0,100);
          msg=`Course completed: ${course.name}! New job applications are now available.`;
        }else msg=`Studied ${course.name} (${p.courseProgress[arg]}/${course.sessions}).`;
        break;
      }
      case 'study':{
        const d=D.degrees[p.education];p.credits++;p.experience+=2;p.energy=clamp(p.energy-10,0,100);p.happiness=clamp(p.happiness-2,0,100);
        if(p.credits>=d.sessions){p.education++;p.credits=0;p.happiness=clamp(p.happiness+12,0,100);msg=`Graduated! You earned the ${d.name}. New careers await.`;}
        else msg=`Study session complete (${p.credits}/${d.sessions}). Knowledge is compounding.`;
        break;
      }
      case 'work':{
        const j=this.getJob(p),shiftHours=a.hours;
        const income=this.isClassic?this.classicShiftPay(p,shiftHours):this.shiftPay(p);
        const garnishment=p.rentDebt>0?Math.min(p.rentDebt,Math.floor(income*(this.isClassic?.5:.25))):0;
        const interest=this.isClassic&&garnishment>0&&garnishment<p.rentDebt?Math.min(2,income-garnishment):0;
        p.cash+=income-garnishment-interest;p.rentDebt-=garnishment;
        if(this.isClassic){
          // One progression credit per six hours worked, including partial shifts.
          // This prevents farming one XP/dependability per one-hour action.
          const total=(p.classicWorkHourCredit||0)+shiftHours;
          const completed=Math.floor(total/6);
          p.classicWorkHourCredit=total%6;
          p.workSessions+=completed;
          if(completed){
            const caps=this.classicWorkCaps(p,j);
            p.experience=Math.min(caps.experience,p.experience+completed);
            p.dependability=Math.min(caps.dependability,p.dependability+completed);
          }
        }else{p.workSessions++;p.experience+=this.rules.workExperience;p.dependability=clamp(p.dependability+this.rules.workDependability,0,100);}
        const energyCost=this.isClassic?Math.ceil(13*shiftHours/6):13;
        p.energy=clamp(p.energy-energyCost,0,100);p.happiness=clamp(p.happiness-(this.isClassic&&shiftHours<6?1:2),0,100);
        msg=`Worked ${shiftHours}h at ${j.employer||this.getPlace(j.place).name}: +${money(income-garnishment-interest)}${garnishment?` (${money(garnishment)} paid toward back rent${interest?`, $${interest} fee`:''})`:''}.`;
        if(this.isClassic&&shiftHours<6)msg+=` Partial shift (${money(income)} gross); ${p.classicWorkHourCredit}/6h toward next work-stat credit.`;
        if(this.isClassic&&p.dependability<this.jobRequirement(j).dependability)msg+=' Warning: your reliability is below this employer’s requirement.';
        break;
      }
      case 'classicPayRent':{
        if(!this.isClassic||!this.rentServicesOpen(p))throw Error('Rent service unavailable');
        p.classicRentDueWeek+=4;msg=`Rent paid in cash, ${money(p.classicRent)}. Next payment due in week ${p.classicRentDueWeek}.`;break;
      }
      case 'classicClearArrears':{
        if(!this.isClassic||!this.rentServicesOpen(p))throw Error('Rent service unavailable');
        msg=`Cleared ${money(p.rentDebt)} of old rent debt.`;p.rentDebt=0;break;
      }
      case 'classicRentExtension':{
        if(!this.isClassic||!this.rentServicesOpen(p)||p.classicEverDebt||p.classicExtensionAttemptWeek===this.week)throw Error('Rent extension unavailable');
        p.classicExtensionAttemptWeek=this.week;
        const chance=Math.max(25,100-p.classicExtensions*25);
        if(this.rand()*100<chance){p.classicRentDueWeek=this.week+1;p.classicExtensions++;msg=`One-week rent extension approved. Deadline: week ${p.classicRentDueWeek}.`;}
        else{p.happiness=clamp(p.happiness-1,0,100);msg='Rent extension refused. Pay this week or the account falls into arrears.';}
        break;
      }
      case 'classicPawn':{
        if(!this.pawnEligible(p,arg)||this.classicPawnLots.length>=64)throw Error('Item cannot be pawned');
        const id='pawn-'+(++this.classicPawnSequence);
        p.owned.splice(p.owned.indexOf(arg),1);
        const payout=pawnLoan(arg);
        this.classicPawnLots.push({id,ownerId:p.id,item:arg,payout,redemption:pawnRedemption(arg),dueWeek:this.week+2});
        p.cash+=payout;
        msg=`Pawned ${PAWN_NAMES[arg]} for ${money(payout)}. Redeem for ${money(pawnRedemption(arg))} through week ${this.week+2}.`;
        break;
      }
      case 'classicRedeem':{
        const lot=this.pawnLot(arg);
        if(!lot||lot.ownerId!==p.id||this.week>lot.dueWeek||p.owned.includes(lot.item))throw Error('Pawn redemption unavailable');
        p.owned.push(lot.item);
        this.classicPawnLots=this.classicPawnLots.filter(x=>x.id!==lot.id);
        msg=`Redeemed your ${PAWN_NAMES[lot.item]}.`;break;
      }
      case 'classicBuyPawn':{
        const lot=this.pawnLot(arg);
        if(!lot||lot.ownerId===p.id||this.week<=lot.dueWeek||p.owned.includes(lot.item)||(lot.item==='freezer'&&!p.owned.includes('fridge')))throw Error('Unclaimed pawned item unavailable');
        p.owned.push(lot.item);
        this.classicPawnLots=this.classicPawnLots.filter(x=>x.id!==lot.id);
        msg=`Bought unclaimed ${PAWN_NAMES[lot.item]} from the pawn counter.`;break;
      }
      case 'classicLoanApply':{
        if(!this.isClassic||p.debt>0)throw Error('Cannot open another loan');
        const amount=this.classicLoanLimit(p);
        if(amount<100)throw Error('Loan too small');
        p.cash+=amount;p.debt+=amount;
        msg=`Loan approved: received ${money(amount)} cash. Pay $45 principal + $5 interest at the bank at least monthly.`;break;
      }
      case 'classicLoanPay':{
        if(!this.isClassic||p.debt<=0)throw Error('No loan');
        const principal=Math.min(45,p.debt);p.debt-=principal;
        const month=Math.ceil(this.week/4);
        p.classicLoanPaidThrough=Math.max(p.classicLoanPaidThrough,month-1)+1;
        msg=`Bank loan payment: ${money(principal)} principal and $5 interest. Next covered month ${p.classicLoanPaidThrough}.`;break;
      }
      case 'classicBroker':p.classicBrokerOpen=true;msg='Broker desk opened: six markets available for trading.';break;
      case 'classicBuyStock':{
        if(!this.isClassic||!p.classicBrokerOpen||!D.classicStocks.some(x=>x.id===arg))throw Error('Broker unavailable');
        p.classicPortfolio[arg]=(p.classicPortfolio[arg]||0)+1;this.syncClassicInvested(p);
        msg=`Bought 1 ${D.classicStocks.find(x=>x.id===arg).name} for ${money(a.price)}.`;break;
      }
      case 'classicSellStock':{
        if(!this.isClassic||!p.classicBrokerOpen||(p.classicPortfolio[arg]||0)<1)throw Error('Holding unavailable');
        p.classicPortfolio[arg]--;const proceeds=arg==='tbills'?97:this.classicStockPrices[arg];p.cash+=proceeds;
        this.syncClassicInvested(p);msg=`Sold 1 ${D.classicStocks.find(x=>x.id===arg).name} for ${money(proceeds)}.`;break;
      }
      case 'classicSellLegacy':{
        if(!this.isClassic||!p.classicBrokerOpen||p.classicLegacyInvestment<=0)throw Error('No old investments');
        p.cash+=p.classicLegacyInvestment;p.classicLegacyInvestment=0;this.syncClassicInvested(p);
        msg='Legacy portfolio liquidated at its saved value.';break;
      }
      case 'deposit':{const amount=arg==='all'?p.cash:Number(arg);if(arg==='all')p.cash-=amount;p.bank+=amount;msg=`Deposited ${money(amount)} safely into your account.`;break;}
      case 'withdraw':p.bank-=Number(arg);p.cash+=Number(arg);msg=`Withdrew ${money(Number(arg))}.`;break;
      case 'invest':p.invested+=200;msg='Invested $200. Markets move at the start of each month.';break;
      case 'sell':p.cash+=p.invested;msg=`Sold holdings for ${money(p.invested)}.`;p.invested=0;break;
      case 'upgrade':p.home=arg;p.happiness=clamp(p.happiness+(arg==='loft'?18:10),0,100);msg=`New home: ${D.dwellings[arg].name}! Remember the new monthly rent.`;break;
      case 'rentDebt':msg=`Cleared ${money(p.rentDebt)} of rent debt.`;p.rentDebt=0;break;
      case 'buy':p.owned.push(arg);p.happiness=clamp(p.happiness+(arg==='formal'?7:arg==='casual'?4:5),0,100);msg=`Purchased ${arg}. A new door just opened.`;break;
      case 'movie':p.happiness=clamp(p.happiness+18,0,100);p.energy=clamp(p.energy+4,0,100);msg='Great movie. No spoilers, just good vibes.';break;
      case 'pass':p.weekendPass=true;msg='Weekend adventure booked. Something to look forward to!';break;
      case 'checkup':p.energy=clamp(p.energy+42,0,100);p.hunger=0;p.happiness=clamp(p.happiness+5,0,100);msg='Feeling restored. You can face the week again.';break;
      default:return {ok:false,message:'Not implemented.'};
    }
    this.recordChange(p,before,msg,['work','freelance','raise'].includes(key)?'work':['deposit','withdraw','invest','sell'].includes(key)?'banking':['buy','clothes','groceries','bulkFood','meal','lottery'].includes(key)?'shopping':['upgrade','rentDebt'].includes(key)?'housing':['study','classicStudy','enroll','course'].includes(key)?'education':['favor','pulse'].includes(key)?'community':['classicPawn','classicRedeem','classicBuyPawn'].includes(key)?'pawn':'activity');
    if(key==='apply'||key==='upgrade'||((key==='study'||key==='classicStudy')&&msg.startsWith('Graduated'))||(key==='course'&&msg.startsWith('Course completed')))this.milestone(p,msg);
    this.log(msg, key==='apply'||key==='study'||key==='upgrade'?'good':'info',p.id);
    this.checkWin();
    return {ok:true,message:msg};
  }
  chooseEncounter(choiceId){
    if(!this.pendingEncounter||this.pendingEncounter.playerId!==this.player.id)return {ok:false,message:'No encounter to resolve.'};
    const arc=this.pendingEncounter.arcId&&D.storyArcs.find(a=>a.id===this.pendingEncounter.arcId);
    const encounter=arc?this.storyChapter(arc,this.pendingEncounter.chapter):D.encounters[this.pendingEncounter.placeId];
    const choice=encounter?.choices.find(c=>c.id===choiceId);
    if(!choice)return {ok:false,message:'Not a valid story choice.'};
    const p=this.player,e=choice.effects||{};
    if(p.cash+(e.cash||0)<0)return {ok:false,message:'You cannot afford that choice.'};
    if(p.bank+(e.bank||0)<0)return {ok:false,message:'Not enough savings.'};
    const before=this.accounts(p);
    this.applyEffects(p,e);
    const venue=this.pendingEncounter.placeId;
    if(arc){
      const current=p.storyProgress[arc.id]||{chapter:0,lastWeek:0};
      if(current.chapter!==this.pendingEncounter.chapter)return {ok:false,message:'This chapter is no longer current.'};
      const primary=choice.trust||0,secondary=choice.partnerTrust||0;
      p.relationships[arc.host]=clamp(this.relationship(p,arc.host)+primary,0,100);
      p.relationships[arc.partner]=clamp(this.relationship(p,arc.partner)+secondary,0,100);
      p.storyProgress[arc.id]={chapter:current.chapter+1,lastWeek:this.week,choices:[...(current.choices||[]),choice.id]};
      const boost=encounter.cityBoost?{experience:3,happiness:2}:{};
      this.applyEffects(p,boost);
      if(choice.publicWorks&&!this.cityProjects[arc.id]){
        this.cityProjects[arc.id]=true;
        this.log(`CITY LEGACY: ${arc.title} has permanently changed the city!`, 'news','system');
      }
      this.recordChange(p,before,`${arc.title}: ${choice.label}`,'story');
      this.milestone(p,`${arc.title} · ${encounter.title} · ${choice.label}`);
      this.pendingEncounter=null;
      this.log(`${p.name} · ${arc.title}: ${choice.label}. ${primary>=0?'+':''}${primary} ${D.citizens[arc.host].name} trust; ${secondary>=0?'+':''}${secondary} ${D.citizens[arc.partner].name} trust.`, 'good',p.id);
      this.checkWin();return {ok:true,message:`Chapter ${current.chapter+1} complete: ${choice.label}`};
    }
    p.memories[venue]=choice.id;
    // Generous or engaged responses strengthen rapport; declining is remembered too.
    const isEngaged=encounter.choices[0].id===choice.id;
    p.relationships[venue]=clamp(this.relationship(p,venue)+(isEngaged?11:-3),0,100);
    this.pendingEncounter=null;
    this.recordChange(p,before,`${D.citizens[venue].name}: ${choice.label}`,'story');
    this.log(`${D.citizens[venue].name} remembers: ${choice.label}. ${choice.detail} (${isEngaged?'+11':'-3'} trust)`,'good',p.id);
    this.checkWin();
    return {ok:true,message:choice.label};
  }
  encounter(){if(!this.pendingEncounter)return null;const arc=D.storyArcs.find(a=>a.id===this.pendingEncounter.arcId);return arc?this.storyChapter(arc,this.pendingEncounter.chapter):D.encounters[this.pendingEncounter.placeId];}
  weekend(p) {
    const parts=[];
    if(!p.fed){
      if(p.groceries>0){p.groceries--;if(this.isClassic)p.hunger=Math.max(0,p.hunger-1);parts.push('A pantry meal kept hunger away.');}
      else {p.hunger=clamp(p.hunger+1,0,4);p.happiness=clamp(p.happiness-8,0,100);parts.push('You went hungry. Next week will be harder.');}
    }else p.hunger=Math.max(0,p.hunger-1);
    if(this.isClassic){
      const capacity=this.classicFoodCapacity(p);
      if(p.groceries>capacity){p.groceries=capacity;parts.push('Extra food spoiled beyond storage capacity.');}
      if(!p.owned.includes('fridge')&&p.groceries>0){
        p.groceries=0;const fee=Math.min(p.cash,25);p.cash-=fee;
        parts.push(`Food spoiled without refrigeration; medical costs ${money(fee)} (approximate rule).`);
      }
    }else if(!p.owned.includes('fridge')&&p.groceries>0){p.groceries=0;parts.push('Unused fresh groceries spoiled without a fridge.');}
    if(p.weekendPass){p.happiness=clamp(p.happiness+13,0,100);parts.push('An amazing weekend adventure lifted your spirits.');p.weekendPass=false;}
    if(p.lottery){for(let n=0;n<p.lottery;n++){if(this.rand()<.10){const win=this.rand()<.10?450:95;p.cash+=win;parts.push(`Lottery winner! You collected ${money(win)}.`);}}
      p.lottery=0;
    }
    if(p.owned.includes('computer')&&this.rand()<.33){p.bank+=40;parts.push('Your tiny digital project earned $40.');}
    if(p.cash>25){
      const events=[{text:'A friend invited you for coffee.',cash:12,happy:4},{text:'Your favorite band played downtown.',cash:26,happy:7},
        {text:'You picked up a hobby.',cash:18,happy:5},{text:'A surprise subscription renewed.',cash:15,happy:-2},
        {text:'You found a quiet afternoon in the park.',cash:0,happy:7}];
      const event=events[Math.floor(this.rand()*events.length)];const cost=Math.min(p.cash,event.cash);
      p.cash-=cost;p.happiness=clamp(p.happiness+event.happy,0,100);
      parts.push(`${event.text}${cost?` -${money(cost)}`:''}`);
    }
    if(p.home==='studio'&&this.rand()<.08&&p.owned.length>0){
      const eligible=p.owned.filter(x=>['fridge','computer'].includes(x));
      if(eligible.length){const item=eligible[Math.floor(this.rand()*eligible.length)];p.owned=p.owned.filter(x=>x!==item);parts.push(`A break-in took your ${item}. Better security may help.`);}
    }
    return parts;
  }
  newWeek() {
    this.week++;
    this.bulletin=D.headlines[(this.week-1)%D.headlines.length];
    if(this.isClassic){
      // Original markets have six per-instrument prices. Exact Sierra random formula is unverified.
      const drift=(this.economy-1)*0.08;
      for(const stock of D.classicStocks){
        if(stock.id==='tbills')continue;
        const previous=this.classicStockPrices[stock.id];
        const next=Math.round(previous*(1+drift+(this.rand()-.5)*.16));
        this.classicStockPrices[stock.id]=clamp(next,Math.floor(stock.base*.5),Math.ceil(stock.base*2.5));
      }
    }
    if(this.week%4===1){
      const old=this.economy;this.economy=clamp(Math.round((old+(this.rand()-.46)*.12)*100)/100,.84,1.24);
      const choices=D.cityEvents.filter(e=>e.id!==this.cityEventId);
      this.cityEventId=choices[Math.floor(this.rand()*choices.length)].id;
      this.cityEventStart=this.week;
      if(!this.isClassic)this.log(`CITY PULSE: ${this.cityEvent.title}. ${this.cityEvent.description}`,'news','system');
      this.log(`New month. The local economy is ${this.economy>old?'heating up':this.economy<old?'cooling off':'holding steady'} (${Math.round(this.economy*100)}%).`,'news','system');
    }
    for(const p of this.players){
      // Original-inspired weekly wardrobe wear; each garment ages regardless of what was worn.
      for(const garment of Object.keys(D.clothing)){
        const old=this.clothingWeeks(p,garment);
        p.clothing[garment]=Math.max(0,old-1);
        if(old>1&&p.clothing[garment]===1)this.log(`${p.name}'s ${D.clothing[garment].name.toLowerCase()} have one week left.`, 'warn',p.id);
        if(old===1)this.log(`${p.name}'s ${D.clothing[garment].name.toLowerCase()} have worn out. Buy a replacement before working.`, 'warn',p.id);
      }
      const beforeWeekend=this.accounts(p);
      if(this.isClassic)this.syncClassicInvested(p);
      const notes=this.weekend(p);
      this.recordChange(p,beforeWeekend,'Weekend living expenses and windfalls','living');
      if(this.isClassic)this.classicEmergencyRelief(p,notes);
      if(this.isClassic){
        // Rent becomes due at the end of week 4, 8, 12...; a granted extension shifts just this deadline.
        if(this.week>p.classicRentDueWeek){
          const beforeRent=this.accounts(p);
          p.rentDebt+=p.classicRent;p.classicRentDueWeek+=4;p.classicEverDebt=true;
          p.happiness=clamp(p.happiness-7,0,100);
          notes.push(`${money(p.classicRent)} unpaid rent became debt. Future wages may be garnished.`);
          this.recordChange(p,beforeRent,'Unpaid Classic rent','housing');
        }
      }
      if(this.isClassic&&this.week%4===1&&p.debt>0){
        const dueMonth=Math.floor((this.week-1)/4);
        if(p.classicLoanPaidThrough<dueMonth){p.classicLoanDefaults++;p.happiness=clamp(p.happiness-3,0,100);notes.push('Bank loan payment missed: -3 happiness and worse future credit.');}
      }
      if(this.week%4===1){
        if(!this.isClassic){
          const beforeRent=this.accounts(p);
          const rent=Math.round(D.dwellings[p.home].rent);
          const pay=Math.min(rent,p.cash+p.bank);const cash=Math.min(pay,p.cash);p.cash-=cash;
          const fromBank=pay-cash;p.bank-=fromBank;p.rentDebt+=rent-pay;
          if(rent-pay>0){p.happiness=clamp(p.happiness-7,0,100);notes.push(`${money(rent-pay)} rent went unpaid.`);}
          else notes.push(`${money(rent)} monthly rent paid.`);
          this.recordChange(p,beforeRent,'Monthly rent · '+D.dwellings[p.home].name,'housing');
        }
        const beforeMarket=this.accounts(p);
        if(!this.isClassic&&p.invested>0){const percent=(this.rand()-.45)*.28;p.invested=Math.max(0,Math.round(p.invested*(1+percent)));notes.push(`Investments moved ${percent>=0?'+':''}${Math.round(percent*100)}%.`);}
        if(!this.isClassic)p.bank+=Math.floor(p.bank*.006);
        this.recordChange(p,beforeMarket,'Investment returns and savings interest','investment');
      }
      p.hours=clamp(this.rules.hours-(p.hunger>0?p.hunger*3:0),14,this.rules.hours);
      p.energy=clamp(p.energy+38-p.hunger*4,0,100);
      p.happiness=clamp(p.happiness-2+D.dwellings[p.home].comfort,0,100);
      p.dependability=clamp(p.dependability-this.rules.dependabilityDecay,0,100);p.fed=false;p.weekActions=0;
      this.recordHistory(p);
      if(notes.length)this.log(`${p.name}: ${notes.join(' ')}`,p.hunger>0?'warn':'news',p.id);
    }
    this.log(`It's week ${this.week}. ${this.rules.hours} possible hours, infinite ways to spend them.`,'good','system');
    this.checkWin();
  }
  endTurn(){
    if(this.pendingEncounter)return {ok:false,message:'Finish the conversation before ending your week.'};
    if(this.winner)return {ok:false,message:'The game has ended.'};
    const who=this.player.name;
    this.active++;
    if(this.active>=this.players.length){this.active=0;this.newWeek();}
    this.log(`${who} finished their week.`,'muted','system');
    // Keep the human turn visible and simulate any intervening AI turns immediately.
    let guard=0;
    while(this.player.isAI&&!this.winner&&guard++<this.players.length){this.runAI();this.active++;if(this.active>=this.players.length){this.active=0;this.newWeek();}}
    return {ok:true,message:`A new turn begins: ${this.player.name}.`};
  }
  runAI(){
    const p=this.player;
    if(!p.isAI)return;
    const moveTo=(dest,minHours=0)=>{
      const cost=this.travelCost(p.location,dest);
      if(p.hours<cost+minHours)return false;
      return this.travel(dest).ok;
    };
    const perform=(id)=>{const a=this.actions().find(x=>x.id===id);return !!a?.enabled&&this.act(id).ok;};
    const usable=job=>job&&this.isDressedFor(p,job);
    let studyCount=0,workCount=0,restCount=0,loops=0;
    while(p.hours>=2&&!this.winner&&loops++<28){
      let current=this.getJob(p);
      // Recover from cash shortages, including any existing savings being inaccessible for tuition.
      if(p.cash<65&&p.bank>=100&&p.hours>=3){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('withdraw:100'))continue;
      }
      if(this.isClassic&&this.rentServicesOpen(p)&&p.cash<p.classicRent&&p.bank>=100&&p.cash+p.bank>=p.classicRent&&p.hours>=5){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('withdraw:100'))continue;
      }
      // In Classic, a conscious trip to the Rent Office is necessary before the deadline.
      if(this.isClassic&&this.rentServicesOpen(p)&&p.cash>=p.classicRent&&p.hours>=4){
        if(p.location!=='housing'){if(moveTo('housing',1))continue;}
        else if(perform('classicPayRent'))continue;
      }
      // Replacement clothing has to be funded BEFORE the last wearable week ends.
      // With authentic $200/$0 Classic start the rival must not spend itself into
      // an irreversible no-uniform/no-pay/no-food loop.
      if(this.isClassic&&current&&p.hours>=4&&p.clothing.casual<=2&&!p.clothing.formal&&!p.clothing.business){
        const offer=this.cheapestClothingOffer(current);
        if(offer&&p.cash>=this.price(offer.cost,'retail')&&p.clothing[offer.id]<=2){
          if(p.location!==offer.venue){if(moveTo(offer.venue,1))continue;}
          else if(perform(`clothes:${offer.id}:${offer.venue}`))continue;
        }
      }
      // Never accept a promotion that leaves us unable to afford the required wardrobe.
      const qualified=this.jobs.filter(j=>!this.jobReasons(p,j).length&&this.canAffordClothes(p,j));
      qualified.sort((a,b)=>b.tier-a.tier||b.wage-a.wage);
      const better=this.isClassic&&!current
        ?qualified.find(j=>j.id==='classic-monolith-cook')||qualified[0]
        :qualified[0];
      if(better&&(!current||better.tier>current.tier||(better.tier===current.tier&&better.wage>current.wage*1.18))&&p.hours>=7){
        if(!this.isDressedFor(p,better)){
          const offer=this.cheapestClothingOffer(better);
          if(offer&&p.location!==offer.venue){if(moveTo(offer.venue,1))continue;}
          else if(offer&&perform(`clothes:${offer.id}:${offer.venue}`))continue;
        }else{
          if(p.location!=='agency'){if(moveTo('agency',3))continue;}
          else if(perform('apply:'+better.id))continue;
        }
      }
      current=this.getJob(p);
      // Clothes age each week, so the competitor must replace them before trying to work.
      if(current&&!usable(current)&&p.hours>=3){
        const offer=this.cheapestClothingOffer(current);
        if(offer&&p.cash>=this.price(offer.cost,'retail')){
          if(p.location!==offer.venue){if(moveTo(offer.venue,1))continue;}
          else if(perform(`clothes:${offer.id}:${offer.venue}`))continue;
        }
      }
      // Make food a priority, but keep enough for a paycheck or an emergency errand.
      if(!p.fed&&p.groceries===0&&p.cash>=(this.isClassic?this.classicFoodPrice(1):this.price(24,'food'))&&p.hours>=4){
        if(p.location!=='market'){if(moveTo('market',1))continue;}
        else if(perform(this.isClassic?'classicFresh:1':'groceries'))continue;
      }
      // Study at a sustainable pace: maintain a rent buffer and earn in between terms.
      const degree=this.isClassic?D.classicDegrees.find(d=>!p.classicDegrees.includes(d.id)&&this.classicDegreeAvailable(p,d)):D.degrees[p.education];
      if(degree&&this.week%2===0&&studyCount<1&&p.cash>(this.isClassic?650:degree.cost+320)&&p.hours>=9&&p.energy>=34&&p.workSessions>=2){
        if(p.location!=='university'){if(moveTo('university',6))continue;}
        else if(this.isClassic){
          if(!p.classicEnrollmentCredits&&!p.classicEnrolled.includes(degree.id)){if(perform('enroll'))continue;}
          if(perform('classicStudy:'+degree.id)){studyCount++;continue;}
        }else if(perform('study')){studyCount++;continue;}
      }
      if(current&&usable(current)&&workCount<(this.isClassic?5:2)&&p.energy>=18&&p.hours>=6){
        if(p.location!==current.place){if(moveTo(current.place,6))continue;}
        else if(perform('work')){workCount++;continue;}
      }
      // An unemployed player may take one temporary odd job per week to avoid softlocking.
      // Once hired, the AI must earn its shift wage at the assigned workplace.
      if(!current&&p.cash<150&&p.energy>=14&&p.hours>=7){
        if(p.location!=='home'){if(moveTo('home',6))continue;}
        else if(perform('freelance'))continue;
      }
      if(restCount<2&&(p.energy<32||p.happiness<72)&&p.hours>=6){
        if(p.location!=='home'){if(moveTo('home',5))continue;}
        else if(perform('relax')){restCount++;continue;}
      }
      if(current&&p.workSessions>=3&&p.cash>150&&p.hours>=4&&p.raiseWeek<=this.week-4){
        if(p.location!=='agency'){if(moveTo('agency',2))continue;}
        else if(perform('raise'))continue;
      }
      if(p.groceries===0&&p.cash>=(this.isClassic?this.classicFoodPrice(1):24)&&p.hours>=3){
        if(p.location!=='market'){if(moveTo('market',1))continue;}
        else if(perform(this.isClassic?'classicFresh:1':'groceries'))continue;
      }
      if(p.cash>=1100&&p.hours>=3){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform(this.isClassic?'deposit:100':'deposit:500'))continue;
      }
      break;
    }
    this.log(`${p.name} has finished plotting their next big move.`,'muted',p.id);
  }

  snapshot(){return JSON.parse(JSON.stringify({classicPawnLots:this.classicPawnLots,classicPawnSequence:this.classicPawnSequence,settings:this.settings,seed:this.seed,week:this.week,economy:this.economy,active:this.active,winner:this.winner,sequence:this.sequence,messages:this.messages,players:this.players,pendingEncounter:this.pendingEncounter,bulletin:this.bulletin,cityEventId:this.cityEventId,cityEventStart:this.cityEventStart,cityProjects:this.cityProjects,classicStockPrices:this.classicStockPrices}));}
  static load(obj){
    if(!obj||typeof obj!=='object'||!Array.isArray(obj.players)||!obj.players.length||!obj.settings||!Number.isInteger(obj.week)||obj.week<1||obj.week>10000)throw Error('Invalid save file.');
    const game=new LifeGame({mode:obj.settings.mode,goals:obj.settings.goals,ruleset:obj.settings.ruleset,era:obj.settings.era,jonesDifficulty:obj.settings.jonesDifficulty,seed:obj.seed});
    if(obj.players.length!==game.players.length)throw Error('Save format has an unexpected number of players.');
    for(let i=0;i<obj.players.length;i++){
      const p=obj.players[i];if(!p||p.id!==game.players[i].id||!D.places.some(l=>l.id===p.location)||!Number.isFinite(p.cash)||!Number.isFinite(p.hours)||p.cash<0||p.bank<0||p.hours<0||p.hours>game.rules.hours||p.owned?.length>50)throw Error('Invalid player state.');
      if(p.job&&!find(game.jobs,p.job)&&!(game.isClassic&&find(D.jobs,p.job)))throw Error('Invalid job in save.');
      if(!Object.hasOwn(D.dwellings,p.home))throw Error('Invalid housing in save.');
    }
    // Validate shared pawns before accepting remote or locally imported snapshots.
    const pawnIds=new Set();
    if(obj.classicPawnLots!==undefined){
      if(!Array.isArray(obj.classicPawnLots)||obj.classicPawnLots.length>64)throw Error('Invalid pawn lots.');
      for(const lot of obj.classicPawnLots){
        if(!lot||typeof lot.id!=='string'||!/^pawn-[1-9][0-9]*$/.test(lot.id)||lot.id.length>16||!Number.isSafeInteger(Number(lot.id.slice(5)))||pawnIds.has(lot.id)||
           !obj.players.some(p=>p.id===lot.ownerId)||!Object.hasOwn(PAWN_VALUES,lot.item)||
           lot.payout!==pawnLoan(lot.item)||lot.redemption!==pawnRedemption(lot.item)||
           !Number.isInteger(lot.dueWeek)||lot.dueWeek<2||lot.dueWeek>obj.week+2||
           obj.players.find(p=>p.id===lot.ownerId).owned.includes(lot.item))throw Error('Invalid pawn lot.');
        pawnIds.add(lot.id);
      }
    }
    game.classicPawnLots=(obj.classicPawnLots||[]).map(l=>({...l}));
    game.classicPawnSequence=Math.max(0,Number.isSafeInteger(obj.classicPawnSequence)&&obj.classicPawnSequence<=1e9?obj.classicPawnSequence:0,...game.classicPawnLots.map(l=>Number(l.id.slice(5))));
    game.classicStockPrices=Object.fromEntries(D.classicStocks.map(x=>[x.id,Number.isInteger(obj.classicStockPrices?.[x.id])&&obj.classicStockPrices[x.id]>=Math.max(1,Math.floor(x.base*.5))&&obj.classicStockPrices[x.id]<=Math.ceil(x.base*2.5)?obj.classicStockPrices[x.id]:x.base]));
    game.players=obj.players;
    for(const p of game.players){
      if(game.isClassic&&p.isAI){
        const goalSet=p.classicGoals;
        if(!goalSet||D.GOAL_KEYS.some(k=>!Number.isInteger(goalSet[k])||goalSet[k]<10||goalSet[k]>100||goalSet[k]%5!==0)||
          game.goalPoints({isAI:true,classicGoals:goalSet})<40)throw Error('Invalid Classic rival goals in snapshot.');
      }
      if(p.appearance)p.appearance=Characters.normalizeAppearance(p.appearance);
      const legacyPortfolio=p.classicPortfolio===undefined;
      p.classicPortfolio=p.classicPortfolio&&typeof p.classicPortfolio==='object'&&!Array.isArray(p.classicPortfolio)?
        Object.fromEntries(D.classicStocks.map(x=>[x.id,clamp(Math.floor(Number(p.classicPortfolio[x.id])||0),0,100000)])):Object.fromEntries(D.classicStocks.map(x=>[x.id,0]));
      p.classicLegacyInvestment=legacyPortfolio&&game.isClassic?Math.max(0,Number(p.invested)||0):clamp(Math.floor(Number(p.classicLegacyInvestment)||0),0,100000000);
      p.classicBrokerOpen=p.classicBrokerOpen===true&&p.location==='bank';
      p.classicWorkHourCredit=Number.isInteger(p.classicWorkHourCredit)?clamp(p.classicWorkHourCredit,0,5):0;
      p.classicLoanDefaults=clamp(Math.floor(Number(p.classicLoanDefaults)||0),0,10000);
      p.classicLoanPaidThrough=clamp(Math.floor(Number(p.classicLoanPaidThrough)||0),0,10000);
      p.classicFoodPurchasedWeek=clamp(Math.floor(Number(p.classicFoodPurchasedWeek)||0),0,obj.week);
      p.classicHardshipWeeks=clamp(Math.floor(Number(p.classicHardshipWeeks)||0),0,2);
      p.classicReliefWeek=clamp(Math.floor(Number(p.classicReliefWeek)||0),0,obj.week);
      p.classicReliefCount=clamp(Math.floor(Number(p.classicReliefCount)||0),0,10000);
      if(game.isClassic)game.syncClassicInvested(p);
      // Migrate pre-0.5 Classic employment to a genuine DOS role. Wages stay as earned.
      if(game.isClassic&&p.job&&!find(D.classicJobs,p.job)){
        const legacy=find(D.jobs,p.job);
        const group={server:'classic-monolith-clerk',cook:'classic-monolith-cook',stock:'classic-zmart-clerk',teller:'classic-bank-teller',
          tutor:'classic-hitech-teacher',analyst:'classic-factory-secretary',repair:'classic-socket-electronics-repairman',
          engineer:'classic-factory-engineer',director:'classic-factory-general-manager',kitchenlead:'classic-monolith-assistant-manager',
          storelead:'classic-zmart-assistant-manager',storemanager:'classic-zmart-manager',stylist:'classic-qt-salesperson',
          boutiquelead:'classic-qt-manager',techlead:'classic-socket-manager',banklead:'classic-bank-assistant-manager',
          bankmanager:'classic-bank-manager',professor:'classic-hitech-professor',officelead:'classic-factory-department-manager'};
        p.job=group[legacy.id]||'classic-monolith-cook';
      }
      p.classicRejectedOpenings=p.classicRejectedOpenings&&typeof p.classicRejectedOpenings==='object'&&!Array.isArray(p.classicRejectedOpenings)?
        Object.fromEntries(Object.entries(p.classicRejectedOpenings).filter(([id,week])=>D.classicJobs.some(j=>j.id===id)&&Number.isInteger(week)&&week<=obj.week&&week>=1)):{};
      p.classicRent=Number.isFinite(p.classicRent)&&p.classicRent>=1?Math.floor(p.classicRent):325;
      p.classicRentDueWeek=Number.isInteger(p.classicRentDueWeek)&&p.classicRentDueWeek>=4?p.classicRentDueWeek:4+4*Math.floor((obj.week-1)/4);
      p.classicExtensions=Number.isInteger(p.classicExtensions)?clamp(p.classicExtensions,0,100):0;
      p.classicExtensionAttemptWeek=Number.isInteger(p.classicExtensionAttemptWeek)?clamp(p.classicExtensionAttemptWeek,0,obj.week):0;
      p.classicEverDebt=p.classicEverDebt===true||(game.isClassic&&p.rentDebt>0);
      p.contacts=Number.isFinite(p.contacts)?clamp(p.contacts,0,100):0;
      p.oddJobWeek=Number.isInteger(p.oddJobWeek)&&p.oddJobWeek>=0&&p.oddJobWeek<=obj.week?p.oddJobWeek:0;
      // Pre-0.4.3 wardrobes were permanent owned flags. Convert them once on load.
      const legacyClothing=!p.clothing||typeof p.clothing!=='object'||Array.isArray(p.clothing);
      p.clothing=Object.fromEntries(Object.keys(D.clothing).map(k=>[k,legacyClothing?(k==='casual'?Math.max(6,p.owned?.includes('casual')?11:0):p.owned?.includes(k)?13:0):clamp(Math.floor(Number(p.clothing[k])||0),0,260)]));
      // The saved equipment inventory now holds durable appliances, not consumable outfits.
      p.owned=(p.owned||[]).filter(x=>!Object.hasOwn(D.clothing,x));
      p.coursesCompleted=Array.isArray(p.coursesCompleted)?[...new Set(p.coursesCompleted.filter(k=>D.courses.some(c=>c.id===k)))]:[];
      // Classic v0.4.5 used the Modern four-stage ladder; migrate to four valid branching diplomas.
      // Modern saves are never modified by the new classic degree subsystem.
      const oldClassic=!Array.isArray(p.classicDegrees);
      const migrated=['junior-college','trade-school','business-admin','electronics'];
      p.classicDegrees=oldClassic&&game.isClassic?migrated.slice(0,clamp(Math.floor(Number(p.education)||0),0,4)):
        [...new Set((p.classicDegrees||[]).filter(id=>D.classicDegrees.some(d=>d.id===id)))];
      const validDegree=id=>D.classicDegrees.some(d=>d.id===id)&&!p.classicDegrees.includes(id);
      p.classicProgress=p.classicProgress&&typeof p.classicProgress==='object'&&!Array.isArray(p.classicProgress)?Object.fromEntries(Object.entries(p.classicProgress).filter(([id,n])=>validDegree(id)&&Number.isInteger(n)&&n>0&&n<=10)):{};
      p.classicEnrolled=Array.isArray(p.classicEnrolled)?[...new Set(p.classicEnrolled.filter(validDegree))].slice(0,4):[];
      p.classicEnrollmentCredits=Number.isInteger(p.classicEnrollmentCredits)?clamp(p.classicEnrollmentCredits,0,20):0;
      p.classicDismissals=Number.isInteger(p.classicDismissals)?clamp(p.classicDismissals,0,10000):0;
      p.classicRaises=Number.isInteger(p.classicRaises)?clamp(p.classicRaises,0,100):0;
      if(oldClassic&&game.isClassic){p.experience=Math.max(10,p.experience);if(p.credits>0){const d=D.classicDegrees.find(d=>!p.classicDegrees.includes(d.id)&&d.requires.every(id=>p.classicDegrees.includes(id)));if(d){p.classicProgress[d.id]=Math.min(9,p.credits);p.classicEnrolled.push(d.id);}}}
      p.courseProgress=p.courseProgress&&typeof p.courseProgress==='object'&&!Array.isArray(p.courseProgress)?Object.fromEntries(Object.entries(p.courseProgress).filter(([k,n])=>D.courses.some(c=>c.id===k)&&Number.isInteger(n)&&n>0&&n<find(D.courses,k).sessions&&!p.coursesCompleted.includes(k))):{};
      p.talkedWeek=p.talkedWeek&&typeof p.talkedWeek==='object'&&!Array.isArray(p.talkedWeek)?p.talkedWeek:{};
      p.seenEncounters=Array.isArray(p.seenEncounters)?p.seenEncounters.filter(id=>!!D.encounters[id]):[];
      const validPlaces=new Set(D.places.map(loc=>loc.id));
      const asObj=(x)=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
      p.relationships=Object.fromEntries(Object.entries(asObj(p.relationships)).filter(([id])=>validPlaces.has(id)).map(([id,n])=>[id,clamp(Number(n)||0,0,100)]));
      p.memories=Object.fromEntries(Object.entries(asObj(p.memories)).filter(([id,choice])=>validPlaces.has(id)&&D.encounters[id].choices.some(c=>c.id===choice)));
      p.favorsUsed=Object.fromEntries(Object.entries(asObj(p.favorsUsed)).filter(([id,n])=>validPlaces.has(id)&&Number.isInteger(n)&&n>=1&&n<=obj.week));
      p.cityParticipation=Object.fromEntries(Object.entries(asObj(p.cityParticipation)).filter(([week,v])=>Number.isInteger(Number(week))&&Number(week)>=1&&Number(week)<=obj.week&&v===true));
      p.storyProgress=Object.fromEntries(Object.entries(asObj(p.storyProgress)).filter(([id,v])=>D.storyArcs.some(a=>a.id===id)&&v&&typeof v==='object'&&Number.isInteger(v.chapter)&&v.chapter>=0&&v.chapter<=3&&Number.isInteger(v.lastWeek)&&v.lastWeek>=0&&v.lastWeek<=obj.week).map(([id,v])=>[id,{chapter:v.chapter,lastWeek:v.lastWeek,choices:Array.isArray(v.choices)?v.choices.filter(x=>typeof x==='string').slice(0,3):[]}]));
      p.ledger=Array.isArray(p.ledger)?p.ledger.filter(x=>x&&Number.isInteger(x.week)&&x.week>=1&&x.week<=obj.week&&typeof x.detail==='string'&&x.detail.length<=500&&Number.isFinite(x.net)&&Math.abs(x.net)<=1e9&&typeof x.category==='string').slice(0,160).map(x=>({week:x.week,detail:x.detail,category:x.category,net:x.net,cash:Number(x.cash)||0,bank:Number(x.bank)||0,invested:Number(x.invested)||0})):[];
      p.history=Array.isArray(p.history)?p.history.filter(x=>x&&Number.isInteger(x.week)&&x.week>=1&&x.week<=obj.week&&['cash','bank','invested','netWorth'].every(k=>Number.isFinite(x[k])&&x[k]>=0)).slice(-260).map(x=>({week:x.week,cash:x.cash,bank:x.bank,invested:x.invested,debt:Number(x.debt)||0,netWorth:x.netWorth})):[];
      if(!p.history.length)game.recordHistory(p);
      p.milestones=Array.isArray(p.milestones)?p.milestones.filter(x=>x&&Number.isInteger(x.week)&&x.week>=1&&x.week<=obj.week&&typeof x.text==='string'&&x.text.length<=500).slice(0,60):[];
    }
    if(obj.pendingEncounter){
      const e=obj.pendingEncounter;
      if(!e||typeof e!=='object'||!D.encounters[e.placeId]||!game.players.some(p=>p.id===e.playerId&&p.location===e.placeId&&!p.isAI))throw Error('Invalid saved encounter.');
      if(e.arcId){
        const arc=D.storyArcs.find(a=>a.id===e.arcId),progress=game.players.find(p=>p.id===e.playerId)?.storyProgress?.[e.arcId];
        if(!arc||arc.host!==e.placeId||!Number.isInteger(e.chapter)||e.chapter<0||e.chapter>=arc.chapters.length||(progress?.chapter||0)!==e.chapter)throw Error('Invalid story encounter.');
        game.pendingEncounter={playerId:e.playerId,placeId:e.placeId,arcId:e.arcId,chapter:e.chapter};
      }else game.pendingEncounter={playerId:e.playerId,placeId:e.placeId};
    }
    game.cityProjects=Object.fromEntries(D.storyArcs.filter(a=>obj.cityProjects?.[a.id]===true).map(a=>[a.id,true]));
    game.cityEventId=D.cityEvents.some(e=>e.id===obj.cityEventId)?obj.cityEventId:D.cityEvents[0].id;
    game.cityEventStart=Number.isInteger(obj.cityEventStart)&&obj.cityEventStart>=1&&obj.cityEventStart<=obj.week?obj.cityEventStart:1;
    game.bulletin=typeof obj.bulletin==='string'&&D.headlines.includes(obj.bulletin)?obj.bulletin:D.headlines[(obj.week-1)%D.headlines.length];
    game.seed=Number.isSafeInteger(obj.seed)?obj.seed:314159;
    game.week=obj.week;game.economy=clamp(Number(obj.economy)||1,.5,2);game.active=clamp(Number(obj.active)||0,0,game.players.length-1);
    game.winner=typeof obj.winner==='string'?obj.winner:null;
    game.sequence=Number(obj.sequence)||0;game.messages=Array.isArray(obj.messages)?obj.messages.slice(0,70):[];
    if(game.pendingEncounter&&game.player.id!==game.pendingEncounter.playerId)throw Error('Encounter player mismatch.');
    if(game.player.isAI&&!game.winner)game.endTurn();
    return game;
  }
}
root.LifeGame=LifeGame;
if(typeof module!=='undefined'&&module.exports)module.exports=LifeGame;
})(typeof window!=='undefined'?window:globalThis);

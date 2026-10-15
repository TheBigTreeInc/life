(function (root) {
'use strict';
const Pass2 = root.LifeClassicPass2 || (typeof require === 'function' ? require('./classic-pass2-rules.js') : null);
if(!Pass2)throw Error('Classic source rules unavailable');
const ClassicTime=root.LifeClassicTime||(typeof require==='function'?require('./classic-time.js'):null);
if(!ClassicTime)throw Error('Classic timing rules unavailable');
const ClassicTurn=root.LifeClassicTurnSequence||(typeof require==='function'?require('./classic-turn-sequence.js'):null);
if(!ClassicTurn)throw Error('Classic turn sequence unavailable');
const ClassicWeekly=root.LifeClassicWeeklyEvents||(typeof require==='function'?require('./classic-weekly-events.js'):null);
if(!ClassicWeekly)throw Error('Classic weekly events unavailable');
const ClassicHousehold=root.LifeClassicHousehold||(typeof require==='function'?require('./classic-household.js'):null);
if(!ClassicHousehold)throw Error('Classic household adapter unavailable');
const ClassicEconomy = root.LifeClassicEconomy || (typeof require === 'function' ? require('./classic-economy.js') : null);
if(!ClassicEconomy)throw Error('Classic economic indices unavailable');
const ClassicEvents=root.LifeClassicEconomicEvents||(typeof require==='function'?require('./classic-economic-events.js'):null);
if(!ClassicEvents)throw Error('Classic economic events unavailable');
const D = root.LifeData || (typeof require === 'function' ? require('./data.js') : null);
const Characters = root.LifeCharacters || (typeof require === 'function' ? require('./characters.js') : null);
// Classic board routes share one authoritative topology with the pawn renderer.
const RouteGraph = root.LifeRoutes || (typeof require === 'function' ? require('./route-graph.js') : null);
const ClassicRouteLayout = root.LifeClassicRoutes || (typeof require === 'function' ? require('../assets/boards/classic/routes.v1.json') : null);
const classicRouteGraph = RouteGraph && ClassicRouteLayout ? RouteGraph.compile(ClassicRouteLayout,D.classicPlaces.map(p=>p.id)) : null;
if (!classicRouteGraph) throw Error('Classic board route graph unavailable');
const find = (arr,id)=>arr.find(x=>x.id===id);
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const money = n=>'$'+Math.floor(n).toLocaleString('en-US');
// Provisional Classic pawn broker model; source evidence establishes the lifecycle,
// but not the exact interest rate, loan ratio or two-week deadline.
const PAWN_VALUES=Object.freeze({fridge:255,freezer:330,computer:590,dictionary:90,atlas:110,encyclopedia:165,vcr:285,stereo:225});
const PAWN_NAMES=Object.freeze({fridge:'Refrigerator',freezer:'Freezer',computer:'Computer',dictionary:'Dictionary',atlas:'Atlas',encyclopedia:'Encyclopedia',vcr:'VCR',stereo:'Stereo'});
const pawnLoan=item=>Math.floor(PAWN_VALUES[item]*.45);
const pawnRedemption=item=>pawnLoan(item)+Math.max(5,Math.ceil(pawnLoan(item)*.1));
// Documented Jones difficulty offsets. Sierra's exact goal distribution algorithm is
// unverified; our allocation preserves the budget, 5-point steps and close wealth target.
const CLASSIC_JONES_DIFFICULTY=Object.freeze({easy:40,fair:0,hard:-40});
// The secondary gameplay reference mentions ten weekly events. We interpret those
// as venue actions (not walking); exact DOS counting is unverified.
const CLASSIC_WEEKLY_ACTION_LIMIT=10;
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
    this.classicTurnJournal=[];this.classicEconomicIndices=ClassicEconomy.initial();this.classicEconomicPulse=ClassicEvents.initial();this.classicGoodsIndex=100;this.classicWeekEvents=[];this.classicDecisionTrace=[];this.messages=[];this.classicPawnLots=[];this.classicPawnSequence=0;
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
      happiness:62,energy:84,classicRelaxation:16,hunger:0,education:0,credits:0,experience:this.isClassic?10:0,dependability:this.rules.dependabilityStart,job:null,wage:0,workSessions:0,classicDegrees:[],classicProgress:{},classicEnrolled:[],classicEnrollmentCredits:0,classicDismissals:0,classicRaises:0,classicUnemployedWeeks:0,classicJobSearchFailures:0,classicRejectedOpenings:{},classicWorkHourCredit:0,classicWageRemainder:0,classicWorkWarningWeek:0,classicChoicesThisWeek:0,classicLastClosedWeek:0,classicLastRentChargeWeek:0,classicPaycheckHistory:[],classicRent:325,classicRentDueWeek:4,classicExtensions:0,classicExtensionAttemptWeek:0,classicEverDebt:false,classicPortfolio:Object.fromEntries(D.classicStocks.map(x=>[x.id,0])),classicLegacyInvestment:0,classicBrokerOpen:false,classicLoanDefaults:0,classicLoanPaidThrough:0,classicFoodPurchasedWeek:0,classicWeekendTicket:null,classicHardshipWeeks:0,classicReliefWeek:0,classicReliefCount:0,
      classicEquipment:{},classicBurglaryCount:0,home:'studio',groceries:1,fed:false,owned:[],clothing:{casual:6,formal:0,business:0},coursesCompleted:[],courseProgress:{},weekActions:0,raiseWeek:0,oddJobWeek:0,lottery:0,weekendPass:false,won:false,contacts:0,talkedWeek:{},seenEncounters:[],relationships:{},memories:{},favorsUsed:{},cityParticipation:{},storyProgress:{},ledger:[],history:[{week:1,cash:initialCash,bank:initialBank,invested:0,debt:0,netWorth:initialCash+initialBank}],milestones:[]};
  }
  get rules(){return D.RULESETS[this.settings.ruleset];}
  get isClassic(){return this.settings.ruleset==='classic';}
  get player(){return this.players[this.active];}
  get jobs(){return this.isClassic?D.classicJobs:D.jobs;}
  getJob(p){return find(this.jobs,p.job);}
  get places(){return this.isClassic?D.classicPlaces:D.places;}
  jobWorkplace(job){
    return D.jobWorkplace(job);
  }
  ownsWorking(p,id){return p.owned.includes(id)&&(!this.isClassic||p.classicEquipment?.[id]?.broken!==true);}
  equipmentSource(p,id){return p.classicEquipment?.[id]?.source||'specialty';}
  setEquipment(p,id,source='specialty'){if(this.isClassic&&Object.hasOwn(PAWN_VALUES,id))p.classicEquipment[id]={source,broken:false};}
  classicEquipmentBreakage(p,notes){
    // Provisional rates. Discount merchandise is less reliable than dedicated Socket City goods.
    for(const item of ['fridge','freezer','computer','vcr','stereo']){
      if(!p.owned.includes(item)||!this.ownsWorking(p,item))continue;
      const source=this.equipmentSource(p,item);
      const chance=source==='discount'?0.105:source==='pawn'?0.135:0.025;
      if(this.rand()<chance){p.classicEquipment[item]={source,broken:true};notes.push(`${PAWN_NAMES[item]} broke down. Socket City can repair it.`);}
    }
  }
  classicCrimeAfterAction(p,at){
    if(!this.isClassic||p.cash<=0||!['bank','cinema'].includes(at))return '';
    const chance=at==='bank'?0.012:0.035;
    if(this.rand()>=chance)return '';
    const stolen=p.cash;p.cash=0;
    return `Wild Willy robbed ${at==='bank'?'the Bank':"Black's Market"}! He stole ${money(stolen)} you were carrying. Bank deposits remain safe.`;
  }
  classicBurglar(p,notes){
    if(p.home!=='studio'||!p.owned.length)return;
    // Security apartments suppress home break-ins. Risk increases with valuable goods.
    const eligible=p.owned.filter(id=>Object.hasOwn(PAWN_VALUES,id));
    if(!eligible.length)return;
    const chance=Math.min(0.30,0.055+eligible.length*0.025);
    if(this.rand()<chance){
      const item=eligible[Math.floor(this.rand()*eligible.length)];
      p.owned=p.owned.filter(x=>x!==item);delete p.classicEquipment[item];
      p.classicBurglaryCount=(p.classicBurglaryCount||0)+1;
      notes.push(`Wild Willy stole your ${PAWN_NAMES[item]} from Low-Cost Housing! Le Security Apartments prevents home burglaries.`);
    }
  }
  offeredWage(job){return this.isClassic?ClassicEconomy.wageQuote(job.wage,this.classicEconomicIndices.readings.general):Math.max(1,Math.round(job.wage*this.economy));}
  classicEconomyReport(){if(!this.isClassic)throw Error('Classic-only economic report');return ClassicEconomy.keys.map(id=>({id,reading:id==='goods'?this.classicGoodsIndex:this.classicEconomicIndices.readings[id],change:this.classicEconomicIndices.momentum[id]}));}
  // Source-backed scandal effects, modelled trigger frequencies. Applies to
  // humans and Jones identically, with independent seeded dismissal draws.
  classicApplyScandal(strength){
    if(!this.isClassic)throw Error('Classic-only crisis event');
    for(const p of this.players){
      const before=this.accounts(p),oldWage=p.wage,oldJob=p.job;
      const roll=strength===2&&p.job?Math.floor(this.rand()*2):0;
      const {next,effect,savingsLost,wageLost}=ClassicEvents.scandal(p,strength,roll);
      p.bank=next.bank;p.job=next.job;p.wage=next.wage;p.happiness=next.happiness;
      if(effect==='dismissed'){
        p.classicDismissals=(p.classicDismissals||0)+1;
        p.classicWorkHourCredit=0;p.classicWageRemainder=0;
      }
      if(savingsLost)this.recordChange(p,before,'Classic economic crisis · lost savings','economic-crisis');
      this.classicEvent(p,'economic-scandal',`${effect}: ${oldJob||'unemployed'} · ${money(oldWage)} -> ${money(p.wage)}/hour`,
        {strength,effect,savingsLost,wageLost});
      if(effect!=='none')this.log(`${p.name}: ${effect==='dismissed'?'An economic crisis cost you your job.':effect==='wage-cut'?'A crisis cut your contractual wage.':'An economic crisis erased your bank savings.'}`,'warn',p.id);
    }
  }
  classicEvent(p,kind,detail,data={}){
    if(!this.isClassic)return;
    this.classicWeekEvents.push({week:this.week,playerId:p?.id||'system',kind,detail:String(detail).slice(0,240),...data});
    if(this.classicWeekEvents.length>96)this.classicWeekEvents.shift();
  }
  classicGoodsPrice(base){if(!this.isClassic)throw Error('Classic pricing only');return Pass2.goodsPrice(base,this.classicGoodsIndex);}
  // Qualify threshold in JobDItem: integer roll 1..100, not a float-percent
  // comparison. The special cook occupation (#44) is guaranteed after meeting
  // qualification checks. This helper does not advance the saved RNG seed.
  classicLuck(p){return clamp(30+Math.floor((10+p.dependability+p.experience+8*this.degreeCount(p))/3),0,100);}
  classicHiringChance(p,job){
    if(!this.isClassic)throw Error('DOS hiring chance is Classic-only');
    if(!job||!this.jobs.includes(job))throw Error('Unknown DOS job');
    if(this.jobReasons(p,job).length)return 0;
    return job.entryGuaranteed?100:this.classicLuck(p);
  }
  classicHiringRoll(p,job){
    const chance=this.classicHiringChance(p,job);
    return chance===100 || (chance>0 && 1+Math.floor(this.rand()*100)<=chance);
  }
  rentServicesOpen(p){return this.week>=p.classicRentDueWeek;}

  degreeCount(p){return Array.isArray(p.classicDegrees)?p.classicDegrees.length:0;}
  jobRequirement(job){return this.isClassic?{experience:job.experience,dependability:job.dependability,degrees:job.degrees}:{experience:job.experience,dependability:job.dependability,degrees:[]};}
  classicLessons(p){return 10-(this.ownsWorking(p,'computer')?1:0)-( ['encyclopedia','dictionary','atlas'].every(id=>p.owned.includes(id))?1:0);}
  classicDegreeAvailable(p,d){return d.requires.every(id=>p.classicDegrees.includes(id));}
  classicWorkCaps(p,job){const r=this.jobRequirement(job),bonus=5*this.degreeCount(p);return {experience:10+r.experience+bonus,dependability:20+r.dependability+bonus};}
  classicFoodCapacity(p){return this.ownsWorking(p,'fridge')?(this.ownsWorking(p,'freezer')?12:6):Infinity;}
  classicStockValue(p){return D.classicStocks.reduce((n,s)=>n+(p.classicPortfolio[s.id]||0)*this.classicStockPrices[s.id],0)+(p.classicLegacyInvestment||0);}
  syncClassicInvested(p){if(this.isClassic)p.invested=this.classicStockValue(p);}
  classicDiscountPrice(id){
    const item=D.classicDiscountGoods[id];
    if(!item)throw Error('Unknown Z-Mart merchandise');
    return this.classicGoodsPrice(item.cost);
  }
  classicDiscountStock(){return D.classicDiscountStock(this.week);}
  classicFoodPrice(units){const item=D.classicFreshFood.find(x=>x.units===units);if(!item)throw Error('Unknown food bundle');return this.classicGoodsPrice(item.cost);}
  classicShiftHours(p){return this.isClassic?Math.min(6,p.hours):6;}
  // DOS gross wages truncate on each shift, including partial end-of-turn work.
  classicShiftPay(p,hours){return Pass2.workGross(p.wage,hours);}
  classicWorkQuote(p,hours=this.classicShiftHours(p)){return ClassicTime.paycheck(p.wage,hours,p.rentDebt);}
  classicWorkStanding(p){const j=this.getJob(p);return j?ClassicTime.workStanding(p.dependability,this.jobRequirement(j).dependability,p.classicWorkWarningWeek===this.week):'ready';}
  classicShiftRemainder(p,hours){return 0;} // Pass 2 pays each partial shift with DOS integer truncation.
  pawnEligible(p,item){return Object.hasOwn(PAWN_VALUES,item)&&this.ownsWorking(p,item)&&!(item==='fridge'&&p.owned.includes('freezer'));}
  pawnLot(id){return this.classicPawnLots.find(l=>l.id===id);}
  classicLoanLimit(p){const job=this.getJob(p);return job?Math.max(0,Math.floor(((job.wage*32+p.cash+p.bank-p.debt)*0.75)*(0.8**p.classicLoanDefaults)/100)*100):0;}
  getPlace(id){return find(this.places,id);}
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
    const stocked=this.isClassic?D.clothingOffers.market.filter(x=>this.classicDiscountStock().clothing.includes(x.id)):D.clothingOffers.market;
    const cheapest=[...stocked,...D.clothingOffers.boutique].filter(x=>D.clothing[x.id].rank>=need).sort((a,b)=>a.cost-b.cost)[0];
    return !!cheapest&&p.cash>=this.price(cheapest.cost,'retail')+120;
  }
  cheapestClothingOffer(job){
    const rank=D.clothing[job.clothes]?.rank||1;
    const stocked=this.isClassic?D.clothingOffers.market.filter(x=>this.classicDiscountStock().clothing.includes(x.id)):D.clothingOffers.market;
    return [...stocked.map(x=>({...x,venue:'market'})),...D.clothingOffers.boutique.map(x=>({...x,venue:'boutique'}))].filter(x=>D.clothing[x.id].rank>=rank).sort((a,b)=>a.cost-b.cost)[0];
  }
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  get cityEvent(){return this.isClassic?D.cityEvents[0]:(D.cityEvents.find(e=>e.id===this.cityEventId)||D.cityEvents[0]);}
  get cityIndex(){return Math.floor((this.week-1)/4);}
  // A neutral public sector index and event-specific pricing. Whole-dollar tickets.
  price(base,sector){if(this.isClassic)return this.classicGoodsPrice(base);let multiplier=(this.cityEvent.prices[sector]||1);for(const arc of (this.isClassic?[]:D.storyArcs))if(arc.sector===sector&&this.cityProjects[arc.id])multiplier*=arc.bonus;return Math.max(1,Math.round(base*multiplier));}
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
  classicMaintenancePlan(p=this.player){
    if(!this.isClassic)throw Error('Classic-only maintenance');
    const reserve=this.classicSurvivalBudget(p).reserve;
    return ClassicHousehold.repairCandidates(p,PAWN_VALUES,Math.ceil(Math.max(0,reserve)));
  }
  classicOwnedValue(p){return [...new Set(p.owned||[])].reduce((sum,item)=>sum+Math.round((PAWN_VALUES[item]||0)*(p.classicEquipment?.[item]?.broken?0.2:1)),0);}
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
    const hardshipChecks=p.classicHardshipWeeks;
    p.classicHardshipWeeks=0;
    this.recordChange(p,before,'Emergency gift from a relative','relief');
    this.classicEvent(p,'emergency-clothing',`Emergency clothing assistance: ${money(90)}`,
      ClassicWeekly.emergencyClothingTrace(hardshipChecks,90));
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
    // Modern keeps the established fourteen-space travel clock. Classic derives
    // distance from the same versioned graph that the visible pawn actually walks.
    const a=this.getPlace(from),b=this.getPlace(to);
    if(!a||!b)return Infinity;
    if(this.isClassic)return ClassicTime.travelBreakdown(classicRouteGraph.plan(from,to).steps,this.rules.entryHours,to==='agency').units; // DOS agency entry; walking-unit conversion provisional
    const ring=[[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4],[4,5],[3,5],[2,5],[1,5],[1,4],[1,3],[1,2]];
    const ai=ring.findIndex(([x,y])=>a.cell[0]===x&&a.cell[1]===y),bi=ring.findIndex(([x,y])=>b.cell[0]===x&&b.cell[1]===y);
    if(ai<0||bi<0)return Infinity;
    const steps=Math.abs(ai-bi);
    return this.rules.entryHours+1+Math.floor(Math.min(steps,ring.length-steps)/3);
  }
  travelQuote(from,to,hours=this.player.hours){
    const cost=this.travelCost(from,to);
    if(!Number.isFinite(cost))return {ok:false,reason:'Unknown destination',hours:Infinity,steps:0,stops:[]};
    const route=this.isClassic?classicRouteGraph.plan(from,to):null;
    const timing=route?ClassicTime.travelBreakdown(route.steps,this.rules.entryHours,to==='agency'):null;
    return {ok:cost<=hours,reason:cost<=hours?'':`Need ${cost} hours; ${hours} available`,hours:cost,
      walkingHours:timing?.walkingUnits??cost,entryHours:timing?.serviceUnits??0,estimatedTicks:timing?.estimatedTicks??null,
      steps:route?route.steps:0,stops:route?route.ids.slice():[],waypointIndices:route?route.waypointIndices.slice():[],direction:route?.direction||null,from,to};
  }
  travel(target) {
    if(this.winner)return {ok:false,message:'This game is finished.'};
    if(this.pendingEncounter)return {ok:false,message:'Finish your conversation before leaving.'};
    const p=this.player, dest=this.getPlace(target);
    if(!dest)return {ok:false,message:'Unknown destination.'};
    const quote=this.travelQuote(p.location,target,p.hours);
    const cost=quote.hours;
    if(!quote.ok)return {ok:false,message:`Need ${cost} hours to travel. End the week to continue.`};
    if(cost===0)return {ok:true,message:`Already at ${dest.name}.`};
    p.hours-=cost;p.location=target;p.weekActions++;if(this.isClassic)p.classicBrokerOpen=false;
    this.log(`${p.name} visited ${dest.name} · ${cost} clock units${quote.entryHours?` (including ${quote.entryHours} Employment entry)`:''}`,'travel',p.id);
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
      const clockOpen=!this.isClassic||p.hours>0;
      const hasEventSlot=!this.isClassic||(p.classicChoicesThisWeek||0)<CLASSIC_WEEKLY_ACTION_LIMIT;
      t.push({id,title,detail,hours,price,enabled:clockOpen&&hasEventSlot&&valid&&p.hours>=hours&&p.cash>=price,reason:!clockOpen?'No hours left this week; end your turn.':!hasEventSlot?'Ten Classic actions used this week; end your turn.':!valid?reason:p.hours<hours?'Not enough time':p.cash<price?'Not enough cash':'',...meta});
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
    if(at==='home'||this.isClassic&&at==='clinic'&&p.home!=='studio'){
      if(!this.isClassic||at===(p.home==='studio'?'home':'clinic')){
        const rest=this.isClassic?ClassicHousehold.restQuote(p):null;
        push('relax','Take a breather',this.isClassic?`Recover +${rest.happiness} happiness, +${rest.energy} energy, +${rest.relaxation} relaxation (max 30). Home entertainment bonus +${rest.home.comfortBonus}.`:'Get +16 happiness and +24 energy.',this.rules.restHours,0,this.isClassic?rest.needed:p.happiness<100||p.energy<100,'Already feeling great');
      }
      // Casual paid errands are a safety net for unemployment, not a second workplace.
      const gigReady=!p.job&&p.oddJobWeek!==this.week&&p.energy>=14;
      if(!this.isClassic)push('freelance',p.owned.includes('computer')?'One-off online contract':'Temporary odd job',p.owned.includes('computer')?'Unemployed fallback: earn $165 once this week.':'Unemployed fallback: earn $56 once this week.',6,0,gigReady,p.job?'You already have a primary job. Work at your employer instead.':p.oddJobWeek===this.week?'Only one odd job per week.':'Need more energy');
      if(!this.isClassic&&p.groceries>0) push('cook','Cook something nice','Use one grocery portion. Stay fed and feel better.',2,0,!p.fed,'Already fed this week');
    }
    if(at==='agency'){
      for(const job of this.jobs){
        const reasons=this.jobReasons(p,job);
        const workplace=this.jobWorkplace(job);
        push('apply:'+job.id,p.job&&p.job!==job.id?`Switch to ${job.name} · ${workplace.label}`:`Apply: ${job.name} · ${workplace.label}`,`${money(this.offeredWage(job))}/hour · Work at ${workplace.boardName}${workplace.department?' ('+workplace.department+')':''}${this.isClassic?' · Original employer: '+workplace.originalName+' · DOS job #'+job.originalJobNum+' (original base '+money(job.originalBasePay)+'/h)':''} · Uniform: ${D.clothing[job.clothes].name}${!this.isClassic&&job.course?' · '+find(D.courses,job.course).name:''}${this.isClassic?(reasons.length?' · Unqualified: '+reasons.join(', '):' · Hiring: '+this.classicHiringChance(p,job)+'%') :''}${p.job&&p.job!==job.id?' · Replaces your current job if accepted':''}`,this.rules.applicationHours,0,(this.isClassic||reasons.length===0)&&p.job!==job.id,this.isClassic?(p.job===job.id?'See the raise action below':''):reasons.join(' · ')||(p.job===job.id?'Already employed in this position':''),{tier:job.tier,req:job,replacesJob:!!p.job&&p.job!==job.id,workplace:job.place});
      }
      const raiseReq=p.job&&this.isClassic?this.jobRequirement(this.getJob(p)).dependability+5*(p.classicRaises||0):0;
      const canRaise=p.job&&(this.isClassic?p.dependability>=raiseReq:p.workSessions>=3&&p.raiseWeek<=this.week-4);
      push('raise','Negotiate a raise',this.isClassic?`4 hours · listed wage ${money(p.job?this.offeredWage(this.getJob(p)):0)}/h · requires ${raiseReq} Dependability. Only awarded if offered rate exceeds current pay.`:`Request a higher wage at your current job.`,this.isClassic?4:2,0,!!canRaise&&(this.isClassic?(p.job&&p.wage<this.offeredWage(this.getJob(p))):(p.wage<Math.round(this.getJob(p).wage*1.5))),!p.job?'Get a job first':this.isClassic?`Need ${raiseReq} reliability and an improved listed wage`:p.workSessions<3?'Work 3 shifts first':p.raiseWeek>this.week-4?'Wait a few weeks before another raise':'Already near this role’s pay ceiling');
    }
    if(at==='market'||this.isClassic&&at==='cinema'){
      if(this.isClassic){
        if(at==='market'){
        const shelves=this.classicDiscountStock();
        for(const offer of D.clothingOffers.market.filter(x=>shelves.clothing.includes(x.id))){
          push(`clothes:${offer.id}:market`,`Z-Mart · ${D.clothing[offer.id].name}`,`Discount clothing · ${offer.weeks} weeks of wear. Availability changes each week.`,1,this.price(offer.cost,'retail'));
        }
        for(const id of shelves.goods){
          const product=D.classicDiscountGoods[id],price=this.classicDiscountPrice(id);
          const valid=product.kind==='ticket'?!p.classicWeekendTicket:!p.owned.includes(id);
          const reason=product.kind==='ticket'?'You already have a ticket for next weekend.':'You already own this item.';
          push('classicDiscount:'+id,`Z-Mart · ${product.name}`,`${product.detail} · Week ${this.week} discount stock.`,1,price,valid,reason);
        }
        } // End Z-Mart discount stock.
        if(at==='cinema')for(const offer of D.classicFreshFood)push('classicFresh:'+offer.units,`Buy ${offer.units} week${offer.units>1?'s':''} of fresh food`,`Black's Market · storage ${this.ownsWorking(p,'fridge')?(this.ownsWorking(p,'freezer')?'12':'6'):'none'} portions · prevents hunger. +${offer.units} happiness on first food purchase this week.`,0,this.classicFoodPrice(offer.units),p.groceries+offer.units<=this.classicFoodCapacity(p),'Fridge or freezer capacity exceeded');
        if(at==='cinema')push('classicNewspaper','Read the weekly newspaper',this.bulletin,1,1);
        if(at==='cinema')push('classicLottery','Buy 10 lottery tickets','Original-style $10 bundle; lottery results settle next week.',0,10);
      }else{
      for(const offer of D.clothingOffers.market)push(`clothes:${offer.id}:market`,`Budget ${D.clothing[offer.id].name.toLowerCase()}`,`Add ${offer.weeks} weeks of clothing. All outfits age weekly, even if unworn.`,1,this.price(offer.cost,'retail'));
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
    if(this.jobs.some(j=>this.jobWorkplace(j).place===at)){
      const j=this.getJob(p);
      if(j&&this.jobWorkplace(j).place===at){
        const shiftHours=this.classicShiftHours(p),quote=this.isClassic?this.classicWorkQuote(p,shiftHours):null,income=quote?quote.gross:this.shiftPay(p);
        const standing=this.isClassic?this.classicWorkStanding(p):'ready';
        const workNotice=standing==='dismissal'?'CAUTION: attempting to work will cause dismissal for low reliability.':standing==='warning'?'First attempt triggers a reliability warning; no time or wages are spent.':quote?.garnished?`${money(quote.net)} net after ${money(quote.garnished)} toward rent arrears${quote.fee?` and ${money(quote.fee)} fee`:''}. Garnishment formula provisional.`:'';
        const neededEnergy=this.isClassic?Math.max(2,Math.ceil(12*shiftHours/6)):12;
        push('work',`Work at ${this.jobWorkplace(j).label} · ${money(income)}`,`${j.name} · ${this.isClassic&&shiftHours<6?`Partial shift · ${shiftHours}h remaining · ${money(income)} proportional pay.`:'6 hours on the clock, paid as an 8-hour shift.'} ${workNotice} Requires ${D.clothing[j.clothes].name} or better; current wardrobe is ${this.clothingSummary(p).filter(x=>x.weeks>0).map(x=>x.name+' '+x.weeks+'w').join(', ')||'empty'}.`,shiftHours,0,shiftHours>0&&p.energy>=neededEnergy&&this.isDressedFor(p,j),p.energy<neededEnergy?'Exhausted. Rest first.':`Uniform required: ${D.clothing[j.clothes].name} or better; visit Fresh & Frugal or Thread Theory. All clothing expires by week.`);
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
        if(p.home==='studio')push('classicMove:apartment','Rent Le Security Apartments',`Protected residence · monthly rent $332 at a neutral economy. Moving costs 3h and the first month of rent.`,3,this.price(332,'housing'));
        else push('classicMove:studio','Move back to Low-Cost Housing',`Cheaper monthly rent $325 at a neutral economy. 3 hours to arrange the move.`,3,this.price(325,'housing'));
        const open=this.rentServicesOpen(p);
        push('classicPayRent','Pay one month of rent',`$${p.classicRent} cash only · next due week ${p.classicRentDueWeek}. ${open?'Rent Office is open.':'Office opens when rent is due.'}`,1,p.classicRent,open,'Rent Office closed outside rent week / extension');
        if(p.rentDebt>0)push('classicClearArrears','Clear rent arrears',`Pay ${money(p.rentDebt)} in cash, stopping future wage garnishment.`,1,p.rentDebt,open,'Office closed');
        push('classicRentExtension','Request a one-week extension',`Chance: ${p.classicEverDebt?'0':p.classicExtensions===0?100:p.classicExtensions===1?75:p.classicExtensions===2?50:25}%. One request per week.`,1,0,open&&!p.classicEverDebt&&p.classicExtensionAttemptWeek!==this.week,p.classicEverDebt?'Already incurred rent debt; extensions unavailable.':p.classicExtensionAttemptWeek===this.week?'Already requested this week':'Available only when rent is due');
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
      if(this.isClassic)for(const id of ['fridge','freezer','computer','vcr','stereo'])if(p.owned.includes(id)&&p.classicEquipment?.[id]?.broken){
        push('classicRepair:'+id,`Repair ${PAWN_NAMES[id]}`,`Restore appliance function; costs 20% of its reference price.`,2,Math.ceil(PAWN_VALUES[id]*.20));
      }
      push('buy:fridge','Buy a refrigerator','Keep bulk groceries fresh across weeks.',2,this.price(255,'retail'),!p.owned.includes('fridge'),'Already owned');
      if(this.isClassic)push('buy:freezer','Buy a freezer', 'Expands fresh-food capacity from six to twelve portions. Requires a fridge.',2,this.price(330,'retail'),p.owned.includes('fridge')&&!p.owned.includes('freezer'),!p.owned.includes('fridge')?'Buy a refrigerator first':'Already owned');
      push('buy:computer','Get a home computer','Better side gigs and occasional online income.',2,this.price(590,'retail'),!p.owned.includes('computer'),'Already owned');
    }
    if(at==='cinema'&&!this.isClassic){
      push('movie','See a movie','A little escapism. +18 happiness.',3,this.price(42,'leisure'));
      push('pass','Plan a fun weekend','A lovely experience waiting after the week. +13 happiness.',2,this.price(55,'leisure'),!p.weekendPass,'Already planned');
    }
    if(at==='clinic'&&!this.isClassic)push('checkup','Take care of yourself','Restore +42 energy and recover from hunger.',3,this.price(65,'health'),p.energy<95||p.hunger>0,'Feeling healthy');
    if(this.isClassic&&(at==='market'||at==='cinema'))for(const a of t){
      a.department=at==='market'?'Z-Mart Discount':'Black’s Market';
    }
    return t;
  }
  act(id){
    if(this.winner)return {ok:false,message:'The race is over. Start a new game to play again.'};
    if(this.pendingEncounter)return {ok:false,message:'Choose an answer before doing anything else.'};
    const p=this.player;
    const a=this.actions().find(x=>x.id===id);
    if(!a)return {ok:false,message:'That action is not available here.'};
    if(!a.enabled)return {ok:false,message:a.reason||'Action is unavailable.'};
    // Count successfully selected venue interactions, including an attempted work
    // shift that immediately ends in dismissal; never count navigation or blocked taps.
    if(this.isClassic)p.classicChoicesThisWeek=(p.classicChoicesThisWeek||0)+1;
    if(id==='work'&&this.isClassic){
      const job=this.getJob(p),req=this.jobRequirement(job);
      const standing=this.classicWorkStanding(p);
      if(standing==='dismissal'){
        p.job=null;p.wage=0;p.workSessions=0;p.classicWorkHourCredit=0;p.classicWageRemainder=0;p.classicRaises=0;
        p.classicDismissals=(p.classicDismissals||0)+1;p.happiness=clamp(p.happiness-8,0,100);
        const message=`Dismissed from ${job.name}: reliability fell below ${Math.max(0,req.dependability-5)}. Reapply after improving your record.`;
        this.log(message,'warn',p.id);this.milestone(p,message);this.checkWin();return {ok:true,message};
      }
      if(standing==='warning'){
        p.classicWorkWarningWeek=this.week;
        const message=`${job.name} warned ${p.name}: reliability ${p.dependability} is below the employer's safe threshold (${Math.max(0,req.dependability-2)}). This warning uses no clock time and pays no wages; the next eligible work attempt may proceed.`;
        this.log(message,'warn',p.id);return {ok:true,message};
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
      case 'relax':{
        const rest=this.isClassic?ClassicHousehold.restQuote(p):null;
        const bonus=rest?.home.comfortBonus||0;
        p.happiness=clamp(p.happiness+16+bonus,0,100);p.energy=clamp(p.energy+24,0,100);
        if(this.isClassic)p.classicRelaxation=clamp(p.classicRelaxation+rest.relaxation,10,30); // Gameplay adapter; DOS recovery formula not verified
        msg=`You took a well-earned break${bonus?` with your home entertainment (+${bonus} comfort)`:''}. Life feels lighter.`;break;
      }
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
          if(missing.length){p.happiness=clamp(p.happiness-1,0,100);msg='Application rejected for '+this.jobWorkplace(job).label+' '+job.name+': '+missing.join(', ')+'. Four hours spent.';break;}
          if(p.classicRejectedOpenings[arg]===this.week||!this.classicHiringRoll(p,job)){
            p.classicRejectedOpenings[arg]=this.week;p.classicJobSearchFailures=(p.classicJobSearchFailures||0)+1;p.happiness=clamp(p.happiness-1,0,100);
            msg='No openings for '+this.jobWorkplace(job).label+' '+job.name+' this week. Try another role or return next week.';break;
          }
        }
        p.job=job.id;p.workSessions=0;p.classicWorkHourCredit=0;p.classicWageRemainder=0;p.wage=this.offeredWage(job);
        if(this.isClassic){p.experience+=2;p.dependability=Math.max(10,p.dependability);p.classicRaises=0;p.classicUnemployedWeeks=0;p.classicJobSearchFailures=0;}
        if(this.isClassic)p.happiness=clamp(p.happiness+3,0,100);
        else if(!prior||job.tier>oldTier)p.happiness=clamp(p.happiness+4,0,100);
        msg=prior?`Job changed: left ${prior.name} at ${this.jobWorkplace(prior).label}. Now ${job.name} at ${this.jobWorkplace(job).label}, earning ${money(p.wage)}/hour. Your previous job is no longer available.`:`Hired! ${p.name} is now a ${job.name} at ${this.jobWorkplace(job).label}, earning ${money(p.wage)}/hour.`;break;
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
      case 'classicDiscount':{
        if(!this.isClassic||p.location!=='market')throw Error('Only the Classic Z-Mart counter sells this merchandise');
        const item=D.classicDiscountGoods[arg];
        if(!item||!this.classicDiscountStock().goods.includes(arg))throw Error('Z-Mart stock changed');
        if(item.kind==='ticket'){
          if(p.classicWeekendTicket)throw Error('A weekend ticket is already booked');
          p.classicWeekendTicket=arg;
          msg=`Bought a ${item.name} at Z-Mart. The outing is scheduled for this weekend.`;
        }else{
          if(p.owned.includes(arg))throw Error('Already own this item');
          p.owned.push(arg);this.setEquipment(p,arg,'discount');
          msg=`Bought ${item.name} at Z-Mart Discount. It is now among your possessions.`;
        }
        break;
      }
      case 'groceries':p.groceries++;msg='Groceries bought. You can cook at home or they will be used at the weekend.';break;
      case 'bulkFood':p.groceries+=3;msg='Your fridge is ready for several weeks of meals.';break;
      case 'lottery':p.lottery++;msg='Ticket bought! The draw is on Sunday.';break;
      case 'meal':p.fed=true;p.happiness=clamp(p.happiness+7,0,100);p.energy=clamp(p.energy+8,0,100);msg='A warm meal and a moment to breathe.';break;
      case 'clothes':{
        const offer=D.clothingOffers[p.location]?.find(x=>x.id===arg);
        if(this.isClassic&&p.location==='market'&&!this.classicDiscountStock().clothing.includes(arg))throw Error('Z-Mart outfit is out of stock');
        // Guard against corrupted/forged action metadata.
        if(!offer||id!==`clothes:${arg}:${p.location}`)throw Error('Invalid outfit purchase');
        p.clothing[arg]=Math.min(260,this.clothingWeeks(p,arg)+offer.weeks);
        if(p.location==='boutique'&&arg!=='casual')p.happiness=clamp(p.happiness+(arg==='business'?7:4),0,100);
        msg=`Purchased ${D.clothing[arg].name.toLowerCase()}${p.location==='market'&&this.isClassic?' at Z-Mart':''}: +${offer.weeks} weeks (now ${p.clothing[arg]} weeks).`;
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
        const classicQuote=this.isClassic?this.classicWorkQuote(p,shiftHours):null;
        const income=classicQuote?classicQuote.gross:this.shiftPay(p);
        // DOS rounds down each shift's partial gross; do not carry fractions.
        if(this.isClassic)p.classicWageRemainder=0;
        const garnishment=classicQuote?classicQuote.garnished:(p.rentDebt>0?Math.min(p.rentDebt,Math.floor(income*.25)):0);
        const interest=classicQuote?classicQuote.fee:0;
        if(classicQuote){
          const settlement=ClassicTime.settlePaycheck(p.cash,p.rentDebt,classicQuote);
          p.cash=settlement.cashAfter;p.rentDebt=settlement.rentDebtAfter;
          p.classicPaycheckHistory.push({week:this.week,jobId:j.id,shiftUnits:shiftHours,
            fullGross:classicQuote.fullGross,...settlement});
          if(p.classicPaycheckHistory.length>16)p.classicPaycheckHistory.shift();
        }else{p.cash+=income-garnishment-interest;p.rentDebt-=garnishment;}
        if(this.isClassic){
          // n108.sc grants one progression step for EACH successful work action,
          // even when late in the turn; it does not pool six partial shifts.
          const completed=ClassicTime.workProgress(shiftHours);
          p.classicWorkHourCredit=0; // discard old approximation on next work
          p.workSessions+=completed;
          if(completed){
            const caps=this.classicWorkCaps(p,j);
            p.experience=Math.min(caps.experience,p.experience+completed);
            p.dependability=Math.min(caps.dependability,p.dependability+completed);
          }
        }else{p.workSessions++;p.experience+=this.rules.workExperience;p.dependability=clamp(p.dependability+this.rules.workDependability,0,100);}
        const energyCost=this.isClassic?Math.ceil(13*shiftHours/6):13;
        p.energy=clamp(p.energy-energyCost,0,100);p.happiness=clamp(p.happiness-(this.isClassic&&shiftHours<6?1:2),0,100);
        msg=`Worked ${shiftHours}h at ${this.jobWorkplace(j).label}: +${money(income-garnishment-interest)}${garnishment?` (${money(garnishment)} paid toward back rent${interest?`, $${interest} fee`:''})`:''}.`;
        if(this.isClassic&&shiftHours<6)msg+=` Partial shift (${money(income)} gross), with one successful-work progression credit.`;
        if(this.isClassic&&garnishment)msg+=' Garnishment and fee calculation remains provisional pending DOS paycheck traces.';
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
        const roll=p.classicExtensions===0?1:1+Math.floor(this.rand()*12);
        const approved=Pass2.extensionApproved(p.classicExtensions,roll);
        if(approved){p.classicRentDueWeek=this.week+1;p.classicExtensions++;msg=`One-week rent extension approved. Deadline: week ${p.classicRentDueWeek}.`;}
        else{p.happiness=clamp(p.happiness-1,0,100);msg='Rent extension refused. Pay this week or the account falls into arrears.';}
        this.classicEvent(p,'rent-extension',msg,{roll,approved});
        break;
      }
      case 'classicMove':{
        if(!this.isClassic||p.location!=='housing'||!['studio','apartment'].includes(arg))throw Error('Invalid Classic apartment');
        p.home=arg;p.classicRent=arg==='studio'?325:332;
        p.happiness=clamp(p.happiness+(arg==='apartment'?8:0),0,100);
        msg=`Moved to ${arg==='studio'?'Low-Cost Housing':'Le Security Apartments'}. New rent: ${money(p.classicRent)} per month.`;break;
      }
      case 'classicRepair':{
        if(!this.isClassic||p.location!=='tech'||!p.owned.includes(arg)||!p.classicEquipment?.[arg]?.broken)throw Error('Cannot repair this appliance');
        p.classicEquipment[arg].broken=false;msg=`Repaired ${PAWN_NAMES[arg]} at Socket City.`;break;
      }
      case 'classicPawn':{
        if(!this.pawnEligible(p,arg)||this.classicPawnLots.length>=64)throw Error('Item cannot be pawned');
        const id='pawn-'+(++this.classicPawnSequence);
        p.owned.splice(p.owned.indexOf(arg),1);delete p.classicEquipment[arg];
        const payout=pawnLoan(arg);
        this.classicPawnLots.push({id,ownerId:p.id,item:arg,payout,redemption:pawnRedemption(arg),dueWeek:this.week+2});
        p.cash+=payout;
        msg=`Pawned ${PAWN_NAMES[arg]} for ${money(payout)}. Redeem for ${money(pawnRedemption(arg))} through week ${this.week+2}.`;
        break;
      }
      case 'classicRedeem':{
        const lot=this.pawnLot(arg);
        if(!lot||lot.ownerId!==p.id||this.week>lot.dueWeek||p.owned.includes(lot.item))throw Error('Pawn redemption unavailable');
        p.owned.push(lot.item);this.setEquipment(p,lot.item,'pawn');
        this.classicPawnLots=this.classicPawnLots.filter(x=>x.id!==lot.id);
        msg=`Redeemed your ${PAWN_NAMES[lot.item]}.`;break;
      }
      case 'classicBuyPawn':{
        const lot=this.pawnLot(arg);
        if(!lot||lot.ownerId===p.id||this.week<=lot.dueWeek||p.owned.includes(lot.item)||(lot.item==='freezer'&&!p.owned.includes('fridge')))throw Error('Unclaimed pawned item unavailable');
        p.owned.push(lot.item);this.setEquipment(p,lot.item,'pawn');
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
      case 'buy':p.owned.push(arg);this.setEquipment(p,arg,'specialty');p.happiness=clamp(p.happiness+(arg==='formal'?7:arg==='casual'?4:5),0,100);msg=`Purchased ${arg}. A new door just opened.`;break;
      case 'movie':p.happiness=clamp(p.happiness+18,0,100);p.energy=clamp(p.energy+4,0,100);msg='Great movie. No spoilers, just good vibes.';break;
      case 'pass':p.weekendPass=true;msg='Weekend adventure booked. Something to look forward to!';break;
      case 'checkup':p.energy=clamp(p.energy+42,0,100);p.hunger=0;p.happiness=clamp(p.happiness+5,0,100);msg='Feeling restored. You can face the week again.';break;
      default:return {ok:false,message:'Not implemented.'};
    }
    const robbery=this.classicCrimeAfterAction(p,p.location);
    if(robbery)msg+=' '+robbery;
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
    const foodBeforeMeal=p.groceries;
    const hadMeal=p.fed;
    if(!p.fed){
      if(p.groceries>0){p.groceries--;if(this.isClassic)p.hunger=Math.max(0,p.hunger-1);parts.push('A pantry meal kept hunger away.');}
      else {p.hunger=clamp(p.hunger+1,0,4);p.happiness=clamp(p.happiness-8,0,100);parts.push('You went hungry. Next week will be harder.');}
    }else p.hunger=Math.max(0,p.hunger-1);
    if(this.isClassic){
      const shortage=ClassicWeekly.foodShortageTrace(hadMeal,foodBeforeMeal,p.groceries,p.hunger);
      if(shortage.shortage)this.classicEvent(p,'food-shortage','No meal or pantry portion; hunger increased',shortage);
      const foodBefore=p.groceries,fridge=this.ownsWorking(p,'fridge'),freezer=this.ownsWorking(p,'freezer');
      const capacity=this.classicFoodCapacity(p);
      if(p.groceries>capacity){p.groceries=capacity;parts.push('Extra food spoiled beyond storage capacity.');}
      if(!fridge&&p.groceries>0){
        // State 10 confirms a spoilage risk, but the original probability is not
        // yet recovered. Keep the existing guaranteed-spoilage compatibility rule;
        // do not charge a medical fee that does not appear in the source evidence.
        p.groceries=0;
        parts.push('Unrefrigerated food spoiled (provisional chance).');
      }
      const storage=ClassicWeekly.foodStorageTrace(foodBefore,p.groceries,fridge,freezer);
      if(storage.lost)this.classicEvent(p,'food-storage',`Lost ${storage.lost} food portions during storage check`,storage);
    }else if(!this.ownsWorking(p,'fridge')&&p.groceries>0){p.groceries=0;parts.push('Unused fresh groceries spoiled without a fridge.');}
    if(p.classicWeekendTicket&&this.isClassic){
      const outings={baseball:['You cheered at the baseball game.',5],concert:['Live music made for a memorable weekend.',7],theater:['An evening at the theater lifted your spirits.',6]};
      const event=outings[p.classicWeekendTicket];
      if(event){p.happiness=clamp(p.happiness+event[1],0,100);parts.push(event[0]+' Your ticket was used.');}
      p.classicWeekendTicket=null;
    }
    if(p.weekendPass){p.happiness=clamp(p.happiness+13,0,100);parts.push('An amazing weekend adventure lifted your spirits.');p.weekendPass=false;}
    if(p.lottery){
      if(this.isClassic){
        const tickets=p.lottery,roll=Math.floor(this.rand()*501),prize=Pass2.lotteryPrize(tickets,roll);
        p.cash+=prize;p.lottery=0;
        this.classicEvent(p,'lottery',prize?`Won ${money(prize)} with ${tickets} tickets`:`No win with ${tickets} tickets`,{sourceState:ClassicWeekly.SOURCE_STATES.lottery,tickets,roll,prize});
        parts.push(prize?`Lottery win: ${money(prize)}! (${tickets} tickets, roll ${roll}/500).`:`Lottery: ${tickets} tickets did not win (roll ${roll}/500).`);
      }else{
        for(let n=0;n<p.lottery;n++)if(this.rand()<.10){const win=this.rand()<.10?450:95;p.cash+=win;parts.push(`Lottery winner! You collected ${money(win)}.`);}
        p.lottery=0;
      }
    }
    if(this.isClassic){
      // startTrn.sc state 4: appliance 29, one-in-seven chance, $20–$100 CASH.
      // This replaces the prototype's one-in-three fixed BANK deposit.
      // Broken or pawned appliances cannot perform new work in the compatibility economy.
      const bonus=ClassicWeekly.computerBonus(ClassicHousehold.inspect(p).computer,()=>this.rand());
      if(bonus.awarded){p.cash+=bonus.awarded;parts.push(`Computer project earned ${money(bonus.awarded)}.`);
        this.classicEvent(p,'computer-bonus',`Owned computer earned ${money(bonus.awarded)}`,
          {sourceState:bonus.sourceState,amount:bonus.awarded});}
    }else if(this.ownsWorking(p,'computer')&&this.rand()<.33){p.bank+=40;parts.push('Your tiny digital project earned $40.');}
    if(p.cash>25){
      const events=[{text:'A friend invited you for coffee.',cash:12,happy:4},{text:'Your favorite band played downtown.',cash:26,happy:7},
        {text:'You picked up a hobby.',cash:18,happy:5},{text:'A surprise subscription renewed.',cash:15,happy:-2},
        {text:'You found a quiet afternoon in the park.',cash:0,happy:7}];
      const event=events[Math.floor(this.rand()*events.length)];const cost=Math.min(p.cash,event.cash);
      p.cash-=cost;p.happiness=clamp(p.happiness+event.happy,0,100);
      parts.push(`${event.text}${cost?` -${money(cost)}`:''}`);
    }
    if(!this.isClassic&&p.home==='studio'&&this.rand()<.08&&p.owned.length>0){
      const eligible=p.owned.filter(x=>['fridge','computer'].includes(x));
      if(eligible.length){const item=eligible[Math.floor(this.rand()*eligible.length)];p.owned=p.owned.filter(x=>x!==item);parts.push(`A break-in took your ${item}. Better security may help.`);}
    }
    return parts;
  }
  classicTurnEvent(phase,playerId='system',amount=0){
    if(this.isClassic)this.classicTurnJournal=ClassicTurn.append(this.classicTurnJournal,{week:this.week,phase,playerId,amount});
  }
  classicCloseTurn(p){
    if(!this.isClassic)return;
    const close=ClassicTurn.closeTurn(this.week,p.dependability,p.classicLastClosedWeek);
    if(!close.applied)return;
    p.dependability=close.after;
    p.classicLastClosedWeek=close.lastClosedWeek;
    this.classicTurnEvent('turn-close',p.id,close.decay);
  }
  newWeek() {
    this.week++;
    if(this.isClassic){
      // One seeded economy update per whole player cycle. Keep the Pass-2
      // goods-index alias for old saves, price quotes, and scenario tooling.
      this.classicEconomicIndices.readings.goods=this.classicGoodsIndex;
      const before=this.classicEconomicIndices.readings;
      const update=ClassicEconomy.advance(this.classicEconomicIndices,()=>this.rand());
      this.classicEconomicIndices=update.state;
      this.classicGoodsIndex=update.state.readings.goods;
      const pulse=ClassicEvents.advance(this.classicEconomicPulse,update.state.readings.general,update.changes.general,this.week,()=>this.rand());
      this.classicEconomicPulse=pulse.state;
      if(pulse.phaseChanged){
        const headline={downturn:'Economic downturn: hiring and spending look uncertain.',recovery:'Signs of economic recovery emerge.',boom:'A buoyant economy lifts market confidence.',stable:'The Classic economy steadies.'}[pulse.state.phase];
        this.classicEvent(null,'economic-headline',headline,{phase:pulse.state.phase});
        this.log(headline,pulse.state.phase==='downturn'?'warn':'news','system');
        // DOS: economic headline affects happiness, exact magnitude and
        // investment multiplier still pending emulator traces.
        if(pulse.state.phase==='recovery'||pulse.state.phase==='boom')for(const person of this.players){
          const invested=this.classicStockValue(person)>0;
          person.happiness=clamp(person.happiness+(invested?3:2),0,100);
        }
      }
      if(pulse.strength){
        this.classicEvent(null,'economic-crisis',`Economic crisis strength ${pulse.strength}`,{strength:pulse.strength});
        this.classicApplyScandal(pulse.strength);
      }
      this.classicEvent(null,'economic-indices',`Markets: economy ${before.general} -> ${update.state.readings.general}; goods ${before.goods} -> ${this.classicGoodsIndex}`,
        {beforeGeneral:before.general,readingGeneral:update.state.readings.general,beforeGoods:before.goods,readingGoods:this.classicGoodsIndex});
      // Instruments share the same index graph. Price ratios preserve the
      // current holdings/quotes when a v0.5.29 save first migrates.
      for(const stock of D.classicStocks){
        if(stock.id==='tbills')continue;
        this.classicStockPrices[stock.id]=ClassicEconomy.marketPrice(this.classicStockPrices[stock.id],before[stock.id],update.state.readings[stock.id],stock.base);
      }
    }
    this.classicTurnEvent('economy');
    this.bulletin=D.headlines[(this.week-1)%D.headlines.length];
    if(this.week%4===1){
      const old=this.economy;if(!this.isClassic)this.economy=clamp(Math.round((old+(this.rand()-.46)*.12)*100)/100,.84,1.24);
      const choices=D.cityEvents.filter(e=>e.id!==this.cityEventId);
      this.cityEventId=choices[Math.floor(this.rand()*choices.length)].id;
      this.cityEventStart=this.week;
      if(!this.isClassic)this.log(`CITY PULSE: ${this.cityEvent.title}. ${this.cityEvent.description}`,'news','system');
      if(!this.isClassic)this.log(`New month. The local economy is ${this.economy>old?'heating up':this.economy<old?'cooling off':'holding steady'} (${Math.round(this.economy*100)}%).`,'news','system');
    }
    for(const p of this.players){
      if(this.isClassic){
        const relaxation=ClassicWeekly.relaxationStep(p.classicRelaxation,false);
        p.classicRelaxation=relaxation.after;
        // Keep state 6 independently visible without duplicating housing/theft RNG.
        this.classicEvent(p,'relaxation',`Relaxation ${relaxation.before} -> ${relaxation.after}`,relaxation);
      }
      if(this.isClassic)p.classicUnemployedWeeks=p.job?0:Math.min(10000,(p.classicUnemployedWeeks||0)+1);
      // Original-inspired weekly wardrobe wear; each garment ages regardless of what was worn.
      for(const garment of Object.keys(D.clothing)){
        const old=this.clothingWeeks(p,garment);
        p.clothing[garment]=Math.max(0,old-1);
        if(this.isClassic){
          const wear=ClassicWeekly.clothingWarning(old,p.clothing[garment]);
          if(wear.oneWeekRemaining||wear.expired)
            this.classicEvent(p,'clothing-warning',`${D.clothing[garment].name}: ${wear.expired?'expired':'one week remaining'}`,
              {sourceState:wear.sourceState,garment,weeks:p.clothing[garment],expired:wear.expired});
        }
        if(old>1&&p.clothing[garment]===1)this.log(`${p.name}'s ${D.clothing[garment].name.toLowerCase()} have one week left.`, 'warn',p.id);
        if(old===1)this.log(`${p.name}'s ${D.clothing[garment].name.toLowerCase()} have worn out. Buy a replacement before working.`, 'warn',p.id);
      }
      const beforeWeekend=this.accounts(p);
      if(this.isClassic)this.syncClassicInvested(p);
      const notes=this.weekend(p);
      if(this.isClassic){this.classicEquipmentBreakage(p,notes);this.classicBurglar(p,notes);}
      this.classicTurnEvent('living',p.id);
      this.recordChange(p,beforeWeekend,'Weekend living expenses and windfalls','living');
      if(this.isClassic)this.classicEmergencyRelief(p,notes);
      if(this.isClassic){
        // Rent becomes due at the end of week 4, 8, 12...; a granted extension shifts just this deadline.
        const assessment=ClassicTurn.rentAssessment(this.week,p.classicRentDueWeek,p.classicRent,p.classicLastRentChargeWeek);
        if(assessment.due){
          const beforeRent=this.accounts(p);
          p.rentDebt+=assessment.charge;p.classicRentDueWeek=assessment.nextDueWeek;
          p.classicLastRentChargeWeek=assessment.lastChargedWeek;p.classicEverDebt=true;
          p.happiness=clamp(p.happiness-7,0,100);
          notes.push(`${money(assessment.charge)} unpaid rent became debt. Future wages may be garnished.`);
          this.recordChange(p,beforeRent,'Unpaid Classic rent','housing');
        }
        this.classicTurnEvent('rent',p.id,assessment.charge);
      }
      if(this.isClassic){
        const loan=ClassicWeekly.loanDueTrace(this.week,p.classicLoanPaidThrough,p.debt);
        if(loan.due){
          if(loan.missed){p.classicLoanDefaults++;p.happiness=clamp(p.happiness-3,0,100);notes.push('Bank loan payment missed: -3 happiness and worse future credit.');}
          this.classicEvent(p,'loan-due',loan.missed?'Loan payment missed':'Loan schedule covered',loan);
        }
      }
      this.classicTurnEvent('loan',p.id);
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
      if(!this.isClassic)p.dependability=clamp(p.dependability-this.rules.dependabilityDecay,0,100);
      p.fed=false;p.weekActions=0;p.classicChoicesThisWeek=0;
      this.classicTurnEvent('reset',p.id);
      this.recordHistory(p);
      if(notes.length)this.log(`${p.name}: ${notes.join(' ')}`,p.hunger>0?'warn':'news',p.id);
    }
    this.classicTurnEvent('week-ready');
    this.log(`It's week ${this.week}. ${this.rules.hours} possible hours, infinite ways to spend them.`,'good','system');
    this.checkWin();
  }
  endTurn(){
    if(this.pendingEncounter)return {ok:false,message:'Finish the conversation before ending your week.'};
    if(this.winner)return {ok:false,message:'The game has ended.'};
    const endingPlayer=this.player,who=endingPlayer.name;
    this.classicCloseTurn(endingPlayer);
    this.active++;
    if(this.active>=this.players.length){this.active=0;this.newWeek();}
    this.log(`${who} finished their week.`,'muted','system');
    // Keep the human turn visible and simulate any intervening AI turns immediately.
    let guard=0;
    while(this.player.isAI&&!this.winner&&guard++<this.players.length){
      const rival=this.player;
      this.runAI();this.classicCloseTurn(rival);
      this.active++;if(this.active>=this.players.length){this.active=0;this.newWeek();}
    }
    return {ok:true,message:`A new turn begins: ${this.player.name}.`};
  }
  // Classic opponent routing uses the same original marble indices as the human.
  // Evaluate a sequence of stops without mutating the world or spending random numbers.
  classicItinerary(origin,stops,hours=this.rules.hours){
    if(!this.isClassic)throw Error('Original itinerary is Classic-only');
    if(!this.getPlace(origin)||stops.some(id=>!this.getPlace(id)))throw Error('Unknown original stop');
    let from=origin,steps=0,travelHours=0,estimatedTicks=0;
    for(const to of stops){
      const leg=classicRouteGraph.plan(from,to);steps+=leg.steps;travelHours+=this.travelCost(from,to);
      estimatedTicks+=ClassicTime.originalTravelTicks(leg.steps);from=to;
    }
    return {stops:stops.slice(),steps,travelHours,estimatedTicks,feasible:travelHours<=hours};
  }
  classicBestItinerary(origin,stops,hours=this.rules.hours){
    if(stops.length>3)throw Error('Classic opponent only plans up to three stops');
    const permutations=list=>list.length<2?[list]:list.flatMap((value,i)=>permutations(list.filter((_,j)=>j!==i)).map(other=>[value,...other]));
    const plans=permutations([...new Set(stops)]).map(sequence=>this.classicItinerary(origin,sequence,hours));
    return plans.filter(p=>p.feasible).sort((a,b)=>a.estimatedTicks-b.estimatedTicks||a.travelHours-b.travelHours||a.steps-b.steps||a.stops.join('|').localeCompare(b.stops.join('|')))[0]||null;
  }
  // Non-mutating two-week survival ledger. Time and bank accessibility are
  // modelled separately: the Classic bank only withdraws in $100 portions.
  // Food without a working fridge must be bought just in time; longer-horizon
  // supplies are forecast costs, not imaginary stored groceries.
  classicSurvivalBudget(p=this.player){
    if(!this.isClassic)throw Error('Classic survival budget unavailable in Modern');
    const job=this.getJob(p);
    const remainingUntilRent=Math.max(0,p.classicRentDueWeek-this.week);
    const foodNeeded=!p.fed&&p.groceries<=0;
    const foodReserve=foodNeeded?this.classicFoodPrice(1):0;
    const rentDue=this.rentServicesOpen(p);
    const rentReserve=rentDue?p.classicRent:Math.min(p.classicRent,Math.ceil(p.classicRent*.1*Math.max(1,4-remainingUntilRent)));
    const outfit=job&&this.clothingSummary(p).filter(x=>D.clothing[x.id].rank>=D.clothing[job.clothes].rank).every(x=>x.weeks<=2)
      ?this.cheapestClothingOffer(job):null;
    const uniformReserve=outfit?this.price(outfit.cost,'retail'):0;
    const withdrawable=Math.floor(p.bank/100)*100;
    const liquidity=p.cash+withdrawable;
    const downturnBuffer=this.classicEconomicPulse.phase==='downturn'?this.classicFoodPrice(1):0;
    const reserve=foodReserve+rentReserve+uniformReserve+downturnBuffer;
    const rentBill=rentDue?p.classicRent:0;
    const immediateBills=foodReserve+rentBill+uniformReserve;
    // Calendar projection: food required on the next two weekends, using at
    // most what is already in the pantry and assuming no new fridge purchase.
    const storedFood=this.ownsWorking(p,'fridge')?p.groceries:Math.min(1,p.groceries);
    const neededFood=Math.max(0,2-storedFood-(p.fed?1:0));
    // Advisory projection only. Source-derived prices; trend drift remains a
    // compatibility model. Do not substitute projected prices for shop quotes.
    const expectedGoodsIndex=clamp(this.classicGoodsIndex+this.classicEconomicIndices.momentum.goods*2,10,190);
    const projectedFoodUnit=Pass2.goodsPrice(55,expectedGoodsIndex);
    const twoWeekFood=neededFood*Math.max(this.classicFoodPrice(1),projectedFoodUnit);
    const twoWeekRent=(remainingUntilRent<=2?p.classicRent:0)+p.rentDebt;
    const twoWeekNeeds=twoWeekFood+twoWeekRent+uniformReserve+downturnBuffer;
    // Contracted wages, not a newly advertised market wage. For arrears,
    // model two successive net settlements WITHOUT touching the real player.
    let projectedShiftGross=0,projectedShiftIncome=0,projectedTwoShiftTakeHome=0;
    if(job&&this.isDressedFor(p,job)){
      const first=ClassicTime.paycheck(p.wage,6,p.rentDebt);
      const second=ClassicTime.paycheck(p.wage,6,first.arrearsAfter);
      projectedShiftGross=first.gross;projectedShiftIncome=first.net;
      projectedTwoShiftTakeHome=first.net+second.net;
    }
    return {foodNeeded,foodReserve,rentDue,rentReserve,uniformReserve,downturnBuffer,reserve,immediateBills,
      liquidity,withdrawable,cashShortfall:Math.max(0,immediateBills-p.cash),
      twoWeekFood,twoWeekRent,twoWeekNeeds,expectedGoodsIndex,projectedFoodUnit,projectedShiftGross,projectedShiftIncome,projectedTwoShiftTakeHome,
      projectedGap:Math.max(0,twoWeekNeeds-liquidity),projectedGapAfterWork:Math.max(0,twoWeekNeeds-liquidity-projectedTwoShiftTakeHome),remainingUntilRent};
  }
  // Debt clearance must not consume this week's food, due rent or earning
  // capacity. This is a compatibility safety policy, NOT a recovered SCI rule.
  classicCanClearArrears(p=this.player){
    if(!this.isClassic||p.rentDebt<=0||!this.rentServicesOpen(p))return false;
    const budget=this.classicSurvivalBudget(p);
    const protectedCash=budget.foodReserve+(budget.rentDue?p.classicRent:0)+budget.uniformReserve+budget.downturnBuffer;
    return p.cash>=p.rentDebt+protectedCash;
  }
  // All eleven DOS degrees are reachable via their original prerequisite IDs.
  // Rank currently available studies by real jobs they can unlock (or move
  // closer to), not by the arbitrary ordering of the university UI.
  classicCareerPlan(p=this.player){
    if(!this.isClassic)throw Error('Classic career plan unavailable in Modern');
    const current=this.getJob(p),baseWage=current?p.wage:0;
    const available=D.classicDegrees.filter(d=>!p.classicDegrees.includes(d.id)&&this.classicDegreeAvailable(p,d));
    const courses=available.map(degree=>{
      const candidates=this.jobs.filter(j=>j.degrees.includes(degree.id)).map(job=>{
        const missing=job.degrees.filter(id=>id!==degree.id&&!p.classicDegrees.includes(id)).length;
        const expGap=Math.max(0,job.experience-p.experience);
        const reliabilityGap=Math.max(0,job.dependability-p.dependability);
        const uplift=Math.max(0,this.offeredWage(job)-baseWage);
        const route=classicRouteGraph.plan('university',job.place);
        const score=uplift/(1+missing*2+expGap/20+reliabilityGap/20)-route.steps*.02;
        return {jobId:job.id,jobNum:job.originalJobNum,otherDegrees:missing,
          experienceGap:expGap,dependabilityGap:reliabilityGap,
          wageUplift:uplift,score:Number(score.toFixed(3))};
      }).sort((a,b)=>b.score-a.score||a.jobNum-b.jobNum);
      // A course can also be a prerequisite for another course in a longer job track.
      const later=D.classicDegrees.filter(d=>d.requires.includes(degree.id)&&!p.classicDegrees.includes(d.id)).length;
      return {degreeId:degree.id,originalDegreeId:degree.originalDegreeId,
        expectedScore:Number(((candidates[0]?.score||0)+later*2).toFixed(3)),
        unlocks:candidates};
    }).sort((a,b)=>b.expectedScore-a.expectedScore||a.originalDegreeId-b.originalDegreeId);
    return {courses,recommendedDegree:courses[0]?D.classicDegrees.find(d=>d.id===courses[0].degreeId):null};
  }
  // Long-unemployment recovery uses the legitimate original Cook opening before
  // speculative promotions. Original job 44 is exempt only from the hiring DICE,
  // never from the qualification gates or normal application time. This 2-week
  // fallback threshold is a Life Loop approximation, not a recovered DOS value.
  classicRecoveryOpening(p=this.player){
    if(!this.isClassic)throw Error('Classic-only employment recovery');
    if(p.job)return null;
    const candidates=this.classicAIPlan(p);
    const lastRejected=p.classicRejectedOpenings||{};
    const fallback=this.jobs.find(j=>j.originalOccupationIndex===44&&
      !this.jobReasons(p,j).length&&lastRejected[j.id]!==this.week);
    if((p.classicUnemployedWeeks||0)>=2||(p.classicJobSearchFailures||0)>=2){
      if(fallback)return fallback;
    }
    if(candidates.bestJob)return candidates.bestJob;
    return fallback||null;
  }
  // Candidate branches from WhereShouldIGo.sc: 28,29,30,32,37,44,46.
  // Branch IDs/order are source-referenced; spending limits and pace gates are
  // explicitly provisional decisions for this version's interactive economy.
  // Pure, so browser diagnostics never advance the shared seeded simulation.
  classicCareerDecision(p=this.player){
    if(!this.isClassic)throw Error('Classic-only Jones career planner');
    const job=this.getJob(p),budget=this.classicSurvivalBudget(p);
    const remaining=p.cash-budget.reserve;
    const essentialsShort=(budget.foodNeeded&&p.cash<this.classicFoodPrice(1))||
      (budget.rentDue&&p.cash<p.classicRent);
    if(essentialsShort)return null;
    // Raising a contracted wage only makes sense above the CURRENT rate.
    if(job&&p.workSessions>=2&&p.raiseWeek<=this.week-4&&
       p.dependability>=this.jobRequirement(job).dependability+5*(p.classicRaises||0)&&
       this.offeredWage(job)>p.wage&&p.hours>=4){
      return {id:28,reason:'DOS career #28: negotiate a higher contracted wage',dest:'agency',action:'raise',hours:4};
    }
    // A promotion must beat the current wage AND leave enough for necessities.
    if(job&&remaining>0&&p.hours>=this.rules.applicationHours+1){
      const planned=this.classicAIPlan(p);
      const upgrade=planned.bestJob;
      if(upgrade&&this.offeredWage(upgrade)>p.wage&&!this.jobReasons(p,upgrade).length){
        const outfit=this.isDressedFor(p,upgrade)?null:this.cheapestClothingOffer(upgrade);
        if(!outfit){return {id:29,reason:'DOS career #29: pursue a qualified better-paying job',dest:'agency',action:`apply:${upgrade.id}`,hours:this.rules.applicationHours};}
      }
    }
    // When the current occupation needs experience or dependability, take
    // productive shifts before committing time and money to optional study.
    if(job&&this.isDressedFor(p,job)&&p.energy>=30&&p.hours>=6&&
      (p.workSessions<2||p.dependability<this.jobRequirement(job).dependability+8)){
      return {id:30,reason:'DOS career #30: build employment experience and reliability',dest:this.jobWorkplace(job).place,action:'work',hours:2};
    }
    if((p.energy<=18||p.classicRelaxation<=10)&&p.hours>=6){
      return {id:32,reason:'DOS needs #32: exhausted; recover at home',dest:'home',action:'relax',hours:6};
    }
    if(p.happiness<35&&p.energy<45&&p.hours>=6){
      return {id:37,reason:'DOS needs #37: rest before further work',dest:'home',action:'relax',hours:6};
    }
    // Prefer finishing an active qualification; otherwise choose a diploma
    // that advances an actual qualified job path. Never consume rent/food cash.
    const course=this.classicCareerPlan(p).recommendedDegree;
    if(course&&p.energy>=34&&p.hours>=6&&p.workSessions>=2&&
       (this.week%2===0||p.classicEnrolled.includes(course.id))&&remaining>250){
      const enrolled=p.classicEnrolled.includes(course.id);
      if(enrolled||p.classicEnrollmentCredits>0||p.cash-budget.reserve>=300){
        return {id:44,reason:`DOS education #44: ${enrolled?'continue':'begin'} ${course.name}`,dest:'university',
          action:enrolled||p.classicEnrollmentCredits>0?`classicStudy:${course.id}`:'enroll',hours:enrolled||p.classicEnrollmentCredits>0?Math.min(6,p.hours):0};
      }
    }
    if(job&&this.isDressedFor(p,job)&&p.energy>=4&&p.hours>=2&&
       (budget.projectedGap>0||p.cash<budget.twoWeekNeeds+300)){
      return {id:46,reason:'DOS work #46: earn toward a weekly safety reserve',dest:this.jobWorkplace(job).place,action:'work',hours:2};
    }
    return null;
  }
  // Ordered, source-tagged Classic Jones priority subset. This does not claim
  // every DOS branch is emulated; the existing career planner handles fallback.
  // Pure: a GUI/debugger can inspect a decision without advancing the RNG.
  classicSourceDecision(p=this.player){
    if(!this.isClassic)throw Error('Classic-only DOS decision planner');
    const job=this.getJob(p),foodMissing=!p.fed&&p.groceries===0;
    const foodCost=this.classicFoodPrice(1),rentDue=this.rentServicesOpen(p);
    const clothes=job&&!this.isDressedFor(p,job)?this.cheapestClothingOffer(job):null;
    const collateral=Object.keys(PAWN_VALUES).filter(id=>this.pawnEligible(p,id))
      .sort((a,b)=>pawnLoan(b)-pawnLoan(a))[0];
    const candidate=(id,reason,dest,action,requiredActionHours=0)=>{
      if((p.classicChoicesThisWeek||0)>=CLASSIC_WEEKLY_ACTION_LIMIT)return null;
      // Reserve enough post-arrival clock for the *action*, not only the trip.
      // Free bank transfers really do cost zero; work requires at least one unit.
      const minimumActionHours=action==='work'?1:requiredActionHours;
      const location=this.getPlace(dest);
      if(!location)return null;
      const leg=classicRouteGraph.plan(p.location,dest);
      const time=this.travelCost(p.location,dest);
      if(time+minimumActionHours>p.hours)return null;
      return {ruleId:id,decisionTag:id,reason,placeNum:location.placeNum,requiredActionHours:minimumActionHours,
        destination:dest,actionCode:action,travelSteps:leg.steps,
        predictedTimeTicks:leg.steps+(p.location===dest?0:40),
        travelHours:time,sourceScript:'WhereShouldIGo.sc',sourceType:'representative-branch'};
    };
    if(!job){
      if(p.location!=='agency')return candidate(1,'Unemployed: travel to ACNE (#6) for employment','agency','visit-employment');
      // Finish the source's first-priority employment visit BEFORE the food
      // branch sends an unemployed rival back out of the office. Otherwise
      // layoffs can create an infinite agency <-> food-market trip loop.
      const opening=this.classicRecoveryOpening(p);
      if(opening&&p.hours>=this.rules.applicationHours)
        return candidate(1,`Unemployed ${p.classicUnemployedWeeks||0} weeks: apply for ${opening.name} at ACNE`,'agency',`apply:${opening.id}`,this.rules.applicationHours);
    }
    if(rentDue&&p.cash>=p.classicRent+(foodMissing?foodCost:0))
      return candidate(7,'Monthly rent is affordable', 'housing','classicPayRent');
    if(rentDue&&p.cash<p.classicRent&&p.bank>=100)
      return candidate(9,'Withdraw accessible savings for rent','bank','withdraw:100');
    if(foodMissing&&p.cash<foodCost&&p.bank>=100)
      return candidate(22,'Withdraw savings before going hungry','bank','withdraw:100');
    if(clothes&&p.cash>=this.price(clothes.cost,'retail'))
      return candidate(14,'Replace missing uniform before work',clothes.venue,`clothes:${clothes.id}:${clothes.venue}`);
    if(foodMissing&&p.cash>=foodCost)
      return candidate(24,'Purchase essential weekly food', 'cinema','classicFresh:1');
    if(foodMissing&&p.cash<foodCost&&job&&this.isDressedFor(p,job)&&p.energy>=4)
      return candidate(21,'Work to fund food before optional errands',this.jobWorkplace(job).place,'work');
    if(rentDue&&p.cash<p.classicRent&&job&&this.isDressedFor(p,job)&&p.energy>=4)
      return candidate(8,'Work toward overdue rent',this.jobWorkplace(job).place,'work');
    if(collateral&&foodMissing&&p.cash<foodCost&&!p.bank&&(!job||!this.isDressedFor(p,job)||p.energy<4))
      return candidate(23,'Pawn a durable asset to prevent hunger','pawn',`classicPawn:${collateral}`);
    if(rentDue&&p.cash<p.classicRent&&p.classicExtensionAttemptWeek!==this.week&&!p.classicEverDebt)
      return candidate(10,'Request one rent extension','housing','classicRentExtension');
    if(collateral&&rentDue&&p.cash<p.classicRent&&p.bank<100)
      return candidate(11,'Pawn a durable asset for rent shortfall','pawn',`classicPawn:${collateral}`);
    if(job&&!this.isDressedFor(p,job)&&p.bank>=100)
      return candidate(12,'Withdraw funds for job clothing','bank','withdraw:100');
    // A uniform about to expire is a source-family #20 necessity, not a
    // discretionary purchase. Preserve it before enrolling in further courses.
    if(job&&this.isDressedFor(p,job)){
      const rank=D.clothing[job.clothes].rank;
      const usableWeeks=this.clothingSummary(p).filter(x=>D.clothing[x.id].rank>=rank).reduce((n,x)=>Math.max(n,x.weeks),0);
      const renewal=this.cheapestClothingOffer(job);
      if(usableWeeks<=2&&renewal&&this.clothingWeeks(p,renewal.id)<=2&&
        p.cash>=this.price(renewal.cost,'retail')+foodCost+(rentDue?p.classicRent:0))
        return candidate(20,'DOS clothing #20: renew expiring work uniform',renewal.venue,`clothes:${renewal.id}:${renewal.venue}`,1);
    }
    const career=this.classicCareerDecision(p);
    return career?candidate(career.id,career.reason,career.dest,career.action,career.hours):null;
  }
  classicTraceDecision(p,decision,outcome){
    if(!this.isClassic)return;
    this.classicDecisionTrace.push({week:this.week,playerId:p.id,ruleId:decision.ruleId,
      placeNum:decision.placeNum,actionCode:decision.actionCode,
      predictedTimeTicks:decision.predictedTimeTicks,
      reason:decision.reason,outcome});
    if(this.classicDecisionTrace.length>64)this.classicDecisionTrace.shift();
  }
  classicAIPlan(p=this.player){
    if(!this.isClassic)throw Error('Classic opponent plan unavailable in Modern');
    const current=this.getJob(p),foodCost=this.classicFoodPrice(1);
    const budget=this.classicSurvivalBudget(p);
    const {foodNeeded,foodReserve,rentDue,rentReserve,reserve}=budget;
    const urgent=[];
    if(rentDue&&p.cash>=p.classicRent+foodReserve)urgent.push('housing');
    if(foodNeeded&&p.cash>=foodCost)urgent.push('cinema');
    // Resolve urgent errands by the original ring distance, not store grid cells.
    const urgentOrder=this.classicBestItinerary(p.location,urgent,p.hours)?.stops||urgent;
    const jobCandidates=[];
    for(const job of this.jobs){
      if(job.id===p.job||this.jobReasons(p,job).length||p.classicRejectedOpenings[job.id]===this.week)continue;
      const workplace=this.jobWorkplace(job).place;
      const outfit=this.isDressedFor(p,job)?null:this.cheapestClothingOffer(job);
      const outfitPrice=outfit?this.price(outfit.cost,'retail'):0;
      if(!this.isDressedFor(p,job)&&(!outfit||p.cash<outfitPrice+foodReserve))continue;
      if(current&&p.cash-outfitPrice<Math.min(budget.liquidity,budget.immediateBills))continue;
      const targets=[...(outfit?[outfit.venue]:[]),'agency',workplace];
      const travel= this.classicItinerary(p.location,targets,p.hours);
      const applicationAndShift=this.rules.applicationHours+6;
      // The job may be accepted this week even if its first shift must wait.
      const applicationHours=this.travelCost(p.location,outfit?outfit.venue:'agency')+
        (outfit?1+this.travelCost(outfit.venue,'agency'):0)+this.rules.applicationHours;
      if(applicationHours>p.hours)continue;
      const chance=this.classicHiringChance(p,job)/100;
      const relativePay=this.offeredWage(job)-(current?p.wage:0);
      if(current&&relativePay<=0)continue;
      const shortfall=Math.max(0,reserve-(p.cash-outfitPrice));
      // Stronger pay and expected hiring chances matter, but travel, clothing and
      // financial resilience limit speculative job hopping. Bonuses encourage work.
      // Evaluate a job change over several paydays, not a single shift. A
      // one-hour wage improvement compounds, while route and uniform costs are
      // paid immediately. Otherwise low-tier cooks become permanently trapped.
      const score=chance*(current?relativePay*8*7:this.offeredWage(job)*8)
        -outfitPrice*.20-travel.steps*.28-applicationHours*.8-shortfall*.4
        +(job.entryGuaranteed&&!current?22:0)
        +(current&&job.tier>current.tier?9:0)
        -(travel.travelHours+applicationAndShift>p.hours?8:0);
      jobCandidates.push({jobId:job.id,workplace,placeNum:job.placeNum,originalJobNum:job.originalJobNum,
        outfit:outfit?{id:outfit.id,venue:outfit.venue,price:outfitPrice}:null,
        travelSteps:travel.steps,travelHours:travel.travelHours,applicationHours,
        hiringChance:chance,score:Number(score.toFixed(3)),safeguardedCash:p.cash-reserve-outfitPrice});
    }
    jobCandidates.sort((a,b)=>b.score-a.score||a.travelSteps-b.travelSteps||a.originalJobNum-b.originalJobNum);
    return {...budget,foodNeeded,rentDue,urgentOrder,jobCandidates,
      bestJob:jobCandidates.length&&jobCandidates[0].score>0?find(this.jobs,jobCandidates[0].jobId):null};
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
      if(this.isClassic&&(p.classicChoicesThisWeek||0)>=CLASSIC_WEEKLY_ACTION_LIMIT)break;
      let current=this.getJob(p);
      if(this.isClassic){
        const decision=this.classicSourceDecision(p);
        if(decision&&!(decision.actionCode==='work'&&workCount>=2)&&!(decision.actionCode==='relax'&&restCount>=2)&&!(decision.actionCode.startsWith('classicStudy:')&&studyCount>=1)){
          if(p.location!==decision.destination){
            if(moveTo(decision.destination,decision.requiredActionHours||0)){
              this.classicTraceDecision(p,decision,'travel');continue;
            }
          }else if(perform(decision.actionCode)){
            if(decision.actionCode==='work')workCount++;
            if(decision.actionCode==='relax')restCount++;
            if(decision.actionCode.startsWith('classicStudy:'))studyCount++;
            this.classicTraceDecision(p,decision,'action');continue;
          }
        }
      }
      // When rent and food are simultaneously actionable, minimize the whole
      // itinerary across the original 170-step ring before choosing the first stop.
      if(this.isClassic){
        const needs=this.classicAIPlan(p);
        if(needs.urgentOrder.length===2){
          const next=needs.urgentOrder[0],action=next==='housing'?'classicPayRent':'classicFresh:1';
          if(p.location!==next){if(moveTo(next,1))continue;}
          else if(perform(action))continue;
        }
      }
      // Recover from cash shortages, including any existing savings being inaccessible for tuition.
      if(p.cash<65&&p.bank>=100&&p.hours>=3){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('withdraw:100'))continue;
      }
      if(this.isClassic&&this.rentServicesOpen(p)&&p.cash<p.classicRent&&p.bank>=100&&p.cash+p.bank>=p.classicRent&&p.hours>=5){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('withdraw:100'))continue;
      }
      if(this.isClassic&&this.classicCanClearArrears(p)&&p.hours>=4){
        if(p.location!=='housing'){if(moveTo('housing',1))continue;}
        else if(perform('classicClearArrears'))continue;
      }
      // In Classic, a conscious trip to the Rent Office is necessary before the deadline.
      if(this.isClassic&&this.rentServicesOpen(p)&&p.cash>=p.classicRent+(!p.fed&&p.groceries===0?this.classicFoodPrice(1):0)&&p.hours>=4){
        if(p.location!=='housing'){if(moveTo('housing',1))continue;}
        else if(perform('classicPayRent'))continue;
      }
      // Replacement clothing has to be funded BEFORE the last wearable week ends.
      // With authentic $200/$0 Classic start the rival must not spend itself into
      // an irreversible no-uniform/no-pay/no-food loop.
      if(this.isClassic&&current&&p.hours>=4){
        const uniformRank=D.clothing[current.clothes].rank;
        const wearableWeeks=this.clothingSummary(p).filter(x=>D.clothing[x.id].rank>=uniformRank).reduce((n,x)=>Math.max(n,x.weeks),0);
        const offer=this.cheapestClothingOffer(current);
        if(offer&&wearableWeeks<=2&&p.cash>=this.price(offer.cost,'retail')+(!p.fed&&p.groceries===0?this.classicFoodPrice(1):0)&&p.clothing[offer.id]<=2){
          if(p.location!==offer.venue){if(moveTo(offer.venue,1))continue;}
          else if(perform(`clothes:${offer.id}:${offer.venue}`))continue;
        }
      }
      // Optional, non-DOS maintenance: repair only when the two-week survival
      // reserve remains intact. Needs/employment are intentionally above this.
      if(this.isClassic&&p.hours>=4){
        const maintenance=this.classicMaintenancePlan(p);
        const item=maintenance.best;
        if(item){
          if(p.location!=='tech'){if(moveTo('tech',2))continue;}
          else if(perform('classicRepair:'+item.id))continue;
        }
      }
      // Never accept a promotion that leaves us unable to afford the required wardrobe.
      const qualified=this.jobs.filter(j=>!this.jobReasons(p,j).length&&this.canAffordClothes(p,j));
      qualified.sort((a,b)=>b.tier-a.tier||b.wage-a.wage);
      const better=this.isClassic?this.classicAIPlan(p).bestJob:qualified[0];
      if(better&&(!current||better.tier>current.tier||(better.tier===current.tier&&better.wage>current.wage*1.18))&&(!this.isClassic||!current||this.offeredWage(better)>p.wage)&&p.hours>=7){
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
        if(p.location!==(this.isClassic?'cinema':'market')){if(moveTo(this.isClassic?'cinema':'market',1))continue;}
        else if(perform(this.isClassic?'classicFresh:1':'groceries'))continue;
      }
      // Study at a sustainable pace: maintain a rent buffer and earn in between terms.
      const budget=this.isClassic?this.classicSurvivalBudget(p):null;
      const degree=this.isClassic?this.classicCareerPlan(p).recommendedDegree:D.degrees[p.education];
      if(degree&&this.week%2===0&&studyCount<1&&p.cash>(this.isClassic?650:degree.cost+320)
        &&(!budget||p.cash-budget.reserve>350)&&p.hours>=9&&p.energy>=34&&p.workSessions>=2){
        if(p.location!=='university'){if(moveTo('university',6))continue;}
        else if(this.isClassic){
          if(!p.classicEnrollmentCredits&&!p.classicEnrolled.includes(degree.id)){if(perform('enroll'))continue;}
          if(perform('classicStudy:'+degree.id)){studyCount++;continue;}
        }else if(perform('study')){studyCount++;continue;}
      }
      if(current&&usable(current)&&workCount<(this.isClassic?5:2)&&p.energy>=(this.isClassic?4:18)&&p.hours>=(this.isClassic?2:6)){
        if(p.location!==this.jobWorkplace(current).place){if(moveTo(this.jobWorkplace(current).place,this.isClassic?2:6))continue;}
        else if(perform('work')){workCount++;continue;}
      }
      // An unemployed player may take one temporary odd job per week to avoid softlocking.
      // Once hired, the AI must earn its shift wage at the assigned workplace.
      if(!current&&p.cash<150&&p.energy>=14&&p.hours>=7){
        if(p.location!=='home'){if(moveTo('home',6))continue;}
        else if(perform('freelance'))continue;
      }
      if(restCount<2&&(p.energy<32||p.happiness<72||(this.isClassic&&p.classicRelaxation<=11))&&p.hours>=6){
        if(p.location!==(this.isClassic&&p.home!=='studio'?'clinic':'home')){if(moveTo(this.isClassic&&p.home!=='studio'?'clinic':'home',5))continue;}
        else if(perform('relax')){restCount++;continue;}
      }
      if(current&&p.workSessions>=3&&p.cash>150&&p.hours>=4&&p.raiseWeek<=this.week-4){
        if(p.location!=='agency'){if(moveTo('agency',2))continue;}
        else if(perform('raise'))continue;
      }
      if(p.groceries===0&&p.cash>=(this.isClassic?this.classicFoodPrice(1):24)&&p.hours>=3){
        if(p.location!==(this.isClassic?'cinema':'market')){if(moveTo(this.isClassic?'cinema':'market',1))continue;}
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

  snapshot(){return JSON.parse(JSON.stringify({classicTurnJournal:this.classicTurnJournal,classicEconomicIndices:this.classicEconomicIndices,classicEconomicPulse:this.classicEconomicPulse,classicGoodsIndex:this.classicGoodsIndex,classicWeekEvents:this.classicWeekEvents,classicDecisionTrace:this.classicDecisionTrace,classicPawnLots:this.classicPawnLots,classicPawnSequence:this.classicPawnSequence,settings:this.settings,seed:this.seed,week:this.week,economy:this.economy,active:this.active,winner:this.winner,sequence:this.sequence,messages:this.messages,players:this.players,pendingEncounter:this.pendingEncounter,bulletin:this.bulletin,cityEventId:this.cityEventId,cityEventStart:this.cityEventStart,cityProjects:this.cityProjects,classicStockPrices:this.classicStockPrices}));}
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
    game.classicGoodsIndex=game.isClassic&&Number.isInteger(obj.classicGoodsIndex)&&obj.classicGoodsIndex>=10&&obj.classicGoodsIndex<=190?obj.classicGoodsIndex:100;
    game.classicEconomicIndices=game.isClassic?(obj.classicEconomicIndices===undefined?ClassicEconomy.fromLegacy(game.classicGoodsIndex,Math.round((Number(obj.economy)||1)*100)):ClassicEconomy.validate(obj.classicEconomicIndices)):ClassicEconomy.initial();
    game.classicEconomicPulse=game.isClassic?(obj.classicEconomicPulse===undefined?ClassicEvents.initial(obj.week):ClassicEvents.validate(obj.classicEconomicPulse,obj.week)):ClassicEvents.initial();
    game.classicWeekEvents=Array.isArray(obj.classicWeekEvents)?obj.classicWeekEvents.filter(e=>e&&Number.isInteger(e.week)&&e.week>=1&&e.week<=obj.week&&typeof e.kind==='string'&&e.kind.length<60&&typeof e.detail==='string'&&e.detail.length<=240&&['system',...game.players.map(p=>p.id)].includes(e.playerId)).slice(-96).map(e=>({...e})):[];
    game.classicTurnJournal=game.isClassic?ClassicTurn.validate(obj.classicTurnJournal??[],obj.week,['system',...obj.players.map(p=>p.id)]):[];
    game.classicDecisionTrace=Array.isArray(obj.classicDecisionTrace)?obj.classicDecisionTrace.filter(e=>e&&Number.isInteger(e.week)&&e.week>=1&&e.week<=obj.week&&e.playerId==='jones'&&Number.isInteger(e.ruleId)&&e.ruleId>=1&&e.ruleId<=49&&Number.isInteger(e.placeNum)&&e.placeNum>=0&&e.placeNum<=12&&typeof e.reason==='string'&&e.reason.length<=240&&typeof e.actionCode==='string'&&e.actionCode.length<=110&&Number.isInteger(e.predictedTimeTicks)&&e.predictedTimeTicks>=0&&e.predictedTimeTicks<=1000&&['travel','action'].includes(e.outcome)).slice(-64).map(e=>({...e})):[];
    game.classicPawnLots=(obj.classicPawnLots||[]).map(l=>({...l}));
    game.classicPawnSequence=Math.max(0,Number.isSafeInteger(obj.classicPawnSequence)&&obj.classicPawnSequence<=1e9?obj.classicPawnSequence:0,...game.classicPawnLots.map(l=>Number(l.id.slice(5))));
    game.classicStockPrices=Object.fromEntries(D.classicStocks.map(x=>[x.id,Number.isInteger(obj.classicStockPrices?.[x.id])&&obj.classicStockPrices[x.id]>=Math.max(1,Math.floor(x.base*.5))&&obj.classicStockPrices[x.id]<=Math.ceil(x.base*2.5)?obj.classicStockPrices[x.id]:x.base]));
    // Never share mutable nested player records with the caller or a second loaded game.
    game.players=obj.players.map(p=>JSON.parse(JSON.stringify(p)));
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
      p.classicEquipment=p.classicEquipment&&typeof p.classicEquipment==='object'&&!Array.isArray(p.classicEquipment)?p.classicEquipment:{};
      for(const [item,meta] of Object.entries(p.classicEquipment)){if(!Object.hasOwn(PAWN_VALUES,item)||!p.owned.includes(item)||!meta||!['specialty','discount','pawn'].includes(meta.source)||typeof meta.broken!=='boolean')throw Error('Invalid equipment state');}
      p.classicBurglaryCount=Number.isInteger(p.classicBurglaryCount)&&p.classicBurglaryCount>=0?p.classicBurglaryCount:0;
      // Migrated Classic-only DOS relaxation (separate from energy and happiness).
      if(p.classicRelaxation===undefined)p.classicRelaxation=16;
      if(!Number.isSafeInteger(p.classicRelaxation)||p.classicRelaxation<10||p.classicRelaxation>30)throw Error('Invalid Classic relaxation');
      p.classicWorkHourCredit=0; // v0.5.33: old pooled partial-work credit is retired
      // New fields have safe defaults for historical saved games. Reject invalid
      // values in untrusted multiplayer snapshots instead of allowing forged
      // action counts to bypass the Classic weekly limit.
      if(p.classicWorkWarningWeek!==undefined&&(!Number.isInteger(p.classicWorkWarningWeek)||p.classicWorkWarningWeek<0||p.classicWorkWarningWeek>obj.week))throw Error('Invalid Classic work warning state');
      p.classicWorkWarningWeek=p.classicWorkWarningWeek??0;
      for(const field of ['classicLastClosedWeek','classicLastRentChargeWeek']){
        if(p[field]!==undefined&&(!Number.isInteger(p[field])||p[field]<0||p[field]>obj.week))throw Error('Invalid Classic turn boundary: '+field);
        p[field]=p[field]??0;
      }
      if(p.classicPaycheckHistory===undefined)p.classicPaycheckHistory=[];
      if(!Array.isArray(p.classicPaycheckHistory)||p.classicPaycheckHistory.length>16||
         p.classicPaycheckHistory.some(e=>!e||!Number.isInteger(e.week)||e.week<1||e.week>obj.week||
           !D.classicJobs.some(j=>j.id===e.jobId)||!Number.isInteger(e.shiftUnits)||e.shiftUnits<1||e.shiftUnits>6||
           !['fullGross','gross','garnished','fee','net','cashBefore','cashAfter','rentDebtBefore','rentDebtAfter'].every(k=>Number.isSafeInteger(e[k])&&e[k]>=0)||
           e.gross!==e.net+e.garnished+e.fee||e.cashAfter!==e.cashBefore+e.net||
           e.rentDebtAfter!==e.rentDebtBefore-e.garnished||e.fullGross<e.gross))throw Error('Invalid Classic paycheck history');
      for(const [field,max] of [['classicWageRemainder',5],['classicChoicesThisWeek',CLASSIC_WEEKLY_ACTION_LIMIT]]){
        const value=p[field];
        if(value!==undefined&&(!Number.isInteger(value)||value<0||value>max))throw Error('Invalid Classic clock/work state: '+field);
        p[field]=value??0;
      }
      p.classicLoanDefaults=clamp(Math.floor(Number(p.classicLoanDefaults)||0),0,10000);
      p.classicLoanPaidThrough=clamp(Math.floor(Number(p.classicLoanPaidThrough)||0),0,10000);
      p.classicFoodPurchasedWeek=clamp(Math.floor(Number(p.classicFoodPurchasedWeek)||0),0,obj.week);
      if(p.classicWeekendTicket!==null&&p.classicWeekendTicket!==undefined&&
         (!Object.hasOwn(D.classicDiscountGoods,p.classicWeekendTicket)||D.classicDiscountGoods[p.classicWeekendTicket].kind!=='ticket'))throw Error('Invalid pending Z-Mart ticket');
      p.classicWeekendTicket=p.classicWeekendTicket||null;
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
      p.classicUnemployedWeeks=Number.isInteger(p.classicUnemployedWeeks)?clamp(p.classicUnemployedWeeks,0,10000):0;
      p.classicJobSearchFailures=Number.isInteger(p.classicJobSearchFailures)?clamp(p.classicJobSearchFailures,0,10000):0;
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

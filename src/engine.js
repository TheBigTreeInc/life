(function (root) {
'use strict';
const D = root.LifeData || (typeof require === 'function' ? require('./data.js') : null);
const find = (arr,id)=>arr.find(x=>x.id===id);
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const money = n=>'$'+Math.floor(n).toLocaleString('en-US');
const WEEK_HOURS = 40;
class LifeGame {
  constructor(settings={}) {
    const goal = settings.goals || {};
    const mode = ['solo','hotseat','sandbox'].includes(settings.mode) ? settings.mode : 'solo';
    this.settings={mode, goals:Object.fromEntries(D.GOAL_KEYS.map(k=>[k,clamp(Number(goal[k])||60,10,100)]))};
    this.seed = Number.isSafeInteger(settings.seed) ? settings.seed : 314159;
    this.week=1; this.economy=1; this.active=0; this.winner=null; this.sequence=0; this.pendingEncounter=null; this.bulletin=D.headlines[0]; this.cityEventId=D.cityEvents[0].id; this.cityEventStart=1; this.cityProjects={};
    this.messages=[];
    const name=(settings.name||'You').trim().slice(0,24)||'You';
    this.players=[this.createPlayer('player',name,false,'#b3f485')];
    if(mode==='hotseat') this.players.push(this.createPlayer('friend',(settings.friend||'Player 2').trim().slice(0,24)||'Player 2',false,'#f8b3df'));
    if(mode!=='sandbox') this.players.push(this.createPlayer('jones','The Rival',true,'#b6b0ff'));
    this.log(`Week 1. A fresh start, a pocketful of hope, and ${money(this.players[0].cash)} in cash.`, 'good');
  }
  createPlayer(id,name,isAI,color) {
    return {id,name,isAI,color,location:'home',hours:WEEK_HOURS,cash:250,bank:100,invested:0,debt:0,rentDebt:0,
      happiness:62,energy:84,hunger:0,education:0,credits:0,experience:0,dependability:10,job:null,wage:0,workSessions:0,
      home:'studio',groceries:1,fed:false,owned:[],weekActions:0,raiseWeek:0,lottery:0,weekendPass:false,won:false,contacts:0,talkedWeek:{},seenEncounters:[],relationships:{},memories:{},favorsUsed:{},cityParticipation:{},storyProgress:{},ledger:[],history:[{week:1,cash:250,bank:100,invested:0,debt:0,netWorth:350}],milestones:[]};
  }
  get player(){return this.players[this.active];}
  getJob(p){return find(D.jobs,p.job);}
  getPlace(id){return find(D.places,id);}
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  get cityEvent(){return D.cityEvents.find(e=>e.id===this.cityEventId)||D.cityEvents[0];}
  get cityIndex(){return Math.floor((this.week-1)/4);}
  // A neutral public sector index and event-specific pricing. Whole-dollar tickets.
  price(base,sector){let multiplier=this.cityEvent.prices[sector]||1;for(const arc of D.storyArcs)if(arc.sector===sector&&this.cityProjects[arc.id])multiplier*=arc.bonus;return Math.max(1,Math.round(base*multiplier));}
  shiftPay(p){return Math.max(1,Math.round(p.wage*8*this.cityEvent.wage*(this.cityProjects.secondchance?1.05:1)));}
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
  recordHistory(p){const a=this.accounts(p);const row={week:this.week,...a,netWorth:Math.max(0,a.cash+a.bank+a.invested-a.debt)};
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
  wealth(p){return Math.max(0,p.cash+p.bank+p.invested-p.debt-p.rentDebt);}
  scores(p) {
    const g=this.settings.goals;
    const job=this.getJob(p);
    const actual={
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
    const a=D.places.findIndex(p=>p.id===from),b=D.places.findIndex(p=>p.id===to);
    if(a<0||b<0)return Infinity;
    return a===b?0:1+Math.floor(Math.min(Math.abs(a-b),D.places.length-Math.abs(a-b))/3);
  }
  travel(target) {
    if(this.winner)return {ok:false,message:'This game is finished.'};
    if(this.pendingEncounter)return {ok:false,message:'Finish your conversation before leaving.'};
    const p=this.player, dest=this.getPlace(target);
    if(!dest)return {ok:false,message:'Unknown destination.'};
    const cost=this.travelCost(p.location,target);
    if(cost>p.hours)return {ok:false,message:`Need ${cost} hours to travel. End the week to continue.`};
    if(cost===0)return {ok:true,message:`Already at ${dest.name}.`};
    p.hours-=cost;p.location=target;p.weekActions++;
    this.log(`${p.name} visited ${dest.name} · ${cost}h travel`,'travel',p.id);
    return {ok:true,message:`Welcome to ${dest.name}.`};
  }
  jobReasons(p,job){
    const reasons=[];
    if(p.education<job.education) reasons.push(`Education ${job.education}`);
    if(p.experience<job.experience) reasons.push(`${job.experience} experience`);
    if(p.dependability<job.dependability) reasons.push(`${job.dependability} reliability`);
    return reasons;
  }
  actions(p=this.player){
    const t=[];const at=p.location;
    const push=(id,title,detail,hours=0,price=0,valid=true,reason='',meta={})=>{
      t.push({id,title,detail,hours,price,enabled:valid&&p.hours>=hours&&p.cash>=price,reason:!valid?reason:p.hours<hours?'Not enough time':p.cash<price?'Not enough cash':'',...meta});
    };
    if(D.citizens[at])push('chat',`Talk to ${D.citizens[at].name}`,`Meet ${D.citizens[at].title.toLowerCase()}. Discover a little story.`,1,0,p.talkedWeek?.[at]!==this.week,'Already caught up this week');
    if(!p.isAI){
      const friend=this.relationship(p,at),last=p.favorsUsed?.[at]||0,favor=D.favors[at];
      if(favor)push('favor',favor.title,favor.detail,favor.hours,0,friend>=18&&(!last||this.week-last>=4),friend<18?`Requires Friendly relationship (18 trust; now ${friend}).`: `Available again in week ${last+4}`,{special:'friend'});
      const event=this.cityEvent;
      if(event.venue===at){
        const done=p.cityParticipation?.[this.cityEventStart];
        push('pulse',event.opportunity.title,event.opportunity.detail,event.opportunity.hours,0,!done,done?'Already joined this city event':'',{special:'city'});
      }
    }
    if(!p.isAI)for(const arc of D.storyArcs.filter(x=>x.host===at)){
      const status=this.storyStatus(p,arc);if(status.chapter>=arc.chapters.length)continue;
      push('arc:'+arc.id,`Story · ${arc.title}`,`Chapter ${status.chapter+1}/${arc.chapters.length} · ${arc.chapters[status.chapter].title}`,2,0,status.enabled,status.reason,{special:'story'});
    }
    if(at==='home'){
      push('relax','Take a breather','Get +16 happiness and +24 energy.',5,0,p.happiness<100||p.energy<100,'Already feeling great');
      push('freelance',p.owned.includes('computer')?'Freelance online':'Help a neighbor',p.owned.includes('computer')?'Earn $165 doing remote gigs.':'Earn $56 doing odd jobs.',6,0,p.energy>=14,'Need more energy');
      if(p.groceries>0) push('cook','Cook something nice','Use one grocery portion. Stay fed and feel better.',2,0,!p.fed,'Already fed this week');
    }
    if(at==='agency'){
      for(const job of D.jobs){
        const reasons=this.jobReasons(p,job);
        push('apply:'+job.id,job.name,`${money(Math.round(job.wage*this.economy))}/hour · ${this.getPlace(job.place).name}`,3,0,reasons.length===0&&p.job!==job.id,reasons.join(' · ')||(p.job===job.id?'Current job':''),{tier:job.tier,req:job});
      }
      push('raise','Negotiate a raise',`Request a higher wage at your current job.`,2,0,!!p.job&&p.workSessions>=3&&p.raiseWeek<=this.week-4&&(p.wage<Math.round(this.getJob(p).wage*1.5)),!p.job?'Get a job first':p.workSessions<3?'Work 3 shifts first':p.raiseWeek>this.week-4?'Wait a few weeks before another raise':'Already near this role’s pay ceiling');
    }
    if(at==='market'){
      push('groceries','Buy groceries','One week of food. Prevent hunger penalties.',1,this.price(24,'food'));
      push('bulkFood','Stock the fridge','Three food portions for less.',1,this.price(59,'food'),p.owned.includes('fridge'),'Requires a refrigerator');
      push('lottery','Try a lucky ticket','A $12 gamble. Drawn at the weekend.',1,12);
    }
    if(at==='diner') push('meal','Enjoy a hot meal','Fill up, +7 happiness, +8 energy.',2,this.price(20,'food'),!p.fed,'Already eaten this week');
    if(at==='university') {
      if(p.education<4){const d=D.degrees[p.education];
        push('study',`Study: ${d.name}`,`Lesson ${p.credits+1}/${d.sessions} · Gain qualifications for better jobs.`,6,this.price(d.cost,'tuition'));
      } else push('studyDone','Education complete','You have earned every qualification.',0,0,false,'Maximum education');
    }
    if(at==='office'||at==='tech'||at==='bank'||at==='market'||at==='diner'||at==='university'){
      const j=this.getJob(p);
      if(j&&j.place===at) push('work',`Work a shift · ${money(this.shiftPay(p))}`,'6 hours on the clock, paid as an 8-hour shift.',6,0,p.energy>=12&&(j.clothes==='none'||p.owned.includes(j.clothes)),p.energy<12?'Exhausted. Rest first.':`Requires ${j.clothes} clothing`);
    }
    if(at==='bank'){
      for(const amount of [100,500]){
        push('deposit:'+amount,`Deposit ${money(amount)}`,'Move cash into protected savings.',1,amount);
        push('withdraw:'+amount,`Withdraw ${money(amount)}`,'Take money out of savings.',1,0,p.bank>=amount,'Not enough savings');
      }
      push('deposit:all','Deposit all cash','Leave your wallet empty for a quieter weekend.',1,0,p.cash>0,'No cash to deposit');
      push('invest','Invest $200','Buy into a changing market. Potential gains or losses.',1,200);
      push('sell','Sell investments','Cash out your entire portfolio.',1,0,p.invested>0,'No investments');
    }
    if(at==='housing'){
      push('upgrade:apartment','Move into a sunny apartment','Better lifestyle · monthly rent $380 · deposit $440.',3,440,p.home==='studio','Available from starter studio');
      push('upgrade:loft','Move into a skyline loft','Luxury living · monthly rent $620 · deposit $950.',3,950,p.home!=='loft'&&p.home!=='studio','Requires sunny apartment');
      if(p.rentDebt>0)push('rentDebt','Pay back rent',`Clear overdue rent: ${money(p.rentDebt)}.`,1,p.rentDebt);
    }
    if(at==='boutique'){
      push('buy:casual','Get work-ready clothes','Unlock intermediate jobs and get +4 happiness.',1,this.price(85,'retail'),!p.owned.includes('casual'),'Already owned');
      push('buy:formal','Buy a smart outfit','Unlock high-level office careers. +7 happiness.',1,this.price(235,'retail'),!p.owned.includes('formal'),'Already owned');
    }
    if(at==='tech'){
      push('buy:fridge','Buy a refrigerator','Keep bulk groceries fresh across weeks.',2,this.price(255,'retail'),!p.owned.includes('fridge'),'Already owned');
      push('buy:computer','Get a home computer','Better side gigs and occasional online income.',2,this.price(590,'retail'),!p.owned.includes('computer'),'Already owned');
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
        p.cash+=income;p.energy=clamp(p.energy-12,0,100);p.experience+=1;
        msg=`Side hustle complete. Earned ${money(income)}.`;break;
      }
      case 'cook':p.groceries--;p.fed=true;p.happiness=clamp(p.happiness+5,0,100);p.energy=clamp(p.energy+7,0,100);msg='A homemade meal hits the spot.';break;
      case 'apply':{
        const job=find(D.jobs,arg);p.job=job.id;p.workSessions=0;p.wage=Math.max(1,Math.round(job.wage*this.economy));p.happiness=clamp(p.happiness+4,0,100);
        msg=`Hired! ${p.name} is now a ${job.name}, earning ${money(p.wage)}/hour.`;break;
      }
      case 'raise':p.wage+=Math.max(2,Math.ceil(p.wage*.10));p.raiseWeek=this.week;msg=`Raise approved! Your new wage is ${money(p.wage)}/hour.`;break;
      case 'groceries':p.groceries++;msg='Groceries bought. You can cook at home or they will be used at the weekend.';break;
      case 'bulkFood':p.groceries+=3;msg='Your fridge is ready for several weeks of meals.';break;
      case 'lottery':p.lottery++;msg='Ticket bought! The draw is on Sunday.';break;
      case 'meal':p.fed=true;p.happiness=clamp(p.happiness+7,0,100);p.energy=clamp(p.energy+8,0,100);msg='A warm meal and a moment to breathe.';break;
      case 'study':{
        const d=D.degrees[p.education];p.credits++;p.experience+=2;p.energy=clamp(p.energy-10,0,100);p.happiness=clamp(p.happiness-2,0,100);
        if(p.credits>=d.sessions){p.education++;p.credits=0;p.happiness=clamp(p.happiness+12,0,100);msg=`Graduated! You earned the ${d.name}. New careers await.`;}
        else msg=`Study session complete (${p.credits}/${d.sessions}). Knowledge is compounding.`;
        break;
      }
      case 'work':{
        const j=this.getJob(p);const income=this.shiftPay(p);const garnishment=p.rentDebt>0?Math.min(p.rentDebt,Math.round(income*.25)):0;
        p.cash+=income-garnishment;p.rentDebt-=garnishment;p.workSessions++;p.experience+=5;p.dependability=clamp(p.dependability+5,0,100);
        p.energy=clamp(p.energy-13,0,100);p.happiness=clamp(p.happiness-2,0,100);
        msg=`Worked at ${this.getPlace(j.place).name}: +${money(income-garnishment)}${garnishment?` (${money(garnishment)} paid toward back rent)`:''}.`;
        break;
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
    this.recordChange(p,before,msg,['work','freelance','raise'].includes(key)?'work':['deposit','withdraw','invest','sell'].includes(key)?'banking':['buy','groceries','bulkFood','meal','lottery'].includes(key)?'shopping':['upgrade','rentDebt'].includes(key)?'housing':['study'].includes(key)?'education':['favor','pulse'].includes(key)?'community':'activity');
    if(key==='apply'||key==='upgrade'||(key==='study'&&msg.startsWith('Graduated')))this.milestone(p,msg);
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
      if(p.groceries>0){p.groceries--;parts.push('A pantry meal kept hunger away.');}
      else {p.hunger=clamp(p.hunger+1,0,4);p.happiness=clamp(p.happiness-8,0,100);parts.push('You went hungry. Next week will be harder.');}
    }else p.hunger=Math.max(0,p.hunger-1);
    if(!p.owned.includes('fridge')&&p.groceries>0){p.groceries=0;parts.push('Unused fresh groceries spoiled without a fridge.');}
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
    if(this.week%4===1){
      const old=this.economy;this.economy=clamp(Math.round((old+(this.rand()-.46)*.12)*100)/100,.84,1.24);
      const choices=D.cityEvents.filter(e=>e.id!==this.cityEventId);
      this.cityEventId=choices[Math.floor(this.rand()*choices.length)].id;
      this.cityEventStart=this.week;
      this.log(`CITY PULSE: ${this.cityEvent.title}. ${this.cityEvent.description}`,'news','system');
      this.log(`New month. The local economy is ${this.economy>old?'heating up':this.economy<old?'cooling off':'holding steady'} (${Math.round(this.economy*100)}%).`,'news','system');
    }
    for(const p of this.players){
      const beforeWeekend=this.accounts(p);
      const notes=this.weekend(p);
      this.recordChange(p,beforeWeekend,'Weekend living expenses and windfalls','living');
      if(this.week%4===1){
        const beforeRent=this.accounts(p);
        const rent=Math.round(D.dwellings[p.home].rent);
        const pay=Math.min(rent,p.cash+p.bank);const cash=Math.min(pay,p.cash);p.cash-=cash;
        const fromBank=pay-cash;p.bank-=fromBank;p.rentDebt+=rent-pay;
        if(rent-pay>0){p.happiness=clamp(p.happiness-7,0,100);notes.push(`${money(rent-pay)} rent went unpaid.`);}
        else notes.push(`${money(rent)} monthly rent paid.`);
        this.recordChange(p,beforeRent,'Monthly rent · '+D.dwellings[p.home].name,'housing');
        const beforeMarket=this.accounts(p);
        if(p.invested>0){const percent=(this.rand()-.45)*.28;p.invested=Math.max(0,Math.round(p.invested*(1+percent)));notes.push(`Investments moved ${percent>=0?'+':''}${Math.round(percent*100)}%.`);}
        p.bank+=Math.floor(p.bank*.006);
        this.recordChange(p,beforeMarket,'Investment returns and savings interest','investment');
      }
      p.hours=clamp(WEEK_HOURS-(p.hunger>0?p.hunger*3:0),14,WEEK_HOURS);
      p.energy=clamp(p.energy+38-p.hunger*4,0,100);
      p.happiness=clamp(p.happiness-2+D.dwellings[p.home].comfort,0,100);
      p.dependability=clamp(p.dependability-1,0,100);p.fed=false;p.weekActions=0;
      this.recordHistory(p);
      if(notes.length)this.log(`${p.name}: ${notes.join(' ')}`,p.hunger>0?'warn':'news',p.id);
    }
    this.log(`It's week ${this.week}. Forty-ish new hours, infinite ways to spend them.`,'good','system');
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
    const usable=job=>job&&(job.clothes==='none'||p.owned.includes(job.clothes));
    let studyCount=0,workCount=0,restCount=0,loops=0;
    while(p.hours>=2&&!this.winner&&loops++<28){
      let current=this.getJob(p);
      // Recover from cash shortages, including any existing savings being inaccessible for tuition.
      if(p.cash<65&&p.bank>=100&&p.hours>=3){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('withdraw:100'))continue;
      }
      // Never accept a promotion that leaves us unable to afford the required wardrobe.
      const qualified=D.jobs.filter(j=>!this.jobReasons(p,j).length&&
        (j.clothes==='none'||p.owned.includes(j.clothes)||p.cash>(j.clothes==='formal'?235:85)+250));
      qualified.sort((a,b)=>b.tier-a.tier||b.wage-a.wage);
      const better=qualified[0];
      if(better&&(!current||better.tier>current.tier||(better.tier===current.tier&&better.wage>current.wage*1.18))&&p.hours>=7){
        if(better.clothes!=='none'&&!p.owned.includes(better.clothes)){
          if(p.location!=='boutique'){if(moveTo('boutique',1))continue;}
          else if(perform('buy:'+better.clothes))continue;
        }else{
          if(p.location!=='agency'){if(moveTo('agency',3))continue;}
          else if(perform('apply:'+better.id))continue;
        }
      }
      current=this.getJob(p);
      // Make food a priority, but keep enough for a paycheck or an emergency errand.
      if(!p.fed&&p.groceries===0&&p.cash>=75&&p.hours>=4){
        if(p.location!=='market'){if(moveTo('market',1))continue;}
        else if(perform('groceries'))continue;
      }
      // Study at a sustainable pace: maintain a rent buffer and earn in between terms.
      const degree=D.degrees[p.education];
      if(degree&&this.week%2===0&&studyCount<1&&p.cash>degree.cost+320&&p.hours>=9&&p.energy>=34&&p.workSessions>=2){
        if(p.location!=='university'){if(moveTo('university',6))continue;}
        else if(perform('study')){studyCount++;continue;}
      }
      if(current&&usable(current)&&workCount<2&&p.energy>=21&&p.hours>=6){
        if(p.location!==current.place){if(moveTo(current.place,6))continue;}
        else if(perform('work')){workCount++;continue;}
      }
      // When broke, a home side gig can restart the economy, even if the current job is inaccessible.
      if(p.cash<150&&p.energy>=14&&p.hours>=7){
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
      if(p.groceries===0&&p.cash>=24&&p.hours>=3){
        if(p.location!=='market'){if(moveTo('market',1))continue;}
        else if(perform('groceries'))continue;
      }
      if(p.cash>=1100&&p.hours>=3){
        if(p.location!=='bank'){if(moveTo('bank',1))continue;}
        else if(perform('deposit:500'))continue;
      }
      break;
    }
    this.log(`${p.name} has finished plotting their next big move.`,'muted',p.id);
  }

  snapshot(){return JSON.parse(JSON.stringify({settings:this.settings,seed:this.seed,week:this.week,economy:this.economy,active:this.active,winner:this.winner,sequence:this.sequence,messages:this.messages,players:this.players,pendingEncounter:this.pendingEncounter,bulletin:this.bulletin,cityEventId:this.cityEventId,cityEventStart:this.cityEventStart,cityProjects:this.cityProjects}));}
  static load(obj){
    if(!obj||typeof obj!=='object'||!Array.isArray(obj.players)||!obj.players.length||!obj.settings||!Number.isInteger(obj.week)||obj.week<1||obj.week>10000)throw Error('Invalid save file.');
    const game=new LifeGame({mode:obj.settings.mode,goals:obj.settings.goals});
    if(obj.players.length!==game.players.length)throw Error('Save format has an unexpected number of players.');
    for(let i=0;i<obj.players.length;i++){
      const p=obj.players[i];if(!p||p.id!==game.players[i].id||!D.places.some(l=>l.id===p.location)||!Number.isFinite(p.cash)||!Number.isFinite(p.hours)||p.cash<0||p.bank<0||p.hours<0||p.hours>40||p.owned?.length>50)throw Error('Invalid player state.');
      if(p.job&&!find(D.jobs,p.job))throw Error('Invalid job in save.');
      if(!Object.hasOwn(D.dwellings,p.home))throw Error('Invalid housing in save.');
    }
    game.players=obj.players;
    for(const p of game.players){
      p.contacts=Number.isFinite(p.contacts)?clamp(p.contacts,0,100):0;
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

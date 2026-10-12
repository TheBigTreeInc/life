const test=require('node:test');
const assert=require('node:assert/strict');
const Game=require('../src/engine.js');
const game=(opts={})=>new Game({mode:'sandbox',...opts});
function visit(g,id){const r=g.travel(id);assert.equal(r.ok,true,`travel to ${id}: ${r.message}`)}
function act(g,id){const r=g.act(id);assert.equal(r.ok,true,`${id}: ${r.message}`)}

test('creates game with default player and AI opponent',()=>{
 const g=new Game();assert.equal(g.players.length,2);assert.equal(g.player.name,'You');assert.equal(g.players[1].isAI,true);
 assert.equal(g.week,1);assert.equal(g.player.hours,40);assert.equal(g.settings.goals.wealth,60);
});
test('all 12 city buildings can be visited and travel consumes time',()=>{
 const g=game();const before=g.player.hours;visit(g,'agency');assert.ok(g.player.hours<before);
 assert.equal(g.travel('agency').ok,true);assert.equal(g.travel('moon').ok,false);
 assert.equal(g.travelCost('home','home'),0);assert.equal(g.travelCost('home','agency'),1);
});
test('hiring, working, and promotion requirements',()=>{
 const g=game();visit(g,'agency');
 assert.equal(g.act('apply:director').ok,false);
 act(g,'apply:server');assert.equal(g.player.job,'server');
 visit(g,'diner');const before=g.player.cash;act(g,'work');
 assert.equal(g.player.cash,before+14*8);assert.equal(g.player.experience,5);assert.equal(g.player.dependability,15);
 assert.equal(g.act('work').ok,true);
});
test('university graduates after required sessions',()=>{
 const g=game();g.player.cash=1200;visit(g,'university');
 act(g,'study');assert.equal(g.player.education,0);assert.equal(g.player.credits,1);
 act(g,'study');assert.equal(g.player.education,1);assert.equal(g.player.credits,0);
});
test('cannot work without outfit at higher-tier jobs',()=>{
 const g=game();g.player.education=4;g.player.experience=100;g.player.dependability=100;
 visit(g,'agency');act(g,'apply:director');visit(g,'office');assert.equal(g.act('work').ok,false);
 g.player.clothing.formal=13;assert.equal(g.act('work').ok,true);
});
test('cash and time requirements are enforced',()=>{
 const g=game();visit(g,'boutique');g.player.cash=5;
 assert.equal(g.act('buy:formal').ok,false);assert.equal(g.player.cash,5);
 g.player.hours=0;assert.equal(g.travel('bank').ok,false);
});
test('food, hunger and energy affect successive weeks',()=>{
 const g=game();g.player.groceries=0;
 g.endTurn();assert.equal(g.week,2);assert.equal(g.player.hunger,1);assert.equal(g.player.hours,37);
 assert.ok(g.player.happiness<62);
});
test('monthly rent, bank balances, and unpaid rent work',()=>{
 const g=game();const p=g.player;p.cash=0;p.bank=100;
 for(let i=0;i<4;i++)g.endTurn();
 assert.equal(g.week,5);assert.equal(p.rentDebt,130);assert.equal(p.bank,0);
});
test('deposit and withdraw transfer funds without creating money',()=>{
 const g=game();visit(g,'bank');const p=g.player;const total=p.cash+p.bank;
 act(g,'deposit:100');assert.equal(p.cash,150);assert.equal(p.bank,200);
 act(g,'withdraw:100');assert.equal(p.cash+p.bank,total);
});
test('education and higher wage improves goal scores',()=>{
 const g=game();const p=g.player;const s1=g.scores(p);
 p.education=3;p.job='analyst';p.cash=4000;p.happiness=95;
 const s2=g.scores(p);for(const k of ['wealth','happiness','education','career'])assert.ok(s2[k]>=s1[k],k);
});
test('winning requires all four goals',()=>{
 const g=game({goals:{wealth:10,happiness:10,education:10,career:10}});
 const p=g.player;p.cash=10000;p.happiness=100;p.education=4;p.job='director';g.checkWin();
 assert.equal(g.winner,'player');assert.equal(g.endTurn().ok,false);
});
test('two-player hotseat advances to second human then AI',()=>{
 const g=new Game({mode:'hotseat'});assert.equal(g.players.length,3);
 const before=g.week;g.endTurn();assert.equal(g.player.id,'friend');g.endTurn();
 assert.equal(g.week,before+1);assert.equal(g.player.id,'player');
 assert.ok(g.players[2].weekActions>=0);
});
test('game serializes and restores progression',()=>{
 const g=game();visit(g,'market');act(g,'groceries');const copy=Game.load(JSON.parse(JSON.stringify(g.snapshot())));
 assert.deepEqual(copy.snapshot(),g.snapshot());
});
test('rejects corrupt save or unexpected character',()=>{
 const g=game();const p=g.snapshot();p.players[0].location='mars';assert.throws(()=>Game.load(p),/Invalid player state/);
});
test('AI plays within legal time and money limits',()=>{
 const g=new Game();for(let i=0;i<8;i++)g.endTurn();
 const p=g.players[1];assert.ok(p.cash>=0);assert.ok(p.hours>=0&&p.hours<=40);assert.ok(p.job);
 assert.equal(g.week,9);
});
test('deposit all transfers exact amount, with nothing lost',()=>{
 const g=game();visit(g,'bank');const before=g.player.cash+g.player.bank;
 act(g,'deposit:all');assert.equal(g.player.cash,0);assert.equal(g.player.bank,before);
});
test('AI competitor remains economically viable through a sustained campaign',()=>{
 const g=new Game();for(let i=0;i<17&&!g.winner;i++)g.endTurn();
 const p=g.players[1];assert.ok(p.job,'rival should have an active job');
 assert.ok(p.education>=1,'rival should progress through school');
 assert.equal(p.rentDebt,0,'rival should be able to pay rent');
 assert.equal(p.hunger,0,'rival should be able to eat');
});
test('random legal actions across long campaign preserve game invariants',()=>{
 for(let seed=0;seed<16;seed++){
  const g=game({seed});let i=0;
  while(i++<150&&!g.winner){
    const p=g.player;const locations=['home','agency','market','diner','university','office','cinema','bank','housing','boutique','tech','clinic'];
    g.travel(locations[(seed*11+i*7)%locations.length]);
    const enabled=g.actions().filter(x=>x.enabled);
    if(enabled.length)g.act(enabled[(i+seed)%enabled.length].id);
    if(i%4===0||p.hours<3)g.endTurn();
    assert.ok(Number.isFinite(p.cash)&&p.cash>=0,`cash seed ${seed}`);
    assert.ok(Number.isFinite(p.bank)&&p.bank>=0,`bank seed ${seed}`);
    assert.ok(p.hours>=0&&p.hours<=40,`time seed ${seed}`);
    assert.ok(p.happiness>=0&&p.happiness<=100,`happiness seed ${seed}`);
  }
 }
});

test('every building has an original scene, a local citizen and a two-choice story',()=>{
 const D=require('../src/data.js');const Art=require('../src/art.js');
 for(const loc of D.places){
  assert.ok(D.citizens[loc.id],loc.id+' missing citizen');
  assert.equal(D.encounters[loc.id].choices.length,2,loc.id+' needs two story choices');
  assert.match(Art.scene(loc.id),/viewBox="0 0 640 340"/);
  assert.match(Art.person(loc.id),/viewBox="0 0 120 124"/);
 }
});
test('conversations use one hour, grant social benefits and cannot be farmed weekly',()=>{
 const g=game();const before=g.player.hours;
 act(g,'chat');assert.equal(g.player.hours,before-1);
 assert.equal(g.player.contacts,1);assert.equal(g.player.happiness,64);
 assert.equal(g.actions().find(x=>x.id==='chat').enabled,false);
 assert.equal(g.pendingEncounter.placeId,'home');
 assert.equal(g.travel('agency').ok,false);
 assert.equal(g.act('relax').ok,false);
 assert.equal(g.endTurn().ok,false);
 actChoice(g,'decline');assert.equal(g.pendingEncounter,null);
 g.endTurn();assert.equal(g.actions().find(x=>x.id==='chat').enabled,true);
 act(g,'chat');assert.equal(g.pendingEncounter,null,'the same story should not replay');
});
function actChoice(g,id){const r=g.chooseEncounter(id);assert.equal(r.ok,true,r.message)}
test('encounter consequences are legal and part of restored games',()=>{
 const g=game();visit(g,'agency');act(g,'chat');
 assert.equal(g.encounter().title,'The résumé clinic');
 const saved=g.snapshot();const restored=Game.load(saved);
 assert.deepEqual(restored.snapshot(),saved);
 assert.equal(restored.chooseEncounter('invalid').ok,false);
 assert.equal(restored.player.cash,250);
 actChoice(restored,'course');
 assert.equal(restored.player.cash,215);
 assert.equal(restored.player.experience,8);
 assert.equal(restored.player.dependability,14);
 assert.equal(restored.chooseEncounter('practice').ok,false);
});
test('unaffordable choices are rejected without consuming the encounter',()=>{
 const g=game();g.player.cash=0;visit(g,'boutique');act(g,'chat');
 assert.equal(g.chooseEncounter('take').ok,false);assert.equal(g.pendingEncounter.placeId,'boutique');
 actChoice(g,'decline');assert.equal(g.player.cash,0);
});
test('old v0.1 snapshots without social fields and bulletin still load',()=>{
 const g=game();const snapshot=g.snapshot();delete snapshot.pendingEncounter;delete snapshot.bulletin;
 snapshot.players.forEach(p=>{delete p.contacts;delete p.talkedWeek;delete p.seenEncounters;});
 const restored=Game.load(snapshot);assert.equal(restored.player.contacts,0);
 assert.deepEqual(restored.player.seenEncounters,[]);
 act(restored,'chat');assert.equal(restored.pendingEncounter.placeId,'home');
});
test('stale or cross-player pending encounters are rejected',()=>{
 const g=game();g.act('chat');const state=g.snapshot();
 state.pendingEncounter.playerId='bogus';assert.throws(()=>Game.load(state),/Invalid saved encounter/);
});
test('every social option has a valid effect and at least one affordable free path',()=>{
 const D=require('../src/data.js');
 for(const story of Object.values(D.encounters)){
  assert.ok(story.choices.some(c=>(c.effects.cash||0)>=0),'missing free option');
  for(const choice of story.choices){
   assert.ok(choice.label && choice.detail);
   for(const [key,value] of Object.entries(choice.effects)){
    assert.ok(['cash','bank','experience','groceries','dependability','happiness','energy'].includes(key));
    assert.ok(Number.isFinite(value));
   }
  }
 }
});

test('city event changes real shop prices and all descriptions match billed amounts',()=>{
 const g=game();const D=require('../src/data.js');
 assert.equal(g.cityEvent.id,'garden');assert.equal(g.price(24,'food'),19);
 visit(g,'market');const item=g.actions().find(a=>a.id==='groceries');
 assert.equal(item.price,19);
 const cash=g.player.cash;act(g,'groceries');assert.equal(g.player.cash,cash-19);
 assert.equal(g.price(24,'unlisted'),24);
 for(const event of D.cityEvents){
  g.cityEventId=event.id;
  for(const sector of ['food','tuition','retail','leisure','health'])assert.ok(g.price(100,sector)>0);
  assert.ok(g.shiftPay({wage:17})>=1);
 }
});
test('NPC story choices become long-lived memories and change the friendship score',()=>{
 const g=game();act(g,'chat');
 assert.equal(g.relationship(g.player,'home'),4);
 actChoice(g,'help');assert.equal(g.relationship(g.player,'home'),15);
 assert.equal(g.player.memories.home,'help');
 g.endTurn();act(g,'chat');
 assert.match(g.messages[0].message,/remember when you chose to help carry it upstairs/i);
 assert.equal(g.relationshipName(g.player,'home'),'Friendly');
 assert.equal(g.relationship(g.player,'home'),19);
 assert.equal(g.actions().find(a=>a.id==='favor').enabled,true);
});
test('declined story gets a different permanent memory and cannot give infinite favor',()=>{
 const g=game();act(g,'chat');actChoice(g,'decline');
 assert.equal(g.relationship(g.player,'home'),1);
 assert.equal(g.player.memories.home,'decline');
 assert.equal(g.actions().find(a=>a.id==='favor').enabled,false);
 g.endTurn();act(g,'chat');assert.match(g.messages[0].message,/wish them luck/i);
});
test('each NPC provides a distinct favor with friendship threshold and a four week cooldown',()=>{
 const D=require('../src/data.js');const g=game();const p=g.player;
 for(const loc of D.places){
  assert.ok(D.favors[loc.id],`missing favor for ${loc.id}`);
  assert.ok(Object.keys(D.favors[loc.id].effects).length>0);
 }
 p.relationships.home=18;
 const first=g.actions().find(a=>a.id==='favor');assert.ok(first.enabled);
 act(g,'favor');assert.equal(p.favorsUsed.home,1);
 assert.equal(g.act('favor').ok,false);
 for(let week=2;week<=5;week++)g.endTurn();
 assert.equal(g.week,5);
 assert.equal(g.actions().find(a=>a.id==='favor').enabled,true);
 act(g,'favor');assert.equal(p.favorsUsed.home,5);
});
test('participating in a city event grants effects once, resets with a new four week event',()=>{
 const g=game();visit(g,'market');const p=g.player;
 const action=g.actions().find(a=>a.id==='pulse');assert.equal(action.enabled,true);
 const before=p.groceries;act(g,'pulse');assert.equal(p.groceries,before+2);
 assert.equal(g.actions().find(a=>a.id==='pulse').enabled,false);
 assert.equal(g.act('pulse').ok,false);
 for(let i=0;i<4;i++)g.endTurn();
 assert.equal(g.cityEventStart,5);
 assert.notEqual(g.cityEventId,'garden');
 const event=g.cityEvent;const cost=g.travelCost(p.location,event.venue);
 assert.ok(p.hours>=cost+event.opportunity.hours);
 visit(g,event.venue);
 assert.equal(g.actions().find(a=>a.id==='pulse').enabled,true);
 act(g,'pulse');assert.equal(p.cityParticipation[5],true);
});
test('food, education, and shift-pay economy changes remain authoritative through the action pipeline',()=>{
 const g=game();const p=g.player;
 visit(g,'university');g.cityEventId='study';
 assert.equal(g.actions().find(a=>a.id==='study').price,39);
 const before=p.cash;act(g,'study');assert.equal(p.cash,before-39);
 g.cityEventId='career';visit(g,'agency');act(g,'apply:server');visit(g,'diner');
 const wage=g.shiftPay(p);assert.equal(wage,Math.round(p.wage*8*1.13));
 const cash=p.cash;act(g,'work');assert.equal(p.cash,cash+wage);
});
test('friendship, favor cooldowns and event participation survive export/import',()=>{
 const g=game();const p=g.player;act(g,'chat');actChoice(g,'help');
 p.relationships.home=35;act(g,'favor');visit(g,'market');act(g,'pulse');
 const clone=Game.load(JSON.parse(JSON.stringify(g.snapshot())));
 assert.deepEqual(clone.snapshot(),g.snapshot());
 assert.equal(clone.player.relationships.home,35);
 assert.equal(clone.player.memories.home,'help');
 assert.equal(clone.player.favorsUsed.home,1);
 assert.equal(clone.player.cityParticipation[1],true);
});
test('v0.2 saves migrate to v0.3 with valid city and independent social state',()=>{
 const g=new Game({mode:'hotseat'}),old=g.snapshot();
 delete old.cityEventId;delete old.cityEventStart;
 for(const p of old.players){delete p.relationships;delete p.memories;delete p.favorsUsed;delete p.cityParticipation;}
 const upgraded=Game.load(old);
 assert.equal(upgraded.cityEvent.id,'garden');
 assert.equal(upgraded.cityEventStart,1);
 assert.deepEqual(upgraded.player.relationships,{});
 act(upgraded,'chat');actChoice(upgraded,'help');
 upgraded.endTurn();assert.equal(upgraded.player.id,'friend');
 assert.equal(upgraded.relationship(upgraded.player,'home'),0);
 assert.deepEqual(upgraded.player.memories,{});
});
test('unknown social keys and forged city events in imported saves cannot grant arbitrary rewards',()=>{
 const g=game();const data=g.snapshot();
 data.cityEventId='give-everyone-money';data.cityEventStart=999;
 data.players[0].relationships={home:1024,shady:98};
 data.players[0].memories={home:'not-a-choice',shady:'something'};
 data.players[0].favorsUsed={home:500,agency:-2,shady:4};
 data.players[0].cityParticipation={'-1':true,'999999':true,1:true};
 const copy=Game.load(data),p=copy.player;
 assert.equal(copy.cityEvent.id,'garden');assert.equal(copy.cityEventStart,1);
 assert.deepEqual(p.relationships,{home:100});
 assert.deepEqual(p.memories,{});assert.deepEqual(p.favorsUsed,{});
 assert.deepEqual(p.cityParticipation,{'1':true});
});
test('the life loop remains viable over 250 evolving city weeks',()=>{
 const g=game({seed:334455});
 for(let i=0;i<250&&!g.winner;i++)g.endTurn();
 assert.ok(g.week>180,'expected meaningful long-running campaign');
 for(const p of g.players){
  assert.ok(Number.isFinite(p.cash)&&p.cash>=0);
  assert.ok(Number.isFinite(p.bank)&&p.bank>=0);
  assert.ok(p.hours>=0&&p.hours<=40);
 }
 assert.ok(g.cityEventStart>1);
 assert.ok(g.cityEventId);
});

// v0.4 long-form narrative / accounting regression suite.
test('seasonal arcs are authored as three chapters each and partner venues are valid',()=>{
 const D=require('../src/data.js');assert.equal(D.storyArcs.length,3);
 for(const arc of D.storyArcs){assert.equal(arc.chapters.length,3);assert.notEqual(arc.host,arc.partner);
  assert.ok(D.citizens[arc.host]&&D.citizens[arc.partner]);assert.ok(arc.chapters.every(c=>c.choices.length===2));}
});
test('stories require an introduction and enough host trust',()=>{
 const g=game(),p=g.player;
 assert.equal(g.actions().find(a=>a.id==='arc:neighbors').enabled,false);
 act(g,'chat');assert.equal(g.chooseEncounter('help').ok,true);
 assert.equal(g.actions().find(a=>a.id==='arc:neighbors').enabled,false);
 p.relationships.home=18;assert.equal(g.actions().find(a=>a.id==='arc:neighbors').enabled,true);
});
test('arc choices affect two NPCs and prevent replay within the same chapter',()=>{
 const g=game(),p=g.player;p.relationships.home=28;p.seenEncounters.push('home');
 act(g,'arc:neighbors');assert.equal(g.pendingEncounter.arcId,'neighbors');
 const snap=Game.load(g.snapshot());assert.equal(snap.encounter().title,'One empty storefront');
 assert.equal(snap.chooseEncounter('recruit').ok,true);
 assert.equal(snap.player.relationships.home,35);assert.equal(snap.player.relationships.market,5);
 assert.equal(snap.player.storyProgress.neighbors.chapter,1);
 assert.equal(snap.actions().find(a=>a.id==='arc:neighbors').enabled,false);
 assert.deepEqual(Game.load(snap.snapshot()).snapshot(),snap.snapshot());
});
test('second chapters unlock after two weeks and higher trust',()=>{
 const g=game(),p=g.player;p.relationships.home=35;p.seenEncounters.push('home');
 act(g,'arc:neighbors');assert.ok(g.chooseEncounter('recruit').ok);
 assert.match(g.actions().find(a=>a.id==='arc:neighbors').reason,/week 3/);
 g.newWeek();g.newWeek();assert.equal(g.week,3);
 assert.equal(g.actions().find(a=>a.id==='arc:neighbors').enabled,true);
});
test('completed pantry story improves actual food prices for the whole city',()=>{
 const g=new Game({mode:'hotseat'}),p=g.players[0];
 p.relationships.home=80;p.relationships.market=25;p.seenEncounters.push('home');
 const normal=g.price(24,'food');
 for(const [chapter,choice] of ['recruit','repair','open'].entries()){
  if(chapter){g.newWeek();g.newWeek();}
  p.hours=40;p.cash=1000;p.location='home';act(g,'arc:neighbors');assert.equal(g.chooseEncounter(choice).ok,true);
 }
 assert.equal(p.storyProgress.neighbors.chapter,3);
 assert.equal(g.cityProjects.neighbors,true);
 const e=g.cityEvent.prices.food||1;assert.equal(g.price(24,'food'),Math.round(24*e*.95));
 assert.equal(g.players[1].storyProgress.neighbors,undefined);
 const copy=Game.load(g.snapshot());assert.equal(copy.price(24,'food'),g.price(24,'food'));
});
test('alternate final story choice has a real tradeoff, not a permanent global bonus',()=>{
 const g=game(),p=g.player;p.relationships.agency=70;p.relationships.tech=20;p.seenEncounters.push('agency');
 p.storyProgress.secondchance={chapter:2,lastWeek:3,choices:['mentor','build']};g.week=5;p.location='agency';
 act(g,'arc:secondchance');const before=g.shiftPay({wage:20});
 assert.equal(g.chooseEncounter('unpaid').ok,true);
 assert.equal(p.relationships.tech,12);assert.equal(g.cityProjects.secondchance,undefined);
 assert.equal(g.shiftPay({wage:20}),before);
});
test('city pulse synergy adds bonus experience on matching venue chapters',()=>{
 const g=game(),p=g.player;p.seenEncounters.push('home');p.relationships.home=18;
 g.cityEventId='neighbours';const before=p.experience;
 act(g,'arc:neighbors');assert.equal(g.encounter().cityBoost,true);
 assert.equal(g.chooseEncounter('recruit').ok,true);
 assert.equal(p.experience,before+3);
});
test('bank transfers in the ledger never appear as earnings',()=>{
 const g=game();visit(g,'bank');const p=g.player;
 act(g,'deposit:100');assert.equal(p.ledger[0].net,0);
 assert.equal(g.finances(p).income,0);assert.equal(g.finances(p).expenses,0);
 assert.equal(p.ledger[0].category,'banking');
});
test('working and spending create net-income and expense records',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');visit(g,'diner');
 act(g,'work');let f=g.finances(g.player);assert.equal(f.income,112);
 visit(g,'market');act(g,'groceries');f=g.finances(g.player);assert.ok(f.expenses>0);
 assert.ok(f.ledger.some(x=>x.category==='shopping'));
});
test('monthly rent appears as a change to net worth even when unpaid',()=>{
 const g=game(),p=g.player;p.cash=0;p.bank=0;
 for(let i=0;i<4;i++)g.newWeek();
 assert.ok(p.rentDebt>=230);
 assert.ok(p.ledger.some(x=>x.category==='housing'&&x.net===-230));
 assert.ok(p.history.some(x=>x.week===5));
});
test('an imported v0.3 save gains empty story and financial records safely',()=>{
 const g=game(),s=g.snapshot();delete s.cityProjects;
 for(const p of s.players){delete p.storyProgress;delete p.ledger;delete p.history;delete p.milestones;}
 const copy=Game.load(s);
 assert.deepEqual(copy.cityProjects,{});assert.deepEqual(copy.player.storyProgress,{});
 assert.equal(copy.player.ledger.length,0);assert.equal(copy.player.history.length,1);
});
test('history is bounded after 350 weeks and remains portable',()=>{
 const g=game();for(let i=0;i<350;i++)g.newWeek();
 assert.ok(g.player.history.length<=260);
 assert.ok(g.player.ledger.length<=160);
 assert.deepEqual(Game.load(g.snapshot()).snapshot(),g.snapshot());
});
test('invalid story states and city projects are not accepted from unknown IDs',()=>{
 const g=game(),s=g.snapshot();s.cityProjects={other:true,neighbors:false};
 s.players[0].storyProgress={other:{chapter:3,lastWeek:1},neighbors:{chapter:999,lastWeek:1}};
 const copy=Game.load(s);assert.deepEqual(copy.cityProjects,{});assert.deepEqual(copy.player.storyProgress,{});
});

// Employment parity tests compare documented 1991 Jones behavior with The Life Loop.
test('employment parity: a new character cannot take a regular shift before hiring',()=>{
 const g=game();
 visit(g,'diner');assert.equal(g.actions().some(a=>a.id==='work'),false);
 assert.equal(g.act('work').ok,false);
 visit(g,'bank');assert.equal(g.act('work').ok,false);
});
test('employment parity: one active job, and the shift is offered only by its employer',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');
 assert.equal(g.player.job,'server');
 assert.equal(g.actions().find(a=>a.id==='apply:server').enabled,false);
 visit(g,'market');assert.equal(g.actions().some(a=>a.id==='work'),false);
 assert.equal(g.act('work').ok,false);
 visit(g,'diner');assert.equal(g.actions().find(a=>a.id==='work').enabled,true);
 const cash=g.player.cash;act(g,'work');assert.equal(g.player.cash,cash+14*8);
});
test('employment parity: accepting a second job explicitly replaces the first, never stacks',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');
 visit(g,'diner');act(g,'work');
 visit(g,'agency');
 const offer=g.actions().find(a=>a.id==='apply:stock');
 assert.equal(offer.replacesJob,true);
 assert.match(offer.detail,/Replaces your current job/);
 const hours=g.player.hours,priorWage=g.player.wage;
 act(g,'apply:stock');
 assert.equal(g.player.job,'stock');assert.equal(g.player.wage,16);
 assert.equal(g.player.workSessions,0);
 assert.equal(g.player.hours,hours-3);
 assert.notEqual(g.player.wage,priorWage);
 assert.match(g.messages[0].message,/left Cafe Server/);
 visit(g,'diner');assert.equal(g.actions().some(a=>a.id==='work'),false);
 visit(g,'market');const cash=g.player.cash;act(g,'work');assert.equal(g.player.cash,cash+16*8);
});
test('employment parity: failed applications cannot end or replace the existing contract',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');
 const hours=g.player.hours;
 assert.equal(g.act('apply:director').ok,false);
 assert.equal(g.act('apply:server').ok,false);
 assert.equal(g.player.job,'server');assert.equal(g.player.hours,hours);
});
test('employment parity: lateral job swapping does not infinitely increase happiness',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');
 const happiness=g.player.happiness;
 act(g,'apply:stock');act(g,'apply:server');
 assert.equal(g.player.happiness,happiness);
});
test('employment parity: temporary work is unemployed-only, limited to one gig per week',()=>{
 const g=game();
 act(g,'freelance');
 assert.equal(g.player.cash,306);assert.equal(g.player.oddJobWeek,1);
 assert.equal(g.act('freelance').ok,false);
 g.endTurn();assert.equal(g.week,2);
 assert.equal(g.actions().find(a=>a.id==='freelance').enabled,true);
 visit(g,'agency');act(g,'apply:server');visit(g,'home');
 assert.equal(g.actions().find(a=>a.id==='freelance').enabled,false);
 assert.equal(g.act('freelance').ok,false);
});
test('employment parity: education and finances are independent of current job',()=>{
 const g=game();g.player.cash=1000;
 visit(g,'agency');act(g,'apply:server');
 visit(g,'university');act(g,'study');
 assert.equal(g.player.job,'server');
 visit(g,'bank');act(g,'deposit:100');
 assert.equal(g.player.job,'server');
 visit(g,'diner');assert.equal(g.act('work').ok,true);
});
test('employment parity: job contract, pay and old-save migration survive roundtrips',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');
 const saved=g.snapshot();saved.players.forEach(p=>delete p.oddJobWeek);
 const restored=Game.load(saved);
 assert.equal(restored.player.job,'server');assert.equal(restored.player.wage,14);
 assert.equal(restored.player.oddJobWeek,0);
 visit(restored,'diner');assert.equal(restored.act('work').ok,true);
 assert.deepEqual(Game.load(restored.snapshot()).snapshot(),restored.snapshot());
});
test('employment parity: AI holds at most one job throughout a longer economic campaign',()=>{
 const g=new Game({seed:903});
 for(let w=0;w<90&&!g.winner;w++){
   g.endTurn();
   const p=g.players.find(p=>p.isAI),j=g.getJob(p);
   assert.ok(j,`AI lost its employment in week ${g.week}`);
   assert.equal(typeof p.job,'string');
   assert.ok(p.hours>=0&&p.cash>=0);
 }
});


// v0.4.3: closer parity with Sierra's weekly consumable clothing and careers.
test('wardrobe starts with six weeks of casual clothing and no other outfits',()=>{
 const g=game();assert.deepEqual(g.player.clothing,{casual:6,formal:0,business:0});
 assert.equal(g.player.coursesCompleted.length,0);
 assert.equal(g.player.courseProgress.service,undefined);
});
test('all clothing ages one week, including unused dress and business outfits',()=>{
 const g=game();const p=g.player;p.clothing.formal=4;p.clothing.business=2;
 g.endTurn();assert.deepEqual(p.clothing,{casual:5,formal:3,business:1});
 g.endTurn();assert.deepEqual(p.clothing,{casual:4,formal:2,business:0});
 assert.ok(g.messages.some(m=>m.message.includes('business suit have worn out')));
});
test('casual clothing is required for every entry-level paid shift',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');visit(g,'diner');
 g.player.clothing={casual:0,formal:0,business:0};
 assert.equal(g.actions().find(a=>a.id==='work').enabled,false);
 assert.match(g.act('work').message,/Uniform required/);
});
test('better outfits satisfy lower uniform requirements, never vice versa',()=>{
 const g=game();visit(g,'agency');act(g,'apply:server');visit(g,'diner');
 g.player.clothing={casual:0,formal:3,business:0};act(g,'work');
 g.player.clothing.formal=0;g.player.clothing.business=3;act(g,'work');
 const h=game();h.player.education=4;h.player.experience=99;h.player.dependability=99;
 visit(h,'agency');act(h,'apply:director');visit(h,'office');
 h.player.clothing={casual:10,formal:0,business:0};assert.equal(h.act('work').ok,false);
 h.player.clothing.business=2;act(h,'work');
});
test('cheap outfits and boutique outfits add different weeks and can be repurchased',()=>{
 const g=game();const p=g.player;p.cash=1000;visit(g,'market');
 let price=g.actions().find(a=>a.id==='clothes:casual:market').price;
 act(g,'clothes:casual:market');assert.equal(p.clothing.casual,15);
 assert.equal(p.cash,1000-price);
 visit(g,'boutique');act(g,'clothes:casual:boutique');assert.equal(p.clothing.casual,26);
 act(g,'clothes:casual:boutique');assert.equal(p.clothing.casual,37);
 act(g,'clothes:business:boutique');assert.equal(p.clothing.business,13);
});
test('shopping for clothes cannot bypass money and time checks',()=>{
 const g=game();visit(g,'boutique');g.player.cash=0;
 assert.equal(g.act('clothes:business:boutique').ok,false);
 assert.equal(g.player.clothing.business,0);
 g.player.cash=900;g.player.hours=0;
 assert.equal(g.act('clothes:business:boutique').ok,false);
 assert.equal(g.player.clothing.business,0);
});
test('four distinct certificates have lessons and unlock specialized job offers',()=>{
 const g=game();const p=g.player;p.cash=3000;p.education=4;p.experience=100;p.dependability=100;
 visit(g,'agency');assert.equal(g.actions().find(a=>a.id==='apply:bankmanager').enabled,false);
 visit(g,'university');
 for(const c of require('../src/data.js').courses){
  for(let k=0;k<c.sessions;k++){if(g.player.hours<5)g.endTurn();act(g,'course:'+c.id);}
  assert.ok(p.coursesCompleted.includes(c.id));
  assert.equal(g.actions().find(a=>a.id==='course:'+c.id).enabled,false);
  assert.equal(p.courseProgress[c.id],undefined);
 }
 visit(g,'agency');assert.equal(g.actions().find(a=>a.id==='apply:bankmanager').enabled,true);
 act(g,'apply:bankmanager');assert.equal(p.job,'bankmanager');
});
test('course lessons are blocked by degree prerequisites and no cash spent',()=>{
 const g=game();visit(g,'university');const cash=g.player.cash;
 assert.equal(g.act('course:leadership').ok,false);
 assert.equal(g.player.cash,cash);
 assert.equal(g.actions().find(a=>a.id==='course:service').enabled,true);
});
test('new workplaces offer shifts only to their active employee',()=>{
 const g=game();const p=g.player;p.education=4;p.experience=100;p.dependability=100;p.coursesCompleted=['leadership'];
 visit(g,'agency');act(g,'apply:boutiquelead');visit(g,'boutique');
 p.clothing.formal=13;assert.equal(g.actions().find(a=>a.id==='work').enabled,true);
 act(g,'work');visit(g,'market');assert.equal(g.actions().some(a=>a.id==='work'),false);
});
test('save migration turns old permanent clothing flags into week counters',()=>{
 const g=game();const old=g.snapshot();const p=old.players[0];
 delete p.clothing;delete p.coursesCompleted;delete p.courseProgress;
 p.owned=['formal','casual','computer'];p.job='director';p.education=4;
 const reloaded=Game.load(old);const c=reloaded.player;
 assert.equal(c.clothing.formal,13);assert.equal(c.clothing.casual,11);
 assert.deepEqual(c.owned,['computer']);assert.deepEqual(c.coursesCompleted,[]);
 assert.equal(c.job,'director');
});
test('new save preserves consumed clothing and partially completed coursework',()=>{
 const g=game();g.player.clothing={casual:2,formal:0,business:9};
 g.player.courseProgress={service:1};g.player.coursesCompleted=['digital'];
 const restored=Game.load(g.snapshot());
 assert.deepEqual(restored.snapshot(),g.snapshot());
});
test('wardrobe and certifications are isolated between hotseat players',()=>{
 const g=new Game({mode:'hotseat'});g.player.clothing.business=9;
 g.player.courseProgress.service=1;
 g.endTurn();assert.equal(g.player.id,'friend');
 assert.equal(g.player.clothing.business,0);
 assert.equal(g.player.courseProgress.service,undefined);
});
test('repeated weekly aging never produces negative clothes',()=>{
 const g=game();for(let k=0;k<60;k++)g.endTurn();
 for(const [key,amount] of Object.entries(g.player.clothing))assert.ok(amount>=0,key);
});

test('rival replenishes clothing and stays economically healthy in 100 seeded campaigns',()=>{
 for(let seed=0;seed<100;seed++){
  const g=new Game({seed:seed*701+13});
  for(let week=0;week<130&&!g.winner;week++)g.endTurn();
  const p=g.players.find(x=>x.isAI);
  assert.ok(p.job,`seed ${seed} is unemployed`);
  assert.equal(p.rentDebt,0,`seed ${seed} in arrears`);
  assert.equal(p.hunger,0,`seed ${seed} is hungry`);
  if(!g.winner)assert.equal(g.isDressedFor(p,g.getJob(p)),true,`seed ${seed} cannot work`);
 }
});

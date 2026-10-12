(function (root) {
  'use strict';
  const places = [
    {id:'home',      name:'Your Place',        tag:'REST & RECHARGE', icon:'🏠', color:'#71cfaa', blurb:'Your tiny corner of the city. Cozy, with ambitions bigger than the living room.', cell:[1,1]},
    {id:'agency',    name:'Career Center',     tag:'FIND YOUR PATH',  icon:'💼', color:'#a8b2ff', blurb:'Every great career starts somewhere. Usually with paperwork.', cell:[2,1]},
    {id:'market',    name:'Fresh & Frugal',    tag:'GROCERIES',       icon:'🥑', color:'#f9cd79', blurb:'Because even future CEOs need dinner.', cell:[3,1]},
    {id:'diner',     name:'The Good Fork',     tag:'FOOD & WORK',     icon:'🍜', color:'#ff9b89', blurb:'Hot meals, part-time shifts, and the occasional life revelation.', cell:[4,1]},
    {id:'university',name:'Brightside U',      tag:'EDUCATION',       icon:'🎓', color:'#ad9dff', blurb:'Learn something new, and maybe earn a better paycheck.', cell:[4,2]},
    {id:'office',    name:'Northstar Tower',  tag:'CAREERS',         icon:'🏙️', color:'#9be2ed', blurb:'An inspiring view. An inbox that never ends.', cell:[4,3]},
    {id:'cinema',    name:'Starlight Social',  tag:'HAPPINESS',       icon:'🎟️', color:'#ffafe0', blurb:'The city is more than deadlines. Make a memory.', cell:[4,4]},
    {id:'bank',      name:'Future Bank',      tag:'MONEY',           icon:'🏦', color:'#8dc0ff', blurb:'A little savings today, a lot less panic tomorrow.', cell:[4,5]},
    {id:'housing',   name:'Open Door Realty', tag:'HOUSING',         icon:'🔑', color:'#ffd09a', blurb:'More square feet. More rent. More questionable decisions.', cell:[3,5]},
    {id:'boutique',  name:'Thread Theory',    tag:'WARDROBE',        icon:'👕', color:'#eea9f5', blurb:'Dress for the job you want, not the laundry you forgot.', cell:[2,5]},
    {id:'tech',      name:'Circuit City',     tag:'TECH & WORK',     icon:'💻', color:'#8ce4db', blurb:'Devices that unlock opportunities. And extremely fancy receipts.', cell:[1,5]},
    {id:'clinic',    name:'Wellbeing Clinic', tag:'HEALTH',          icon:'🩺', color:'#b2e59b', blurb:'You only get one character. Take care of them.', cell:[1,4]},
    {id:'pawn',      name:'Second Chance Pawn', tag:'PAWN & REDEEM', icon:'⚖️', color:'#e5be89', blurb:'Give useful things a second chance. Pawn valuables for short-term cash, then redeem them before the deadline.', cell:[1,3]}
  ];
  const citizens = {
    home:{name:'Mira',title:'The neighbor who knows everybody',greeting:'I keep a spare key and unsolicited advice. Both come in handy.',lines:['Even success needs somewhere you can kick off your shoes.','The elevator is broken again. Look at that: free exercise.','You have a whole week ahead of you. Use a little of it for yourself.']},
    agency:{name:'Theo',title:'Career coach / motivational realist',greeting:'Your résumé looks ambitious. Your font choice is even bolder.',lines:['Qualifications open doors. Reliability keeps them open.','Your next promotion begins with today’s tiny decisions.','Everybody wants experience; nobody wants to hire the inexperienced. Funny, that.']},
    market:{name:'Nia',title:'Produce merchant / part-time philosopher',greeting:'Welcome! The apples are crisp and the prices are negotiable in theory.',lines:['Buy food before you buy lottery tickets. That is my professional opinion.','The bargain aisle has saved more dreams than the stock market.','Seasonal vegetables are the economy you can actually taste.']},
    diner:{name:'Gus',title:'Owner of the Good Fork',greeting:'Sit down. Coffee is hot. The advice is questionable.',lines:['You can chase your dreams on an empty stomach, but I would not advise it.','I was going to retire. Then I saw the rent.','A good meal can fix a surprising number of Wednesdays.']},
    university:{name:'Professor Rowan',title:'Lifelong learner and occasional lecturer',greeting:'Welcome to Brightside. Tuition buys access, not wisdom.',lines:['The final exam is showing up again after you fail.','Knowledge pays compound interest of its own.','Half my students are here to learn. The other half want the diploma. Both are welcome.']},
    office:{name:'Harper',title:'Northstar team lead',greeting:'The coffee machine is down, so we are briefly an honest company.',lines:['Never confuse a full calendar with a full life.','I measure success in how many meetings we do not schedule.','A promotion is not a personality transplant.']},
    cinema:{name:'Sol',title:'Projectionist and curator of joy',greeting:'Two tickets for escapism? Oh, you are here alone. Even better.',lines:['Time spent laughing is not time wasted.','Our popcorn machine has survived three economic downturns.','Tonight’s feature: a person learns to switch off their email. Science fiction.']},
    bank:{name:'Elena',title:'Savings advisor / reluctant optimist',greeting:'We have savings accounts and the world’s least exciting pens.',lines:['A rainy-day fund is just an umbrella for your future self.','The market goes up and down. Your grocery bill mostly goes up.','Financial advice: look at the numbers before they look at you.']},
    housing:{name:'Beck',title:'Real estate agent with impeccable timing',greeting:'Every property is charming until you meet the plumbing.',lines:['A house is a home. Until the rent is due.','More rooms mean more places to lose your keys.','I sold a loft with a view of another loft. The buyer called it urban character.']},
    boutique:{name:'Rafi',title:'Fashion stylist and amateur comedian',greeting:'Clothes do not make the person. But recruiters do tend to notice.',lines:['Dress for the role, not the weather report.','This jacket has pockets. Actual usable pockets.','Looking confident is cheaper than being confident. Usually.']},
    tech:{name:'Pip',title:'Repair specialist / cable untangler',greeting:'We have gadgets. We also have regrets about some gadgets.',lines:['Have you tried turning it off and remembering to eat?','The best upgrade is still a good night of sleep.','Every computer is fast until you open thirteen spreadsheets.']},
    clinic:{name:'Dr. Jun',title:'A doctor with a practical streak',greeting:'Hello. I prescribe sleep, food, and fewer heroic workweeks.',lines:['Your body is not an infinite-energy achievement unlock.','A break is maintenance, not a failure to optimize.','The most expensive upgrade is neglecting yourself for a decade.']},
    pawn:{name:'Morgan',title:'Second-hand merchant and keeper of second chances',greeting:'Everything here has a history. Some things have a redemption deadline.',lines:['A short-term loan can help, but read the redemption slip.','The trick with bargains is knowing what an item is worth to you.','Every item tells a story. This one still has its warranty sticker.']}
  };
  // Branching stories are original. Each visit has two choices and always offers a free exit.
  const encounters = {
    home:{title:'The hallway dilemma',story:'Mira catches you outside your apartment. The elderly neighbor on the third floor needs help moving a bookshelf.',choices:[{id:'help',label:'Help carry it upstairs',detail:'A good deed. +7 happiness, +2 reliability.',effects:{happiness:7,dependability:2}},{id:'decline',label:'Wish them luck',detail:'You have plans. No cost.',effects:{}}]},
    agency:{title:'The résumé clinic',story:'Theo offers a one-on-one résumé workshop. It is a rare chance to polish your professional story.',choices:[{id:'practice',label:'Stay for free interview practice',detail:'+3 experience, +2 reliability.',effects:{experience:3,dependability:2}},{id:'course',label:'Buy the premium coaching pack',detail:'$35 · +8 experience, +4 reliability.',effects:{cash:-35,experience:8,dependability:4}}]},
    market:{title:'The unsold fruit',story:'Nia has a crate of slightly imperfect produce. The supermarket would throw it away tonight.',choices:[{id:'rescue',label:'Take the surprise food bag',detail:'$10 · +1 grocery portion.',effects:{cash:-10,groceries:1}},{id:'pass',label:'Leave it for the food pantry',detail:'+3 happiness.',effects:{happiness:3}}]},
    diner:{title:'A regular in a pinch',story:'Gus has a queue out the door and a new hire missed their first shift.',choices:[{id:'pitch',label:'Help clear tables',detail:'Earn $40 · +2 experience, -4 energy.',effects:{cash:40,experience:2,energy:-4}},{id:'cheer',label:'Offer moral support',detail:'+3 happiness.',effects:{happiness:3}}]},
    university:{title:'The open lecture',story:'Professor Rowan asks for volunteers to join a public research discussion about the city.',choices:[{id:'join',label:'Contribute to the discussion',detail:'+4 experience, +3 happiness.',effects:{experience:4,happiness:3}},{id:'observe',label:'Listen from the back',detail:'+2 experience.',effects:{experience:2}}]},
    office:{title:'The meeting that ate Friday',story:'Harper has a choice: spend the afternoon preparing another slide deck or talk to the people affected by the project.',choices:[{id:'people',label:'Talk to the people',detail:'+4 reliability, +4 happiness.',effects:{dependability:4,happiness:4}},{id:'charts',label:'Help with the graphs',detail:'+6 experience, -3 energy.',effects:{experience:6,energy:-3}}]},
    cinema:{title:'An unexpected premiere',story:'Sol has two spare passes to an experimental short-film night. Half the city will pretend to understand it.',choices:[{id:'go',label:'Attend the premiere',detail:'+9 happiness, -4 energy.',effects:{happiness:9,energy:-4}},{id:'skip',label:'Save the evening for later',detail:'+2 energy.',effects:{energy:2}}]},
    bank:{title:'The savings challenge',story:'Elena suggests a tiny challenge: set aside a hundred dollars without touching it until next month.',choices:[{id:'save',label:'Move $100 into savings',detail:'Transfer $100 from cash to savings.',effects:{cash:-100,bank:100}},{id:'think',label:'Think it over',detail:'+2 happiness. A thoughtful choice.',effects:{happiness:2}}]},
    housing:{title:'The model apartment',story:'Beck invites you to a viewing. There is a rooftop garden, and the closet is bizarrely small.',choices:[{id:'tour',label:'Tour the building',detail:'+5 happiness. New ideas for the future.',effects:{happiness:5}},{id:'ignore',label:'Read the fine print first',detail:'+2 reliability.',effects:{dependability:2}}]},
    boutique:{title:'The interview outfit',story:'Rafi found an unsold jacket that would look great at your next interview.',choices:[{id:'take',label:'Buy the lucky jacket',detail:'$45 · +5 happiness, +3 reliability.',effects:{cash:-45,happiness:5,dependability:3}},{id:'decline',label:'Style what you already own',detail:'+2 happiness.',effects:{happiness:2}}]},
    tech:{title:'The repair café',story:'Pip is teaching neighbors to repair old electronics instead of throwing them away.',choices:[{id:'learn',label:'Help at the repair table',detail:'+5 experience, -3 energy.',effects:{experience:5,energy:-3}},{id:'donate',label:'Give the project $25',detail:'$25 · +6 happiness.',effects:{cash:-25,happiness:6}}]},
    clinic:{title:'A community health fair',story:'Dr. Jun has organized a free wellbeing check. A queue stretches down the block.',choices:[{id:'stay',label:'Take the checkup',detail:'+12 energy, +3 happiness.',effects:{energy:12,happiness:3}},{id:'volunteer',label:'Help with the sign-up desk',detail:'+4 reliability, +4 happiness.',effects:{dependability:4,happiness:4}}]},
    pawn:{title:'The forgotten keepsake',story:'Morgan has found a box of family photographs among unclaimed items and wants to reunite it with its owner.',choices:[{id:'help',label:'Help find the owner',detail:'+6 happiness, +2 reliability.',effects:{happiness:6,dependability:2}},{id:'pass',label:'Wish them good luck',detail:'No cost.',effects:{}}]}
  };
  // Season-length stories join two residents and can permanently improve city services.
  // The chapter definitions are fixed data. All rewards pass through engine allowlists.
  const storyArcs = [
    {id:'neighbors',title:'The Block That Built Itself',host:'home',partner:'market',sector:'food',bonus:.95,
      description:'Mira and Nia want a neighborhood pantry that outlasts the harvest.',
      chapters:[
        {title:'One empty storefront',story:'Mira shows you a vacant unit. Nia has surplus produce, but a pantry needs volunteers who show up.',choices:[
          {id:'recruit',label:'Help build the volunteer list',detail:'+7 trust with Mira, +5 with Nia; +5 reliability',effects:{dependability:5,happiness:3},trust:7,partnerTrust:5},
          {id:'wait',label:'Offer a smaller pilot first',detail:'+2 trust with Mira; +3 experience',effects:{experience:3},trust:2,partnerTrust:0}]},
        {title:'The fridge problem',story:'Two weeks later, Nia finds a donated refrigerator. The repair bill is $60 and the clock is ticking.',choices:[
          {id:'repair',label:'Pay $60 toward the repair',detail:'-$60, +7 trust with Nia; +6 reliability',effects:{cash:-60,dependability:6},trust:7,partnerTrust:7},
          {id:'borrow',label:'Organize a food-share rota instead',detail:'+5 experience, +3 trust with Mira',effects:{experience:5},trust:3,partnerTrust:-2}]},
        {title:'A pantry for everyone',story:'Mira is ready to open the doors, but the project needs one final commitment to stay open for the whole neighborhood.',choices:[
          {id:'open',label:'Help open the community pantry',detail:'City food permanently 5% cheaper; +10 happiness',effects:{happiness:10,groceries:1},trust:10,partnerTrust:9,publicWorks:true},
          {id:'private',label:'Leave the project to volunteers',detail:'+4 experience, modest trust gain; no city-wide discount',effects:{experience:4},trust:2,partnerTrust:1}]}
      ]},
    {id:'secondchance',title:'Second Chances Workshop',host:'agency',partner:'tech',sector:'wage',bonus:1.05,
      description:'Theo and Pip have a plan to turn discarded computers into paid training.',
      chapters:[
        {title:'A line on a résumé',story:'Theo knows people who cannot get hired without experience. Pip has broken machines that could become a training workshop.',choices:[
          {id:'mentor',label:'Volunteer as a trainee mentor',detail:'+7 Theo trust, +5 Pip trust, +6 experience',effects:{experience:6,energy:-3},trust:7,partnerTrust:5},
          {id:'resume',label:'Help polish résumés instead',detail:'+4 reliability, +2 Theo trust',effects:{dependability:4},trust:2,partnerTrust:-1}]},
        {title:'The broken circuit',story:'Pip has sourced spare parts. Building working training kits will take a late evening at the repair tables.',choices:[
          {id:'build',label:'Spend the evening building kits',detail:'-$35 parts; +8 experience, +7 Pip trust',effects:{cash:-35,experience:8,energy:-6},trust:4,partnerTrust:7},
          {id:'fundraise',label:'Write a fundraising proposal',detail:'+5 dependability, +3 Theo trust',effects:{dependability:5},trust:3,partnerTrust:0}]},
        {title:'The hiring promise',story:'Local employers will sponsor the workshop if you advocate for trainees to receive a real starting wage.',choices:[
          {id:'fairpay',label:'Back a paid apprenticeship',detail:'City shift wages permanently 5% higher; +7 reliability',effects:{dependability:7,happiness:5},trust:10,partnerTrust:8,publicWorks:true},
          {id:'unpaid',label:'Recommend a voluntary internship',detail:'+5 experience, but Pip loses 8 trust',effects:{experience:5},trust:2,partnerTrust:-8}]}
      ]},
    {id:'afterhours',title:'The City After Hours',host:'cinema',partner:'clinic',sector:'leisure',bonus:.92,
      description:'Sol and Jun are turning quiet evenings into affordable community events.',
      chapters:[
        {title:'The lights are still on',story:'Sol wants to keep the cinema accessible to people on tight budgets. Jun suggests a quiet sensory-friendly night.',choices:[
          {id:'listen',label:'Help plan an accessible screening',detail:'+5 Sol trust, +6 Jun trust; +5 happiness',effects:{happiness:5},trust:5,partnerTrust:6},
          {id:'posters',label:'Design posters instead',detail:'+4 experience, +2 Sol trust',effects:{experience:4},trust:2,partnerTrust:0}]},
        {title:'An evening without pressure',story:'The test screening is nearly ready. Sol needs helpers and Jun wants a calm room for anyone overwhelmed.',choices:[
          {id:'host',label:'Host the quiet room',detail:'+7 Jun trust, +9 happiness, -5 energy',effects:{happiness:9,energy:-5},trust:5,partnerTrust:7},
          {id:'tickets',label:'Work at the ticket desk',detail:'Earn $30, +3 Sol trust',effects:{cash:30},trust:3,partnerTrust:-2}]},
        {title:'A permanent place to belong',story:'A monthly accessible arts night is possible, if the city agrees to keep the tickets affordable.',choices:[
          {id:'community',label:'Help launch community evenings',detail:'City leisure prices permanently 8% lower; +12 happiness',effects:{happiness:12},trust:9,partnerTrust:9,publicWorks:true},
          {id:'premium',label:'Favor the exclusive premiere',detail:'Earn $85, but Jun loses 8 trust; no city discount',effects:{cash:85},trust:4,partnerTrust:-8}]}
      ]}
  ];
  const headlines=[
    'The community garden is looking for volunteers. The tomatoes are judging everybody.',
    'Northstar Tower announces a four-day meeting week. Staff ask if that means fewer meetings.',
    'Local cinema adds afternoon screenings for people who have already had enough of today.',
    'Future Bank reports cautious optimism. Local bakery reports excellent croissants.',
    'Brightside U launches a course on financial literacy. Tuition is still confusing.',
    'The city votes to keep its public benches. Everyone agrees that sitting is underrated.',
    'A downtown café promises the strongest coffee in town. Claims remain unverified.'
  ];
  // Every four weeks, one city-wide event reshapes prices, wages, and opportunities.
  // Modifiers apply only to listed sectors; rent and savings transfers are never modified.
  const cityEvents = [
    {id:'garden',title:'The community harvest',venue:'market',description:'Local growers have a bumper crop. Fresh food costs less, and extra hands are welcome.',prices:{food:.80},wage:1,opportunity:{title:'Help at the harvest',detail:'3h · 2 grocery portions, +3 happiness',hours:3,effects:{groceries:2,happiness:3}}},
    {id:'career',title:'Hiring season',venue:'agency',description:'Employers compete for applicants. Pay is temporarily better for every shift.',prices:{tuition:1.05},wage:1.13,opportunity:{title:'Attend the job fair',detail:'3h · +9 experience, +2 reliability',hours:3,effects:{experience:9,dependability:2}}},
    {id:'arts',title:'The city after dark',venue:'cinema',description:'A neighbourhood arts festival brightens the evenings. Tickets are discounted.',prices:{leisure:.65},wage:1,opportunity:{title:'Volunteer at the festival',detail:'3h · +13 happiness, -5 energy',hours:3,effects:{happiness:13,energy:-5}}},
    {id:'housing',title:'The renters forum',venue:'housing',description:'Tenants are organizing a community meeting about rising housing costs.',prices:{retail:1.04},wage:1,opportunity:{title:'Join the renters forum',detail:'3h · +6 reliability, +6 happiness',hours:3,effects:{dependability:6,happiness:6}}},
    {id:'study',title:'Lifelong learning month',venue:'university',description:'Brightside U is subsidizing short courses for local residents.',prices:{tuition:.70},wage:1,opportunity:{title:'Attend an open workshop',detail:'3h · +10 experience, +2 happiness',hours:3,effects:{experience:10,happiness:2}}},
    {id:'repair',title:'The repair revival',venue:'tech',description:'Demand for repair skills is growing, while new electronics are scarce.',prices:{retail:1.18},wage:1.04,opportunity:{title:'Join the repair drive',detail:'3h · Earn $40, +4 experience, -6 energy',hours:3,effects:{cash:40,experience:4,energy:-6}}},
    {id:'rush',title:'Lunch rush!',venue:'diner',description:'A food review went viral. Meals cost more; temporary shifts are everywhere.',prices:{food:1.16},wage:1.05,opportunity:{title:'Take an extra lunch shift',detail:'3h · Earn $65, -9 energy',hours:3,effects:{cash:65,energy:-9}}},
    {id:'wellness',title:'Neighbourhood wellness',venue:'clinic',description:'The clinic is hosting a free city-wide health week.',prices:{health:.60},wage:1,opportunity:{title:'Visit the wellness fair',detail:'3h · +25 energy, +3 happiness',hours:3,effects:{energy:25,happiness:3}}},
    {id:'finance',title:'Money matters',venue:'bank',description:'Future Bank is running practical workshops on budgets and investment risks.',prices:{tuition:.90},wage:1,opportunity:{title:'Learn about money',detail:'3h · +8 experience, +3 reliability',hours:3,effects:{experience:8,dependability:3}}},
    {id:'neighbours',title:'Good neighbours week',venue:'home',description:'Your apartment block is planning a little get-together.',prices:{leisure:1.10},wage:1,opportunity:{title:'Host a block gathering',detail:'3h · +10 happiness, -4 energy',hours:3,effects:{happiness:10,energy:-4}}}
  ];
  const favors = {
    home:{title:'Mira’s spare-hour help',detail:'2h · +12 energy, +5 happiness',hours:2,effects:{energy:12,happiness:5}},
    agency:{title:'Theo’s private reference',detail:'2h · +6 experience, +4 reliability',hours:2,effects:{experience:6,dependability:4}},
    market:{title:'Nia’s friends-and-family produce',detail:'2h · +2 grocery portions',hours:2,effects:{groceries:2}},
    diner:{title:'Gus’s staff supper',detail:'2h · Fed this week, +8 happiness',hours:2,effects:{fed:true,happiness:8}},
    university:{title:'Rowan’s study circle',detail:'2h · +9 experience',hours:2,effects:{experience:9}},
    office:{title:'Harper’s inside advice',detail:'2h · +5 reliability, +4 experience',hours:2,effects:{dependability:5,experience:4}},
    cinema:{title:'Sol’s backstage pass',detail:'2h · +14 happiness',hours:2,effects:{happiness:14}},
    bank:{title:'Elena’s budgeting clinic',detail:'2h · +6 reliability, +4 experience',hours:2,effects:{dependability:6,experience:4}},
    housing:{title:'Beck’s moving-day network',detail:'2h · +8 happiness, +3 reliability',hours:2,effects:{happiness:8,dependability:3}},
    boutique:{title:'Rafi’s personal styling',detail:'2h · +7 happiness, +3 reliability',hours:2,effects:{happiness:7,dependability:3}},
    tech:{title:'Pip’s paid repair referral',detail:'2h · Earn $45, -4 energy',hours:2,effects:{cash:45,energy:-4}},
    clinic:{title:'Jun’s wellness check-in',detail:'2h · +23 energy',hours:2,effects:{energy:23}},
    pawn:{title:'Morgan’s thoughtful appraisal',detail:'2h · +4 experience, +5 reliability',hours:2,effects:{experience:4,dependability:5}}
  };
  const jobs = [
    {id:'server',   name:'Cafe Server',         place:'diner',       wage:14, tier:1, education:0, experience:0, dependability:0, clothes:'casual', track:'Hospitality', caption:'Good tips. Better coffee.'},
    {id:'stock',    name:'Store Associate',     place:'market',      wage:16, tier:1, education:0, experience:0, dependability:0, clothes:'casual', track:'Retail', caption:'Aisle three needs a hero.'},
    {id:'repair',   name:'Device Technician',   place:'tech',        wage:24, tier:2, education:1, experience:8, dependability:12, clothes:'casual', caption:'Have you tried turning it off?'},
    {id:'teller',   name:'Bank Associate',      place:'bank',        wage:28, tier:3, education:1, experience:12,dependability:15, clothes:'casual', caption:'Counting on your future.'},
    {id:'tutor',    name:'University Tutor',    place:'university',  wage:38, tier:4, education:2, experience:18,dependability:22, clothes:'casual', caption:'The answers were inside you.'},
    {id:'analyst',  name:'Business Analyst',    place:'office',      wage:52, tier:5, education:2, experience:25,dependability:28, clothes:'formal', caption:'All the charts, all the time.'},
    {id:'engineer', name:'Senior Engineer',     place:'tech',        wage:72, tier:6, education:3, experience:35,dependability:38, clothes:'casual', caption:'Build what comes next.'},
    {id:'director', name:'Strategy Director',   place:'office',      wage:105,tier:7, education:4, experience:48,dependability:45, clothes:'formal', track:'Business', caption:'You have become the meeting.'},
    // Added branches are alternatives to the existing eight roles. Legacy job IDs remain stable.
    {id:'cook',name:'Line Cook',place:'diner',wage:15,tier:1,education:0,experience:0,dependability:0,clothes:'casual',track:'Hospitality',caption:'A hot pan and a cool head.'},
    {id:'kitchenlead',name:'Kitchen Supervisor',place:'diner',wage:29,tier:3,education:1,experience:16,dependability:21,clothes:'formal',course:'service',track:'Hospitality',caption:'Keep the kitchen moving.'},
    {id:'storelead',name:'Retail Supervisor',place:'market',wage:30,tier:3,education:1,experience:17,dependability:20,clothes:'formal',course:'service',track:'Retail',caption:'Keep the shelves and team stocked.'},
    {id:'storemanager',name:'Store Manager',place:'market',wage:44,tier:4,education:2,experience:28,dependability:31,clothes:'formal',course:'leadership',track:'Retail',caption:'A budget with aisles.'},
    {id:'stylist',name:'Wardrobe Stylist',place:'boutique',wage:23,tier:2,education:0,experience:9,dependability:13,clothes:'casual',track:'Retail',caption:'Dress for your ambitions.'},
    {id:'boutiquelead',name:'Boutique Manager',place:'boutique',wage:46,tier:4,education:2,experience:29,dependability:30,clothes:'formal',course:'leadership',track:'Retail',caption:'Make an impression.'},
    {id:'techlead',name:'Technical Lead',place:'tech',wage:53,tier:5,education:2,experience:30,dependability:31,clothes:'formal',course:'digital',track:'Technology',caption:'Take ownership of the next release.'},
    {id:'banklead',name:'Bank Supervisor',place:'bank',wage:56,tier:5,education:2,experience:33,dependability:35,clothes:'formal',course:'finance',track:'Finance',caption:'Good decisions compound.'},
    {id:'bankmanager',name:'Bank Manager',place:'bank',wage:85,tier:6,education:3,experience:44,dependability:43,clothes:'business',course:'leadership',track:'Finance',caption:'Meet the quarterly targets.'},
    {id:'professor',name:'University Professor',place:'university',wage:87,tier:6,education:4,experience:40,dependability:39,clothes:'business',course:'leadership',track:'Academia',caption:'Teach the next generation.'},
    {id:'officelead',name:'Operations Manager',place:'office',wage:90,tier:6,education:3,experience:43,dependability:42,clothes:'business',course:'leadership',track:'Business',caption:'Organize the chaos.'}
  ];
  // Classic DOS/floppy job table (37 positions). CD-only QT Janitor and Socket Clerk intentionally excluded.
  // All roles preserve original wage/stat/degree/uniform data; shared modern building tiles represent some employers.
  const classicJobs = [{"id":"classic-zmart-clerk","name":"Clerk","employer":"Z-Mart","place":"market","wage":5,"tier":2,"clothes":"casual","track":"Z-Mart","experience":10,"dependability":10,"degrees":[],"entryGuaranteed":false},{"id":"classic-zmart-assistant-manager","name":"Assistant Manager","employer":"Z-Mart","place":"market","wage":7,"tier":2,"clothes":"formal","track":"Z-Mart","experience":20,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-zmart-manager","name":"Manager","employer":"Z-Mart","place":"market","wage":8,"tier":3,"clothes":"business","track":"Z-Mart","experience":30,"dependability":30,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-monolith-cook","name":"Cook","employer":"Monolith Burgers","place":"diner","wage":5,"tier":2,"clothes":"casual","track":"Monolith Burgers","experience":0,"dependability":10,"degrees":[],"entryGuaranteed":true},{"id":"classic-monolith-clerk","name":"Clerk","employer":"Monolith Burgers","place":"diner","wage":6,"tier":2,"clothes":"casual","track":"Monolith Burgers","experience":10,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-monolith-assistant-manager","name":"Assistant Manager","employer":"Monolith Burgers","place":"diner","wage":7,"tier":2,"clothes":"casual","track":"Monolith Burgers","experience":20,"dependability":30,"degrees":[],"entryGuaranteed":false},{"id":"classic-monolith-manager","name":"Manager","employer":"Monolith Burgers","place":"diner","wage":8,"tier":3,"clothes":"formal","track":"Monolith Burgers","experience":30,"dependability":40,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-qt-salesperson","name":"Salesperson","employer":"QT Clothing","place":"boutique","wage":8,"tier":3,"clothes":"formal","track":"QT Clothing","experience":30,"dependability":30,"degrees":[],"entryGuaranteed":false},{"id":"classic-qt-assistant-manager","name":"Assistant Manager","employer":"QT Clothing","place":"boutique","wage":9,"tier":3,"clothes":"business","track":"QT Clothing","experience":40,"dependability":40,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-qt-manager","name":"Manager","employer":"QT Clothing","place":"boutique","wage":12,"tier":4,"clothes":"business","track":"QT Clothing","experience":50,"dependability":50,"degrees":["business-admin"],"entryGuaranteed":false},{"id":"classic-socket-salesperson","name":"Salesperson","employer":"Socket City","place":"tech","wage":7,"tier":2,"clothes":"formal","track":"Socket City","experience":30,"dependability":30,"degrees":[],"entryGuaranteed":false},{"id":"classic-socket-electronics-repairman","name":"Electronics Repairman","employer":"Socket City","place":"tech","wage":11,"tier":3,"clothes":"casual","track":"Socket City","experience":40,"dependability":40,"degrees":["electronics"],"entryGuaranteed":false},{"id":"classic-socket-manager","name":"Manager","employer":"Socket City","place":"tech","wage":14,"tier":4,"clothes":"business","track":"Socket City","experience":40,"dependability":40,"degrees":["electronics","junior-college"],"entryGuaranteed":false},{"id":"classic-hitech-janitor","name":"Janitor","employer":"Hi-Tech U","place":"university","wage":5,"tier":2,"clothes":"casual","track":"Hi-Tech U","experience":10,"dependability":10,"degrees":[],"entryGuaranteed":false},{"id":"classic-hitech-teacher","name":"Teacher","employer":"Hi-Tech U","place":"university","wage":11,"tier":3,"clothes":"formal","track":"Hi-Tech U","experience":40,"dependability":50,"degrees":["academic"],"entryGuaranteed":false},{"id":"classic-hitech-professor","name":"Professor","employer":"Hi-Tech U","place":"university","wage":20,"tier":6,"clothes":"formal","track":"Hi-Tech U","experience":50,"dependability":60,"degrees":["research"],"entryGuaranteed":false},{"id":"classic-factory-janitor","name":"Janitor","employer":"Factory","place":"office","wage":7,"tier":2,"clothes":"casual","track":"Factory","experience":10,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-factory-assembly-worker","name":"Assembly Worker","employer":"Factory","place":"office","wage":8,"tier":3,"clothes":"casual","track":"Factory","experience":30,"dependability":30,"degrees":["trade-school"],"entryGuaranteed":false},{"id":"classic-factory-secretary","name":"Secretary","employer":"Factory","place":"office","wage":9,"tier":3,"clothes":"formal","track":"Factory","experience":40,"dependability":40,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-factory-machinist-s-helper","name":"Machinist's Helper","employer":"Factory","place":"office","wage":10,"tier":3,"clothes":"casual","track":"Factory","experience":40,"dependability":40,"degrees":["pre-engineering"],"entryGuaranteed":false},{"id":"classic-factory-executive-secretary","name":"Executive Secretary","employer":"Factory","place":"office","wage":18,"tier":5,"clothes":"business","track":"Factory","experience":50,"dependability":50,"degrees":["business-admin"],"entryGuaranteed":false},{"id":"classic-factory-machinist","name":"Machinist","employer":"Factory","place":"office","wage":19,"tier":5,"clothes":"casual","track":"Factory","experience":50,"dependability":50,"degrees":["engineering"],"entryGuaranteed":false},{"id":"classic-factory-department-manager","name":"Department Manager","employer":"Factory","place":"office","wage":22,"tier":6,"clothes":"business","track":"Factory","experience":60,"dependability":60,"degrees":["junior-college","engineering"],"entryGuaranteed":false},{"id":"classic-factory-engineer","name":"Engineer","employer":"Factory","place":"office","wage":23,"tier":6,"clothes":"business","track":"Factory","experience":60,"dependability":60,"degrees":["junior-college","engineering"],"entryGuaranteed":false},{"id":"classic-factory-general-manager","name":"General Manager","employer":"Factory","place":"office","wage":25,"tier":7,"clothes":"business","track":"Factory","experience":70,"dependability":70,"degrees":["business-admin","engineering"],"entryGuaranteed":false},{"id":"classic-bank-janitor","name":"Janitor","employer":"Bank","place":"bank","wage":6,"tier":2,"clothes":"casual","track":"Bank","experience":10,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-bank-teller","name":"Teller","employer":"Bank","place":"bank","wage":10,"tier":3,"clothes":"formal","track":"Bank","experience":40,"dependability":40,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-bank-assistant-manager","name":"Assistant Manager","employer":"Bank","place":"bank","wage":14,"tier":4,"clothes":"business","track":"Bank","experience":50,"dependability":50,"degrees":["business-admin"],"entryGuaranteed":false},{"id":"classic-bank-manager","name":"Manager","employer":"Bank","place":"bank","wage":19,"tier":5,"clothes":"business","track":"Bank","experience":60,"dependability":60,"degrees":["business-admin"],"entryGuaranteed":false},{"id":"classic-bank-broker","name":"Broker","employer":"Bank","place":"bank","wage":22,"tier":6,"clothes":"business","track":"Bank","experience":70,"dependability":70,"degrees":["business-admin","academic"],"entryGuaranteed":false},{"id":"classic-blacks-janitor","name":"Janitor","employer":"Black's Market","place":"market","wage":6,"tier":2,"clothes":"casual","track":"Black's Market","experience":10,"dependability":10,"degrees":[],"entryGuaranteed":false},{"id":"classic-blacks-checker","name":"Checker","employer":"Black's Market","place":"market","wage":8,"tier":3,"clothes":"casual","track":"Black's Market","experience":20,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-blacks-butcher","name":"Butcher","employer":"Black's Market","place":"market","wage":12,"tier":4,"clothes":"casual","track":"Black's Market","experience":30,"dependability":30,"degrees":["trade-school"],"entryGuaranteed":false},{"id":"classic-blacks-assistant-manager","name":"Assistant Manager","employer":"Black's Market","place":"market","wage":15,"tier":4,"clothes":"formal","track":"Black's Market","experience":40,"dependability":40,"degrees":["junior-college"],"entryGuaranteed":false},{"id":"classic-blacks-manager","name":"Manager","employer":"Black's Market","place":"market","wage":18,"tier":5,"clothes":"business","track":"Black's Market","experience":50,"dependability":50,"degrees":["business-admin"],"entryGuaranteed":false},{"id":"classic-rent-groundskeeper","name":"Groundskeeper","employer":"Rent Office","place":"housing","wage":7,"tier":2,"clothes":"casual","track":"Rent Office","experience":10,"dependability":20,"degrees":[],"entryGuaranteed":false},{"id":"classic-rent-apartment-manager","name":"Apartment Manager","employer":"Rent Office","place":"housing","wage":9,"tier":3,"clothes":"casual","track":"Rent Office","experience":30,"dependability":30,"degrees":["junior-college"],"entryGuaranteed":false}];
  // Classic job IDs/employer names remain DOS-accurate for engine and reference tables.
  // Every active job nevertheless has one real workplace tile. Two original stores
  // deliberately share the contemporary Fresh & Frugal venue until the world expands.
  const classicEmployerVenues = Object.freeze({
    'Z-Mart':{place:'market',department:'Discount'},
    'Monolith Burgers':{place:'diner'},
    'QT Clothing':{place:'boutique'},
    'Socket City':{place:'tech'},
    'Hi-Tech U':{place:'university'},
    'Factory':{place:'office'},
    'Bank':{place:'bank'},
    "Black's Market":{place:'market',department:'Groceries'},
    'Rent Office':{place:'housing'}
  });
  function jobWorkplace(job){
    if(!job)return null;
    const original=job.employer||null;
    const classic=String(job.id||'').startsWith('classic-');
    const mapping=classic?classicEmployerVenues[original]:null;
    const venue=places.find(p=>p.id===job.place);
    if(!venue)throw Error(`Missing venue ${job.place} for job ${job.id}`);
    if(classic&&(!mapping||mapping.place!==job.place))throw Error(`Classic employer/venue mapping mismatch: ${original} / ${job.id}`);
    return Object.freeze({place:venue.id,boardName:venue.name,department:mapping?.department||null,
      label:mapping?.department?`${venue.name} · ${mapping.department}`:venue.name,
      originalName:original});
  }
  for(const job of classicJobs)jobWorkplace(job);

  // Classic has eleven independent diplomas with prerequisites; Modern keeps its four-stage ladder.
  // Lesson count, enrollment, +5 graduation reliability, and cap formula follow original mechanics.
  const classicDegrees = [
    {id:'junior-college',name:'Junior College',requires:[]},
    {id:'trade-school',name:'Trade School',requires:[]},
    {id:'business-admin',name:'Business Administration',requires:['junior-college']},
    {id:'academic',name:'Academic',requires:['junior-college']},
    {id:'electronics',name:'Electronics',requires:['trade-school']},
    {id:'pre-engineering',name:'Pre-Engineering',requires:['trade-school']},
    {id:'engineering',name:'Engineering',requires:['pre-engineering']},
    {id:'graduate-school',name:'Graduate School',requires:['academic']},
    {id:'post-doctoral',name:'Post-Doctoral',requires:['graduate-school']},
    {id:'research',name:'Research',requires:['post-doctoral']},
    {id:'publishing',name:'Publishing',requires:['research']}
  ];
  // Provisional bridge mapping original-style required diplomas onto our existing jobs.
  // Job names, wages and places are still Life Loop originals, NOT the Sierra job table.
  const classicJobRequirements = {
    server:{experience:10,dependability:10,degrees:[]},
    cook:{experience:0,dependability:10,degrees:[]},
    stock:{experience:10,dependability:10,degrees:[]},
    repair:{experience:20,dependability:20,degrees:['electronics']},
    teller:{experience:30,dependability:30,degrees:['junior-college']},
    tutor:{experience:40,dependability:50,degrees:['academic']},
    analyst:{experience:40,dependability:40,degrees:['business-admin']},
    engineer:{experience:60,dependability:60,degrees:['junior-college','engineering']},
    director:{experience:70,dependability:70,degrees:['business-admin','engineering']},
    kitchenlead:{experience:20,dependability:30,degrees:['junior-college']},
    storelead:{experience:20,dependability:20,degrees:[]},
    storemanager:{experience:30,dependability:30,degrees:['junior-college']},
    stylist:{experience:20,dependability:20,degrees:[]},
    boutiquelead:{experience:40,dependability:40,degrees:['business-admin']},
    techlead:{experience:40,dependability:40,degrees:['electronics']},
    banklead:{experience:50,dependability:50,degrees:['business-admin']},
    bankmanager:{experience:60,dependability:60,degrees:['business-admin']},
    professor:{experience:50,dependability:60,degrees:['research']},
    officelead:{experience:60,dependability:60,degrees:['business-admin','engineering']}
  };
  const degrees = [
    {name:'Foundations Certificate', sessions:2, cost:55},
    {name:'Associate Diploma',      sessions:3, cost:85},
    {name:'Bachelor Degree',        sessions:4, cost:125},
    {name:'Master Degree',          sessions:5, cost:170}
  ];
  // Standalone practical qualifications supplement, rather than replace, the existing four academic degrees.
  const courses = [
    {id:'service',name:'Service & Supervision',sessions:2,cost:60,education:0,detail:'Hospitality and retail leadership'},
    {id:'digital',name:'Digital Systems',sessions:2,cost:85,education:1,detail:'Technical team leadership'},
    {id:'finance',name:'Finance & Compliance',sessions:2,cost:100,education:1,detail:'Banking progression'},
    {id:'leadership',name:'People Leadership',sessions:3,cost:135,education:2,detail:'Senior management and academic leadership'}
  ];
  const clothing = {
    casual:{name:'Casual clothes',rank:1},
    formal:{name:'Dress clothes',rank:2},
    business:{name:'Business suit',rank:3}
  };
  const clothingOffers = {
    market:[{id:'casual',cost:35,weeks:9},{id:'formal',cost:90,weeks:9}],
    boutique:[{id:'casual',cost:73,weeks:11},{id:'formal',cost:125,weeks:13},{id:'business',cost:295,weeks:13}]
  };
  const dwellings = {
    studio:{name:'Starter Studio', rent:230, comfort:0},
    apartment:{name:'Sunny Apartment', rent:380, comfort:4},
    loft:{name:'Skyline Loft', rent:620, comfort:8}
  };
  // Original Bank markets (wiki base prices); exact per-week volatility formula is not yet reproduced.
  const classicStocks = [
    {id:'tbills',name:'T-Bills',base:100}, {id:'gold',name:'Gold',base:413},
    {id:'silver',name:'Silver',base:14}, {id:'pork',name:'Pork Bellies',base:20},
    {id:'blue',name:'Blue Chip Stocks',base:49}, {id:'penny',name:'Penny Stocks',base:7}
  ];
  const classicFreshFood = [{units:1,cost:55},{units:2,cost:100},{units:4,cost:190}];
  const GOAL_KEYS = ['wealth','happiness','education','career'];

  // Era selection changes presentation only. Venue IDs, actions, prices and qualification data are shared.
  const worldEras = {
    historical: {label:'Historical',city:'Willowford',description:'Gas lamps, brick storefronts and a bustling old-town high street.',
      names:['The Boarding House','The Guild Hall','Market Square','The Copper Kettle','Royal Academy','The Counting House','Grand Playhouse','The Treasury','Estate Office','The Tailor','Inventors Workshop','The Infirmary']},
    current: {label:'Contemporary',city:'New Day City',description:'A lively modern city, familiar shops and bright everyday optimism.',names:places.map(p=>p.name)},
    scifi: {label:'Sci-Fi',city:'Neon Meridian',description:'Orbiting shuttles, holographic signs and towering neon arcologies.',
      names:['Habitat Pod','Career Nexus','Hydroponics Bay','Star Diner','Orbital Institute','Helix Spire','HoloTheater','Credits Exchange','Habitat Registry','Synthwear Studio','Quantum Works','MediCore']}
  };
  const RULESETS = {
    classic:{id:'classic',name:'Classic Rules (in progress)',hours:60,applicationHours:4,restHours:6,dependabilityStart:20,dependabilityDecay:3,workExperience:1,workDependability:1,entryHours:2,optionalStories:false},
    modern:{id:'modern',name:'Modern Story',hours:40,applicationHours:3,restHours:5,dependabilityStart:10,dependabilityDecay:1,workExperience:5,workDependability:5,entryHours:0,optionalStories:true}
  };
  root.LifeData = {worldEras,RULESETS,places,citizens,encounters,headlines,cityEvents,favors,storyArcs,jobs,classicJobs,degrees,classicDegrees,classicJobRequirements,classicEmployerVenues,jobWorkplace,courses,clothing,clothingOffers,dwellings,classicStocks,classicFreshFood,GOAL_KEYS};
  if (typeof module !== 'undefined' && module.exports) module.exports = root.LifeData;
})(typeof window !== 'undefined' ? window : globalThis);

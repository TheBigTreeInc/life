/* Localized UI labels. Locale is a browser preference, not game-state authority.
 * Fallback is English; game content is not machine-translated. */
(function(root,factory){const api=factory();if(root)root.LifeI18n=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window==='undefined'?null:window,function(){
'use strict';const KEY='the-life-loop.language.v1';
const en={language:'Language',newGame:'New game',saveGame:'Save game',loadGame:'Load game',howToPlay:'How to play',
 careers:'Careers',finances:'Finances',profile:'Profile',chat:'Chat',coop:'Co-op',menu:'Menu',yourStory:'Your story',
 lifeGoals:'Life goals',wellbeing:'Wellbeing',competition:'The competition',city:'City',myLife:'My life',week:'Week',
 timeLeft:'Time left',cash:'Cash',player:'Player',endWeek:'End week',overview:'Overview',explore:'Explore',findBuilding:'Find building',
 signIn:'Sign in',register:'Register',signOut:'Sign out',refresh:'Refresh',send:'Send',socialLobby:'Social lobby',
 newTitle:'Ready for your next life?',newDescription:'Choose a name and mode. Your goals and settings are remembered.',
 yourName:'Your name',playMode:'Play mode',gameSettings:'Game settings',gameRules:'Game rules',classicRules:'Classic rules',modernStory:'Modern story',
 houseRules:'House rules',returnHome:'Return home at the end of each week',returnOvertime:'Deduct travel overtime next week',
 foodSpoilage:'Food expires without suitable storage',rentPenalty:'Unpaid rent reduces happiness',marketFluctuations:'Markets change over time',
 restoreDefaults:'Restore default rules',worldEra:'World era',jonesDifficulty:'Jones difficulty',yourGoals:'Your life goals',
 campaignLength:'Campaign length',quick:'Quick',standard:'Standard',extended:'Extended',custom:'Custom',
 campaignHint:'Higher goal targets mean a longer race. The weekly clock stays unchanged.',
 startGame:'Start new game',resumeGame:'Continue game',resetSettings:'Reset settings',classicOriginal:'Classic',modern:'Modern',
 yourNextChapter:'Your next chapter',changesGameplay:'Changes gameplay',houseRuleHeadline:'House rules',ruleModeHelp:'Start from the selected base mode. House rules do not replace shops, events or careers.',
 quickIntro:'Jump into the city and build a life. Your settings are remembered.',soloMode:'Solo against Jones (AI)',hotseatMode:'Two players on one computer',onlineMode:'Online with a friend',sandboxMode:'Free play without a rival',
 goalWealth:'Wealth',goalHappiness:'Happiness',goalEducation:'Education',goalCareer:'Career',total:'Total',points:'Points',
 classicCaption:'60-unit weeks · original-inspired careers and studies',modernCaption:'40-unit weeks · friendships and city events',
 returnHomeDetail:'Return home automatically even when no weekly time remains.',returnOvertimeDetail:'Carry any unspent journey cost into the next week.',
 foodSpoilageDetail:'Food storage, spoilage and weekly consumption still apply.',rentPenaltyDetail:'Debt still exists even when the happiness penalty is disabled.',marketFluctuationsDetail:'Market movements can be disabled without removing city events.',
 rulesEraGoals:'Rules · era · goals',classicParity:'Original DOS parity is still in progress',modernBalance:'Established Modern balance',defaultMode:'Default',customMode:'Custom',
 savedPreferenceDetail:'Settings are stored locally for future new games.',visualsOnly:'Visuals only',
 comingSoon:'Some story, job and event descriptions are still in English.'};
const nl={language:'Taal',newGame:'Nieuw spel',saveGame:'Spel opslaan',loadGame:'Spel laden',howToPlay:'Spelregels',
 careers:'Carrières',finances:'Financiën',profile:'Profiel',chat:'Chat',coop:'Samenspelen',menu:'Menu',yourStory:'Jouw verhaal',
 lifeGoals:'Levensdoelen',wellbeing:'Welzijn',competition:'De competitie',city:'Stad',myLife:'Mijn leven',week:'Week',
 timeLeft:'Tijd over',cash:'Contant geld',player:'Speler',endWeek:'Week beëindigen',overview:'Overzicht',explore:'Verkennen',findBuilding:'Gebouw zoeken',
 signIn:'Inloggen',register:'Registreren',signOut:'Uitloggen',refresh:'Vernieuwen',send:'Versturen',socialLobby:'Social-lobby',
 newTitle:'Klaar voor een nieuw leven?',newDescription:'Kies je naam en speltype. Je doelen en instellingen worden onthouden.',
 yourName:'Je naam',playMode:'Speltype',gameSettings:'Spelinstellingen',gameRules:'Spelregels',classicRules:'Klassieke regels',modernStory:'Modern verhaal',
 houseRules:'Huisregels',returnHome:'Aan het eind van elke week naar huis',returnOvertime:'Extra reistijd van volgende week aftrekken',
 foodSpoilage:'Eten bederft zonder geschikte opslag',rentPenalty:'Achterstallige huur vermindert geluk',marketFluctuations:'Marktprijzen veranderen',
 restoreDefaults:'Standaardregels herstellen',worldEra:'Tijdperk',jonesDifficulty:'Moeilijkheid Jones',yourGoals:'Levensdoelen',
 campaignLength:'Spelduur',quick:'Kort',standard:'Standaard',extended:'Lang',custom:'Aangepast',
 campaignHint:'Hogere doelen maken het spel langer. De weekklok verandert niet.',
 startGame:'Nieuw spel starten',resumeGame:'Spel hervatten',resetSettings:'Instellingen herstellen',classicOriginal:'Klassiek',modern:'Modern',
 yourNextChapter:'Jouw volgende hoofdstuk',changesGameplay:'VERANDERT DE SPELREGELS',houseRuleHeadline:'Huisregels',ruleModeHelp:'Begin met het gekozen basisspel. Huisregels vervangen geen winkels, gebeurtenissen of beroepen.',
 quickIntro:'Ga de stad in en bouw een leven op. Je instellingen worden onthouden.',soloMode:'Solo tegen Jones (computer)',hotseatMode:'Twee spelers op één computer',onlineMode:'Online met een vriend',sandboxMode:'Vrij spelen zonder tegenstander',
 goalWealth:'Vermogen',goalHappiness:'Geluk',goalEducation:'Opleiding',goalCareer:'Carrière',total:'Totaal',points:'Punten',
 classicCaption:'Weken van 60 eenheden · klassieke banen en opleidingen',modernCaption:'Weken van 40 eenheden · vriendschappen en gebeurtenissen',
 returnHomeDetail:'Keer automatisch naar huis terug, ook als de weektijd op is.',returnOvertimeDetail:'Extra reistijd wordt van de volgende week afgetrokken.',
 foodSpoilageDetail:'Voedselopslag, bederf en wekelijkse consumptie blijven actief.',rentPenaltyDetail:'Huurachterstand blijft bestaan als je de gelukstraf uitschakelt.',marketFluctuationsDetail:'Marktveranderingen kunnen uit zonder dat stadsgebeurtenissen verdwijnen.',
 rulesEraGoals:'Regels · tijdperk · doelen',classicParity:'De oorspronkelijke DOS-regels worden nog verder nagebouwd',modernBalance:'Bestaande moderne spelbalans',defaultMode:'Standaard',customMode:'Aangepast',
 savedPreferenceDetail:'Instellingen worden lokaal onthouden voor nieuwe spellen.',visualsOnly:'Alleen uiterlijk',
 comingSoon:'Sommige verhaaltjes, banen en gebeurtenissen zijn nog in het Engels.'};
const locales=Object.freeze({en:Object.freeze(en),nl:Object.freeze(nl)});let locale='en';
function choose(value){return Object.hasOwn(locales,value)?value:'en';}
function load(store){try{locale=choose(store?.getItem(KEY)||((typeof navigator!=='undefined'&&navigator.language?.toLowerCase().startsWith('nl'))?'nl':'en'));}catch{locale='en';}return locale;}
function set(value,store){locale=choose(value);try{store?.setItem(KEY,locale);}catch{}apply();return locale;}
function t(key){return locales[locale][key]||en[key]||key;}
function apply(scope){if(typeof document==='undefined')return;const context=scope||document;document.documentElement.lang=locale;
 const nodes=[...(context.matches?.('[data-i18n]')?[context]:[]),...context.querySelectorAll('[data-i18n]')];
 for(const node of nodes){const key=node.getAttribute('data-i18n');if(key)node.textContent=t(key);}
 for(const node of context.querySelectorAll('[data-i18n-title]'))node.title=t(node.dataset.i18nTitle);
 for(const node of context.querySelectorAll('[data-i18n-aria]'))node.setAttribute('aria-label',t(node.dataset.i18nAria));
}
return Object.freeze({KEY,locales,load,set,get:()=>locale,t,apply});
});

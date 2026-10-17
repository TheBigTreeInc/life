/* The Life Loop shared UI locale controller.
 * One setter for the toolbar, New Game settings, and pre-existing local
 * language-campaign integrations. Does not change simulation/save state.
 */
(function(root,factory){
  const api=factory(root?.LifePass057||(typeof module==='object'&&module.exports?require('./life-pass-057.js'):null),root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.LifeI18n=api;root.I18n=api;}
})(typeof window==='undefined'?null:window,function(UX,root){
  'use strict';
  if(!UX)throw Error('Load life-pass-057 before the shared I18n controller');
  const labels=Object.freeze({
    'Careers':'Carrières','Finances':'Financiën','Profile':'Profiel',
    'Chat':'Chat','Co-op':'Samen spelen','Menu':'Menu','New game':'Nieuw spel','End week':'Week beëindigen',
    'Save game':'Spel opslaan','Load game':'Spel laden','How to play':'Speluitleg',
    'Your Story':'Jouw verhaal','Life goals':'Levensdoelen',
    'Wellbeing':'Welzijn','The competition':'De competitie',
    'Find building':'Zoek gebouw','Overview':'Overzicht','Explore':'Verkennen',
    'My pawn':'Mijn pion','Interface language':'Interfacetaal',
    'Week':'Week','Time left':'Tijd over','Cash':'Contant','Player':'Speler',
    'Classic City':'Klassieke stad', 'Original 13-place route':'Originele route met 13 locaties'
  });
  // Public semantic translation keys used by merged ZipRunner campaigns.
  // Keep them alongside (not instead of) the older literal English captions.
  const keyEnglish=Object.freeze({
    newGame:'New game',endWeek:'End week',saveGame:'Save game',loadGame:'Load game',
    howToPlay:'How to play',careers:'Careers',finances:'Finances',
    profile:'Profile',chat:'Chat',coOp:'Co-op',menu:'Menu',
    story:'Your Story',lifeGoals:'Life goals',wellbeing:'Wellbeing',
    competition:'The competition',findBuilding:'Find building',
    overview:'Overview',explore:'Explore',myPawn:'My pawn',
    language:'Language',matchLength:'Match length',
    quick:'Quick',standard:'Standard',extended:'Extended',custom:'Custom',
    wealth:'Wealth',happiness:'Happiness',education:'Education',career:'Career'
  });
  const translations=Object.freeze({
    en:keyEnglish,
    nl:Object.freeze(Object.fromEntries(Object.entries(keyEnglish).map(([key,english])=>[
      key,labels[english]||UX.t('nl',english)
    ])))
  });
  let selected='en';
  function t(key,language=selected){
    // Support the locale-first convention as well as the original key-first API.
    if((key==='en'||key==='nl')&&arguments.length>1&&language!=='en'&&language!=='nl'){
      const swap=key;key=language;language=swap;
    }
    const original=String(key);
    const lang=UX.locale(language);
    if(Object.hasOwn(translations[lang],original))return translations[lang][original];
    if(lang==='nl'&&Object.hasOwn(labels,original))return labels[original];
    return UX.t(lang,original);
  }
  function apply(doc=root?.document){
    if(!doc)return selected;
    for(const el of doc.querySelectorAll('[data-i18n]')){
      const key=el.getAttribute('data-i18n');
      if(key)el.textContent=t(key);
    }
    for(const el of doc.querySelectorAll('[data-i18n-title]')){
      const key=el.getAttribute('data-i18n-title');
      if(key)el.setAttribute('title',t(key));
    }
    if(doc.documentElement)doc.documentElement.lang=selected;
    return selected;
  }
  function set(language,storage){
    selected=UX.locale(language);
    const store=storage===undefined?(()=>{try{return root?.localStorage||null;}catch{return null;}})():storage;
    UX.saveLocale(store,selected);
    const doc=root?.document;
    if(doc){
      for(const id of ['languageSelect','gameLanguage']){
        const control=doc.getElementById(id);
        if(control)control.value=selected;
      }
      apply(doc);
    }
    return selected;
  }
  function get(){return selected;}
  function restore(storage){
    const store=storage===undefined?(()=>{try{return root?.localStorage||null;}catch{return null;}})():storage;
    return set(UX.savedLocale(store),store);
  }
  return Object.freeze({schema:'life-i18n.v2',set,get,restore,t,apply,labels,translations,locales:translations,DICT:translations,KEY:UX.localeKey});
});

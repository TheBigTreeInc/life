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

  // Visible UI vocabulary, separate from the semantic keys kept for old saves,
  // external integrations and earlier ZipRunner campaigns. Source identifiers,
  // user-written names/chat and game simulation values stay in English internally.
  const uiNL=Object.freeze({
    'NEW DAY CITY':'NIEUWE DAG, NIEUWE STAD','YOUR STORY':'JOUW VERHAAL',
    'MY LIFE':'MIJN LEVEN','Life goals':'Levensdoelen','Wellbeing':'Welzijn',
    'The competition':'De concurrentie','Careers':'Carrières','Finances':'Financiën',
    'Profile':'Profiel','Co-op':'Samen spelen','Menu':'Menu','New game':'Nieuw spel',
    'My characters':'Mijn personages','Save game':'Spel opslaan','Load game':'Spel laden',
    'How to play':'Speluitleg','Your Story':'Jouw verhaal','Classic City':'Klassieke stad',
    'CLASSIC CITY':'KLASSIEKE STAD','ORIGINAL 13-PLACE ROUTE':'ORIGINELE ROUTE MET 13 LOCATIES',
    'Find building':'Zoek gebouw','Find building…':'Zoek gebouw…',
    'Overview':'Overzicht','Explore':'Verkennen','My pawn':'Mijn pion',
    'Skip animation →':'Animatie overslaan →','YOUR TURN':'JIJ BENT AAN DE BEURT',
    'Your turn':'Jij bent aan de beurt','WAITING FOR YOUR FRIEND TO JOIN':'WACHTEN OP JE VRIEND',
    'WEEK':'WEEK','TIME LEFT':'TIJD OVER','CASH':'CONTANT','PLAYER':'SPELER',
    'VISITING':'OP BEZOEK','Location':'Locatie','What would you like to do?':'Wat wil je doen?',
    'Done ↗':'Klaar ↗','Wrap up this week':'Week afronden',
    'End week':'Week beëindigen','Waiting for friend':'Wachten op vriend',
    'Waiting for friend to join':'Wachten tot je vriend meedoet',
    'Waiting for friend':'Wachten op vriend','Waiting for friend':'Wachten op vriend',
    'Local game':'Lokaal spel','No room connected':'Geen kamer verbonden',
    'Not connected':'Niet verbonden','No Looprd connection':'Geen Looprd-verbinding',
    'Start or join a room to play together.':'Start of betreed een kamer om samen te spelen.',
    'Open co-op & room details':'Samen spelen en kamergegevens openen',
    'Co-op details':'Samenspeelgegevens','Waiting for friend':'Wachten op vriend',
    'Game complete':'Spel voltooid','Waiting for friend':'Wachten op vriend',
    'THE LITTLE THINGS':'DE KLEINE DINGEN','Your story so far':'Jouw verhaal tot nu toe',
    'LIFE HAPPENS IN BETWEEN':'HET LEVEN GEBEURT TUSSENDOOR',
    'City':'Stad','My life':'Mijn leven','THE LIFE LOOP':'THE LIFE LOOP',
    'CLASSIC HOTSEAT · PASS THE DEVICE':'KLASSIEK OM DE BEURT · GEEF HET APPARAAT DOOR',
    "Next player's turn":'De volgende speler is aan de beurt',
    "The previous player's private information is hidden. Pass the device to the next player before continuing.":
      'De privégegevens van de vorige speler zijn verborgen. Geef het apparaat aan de volgende speler.',
    "I'm ready — reveal my turn":'Ik ben klaar — toon mijn beurt',
    'This screen does not advance a turn or spend any game time.':'Dit scherm kost geen speeltijd en beëindigt geen beurt.',
    'Social lobby':'Social-lobby','Co-op room':'Samenspeelkamer',
    'Social server':'Social-server','Username':'Gebruikersnaam','Password':'Wachtwoord',
    'Sign in':'Aanmelden','Register':'Registreren','Refresh':'Vernieuwen',
    'Sign out':'Afmelden','Send ↗':'Versturen ↗','Send a message…':'Stuur een bericht…',
    'Connect to Looprd Social to see the lobby.':'Verbind met Looprd Social om de lobby te zien.',
    'Social chat will appear here when connected. No game-room invitation is needed.':
      'Social-chat verschijnt hier zodra je verbonden bent. Een speluitnodiging is niet nodig.',
    'Private messages appear here after both players connect to a co-op room.':
      'Privéberichten verschijnen hier zodra beide spelers met een samenspeelkamer verbonden zijn.',
    'SOCIAL · SHARED LOBBY':'SOCIAL · GEDEELDE LOBBY','ROOM · PRIVATE':'KAMER · PRIVÉ',
    'Connect a Social profile above to chat across games. Your game continues offline.':
      'Verbind hierboven een Social-profiel om tussen spellen te chatten. Je spel werkt ook offline.',
    'Encrypted co-op room messages are not saved.':'Versleutelde samenspeelberichten worden niet opgeslagen.',
    'Join a two-player co-op room with WebSocket access for private chat.':
      'Betreed een samenspeelkamer voor twee personen om privé te chatten.',
    'Message the social lobby…':'Bericht aan de social-lobby…',
    'Message your co-op partner…':'Bericht aan je medespeler…',
    'READY TO SPEND':'KLAAR OM UIT TE GEVEN','CASH ON HAND':'CONTANT GELD',
    'NET WORTH':'NETTOVERMOGEN','Ready to spend':'Direct te besteden',
    'Including savings':'Inclusief spaargeld','debt':'schuld','Unemployed · Apply at Career Center':'Werkloos · Solliciteer bij het arbeidsbureau',
    'Your workplace:':'Je werkplek:','Low-Cost Housing':'Goedkope woningen',
    'Le Security Apartments':'Le Security Apartments',
    'GOAL POINTS':'DOELPUNTEN','WEIGHTED':'GEWOGEN',
    'Wealth':'Vermogen','Happiness':'Geluk','Education':'Opleiding','Career':'Carrière',
    'Energy':'Energie','Hunger':'Honger','Relaxation':'Ontspanning',
    'Food':'Voedsel','Employment':'Werk','Money':'Geld',
    'GOODS INDEX':'GOEDERENINDEX','PRICES UP':'PRIJZEN STIJGEN',
    'PRICES DOWN':'PRIJZEN DALEN','STABLE':'STABIEL',
    'MARKET STABLE':'STABIELE MARKT','MARKET BOOMING':'BLOEIENDE MARKT',
    'MARKET COOLING':'AFKOELENDE MARKT','ACTIONS':'ACTIES',
    'WEEKLY CLOCK':'WEEKLOK','weekly hours remaining':'weekuren resterend',
    'PUBLIC GARDEN':'STADSPARK','Town center landmark':'Herkenningspunt in het centrum',
    'ORIGINAL CLASSIC CITY':'ORIGINELE KLASSIEKE STAD',
    'CLASSIC RULES':'KLASSIEKE REGELS','MODERN STORY':'MODERN VERHAAL',
    'Make a life.':'Bouw een leven op.','Not just a living.':'Niet alleen een inkomen.',
    'CITY RADIO':'STADSRADIO','CITY PULSE':'STADSLEVEN',
    'COMMUNITY OPPORTUNITY':'KANS IN DE WIJK','No price changes':'Geen prijswijzigingen',
    'Already joined':'Al meegedaan','Available this month':'Deze maand beschikbaar',
    'MEET THE LOCALS':'ONTMOET DE BEWONERS','SPOKEN THIS WEEK':'DEZE WEEK GESPROKEN',
    'trust':'vertrouwen','Story complete':'Verhaal voltooid',
    'Next chapter is available in the activity list.':'Het volgende hoofdstuk staat bij de activiteiten.',
    'Get to know':'Leer kennen','by talking each week.':'door elke week te praten.',
    'Favors unlock at 18 trust.':'Gunstacties komen beschikbaar bij 18 vertrouwen.',
    'Friendship favors available every four weeks.':'Vriendschapsgunsten zijn elke vier weken beschikbaar.',
    'APPLY AT EMPLOYER':'SOLLICITEREN BIJ WERKGEVER',
    'All employers · Overview':'Alle werkgevers · Overzicht',
    'Show future jobs and missing requirements':'Toon toekomstige banen en ontbrekende eisen',
    "Qualifications don't guarantee an opening.":'Met de juiste diploma’s ben je nog niet verzekerd van een vacature.',
    'Choose a workplace to see its jobs. Qualified roles are shown first; future positions are optional.':
      'Kies een werkplek om de banen te bekijken. Geschikte functies staan bovenaan.',
    'Groceries, newspaper & lottery':'Boodschappen, krant en loterij',
    'Rotating discount stock':'Wisselende aanbiedingen',
    'Explore another building to discover things to do.':'Bezoek een ander gebouw om meer activiteiten te ontdekken.',
    'Take a breather':'Even uitrusten','Already feeling great':'Je voelt je al prima',
    'Apply':'Solliciteer','Switch to':'Stap over naar','Negotiate a raise':'Onderhandel over loonsverhoging',
    'Get a job first':'Zoek eerst een baan',
    'Read the weekly newspaper':'Lees de weekkrant',
    'Buy 10 lottery tickets':'Koop 10 loten','Buy groceries':'Koop boodschappen',
    'Stock the fridge':'Vul de koelkast','Enjoy a hot meal':'Geniet van een warme maaltijd',
    'Cook something nice':'Kook iets lekkers','Already fed this week':'Deze week al gegeten',
    'Buy fresh food':'Koop vers voedsel','Pay university enrollment':'Betaal de inschrijving voor de universiteit',
    'Not enough cash':'Niet genoeg geld','Not enough time':'Niet genoeg tijd',
    'No clock time left for this action.':'Niet genoeg tijd op de weekklok voor deze actie.',
    'Custom ten-action limit reached; end your turn.':'De ingestelde limiet van tien acties is bereikt; rond je beurt af.',
    'You already own this item.':'Je bezit dit voorwerp al.',
    'Fridge or freezer capacity exceeded':'De koelkast of vriezer zit vol',
    'Game settings':'Spelinstellingen','Rules · era · goals':'Regels · tijdperk · doelen',
    'YOUR NEXT CHAPTER':'JOUW VOLGENDE HOOFDSTUK','Welcome back.':'Welkom terug.',
    'Ready for your next life?':'Klaar voor een nieuw leven?',
    'Pick a name and game mode, then jump into the city. Your rules and goals are remembered.':
      'Kies een naam en spelmodus en ga de stad in. Je regels en doelen worden onthouden.',
    'YOUR NAME':'JOUW NAAM','PLAY MODE':'SPELMODUS',
    'Solo vs. The Rival (AI)':'Solo tegen de rivaal (AI)',
    '2 humans · same computer':'2 spelers · één computer',
    'Online co-op · friend code + Looprd':'Online samen spelen · vriendcode + Looprd',
    'Relaxed · Play alone':'Ontspannen · alleen spelen',
    'CAMPAIGN · RULES & EVENTS':'CAMPAGNE · REGELS EN GEBEURTENISSEN',
    'Classic Original · DOS-inspired':'Klassiek origineel · geïnspireerd op DOS',
    'Custom Classic · house rules':'Aangepast klassiek · eigen regels',
    'Modern Story · events and shops':'Modern verhaal · gebeurtenissen en winkels',
    'Classic is the DOS-parity base; Custom Classic changes its house rules, not its shop catalogue.':
      'Klassiek vormt de DOS-basis; Aangepast klassiek wijzigt huisregels, niet het winkelaanbod.',
    'PLAYER 2 NAME':'NAAM SPELER 2','GAME RULES':'SPELREGELS',
    'CHANGES GAMEPLAY':'VERANDERT HET SPEL',
    'Classic Rules':'Klassieke regels','Modern Story':'Modern verhaal',
    'Original parity is still in progress':'Overeenstemming met DOS is nog in ontwikkeling',
    '60-hour weeks · original-inspired careers and studies':'Weken van 60 eenheden · klassieke banen en opleidingen',
    '40-hour weeks · friendships, city events':'Weken van 40 uur · vriendschappen en gebeurtenissen',
    'Match length':'Speelduur','Quick':'Snel','Standard':'Standaard',
    'Extended':'Uitgebreid','Custom':'Aangepast','Language':'Taal',
    'Your life goals':'Jouw levensdoelen','Estimated match length':'Geschatte speelduur',
    'Longer matches use higher victory goals, not slower turns.':
      'Langere spellen hebben hogere overwinningsdoelen, geen langzamere beurten.',
    'Start new game':'Nieuw spel starten','Resume game':'Spel hervatten',
    'Reset settings':'Instellingen herstellen','Close':'Sluiten',
    'Save':'Opslaan','Load':'Laden','Back':'Terug',
    'Choose an employer':'Kies een werkgever',
    'AVAILABLE':'BESCHIKBAAR','DEFAULT':'STANDAARD','CUSTOM':'AANGEPAST',
    'You':'Jij','Friend':'Vriend','Host':'Gastheer','Guest':'Gast',
    'No time left':'Geen tijd over','Available now':'Nu beschikbaar',
    'Save your progress':'Sla je voortgang op',
    'Week':'Week','units':'eenheden','available':'beschikbaar',
    'hours':'uren','Original employer':'Oorspronkelijke werkgever',
    'Hiring':'Aannemingskans','Uniform':'Werkkleding',
    'Dependability':'Betrouwbaarheid','reliability':'betrouwbaarheid',
    'Work at':'Werk bij','Unqualified':'Niet gekwalificeerd',
    'Already employed in this position':'Je werkt al in deze functie',
    'Replaces your current job if accepted':'Vervangt bij aanname je huidige baan',
    'Original-style $10 bundle; lottery results settle next week.':
      'Klassiek pakket loten van $10; de trekking volgt volgende week.',
    'Recover':'Herstel','happiness':'geluk','energy':'energie','relaxation':'ontspanning',
    'prevent hunger':'voorkom honger','stored until used':'bewaard tot gebruik',
    'expires this weekend':'vervalt dit weekend',
    'Food stock full':'Voedselvoorraad vol'
  });
  // Only source-rendered interface text is translated. In particular, never
  // alter simulation messages in Game, save payloads, player names, or chat.
  const uiPatterns=Object.freeze([
    [/^WEEK\s+(\d+)(.*)$/i,(_,$1,$2)=>`WEEK ${$1}${$2.replace(/ACTIONS/gi,'ACTIES')}`],
    [/^(\d+) available$/,(_,$1)=>`${$1} beschikbaar`],
    [/^(\d+) positions match your qualifications$/,(_,$1)=>`${$1} functies passen bij je kwalificaties`],
    [/^(\d+) other positions in the career roadmap\.(.*)$/,(_,$1,$2)=>`${$1} andere functies in het carrièreoverzicht.${$2}`],
    [/^Buy (\d+) weeks? of fresh food$/i,(_,$1)=>`Koop voor ${$1} weken vers voedsel`],
    [/^Buy (\d+) week of fresh food$/i,(_,$1)=>`Koop voor ${$1} week vers voedsel`],
    [/^GOODS INDEX (.*)$/,(_,$1)=>`GOEDERENINDEX ${$1.replace('PRICES UP','PRIJZEN STIJGEN').replace('PRICES DOWN','PRIJZEN DALEN').replace('STABLE','STABIEL')}`],
    [/^(\d+) \/ (\d+) units$/,(_,$1,$2)=>`${$1} / ${$2} eenheden`],
    [/^Room (.+)$/,(_,$1)=>`Kamer ${$1}`],
    [/^WAITING FOR (.+)$/,(_,$1)=>`WACHTEN OP ${$1}`],
    [/^(.+)’S TURN$/,(_,$1)=>`${$1} IS AAN DE BEURT`],
    [/^(.+)'s turn$/,(_,$1)=>`${$1} is aan de beurt`],
    [/^Apply: (.+)$/,(_,$1)=>`Solliciteer: ${$1}`],
    [/^Switch to (.+)$/,(_,$1)=>`Stap over naar ${$1}`],
    [/^Talk to (.+)$/,(_,$1)=>`Praat met ${$1}`],
    [/^Story · (.+)$/,(_,$1)=>`Verhaal · ${$1}`],
    [/^Chapter (\d+)\/(\d+) · (.+)$/,(_,$1,$2,$3)=>`Hoofdstuk ${$1}/${$2} · ${$3}`],
    [/^Z-Mart · (.+)$/,(_,$1)=>`Z-Mart · ${$1}`],
    [/^Monolith Burger · (.+)$/,(_,$1)=>`Monolith Burger · ${$1}`],
    [/^Budget (.+)$/,(_,$1)=>`Voordelige ${$1}`],
    [/^Remembers: (.+)$/,(_,$1)=>`Herinnert zich: ${$1}`]
  ]);

  const sceneNL=Object.freeze({
    'REST & RECHARGE':'RUST EN HERSTEL','FIND YOUR PATH':'VIND JE WEG',
    'GROCERIES':'BOODSCHAPPEN','FOOD & WORK':'ETEN EN WERKEN',
    'EDUCATION':'OPLEIDING','CAREERS':'LOOPBANEN','HAPPINESS':'GELUK',
    'MONEY':'GELD','HOUSING':'WONEN','WARDROBE':'KLEDING',
    'TECH & WORK':'TECH EN WERK','HEALTH':'GEZONDHEID',
    'PAWN & REDEEM':'VERPANDEN EN TERUGKOPEN',
    'SECURE HOUSING':'VEILIG WONEN','RENT & MOVING':'HUUR EN VERHUIZEN',
    'YOUR FIRST HOME':'JE EERSTE WONING','ROTATING DISCOUNTS':'WISSELENDE AANBIEDINGEN',
    'MEALS & WORK':'MAALTIJDEN EN WERK','QUALITY WARDROBE':'GOEDE WERKKLEDING',
    'ELECTRONICS':'ELEKTRONICA','JOBS & RAISES':'BANEN EN LOONSVERHOGINGEN',
    'MANUFACTURING JOBS':'FABRIEKSBANEN','SAVINGS & INVESTING':'SPAREN EN BELEGGEN',
    'FOOD & LOTTERY':'ETEN EN LOTERIJ',
    'Protected apartment complex. Your possessions are safe from residential burglary.':
      'Beveiligd appartementencomplex. Je bezittingen zijn beschermd tegen woninginbraak.',
    'Pay rent, request an extension, or arrange a move to secure housing.':
      'Betaal huur, vraag uitstel aan of verhuis naar een veilige woning.',
    'Affordable apartments with few comforts and limited protection.':
      'Betaalbare appartementen met weinig comfort en beperkte beveiliging.',
    'Short-term cash for possessions. Redeem or buy unclaimed goods.':
      'Krijg snel geld voor bezittingen. Koop ze terug of koop niet-opgehaalde spullen.',
    'Discount clothing, books and household merchandise. Stock changes each week.':
      'Voordelige kleding, boeken en huishoudelijke artikelen. Het aanbod wisselt wekelijks.',
    'A hot meal and an early career opportunity.':
      'Een warme maaltijd en een kans op je eerste baan.',
    'Clothes for work that last longer than discount garments.':
      'Werkkleding die langer meegaat dan de goedkope varianten.',
    'Appliances and electronics with stronger reliability.':
      'Degelijke huishoudelijke apparaten en elektronica.',
    'Eleven degree tracks and the way to better employment.':
      'Elf opleidingen waarmee je meer kans op een betere baan maakt.',
    'Apply by employer, verify qualifications and negotiate raises.':
      'Solliciteer bij werkgevers, bekijk de vereiste diploma’s en onderhandel over salaris.',
    'Many different jobs, from assembly work to management.':
      'Allerlei banen, van productiewerk tot leidinggeven.',
    'Protected savings, loans, broker and six investments.':
      'Veilig sparen, leningen, een effectenmakelaar en zes beleggingen.',
    'Groceries, newspapers, lottery and market careers.':
      'Boodschappen, kranten, loterij en banen op de markt.',
    'Your tiny corner of the city. Cozy, with ambitions bigger than the living room.':
      'Jouw eigen plekje in de stad. Knus, maar je ambities zijn groot.',
    'Every great career starts somewhere. Usually with paperwork.':
      'Elke mooie loopbaan begint ergens. Meestal met papierwerk.',
    'Because even future CEOs need dinner.':
      'Zelfs toekomstige directeuren moeten eten.',
    'Hot meals, part-time shifts, and the occasional life revelation.':
      'Warme maaltijden, deeltijdbanen en af en toe een wijze levensles.',
    'Learn something new, and maybe earn a better paycheck.':
      'Leer iets nieuws en verdien misschien een beter salaris.',
    'An inspiring view. An inbox that never ends.':
      'Een prachtig uitzicht, maar je inbox raakt nooit leeg.',
    'The city is more than deadlines. Make a memory.':
      'De stad heeft meer te bieden dan deadlines. Maak herinneringen.',
    'A little savings today, a lot less panic tomorrow.':
      'Vandaag een beetje sparen, morgen minder zorgen.',
    'More square feet. More rent. More questionable decisions.':
      'Meer ruimte, meer huur, meer twijfelachtige beslissingen.',
    'Dress for the job you want, not the laundry you forgot.':
      'Kleed je voor je droombaan, niet voor je vergeten was.',
    'Devices that unlock opportunities. And extremely fancy receipts.':
      'Apparaten die nieuwe kansen bieden. En indrukwekkende kassabonnen.',
    'You only get one character. Take care of them.':
      'Je hebt maar één personage. Zorg er goed voor.',
    'Give useful things a second chance. Pawn valuables for short-term cash, then redeem them before the deadline.':
      'Geef spullen een tweede kans. Verpand waardevolle voorwerpen voor geld en haal ze op tijd terug.',
    'One week of food. Prevent hunger penalties.':'Voedsel voor één week. Voorkom honger.',
    'Three food portions for less.':'Drie voedselporties voor minder geld.',
    'Requires a refrigerator':'Een koelkast is vereist',
    'A $12 gamble. Drawn at the weekend.':'Een gok van $12. De trekking is in het weekend.',
    'Fill up, +7 happiness and +8 energy.':'Eet je buik rond, +7 geluk en +8 energie.',
    'Get +16 happiness and +24 energy.':'Krijg +16 geluk en +24 energie.',
    'Use one grocery portion. Stay fed and feel better.':
      'Gebruik één portie boodschappen. Eet goed en voel je beter.',
    'Request a higher wage at your current job.':'Vraag een hoger salaris aan bij je huidige werkgever.',
    'Only one odd job per week.':'Maximaal één klus per week.',
    'Need more energy':'Je hebt meer energie nodig',
    'You already have a primary job. Work at your employer instead.':
      'Je hebt al een vaste baan. Ga bij je werkgever werken.',
    'Already caught up this week':'Deze week al bijgepraat',
    'Already joined this city event':'Je hebt al meegedaan aan deze gebeurtenis',
    'You already have a ticket for next weekend.':'Je hebt al een lot voor volgend weekend.',
    'Discount clothing':'Voordelige kleding',
    'Availability changes each week.':'Het aanbod wisselt elke week.',
    'You already have a primary job.':'Je hebt al een vaste baan.',
    'Cannot join':'Kan niet deelnemen',
    'Last room response':'Laatste reactie uit kamer',
    'Waiting for friend':'Wachten op een vriend',
    'Original DOS consumable':'Origineel DOS-voedselproduct',
    'original base':'oorspronkelijk basissalaris',
    'original DOS':'origineel DOS',
    'No time required.':'Kost geen tijd.',
    'per week':'per week',
    'Save/load compatible':'Compatibel met opslaan/laden'
  });
  const phraseParts=Object.freeze([
    [' · Original employer: ',' · Oorspronkelijke werkgever: '],
    [' · DOS job #',' · DOS-baan #'],
    [' · Hiring: ',' · Aannemingskans: '],
    [' · Unqualified: ',' · Niet gekwalificeerd: '],
    [' · Uniform: ',' · Werkkleding: '],
    [' · Replaces your current job if accepted',' · Vervangt na aanname je huidige baan'],
    [' · Week ',' · Week '],
    [' · Work at ',' · Werk bij '],
    [' of fresh food',' vers voedsel'],
    [' weeks of wear.',' weken draagbaar.'],
    [' week of wear.',' week draagbaar.'],
    [' · storage ',' · opslag '],
    [' portions · prevents hunger.',' porties · voorkomt honger.'],
    ['happiness on first food purchase this week.','geluk bij de eerste voedselaankoop van deze week.'],
    [' · goods-index price',' · prijs volgens goederenindex'],
    [' · original DOS consumable #',' · oorspronkelijk DOS-voedselproduct #'],
    [' · stored until used',' · houdbaar tot gebruik'],
    [' · expires this weekend',' · vervalt dit weekend'],
    [' · 4 units nominal',' · nominaal 4 tijdseenheden'],
    [' · listed wage ',' · vermeld salaris '],
    [' · requires ',' · vereist '],
    [' Dependability.',' Betrouwbaarheid.'],
    [' · Clock caps at ',' · Klok beperkt tot '],
    [' units',' eenheden'],
    [' · Discount stock',' · Aanbiedingen'],
    [' discount stock.',' aanbiedingen.'],
    [' · source-backed',' · gebaseerd op DOS-broncode'],
    [' shift pay',' loon per dienst'],
    [' shifts',' diensten'],
    [' Already',' Al'],
    [' available',' beschikbaar']
  ]);

  const localizedTextNodes=new WeakMap();
  const localizedAttributes=new WeakMap();
  function uiText(value,language=selected){
    if(language!=='nl')return String(value);
    const input=String(value),m=input.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const english=m[2];
    let out=uiNL[english];
    if(out===undefined&&Object.hasOwn(sceneNL,english))out=sceneNL[english];
    if(out===undefined){
      for(const [pattern,fn] of uiPatterns){if(pattern.test(english)){out=english.replace(pattern,fn);break;}}
    }
    // Paragraph fragments are only applied to already visible UI text.
    // Preserve immutable action IDs, save values, employer names and chat.
    if(out===undefined){
      let translated=english;
      for(const [a,b] of phraseParts)if(translated.includes(a))translated=translated.replaceAll(a,b);
      if(translated!==english)out=translated;
    }
    return m[1]+(out===undefined?english:out)+m[3];
  }
  function translateNode(node){
    const entry=localizedTextNodes.get(node);
    const english=entry&&node.nodeValue===entry.last?entry.english:node.nodeValue;
    if(!english||!english.trim())return;
    const translated=uiText(english);
    if(node.nodeValue!==translated)node.nodeValue=translated;
    localizedTextNodes.set(node,{english,last:translated});
  }
  function translateAttribute(el,name){
    const prior=localizedAttributes.get(el)||{};
    const current=el.getAttribute(name);
    if(!current)return;
    const old=prior[name];const english=old&&current===old.last?old.english:current;
    const translated=uiText(english);
    if(current!==translated)el.setAttribute(name,translated);
    prior[name]={english,last:translated};localizedAttributes.set(el,prior);
  }

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
    // Also localize the actual gameplay screen, which is predominantly
    // generated with innerHTML and never had data-i18n markers.
    if(doc.createTreeWalker&&doc.body){
      const walker=doc.createTreeWalker(doc.body,4); // NodeFilter.SHOW_TEXT
      let node;
      while((node=walker.nextNode())){
        const parent=node.parentElement;
        if(!parent||parent.closest('#chatMessages,script,style,textarea,[contenteditable="true"]'))continue;
        translateNode(node);
      }
      for(const el of doc.body.querySelectorAll('[title],[aria-label],[placeholder]')){
        if(el.closest?.('#chatMessages'))continue;
        for(const attribute of ['title','aria-label','placeholder'])if(el.hasAttribute(attribute))translateAttribute(el,attribute);
      }
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
  return Object.freeze({schema:'life-i18n.v3',set,get,restore,t,apply,uiText,uiNL,labels,translations,locales:translations,DICT:translations,KEY:UX.localeKey});
});

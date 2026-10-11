(function(root){
'use strict';
// Original vector illustrations. Generated locally as inline SVG: no network or font dependencies.
const themes={
 home:       {sky:'#cde9d6',wall:'#e9bb92',roof:'#a95c5b',trim:'#f5ebd5',door:'#56756d',form:'house',label:'HOME',extra:'plant'},
 agency:     {sky:'#b6d9df',wall:'#e8bc77',roof:'#456b80',trim:'#fff1d5',door:'#567d89',form:'office',label:'CAREERS',extra:'notice'},
 market:     {sky:'#ffe1bd',wall:'#d8e4a5',roof:'#e78860',trim:'#fff9db',door:'#a0b66d',form:'shop',label:'FRESH MART',extra:'produce'},
 diner:      {sky:'#ffd0b9',wall:'#ed9b81',roof:'#ca5b68',trim:'#fff4da',door:'#97645c',form:'shop',label:'GOOD FORK',extra:'coffee'},
 university: {sky:'#cfcaf6',wall:'#c5c0e3',roof:'#7869a9',trim:'#faf3de',door:'#6f618d',form:'civic',label:'BRIGHTSIDE U',extra:'books'},
 office:     {sky:'#bee3ef',wall:'#89b9ca',roof:'#486f91',trim:'#e6fcff',door:'#54839c',form:'tower',label:'NORTHSTAR',extra:'briefcase'},
 cinema:     {sky:'#e8c6ef',wall:'#ad80c0',roof:'#5c527f',trim:'#fff3d4',door:'#695b88',form:'theater',label:'STARLIGHT',extra:'star'},
 bank:       {sky:'#c3ddfa',wall:'#aebdc7',roof:'#627c9d',trim:'#f6f6e8',door:'#637f99',form:'civic',label:'FUTURE BANK',extra:'coin'},
 housing:    {sky:'#ffdfba',wall:'#f0bf9f',roof:'#a66e74',trim:'#fff0d9',door:'#9a7d7d',form:'house',label:'OPEN DOOR',extra:'keys'},
 boutique:   {sky:'#f8cee7',wall:'#eab2ce',roof:'#b872aa',trim:'#fff3e6',door:'#b57da1',form:'shop',label:'THREADS',extra:'hanger'},
 tech:       {sky:'#b8e4d9',wall:'#81b9b0',roof:'#3a767a',trim:'#e8fcf1',door:'#467d7d',form:'shop',label:'CIRCUIT',extra:'circuit'},
 clinic:     {sky:'#d3efd8',wall:'#a7cdb7',roof:'#668a78',trim:'#fff9ea',door:'#6c9e83',form:'office',label:'WELLBEING',extra:'cross'}
};
const people={
 home:{skin:'#d89b78',hair:'#4b3f42',shirt:'#6f9e8a',style:'curly'},
 agency:{skin:'#a8684c',hair:'#263f4a',shirt:'#ddad72',style:'side'},
 market:{skin:'#c7845d',hair:'#5b4036',shirt:'#75a17d',style:'bun'},
 diner:{skin:'#e2ac7c',hair:'#743c39',shirt:'#d76f73',style:'side'},
 university:{skin:'#8b573f',hair:'#28272f',shirt:'#9087ba',style:'curly'},
 office:{skin:'#d1a17e',hair:'#433844',shirt:'#7099bf',style:'side'},
 cinema:{skin:'#a16a56',hair:'#302d43',shirt:'#bc7abb',style:'bun'},
 bank:{skin:'#dfa77c',hair:'#6b5146',shirt:'#6e93ad',style:'side'},
 housing:{skin:'#c48d6d',hair:'#765544',shirt:'#be877d',style:'curly'},
 boutique:{skin:'#8f5947',hair:'#25283a',shirt:'#c18baa',style:'bun'},
 tech:{skin:'#c78e6c',hair:'#3e4b59',shirt:'#4a9996',style:'side'},
 clinic:{skin:'#b77f60',hair:'#493e47',shirt:'#90c7aa',style:'curly'}
};
function person(id,small=false){
 const p=people[id]||people.home;
 const hair=p.style==='curly'?'<circle cx="47" cy="36" r="17"/><circle cx="74" cy="34" r="18"/><circle cx="60" cy="28" r="20"/>':p.style==='bun'?'<circle cx="87" cy="30" r="14"/><path d="M36 53Q32 17 61 19Q95 17 88 55Z"/>':'<path d="M34 55Q31 21 61 20Q90 18 90 55Q78 43 69 37Q51 49 34 55Z"/>';
 return `<svg class="person-art${small?' person-small':''}" viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="60" cy="117" rx="43" ry="6" fill="#1b433e19"/><path d="M13 120Q16 84 45 83L61 91 75 83Q104 83 107 120Z" fill="${p.shirt}"/><path d="M51 78V95Q60 107 69 95V78" fill="${p.skin}"/><g fill="${p.hair}">${hair}</g><ellipse cx="60" cy="59" rx="29" ry="33" fill="${p.skin}"/><path d="M35 53Q33 25 57 24Q81 21 88 44Q72 48 65 38Q49 52 35 53" fill="${p.hair}"/><ellipse cx="49" cy="60" rx="2.5" ry="3" fill="#30363b"/><ellipse cx="72" cy="60" rx="2.5" ry="3" fill="#30363b"/><path d="M51 76Q61 85 71 75" stroke="#985f55" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="37" cy="69" rx="5" ry="3" fill="#e779704b"/><ellipse cx="82" cy="69" rx="5" ry="3" fill="#e779704b"/><path d="M28 120Q42 105 47 93M92 120Q78 105 73 93" stroke="#ffffff45" stroke-width="2" fill="none"/></svg>`;
}
function motif(type, x=324,y=171){
 const icons={
 plant:`<path d="M${x} ${y+30}v-40m0 25q-28-9-23-30q25 1 23 30m0-9q21-31 37-21q-8 27-37 21" stroke="#377d62" stroke-width="6" fill="#7dbd80" stroke-linecap="round"/><path d="M${x-17} ${y+28}h34l-6 27h-22z" fill="#c87f68"/>`,
 notice:`<rect x="${x-29}" y="${y-25}" width="58" height="63" rx="4" fill="#f7f1d9"/><path d="M${x-19} ${y-12}h40m-40 13h32m-32 13h37" stroke="#7c91a8" stroke-width="4"/>`,
 produce:`<rect x="${x-40}" y="${y+4}" width="80" height="38" rx="5" fill="#936d4b"/><circle cx="${x-19}" cy="${y+1}" r="15" fill="#e8874c"/><circle cx="${x+7}" cy="${y-3}" r="17" fill="#9ac45a"/><circle cx="${x+29}" cy="${y+2}" r="11" fill="#e8cd5a"/>`,
 coffee:`<path d="M${x-22} ${y-10}h44v32q-3 12-20 12h-4q-20-2-20-17z" fill="#f9edd9"/><path d="M${x+20} ${y-4}q36 0 12 24l-13 3" stroke="#fff5de" stroke-width="8" fill="none"/><path d="M${x-6} ${y-28}q-12-9-3-20m21 20q-12-9-3-20" stroke="#fff1cb" stroke-width="4" fill="none"/>`,
 books:`<rect x="${x-35}" y="${y-11}" width="16" height="49" rx="3" fill="#a77eaf"/><rect x="${x-13}" y="${y-18}" width="17" height="56" rx="3" fill="#e4ac5b"/><rect x="${x+11}" y="${y-8}" width="19" height="46" rx="3" fill="#7facc8"/>`,
 briefcase:`<rect x="${x-37}" y="${y-7}" width="74" height="48" rx="7" fill="#557a99" stroke="#f1e6d1" stroke-width="4"/><path d="M${x-14} ${y-7}v-11h28v11m-51 27h74" stroke="#f1e6d1" stroke-width="5" fill="none"/>`,
 star:`<path d="M${x} ${y-40}l11 29 31 2-24 20 8 32-26-17-27 17 8-32-23-20 31-2z" fill="#ffdfa0"/>`,
 coin:`<circle cx="${x}" cy="${y}" r="37" fill="#f4ca6d" stroke="#d4a857" stroke-width="6"/><text x="${x}" y="${y+14}" text-anchor="middle" font-family="sans-serif" font-size="39" font-weight="900" fill="#b48b47">$</text>`,
 keys:`<circle cx="${x-20}" cy="${y-12}" r="15" fill="none" stroke="#e8d0a6" stroke-width="8"/><path d="M${x-10} ${y}l35 35m-7-7 13-13m-6 20 12-12" stroke="#e8d0a6" stroke-width="9" stroke-linecap="round"/>`,
 hanger:`<path d="M${x} ${y-27}q-2-19 12-15t4 20l-4 3 39 32q9 9-4 9h-92q-13 0-4-9l38-32" fill="none" stroke="#fff1df" stroke-width="8" stroke-linecap="round"/>`,
 circuit:`<rect x="${x-35}" y="${y-32}" width="70" height="66" rx="10" fill="#d1eec7"/><rect x="${x-19}" y="${y-20}" width="38" height="42" rx="4" fill="#4b9791"/><path d="M${x-45} ${y-16}h10m70 0h10m-90 22h10m70 0h10m-90 20h10m70 0h10" stroke="#d1eec7" stroke-width="5"/>`,
 cross:`<path d="M${x-12} ${y-36}h24v25h25v23h-25v25h-24v-25h-25v-23h25z" fill="#fef8e8"/>`
 };return icons[type]||icons.star;
}
function scene(id,compact=false){
 const t=themes[id]||themes.home;
 const windows=(count=3)=>Array.from({length:count},(_,i)=>`<rect x="${238+i*69}" y="${123}" width="43" height="52" rx="4" fill="#cbe9df" stroke="${t.trim}" stroke-width="6"/><path d="M${260+i*69} 126v46m-20-24h40" stroke="#ffffffaa" stroke-width="4"/>`).join('');
 const baseX=t.form==='house'?214:t.form==='tower'?224:188;
 const baseW=t.form==='house'?225:t.form==='tower'?195:267;
 const baseY=t.form==='tower'?34:t.form==='civic'?87:102;
 const roof=t.form==='house'?`<path d="M${baseX-19} ${baseY+9}L${baseX+baseW/2} 33L${baseX+baseW+19} ${baseY+9}Z" fill="${t.roof}"/><path d="M${baseX+22} ${baseY-4}h25v-39h-25z" fill="${t.wall}"/>`:t.form==='civic'?`<path d="M${baseX-25} ${baseY}L${baseX+baseW/2} 39L${baseX+baseW+25} ${baseY}Z" fill="${t.roof}"/>`:`<rect x="${baseX-9}" y="${baseY-13}" width="${baseW+18}" height="20" rx="5" fill="${t.roof}"/>`;
 const glass=t.form==='shop'||t.form==='theater'?`<rect x="${baseX+17}" y="${baseY+77}" width="${baseW-34}" height="93" rx="7" fill="#b8e6df" stroke="${t.trim}" stroke-width="9"/><path d="M${baseX+baseW/2} ${baseY+81}v87m-78-42h155" stroke="${t.trim}" stroke-width="5"/>`:t.form==='tower'?Array.from({length:3},(_,j)=>Array.from({length:3},(_,i)=>`<rect x="${baseX+18+i*55}" y="${baseY+16+j*47}" width="37" height="33" rx="4" fill="#d7eff0" stroke="${t.trim}" stroke-width="5"/>`).join('')).join(''):t.form==='civic'?Array.from({length:4},(_,i)=>`<rect x="${baseX+28+i*56}" y="${baseY+35}" width="23" height="128" rx="5" fill="${t.trim}"/>`).join(''):windows(3);
 const awning=t.form==='shop'?`<path d="M${baseX+8} ${baseY+78}h${baseW-16}l-12 26h-${baseW-40}z" fill="${t.roof}"/><path d="M${baseX+46} ${baseY+78}l-8 26m63-26-4 26m57-26 0 26" stroke="${t.trim}" stroke-width="8"/>`:'';
 return `<svg class="scene-art${compact?' is-mini':''}" viewBox="0 0 640 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of ${t.label} in New Day City"><defs><linearGradient id="sky-${id}" x2="0" y2="1"><stop stop-color="${t.sky}"/><stop offset="1" stop-color="#fbf2d7"/></linearGradient></defs><rect width="640" height="340" fill="url(#sky-${id})"/><circle cx="538" cy="68" r="31" fill="#ffedb2"/><g class="scene-cloud" fill="#ffffffa5"><ellipse cx="87" cy="69" rx="46" ry="13"/><circle cx="79" cy="61" r="22"/><ellipse cx="493" cy="44" rx="31" ry="10"/></g><g fill="#ffffff66"><path d="M0 230V150h73v80m12 0V104h53v126m379 0V118h42v112m19 0v-62h62v62"/></g><path d="M0 249Q100 218 180 239Q293 208 384 238Q501 222 640 248V340H0Z" fill="#accda3"/><rect y="284" width="640" height="16" fill="#ead7b9"/><rect y="300" width="640" height="40" fill="#819f99"/><path d="M20 319h58m55 0h58m55 0h58m55 0h58m55 0h58" stroke="#f4ebd8" stroke-width="4" stroke-linecap="round"/><g><rect x="${baseX}" y="${baseY}" width="${baseW}" height="${277-baseY}" rx="6" fill="${t.wall}"/>${roof}${glass}${awning}<rect x="${baseX+Math.floor((baseW-130)/2)}" y="${t.form==='tower'?209:baseY+23}" width="130" height="30" rx="6" fill="${t.roof}"/><text x="${baseX+baseW/2}" y="${t.form==='tower'?230:baseY+44}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="900" letter-spacing="1" fill="#fff8e8">${t.label}</text>${t.form==='shop'||t.form==='theater'?`<g transform="translate(0 0)">${motif(t.extra,baseX+baseW/2,202)}</g>`:t.form==='civic'?`<g>${motif(t.extra,baseX+baseW/2,156)}</g>`:''}<rect x="${baseX+baseW/2-19}" y="244" width="38" height="34" rx="4" fill="${t.door}"/><circle cx="${baseX+baseW/2+10}" cy="259" r="2.5" fill="#f9e4a2"/></g><g><path d="M146 282v-75m-19 19q-35-25-34-51q36 0 53 38m0-4q24-39 52-27q-9 35-52 47" fill="#659873" stroke="#477e62" stroke-width="6"/><rect x="128" y="275" width="39" height="20" rx="4" fill="#c18765"/><path d="M514 284v-56m0 15q-24-19-17-41q21 4 17 29m0-3q15-29 32-25q-2 23-32 34" stroke="#648f68" stroke-width="5" fill="#91b681"/><rect x="501" y="280" width="26" height="14" rx="3" fill="#bd856d"/></g><g class="scene-pedestrian" transform="translate(75 0)"><circle cx="0" cy="260" r="8" fill="#b97861"/><path d="M-8 269h16l4 20h-24z" fill="#4d7f8d"/><path d="M-6 289l-6 7m15-7 8 7" stroke="#344d59" stroke-width="5" stroke-linecap="round"/></g><g class="scene-pedestrian second" transform="translate(559 0)"><circle cx="0" cy="262" r="7" fill="#8d604e"/><path d="M-8 270h16l5 20h-24z" fill="#b47796"/><path d="M-6 289l-6 7m15-7 8 7" stroke="#415a59" stroke-width="5" stroke-linecap="round"/></g></svg>`;
}
root.LifeArt={scene,person};
if(typeof module!=='undefined'&&module.exports)module.exports=root.LifeArt;
})(typeof window!=='undefined'?window:globalThis);

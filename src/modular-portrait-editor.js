(function(root){
 'use strict';
 function mount(container,renderer,initial,{onChange=()=>{}}={}) {
  const api=root.ModularPortraits,pack=renderer.pack;
  let identity=api.normalizeIdentity(pack,initial);
  container.replaceChildren();container.classList.add('portrait-controls');
  const controls=[];
  const group=document.createElement('div');group.className='portrait-fields';container.append(group);
  const field=(text,input)=>{const label=document.createElement('label');label.className='portrait-field';const title=document.createElement('span');title.textContent=text;label.append(title,input);group.append(label);};
  const notify=()=>onChange(JSON.parse(JSON.stringify(identity)));
  for(const [key,slot] of Object.entries(pack.slots)) {
   if(slot.options.length<2)continue;
   const input=document.createElement('select');input.setAttribute('aria-label',slot.label);
   for(const choice of slot.options){const option=document.createElement('option');option.value=choice.id;option.textContent=choice.label;input.append(option);}
   input.value=identity.choices[key];
   input.addEventListener('change',()=>{identity.choices[key]=input.value;notify();});
   controls.push(()=>input.value=identity.choices[key]);field(slot.label,input);
  }
  const colors=document.createElement('div');colors.className='portrait-colors';container.append(colors);
  for(const [key,color] of Object.entries(pack.colors)) {
   const label=document.createElement('label');label.className='portrait-color';
   const text=document.createElement('span');text.textContent=color.label;
   const input=document.createElement('input');input.type='color';input.value=identity.colors[key];input.setAttribute('aria-label',color.label+' color');
   input.addEventListener('input',()=>{identity.colors[key]=input.value;notify();});
   controls.push(()=>input.value=identity.colors[key]);label.append(text,input);colors.append(label);
  }
  return {getIdentity:()=>JSON.parse(JSON.stringify(identity)),setIdentity:value=>{identity=api.normalizeIdentity(pack,value,{strict:true});controls.forEach(update=>update());notify();},destroy:()=>container.replaceChildren()};
 }
 root.ModularPortraitEditor={mount};
})(globalThis);

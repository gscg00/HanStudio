// Herramientas de revisión para el navegador (solo en local): revisan la pantalla actual y
// recorren una clase respondiendo como un alumno. Uso desde la consola:
//   const A=await import('/dev/ui_audit.js'); A.audit(); await A.walk(80);
export function audit(){
  const issues=[],vw=innerWidth;
  if(document.documentElement.scrollWidth>vw+1)issues.push(`desborde horizontal ${document.documentElement.scrollWidth}px`);
  const text=document.body.innerText;
  for(const bad of['undefined','NaN','[object'])if(text.includes(bad))issues.push(`texto «${bad}»`);
  const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0.05;};
  for(const el of document.querySelectorAll('button,a,[role=button]')){
    if(!visible(el)||el.disabled)continue;
    const r=el.getBoundingClientRect(),name=el.textContent.trim().slice(0,24)||el.getAttribute('aria-label');
    if(r.height<36||r.width<36)issues.push(`toque pequeño ${Math.round(r.width)}x${Math.round(r.height)} «${name}»`);
    if(el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflow!=='visible')issues.push(`texto cortado «${name}»`);
    if(r.right>vw+1||r.left<-1)issues.push(`botón fuera «${name}»`);
  }
  for(const el of document.querySelectorAll('h1,h2,h3,p,li,span'))if(visible(el)&&!el.children.length&&el.getBoundingClientRect().right>vw+1)issues.push(`texto sale «${el.textContent.trim().slice(0,30)}»`);
  const lum=c=>{const m=c.match(/\d+(\.\d+)?/g);if(!m)return 1;const[r,g,b]=m.slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;});return 0.2126*r+0.7152*g+0.0722*b;};
  const bg=el=>{for(let e=el;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return c;}return'rgb(255,255,255)';};
  for(const el of[...document.querySelectorAll('p,li,button,h1,h2,h3,small,span,label,em,strong')].slice(0,300)){
    if(!visible(el)||el.disabled||!el.textContent.trim()||el.children.length>2)continue;
    const s=getComputedStyle(el);if(Number(s.opacity)<0.9)continue;
    const a=lum(s.color),b=lum(bg(el)),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    if(ratio<3.5)issues.push(`contraste ${ratio.toFixed(1)} «${el.textContent.trim().slice(0,25)}»`);
  }
  return[...new Set(issues)].slice(0,14);
}

export async function walk(max=60,{wrong=false,stop=null}={}){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),root=document.querySelector('.japanese-guided-course')||document.body,log=window.__walkLog=[];window.__walkDone=false;let last='';
  for(let i=0;i<max;i++){
    await sleep(420);
    const head=(root.querySelector('.jp-question,.dc-listen,.dc-checkpoint,.dc-today,main')?.innerText||'').replace(/\s+/g,' ').slice(0,130);
    if(head!==last)log.push({screen:head,issues:audit()});last=head;
    if(stop&&stop(head))break;
    const app=window.__course,act=app?.lesson?.activities?.[app.activityIndex],fb=root.querySelector('[class*=feedback]');
    const opts=[...root.querySelectorAll('[data-jp-answer]')],inputs=[...root.querySelectorAll('.jp-question input,.jp-question textarea:not(.dc-writing)')],input=inputs.length===1?inputs[0]:null,blocks=[...root.querySelectorAll('[data-jp-block]')];
    if(!fb&&inputs.length>1){const turns=(act?.turns||[]).filter(turn=>turn.role==='learner');inputs.forEach((field,index)=>{if(!field.value){field.value=wrong?'x':String(turns[index]?.answer||turns[index]?.accepted_answers?.[0]||'x');field.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(60);}
    if(!fb&&act&&opts.length){const pick=wrong?opts[0]:opts.find(o=>(o.dataset.jpAnswer??o.textContent).trim()===String(act.answer).trim())||opts.find(o=>o.textContent.includes(String(act.answer)))||opts[0];pick.click();await sleep(80);}
    if(!fb&&blocks.length&&act){const used=new Set();for(const token of String(act.answer||'').split(act.joiner??' ')){const b=blocks.find(x=>!used.has(x)&&x.textContent.trim()===token.trim());if(b){used.add(b);b.click();await sleep(20);}}if(!used.size)for(const b of blocks){b.click();await sleep(15);}}
    if(!fb&&input&&!input.value){input.value=wrong?'x':String(act?.answer||act?.accepted_answers?.[0]||'x');input.dispatchEvent(new Event('input',{bubbles:true}));await sleep(60);}
    const buttons=[...root.querySelectorAll('footer button,.jp-check button,button.primary,.dc-listen button,.dc-dock button')].filter(b=>!b.disabled&&b.offsetParent!==null&&!/Pista|Escuchar|Seguir más tarde|Otra vez|Lento|Oír|Volver a escuchar|Ver otra vez/.test(b.textContent));
    const go=buttons.at(-1);
    if(!go){log.push({screen:'(sin botón para seguir)',issues:[]});break;}
    if(/Volver a Hoy|Hasta mañana/.test(go.textContent.trim())||root.querySelector(".dc-checkpoint.complete")){log.push({screen:`FIN: ${go.textContent.trim()}`,issues:[]});break;}
    go.click();
  }
  window.__walkDone=true;
  return report();
}
export const report=()=>(window.__walkLog||[]).map(entry=>`${entry.screen}${entry.issues.length?` ⚠ ${entry.issues.join(' ; ')}`:''}`);

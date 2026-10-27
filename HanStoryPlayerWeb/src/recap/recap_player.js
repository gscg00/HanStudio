// Reproductor del video de repaso: dibuja el estilo en un canvas 1280×720,
// lanza las voces (Web Speech) en su momento, espera si una voz real dura más
// de lo estimado, reproduce los efectos con el SOUND kit y dibuja subtítulos
// opcionales encima.
import './lib/h.js';
import './lib/sound.js';
import {sceneAt} from './recap_timeline.js';

const W=1280,HH=720;
const LANG={ko:'ko',es:'es'};
// Calidad: Premium («superior») > Mejorada > natural/neural > básica.
const QUALITY=[/premium|superior/i,/enhanced|mejorada|optimizada/i,/natural|neural|online|google/i];
const quality=voice=>{const index=QUALITY.findIndex(pattern=>pattern.test(voice.name));return index<0?0:QUALITY.length-index;};
const FEMALE=/yuna|sora|heami|sunhi|flo|sandy|shelley|grandma|marisol|paulina|m[oó]nica|helena|lucia|female/i;
const MALE=/minsu|injoon|eddy|reed|rocko|grandpa|jorge|juan|diego|male/i;

export function chooseVoice(role,voices=window.speechSynthesis?.getVoices?.()||[]){
  const lang=role.startsWith('ko')?'ko':'es';
  const pool=voices.filter(voice=>voice.lang?.toLowerCase().startsWith(lang));
  if(!pool.length)return null;
  const wanted=role==='ko-m'?MALE:role==='ko-f'?FEMALE:null;
  const ranked=[...pool].sort((a,b)=>(wanted?(wanted.test(b.name)-wanted.test(a.name))*10:0)+quality(b)-quality(a)+(lang==='es'?(/mx/i.test(b.lang)-/mx/i.test(a.lang))*0.5:0));
  return ranked[0];
}

const svgImage=svg=>new Promise(resolve=>{
  if(!svg)return resolve(null);
  const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
  img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

async function loadStyleFonts(style){
  if(style.fontCss){
    // Las fuentes solo se pueden pedir cuando la hoja de Google Fonts ya se leyó.
    let link=document.querySelector(`link[data-recap-font="${style.id}"]`);
    if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=style.fontCss;link.dataset.recapFont=style.id;document.head.appendChild(link);}
    if(!link.sheet)await new Promise(resolve=>{link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});setTimeout(resolve,2500);});
  }
  // Sin conexión se dibuja con fuentes de respaldo; nunca se bloquea el video.
  await Promise.race([Promise.all((style.fonts||[]).map(spec=>document.fonts.load(spec,'AaZz09가나다').catch(()=>null))),new Promise(resolve=>setTimeout(resolve,2500))]);
}

export async function createRecapPlayer({canvas,style,timeline,pictureFor=()=>'',sceneSvg='',onState=()=>{}}){
  canvas.width=W;canvas.height=HH;
  const ctx=canvas.getContext('2d',{willReadFrequently:Boolean(style.readsPixels)});
  await loadStyleFonts(style);
  const pictures=new Map();
  await Promise.all(timeline.items.map(async item=>{pictures.set(item.meaning,await svgImage(pictureFor(item.meaning)));}));
  const scene=await svgImage(sceneSvg);
  if(!window.speechSynthesis?.getVoices().length)await new Promise(resolve=>{window.speechSynthesis?.addEventListener?.('voiceschanged',resolve,{once:true});setTimeout(resolve,800);});
  const voices={'ko-f':chooseVoice('ko-f'),'ko-m':chooseVoice('ko-m'),es:chooseVoice('es')};

  const state={t:0,playing:false,subtitles:false,sound:true,fired:new Set(),active:null,stopSound:null,last:0,raf:0,ended:false};
  const assets={picture:meaning=>pictures.get(meaning)||null,scene};

  const speak=item=>{
    const synth=window.speechSynthesis;if(!synth)return;
    const utterance=new SpeechSynthesisUtterance(item.text),voice=voices[item.voice];
    if(voice){utterance.voice=voice;utterance.lang=voice.lang;}else utterance.lang=LANG[item.lang];
    utterance.rate=item.lang==='ko'?0.92:1;
    const active={item,speaking:true};state.active=active;
    utterance.onend=utterance.onerror=()=>{active.speaking=false;};
    synth.cancel();synth.speak(utterance);
  };
  const stopSpeech=()=>{window.speechSynthesis?.cancel();if(state.active)state.active.speaking=false;};
  const startSound=()=>{
    state.stopSound?.();state.stopSound=null;
    if(!state.sound||!state.playing||!style.score||!window.SOUND)return;
    try{state.stopSound=window.SOUND.live(k=>style.score(k,timeline),state.t,{voiceover:true});}catch{state.stopSound=null;}
  };

  const drawSubtitle=S=>{
    const current=state.active?.speaking?state.active.item:S.speaking.at(-1);
    if(!state.subtitles||!current)return;
    if(style.subtitle)return style.subtitle(ctx,W,HH,current.text,current.lang,S);
    ctx.save();ctx.font=`600 ${current.lang==='ko'?44:38}px system-ui, "Apple SD Gothic Neo", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    const width=Math.min(W-80,ctx.measureText(current.text).width+60);
    ctx.fillStyle='rgba(0,0,0,.66)';ctx.beginPath();ctx.roundRect((W-width)/2,HH-104,width,70,14);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillText(current.text,W/2,HH-69,W-120);ctx.restore();
  };
  const draw=()=>{
    const S={...sceneAt(timeline,state.t),assets};
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.clearRect(0,0,W,HH);
    ctx.save();style.frame(ctx,W,HH,state.t,S);ctx.restore();
    drawSubtitle(S);
    onState({t:state.t,duration:timeline.duration,playing:state.playing,beat:S.beat,subtitles:state.subtitles,sound:state.sound,ended:state.ended});
  };
  const tick=now=>{
    state.raf=requestAnimationFrame(tick);
    const dt=Math.min(0.1,Math.max(0,(now-(state.last||now))/1000));state.last=now;
    if(state.playing){
      for(const item of timeline.speech)if(!state.fired.has(item.id)&&state.t>=item.t){state.fired.add(item.id);speak(item);}
      // Si la voz real sigue hablando al terminar su tiempo estimado, el reloj espera.
      const waiting=state.active?.speaking&&state.t>=state.active.item.t+state.active.item.est;
      if(waiting){if(state.stopSound){state.stopSound();state.stopSound=null;state.resumeSound=true;}}
      else{
        if(state.resumeSound){state.resumeSound=false;startSound();}
        state.t=Math.min(timeline.duration,state.t+dt);
        if(state.t>=timeline.duration){state.playing=false;state.ended=true;state.stopSound?.();state.stopSound=null;}
      }
    }
    draw();
  };

  const api={
    duration:timeline.duration,
    play(){if(state.ended||state.t>=timeline.duration)api.seek(0);state.playing=true;state.ended=false;state.last=0;startSound();},
    pause(){state.playing=false;stopSpeech();state.stopSound?.();state.stopSound=null;},
    toggle(){state.playing?api.pause():api.play();},
    seek(t){
      state.t=Math.max(0,Math.min(timeline.duration,t));state.ended=false;stopSpeech();
      state.fired=new Set(timeline.speech.filter(item=>item.t<state.t).map(item=>item.id));
      if(state.playing)startSound();
    },
    // Saltar a la pregunta anterior o siguiente.
    step(direction){
      const S=sceneAt(timeline,state.t),target=timeline.beats[Math.max(0,Math.min(timeline.beats.length-1,S.beat.index+direction))];
      api.seek(target.t0+0.01);
    },
    setSubtitles(on){state.subtitles=Boolean(on);},
    setSound(on){state.sound=Boolean(on);on?startSound():(state.stopSound?.(),state.stopSound=null);},
    voices,
    destroy(){cancelAnimationFrame(state.raf);api.pause();},
  };
  state.raf=requestAnimationFrame(tick);
  return api;
}

// Práctica de escritura con el teclado físico: niveles contrarreloj y el juego
// de asteroides. Lógica pura (sin DOM) para poder probarla con node:test.
import{decomposeHangulText}from'./guided_virtual_keyboard.js';

export const LEVELS=Object.freeze([
  {id:'letters',title:'Letras',note:'Una letra cada vez: aprende dónde está.'},
  {id:'short',title:'Palabras cortas',note:'Dos o tres letras.'},
  {id:'words',title:'Palabras',note:'Palabras completas.'},
  {id:'phrases',title:'Frases',note:'Frases cortas con espacios.'},
]);
export const ITEMS_PER_LEVEL=10,PASS=8;

const KANA=/^[\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u;
// Lo que se escribe: en japonés solo kana (el kanji necesita un método de entrada).
export function typingText(item,language){
  const target=String(item?.target||'').trim().replace(/[.!?。！？]+$/u,'').trim();
  if(language!=='Japanese')return target;
  if(KANA.test(target))return target;
  const note=String(item?.note||item?.reading||'').trim();
  return KANA.test(note)?note:'';
}

// Pulsaciones necesarias (en coreano, letra por letra dentro de cada bloque).
export const keystrokes=(text,language)=>language==='Korean'?[...decomposeHangulText(text)].filter(char=>char!==' ').length+(String(text).split(' ').length-1):[...String(text)].length;

export function levelOf(text,language){
  const strokes=keystrokes(text,language),units=[...String(text)].filter(char=>char!==' ').length;
  if(/\s/.test(text))return 'phrases';
  // Una letra suelta; en coreano un bloque entero (물) ya es una palabra corta.
  if(units<=1&&(language!=='Korean'||/^[\u3131-\u318e]$/u.test(text)))return 'letters';
  return strokes<=(language==='Korean'?5:3)?'short':'words';
}

// Material sin repetir: primero lo aprendido en clase, después el vocabulario básico.
export function typingPool(sources,language){
  const seen=new Set(),pool=[];
  for(const item of sources){
    const text=typingText(item,language);
    // Patrones de gramática («~입니다», «A は B»), listas con barras o puntos suspensivos no se escriben.
    if(!text||seen.has(text)||text.length>40||/[~～…/=+→]|\b[AB]\b/.test(text))continue;
    seen.add(text);
    pool.push({text,meaning:String(item.meaning||'').trim(),level:levelOf(text,language),known:Boolean(item.known)});
  }
  return pool;
}

const hash=text=>[...String(text)].reduce((sum,char)=>(sum*31+char.codePointAt(0))>>>0,7);
const shuffle=(list,seed)=>[...list].map(item=>({item,key:hash(`${seed}|${item.text}`)})).sort((a,b)=>a.key-b.key).map(entry=>entry.item);

export function buildLevel(pool,levelId,{seed=0,count=ITEMS_PER_LEVEL}={}){
  const own=pool.filter(item=>item.level===levelId);
  // Lo aprendido en clase va primero; si no alcanza, se completa con el resto.
  return [...shuffle(own.filter(item=>item.known),seed),...shuffle(own.filter(item=>!item.known),seed)].slice(0,count);
}

// Segundos para escribir algo: más tiempo cuanto más largo, y un poco más al principio.
export const timeFor=(text,language,{level=0}={})=>Math.round((3.5+keystrokes(text,language)*(level<1?1.4:1))*10)/10;

export const normalizeTyped=(text,language)=>{
  let value=String(text||'').normalize('NFC').trim().replace(/[.!?¡¿。！？]+$/u,'').replace(/\s+/g,' ');
  if(/[A-Za-zÀ-ÿ]/.test(value)&&!['Korean','Japanese','Chinese','Arabic','Russian'].includes(language))value=value.toLowerCase();
  if(language==='Russian')value=value.toLowerCase().replace(/ё/g,'е');
  // œ y æ no están en un teclado español: «oeuf» vale por «œuf».
  value=value.replace(/œ/g,'oe').replace(/Œ/g,'Oe').replace(/æ/g,'ae').replace(/[’‘`´]/g,"'");
  return value;
};
export const typedMatches=(typed,target,language)=>normalizeTyped(typed,language)===normalizeTyped(target,language);

export function levelResult(answers){
  const correct=answers.filter(answer=>answer.ok).length;
  return {correct,total:answers.length,passed:correct>=Math.min(PASS,answers.length)};
}

// ── Asteroides ────────────────────────────────────────────────────────
// Cada ola es un poco más rápida y trae palabras más largas.
export function waveSettings(wave){
  return {fall:Math.max(7,16-wave*1.2),gap:Math.max(1.4,3.4-wave*0.25),words:6+wave*2,levels:wave<1?['letters','short']:wave<3?['short','words']:['words','phrases']};
}
export function waveWords(pool,wave,seed=0){
  const settings=waveSettings(wave),candidates=pool.filter(item=>settings.levels.includes(item.level));
  const list=shuffle(candidates.length>=settings.words?candidates:pool,`${seed}|${wave}`);
  return Array.from({length:settings.words},(_,index)=>list[index%Math.max(1,list.length)]).filter(Boolean);
}

// ── Letras difíciles (como keybr) ─────────────────────────────────────
// Cada fallo suma y cada acierto resta: las letras con más deuda salen primero.
export function updateWeakness(weak,text,ok){
  const next={...(weak||{})},value=(next[text]||0)+(ok?-1:2);
  if(value<=0)delete next[text];else next[text]=Math.min(9,value);
  return next;
}
export function weakFirst(items,weak){
  const score=item=>weak?.[item.text]||0;
  return [...items].sort((a,b)=>score(b)-score(a));
}

// ── Carrera ───────────────────────────────────────────────────────────
// Cinco frases de tus clases (si no hay, palabras), para correr contra tu mejor tiempo.
export function raceTexts(pool,{count=5,seed=0}={}){
  const phrases=buildLevel(pool,'phrases',{seed,count});
  return phrases.length>=3?phrases:[...phrases,...buildLevel(pool,'words',{seed,count:count-phrases.length})];
}
// Cuánto de lo escrito coincide desde el principio (para pintar el avance letra a letra).
export function correctPrefix(typed,target){
  const a=[...String(typed)],b=[...String(target)];let index=0;
  while(index<a.length&&a[index]===b[index])index++;
  return index;
}
export const raceProgress=(done,current,total)=>total?Math.min(1,(done+current)/total):0;

// ── Dictado relámpago ─────────────────────────────────────────────────
export function dictationItems(pool,{seed=0,count=ITEMS_PER_LEVEL}={}){
  const words=buildLevel(pool,'words',{seed,count}),shorts=buildLevel(pool,'short',{seed,count});
  return [...words,...shorts].slice(0,count);
}

// ── Tarea del día ─────────────────────────────────────────────────────
// Quince palabras sin reloj para acostumbrarse al teclado. Las mismas todo el día
// (se puede dejar a medias y seguir), primero lo aprendido en clase y lo más corto.
export const DAILY_TASK_COUNT=15;
export function dailyTaskItems(pool,day,{count=DAILY_TASK_COUNT}={}){
  const order=['short','words','letters','phrases'],seed=`daily|${day}`;
  const ranked=order.flatMap(level=>buildLevel(pool,level,{seed,count:pool.length}));
  // Como mucho tres frases: es para soltar los dedos, no una prueba.
  const phrases=ranked.filter(item=>item.level==='phrases').slice(0,3);
  const rest=ranked.filter(item=>item.level!=='phrases');
  const known=rest.filter(item=>item.known),other=rest.filter(item=>!item.known);
  const picked=[...known,...other].slice(0,Math.max(0,count-phrases.length));
  // De lo más corto a lo más largo, para entrar en calor.
  return [...shuffle(picked,seed).sort((a,b)=>[...a.text].length-[...b.text].length),...phrases].slice(0,count);
}
const previousDay=day=>{const date=new Date(`${day}T12:00:00`);date.setDate(date.getDate()-1);return date.toISOString().slice(0,10);};
// Estado de la tarea de hoy a partir de lo guardado (un día nuevo empieza de cero).
export function dailyTaskState(saved,day){
  const today=saved?.date===day?saved:{date:day,done:0,completed:false};
  const alive=saved&&(saved.lastCompleted===day||saved.lastCompleted===previousDay(day));
  return {...today,streak:alive?Number(saved.streak)||0:0,lastCompleted:saved?.lastCompleted||''};
}
// Una palabra más hecha; al llegar al total, la tarea cuenta para la racha.
export function advanceDailyTask(state,total,day){
  const done=Math.min(total,(state.done||0)+1),completed=done>=total;
  if(!completed||state.completed)return {...state,done};
  return {...state,done,completed:true,lastCompleted:day,streak:state.lastCompleted===day?state.streak:(state.streak||0)+1};
}

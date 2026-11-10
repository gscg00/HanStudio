// Cuánto estudia el alumno cada idioma y con qué se completa la clase hasta llenar ese
// tiempo: libros con audio grabado, vocabulario nuevo, escribir y hablar.
// Módulo puro (sin DOM) para poder probarlo con node:test.
import{OUTPUT_PROMPTS}from'./data/output_prompts.js';
import{LONG_READINGS}from'./data/long_readings.js';

const PRIORITY=new Set(['German','French','Korean']);
export const studyDose=language=>PRIORITY.has(language)?{minutes:120,goal:'B1 alto',reviews:80,words:12}:{minutes:60,goal:'A2',reviews:40,words:6};

// Los libros, de más fácil a más difícil. L01 no se usa: casi no tiene traducciones.
export const BOOK_PATH=Object.freeze({
  French:['HF-A1','HF-A2','HF-44-S1','HF-CRITICAL-S1'],
  German:['HG-A1','HG-A2','HG-FOGLAND-S1','HG-AOUAD-S1'],
  Korean:['HS-AC01','HS-B02','HS-B03','HS-B04','HS-VARIETY-S01E01','HK-PPALRYO-S1'],
  English:['HE-B1','HE-B2','HE-Bridge'],
});

const usable=track=>String(track.text||'').trim()&&String(track.translation||'').trim();
// Una lección de libro: sus frases y sus palabras, con la ruta de la grabación.
export function bookLessons(manifest,code){
  const byLesson=new Map();
  for(const track of manifest?.tracks||[]){
    if(!usable(track))continue;
    const group=byLesson.get(track.lesson)||{code,title:manifest.title,number:track.lesson,lines:[],words:[]},item={target:track.text,meaning:track.translation,audio:track.text,slowAudio:track.text,reading:'',speaker:track.speaker||'',speakerKo:track.speaker||'',file:track.audio_path?`../../books/${code}/${track.audio_path}`:'',activityId:`book-${track.id}`,lessonId:''};
    (track.type==='word'?group.words:group.lines).push(item);
    byLesson.set(track.lesson,group);
  }
  return[...byLesson.values()].filter(group=>group.lines.length>=3).sort((a,b)=>a.number-b.number);
}

const known=state=>{const seen=new Set();for(const entry of state?.classes||[])for(const item of[...(entry.items||[]),...(entry.words||[])])seen.add(String(item.target).toLowerCase());return seen;};

// Palabras de hoy: primero las de la lectura, luego la lista de frecuencia hasta llenar el cupo.
// Antes de la lista de frecuencia (nivel intermedio) van las palabras básicas del curso:
// el primer día no tocan «el contrato» ni «el consumidor».
export function dailyWords(state,{bookWords=[],basics=[],pack=[],limit=12}={}){
  const seen=known(state),out=[];
  for(const item of[...bookWords,...basics,...pack]){
    const key=String(item.target).toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);out.push(item);
    if(out.length>=limit)break;
  }
  return out;
}

// Sin libro, el bloque de lectura escucha otra vez frases de clases anteriores.
export function recycledLines(state,{count=8,seed=0}={}){
  const lines=(state?.classes||[]).flatMap(entry=>(entry.items||[]).filter(item=>/\s/.test(String(item.target))));
  if(!lines.length)return[];
  const step=Math.max(1,Math.floor(lines.length/count)),start=seed%lines.length,seen=new Set();
  return Array.from({length:count},(_,index)=>lines[(start+index*step)%lines.length]).filter(line=>{if(seen.has(line.target))return false;seen.add(line.target);return true;});
}

// Escucha profunda: los textos de los últimos días, sin repetir frases.
export function deepLines(state,{days=5,limit=30}={}){
  const seen=new Set();
  return(state?.classes||[]).slice(-days).flatMap(entry=>[...(entry.book?.lines||[]),...(entry.longread?.lines||[])]).filter(line=>{if(seen.has(line.target))return false;seen.add(line.target);return true;}).slice(-limit);
}

// Lectura larga: desde A2, una cada STORY_EVERY clases, en orden de dificultad.
export const STORY_EVERY=4;
const asLine=([target,meaning])=>({target,meaning,audio:target,slowAudio:target,reading:'',speaker:'',speakerKo:'',file:'',activityId:'',lessonId:''});
export function nextStory(state,language,level){
  const list=LONG_READINGS[language]||[];
  if(!list.length||level==='A1')return null;
  const classes=state?.classes||[],read=classes.filter(entry=>entry.longread).length,sinceA2=classes.filter(entry=>entry.level&&entry.level!=='A1').length;
  if(sinceA2<read*STORY_EVERY)return null;
  const story=list[read];
  return story?{id:story.id,title:story.title,level:story.level,lines:story.text.map(asLine),questions:story.questions}:null;
}

const promptLevel=level=>OUTPUT_PROMPTS[level]?level:level==='B2'?'B1+':'A1';
export function outputPrompts(level,number){
  const set=OUTPUT_PROMPTS[promptLevel(level)];
  return{write:set.write[number%set.write.length],speak:set.speak[number%set.speak.length]};
}

export const parsePack=text=>String(text).trim().split('\n').map(line=>line.split('|')).filter(parts=>parts.length===2).map(([target,meaning],index)=>({target:target.trim(),meaning:meaning.trim(),audio:target.trim(),slowAudio:target.trim(),reading:'',file:'',activityId:`pack-${index}`,lessonId:''}));

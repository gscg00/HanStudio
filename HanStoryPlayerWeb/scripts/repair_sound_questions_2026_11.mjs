#!/usr/bin/env node
// «¿Cómo se pronuncia «한국어»?» con opciones [한구거] / [한국어] / [항구거]
// confundía: en pantalla había varias escrituras «mal» y luego, en otros
// ejercicios, había que escribir la buena. Ahora no se muestran escrituras
// falsas: el alumno escucha cómo suena de verdad y escribe cómo se escribe
// (dictado). En chino, donde escribir caracteres exige un método de entrada,
// escucha y elige entre palabras distintas de la misma lección.
// Afecta a coreano, francés, portugués, ruso y chino. Se puede ejecutar varias veces.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const isSoundQuestion=activity=>activity.type==='select_translation'&&Array.isArray(activity.options)&&activity.options.length>1&&activity.options.every(option=>/^\[[^\]]+\](?: \(tal como se escribe\))?$/.test(String(option).trim()));
const sound=activity=>String(activity.answer||'').replace(' (tal como se escribe)','');

export function toDictation(activity){
  const word=String(activity.target||'').trim();
  return {...activity,type:'dictation',prompt:'Escucha y escribe la palabra',target:'',
    // Sin mostrar la forma «como suena»: en pantalla solo aparece la escritura correcta, después de responder.
    instruction:'Escúchala bien: no se escribe exactamente como suena.',
    options:[],answer:word,accepted_answers:[word],allow_minor_typos:false,
    explanation:`Se escribe «${word}» y suena ${sound(activity)}. ${String(activity.explanation||'').trim()}`.trim(),
    audio:activity.audio||word,slow_audio:activity.slow_audio||activity.audio||word,soundQuestion:'dictation'};
}

export function toListening(activity,words){
  const word=String(activity.target||'').trim(),others=words.filter(other=>other!==word).slice(0,2);
  if(others.length<2)return toDictation(activity);
  const options=[word,...others].sort((a,b)=>(a+word).localeCompare(b+word));
  return {...activity,type:'listening_choice',prompt:'Escucha y elige la palabra que oyes',target:'',
    options,answer:word,explanation:`Escuchaste «${word}»: suena ${sound(activity)}. ${String(activity.explanation||'').trim()}`.trim(),
    audio:activity.audio||word,slow_audio:activity.slow_audio||activity.audio||word,soundQuestion:'listening'};
}

let total=0;
for(const language of fs.readdirSync(ROOT)){
  const file=path.join(ROOT,language,'units','reading.json');
  if(!fs.existsSync(file))continue;
  const before=fs.readFileSync(file,'utf8'),data=JSON.parse(before);let count=0;
  for(const lesson of data.lessons||[]){
    const words=(lesson.activities||[]).filter(isSoundQuestion).map(activity=>String(activity.target||'').trim());
    lesson.activities=(lesson.activities||[]).map(activity=>{
      if(!isSoundQuestion(activity))return activity;
      count++;
      return language==='Chinese'?toListening(activity,words):toDictation(activity);
    });
  }
  const after=JSON.stringify(data,null,2)+'\n';
  if(after!==before)fs.writeFileSync(file,after);
  if(count){total+=count;console.log(`${language}: ${count} preguntas`);}
}
console.log(`Total: ${total}`);

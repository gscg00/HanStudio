#!/usr/bin/env node
// Correcciones editoriales para la primera unidad A1.1. Se mantienen separadas
// del generador masivo porque estos cursos ya tienen referencias de audio curadas.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const noteByTarget={
  'bonsoir':'Se usa para saludar al final de la tarde o por la noche. Para despedirte o desear que alguien duerma bien se dice «bonne nuit».',
  'Guten Abend':'Es un saludo de la tarde o la noche. «Gute Nacht» se usa al despedirse antes de dormir, no para iniciar la conversación.',
  'добрый вечер':'Es un saludo de la tarde o la noche. «Спокойной ночи» se usa para desear buenas noches antes de dormir.',
  '좋은 아침이에요':'Se entiende como “buenos días”, pero «안녕하세요» es el saludo general más frecuente, también por la mañana.',
  '좋은 저녁이에요':'Literalmente es “es una buena tarde/noche”. No es el saludo cotidiano habitual: para saludar por la noche se usa normalmente «안녕하세요».',
  '안녕히 가세요':'Se dice cuando la otra persona se va y tú te quedas. Si tú eres quien se va, di «안녕히 계세요».',
  '이 사람들은 제 가족이에요.':'«이 사람들은» significa “estas personas”; la frase presenta a varias personas como tu familia.',
  'мать':'Significa “madre” y es una palabra neutral o algo formal. En una conversación familiar es frecuente decir «мама».',
  'отец':'Significa “padre” y es una palabra neutral o algo formal. En una conversación familiar es frecuente decir «папа».',
};

const replaceText=(value,from,to)=>{
  if(typeof value==='string')return value.replaceAll(from,to);
  if(Array.isArray(value))return value.map(item=>replaceText(item,from,to));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceText(item,from,to)]));
  return value;
};

function repair(language,file){
  const filename=path.join(web,'library','courses',language,'units',file);
  let unit=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(language==='French'&&file==='a1-1-identity.json'){
    unit=replaceText(unit,'bon matin','bonjour');
  }
  for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
    if(activity.target==='bonjour'&&String(activity.usage_note||'').includes('Uso regional y familiar'))delete activity.usage_note;
    const note=noteByTarget[activity.target];
    if(note)activity.usage_note=note;
    if(activity.target==='이 사람들은 제 가족이에요.'){
      activity.answer=activity.answer? 'Estas personas son mi familia.':activity.answer;
      activity.explanation=activity.type==='teach_concept'?'Estas personas son mi familia.':activity.explanation.replaceAll('Esta es mi familia.','Estas personas son mi familia.');
      activity.options=(activity.options||[]).map(option=>option==='Esta es mi familia.'?'Estas personas son mi familia.':option);
    }
    if(activity.target==='Меня зовут Анна.'){
      activity.answer=activity.answer? 'Me llamo Anna.':activity.answer;
      activity.explanation=activity.explanation.replaceAll('Me llamo Ana.','Me llamo Anna.');
      activity.options=(activity.options||[]).map(option=>option==='Me llamo Ana.'?'Me llamo Anna.':option);
    }
  }
  fs.writeFileSync(filename,JSON.stringify(unit,null,2)+'\n');
}

for(const [language,file] of [
  ['French','a1-1-identity.json'],['German','a1-1-identity.json'],['Korean','a1-1-identity.json'],['Korean','a1-1-people.json'],['Russian','a1-1-identity.json'],['Russian','a1-1-people.json'],
])repair(language,file);


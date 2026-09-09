import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];
const totals={recommendationPronoun:0,morningSense:0,weeklyFrequency:0};

function rewrite(value,kind){
  if(Array.isArray(value))return value.map(item=>rewrite(item,kind));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewrite(item,kind)]));
  if(typeof value!=='string')return value;
  let next=value;
  if(kind==='recommendation'){
    next=next.replaceAll('La recomiendo porque los personajes parecen reales.','Lo recomiendo porque los personajes parecen reales.');
    if(next!==value)totals.recommendationPronoun++;
  }else if(kind==='weekly'){
    next=next.replaceAll('Trabajo desde casa dos días.','Trabajo desde casa dos días por semana.');
    if(next!==value)totals.weeklyFrequency++;
  }else{
    if(next==='mañana')next='la mañana (parte del día)';
    next=next.replaceAll('«mañana»','«la mañana (parte del día)»');
    if(next!==value)totals.morningSense++;
  }
  return next;
}

for(const language of languages){
  for(const filename of ['b1-1-media.json','b1-2-nuance.json']){
    const file=path.join(root,language,'units',filename),data=JSON.parse(fs.readFileSync(file,'utf8'));
    fs.writeFileSync(file,JSON.stringify(rewrite(data,'recommendation'),null,2)+'\n');
  }
  const file=path.join(root,language,'units','a1-1-routine.json'),data=JSON.parse(fs.readFileSync(file,'utf8'));
  fs.writeFileSync(file,JSON.stringify(rewrite(data,'morning'),null,2)+'\n');
  const weeklyFile=path.join(root,language,'units','a2-2-workStudy.json');
  const weeklyData=JSON.parse(fs.readFileSync(weeklyFile,'utf8'));
  fs.writeFileSync(weeklyFile,JSON.stringify(rewrite(weeklyData,'weekly'),null,2)+'\n');
}

console.log(JSON.stringify(totals,null,2));

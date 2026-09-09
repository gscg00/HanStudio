import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const unitsRoot=path.join(root,'library','courses','Korean','units');
const notes={
  '은/는':'Marca el tema: 은 va después de consonante y 는 después de vocal.',
  '이/가':'Marca el sujeto o información nueva: 이 va después de consonante y 가 después de vocal.',
  '을/를':'Marca el objeto directo: 을 va después de consonante y 를 después de vocal.',
  '이에요/예요':'Equivale aproximadamente a «ser»: 이에요 después de consonante y 예요 después de vocal.',
  '있어요/없어요':'Expresan existencia o posesión: 있어요 afirma y 없어요 niega.',
};
const oldNotes={
  '은/는':'Marca el tema de la conversación.',
  '이/가':'Marca el sujeto o información nueva.',
  '을/를':'Marca el objeto directo.',
  '이에요/예요':'Equivale aproximadamente a “ser”.',
  '있어요/없어요':'Expresan existencia o posesión.',
};
let changed=0;
for(const file of fs.readdirSync(unitsRoot).filter(name=>name.endsWith('.json'))){
  const filePath=path.join(unitsRoot,file),unit=JSON.parse(fs.readFileSync(filePath,'utf8'));let unitChanged=false;
  for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
    const note=notes[String(activity.target||activity.answer||'').trim()];if(!note)continue;
    const previous=oldNotes[String(activity.target||activity.answer||'').trim()]||activity.explanation||activity.answer||'';
    if(activity.explanation===note&&(!['select_translation'].includes(activity.type)||activity.options?.includes(note)))continue;
    activity.explanation=note;
    if(activity.type==='select_translation'){
      activity.options=(activity.options||[]).map(option=>option===previous?note:option);
      if(activity.options.includes(note))activity.answer=note;
    }
    unitChanged=true;changed++;
  }
  if(unitChanged)fs.writeFileSync(filePath,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({activitiesChanged:changed}));

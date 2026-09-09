import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const languages=['French','German','Italian'];let replacements=0;
function rewrite(value){
  if(Array.isArray(value))return value.map(rewrite);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewrite(item)]));
  if(typeof value!=='string')return value;
  const next=value.replaceAll('Me llamo Ana','Me llamo Anna');if(next!==value)replacements++;return next;
}
for(const language of languages){
  const courseRoot=path.join(root,language),course=JSON.parse(fs.readFileSync(path.join(courseRoot,'course.json'),'utf8'));
  for(const summary of course.units){
    const unitPath=path.join(courseRoot,summary.manifest),unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));let changed=false;
    for(const lesson of unit.lessons||[])for(let index=0;index<(lesson.activities||[]).length;index++){
      const activity=lesson.activities[index],serialized=JSON.stringify(activity);
      if(!serialized.includes('Anna')||!serialized.includes('Me llamo Ana'))continue;
      lesson.activities[index]=rewrite(activity);changed=true;
    }
    if(changed)fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');
  }
}
console.log(JSON.stringify({replacements},null,2));

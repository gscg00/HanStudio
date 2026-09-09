import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const courseRoot=path.join(root,'library','courses','Portuguese');
const notes=JSON.parse(fs.readFileSync(path.join(root,'course-authoring','portuguese_variant_notes.json'),'utf8'));
const coursePath=path.join(courseRoot,'course.json'),course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
course.variantPolicy={scope:'Portugal y Brasil',wordTtsLanguage:'pt-PT',note:'El curso presenta las dos variedades y etiqueta el vocabulario que cambia entre ellas.'};
course.tagline='Aprende portugués y distingue con claridad formas de Portugal y Brasil.';
fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');

let activities=0;
for(const summary of course.units){
  const unitPath=path.join(courseRoot,summary.manifest),unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));let changed=false;
  for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
    if(!activity.type?.startsWith('teach_'))continue;
    const target=String(activity.target||'').toLocaleLowerCase();
    const matches=Object.entries(notes).filter(([form])=>new RegExp(`(^|[^\\p{L}])${form.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^\\p{L}]|$)`,'iu').test(target));
    if(!matches.length)continue;
    const note=[...new Set(matches.map(([,value])=>value))].join(' ');
    if(activity.usage_note!==note){activity.usage_note=note;changed=true;activities++;}
  }
  if(changed)fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({activities,variantPolicy:course.variantPolicy},null,2));

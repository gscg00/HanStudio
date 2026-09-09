import fs from 'node:fs';

const file=new URL('../library/courses/Arabic/units/reading-foundations.json',import.meta.url);
const unit=JSON.parse(fs.readFileSync(file,'utf8'));
const ids=new Set([
  'arabic-reading-00-11-b-teach',
  'arabic-reading-foundations-production-dictation',
  'arabic-reading-foundations-production-complete',
]);
let changed=0;
for(const lesson of unit.lessons)for(const activity of lesson.activities||[]){
 if(!ids.has(activity.id))continue;
 const before=JSON.stringify(activity);
 activity.audio='';
 activity.slow_audio='';
 if(activity.id==='arabic-reading-foundations-production-dictation')activity.explanation='Copia exactamente los signos «ْ ّ».';
 if(activity.id==='arabic-reading-foundations-production-complete'){
  activity.prompt='Completa con los signos ortográficos practicados';
  activity.instruction='Escribe exactamente «ْ ّ»; no se escuchan aislados porque no forman un sonido independiente.';
  activity.explanation='Sukun y shadda cambian la estructura silábica, pero no tienen una pronunciación aislada.';
 }
 if(before!==JSON.stringify(activity))changed++;
}
fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
console.log(JSON.stringify({changed}));

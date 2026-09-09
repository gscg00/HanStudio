import fs from 'node:fs';
const file=new URL('../library/courses/Italian/units/reading-foundations.json',import.meta.url);
const unit=JSON.parse(fs.readFileSync(file,'utf8'));
let changed=0;
for(const lesson of unit.lessons)for(const activity of lesson.activities){
  if(activity.type!=='teach_concept'||activity.target!=='gn: bagno')continue;
  const before=JSON.stringify(activity);
  activity.audio='';activity.slow_audio='';
  activity.audio_examples=[{label:'GN DENTRO DE UNA PALABRA',text:'bagno',meaning:'baño',audio:'bagno'}];
  if(before!==JSON.stringify(activity))changed++;
}
fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
console.log(JSON.stringify({changed}));

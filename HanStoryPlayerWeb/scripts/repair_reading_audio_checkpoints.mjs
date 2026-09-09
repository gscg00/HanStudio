import fs from 'node:fs';
const specifications=JSON.parse(fs.readFileSync(new URL('../course-authoring/reading_audio_checkpoints.json',import.meta.url),'utf8'));
let changed=0;
for(const [language,repairs] of Object.entries(specifications)){
  const file=new URL(`../library/courses/${language}/units/reading-foundations.json`,import.meta.url);
  const unit=JSON.parse(fs.readFileSync(file,'utf8'));
  const lesson=unit.lessons.find(l=>l.generatedProduction);
  for(const [suffix,spec] of Object.entries(repairs)){
    const activity=lesson.activities.find(a=>a.id.endsWith(`-production-${suffix}`));
    if(!activity)throw Error(`${language}: missing ${suffix}`);
    const before=JSON.stringify(activity);
    const {source_id,...fields}=spec;
    Object.assign(activity,fields,{type:spec.target?'complete_without_options':'dictation',target:spec.target||'',accepted_answers:[spec.answer],slow_audio:spec.audio,allow_minor_typos:false,reading_audio_source_id:source_id});
    if(activity.type==='dictation')activity.dictation_instruction=spec.instruction;
    activity.tags=activity.tags.filter(tag=>tag!=='copying');
    if(before!==JSON.stringify(activity))changed++;
  }
  fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({changed}));

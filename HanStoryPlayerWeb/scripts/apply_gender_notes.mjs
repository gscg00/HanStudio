import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const notes=JSON.parse(fs.readFileSync(new URL('course-authoring/qa_gender_notes.json',root),'utf8'));
const feminine={French:'Tu es déjà allée là-bas ?',Italian:'Sei mai stata lì?',Russian:'Ты когда-нибудь там была?'};
let changed=0;
for(const [language,forms] of Object.entries(notes)){
  const courseRoot=new URL(`library/courses/${language}/`,root);
  const course=JSON.parse(fs.readFileSync(new URL('course.json',courseRoot),'utf8'));
  for(const summary of course.units){
    const file=new URL(summary.manifest,courseRoot),raw=fs.readFileSync(file,'utf8'),unit=JSON.parse(raw);
    for(const lesson of unit.lessons)for(const activity of lesson.activities){
      const note=forms[activity.target]||forms[activity.audio];
      if(note&&!String(activity.usage_note||'').includes(note)){
        activity.usage_note=[activity.usage_note,note].filter(Boolean).join(' ');changed++;
      }
      if(forms[activity.answer]&&activity.type==='open_question'&&activity.prompt?.includes('«¿Alguna vez has estado allí?»')){
        const accepted=activity.accepted_answers||[];
        if(!accepted.includes(feminine[language])){activity.accepted_answers=[...accepted,feminine[language]];changed++;}
      }
    }
    const next=JSON.stringify(unit,null,2)+'\n';if(next!==raw)fs.writeFileSync(file,next);
  }
}
console.log(JSON.stringify({changed}));

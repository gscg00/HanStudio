import fs from 'node:fs';
const root=new URL('../',import.meta.url),entries=JSON.parse(fs.readFileSync(new URL('course-authoring/qa_register_requests.json',root),'utf8'));
for(const [language,entry] of Object.entries(entries)){
 const file=new URL(`library/courses/${language}/units/b1-1-register.json`,root),unit=JSON.parse(fs.readFileSync(file,'utf8'));
 const lesson=unit.lessons.find(l=>l.activities.some(a=>a.type==='teach_concept'&&a.target===entry.form));
 if(!lesson)throw Error(`Falta enseñanza de la petición: ${language}`);
 const teaching=lesson.activities.find(a=>a.type==='teach_concept'&&a.target===entry.form);
 if(!teaching.usage_note)teaching.usage_note=entry.note;
 else if(!teaching.usage_note.includes(entry.note))teaching.usage_note+=' '+entry.note;
 const id=`${language.toLowerCase()}-qa-register-request`;
 const activity={id,type:'open_question',prompt:'Pide ayuda con cortesía',
  learning_context:'Te diriges a una persona desconocida en un lugar de atención al público. Necesitas que te ayude. Usa el tratamiento respetuoso practicado en esta unidad.',
  instruction:'Formula una pregunta para pedir ayuda. Se aceptan las formulaciones registradas para esta situación; no tienes que copiar palabra por palabra el modelo.',
  target:'¿Podría ayudarme, por favor?',answer:entry.form,accepted_answers:[entry.form,...entry.alternatives],
  answer_policy:'registered',speech_enabled:true,audio:teaching.audio||entry.form,slow_audio:teaching.slow_audio||teaching.audio||entry.form,
  usage_note:entry.note,explanation:entry.note,tags:['production','register','contextual-request'],xp:20};
 const existing=lesson.activities.findIndex(a=>a.id===id);
 if(existing>=0)lesson.activities[existing]=activity;
 else{
  const listen=lesson.activities.findIndex(a=>a.type==='listening_choice'&&a.answer===entry.form);
  if(listen<0)throw Error(`Falta práctica de escucha: ${language}`);
  lesson.activities.splice(listen+1,0,activity);
 }
 fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
 console.log(`${language}: ${lesson.id} · petición contextual y nota de registro.`);
}

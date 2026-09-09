import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const notes=JSON.parse(fs.readFileSync(path.join(web,'course-authoring/qa_cause_effect_notes.json'),'utf8'));
for(const [language,entries] of Object.entries(notes)){
 const dir=path.join(web,'library/courses',language),course=JSON.parse(fs.readFileSync(path.join(dir,'course.json'),'utf8'));let count=0;
 for(const ref of course.units){
   const file=path.join(dir,ref.manifest),raw=fs.readFileSync(file,'utf8'),unit=JSON.parse(raw);
   function visit(record){
     const note=entries.find(n=>[record.target,record.answer,record.audio].includes(n.form));
     if(note){
       if(!record.usage_note)record.usage_note=note.note;
       else if(!record.usage_note.includes(note.note))record.usage_note+=' '+note.note;
       if(note.context)record.learning_context=note.context;
       count++;
     }
     for(const turn of record.turns||[])visit(turn);
   }
   for(const lesson of unit.lessons)for(const a of lesson.activities)visit(a);
   const next=JSON.stringify(unit,null,2)+'\n';if(next!==raw)fs.writeFileSync(file,next);
 }
 console.log(`${language}: ${count} actividades o turnos con notas específicas.`);
}

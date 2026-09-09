import fs from 'node:fs';
import {buildLearningIndex,learningFeedback} from '../src/guided_learning_feedback.js';
const root=new URL('../library/courses/',import.meta.url),results=[];
const languages=['English','French','German','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Arabic'];
for(const language of languages){
 const dir=new URL(`${language}/`,root),course=JSON.parse(fs.readFileSync(new URL('course.json',dir),'utf8'));
 const result={language,answers:0,withNotesOrBreakdown:0,withoutNotesOrBreakdown:0,byType:{},missing:[]};
 for(const ref of course.units){
  const unit=JSON.parse(fs.readFileSync(new URL(ref.manifest,dir),'utf8')),index=buildLearningIndex(unit);
  for(const lesson of unit.lessons)for(const activity of lesson.activities){
   const records=activity.turns?.filter(t=>t.role==='learner').map(t=>({...t,type:t.response_type||'open_question'}))||[activity];
   for(const a of records){
    if(!a.answer||a.type?.startsWith('teach_'))continue;
    const help=learningFeedback(a,a.answer,index),type=a.type||'sin_tipo';
    result.answers++;result.byType[type]??={answers:0,withSupport:0,withoutAdditionalSupport:0};result.byType[type].answers++;
    if(help.hasExplanation){result.withNotesOrBreakdown++;result.byType[type].withSupport++;}
    else{result.withoutNotesOrBreakdown++;result.byType[type].withoutAdditionalSupport++;if(result.missing.length<40)result.missing.push({lesson:lesson.id,type,answer:a.answer});}
   }
  }
 }
 results.push(result);
 console.log(`${language}: ${result.withoutNotesOrBreakdown}/${result.answers} respuestas sin nota o desglose adicional.`);
}
fs.writeFileSync(new URL('../docs/qa_learning_feedback_coverage.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),scope:'Presencia de notas/desgloses, NO certificación de exactitud o utilidad. Muestra de hasta 40 faltantes por idioma.',results},null,2)+'\n');

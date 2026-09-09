import fs from 'node:fs';
const root=new URL('../library/courses/',import.meta.url),courses=[],findings=[];
const audioClaim=/(^|[^\p{L}])(escucha|escuchas|escuchaste|audio|oye|oigas|audición)(?=$|[^\p{L}])/iu;
// These are reviewed contextual mappings, not literal audio-to-answer pairs.
// Keep this list deliberately exact: every new mismatch must still be surfaced.
const reviewedMappings=new Map([
  ['chinese-reading-foundations-production-dictation','pinyin nǐ identifica el carácter 你'],
  ['chinese-reading-foundations-production-complete','pinyin nǐ identifica el carácter 你 dentro de 你好'],
  ['portuguese-reading-foundations-production-complete','casa es la palabra completa usada como pista para completar s'],
  ['russian-reading-foundations-production-dictation','el nombre жэ identifica la grafía Ж'],
  ['russian-reading-foundations-production-complete','el nombre ша identifica la grafía Ш'],
]);
for(const language of ['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian']){
  let checked=0,flagged=0;
  const directory=new URL(`${language}/units/`,root);
  for(const file of fs.readdirSync(directory).filter(file=>file.endsWith('.json'))){
    const unit=JSON.parse(fs.readFileSync(new URL(file,directory),'utf8'));
    for(const lesson of unit.lessons||[])for(const a of lesson.activities||[]){
      if(!a.tags?.includes('reading')||!a.tags?.includes('production'))continue;
      checked++;
      const answer=String(a.answer||'').normalize('NFC').trim(),audio=String(a.audio||'').normalize('NFC').trim();
      if(audio&&answer&&audio.toLowerCase()!==answer.toLowerCase()){
        const nameMapping=Array.from(answer).length===1&&/nombre/i.test(a.prompt||'');
        const reviewed=reviewedMappings.get(a.id);
        if(reviewed) findings.push({severity:'info',language,file,lessonId:lesson.id,activityId:a.id,type:a.type,prompt:a.prompt,answer,audio,
          classification:'reviewed_contextual_audio_mapping',message:reviewed});
        else{
          findings.push({severity:'warning',language,file,lessonId:lesson.id,activityId:a.id,type:a.type,prompt:a.prompt,answer,audio,
            classification:nameMapping?'explicit_letter_name_mapping_requires_review':'audio_answer_mismatch_requires_review'});
          flagged++;
        }
      }
      if(!audio&&audioClaim.test(`${a.prompt||''} ${a.instruction||''} ${a.explanation||''}`)){
        findings.push({language,file,lessonId:lesson.id,activityId:a.id,type:a.type,prompt:a.prompt,answer,audio,
          classification:'feedback_claims_listening_without_activity_audio'});flagged++;
      }
    }
  }
  courses.push({language,checked,flagged});
}
const report={date:new Date().toISOString(),scope:'Production activities tagged reading only. Text mismatch is a review signal, not acoustic validation. Explicit reviewed contextual mappings remain informational; all new mismatches are warnings.',courses,findings};
fs.writeFileSync(new URL('../docs/qa_reading_audio_alignment.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({courses,findings:findings.length},null,2));

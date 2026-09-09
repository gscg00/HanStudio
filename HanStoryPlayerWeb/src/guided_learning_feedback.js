import {phraseBreakdown,phraseUsageNote,phraseContextNote,phraseAudioExamples} from './guided_phrase_support.js';
import {resolveTeachingLinks} from './guided_teaching_links.js';

const clean=value=>String(value??'').normalize('NFC').trim();
const teaching=new Set(['teach_concept','teach_word','teach_pattern','teach_kanji','teach_kana']);
const meaningQuestion=a=>a.type==='select_translation'&&/^¿?Qué significa\b/i.test(a.prompt||'');
const rich=a=>phraseBreakdown(a).length+Number(Boolean(phraseUsageNote(a)))+Number(Boolean(phraseContextNote(a)));

export function buildLearningIndex(unit){
 const byForm=new Map(),byMeaning=new Map(),referencesById=new Map();
 for(const lesson of unit.lessons||[])for(let i=0;i<(lesson.activities||[]).length;i++){
  const links=resolveTeachingLinks(lesson.activities,i);
  if(links.declared&&!links.invalid.length)referencesById.set(lesson.activities[i].id,links.sources);
 }
 for(const lesson of unit.lessons||[])for(const a of lesson.activities||[]){
   if(!teaching.has(a.type)&&!meaningQuestion(a))continue;
   const form=clean(a.target),meaning=clean(meaningQuestion(a)?a.answer:a.meaning);
   if(!form)continue;
   const entry={form,meaning,record:a,lessonId:lesson.id,lessonTitle:lesson.title};
   if(!byForm.has(form))byForm.set(form,[]);byForm.get(form).push(entry);
   if(meaning){if(!byMeaning.has(meaning))byMeaning.set(meaning,[]);byMeaning.get(meaning).push(entry);}
 }
 return {byForm,byMeaning,referencesById};
}

function lookup(index,form,meaning=''){
 let entries=index.byForm.get(clean(form))||[];
 if(meaning){
   const known=[...new Set(entries.map(entry=>entry.meaning).filter(Boolean))];
   const unambiguous=known.length===1&&known[0]===clean(meaning);
   entries=entries.filter(entry=>entry.meaning===clean(meaning)||(unambiguous&&!entry.meaning));
 }
 if(!entries.length)return null;
 // Never choose an arbitrary translation of a polysemous form.
 const meanings=[...new Set(entries.map(e=>e.meaning).filter(Boolean))];
 if(meanings.length>1)return null;
 const best=[...entries].sort((a,b)=>rich(b.record)-rich(a.record))[0];
 return {...best,meaning:meanings.length===1?meanings[0]:''};
}

export function learningFeedback(activity,given,index){
 const form=meaningQuestion(activity)?activity.target:
   ['listening_choice','audio_to_kana','dictation','typed_translation','open_question','speak_and_transcribe','build_with_blocks'].includes(activity.type)?activity.answer:activity.target;
 const source=lookup(index,form,meaningQuestion(activity)?activity.answer:''),record=source?.record||activity;
 const correctMeaning=meaningQuestion(activity)?clean(activity.answer):source?.meaning||'';
 let contrast=null;
 if(clean(given)&&clean(given)!==clean(activity.answer)){
   if(meaningQuestion(activity)){
     const entries=index.byMeaning.get(clean(given))||[],forms=[...new Set(entries.map(e=>e.form))];
     if(forms.length===1&&forms[0]!==clean(form))contrast={form:forms[0],meaning:clean(given),direction:'meaning'};
   }else if(['listening_choice','audio_to_kana'].includes(activity.type)){
     const selected=lookup(index,given);
     if(selected?.meaning&&selected.form!==clean(form))contrast={form:selected.form,meaning:selected.meaning,direction:'form'};
   }
 }
 const notes=[...new Set([phraseUsageNote(record),phraseContextNote(record),
   ...(record.teaching_points||[]),record.sound_hint,record.memory_hint,
   record.explanation].map(clean).filter(Boolean))]
   .filter(note=>note!==correctMeaning&&note!==clean(form)&&note!==clean(activity.answer)
     &&note!==`«${form}» significa «${correctMeaning}».`);
 const references=(index.referencesById?.get(activity.id)||[]).map(a=>({form:clean(a.target),audio:a.audio||'',audioExamples:phraseAudioExamples(a),
  notes:[...new Set([a.explanation,a.sound_hint,a.memory_hint,phraseUsageNote(a),phraseContextNote(a),...(a.teaching_points||[])].map(clean).filter(Boolean))]}));
 const referencedNotes=new Set(references.flatMap(ref=>ref.notes));
 return {form:clean(form),meaning:correctMeaning,contrast,notes:notes.filter(note=>!referencedNotes.has(note)),words:phraseBreakdown(record),references,audioExamples:phraseAudioExamples(record),
   sourceLessonId:source?.lessonId||'',sourceLessonTitle:source?.lessonTitle||'',
   // Keep audio explicit: only reuse a declared source key.
   audio:record.audio||'',hasExplanation:notes.length>0||phraseBreakdown(record).length>0||references.length>0||phraseAudioExamples(record).length>0};
}

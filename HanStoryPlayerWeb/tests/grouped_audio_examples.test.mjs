import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const teachingTypes=new Set(['teach_concept','teach_word','teach_pattern','teach_kanji','teach_kana','dialogue_model']);
const selectableTypes=new Set(['audio_to_kana','listening_choice','select_translation','word_to_translation','kana_choice','kana_to_audio','minimal_pair']);
const splitSlash=value=>String(value??'').split(/\s+\/\s+/u).map(item=>item.trim()).filter(Boolean);
const splitAudioParts=(value,targetCount)=>{const slash=splitSlash(value);if(slash.length>1)return slash;const spaced=String(value??'').trim().split(/\s+/u).filter(Boolean);return spaced.length===targetCount?spaced:slash;};

test('las formas agrupadas tienen un audio identificable por ejemplo',()=>{
  const failures=[];
  for(const language of fs.readdirSync(path.join(root,'library','courses'))){
    const languageRoot=path.join(root,'library','courses',language),coursePath=path.join(languageRoot,'course.json');
    if(!fs.existsSync(coursePath))continue;
    const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
    for(const summary of course.units||[]){
      const unitPath=path.join(languageRoot,summary.manifest);
      if(!fs.existsSync(unitPath))continue;
      const unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));
      for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
        if(!activity.audio||activity.audio_examples?.length)continue;
        if(!teachingTypes.has(activity.type)&&!selectableTypes.has(activity.type))continue;
        const targetParts=splitSlash(activity.target||activity.answer),audioParts=splitAudioParts(activity.audio,targetParts.length);
        if(activity.teaching_kind==='rule'&&(/[\/]/u.test(String(activity.target||''))||audioParts.length>1)){
          if(!activity.audio_examples?.length)failures.push(`${language}/${lesson.id}/${activity.id}`);
          continue;
        }
        if(targetParts.length<2||audioParts.length<2)continue;
        failures.push(`${language}/${lesson.id}/${activity.id}`);
      }
    }
  }
  assert.deepEqual(failures,[]);
});

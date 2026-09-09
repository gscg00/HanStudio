import fs from 'node:fs';
import {japaneseVowelExamples,japaneseKatakanaExample} from './japanese_intro_audio.mjs';
const file=new URL('../library/courses/Japanese/units/reading-foundations.json',import.meta.url);
const unit=JSON.parse(fs.readFileSync(file,'utf8'));
const examples={
 'japanese-reading-00-01-a-teach':japaneseVowelExamples,
 'japanese-reading-00-02-a-teach':japaneseVowelExamples,
 'japanese-reading-00-01-b-teach':japaneseKatakanaExample,
};
let count=0;
for(const lesson of unit.lessons)for(const a of lesson.activities)if(examples[a.id]){a.audio='';a.slow_audio='';a.audio_examples=examples[a.id];count++;}
if(count!==3)throw Error(`Se esperaban tres tarjetas: ${count}`);
fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
console.log(JSON.stringify({cards:count}));

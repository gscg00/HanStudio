import fs from 'node:fs';
import {sequenceKoreanVowels} from './korean_vowel_sequence.mjs';
const file=new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url);
const unit=JSON.parse(fs.readFileSync(file,'utf8'));
const refs={
 'korean-hangul-00-vowels-layout':['korean-hangul-00-vowels-a','korean-hangul-00-vowels-i'],
 'korean-hangul-00-vowels-horizontal-layout':['korean-hangul-00-vowels-o','korean-hangul-00-vowels-u'],
 'korean-hangul-00-blocks-rule-q':['korean-hangul-00-blocks-vertical','korean-hangul-00-blocks-horizontal'],
 'korean-hangul-00-batchim-rule':['korean-hangul-00-batchim-han','korean-hangul-00-batchim-mun','korean-hangul-00-batchim-bap']
};
let count=0;
for(const lesson of unit.lessons)for(const activity of lesson.activities){
 if(refs[activity.id]){activity.teaching_refs=refs[activity.id];count++;}
}
if(count!==4)throw Error(`Se esperaban cuatro preguntas; se encontraron ${count}.`);
let listeningLinks=0;
for(const lesson of unit.lessons)for(const [index,activity] of lesson.activities.entries()){
 if(activity.type!=='listening_choice'||!activity.id.endsWith('-listen'))continue;
 const source=lesson.activities.slice(0,index).find(item=>item.id===activity.id.slice(0,-7)&&item.type==='teach_concept'&&item.audio===activity.audio);
 if(source){activity.teaching_refs=[source.id];listeningLinks++;}
}
sequenceKoreanVowels(unit.lessons);
fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
console.log(JSON.stringify({conceptLinks:count,listeningLinks}));

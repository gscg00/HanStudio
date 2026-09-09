import fs from 'node:fs';
import {sequenceChineseToneLesson} from './chinese_tone_sequence.mjs';

const file=new URL('../library/courses/Chinese/units/reading-foundations.json',import.meta.url);
const unit=JSON.parse(fs.readFileSync(file,'utf8'));
let changed=0;
unit.lessons=unit.lessons.map(lesson=>{
 const next=sequenceChineseToneLesson(lesson);
 if(JSON.stringify(next.activities)!==JSON.stringify(lesson.activities))changed++;
 return next;
});
fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
console.log(JSON.stringify({changed}));


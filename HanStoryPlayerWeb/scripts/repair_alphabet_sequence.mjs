import fs from 'node:fs';
import {sequenceAlphabetLessons} from './alphabet_sequence.mjs';
for(const language of ['English','French','German','Italian','Portuguese','Russian','Arabic']){
 const path=new URL(`../library/courses/${language}/units/reading-foundations.json`,import.meta.url);
 const before=fs.readFileSync(path,'utf8'),unit=JSON.parse(before);
 sequenceAlphabetLessons(unit.lessons);
 const after=JSON.stringify(unit,null,2)+'\n';
 if(after!==before)fs.writeFileSync(path,after);
 console.log(JSON.stringify({language,changed:after!==before}));
}

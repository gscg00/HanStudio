import fs from 'node:fs';
import {applyJapaneseReadingExamples} from './japanese_reading_examples.mjs';
const file=new URL('../library/courses/Japanese/units/reading-foundations.json',import.meta.url);
const before=fs.readFileSync(file,'utf8'),unit=JSON.parse(before);
applyJapaneseReadingExamples(unit.lessons);
const after=JSON.stringify(unit,null,2)+'\n';
if(before!==after)fs.writeFileSync(file,after);
console.log(JSON.stringify({changed:before!==after}));

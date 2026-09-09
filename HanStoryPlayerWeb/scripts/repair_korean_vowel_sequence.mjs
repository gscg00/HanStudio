import fs from 'node:fs';
import {sequenceKoreanVowels} from './korean_vowel_sequence.mjs';
const file=new URL('../library/courses/Korean/units/hangul-foundations.json',import.meta.url);
const before=fs.readFileSync(file,'utf8'),unit=JSON.parse(before);
sequenceKoreanVowels(unit.lessons);
const after=JSON.stringify(unit,null,2)+'\n';
if(before!==after)fs.writeFileSync(file,after);
console.log(JSON.stringify({changed:before!==after}));

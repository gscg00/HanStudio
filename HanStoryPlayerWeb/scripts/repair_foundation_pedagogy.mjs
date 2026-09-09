import fs from 'node:fs';
import {repairFoundationPedagogy} from './foundation_pedagogy.mjs';
for(const language of ['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian']){
 const root=new URL(`../library/courses/${language}/`,import.meta.url);
 const file=new URL(`units/${language==='Korean'?'hangul':'reading'}-foundations.json`,root);
 const unit=JSON.parse(fs.readFileSync(file));
 const manifest=JSON.parse(fs.readFileSync(new URL('audio_manifest.json',root))).items||{};
 const before=JSON.stringify(unit);
 repairFoundationPedagogy(unit,language,manifest);
 if(before!==JSON.stringify(unit))fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
 console.log(`${language}: ${before===JSON.stringify(unit)?'sin cambios':'corregido'}`);
}

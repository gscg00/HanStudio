import fs from 'node:fs';
import {A21_TARGETS} from '../course-authoring/a21_content.mjs';
const meaning='alto (altura física)';
let changed=0;
for(const [language,content] of Object.entries(A21_TARGETS)){
  const file=new URL(`../library/courses/${language}/units/a2-1-comparison.json`,import.meta.url);
  const unit=JSON.parse(fs.readFileSync(file,'utf8')),target=content.comparison[6];
  for(const lesson of unit.lessons)for(const a of lesson.activities){
    const before=JSON.stringify(a);
    // Only Spanish-side fields: Italian/Portuguese target and audio are also "alto".
    if(a.type==='select_translation'){
      a.options=a.options.map(option=>option==='alto'?meaning:option);
      if(a.answer==='alto')a.answer=meaning;
      a.explanation=a.explanation.replace('significa «alto»',`significa «${meaning}»`);
    }
    if(a.type==='teach_concept'&&a.target===target&&a.explanation==='alto')a.explanation=meaning;
    if(a.type==='listening_choice'&&a.audio===target)a.explanation=a.explanation.replace(/: alto$/,`: ${meaning}`);
    if(a.type==='open_question'&&a.answer===target){
      a.prompt=a.prompt.replace('«alto»',`«${meaning}»`);
      if(a.target==='alto')a.target=meaning;
    }
    if(JSON.stringify(a)!==before)changed++;
  }
  fs.writeFileSync(file,JSON.stringify(unit,null,2)+'\n');
}
console.log(JSON.stringify({changed}));

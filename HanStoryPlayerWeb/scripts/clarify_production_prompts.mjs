import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const labels={Arabic:'árabe',Chinese:'chino',English:'inglés',French:'francés',German:'alemán',Italian:'italiano',Japanese:'japonés',Korean:'coreano',Portuguese:'portugués',Russian:'ruso'};
const totals={lessons:0,openQuestions:0,dialogueTurns:0};

for(const [language,label] of Object.entries(labels)){
  const courseRoot=path.join(root,'library','courses',language);
  const course=JSON.parse(fs.readFileSync(path.join(courseRoot,'course.json'),'utf8'));
  for(const summary of course.units){
    const unitPath=path.join(courseRoot,summary.manifest);
    const unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));
    let changed=false;
    for(const lesson of unit.lessons||[]){
      if(!lesson.generatedProduction)continue;
      totals.lessons++;
      for(const activity of lesson.activities||[]){
        if(activity.type==='open_question'&&activity.target){
          const prompt=`Di o escribe en ${label}: «${activity.target}»`;
          if(activity.prompt!==prompt){activity.prompt=prompt;changed=true;totals.openQuestions++;}
        }
        if(!['guided_dialogue','stage_scenario'].includes(activity.type))continue;
        let meaning='';
        for(const turn of activity.turns||[]){
          if(turn.role==='model'){
            const match=String(turn.translation||'').match(/«(.+)»/u);
            meaning=match?.[1]||'';
            continue;
          }
          if(turn.role!=='learner'||!meaning)continue;
          const prompt=`Di o escribe en ${label}: «${meaning}»`;
          if(turn.prompt!==prompt){turn.prompt=prompt;changed=true;totals.dialogueTurns++;}
        }
      }
    }
    if(changed)fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');
  }
}

console.log(JSON.stringify(totals,null,2));

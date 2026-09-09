import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=new URL('../library/courses/',import.meta.url);
const languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];

test('cada producción abierta y turno guiado dice qué significado debe expresar',()=>{
  let openQuestions=0,dialogueTurns=0;
  for(const language of languages){
    const courseRoot=new URL(`${language}/`,root),course=JSON.parse(fs.readFileSync(new URL('course.json',courseRoot),'utf8'));
    for(const summary of course.units){
      const unit=JSON.parse(fs.readFileSync(new URL(summary.manifest,courseRoot),'utf8'));
      for(const lesson of unit.lessons||[]){
        if(!lesson.generatedProduction)continue;
        for(const activity of lesson.activities||[]){
          if(activity.type==='open_question'){
            openQuestions++;
            assert.match(activity.prompt,/^Di o escribe en .+: «.+»$/u,activity.id);
            assert.ok(activity.prompt.includes(activity.target),activity.id);
          }
          if(!['guided_dialogue','stage_scenario'].includes(activity.type))continue;
          let meaning='';
          for(const turn of activity.turns||[]){
            if(turn.role==='model')meaning=String(turn.translation||'').match(/«(.+)»/u)?.[1]||'';
            if(turn.role!=='learner')continue;
            dialogueTurns++;
            assert.ok(meaning,activity.id);
            assert.ok(turn.prompt.includes(`«${meaning}»`),activity.id);
          }
        }
      }
    }
  }
  assert.ok(openQuestions>=300);
  assert.ok(dialogueTurns>=700);
});

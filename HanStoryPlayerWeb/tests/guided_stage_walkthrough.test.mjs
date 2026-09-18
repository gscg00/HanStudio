import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  completeGuidedLesson,
  defaultGuidedProgress,
  isGradableActivity,
  lessonStatus,
  unlockCompletedUnitSuccessors,
} from '../src/guided_course_logic.js';
import {evaluateGuidedAnswer} from '../src/guided_course_answers.js';

const languages=['French','German','Korean','Russian'];
const allLanguages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];
const teachingTypes=new Set(['lesson_intro','teach_kana','teach_concept','teach_word','teach_pattern','teach_kanji','dialogue_model']);

function loadCourse(language){
  const root=path.join('library','courses',language);
  const course=JSON.parse(fs.readFileSync(path.join(root,'course.json'),'utf8'));
  const units=course.units.map(summary=>JSON.parse(fs.readFileSync(path.join(root,summary.manifest),'utf8')));
  return {course,units};
}

for(const language of languages){
  test(`${language}: el recorrido completo desbloquea cada etapa en orden`,()=>{
    const {course,units}=loadCourse(language);
    assert.equal(units.length,45,'el curso debe conservar sus siete etapas completas');
    let progress=defaultGuidedProgress({
      id:`walkthrough-${language}`,
      language,
      courseVersion:course.version,
      firstUnit:units[0].id,
      firstLesson:units[0].lessons[0].id,
    });
    const config={
      id:progress.id,language,courseVersion:course.version,
      firstUnit:units[0].id,firstLesson:units[0].lessons[0].id,
      passingScore:85,
    };
    for(const [unitIndex,unit] of units.entries()){
      assert.ok(progress.unlockedUnits.includes(unit.id),`la unidad ${unit.id} debe estar disponible al llegar a ella`);
      for(const [lessonIndex,lesson] of unit.lessons.entries()){
        assert.notEqual(lessonStatus(lesson,lessonIndex,progress),'locked',`${lesson.id} quedó bloqueada durante el recorrido`);
        const graded=(lesson.activities||[]).filter(isGradableActivity);
        assert.ok(graded.length>0,`${lesson.id} debe tener práctica evaluable`);
        assert.ok(graded.every(activity=>String(activity.answer||'').trim()||['guided_dialogue','stage_scenario'].includes(activity.type)),`${lesson.id} tiene una práctica sin respuesta modelada`);
        progress=completeGuidedLesson(progress,unit,lesson,{percentage:100,correct:graded.length,total:graded.length,errors:[],xp:0},config);
      }
      progress=unlockCompletedUnitSuccessors(progress,units);
      if(units[unitIndex+1])assert.ok(progress.unlockedUnits.includes(units[unitIndex+1].id),`terminar ${unit.id} debe abrir ${units[unitIndex+1].id}`);
    }
    assert.equal(progress.completedLessons.length,units.flatMap(unit=>unit.lessons).length);
  });
}

test('el reproductor no inserta una práctica visual ajena a la lección actual',()=>{
  const player=fs.readFileSync(path.join('src','japanese_course_app.js'),'utf8');
  const stylesheet=fs.readFileSync(path.join('assets','japanese_course.css'),'utf8');
  assert.doesNotMatch(player,/mountScriptPrimer|FORMA LA ESCRITURA/);
  assert.doesNotMatch(stylesheet,/jp-script-primer/);
});

test('un alumno puede resolver cada actividad evaluable de los diez cursos con su modelo registrado',()=>{
  let checked=0;
  for(const language of allLanguages){
    const {units}=loadCourse(language);
    for(const unit of units)for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
      if(activity.gradable===false||teachingTypes.has(activity.type))continue;
      const response=['guided_dialogue','stage_scenario'].includes(activity.type)
        ? {responses:(activity.turns||[]).filter(turn=>turn.role==='learner').map(turn=>(turn.accepted_answers||[])[0]||turn.answer||'')}
        : activity.answer??'';
      const evaluation=evaluateGuidedAnswer(activity,response,language);
      assert.ok(evaluation.correct||evaluation.skipped,`${language}/${unit.id}/${lesson.id}/${activity.id} rechaza su modelo`);
      checked++;
    }
  }
  assert.equal(checked,51476);
});

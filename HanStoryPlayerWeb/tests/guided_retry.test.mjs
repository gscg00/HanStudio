import test from 'node:test';
import assert from 'node:assert/strict';
import {retryWithTeaching} from '../src/guided_retry.js';
import {scoreActivities,completeGuidedLesson,defaultGuidedProgress} from '../src/guided_course_logic.js';
test('reintento no cuenta enseñanza y guarda aciertos y total del mismo intento',()=>{
 const config={id:'test',language:'Korean',passingScore:85};
 const a={id:'a',type:'listening_choice',answer:'우',xp:10};
 const lesson={id:'lesson',activities:[{id:'teach',type:'teach_concept',gradable:false},a]},unit={id:'unit',lessons:[lesson]};
 let progress=defaultGuidedProgress(config);
 progress.lessonScores.lesson={percentage:75,correct:3,total:4,xp:30};
 const result=scoreActivities(lesson.activities,{a:'우'},'Korean');
 result.retryOnly=true;
 assert.equal(result.total,1);assert.equal(result.correct,1);
 progress=completeGuidedLesson(progress,unit,lesson,result,config);
 assert.equal(progress.lessonScores.lesson.retryOnly,true);
 assert.equal(progress.lessonScores.lesson.correct,1);assert.equal(progress.lessonScores.lesson.total,1);
 const failed=scoreActivities(lesson.activities,{a:'으'},'Korean');
 progress=completeGuidedLesson(progress,unit,lesson,failed,config);
 assert.equal(progress.lessonScores.lesson.percentage,100);
 assert.equal(progress.lessonScores.lesson.retryOnly,true);
 assert.equal(progress.lessonScores.lesson.correct,1);assert.equal(progress.lessonScores.lesson.total,1);
});
test('reintento presenta enseñanza previa una vez y solo preguntas falladas',()=>{
 const teach={id:'t',type:'teach_concept',gradable:false};
 const a={id:'a',type:'listening_choice',teaching_refs:['t']};
 const b={id:'b',type:'listening_choice',teaching_refs:['t']};
 const lesson={activities:[teach,a,{id:'passed'},b]};
 assert.deepEqual(retryWithTeaching(lesson,[{activity:a},{activity:b}]),[teach,a,b]);
});
test('reintento no incorpora enseñanza futura ni referencias parcialmente inválidas',()=>{
 const teach={id:'t',type:'teach_concept'};
 const a={id:'a',teaching_refs:['t']};
 assert.deepEqual(retryWithTeaching({activities:[a,teach]},[{activity:a}]),[a]);
 const b={id:'b',teaching_refs:['t','missing']};
 assert.deepEqual(retryWithTeaching({activities:[teach,b]},[{activity:b}]),[b]);
});

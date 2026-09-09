import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Arabic/units/reading-foundations.json',import.meta.url)));
const activities=unit.lessons.flatMap(lesson=>lesson.activities||[]);

test('sukun y shadda no se presentan como si tuvieran un audio aislado',()=>{
 for(const id of ['arabic-reading-00-11-b-teach','arabic-reading-foundations-production-dictation','arabic-reading-foundations-production-complete']){
  const activity=activities.find(item=>item.id===id);
  assert.equal(activity.audio,'',id);
  assert.equal(activity.slow_audio,'',id);
 }
 const complete=activities.find(item=>item.id==='arabic-reading-foundations-production-complete');
 assert.doesNotMatch(complete.prompt,/escucha/i);
 assert.match(complete.instruction,/no se escuchan aislados/i);
});

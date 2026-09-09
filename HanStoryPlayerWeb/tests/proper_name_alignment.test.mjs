import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=new URL('../library/courses/',import.meta.url);
test('Anna no se presenta al alumno como Ana en la traducción',()=>{
  let checked=0;
  for(const language of ['French','German','Italian']){
    const courseRoot=new URL(`${language}/`,root),course=JSON.parse(fs.readFileSync(new URL('course.json',courseRoot),'utf8'));
    for(const summary of course.units){
      const unit=JSON.parse(fs.readFileSync(new URL(summary.manifest,courseRoot),'utf8'));
      for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
        const text=JSON.stringify(activity);if(!text.includes('Anna'))continue;checked++;
        assert.ok(!text.includes('Me llamo Ana'),activity.id);
      }
    }
  }
  assert.ok(checked>0);
});

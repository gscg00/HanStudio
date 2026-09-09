import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=new URL('../library/courses/Portuguese/',import.meta.url),course=JSON.parse(fs.readFileSync(new URL('course.json',root),'utf8'));
const forms=['ônibus','autocarro','trem','comboio','banheiro','casa de banho','celular'];

test('el curso declara y etiqueta sus variantes portuguesa y brasileña',()=>{
  assert.equal(course.variantPolicy.scope,'Portugal y Brasil');
  assert.match(course.tagline,/Portugal y Brasil/);
  const seen=new Set();
  for(const summary of course.units){
    const unit=JSON.parse(fs.readFileSync(new URL(summary.manifest,root),'utf8'));
    for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
      if(!activity.type?.startsWith('teach_'))continue;
      const target=String(activity.target||'').toLocaleLowerCase();
      for(const form of forms)if(target.includes(form)){
        seen.add(form);assert.match(activity.usage_note||'',/Brasil|Portugal/,activity.id);
      }
    }
  }
  assert.deepEqual([...seen].sort(),forms.sort());
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const unit=JSON.parse(fs.readFileSync(new URL('../library/courses/Korean/units/essentials.json',import.meta.url)));
const notes={
  '은/는':['consonante','vocal'],
  '이/가':['consonante','vocal'],
  '을/를':['consonante','vocal'],
  '이에요/예요':['consonante','vocal'],
  '있어요/없어요':['afirma','niega'],
};

test('las partículas coreanas explican cuándo elegir cada variante',()=>{
  const activities=unit.lessons.flatMap(lesson=>lesson.activities||[]);
  for(const [form,needles] of Object.entries(notes)){
    const matches=activities.filter(activity=>String(activity.target||activity.answer||'').trim()===form);
    assert.ok(matches.length>=2,`faltan actividades para ${form}`);
    for(const needle of needles)assert.ok(matches.some(activity=>String(activity.explanation||'').toLocaleLowerCase().includes(needle)),`${form}: falta «${needle}»`);
  }
});

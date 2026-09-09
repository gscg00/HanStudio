import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=new URL('../library/courses/',import.meta.url),languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];

test('altura explícita en español sin modificar objetivos ni dictados',async()=>{
  const {A21_TARGETS,A21_THEMES}=await import('../course-authoring/a21_content.mjs');
  const meaning='alto (altura física)';
  assert.equal(A21_THEMES.find(theme=>theme.id==='comparison').meanings[6],meaning);
  for(const language of languages){
    const unit=JSON.parse(fs.readFileSync(new URL(`${language}/units/a2-1-comparison.json`,root),'utf8'));
    const activities=unit.lessons.flatMap(lesson=>lesson.activities),target=A21_TARGETS[language].comparison[6];
    const teach=activities.find(a=>a.type==='teach_concept'&&a.target===target);
    assert.equal(teach.explanation,meaning);assert.equal(teach.audio,target);
    const open=activities.find(a=>a.type==='open_question'&&a.answer===target);
    assert.ok(open.prompt.includes(`«${meaning}»`));assert.equal(open.target,meaning);assert.equal(open.audio,target);
    for(const a of activities.filter(a=>a.type==='select_translation')){
      assert.ok(!a.options.includes('alto'));
      if(a.target===target)assert.equal(a.answer,meaning);
    }
    for(const a of activities.filter(a=>a.type==='listening_choice'&&a.audio===target))assert.equal(a.answer,target);
  }
});

test('la recomendación concuerda con los modelos masculinos y mañana identifica el sentido',()=>{
  for(const language of languages){
    for(const filename of ['b1-1-media.json','b1-2-nuance.json']){
      const text=fs.readFileSync(new URL(`${language}/units/${filename}`,root),'utf8');
      assert.ok(!text.includes('La recomiendo porque los personajes parecen reales.'),`${language}/${filename}`);
      assert.ok(text.includes('Lo recomiendo porque los personajes parecen reales.'),`${language}/${filename}`);
    }
    const routine=fs.readFileSync(new URL(`${language}/units/a1-1-routine.json`,root),'utf8');
    assert.ok(!routine.includes('«mañana»'),language);
    assert.ok(routine.includes('la mañana (parte del día)'),language);
  }
});

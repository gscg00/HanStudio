import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const languages=['Arabic','Chinese','English','French','German','Italian','Japanese','Korean','Portuguese','Russian'];

test('las opciones iniciales no revelan siempre la respuesta por posición',()=>{
  for(const language of languages){
    const unitName=language==='Korean'?'hangul-foundations':'reading-foundations';
    const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${unitName}.json`,import.meta.url),'utf8'));
    const questions=unit.lessons[0].activities.filter(activity=>['listening_choice','select_translation'].includes(activity.type));
    assert.ok(questions.length>=2,language);
    const positions=questions.map(activity=>activity.options.indexOf(activity.answer));
    assert.ok(positions.every(position=>position>=0),`${language}: respuesta ausente`);
    assert.ok(new Set(positions).size>1,`${language}: posición fija ${positions}`);
    assert.ok(questions.every(activity=>activity.option_order_version===3),`${language}: orden antiguo`);
  }
});

test('las tres posiciones se utilizan a lo largo de cada fundamento',()=>{
  for(const language of languages){
    const unitName=language==='Korean'?'hangul-foundations':'reading-foundations';
    const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/${unitName}.json`,import.meta.url),'utf8'));
    const positions=unit.lessons.flatMap(lesson=>lesson.activities).filter(activity=>
      ['listening_choice','select_translation'].includes(activity.type)&&activity.options?.length===3,
    ).map(activity=>activity.options.indexOf(activity.answer));
    assert.deepEqual([...new Set(positions)].sort(),[0,1,2],language);
  }
});

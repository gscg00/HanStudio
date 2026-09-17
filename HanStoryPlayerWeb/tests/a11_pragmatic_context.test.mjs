import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const courseRoot=path.join('library','courses');
const reviewed=[
  ['French','a1-1-identity.json','bonsoir','Se usa para saludar'],
  ['German','a1-1-identity.json','Guten Abend','Es un saludo'],
  ['Russian','a1-1-identity.json','добрый вечер','Es un saludo'],
  ['Korean','a1-1-identity.json','좋은 저녁이에요','No es el saludo cotidiano habitual'],
  ['Korean','a1-1-identity.json','안녕히 가세요','la otra persona se va'],
  ['Korean','a1-1-people.json','이 사람들은 제 가족이에요.','varias personas'],
  ['Russian','a1-1-people.json','мать','«мама»'],
  ['Russian','a1-1-people.json','отец','«папа»'],
];

for(const [language,file,target,note] of reviewed){
  test(`${language}: ${target} conserva su contexto pragmático`,()=>{
    const unit=JSON.parse(fs.readFileSync(path.join(courseRoot,language,'units',file),'utf8'));
    const activities=unit.lessons.flatMap(lesson=>lesson.activities||[]).filter(activity=>activity.target===target);
    assert.equal(activities.length,4,'cada forma debe aparecer en enseñanza, repaso y prueba');
    assert.ok(activities.every(activity=>String(activity.usage_note||'').includes(note)), 'falta la explicación de uso');
  });
}

test('Francés inicial enseña bonjour, no el regional bon matin',()=>{
  const unit=JSON.parse(fs.readFileSync(path.join(courseRoot,'French','units','a1-1-identity.json'),'utf8'));
  const targets=unit.lessons.flatMap(lesson=>lesson.activities||[]).map(activity=>activity.target);
  assert.ok(targets.includes('bonjour'));
  assert.ok(!targets.includes('bon matin'));
});

test('Las traducciones revisadas mantienen número y nombre propio',()=>{
  const korean=JSON.parse(fs.readFileSync(path.join(courseRoot,'Korean','units','a1-1-people.json'),'utf8'));
  const russian=JSON.parse(fs.readFileSync(path.join(courseRoot,'Russian','units','a1-1-identity.json'),'utf8'));
  assert.ok(korean.lessons.flatMap(lesson=>lesson.activities||[]).filter(activity=>activity.target==='이 사람들은 제 가족이에요.').every(activity=>activity.answer!=='Esta es mi familia.'));
  assert.ok(russian.lessons.flatMap(lesson=>lesson.activities||[]).filter(activity=>activity.target==='Меня зовут Анна.').every(activity=>activity.answer!=='Me llamo Ana.'));
});

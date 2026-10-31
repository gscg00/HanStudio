import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import{CLASS_PLAN,allClassSpecs,resolveClass,planNextLesson,unitInventory,LATIN_SCRIPT}from'../src/class_plan.js';
import{CLASS_RULES,CLASS_NUMBERS}from'../src/data/class_rules.js';

const LANGUAGES=['English','French','German','Italian','Portuguese','Japanese','Korean','Russian','Chinese','Arabic'];
const load=language=>{const course=JSON.parse(fs.readFileSync(`library/courses/${language}/course.json`,'utf8'));return course.units.map(unit=>{const path=`library/courses/${language}/units/${unit.id}.json`;return fs.existsSync(path)?{...JSON.parse(fs.readFileSync(path,'utf8')),id:unit.id,title:unit.title,description:unit.description}:null;}).filter(Boolean);};

for(const language of LANGUAGES)test(`${language}: cada clase tiene objetivo, material y regla`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units);
  assert.equal(CLASS_RULES[language].length,CLASS_PLAN.length);
  assert.equal(CLASS_NUMBERS[language].length,10);
  assert.ok(specs.length>=100,`solo ${specs.length} clases`);
  const seen=new Set();
  for(const spec of specs){
    const resolved=resolveClass(spec,units,language);
    assert.ok(resolved.goal,spec.id);
    assert.ok(resolved.items.length>=2,`${spec.id}: ${resolved.items.length}`);
    if(!spec.resolved){
      assert.equal(resolved.items.length,spec.numbers?10:spec.items.length,spec.id);
      assert.ok(resolved.rule,spec.id);
      assert.ok(resolved.task,spec.id);
      assert.equal(resolved.lines.length,spec.dialogue.length,spec.id);
    }
    // Comprensible: el diálogo solo usa lo de hoy o lo ya enseñado.
    resolved.items.forEach(item=>seen.add(item.target));
    for(const line of resolved.lines)assert.ok(seen.has(line.target),`${spec.id}: «${line.target}» aún no se enseñó`);
    for(const pair of resolved.replies)for(const item of[pair.asked,pair.answer])assert.ok(seen.has(item.target),`${spec.id}: «${item.target}» aún no se enseñó`);
  }
});

test('las palabras de ejemplo de las letras no son vocabulario de una clase',()=>{
  const ordered=load('German'),units=new Map(ordered.map(unit=>[unit.id,unit]));
  const targets=allClassSpecs(units).flatMap(spec=>resolveClass(spec,units,'German').items.map(item=>item.target));
  for(const word of['Bach','Bär','Dienstag'])assert.ok(!targets.includes(word),word);
});

test('alfabeto latino empieza a comunicarse el día 1; los demás leen primero',()=>{
  const french=planNextLesson(load('French'),{language:'French'});
  assert.equal(french.mode,'class');assert.equal(french.class.id,'c01');assert.equal(french.lessons.length,0);
  const korean=planNextLesson(load('Korean'),{language:'Korean'});
  assert.equal(korean.mode,'reading');assert.ok(korean.lessons.length<=3);
  assert.ok(LATIN_SCRIPT.has('German')&&!LATIN_SCRIPT.has('Russian'));
});

test('al terminar una clase sigue la siguiente del plan',()=>{
  const ordered=load('German');
  const state={classes:[{classId:'c01',completedDate:'2026-01-01',items:[]}]};
  assert.equal(planNextLesson(ordered,{language:'German',state}).class.id,'c02');
});

test('el inventario conserva el orden compartido entre idiomas',()=>{
  for(const language of LANGUAGES)assert.equal(unitInventory(new Map(load(language).map(unit=>[unit.id,unit])).get('a1-1-identity')).length,16,language);
});

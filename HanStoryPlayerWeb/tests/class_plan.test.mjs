import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import{CLASS_PLAN,COURSE_DAYS,allClassSpecs,resolveClass,planNextLesson,planProgress,unitInventory,LATIN_SCRIPT}from'../src/class_plan.js';
import{CLASS_RULES,CLASS_NUMBERS}from'../src/data/class_rules.js';
import{UNIT_RULES,UNIT_RULE_KEYS}from'../src/data/unit_rules.js';
import{classReviewItems,recallChoice}from'../src/daily_class.js';

const LANGUAGES=['English','French','German','Italian','Portuguese','Japanese','Korean','Russian','Chinese','Arabic'];
const load=language=>{const course=JSON.parse(fs.readFileSync(`library/courses/${language}/course.json`,'utf8'));return course.units.map(unit=>{const path=`library/courses/${language}/units/${unit.id}.json`;return fs.existsSync(path)?{...JSON.parse(fs.readFileSync(path,'utf8')),id:unit.id,title:unit.title,description:unit.description}:null;}).filter(Boolean);};

for(const language of LANGUAGES)test(`${language}: cada clase tiene objetivo, material y regla`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units);
  assert.equal(CLASS_RULES[language].length,CLASS_PLAN.length);
  assert.equal(CLASS_NUMBERS[language].length,10);
  assert.ok(specs.length>=90,`solo ${specs.length} clases`);
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

for(const language of LANGUAGES)test(`${language}: el plan cabe en cuatro meses, no repite material y enseña gramática`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language}),seen=new Set();
  assert.ok(planProgress(ordered,{language}).remaining<=COURSE_DAYS,`${planProgress(ordered,{language}).remaining} días`);
  for(const spec of specs.filter(item=>item.resolved)){
    assert.ok(spec.resolved.length>=3,`${spec.id}: ${spec.resolved.length}`);
    for(const item of spec.resolved){assert.ok(!seen.has(item.target),`${spec.id}: «${item.target}» se repite`);seen.add(item.target);}
  }
  assert.equal(UNIT_RULES[language].length,UNIT_RULE_KEYS.length);
  for(const unit of UNIT_RULE_KEYS)assert.ok(specs.find(spec=>spec.module===unit)?.rule,`${unit} sin explicación`);
  for(const spec of specs)if(spec.production)assert.ok(units.get(spec.production.unitId).lessons.some(lesson=>lesson.id===spec.production.lessonId));
  assert.ok(specs.filter(spec=>spec.level==='B1').length>=10);
});

test('el repaso no deja fuera lo antiguo aunque lo reciente llene la lista',()=>{
  const classes=Array.from({length:40},(_,index)=>({number:index+1,completedDate:'2026-01-01',items:Array.from({length:10},(__,item)=>({target:`c${index+1}-${item}`}))}));
  const review=classReviewItems({classes},{limit:21}).map(item=>item.target);
  for(const number of[40,38,34,27,11])assert.ok(review.some(target=>target.startsWith(`c${number}-`)),`clase ${number}`);
});

test('las opciones falsas cambian de una pregunta a otra',()=>{
  const pool=Array.from({length:30},(_,index)=>({target:`w${index}`,meaning:`m${index}`,audio:'',slowAudio:''}));
  const wrong=new Set(pool.slice(0,8).flatMap(item=>recallChoice(item,pool,'seed').options.filter(option=>option!==item.target)));
  assert.ok(wrong.size>8,`solo ${wrong.size} opciones falsas distintas`);
});

test('las palabras de ejemplo de las letras no son vocabulario de una clase',()=>{
  const ordered=load('German'),units=new Map(ordered.map(unit=>[unit.id,unit]));
  const targets=allClassSpecs(units).flatMap(spec=>resolveClass(spec,units,'German').items.map(item=>item.target));
  for(const word of['Bach','Bär'])assert.ok(!targets.includes(word),word);
  // Los días sí se enseñan, pero juntos y en su tema, no como ejemplo de una letra.
  const days=allClassSpecs(units).find(spec=>spec.resolved?.some(item=>/Dienstag/.test(item.target)));
  assert.equal(days?.module,'tiempo');
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

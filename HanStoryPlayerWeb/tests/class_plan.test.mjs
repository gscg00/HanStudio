import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import{CLASS_PLAN,COURSE_DAYS,WEEK_CLASSES,allClassSpecs,doneClassIds,resolveClass,planNextLesson,planProgress,unitInventory,LATIN_SCRIPT}from'../src/class_plan.js';
import{CLASS_RULES,CLASS_NUMBERS}from'../src/data/class_rules.js';
import{UNIT_RULES,UNIT_RULE_KEYS}from'../src/data/unit_rules.js';
import{searchNotebook}from'../src/notebook.js';
import{evaluateGuidedAnswer}from'../src/guided_course_answers.js';
import{ADVANCED_CLASSES}from'../src/data/advanced_classes.js';
import{RECAP_STYLES,styleIndexForDay}from'../src/recap/styles/index.js';
import{nextFps}from'../src/recap/recap_pace.js';
import{EXAM_PASS,REVIEW_INTERVALS,buildExamSet,buildRecapRules,buildTextChecks,classReviewItems,recallChoice,recordReview,roleplayScript}from'../src/daily_class.js';

const LANGUAGES=['English','French','German','Italian','Portuguese','Japanese','Korean','Russian','Chinese','Arabic'];
const load=language=>{const course=JSON.parse(fs.readFileSync(`library/courses/${language}/course.json`,'utf8'));return course.units.map(unit=>{const path=`library/courses/${language}/units/${unit.id}.json`;return fs.existsSync(path)?{...JSON.parse(fs.readFileSync(path,'utf8')),id:unit.id,title:unit.title,description:unit.description}:null;}).filter(Boolean);};

for(const language of LANGUAGES)test(`${language}: cada clase tiene objetivo, material y regla`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units);
  assert.equal(CLASS_RULES[language].length,CLASS_PLAN.length);
  assert.equal(CLASS_NUMBERS[language].length,10);
  assert.ok(specs.length>=90,`solo ${specs.length} clases`);
  const seen=new Set();
  for(const spec of specs.filter(item=>!item.kind)){
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

for(const language of LANGUAGES)test(`${language}: el plan cabe en seis meses, no repite material y enseña gramática`,()=>{
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

for(const language of LANGUAGES)test(`${language}: cada semana tiene repaso y cada nivel su prueba`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language});
  let run=0;
  for(const spec of specs){
    run=spec.kind?0:run+1;
    assert.ok(run<=WEEK_CLASSES,`${spec.id}: ${run} clases seguidas sin repaso`);
    if(spec.kind){const review=resolveClass(spec,units,language);assert.ok(review.items.length>=3,spec.id);}
    assert.ok(!(spec.level==='B1'&&/^(Palabras frecuentes|Lee y entiende)/.test(spec.title)),`${spec.id}: material básico marcado B1`);
  }
  const exams=specs.filter(spec=>spec.kind==='exam').map(spec=>spec.level);
  assert.deepEqual(exams,[...new Set(specs.filter(spec=>!spec.kind).map(spec=>spec.level))]);
  assert.equal(new Set(specs.map(spec=>spec.id)).size,specs.length);
});

test('el repaso y la prueba no aparecen en el cuaderno ni cuentan como vocabulario nuevo',()=>{
  const ordered=load('English'),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language:'English'}),exam=specs.find(spec=>spec.kind==='exam'),resolved=resolveClass(exam,units,'English'),seen=new Set(specs.filter(spec=>!spec.kind&&spec.level===exam.level).flatMap(spec=>resolveClass(spec,units,'English').items.map(item=>item.target)));
  assert.equal(resolved.items.length,30);
  for(const item of resolved.items)assert.ok(seen.has(item.target),item.target);
  assert.equal(buildExamSet(resolved.items,resolved.items,{seed:'x',language:'English',typing:'inglés'}).length,30);
  assert.equal(buildRecapRules(['a','b'],'x').length,2);
});

test('una prueba suspendida se repite',()=>{
  assert.equal(EXAM_PASS,70);
  assert.equal(doneClassIds({classes:[{classId:'prueba-A1',completedDate:'2026-01-01',retake:true}]}).size,0);
  assert.equal(doneClassIds({classes:[{classId:'prueba-A1',completedDate:'2026-01-02'}]}).size,1);
});

test('inglés llega a B2 dentro de los 180 días',()=>{
  const ordered=load('English'),specs=allClassSpecs(new Map(ordered.map(unit=>[unit.id,unit])),{language:'English'});
  assert.ok(specs.length<=COURSE_DAYS,`${specs.length}`);
  assert.equal(specs.at(-1).id,'prueba-B2');
  assert.equal(specs.filter(spec=>spec.level==='B2'&&!spec.kind).length,20);
});

for(const spec of ADVANCED_CLASSES.English)test(`inglés ${spec.id}: clase completa y sus respuestas se aceptan`,()=>{
  assert.ok(spec.goal&&spec.rule.length>120&&spec.write.prompt&&spec.write.model);
  assert.ok(spec.items.length>=8);
  assert.ok(spec.text.length>=5);
  for(const[target,meaning]of[...spec.items,...spec.text])assert.ok(target&&meaning,target);
  for(const[,answer,...others]of spec.questions)assert.ok(others.length>=2&&!others.includes(answer));
  const checks=buildTextChecks(spec,'t');
  assert.equal(checks.length,spec.questions.length+spec.drills.length);
  for(const check of checks.filter(item=>item.dailyKind==='drill'))for(const answer of check.accepted_answers)assert.ok(evaluateGuidedAnswer(check,answer,'English').correct,`${check.prompt}: ${answer}`);
});

test('lo nuevo vuelve al día siguiente y cada acierto lo aleja',()=>{
  const items=[{target:'a'},{target:'b'}];
  let state={classes:[{number:1,completedDate:'2026-01-01',items}]};
  assert.equal(classReviewItems(state,{now:new Date('2026-01-01T12:00:00')}).length,0);
  assert.equal(classReviewItems(state,{now:new Date('2026-01-02T12:00:00')}).length,2);
  state=recordReview(state,{reviewed:['a','b']},new Date('2026-01-02T12:00:00'));
  assert.equal(state.memory.a.box,1);
  assert.equal(state.memory.a.due,'2026-01-08');
  assert.equal(REVIEW_INTERVALS[1],6);
  assert.equal(classReviewItems(state,{now:new Date('2026-01-07T12:00:00')}).length,0);
});

test('lo que se falla en un repaso vuelve mañana y antes que lo atrasado',()=>{
  const old=Array.from({length:40},(_,index)=>({target:`w${index}`}));
  let state={classes:[{number:1,completedDate:'2026-01-01',items:old}],memory:{w39:{box:3,due:'2026-03-01'}}};
  state=recordReview(state,{reviewed:['w39'],failed:['w39']},new Date('2026-03-01T12:00:00'));
  assert.equal(state.memory.w39.box,1);
  const review=classReviewItems(state,{limit:5,now:new Date('2026-03-02T12:00:00')});
  assert.equal(review[0].target,'w39');
  assert.equal(review.length,5);
  state=recordReview(state,{reviewed:['w39']},new Date('2026-03-02T12:00:00'));
  assert.ok(!state.memory.w39.failed);
});

test('saltarse días no pierde el repaso',()=>{
  const state={classes:[{number:1,completedDate:'2026-01-01',items:[{target:'a'}]}]};
  assert.equal(classReviewItems(state,{now:new Date('2026-04-01T12:00:00')}).length,1);
});

test('el juego de papeles te da líneas propias y solo si hay diálogo',()=>{
  const line=speaker=>({speaker,target:'x',meaning:'y'});
  const script=roleplayScript([line('Ana'),line('Leo'),line('Ana'),line('Leo')]);
  assert.equal(script.role,'Leo');
  assert.equal(script.turns.filter(turn=>turn.mine).length,2);
  assert.equal(roleplayScript([{target:'x',meaning:'y'}]),null);
  assert.equal(roleplayScript([line('Ana'),line('Leo')]),null);
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

test('el video baja de cuadros cuando el aparato no llega y no se queda a cero',()=>{
  assert.equal(nextFps(30,33),30);
  assert.equal(nextFps(30,60),24);
  assert.equal(nextFps(24,70),15);
  assert.equal(nextFps(15,200),15);
});

test('el cuaderno encuentra en los dos idiomas y prefiere lo que ya viste',()=>{
  const classes=[{title:'A',rule:'',seen:false,items:[{target:'Bonjour',meaning:'Hola'},{target:'Merci',meaning:'Gracias'}]},{title:'B',rule:'El verbo être cambia.',seen:true,items:[{target:'Salut',meaning:'Hola, informal'}]}];
  assert.deepEqual(searchNotebook(classes,'hola').items.map(item=>item.target),['Salut','Bonjour']);
  assert.equal(searchNotebook(classes,'MERCI').items[0].meaning,'Gracias');
  assert.equal(searchNotebook(classes,'etre').rules[0].title,'B');
  assert.equal(searchNotebook(classes,'  ').items.length,0);
});

test('los estilos de video pesados no salen en la rotación',()=>{
  for(let day=1;day<=60;day++)assert.ok(!RECAP_STYLES[styleIndexForDay(new Date(2026,0,day),'french')].heavy);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import{registerComics,unplacedScenes,COMIC_COVERAGE,comicCoverage,CLASS_PLAN,COURSE_DAYS,WEEK_CLASSES,placementSample,allClassSpecs,doneClassIds,resolveClass,planNextLesson,planProgress,unitInventory,LATIN_SCRIPT}from'../src/class_plan.js';
import{CLASS_RULES,CLASS_NUMBERS}from'../src/data/class_rules.js';
import{UNIT_RULES,UNIT_RULE_KEYS}from'../src/data/unit_rules.js';
import{searchNotebook}from'../src/notebook.js';
import{STORY_EVERY,nextStory,BOOK_PATH,bookLessons,dailyWords,deepLines,outputPrompts,recycledLines,studyDose}from'../src/study_plan.js';
import{WORD_PACKS}from'../src/data/word_packs.js';
import{LONG_READINGS}from'../src/data/long_readings.js';
import{evaluateGuidedAnswer}from'../src/guided_course_answers.js';
import{ADVANCED_CLASSES}from'../src/data/advanced_classes.js';
import{RECAP_STYLES,styleIndexForDay}from'../src/recap/styles/index.js';
import{nextFps}from'../src/recap/recap_pace.js';
import{buildComicAnalysis,placementLevel,EXAM_PASS,REVIEW_INTERVALS,buildExamSet,buildRecapRules,buildTextChecks,classReviewItems,recallChoice,recordReview,roleplayScript}from'../src/daily_class.js';

// Las escenas de cómic se registran como lo hace la página al abrir cada idioma.
for(const language of['French','German','Korean','English'])registerComics(language,(await import(`../src/data/comics/${language}.js`)).COMIC_SCENES);

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

for(const[language,classes]of Object.entries(ADVANCED_CLASSES))for(const spec of classes)test(`${language} ${spec.id}: clase completa y sus respuestas se aceptan`,()=>{
  assert.ok(spec.goal&&spec.rule.length>120&&spec.write.prompt&&spec.write.model);
  assert.ok(spec.items.length>=7);
  assert.ok(spec.text.length>=5);
  for(const[target,meaning]of[...spec.items,...spec.text])assert.ok(target&&meaning,target);
  for(const[,answer,...others]of spec.questions)assert.ok(others.length>=2&&!others.includes(answer));
  const checks=buildTextChecks(spec,'t');
  assert.equal(checks.length,spec.questions.length+spec.drills.length);
  for(const check of checks.filter(item=>item.dailyKind==='drill'))for(const answer of check.accepted_answers)assert.ok(evaluateGuidedAnswer(check,answer,language).correct,`${check.prompt}: ${answer}`);
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

test('la dosis sigue la prioridad: dos horas en tres idiomas y una en los demás',()=>{
  for(const language of['German','French','Korean'])assert.equal(studyDose(language).minutes,120);
  for(const language of['English','Italian','Japanese','Arabic'])assert.equal(studyDose(language).minutes,60);
});

for(const language of['German','French','Korean'])test(`${language}: los libros dan frases y palabras con su grabación`,()=>{
  for(const code of BOOK_PATH[language]){
    const lessons=bookLessons(JSON.parse(fs.readFileSync(`library/books/${code}/hanstory_manifest.json`,'utf8')),code);
    assert.ok(lessons.length>=9,`${code}: ${lessons.length}`);
    for(const lesson of lessons)for(const line of lesson.lines){
      assert.ok(line.target&&line.meaning,code);
      if(line.file)assert.ok(fs.existsSync(`library/books/${code}/${line.file.split(`${code}/`)[1]}`),line.file);
    }
  }
  assert.ok(WORD_PACKS[language].length>=800);
});

test('las palabras del día no repiten lo aprendido y respetan el cupo',()=>{
  const state={classes:[{items:[{target:'Haus'}],words:[{target:'Baum'}]}]},make=target=>({target});
  assert.deepEqual(dailyWords(state,{bookWords:[make('Haus'),make('Auto')],pack:[make('Baum'),make('Tisch'),make('Stuhl')],limit:2}).map(item=>item.target),['Auto','Tisch']);
});

test('sin libro, el bloque de lectura reutiliza frases ya vistas',()=>{
  const items=[{target:'uno dos'},{target:'tres cuatro'},{target:'sola'}];
  assert.deepEqual(recycledLines({classes:[{items}]},{count:4}).map(line=>line.target).sort(),['tres cuatro','uno dos']);
  assert.deepEqual(recycledLines({classes:[]}),[]);
});

test('lo escrito y lo hablado cambian con el nivel y el día',()=>{
  assert.notEqual(outputPrompts('A1',0).write,outputPrompts('A1',1).write);
  assert.notEqual(outputPrompts('A1',0).write,outputPrompts('B1+',0).write);
  assert.ok(outputPrompts('B2',3).speak);
});

test('las palabras de la lectura vuelven en el repaso',()=>{
  const state={classes:[{completedDate:'2026-01-01',items:[],words:[{target:'Baum'}]}]};
  assert.deepEqual(classReviewItems(state,{now:new Date('2026-01-02T12:00:00')}).map(item=>item.target),['Baum']);
});

test('la escucha profunda junta los textos recientes sin repetir',()=>{
  const line=target=>({target}),state={classes:[{book:{lines:[line('a'),line('b')]}},{book:{lines:[line('b'),line('c')]}},{}]};
  assert.deepEqual(deepLines(state).map(item=>item.target),['a','b','c']);
});

for(const[language,stories]of Object.entries(LONG_READINGS))test(`${language}: lecturas largas completas y en orden de dificultad`,()=>{
  const order=['A2','B1','B1+'];let last=0;
  assert.ok(stories.length>=24);
  assert.equal(new Set(stories.map(story=>story.id)).size,stories.length);
  for(const story of stories){
    const rank=order.indexOf(story.level);
    assert.ok(rank>=last,story.id);last=rank;
    assert.ok(story.text.length>=10,story.id);
    for(const[target,meaning]of story.text)assert.ok(target&&meaning,story.id);
    assert.equal(story.questions.length,3,story.id);
    for(const[,answer,...others]of story.questions)assert.ok(others.length>=2&&!others.includes(answer),story.id);
  }
});

test('la lectura larga empieza en A2 y llega cada pocas clases',()=>{
  assert.equal(nextStory({classes:[]},'German','A1'),null);
  const first=nextStory({classes:[]},'German','A2');
  assert.equal(first.id,'de-l01');
  assert.equal(nextStory({classes:[{level:'A2',longread:first}]},'German','A2'),null);
  const later=nextStory({classes:[{level:'A2',longread:first},...Array.from({length:STORY_EVERY},()=>({level:'A2'}))]},'German','A2');
  assert.equal(later.id,'de-l02');
  assert.equal(nextStory({classes:[]},'Italian','A2'),null);
});

for(const language of['German','French','Korean','Italian'])test(`${language}: la prueba de nivel cubre cada nivel del plan`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),sample=placementSample(units,language);
  assert.deepEqual(sample.map(part=>part.level),[...new Set(allClassSpecs(units,{language}).filter(spec=>!spec.kind).map(spec=>spec.level))]);
  for(const part of sample)assert.equal(part.items.length,6,part.level);
});

test('el nivel estimado es el último aprobado sin saltarse ninguno',()=>{
  assert.equal(placementLevel([{level:'A1',percentage:90},{level:'A2',percentage:75},{level:'B1',percentage:40}]),'A2');
  assert.equal(placementLevel([{level:'A1',percentage:50},{level:'A2',percentage:90}]),'');
  assert.equal(placementLevel([{level:'A1',percentage:100},{level:'A2',percentage:50},{level:'B1',percentage:100}]),'A1');
});

for(const language of['French','German','Korean'])test(`${language}: las clases de «Lengua real» llegan cuando ya conoces el tema`,()=>{
  const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language}),comics=specs.filter(spec=>spec.comic);
  assert.ok(comics.length>=8,`${comics.length}`);
  const placed=new Set(comics.map(spec=>spec.id));
  assert.ok(unplacedScenes(units,language).every(scene=>!placed.has(scene.id)));
  assert.ok(planProgress(ordered,{language}).remaining<=COURSE_DAYS);
  const notes=JSON.parse(fs.readFileSync(`library/comic_notes/${language}.json`,'utf8'));
  let last=-10;
  specs.forEach((spec,index)=>{
    if(!spec.comic)return;
    assert.notEqual(spec.level,'A1',spec.id);
    assert.ok(index-last>=5,`${spec.id}: dos escenas en la misma semana`);last=index;
    assert.ok(spec.resolved.length>=8,spec.id);
    if(spec.comicKind==='hanja')assert.ok(['B1','B1+','B2'].includes(spec.level),spec.id);
    for(const item of spec.resolved){
      assert.ok(notes[item.target],`${spec.id}: «${item.target}» sin análisis`);
      if(item.file)assert.ok(fs.existsSync(`library/books/${item.file.split('/books/')[1]}`),item.file);
    }
    const cards=buildComicAnalysis(spec.resolved,notes,{seed:'t'});
    assert.ok(cards.every(card=>card.explanation.startsWith('Significa')));
  });
  for(const exam of specs.filter(spec=>spec.kind==='exam'))assert.ok(exam.from.every(spec=>!spec.comic));
});

test('la cobertura cuenta las palabras ya enseñadas',()=>{
  assert.equal(comicCoverage([['Je vais partir demain']],new Set(['vais','partir','demain']),'French'),1);
  assert.equal(comicCoverage([['Je vais partir demain']],new Set(['vais']),'French'),1/3);
  assert.ok(COMIC_COVERAGE>0&&COMIC_COVERAGE<1);
});

// La interfaz no se importa en los tests (usa el DOM): al menos su sintaxis debe ser válida.
test('todos los módulos de la página tienen sintaxis válida',async()=>{
  const{execFileSync}=await import('node:child_process'),os=await import('node:os'),path=await import('node:path');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hs-syntax-'));
  for(const folder of['src','src/data','src/recap','src/recap/styles'])for(const name of fs.readdirSync(folder).filter(file=>file.endsWith('.js'))){
    const copy=path.join(dir,`${folder.replace(/\//g,'_')}_${name.replace(/\.js$/,'.mjs')}`);
    fs.copyFileSync(`${folder}/${name}`,copy);
    assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',copy],{stdio:'pipe'}),`${folder}/${name}`);
  }
  fs.rmSync(dir,{recursive:true,force:true});
});

test('las tarjetas de manga se reparten sin perder ninguna escena',()=>{
  for(const language of['French','German','Korean']){
    const ordered=load(language),units=new Map(ordered.map(unit=>[unit.id,unit])),specs=allClassSpecs(units,{language});
    const scenes=specs.filter(spec=>spec.comic).length+unplacedScenes(units,language).length;
    assert.ok(scenes>=30,`${language}: ${scenes}`);
  }
  const korean=allClassSpecs(new Map(load('Korean').map(unit=>[unit.id,unit])),{language:'Korean'});
  assert.ok(korean.some(spec=>spec.comicKind==='hanja')||unplacedScenes(new Map(load('Korean').map(unit=>[unit.id,unit])),'Korean').some(scene=>scene.kind==='hanja'));
});

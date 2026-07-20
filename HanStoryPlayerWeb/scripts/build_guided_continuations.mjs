#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GUIDED_COURSES} from '../src/guided_course_config.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const courseRoot=path.join(web,'library','courses');
const catalogRows=[];

const item=(target,meaning,audio=target,explanation=meaning)=>({target,meaning,audio,explanation});

// Contenido A1.1 posterior a los fundamentos. Cada frase tiene una intención
// comunicativa clara y una clave de audio independiente del texto visible.
// Esto permite que Chino muestre caracteres sin convertir el pinyin en muleta.
const curriculum={
  English:[
    item('Hello!','¡Hola!'),item('My name is Ana.','Me llamo Ana.'),item('Nice to meet you.','Mucho gusto.'),
    item("What's your name?",'¿Cómo te llamas?'),item('My name is Ethan.','Me llamo Ethan.'),item('Thank you.','Gracias.'),
    item("I'm from Mexico.",'Soy de México.'),item('Where are you from, Ethan?','¿De dónde eres, Ethan?'),item('Do you speak English?','¿Hablas inglés?'),
    item("I don't understand.",'No entiendo.'),item('Could you repeat that?','¿Puedes repetir eso?'),item('Can you help me?','¿Puedes ayudarme?'),
  ],
  French:[
    item('Bonjour !','¡Hola!'),item("Je m'appelle Anna.",'Me llamo Anna.'),item('Merci beaucoup pour votre aide.','Muchas gracias por su ayuda.'),
    item('Comment vous appelez-vous ?','¿Cómo se llama?'),item('Alors, tu t’appelles Jérôme Lafarge.','Entonces, te llamas Jérôme Lafarge.'),item('Quel est votre nom de famille ?','¿Cuál es su apellido?'),
    item('Je viens du Mexique.','Soy de México.'),item('Tu viens d’où ?','¿De dónde eres?'),item('Je parle français.','Hablo francés.'),
    item('Je ne comprends pas.','No entiendo.'),item("Répétez, s'il vous plaît.",'Repita, por favor.'),item('Parlez plus lentement.','Hable más despacio.'),
  ],
  German:[
    item('Hallo!','¡Hola!'),item('Ich heiße Anna.','Me llamo Anna.'),item('danke','gracias'),
    item('Wie heißt du?','¿Cómo te llamas?'),item('Ich heiße Lina Berger.','Me llamo Lina Berger.'),item('Guten Morgen. Wie ist Ihr Familienname?','Buenos días. ¿Cuál es su apellido?'),
    item('Ich komme aus Mexiko.','Soy de México.'),item('Woher kommst du, Lina?','¿De dónde eres, Lina?'),item('Ich trinke Wasser.','Bebo agua.'),
    item('Ich verstehe nicht.','No entiendo.'),item('Bitte wiederholen.','Repita, por favor.'),item('Sprechen Sie langsam.','Hable despacio.'),
  ],
  Italian:[
    item('Ciao!','¡Hola!'),item('Mi chiamo Anna.','Me llamo Anna.'),item('Piacere!','Mucho gusto.'),
    item('Come ti chiami?','¿Cómo te llamas?'),item('nome','nombre'),item('grazie','gracias'),
    item('Sono del Messico.','Soy de México.'),item('Di dove sei?','¿De dónde eres?'),item('Parlo italiano.','Hablo italiano.'),
    item('Non capisco.','No entiendo.'),item('Può ripetere?','¿Puede repetir?'),item('Parli più lentamente.','Hable más despacio.'),
  ],
  Russian:[
    item('Здравствуйте!','¡Hola!'),item('Меня зовут Анна.','Me llamo Anna.'),item('Очень приятно.','Mucho gusto.'),
    item('Как вас зовут?','¿Cómo se llama?'),item('имя','nombre'),item('Спасибо.','Gracias.'),
    item('Я из Мексики.','Soy de México.'),item('Откуда вы?','¿De dónde es usted?'),item('Вы говорите по-английски?','¿Habla inglés?'),
    item('Я не понимаю.','No entiendo.'),item('Повторите, пожалуйста.','Repita, por favor.'),item('Говорите медленнее.','Hable más despacio.'),
  ],
  Chinese:[
    item('你好','¡Hola!','nǐ hǎo','你好 se lee con tercer tono y tercer tono; al hablar, el primero suele cambiar de contorno.'),
    item('我叫安娜。','Me llamo Anna.'),item('很高兴认识你。','Mucho gusto.'),
    item('你叫什么名字？','¿Cómo te llamas?'),item('名字','nombre'),item('谢谢','gracias','xièxie'),
    item('我来自墨西哥。','Soy de México.'),item('你来自哪里？','¿De dónde eres?'),item('你会说英语吗？','¿Hablas inglés?','nǐ huì shuō Yīngyǔ ma'),
    item('我听不懂。','No entiendo lo que oigo.','wǒ tīng bù dǒng'),item('请再说一遍。','Repítalo, por favor.','qǐng zài shuō yí biàn'),item('请说慢一点。','Hable más despacio.','qǐng shuō màn yìdiǎn'),
  ],
  Japanese:[
    item('こんにちは','¡Hola!'),item('わたしは アナです。','Soy Anna.'),item('はじめまして','Mucho gusto.'),
    item('おなまえは なんですか。','¿Cómo se llama?'),item('わたしは アナです','Soy Anna.'),item('よろしくおねがいします。','Encantado; espero llevarme bien contigo.'),
    item('メキシコから きました。','Soy de México.'),item('にほんごが すこし わかります','Entiendo un poco de japonés.'),item('これは いくらですか','¿Cuánto cuesta esto?'),
    item('わかりません','No entiendo.'),item('もういちど おねがいします','Otra vez, por favor.'),item('ゆっくり おねがいします','Despacio, por favor.'),
  ],
  Portuguese:[
    item('Olá!','¡Hola!'),item('Chamo-me Ana.','Me llamo Ana.'),item('Muito prazer.','Mucho gusto.'),
    item('Como se chama?','¿Cómo se llama?'),item('O meu nome é Ana.','Mi nombre es Ana.'),item('Obrigado.','Gracias.'),
    item('Sou do México.','Soy de México.'),item('De onde é?','¿De dónde es?'),item('Fala português?','¿Habla portugués?'),
    item('Não compreendo.','No entiendo.'),item('Pode repetir, por favor?','¿Puede repetir, por favor?'),item('Fale mais devagar, por favor.','Hable más despacio, por favor.'),
  ],
  Arabic:[
    item('مرحبًا.','¡Hola!'),item('اسمي آنا.','Me llamo Anna.'),item('تشرفت بلقائك.','Mucho gusto.'),
    item('ما اسمك؟','¿Cómo te llamas?'),item('اسمي آنا','Mi nombre es Anna.'),item('شكرًا.','Gracias.'),
    item('أنا من المكسيك.','Soy de México.'),item('من أين أنت؟','¿De dónde eres?'),item('هل تتكلم العربية؟','¿Hablas árabe?'),
    item('لا أفهم.','No entiendo.'),item('كرر من فضلك.','Repite, por favor.'),item('تكلم ببطء من فضلك.','Habla despacio, por favor.'),
  ],
};

const slugs={English:'english',French:'french',German:'german',Italian:'italian',Russian:'russian',Chinese:'chinese',Japanese:'japanese',Portuguese:'portuguese',Arabic:'arabic'};
const icons={English:'Me',French:'Moi',German:'Ich',Italian:'Io',Russian:'Я',Chinese:'我',Japanese:'私',Portuguese:'Eu',Arabic:'أنا'};
const lessonTitles=['Saludar y presentarte','Preguntar el nombre','Decir de dónde eres','Pedir ayuda para comprender'];

const base=(id,type,prompt,target='',options=[],answer='',explanation='',audio='',gradable=true)=>({
  id,type,prompt,target,options,answer,explanation,audio,slow_audio:audio,image:null,writing_asset:null,tags:['a1.1','introductions'],xp:gradable?10:2,...(!gradable?{gradable:false}:{})
});
const rotated=(pool,correct,index,key)=>{
  const result=[correct];
  for(let step=1;result.length<3&&step<pool.length+2;step++){
    const candidate=pool[(index+step*5)%pool.length][key];
    if(candidate&&!result.includes(candidate))result.push(candidate);
  }
  return result.sort((a,b)=>(String(a).length+index)%4-(String(b).length+index)%4);
};
const practice=(slug,idPrefix,concept,index,pool,{teach=true}={})=>{
  const id=`${slug}-${idPrefix}-${index+1}`;
  const result=[];
  if(teach)result.push({...base(`${id}-teach`,'teach_concept','Aprende y escucha',concept.target,[],'',concept.explanation,concept.audio,false),sound_hint:concept.meaning});
  result.push(base(`${id}-meaning`,'select_translation',`¿Qué significa «${concept.target}»?`,concept.target,rotated(pool,concept.meaning,index,'meaning'),concept.meaning,concept.explanation,concept.audio));
  result.push(base(`${id}-listen`,'listening_choice','Escucha y elige la frase correcta','',rotated(pool,concept.target,index+2,'target'),concept.target,`La forma escrita correcta es «${concept.target}»: ${concept.meaning}`,concept.audio));
  return result;
};
const normalLesson=(slug,index,concepts,pool)=>{
  const number=String(index+1).padStart(2,'0'),prefix=`a11-introductions-${number}`,id=`${slug}-${prefix}`;
  return{id,title:lessonTitles[index],description:'Aprende tres expresiones y úsalas inmediatamente.',activities:[
    base(`${id}-intro`,'lesson_intro',lessonTitles[index],'',[],'','Primero escucharás y comprenderás cada expresión; después la reconocerás.','',false),
    base(`${id}-dialogue`,'dialogue_model','Escucha la escena modelo',concepts[0].target,[],'',concepts[0].explanation,concepts[0].audio,false),
    ...concepts.flatMap((concept,itemIndex)=>practice(slug,prefix,concept,itemIndex,pool)),
  ]};
};
const reviewLesson=(slug,index,concepts,pool)=>{
  const id=`${slug}-a11-introductions-review-${String(index+1).padStart(2,'0')}`;
  return{id,title:`Repaso breve · ${index?'primer encuentro':'nombre e identidad'}`,description:'Recupera de memoria una selección de lo ya aprendido.',isReview:true,activities:[
    base(`${id}-intro`,'lesson_intro','Repaso acumulativo','',[],'','No aparece contenido nuevo: intenta recordar antes de pedir una pista.','',false),
    ...concepts.flatMap((concept,itemIndex)=>practice(slug,`a11-introductions-review-${String(index+1).padStart(2,'0')}`,concept,itemIndex,pool,{teach:false})),
  ]};
};
const testLesson=(slug,concepts,pool)=>{
  const id=`${slug}-a11-introductions-test`;
  return{id,title:'Prueba · Conocerse y presentarse',description:'Comprueba que reconoces y comprendes las expresiones sin ayuda.',isTest:true,isUnitFinal:true,xpReward:30,activities:[
    base(`${id}-intro`,'lesson_intro','Prueba final A1.1','',[],'','Necesitas al menos 85 % para completar la unidad.','',false),
    ...concepts.flatMap((concept,itemIndex)=>practice(slug,'a11-introductions-test',concept,itemIndex,pool,{teach:false})),
  ]};
};

for(const[language,items]of Object.entries(curriculum)){
  const definition=GUIDED_COURSES[language],slug=slugs[language];
  if(!definition||!slug)throw new Error(`Falta configuración para ${language}`);
  const root=path.join(courseRoot,definition.directory),coursePath=path.join(root,'course.json');
  const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
  const chunks=[items.slice(0,3),items.slice(3,6),items.slice(6,9),items.slice(9,12)];
  const lessons=[
    normalLesson(slug,0,chunks[0],items),normalLesson(slug,1,chunks[1],items),reviewLesson(slug,0,[items[0],items[3],items[4]],items),
    normalLesson(slug,2,chunks[2],items),normalLesson(slug,3,chunks[3],items),reviewLesson(slug,1,[items[1],items[5],items[7],items[10]],items),
    testLesson(slug,[items[0],items[3],items[6],items[8],items[9],items[11]],items),
  ];
  const unit={id:'a1-1-introductions',title:'Conocerse y presentarse',description:'Saluda, di quién eres, pregunta el nombre y origen, y pide ayuda para comprender.',requirements:[],reward:{xp:120,badge:'Primer encuentro A1.1'},lessons};
  const unitPath=path.join(root,'units','a1-1-introductions.json');
  fs.mkdirSync(path.dirname(unitPath),{recursive:true});
  fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');

  const foundationIds=course.units.filter(summary=>summary.id!=='a1-1-introductions').map(summary=>summary.id);
  const summary={id:'a1-1-introductions',world:foundationIds.length+1,mapLabel:'UNIDAD A1.1 · 1',title:'Conocerse y presentarse',description:unit.description,manifest:'units/a1-1-introductions.json',icon:icons[language]};
  course.version=Math.max(2,Number(course.version||1));
  course.routeLabel='RUTA GUIADA · FUNDAMENTOS Y A1';
  course.levels=[
    {id:'foundations',label:'ETAPA 1 · A0',title:'Fundamentos para empezar',description:'Lectura, vocabulario y estructuras esenciales antes de las conversaciones guiadas.',unitIds:foundationIds},
    {id:'a1-1',label:'ETAPA 2 · A1.1',title:'Primeras conversaciones',description:'Escenas breves, gramática contextual, escucha y respuesta paso a paso.',unitIds:['a1-1-introductions']},
  ];
  course.units=[...course.units.filter(value=>value.id!=='a1-1-introductions'),summary];
  fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');
  for(const lesson of lessons){
    const lessonType=lesson.isReview?'review':lesson.isTest?'test':'normal';
    const reward=lesson.xpReward??(lessonType==='review'?5:lessonType==='test'?30:20);
    catalogRows.push({language:language.toLowerCase(),course:course.courseId,lesson:lesson.id,type:lessonType,reward});
  }
  console.log(`${language}: ${lessons.length} pasos A1.1 · ${items.length} expresiones`);
}

// El piloto coreano ya existía y tiene actividades diseñadas a mano. Se
// conserva sin regenerarlo, pero se incluye en la migración común de XP.
{
  const language='Korean',root=path.join(courseRoot,language);
  const course=JSON.parse(fs.readFileSync(path.join(root,'course.json'),'utf8'));
  const unit=JSON.parse(fs.readFileSync(path.join(root,'units','a1-1-introductions.json'),'utf8'));
  for(const lesson of unit.lessons){
    const lessonType=lesson.isReview?'review':lesson.isTest?'test':'normal';
    const reward=lesson.xpReward??(lessonType==='review'?5:lessonType==='test'?30:20);
    catalogRows.push({language:language.toLowerCase(),course:course.courseId,lesson:lesson.id,type:lessonType,reward});
  }
}

const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const rows=catalogRows.map(row=>`  (${quote(row.language)},${quote(row.course)},${quote(row.lesson)},${quote(row.type)},${row.reward},true,'{"source":"guided-course","unitId":"a1-1-introductions","level":"A1.1"}'::jsonb)`).join(',\n');
const migration=`begin;

-- Generado por scripts/build_guided_continuations.mjs.
-- Publica únicamente los IDs A1.1; complete_lesson sigue siendo la única vía que concede XP.
insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
values
${rows}
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

alter table public.lesson_catalog enable row level security;
revoke all on public.lesson_catalog from anon,authenticated;

commit;
`;
fs.writeFileSync(path.join(web,'supabase','migrations','006_all_languages_a11_catalog.sql'),migration);
console.log(`Catálogo XP A1.1: ${catalogRows.length} pasos`);

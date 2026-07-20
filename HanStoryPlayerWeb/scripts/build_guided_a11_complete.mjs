#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GUIDED_COURSES} from '../src/guided_course_config.js';
import {A11_TARGETS,A11_THEMES,validateA11Content} from '../course-authoring/a11_content.mjs';

validateA11Content();
const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const courseRoot=path.join(web,'library','courses');
const catalog=[];
const slugs={English:'english',French:'french',German:'german',Italian:'italian',Russian:'russian',Korean:'korean',Japanese:'japanese',Chinese:'chinese',Portuguese:'portuguese',Arabic:'arabic'};

function activity(id,type,prompt,{target='',options=[],answer='',explanation='',audio='',gradable=true,tags=[]}={}){
  return{id,type,prompt,target,options,answer,explanation,audio,slow_audio:audio,image:null,writing_asset:null,tags:['a1.1',...tags],xp:gradable?10:2,...(!gradable?{gradable:false}:{})};
}
function distractors(values,correct,index){
  const result=[correct];
  for(let offset=1;result.length<3&&offset<values.length*2;offset++){
    const candidate=values[(index+offset*5)%values.length];
    if(candidate&&!result.includes(candidate))result.push(candidate);
  }
  const shift=index%result.length;
  return [...result.slice(shift),...result.slice(0,shift)];
}
function exercises({slug,theme,target,meaning,index,targets,meanings,prefix,teach}){
  const id=`${slug}-${prefix}-${String(index+1).padStart(2,'0')}`;
  const values=[];
  if(teach)values.push(activity(`${id}-teach`,'teach_concept','Aprende y escucha',{target,explanation:meaning,audio:target,gradable:false,tags:[theme,'teaching']}));
  values.push(activity(`${id}-meaning`,'select_translation',`¿Qué significa «${target}»?`,{target,options:distractors(meanings,meaning,index),answer:meaning,explanation:`«${target}» significa «${meaning}».`,audio:target,tags:[theme,'meaning']}));
  values.push(activity(`${id}-listen`,'listening_choice','Escucha y elige la forma escrita correcta',{options:distractors(targets,target,index+2),answer:target,explanation:`La forma escuchada es «${target}»: ${meaning}`,audio:target,tags:[theme,'listening']}));
  return values;
}
function teachingLesson({slug,theme,unitTitle,number,indices,targets,meanings}){
  const lessonId=`${slug}-a11-${theme}-${String(number).padStart(2,'0')}`;
  const prefix=`a11-${theme}-${String(number).padStart(2,'0')}`;
  return{id:lessonId,title:`${unitTitle} · ${number}`,description:'Aprende cuatro elementos nuevos y practícalos de inmediato.',activities:[
    activity(`${lessonId}-intro`,'lesson_intro',unitTitle,{explanation:'Escucha primero. Después relaciona la forma escrita con su significado.',gradable:false,tags:[theme]}),
    ...indices.flatMap(index=>exercises({slug,theme,target:targets[index],meaning:meanings[index],index,targets,meanings,prefix,teach:true})),
  ]};
}
function reviewLesson({slug,theme,number,indices,targets,meanings}){
  const lessonId=`${slug}-a11-${theme}-review-${String(number).padStart(2,'0')}`;
  const prefix=`a11-${theme}-review-${String(number).padStart(2,'0')}`;
  return{id:lessonId,title:`Repaso breve · ${number}`,description:'Recupera contenidos anteriores sin añadir vocabulario nuevo.',isReview:true,activities:[
    activity(`${lessonId}-intro`,'lesson_intro','Repaso acumulativo',{explanation:'Intenta recordar antes de utilizar la pista.',gradable:false,tags:[theme,'review']}),
    ...indices.flatMap(index=>exercises({slug,theme,target:targets[index],meaning:meanings[index],index,targets,meanings,prefix,teach:false})),
  ]};
}
function testLesson({slug,theme,unitTitle,targets,meanings}){
  const lessonId=`${slug}-a11-${theme}-test`,prefix=`a11-${theme}-test`;
  return{id:lessonId,title:`Prueba · ${unitTitle}`,description:'Comprueba los 16 contenidos de la unidad sin presentación previa.',isTest:true,isUnitFinal:true,xpReward:40,activities:[
    activity(`${lessonId}-intro`,'lesson_intro','Prueba de unidad',{explanation:'Necesitas al menos 85 % para completar la unidad.',gradable:false,tags:[theme,'test']}),
    ...targets.flatMap((target,index)=>exercises({slug,theme,target,meaning:meanings[index],index,targets,meanings,prefix,teach:false})),
  ]};
}
function unitFor(language,theme,index){
  const targets=A11_TARGETS[language][theme.id],meanings=theme.meanings,slug=slugs[language];
  const id=`a1-1-${theme.id}`;
  return{
    id,title:theme.title,description:theme.objective,requirements:index?[`a1-1-${A11_THEMES[index-1].id}`]:[],
    reward:{xp:160,badge:`A1.1 · ${theme.title}`},
    lessons:[
      teachingLesson({slug,theme:theme.id,unitTitle:theme.title,number:1,indices:[0,1,8,9],targets,meanings}),
      teachingLesson({slug,theme:theme.id,unitTitle:theme.title,number:2,indices:[2,3,10,11],targets,meanings}),
      reviewLesson({slug,theme:theme.id,number:1,indices:[0,2,8,10],targets,meanings}),
      teachingLesson({slug,theme:theme.id,unitTitle:theme.title,number:3,indices:[4,5,12,13],targets,meanings}),
      teachingLesson({slug,theme:theme.id,unitTitle:theme.title,number:4,indices:[6,7,14,15],targets,meanings}),
      reviewLesson({slug,theme:theme.id,number:2,indices:[1,3,5,7,9,11,13,15],targets,meanings}),
      testLesson({slug,theme:theme.id,unitTitle:theme.title,targets,meanings}),
    ],
  };
}

for(const language of Object.keys(A11_TARGETS)){
  const definition=GUIDED_COURSES[language];
  if(!definition)throw new Error(`Falta definición del curso: ${language}`);
  const root=path.join(courseRoot,definition.directory),coursePath=path.join(root,'course.json');
  const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
  const foundationLevel=(course.levels||[]).find(level=>level.id==='foundations');
  const foundationIds=foundationLevel?.unitIds||course.units.filter(unit=>!String(unit.id).startsWith('a1-')).map(unit=>unit.id);
  const legacyAndAdvanced=new Set(['a1-1-introductions','a1-2-daily-life','a2-1-plans-and-time','a2-2-description-and-comparison','b1-1-narration-and-reasons','b1-2-independent-reading']);
  const units=A11_THEMES.map((theme,index)=>unitFor(language,theme,index));
  for(const unit of units){
    const destination=path.join(root,'units',`${unit.id}.json`);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination,JSON.stringify(unit,null,2)+'\n');
    for(const lesson of unit.lessons){
      const type=lesson.isReview?'review':lesson.isTest?'test':'normal';
      const reward=lesson.xpReward??(type==='review'?7:22);
      catalog.push({language:language.toLowerCase(),course:course.courseId,lesson:lesson.id,type,reward,unit:unit.id});
    }
  }
  const startWorld=foundationIds.length+1;
  const summaries=units.map((unit,index)=>({
    id:unit.id,world:startWorld+index,mapLabel:`UNIDAD A1.1 · ${index+1}`,title:unit.title,description:unit.description,
    manifest:`units/${unit.id}.json`,icon:A11_TARGETS[language].icons[index],
  }));
  course.version=Math.max(5,Number(course.version||1));
  course.routeLabel='RUTA GUIADA · FUNDAMENTOS Y A1.1';
  course.levels=[
    {...(foundationLevel||{}),id:'foundations',label:'ETAPA 1 · A0',title:'Fundamentos para empezar',description:'Lectura, pronunciación y estructuras esenciales.',unitIds:foundationIds},
    {id:'a1-1',label:'ETAPA 2 · A1.1',title:'Primeras conversaciones',description:'Seis unidades de identidad, vida diaria y autonomía inicial.',unitIds:units.map(unit=>unit.id)},
  ];
  course.units=[...course.units.filter(unit=>foundationIds.includes(unit.id)&&!legacyAndAdvanced.has(unit.id)),...summaries];
  fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');
  console.log(`${language}: ${units.length} unidades · ${units.length*7} lecciones · ${units.length*16} contenidos`);
}

const q=value=>`'${String(value).replaceAll("'","''")}'`;
const rows=catalog.map(row=>`  (${q(row.language)},${q(row.course)},${q(row.lesson)},${q(row.type)},${row.reward},true,'{"source":"guided-course","unitId":"${row.unit}","level":"A1.1","curriculumVersion":2}'::jsonb)`).join(',\n');
const migration=`begin;\n\n-- A1.1 completo: seis unidades por idioma.\ninsert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata)\nvalues\n${rows}\non conflict(language_id,course_id,lesson_id) do update\nset lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true,metadata=excluded.metadata;\n\nalter table public.lesson_catalog enable row level security;\nrevoke all on public.lesson_catalog from anon,authenticated;\n\ncommit;\n`;
fs.writeFileSync(path.join(web,'supabase','migrations','008_all_languages_a11_complete_catalog.sql'),migration);
console.log(`Catálogo XP A1.1 completo: ${catalog.length} lecciones`);

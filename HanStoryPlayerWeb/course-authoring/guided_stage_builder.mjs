import fs from 'node:fs';
import path from 'node:path';
import {GUIDED_COURSES} from '../src/guided_course_config.js';

const LANGUAGE_SLUGS=Object.freeze({
  English:'english',French:'french',German:'german',Italian:'italian',Russian:'russian',
  Korean:'korean',Japanese:'japanese',Chinese:'chinese',Portuguese:'portuguese',Arabic:'arabic',
});

function activity(stageTag,id,type,prompt,{target='',options=[],answer='',explanation='',audio='',gradable=true,tags=[]}={}){
  return{id,type,prompt,target,options,answer,explanation,audio,slow_audio:audio,image:null,writing_asset:null,tags:[stageTag,...tags],xp:gradable?10:2,...(!gradable?{gradable:false}:{})};
}

function distractors(values,correct,index){
  const result=[correct];
  for(let offset=1;result.length<3&&offset<values.length*2;offset++){
    const candidate=values[(index+offset*5)%values.length];
    if(candidate&&!result.includes(candidate))result.push(candidate);
  }
  const shift=index%result.length;
  return[...result.slice(shift),...result.slice(0,shift)];
}

function exercises({stageTag,slug,theme,target,meaning,index,targets,meanings,prefix,teach}){
  const id=`${slug}-${prefix}-${String(index+1).padStart(2,'0')}`;
  const values=[];
  if(teach)values.push(activity(stageTag,`${id}-teach`,'teach_concept','Aprende y escucha',{target,explanation:meaning,audio:target,gradable:false,tags:[theme,'teaching']}));
  values.push(activity(stageTag,`${id}-meaning`,'select_translation',`¿Qué significa «${target}»?`,{target,options:distractors(meanings,meaning,index),answer:meaning,explanation:`«${target}» significa «${meaning}».`,audio:target,tags:[theme,'meaning']}));
  values.push(activity(stageTag,`${id}-listen`,'listening_choice','Escucha y elige la forma escrita correcta',{options:distractors(targets,target,index+2),answer:target,explanation:`La forma escuchada es «${target}»: ${meaning}`,audio:target,tags:[theme,'listening']}));
  return values;
}

function teachingLesson({stageTag,idTag,slug,theme,unitTitle,number,indices,targets,meanings}){
  const lessonId=`${slug}-${idTag}-${theme}-${String(number).padStart(2,'0')}`;
  const prefix=`${idTag}-${theme}-${String(number).padStart(2,'0')}`;
  return{id:lessonId,title:`${unitTitle} · ${number}`,description:'Aprende cuatro elementos nuevos y practícalos de inmediato.',activities:[
    activity(stageTag,`${lessonId}-intro`,'lesson_intro',unitTitle,{explanation:'Escucha primero. Después relaciona la forma escrita con su significado.',gradable:false,tags:[theme]}),
    ...indices.flatMap(index=>exercises({stageTag,slug,theme,target:targets[index],meaning:meanings[index],index,targets,meanings,prefix,teach:true})),
  ]};
}

function reviewLesson({stageTag,idTag,slug,theme,number,indices,targets,meanings}){
  const lessonId=`${slug}-${idTag}-${theme}-review-${String(number).padStart(2,'0')}`;
  const prefix=`${idTag}-${theme}-review-${String(number).padStart(2,'0')}`;
  return{id:lessonId,title:`Repaso breve · ${number}`,description:'Recupera contenidos anteriores sin añadir vocabulario nuevo.',isReview:true,activities:[
    activity(stageTag,`${lessonId}-intro`,'lesson_intro','Repaso acumulativo',{explanation:'Intenta recordar antes de utilizar la pista.',gradable:false,tags:[theme,'review']}),
    ...indices.flatMap(index=>exercises({stageTag,slug,theme,target:targets[index],meaning:meanings[index],index,targets,meanings,prefix,teach:false})),
  ]};
}

function testLesson({stageTag,idTag,slug,theme,unitTitle,targets,meanings}){
  const lessonId=`${slug}-${idTag}-${theme}-test`,prefix=`${idTag}-${theme}-test`;
  return{id:lessonId,title:`Prueba · ${unitTitle}`,description:'Comprueba los 16 contenidos de la unidad sin presentación previa.',isTest:true,isUnitFinal:true,xpReward:40,activities:[
    activity(stageTag,`${lessonId}-intro`,'lesson_intro','Prueba de unidad',{explanation:'Necesitas al menos 85 % para completar la unidad.',gradable:false,tags:[theme,'test']}),
    ...targets.flatMap((target,index)=>exercises({stageTag,slug,theme,target,meaning:meanings[index],index,targets,meanings,prefix,teach:false})),
  ]};
}

function makeUnit({language,theme,index,themes,targetsByLanguage,stageId,stageTag,idTag,previousStageLastUnit}){
  const targets=targetsByLanguage[language][theme.id],meanings=theme.meanings,slug=LANGUAGE_SLUGS[language];
  const id=`${stageId}-${theme.id}`;
  return{
    id,title:theme.title,description:theme.objective,
    requirements:index?[`${stageId}-${themes[index-1].id}`]:previousStageLastUnit?[previousStageLastUnit]:[],
    reward:{xp:160,badge:`${stageTag} · ${theme.title}`},
    lessons:[
      teachingLesson({stageTag,idTag,slug,theme:theme.id,unitTitle:theme.title,number:1,indices:[0,1,8,9],targets,meanings}),
      teachingLesson({stageTag,idTag,slug,theme:theme.id,unitTitle:theme.title,number:2,indices:[2,3,10,11],targets,meanings}),
      reviewLesson({stageTag,idTag,slug,theme:theme.id,number:1,indices:[0,2,8,10],targets,meanings}),
      teachingLesson({stageTag,idTag,slug,theme:theme.id,unitTitle:theme.title,number:3,indices:[4,5,12,13],targets,meanings}),
      teachingLesson({stageTag,idTag,slug,theme:theme.id,unitTitle:theme.title,number:4,indices:[6,7,14,15],targets,meanings}),
      reviewLesson({stageTag,idTag,slug,theme:theme.id,number:2,indices:[1,3,5,7,9,11,13,15],targets,meanings}),
      testLesson({stageTag,idTag,slug,theme:theme.id,unitTitle:theme.title,targets,meanings}),
    ],
  };
}

const sqlQuote=value=>`'${String(value).replaceAll("'","''")}'`;

export function buildGuidedStage({
  webRoot,themes,targetsByLanguage,validateContent,stageId,stageTag,idTag,levelLabel,levelTitle,levelDescription,
  routeLabel,previousStageLastUnit,migrationFile,curriculumVersion=2,courseVersion=6,
}){
  validateContent();
  const courseRoot=path.join(webRoot,'library','courses');
  const catalog=[];
  for(const language of Object.keys(targetsByLanguage)){
    const definition=GUIDED_COURSES[language];
    if(!definition)throw new Error(`Falta definición del curso: ${language}`);
    const root=path.join(courseRoot,definition.directory),coursePath=path.join(root,'course.json');
    const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
    const units=themes.map((theme,index)=>makeUnit({language,theme,index,themes,targetsByLanguage,stageId,stageTag,idTag,previousStageLastUnit}));
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
    const existingLevels=(course.levels||[]).filter(level=>level.id!==stageId);
    const activeExistingIds=new Set(existingLevels.flatMap(level=>level.unitIds||[]));
    const retainedSummaries=(course.units||[]).filter(unit=>activeExistingIds.has(unit.id));
    const startWorld=Math.max(0,...retainedSummaries.map(unit=>Number(unit.world)||0))+1;
    const summaries=units.map((unit,index)=>({
      id:unit.id,world:startWorld+index,mapLabel:`UNIDAD ${stageTag} · ${index+1}`,title:unit.title,description:unit.description,
      manifest:`units/${unit.id}.json`,icon:targetsByLanguage[language].icons[index],
    }));
    course.version=Math.max(courseVersion,Number(course.version||1));
    course.routeLabel=routeLabel;
    course.levels=[...existingLevels,{id:stageId,label:levelLabel,title:levelTitle,description:levelDescription,unitIds:units.map(unit=>unit.id)}];
    course.units=[...retainedSummaries,...summaries];
    fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');
    console.log(`${language}: ${units.length} unidades ${stageTag} · ${units.length*7} lecciones · ${units.length*16} contenidos`);
  }
  const rows=catalog.map(row=>`  (${sqlQuote(row.language)},${sqlQuote(row.course)},${sqlQuote(row.lesson)},${sqlQuote(row.type)},${row.reward},true,'{"source":"guided-course","unitId":"${row.unit}","level":"${stageTag}","curriculumVersion":${curriculumVersion}}'::jsonb)`).join(',\n');
  const migration=`begin;\n\n-- ${stageTag} completo: seis unidades por idioma.\ninsert into public.lesson_catalog(language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata)\nvalues\n${rows}\non conflict(language_id,course_id,lesson_id) do update\nset lesson_type=excluded.lesson_type,xp_reward=excluded.xp_reward,active=true,metadata=excluded.metadata;\n\nalter table public.lesson_catalog enable row level security;\nrevoke all on public.lesson_catalog from anon,authenticated;\n\ncommit;\n`;
  fs.writeFileSync(path.join(webRoot,'supabase','migrations',migrationFile),migration);
  console.log(`Catálogo XP ${stageTag} completo: ${catalog.length} lecciones`);
  return{catalogCount:catalog.length,languages:Object.keys(targetsByLanguage).length,unitsPerLanguage:themes.length};
}

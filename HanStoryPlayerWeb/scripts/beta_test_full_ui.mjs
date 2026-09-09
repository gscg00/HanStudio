#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const{chromium}=require('playwright');
const scriptPath=fileURLToPath(import.meta.url);
const webRoot=path.resolve(path.dirname(scriptPath),'..');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{
  const[index,...rest]=value.replace(/^--/,'').split('=');
  return[index,rest.join('=')||true];
}));
const baseUrl=String(args.base||'http://127.0.0.1:8080/').replace(/\/+$/,'/') ;
const outputPath=path.resolve(args.output||path.join(webRoot,'docs','qa_full_ui_results.json'));
const requestedUnits=String(args.units||'').split(',').map(value=>value.trim()).filter(Boolean);
const requestedLanguages=String(args.languages||'').split(',').map(value=>value.trim()).filter(Boolean);
const concurrency=Math.max(1,Math.min(4,Number(args.concurrency||2)));
const viewportMatch=String(args.viewport||'1440x1000').match(/^(\d{3,4})x(\d{3,4})$/i);
if(!viewportMatch)throw new Error('viewport debe tener el formato anchoxalto, por ejemplo 390x844.');
const viewport={width:Number(viewportMatch[1]),height:Number(viewportMatch[2])};
const courseDefinitions={
  English:{slug:'english',directory:'English'},
  Korean:{slug:'korean',directory:'Korean'},
  Russian:{slug:'russian',directory:'Russian'},
  Italian:{slug:'italian',directory:'Italian'},
  French:{slug:'french',directory:'French'},
  German:{slug:'german',directory:'German'},
  Japanese:{slug:'japanese',directory:'Japanese'},
  Chinese:{slug:'chinese',directory:'Chinese'},
  Portuguese:{slug:'portuguese',directory:'Portuguese'},
  Arabic:{slug:'arabic',directory:'Arabic'},
};

const selectedEntries=Object.entries(courseDefinitions).filter(([language])=>
  !requestedLanguages.length||requestedLanguages.includes(language),
);
if(!selectedEntries.length)throw new Error('No se seleccionó ningún idioma válido.');

const now=()=>new Date().toISOString();
const startedAt=now();
const edgeExecutable='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const launchOptions={headless:true};
try{await fs.access(edgeExecutable);launchOptions.executablePath=edgeExecutable;}catch{}
const browser=await chromium.launch(launchOptions);
const results=[];
let cursor=0;

async function runLanguage(language,definition){
  const context=await browser.newContext({
    viewport,
    locale:'es-MX',
    reducedMotion:'reduce',
  });
  await context.addInitScript(()=>{
    window.__qaPlayedAudio=[];
    class SilentAudioContext{
      constructor(){this.currentTime=0;this.destination={};}
      createOscillator(){return{frequency:{value:0},connect:node=>node,start(){},stop(){}};}
      createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect:node=>node};}
    }
    Object.defineProperty(window,'AudioContext',{configurable:true,value:SilentAudioContext});
    Object.defineProperty(window,'webkitAudioContext',{configurable:true,value:SilentAudioContext});
    const originalDescriptor=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');
    HTMLMediaElement.prototype.play=function(){
      window.__qaPlayedAudio.push(this.currentSrc||this.src||'');
      queueMicrotask(()=>{
        this.dispatchEvent(new Event('playing'));
        this.dispatchEvent(new Event('ended'));
      });
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause=function(){};
    if(originalDescriptor&&!originalDescriptor.configurable)return;
  });
  const page=await context.newPage();
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push({type:'pageerror',message:error.message}));
  page.on('console',message=>{
    if(message.type()==='error'&&!message.text().startsWith('Failed to load resource:'))browserErrors.push({type:'console',message:message.text()});
    if(message.type()==='log'&&message.text().startsWith('[QA]'))console.log(`${language} ${message.text()}`);
  });
  page.on('response',response=>{
    if(response.status()>=400)browserErrors.push({type:'http',status:response.status(),url:response.url()});
  });
  console.log(`${language}: iniciando recorrido de interfaz`);
  await page.goto(`${baseUrl}?qa#/${definition.slug}/course`,{waitUntil:'domcontentloaded',timeout:30_000});
  await page.waitForSelector('.jp-learning-path',{timeout:30_000});
  const result=await page.evaluate(async({language,definition,requestedUnits})=>{
    const issues=[];
    const coverage={maps:0,units:0,lessons:0,activities:0,teaching:0,gradable:0,production:0,audioButtons:0,results:0};
    const productionTypes=new Set(['typed_translation','dictation','build_with_blocks','complete_without_options','transform_sentence','open_question','speak_and_transcribe','guided_dialogue','stage_scenario']);
    const teachingTypes=new Set(['lesson_intro','teach_kana','teach_concept','teach_word','teach_pattern','teach_kanji','dialogue_model']);
    const orderedTypes=new Set(['build_word','reorder_syllables','reorder_sentence']);
    const audioFailureActivities=new Set();
    const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
    const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    const waitFor=async(predicate,timeout=5000)=>{
      const start=performance.now();
      while(performance.now()-start<timeout){
        const value=predicate();
        if(value)return value;
        await wait(8);
      }
      return null;
    };
    const addIssue=(code,context,message,detail={})=>issues.push({code,language,...context,message,...detail});
    const click=async element=>{
      if(!element)return false;
      element.click();
      await Promise.resolve();
      return true;
    };
    const testAudio=async(element,activityContext)=>{
      if(!element)return false;
      const toast=document.querySelector('.jp-toast');
      if(toast){toast.textContent='';toast.classList.remove('show');}
      coverage.audioButtons++;
      await click(element);
      await Promise.resolve();
      const message=document.querySelector('.jp-toast.show')?.textContent?.trim()||'';
      if(/audio.+pendiente|no hay audio|audio.+no est[aá] disponible/i.test(message)&&!audioFailureActivities.has(activityContext.activityId)){
        audioFailureActivities.add(activityContext.activityId);
        addIssue('audio_playback_unavailable',activityContext,message);
      }
      return true;
    };
    const answerText=record=>{
      const raw=record?.answer??record?.accepted_answers?.[0]??'';
      const text=String(raw);
      const final=text.match(/(?:→|=)\s*([^=→]+)\s*$/u)?.[1]?.trim();
      return final||text;
    };
    const sequenceFor=(options,target,joiner='')=>{
      const values=(options||[]).map(String),wanted=String(target??'');
      const used=Array(values.length).fill(false),sequence=[];
      const search=current=>{
        if(current===wanted)return true;
        if(current.length>wanted.length||!wanted.startsWith(current))return false;
        for(let index=0;index<values.length;index++){
          if(used[index])continue;
          const next=current?`${current}${joiner}${values[index]}`:values[index];
          if(!wanted.startsWith(next))continue;
          used[index]=true;sequence.push(index);
          if(search(next))return true;
          sequence.pop();used[index]=false;
        }
        return false;
      };
      return search('')?[...sequence]:[];
    };
    const routeAndWait=async(hash,selector)=>{
      location.hash=hash;
      await frame();
      await frame();
      const found=await waitFor(()=>document.querySelector(selector));
      await frame();
      return found;
    };
    const rootPath=`library/courses/${definition.directory}`;
    const course=await fetch(`${rootPath}/course.json`,{cache:'no-store'}).then(response=>response.json());
    const units=await Promise.all(course.units.filter(summary=>summary.manifest&&(!requestedUnits.length||requestedUnits.includes(summary.id))).map(async summary=>({
      summary,
      unit:await fetch(`${rootPath}/${summary.manifest}`,{cache:'no-store'}).then(response=>response.json()),
    })));
    if(!units.length)throw new Error('Ninguna unidad coincide con el filtro.');
    const openingUnitIds=new Set((course.levels||[]).flatMap(level=>level.unitIds?.[0]?[level.unitIds[0]]:[]));
    const presentedActivities=(unit,lesson)=>{
      const activities=lesson.activities||[];
      const firstNormal=(unit.lessons||[]).find(item=>!item.isReview&&!item.isTest);
      const stageOpening=openingUnitIds.size
        ? openingUnitIds.has(unit.id)&&firstNormal?.id===lesson.id
        : course.units?.[0]?.id===unit.id&&firstNormal?.id===lesson.id;
      return stageOpening||activities[0]?.type!=='lesson_intro'?activities:activities.slice(1);
    };

    coverage.maps++;
    const mapNodes=[...document.querySelectorAll('[data-jp-unit]')];
    if(mapNodes.length!==course.units.filter(summary=>summary.manifest).length)addIssue('map_unit_count',{},`El mapa muestra ${mapNodes.length} unidades; el curso declara ${units.length}.`);
    for(const{unit}of units){
      const unitRoot=await routeAndWait(`#/${definition.slug}/course/unit/${unit.id}`,'.jp-lesson-list');
      coverage.units++;
      if(!unitRoot){addIssue('unit_did_not_render',{unitId:unit.id},'La unidad no llegó a renderizarse.');continue;}
      const rows=[...document.querySelectorAll('[data-jp-lesson]')];
      if(rows.length!==unit.lessons.length)addIssue('unit_lesson_count',{unitId:unit.id},`La unidad muestra ${rows.length} lecciones; declara ${unit.lessons.length}.`);
      if(rows.some(row=>row.disabled))addIssue('qa_unit_has_locked_lessons',{unitId:unit.id},'El modo QA dejó lecciones bloqueadas.');
    }

    let lessonOrdinal=0;
    for(const{unit}of units){
      for(const lesson of unit.lessons||[]){
        lessonOrdinal++;
        const context={unitId:unit.id,lessonId:lesson.id};
        const activities=presentedActivities(unit,lesson);
        const lessonRoot=await routeAndWait(`#/${definition.slug}/course/lesson/${lesson.id}`,'.jp-activity');
        coverage.lessons++;
        if(!lessonRoot){addIssue('lesson_did_not_render',context,'La lección no llegó a renderizarse.');continue;}
        const initialCounter=document.querySelector('.jp-activity-top>strong')?.textContent?.trim();
        if(initialCounter!==`1/${activities.length}`)addIssue('activity_count_mismatch',context,`La interfaz inició en ${initialCounter||'sin contador'}; se esperaban ${activities.length} actividades.`);

        for(let index=0;index<activities.length;index++){
          const activity=activities[index],activityContext={...context,activityId:activity.id,activityIndex:index+1,type:activity.type};
          coverage.activities++;
          const activityNode=await waitFor(()=>document.querySelector('.jp-activity'));
          if(!activityNode){addIssue('activity_did_not_render',activityContext,'La actividad desapareció antes de poder usarla.');break;}
          const visibleCounter=document.querySelector('.jp-activity-top>strong')?.textContent?.trim();
          if(visibleCounter!==`${index+1}/${activities.length}`)addIssue('activity_counter_stuck',activityContext,`El contador muestra ${visibleCounter||'nada'}.`);
          const heading=document.querySelector('.jp-question h1')?.textContent?.trim();
          if(!heading)addIssue('empty_activity_heading',activityContext,'La actividad no tiene instrucción visible.');
          if(document.documentElement.scrollWidth>window.innerWidth+2)addIssue('horizontal_overflow',activityContext,`La pantalla desborda ${document.documentElement.scrollWidth-window.innerWidth}px horizontalmente.`);
          const namelessButtons=[...activityNode.querySelectorAll('button')].filter(button=>!(button.getAttribute('aria-label')||button.getAttribute('title')||button.textContent||'').trim());
          if(namelessButtons.length)addIssue('nameless_button',activityContext,`Hay ${namelessButtons.length} botones sin nombre accesible.`);
          const renderedText=activityNode.textContent||'';
          const rawProgramValue=/\b(?:undefined|\[object Object\])\b/.test(renderedText)||(language!=='German'&&/\bnull\b/.test(renderedText));
          if(rawProgramValue)addIssue('raw_program_value',activityContext,'Se muestra un valor interno de programación.');

          const isTeaching=activity.gradable===false||teachingTypes.has(activity.type);
          if(isTeaching){
            coverage.teaching++;
            if(activity.audio){
              const audioButton=activityNode.querySelector('[data-jp-audio]');
              if(audioButton)await testAudio(audioButton,activityContext);
              else addIssue('teaching_audio_control_missing',activityContext,'La actividad declara audio pero no ofrece ningún control para escucharlo.');
            }
            const continued=await click(document.querySelector('[data-jp-action="continue"]'));
            if(!continued)addIssue('teaching_continue_missing',activityContext,'No existe el botón para continuar.');
            continue;
          }

          coverage.gradable++;
          if(productionTypes.has(activity.type))coverage.production++;
          if(activity.audio){
            const promptAudio=activityNode.querySelector('.jp-big-audio,[data-jp-audio-source="prompt"]');
            if(promptAudio)await testAudio(promptAudio,activityContext);
            else if(['dictation','listening_choice','minimal_pair','audio_to_kana'].includes(activity.type))addIssue('required_audio_control_missing',activityContext,'La actividad auditiva no ofrece un botón de audio.');
          }

          if(['guided_dialogue','stage_scenario'].includes(activity.type)){
            if(activityNode.classList.contains('jp-empty-dialogue')){
              addIssue('dialogue_skipped_as_unavailable',activityContext,'La interfaz omitió el diálogo porque no encontró respuestas utilizables.');
              await click(document.querySelector('[data-jp-action="continue"]'));
              continue;
            }
            const learnerTurns=(activity.turns||[]).filter(turn=>turn.role==='learner');
            const fields=[...document.querySelectorAll('[data-jp-dialogue-index]')].filter(field=>field.matches('input,textarea'));
            if(fields.length!==learnerTurns.length)addIssue('dialogue_field_count',activityContext,`Hay ${fields.length} campos para ${learnerTurns.length} turnos del alumno.`);
            fields.forEach((field,fieldIndex)=>{
              field.value=answerText(learnerTurns[fieldIndex]);
              field.dispatchEvent(new Event('input',{bubbles:true}));
            });
          }else if(activity.type==='build_with_blocks'){
            const joiner=activity.joiner??(['Chinese','Japanese'].includes(language)?'':' ');
            const sequence=sequenceFor(activity.options,answerText(activity),joiner);
            if(!sequence.length)addIssue('block_answer_not_buildable',activityContext,'La respuesta declarada no puede construirse con los bloques disponibles.',{answer:answerText(activity),options:activity.options});
            for(const optionIndex of sequence){
              const button=document.querySelector(`[data-jp-block-index="${optionIndex}"]`);
              await click(button);
            }
          }else if(productionTypes.has(activity.type)){
            const field=document.querySelector('[data-jp-text-answer]');
            if(!field)addIssue('production_input_missing',activityContext,'No aparece el campo para responder.');
            else{
              field.value=answerText(activity);
              field.dispatchEvent(new Event('input',{bubbles:true}));
            }
          }else{
            const options=[...document.querySelectorAll('[data-jp-answer]')];
            const optionValues=options.map(option=>option.dataset.jpAnswer);
            if(!orderedTypes.has(activity.type)&&options.length<2)addIssue('insufficient_visible_options',activityContext,`Solo hay ${options.length} opción visible.`,{options:optionValues});
            if(!orderedTypes.has(activity.type)&&new Set(optionValues).size!==optionValues.length)addIssue('duplicate_visible_options',activityContext,'Hay opciones duplicadas.',{options:optionValues});
            if(orderedTypes.has(activity.type)){
              const sequence=sequenceFor(activity.options,answerText(activity),'');
              if(!sequence.length)addIssue('ordered_answer_not_buildable',activityContext,'La respuesta no puede formarse con las opciones disponibles.',{answer:answerText(activity),options:activity.options});
              for(const optionIndex of sequence){
                const current=[...document.querySelectorAll('[data-jp-answer]')][optionIndex];
                await click(current);
              }
            }else{
              const correct=options.find(option=>option.dataset.jpAnswer===String(activity.answer));
              if(!correct){
                addIssue('answer_not_selectable',activityContext,'La respuesta declarada no aparece entre las opciones.',{answer:activity.answer,options:optionValues});
                if(options[0])await click(options[0]);
              }else await click(correct);
            }
          }

          const selectedAudio=document.querySelector('[data-jp-audio-source="selection"]');
          if(selectedAudio)await testAudio(selectedAudio,activityContext);
          const check=document.querySelector('[data-jp-action="check"]');
          if(!check)addIssue('check_button_missing',activityContext,'No aparece el botón Comprobar después de responder.');
          else if(check.disabled)addIssue('check_button_stays_disabled',activityContext,'Comprobar permanece desactivado con una respuesta completa.');
          else await click(check);
          const feedback=await waitFor(()=>document.querySelector('.jp-feedback'));
          if(!feedback)addIssue('feedback_missing',activityContext,'No apareció retroalimentación al comprobar.');
          else if(!feedback.classList.contains('correct'))addIssue('declared_answer_rejected',activityContext,'La propia respuesta declarada por el contenido fue rechazada.',{answer:answerText(activity),feedback:feedback.textContent.trim()});
          const continued=await click(document.querySelector('[data-jp-action="continue"]'));
          if(!continued)addIssue('continue_after_feedback_missing',activityContext,'No aparece Continuar después de comprobar.');
        }

        const resultNode=await waitFor(()=>document.querySelector('.jp-result'),8000);
        if(!resultNode)addIssue('lesson_result_missing',context,'La lección no llegó a la pantalla de resultado.');
        else{
          coverage.results++;
          const score=document.querySelector('.jp-result-score b')?.textContent?.trim()||'';
          if(score!=='100%')addIssue('lesson_not_completed_at_100',context,`El resultado final fue ${score||'desconocido'}, no 100%.`);
        }
        if(lessonOrdinal%25===0||lessonOrdinal===units.reduce((sum,item)=>sum+(item.unit.lessons||[]).length,0))console.log(`[QA] ${lessonOrdinal} lecciones · ${coverage.activities} actividades · ${issues.length} incidencias`);
      }
    }
    return{language,courseId:course.courseId,coverage,issues};
  },{language,definition,requestedUnits});
  result.browserErrors=browserErrors;
  await context.close();
  console.log(`${language}: terminado — ${result.coverage.lessons} lecciones, ${result.coverage.activities} actividades, ${result.issues.length} incidencias UI, ${browserErrors.length} errores del navegador`);
  return result;
}

async function worker(){
  while(cursor<selectedEntries.length){
    const index=cursor++;
    const[language,definition]=selectedEntries[index];
    try{results[index]=await runLanguage(language,definition);}
    catch(error){
      results[index]={language,coverage:{},issues:[{code:'runner_failure',language,message:error.stack||error.message}],browserErrors:[]};
      console.error(`${language}: el recorrido se interrumpió`,error);
    }
  }
}

try{
  await Promise.all(Array.from({length:Math.min(concurrency,selectedEntries.length)},()=>worker()));
}finally{
  await browser.close();
}

const totals=results.reduce((sum,result)=>{
  for(const[key,value]of Object.entries(result.coverage||{}))sum[key]=(sum[key]||0)+Number(value||0);
  sum.issues+=(result.issues||[]).length;
  sum.browserErrors+=(result.browserErrors||[]).length;
  return sum;
},{issues:0,browserErrors:0});
const report={startedAt,finishedAt:now(),baseUrl,viewport,unitFilter:requestedUnits,languages:results.map(result=>result.language),totals,results};
await fs.mkdir(path.dirname(outputPath),{recursive:true});
await fs.writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`,'utf8');
console.log(`TOTAL: ${totals.lessons||0} lecciones · ${totals.activities||0} actividades · ${totals.issues} incidencias UI · ${totals.browserErrors} errores de navegador`);
console.log(`Informe JSON: ${outputPath}`);
if(results.some(result=>result.issues?.some(issue=>issue.code==='runner_failure')))process.exitCode=2;

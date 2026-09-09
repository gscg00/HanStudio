#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const{chromium}=require('playwright');
const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{
  const[key,...rest]=value.replace(/^--/,'').split('=');
  return[key,rest.join('=')||true];
}));
const baseUrl=String(args.base||'http://127.0.0.1:8080/').replace(/\/+$/,'/');
const outputPath=path.resolve(args.output||path.join(webRoot,'docs','qa_library_ui_results.json'));
const width=Number(args.width||320),height=Number(args.height||568);
const edgeExecutable='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const launchOptions={headless:true};
try{await fs.access(edgeExecutable);launchOptions.executablePath=edgeExecutable;}catch{}
const browser=await chromium.launch(launchOptions);
const context=await browser.newContext({viewport:{width,height},locale:'es-MX',reducedMotion:'reduce'});
await context.addInitScript(()=>{
  window.__qaPlayedMedia=[];
  HTMLMediaElement.prototype.play=function(){
    window.__qaPlayedMedia.push(this.currentSrc||this.src||'');
    setTimeout(()=>{
      this.dispatchEvent(new Event('playing'));
      this.dispatchEvent(new Event('ended'));
    },0);
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause=function(){};
  class SilentAudioContext{
    constructor(){this.currentTime=0;this.destination={};}
    createOscillator(){return{frequency:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect:node=>node,start(){},stop(){}};}
    createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect:node=>node};}
  }
  Object.defineProperty(window,'AudioContext',{configurable:true,value:SilentAudioContext});
  Object.defineProperty(window,'webkitAudioContext',{configurable:true,value:SilentAudioContext});
});
const page=await context.newPage();
const browserErrors=[];
page.on('pageerror',error=>browserErrors.push({type:'pageerror',message:error.message}));
page.on('console',message=>{
  if(message.type()==='error'&&!message.text().startsWith('Failed to load resource:'))browserErrors.push({type:'console',message:message.text()});
  if(message.type()==='log'&&message.text().startsWith('[LIB-QA]'))console.log(message.text());
});
page.on('response',response=>{
  if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))browserErrors.push({type:'http',status:response.status(),url:response.url()});
});

const startedAt=new Date().toISOString();
try{
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30_000});
  await page.waitForSelector('#languages [data-language]',{timeout:30_000});
  const result=await page.evaluate(async({width})=>{
    const issues=[],audioChecks=new Map();
    const coverage={languages:0,topics:0,topicItems:0,topicPlayerTracks:0,books:0,storyLessons:0,storyModeRuns:0,storyPlayerTracks:0,audioFiles:0};
    const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
    const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    const waitFor=async(predicate,timeout=8000)=>{
      const start=performance.now();
      while(performance.now()-start<timeout){const value=predicate();if(value)return value;await wait(8);}
      return null;
    };
    const click=async element=>{if(!element)return false;element.click();await frame();return true;};
    const addIssue=(code,context,message,detail={})=>issues.push({code,...context,message,...detail});
    const overflow=(context,screen)=>{
      const amount=document.documentElement.scrollWidth-window.innerWidth;
      if(amount>2)addIssue('horizontal_overflow',context,`${screen} desborda ${amount}px en un ancho de ${width}px.`);
    };
    const fetchJSON=relative=>fetch(new URL(relative,location.href),{cache:'no-store'}).then(response=>{
      if(!response.ok)throw new Error(`${response.status} ${relative}`);
      return response.json();
    });
    const checkAudio=async(relative,context)=>{
      if(!relative)return addIssue('empty_audio_path',context,'El contenido no declara una ruta de audio.');
      if(audioChecks.has(relative))return audioChecks.get(relative);
      coverage.audioFiles++;
      let ok=false,status=0;
      try{const response=await fetch(new URL(`library/${relative}`,location.href),{method:'HEAD',cache:'no-store'});status=response.status;ok=response.ok;}
      catch{}
      audioChecks.set(relative,ok);
      if(!ok)addIssue('audio_file_unavailable',context,`El archivo de audio respondió ${status||'sin respuesta'}.`,{audioPath:relative});
      return ok;
    };
    const clearStoryProgress=bookCode=>new Promise(resolve=>{
      const request=indexedDB.open('hanstory-player',3);
      request.onerror=()=>resolve();
      request.onsuccess=()=>{
        const db=request.result,transaction=db.transaction('progress','readwrite');
        transaction.objectStore('progress').delete(`${bookCode}:Frases`);
        transaction.oncomplete=()=>{db.close();resolve();};
        transaction.onerror=()=>{db.close();resolve();};
      };
    });
    const homeMode=async(language,mode)=>{
      const home=document.querySelector('[data-nav="home"]');
      if(home&&!home.closest('#nav-actions')?.hidden)await click(home);
      const languageButton=[...document.querySelectorAll('[data-language]')].find(button=>button.dataset.language===language);
      if(!languageButton)return false;
      await click(languageButton);
      const modeButton=document.querySelector(`[data-mode="${mode}"]`);
      if(!modeButton||modeButton.disabled)return false;
      await click(modeButton);
      return true;
    };
    const publicItems=topic=>(topic.items||[]).filter(item=>!/saul/i.test(JSON.stringify(item||{}).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
    const trackSort=(a,b)=>(a.lesson||999999)-(b.lesson||999999)||(a.sequence??1e9)-(b.sequence??1e9)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true})||String(a.audio_path).localeCompare(String(b.audio_path),undefined,{numeric:true});
    const catalog=await fetchJSON('library/library.json');
    const topicIndex=await fetchJSON('library/topics/topic_index.json');
    const homeLanguages=[...document.querySelectorAll('#languages [data-language]')];
    coverage.languages=homeLanguages.length;
    if(homeLanguages.length!==10)addIssue('home_language_count',{},`La portada muestra ${homeLanguages.length} idiomas; se esperaban 10.`);
    overflow({},'La portada');

    for(const[language,languageTopics]of Object.entries(topicIndex.languages||{})){
      if(!await homeMode(language,'topics')){addIssue('topics_mode_unavailable',{language},'No se pudo abrir el modo Temas.');continue;}
      const cards=await waitFor(()=>{
        const nodes=[...document.querySelectorAll('[data-topic-manifest]')];
        return nodes.length===languageTopics.topics.length?nodes:null;
      });
      if(!cards){addIssue('topic_card_count',{language},'No aparecieron todas las tarjetas de temas.');continue;}
      overflow({language},'La cuadrícula de temas');
      for(const definition of languageTopics.topics){
        const context={language,topicManifest:definition.manifest};
        const topic=await fetchJSON(`library/${definition.manifest}`),items=publicItems(topic);
        const opener=[...document.querySelectorAll('[data-topic-manifest]')].find(button=>button.dataset.topicManifest===definition.manifest);
        await click(opener);
        const detail=await waitFor(()=>!document.querySelector('#topic-detail-view')?.hidden&&document.querySelector('#topic-detail h1')?.textContent===topic.title);
        coverage.topics++;
        if(!detail){addIssue('topic_did_not_open',context,'El detalle del tema no apareció.');continue;}
        const itemNodes=[...document.querySelectorAll('.topic-item')];
        if(itemNodes.length!==items.length)addIssue('topic_item_count',context,`Se muestran ${itemNodes.length} frases; el tema público contiene ${items.length}.`);
        overflow(context,'El detalle del tema');
        for(let index=0;index<items.length;index++){
          const item=items[index],node=itemNodes[index],itemContext={...context,topicItem:index+1,trackId:item.track_id};
          coverage.topicItems++;
          if(!node){addIssue('topic_item_missing',itemContext,'La frase no se renderizó.');continue;}
          if(node.querySelector('.topic-phrase')?.textContent!==String(item.text||''))addIssue('topic_text_mismatch',itemContext,'El texto visible no coincide con el manifiesto.');
          if(node.querySelector('p')?.textContent!==String(item.translation||''))addIssue('topic_translation_mismatch',itemContext,'La traducción visible no coincide con el manifiesto.');
          const audioButton=node.querySelector('[data-topic-audio]');
          if(!audioButton)addIssue('topic_audio_button_missing',itemContext,'La frase no ofrece reproducción individual.');
          else await click(audioButton);
          await checkAudio(item.audio_path,itemContext);
        }
        if(items.length){
          await click(document.querySelector('#play-topic'));
          const player=await waitFor(()=>!document.querySelector('#player-view')?.hidden&&document.querySelector('#player-text'));
          if(!player)addIssue('topic_player_did_not_open',context,'No se abrió el reproductor del tema.');
          else for(let index=0;index<items.length;index++){
            const item=items[index],trackContext={...context,topicPlayerIndex:index+1,trackId:item.track_id};
            coverage.topicPlayerTracks++;
            if(document.querySelector('#player-text')?.textContent!==String(item.text||''))addIssue('topic_player_text_mismatch',trackContext,'El reproductor muestra otra frase.');
            if(document.querySelector('#player-translation')?.textContent!==String(item.translation||''))addIssue('topic_player_translation_mismatch',trackContext,'El reproductor muestra otra traducción.');
            await click(document.querySelector('#play'));
            overflow(trackContext,'El reproductor de tema');
            if(index<items.length-1)await click(document.querySelector('[data-action="next"]'));
          }
          await click(document.querySelector('#player-view>.back'));
        }
        await click(document.querySelector('.topics-back'));
        await waitFor(()=>document.querySelectorAll('[data-topic-manifest]').length===languageTopics.topics.length);
      }
    }

    const booksByLanguage=Object.groupBy((catalog.books||[]).filter(book=>book.visibility!=='admin'),book=>book.target_language);
    for(const[language,books]of Object.entries(booksByLanguage)){
      if(!await homeMode(language,'stories')){addIssue('stories_mode_unavailable',{language},'No se pudo abrir el modo Historias.');continue;}
      await waitFor(()=>document.querySelectorAll('.book-card').length===books.length);
      const cards=[...document.querySelectorAll('.book-card')];
      if(cards.length!==books.length)addIssue('book_card_count',{language},`Se muestran ${cards.length} libros; el catálogo público declara ${books.length}.`);
      overflow({language},'La biblioteca de historias');
      for(const entry of books){
        const context={language,bookCode:entry.code};
        const manifest=await fetchJSON(`library/${entry.manifest}`);
        const card=[...document.querySelectorAll('.book-card')].find(node=>node.dataset.code===entry.code);
        await click(card?.querySelector('.open-book'));
        const detail=await waitFor(()=>!document.querySelector('#detail-view')?.hidden&&document.querySelector('#book-detail h1')?.textContent===manifest.title);
        coverage.books++;
        if(!detail){addIssue('book_did_not_open',context,'El detalle del libro no apareció.');continue;}
        const hasNumbered=(manifest.tracks||[]).some(track=>Number(track.lesson)>0);
        const visibleLessons=hasNumbered?(manifest.lessons||[]).filter(lesson=>Number(lesson.number)>0):(manifest.lessons||[]);
        const lessonButtons=[...document.querySelectorAll('#book-detail [data-lesson]')];
        coverage.storyLessons+=visibleLessons.length;
        if(lessonButtons.length!==visibleLessons.length)addIssue('story_lesson_count',context,`Se muestran ${lessonButtons.length} lecciones; el manifiesto declara ${visibleLessons.length} visibles.`);
        const modes=[...document.querySelectorAll('#playback-mode option')].map(option=>option.value);
        const tracks=(manifest.tracks||[]).filter(track=>!hasNumbered||Number(track.lesson)>0);
        const expectedModes=['phrase',...(tracks.some(track=>track.type==='podcast')?['podcast']:[]),'full'];
        if(modes.join(',')!==expectedModes.join(','))addIssue('story_modes_missing',context,`Los modos disponibles son: ${modes.join(', ')||'ninguno'}; esperados: ${expectedModes.join(', ')}.`);
        overflow(context,'El detalle de la historia');

        for(const mode of modes){
          const modeContext={...context,mode};
          const expected=[...(manifest.tracks||[])].sort(trackSort).filter(track=>(!hasNumbered||Number(track.lesson)>0)&&(mode==='full'||(mode==='podcast'?track.type==='podcast':track.type!=='podcast')));
          // Each playback mode must be tested from its own first track. The app
          // intentionally resumes a saved phrase track, which otherwise makes a
          // later full-book run begin at the end and creates false mismatches.
          await clearStoryProgress(entry.code);
          const select=document.querySelector('#playback-mode');select.value=mode;select.dispatchEvent(new Event('change',{bubbles:true}));
          await click(document.querySelector('#play-book'));
          await waitFor(()=>!document.querySelector('#player-view')?.hidden);
          coverage.storyModeRuns++;
          if(!expected.length){
            addIssue('empty_story_mode_offered',modeContext,'El selector ofrece este modo, pero no contiene ninguna pista.');
            await click(document.querySelector('#player-view>.back'));
            continue;
          }
          for(let index=0;index<expected.length;index++){
            const track=expected[index],trackContext={...modeContext,playerIndex:index+1,trackId:track.id};
            coverage.storyPlayerTracks++;
            if(document.querySelector('#player-text')?.textContent!==String(track.text||track.id))addIssue('story_player_text_mismatch',trackContext,'El reproductor muestra un texto distinto al manifiesto.');
            if(document.querySelector('#player-translation')?.textContent!==String(track.translation||''))addIssue('story_player_translation_mismatch',trackContext,'El reproductor muestra una traducción distinta al manifiesto.');
            const relative=track.audio_path?`books/${entry.code}/${track.audio_path}`:'';
            if(relative)await checkAudio(relative,trackContext);
            else if(!track.tts_fallback)addIssue('story_track_without_audio',trackContext,'La pista no tiene archivo ni alternativa de voz del navegador.');
            await click(document.querySelector('#play'));
            overflow(trackContext,'El reproductor de historia');
            if(index<expected.length-1)await click(document.querySelector('[data-action="next"]'));
          }
          await click(document.querySelector('#player-view>.back'));
        }
        await click(document.querySelector('#detail-view>.back'));
        await waitFor(()=>!document.querySelector('#library-view')?.hidden);
      }
    }
    console.log(`[LIB-QA] ${coverage.topics} temas · ${coverage.topicItems} frases · ${coverage.books} libros · ${coverage.storyPlayerTracks} reproducciones de historia · ${issues.length} incidencias`);
    return{viewport:{width:innerWidth,height:innerHeight},coverage,issues,audioChecks:[...audioChecks.entries()].map(([path,ok])=>({path,ok}))};
  },{width});
  const report={startedAt,finishedAt:new Date().toISOString(),baseUrl,result,browserErrors};
  await fs.mkdir(path.dirname(outputPath),{recursive:true});
  await fs.writeFile(outputPath,`${JSON.stringify(report,null,2)}\n`,'utf8');
  console.log(`Biblioteca: ${result.coverage.topics} temas, ${result.coverage.topicItems} frases, ${result.coverage.books} libros, ${result.coverage.storyPlayerTracks} pasos de reproductor, ${result.issues.length} incidencias.`);
  console.log(`Informe JSON: ${outputPath}`);
}finally{
  await context.close();
  await browser.close();
}

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {guidedCourseForLanguage} from '../src/guided_course_config.js';

const root=new URL('../',import.meta.url);
const missingAudio=process.argv.includes('--missing-audio');
const languages=['English','French','German','Italian','Portuguese','Russian','Chinese','Arabic','Korean','Japanese'];
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
const results=[];

try{
  for(const language of languages){
    const definition=guidedCourseForLanguage(language),courseRoot=new URL(`library/courses/${definition.directory}/`,root);
    const course=JSON.parse(fs.readFileSync(new URL('course.json',courseRoot),'utf8'));
    let found;
    for(const summary of course.units){
      const unit=JSON.parse(fs.readFileSync(new URL(summary.manifest,courseRoot),'utf8'));
      for(const lesson of unit.lessons||[]){
        const index=lesson.activities.findIndex(activity=>activity.word_breakdown?.length&&activity.audio);
        if(index>=0){
          const firstLesson=unit.lessons.find(item=>!item.isReview&&!item.isTest);
          const stageOpening=firstLesson?.id===lesson.id&&(course.levels||[]).some(level=>level.unitIds?.[0]===unit.id);
          const presented=stageOpening||lesson.activities[0]?.type!=='lesson_intro'?lesson.activities:lesson.activities.slice(1);
          found={lesson,activity:lesson.activities[index],presented,index:presented.indexOf(lesson.activities[index])};break;
        }
      }
      if(found)break;
    }
    assert.ok(found,`${language}: falta una tarjeta con desglose para comprobar TTS`);
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
    await context.addInitScript(()=>{
      window.__qaSpoken=[];window.__qaMediaPlays=0;
      class QAUtterance{constructor(text){this.text=String(text);this.lang='';this.rate=1;}}
      Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:QAUtterance});
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return[];},speak(utterance){window.__qaSpoken.push({text:utterance.text,lang:utterance.lang,rate:utterance.rate});queueMicrotask(()=>utterance.onend?.());}}});
      HTMLMediaElement.prototype.play=function(){window.__qaMediaPlays++;queueMicrotask(()=>this.onplaying?.());return Promise.resolve();};
      HTMLMediaElement.prototype.pause=function(){};
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    if(missingAudio)await page.route('**/audio_manifest.json',async route=>{
      const response=await route.fetch(),manifest=await response.json();
      delete (manifest.items||manifest)[found.activity.audio];
      await route.fulfill({response,json:manifest});
    });
    await page.goto(`http://127.0.0.1:8080/?qa#/${definition.slug}/course/lesson/${found.lesson.id}`);
    for(let index=0;index<found.index;index++){
      const activity=found.presented[index];
      const teaching=activity.gradable===false||['lesson_intro','teach_kana','teach_concept','teach_word','teach_pattern','teach_kanji','dialogue_model'].includes(activity.type);
      if(teaching){await page.getByRole('button',{name:/continuar/i}).last().click();continue;}
      const answer=page.locator('[data-jp-answer]').filter({hasText:activity.answer}).first();
      assert.ok(await answer.count(),`${language}: no se pudo recorrer ${activity.id}`);
      await answer.click();await page.getByRole('button',{name:'Comprobar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
    }
    const part=found.activity.word_breakdown[0],word=part.text,spokenWord=part.speech_text||part.speechText||word,tts=page.locator('[data-jp-word-speak]').first();
    assert.equal(await tts.getAttribute('data-jp-word-speak'),spokenWord);
    assert.match(await tts.getAttribute('aria-label'),/^Escuchar con TTS:/);
    await tts.click();
    const spoken=await page.evaluate(()=>window.__qaSpoken.at(-1));
    assert.equal(spoken.text,spokenWord);assert.ok(spoken.lang.toLowerCase().startsWith(definition.htmlLang.toLowerCase()));assert.equal(spoken.rate,.82);
    for(const contextual of found.activity.word_breakdown.filter(item=>item.speech_text)){
      const contextualButton=page.getByRole('button',{name:`Escuchar con TTS: ${contextual.text}`,exact:true});
      await contextualButton.click();
      assert.equal(await page.evaluate(()=>window.__qaSpoken.at(-1).text),contextual.speech_text);
    }
    const spokenCount=(await page.evaluate(()=>window.__qaSpoken.length)),mediaBefore=await page.evaluate(()=>window.__qaMediaPlays);
    await page.locator('[data-jp-audio]').first().click();
    if(missingAudio){
      await page.waitForFunction(count=>window.__qaSpoken.length>count,spokenCount);
      assert.equal(await page.evaluate(()=>window.__qaSpoken.at(-1).text),found.activity.audio);
      assert.equal(await page.evaluate(()=>window.__qaMediaPlays),mediaBefore);
    }else{
      assert.ok(await page.evaluate(()=>window.__qaMediaPlays)>mediaBefore,`${language}: la frase completa no usó su archivo`);
      assert.equal(await page.evaluate(()=>window.__qaSpoken.length),spokenCount,`${language}: la frase completa usó TTS pese a tener audio`);
    }
    assert.deepEqual(errors,[]);
    if(language==='Japanese'){
      await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
      const question=found.presented[found.index+1];
      const answers=page.locator('[data-jp-answer]');
      const labels=await answers.evaluateAll(nodes=>nodes.map(node=>node.dataset.jpAnswer));
      await answers.nth(labels.indexOf(question.answer)).click();
      await page.getByRole('button',{name:'Comprobar',exact:true}).click();
      await page.getByRole('button',{name:'Ver explicación',exact:true}).click();
      const contextual=page.locator('.jp-learning-review').getByRole('button',{name:'Escuchar con TTS: は',exact:true});
      await contextual.click();
      assert.equal(await page.evaluate(()=>window.__qaSpoken.at(-1).text),'わ');
    }
    results.push({language,lessonId:found.lesson.id,word,ttsLanguage:spoken.lang,fullPhraseUsesFile:!missingAudio,missingAudioFallback:missingAudio,errors});
    console.log(`${language}: palabra con TTS; frase completa con ${missingAudio?'respaldo TTS':'archivo'}.`);
    await context.close();
  }
  fs.writeFileSync(new URL(missingAudio?'docs/qa_phrase_tts_fallback.json':'docs/qa_word_tts_boundary.json',root),JSON.stringify({date:new Date().toISOString(),scope:'Una tarjeta por curso: desglose TTS, lectura contextual y reproducción de frase completa.',results},null,2)+'\n');
}finally{await browser.close();}

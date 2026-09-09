import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const unit=JSON.parse(fs.readFileSync(new URL('library/courses/Korean/units/hangul-foundations.json',root),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
 for(const lesson of unit.lessons.filter(item=>item.activities.some(activity=>activity.teaching_refs))){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:568},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   window.qaPlayback=[];
   HTMLMediaElement.prototype.play=function(...args){
    const record={src:this.src,started:false,error:''};window.qaPlayback.push(record);
    // El navegador headless no tiene salida de audio; registrar la invocación
    // y simular el evento de inicio hace determinista la prueba del enlace.
    return Promise.resolve().then(()=>{record.started=true;this.dispatchEvent(new Event('playing'));});
   };
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:8080/?qa#/korean/course/lesson/${lesson.id}`);
  // Solo la primera lección de la etapa conserva la introducción visible;
  // las demás la omiten en la presentación para no repetirla.
  const firstNormal=unit.lessons.find(item=>!item.isReview&&!item.isTest);
  const presented=lesson.id===firstNormal?.id?lesson.activities:lesson.activities.filter(item=>item.type!=='lesson_intro');
  for(const activity of presented){
   if(activity.type==='lesson_intro'||activity.type.startsWith('teach_'))await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
   else{
    const answer=activity.teaching_refs?activity.options.find(option=>option!==activity.answer):activity.answer;
    await page.locator('[data-jp-answer]').filter({hasText:answer}).first().click();
    assert.equal(await page.locator('.jp-linked-teaching').count(),0);
    await page.getByRole('button',{name:'Comprobar',exact:true}).click();
    if(activity.teaching_refs){
     await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
     const panel=page.locator('.jp-linked-teaching');
     assert.equal(await panel.locator('article').count(),activity.teaching_refs.length);
     for(let index=0;index<activity.teaching_refs.length;index++){
      const source=lesson.activities.find(item=>item.id===activity.teaching_refs[index]),card=panel.locator('article').nth(index);
      assert.ok((await card.innerText()).includes(source.target));
      const button=card.locator('[data-jp-audio-key]');
      if(source.audio){
       assert.equal(await button.getAttribute('data-jp-audio-key'),source.audio);
       const before=await page.evaluate(()=>window.qaPlayback.length);
       await button.click();
       await page.waitForFunction(count=>window.qaPlayback.length>=count&&window.qaPlayback[count-1].started,before+1);
      }else assert.equal(await button.count(),0);
     }
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
   }
  }
  await page.waitForURL(`**/result/${lesson.id}`);
  const playback=await page.evaluate(()=>window.qaPlayback),failures=playback.filter(item=>!item.started||item.error);
  assert.deepEqual(failures,[],`Reproducciones no iniciadas en ${lesson.id}: ${JSON.stringify(failures)}`);
  assert.deepEqual(errors,[]);
  results.push({lesson:lesson.id,deliberateRuleError:true,lessonCompleted:true,playback,errors});
  console.log(`${lesson.id}: explicación recuperada y ${playback.length} reproducciones reales iniciadas.`);
  await context.close();
 }
 fs.writeFileSync(new URL('docs/qa_teaching_links_ui.json',root),JSON.stringify({date:new Date().toISOString(),scope:'Seis lecciones de fundamentos de Hangul con errores deliberados y enlaces de enseñanza. Playback nativo, no simulado. No es revisión acústica de pronunciación.',results},null,2)+'\n');
}finally{await browser.close();}

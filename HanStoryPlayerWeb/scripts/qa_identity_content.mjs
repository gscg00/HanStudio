import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url),browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
const cases=[['French','vocabulary','french-vocabulary-31'],['French','vocabulary','french-vocabulary-44'],['Italian','vocabulary','italian-vocabulary-06'],['German','reading-bridge','german-reading-bridge-04']];
try{
 for(const [language,unitId,lessonId] of cases){
  const unit=JSON.parse(fs.readFileSync(new URL(`library/courses/${language}/units/${unitId}.json`,root),'utf8')),lesson=unit.lessons.find(l=>l.id===lessonId);
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:568},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:8080/?qa#/${language.toLowerCase()}/course/lesson/${lessonId}`);
  let checked=0;
  for(const a of lesson.activities.filter(a=>a.type!=='lesson_intro')){
   if(a.type.startsWith('teach_')){
    if(a.usage_note&&['venir de','cura'].includes(a.target))assert.ok((await page.locator('.jp-question').innerText()).includes(a.usage_note));
    await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
   }else{
    assert.equal(await page.locator('.jp-question h1').innerText(),a.prompt);
    const answer=page.locator('[data-jp-answer]').filter({hasText:a.answer}).first();await answer.click();
    await page.getByRole('button',{name:'Comprobar',exact:true}).click();
    assert.match(await page.locator('.jp-feedback').innerText(),/¡Muy bien!/);
    if(a.prompt.startsWith('¿Qué representa')){
     await page.getByRole('button',{name:'Ver explicación',exact:true}).click();
     assert.ok((await page.locator('.jp-learning-review').innerText()).includes(a.answer));checked++;
    }
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
   }
  }
  await page.waitForURL(`**/result/${lessonId}`);assert.deepEqual(errors,[]);
  results.push({language,lessonId,classificationQuestions:checked,completed:true,errors});
  console.log(`${lessonId}: recorrido completo correcto.`);await context.close();
 }
 fs.writeFileSync(new URL('docs/qa_identity_content_ui.json',root),JSON.stringify({date:new Date().toISOString(),scope:'Cuatro lecciones afectadas; respuestas conocidas, no certifica comprensión ni pronunciación.',results},null,2)+'\n');
}finally{await browser.close();}

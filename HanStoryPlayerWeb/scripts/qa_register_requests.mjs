import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),entries=JSON.parse(fs.readFileSync(new URL('course-authoring/qa_register_requests.json',root),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
 for(const [language,entry] of Object.entries(entries)){
  const unit=JSON.parse(fs.readFileSync(new URL(`library/courses/${language}/units/b1-1-register.json`,root),'utf8'));
  const id=`${language.toLowerCase()}-qa-register-request`,lesson=unit.lessons.find(l=>l.activities.some(a=>a.id===id));
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:568},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:8080/?qa#/${language.toLowerCase()}/course/lesson/${lesson.id}`);
  let completed=0;
  for(const a of lesson.activities.filter(a=>a.type!=='lesson_intro')){
   if(a.id===id)break;
   if(a.type.startsWith('teach_')){
    if(a.target===entry.form)assert.ok((await page.locator('.jp-question').innerText()).includes(entry.note));
    await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
   }else{
    const option=page.locator('[data-jp-answer]').filter({hasText:a.answer}).first();
    await option.click();await page.getByRole('button',{name:'Comprobar',exact:true}).click();
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
   }
   completed++;
  }
  assert.ok((await page.locator('.jp-learning-context').innerText()).includes('persona desconocida'));
  assert.ok(!(await page.locator('.jp-question').innerText()).includes(entry.alternatives[0]));
  await page.getByRole('textbox').fill(entry.alternatives[0]);
  await page.getByRole('button',{name:'Comprobar',exact:true}).click();
  assert.match(await page.locator('.jp-feedback').innerText(),/¡Muy bien!/);
  await page.getByRole('button',{name:'Ver explicación',exact:true}).click();
  assert.ok((await page.locator('.jp-learning-review').innerText()).includes(entry.note));
  assert.equal(await page.locator('.jp-learning-review [data-jp-audio-key]').getAttribute('data-jp-audio-key'),entry.form);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  if(language==='French')await page.screenshot({path:'/tmp/hanstory-register-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  for(const a of lesson.activities.slice(lesson.activities.findIndex(a=>a.id===id)+1)){
   if(a.type.startsWith('teach_'))await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
   else{
    await page.locator('[data-jp-answer]').filter({hasText:a.answer}).first().click();
    await page.getByRole('button',{name:'Comprobar',exact:true}).click();
    await page.getByRole('button',{name:'Continuar',exact:true}).click();
   }
  }
  await page.waitForURL(`**/result/${lesson.id}`);
  assert.deepEqual(errors,[]);
  results.push({language,precedingActivitiesCompleted:completed,contextVisible:true,alternativeAccepted:true,explanationVisible:true,lessonCompleted:true,errors});
  console.log(`${language}: enseñanza → práctica → petición contextual verificadas.`);
  await context.close();
 }
 fs.writeFileSync(new URL('docs/qa_register_requests_ui.json',root),JSON.stringify({date:new Date().toISOString(),scope:'Diez lecciones completas con la nueva petición contextual. Respuestas de prueba tomadas del catálogo; no certifica aprendizaje ni pronunciación.',results},null,2)+'\n');
}finally{await browser.close();}

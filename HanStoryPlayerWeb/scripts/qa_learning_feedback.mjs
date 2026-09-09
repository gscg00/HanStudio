import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const notes=JSON.parse(fs.readFileSync(new URL('../course-authoring/qa_cause_effect_notes.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
const results=[];
try{
 for(const [language,entries] of Object.entries(notes)){
  const context=await browser.newContext({viewport:{width:320,height:568},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const slug=language.toLowerCase();
  await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${slug}-b1-1-cause-effect-production-checkpoint`);
  await page.getByRole('textbox').fill('respuesta deliberadamente incorrecta');
  assert.equal(await page.locator('.jp-learning-review').count(),0);
  assert.ok(!(await page.locator('.jp-question').innerText()).includes(entries[0].note));
  await page.getByRole('button',{name:'Comprobar',exact:true}).click();
  await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
  const panel=page.locator('.jp-learning-review');
  assert.equal(await panel.getAttribute('open'),'');
  assert.ok((await panel.innerText()).includes(entries[0].note),language);
  assert.ok((await panel.innerText()).includes('otra formulación puede ser válida'),language);
  assert.equal(await panel.locator('[data-jp-audio-key]').getAttribute('data-jp-audio-key'),entries[0].form);
  assert.equal(await page.getByRole('textbox').inputValue(),'respuesta deliberadamente incorrecta');
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,question:document.querySelector('.jp-question').clientHeight}));
  assert.ok(layout.scroll<=layout.width+1,JSON.stringify({language,...layout}));
  assert.ok(layout.question>=120,JSON.stringify({language,...layout}));
  if(language==='English')await page.screenshot({path:'/tmp/hanstory-feedback-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  assert.equal(await page.locator('.jp-learning-review').count(),0);
  if(entries[1].context)assert.ok((await page.locator('.jp-learning-context').innerText()).includes(entries[1].context));
  assert.ok(!(await page.locator('.jp-question').innerText()).includes(entries[1].form),'El dictado no debe revelar su texto en el desglose.');
  await page.getByRole('textbox').fill(entries[1].form);
  await page.getByRole('button',{name:'Comprobar',exact:true}).click();
  assert.match(await page.locator('.jp-feedback').innerText(),/¡Muy bien!/);
  await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
  assert.ok((await panel.innerText()).includes(entries[1].note),language);
  const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/b1-1-cause-effect.json`,import.meta.url),'utf8'));
  const testLesson=unit.lessons.find(lesson=>lesson.isTest),questions=testLesson.activities.filter(a=>a.answer);
  await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${testLesson.id}`);
  await page.locator('[data-jp-answer]').first().waitFor();
  for(const question of questions.slice(0,2)){
   const wrong=question.options.find(option=>option!==question.answer);
   await page.locator('[data-jp-answer]').filter({hasText:wrong}).first().click();
   await page.getByRole('button',{name:'Comprobar',exact:true}).click();
   await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
   assert.ok((await page.locator('.jp-review-contrast').innerText()).startsWith(`Elegiste «${wrong}»`),language);
   await page.getByRole('button',{name:'Continuar',exact:true}).click();
  }
  assert.deepEqual(errors,[]);
  results.push({language,wrongAnswerExplanation:true,correctAnswerExplanation:true,contextBeforeAnswer:Boolean(entries[1].context),layout,errors});
  console.log(`${language}: explicación de error/acierto, audio vinculado y diseño móvil correctos.`);
  await context.close();
 }
 fs.writeFileSync(new URL('../docs/qa_learning_feedback_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),scope:'Cuatro actividades por idioma: producción, dictado, significado y escucha. No valida pronunciación ni todo el curso.',results},null,2)+'\n');
}finally{await browser.close();}

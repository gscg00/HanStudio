import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {guidedCourseForLanguage} from '../src/guided_course_config.js';

const root=new URL('../',import.meta.url);
const languages=['English','French','German','Italian','Portuguese','Russian','Chinese','Arabic','Japanese','Korean'];
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
const results=[];

try{
  for(const language of languages){
    const definition=guidedCourseForLanguage(language);
    const courseRoot=new URL(`library/courses/${definition.directory}/`,root);
    const course=JSON.parse(fs.readFileSync(new URL('course.json',courseRoot),'utf8'));
    const firstUnit=JSON.parse(fs.readFileSync(new URL(course.units[0].manifest,courseRoot),'utf8'));
    const lesson=firstUnit.lessons.find(item=>!item.isReview&&!item.isTest);
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:568},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));

    await page.goto(`http://127.0.0.1:8080/?qa#/${definition.slug}/course`);
    assert.equal(await page.locator('.jp-app-nav').getAttribute('aria-label'),'Navegación del curso');
    const mapProgress=page.locator('.jp-progress').first();
    assert.equal(await mapProgress.getAttribute('role'),'progressbar');
    assert.equal(await mapProgress.getAttribute('aria-valuemin'),'0');
    assert.equal(await mapProgress.getAttribute('aria-valuemax'),'100');

    await page.goto(`http://127.0.0.1:8080/?qa#/${definition.slug}/course/lesson/${lesson.id}`);
    assert.equal(await page.locator('[data-jp-action="leave-lesson"]').getAttribute('aria-label'),'Salir de la lección');
    const lessonProgress=page.locator('.jp-activity .jp-progress');
    assert.equal(await lessonProgress.getAttribute('role'),'progressbar');
    assert.match(await lessonProgress.getAttribute('aria-label'),/progreso/i);

    let checked=false;
    for(const activity of lesson.activities){
      const teaching=activity.gradable===false||['lesson_intro','teach_kana','teach_concept','teach_word','teach_pattern','teach_kanji','dialogue_model'].includes(activity.type);
      if(teaching){
        await page.getByRole('button',{name:/continuar/i}).last().click();
        continue;
      }
      const answer=page.locator('[data-jp-answer]').filter({hasText:activity.answer}).first();
      if(!await answer.count())continue;
      await answer.click();
      assert.equal(await answer.getAttribute('aria-pressed'),'true');
      await page.getByRole('button',{name:'Comprobar',exact:true}).click();
      const feedback=page.locator('.jp-feedback');
      assert.equal(await feedback.getAttribute('role'),'status');
      assert.equal(await feedback.getAttribute('aria-live'),'polite');
      assert.equal(await feedback.getAttribute('aria-atomic'),'true');
      checked=true;
      break;
    }
    assert.ok(checked,`${language}: la primera lección no permitió comprobar una respuesta`);
    assert.deepEqual(errors,[]);
    results.push({language,lessonId:lesson.id,progress:true,selectionState:true,liveFeedback:true,errors});
    console.log(`${language}: progreso, selección y feedback accesibles.`);
    await context.close();
  }
  fs.writeFileSync(new URL('docs/qa_guided_accessibility.json',root),JSON.stringify({date:new Date().toISOString(),viewport:{width:320,height:568},scope:'Primera lección de cada curso; atributos y flujo por teclado/roles, no auditoría WCAG completa.',results},null,2)+'\n');
}finally{
  await browser.close();
}

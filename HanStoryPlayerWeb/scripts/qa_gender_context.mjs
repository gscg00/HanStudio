import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const cases={French:'Tu es déjà allée là-bas ?',Italian:'Sei mai stata lì?',Russian:'Ты когда-нибудь там была?'};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
  for(const [language,answer] of Object.entries(cases)){
    const page=await browser.newPage({viewport:{width:320,height:568},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const slug=language.toLowerCase();
    await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${slug}-b1-1-narrative-production-checkpoint`);
    const unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/b1-1-narrative.json`,import.meta.url),'utf8'));
    const lesson=unit.lessons.find(item=>item.id===`${slug}-b1-1-narrative-production-checkpoint`);
    for(const activity of lesson.activities){
      if(activity.type==='lesson_intro')continue;
      if(activity.type==='open_question')break;
      if(activity.type==='build_with_blocks'){
        for(const word of activity.answer.split(' '))await page.locator('[data-jp-block]').filter({hasText:new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)}).first().click();
      }else await page.getByRole('textbox').fill(activity.answer);
      await page.getByRole('button',{name:'Comprobar',exact:true}).click();
      await page.getByRole('button',{name:'Continuar',exact:true}).click();
    }
    await page.getByRole('textbox').fill(answer);
    await page.getByRole('button',{name:'Comprobar',exact:true}).click();
    assert.match(await page.locator('.jp-feedback').innerText(),/¡Muy bien!/);
    await page.getByRole('button',{name:'Ver explicación',exact:true}).click();
    const text=await page.locator('.jp-learning-review').innerText();
    // La tarjeta ya muestra la respuesta del alumno en `.jp-review-given`;
    // repetir «Respuesta aceptada» dentro de la explicación sería ruido visual.
    assert.equal(await page.locator('.jp-review-given').first().innerText(),answer);
    // En una respuesta correcta no repetimos el modelo: la explicación debe
    // aportar contexto, no volver a imprimir la respuesta aceptada.
    assert.ok(!text.includes('Modelo original de la explicación:'));
    assert.ok(text.includes('Al preguntar a una mujer'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.deepEqual(errors,[]);
    results.push({language,answer,accepted:true,genderNoteVisible:true,errors});
    await page.close();
  }
  fs.writeFileSync(new URL('../docs/qa_gender_context_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}

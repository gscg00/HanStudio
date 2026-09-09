import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resultCases} from '../tests/result_variants_cases.mjs';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
 for(const [language,answer,alternative,negative] of resultCases){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:320,height:568},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const slug=language.toLowerCase(),url=`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${slug}-b1-1-cause-effect-production-checkpoint`;
  await page.goto(url);
  await page.getByRole('textbox').fill(alternative);
  await page.getByRole('button',{name:'Comprobar',exact:true}).click();
  assert.match(await page.locator('.jp-feedback').innerText(),/¡Muy bien!/);
  await page.getByRole('button',{name:'Ver explicación',exact:true}).click();
  const panel=page.locator('.jp-learning-review');
  assert.equal(await panel.locator('.jp-review-given').first().innerText(),alternative);
  assert.ok(!(await panel.innerText()).includes('Modelo original de la explicación:'));
  assert.equal(await panel.locator('[data-jp-audio-key]').getAttribute('data-jp-audio-key'),answer);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.reload();
  await page.getByRole('textbox').fill(negative);
  await page.getByRole('button',{name:'Comprobar',exact:true}).click();
  assert.match(await page.locator('.jp-feedback').getAttribute('class'),/wrong/);
  const withoutAccents=alternative.normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC');
  const accentCase=['French','German','Italian','Portuguese'].includes(language)&&withoutAccents!==alternative;
  if(accentCase){
   await page.reload();await page.getByRole('textbox').fill(withoutAccents);
   await page.getByRole('button',{name:'Comprobar',exact:true}).click();
   assert.match(await page.locator('.jp-feedback').getAttribute('class'),/wrong/);
   await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
   assert.match(await page.locator('.jp-orthography-hint').innerText(),/acentos/);
  }
  assert.deepEqual(errors,[]);
  results.push({language,alternativeAccepted:true,negativeRejected:true,originalModelAudioLabel:true,accentCase,errors});
  console.log(`${language}: alternativa aceptada, negación rechazada y explicación/audio identificados.`);
  await context.close();
 }
 fs.writeFileSync(new URL('../docs/qa_result_variants_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),scope:'20 comprobaciones reales de UI, una aceptación y un rechazo por idioma. No se valida pronunciación.',results},null,2)+'\n');
}finally{await browser.close();}

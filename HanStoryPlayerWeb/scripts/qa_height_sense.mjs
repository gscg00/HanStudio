import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {A21_TARGETS} from '../course-authoring/a21_content.mjs';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
  for(const [language,content] of Object.entries(A21_TARGETS)){
    const slug=language.toLowerCase(),unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/a2-1-comparison.json`,import.meta.url),'utf8'));
    const lesson=unit.lessons.find(item=>item.id===`${slug}-a2-1-comparison-production-checkpoint`);
    const page=await browser.newPage({viewport:{width:320,height:568},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${lesson.id}`);
    for(const activity of lesson.activities){
      if(activity.type==='lesson_intro')continue;
      if(activity.type==='open_question'){
        assert.equal(activity.answer,content.comparison[6]);
        assert.ok((await page.locator('.jp-question').innerText()).includes('alto (altura física)'));
      }
      if(activity.type==='build_with_blocks'){
        for(const word of activity.answer.split(activity.joiner??' ')){
          const buttons=page.locator('[data-jp-block]:not(:disabled)');
          await buttons.first().waitFor({state:'visible'});
          const labels=await buttons.allTextContents();
          const index=labels.findIndex(label=>label.trim()===word);
          assert.ok(index>=0,`${language}: bloque ${word} entre ${JSON.stringify(labels)}`);await buttons.nth(index).click();
        }
      }else await page.getByRole('textbox').fill(activity.answer);
      await page.getByRole('button',{name:'Comprobar',exact:true}).click();
      assert.match(await page.locator('.jp-feedback').getAttribute('class'),/correct/);
      if(activity.type==='open_question'){
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        break;
      }
      await page.getByRole('button',{name:'Continuar',exact:true}).click();
    }
    assert.deepEqual(errors,[]);results.push({language,clarifiedPrompt:true,originalAnswerAccepted:true,errors});await page.close();
  }
  fs.writeFileSync(new URL('../docs/qa_height_sense_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}

import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
  for(const language of ['Japanese','Korean','Chinese']){
    const slug=language.toLowerCase(),unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/a1-1-people.json`,import.meta.url),'utf8'));
    const lesson=unit.lessons.find(item=>item.id===`${slug}-a11-people-02`);
    const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${lesson.id}`);
    let taught=0,answered=0;
    for(const activity of lesson.activities){
      if(activity.type==='lesson_intro')continue;
      if(activity.type==='teach_concept'){
        assert.match(await page.locator('.jp-teach-meaning').innerText(),/menor/);
        taught++;
        await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
      }else{
        const buttons=page.locator('[data-jp-answer]');
        const values=await buttons.evaluateAll(nodes=>nodes.map(node=>node.dataset.jpAnswer));
        const index=values.indexOf(activity.answer);assert.ok(index>=0);
        await buttons.nth(index).click();
        await page.getByRole('button',{name:'Comprobar',exact:true}).click();
        assert.match(await page.locator('.jp-feedback').getAttribute('class'),/correct/);
        answered++;
        await page.getByRole('button',{name:'Continuar',exact:true}).click();
      }
    }
    await page.locator('.jp-result').waitFor({state:'visible'});assert.deepEqual(errors,[]);
    results.push({language,lessonId:lesson.id,taught,answered,errors});await page.close();
  }
  fs.writeFileSync(new URL('../docs/qa_family_meanings_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}

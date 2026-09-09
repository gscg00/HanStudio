import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const notes=JSON.parse(fs.readFileSync(new URL('../course-authoring/qa_gender_notes.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
  for(const language of ['French','Italian','Russian','Arabic']){
    const slug=language.toLowerCase(),unit=JSON.parse(fs.readFileSync(new URL(`../library/courses/${language}/units/a1-1-home.json`,import.meta.url),'utf8'));
    const lesson=unit.lessons.find(item=>item.id===`${slug}-a11-home-01`);
    const page=await browser.newPage({viewport:{width:320,height:568},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:8080/?qa#/${slug}/course/lesson/${lesson.id}`);
    let teachingNotes=0,feedbackNotes=0;
    for(const activity of lesson.activities){
      if(activity.type==='lesson_intro')continue;
      const note=notes[language][activity.target||activity.audio];
      if(activity.type==='teach_concept'){
        await page.getByRole('button',{name:'Entendido · continuar',exact:true}).waitFor();
        if(note){assert.ok((await page.locator('.jp-question').innerText()).includes(note));teachingNotes++;}
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await page.getByRole('button',{name:'Entendido · continuar',exact:true}).click();
      }else{
        const buttons=page.locator('[data-jp-answer]');
        const values=await buttons.evaluateAll(nodes=>nodes.map(node=>node.dataset.jpAnswer));
        // Deliberately fail meaning questions: the explanation must also help a learner who misunderstood.
        const index=note&&activity.type==='select_translation'?values.findIndex(value=>value!==activity.answer):values.indexOf(activity.answer);
        assert.ok(index>=0);await buttons.nth(index).click();
        await page.getByRole('button',{name:'Comprobar',exact:true}).click();
        if(note){
          await page.getByRole('button',{name:/^Ver explicación(?: y modelo)?$/}).click();
          assert.ok((await page.locator('.jp-learning-review').innerText()).includes(note));feedbackNotes++;
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        }
        await page.getByRole('button',{name:'Continuar',exact:true}).click();
      }
    }
    await page.locator('.jp-result').waitFor({state:'visible'});
    assert.ok(teachingNotes>0);assert.equal(feedbackNotes,teachingNotes*2);assert.deepEqual(errors,[]);
    results.push({language,lessonId:lesson.id,teachingNotes,feedbackNotes,errors});await page.close();
  }
  fs.writeFileSync(new URL('../docs/qa_home_gender_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),scope:'Rendered notes and navigation, including deliberate wrong answers; not acoustic certification.',results},null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}

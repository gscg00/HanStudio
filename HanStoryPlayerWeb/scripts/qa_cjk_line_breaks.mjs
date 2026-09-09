import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const cases=[['japanese','jp-book1-bridge-06'],['japanese','jp-book1-bridge-01'],['chinese','chinese-b12-conditions-01'],['chinese','chinese-b12-negotiation-04']];
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'}),results=[];
try{
  for(const width of [320,390,768,962])for(const [language,lesson] of cases){
    const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:8080/?qa#/${language}/course/lesson/${lesson}`);
    const continueButton=page.getByRole('button',{name:'Entendido · continuar',exact:true});
    await continueButton.waitFor();
    if(await page.locator('.jp-target-text').count()===0)await continueButton.click();
    await page.locator('.jp-target-text').waitFor();
    const layout=await page.locator('.jp-target-text').evaluate(el=>{
      const text=el.firstChild,lines=[];
      for(let i=0;i<text.length;i++){
        const range=document.createRange();range.setStart(text,i);range.setEnd(text,i+1);
        const top=range.getBoundingClientRect().top;
        let line=lines.find(item=>Math.abs(item.top-top)<1);
        if(!line){line={top,text:''};lines.push(line);}line.text+=text.textContent[i];
      }
      return{lines:lines.map(line=>line.text),overflow:document.documentElement.scrollWidth>innerWidth+1,wordBreak:getComputedStyle(el).wordBreak};
    });
    assert.equal(layout.overflow,false,`${lesson}/${width}: overflow`);
    assert.equal(layout.wordBreak,'normal');
    for(const line of layout.lines)assert.ok(!/^[。、，！？）」』】]/u.test(line),`${lesson}/${width}: punctuation starts ${line}`);
    await continueButton.click();
    assert.deepEqual(errors,[]);
    results.push({language,lesson,width,...layout,continueAccessible:true,errors});await page.close();
  }
  fs.writeFileSync(new URL('../docs/qa_cjk_line_breaks_ui.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
  console.log(JSON.stringify({cases:results.length,passed:true}));
}finally{await browser.close();}

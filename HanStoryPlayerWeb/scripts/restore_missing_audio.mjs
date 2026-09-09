import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../library/courses');
const voices={French:'Audrey (Premium)',German:'Anna (Premium)',Korean:'Yuna (Premium)'};
for(const [language,voice] of Object.entries(voices)){
  const dir=path.join(root,language),manifestPath=path.join(dir,'audio_manifest.json');
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')),course=JSON.parse(fs.readFileSync(path.join(dir,'course.json'),'utf8')),keys=new Set();
  function visit(value){if(Array.isArray(value))return value.forEach(visit);if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){if(['audio','slow_audio'].includes(k)&&typeof v==='string'&&v.trim())keys.add(v);else visit(v);}}
  for(const ref of course.units)visit(JSON.parse(fs.readFileSync(path.join(dir,ref.manifest),'utf8')));
  let count=0;
  for(const key of keys){
    if(manifest.items[key]&&fs.existsSync(path.resolve(dir,manifest.items[key])))continue;
    const digest=createHash('sha256').update(`${language}|${voice}|${key}`).digest('hex').slice(0,24),relative=`audio/qa-${digest}.m4a`,dest=path.join(dir,relative);
    if(!fs.existsSync(dest))execFileSync('/usr/bin/say',['-v',voice,'-r','145','-o',dest,'--file-format=m4af','--data-format=aac',key],{timeout:60000});
    if(fs.statSync(dest).size<512)throw Error(`Empty synthesized audio: ${key}`);
    manifest.items[key]=relative;
    manifest.qa_generated_audio??={};manifest.qa_generated_audio[key]={voice,engine:'macOS speech synthesis',review_status:'listening_review_pending'};
    fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
    if(++count%20===0)console.log(`${language}: ${count} audios restaurados`);
  }
  console.log(`${language}: ${count} audios nuevos; revisión auditiva pendiente.`);
}

import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const coursesRoot=path.join(root,'library','courses');
const splitSlash=value=>String(value??'').split(/\s+\/\s+/u).map(item=>item.trim()).filter(Boolean);
const examplesFor=(activity,manifest)=>{
  if(activity.audio_examples?.length)return activity.audio_examples;
  const target=String(activity.target||'').trim(),audio=String(activity.audio||'').trim();
  if(!audio)return [];
  const targets=splitSlash(target),slashAudio=splitSlash(audio),spaced=audio.split(/\s+/u).filter(Boolean);
  const parts=slashAudio.length>1?slashAudio:spaced.length===targets.length?spaced:slashAudio;
  const sourceExample=String(activity.memory_hint||'').replace(/^(?:Ejemplo|Cómo se forma):\s*/iu,'').trim();
  const exampleParts=splitSlash(sourceExample);
  const item=(text,label='')=>({...(label?{label}:{}),text,audio:text,slow_audio:text,...(manifest[text]?{}:{audio_source:'tts',tts_fallback:true})});
  if(parts.length>1)return parts.map((text,index)=>item(text,targets.length===parts.length?targets[index]:''));
  if(activity.teaching_kind==='rule'&&(targets.length>1||/\//u.test(target)))return[item(exampleParts[0]||audio,target)];
  return [];
};

let unitsChanged=0,activitiesChanged=0;
for(const language of fs.readdirSync(coursesRoot)){
  const languageRoot=path.join(coursesRoot,language),coursePath=path.join(languageRoot,'course.json');
  if(!fs.existsSync(coursePath))continue;
  const manifestPath=path.join(languageRoot,'audio_manifest.json');
  const manifest=fs.existsSync(manifestPath)?(JSON.parse(fs.readFileSync(manifestPath,'utf8')).items||{}):{};
  for(const summary of JSON.parse(fs.readFileSync(coursePath,'utf8')).units||[]){
    const unitPath=path.join(languageRoot,summary.manifest);if(!fs.existsSync(unitPath))continue;
    const unit=JSON.parse(fs.readFileSync(unitPath,'utf8')),byKey=new Map(),changed=[];
    for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
      const key=`${activity.target||''}\u0000${activity.audio||''}`;
      const examples=examplesFor(activity,manifest);
      if(examples.length&&!byKey.has(key))byKey.set(key,examples);
      if(examples.length&&!activity.audio_examples?.length){activity.audio_examples=examples;changed.push(activity);}
    }
    for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
      if(activity.audio_examples?.length)continue;
      const examples=byKey.get(`${activity.target||''}\u0000${activity.audio||''}`);
      if(examples?.length){activity.audio_examples=examples;changed.push(activity);}
    }
    if(changed.length){fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');unitsChanged++;activitiesChanged+=changed.length;}
  }
}
console.log(JSON.stringify({unitsChanged,activitiesChanged}));

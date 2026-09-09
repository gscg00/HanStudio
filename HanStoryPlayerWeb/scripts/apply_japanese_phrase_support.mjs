#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PHRASE_SUPPORT_BY_LANGUAGE} from '../src/guided_phrase_metadata.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const courseRoot=path.join(root,'library','courses','Japanese');
const course=JSON.parse(fs.readFileSync(path.join(courseRoot,'course.json'),'utf8'));
const support=PHRASE_SUPPORT_BY_LANGUAGE.Japanese;
let activities=0,files=0;

for(const summary of course.units){
  const unitPath=path.join(courseRoot,summary.manifest);
  const unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));
  let changed=false;
  for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
    if(!activity.type?.startsWith('teach_'))continue;
    const metadata=support[String(activity.target||'').trim()];
    if(!metadata)continue;
    const next=JSON.stringify(metadata);
    const current=JSON.stringify({
      word_breakdown:activity.word_breakdown,
      usage_note:activity.usage_note,
      context_note:activity.context_note,
    },(_key,value)=>value===undefined?null:value);
    const normalized=JSON.stringify({
      word_breakdown:metadata.word_breakdown,
      usage_note:metadata.usage_note,
      context_note:metadata.context_note,
    },(_key,value)=>value===undefined?null:value);
    if(current===normalized)continue;
    Object.assign(activity,JSON.parse(next));
    changed=true;activities++;
  }
  if(changed){fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');files++;}
}
console.log(JSON.stringify({activities,files,phrases:Object.keys(support).length},null,2));

#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const root=path.resolve('library/courses');
const output=path.resolve('docs/qa_audio_integrity.json');
const files=[];
for(const language of await fs.readdir(root)){
 const audioDir=path.join(root,language,'audio');
 try{for(const file of await fs.readdir(audioDir)){const full=path.join(audioDir,file);const stat=await fs.stat(full);if(stat.isFile())files.push({language,file:full,size:stat.size});}}catch{}
}
const probe=file=>new Promise(resolve=>{
 const child=spawn('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nk=1:nw=1',file]);
 let stdout='';child.stdout.on('data',chunk=>stdout+=chunk);child.on('error',()=>resolve(null));child.on('close',code=>{
  const duration=Number(stdout.trim());resolve(code===0&&Number.isFinite(duration)?duration:null);
 });
});
const unreadable=[],zeroDuration=[],smallFiles=[];
let cursor=0;
await Promise.all(Array.from({length:8},async()=>{while(cursor<files.length){const item=files[cursor++];const duration=await probe(item.file);if(duration===null)unreadable.push(item.file);else if(duration<=0)zeroDuration.push(item.file);if(item.size<1024)smallFiles.push(item.file);}}));
const report={date:new Date().toISOString(),scope:'Comprueba integridad técnica con ffprobe; no evalúa pronunciación, sincronía texto-audio ni naturalidad.',checked:files.length,unreadable,zeroDuration,smallFiles};
await fs.writeFile(output,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify({checked:report.checked,unreadable:unreadable.length,zeroDuration:zeroDuration.length,smallFiles:smallFiles.length}));
if(unreadable.length||zeroDuration.length||smallFiles.length)process.exitCode=1;

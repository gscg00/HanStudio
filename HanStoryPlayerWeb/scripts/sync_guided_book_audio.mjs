#!/usr/bin/env node
import{createHash}from'node:crypto';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const webRoot=path.resolve(here,'..');
const libraryPath=path.join(webRoot,'library','library.json');

const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();

function referencedAudioKeys(courseRoot){
  const course=readJson(path.join(courseRoot,'course.json'));
  const keys=new Set();
  const visit=value=>{
    if(Array.isArray(value)){value.forEach(visit);return;}
    if(!value||typeof value!=='object')return;
    for(const[field,nested]of Object.entries(value)){
      if((field==='audio'||field==='slow_audio')&&typeof nested==='string'&&clean(nested))keys.add(clean(nested));
      else visit(nested);
    }
  };
  for(const summary of course.units||[]){
    const unitPath=path.join(courseRoot,summary.manifest);
    if(fs.existsSync(unitPath))visit(readJson(unitPath));
  }
  return keys;
}

function bookAudioIndex(language,library){
  const index=new Map();
  for(const book of library.books||[]){
    if(book.target_language!==language)continue;
    const manifestPath=path.join(webRoot,'library',book.manifest);
    if(!fs.existsSync(manifestPath))continue;
    const manifest=readJson(manifestPath);
    for(const track of manifest.tracks||[]){
      const key=clean(track.text);
      const relative=clean(track.audio_path||track.audio);
      if(!key||!relative||index.has(key))continue;
      const source=path.resolve(path.dirname(manifestPath),relative);
      if(fs.existsSync(source)&&fs.statSync(source).isFile())index.set(key,source);
    }
  }
  return index;
}

export function syncGuidedBookAudio(languages=null){
  const library=readJson(libraryPath);
  const courseDirectories=fs.readdirSync(path.join(webRoot,'library','courses'),{withFileTypes:true})
    .filter(entry=>entry.isDirectory()&&(!languages||languages.includes(entry.name)))
    .map(entry=>entry.name);
  const results=[];

  for(const language of courseDirectories){
    const courseRoot=path.join(webRoot,'library','courses',language);
    const manifestPath=path.join(courseRoot,'audio_manifest.json');
    if(!fs.existsSync(path.join(courseRoot,'course.json'))||!fs.existsSync(manifestPath))continue;
    const manifest=readJson(manifestPath);
    manifest.items||={};
    const bookAudio=bookAudioIndex(language,library);
    const audioRoot=path.join(courseRoot,'audio');
    fs.mkdirSync(audioRoot,{recursive:true});
    let reused=0;

    for(const key of referencedAudioKeys(courseRoot)){
      if(manifest.items[key])continue;
      const source=bookAudio.get(key);
      if(!source)continue;
      const extension=path.extname(source).toLocaleLowerCase()||'.mp3';
      const digest=createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,24);
      const filename=`${digest}${extension}`;
      const destination=path.join(audioRoot,filename);
      if(!fs.existsSync(destination))fs.copyFileSync(source,destination);
      manifest.items[key]=`audio/${filename}`;
      reused++;
    }

    if(reused)fs.writeFileSync(manifestPath,`${JSON.stringify(manifest,null,2)}\n`);
    results.push({language,reused});
  }
  return results;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  for(const result of syncGuidedBookAudio())console.log(`${result.language}: ${result.reused} audios de libros reutilizados`);
}

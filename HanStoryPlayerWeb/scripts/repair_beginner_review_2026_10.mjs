#!/usr/bin/env node
// Correcciones de la revisión «alumno nuevo + profesor» (2026-10-27) en las
// tarjetas de lectura de coreano y francés. Cambia cada texto en todos los
// sitios donde aparece (tarjeta, opciones y respuestas), así que las
// preguntas siguen coincidiendo. Se puede ejecutar varias veces.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const FIXES={
  'Korean/units/reading.json':{
    // «la anterior» era ㅑ en el orden de la lista: enseñaba «yya».
    'yeo; como la anterior con y':'yeo: ㅓ con «y» delante',
    // 자 y 야 quedaban con la misma etiqueta.
    'entre ch y y fuerte':'«ch» suave, sin aire',
    'ya/cha suave':'cha suave (no «ya»)',
    // Un mexicano no tiene referencia para «h aspirada».
    'h aspirada':'solo aire, como una «j» mexicana muy suave',
    'Pasa con todos los batchim: 이름이 [이르미], 음식이 [음시기]':'Pasa con casi todos los batchim: 이름이 [이르미], 음식이 [음시기]. La ㅇ final no se mueve (강아지) y la ㅎ final desaparece (좋아요 [조아요]).',
  },
  'Korean/units/hangul-foundations.json':{
    // 우유 usa ㅠ, que todavía no se ha enseñado; 아이 solo usa ㅇ, ㅏ, ㅣ.
    '우유':'아이',
    'leche':'niño',
    // 한국어 no se lee [한-국-어]: la ㄱ final pasa a la sílaba siguiente.
    'Lee cada bloque una sola vez y luego une la palabra: idioma coreano.':'Lee cada bloque una sola vez y luego une la palabra: idioma coreano. Ojo: se pronuncia [한구거]; la ㄱ final pasa a la sílaba siguiente porque esta empieza con ㅇ.',
  },
  'French/units/reading.json':{
    'E: e cerrada o sonido neutro':'E: sonido neutro, como «eu» con labios relajados (la e cerrada es É)',
    'Q: ku':'Q: kü (k + la u francesa)',
  },
};

const replaceDeep=(value,map)=>{
  if(typeof value==='string'){let out=value;for(const[from,to]of Object.entries(map))if(out.includes(from)&&!out.includes(to))out=out.split(from).join(to);return out;}
  if(Array.isArray(value))return value.map(item=>replaceDeep(item,map));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceDeep(item,map)]));
  return value;
};

for(const[file,map]of Object.entries(FIXES)){
  const full=path.join(ROOT,file),before=fs.readFileSync(full,'utf8'),after=JSON.stringify(replaceDeep(JSON.parse(before),map),null,2)+'\n';
  if(after!==before)fs.writeFileSync(full,after);
  console.log(`${file}: ${after===before?'sin cambios':'corregido'}`);
}

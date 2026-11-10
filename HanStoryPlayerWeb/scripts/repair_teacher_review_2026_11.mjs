#!/usr/bin/env node
// Correcciones de la revisión «alumno + profesor» (2026-11-09) en las unidades de
// lectura. Las respuestas de las preguntas «¿Cómo se pronuncia…?» no coincidían con
// su tarjeta (o eran falsas), y algunas pistas hablaban de otra palabra.
// «exact» cambia un texto solo cuando es el valor completo (respuestas cortas como
// «ku» aparecen dentro de otras palabras); «text» cambia el fragmento donde esté.
// Se puede ejecutar varias veces.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const LANGUAGE_NAMES=['Árabe','Inglés','Francés','Alemán','Italiano','Portugués','Ruso'];
const lowerNames=Object.fromEntries(LANGUAGE_NAMES.map(name=>[` en ${name}.`,` en ${name.toLowerCase()}.`]));

const FIXES={
  // 아이 se enseña con 아 + 이; la pista se quedó con la palabra anterior (우유).
  'Korean/units/hangul-foundations.json':{text:{'Primero separa: 우 · 유':'Primero separa: 아 · 이','우 + 유 forman 아이.':'아 + 이 forman 아이.'}},
  'Russian/units/reading.json':{exact:{
    'como la y francesa de “journal”':'como la j francesa de «journal»',
    'j española suave':'como la j mexicana de «jarro»',
  }},
  // El nombre de la H en inglés no lleva h: «eich».
  'English/units/reading.json':{exact:{'eich, con h aspirada':'eich, sin h al inicio'}},
  // きって tiene dos sílabas y tres moras: la lección trata justo de eso.
  'Japanese/units/reading-foundations.json':{text:{
    '¿Cuántas sílabas tiene «ひと»?':'¿Cuántas moras tiene «ひと»?',
    'ひ・と ocupa dos sílabas.':'ひ・と ocupa dos moras.',
    '¿Cuántas sílabas tiene きって, contando la っ pequeña?':'¿Cuántas moras tiene きって, contando la っ pequeña?',
    'きって → き・っ・て: tres sílabas.':'きって → き・っ・て: tres moras.',
  }},
  'Japanese/units/hiragana-01.json':{text:{'[senseeː]':'[sensee]'}},
  // La «ll» argentina no lleva d: se usa la misma comparación que la tarjeta.
  'Arabic/units/reading.json':{exact:{'dj, como la «ll» argentina; nunca la j española':'dj, como la j inglesa de «jeans»; nunca la j española'}},
  'French/units/reading.json':{exact:{'e cerrada o sonido neutro':'sonido neutro, como «eu» relajada','ku':'kü (k + la u francesa)'}},
  'Chinese/units/reading.json':{exact:{
    'entre yi y chi, lengua adelante':'ch suave sin aire, lengua adelante',
    'tono 2: sube, como una pregunta':'tono 2: sube de medio a alto',
    'u con puntos: es ü':'u sin puntos, pero suena ü',
  }},
  'Portuguese/units/reading.json':{exact:{'dablio':'dáblio'},text:{'W: dablio':'W: dáblio'}},
  // «Escucha el nombre de A en Inglés.» → «en inglés».
  ...Object.fromEntries(['Arabic','English','French','German','Italian','Portuguese','Russian'].map(language=>[`${language}/units/reading-foundations.json`,{text:lowerNames}])),
};

const replaceDeep=(value,{exact={},text={}})=>{
  if(typeof value==='string'){
    if(Object.hasOwn(exact,value))return exact[value];
    let out=value;
    for(const[from,to]of Object.entries(text))if(out.includes(from))out=out.split(from).join(to);
    return out;
  }
  if(Array.isArray(value))return value.map(item=>replaceDeep(item,{exact,text}));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceDeep(item,{exact,text})]));
  return value;
};

for(const[file,map]of Object.entries(FIXES)){
  const full=path.join(ROOT,file),before=fs.readFileSync(full,'utf8'),after=JSON.stringify(replaceDeep(JSON.parse(before),map),null,2)+'\n';
  if(after!==before)fs.writeFileSync(full,after);
  console.log(`${file}: ${after===before?'sin cambios':'corregido'}`);
}

#!/usr/bin/env node
// Arma los videos por tema de la pestaña Videos a partir del material que ya
// tiene cada curso (y sus audios), sin escribir contenido nuevo:
//   · Lo básico: letras y sonidos, saludos, números, colores, días, familia,
//     comida y frases para sobrevivir.
//   · Situaciones: una por cada historia ilustrada del curso.
// Escribe library/courses/<Idioma>/videos.json. Se puede volver a ejecutar.
//
//   node HanStoryPlayerWeb/scripts/build_topic_videos.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const MIN_ITEMS=4;

const norm=value=>String(value??'').normalize('NFD').replace(/\p{Mn}/gu,'').toLowerCase().replace(/[^a-z0-9ñ ]/g,'').replace(/\s+/g,' ').trim();

// Cada hueco acepta varias glosas españolas; se toma la primera que exista en el curso.
const BASICS=[
  {id:'saludos',title:'Saludos y cortesía',scene:'cafe',slots:[['hola'],['buenos dias'],['buenas noches'],['adios','hasta luego','chao','hasta pronto'],['gracias','muchas gracias'],['de nada'],['por favor'],['perdon','disculpe','perdone','disculpa','con permiso'],['lo siento'],['mucho gusto','encantado','encantada','encantado de conocerte'],['si'],['no']]},
  {id:'numeros',title:'Contar del 1 al 10',scene:'market',slots:['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'].map(word=>[word])},
  {id:'colores',title:'Los colores',scene:'park',slots:[['rojo'],['azul'],['amarillo'],['verde'],['blanco'],['negro'],['naranja','anaranjado'],['rosa','rosado'],['morado','purpura'],['marron'],['gris']]},
  {id:'dias',title:'Los días de la semana',scene:'school',slots:['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(word=>[word])},
  {id:'familia',title:'La familia',scene:'home',slots:[['familia'],['padre','papa'],['madre','mama'],['hermano'],['hermana'],['hijo'],['hija'],['abuelo'],['abuela'],['esposo','marido'],['esposa']]},
  {id:'comida',title:'Comida y bebida',scene:'restaurant',slots:[['agua'],['cafe'],['te'],['leche'],['pan'],['arroz'],['carne'],['pescado'],['huevo'],['fruta'],['manzana'],['cerveza'],['comida']]},
  {id:'sobrevivir',title:'Frases para sobrevivir',scene:'street',slots:[['no entiendo'],['mas despacio por favor','mas despacio'],['otra vez por favor','otra vez','puede repetir'],['cuanto cuesta','cuanto es'],['donde esta el bano','el bano'],['la cuenta por favor','la cuenta'],['esto por favor','quiero esto'],['ayuda','socorro'],['hablas espanol','habla espanol'],['no hablo','hablo un poco']]},
];
const SCENE_TITLES={restaurant:'En el restaurante',cafe:'En la cafetería',market:'En el mercado',shop:'En la tienda',station:'En la estación',street:'Por la calle',home:'En casa',kitchen:'En la cocina',park:'En el parque',classroom:'En clase',school:'En la escuela',office:'En la oficina'};

const meaningOf=activity=>String(activity.meaning||activity.explanation||'').trim();
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));

function courseEntries(dir,course,audio){
  // glosa normalizada → [{target,meaning,audio}] en orden del curso
  const byMeaning=new Map(),letters=[];
  for(const unit of course.units){
    const data=readJSON(path.join(dir,unit.manifest));
    for(const lesson of data.lessons||[])for(const activity of lesson.activities||[]){
      const target=String(activity.target||'').trim(),meaning=meaningOf(activity);
      if(!target||!meaning)continue;
      // Kana japonés: «Suena «ki».» en sound_hint.
      const sound=activity.type==='teach_kana'&&String(activity.sound_hint||'').match(/«([^»]+)»/u);
      if(sound&&audio[activity.audio]){if(!letters.some(item=>item.target===target))letters.push({target,meaning:sound[1],audio:activity.audio});continue;}
      // Letras: «ㄱ: entre k y g suave», «З: z sonora» en las tarjetas «Aprende y escucha».
      const letter=meaning.match(/^(.{1,4}):\s*(.{1,120})$/u);
      if(activity.type==='teach_concept'&&letter&&letter[1].trim()===target&&audio[activity.audio]){
        // En el video se dice la primera parte («entre o abierta y a»); el resto queda como nota.
        const [spoken,...rest]=letter[2].trim().split(/;\s*|\.\s+/u);
        if(!letters.some(item=>item.target===target))letters.push({target,meaning:spoken.replace(/\.$/,''),audio:activity.audio,...(rest.length?{note:rest.join('. ').replace(/\.?$/,'.')}:{})});
        continue;
      }
      if(activity.teaching_kind==='rule'||/[+→=~]/.test(target)||meaning.length>48)continue;
      const key=audio[target]?target:audio[target.replace(/[.!?。！？]+$/u,'')]?target.replace(/[.!?。！？]+$/u,''):null;
      if(!key)continue;
      // Instrucciones del ejercicio («Por favor, elija») no son vocabulario.
      if(/\b(elij|elig|escrib|selecciona|marca|toca)/i.test(meaning))continue;
      const shown=meaning.split(/[;/(]/)[0].trim().replace(/\.$/,'');
      // Primero la glosa completa; «Hola, de forma cortés» también vale para «hola», pero detrás.
      [[norm(shown),0],...(/[,、，]/u.test(target)?[]:[[norm(shown.split(/,\s/)[0]),1]])].forEach(([variant,rank])=>{
        if(!byMeaning.has(variant))byMeaning.set(variant,[]);
        const list=byMeaning.get(variant);
        if(!list.some(item=>item.target===target))list.push({target,meaning:shown,audio:key,rank});
        list.sort((a,b)=>a.rank-b.rank);
      });
    }
  }
  return {byMeaning,letters};
}

function buildLanguage(language){
  const dir=path.join(ROOT,language),course=readJSON(path.join(dir,'course.json')),audio=readJSON(path.join(dir,'audio_manifest.json')).items||{};
  const {byMeaning,letters}=courseEntries(dir,course,audio),topics=[],report=[];
  // Un video de letras no debería pasar de unas 46 tarjetas (el silabario básico japonés).
  if(letters.length>=MIN_ITEMS)topics.push({id:'letras',category:'basico',title:'Letras y sonidos',scene:'classroom',mode:'teach',items:letters.slice(0,46)});
  for(const topic of BASICS){
    const used=new Set(),items=[];
    for(const slot of topic.slots){
      const found=slot.map(gloss=>(byMeaning.get(norm(gloss))||[]).find(item=>!used.has(item.target))).find(Boolean);
      if(found){used.add(found.target);items.push({target:found.target,meaning:found.meaning,audio:found.audio});}
    }
    report.push(`${topic.id} ${items.length}/${topic.slots.length}`);
    if(items.length>=MIN_ITEMS)topics.push({id:topic.id,category:'basico',title:topic.title,scene:topic.scene,mode:'teach',items});
  }
  // Correcciones de un profesor: course-authoring/videos/<Idioma>.json puede
  // cambiar el título o la lista completa de un tema, o añadir temas nuevos.
  const overridesFile=path.join(ROOT,'..','..','course-authoring','videos',`${language}.json`);
  if(fs.existsSync(overridesFile))for(const [id,patch] of Object.entries(readJSON(overridesFile).topics||{})){
    const items=patch.items?.map(item=>{const bare=item.target.replace(/[.!?。！？]+$/u,''),key=[item.target,bare,`${bare}.`,`${bare}?`].find(candidate=>audio[candidate])||null;return{...item,...(key?{audio:key}:{})};});
    const topic={category:'basico',mode:'teach',scene:'classroom',...topics.find(item=>item.id===id),...patch,id,...(items?{items}:{})};
    const index=topics.findIndex(item=>item.id===id);
    if(index>=0)topics[index]=topic;else topics.push(topic);
  }
  // Situaciones: las historias ilustradas, línea a línea, con su traducción.
  const storyDir=path.join(dir,'stories');
  const stories=fs.existsSync(storyDir)?fs.readdirSync(storyDir).filter(name=>name.endsWith('.json')).sort():[];
  for(const name of stories)for(const story of readJSON(path.join(storyDir,name)).stories||[]){
    const lines=(story.lines||[]).filter(line=>line.text&&line.translation);
    if(lines.length<MIN_ITEMS)continue;
    topics.push({id:`historia-${story.lessonId}`,category:'situaciones',title:story.title||SCENE_TITLES[story.scene]||'Una escena',subtitle:SCENE_TITLES[story.scene]||'',scene:story.scene||'street',mode:'dialogue',items:lines.map(line=>({target:line.text,meaning:line.translation,speaker:line.speakerEs||line.speaker||'',gender:line.gender||''}))});
  }
  const PRACTICAL=['restaurant','cafe','market','shop','station','street','office'],rank=topic=>topic.category!=='situaciones'?-1:(PRACTICAL.indexOf(topic.scene)+1||99);
  topics.sort((a,b)=>rank(a)-rank(b));
  const situations=topics.filter(topic=>topic.category==='situaciones'),voiced=situations.flatMap(topic=>topic.items).filter(item=>audio[item.target]||audio[item.target.replace(/[.!?。！？]+$/u,'')]).length;
  report.push(`historias ${situations.length} (audio ${voiced}/${situations.reduce((sum,topic)=>sum+topic.items.length,0)})`);
  return {topics,report};
}

const check=process.argv.includes('--check');
for(const language of fs.readdirSync(ROOT).filter(name=>fs.existsSync(path.join(ROOT,name,'course.json'))).sort()){
  const {topics,report}=buildLanguage(language),file=path.join(ROOT,language,'videos.json');
  const json=JSON.stringify({version:1,topics},null,2)+'\n';
  if(!check)fs.writeFileSync(file,json);
  console.log(`${language.padEnd(11)} ${String(topics.length).padStart(2)} videos · letras ${topics.find(topic=>topic.id==='letras')?.items.length||0} · ${report.join(' · ')}`);
}

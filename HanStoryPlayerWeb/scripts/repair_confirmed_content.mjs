// Idempotent repairs of confirmed QA defects; preserves unrelated authored data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../library/courses');
let changed=0;
for (const language of fs.readdirSync(root)) {
  const coursePath=path.join(root,language,'course.json');
  if (!fs.existsSync(coursePath)) continue;
  const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
  for (const ref of course.units) {
    const file=path.join(root,language,ref.manifest),raw=fs.readFileSync(file,'utf8'),unit=JSON.parse(raw);
    for (const lesson of unit.lessons) {
      const translations=lesson.activities.filter(a=>a.type==='select_translation'&&a.answer).map(a=>a.answer);
      for (const a of lesson.activities) {
        if(a.id==='korean-story-bridge-test-08-10-listen') a.options=['도와주세요?','감사합니다.','네, 밖이에요.'];
        if (a.type==='select_translation' && a.options?.length<2) {
          a.options=[...new Set([a.answer,...translations.filter(v=>v!==a.answer)])].slice(0,4);
          if(a.options.length<2) throw Error(`No reviewed distractors for ${a.id}`);
        }
        if (a.type==='typed_translation' && /^Copia\b/.test(a.prompt||'')) {
          a.tags=[...new Set([...(a.tags||[]),'copying'])];
          a.allow_minor_typos=false;
          a.instruction=`Copia exactamente «${a.answer}». No escribas cómo suena ni su explicación.`;
        }
        if(a.id==='japanese-reading-foundations-production-translate') {
          a.accepted_answers=['ぱ'];
          a.explanation='ぱ se forma añadiendo el handakuten (゜) a は. Se lee pa.';
        }
        if(a.id==='japanese-reading-foundations-production-dictation') {
          a.explanation='きゃ combina き con ゃ pequeño y ocupa una mora. っ pequeño indica una pausa consonántica y ocupa otra mora; aquí copias dos grafías distintas.';
        }
        if(a.id==='japanese-reading-foundations-production-blocks') {
          a.prompt='Elige el resultado de añadir handakuten (゜) a は';
          a.target='は + ゜'; a.answer='ぱ'; a.accepted_answers=[a.answer];
          a.options=['ば','ぱ','は'];
          a.instruction='Toca el bloque que representa el resultado final.';
          a.explanation='Dakuten: か → が (ka → ga). Handakuten: は → ぱ (ha → pa).';
        }
        if(a.id==='japanese-reading-foundations-production-complete') {
          a.type='dictation'; a.answer='きゃ'; a.accepted_answers=['きゃ'];
          a.prompt='Escucha y escribe la sílaba que oyes'; a.instruction='Escribe la combinación de kana que oyes.';
          a.explanation='きゃ se lee kya y ocupa una sola mora. La ゃ pequeña se combina con き.';
        }
        if(a.id==='arabic-reading-00-11-b-teach') {
          a.audio='';a.slow_audio='';
          a.memory_hint='No ignores estas marcas al aprender.';
          a.explanation='Son signos ortográficos: no tienen una pronunciación aislada que un botón pueda reproducir.';
        }
        if(a.id==='arabic-reading-foundations-production-dictation') {
          a.audio='';a.slow_audio='';a.explanation='Copia exactamente los signos «ْ ّ».';
        }
        if(a.id==='arabic-reading-foundations-production-complete') {
          a.audio='';a.slow_audio='';
          a.prompt='Completa con los signos ortográficos practicados';
          a.instruction='Escribe exactamente «ْ ّ»; no se escuchan aislados porque no forman un sonido independiente.';
          a.explanation='Sukun y shadda cambian la estructura silábica, pero no tienen una pronunciación aislada.';
        }
      }
    }
    const next=JSON.stringify(unit,null,2)+'\n';
    if(next!==raw){fs.writeFileSync(file,next);changed++;}
  }
}
console.log(`${changed} archivos de unidades reparados.`);

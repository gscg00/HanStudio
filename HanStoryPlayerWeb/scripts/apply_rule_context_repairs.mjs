import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname),coursesRoot=path.join(root,'library','courses');
const repairs={
  English:{'short / long vowels':{note:'La vocal corta de ship y la vocal larga de sheep cambian la palabra; no basta con alargar cualquier vocal.'}},
  Japanese:{'は / へ / を':{note:'Como partículas se escriben は, へ, を pero se pronuncian wa, e, o; no las leas como ha, he, wo en estas funciones.',audio:'こんにちは・学校へ・水を',examples:[['こんにちは','こんにちは'],['学校へ','学校へ'],['水を','水を']]}},
  Chinese:{
    'b / p':{note:'En mandarín ambas son oclusivas sordas: p expulsa más aire y b no aspirada.'},
    'g / k':{note:'En mandarín k expulsa más aire y g no aspirada; la lengua permanece atrás.'},
    'j / q / x':{note:'Se articulan con la lengua adelantada: j no aspirada, q aspirada y x fricativa; no son exactamente y, ch y sh.'},
    '我喝 / 你喝':{note:'El verbo normalmente no cambia por persona: 我喝 es «yo bebo» y 你喝 es «tú bebes»; cambia el sujeto.'},
  },
  German:{'der / die / das':{note:'El artículo concuerda con el género: der masculino, die femenino y plural, das neutro; el sustantivo empieza con mayúscula.'}},
  Russian:{'В / Н / Р / С / У / Х':{note:'Son falsos amigos: В suena v, Н n, Р r, С s, У u y Х como una j suave; no como sus equivalentes latinas.'}},
  Italian:{
    'il / lo / la':{note:'Il suele ir con masculino; lo aparece ante z o s + consonante; la acompaña a nombres femeninos.',audio:'il libro / lo zaino / la casa',examples:[['il libro','il libro'],['lo zaino','lo zaino'],['la casa','la casa']]},
    'un / uno / una':{note:'Un y uno son masculinos: uno aparece ante z o s + consonante; una es femenino.',audio:'un libro / uno studente / una casa',examples:[['un libro','un libro'],['uno studente','uno studente'],['una casa','una casa']]},
  },
  French:{'le / la / les':{note:'Le y la marcan singular masculino y femenino; les marca el plural, sin distinguir género.',audio:'le livre / la maison / les livres',examples:[['le livre','le livre'],['la maison','la maison'],['les livres','les livres']]}},
};
const explicitExamples=(repair,manifest)=>repair.examples?.map(([text,audio])=>({
  text,audio,slow_audio:audio,
  ...(manifest[audio]?{}:{audio_source:'tts',tts_fallback:true}),
}))||[];
let activitiesChanged=0,unitsChanged=0;
for(const [language,languageRepairs] of Object.entries(repairs)){
  const languageRoot=path.join(coursesRoot,language),coursePath=path.join(languageRoot,'course.json');if(!fs.existsSync(coursePath))continue;
  const manifestPath=path.join(languageRoot,'audio_manifest.json'),manifest=fs.existsSync(manifestPath)?(JSON.parse(fs.readFileSync(manifestPath,'utf8')).items||{}):{};
  for(const summary of JSON.parse(fs.readFileSync(coursePath,'utf8')).units||[]){
    const unitPath=path.join(languageRoot,summary.manifest);if(!fs.existsSync(unitPath))continue;
    const unit=JSON.parse(fs.readFileSync(unitPath,'utf8'));let unitChanged=false;
    for(const lesson of unit.lessons||[])for(const activity of lesson.activities||[]){
      const key=String(activity.target||activity.answer||'').trim(),repair=languageRepairs[key];if(!repair)continue;
      const oldAnswer=activity.answer;
      const expectedExplanation=activity.type==='listening_choice'&&activity.target===''?`La forma escrita correcta es «${key}»: ${repair.note}`:repair.note;
      if(activity.explanation!==expectedExplanation){activity.explanation=expectedExplanation;unitChanged=true;activitiesChanged++;}
      if(activity.type==='select_translation'){
        activity.options=(activity.options||[]).map(option=>option===oldAnswer||option===repair.oldNote?repair.note:option);
        if(!activity.options.includes(repair.note))activity.options=[repair.note,...activity.options.filter(option=>option!==oldAnswer)];
        activity.answer=repair.note;
      }
      if(repair.audio&&manifest[repair.audio]&&activity.audio!==repair.audio){activity.audio=repair.audio;activity.slow_audio=repair.audio;unitChanged=true;activitiesChanged++;}
      if(repair.examples){const examples=explicitExamples(repair,manifest);if(JSON.stringify(activity.audio_examples||[])!==JSON.stringify(examples)){activity.audio_examples=examples;unitChanged=true;activitiesChanged++;}if(!manifest[repair.audio]&&activity.audio){activity.audio='';activity.slow_audio='';unitChanged=true;activitiesChanged++;}}
      if(repair.examples&&activity.type==='listening_choice'&&!activity.teaching_refs){const source=lesson.activities.find(candidate=>['teach_concept','teach_word','teach_pattern','teach_kanji','teach_kana'].includes(candidate.type)&&String(candidate.target||'').trim()===key);if(source){activity.teaching_refs=[source.id];unitChanged=true;activitiesChanged++;}}
    }
    if(unitChanged){fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');unitsChanged++;}
  }
}
console.log(JSON.stringify({unitsChanged,activitiesChanged}));

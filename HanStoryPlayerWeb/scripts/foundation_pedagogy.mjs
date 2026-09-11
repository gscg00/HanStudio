// Editorial repairs reviewed in the autonomous foundations walkthrough.
// Applied both to existing publications and at the end of the foundations generator.
const word=(text,meaning,label='EJEMPLO EN CONTEXTO')=>({label,text,meaning,audio:text});
const name=(text,audio)=>({label:'NOMBRE DE LA LETRA',text,meaning:`Nombre: ${audio}; no es su sonido dentro de una palabra.`,audio});
export const foundationExampleRepairs={
 English:{
  'A · /æ/':{target:'A · /æ/',examples:[name('A','ay'),word('bag','bolsa','A DENTRO DE UNA PALABRA')]},
  'A · /æ/ en cat':{target:'A · /æ/',examples:[name('A','ay'),word('bag','bolsa','A DENTRO DE UNA PALABRA')]},
  'A en cat':{target:'A en bag',examples:[word('bag','bolsa','A BREVE EN CONTEXTO')],teaching_points:['La vocal de bag /æ/ tiene un sonido distinto del nombre A /eɪ/.','No basta con acortar el nombre de la letra.','Escucha la vocal dentro de bag.']},
  'H':{examples:[word('house','casa','H CON SALIDA DE AIRE')]},
  'cat ≠ C-A-T':{target:'bag ≠ B-A-G',examples:[word('bag','bolsa','PALABRA COMPLETA')]},
 },
 German:{
  'ß':{examples:[word('Straße','calle','ß DENTRO DE UNA PALABRA')],sound_hint:'ß representa una s sorda y no es una B. No significa que debas alargar la consonante.'},
  'Strumpf':{examples:[word('Strumpf','media o calcetín')]},
  'ARbeiten':{examples:[word('arbeiten','trabajar','ACENTO EN LA PRIMERA SÍLABA')]},
 },
 Italian:{
  'casa':{examples:[word('casa','casa')]},
  'italiano':{examples:[word('italiano','italiano')]},
  'parola':{examples:[word('parola','palabra','ACENTO EN LA PENÚLTIMA SÍLABA')]},
  'l’acqua':{examples:[word('l’acqua','el agua')]},
 },
 Portuguese:{
  'e · o finales':{examples:[word('leite','leche','E FINAL EN CONTEXTO'),word('livro','libro','O FINAL EN CONTEXTO')]},
  'ch':{examples:[word('chave','llave','CH DENTRO DE UNA PALABRA')]},
  'x':{examples:[word('xícara','taza','X CON SONIDO SH'),word('próximo','próximo','X CON SONIDO S'),word('exame','examen','X CON SONIDO Z'),word('táxi','taxi','X CON SONIDO KS')]},
  'palavra':{examples:[word('palavra','palabra','ACENTO EN LA PENÚLTIMA SÍLABA')]},
 },
 Russian:{
  'мама':{examples:[word('мама','mamá')]},
  'А · Б · В':{examples:[name('А','а'),name('Б','бэ'),name('В','вэ')]},
  'В = v · Н = n · Р = r':{examples:[name('В','вэ'),name('Н','эн'),name('Р','эр')]},
  'С = s · У = u · Х = j/kh':{examples:[name('С','эс'),name('У','у'),name('Х','ха')]},
  'ж · ш · ц':{examples:[name('Ж','жэ'),name('Ш','ша'),name('Ц','цэ')]},
  'ь':{examples:[name('Ь','мягкий знак')]},
  'ъ':{examples:[name('Ъ','твёрдый знак')]},
 },
 Arabic:{
  'العربية':{examples:[]},
  'عـ ـعـ ـع ع':{examples:[name('ع','عين')]},
  'كتب':{examples:[]},
  'ا د ذ ر ز و':{examples:[]},
  'دار':{examples:[]},
  'َ ِ ُ':{examples:[word('بَ','b con a breve','FATHA SOBRE ب'),word('بِ','b con i breve','KASRA BAJO ب'),word('بُ','b con u breve','DAMMA SOBRE ب')]},
  'ا · و · ي':{examples:[word('بَا','b con a larga','ALIF: VOCAL LARGA'),word('بُو','b con u larga','WAW: VOCAL LARGA'),word('بِي','b con i larga','YA: VOCAL LARGA')]},
  'ء · أ · إ':{examples:[],explanation:'Hamza indica un breve cierre en la garganta antes de soltar el aire. No es el nombre alif; أ e إ usan alif como soporte escrito.'},
  'كِتاب':{examples:[word('كِتَاب','libro','PALABRA CON VOCALES')]},
  'كتاب':{examples:[{...word('كتاب','libro','LA MISMA PALABRA SIN MARCAS'),audio:'كِتَاب'}]},
 },
};
const moraExplanation='ゃ, ゅ y ょ pequeños se unen al kana anterior en una sola mora: きゃ cuenta una. En cambio, っ sí ocupa una mora: きって se cuenta き・っ・て, tres pulsos, sin pronunciar una u en っ.';
export function repairFoundationPedagogy(unit,language,manifest={}){
 const specs=foundationExampleRepairs[language]||{};
 if(language==='Korean')repairKoreanSequence(unit);
 for(const lesson of unit.lessons||[])for(const a of lesson.activities||[]){
  // Production has independent instructions and answer/audio mappings.
  if(a.tags?.includes('production'))continue;
  const spec=specs[a.target];
  if(spec){
   a.audio='';a.slow_audio='';
   a.audio_examples=spec.examples.map(example=>({...example,...(manifest[example.audio]?{}:{audio_source:'tts'})}));
   if(spec.target)a.target=spec.target;
   if(a.type!=='teach_concept'&&spec.target==='A en bag')a.prompt='¿La A de bag suena igual que el nombre A?';
   if(spec.explanation)a.explanation=spec.explanation;
   if(spec.sound_hint&&a.type==='teach_concept')a.sound_hint=spec.sound_hint;
   if(spec.teaching_points&&a.type==='teach_concept')a.teaching_points=[...spec.teaching_points];
  }
  if(language==='German'&&a.target==='ß'){
   a.options=a.options.map(option=>option==='Una s sorda larga'?'Una s sorda':option);
   if(a.answer==='Una s sorda larga')a.answer='Una s sorda';
  }
  if(language==='Japanese'&&a.target==='きゃ · っ'){
   a.explanation=moraExplanation;
   a.audio_examples?.forEach(example=>{if(example.text==='きって')example.meaning='Tres moras: き・っ・て. La っ ocupa un pulso antes de la consonante.';});
   if(a.type==='teach_concept'){
    a.sound_hint='ゃゅょ se combinan con el kana anterior; っ ocupa su propio pulso antes de la consonante doble.';
    a.teaching_points=['き + ゃ → きゃ: una mora.','きって → き・っ・て: tres moras.','No pronuncies っ como つ ni elimines su pulso.'];
   }else if(a.type==='select_translation'){
    a.prompt='¿Cuántas moras tiene きって, contando la っ pequeña?';
    a.options=['Dos','Tres','Cuatro'];a.answer='Tres';
    // The model counts the moras explicitly; reveal it in feedback, not in the question.
    a.audio_examples=[];
   }
  }
 }
 return unit;
}

function repairKoreanSequence(unit){
 const batchim=unit.lessons.find(l=>l.id==='korean-hangul-00-batchim');
 if(batchim&&!batchim.activities.some(a=>a.id==='korean-hangul-00-batchim-h')){
  const index=batchim.activities.findIndex(a=>a.id==='korean-hangul-00-batchim-han');
  batchim.activities.splice(index,0,{
   id:'korean-hangul-00-batchim-h',type:'teach_concept',prompt:'Conoce ㅎ antes de leer 한',
   target:'ㅎ + ㅏ = 하',answer:'',options:[],gradable:false,teaching_kind:'rule',meaning:'',
   audio:'하',slow_audio:'하',xp:2,tags:['hangul-foundations'],
   sound_hint:'ㅎ aporta una salida de aire. Escúchala con la vocal ㅏ en 하.',
   memory_hint:'Primero 하; después añadirás ㄴ debajo para formar 한.',
   explanation:'La consonante inicial ㅎ se combina con la vocal conocida ㅏ. No la leas como una h muda española.',
   teaching_points:['ㅎ: consonante inicial con salida de aire.','ㅏ: vocal ya aprendida.','하: una sola sílaba.'],
  });
 }
 for(const a of unit.lessons.flatMap(l=>l.activities)){
  if(a.id==='korean-hangul-00-consonants-ng'){
   a.target='가 · 강';a.audio='';a.slow_audio='';
   a.sound_hint='ㅇ es silenciosa al inicio; al final cierra la sílaba con un sonido nasal ng.';
   a.memory_hint='Añade ㅇ debajo de 가: ㄱ + ㅏ + ㅇ = 강.';
   a.explanation='En 아, ㅇ inicial es silenciosa. En 강, ㅇ final aporta ng: la parte posterior de la lengua cierra el paso del aire por la boca y el aire sale por la nariz.';
   a.teaching_points=['가 ya contiene ㄱ y ㅏ.','강 añade ㅇ abajo, sin crear otra sílaba.','No confundas ㅇ final con ㄴ: son consonantes diferentes.'];
   a.audio_examples=[word('가','Bloque sin consonante final.'),word('강','El mismo inicio, con ㅇ final.')];
  }
  if(a.id==='korean-hangul-00-consonants-ng-q'){
   a.audio='';a.slow_audio='';a.teaching_refs=['korean-hangul-00-consonants-ng'];
  }
 }
 const learned=new Set();
 for(const lesson of unit.lessons){
  if(!lesson.isReview&&!lesson.isTest&&!lesson.generatedProduction){
   const teaching=lesson.activities.filter(a=>a.type==='teach_concept'||a.type==='teach_word');
   lesson.activities=[...lesson.activities.filter(a=>a.type==='lesson_intro'),...teaching,
    ...lesson.activities.filter(a=>!['lesson_intro','teach_concept','teach_word'].includes(a.type))];
  }
  const current=[];
  for(const a of lesson.activities){
   if(['teach_concept','teach_word'].includes(a.type)){
    current.push(a);
    if(a.audio)learned.add(a.audio);
    for(const example of a.audio_examples||[])if(example.audio)learned.add(example.audio);
   }
   if(a.type!=='listening_choice'||!learned.has(a.answer))continue;
   const position=Math.max(0,a.options.indexOf(a.answer));
   const alternatives=[...new Set([...a.options,...current.map(a=>a.audio),...learned])]
    .filter(value=>value!==a.answer&&learned.has(value)).slice(0,2);
   alternatives.splice(Math.min(position,alternatives.length),0,a.answer);a.options=alternatives;
   const refs=current.filter(card=>a.options.includes(card.audio)).map(card=>card.id);
   if(refs.length)a.teaching_refs=refs;
  }
 }
}

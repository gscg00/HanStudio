// Correcciones críticas de la auditoría del curso de ruso
// (docs/AUDITORIA_RUSO_2026-10-27.md). Idempotente: se puede volver a
// ejecutar sin duplicar lecciones ni respuestas.
import fs from 'node:fs';

const dir=new URL('../library/courses/Russian/',import.meta.url);
const files=new Map();
const load=name=>{
  if(!files.has(name)){const url=new URL(name,dir),before=fs.readFileSync(url,'utf8');files.set(name,{url,before,data:JSON.parse(before)});}
  return files.get(name).data;
};
const unit=id=>load(`units/${id}.json`);
const allActivities=data=>data.lessons.flatMap(lesson=>lesson.activities);

// Reemplaza un texto en todos los campos de todas las actividades de una unidad.
function replaceText(data,from,to,{whole=false}={}){
  const walk=value=>{
    if(typeof value==='string')return whole?(value===from?to:value):value.split(from).join(to);
    if(Array.isArray(value))return value.map(walk);
    if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=walk(value[key]);}
    return value;
  };
  data.lessons.forEach(walk);
}

// Cambia la glosa española de una palabra en todas sus actividades
// (tarjeta, pregunta de significado, escucha, repaso y prueba).
function regloss(data,word,from,to){
  const escaped=from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const inline=new RegExp(`(^|[«:] ?)${escaped}(?=[».]|$)`,'g');
  for(const activity of allActivities(data)){
    if(![activity.target,activity.answer,activity.audio].includes(word))continue;
    for(const key of ['meaning','explanation','answer'])if(typeof activity[key]==='string')activity[key]=activity[key]===from?to:activity[key].replace(inline,`$1${to}`);
    if(Array.isArray(activity.options))activity.options=activity.options.map(option=>option===from?to:option);
  }
}

// ── Plantillas de actividades (mismo formato que el resto del curso) ──────
const teach=(id,item)=>({id,type:'teach_concept',prompt:'Aprende y escucha',target:item.target,options:[],answer:'',explanation:item.explanation||'',audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:2,gradable:false,meaning:item.meaning||'',sound_hint:item.sound||(item.stress?`Acento: ${item.stress}`:''),memory_hint:item.memory||'',teaching_points:item.points||[],group_hint:'',word_breakdown:item.breakdown||[],usage_note:item.usage||'',context_note:'',audio_examples:[]});
const placed=(answer,others,index)=>{const list=[...others];list.splice(index%3,0,answer);return list;};
const choice=(id,item,{prompt,answer,others,index})=>({id,type:'select_translation',prompt,target:item.target,options:placed(answer,others,index),answer,explanation:item.explanation||answer,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const listen=(id,item,{prompt,others,index,explanation})=>({id,type:'listening_choice',prompt,target:'',options:placed(item.target,others,index+1),answer:item.target,explanation,audio:item.audio||item.target,slow_audio:item.audio||item.target,image:null,writing_asset:null,tags:item.tags||[],xp:10});
const intro=(id,title,text)=>({id,type:'lesson_intro',prompt:title,target:'',options:[],answer:'',explanation:text,audio:'',slow_audio:'',image:null,writing_asset:null,tags:[],xp:2,gradable:false});

// kind 'sound': pregunta cómo se pronuncia; kind 'meaning': qué significa.
function itemLesson({id,title,description,introText,items,kind='meaning'}){
  const activities=[intro(`${id}-intro`,title,introText)];
  items.forEach((item,index)=>{
    const n=index+1,answer=kind==='sound'?item.sound:item.meaning;
    const pool=items.filter(other=>other!==item).map(other=>kind==='sound'?other.sound:other.meaning).filter(text=>text!==answer);
    const others=item.others||[pool[index%pool.length],pool[(index+1)%pool.length]];
    const targets=items.filter(other=>other!==item).map(other=>other.target);
    const heard=item.listenOthers||[targets[index%targets.length],targets[(index+2)%targets.length]];
    activities.push(teach(`${id}-${n}-teach`,item));
    activities.push(choice(`${id}-${n}-meaning`,item,{prompt:kind==='sound'?`¿Cómo se pronuncia «${item.target}»?`:`¿Qué significa «${item.target}»?`,answer,others,index}));
    activities.push(listen(`${id}-${n}-listen`,item,{prompt:kind==='sound'?'Escucha y elige la palabra que oyes':'Escucha y elige la palabra o frase correcta',others:heard,index,explanation:kind==='sound'?`Escuchaste «${item.target}», que se pronuncia ${answer}.`:`La forma escrita correcta es «${item.target}»: ${answer}`}));
  });
  return {id,title,description,activities};
}
const reviewLesson=({id,title,lessons,isTest=false,count})=>{
  const picked=[];for(let round=0;picked.length<count&&round<10;round++)for(const lesson of lessons){const list=lesson.activities.filter(activity=>['select_translation','listening_choice'].includes(activity.type));const activity=list[(round*2+(isTest?1:0))%list.length];if(activity&&!picked.some(item=>item.id===activity.id)&&picked.length<count)picked.push(activity);}
  const activities=picked.map((activity,index)=>({...activity,id:`${id}-${index+1}-${activity.type==='listening_choice'?'listen':'meaning'}`,options:placed(activity.answer,activity.options.filter(option=>option!==activity.answer),index*2+1)}));
  return {id,title,description:isTest?'Comprueba que dominas la unidad antes de avanzar.':'Repasa lo anterior antes de seguir.',...(isTest?{isTest:true,isUnitFinal:true,xpReward:30}:{isReview:true}),activities:[intro(`${id}-intro`,title,isTest?'Responde sin ayudas. Necesitas el porcentaje mínimo para continuar.':'Repasa sin mirar las respuestas: así se fortalece la memoria.'),...activities]};
};
const upsertLessons=(data,lessons,beforeId)=>{
  for(const lesson of lessons){
    const existing=data.lessons.findIndex(item=>item.id===lesson.id);
    if(existing>=0){data.lessons[existing]=lesson;continue;}
    const at=data.lessons.findIndex(item=>item.id===beforeId);
    data.lessons.splice(at<0?data.lessons.length:at,0,lesson);
  }
};
const appendToTest=(data,testId,lessons,count)=>{
  const test=data.lessons.find(lesson=>lesson.id===testId);
  const extra=reviewLesson({id:`${testId}-extra`,title:'',lessons,isTest:true,count}).activities.slice(1).map((activity,index)=>({...activity,id:`${testId}-new-${index+1}`}));
  test.activities=[...test.activities.filter(activity=>!activity.id.startsWith(`${testId}-new-`)),...extra];
};
const production=(id,{type,prompt,target='',answer,accepted,explanation,options,instruction})=>({id,type,prompt,target,...(instruction?{instruction}:{}),...(options?{options,joiner:' '}:{}),answer,accepted_answers:accepted||[answer],...(type==='build_with_blocks'?{}:{allow_minor_typos:false}),explanation,audio:answer,slow_audio:answer,image:null,writing_asset:null,tags:type==='build_with_blocks'?['production','blocks']:['production'],xp:type==='build_with_blocks'?15:20});

// ── C1/C2. Lectura real: acento, reducción, ensordecimiento y consonantes suaves ──
const reading=unit('reading');
const stress=itemLesson({id:'russian-reading-08',title:'Sonidos y lectura · 8 · Acento y reducción de vocales',description:'Una sílaba fuerte por palabra; О sin acento suena [а] y Е/Я sin acento suenan casi [и].',kind:'sound',introText:'Cada palabra rusa tiene una sola sílaba fuerte. En el curso la marcamos con una tilde (молоко́); en textos normales no se escribe. La О sin acento suena [а]; la Е y la Я sin acento suenan casi [и]. Por eso молоко se dice [малако́].',items:[
  {target:'молоко',sound:'[малако́]',explanation:'Solo la última О es fuerte; las otras dos, sin acento, suenan [а].',points:['молоко́: acento en la última sílaba','О átona → [а]'],others:['[молоко́]','[мо́локо]']},
  {target:'вода',sound:'[вада́]',explanation:'вода́: la О no lleva acento y suena [а].',others:['[вода́]','[во́да]']},
  {target:'хорошо',sound:'[харашо́]',explanation:'хорошо́: dos О átonas que suenan [а]. Es una de las palabras más frecuentes.',others:['[хорошо́]','[харо́шо]']},
  {target:'сестра',sound:'[систра́]',explanation:'сестра́: la Е sin acento se reduce y suena casi [и].',points:['Е átona → casi [и]'],others:['[сестра́]','[се́стра]']},
  {target:'язык',sound:'[йизы́к]',explanation:'язы́к: la Я sin acento suena casi [йи].',points:['Я átona → casi [йи]'],others:['[язы́к]','[я́зык]']},
  {target:'это',sound:'[э́та]',explanation:'э́то: el acento está en la Э y la О final suena [а].',others:['[э́то]','[эта́]']},
]});
const consonants=itemLesson({id:'russian-reading-09',title:'Sonidos y lectura · 9 · Consonantes finales, suaves y siempre duras',description:'Ensordecimiento final, signo blando y las consonantes Ж, Ш, Ц.',kind:'sound',introText:'Al final de palabra, Б Д Г В З Ж se pronuncian como П Т К Ф С Ш: хлеб suena [хлеп]. La Ь no suena, pero suaviza la consonante anterior: брат (hermano) ≠ брать (tomar). Ж, Ш y Ц son siempre duras: ши se lee [шы].',items:[
  {target:'хлеб',sound:'[хлеп]',explanation:'Б final se ensordece y suena [п].',points:['б → п · д → т · г → к','в → ф · з → с · ж → ш'],others:['[хлеб]','[хле́бэ]']},
  {target:'друг',sound:'[друк]',explanation:'Г final suena [к].',others:['[друг]','[дру́га]']},
  {target:'год',sound:'[гот]',explanation:'Д final suena [т].',others:['[год]','[го́да]']},
  {target:'день',sound:'[д’эн’]: д y н suaves',explanation:'La Е suaviza la Д y la Ь suaviza la Н. «Suave» = la lengua toca el paladar, como en «ñ», sin añadir una [i].',points:['Е, Ё, И, Ю, Я y Ь suavizan la consonante anterior','El apóstrofo ’ marca la consonante suave'],others:['[дэн]','[дэ́ни]']},
  {target:'брать',sound:'[брат’]: т suave',explanation:'La Ь suaviza la Т: брат (hermano) ≠ брать (tomar). Los infinitivos terminan en -ть.',others:['[брат]','[бра́ти]']},
  {target:'машина',sound:'[машы́на]',explanation:'Ш es siempre dura: ши se lee [шы]. Lo mismo pasa con жи [жы] y ци [цы].',points:['жи, ши, ци → [жы], [шы], [цы]'],others:['[мащи́на]','[ма́шина]']},
]});
upsertLessons(reading,[stress,consonants],'russian-reading-test-10');
appendToTest(reading,'russian-reading-test-10',[stress,consonants],6);

// ── C3. Gramática mínima de A0: быть omitido, у меня есть, conjugación y в/на ──
const essentials=unit('essentials');
const haveLesson=itemLesson({id:'russian-essentials-09',title:'Pronombres y verbos esenciales · 9 · Ser, estar y tener',description:'Быть se omite en presente; «tengo» se dice у меня есть; нет + genitivo.',introText:'En presente, «ser» y «estar» no se dicen: Я студент = Soy estudiante. Para «tener» no se usa иметь: se dice у меня есть (literalmente «junto a mí hay»). Con нет, lo que no tienes cambia de forma (genitivo): брат → нет брата.',items:[
  {target:'Я студент.',meaning:'Soy estudiante.',stress:'Я студе́нт.',points:['быть (ser/estar) se omite en presente','Я студент = yo (soy) estudiante']},
  {target:'Анна дома.',meaning:'Anna está en casa.',stress:'А́нна до́ма.',points:['Tampoco se dice «está»','дома = en casa']},
  {target:'У меня есть брат.',meaning:'Tengo un hermano.',stress:'У меня́ есть брат.',points:['у меня = junto a mí','есть = hay','«Tengo» nunca es я имею en la vida diaria']},
  {target:'У тебя есть время?',meaning:'¿Tienes tiempo?',stress:'У тебя́ есть вре́мя?',points:['у тебя = tú (informal)','у вас = usted / ustedes']},
  {target:'У меня нет брата.',meaning:'No tengo hermano.',stress:'У меня́ нет бра́та.',points:['нет + genitivo','брат → брата']},
  {target:'У меня нет времени.',meaning:'No tengo tiempo.',stress:'У меня́ нет вре́мени.',points:['время → времени (genitivo)']},
]});
haveLesson.activities.push(
  production('russian-essentials-09-production-blocks',{type:'build_with_blocks',prompt:'Arma la frase: «Tengo un hermano»',target:'Tengo un hermano.',options:['есть','брат.','У','меня'],answer:'У меня есть брат.',explanation:'У меня (junto a mí) · есть (hay) · брат (hermano).'}),
  production('russian-essentials-09-production-typed',{type:'typed_translation',prompt:'Escribe en ruso: «No tengo tiempo.»',target:'No tengo tiempo.',instruction:'Escribe la frase completa.',answer:'У меня нет времени.',accepted:['У меня нет времени.','Нет времени.'],explanation:'Con нет, время pasa a genitivo: времени.'}),
);
const usageConj='Quita -ть y añade la terminación de la persona. El pronombre casi siempre se dice.';
const presentLesson=itemLesson({id:'russian-essentials-10',title:'Pronombres y verbos esenciales · 10 · El presente: dos conjugaciones',description:'читать (1.ª: -ю, -ешь, -ет…) y говорить (2.ª: -ю, -ишь, -ит…).',introText:'Los verbos se aprenden en infinitivo (-ть). 1.ª conjugación, читать (leer): я читаю, ты читаешь, он читает, мы читаем, вы читаете, они читают. 2.ª conjugación, говорить (hablar): я говорю, ты говоришь, он говорит, мы говорим, вы говорите, они говорят.',items:[
  {target:'я читаю',meaning:'yo leo',stress:'я чита́ю',points:['читать → чита- + -ю'],usage:usageConj},
  {target:'ты читаешь',meaning:'tú lees',stress:'ты чита́ешь',points:['-ешь para ты; la Ь final no suena'],usage:usageConj},
  {target:'он читает',meaning:'él lee',stress:'он чита́ет',points:['-ет para он / она'],usage:usageConj},
  {target:'мы читаем',meaning:'nosotros leemos',stress:'мы чита́ем',points:['-ем para мы'],usage:usageConj},
  {target:'они читают',meaning:'ellos leen',stress:'они́ чита́ют',points:['-ют para они'],usage:usageConj},
  {target:'я говорю',meaning:'yo hablo',stress:'я говорю́',points:['2.ª conjugación: говорить → говор- + -ю'],usage:usageConj},
  {target:'вы говорите',meaning:'usted habla / ustedes hablan',stress:'вы говори́те',points:['-ите para вы (2.ª)','1.ª: вы читаете'],usage:usageConj},
  {target:'они говорят',meaning:'ellos hablan',stress:'они́ говоря́т',points:['-ят para они (2.ª)','1.ª: они читают'],usage:usageConj},
]});
presentLesson.activities.push(
  production('russian-essentials-10-production-typed',{type:'typed_translation',prompt:'Escribe la forma de «читать» para «ты»',target:'читать',instruction:'Escribe solo la forma conjugada.',answer:'читаешь',accepted:['читаешь','ты читаешь'],explanation:'1.ª conjugación: ты → -ешь.'}),
  production('russian-essentials-10-production-blocks',{type:'build_with_blocks',prompt:'Arma la frase: «No hablo inglés»',target:'No hablo inglés.',options:['по-английски.','говорю','Я','не'],answer:'Я не говорю по-английски.',explanation:'Я (yo) · не (no) · говорю (hablo) · по-английски (en inglés). Не va justo antes del verbo.'}),
);
const placeLesson=itemLesson({id:'russian-essentials-11',title:'Pronombres y verbos esenciales · 11 · Dónde y adónde: в / на',description:'в/на + preposicional para «dónde»; в/на + acusativo para «adónde».',introText:'Para decir dónde estás: в o на + caso preposicional (школа → в школе, стол → на столе). Para decir adónde vas: в o на + acusativo (школа → в школу). Los masculinos de cosa no cambian en acusativo: Я иду в парк.',items:[
  {target:'в школе',meaning:'en la escuela',sound:'[фшко́л’е]: в suena [ф] delante de ш',points:['школа → школе (dónde)']},
  {target:'в школу',meaning:'a la escuela',sound:'[фшко́лу]',points:['школа → школу (adónde)']},
  {target:'на столе',meaning:'sobre la mesa',stress:'на столе́',points:['стол → столе','на = sobre, en (superficies)']},
  {target:'Я живу в Мексике.',meaning:'Vivo en México.',stress:'Я живу́ в Ме́ксике.',points:['Мексика → в Мексике (dónde)','Compara: Я из Мексики (de México; genitivo tras из)']},
  {target:'Я иду в парк.',meaning:'Voy al parque.',stress:'Я иду́ в парк.',points:['парк no cambia: masculino de cosa']},
  {target:'Я дома.',meaning:'Estoy en casa.',stress:'Я до́ма.',points:['дома = en casa (forma fija)','домой = a casa']},
]});
placeLesson.activities.push(
  production('russian-essentials-11-production-typed',{type:'typed_translation',prompt:'Escribe en ruso: «Voy a la escuela.»',target:'Voy a la escuela.',instruction:'Escribe la frase completa.',answer:'Я иду в школу.',accepted:['Я иду в школу.','Иду в школу.'],explanation:'Adónde: в + acusativo, школа → школу.'}),
);
upsertLessons(essentials,[haveLesson,presentLesson,placeLesson],'russian-essentials-test-11');
appendToTest(essentials,'russian-essentials-test-11',[haveLesson,presentLesson,placeLesson],9);
// иметь existe, pero «tengo» se dice у меня есть.
for(const id of ['essentials','vocabulary'])regloss(unit(id),'иметь','tener','tener (formal; «tengo» = у меня есть)');
for(const activity of allActivities(essentials).concat(allActivities(unit('vocabulary'))))if(activity.type==='teach_concept'&&activity.target==='иметь')activity.usage_note='En la vida diaria «tengo» se dice «У меня есть…». Иметь aparece en expresiones formales: иметь право (tener derecho).';

// ── C4. «time» repetía survival: números, la hora, días, fechas, precios y edad ──
const time=unit('time');
const timeLessons=[
  itemLesson({id:'russian-time-01',title:'Números y tiempo · 1 · Decenas y centenas',description:'Del 30 al 100 y cómo se combinan.',introText:'Ya conoces del 0 al 20. Las decenas se combinan sin «y»: двадцать один = 21. Ojo: 40 es сорок (irregular) y en пятьдесят la Ь no suena.',items:[
    {target:'тридцать',meaning:'treinta',stress:'три́дцать'},{target:'сорок',meaning:'cuarenta',stress:'со́рок',points:['Irregular: no sigue el patrón de -дцать']},{target:'пятьдесят',meaning:'cincuenta',stress:'пятьдеся́т',points:['пять + десят']},{target:'сто',meaning:'cien',stress:'сто (una sola sílaba)'},{target:'двадцать один',meaning:'veintiuno',stress:'два́дцать оди́н',points:['Sin «y»: 20 + 1']}]}),
  itemLesson({id:'russian-time-02',title:'Números y tiempo · 2 · La hora: час, часа, часов',description:'La regla 1 / 2–4 / 5+ con la hora.',introText:'Tras 1 se dice час; tras 2, 3 y 4, часа; tras 5 a 20, часов. Esta regla (1 / 2–4 / 5+) sirve para casi todo lo que se cuenta: años, rublos, minutos.',items:[
    {target:'Сейчас час.',meaning:'Ahora es la una.',stress:'Сейча́с час.',points:['Para la una basta con «час»']},{target:'Два часа.',meaning:'Son las dos.',stress:'Два часа́.',points:['2–4 → часа']},{target:'Пять часов.',meaning:'Son las cinco.',stress:'Пять часо́в.',points:['5–20 → часов']},{target:'в семь часов',meaning:'a las siete',stress:'в семь часо́в',points:['в + hora = a las…']},{target:'Сколько сейчас времени?',meaning:'¿Qué hora es? (coloquial)',stress:'Ско́лько сейча́с вре́мени?',points:['Igual de común que Который час?']}]}),
  itemLesson({id:'russian-time-03',title:'Números y tiempo · 3 · «El lunes»: в понедельник',description:'Los días con в + acusativo.',introText:'Para decir cuándo ocurre algo se usa в + el día: в понедельник (el lunes). Los días en -а cambian a -у: среда → в среду. Delante de вт- se dice во: во вторник.',items:[
    {target:'в понедельник',meaning:'el lunes (cuándo)',stress:'в понеде́льник'},{target:'во вторник',meaning:'el martes (cuándo)',stress:'во вто́рник',points:['во, no в: así no chocan dos в']},{target:'в среду',meaning:'el miércoles (cuándo)',stress:'в сре́ду',points:['среда → среду']},{target:'в субботу',meaning:'el sábado (cuándo)',stress:'в суббо́ту',points:['суббота → субботу']},{target:'Какой сегодня день?',meaning:'¿Qué día es hoy?',sound:'Acento: Како́й сего́дня день? · сегодня se lee [сиво́дн’а]: la г suena [в]'}]}),
  itemLesson({id:'russian-time-04',title:'Números y tiempo · 4 · Meses y fechas',description:'«En enero» y la fecha con ordinales.',introText:'Los meses se escriben con minúscula. «En enero» = в январе (preposicional). La fecha usa el ordinal: первое мая = el 1 de mayo (literalmente «el primero de mayo»).',items:[
    {target:'в январе',meaning:'en enero',stress:'в январе́',points:['январь → в январе']},{target:'в мае',meaning:'en mayo',stress:'в ма́е',points:['май → в мае']},{target:'Какое сегодня число?',meaning:'¿Qué fecha es hoy?',stress:'Како́е сего́дня число́?'},{target:'первое мая',meaning:'el 1 de mayo',stress:'пе́рвое ма́я',points:['Ordinal + mes en genitivo']},{target:'Сегодня двадцать седьмое октября.',meaning:'Hoy es 27 de octubre.',stress:'Сего́дня два́дцать седьмо́е октября́.'}]}),
  itemLesson({id:'russian-time-05',title:'Números y tiempo · 5 · Precios: рубль, рубля, рублей',description:'La regla 1 / 2–4 / 5+ con el dinero.',introText:'La misma regla que con часов: 1 рубль, 2–4 рубля, 5–20 рублей. Para preguntar el precio: Сколько это стоит?',items:[
    {target:'один рубль',meaning:'un rublo',stress:'оди́н рубль'},{target:'два рубля',meaning:'dos rublos',stress:'два рубля́',points:['2–4 → рубля']},{target:'пять рублей',meaning:'cinco rublos',stress:'пять рубле́й',points:['5–20 → рублей']},{target:'Сколько это стоит?',meaning:'¿Cuánto cuesta esto?',stress:'Ско́лько э́то сто́ит?'},{target:'Это стоит сто рублей.',meaning:'Esto cuesta cien rublos.',stress:'Э́то сто́ит сто рубле́й.'}]}),
  itemLesson({id:'russian-time-06',title:'Números y tiempo · 6 · La edad: год, года, лет',description:'Мне двадцать лет y la regla 1 / 2–4 / 5+.',introText:'La edad se dice con la persona en dativo: Мне двадцать лет = «a mí, veinte años». 1 год, 2–4 года, 5–20 лет.',items:[
    {target:'Мне двадцать лет.',meaning:'Tengo veinte años.',stress:'Мне два́дцать лет.',points:['мне = a mí','5–20 → лет']},{target:'Ему один год.',meaning:'Él tiene un año.',stress:'Ему́ оди́н год.',points:['ему = a él','1 → год']},{target:'Ей три года.',meaning:'Ella tiene tres años.',stress:'Ей три го́да.',points:['ей = a ella','2–4 → года']},{target:'Сколько тебе лет?',meaning:'¿Cuántos años tienes?',stress:'Ско́лько тебе́ лет?',points:['тебе: a un amigo o a un niño']},{target:'Сколько вам лет?',meaning:'¿Cuántos años tiene usted?',stress:'Ско́лько вам лет?',points:['вам: trato de usted']}]}),
];
time.title='Números, horas, fechas y precios';
time.description='Decenas, la hora, los días, las fechas, los precios y la edad con la regla 1 / 2–4 / 5+.';
time.lessons=[...timeLessons.slice(0,3),reviewLesson({id:'russian-time-review-03',title:'Repaso breve 1',lessons:timeLessons.slice(0,3),count:8}),...timeLessons.slice(3),reviewLesson({id:'russian-time-review-06',title:'Repaso breve 2',lessons:timeLessons.slice(3),count:8}),reviewLesson({id:'russian-time-test-16',title:'Prueba · Números, horas, fechas y precios',lessons:timeLessons,isTest:true,count:18})];

// ── C5. «reading-bridge» también repetía survival: lectura graduada real ──
const bridge=unit('reading-bridge');
const bridgeLessons=[
  itemLesson({id:'russian-reading-bridge-01',title:'Lectura guiada · 1 · Anna',description:'Presentar a una persona con lo que ya sabes.',introText:'Vas a leer una historia breve frase a frase. Escucha, lee en voz alta y fíjate en el acento marcado en la pista de pronunciación.',items:[
    {target:'Это Анна.',meaning:'Esta es Anna.',stress:'Э́то А́нна.'},{target:'Анна из Москвы.',meaning:'Anna es de Moscú.',stress:'А́нна из Москвы́.',points:['Москва → из Москвы (genitivo tras из)']},{target:'Она студентка.',meaning:'Ella es estudiante.',stress:'Она́ студе́нтка.',points:['студент (él) / студентка (ella)','Sin «es»: быть se omite']},{target:'Она живёт в Москве.',meaning:'Ella vive en Moscú.',stress:'Она́ живёт в Москве́.',points:['Москва → в Москве (dónde)','La Ё siempre lleva el acento']},{target:'У неё есть брат.',meaning:'Ella tiene un hermano.',stress:'У неё есть брат.',points:['у неё = (junto a) ella']}]}),
  itemLesson({id:'russian-reading-bridge-02',title:'Lectura guiada · 2 · La familia',description:'Hablar de la familia de Anna.',introText:'La raya (—) sustituye a «es» entre dos sustantivos: Их мама — врач.',items:[
    {target:'Брата зовут Иван.',meaning:'Su hermano se llama Iván.',stress:'Бра́та зову́т Ива́н.',points:['Como Меня зовут: «al hermano lo llaman Iván»']},{target:'Иван работает в банке.',meaning:'Iván trabaja en un banco.',stress:'Ива́н рабо́тает в ба́нке.',points:['банк → в банке']},{target:'Их мама — врач.',meaning:'Su mamá es médica.',stress:'Их ма́ма — врач.',points:['их = su (de ellos)','La raya ocupa el lugar de «es»']},{target:'Их папа не работает.',meaning:'Su papá no trabaja.',stress:'Их па́па не рабо́тает.'},{target:'Это большая семья.',meaning:'Es una familia grande.',stress:'Э́то больша́я семья́.'}]}),
  itemLesson({id:'russian-reading-bridge-03',title:'Lectura guiada · 3 · Por la mañana',description:'La rutina: ir a pie (идти) o en transporte (ехать).',introText:'идти = ir a pie; ехать = ir en un vehículo. Fíjate en el presente: она идёт, он едет.',items:[
    {target:'Утром Анна пьёт кофе.',meaning:'Por la mañana Anna toma café.',stress:'У́тром А́нна пьёт ко́фе.',points:['пить: я пью, ты пьёшь, она пьёт']},{target:'Потом она идёт в университет.',meaning:'Después va a la universidad.',stress:'Пото́м она́ идёт в университе́т.'},{target:'Она идёт пешком.',meaning:'Va a pie.',stress:'Она́ идёт пешко́м.'},{target:'Иван едет на метро.',meaning:'Iván va en metro.',stress:'Ива́н е́дет на метро́.',points:['ехать: я еду, ты едешь, он едет']},{target:'Они не опаздывают.',meaning:'No llegan tarde.',stress:'Они́ не опа́здывают.'}]}),
  itemLesson({id:'russian-reading-bridge-04',title:'Lectura guiada · 4 · En la tienda',description:'Comprar y preguntar el precio.',introText:'Repasa la regla de los rublos: 50 → пятьдесят рублей.',items:[
    {target:'Вечером Анна идёт в магазин.',meaning:'Por la tarde Anna va a la tienda.',stress:'Ве́чером А́нна идёт в магази́н.'},{target:'Она покупает хлеб и молоко.',meaning:'Compra pan y leche.',stress:'Она́ покупа́ет хлеб и молоко́.'},{target:'Сколько стоит хлеб?',meaning:'¿Cuánto cuesta el pan?',stress:'Ско́лько сто́ит хлеб?'},{target:'Хлеб стоит пятьдесят рублей.',meaning:'El pan cuesta cincuenta rublos.',stress:'Хлеб сто́ит пятьдеся́т рубле́й.'},{target:'Вот, пожалуйста.',meaning:'Aquí tiene.',stress:'Вот, пожа́луйста.',points:['пожалуйста = por favor, de nada y «aquí tiene»']}]}),
  itemLesson({id:'russian-reading-bridge-05',title:'Lectura guiada · 5 · Una pregunta en la calle',description:'Preguntar por un lugar y agradecer.',introText:'Anna ayuda a un turista. Con un desconocido se usa вы: Извините.',items:[
    {target:'Извините, где метро?',meaning:'Disculpe, ¿dónde está el metro?',stress:'Извини́те, где метро́?'},{target:'Метро там, налево.',meaning:'El metro está allí, a la izquierda.',stress:'Метро́ там, нале́во.'},{target:'Это далеко?',meaning:'¿Está lejos?',stress:'Э́то далеко́?'},{target:'Нет, это близко.',meaning:'No, está cerca.',stress:'Нет, э́то бли́зко.'},{target:'Большое спасибо!',meaning:'¡Muchas gracias!',stress:'Большо́е спаси́бо!'}]}),
  itemLesson({id:'russian-reading-bridge-06',title:'Lectura guiada · 6 · Por la noche',description:'En casa: el objeto directo (acusativo).',introText:'El objeto directo femenino cambia -а → -у: книга → Она читает книгу.',items:[
    {target:'Вечером Анна дома.',meaning:'Por la noche Anna está en casa.',stress:'Ве́чером А́нна до́ма.'},{target:'Она читает книгу.',meaning:'Ella lee un libro.',stress:'Она́ чита́ет кни́гу.',points:['книга → книгу (acusativo)']},{target:'Иван смотрит телевизор.',meaning:'Iván ve la televisión.',stress:'Ива́н смо́трит телеви́зор.'},{target:'Мама готовит ужин.',meaning:'Mamá prepara la cena.',stress:'Ма́ма гото́вит у́жин.'},{target:'Спокойной ночи!',meaning:'¡Buenas noches! (al irse a dormir)',stress:'Споко́йной но́чи!'}]}),
];
bridge.title='Lectura guiada: un día de Anna';
bridge.description='Una historia breve en frases graduadas con acento marcado y gramática de A0.';
bridge.lessons=[...bridgeLessons.slice(0,3),reviewLesson({id:'russian-reading-bridge-review-03',title:'Repaso breve 1',lessons:bridgeLessons.slice(0,3),count:8}),...bridgeLessons.slice(3),reviewLesson({id:'russian-reading-bridge-review-06',title:'Repaso breve 2',lessons:bridgeLessons.slice(3),count:8}),reviewLesson({id:'russian-reading-bridge-test-16',title:'Prueba · Lectura guiada',lessons:bridgeLessons,isTest:true,count:18})];

// ── C5. «story-bridge» repetía saludos y números: diálogos y registro ты/вы ──
const story=unit('story-bridge');
const storyLessons=[
  itemLesson({id:'russian-story-bridge-01',title:'Puente · 1 · En la cafetería',description:'Pedir algo con cortesía.',introText:'Un diálogo corto: el camarero usa вы y tú respondes con пожалуйста.',items:[
    {target:'Добрый день!',meaning:'¡Buenas tardes! (saludo de día)',stress:'До́брый день!'},{target:'Что вы хотите?',meaning:'¿Qué desea?',stress:'Что вы хоти́те?'},{target:'Чай, пожалуйста.',meaning:'Un té, por favor.',stress:'Чай, пожа́луйста.'},{target:'С сахаром?',meaning:'¿Con azúcar?',stress:'С са́харом?',points:['с + instrumental: сахар → с сахаром']},{target:'Нет, без сахара.',meaning:'No, sin azúcar.',stress:'Нет, без са́хара.',points:['без + genitivo: сахар → без сахара']}]}),
  itemLesson({id:'russian-story-bridge-02',title:'Puente · 2 · Entre amigos (ты)',description:'Saludar y conversar de tú.',introText:'Con amigos, familia y niños se usa ты: Привет! en lugar de Здравствуйте!',items:[
    {target:'Привет! Как дела?',meaning:'¡Hola! ¿Qué tal?',stress:'Приве́т! Как дела́?',points:['Привет: informal']},{target:'Хорошо, а у тебя?',meaning:'Bien, ¿y tú?',stress:'Хорошо́, а у тебя́?'},{target:'Тоже хорошо.',meaning:'También bien.',stress:'То́же хорошо́.'},{target:'Ты говоришь по-испански?',meaning:'¿Hablas español?',stress:'Ты говори́шь по-испа́нски?',points:['ты говоришь (2.ª conjugación)']},{target:'Да, немного.',meaning:'Sí, un poco.',stress:'Да, немно́го.'}]}),
  itemLesson({id:'russian-story-bridge-03',title:'Puente · 3 · En la calle (вы)',description:'Pedir indicaciones a un desconocido.',introText:'Con desconocidos se usa вы y el imperativo en -ите: Скажите, Идите.',items:[
    {target:'Скажите, пожалуйста, где вокзал?',meaning:'Dígame, por favor, ¿dónde está la estación?',stress:'Скажи́те, пожа́луйста, где вокза́л?'},{target:'Идите прямо, потом направо.',meaning:'Siga recto y luego a la derecha.',stress:'Иди́те пря́мо, пото́м напра́во.'},{target:'Это далеко отсюда?',meaning:'¿Está lejos de aquí?',stress:'Э́то далеко́ отсю́да?'},{target:'Минут десять пешком.',meaning:'Unos diez minutos a pie.',stress:'Мину́т де́сять пешко́м.',points:['Invertir número y sustantivo = «unos…, más o menos»']},{target:'Не за что.',meaning:'De nada.',sound:'Acento: Не́ за что. Se dice de corrido: [н’е́зашта]'}]}),
  itemLesson({id:'russian-story-bridge-04',title:'Puente · 4 · ¿Ты o вы?',description:'Elegir el tratamiento correcto.',introText:'Вы: desconocidos, personas mayores, trabajo y siempre para varias personas. Ты: amigos, familia, niños. Si un ruso te propone «Давай на ты», ya puedes tutearlo.',items:[
    {target:'Как тебя зовут?',meaning:'¿Cómo te llamas?',stress:'Как тебя́ зову́т?',points:['тебя: ты','Formal: Как вас зовут?']},{target:'Давай на «ты»!',meaning:'¡Hablémonos de tú!',stress:'Дава́й на «ты»!'},{target:'Вы не знаете, где банк?',meaning:'¿Sabe usted dónde está el banco?',stress:'Вы не зна́ете, где банк?',points:['Pregunta cortés con не: «¿no sabe…?»']},{target:'Извини!',meaning:'¡Perdona! (de tú)',stress:'Извини́!'},{target:'Извините!',meaning:'¡Disculpe! (de usted)',stress:'Извини́те!',points:['-те añade cortesía o plural']}]}),
];
story.title='Puente: diálogos y trato de tú o usted';
story.description='Diálogos breves para pedir, saludar, orientarse y elegir entre ты y вы.';
story.lessons=[...storyLessons.slice(0,3),reviewLesson({id:'russian-story-bridge-review-03',title:'Repaso breve',lessons:storyLessons.slice(0,3),count:8}),storyLessons[3],reviewLesson({id:'russian-story-bridge-test-08',title:'Prueba · Puente hacia las historias',lessons:storyLessons,isTest:true,count:16})];

const course=load('course.json');
for(const data of [time,bridge,story]){
  const entry=course.units.find(item=>item.id===data.id);
  Object.assign(entry,{title:data.title,description:data.description});
  data.reward.badge=data.title;
}

// ── C6. Traducciones y registro erróneos ─────────────────────────────────
replaceText(unit('a1-1-identity'),'Hablo un poco de este idioma.','Hablo un poco de ruso.');
for(const activity of allActivities(unit('a1-1-identity')))if(activity.type==='teach_concept'&&activity.target==='Пожалуйста.')activity.usage_note='Пожалуйста significa «por favor», pero también «de nada» (respuesta a спасибо) y «aquí tiene».';
replaceText(unit('a1-1-people'),'¿Cuántos años tienes?','¿Cuántos años tiene?');
for(const activity of allActivities(unit('a1-1-people')))if(activity.type==='teach_concept'&&activity.target==='Сколько вам лет?')activity.usage_note='Вам = usted (formal). A un amigo o a un niño: «Сколько тебе лет?».';
replaceText(unit('a1-2-weather'),'Lleva un paraguas.','Lleve un paraguas.');
replaceText(unit('a2-1-ability'),'Debes mostrar tu pasaporte.','Debe mostrar su pasaporte.');
for(const id of ['a2-1-ability','a2-2-workStudy']){
  replaceText(unit(id),'Aquí se puede tomar fotos.','Aquí se pueden tomar fotos.');
  regloss(unit(id),'нужно','necesitar','hace falta, es necesario');
}
replaceText(unit('a1-2-time'),'Llego a las ocho.','Llegaré a las ocho.');
for(const activity of allActivities(unit('a1-2-time')))if(activity.type==='teach_concept'&&activity.target==='Я приеду в восемь.')activity.usage_note='Приеду es futuro (perfectivo): «llegaré». En presente sería «Я приезжаю в восемь».';
regloss(unit('a1-2-social'),'время','hora','tiempo');
const health=unit('a1-2-health');
replaceText(health,'Где есть аптека?','Где здесь аптека?');
// El paciente no dice la frase del médico: en el diálogo y en la práctica oral dice lo que le duele.
for(const activity of allActivities(health)){
  if(activity.id==='russian-a1-2-health-production-speak')Object.assign(activity,{prompt:'Di en voz alta: «У меня болит голова.»',target:'Me duele la cabeza.',answer:'У меня болит голова.',accepted_answers:['У меня болит голова.'],explanation:'El modelo es «У меня болит голова.». También puedes escribirlo.',audio:'У меня болит голова.',slow_audio:'У меня болит голова.'});
  if(activity.id==='russian-a1-2-health-production-dialogue'){
    const [,,model,learner]=activity.turns;
    model.translation='Quieres expresar: «Me duele la cabeza.».';
    Object.assign(learner,{prompt:'Di o escribe en ruso: «Me duele la cabeza.»',answer:'У меня болит голова.',accepted_answers:['У меня болит голова.'],audio:'У меня болит голова.'});
  }
}
const vocabulary=unit('vocabulary');
for(const [from,to] of [
  ['Какой у тебя возраст? — ¿Qué edad tienes?','Сколько тебе лет? — ¿Cuántos años tienes?'],
  ['У меня есть боль. — Tengo dolor.','Мне больно. — Me duele.'],
  ['Как твоё имя? — ¿Cómo te llamas?','Моё имя — Анна. — Mi nombre es Anna. (Para presentarse se dice «Меня зовут…».)'],
])replaceText(vocabulary,from,to);

// ── C7. Producción: variantes correctas y diálogos con margen ────────────
const accepted={
  'Ключ лежит на столе.':['Ключ на столе.'],
  'Я встаю в семь часов.':['Я встаю в семь.','Я встаю в 7 часов.','Я встаю в 7.','Встаю в семь часов.'],
  'Утром я пью чай.':['Я пью чай утром.','Я утром пью чай.'],
  'Я хочу немного риса.':['Хочу немного риса.'],
  'Вокзал слева.':['Вокзал находится слева.','Вокзал налево.'],
  'Я иду в школу.':['Иду в школу.'],
  'Я приеду в восемь.':['Я приеду в 8.','Я буду в восемь.','Я приду в восемь.'],
  'Можно оплатить картой?':['Можно заплатить картой?','Можно платить картой?'],
  'У меня только наличные.':['У меня есть только наличные.'],
  'Где встретимся?':['Где мы встретимся?','Где встречаемся?'],
  'У меня есть время после шести.':['У меня есть время после 6.','Я свободен после шести.','Я свободна после шести.'],
  'Мне нужно сделать пересадку?':['Нужно сделать пересадку?','Мне надо сделать пересадку?'],
  'У меня аллергия на пенициллин.':['У меня есть аллергия на пенициллин.'],
  'У меня болит голова.':['У меня голова болит.','Голова болит.'],
  // Variantes femeninas del pasado
  'Я не смог найти ключи.':['Я не смогла найти ключи.'],
  'Однажды я опоздал на поезд.':['Однажды я опоздала на поезд.'],
  'Тогда я понял свою ошибку.':['Тогда я поняла свою ошибку.'],
  'Я бы согласился, если бы ты всё объяснил.':['Я бы согласилась, если бы ты всё объяснил.'],
};
const FREE_TYPES=new Set(['typed_translation','speak_and_transcribe','open_question','dictation','complete_without_options']);
// Muchos rusos escriben е en lugar de ё: se acepta también.
const withoutYo=text=>text.replaceAll('ё','е').replaceAll('Ё','Е');
const widen=target=>{
  const base=target.accepted_answers||[target.answer];
  // En un dictado solo vale lo que se oye; las demás variantes son de producción libre.
  const extra=target.type==='dictation'?[]:accepted[target.answer]||[];
  const all=[...base,...extra];
  target.accepted_answers=[...new Set([...all,...all.filter(text=>/[ёЁ]/.test(text)).map(withoutYo)])];
};
for(const id of course.levels.flatMap(level=>level.unitIds)){
  for(const activity of allActivities(unit(id))){
    if(FREE_TYPES.has(activity.type)&&activity.answer)widen(activity);
    if(activity.turns){
      activity.turns.filter(turn=>turn.role==='learner').forEach(widen);
      const learners=activity.turns.filter(turn=>turn.role==='learner').length;
      if(learners>=3)activity.minimum_correct=learners-1;
    }
  }
}

// ── Guardar ────────────────────────────────────────────────────────────
const changed=[];
for(const [name,file] of files){
  const after=JSON.stringify(file.data,null,2)+'\n';
  if(after!==file.before){fs.writeFileSync(file.url,after);changed.push(name);}
}
console.log(JSON.stringify({changed},null,1));

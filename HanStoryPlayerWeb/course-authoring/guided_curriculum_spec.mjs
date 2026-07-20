// Fuente de autoría local. No se incluye en el artefacto público.
// Ningún texto de este archivo debe enviarse a un proveedor externo hasta que
// el inventario de audio haya sido aprobado expresamente.

export const LANGUAGES=Object.freeze([
  'English','Korean','Russian','Italian','French',
  'German','Japanese','Chinese','Portuguese','Arabic',
]);

export const CONTENT_CONTRACT=Object.freeze({
  unitsPerStage:6,
  lessonsPerUnit:7,
  teachingLessonsPerUnit:4,
  reviewsPerUnit:2,
  testsPerUnit:1,
  newWordsPerUnit:8,
  newExpressionsPerUnit:4,
  newSentencesPerUnit:4,
  audioPromptsPerUnit:16,
  minimumNewAudioPromptsPerUnit:8,
  passingScore:85,
  rule:'Una unidad puede recuperar vocabulario anterior, pero al menos ocho audios deben ser nuevos para el curso. Un audio repetido nunca cuenta de nuevo como contenido nuevo.',
});

export const STAGES=Object.freeze([
  {
    id:'a1-1',label:'ETAPA 2 · A1.1',title:'Primeras conversaciones',
    objective:'Presentarte, comprender intercambios previsibles y resolver necesidades inmediatas.',
    units:[
      ['identity','Identidad y saludos','Saludar, presentarte, preguntar el nombre y despedirte.'],
      ['people','Familia y personas','Identificar personas, relaciones, edad y ocupaciones básicas.'],
      ['home','Casa y pertenencias','Nombrar objetos, expresar posesión y localizar cosas.'],
      ['routine','Rutina diaria','Hablar de acciones frecuentes, horarios y hábitos.'],
      ['food','Comida y bebida','Pedir, aceptar, rechazar y expresar preferencias básicas.'],
      ['places','Lugares y direcciones','Preguntar dónde está algo y comprender indicaciones sencillas.'],
    ],
  },
  {
    id:'a1-2',label:'ETAPA 3 · A1.2',title:'Vida diaria y autonomía',
    objective:'Actuar con autonomía en compras, transporte, salud y encuentros cotidianos.',
    units:[
      ['shopping','Compras y precios','Preguntar precios, cantidades, tallas y pagar.'],
      ['time','Fechas, horas y citas','Concertar una cita y hablar de días, horas y frecuencia.'],
      ['transport','Transporte y trayectos','Comprar billetes, entender rutas y explicar un destino.'],
      ['health','Cuerpo y necesidades','Describir síntomas sencillos y pedir ayuda.'],
      ['weather','Clima y ropa','Hablar del tiempo y elegir ropa apropiada.'],
      ['social','Invitaciones y planes','Invitar, aceptar, rechazar y proponer una alternativa.'],
    ],
  },
  {
    id:'a2-1',label:'ETAPA 4 · A2.1',title:'Planes, tiempo y decisiones',
    objective:'Conectar pasado, presente y futuro en conversaciones cotidianas.',
    units:[
      ['past','Lo que pasó','Narrar actividades y experiencias pasadas en orden.'],
      ['future','Planes y futuro','Expresar intención, predicción y planes acordados.'],
      ['comparison','Describir y comparar','Comparar personas, lugares, objetos y opciones.'],
      ['ability','Capacidad y obligación','Expresar capacidad, permiso, necesidad y prohibición.'],
      ['services','Servicios y problemas','Explicar un problema y negociar una solución.'],
      ['conversation','Conversaciones conectadas','Mantener intercambios de varias intervenciones.'],
    ],
  },
  {
    id:'a2-2',label:'ETAPA 5 · A2.2',title:'Descripción y resolución',
    objective:'Dar opiniones sencillas, explicar razones y desenvolverte en contextos menos previsibles.',
    units:[
      ['opinions','Opiniones y razones','Expresar acuerdo, desacuerdo, causa y preferencia.'],
      ['experiences','Viajes y experiencias','Contar una experiencia y reaccionar a la de otra persona.'],
      ['work-study','Trabajo y estudio','Describir responsabilidades, objetivos y dificultades.'],
      ['technology','Tecnología y comunicación','Resolver problemas digitales y comunicarte a distancia.'],
      ['culture','Costumbres y cultura','Describir normas sociales, celebraciones y diferencias.'],
      ['problem-solving','Resolver imprevistos','Comprender un problema, proponer y evaluar soluciones.'],
    ],
  },
  {
    id:'b1-1',label:'ETAPA 6 · B1.1',title:'Narración y razones',
    objective:'Narrar con claridad, justificar ideas y comprender textos conectados.',
    units:[
      ['narrative','Narraciones conectadas','Organizar antecedentes, hechos y desenlace.'],
      ['cause-effect','Causas y consecuencias','Explicar por qué ocurrió algo y qué produjo.'],
      ['media','Historias, cine y medios','Resumir una obra y comentar personajes o acontecimientos.'],
      ['emotions','Relaciones y emociones','Expresar reacciones, conflictos, consejos y cambios.'],
      ['society','Sociedad y entorno','Hablar de comunidad, medio ambiente y vida urbana.'],
      ['register','Registro y cortesía','Adaptar peticiones y opiniones a situaciones formales e informales.'],
    ],
  },
  {
    id:'b1-2',label:'ETAPA 7 · B1.2',title:'Puente hacia la independencia',
    objective:'Leer, escuchar, resumir e inferir con apoyo reducido antes de continuar con historias.',
    units:[
      ['reading','Lectura graduada','Comprender párrafos y escenas sin traducir cada palabra.'],
      ['listening','Escucha extendida','Seguir conversaciones y relatos de mayor duración.'],
      ['inference','Inferencia por contexto','Deducir vocabulario, intención y relaciones entre ideas.'],
      ['retelling','Resumir y volver a contar','Seleccionar información importante y reformularla.'],
      ['discussion','Opinión y discusión','Defender una postura con ejemplos y matices básicos.'],
      ['story-bridge','Puente final a Historias','Integrar lectura, escucha, vocabulario y gramática en una mini historia.'],
    ],
  },
]);

export const LANGUAGE_FOCUS=Object.freeze({
  English:{
    'a1-1':['be y pronombres sujeto','have y posesivos','presente simple','artículos y plurales','there is/are','preguntas con wh-'],
    'a1-2':['can y could','would like','preposiciones de tiempo y lugar','imperativos','contables e incontables','presente continuo'],
    'a2-1':['pasado simple','going to y will','comparativos y superlativos','must/have to/may','formas interrogativas','conectores de secuencia'],
    'a2-2':['present perfect inicial','first conditional','gerundio e infinitivo','oraciones relativas básicas','phrasal verbs frecuentes','because/so/although'],
    'b1-1':['pasado continuo y narrativa','present perfect frente a pasado','condicionales 0–2','pasiva inicial','reported speech inicial','modales de deducción'],
    'b1-2':['conectores discursivos','pasiva en tiempos frecuentes','estilo indirecto','relative clauses','matizar opinión','registro formal e informal'],
  },
  Korean:{
    'a1-1':['이에요/예요','은/는 e 이/가','있어요/없어요','presente cortés -아요/어요','을/를','preguntas 뭐/누구/어디'],
    'a1-2':['주세요','-(으)세요','에/에서','하고/와/과','안 y 못','-(으)ㄹ까요'],
    'a2-1':['-았/었어요','-(으)ㄹ 거예요','-고 싶어요','-(으)ㄹ 수 있어요','-아/어야 해요','-아/어도 돼요'],
    'a2-2':['-아/어 본 적이 있어요','보다 y 더','-지만','-(으)니까','-고 있어요','-아/어서'],
    'b1-1':['-는데/은데','-다고 하다','-(으)려고 하다','-게 되다','-(으)면','-는 동안'],
    'b1-2':['niveles de cortesía','conectores narrativos','modificadores de sustantivo','discurso indirecto','matices de partículas','lectura sin romanización'],
  },
  Russian:{
    'a1-1':['género y número','pronombres personales','presente sin cópula','caso nominativo','tener con у меня есть','preguntas кто/что/где'],
    'a1-2':['acusativo básico','preposicional con в/на','imperativos frecuentes','verbos de movimiento básicos','genitivo con нет','aspecto como reconocimiento'],
    'a2-1':['pasado por género','futuro compuesto','comparativos','dativo básico','modales можно/нужно/нельзя','movimiento идти/ехать'],
    'a2-2':['aspecto perfectivo e imperfectivo','instrumental básico','verbos reflexivos','prefijos de movimiento','conectores потому что/поэтому','pronombres indefinidos'],
    'b1-1':['aspecto en narración','gerundios frecuentes como reconocimiento','oraciones relativas который','discurso indirecto','condicional бы','participios frecuentes como lectura'],
    'b1-2':['orden informativo','matices de aspecto','registro y cortesía','conectores complejos','reducción vocálica en escucha','lectura cirílica fluida'],
  },
  Italian:{
    'a1-1':['essere y avere','artículos y género','presente regular','c’è/ci sono','posesivos','preguntas chi/cosa/dove'],
    'a1-2':['volere/potere/dovere','preposiciones simples','partitivos','imperativo básico','verbos reflexivos','presente progresivo'],
    'a2-1':['passato prossimo','futuro semplice','comparativos','pronombres directos','ci y ne iniciales','conectores temporales'],
    'a2-2':['imperfetto frente a passato prossimo','pronombres indirectos','condizionale presente','relativos che/cui','si impersonale','porque quindi però'],
    'b1-1':['narración con tiempos pasados','congiuntivo presente frecuente','periodo ipotetico básico','discurso indirecto','pronombres combinados','conectores argumentativos'],
    'b1-2':['congiuntivo en opinión','pasiva y si passivante','registro formal','cohesión textual','expresiones idiomáticas frecuentes','lectura autónoma'],
  },
  French:{
    'a1-1':['être y avoir','artículos y género','presente regular','il y a','posesivos','preguntas qui/que/où'],
    'a1-2':['vouloir/pouvoir/devoir','preposiciones','partitivos','imperativo','verbos pronominales','futur proche'],
    'a2-1':['passé composé','futur simple inicial','comparativos','pronombres directos','y y en iniciales','preguntas con inversión básica'],
    'a2-2':['imparfait frente a passé composé','pronombres indirectos','conditionnel de politesse','relativos qui/que/où','negaciones ampliadas','parce que/donc/pourtant'],
    'b1-1':['narración en pasado','subjonctif frecuente','hipótesis con si','discurso indirecto','dobles pronombres','conectores argumentativos'],
    'b1-2':['subjonctif en opinión','voz pasiva','registro formal','cohesión y referentes','liaison en escucha','lectura sin apoyo constante'],
  },
  German:{
    'a1-1':['sein y haben','género y artículos','presente','verbo en posición 2','acusativo inicial','preguntas wer/was/wo'],
    'a1-2':['verbos modales','dativo inicial','preposiciones separables','imperativo','verbos separables','es gibt'],
    'a2-1':['Perfekt','futuro con werden','comparativos','acusativo frente a dativo','subordinadas con weil','orden temporal-modal-local'],
    'a2-2':['Präteritum de modales','preposiciones de dos casos','relativos iniciales','Konjunktiv II de cortesía','verbos reflexivos','dass/ob/wenn'],
    'b1-1':['narración Perfekt/Präteritum','subordinadas encadenadas','pasiva inicial','discurso indirecto como reconocimiento','infinitivo con zu','conectores argumentativos'],
    'b1-2':['declinación adjetival funcional','pasiva en varios tiempos','registro formal','partículas modales frecuentes','cohesión textual','lectura de compuestos'],
  },
  Japanese:{
    'a1-1':['です/ではありません','は/が','これ/それ/あれ','の y も','を/に/で/へ','preguntas sin rōmaji'],
    'a1-2':['verbos ます','あります/います','adjetivos い y な','ください','てください','contadores iniciales'],
    'a2-1':['pasado ました/かった','intención つもり/予定','comparación より/ほうが','ことができる','てもいい/てはいけない','forma て'],
    'a2-2':['経験 たことがある','と思います','から/ので','たり～たり','ながら','adjetivos y nominalización の'],
    'b1-1':['forma casual y registro','と言う','ようになる','ために','なら/たら/と','modificadores relativos'],
    'b1-2':['conectores narrativos','matices は/が','lectura con furigana opcional','kanji contextual','elipsis en conversación','lectura sin rōmaji'],
  },
  Chinese:{
    'a1-1':['orden SVO','是 y 不是','有 y 没有','吗 y 呢','clasificadores 个/本/杯','preguntas 谁/什么/哪儿'],
    'a1-2':['想/要/会/能/可以','在 como ubicación','给 y 请','números y clasificadores','了 como cambio inicial','pinyin solo como apoyo'],
    'a2-1':['了 en acción completada','要/会 para futuro','比 y 最','应该/得/可以','从…到…','先…然后…'],
    'a2-2':['过 como experiencia','正在/着','因为…所以…','虽然…但是…','把 inicial','complementos de resultado'],
    'b1-1':['secuencia narrativa','被 inicial','越来越','除了…以外','一边…一边…','discurso referido'],
    'b1-2':['conectores escritos frecuentes','complementos direccionales','matices aspectuales','registro cortés','caracteres por contexto','pinyin oculto por defecto'],
  },
  Portuguese:{
    'a1-1':['ser y estar','artículos y género','presente','ter y haver','posesivos','preguntas quem/o quê/onde'],
    'a1-2':['querer/poder/dever','preposiciones y contracciones','partitivos y cantidades','imperativo','verbos reflexivos','estar a + infinitivo'],
    'a2-1':['pretérito perfeito','ir + infinitivo','comparativos','pronombres objeto frecuentes','por y para','conectores temporales'],
    'a2-2':['pretérito imperfeito','condicional de cortesía','relativos que/onde','se impessoal','gerundio brasileño como reconocimiento','porque/por isso/apesar de'],
    'b1-1':['narración de pasados','subjuntivo presente frecuente','hipótesis com se','discurso indirecto','colocación pronominal funcional','conectores argumentativos'],
    'b1-2':['subjuntivo en opinión','pasiva','registro europeo y brasileño','cohesión textual','reducciones en escucha','lectura autónoma'],
  },
  Arabic:{
    'a1-1':['frase nominal','género y número','pronombres independientes','posesión con عندي','artículo ال','preguntas من/ما/أين'],
    'a1-2':['presente básico','preposiciones','negación لا/ما','imperativo frecuente','demostrativos','números y concordancia inicial'],
    'a2-1':['pasado básico','futuro سـ/سوف','comparación أفعل','poder/deber/necesitar','idafa funcional','conectores ثم/بعد ذلك'],
    'a2-2':['formas verbales frecuentes','pronombres sufijos','كان y pasado descriptivo','porque لذلك ولكن','relativos الذي/التي','registro estándar y variación oral'],
    'b1-1':['narración conectada','causa y resultado','pasiva como reconocimiento','condicional إذا/لو','discurso referido','plurales irregulares frecuentes'],
    'b1-2':['cohesión escrita','vocales cortas por contexto','registro formal','raíces y patrones','escucha de variantes controladas','lectura árabe conectada'],
  },
});

export function validateCurriculumSpec(){
  if(STAGES.length!==6)throw new Error('Se esperaban seis etapas posteriores a A0.');
  for(const stage of STAGES){
    if(stage.units.length!==CONTENT_CONTRACT.unitsPerStage)throw new Error(`${stage.id}: unidades incompletas`);
  }
  for(const language of LANGUAGES){
    const focus=LANGUAGE_FOCUS[language];
    if(!focus)throw new Error(`Falta enfoque específico: ${language}`);
    for(const stage of STAGES){
      if((focus[stage.id]||[]).length!==stage.units.length)throw new Error(`${language}/${stage.id}: enfoque incompleto`);
    }
  }
  return true;
}

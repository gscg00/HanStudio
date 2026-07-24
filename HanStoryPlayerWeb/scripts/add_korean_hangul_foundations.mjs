#!/usr/bin/env node
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const root=path.join(web,'library','courses','Korean');
const unitPath=path.join(root,'units','hangul-foundations.json');
const coursePath=path.join(root,'course.json');

const activity=(id,type,prompt,target='',options=[],answer='',explanation='',audio='',extra={})=>({
  id,type,prompt,target,options,answer,explanation,audio,slow_audio:audio,
  image:null,writing_asset:null,tags:['hangul-foundations'],xp:extra.gradable===false?2:10,
  ...extra,
});
const intro=(lessonId,title,explanation)=>activity(
  `${lessonId}-intro`,'lesson_intro',title,'',[],'',explanation,'',{gradable:false},
);
const rule=(id,prompt,target,{audio='',sound='',memory='',explanation='',points=[]})=>activity(
  id,'teach_concept',prompt,target,[],'',explanation,audio,{
    gradable:false,meaning:'',teaching_kind:'rule',sound_hint:sound,
    memory_hint:memory,teaching_points:points,
  },
);
const choice=(id,prompt,target,options,answer,explanation,audio='')=>activity(
  id,'select_translation',prompt,target,options,answer,explanation,audio,
);
const listen=(id,prompt,options,answer,explanation,audio)=>activity(
  id,'listening_choice',prompt,'',options,answer,explanation,audio,
);
const word=(id,target,meaning,audio,points)=>activity(
  `${id}-teach`,'teach_word','Lee por bloques',target,[],'',`Lee cada bloque una sola vez y luego une la palabra: ${meaning}.`,audio,{
    gradable:false,meaning,sound_hint:`Primero separa: ${points.join(' · ')}`,
    memory_hint:`Después une los bloques sin añadir vocales: ${target}.`,
    teaching_points:[`${points.join(' + ')} forman ${target}.`,`Significa «${meaning}».`],
  },
);

const lessons=[
  {
    id:'korean-hangul-00-system',
    title:'Qué es el hangeul',
    description:'Comprende el sistema antes de memorizar letras.',
    activities:[
      intro('korean-hangul-00-system','Antes de las letras','Primero entenderás cómo funciona la escritura coreana. Aquí no tienes que adivinar nada.'),
      rule('korean-hangul-00-system-alphabet','Un alfabeto, no dibujos','한글',{
        sound:'El hangeul representa sonidos mediante letras.',
        memory:'Cada forma pequeña es una letra; varias letras forman un bloque.',
        explanation:'Aunque un bloque pueda parecer un carácter único, está compuesto por letras que puedes identificar y leer.',
        points:['Consonantes y vocales son letras independientes.','Las letras se agrupan visualmente en cuadrados.','Cada cuadrado corresponde normalmente a una sílaba.'],
      }),
      rule('korean-hangul-00-system-block','Lee el bloque como una sílaba','ㅎ + ㅏ + ㄴ = 한',{
        audio:'한',
        sound:'한 se pronuncia como una sola sílaba.',
        memory:'Primero ㅎ, después ㅏ y al final ㄴ.',
        explanation:'No leas los trazos por separado. Reconoce las letras dentro del bloque y pronúncialas juntas.',
        points:['ㅎ es la consonante inicial.','ㅏ es la vocal.','ㄴ está abajo y cierra la sílaba.'],
      }),
      choice('korean-hangul-00-system-q1','¿Qué representa normalmente un bloque como «한»?','한',['Una sílaba','Una oración completa','Una imagen sin sonidos'],'Una sílaba','Un bloque de hangeul suele representar una sílaba.','한'),
      choice('korean-hangul-00-system-q2','¿Cómo debes empezar a leer hangeul?','ㅎ + ㅏ + ㄴ',['Identificando las letras del bloque','Memorizando el bloque como un dibujo','Leyendo solo la letra más grande'],'Identificando las letras del bloque','Primero identifica consonante, vocal y posible consonante final.','한'),
    ],
  },
  {
    id:'korean-hangul-00-vowels-vertical',
    title:'Vocales verticales',
    description:'Aprende ㅏ, ㅓ e ㅣ dentro de bloques pronunciables.',
    activities:[
      intro('korean-hangul-00-vowels-vertical','Vocales a la derecha','Cuando la vocal es vertical, la consonante inicial se coloca a su izquierda.'),
      rule('korean-hangul-00-vowels-a','Conoce ㅏ','ㅇ + ㅏ = 아',{audio:'아',sound:'Escucha 아: ㅏ se acerca a la «a» española.',memory:'La vocal vertical ㅏ va a la derecha de ㅇ.',explanation:'ㅇ no suena al inicio. En 아 sirve como soporte para poder escribir y pronunciar la vocal ㅏ.',points:['ㅇ inicial: silenciosa.','ㅏ: sonido cercano a «a».','Juntas forman 아.']}),
      listen('korean-hangul-00-vowels-a-listen','Escucha y elige el bloque que contiene ㅏ',['아','어','이'],'아','아 contiene la vocal ㅏ.','아'),
      rule('korean-hangul-00-vowels-eo','Conoce ㅓ','ㅇ + ㅓ = 어',{audio:'어',sound:'Escucha 어: ㅓ es una vocal abierta que no tiene equivalente exacto en español.',memory:'No la conviertas en una «o» española.',explanation:'Relaja la boca y escucha el modelo. Lo importante al principio es distinguir 어 de 아 y 오.',points:['ㅇ inicial: silenciosa.','ㅓ: vocal abierta y posterior.','Juntas forman 어.']}),
      listen('korean-hangul-00-vowels-eo-listen','Escucha y elige el bloque que contiene ㅓ',['오','어','아'],'어','어 contiene la vocal ㅓ.','어'),
      rule('korean-hangul-00-vowels-i','Conoce ㅣ','ㅇ + ㅣ = 이',{audio:'이',sound:'Escucha 이: ㅣ se parece a la «i» española.',memory:'ㅣ es una línea vertical y va a la derecha de ㅇ.',explanation:'Mantén un sonido breve y limpio, sin añadir otra vocal al final.',points:['ㅇ inicial: silenciosa.','ㅣ: sonido parecido a «i».','Juntas forman 이.']}),
      listen('korean-hangul-00-vowels-i-listen','Escucha y elige el bloque que contiene ㅣ',['이','아','우'],'이','이 contiene la vocal ㅣ.','이'),
      choice('korean-hangul-00-vowels-layout','¿Dónde se coloca una vocal vertical?','ㄱ + ㅏ = 가',['A la derecha de la consonante','Debajo de la consonante','Fuera del bloque'],'A la derecha de la consonante','Las vocales verticales se colocan a la derecha de la consonante inicial.','가'),
    ],
  },
  {
    id:'korean-hangul-00-vowels-horizontal',
    title:'Vocales horizontales',
    description:'Aprende ㅗ, ㅜ y ㅡ y su posición dentro del bloque.',
    activities:[
      intro('korean-hangul-00-vowels-horizontal','Vocales debajo','Cuando la vocal es horizontal, la consonante inicial se coloca arriba.'),
      rule('korean-hangul-00-vowels-o','Conoce ㅗ','ㅇ + ㅗ = 오',{audio:'오',sound:'Escucha 오: ㅗ se aproxima a una «o» redondeada.',memory:'La consonante va arriba y ㅗ debajo.',explanation:'Observa la organización vertical del bloque 오: ㅇ ocupa la parte superior y ㅗ la inferior.',points:['ㅇ inicial: silenciosa.','ㅗ: sonido aproximado a «o».','Juntas forman 오.']}),
      listen('korean-hangul-00-vowels-o-listen','Escucha y elige el bloque que contiene ㅗ',['어','오','우'],'오','오 contiene la vocal ㅗ.','오'),
      rule('korean-hangul-00-vowels-u','Conoce ㅜ','ㅇ + ㅜ = 우',{audio:'우',sound:'Escucha 우: ㅜ se parece a la «u» española.',memory:'ㅜ se coloca debajo de la consonante.',explanation:'Redondea los labios y evita añadir una vocal al final.',points:['ㅇ inicial: silenciosa.','ㅜ: sonido parecido a «u».','Juntas forman 우.']}),
      listen('korean-hangul-00-vowels-u-listen','Escucha y elige el bloque que contiene ㅜ',['우','오','으'],'우','우 contiene la vocal ㅜ.','우'),
      rule('korean-hangul-00-vowels-eu','Conoce ㅡ','ㅇ + ㅡ = 으',{audio:'으',sound:'Escucha 으: ㅡ no tiene equivalente exacto en español.',memory:'Mantén los labios sin redondear.',explanation:'Es una vocal central. Escucha varias veces y distínguela de 우; no necesitas romanizarla.',points:['ㅇ inicial: silenciosa.','ㅡ: vocal central con labios relajados.','Juntas forman 으.']}),
      listen('korean-hangul-00-vowels-eu-listen','Escucha y elige el bloque que contiene ㅡ',['이','으','우'],'으','으 contiene la vocal ㅡ.','으'),
      choice('korean-hangul-00-vowels-horizontal-layout','¿Dónde se coloca una vocal horizontal?','ㄱ + ㅜ = 구',['Debajo de la consonante','A la izquierda de la consonante','En otro bloque'],'Debajo de la consonante','Las vocales horizontales se colocan debajo de la consonante inicial.','구'),
    ],
  },
  {
    id:'korean-hangul-00-consonants-1',
    title:'Consonantes básicas I',
    description:'Relaciona ㄱ, ㄴ, ㅁ y ㅇ con sonidos dentro de sílabas.',
    activities:[
      intro('korean-hangul-00-consonants-1','Las consonantes necesitan una vocal','Escucharás cada consonante dentro de una sílaba; no intentes pronunciarla aislada.'),
      rule('korean-hangul-00-consonants-g','Conoce ㄱ','ㄱ + ㅏ = 가',{audio:'가',sound:'En 가, ㄱ suena entre una «k» suave y una «g» ligera.',memory:'Su sonido puede variar según la posición.',explanation:'No asignes una única letra española rígida. Aprende primero el sonido de ㄱ dentro de 가.',points:['ㄱ: consonante inicial.','ㅏ: vocal.','El bloque completo es 가.']}),
      listen('korean-hangul-00-consonants-g-listen','Escucha y elige el bloque correcto',['가','나','마'],'가','가 empieza con ㄱ.','가'),
      rule('korean-hangul-00-consonants-n','Conoce ㄴ','ㄴ + ㅏ = 나',{audio:'나',sound:'En 나, ㄴ suena como «n».',memory:'ㄴ + ㅏ se lee como una sola sílaba.',explanation:'La consonante ocupa la izquierda porque ㅏ es vertical.',points:['ㄴ: sonido «n».','ㅏ: vocal cercana a «a».','El bloque completo es 나.']}),
      listen('korean-hangul-00-consonants-n-listen','Escucha y elige el bloque correcto',['마','나','다'],'나','나 empieza con ㄴ.','나'),
      rule('korean-hangul-00-consonants-m','Conoce ㅁ','ㅁ + ㅏ = 마',{audio:'마',sound:'En 마, ㅁ suena como «m».',memory:'La forma cuadrada ㅁ inicia el bloque.',explanation:'Cierra los labios para producir el sonido inicial antes de pasar a ㅏ.',points:['ㅁ: sonido «m».','ㅏ: vocal.','El bloque completo es 마.']}),
      listen('korean-hangul-00-consonants-m-listen','Escucha y elige el bloque correcto',['바','마','사'],'마','마 empieza con ㅁ.','마'),
      rule('korean-hangul-00-consonants-ng','Dos funciones de ㅇ','아 · 한',{audio:'한',sound:'ㅇ es silenciosa al inicio, pero al final suena «ng».',memory:'Compara 아, donde no inicia sonido, con 한, donde cierra la sílaba.',explanation:'La posición cambia su función. Este detalle es esencial para leer bloques completos.',points:['En 아, ㅇ inicial no suena.','En 한, ㄴ es el cierre; en 강, ㅇ final suena «ng».','No leas ㅇ siempre de la misma manera.']}),
      choice('korean-hangul-00-consonants-ng-q','¿Cuándo suena ㅇ como «ng»?','ㅇ',['Cuando está al final del bloque','Siempre que aparece','Solo cuando está a la izquierda'],'Cuando está al final del bloque','ㅇ es silenciosa al inicio y suena «ng» como consonante final.','한'),
    ],
  },
  {
    id:'korean-hangul-00-consonants-2',
    title:'Consonantes básicas II',
    description:'Relaciona ㄷ, ㄹ, ㅂ y ㅅ con sílabas reales.',
    activities:[
      intro('korean-hangul-00-consonants-2','Escucha antes de etiquetar','Los sonidos coreanos no siempre coinciden exactamente con una consonante española.'),
      rule('korean-hangul-00-consonants-d','Conoce ㄷ','ㄷ + ㅏ = 다',{audio:'다',sound:'En 다, ㄷ suena entre una «t» suave y una «d» ligera.',memory:'Aprende el sonido dentro del bloque completo.',explanation:'La intensidad y la posición influyen; evita convertirla siempre en una «d» española.',points:['ㄷ: consonante inicial.','ㅏ: vocal.','El bloque completo es 다.']}),
      listen('korean-hangul-00-consonants-d-listen','Escucha y elige el bloque correcto',['나','다','라'],'다','다 empieza con ㄷ.','다'),
      rule('korean-hangul-00-consonants-r','Conoce ㄹ','ㄹ + ㅏ = 라',{audio:'라',sound:'En 라, ㄹ se acerca a una «r» suave; al final puede acercarse a «l».',memory:'No uses la «rr» fuerte del español.',explanation:'ㄹ cambia ligeramente según su posición. En esta sílaba inicial escucha una vibración breve.',points:['ㄹ: sonido líquido breve.','ㅏ: vocal.','El bloque completo es 라.']}),
      listen('korean-hangul-00-consonants-r-listen','Escucha y elige el bloque correcto',['라','마','사'],'라','라 empieza con ㄹ.','라'),
      rule('korean-hangul-00-consonants-b','Conoce ㅂ','ㅂ + ㅏ = 바',{audio:'바',sound:'En 바, ㅂ suena entre una «p» suave y una «b» ligera.',memory:'Junta los labios sin producir una explosión fuerte.',explanation:'Aprende la consonante dentro del bloque; su sonido no es idéntico en todas las posiciones.',points:['ㅂ: consonante inicial.','ㅏ: vocal.','El bloque completo es 바.']}),
      listen('korean-hangul-00-consonants-b-listen','Escucha y elige el bloque correcto',['마','바','파'],'바','바 empieza con ㅂ.','바'),
      rule('korean-hangul-00-consonants-s','Conoce ㅅ','ㅅ + ㅏ = 사',{audio:'사',sound:'En 사, ㅅ suena como «s»; delante de ㅣ se acerca a «sh».',memory:'El sonido cambia por la vocal que sigue.',explanation:'Empieza asociando ㅅ con 사 y más adelante aprenderás sus cambios regulares.',points:['ㅅ: consonante inicial.','ㅏ: vocal.','El bloque completo es 사.']}),
      listen('korean-hangul-00-consonants-s-listen','Escucha y elige el bloque correcto',['자','사','하'],'사','사 empieza con ㅅ.','사'),
    ],
  },
  {
    id:'korean-hangul-00-blocks',
    title:'Construye bloques',
    description:'Coloca las letras según la forma de la vocal.',
    activities:[
      intro('korean-hangul-00-blocks','Dos diseños básicos','El bloque cambia de forma, pero el orden de lectura sigue siendo consonante y vocal.'),
      rule('korean-hangul-00-blocks-vertical','Vocal vertical: izquierda y derecha','ㄱ + ㅏ = 가',{audio:'가',sound:'Lee primero ㄱ y después ㅏ.',memory:'ㅏ es vertical: ㄱ queda a la izquierda.',explanation:'Las dos letras ocupan el mismo bloque cuadrado y forman una sola sílaba.',points:['Consonante inicial: ㄱ.','Vocal vertical a la derecha: ㅏ.','Resultado: 가.']}),
      choice('korean-hangul-00-blocks-vertical-q','¿Qué bloque forman ㄱ y ㅏ?','ㄱ + ㅏ',['가','구','나'],'가','ㄱ + ㅏ forman 가.','가'),
      rule('korean-hangul-00-blocks-horizontal','Vocal horizontal: arriba y abajo','ㄱ + ㅜ = 구',{audio:'구',sound:'Lee primero ㄱ y después ㅜ.',memory:'ㅜ es horizontal: ㄱ queda arriba.',explanation:'Aunque la posición visual cambie, el orden sonoro sigue siendo consonante y vocal.',points:['Consonante inicial arriba: ㄱ.','Vocal horizontal debajo: ㅜ.','Resultado: 구.']}),
      choice('korean-hangul-00-blocks-horizontal-q','¿Qué bloque forman ㄱ y ㅜ?','ㄱ + ㅜ',['가','구','우'],'구','ㄱ + ㅜ forman 구.','구'),
      choice('korean-hangul-00-blocks-rule-q','¿Qué decide si la vocal va a la derecha o debajo?','ㅏ / ㅜ',['La forma vertical u horizontal de la vocal','El significado de la palabra','El tamaño de la consonante'],'La forma vertical u horizontal de la vocal','La orientación de la vocal determina el diseño del bloque.'),
    ],
  },
  {
    id:'korean-hangul-00-review-01',
    title:'Repaso: bloques básicos',
    description:'Comprueba que reconoces vocales, consonantes y diseños.',
    isReview:true,
    activities:[
      intro('korean-hangul-00-review-01','Repaso breve','Ahora practicarás únicamente conceptos que ya fueron explicados.'),
      listen('korean-hangul-00-review-a','Escucha y elige el bloque correcto',['어','아','오'],'아','아 contiene ㅏ.','아'),
      listen('korean-hangul-00-review-u','Escucha y elige el bloque correcto',['우','오','으'],'우','우 contiene ㅜ.','우'),
      listen('korean-hangul-00-review-na','Escucha y elige el bloque correcto',['마','나','다'],'나','나 se forma con ㄴ + ㅏ.','나'),
      choice('korean-hangul-00-review-layout','¿Cuál usa una vocal horizontal?','구',['가','구','너'],'구','구 coloca ㄱ arriba y ㅜ debajo.','구'),
      choice('korean-hangul-00-review-order','¿Cómo lees un bloque básico?','C + V',['Consonante y después vocal','Vocal y después consonante','De abajo hacia arriba'],'Consonante y después vocal','En un bloque básico, empieza por la consonante inicial y continúa con la vocal.'),
    ],
  },
  {
    id:'korean-hangul-00-batchim',
    title:'La consonante final',
    description:'Aprende a reconocer el batchim debajo del bloque.',
    activities:[
      intro('korean-hangul-00-batchim','Un tercer lugar en el bloque','Algunas sílabas terminan con una consonante colocada abajo. Se llama 받침 (batchim).'),
      rule('korean-hangul-00-batchim-han','Lee 한','ㅎ + ㅏ + ㄴ = 한',{audio:'한',sound:'Escucha cómo ㄴ cierra la sílaba sin añadir otra vocal.',memory:'Inicial y vocal arriba; consonante final abajo.',explanation:'El bloque sigue representando una sola sílaba, aunque ahora contiene tres letras.',points:['ㅎ: consonante inicial.','ㅏ: vocal.','ㄴ: consonante final o batchim.']}),
      listen('korean-hangul-00-batchim-han-listen','Escucha y elige el bloque correcto',['하','한','강'],'한','한 termina en ㄴ.','한'),
      rule('korean-hangul-00-batchim-mun','Lee 문','ㅁ + ㅜ + ㄴ = 문',{audio:'문',sound:'Escucha 문 como una sola sílaba cerrada en ㄴ.',memory:'ㅁ va arriba, ㅜ en medio y ㄴ abajo.',explanation:'No pronuncies «무-느». La ㄴ final no crea una sílaba nueva.',points:['ㅁ: consonante inicial.','ㅜ: vocal horizontal.','ㄴ: batchim.']}),
      listen('korean-hangul-00-batchim-mun-listen','Escucha y elige el bloque correcto',['문','무','눈'],'문','문 termina en ㄴ.','문'),
      rule('korean-hangul-00-batchim-bap','Lee 밥','ㅂ + ㅏ + ㅂ = 밥',{audio:'밥',sound:'La ㅂ final se cierra brevemente, sin una vocal después.',memory:'La misma letra puede aparecer al inicio y al final.',explanation:'Evita leer «바브». El batchim cierra la sílaba y no añade una vocal española.',points:['ㅂ inicial abre la sílaba.','ㅏ aporta la vocal.','ㅂ final cierra el bloque.']}),
      listen('korean-hangul-00-batchim-bap-listen','Escucha y elige el bloque correcto',['바','밥','파'],'밥','밥 tiene ㅂ como batchim.','밥'),
      choice('korean-hangul-00-batchim-rule','¿Qué hace una consonante escrita abajo?','받침',['Cierra la sílaba','Empieza una palabra nueva','Se ignora siempre'],'Cierra la sílaba','La consonante inferior funciona como cierre silábico o batchim.'),
    ],
  },
  {
    id:'korean-hangul-00-words',
    title:'Tus primeras lecturas',
    description:'Lee palabras sencillas bloque por bloque y comprueba su significado.',
    activities:[
      intro('korean-hangul-00-words','De bloques a palabras','Separa visualmente los bloques, escúchalos y vuelve a unirlos sin depender de letras latinas.'),
      word('korean-hangul-00-word-tree','나무','árbol','나무',['나','무']),
      choice('korean-hangul-00-word-tree-q','¿Qué significa «나무»?','나무',['árbol','persona','leche'],'árbol','나무 significa «árbol».','나무'),
      word('korean-hangul-00-word-person','사람','persona','사람',['사','람']),
      choice('korean-hangul-00-word-person-q','¿Qué significa «사람»?','사람',['libro','persona','agua'],'persona','사람 significa «persona».','사람'),
      word('korean-hangul-00-word-milk','우유','leche','우유',['우','유']),
      choice('korean-hangul-00-word-milk-q','¿Qué significa «우유»?','우유',['leche','árbol','idioma coreano'],'leche','우유 significa «leche».','우유'),
      word('korean-hangul-00-word-korean','한국어','idioma coreano','한국어',['한','국','어']),
      choice('korean-hangul-00-word-korean-q','¿Qué significa «한국어»?','한국어',['persona','idioma coreano','casa'],'idioma coreano','한국어 significa «idioma coreano».','한국어'),
      listen('korean-hangul-00-word-korean-listen','Escucha y elige la palabra correcta',['한국어','사람','나무'],'한국어','La palabra pronunciada es 한국어.','한국어'),
    ],
  },
  {
    id:'korean-hangul-00-test',
    title:'Prueba: empieza a leer hangeul',
    description:'Demuestra que comprendes bloques, sonidos básicos y batchim.',
    isTest:true,
    isUnitFinal:true,
    passingScore:100,
    xpReward:30,
    activities:[
      intro('korean-hangul-00-test','Prueba final','Todo lo que aparece aquí fue enseñado en las lecciones anteriores.'),
      choice('korean-hangul-00-test-system','¿Qué representa normalmente cada bloque?','한',['Una sílaba','Una oración','Una ilustración'],'Una sílaba','Cada bloque representa normalmente una sílaba.'),
      listen('korean-hangul-00-test-vowel','Escucha y elige el bloque correcto',['어','오','아'],'어','El bloque pronunciado es 어.','어'),
      listen('korean-hangul-00-test-consonant','Escucha y elige el bloque correcto',['마','나','다'],'마','El bloque pronunciado es 마.','마'),
      choice('korean-hangul-00-test-layout','¿Qué bloque forman ㄱ y ㅜ?','ㄱ + ㅜ',['구','가','우'],'구','ㄱ + ㅜ forman 구.','구'),
      choice('korean-hangul-00-test-batchim','¿Dónde está el batchim en «문»?','문',['Abajo: ㄴ','Arriba: ㅁ','En medio: ㅜ'],'Abajo: ㄴ','ㄴ está abajo y cierra la sílaba 문.','문'),
      choice('korean-hangul-00-test-word','¿Qué significa «사람»?','사람',['persona','árbol','leche'],'persona','사람 significa «persona».','사람'),
      listen('korean-hangul-00-test-reading','Escucha y elige la palabra correcta',['우유','나무','한국어'],'우유','La palabra pronunciada es 우유.','우유'),
    ],
  },
];

const unit={
  id:'hangul-foundations',
  title:'Cómo se lee el hangeul',
  description:'Entiende los bloques silábicos, la posición de las vocales y el batchim antes de memorizar el alfabeto completo.',
  requirements:[],
  reward:{xp:220,badge:'Lector de bloques'},
  lessons,
};
fs.writeFileSync(unitPath,`${JSON.stringify(unit,null,2)}\n`);

const course=JSON.parse(fs.readFileSync(coursePath,'utf8'));
course.version=Math.max(11,Number(course.version||1));
const summary={
  id:'hangul-foundations',world:0,mapLabel:'MUNDO 0',title:'Aprende a leer hangeul',
  description:'Comprende cómo las letras forman bloques antes de memorizar sonidos y palabras.',
  manifest:'units/hangul-foundations.json',icon:'한',
};
course.units=[summary,...course.units.filter(item=>item.id!==summary.id)];
const foundations=course.levels.find(level=>level.id==='foundations');
if(foundations)foundations.unitIds=[summary.id,...foundations.unitIds.filter(id=>id!==summary.id)];
course.unlockRules={...(course.unlockRules||{}),requireReadingMastery:true,readingUnitId:'hangul-foundations'};
fs.writeFileSync(coursePath,`${JSON.stringify(course,null,2)}\n`);

console.log(`Coreano: añadido ${summary.title} con ${lessons.length} pasos; curso v${course.version}.`);

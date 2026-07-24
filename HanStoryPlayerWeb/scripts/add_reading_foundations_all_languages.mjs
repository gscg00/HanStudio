#!/usr/bin/env node
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const web=path.resolve(here,'..');
const coursesRoot=path.join(web,'library','courses');

const C=(title,target,audio,sound,memory,explanation,points,question,answer,distractors)=>({
  title,target,audio,sound,memory,explanation,points,question,answer,distractors,
});
const L=(title,description,...concepts)=>({title,description,concepts});

const specs={
  English:{
    slug:'english',name:'Inglés',icon:'ABC',title:'Cómo se lee el inglés',
    description:'Relaciona letras y sonidos sin confundir el nombre de una letra con su pronunciación dentro de una palabra.',
    lessons:[
      L('Letras, nombres y sonidos','Comprende por qué saber el abecedario no basta para leer.',
        C('La letra no es su nombre','A · /æ/','ay','A se llama «ei», pero en cat representa otro sonido.','Pregunta siempre: ¿nombre de letra o sonido dentro de palabra?','En inglés una misma letra puede representar sonidos distintos según la palabra.',['A es la letra escrita.','«ei» es su nombre.','El sonido se aprende dentro de palabras.'],'¿Qué debes mirar al leer una palabra?','El sonido de la letra en esa palabra',['Solo el nombre del abecedario','La traducción española']),
        C('El contexto decide','C: cat / city','see','C puede sonar como k o como s.','Mira la vocal que aparece después.','Muchas correspondencias inglesas dependen de las letras vecinas.',['c + a/o/u suele sonar k.','c + e/i/y suele sonar s.','Aprende patrones, no reglas absolutas.'],'¿Puede C tener más de un sonido?','Sí, depende del contexto',['No, siempre suena igual','Solo en nombres propios'])),
      L('Las vocales','Distingue vocales breves, largas y combinaciones frecuentes.',
        C('Vocal breve','A en cat','ay','La vocal breve no se pronuncia como el nombre «ei».','Escucha la palabra completa; no deletrees.','Las cinco letras vocálicas representan más de cinco sonidos.',['Una vocal breve dura poco.','No añadas una vocal española.','Compara palabras en pares.'],'¿La A de cat suena igual que el nombre A?','No, es un sonido vocálico breve',['Sí, siempre es «ei»','No se pronuncia']),
        C('Vocal larga y e silenciosa','a_e: name','ay','En muchos patrones consonante + e final, la primera vocal cambia.','La e final suele modificar y no sonar.','El patrón de la e silenciosa ayuda a leer pares como cap/cape.',['cap y cape no tienen la misma vocal.','La e final suele ser silenciosa.','Hay excepciones que se aprenden con uso.'],'¿Qué hace normalmente la e final en name?','Modifica la vocal anterior y no suena',['Se pronuncia como e española','Duplica la consonante'])),
      L('Consonantes que confunden','Separa sonidos ingleses que un hispanohablante suele mezclar.',
        C('B y V no son iguales','B / V','vee','V se articula con dientes superiores y labio inferior.','No conviertas automáticamente V en B.','La diferencia puede cambiar una palabra.',['B usa los dos labios.','V usa dientes y labio inferior.','Escucha y observa la articulación.'],'¿B y V representan el mismo sonido inglés?','No, se articulan de manera distinta',['Sí, siempre','Solo cambian al escribir']),
        C('H sí puede sonar','H','aitch','La H inglesa suele ser una salida de aire.','No la trates como la h muda del español.','En palabras como hello, la H inicial forma parte de la pronunciación.',['Expulsa aire suavemente.','No añadas una j española fuerte.','Hay algunas palabras con h muda.'],'¿Qué haces normalmente con una H inicial inglesa?','Produces una salida suave de aire',['La omites siempre','La pronuncias como rr'])),
      L('Grupos de letras','Aprende que dos letras pueden representar un solo sonido.',
        C('TH tiene dos realizaciones','TH','tee','La lengua se acerca o sale ligeramente entre los dientes.','Aprende think y this como dos variantes.','TH no se lee como una t seguida de una h.',['Puede ser sorda en think.','Puede ser sonora en this.','Se articula con la lengua y los dientes.'],'¿Cómo se lee TH?','Como un sonido conjunto, no deletreando T y H',['Como dos sílabas','Siempre como t española']),
        C('SH y CH','SH · CH','see','Cada grupo funciona como una unidad frecuente.','Reconoce el grupo antes de leer letra por letra.','Dividir estos grupos produce una pronunciación artificial.',['sh: aire continuo.','ch: cierre y liberación.','Busca el grupo completo.'],'¿Qué debes hacer al encontrar SH o CH?','Reconocer el grupo como una unidad sonora',['Pronunciar cada nombre de letra','Ignorar la segunda letra'])),
      L('Letras silenciosas','Reconoce letras escritas que no siempre se oyen.',
        C('No todo se pronuncia','kn · wr · mb','en','En know, write y lamb hay letras silenciosas.','Aprende la forma escrita junto con el audio.','La ortografía inglesa conserva huellas históricas.',['kn inicial suele perder k.','wr inicial suele perder w.','mb final suele perder b.'],'¿Debes pronunciar siempre todas las letras inglesas?','No, algunas son silenciosas',['Sí, sin excepción','Solo las consonantes']),
        C('Terminaciones','-ed · -s','ess','Una misma terminación cambia de sonido según lo anterior.','Escucha el final, no añadas una sílaba automáticamente.','-ed puede sonar t, d o id; -s puede sonar s, z o iz.',['worked termina en t.','played termina en d.','wanted termina en id.'],'¿La terminación -ed suena siempre igual?','No, cambia según el contexto',['Sí, siempre «ed»','Nunca se pronuncia'])),
      L('Ritmo y lectura de palabras','Lee por sílabas y conserva el acento principal.',
        C('Acento de palabra','PREsent / preSENT','eye','La sílaba acentuada destaca más.','Marca una sílaba fuerte, no todas por igual.','El acento puede distinguir palabras y facilita la comprensión.',['Una sílaba recibe más prominencia.','Las demás se reducen con frecuencia.','Escucha la palabra completa.'],'¿Todas las sílabas inglesas tienen la misma fuerza?','No, suele haber una sílaba principal',['Sí, siempre','Solo en preguntas']),
        C('No deletrees al leer','cat ≠ C-A-T','see','Une los sonidos para formar la palabra.','Los nombres de las letras sirven para deletrear, no para leer corrido.','La lectura fluida combina sonidos y patrones conocidos.',['Identifica el patrón.','Produce sus sonidos.','Únelos sin pausas artificiales.'],'¿Cómo lees una palabra conocida?','Uniendo sus sonidos y patrones',['Diciendo los nombres de cada letra','Traduciéndola antes de verla'])),
    ],
  },
  French:{
    slug:'french',name:'Francés',icon:'É',title:'Cómo se lee el francés',
    description:'Aprende primero letras, grafemas y sílabas: una forma escrita y un sonido por tarjeta, antes de estudiar palabras o frases.',
    lessons:[
      L('Reconocer las letras','Aprende el nombre de una letra para identificarla; todavía no estás leyendo palabras.',
        C('Letra A','A','a','Escucha únicamente el nombre de A.','Una tarjeta, una letra, un audio.','El nombre permite señalar la letra escrita. Más adelante la combinarás para producir sílabas.',['Forma escrita: A/a.','Nombre francés: a.','No hay una palabra escondida en esta tarjeta.'],'¿Qué letra acabas de escuchar?','A',['B','C']),
        C('Letra B','B','bé','Escucha únicamente el nombre de B.','No confundas el nombre con una sílaba.','B se llama «bé». Cuando se combine con una vocal, escucharás el sonido dentro de una sílaba.',['Forma escrita: B/b.','Nombre francés: bé.','El sonido se practicará después con vocales.'],'¿Qué letra acabas de escuchar?','B',['D','P']),
        C('Letra C','C','cé','Escucha únicamente el nombre de C.','C puede cambiar de sonido según la vocal siguiente.','Por ahora reconoce su nombre. Después estudiarás ca y ce por separado.',['Forma escrita: C/c.','Nombre francés: cé.','El contexto decide su sonido.'],'¿Qué letra acabas de escuchar?','C',['G','S'])),
      L('Vocales claras','Une una consonante conocida con una sola vocal.',
        C('A dentro de una sílaba','a → ma','ma','Escucha la vocal a dentro de ma.','Mira a mientras oyes ma.','La consonante sirve de apoyo para que ElevenLabs produzca la vocal de forma natural. El objetivo de esta tarjeta es a.',['m + a → ma.','La vocal central es a.','No se presenta vocabulario todavía.'],'¿Qué vocal aparece en la sílaba ma?','a',['i','o']),
        C('I dentro de una sílaba','i → mi','mi','Escucha la vocal i dentro de mi.','Mira i mientras oyes mi.','Esta tarjeta presenta una sola relación escrita y sonora.',['m + i → mi.','La vocal central es i.','No necesitas memorizar una palabra.'],'¿Qué vocal aparece en la sílaba mi?','i',['a','u']),
        C('O dentro de una sílaba','o → mo','mo','Escucha la vocal o dentro de mo.','Redondea los labios suavemente.','Practica primero la sílaba; el vocabulario llegará después.',['m + o → mo.','La vocal central es o.','Mantén un solo impulso de voz.'],'¿Qué vocal aparece en la sílaba mo?','o',['e','i'])),
      L('É y È por separado','Los acentos orientan hacia vocales distintas; cada una tiene su propio audio.',
        C('É cerrada','é → mé','mé','É suele ser una vocal más cerrada.','Asocia é solo con este audio antes de contrastarla.','El acento agudo forma parte del grafema. No es decoración.',['Grafema: é.','Sílaba de apoyo: mé.','La boca queda relativamente cerrada.'],'¿Qué grafema practicas en mé?','é',['è','ê']),
        C('È abierta','è → mè','mè','È suele ser una vocal más abierta.','Compárala con é únicamente después de aprender cada una.','El acento grave orienta la apertura de esta e.',['Grafema: è.','Sílaba de apoyo: mè.','La mandíbula se abre algo más.'],'¿Qué grafema practicas en mè?','è',['é','ê'])),
      L('U y OU por separado','Estas dos grafías no representan la misma vocal.',
        C('U francesa','u → mu','mu','La u francesa es frontal y redondeada.','Coloca la lengua como para i y redondea los labios.','Esta vocal no equivale exactamente a la u española.',['Grafema: u.','Sílaba: mu.','Lengua adelante; labios redondos.'],'¿Qué grafema practicas en mu?','u',['ou','o']),
        C('Grupo OU','ou → mou','mou','OU suele acercarse a la u española.','Reconoce ou como una sola unidad gráfica.','Las dos letras colaboran para representar una vocal.',['Grafema: ou.','Sílaba: mou.','No pronuncies o y u por separado.'],'¿Qué grupo practicas en mou?','ou',['u','au'])),
      L('Construir sílabas','Combina una consonante y una vocal sin recurrir todavía a palabras completas.',
        C('M + A','m + a → ma','ma','Une m y a en un solo impulso.','No digas «emme-a».','Leer una sílaba significa producir sonidos, no nombres de letras.',['m aporta la consonante.','a aporta la vocal.','Juntas forman ma.'],'¿Qué sílaba forman m y a?','ma',['mi','la']),
        C('F + I','f + i → fi','fi','Une f y i sin insertar otra vocal.','Mantén aire continuo en f y pasa a i.','El resultado es una sílaba, no una palabra que debas memorizar.',['f aporta fricción.','i aporta la vocal.','Juntas forman fi.'],'¿Qué sílaba forman f e i?','fi',['fa','mi']),
        C('L + U','l + u → lu','lu','Une l con la u francesa.','La lengua toca detrás de los dientes para l.','Después conserva labios redondeados para u.',['l aporta la consonante.','u aporta la vocal frontal redondeada.','Juntas forman lu.'],'¿Qué sílaba forman l y u?','lu',['la','lou'])),
      L('C y G según la vocal','Aprende cada combinación por separado.',
        C('C ante A','c + a → ca','ca','Ante a, c suele representar un sonido k.','Asocia ca con un solo audio.','La vocal siguiente ayuda a predecir el sonido de c.',['Grafema consonántico: c.','Vocal siguiente: a.','Resultado: ca con sonido k.'],'¿Qué sílaba acabas de practicar?','ca',['ce','ga']),
        C('C ante E','c + e → ce','ce','Ante e, c suele representar un sonido s.','No uses automáticamente el sonido de ca.','El cambio de vocal modifica la lectura de c.',['Grafema consonántico: c.','Vocal siguiente: e.','Resultado: ce con sonido s.'],'¿Qué sílaba acabas de practicar?','ce',['ca','ge']),
        C('G ante A','g + a → ga','ga','Ante a, g conserva un sonido duro.','Practica ga como una sola sílaba.','No la separes en nombres de letras.',['Grafema consonántico: g.','Vocal siguiente: a.','Resultado: ga.'],'¿Qué sílaba acabas de practicar?','ga',['ge','ca']),
        C('G ante E','g + e → ge','ge','Ante e, g suele representar un sonido suave.','Compárala con ga después de dominar ambas tarjetas.','La vocal siguiente vuelve a decidir la lectura.',['Grafema consonántico: g.','Vocal siguiente: e.','Resultado: ge con sonido suave.'],'¿Qué sílaba acabas de practicar?','ge',['ga','ce'])),
      L('Grupos consonánticos','Un grupo escrito puede representar una sola consonante.',
        C('Grupo CH','ch + a → cha','cha','CH suele producir un sonido parecido a sh.','Mira ch como una unidad.','El audio corresponde solo a cha; ph y gn tendrán tarjetas distintas.',['Grupo: ch.','Vocal de apoyo: a.','Resultado: cha.'],'¿Qué grupo aparece en cha?','ch',['ph','gn']),
        C('Grupo PH','ph + i → phi','phi','PH suele representar el sonido f.','Mira ph como una unidad.','No pronuncies p y h por separado.',['Grupo: ph.','Vocal de apoyo: i.','Resultado: phi, con sonido f.'],'¿Qué grupo aparece en phi?','ph',['ch','gn']),
        C('Grupo GN','gn + a → gna','gna','GN suele acercarse a la ñ española.','Mira gn como una unidad.','No produzcas g y n como dos consonantes separadas.',['Grupo: gn.','Vocal de apoyo: a.','Resultado: gna.'],'¿Qué grupo aparece en gna?','gn',['ch','ph'])),
      L('Primeras vocales nasales','Aprende cada grafema nasal con su propio audio.',
        C('Grafema AN','an','an','AN suele representar una vocal nasal.','Escucha an sin añadir una n española fuerte.','La consonante nasal modifica la vocal; no forma aquí otra sílaba.',['Grafema: an.','Un solo núcleo nasal.','El contexto posterior puede cambiar la regla.'],'¿Qué grafema nasal acabas de escuchar?','an',['on','un']),
        C('Grafema ON','on','on','ON representa otra vocal nasal, más redondeada.','No la confundas con an.','Esta tarjeta contiene únicamente on y su audio.',['Grafema: on.','Labios más redondeados.','La n no se separa como sílaba.'],'¿Qué grafema nasal acabas de escuchar?','on',['an','un']),
        C('Grafema UN','un','un','UN representa una vocal nasal frontal y redondeada.','Apréndela por contraste, sin transcripción permanente.','La pronunciación varía algo según la región, pero sigue siendo distinta de on.',['Grafema: un.','Vocal nasal.','No equivale a «un» español.'],'¿Qué grafema nasal acabas de escuchar?','un',['an','on'])),
    ],
  },
  German:{
    slug:'german',name:'Alemán',icon:'Ä',title:'Cómo se lee el alemán',
    description:'Aprende vocales, umlauts, combinaciones y consonantes para aprovechar una ortografía bastante regular.',
    lessons:[
      L('Letras y pronunciación','Separa nombre de letra y sonido de palabra.',
        C('Leer no es deletrear','A · Name','ah','El nombre de una letra no es necesariamente su sonido dentro de una palabra.','Usa los nombres solo para deletrear.','El alemán tiene correspondencias más regulares que el inglés, pero debes aprender sus patrones.',['Letra escrita.','Sonido dentro de palabra.','Nombre usado al deletrear.'],'¿Cómo lees una palabra alemana?','Con sus sonidos, no con nombres de letras',['Deletreando siempre','Traduciéndola primero']),
        C('Las mayúsculas importan','Haus · das Haus','hah','Todos los sustantivos se escriben con mayúscula.','Una mayúscula interna suele anunciar un sustantivo.','Esta convención ayuda a reconocer la estructura de una oración.',['Haus es sustantivo.','Los nombres propios también usan mayúscula.','No cambia por estar en medio de frase.'],'¿Qué clase de palabras usa mayúscula en alemán?','Los sustantivos',['Solo los verbos','Todas las palabras'])),
      L('Umlauts','Aprende ä, ö y ü como vocales propias.',
        C('Ä no es A decorada','ä','äh','Ä suele acercarse a una e abierta.','Trátala como una vocal distinta.','El umlaut puede cambiar pronunciación y significado.',['ä tiene sonido propio.','No ignores los puntos.','Compara palabras relacionadas.'],'¿Debes leer Ä exactamente como A?','No, es una vocal distinta',['Sí','Es silenciosa']),
        C('Ö y Ü','ö · ü','öh','Son vocales frontales con labios redondeados.','Forma la lengua para e/i y redondea los labios.','No tienen equivalente exacto en español.',['ö: frontal redondeada media.','ü: frontal redondeada alta.','Escucha y reproduce, sin añadir otra vocal.'],'¿Qué comparten Ö y Ü?','Son vocales frontales con labios redondeados',['Son consonantes','Siempre son mudas'])),
      L('Combinaciones vocálicas','Reconoce el orden visual y el sonido resultante.',
        C('EI e IE','ei · ie','ih','EI suele sonar parecido a ai; IE suele ser una i larga.','En EI suena la segunda idea; IE conserva i larga.','Confundirlas cambia muchas palabras.',['mein contiene ei.','Liebe contiene ie.','No pronuncies dos vocales separadas.'],'¿EI e IE se leen igual?','No, representan sonidos distintos',['Sí','Solo en nombres']),
        C('EU y ÄU','eu · äu','üh','Ambas combinaciones suelen sonar parecido a oi.','Reconócelas como una unidad.','ÄU aparece a menudo en palabras relacionadas con AU.',['heute contiene eu.','Häuser contiene äu.','Las dos forman diptongo.'],'¿Cómo se comportan EU y ÄU?','Suelen compartir un diptongo parecido a oi',['Se leen letra por letra','Son silenciosas'])),
      L('Grupos consonánticos','Lee CH, SCH, SP y ST como patrones.',
        C('CH tiene variantes','ich · Bach','hah','CH cambia según la vocal y el entorno.','Aprende el sonido de ich y el de Bach por separado.','Uno es más frontal y otro más posterior.',['ich usa un sonido suave frontal.','Bach usa uno posterior.','No es la ch española.'],'¿CH alemán tiene un único sonido?','No, cambia según el contexto',['Sí, siempre como ch española','No se pronuncia']),
        C('SCH, SP y ST','Schule · Spiel · Straße','ess','SCH suele sonar sh; SP/ST iniciales suelen comenzar con sonido sh.','Mira el inicio de la sílaba.','En otras posiciones SP y ST pueden conservar s.',['sch funciona como grupo.','sp inicial suele sonar shp.','st inicial suele sonar sht.'],'¿Cómo suele empezar SCH?','Con un sonido parecido a sh',['Como sk','Como s muda'])),
      L('Consonantes finales y ß','Reconoce cambios regulares al final de palabra.',
        C('B, D, G finales','Tag · Hund','geh','Al final suelen sonar más sordas: p, t, k.','La escritura se conserva aunque cambie el sonido.','Este ensordecimiento es regular.',['b final se acerca a p.','d final se acerca a t.','g final se acerca a k.'],'¿Cómo suena normalmente D al final?','Más cerca de t',['Como d muy sonora','No suena']),
        C('ß representa s','ß','eszett','ß representa una s sorda larga y no es una B.','Asóciala con ss.','Tras ciertas vocales largas o diptongos puede escribirse ß.',['ß no es beta.','Suena como s fuerte.','En mayúsculas existe ẞ, aunque SS también aparece.'],'¿Qué sonido representa ß?','Una s sorda larga',['Una b','Una vocal'])),
      L('Sílabas y acento','Combina unidades sin añadir vocales.',
        C('Consonantes juntas','Strumpf','teh','El alemán permite grupos consonánticos largos.','No insertes vocales entre consonantes.','Divide por morfemas o sílabas, no por cada letra.',['Reconoce prefijos y raíces.','Mantén juntas las consonantes.','Practica despacio y luego une.'],'¿Debes añadir vocales entre consonantes alemanas?','No',['Sí, siempre','Solo tras S']),
        C('Acento léxico','ARbeiten','err','Muchas palabras nativas acentúan la raíz o primera sílaba, con excepciones.','Escucha palabras completas.','Prefijos separables y préstamos pueden cambiar el patrón.',['Identifica la sílaba fuerte.','Reduce las no acentuadas.','No existe una regla única absoluta.'],'¿Qué conviene memorizar junto con una palabra?','Su sílaba acentuada',['Solo su primera letra','El nombre de cada letra'])),
    ],
  },
  Italian:{
    slug:'italian',name:'Italiano',icon:'GLI',title:'Cómo se lee el italiano',
    description:'Aprovecha su ortografía regular y domina C, G, H, grupos especiales, dobles y acento.',
    lessons:[
      L('Vocales y lectura directa','El italiano se lee de forma bastante regular.',
        C('Cinco letras vocálicas','a · e · i · o · u','a','Las vocales se mantienen claras y no suelen reducirse tanto como en inglés.','Pronuncia cada núcleo vocálico.','E y O pueden ser abiertas o cerradas, pero al principio prioriza una lectura clara.',['No borres vocales finales.','Mantén sonidos definidos.','Escucha la apertura de e/o.'],'¿Qué debes hacer con las vocales italianas?','Pronunciarlas con claridad',['Reducirlas todas','Omitir las finales']),
        C('Una letra, un patrón','casa','ci','La mayoría de las palabras permite predecir la pronunciación con reglas estables.','Aprende las excepciones junto a cada palabra.','Esto hace posible leer pronto sin depender de una transcripción.',['Segmenta en sílabas.','Aplica grupos conocidos.','Une con ritmo.'],'¿Es relativamente regular la ortografía italiana?','Sí, aunque tiene reglas y excepciones',['No, es impredecible','Solo en nombres'])),
      L('C y G','La vocal siguiente decide sonidos duros o suaves.',
        C('C dura y suave','ca/co/cu · ce/ci','ci','C ante a, o, u suena k; ante e, i suena ch.','Mira siempre la vocal siguiente.','Esta regla explica casa frente a cena.',['ca/co/cu: sonido k.','ce/ci: sonido ch.','El contexto decide.'],'¿Cómo suele sonar C ante E o I?','Como ch',['Como k','No suena']),
        C('G dura y suave','ga/go/gu · ge/gi','gi','G ante a, o, u es dura; ante e, i suena parecido a y/dj.','Mira la vocal siguiente.','Compara gatto y gelato.',['ga/go/gu: g dura.','ge/gi: sonido suave.','La regla es paralela a C.'],'¿Cómo suele sonar G ante E o I?','Con un sonido suave parecido a y/dj',['Como k','Siempre muda'])),
      L('H que cambia el grupo','CH y GH conservan el sonido duro.',
        C('CHE y CHI','che · chi','acca','H evita que C se suavice ante e/i.','CH se lee k, no ch española.','Compara ce con che y ci con chi.',['che: ke.','chi: ki.','H no aporta un sonido separado.'],'¿Qué hace H en CHE o CHI?','Mantiene el sonido duro k',['Convierte C en s','Forma una vocal']),
        C('GHE y GHI','ghe · ghi','gi','H mantiene la G dura ante e/i.','No pronuncies H por separado.','Compara gelato con spaghetti.',['ghe: ge dura.','ghi: gi dura.','H funciona como señal ortográfica.'],'¿Qué hace H en GHE o GHI?','Mantiene la G dura',['Vuelve muda la palabra','Duplica la vocal'])),
      L('GN, GLI y SC','Reconoce grupos que representan sonidos propios.',
        C('GN','gn: bagno','enne','GN se acerca a la ñ española.','Lee las dos letras como una unidad.','No produzcas g seguida de n.',['bagno contiene sonido parecido a ñ.','El grupo permanece unido.','Practica dentro de palabras.'],'¿Cómo se lee normalmente GN?','Como un sonido parecido a ñ',['Como g + n separadas','Como ch']),
        C('GLI y SCI','gli · sci','elle','GLI tiene un sonido palatal; SCI ante e/i se aproxima a sh.','Aprende cada grupo como unidad.','Son patrones frecuentes que no conviene deletrear.',['famiglia contiene gli.','scena contiene sonido sh.','La vocal siguiente importa.'],'¿Debes separar GLI letra por letra?','No, funciona como grupo',['Sí, siempre','Solo la G es muda'])),
      L('Consonantes dobles','La duración consonántica puede cambiar significado.',
        C('Una o dos consonantes','pala · palla','pi','La consonante doble se mantiene más tiempo y corta la transición.','Haz una breve retención antes de liberar.','No es solo una diferencia ortográfica.',['pala y palla contrastan.','La vocal anterior puede sentirse más corta.','Escucha pares mínimos.'],'¿Las consonantes dobles cambian la pronunciación?','Sí, se sostienen más tiempo',['No','Solo en canto']),
        C('Ritmo silábico','italiano','ti','Cada sílaba conserva claridad y las dobles afectan el ritmo.','No borres vocales no acentuadas.','El ritmo italiano es más silábico que el inglés.',['Cuenta sílabas.','Mantén vocales claras.','Marca la consonante doble.'],'¿Debes eliminar las vocales no acentuadas?','No, suelen conservarse claras',['Sí, todas','Solo las finales'])),
      L('Acento y apóstrofo','Reconoce la sílaba fuerte y las elisiones.',
        C('Acento léxico','parola','erre','Muchas palabras acentúan la penúltima sílaba, pero no todas.','Aprende el acento junto con la palabra.','El acento gráfico aparece cuando es necesario, especialmente al final.',['città lleva acento escrito.','La sílaba fuerte guía el ritmo.','Hay patrones y excepciones.'],'¿Qué debes memorizar junto con una palabra italiana?','Su sílaba acentuada',['Solo su traducción','El nombre de cada letra']),
        C('Apóstrofo','l’acqua','a','El apóstrofo marca que se ha omitido una vocal.','Une las partes al leer.','No hagas una pausa larga en el apóstrofo.',['la + acqua → l’acqua.','La elisión evita choque vocálico.','Se lee como una unidad fluida.'],'¿Qué indica normalmente el apóstrofo?','Una vocal omitida y unión fluida',['Una pregunta','Una consonante doble'])),
    ],
  },
  Portuguese:{
    slug:'portuguese',name:'Portugués',icon:'Ã',title:'Cómo se lee el portugués',
    description:'Domina vocales, nasalización, dígrafos y variación consonántica antes de leer textos.',
    lessons:[
      L('Letras y vocales','Comprende que la escritura es regular, pero las vocales varían.',
        C('Vocales abiertas y cerradas','é/ê · ó/ô','é','Los acentos pueden distinguir apertura vocálica.','No trates cada E u O como un único sonido.','La variedad regional también influye.',['é/ó suelen ser abiertas.','ê/ô suelen ser cerradas.','El acento ayuda a leer.'],'¿Qué pueden indicar é/ê y ó/ô?','Diferencias de apertura vocálica',['Que son mudas','Consonantes dobles']),
        C('Vocales no acentuadas','e · o finales','ó','En muchas variedades, e y o finales se elevan y no suenan como en español.','Escucha el modelo de la variedad elegida.','No existe una única pronunciación idéntica en todo el mundo lusófono.',['e final puede acercarse a i.','o final puede acercarse a u.','La región modifica detalles.'],'¿Debes leer siempre E y O como en español?','No, su sonido depende de posición y variedad',['Sí','Nunca se pronuncian'])),
      L('Nasalización','Reconoce vocales nasales y la tilde.',
        C('Ã y Õ','ã · õ','eme','La tilde indica una vocal nasal.','Deja pasar aire por la nariz sin añadir n fuerte.','La nasalidad pertenece a la vocal.',['ã es nasal.','õ es nasal.','No son a/o españolas seguidas de n.'],'¿Qué indica la tilde en Ã u Õ?','Que la vocal es nasal',['Que es más fuerte','Que no se pronuncia']),
        C('M y N tras vocal','am · em · om','ene','Al final de sílaba, m/n suelen nasalizar la vocal.','No cierres siempre con una consonante española completa.','Compara la posición dentro de la sílaba.',['bem contiene vocal nasal.','bom contiene vocal nasal.','La consonante puede no oírse separada.'],'¿Qué pueden hacer M o N después de una vocal?','Nasalizarla',['Volverla muda','Duplicarla'])),
      L('Dígrafos','Dos letras pueden representar un sonido.',
        C('NH y LH','nh · lh','ele','NH se acerca a ñ; LH es una lateral palatal.','Aprende el grupo completo.','No se leen como letras independientes.',['ninho contiene nh.','filho contiene lh.','Cada grupo representa una unidad.'],'¿Cómo debes tratar NH o LH?','Como grupos sonoros, no letras separadas',['Como dos sílabas','Ignorando la H']),
        C('CH','ch','cê','CH suele sonar parecido a sh.','No uses automáticamente la ch española.','Es un dígrafo frecuente en palabras comunes.',['chave empieza con sonido sh.','Las dos letras forman una unidad.','Escucha la variedad objetivo.'],'¿Cómo suele sonar CH portugués?','Parecido a sh',['Como k','Como rr'])),
      L('R, RR y S','La posición cambia la realización.',
        C('R inicial y RR','rua · carro','erre','R inicial y RR suelen tener un sonido fuerte, variable por región.','Distingue caro de carro.','Una sola r entre vocales suele ser más suave.',['r inicial: fuerte.','rr: fuerte.','r intervocálica: suave.'],'¿CARO y CARRO tienen la misma R?','No',['Sí','La R es muda']),
        C('S entre vocales','casa','esse','S entre vocales suele sonar z; SS conserva s sorda.','Mira las letras vecinas.','La posición explica casa frente a massa.',['s intervocálica: frecuente sonido z.','ss: s sorda.','s final varía por región.'],'¿Cómo suele sonar S entre vocales?','Como z',['Siempre como sh','No suena'])),
      L('C, G y X','Aprende patrones contextuales y palabras especiales.',
        C('C y G ante E/I','ce/ci · ge/gi','gê','C suele sonar s y G suele sonar zh ante e/i.','Mira la vocal siguiente.','Ante a/o/u conservan sonidos más duros.',['ce/ci: s.','ge/gi: sonido semejante a zh.','ca/co/cu y ga/go/gu: duros.'],'¿Qué determina el sonido de C o G?','La vocal siguiente',['La longitud de la palabra','El artículo']),
        C('X tiene varios sonidos','x','xis','X puede sonar sh, s, z o ks según la palabra.','Aprende su sonido junto con cada palabra.','No existe una sola regla que cubra todos los casos.',['xícara empieza con sh.','táxi contiene ks.','exame puede contener z.'],'¿Debes asumir un solo sonido para X?','No, se aprende según la palabra',['Sí, siempre ks','X es muda'])),
      L('Acento y ritmo','Usa marcas gráficas y termina de unir sílabas.',
        C('Sílaba tónica','palavra','é','Las palabras siguen patrones de acento y los signos marcan excepciones.','Identifica la sílaba fuerte antes de leer fluido.','Agudo, circunflejo y tilde aportan información distinta.',['Marca una sílaba principal.','No acentúes todas igual.','Respeta los signos.'],'¿Qué guía el ritmo de una palabra?','Su sílaba tónica',['El nombre de la primera letra','La traducción']),
        C('Variedades legítimas','Brasil · Portugal','dáblio','La pronunciación brasileña y europea difiere en varios detalles.','Mantén una voz coherente por curso.','Las variantes no son errores; evita mezclarlas sin explicación.',['Vocales no acentuadas cambian.','R y S varían.','La comprensión mejora con exposición.'],'¿Existe una única pronunciación mundial del portugués?','No, hay variedades legítimas',['Sí','Solo cambia la ortografía'])),
    ],
  },
  Russian:{
    slug:'russian',name:'Ruso',icon:'Я',title:'Cómo se lee el cirílico',
    description:'Reconoce letras cirílicas, falsas amigas, signos, acento y cambios de sonido antes de leer palabras.',
    lessons:[
      L('Un alfabeto distinto','Aprende cirílico como sistema sonoro, sin transliteración permanente.',
        C('Cirílico representa sonidos','А · Б · В','а','Cada símbolo es una letra, no un dibujo.','Relaciona directamente letra y sonido.','La transliteración puede ayudar una vez, pero debe desaparecer pronto.',['А se parece y suena como a.','Б representa b.','В representa v.'],'¿Qué debes asociar directamente?','La letra cirílica con su sonido',['La letra solo con una latina','La palabra con una imagen sin sonido']),
        C('Lee de izquierda a derecha','мама','эм','El ruso se lee de izquierda a derecha.','Segmenta en letras y sílabas.','Aunque cambien las formas, la dirección coincide con el español.',['Identifica cada letra.','Forma la sílaba.','Une la palabra.'],'¿En qué dirección se lee ruso?','De izquierda a derecha',['De derecha a izquierda','De arriba abajo'])),
      L('Falsas amigas visuales','No leas letras por su parecido latino.',
        C('В, Н y Р','В = v · Н = n · Р = r','вэ','Su forma engaña a lectores del alfabeto latino.','Aprende sonido, no apariencia.','Estas tres letras causan errores muy frecuentes.',['В no es B latina.','Н no es H latina.','Р no es P latina.'],'¿Cómo suena Р rusa?','Como r',['Como p','Como b']),
        C('С, У y Х','С = s · У = u · Х = j/kh','эс','También parecen letras latinas con otro valor.','Detente y nombra el sonido ruso.','Reconocerlas automáticamente es esencial para leer.',['С no es c/k.','У no es y.','Х no es x española.'],'¿Cómo suena С rusa?','Como s',['Como k','Como u'])),
      L('Vocales pares','Algunas vocales también indican palatalización.',
        C('А/Я, О/Ё, У/Ю','а я · о ё · у ю','я','Я, Ё y Ю pueden incluir un deslizamiento y suavizar la consonante previa.','Aprende los pares.','Al inicio pueden sonar ya/yo/yu; tras consonante modifican su calidad.',['А ↔ Я.','О ↔ Ё.','У ↔ Ю.'],'¿Qué pueden indicar Я, Ё y Ю tras consonante?','Que la consonante se suaviza',['Que la palabra termina','Que la vocal es muda']),
        C('Э/Е e Ы/И','э е · ы и','э','Е e И suelen acompañar consonantes suaves; Ы requiere un sonido propio.','No conviertas Ы en i española.','Estos pares ayudan a anticipar la articulación de la consonante.',['Э: vocal sin y inicial.','Е puede sonar ye o suavizar.','Ы es central/posterior.'],'¿Ы suena exactamente como I española?','No',['Sí','No se pronuncia'])),
      L('Consonantes suaves y duras','La calidad de la consonante forma parte de la palabra.',
        C('Consonante suave','нь · ть','мягкий знак','La lengua se acerca al paladar al producir una consonante suave.','No añadas una i completa después.','La suavidad puede distinguir palabras.',['Vocales suaves pueden indicarla.','Ь también puede indicarla.','Es una cualidad consonántica.'],'¿Qué debes recordar sobre una consonante suave?','Que se palataliza',['Que se pronuncia más bajo','Que desaparece']),
        C('Ж, Ш, Ц','ж · ш · ц','жэ','Estas consonantes siguen patrones propios de dureza.','Apréndelas como categorías especiales.','La ortografía de vocales posteriores tiene reglas convencionales.',['Ж y Ш suelen ser duras.','Ц suele ser dura.','No todo depende de la vocal escrita.'],'¿Todas las consonantes se suavizan de la misma manera?','No',['Sí','Solo las vocales cambian'])),
      L('Ь y Ъ','Los signos no tienen sonido independiente.',
        C('Signo blando Ь','ь','мягкий знак','Ь modifica la consonante anterior o separa sonidos.','No intentes pronunciarlo solo.','Su función se entiende dentro de la palabra.',['Puede indicar suavidad.','Puede separar consonante y vocal iotada.','No aporta una vocal propia.'],'¿Tiene Ь un sonido independiente?','No',['Sí, una i','Sí, una b']),
        C('Signo duro Ъ','ъ','твёрдый знак','Ъ separa una consonante de una vocal iotada y mantiene su inicio y.','Es una señal ortográfica, no un sonido.','Aparece en menos palabras que Ь.',['Marca separación.','No se pronuncia solo.','Conserva el deslizamiento de е/ё/ю/я.'],'¿Qué hace Ъ?','Marca separación sin sonido propio',['Suena como k','Suaviza siempre'])),
      L('Acento y cambios sonoros','La escritura no marca siempre el acento.',
        C('Acento impredecible','замок','о','La sílaba tónica debe aprenderse con cada palabra.','Guarda palabra, audio y acento juntos.','El acento puede cambiar significado y forma de las vocales.',['Una sílaba es fuerte.','Las vocales átonas se reducen.','Los textos normales no escriben el acento.'],'¿Qué debes memorizar con una palabra rusa?','Su acento',['Solo la primera letra','Una transliteración']),
        C('Ensordecimiento final','д/т · б/п · г/к','дэ','Consonantes sonoras al final suelen hacerse sordas.','La escritura conserva la consonante original.','También hay asimilación entre consonantes vecinas.',['д final se acerca a т.','б final se acerca a п.','г final se acerca a к.'],'¿La consonante escrita final siempre conserva su sonoridad?','No',['Sí','Nunca se pronuncia'])),
    ],
  },
  Chinese:{
    slug:'chinese',name:'Chino',icon:'汉',title:'Cómo se empieza a leer chino',
    description:'Aprende primero iniciales, finales y tonos con pinyin; después reconoce caracteres y retira la ayuda gradualmente.',
    lessons:[
      L('Construir una sílaba en pinyin','Pinyin organiza la pronunciación en inicial, final y tono.',
        C('Inicial M y final A','m + a → mā','mā','Escucha una sola sílaba: mā.','Separa visualmente m y a; después vuelve a unirlas.','Pinyin es la guía oficial de pronunciación. No es el sistema principal de lectura de textos chinos.',['Inicial: m.','Final: a.','Marca: primer tono.'],'¿Qué partes forman mā?','Inicial m, final a y primer tono',['Dos caracteres','Una traducción y un radical']),
        C('Inicial N y final I','n + i → nǐ','nǐ','Escucha una sola sílaba: nǐ.','Relaciona la marca ˇ con el tercer tono.','Todavía no necesitas reconocer caracteres: primero estabiliza el sistema sonoro.',['Inicial: n.','Final: i.','Marca: tercer tono.'],'¿Qué partes forman nǐ?','Inicial n, final i y tercer tono',['Inicial m y final a','Un carácter sin tono'])),
      L('Los cuatro tonos','La altura melódica forma parte de cada sílaba.',
        C('Primer tono','mā','mā','El primer tono es alto y sostenido.','Mantén la altura estable.','Cada tono tendrá una tarjeta y un audio propios.',['Marca: ¯.','Contorno alto y plano.','Sílaba: mā.'],'¿Qué tono acabas de escuchar?','Primer tono: alto y sostenido',['Segundo tono: ascendente','Cuarto tono: descendente']),
        C('Segundo tono','má','má','El segundo tono asciende.','Sigue la subida hasta el final.','No lo conviertas en una simple subida interrogativa española.',['Marca: ´.','Contorno ascendente.','Sílaba: má.'],'¿Qué tono acabas de escuchar?','Segundo tono: ascendente',['Primer tono: plano','Cuarto tono: descendente']),
        C('Tercer tono','mǎ','mǎ','Aislado, el tercer tono baja y puede recuperarse.','En habla continua suele realizarse parcialmente.','Aprende primero su contorno de referencia y luego sus cambios contextuales.',['Marca: ˇ.','Contorno bajo.','Sílaba: mǎ.'],'¿Qué tono acabas de escuchar?','Tercer tono: bajo y con recuperación posible',['Primer tono: plano','Segundo tono: ascendente']),
        C('Cuarto tono','mà','mà','El cuarto tono cae con firmeza.','Comienza alto y termina bajo.','La caída pertenece a la sílaba; no es enfado obligatorio.',['Marca: `.','Contorno descendente.','Sílaba: mà.'],'¿Qué tono acabas de escuchar?','Cuarto tono: caída firme',['Primer tono: plano','Segundo tono: ascendente'])),
      L('Iniciales y aspiración','La diferencia b/p, d/t y g/k es principalmente aspiración.',
        C('Inicial B','bā','bā','B en pinyin lleva poca aspiración.','Acerca una mano a la boca y siente poco aire.','No equivale exactamente a la b sonora española.',['Inicial: b.','Poca aspiración.','Sílaba: bā.'],'¿Qué inicial acabas de practicar?','b, con poca aspiración',['p, con más aspiración','m, nasal']),
        C('Inicial P','pā','pā','P en pinyin lleva una salida de aire clara.','Acerca una mano a la boca para comprobarla.','El contraste principal con b es la aspiración.',['Inicial: p.','Más aspiración.','Sílaba: pā.'],'¿Qué inicial acabas de practicar?','p, con más aspiración',['b, con poca aspiración','m, nasal']),
        C('Inicial D','dā','dā','D en pinyin lleva poca aspiración.','La punta de la lengua toca la zona dental/alveolar.','Compárala después con tā.',['Inicial: d.','Poca aspiración.','Sílaba: dā.'],'¿Qué inicial acabas de practicar?','d, con poca aspiración',['t, con más aspiración','g, posterior']),
        C('Inicial T','tā','tā','T en pinyin añade una salida de aire marcada.','Siente el aire tras soltar la lengua.','La aspiración la separa de d.',['Inicial: t.','Más aspiración.','Sílaba: tā.'],'¿Qué inicial acabas de practicar?','t, con más aspiración',['d, con poca aspiración','k, posterior']),
        C('Inicial G','gē','gē','G en pinyin es posterior y poco aspirada.','No añadas una vocal extra.','En mandarín estándar no funciona como la g sonora española.',['Inicial: g.','Poca aspiración.','Sílaba: gē.'],'¿Qué inicial acabas de practicar?','g, posterior y poco aspirada',['k, más aspirada','j, palatal']),
        C('Inicial K','kē','kē','K en pinyin es posterior y más aspirada.','Siente el aire al soltarla.','Practícala por separado antes del contraste g/k.',['Inicial: k.','Más aspiración.','Sílaba: kē.'],'¿Qué inicial acabas de practicar?','k, posterior y aspirada',['g, poco aspirada','q, palatal'])),
      L('J, Q, X y retroflejas','Aprende posiciones que no corresponden al español.',
        C('Inicial J','jī','jī','J es una inicial palatal con poca aspiración.','Mantén la lengua hacia el paladar.','Aprende j antes de compararla con q y x.',['Inicial: j.','Poca aspiración.','Sílaba: jī.'],'¿Qué inicial acabas de practicar?','j',['q','x']),
        C('Inicial Q','qī','qī','Q es palatal y aspirada.','Siente la salida de aire.','No se lee como la letra q española.',['Inicial: q.','Más aspiración.','Sílaba: qī.'],'¿Qué inicial acabas de practicar?','q',['j','x']),
        C('Inicial X','xī','xī','X es una fricativa palatal suave.','No la leas como ks.','Deja pasar aire por un canal estrecho cerca del paladar.',['Inicial: x.','Sonido fricativo.','Sílaba: xī.'],'¿Qué inicial acabas de practicar?','x, como fricativa palatal',['x como ks','q aspirada'])),
      L('Iniciales retroflejas','ZH, CH, SH y R son iniciales completas, no letras sueltas.',
        C('Inicial ZH','zhī','zhī','ZH es una africada retrofleja poco aspirada.','Retrae ligeramente la punta de la lengua.','Lee zh como una unidad.',['Inicial: zh.','Retrofleja.','Sílaba: zhī.'],'¿Qué inicial acabas de practicar?','zh',['ch','sh']),
        C('Inicial CH','chī','chī','CH es la contraparte aspirada de zh.','Mantén la posición y añade aire.','Lee ch como una unidad.',['Inicial: ch.','Retrofleja y aspirada.','Sílaba: chī.'],'¿Qué inicial acabas de practicar?','ch',['zh','sh']),
        C('Inicial SH','shī','shī','SH es una fricativa retrofleja.','Mantén un flujo de aire continuo.','No separes s y h.',['Inicial: sh.','Retrofleja y fricativa.','Sílaba: shī.'],'¿Qué inicial acabas de practicar?','sh',['zh','ch']),
        C('Inicial R','rì','rì','R usa una posición retrofleja y no equivale a la erre vibrante española.','No hagas vibrar repetidamente la lengua.','Apréndela por audio antes de verla dentro de palabras.',['Inicial: r.','Posición retrofleja.','Sílaba: rì.'],'¿Qué inicial acabas de practicar?','r',['l','sh'])),
      L('Finales y Ü','Practica finales antes de añadir caracteres.',
        C('Final A','a → mā','mā','A es la final de mā.','Identifica la parte vocálica después de la inicial.','El tono se marca sobre la vocal correspondiente.',['Inicial: m.','Final: a.','Primer tono.'],'¿Cuál es la final de mā?','a',['i','ü']),
        C('Final I','i → nǐ','nǐ','I es la final de nǐ.','Mira la marca tonal sobre i.','La sílaba conserva inicial, final y tono.',['Inicial: n.','Final: i.','Tercer tono.'],'¿Cuál es la final de nǐ?','i',['a','u']),
        C('Final Ü','ü → nǚ','nǚ','Ü es una vocal frontal con labios redondeados.','Forma i con la lengua y redondea los labios.','Tras j, q, x e y los puntos pueden omitirse en la escritura pinyin; el sonido sigue siendo ü.',['Inicial: n.','Final: ü.','Tercer tono.'],'¿Cuál es la final de nǚ?','ü',['u','i'])),
      L('Primeros caracteres','Solo después de la base sonora comienzas a reconocer formas y significados.',
        C('Carácter 你','你','nǐ','你 se pronuncia nǐ y significa «tú».','Mira primero el carácter y usa pinyin como apoyo temporal.','Ahora el audio coincide exactamente con el carácter mostrado.',['Carácter: 你.','Pinyin: nǐ.','Significado: tú.'],'¿Qué significa 你?','tú',['hola','persona']),
        C('Carácter 好','好','hǎo','好 se pronuncia hǎo y expresa «bien/bueno».','Relaciona forma, audio y significado.','No memorices únicamente el pinyin.',['Carácter: 好.','Pinyin: hǎo.','Significado: bien/bueno.'],'¿Qué significa 好?','bien / bueno',['tú','persona']),
        C('Carácter 人','人','rén','人 se pronuncia rén y significa «persona».','Reconoce su forma completa antes de escribirla.','La escritura manual se añadirá con su orden de trazos.',['Carácter: 人.','Pinyin: rén.','Significado: persona.'],'¿Qué significa 人?','persona',['bien','tú'])),
      L('Componentes y retiro del pinyin','Construye memoria visual sin convertir pinyin en texto principal.',
        C('Componentes recurrentes','女 + 子 → 好','hǎo','好 contiene componentes que ayudan a analizar su forma.','Observa las partes y vuelve al carácter completo.','Los componentes pueden aportar pistas semánticas, fonéticas o históricas; no siempre son una traducción literal.',['Izquierda: 女.','Derecha: 子.','Carácter completo: 好.'],'¿Qué debes volver a reconocer después de analizar componentes?','El carácter completo 好',['Solo el pinyin','Una traducción sin carácter']),
        C('Ocultar pinyin gradualmente','你好','nǐ hǎo','Primero intenta reconocer 你好; muestra nǐ hǎo solo si lo necesitas.','Los ojos deben volver siempre a los caracteres.','HSK University recomienda pinyin y tonos primero, y después añadir caracteres gradualmente.',['Mira caracteres.','Intenta recordar.','Revela pinyin como ayuda opcional.'],'¿Cuándo conviene mostrar pinyin después de esta base?','Solo como ayuda opcional',['Siempre en tamaño mayor','Nunca, ni al aprender pronunciación'])),
    ],
  },
  Arabic:{
    slug:'arabic',name:'Árabe',icon:'أب',title:'Cómo se lee el árabe',
    description:'Aprende dirección, conexión, formas contextuales y vocales antes de intentar reconocer palabras.',
    lessons:[
      L('Dirección y alfabeto','Cambia la dirección de lectura y reconoce letras, no dibujos.',
        C('De derecha a izquierda','العربية','ألف','El texto árabe se lee de derecha a izquierda.','Empieza en el extremo derecho de cada línea.','Los números pueden mantener otra dirección dentro del texto.',['Las palabras avanzan hacia la izquierda.','Las letras se conectan.','La línea siguiente comienza otra vez a la derecha.'],'¿En qué dirección se leen las palabras árabes?','De derecha a izquierda',['De izquierda a derecha','De abajo arriba']),
        C('Letras consonánticas','ب · ت · ث','باء','Muchas letras comparten una forma base y se distinguen por puntos.','Cuenta y ubica los puntos.','Los puntos son esenciales, no adornos.',['ب: un punto abajo.','ت: dos puntos arriba.','ث: tres puntos arriba.'],'¿Qué distingue especialmente ب, ت y ث?','La cantidad y posición de puntos',['El tamaño','El color'])),
      L('Letras que se conectan','La forma cambia según la posición.',
        C('Cuatro formas contextuales','عـ ـعـ ـع ع','عين','Una letra puede tener forma aislada, inicial, media y final.','Busca su esqueleto común.','No son cuatro letras distintas.',['Aislada.','Conectada al inicio/medio.','Conectada al final.'],'¿Las formas contextuales representan letras distintas?','No, son la misma letra en posiciones distintas',['Sí','Solo la final es letra']),
        C('La palabra es una cadena','كتب','كاف','Lee la cadena identificando cada forma conectada.','No memorices la silueta completa sin analizar.','Segmenta mentalmente en letras y luego une sonidos.',['Identifica ك.','Después ت.','Finalmente ب.'],'¿Cómo empiezas a leer una palabra conectada?','Identificando sus letras contextuales',['Como un dibujo único','Desde la izquierda'])),
      L('Letras que no conectan después','Seis letras interrumpen la unión hacia la izquierda.',
        C('ا د ذ ر ز و','ا د ذ ر ز و','دال','Estas letras se conectan con la anterior, pero no con la siguiente.','Espera un pequeño corte visual después.','El corte no significa que empiece otra palabra.',['ا no conecta después.','د/ذ no conectan después.','ر/ز/و tampoco.'],'¿Un corte tras ا siempre separa palabras?','No, puede ser la misma palabra',['Sí','Solo ocurre al final']),
        C('Reconoce el espacio real','دار','راء','Distingue el corte causado por una letra del espacio entre palabras.','Mira la distancia y la estructura.','Con práctica, ambos tipos de separación se vuelven claros.',['Las letras de una palabra pueden verse en grupos.','El espacio entre palabras es mayor.','La dirección sigue igual.'],'¿Por qué una palabra árabe puede verse dividida?','Porque algunas letras no conectan hacia la izquierda',['Porque se lee por columnas','Porque faltan letras'])),
      L('Vocales cortas','Las marcas vocálicas suelen omitirse en textos normales.',
        C('Fatha, kasra y damma','َ ِ ُ','ألف','Estas marcas indican a, i y u breves.','Apréndelas en textos vocalizados antes de retirarlas.','Material infantil y didáctico suele mostrarlas.',['َ encima: a breve.','ِ debajo: i breve.','ُ encima: u breve.'],'¿Qué indican َ ِ ُ?','Vocales cortas',['Puntos de consonante','Final de oración']),
        C('Sukun y shadda','ْ ّ','شين','Sukun indica ausencia de vocal; shadda duplica una consonante.','No ignores estas marcas al aprender.','Cambian la estructura silábica y pueden cambiar significado.',['ْ: sin vocal posterior.','ّ: consonante doble.','Se combinan con marcas vocálicas.'],'¿Qué indica shadda ّ?','Una consonante duplicada',['Una vocal larga','Una pausa de párrafo'])),
      L('Vocales largas y hamza','Reconoce letras que prolongan y el ataque glotal.',
        C('ا و ي como largas','ا · و · ي','واو','Tras la vocal correspondiente pueden indicar ā, ū, ī.','Distingue letra vocálica larga de consonante w/y.','La función depende del contexto.',['َ + ا → ā.','ُ + و → ū.','ِ + ي → ī.'],'¿Qué pueden representar ا, و, ي?','Vocales largas según el contexto',['Solo puntuación','Siempre letras mudas']),
        C('Hamza ء','ء · أ · إ','ألف','Hamza representa un cierre glotal y puede escribirse con distintos soportes.','Reconoce el signo aunque cambie su asiento.','No es idéntica a alif, aunque a menudo aparezcan juntas.',['ء puede aparecer sola.','أ/إ usan alif como soporte.','La posición sigue reglas ortográficas.'],'¿Qué representa hamza?','Un cierre glotal',['Una vocal larga fija','El plural'])),
      L('Leer con y sin vocales','Pasa gradualmente de texto vocalizado a texto normal.',
        C('Primero con ayudas','كِتاب','تاء','Las marcas permiten comprobar la sílaba y el patrón.','Lee con marcas, escucha y repite.','Después verás la misma palabra sin todas las vocales cortas.',['Identifica consonantes.','Añade vocales marcadas.','Une la palabra.'],'¿Qué conviene usar al principio?','Texto vocalizado y audio',['Solo texto sin marcas','Transliteración permanente']),
        C('Luego reconoce patrones','كتاب','باء','En textos comunes deduces vocales por vocabulario, gramática y patrones.','No se espera adivinar palabras desconocidas sin contexto.','La lectura mejora al ampliar vocabulario y raíces.',['Reconoce la raíz.','Usa el patrón.','Confirma con contexto.'],'¿Cómo se leen textos sin todas las vocales?','Con vocabulario, patrones y contexto',['Inventando vocales al azar','Leyendo solo puntos'])),
    ],
  },
  Japanese:{
    slug:'japanese',name:'Japonés',icon:'あ',title:'Cómo funciona la escritura japonesa',
    description:'Comprende kana, mora, kanji y ayudas de lectura antes de memorizar hiragana y katakana.',
    lessons:[
      L('Tres sistemas de escritura','Distingue hiragana, katakana y kanji sin usar rōmaji.',
        C('Hiragana','あ い う え お','あ','Hiragana representa moras y aparece en terminaciones y palabras japonesas.','Asocia cada signo directamente con su sonido.','El Mundo 1 enseñará el silabario completo de forma acumulativa.',['Formas curvas frecuentes.','Una mora por signo básico.','Base indispensable para leer.'],'¿Qué aprenderás primero para leer japonés?','Hiragana',['Rōmaji permanente','Solo kanji']),
        C('Katakana y kanji','ア · 日','い','Katakana representa las mismas moras; kanji aporta significado y lecturas.','No confundas función con sonido.','Katakana se usa mucho en préstamos; kanji se combina con kana.',['ア es katakana.','日 es kanji.','Ambos pueden aparecer en una frase.'],'¿Katakana usa sonidos totalmente distintos de hiragana?','No, representa las mismas moras básicas',['Sí','No representa sonidos'])),
      L('Moras y cinco vocales','El ritmo japonés se organiza en unidades regulares.',
        C('Cinco vocales','あ い う え お','あ','Las vocales son estables y cada kana básico contiene una mora.','No añadas diptongos españoles.','Escucha cada vocal y conserva su duración.',['あ: a.','い: i.','う/え/お completan el sistema.'],'¿Cuántas vocales básicas organiza el kana?','Cinco',['Tres','Diez']),
        C('Mora no es sílaba española','ひと','ひと','ひ・と ocupa dos moras.','Cuenta golpes rítmicos regulares.','Cada kana básico ocupa una mora; más adelante verás que ん y っ también cuentan.',['ひ: una mora.','と: una mora.','Mantén dos pulsos regulares.'],'¿Cuántas moras tiene «ひと»?','Dos',['Una','Tres'])),
      L('Filas del kana','Una consonante se combina con las cinco vocales.',
        C('La fila K','か き く け こ','か','La fila conserva una consonante aproximada k y cambia la vocal.','Aprende por familias, no en orden aleatorio.','El curso presenta una familia, practica y repasa anteriores.',['か: k+a.','き: k+i.','く/け/こ continúan la fila.'],'¿Qué cambia dentro de una fila de kana?','La vocal',['El sentido de lectura','El tipo de escritura']),
        C('Excepciones de sonido','し · ち · つ · ふ','し','Algunos kana no siguen una combinación española literal.','Aprende su sonido japonés directamente.','No dependas de escribir shi, chi o tsu en rōmaji.',['し tiene sonido propio.','ち y つ requieren escucha.','ふ no es una f española idéntica.'],'¿Cómo debes aprender し o つ?','Asociando el kana directamente con su audio',['Leyendo rōmaji siempre','Inventando una vocal'])),
      L('Marcas y kana pequeños','Dakuten, handakuten y tamaño cambian el sonido.',
        C('Dakuten y handakuten','か→が · は→ぱ','が','Las marcas convierten familias sordas en sonoras o en la serie p.','Observa los dos trazos o el pequeño círculo.','No son signos decorativos.',['か→が.','さ→ざ.','は→ば o ぱ.'],'¿Qué hace dakuten?','Modifica la consonante de una familia',['Alarga siempre la vocal','Convierte kana en kanji']),
        C('Kana pequeños','きゃ · っ','きゃ','ゃゅょ pequeños forman combinaciones; っ marca consonante doble.','El tamaño importa.','No leas el kana pequeño como una mora completa independiente.',['き + ゃ → きゃ.','っ prepara una consonante doble.','El ritmo cambia.'],'¿Un kana pequeño se lee igual que uno grande aislado?','No',['Sí','Es silencioso siempre'])),
      L('Vocales largas','La duración puede distinguir palabras.',
        C('Duración vocálica','おばさん · おばあさん','おばあさん','Una vocal larga ocupa más tiempo y puede cambiar significado.','Cuenta una mora adicional.','No reduzcas la diferencia a un acento gráfico.',['おばさん: tía/señora.','おばあさん: abuela/señora mayor.','あ adicional cuenta.'],'¿Una vocal larga puede cambiar significado?','Sí',['No','Solo en canciones']),
        C('Chōonpu en katakana','コーヒー','コーヒー','La raya ー alarga la vocal anterior.','No la leas como guion.','Es muy frecuente en palabras extranjeras escritas en katakana.',['コー alarga o.','ヒー alarga i.','Cada alargamiento afecta el ritmo.'],'¿Qué indica ー en katakana?','Vocal larga',['Separación de palabras','Consonante doble'])),
      L('Kanji y furigana','Aprende lectura útil dentro de palabras, no todas a la vez.',
        C('Kanji aporta significado','人','ひと','人 representa la idea de persona y se aprende primero en una palabra útil.','Une carácter, palabra, audio y significado.','Un kanji puede tener varias lecturas según la palabra.',['人 → ひと en esta palabra.','Aprende una lectura útil.','Amplía lecturas con vocabulario real.'],'¿Conviene memorizar todas las lecturas de un kanji de golpe?','No',['Sí','Los kanji no tienen lectura']),
        C('Furigana es ayuda temporal','人（ひと）','ひと','Furigana muestra kana sobre o junto al kanji.','Intenta recordar primero y consúltala después.','A diferencia del rōmaji, mantiene al alumno dentro del sistema japonés.',['Muestra pronunciación en kana.','Ayuda con kanji nuevos.','Puede ocultarse gradualmente.'],'¿Qué sistema debe usar la ayuda de lectura japonesa?','Kana mediante furigana, no rōmaji',['Solo letras latinas','Traducción española encima'])),
    ],
  },
};

const activity=(id,type,prompt,target='',options=[],answer='',explanation='',audio='',extra={})=>({
  id,type,prompt,target,options,answer,explanation,audio,slow_audio:audio,
  image:null,writing_asset:null,tags:['reading-foundations'],xp:extra.gradable===false?2:10,
  ...extra,
});
const intro=(id,title,text)=>activity(`${id}-intro`,'lesson_intro',title,'',[],'',text,'',{gradable:false});
const teach=(id,concept)=>activity(`${id}-teach`,'teach_concept',concept.title,concept.target,[],'',concept.explanation,concept.audio,{
  gradable:false,meaning:'',teaching_kind:'rule',sound_hint:concept.sound,
  memory_hint:concept.memory,teaching_points:concept.points,
});
const question=(id,concept)=>activity(`${id}-question`,'select_translation',concept.question,concept.target,[concept.answer,...concept.distractors],concept.answer,concept.explanation,concept.audio);

const makeLesson=(spec,lesson,index)=>{
  const id=`${spec.slug}-reading-00-${String(index+1).padStart(2,'0')}`;
  return{id,title:lesson.title,description:lesson.description,activities:[
    intro(id,'Primero comprende la regla',lesson.description),
    ...lesson.concepts.flatMap((concept,conceptIndex)=>{
      const suffix=String.fromCharCode(97+conceptIndex);
      return[teach(`${id}-${suffix}`,concept),question(`${id}-${suffix}`,concept)];
    }),
  ]};
};
const makeReview=(spec,lessons)=>{
  const id=`${spec.slug}-reading-00-review`;
  return{id,title:'Repaso: reglas de lectura',description:'Recupera las reglas esenciales antes de la prueba.',isReview:true,activities:[
    intro(id,'Repaso acumulativo','Recuerda cada regla sin mirar una transcripción permanente.'),
    ...lessons.map((lesson,index)=>question(`${id}-${index+1}`,lesson.concepts[index%lesson.concepts.length])),
  ]};
};
const makeTest=(spec,lessons)=>{
  const id=`${spec.slug}-reading-00-test`,concepts=lessons.flatMap(lesson=>lesson.concepts);
  return{id,title:'Prueba: preparado para aprender a leer',description:'Demuestra dominio total de las reglas iniciales.',isTest:true,isUnitFinal:true,passingScore:100,activities:[
    intro(id,'Prueba de dominio','Necesitas 100 %. Si fallas una regla, la repasas y vuelves a intentarlo.'),
    ...concepts.map((concept,index)=>question(`${id}-${index+1}`,concept)),
  ]};
};

const sqlRows=[];
for(const [directory,spec] of Object.entries(specs)){
  const root=path.join(coursesRoot,directory),coursePath=path.join(root,'course.json');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'audio_manifest.json'),'utf8')).items||{};
  const missing=[...new Set(spec.lessons.flatMap(lesson=>lesson.concepts.map(concept=>concept.audio)).filter(audio=>audio&&!manifest[audio]))];
  if(missing.length)console.warn(`${directory}: faltan audios por generar: ${missing.join(', ')}`);
  const normal=spec.lessons.map((lesson,index)=>makeLesson(spec,lesson,index));
  const unit={id:'reading-foundations',title:spec.title,description:spec.description,requirements:[],reward:{xp:220,badge:'Lector inicial'},lessons:[...normal,makeReview(spec,spec.lessons),makeTest(spec,spec.lessons)]};
  const unitPath=path.join(root,'units','reading-foundations.json');
  fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');

  const course=JSON.parse(fs.readFileSync(coursePath,'utf8')),foundations=course.levels?.find(level=>level.id==='foundations');
  const summary={id:'reading-foundations',world:0,mapLabel:'MUNDO 0',title:spec.title.replace(/^Cómo (se empieza a leer|se lee|funciona la escritura) /i,'Lectura inicial: '),description:spec.description,icon:spec.icon,manifest:'units/reading-foundations.json'};
  course.units=[summary,...(course.units||[]).filter(unit=>unit.id!=='reading-foundations')];
  if(foundations)foundations.unitIds=['reading-foundations',...(foundations.unitIds||[]).filter(id=>id!=='reading-foundations')];
  course.unlockRules={...(course.unlockRules||{}),requireReadingMastery:true,readingUnitId:'reading-foundations'};
  const contentVersion=['French','Chinese'].includes(directory)?12:11;
  course.version=Math.max(contentVersion,Number(course.version||0));
  fs.writeFileSync(coursePath,JSON.stringify(course,null,2)+'\n');

  for(const lesson of unit.lessons){
    const type=lesson.isReview?'review':lesson.isTest?'test':'normal',xp=lesson.isReview?5:lesson.isTest?35:20;
    sqlRows.push(`  ('${spec.slug}','${spec.slug}-from-zero','${lesson.id}','${type}',${xp},true,'{\"source\":\"guided-course\",\"unitId\":\"reading-foundations\",\"level\":\"A0\",\"requiresMastery\":${lesson.passingScore===100?'true':'false'}}'::jsonb)`);
  }
  console.log(`${directory}: Mundo 0 con ${unit.lessons.length} pasos; curso v${course.version}.`);
}

const sql=`begin;

-- Fundamentos de lectura previos al vocabulario. Las pruebas finales requieren 100 %.
insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
values
${sqlRows.join(',\n')}
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

commit;
`;
fs.writeFileSync(path.join(web,'supabase','migrations','015_reading_foundations_all_languages.sql'),sql);

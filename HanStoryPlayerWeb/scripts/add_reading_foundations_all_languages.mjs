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
    description:'Domina acentos, grupos vocálicos, sonidos nasales y letras finales antes de leer frases.',
    lessons:[
      L('Letras y acentos','Los acentos forman parte de la lectura.',
        C('É y È orientan el sonido','é · è','e','É suele ser más cerrada y è más abierta.','No ignores el acento escrito.','Los acentos ayudan a distinguir el sonido y, a veces, el significado.',['é: vocal cerrada.','è/ê: vocal más abierta.','El acento no es decoración.'],'¿Qué indican é y è?','Orientan hacia sonidos vocálicos distintos',['Solo énfasis visual','Que la letra es muda']),
        C('Ç cambia C','ç','cé','Ç delante de a, o, u representa un sonido s.','La cedilla evita el sonido k.','Compara ca y ça para reconocer su función.',['c + a suele sonar k.','ç + a suena s.','La cedilla aparece bajo c.'],'¿Cómo suele sonar ç?','Como s',['Como k','No suena'])),
      L('Grupos vocálicos','Lee varias letras como una sola unidad.',
        C('OU no es U','ou · u','u','OU suele aproximarse a u española; U francesa es frontal y redondeada.','No leas ambas como la misma vocal.','La diferencia distingue muchas palabras.',['ou: labios redondeados y lengua atrás.','u: labios redondeados y lengua adelante.','Escucha pares contrastivos.'],'¿OU y U francesas suenan igual?','No, representan vocales distintas',['Sí, siempre','Solo cambian al escribir']),
        C('AU y EAU','au · eau','o','Ambos grupos suelen representar un sonido cercano a o.','Reconoce el bloque completo.','No pronuncies cada vocal por separado.',['au funciona como una unidad.','eau también funciona como unidad.','La palabra conserva una sola vocal audible.'],'¿Cómo lees normalmente EAU?','Como un grupo vocálico, cercano a o',['Como tres vocales separadas','Como e muda únicamente'])),
      L('Vocales nasales','Reconoce cuando n o m nasalizan la vocal.',
        C('AN / EN','an · en','enne','La vocal se nasaliza y la n normalmente no forma una sílaba aparte.','Deja salir aire por la nariz.','El patrón cambia si después aparece otra vocal.',['an/en forman una vocal nasal frecuente.','No añadas una n española fuerte.','Observa la letra siguiente.'],'¿Qué ocurre normalmente en AN o EN?','La vocal se nasaliza',['Se pronuncian dos sílabas','La vocal desaparece']),
        C('ON / IN','on · in','o','Son dos vocales nasales diferentes.','Apréndelas con audio y contraste.','La escritura agrupa vocal y consonante nasal.',['on es redondeada y nasal.','in es más frontal.','No leas la consonante final como en español.'],'¿ON e IN representan el mismo sonido?','No, son vocales nasales distintas',['Sí','Solo cambia el volumen'])),
      L('Finales silenciosos','Muchas consonantes finales no se pronuncian.',
        C('La última letra puede callar','petit · grand','té','No leas automáticamente toda consonante final.','Confirma la pronunciación con el audio.','C, R, F y L se oyen con más frecuencia que otras finales, pero hay excepciones.',['Muchas d, t, s, x finales callan.','Algunas finales sí se oyen.','Aprende palabras y patrones.'],'¿Debes pronunciar toda consonante final francesa?','No, muchas son silenciosas',['Sí, todas','Solo en plural']),
        C('E final','e final','e','La e final suele ser muda y puede afectar la consonante anterior.','No añadas una e española al final.','En poesía o variedades regionales puede comportarse de otra manera.',['Suele no formar sílaba.','Puede hacer audible una consonante previa.','El contexto importa.'],'¿La e final suele formar una sílaba fuerte?','No, normalmente es muda',['Sí, siempre','Solo después de vocal'])),
      L('Liaison y encadenamiento','Aprende cuándo una consonante reaparece al unir palabras.',
        C('Liaison','les amis','elle','Una consonante final normalmente muda puede enlazarse con una vocal siguiente.','Lee el grupo de palabras, no cada palabra aislada.','La liaison es obligatoria en algunos contextos, opcional o prohibida en otros.',['les amis enlaza con sonido z.','No toda frontera permite liaison.','Escucha expresiones completas.'],'¿Qué es la liaison?','Enlazar una consonante final con la vocal siguiente',['Eliminar todas las vocales','Separar más las palabras']),
        C('Ritmo por grupos','un groupe rythmique','erre','El francés organiza el ritmo en grupos y suele acentuar el final del grupo.','Evita acentuar cada palabra como en español.','La lectura natural une palabras gramaticalmente relacionadas.',['Forma grupos breves.','Mantén fluidez dentro del grupo.','Marca suavemente su final.'],'¿Dónde recae normalmente la prominencia francesa?','Al final de un grupo rítmico',['En la primera letra de cada palabra','En todas las sílabas'])),
      L('Leer sin deletrear','Combina reglas y escucha antes de traducir.',
        C('Busca unidades gráficas','ch · ph · gn','gé','Un grupo puede representar un sonido único.','Señala primero los grupos conocidos.','CH, PH y GN no deben separarse en nombres de letras.',['ch suele sonar sh.','ph suele sonar f.','gn se parece a ñ.'],'¿Cómo empiezas a leer una palabra francesa?','Reconociendo grupos de letras frecuentes',['Nombrando cada letra','Ignorando los acentos']),
        C('Verifica con audio','Bonjour !','Bonjour !','La ortografía orienta, pero el audio confirma el patrón real.','Lee, escucha y corrige la hipótesis.','Con exposición, los patrones se vuelven automáticos.',['Haz una primera lectura.','Escucha el modelo.','Compara y ajusta.'],'¿Qué función tiene el audio al aprender a leer?','Confirmar y ajustar la lectura',['Sustituir para siempre el texto','Traducir automáticamente'])),
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
    description:'Usa pinyin y tonos para aprender pronunciación, pero centra la lectura en caracteres y retira la ayuda gradualmente.',
    lessons:[
      L('Caracteres y pinyin','Comprende que pinyin es una guía de sonido, no el texto final.',
        C('El carácter lleva significado','你','nǐ hǎo','你 es el carácter que aprenderás a reconocer directamente.','Mira primero el carácter; revela pinyin solo como ayuda.','El mandarín no usa un alfabeto para escribir palabras corrientes.',['你: carácter.','nǐ: pronunciación en pinyin.','«tú»: significado.'],'¿Qué debe reconocer primero el lector?','El carácter chino',['Solo el pinyin','La traducción española']),
        C('Pinyin es una herramienta','nǐ','nǐ hǎo','Pinyin registra pronunciación y tono con letras latinas.','Úsalo para escuchar y luego ocúltalo.','Los propios estudiantes chinos aprenden pinyin, pero los textos normales usan caracteres.',['Ayuda con inicial y final.','Marca el tono.','No sustituye a los caracteres.'],'¿Para qué sirve pinyin?','Para aprender pronunciación y tonos',['Para reemplazar siempre los caracteres','Para traducir'])),
      L('Los cuatro tonos','La altura melódica forma parte de cada sílaba.',
        C('Primer y segundo tono','mā · má','mā','El primero es alto y sostenido; el segundo asciende.','Sigue el contorno completo.','No basta pronunciar las mismas consonantes y vocales.',['mā: alto y estable.','má: ascendente.','La marca se coloca sobre la vocal.'],'¿Son iguales mā y má?','No, tienen tonos diferentes',['Sí','Solo cambia la escritura']),
        C('Tercer y cuarto tono','mǎ · mà','mǎ','El tercero baja y se recupera en forma aislada; el cuarto cae con firmeza.','Aprende el contorno y sus cambios en habla real.','El tercer tono suele realizarse parcialmente dentro de frases.',['mǎ: tono bajo/descendente-ascendente.','mà: caída fuerte.','El contexto modifica detalles.'],'¿Qué distingue mǎ de mà?','El contorno tonal',['La consonante inicial','El número de sílabas'])),
      L('Iniciales y aspiración','La diferencia b/p, d/t y g/k es principalmente aspiración.',
        C('B/P y D/T','bā · pā · dā · tā','bā','P y T llevan una salida de aire más fuerte que B y D.','No lo reduzcas a sonora/sorda como español.','Acerca una mano para sentir la aspiración.',['b/d: poca aspiración.','p/t: más aspiración.','La vocal puede ser igual.'],'¿Qué distingue especialmente P de B en pinyin?','La aspiración',['El tono siempre','La longitud escrita']),
        C('G/K','gē · kē','gē','K es más aspirada que G.','Conserva la lengua en posición posterior.','Ambas son sordas en mandarín estándar; cambia el aire.',['g: poca aspiración.','k: más aspiración.','No añadas una vocal.'],'¿Qué caracteriza K frente a G?','Más aspiración',['Menos aire','Un tono fijo'])),
      L('J, Q, X y retroflejas','Aprende posiciones que no corresponden al español.',
        C('J/Q/X','jī · qī · xī','jī','La lengua se acerca al paladar; Q es aspirada y X más fricativa.','No leas X como ks.','Estas iniciales aparecen con vocales frontales.',['j: africada sin mucha aspiración.','q: africada aspirada.','x: fricativa suave.'],'¿Cómo se lee X en pinyin?','Como una fricativa palatal, no ks',['Como ks','Como j española fuerte']),
        C('ZH/CH/SH/R','zhī · chī · shī · rì','zhī','La punta de la lengua se retrae; CH añade aspiración.','Aprende el grupo completo, no cada letra.','Son iniciales retroflejas frecuentes.',['zh: africada retrofleja.','ch: versión aspirada.','sh/r: sonidos retroflejos.'],'¿Debes separar ZH o CH en dos sonidos?','No, son iniciales completas',['Sí','La H es muda siempre'])),
      L('Finales y sílaba','Combina inicial, final y tono como una sola unidad.',
        C('Estructura de sílaba','m + a + tono','má','Una sílaba puede tener inicial, final y tono.','No separes el tono del resto.','Algunas sílabas no tienen consonante inicial.',['Inicial: m.','Final: a.','Tono: segundo.'],'¿Qué tres partes analizas en má?','Inicial, final y tono',['Dos caracteres y traducción','Solo consonante']),
        C('Ü tras J/Q/X/Y','ju · qu · xu · yu','qī','La diéresis suele omitirse después de j, q, x, y, pero el sonido sigue siendo ü.','No conviertas automáticamente u en u española.','En nü y lü la diéresis se conserva para evitar ambigüedad.',['ju contiene sonido ü.','lü escribe diéresis.','El contexto ortográfico importa.'],'¿Qué vocal contiene normalmente JU en pinyin?','El sonido ü',['Una u española pura','No tiene vocal'])),
      L('Leer caracteres','Construye memoria visual sin depender de pinyin.',
        C('Componentes recurrentes','好 = 女 + 子','nǐ hǎo','Muchos caracteres contienen componentes que aportan pistas.','Observa estructura y orden de trazos.','La pista puede ser semántica, fonética o histórica; no siempre es literal.',['Divide visualmente.','Identifica componentes.','Vuelve a reconocer el carácter completo.'],'¿Cómo conviene memorizar un carácter?','Por su forma, componentes, sonido y significado',['Solo por pinyin','Como dibujo sin sonido']),
        C('Ocultar pinyin gradualmente','你好','nǐ hǎo','Primero intenta leer 你好; muestra nǐ hǎo solo si lo necesitas.','Los ojos deben volver siempre a los caracteres.','Así pinyin ayuda sin convertirse en muleta.',['Mira caracteres.','Intenta recordar.','Revela pinyin al tocar.'],'¿Cuándo conviene mostrar pinyin después de las primeras lecciones?','Solo como ayuda opcional',['Siempre en tamaño mayor','Nunca, ni para aprender tonos'])),
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
    teach(`${id}-a`,lesson.concepts[0]),question(`${id}-a`,lesson.concepts[0]),
    teach(`${id}-b`,lesson.concepts[1]),question(`${id}-b`,lesson.concepts[1]),
  ]};
};
const makeReview=(spec,lessons)=>{
  const id=`${spec.slug}-reading-00-review`;
  return{id,title:'Repaso: reglas de lectura',description:'Recupera las reglas esenciales antes de la prueba.',isReview:true,activities:[
    intro(id,'Repaso acumulativo','Recuerda cada regla sin mirar una transcripción permanente.'),
    ...lessons.map((lesson,index)=>question(`${id}-${index+1}`,lesson.concepts[index%2])),
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
  if(missing.length)throw new Error(`${directory}: faltan audios ${missing.join(', ')}`);
  const normal=spec.lessons.map((lesson,index)=>makeLesson(spec,lesson,index));
  const unit={id:'reading-foundations',title:spec.title,description:spec.description,requirements:[],reward:{xp:220,badge:'Lector inicial'},lessons:[...normal,makeReview(spec,spec.lessons),makeTest(spec,spec.lessons)]};
  const unitPath=path.join(root,'units','reading-foundations.json');
  fs.writeFileSync(unitPath,JSON.stringify(unit,null,2)+'\n');

  const course=JSON.parse(fs.readFileSync(coursePath,'utf8')),foundations=course.levels?.find(level=>level.id==='foundations');
  const summary={id:'reading-foundations',world:0,mapLabel:'MUNDO 0',title:spec.title.replace(/^Cómo (se empieza a leer|se lee|funciona la escritura) /i,'Lectura inicial: '),description:spec.description,icon:spec.icon,manifest:'units/reading-foundations.json'};
  course.units=[summary,...(course.units||[]).filter(unit=>unit.id!=='reading-foundations')];
  if(foundations)foundations.unitIds=['reading-foundations',...(foundations.unitIds||[]).filter(id=>id!=='reading-foundations')];
  course.unlockRules={...(course.unlockRules||{}),requireReadingMastery:true,readingUnitId:'reading-foundations'};
  course.version=Math.max(11,Number(course.version||0));
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

#!/usr/bin/env node
// Correcciones de la revisión «alumno nuevo + profesor» (2026-10-27) en las
// tarjetas de lectura de coreano y francés. Cambia cada texto en todos los
// sitios donde aparece (tarjeta, opciones y respuestas), así que las
// preguntas siguen coincidiendo. Se puede ejecutar varias veces.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','library','courses');
const FIXES={
  // Diálogos de las historias (situaciones).
  "Portuguese/stories/a1-1-food.json":{"Camarero": "Mesero", "Quero isto, por favor.": "Queria isto, por favor.", "Quiero esto, por favor.": "Quisiera esto, por favor."},
  "Portuguese/stories/a1-1-identity.json":{"Camarero": "Mesero"},
  "Portuguese/stories/survival.json":{"Camarero": "Mesero"},
  "Italian/stories/a1-1-food.json":{"Voglio questo!": "Vorrei questo!", "¡Quiero esto!": "¡Quisiera esto!"},
  "English/stories/a1-1-food.json":{"Yes. I want this: chicken with rice.": "Yes. I'd like this: chicken with rice.", "Sí. Quiero esto: pollo con arroz.": "Sí. Quisiera esto: pollo con arroz."},
  "German/stories/a1-1-food.json":{"Quiero esto. El curry con arroz.": "Quisiera esto. El curry con arroz.", "¿Junto o por separado?": "¿Todo junto o por separado?"},
  "German/stories/a1-1-home.json":{"Sí. Mi cuarto está en el cuarto piso.": "Sí. Mi cuarto está en el tercer piso."},
  "Japanese/stories/a1-1-food.json":{"健太さん、私はこれが欲しいです。カレーです。": "健太さん、私はこれにします。カレーです。", "けんたさん、わたしはこれがほしいです。カレーです。": "けんたさん、わたしはこれにします。カレーです。", "Kenta, yo quiero esto. El curry.": "Kenta, yo pido esto: el curry."},
  "Japanese/stories/a1-1-people.json":{"お父さんは大きいですね。": "お父さんは背が高いですね。", "おとうさんはおおきいですね。": "おとうさんはせがたかいですね。", "彼は私の友達です。カルロスです。": "友達のカルロスです。", "かれはわたしのともだちです。カルロスです。": "ともだちのカルロスです。", "Es mi amigo. Se llama Carlos.": "Es mi amigo Carlos."},
  "Japanese/stories/functional-a1.json":{"けんたさん、そのほんはなんですか。": "けんたさん、それはなんのほんですか。", "Kenta, ¿qué libro es ése?": "Kenta, ¿de qué es ese libro?"},
  "Russian/stories/a1-1-food.json":{"Misha, ¿«café» es «él» o «ello»?": "Misha, ¿«кофе» es masculino (он) o neutro (оно)?", "Lo correcto es «él». Pero mucha gente dice «ello».": "Lo correcto es masculino. Pero mucha gente lo usa como neutro."},
  "Russian/stories/survival.json":{"¿El baño? Todo recto, luego a la derecha, junto a la salida.": "¿El baño? Todo derecho, luego a la derecha, junto a la salida.", "Misha, aquí está mi billete.": "Misha, aquí está mi boleto.", "El billete de tren": "El boleto de tren"},
  "Chinese/stories/a1-1-food.json":{"Sí, un plato de arroz.": "Sí, un tazón de arroz."},

  // Revisión de profesor de los otros 8 idiomas (2026-10-28).
  "English/units/reading-foundations.json":{"Nombre en Inglés: ay.": "Nombre en inglés: «ei».", "Nombre en Inglés: bee.": "Nombre en inglés: «bi».", "Nombre en Inglés: see.": "Nombre en inglés: «si».", "Nombre en Inglés: dee.": "Nombre en inglés: «di».", "Nombre en Inglés: ee.": "Nombre en inglés: «i».", "Nombre en Inglés: eff.": "Nombre en inglés: «ef».", "Nombre en Inglés: gee.": "Nombre en inglés: «yi».", "Nombre en Inglés: aitch.": "Nombre en inglés: «eich».", "Nombre en Inglés: eye.": "Nombre en inglés: «ai».", "Nombre en Inglés: jay.": "Nombre en inglés: «yei».", "Nombre en Inglés: kay.": "Nombre en inglés: «kei».", "Nombre en Inglés: el.": "Nombre en inglés: «el».", "Nombre en Inglés: em.": "Nombre en inglés: «em».", "Nombre en Inglés: en.": "Nombre en inglés: «en».", "Nombre en Inglés: oh.": "Nombre en inglés: «ou».", "Nombre en Inglés: pee.": "Nombre en inglés: «pi».", "Nombre en Inglés: cue.": "Nombre en inglés: «kiu».", "Nombre en Inglés: ar.": "Nombre en inglés: «ar».", "Nombre en Inglés: ess.": "Nombre en inglés: «es».", "Nombre en Inglés: tee.": "Nombre en inglés: «ti».", "Nombre en Inglés: you.": "Nombre en inglés: «iu».", "Nombre en Inglés: vee.": "Nombre en inglés: «vi».", "Nombre en Inglés: double you.": "Nombre en inglés: «dábol iu».", "Nombre en Inglés: ex.": "Nombre en inglés: «eks».", "Nombre en Inglés: why.": "Nombre en inglés: «uai».", "Nombre en Inglés: zee.": "Nombre en inglés: «zi».", "H: eich, con h aspirada": "H: eich (sin h al inicio; la h solo suena como aire dentro de palabras: house)", "Z: zi (EE. UU.)": "Z: zi, con z zumbada como abeja (EE. UU.)", "cup: vocal /ʌ/, una «a» corta y relajada. No es «u»: cup no suena «cup» como en español. También en bus, sun, much.": "cup: vocal /ʌ/, una «a» corta y relajada. No se dice con u española: suena casi «cap». También en bus, sun, much."},
  "English/units/reading.json":{"H: eich, con h aspirada": "H: eich (sin h al inicio; la h solo suena como aire dentro de palabras: house)", "Z: zi (EE. UU.)": "Z: zi, con z zumbada como abeja (EE. UU.)", "cup: vocal /ʌ/, una «a» corta y relajada. No es «u»: cup no suena «cup» como en español. También en bus, sun, much.": "cup: vocal /ʌ/, una «a» corta y relajada. No se dice con u española: suena casi «cap». También en bus, sun, much."},
  "German/units/reading.json":{"Truco: en EI e IE se pronuncia la segunda letra: mein [main], sie [si].": "Truco: en EI e IE manda el orden: ei = «ai» (mein), ie = «i» larga (sie). Para recordarlo: Wein und Bier = «vain unt bia».", "Truco: se lee el nombre de la segunda letra (i → «ai»)": "Truco: Wein und Bier = «vain unt bia»"},
  "German/units/reading-foundations.json":{"Nombre en Alemán": "Nombre en alemán"},
  "Italian/units/reading-foundations.json":{"Nombre en Italiano": "Nombre en italiano", "ghe: ge dura.": "ghe se lee «gue», como en guerra.", "ghi: gi dura.": "ghi se lee «gui», como en guitarra: spaghetti = [spaguéti].", "G ante a, o, u es dura; ante e, i suena parecido a y/dj.": "G ante a, o, u es dura; ante e, i suena «dy», como la y enfática de «¡yo!», nunca como la j española: gelato = [dyeláto].", "famiglia contiene gli.": "GLI suena como una «li» muy unida: famiglia ≈ [famí-lia], sin g; nunca [famíya].", "Escucha pares mínimos.": "La LL italiana no es la ll española: palla = [pal-la] (pelota), nunca [paya]."},
  "Portuguese/units/reading-foundations.json":{"Nombre en Portugués": "Nombre en portugués", "No existe una única pronunciación idéntica en todo el mundo lusófono.": "Este curso sigue la pronunciación de Portugal.", "En muchas variedades, e y o finales se elevan y no suenan como en español.": "En Portugal, la e y la o finales sin acento se reducen y no suenan como en español.", "e final puede acercarse a i.": "La e átona final casi desaparece: leite ≈ [LÂI-t(e)].", "o final puede acercarse a u.": "La o átona final suena u: livro ≈ [LI-vru].", "La región modifica detalles.": "En Brasil suenan distinto; aquí seguimos la norma de Portugal.", "R inicial y RR suelen tener un sonido fuerte, variable por región.": "En Portugal la r inicial y la rr suenan en la garganta, parecido a una j suave mexicana: rua ≈ [jú-a], carro ≈ [KÁ-ju].", "r inicial: fuerte.": "r inicial: en la garganta, como j suave.", "rr: fuerte.": "rr: igual, en la garganta.", "s final varía por región.": "s al final de sílaba suena sh: dois [doish], três [trêsh].", "La pronunciación brasileña y europea difiere en varios detalles.": "La pronunciación de Brasil y la de Portugal difieren en varios detalles; este curso usa la de Portugal."},
  "Portuguese/units/reading.json":{"[TRÉSH]": "[TRÊSH]"},
  "Russian/units/reading-foundations.json":{"Nombre en Ruso": "Nombre en ruso"},
  "Russian/units/reading.json":{"Ж: como la y francesa de “journal”": "Ж: como la j francesa de «journal» (sonora, sin la d de la «ch»)", "Х: j española suave": "Х: como la j mexicana de «jarro»; nunca la x de «taxi»", "En el curso la marcamos con una tilde (молоко́); en textos normales no se escribe.": "Aprende cuál es con el audio: en los textos normales no se escribe (en diccionarios se marca: молоко́)."},
  "Arabic/units/reading-foundations.json":{"Nombre en Árabe": "Nombre en árabe"},
  "Arabic/units/reading.json":{"ج: dj, como la «ll» argentina; nunca la j española": "ج: dj, como la j inglesa de «jeans» o la y enfática de «¡yo!»; nunca la j española", "خ: j española fuerte": "خ: como una j mexicana muy raspada (como la j de España)", "ظ: th o z enfática": "ظ: «th» de this, enfática (ذ con la lengua retraída)", "Ya lo viste en شكرًا (shukran).": "Por ejemplo: شُكْرًا (shukran, gracias).", "[ghurfa] ة muda al final": "[ghurfa]: ة final se lee «a» en pausa"},
  "French/units/reading-foundations.json":{"Nombre en Francés": "Nombre en francés"},
  "Chinese/units/reading-foundations.json":{"Tras j, q, x e y los puntos pueden omitirse en la escritura pinyin; el sonido sigue siendo ü.": "Tras j, q, x e y los puntos se omiten siempre (ju, qu, xu, yu), pero el sonido sigue siendo ü. Tras n y l se escriben: nǚ (mujer) ≠ nǔ.", "Aprende j antes de compararla con q y x.": "No es la jota española: suena parecido a una «ch» mexicana suave, sin aire, con la lengua detrás de los dientes de abajo: jī ≈ «chi» suave.", "Primero intenta reconocer 你好; muestra nǐ hǎo solo si lo necesitas.": "Se escribe nǐ hǎo, pero se dice [ní hǎo]: con dos terceros tonos seguidos, el primero sube.", "HSK University recomienda pinyin y tonos primero, y después añadir caracteres gradualmente.": "Primero pinyin y tonos; los caracteres se añaden poco a poco."},
  "Chinese/units/reading.json":{"á: tono 2: sube, como una pregunta": "á: tono 2: sube de medio a alto", "j: entre yi y chi, lengua adelante": "j: ch suave sin aire, lengua adelante", "r: r suave retrofleja": "r: parecida a la ll/y rioplatense pero con la lengua curvada atrás; nunca la r de «pero»"},
  "Japanese/units/hiragana-01.json":{"Suena «wa», como «gua» muy suave.": "Suena «wa»: «ua» en un solo golpe, sin g."},

  'Korean/units/reading.json':{
    // «la anterior» era ㅑ en el orden de la lista: enseñaba «yya».
    'yeo; como la anterior con y':'yeo: ㅓ con «y» delante',
    // 자 y 야 quedaban con la misma etiqueta.
    'entre ch y y fuerte':'«ch» suave, sin aire',
    'ya/cha suave':'cha suave (no «ya»)',
    // Un mexicano no tiene referencia para «h aspirada».
    'h aspirada':'solo aire, como una «j» mexicana muy suave',
    'Pasa con todos los batchim: 이름이 [이르미], 음식이 [음시기]':'Pasa con casi todos los batchim: 이름이 [이르미], 음식이 [음시기]. La ㅇ final no se mueve (강아지) y la ㅎ final desaparece (좋아요 [조아요]).',
  },
  'Korean/units/hangul-foundations.json':{
    // 우유 usa ㅠ, que todavía no se ha enseñado; 아이 solo usa ㅇ, ㅏ, ㅣ.
    '우유':'아이',
    'leche':'niño',
    // 한국어 no se lee [한-국-어]: la ㄱ final pasa a la sílaba siguiente.
    'Lee cada bloque una sola vez y luego une la palabra: idioma coreano.':'Lee cada bloque una sola vez y luego une la palabra: idioma coreano. Ojo: se pronuncia [한구거]; la ㄱ final pasa a la sílaba siguiente porque esta empieza con ㅇ.',
  },
  'French/units/reading.json':{
    'E: e cerrada o sonido neutro':'E: sonido neutro, como «eu» con labios relajados (la e cerrada es É)',
    'Q: ku':'Q: kü (k + la u francesa)',
  },
};

const replaceDeep=(value,map)=>{
  if(typeof value==='string'){let out=value;for(const[from,to]of Object.entries(map))if(out.includes(from)&&!out.includes(to))out=out.split(from).join(to);return out;}
  if(Array.isArray(value))return value.map(item=>replaceDeep(item,map));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replaceDeep(item,map)]));
  return value;
};

for(const[file,map]of Object.entries(FIXES)){
  const full=path.join(ROOT,file),before=fs.readFileSync(full,'utf8'),after=JSON.stringify(replaceDeep(JSON.parse(before),map),null,2)+'\n';
  if(after!==before)fs.writeFileSync(full,after);
  console.log(`${file}: ${after===before?'sin cambios':'corregido'}`);
}

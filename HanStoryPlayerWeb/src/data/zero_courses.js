const items=(language,category,text)=>text.trim().split('\n').map((line,order)=>{const [symbol,speak,pronunciation,example,explanation]=line.split('|');return{symbol,speak,pronunciation,example,explanation,language,category,order:order+1,audio:true};});
const stage=(language,id,title,text)=>({id,title,items:items(language,id,text)});
const quiz=(language,questions)=>({language,questions});

export const ZERO_COURSES={
  English:{stages:[
    stage('English','combinations','2. Combinaciones básicas',`sh|ship|sh, como pedir silencio|ship|Dos letras forman un solo sonido.
ch|chair|ch|chair|Se pronuncia con una salida breve de aire.
ee|see|i larga|see|Suele representar una vocal larga.
oo|food|u larga|food|Puede cambiar en palabras como book.`),
    stage('English','dangerous','3. Pronunciación peligrosa',`TH|think|lengua suavemente entre los dientes|think|No es una t ni una s española.
R|red|r sin vibrar|red|La lengua no golpea el paladar.
V / B|very / berry|v con dientes; b con ambos labios|very / berry|La posición de la boca cambia el significado.
H|house|j muy suave, solo aire|house|No uses la j fuerte española.
short / long vowels|ship / sheep|i breve frente a i larga|ship / sheep|La duración y posición distinguen palabras.`),
    stage('English','words','4. Primeras palabras',`hello|hello|jelóu|Hello!|Saludo general.
please|please|plís|Please.|Expresa cortesía.
thanks|thanks|zanks aproximado|Thanks!|Agradecimiento informal.
water|water|uóter|Water, please.|Palabra muy útil.
help|help|jelp|Help!|Para pedir ayuda.`),
    stage('English','survival','5. Frases de supervivencia',`Hello!|Hello!|jelóu|Hello!|Hola.
I don't understand.|I don't understand.|ai dóunt anderstánd|I don't understand.|No entiendo.
Could you repeat that?|Could you repeat that?|kud yu ripít dat|Could you repeat that?|¿Podría repetirlo?
Where is the bathroom?|Where is the bathroom?|uér is de báthrum|Where is the bathroom?|¿Dónde está el baño?
How much is it?|How much is it?|jau mach is it|How much is it?|¿Cuánto cuesta?`),
    stage('English','structure','6. Estructura básica del idioma',`I + verb + object|I like coffee.|ai laik cófi|I like coffee.|El orden común es sujeto, verbo y objeto.
do not → don't|I don't know.|ai dóunt nóu|I don't know.|Las contracciones son normales al hablar.
I am → I'm|I'm ready.|aim rédi|I'm ready.|El verbo be cambia según la persona.
question with do|Do you speak English?|du yu spík ínglish|Do you speak English?|Do ayuda a formar preguntas.`),
    stage('English','repeat','7. Escucha y repite',`Nice to meet you.|Nice to meet you.|nais tu mít yu|Nice to meet you.|Escucha, deja una pausa y repite.
Can you help me?|Can you help me?|can yu jelp mi|Can you help me?|Practica la unión natural de las palabras.
I would like water.|I would like water.|ai wud laik uóter|I would like water.|Repite sin separar cada palabra.`)
  ],quiz:quiz('English',[['meaning','I don\'t understand.','No entiendo.','Tengo hambre.','Hasta luego.'],['sound','TH','think','red','very'],['symbol','Listen: “water”','water','where','what']])},

  Korean:{stages:[
    stage('Korean','combinations','2. Combinaciones básicas',`가|가|ga/ka suave|ㄱ + ㅏ = 가|Una consonante y una vocal forman un bloque.
너|너|neo|ㄴ + ㅓ = 너|Se lee de izquierda a derecha dentro del bloque.
도|도|do/to suave|ㄷ + ㅗ = 도|La consonante se coloca arriba o a la izquierda.
한|한|han|ㅎ + ㅏ + ㄴ = 한|La consonante final se llama batchim.`),
    stage('Korean','dangerous','3. Pronunciación peligrosa',`받침|밥|batchim: cierre final breve|밥|La consonante final suele cerrarse sin soltar aire.
ㄹ|라|entre r suave y l|라 / 말|Cambia según su posición.
ㅓ|어|vocal entre o abierta y a|어디|No equivale exactamente a una vocal española.
ㅅ + ㅣ|시|shi suave|시간|Ante ㅣ, ㅅ se aproxima a “sh”.
ㅇ final|강|ng|강|Al inicio es muda; al final suena ng.`),
    stage('Korean','words','4. Primeras palabras',`네|네|ne|네|Sí.
아니요|아니요|aniyo|아니요|No.
물|물|mul|물|Agua.
사람|사람|saram|사람|Persona.
집|집|chip suave|집|Casa.`),
    stage('Korean','survival','5. Frases de supervivencia',`안녕하세요|안녕하세요|annyeonghaseyo|안녕하세요|Hola, de forma cortés.
감사합니다|감사합니다|gamsahamnida|감사합니다|Gracias.
잘 모르겠어요|잘 모르겠어요|chal moreugesseoyo|잘 모르겠어요|No lo entiendo bien.
다시 말해 주세요|다시 말해 주세요|tashi malhae juseyo|다시 말해 주세요|Repítalo, por favor.
화장실이 어디예요?|화장실이 어디예요?|hwajangsiri eodiyeyo|화장실이 어디예요?|¿Dónde está el baño?`),
    stage('Korean','structure','6. Estructura básica del idioma',`은/는|저는 학생이에요.|eun/neun|저는 학생이에요.|Marca el tema de la conversación.
이/가|물이 있어요.|i/ga|물이 있어요.|Marca el sujeto o información nueva.
을/를|물을 마셔요.|eul/reul|물을 마셔요.|Marca el objeto directo.
이에요/예요|학생이에요.|ieyo/yeyo|학생이에요.|Equivale aproximadamente a “ser”.
있어요/없어요|시간이 있어요.|isseoyo / eopseoyo|시간이 있어요.|Expresan existencia o posesión.
S + O + V|저는 물을 마셔요.|jeoneun mureul masyeoyo|저는 물을 마셔요.|El verbo suele ir al final.`),
    stage('Korean','repeat','7. Escucha y repite',`천천히 말해 주세요.|천천히 말해 주세요.|cheoncheonhi malhae juseyo|천천히 말해 주세요.|Hable más despacio, por favor.
괜찮아요.|괜찮아요.|gwaenchanayo|괜찮아요.|Está bien.
도와주세요.|도와주세요.|dowajuseyo|도와주세요.|Ayúdeme, por favor.`)
  ],quiz:quiz('Korean',[['meaning','감사합니다','Gracias.','Perdón.','Agua.'],['sound','ㅓ','어','오','우'],['symbol','Escucha “mul”','물','말','문']])},

  Japanese:{stages:[
    stage('Japanese','combinations','2. Combinaciones básicas',`が・ぎ・ぐ・げ・ご|が ぎ ぐ げ ご|sonidos g|か → が|Las marcas ゛ convierten k en g.
ざ・じ・ず・ぜ・ぞ|ざ じ ず ぜ ぞ|z; じ suena parecido a yi/ji suave|さ → ざ|Las marcas ゛ también modifican la fila de s.
ぱ・ぴ・ぷ・ぺ・ぽ|ぱ ぴ ぷ ぺ ぽ|p con aire breve|は → ぱ|El círculo ゜ crea la serie p.
きゃ・きゅ・きょ|きゃ きゅ きょ|kya, kyu, kyo en una sola mora|き + ゃ = きゃ|La vocal pequeña se combina con la kana anterior.
しゃ・しゅ・しょ|しゃ しゅ しょ|sha, shu, sho|し + ゃ = しゃ|No se leen como dos golpes separados.
ちゃ・ちゅ・ちょ|ちゃ ちゅ ちょ|cha, chu, cho|ち + ゃ = ちゃ|Son combinaciones frecuentes.
っ|きって|pequeña pausa antes de t|きって|La っ pequeña duplica la consonante siguiente.`),
    stage('Japanese','dangerous','3. Pronunciación y ritmo importantes',`Moras|たまご|tres golpes regulares: ta-ma-go|た・ま・ご|El japonés mantiene un ritmo bastante regular por moras.
Vocal larga|おばあさん|mantén a durante dos pulsos|おばあさん|La duración puede distinguir palabras.
おう / おお|こうこう / おおきい|normalmente una o larga|こうこう|No cortes la vocal larga en dos palabras.
Consonante doble|きって|pausa de un pulso antes de t|きって|La っ pequeña cuenta como una mora.
ん|こんにちは|n cambia ligeramente según el sonido siguiente|ほん / さんぽ|No añadas una vocal después de ん.
は / へ / を|こんにちは・学校へ・水を|como partículas: wa, e, o|私は学校へ行きます。|Estas tres partículas conservan su escritura histórica.
Vocal débil|です|la u puede oírse muy poco|です|En habla natural, i y u pueden debilitarse entre consonantes sordas.`),
    stage('Japanese','words','4. Primeras palabras',`はい|はい|jai suave|はい|Sí.
いいえ|いいえ|i-ie|いいえ|No.
みず|みず|mi-zu|水|Agua.
ひと|ひと|ji-to suave|人|Persona.
いえ|いえ|i-e|家|Casa.
えき|えき|e-ki|駅|Estación.
トイレ|トイレ|to-i-re|トイレ|Baño.`),
    stage('Japanese','survival','5. Frases de supervivencia',`こんにちは|こんにちは|kon-ni-chi-wa|こんにちは|Hola.
ありがとうございます|ありがとうございます|a-ri-ga-to-o go-za-i-ma-su|ありがとうございます|Muchas gracias.
すみません|すみません|su-mi-ma-sen|すみません|Disculpe, perdón o para llamar la atención.
わかりません|わかりません|wa-ka-ri-ma-sen|わかりません|No entiendo.
もういちど おねがいします|もういちど おねがいします|mō i-chi-do o-ne-ga-i-shi-ma-su|もう一度お願いします|Otra vez, por favor.
ゆっくり おねがいします|ゆっくり おねがいします|yu-kku-ri o-ne-ga-i-shi-ma-su|ゆっくりお願いします|Más despacio, por favor.
トイレは どこですか|トイレは どこですか|to-i-re wa do-ko des-ka|トイレはどこですか|¿Dónde está el baño?`),
    stage('Japanese','structure','6. Estructura básica del idioma',`A は B です|わたしは アナです|A wa B desu|私はアナです。|Presenta el tema y dice qué es.
S + O + V|わたしは みずを のみます|el verbo va al final|私は水を飲みます。|El orden básico suele terminar con el verbo.
を|みずを のみます|marca el objeto|水を飲みます。|Se escribe を y como partícula se pronuncia o.
に / で|がっこうに いきます・がっこうで べんきょうします|destino / lugar de la acción|学校に行きます。|に marca destino; で, dónde ocurre una acción.
か|がくせいですか|pregunta al final|学生ですか。|か convierte la oración cortés en pregunta.
ません|たべません|negación cortés|食べません。|Se añade a la base verbal cortés para negar.
これ / それ / あれ|これは ほんです|esto / eso / aquello|これは本です。|Indican objetos según su distancia.`),
    stage('Japanese','repeat','7. Escucha y repite',`はじめまして。|はじめまして|ha-ji-me-ma-shi-te|はじめまして。|Encantado de conocerte.
わたしは アナです。|わたしは アナです|wa-ta-shi wa A-na des|私はアナです。|Soy Ana.
にほんごが すこし わかります。|にほんごが すこし わかります|ni-hon-go ga su-ko-shi wa-ka-ri-ma-su|日本語が少しわかります。|Entiendo un poco de japonés.
これは いくらですか。|これは いくらですか|ko-re wa i-ku-ra des-ka|これはいくらですか。|¿Cuánto cuesta esto?`)
  ],quiz:quiz('Japanese',[['meaning','すみません','Disculpe.','Gracias.','Agua.'],['sound','っ pequeña','きって','きて','きいって'],['symbol','Escucha la palabra para agua','みず','みせ','みち'],['meaning','トイレはどこですか','¿Dónde está el baño?','¿Cuánto cuesta?','No entiendo.'],['symbol','Elige ね','ね','れ','わ'],['meaning','わたしは学生です','Soy estudiante.','No soy estudiante.','¿Eres estudiante?'],['meaning','水を飲みます','Bebo agua.','Compro agua.','Hay agua.'],['symbol','Partícula de objeto','を','で','に'],['meaning','きのう行きました','Fui ayer.','Voy mañana.','No fui.'],['meaning','この本はおもしろいです','Este libro es interesante.','Este libro es caro.','Ese libro es pequeño.']])},

  Chinese:{stages:[
    stage('Chinese','combinations','2. Combinaciones básicas',`mā|mā|ma alto y sostenido|妈 mā|Pinyin combina inicial, final y tono.
má|má|ma ascendente|麻 má|El segundo tono sube como una pregunta.
mǎ|mǎ|ma baja y vuelve a subir|马 mǎ|El tercer tono baja y puede subir.
mà|mà|ma descendente fuerte|骂 mà|El cuarto tono cae con decisión.
ma|ma|ma breve y ligero|吗 ma|El tono neutro no lleva marca.`),
    stage('Chinese','dangerous','3. Pronunciación peligrosa',`b / p|bā / pā|p expulsa más aire|八 / 趴|La diferencia principal es la aspiración.
d / t|dà / tà|t lleva más aire|大 / 踏|No dependen de sonoridad como en español.
g / k|gē / kē|k lleva más aire|哥 / 科|Mantén la lengua atrás.
j / q / x|jī / qī / xī|lengua alta; q con aire|机 / 七 / 西|No equivalen exactamente a y, ch y sh.
zh / ch / sh / r|zhī / chī / shī / rì|lengua algo hacia atrás|知 / 吃 / 师 / 日|Son sonidos retroflejos.`),
    stage('Chinese','words','4. Primeras palabras',`你好|nǐ hǎo|ni jao|你好|Hola.
谢谢|xièxie|shie shie suave|谢谢|Gracias.
水|shuǐ|shuei|水|Agua.
人|rén|ren retrofleja|人|Persona.
好|hǎo|jao|好|Bueno o estar bien.`),
    stage('Chinese','survival','5. Frases de supervivencia',`你好！|nǐ hǎo|ni jao|你好！|Hola.
谢谢！|xièxie|shie shie|谢谢！|Gracias.
我听不懂。|wǒ tīng bù dǒng|uo ting bu dong|我听不懂。|No entiendo lo que escucho.
请再说一遍。|qǐng zài shuō yí biàn|ching dsai shuo i bien|请再说一遍。|Repítalo, por favor.
洗手间在哪里？|xǐshǒujiān zài nǎlǐ|shi shou chien dsai nali|洗手间在哪里？|¿Dónde está el baño?`),
    stage('Chinese','structure','6. Estructura básica del idioma',`S + V + O|我喝水。|wǒ hē shuǐ|我喝水。|El orden básico es sujeto, verbo y objeto.
吗|你好吗？|ma neutro|你好吗？|Se añade al final para una pregunta sí/no.
不|我不知道。|bù|我不知道。|Se coloca antes del verbo para negar.
没有 conjugación|我喝 / 你喝|wǒ hē / nǐ hē|我喝水。|El verbo normalmente no cambia por persona.`),
    stage('Chinese','repeat','7. Escucha y repite',`请说慢一点。|qǐng shuō màn yìdiǎn|ching shuo man i dien|请说慢一点。|Hable más despacio.
你会说英语吗？|nǐ huì shuō Yīngyǔ ma|ni juei shuo ing yu ma|你会说英语吗？|¿Habla inglés?
多少钱？|duōshao qián|duo shao chien|多少钱？|¿Cuánto cuesta?`)
  ],quiz:quiz('Chinese',[['meaning','谢谢','Gracias.','Hola.','Agua.'],['sound','第三声','mǎ','mā','mà'],['symbol','Escucha “shuǐ”','水','人','好']])},

  German:{stages:[
    stage('German','combinations','2. Combinaciones básicas',`ä|Bär|e abierta|Bär|Ä se acerca a una e abierta.
ö|schön|e con labios de o|schön|Mantén la lengua de e y redondea labios.
ü|über|i con labios de u|über|No existe igual en español.
ß|Straße|s larga|Straße|Representa una s sorda después de vocal larga.
sch|Schule|sh|Schule|Tres letras forman un sonido.
sp / st|Sport / Stadt|shp / sht al inicio|Sport / Stadt|Al inicio de palabra suelen comenzar con sh.`),
    stage('German','dangerous','3. Pronunciación peligrosa',`ch|ich|j muy suave, frontal|ich|Después de i/e es más frontal.
ch|Bach|j más posterior|Bach|Después de a/o/u suena más atrás.
R|rot|r de garganta o vibrante|rot|Ambas variantes pueden ser correctas.
V / W|Vater / Wasser|f / v|Vater / Wasser|V suele sonar f; W suele sonar v.`),
    stage('German','words','4. Primeras palabras',`ja|ja|ya|ja|Sí.
nein|nein|nain|nein|No.
bitte|bitte|bite|bitte|Por favor o de nada.
danke|danke|danke|danke|Gracias.
Wasser|Wasser|váser|Wasser|Agua.`),
    stage('German','survival','5. Frases de supervivencia',`Hallo!|Hallo!|jaló|Hallo!|Hola.
Ich verstehe nicht.|Ich verstehe nicht.|ij fershtée nijt|Ich verstehe nicht.|No entiendo.
Bitte wiederholen.|Bitte wiederholen.|bite viderjólen|Bitte wiederholen.|Repita, por favor.
Wo ist die Toilette?|Wo ist die Toilette?|vo ist di toilete|Wo ist die Toilette?|¿Dónde está el baño?
Wie viel kostet das?|Wie viel kostet das?|vi fil kostet das|Wie viel kostet das?|¿Cuánto cuesta?`),
    stage('German','structure','6. Estructura básica del idioma',`der / die / das|der Mann / die Frau / das Kind|der / di / das|das Buch|Los sustantivos tienen género y empiezan con mayúscula.
verbo en posición 2|Heute lerne ich.|hoite lerne ij|Heute lerne ich.|En una oración principal el verbo conjugado ocupa la segunda posición.
S + V + O|Ich trinke Wasser.|ij trinke váser|Ich trinke Wasser.|El orden neutro comienza con sujeto y verbo.`),
    stage('German','repeat','7. Escucha y repite',`Sprechen Sie langsam.|Sprechen Sie langsam.|shprejen si langsam|Sprechen Sie langsam.|Hable despacio.
Können Sie mir helfen?|Können Sie mir helfen?|könen si mir jelfen|Können Sie mir helfen?|¿Puede ayudarme?
Ich hätte gern Wasser.|Ich hätte gern Wasser.|ij jete guern váser|Ich hätte gern Wasser.|Quisiera agua.`)
  ],quiz:quiz('German',[['meaning','Danke','Gracias.','No.','Agua.'],['sound','Ü','über','offen','Apfel'],['symbol','Escucha “shule”','Schule','Straße','schön']])},

  Russian:{stages:[
    stage('Russian','combinations','2. Combinaciones básicas',`А / К / М / О / Т|А К М О Т|parecidas y similares|мама|Estas letras se parecen y conservan un sonido familiar.
В / Н / Р / С / У / Х|В Н Р С У Х|v n r s u j|вода / нос / рука|Son falsos amigos: no suenan como sus equivalentes latinas.
Ь|день|sin sonido propio|день|El signo blando suaviza la consonante anterior.`),
    stage('Russian','dangerous','3. Pronunciación peligrosa',`Ы|мы|i posterior|мы|Mantén la lengua atrás y los labios sin redondear.
Ж|жук|zh sonora|жук|Se parece a la s de “vision” en inglés.
Х|хорошо|j española suave|хорошо|Sale aire por la parte posterior.
Щ|щука|sh larga y suave|щука|Es más larga y frontal que Ш.
Р|рука|r vibrante|рука|Debe vibrar, como la erre española.`),
    stage('Russian','words','4. Primeras palabras',`да|да|da|да|Sí.
нет|нет|niet|нет|No.
вода|вода|vadá|вода|Agua.
дом|дом|dom|дом|Casa.
спасибо|спасибо|spasíba|спасибо|Gracias.`),
    stage('Russian','survival','5. Frases de supervivencia',`Здравствуйте!|Здравствуйте!|zdrástvuite|Здравствуйте!|Hola formal.
Спасибо.|Спасибо.|spasíba|Спасибо.|Gracias.
Я не понимаю.|Я не понимаю.|ya ne panimáyu|Я не понимаю.|No entiendo.
Повторите, пожалуйста.|Повторите, пожалуйста.|pavtaríte pazhálusta|Повторите, пожалуйста.|Repita, por favor.
Где туалет?|Где туалет?|gdie tualét|Где туалет?|¿Dónde está el baño?`),
    stage('Russian','structure','6. Estructura básica del idioma',`género|он / она / оно|on / aná / anó|дом / книга / окно|Los sustantivos pueden ser masculinos, femeninos o neutros.
sin artículo|Это книга.|éta kníga|Это книга.|El ruso no usa equivalentes directos de el/la/un/una.
negación не|Я не знаю.|ya ne znáyu|Я не знаю.|Не se coloca antes de lo que se niega.`),
    stage('Russian','repeat','7. Escucha y repite',`Говорите медленнее.|Говорите медленнее.|gavaríte médlenie|Говорите медленнее.|Hable más despacio.
Вы говорите по-английски?|Вы говорите по-английски?|vy gavaríte pa anglíski|Вы говорите по-английски?|¿Habla inglés?
Помогите, пожалуйста.|Помогите, пожалуйста.|pamagíte pazhálusta|Помогите, пожалуйста.|Ayúdeme, por favor.`)
  ],quiz:quiz('Russian',[['meaning','Спасибо','Gracias.','Hola.','Casa.'],['sound','Ы','мы','ма','мо'],['symbol','Escucha “niet”','нет','да','дом']])},

  Italian:{stages:[
    stage('Italian','combinations','2. Combinaciones básicas',`ce / ci|cena / cinema|che / chi suave|cena / cinema|C ante e/i suena como ch.
che / chi|che / chi|ke / ki|che / chi|H conserva el sonido fuerte de C.
ge / gi|gelato / giro|ye / yi|gelato / giro|G ante e/i suena como una y fuerte.
ghe / ghi|spaghetti / laghi|gue / gui|spaghetti / laghi|H conserva el sonido fuerte de G.
gli|famiglia|lli italiana|famiglia|Sonido palatal sin equivalente exacto.
gn|bagno|ñ|bagno|Se aproxima mucho a la ñ española.
sc|scena|sh ante e/i|scena|Ante a/o/u suele conservar sk.`),
    stage('Italian','dangerous','3. Pronunciación peligrosa',`dobles|pala / palla|mantén la consonante doble|pala / palla|La duración puede cambiar el significado.
R|Roma|r vibrante|Roma|Vibra como en español.
Z|zero / pizza|dz o ts|zero / pizza|Puede ser sonora o sorda.`),
    stage('Italian','words','4. Primeras palabras',`sì|sì|si|sì|Sí.
no|no|no|no|No.
grazie|grazie|gratsie|grazie|Gracias.
acqua|acqua|ákua|acqua|Agua.
aiuto|aiuto|ayúto|aiuto|Ayuda.`),
    stage('Italian','survival','5. Frases de supervivencia',`Ciao!|Ciao!|chao|Ciao!|Hola o adiós informal.
Non capisco.|Non capisco.|non capísco|Non capisco.|No entiendo.
Può ripetere?|Può ripetere?|puó ripétere|Può ripetere?|¿Puede repetir?
Dov'è il bagno?|Dov'è il bagno?|dové il baño|Dov'è il bagno?|¿Dónde está el baño?
Quanto costa?|Quanto costa?|kuánto costa|Quanto costa?|¿Cuánto cuesta?`),
    stage('Italian','structure','6. Estructura básica del idioma',`il / lo / la|il libro / la casa|il / lo / la|il libro|Los artículos concuerdan con género y número.
un / uno / una|un libro / una casa|un / uno / una|una casa|Los artículos indefinidos también concuerdan.
sujeto opcional|Parlo italiano.|párlo italiano|Parlo italiano.|La terminación verbal suele indicar la persona.`),
    stage('Italian','repeat','7. Escucha y repite',`Parli più lentamente.|Parli più lentamente.|parli piú lentamente|Parli più lentamente.|Hable más despacio.
Mi può aiutare?|Mi può aiutare?|mi puó aiutáre|Mi può aiutare?|¿Puede ayudarme?
Vorrei dell'acqua.|Vorrei dell'acqua.|vorréi delákua|Vorrei dell'acqua.|Quisiera agua.`)
  ],quiz:quiz('Italian',[['meaning','Grazie','Gracias.','Por favor.','Agua.'],['sound','GN','bagno','gelato','scena'],['symbol','Escucha “chao”','Ciao','Cibo','Come']])},

  French:{stages:[
    stage('French','combinations','2. Combinaciones básicas',`an / en|enfant|a nasal|enfant|El aire sale también por la nariz.
on|nom|o nasal|nom|No pronuncies una n completa al final.
in / ain|matin|e nasal|matin|Es una vocal nasal frontal.
ou|tout|u española|tout|Los labios se redondean.
u|tu|i con labios de u|tu|No existe igual en español.
é / è|été / père|e cerrada / e abierta|été / père|La apertura distingue ambos sonidos.`),
    stage('French','dangerous','3. Pronunciación peligrosa',`final silenciosa|petit|no pronuncies la t final|petit|Muchas consonantes finales no suenan.
liaison|les amis|lezamí|les amis|Una consonante final puede unirse a la vocal siguiente.
R|rue|r de garganta|rue|No vibra como la erre española.
H|homme|muda|homme|Normalmente no se pronuncia.`),
    stage('French','words','4. Primeras palabras',`oui|oui|uí|oui|Sí.
non|non|no nasal|non|No.
merci|merci|mersí|merci|Gracias.
eau|eau|o|eau|Agua.
aide|aide|ed|aide|Ayuda.`),
    stage('French','survival','5. Frases de supervivencia',`Bonjour !|Bonjour !|bonyúr|Bonjour !|Hola o buenos días.
Je ne comprends pas.|Je ne comprends pas.|ye ne comprán pa|Je ne comprends pas.|No entiendo.
Répétez, s'il vous plaît.|Répétez, s'il vous plaît.|repeté sil vu ple|Répétez, s'il vous plaît.|Repita, por favor.
Où sont les toilettes ?|Où sont les toilettes ?|u son le tualét|Où sont les toilettes ?|¿Dónde está el baño?
C'est combien ?|C'est combien ?|se combián|C'est combien ?|¿Cuánto cuesta?`),
    stage('French','structure','6. Estructura básica del idioma',`sujeto + verbo|Je parle français.|ye parl fransé|Je parle français.|El sujeto normalmente debe expresarse.
ne ... pas|Je ne sais pas.|ye ne se pa|Je ne sais pas.|La negación rodea al verbo; al hablar, ne puede omitirse.
le / la / les|le livre / la maison|le / la / le|la maison|Los artículos concuerdan en género y número.`),
    stage('French','repeat','7. Escucha y repite',`Parlez plus lentement.|Parlez plus lentement.|parlé plu lantemán|Parlez plus lentement.|Hable más despacio.
Pouvez-vous m'aider ?|Pouvez-vous m'aider ?|puvé vu medé|Pouvez-vous m'aider ?|¿Puede ayudarme?
Je voudrais de l'eau.|Je voudrais de l'eau.|ye vudré de lo|Je voudrais de l'eau.|Quisiera agua.`)
  ],quiz:quiz('French',[['meaning','Merci','Gracias.','Hola.','Agua.'],['sound','OU','tout','tu','été'],['symbol','Escucha “bonyúr”','Bonjour','Bonsoir','Bonne nuit']])}
};

const COMMUNICATIVE={
English:`Presentarte|My name is Ana.|mai néim is Ana|My name is Ana.|Usa “My name is…” o “I'm…”.
Preguntar el nombre|What's your name?|uats yor néim|What's your name?|Pregunta informal y común.
Decir de dónde eres|I'm from Mexico.|aim from Méksico|I'm from Mexico.|“I'm from…” indica tu país o ciudad.
Números 0–20|zero, one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty|zírou, uan, tú…|I am twenty.|Escucha 0–10 y después observa -teen.
Hora básica|What time is it? It's three o'clock.|uát táim is it; its zrí oclók|It's three o'clock.|O'clock se usa para la hora exacta.
Días de la semana|Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday|mándei, tiúsdei, uénsdei…|Today is Monday.|Los días se escriben con mayúscula.
Sí / no / quizá|yes / no / maybe|ies / nou / méibi|Maybe tomorrow.|Tres respuestas esenciales.
Esto / eso / aquello|this / that / that over there|dis / dat / dat óuver der|This is my book.|This está cerca; that está más lejos.
Personas y lugares|person, friend, family, home, school, station|pérson, frend, fámili…|My friend is at home.|Vocabulario para identificar quién y dónde.
Preguntas básicas|what / who / where / when|uát / jú / uér / uén|Where are you?|Qué, quién, dónde y cuándo.`,
Korean:`Presentarte|저는 아나예요.|jeoneun anayeyo|저는 아나예요.|저는…예요 significa “yo soy…”.
Preguntar el nombre|이름이 뭐예요?|ireumi mwoyeyo|이름이 뭐예요?|Forma cortés de preguntar el nombre.
Decir de dónde eres|저는 멕시코에서 왔어요.|jeoneun meksikoeseo wasseoyo|저는 멕시코에서 왔어요.|Literalmente: vine de México.
Números 0–20|영, 일, 이, 삼, 사, 오, 육, 칠, 팔, 구, 십, 십일, 십이, 십삼, 십사, 십오, 십육, 십칠, 십팔, 십구, 이십|yeong, il, i, sam…|열두 시예요.|Aquí se presentan los números sino-coreanos.
Hora básica|몇 시예요? 세 시예요.|myeot siyeyo; se siyeyo|세 시예요.|Para las horas se usan normalmente números coreanos nativos.
Días de la semana|월요일, 화요일, 수요일, 목요일, 금요일, 토요일, 일요일|woryoil, hwayoil, suyoil…|오늘은 월요일이에요.|Todos terminan en 요일.
Sí / no / quizá|네 / 아니요 / 아마|ne / aniyo / ama|아마 내일요.|Sí, no y quizá.
Esto / eso / aquello|이것 / 그것 / 저것|igeot / geugeot / jeogeot|이것은 책이에요.|이 está cerca de mí, 그 de ti y 저 lejos de ambos.
Personas y lugares|사람, 친구, 가족, 집, 학교, 역|saram, chingu, gajok, jip, hakgyo, yeok|친구가 학교에 있어요.|Personas y lugares frecuentes.
Preguntas básicas|뭐 / 누구 / 어디 / 언제|mwo / nugu / eodi / eonje|어디예요?|Qué, quién, dónde y cuándo.`,
Japanese:`Presentarte|わたしは アナです。|wa-ta-shi wa A-na des|私はアナです。|La partícula は presenta el tema y aquí se pronuncia wa.
Preguntar el nombre|おなまえは なんですか。|o-na-ma-e wa nan des-ka|お名前は何ですか。|Pregunta cortés por el nombre.
Decir de dónde eres|メキシコから きました。|Me-ki-shi-ko ka-ra ki-ma-shi-ta|メキシコから来ました。|から marca el punto de origen.
Números 0–20|ゼロ、いち、に、さん、よん、ご、ろく、なな、はち、きゅう、じゅう、じゅういち、じゅうに、じゅうさん、じゅうよん、じゅうご、じゅうろく、じゅうなな、じゅうはち、じゅうきゅう、にじゅう|ze-ro, i-chi, ni, san…|二十|Del 11 al 19: diez + unidad; 20 es dos dieces.
Hora básica|いま なんじですか。さんじです。|i-ma nan-ji des-ka; san-ji des|今何時ですか。|時 se lee じ y marca la hora.
Días de la semana|げつようび、かようび、すいようび、もくようび、きんようび、どようび、にちようび|ge-tsu-yō-bi, ka-yō-bi…|今日は月曜日です。|Todos terminan en 曜日（ようび）.
Sí / no / quizá|はい / いいえ / たぶん|hai / i-ie / ta-bun|たぶん あしたです。|Respuestas básicas: sí, no y probablemente.
Esto / eso / aquello|これ / それ / あれ|ko-re / so-re / a-re|これは本です。|こ está cerca de quien habla, そ del interlocutor y あ lejos de ambos.
Personas y lugares|ひと、ともだち、かぞく、いえ、がっこう、えき|hi-to, to-mo-da-chi, ka-zo-ku…|友だちは学校にいます。|Personas y lugares frecuentes.
Preguntas básicas|なに / だれ / どこ / いつ|na-ni / da-re / do-ko / i-tsu|どこですか。|Qué, quién, dónde y cuándo.`,
Chinese:`Presentarte|我叫安娜。|wǒ jiào Ānnà|我叫安娜。|我叫… significa “me llamo…”.
Preguntar el nombre|你叫什么名字？|nǐ jiào shénme míngzi|你叫什么名字？|Pregunta neutral por el nombre.
Decir de dónde eres|我来自墨西哥。|wǒ láizì Mòxīgē|我来自墨西哥。|来自 significa “venir de”.
Números 0–20|零，一，二，三，四，五，六，七，八，九，十，十一，十二，十三，十四，十五，十六，十七，十八，十九，二十|líng, yī, èr, sān…|二十|Del 11 al 19: diez + unidad.
Hora básica|几点？三点。|jǐ diǎn; sān diǎn|现在三点。|点 marca la hora.
Días de la semana|星期一，星期二，星期三，星期四，星期五，星期六，星期日|xīngqī yī, xīngqī èr…|今天星期一。|星期 + número; domingo usa 日 o 天.
Sí / no / quizá|是 / 不是 / 可能|shì / bú shì / kěnéng|可能明天。|Sí, no y quizá dependen también del verbo.
Esto / eso / aquello|这 / 那 / 那边那个|zhè / nà / nàbiān nàge|这是书。|这 está cerca; 那 está lejos.
Personas y lugares|人，朋友，家人，家，学校，车站|rén, péngyou, jiārén…|朋友在学校。|Personas y lugares frecuentes.
Preguntas básicas|什么 / 谁 / 哪里 / 什么时候|shénme / shéi / nǎlǐ / shénme shíhou|你在哪里？|Qué, quién, dónde y cuándo.`,
German:`Presentarte|Ich heiße Anna.|ij jáise Ana|Ich heiße Anna.|También puedes decir “Ich bin Anna”.
Preguntar el nombre|Wie heißt du?|vi jáist du|Wie heißt du?|Con respeto: Wie heißen Sie?
Decir de dónde eres|Ich komme aus Mexiko.|ij kome aus Méksiko|Ich komme aus Mexiko.|aus introduce el lugar de origen.
Números 0–20|null, eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn, elf, zwölf, dreizehn, vierzehn, fünfzehn, sechzehn, siebzehn, achtzehn, neunzehn, zwanzig|null, ains, tsvai…|Ich bin zwanzig.|Del 13 al 19 aparece -zehn.
Hora básica|Wie spät ist es? Es ist drei Uhr.|vi shpét ist es; es ist drai ur|Es ist drei Uhr.|Uhr acompaña la hora exacta.
Días de la semana|Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag|móntag, díinstag, mítvoj…|Heute ist Montag.|Los días son sustantivos y llevan mayúscula.
Sí / no / quizá|ja / nein / vielleicht|ya / nain / filáijt|Vielleicht morgen.|Sí, no y quizá.
Esto / eso / aquello|dies / das / jenes|diis / das / yénes|Das ist mein Buch.|das es muy frecuente para señalar algo.
Personas y lugares|Person, Freund, Familie, Haus, Schule, Bahnhof|persón, froint, famílie…|Mein Freund ist zu Hause.|Personas y lugares frecuentes.
Preguntas básicas|was / wer / wo / wann|vas / ver / vo / van|Wo bist du?|Qué, quién, dónde y cuándo.`,
Russian:`Presentarte|Меня зовут Анна.|minyá zavút Ana|Меня зовут Анна.|Literalmente: a mí me llaman Anna.
Preguntar el nombre|Как вас зовут?|kak vas zavút|Как вас зовут?|Informal: Как тебя зовут?
Decir de dónde eres|Я из Мексики.|ya iz Méksiki|Я из Мексики.|из indica procedencia.
Números 0–20|ноль, один, два, три, четыре, пять, шесть, семь, восемь, девять, десять, одиннадцать, двенадцать, тринадцать, четырнадцать, пятнадцать, шестнадцать, семнадцать, восемнадцать, девятнадцать, двадцать|nol, adín, dva, tri…|Мне двадцать лет.|11–19 comparten una terminación relacionada con diez.
Hora básica|Который час? Три часа.|katóry chas; tri chasá|Сейчас три часа.|La forma de час cambia con el número.
Días de la semana|понедельник, вторник, среда, четверг, пятница, суббота, воскресенье|panidél'nik, ftórnik, sredá…|Сегодня понедельник.|Apréndelos como palabras completas.
Sí / no / quizá|да / нет / может быть|da / niet / mózhet byt|Может быть завтра.|Sí, no y quizá.
Esto / eso / aquello|это / то / вон то|éta / to / von to|Это книга.|Это sirve para presentar algo.
Personas y lugares|человек, друг, семья, дом, школа, вокзал|chilavék, druk, simyá…|Друг в школе.|Personas y lugares frecuentes.
Preguntas básicas|что / кто / где / когда|shto / kto / gdie / kagdá|Где ты?|Qué, quién, dónde y cuándo.`,
Italian:`Presentarte|Mi chiamo Anna.|mi kiámo Ana|Mi chiamo Anna.|La forma habitual de decir tu nombre.
Preguntar el nombre|Come ti chiami?|cóme ti kiámi|Come ti chiami?|Formal: Come si chiama?
Decir de dónde eres|Sono del Messico.|sóno del Méssico|Sono del Messico.|Sono di… también se usa con ciudades.
Números 0–20|zero, uno, due, tre, quattro, cinque, sei, sette, otto, nove, dieci, undici, dodici, tredici, quattordici, quindici, sedici, diciassette, diciotto, diciannove, venti|dzéro, úno, dúe…|Ho vent'anni.|17–19 empiezan con dici-.
Hora básica|Che ore sono? Sono le tre.|ke óre sóno; sóno le tre|Sono le tre.|Para la una: È l'una.
Días de la semana|lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica|lunedí, martedí, mercoledí…|Oggi è lunedì.|Normalmente se escriben con minúscula.
Sí / no / quizá|sì / no / forse|si / no / fórse|Forse domani.|Sí, no y quizá.
Esto / eso / aquello|questo / quello / quello laggiù|kuésto / kuélo|Questo è il mio libro.|questo está cerca; quello más lejos.
Personas y lugares|persona, amico, famiglia, casa, scuola, stazione|persóna, amíco, famíllia…|Il mio amico è a casa.|Personas y lugares frecuentes.
Preguntas básicas|che cosa / chi / dove / quando|ke cósa / ki / dóve / kuándo|Dove sei?|Qué, quién, dónde y cuándo.`,
French:`Presentarte|Je m'appelle Anna.|ye mapél Ana|Je m'appelle Anna.|La forma habitual de presentarte.
Preguntar el nombre|Comment vous appelez-vous ?|comán vu sapelé vu|Comment vous appelez-vous ?|Informal: Comment tu t'appelles ?
Decir de dónde eres|Je viens du Mexique.|ye vián du Meksík|Je viens du Mexique.|venir de expresa procedencia.
Números 0–20|zéro, un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt|zeró, an, de, truá…|J'ai vingt ans.|17–19 se construyen con dix-.
Hora básica|Quelle heure est-il ? Il est trois heures.|kel er etil; il e truá ser|Il est trois heures.|heure cambia a heures desde las dos.
Días de la semana|lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche|landí, mardí, mercredí…|Aujourd'hui, c'est lundi.|Normalmente se escriben con minúscula.
Sí / no / quizá|oui / non / peut-être|uí / no nasal / petétr|Peut-être demain.|Sí, no y quizá.
Esto / eso / aquello|ceci / cela / ça là-bas|sesí / sela / sa labá|C'est mon livre.|En conversación, ça es muy frecuente.
Personas y lugares|personne, ami, famille, maison, école, gare|persón, amí, famíi…|Mon ami est à la maison.|Personas y lugares frecuentes.
Preguntas básicas|quoi / qui / où / quand|kuá / ki / u / kan|Où êtes-vous ?|Qué, quién, dónde y cuándo.`};

for(const [language,text] of Object.entries(COMMUNICATIVE))ZERO_COURSES[language].stages.push(stage(language,'communication','8. Primeros conceptos comunicativos',text));
ZERO_COURSES.Japanese.stages.splice(-1,0,
  stage('Japanese','particles','8. Partículas para orientarte',`は|わたしは がくせいです|presenta el tema|私は学生です。|Indica de qué se habla; como partícula se pronuncia わ.
が|ねこが います|señala información nueva|猫がいます。|Marca quién o qué existe o realiza la acción.
を|みずを のみます|marca el objeto|水を飲みます。|Indica aquello sobre lo que actúa el verbo.
に|がっこうに いきます|destino o momento|学校に行きます。|Marca destino, hora o punto de llegada.
で|がっこうで べんきょうします|lugar de acción|学校で勉強します。|Indica dónde ocurre una actividad.
の|わたしの ほん|relación o posesión|私の本|Une dos nombres: “el libro de mí”.
も|わたしも いきます|también|私も行きます。|Sustituye は o が para añadir “también”.`),
  stage('Japanese','verbs','9. Verbos y descripciones',`ます|まいにち べんきょうします|acción cortés habitual|毎日勉強します。|Forma cortés afirmativa no pasada.
ません|きょうは いきません|negación cortés|今日は行きません。|Forma cortés negativa no pasada.
ました|きのう いきました|pasado cortés|昨日行きました。|Expresa una acción terminada.
ませんでした|きのう いきませんでした|pasado negativo|昨日行きませんでした。|Indica que una acción no ocurrió.
い-adjetivo|この ほんは おもしろいです|descripción directa|この本は面白いです。|Los adjetivos terminados en い pueden ir antes del nombre o al final.
な-adjetivo|しずかな まちです|な antes del nombre|静かな町です。|Los adjetivos de tipo な usan な cuando modifican un nombre.
あります / います|ほんが あります・ねこが います|existencia inanimada / animada|本があります。|あります se usa para cosas; います para seres animados.`),
  stage('Japanese','time','10. Números, horas y contadores',`一・二・三|いち・に・さん|números básicos|一、二、三|Reconoce primero los números frecuentes sin transcripción latina.
時|いま さんじです|hora|今三時です。|時 se lee じ después del número.
分|ごふん・じゅっぷん|minutos|五分・十分|La lectura puede cambiar según el número.
人|ひとり・ふたり・さんにん|personas|一人・二人・三人|Los contadores tienen lecturas que conviene aprender como unidades.
つ|ひとつ・ふたつ・みっつ|objetos generales|一つ・二つ・三つ|Sirve para contar cosas de forma general.
曜日|げつようび・かようび|días de la semana|月曜日・火曜日|Cada día termina en ようび.
何|なんじ・なんにん・なに|qué / cuántos|何時ですか。|La lectura varía según la palabra que sigue.`),
  stage('Japanese','reading','11. Lectura guiada sin rōmaji',`わたしは アナです。|わたしは アナです|lee por unidades y localiza は|私はアナです。|Primero identifica palabras y partículas; después escucha la oración.
まいにち にほんごを べんきょうします。|まいにち にほんごを べんきょうします|encuentra を y el verbo final|毎日日本語を勉強します。|“Todos los días estudio japonés”.
きのう ともだちと えきに いきました。|きのう ともだちと えきに いきました|tiempo + compañía + destino + verbo|昨日友だちと駅に行きました。|“Ayer fui a la estación con un amigo”.
この みせは やすくて おいしいです。|この みせは やすくて おいしいです|dos descripciones conectadas|この店は安くておいしいです。|“Esta tienda es barata y rica”.
すみません、トイレは どこですか。|すみません、トイレは どこですか|llamada de atención + pregunta|すみません、トイレはどこですか。|Lee la pausa y reconoce どこ como “dónde”.`)
);
ZERO_COURSES.Japanese.stages.at(-1).title='12. Primeros conceptos comunicativos';

const DETAIL_MEANINGS={
  Presentarte:['Me llamo Ana'],
  'Preguntar el nombre':['¿Cómo te llamas?'],
  'Decir de dónde eres':['Soy de México'],
  'Números 0–20':['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte'],
  'Hora básica':['¿Qué hora es?','Son las tres'],
  'Días de la semana':['lunes','martes','miércoles','jueves','viernes','sábado','domingo'],
  'Sí / no / quizá':['sí','no','quizá'],
  'Esto / eso / aquello':['esto','eso','aquello'],
  'Personas y lugares':['persona','amigo','familia','casa','escuela','estación'],
  'Preguntas básicas':['qué','quién','dónde','cuándo']
};
function detailParts(item){const meanings=DETAIL_MEANINGS[item.symbol]||[item.explanation],separator=item.symbol==='Hora básica'?/(?<=[?？。])\s*/:meanings.length>3?/(?:[、，,]\s*|\s*\/\s*)/:/\s*\/\s*/,parts=String(item.speak||'').split(separator).map(value=>value.trim()).filter(Boolean);return parts.map((text,index)=>({text,meaning:meanings[index]||meanings.at(-1)||item.explanation}));}
for(const course of Object.values(ZERO_COURSES)){const communication=course.stages.find(item=>item.id==='communication');for(const item of communication.items)item.details=detailParts(item);}

export const ZERO_STAGE_TITLES=['1. Sonidos y escritura','2. Combinaciones básicas','3. Pronunciación peligrosa','4. Primeras palabras','5. Frases de supervivencia','6. Estructura básica del idioma','7. Escucha y repite','8. Primeros conceptos comunicativos','9. Prueba rápida'];

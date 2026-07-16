const rows=(text)=>text.trim().split('\n').map(line=>{const [symbol,speak,hint,example='']=line.split('|');return{symbol,speak,hint,example};});

const latin=(names)=>rows(names);

export const BEGINNER_COURSES={
  English:{title:'Primeros pasos con el inglés',intro:'Aprende el nombre y el sonido básico de cada letra. La ayuda en español es aproximada: escucha varias veces e imita la voz.',groups:[{title:'Alfabeto inglés',items:latin(`A|ay|ei|apple
B|bee|bi|book
C|see|si; ante e/i suele sonar s|city
D|dee|di|door
E|ee|i larga|even
F|eff|ef|food
G|gee|yi; a veces g fuerte|game
H|aitch|eich, con h aspirada|house
I|eye|ai|island
J|jay|yei|job
K|kay|kei|key
L|el|el|light
M|em|em|moon
N|en|en|name
O|oh|ou|open
P|pee|pi|pen
Q|cue|kiu|queen
R|ar|ar inglesa, sin vibrar|red
S|ess|es|sun
T|tee|ti|time
U|you|iu|use
V|vee|vi, con dientes sobre labio|very
W|double you|dábol iu|water
X|ex|eks|box
Y|why|uai|yes
Z|zee|zi (EE. UU.)|zoo`)}]},
  Korean:{title:'Primeros pasos con el hangul',intro:'El coreano se escribe en bloques silábicos. Primero escucha consonantes y vocales; después combínalas: ㄱ + ㅏ = 가.',groups:[{title:'Consonantes básicas',items:rows(`ㄱ|가|entre k y g suave|가
ㄴ|나|n|나
ㄷ|다|entre t y d suave|다
ㄹ|라|entre r suave y l|라
ㅁ|마|m|마
ㅂ|바|entre p y b suave|바
ㅅ|사|s; ante i se acerca a sh|사
ㅇ|아|muda al inicio; ng al final|아 / 강
ㅈ|자|entre ch y y fuerte|자
ㅊ|차|ch con aire|차
ㅋ|카|k con aire|카
ㅌ|타|t con aire|타
ㅍ|파|p con aire|파
ㅎ|하|h aspirada|하`)},{title:'Vocales básicas',items:rows(`ㅏ|아|a|아
ㅑ|야|ya|야
ㅓ|어|entre o abierta y a; no existe igual en español|어
ㅕ|여|yeo; como la anterior con y|여
ㅗ|오|o|오
ㅛ|요|yo|요
ㅜ|우|u|우
ㅠ|유|yu|유
ㅡ|으|u sin redondear los labios|으
ㅣ|이|i|이`)},{title:'Primeras combinaciones',items:rows(`가|가|ga/ka suave|ㄱ + ㅏ
나|나|na|ㄴ + ㅏ
다|다|da/ta suave|ㄷ + ㅏ
마|마|ma|ㅁ + ㅏ
바|바|ba/pa suave|ㅂ + ㅏ
사|사|sa|ㅅ + ㅏ
자|자|ya/cha suave|ㅈ + ㅏ
한|한|han|ㅎ + ㅏ + ㄴ`)}]},
  Russian:{title:'Primeros pasos con el cirílico',intro:'Muchas letras se parecen a las latinas, pero algunas representan sonidos distintos.',groups:[{title:'Alfabeto ruso',items:rows(`А|а|a|мама
Б|бэ|b|банк
В|вэ|v|вода
Г|гэ|g|город
Д|дэ|d|дом
Е|е|ye / e|есть
Ё|ё|yo|ёлка
Ж|жэ|como la y francesa de “journal”|жук
З|зэ|z sonora|зима
И|и|i|мир
Й|и краткое|y breve|мой
К|ка|k|кот
Л|эл|l|луна
М|эм|m|мама
Н|эн|n; no es h|нос
О|о|o; sin acento se acerca a a|он
П|пэ|p|папа
Р|эр|r vibrante|рука
С|эс|s; no es c/k|сок
Т|тэ|t|там
У|у|u|утро
Ф|эф|f|фото
Х|ха|j española suave|хорошо
Ц|цэ|ts|центр
Ч|чэ|ch|чай
Ш|ша|sh|школа
Щ|ща|sh más larga y suave|щука
Ъ|твёрдый знак|signo duro; no tiene sonido propio|объект
Ы|ы|i posterior; no existe igual en español|мы
Ь|мягкий знак|suaviza la consonante|день
Э|э|e abierta|это
Ю|ю|yu|юг
Я|я|ya|я`)}]},
  Italian:{title:'Primeros pasos con el italiano',intro:'El italiano usa 21 letras de forma habitual. Escucha sus nombres y observa los sonidos cercanos al español.',groups:[{title:'Alfabeto italiano',items:latin(`A|a|a|amore
B|bi|bi|bene
C|ci|chi ante e/i; k ante a/o/u|ciao
D|di|di|dove
E|e|e|era
F|effe|efe|fare
G|gi|yi ante e/i; g ante a/o/u|gelato
H|acca|no suena; cambia c/g|ho
I|i|i|isola
L|elle|ele|luna
M|emme|eme|mano
N|enne|ene|nome
O|o|o|ora
P|pi|pi|pane
Q|cu|ku|quando
R|erre|r vibrante|Roma
S|esse|ese|sole
T|ti|ti|tempo
U|u|u|uno
V|vi|vi, dientes sobre labio|vino
Z|zeta|ts o dz|zero`)}]},
  French:{title:'Primeros pasos con el francés',intro:'Aprende primero el nombre de las letras. En francés muchas letras finales no se pronuncian.',groups:[{title:'Alfabeto francés',items:latin(`A|a|a|ami
B|bé|be|bon
C|cé|se|café
D|dé|de|deux
E|e|e cerrada o sonido neutro|le
F|effe|ef|femme
G|gé|ye|gare
H|ache|ash; normalmente no suena|homme
I|i|i|ici
J|ji|yi francesa|jour
K|ka|ka|kilo
L|elle|el|livre
M|emme|em|mère
N|enne|en|nom
O|o|o|orange
P|pé|pe|père
Q|cu|ku|qui
R|erre|r de garganta|rue
S|esse|es|soleil
T|té|te|table
U|u|i con labios de u|tu
V|vé|ve|ville
W|double vé|doble ve|wagon
X|ix|iks|taxi
Y|i grec|i griega|style
Z|zède|zed|zéro`)}]},
  German:{title:'Primeros pasos con el alemán',intro:'Escucha el alfabeto y presta atención a las vocales con diéresis y a ß.',groups:[{title:'Alfabeto alemán',items:latin(`A|ah|a|Apfel
B|beh|be|Buch
C|tseh|tse|Computer
D|deh|de|Deutsch
E|eh|e|Elefant
F|eff|ef|Fisch
G|geh|gue|gut
H|hah|ha aspirada|Haus
I|ih|i|ich
J|yot|yot; suele sonar y|ja
K|kah|ka|Kind
L|ell|el|Land
M|emm|em|Mann
N|enn|en|Name
O|oh|o|offen
P|peh|pe|Park
Q|kuh|ku|Quelle
R|err|r de garganta o vibrante|rot
S|ess|s; al inicio puede sonar z|Sonne
T|teh|te|Tag
U|uh|u|Uhr
V|fau|fau; suele sonar f|Vater
W|veh|ve|Wasser
X|iks|iks|Taxi
Y|üpsilon|üpsilon|Typ
Z|tsett|tset|Zeit
Ä|äh|e abierta|Äpfel
Ö|öh|e con labios de o|Öl
Ü|üh|i con labios de u|über
ß|eszett|s larga|Straße`)}]},
  Japanese:{title:'Primeros pasos con el japonés',intro:'Empieza con hiragana. Cada símbolo representa una mora, una unidad rítmica corta.',groups:[{title:'Hiragana básico',items:rows(`あ|あ|a|あめ
い|い|i|いえ
う|う|u suave|うみ
え|え|e|えき
お|お|o|おと
か|か|ka|かお
き|き|ki|き
く|く|ku|くち
け|け|ke|け
こ|こ|ko|ここ
さ|さ|sa|さけ
し|し|shi|しろ
す|す|su suave|すし
せ|せ|se|せかい
そ|そ|so|そら
た|た|ta|たべる
ち|ち|chi|ちず
つ|つ|tsu|つき
て|て|te|て
と|と|to|とり
な|な|na|なまえ
に|に|ni|にく
ぬ|ぬ|nu|いぬ
ね|ね|ne|ねこ
の|の|no|もの
は|は|ha; como partícula puede sonar wa|はな
ひ|ひ|hi|ひと
ふ|ふ|fu suave|ふね
へ|へ|he; como partícula puede sonar e|へや
ほ|ほ|ho|ほん
ま|ま|ma|まち
み|み|mi|みみ
む|む|mu|むし
め|め|me|め
も|も|mo|もの
や|や|ya|やま
ゆ|ゆ|yu|ゆき
よ|よ|yo|よる
ら|ら|ra suave, entre r y l|らく
り|り|ri suave|りんご
る|る|ru suave|くるま
れ|れ|re suave|れきし
ろ|ろ|ro suave|ろく
わ|わ|wa|わたし
を|を|o; partícula de objeto|みずを
ん|ん|n|ほん`)},{title:'Katakana esencial',items:rows(`ア|ア|a|アメリカ
イ|イ|i|イタリア
ウ|ウ|u suave|ウール
エ|エ|e|エレベーター
オ|オ|o|オレンジ
カ|カ|ka|カメラ
キ|キ|ki|キロ
ク|ク|ku|クラス
ケ|ケ|ke|ケーキ
コ|コ|ko|コーヒー
サ|サ|sa|サラダ
シ|シ|shi|シャツ
ス|ス|su suave|スーパー
セ|セ|se|セーター
ソ|ソ|so|ソファ
タ|タ|ta|タクシー
チ|チ|chi|チーズ
ツ|ツ|tsu|ツアー
テ|テ|te|テスト
ト|ト|to|トイレ
ナ|ナ|na|ナイフ
ニ|ニ|ni|ニュース
ヌ|ヌ|nu|カヌー
ネ|ネ|ne|ネクタイ
ノ|ノ|no|ノート
ハ|ハ|ha|ハンバーガー
ヒ|ヒ|hi|コーヒー
フ|フ|fu suave|フォーク
ヘ|ヘ|he|ヘルメット
ホ|ホ|ho|ホテル
マ|マ|ma|マスク
ミ|ミ|mi|ミルク
ム|ム|mu|ゲーム
メ|メ|me|メール
モ|モ|mo|モデル
ヤ|ヤ|ya|タイヤ
ユ|ユ|yu|ユーロ
ヨ|ヨ|yo|ヨーグルト
ラ|ラ|ra suave|ラジオ
リ|リ|ri suave|リスト
ル|ル|ru suave|ルール
レ|レ|re suave|レストラン
ロ|ロ|ro suave|ロシア
ワ|ワ|wa|ワイン
ヲ|ヲ|o; uso poco frecuente|ヲ
ン|ン|n|パン`)}]},
  Chinese:{title:'Primeros pasos con el chino mandarín',intro:'El chino no tiene alfabeto. Comienza con pinyin y sus cuatro tonos; cambiar el tono puede cambiar el significado.',groups:[{title:'Los cuatro tonos',items:rows(`ā|mā|tono 1: alto y plano|mā 妈, mamá
á|má|tono 2: sube, como una pregunta|má 麻, cáñamo
ǎ|mǎ|tono 3: baja y vuelve a subir|mǎ 马, caballo
à|mà|tono 4: cae con fuerza|mà 骂, regañar`)},{title:'Sonidos iniciales útiles',items:rows(`b|bā|p suave sin aire|八
p|pā|p con bastante aire|趴
d|dā|t suave sin aire|搭
t|tā|t con aire|他
g|gē|k suave sin aire|哥
k|kē|k con aire|科
j|jī|entre yi y chi, lengua adelante|鸡
q|qī|chi con mucho aire|七
x|xī|sh muy suave, lengua adelante|西
zh|zhī|ch retrofleja, lengua atrás|知
ch|chī|ch retrofleja con aire|吃
sh|shī|sh con lengua atrás|师
r|rì|r suave retrofleja|日`) }]},
  Portuguese:{title:'Primeros pasos con el portugués',intro:'Las letras son familiares, pero las vocales nasales y algunos nombres cambian respecto al español.',groups:[{title:'Alfabeto portugués',items:latin(`A|á|a|amor
B|bê|be|bom
C|cê|se|casa
D|dê|de|dia
E|é|e|ele
F|efe|efe|falar
G|gê|ye|gato
H|agá|agá; normalmente no suena|hoje
I|i|i|ilha
J|jota|y francesa|janela
K|cá|ka|kilo
L|ele|ele|lua
M|eme|eme; al final nasaliza|mãe
N|ene|ene|nome
O|ó|o|olá
P|pê|pe|pão
Q|quê|ke|que
R|erre|r; al inicio suele ser de garganta|rio
S|esse|ese|sol
T|tê|te|tempo
U|u|u|uva
V|vê|ve|vida
W|dáblio|dablio|web
X|xis|sh, s, z o ks|xícara
Y|ípsilon|ípsilon|yoga
Z|zê|ze|zero`)}]},
  Arabic:{title:'Primeros pasos con el alfabeto árabe',intro:'El árabe se escribe de derecha a izquierda y las letras cambian de forma al unirse.',groups:[{title:'Alfabeto árabe',items:rows(`ا|ألف|a larga; soporte de vocal|باب
ب|باء|b|بيت
ت|تاء|t|تمر
ث|ثاء|th inglesa de think|ثلاثة
ج|جيم|y fuerte o j según la región|جمل
ح|حاء|h profunda de garganta|حب
خ|خاء|j española fuerte|خبز
د|دال|d|دار
ذ|ذال|th inglesa de this|ذهب
ر|راء|r vibrante|رجل
ز|زاي|z sonora|زيت
س|سين|s|سمك
ش|شين|sh|شمس
ص|صاد|s enfática|صباح
ض|ضاد|d enfática|ضوء
ط|طاء|t enfática|طعام
ظ|ظاء|th o z enfática|ظهر
ع|عين|sonido profundo de garganta|عرب
غ|غين|r francesa profunda|غرفة
ف|فاء|f|فم
ق|قاف|k muy posterior|قلب
ك|كاف|k|كتاب
ل|لام|l|ليل
م|ميم|m|ماء
ن|نون|n|نور
ه|هاء|h suave|هو
و|واو|w o u larga|ورد
ي|ياء|y o i larga|يد`)}]}
};

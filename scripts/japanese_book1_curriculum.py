"""Currículo obligatorio que prepara para HS-JP-B01 sin revelar su historia."""

WORD_SETS = {
    "Saludos y cortesía": [("おはようございます", "buenos días"), ("こんにちは", "hola"), ("こんばんは", "buenas noches"), ("はじめまして", "mucho gusto"), ("よろしくおねがいします", "encantado / cuento contigo")],
    "Personas y seres": [("わたし", "yo"), ("なまえ", "nombre"), ("ひと", "persona"), ("ねこ", "gato"), ("いきもの", "ser vivo")],
    "La biblioteca": [("としょかん", "biblioteca"), ("ほん", "libro"), ("かぎ", "llave"), ("とけい", "reloj"), ("カード", "tarjeta")],
    "Objetos y habitación": [("はこ", "caja"), ("つくえ", "escritorio"), ("まど", "ventana"), ("ドア", "puerta"), ("ページ", "página")],
    "Posición y lugares": [("うえ", "encima"), ("なか", "dentro"), ("ちかく", "cerca"), ("まえ", "delante"), ("みち", "camino")],
    "Ciudad y recorrido": [("まち", "ciudad o pueblo"), ("みせ", "tienda"), ("とう", "torre"), ("いえ", "casa"), ("ここ", "aquí"), ("あそこ", "allí")],
    "Trabajo y relato": [("しごと", "trabajo"), ("りゆう", "razón"), ("みらい", "futuro"), ("つぎ", "siguiente"), ("いっしょに", "juntos")],
    "Compras": [("みず", "agua"), ("おかね", "dinero"), ("ひゃくえん", "cien yenes"), ("むりょう", "gratis"), ("いくら", "cuánto cuesta")],
    "Tiempo": [("いま", "ahora"), ("きのう", "ayer"), ("あさ", "mañana, primera parte del día"), ("きょう", "hoy"), ("あした", "mañana, día siguiente")],
    "Números y cantidades": [("いち", "uno"), ("に", "dos"), ("さん", "tres"), ("いっさつ", "un ejemplar encuadernado"), ("にさつ", "dos ejemplares encuadernados"), ("さんさつ", "tres ejemplares encuadernados")],
}

SENTENCE_PATTERNS = [
    ("A は B です", "Identificar y presentarse", [("わたしはミナです。", "Soy Mina."), ("ここはとしょかんです。", "Aquí es una biblioteca.")]),
    ("A は B ではありません", "Negación nominal", [("ひとではありません。", "No es una persona."), ("これはカードではありません。", "Esto no es una tarjeta.")]),
    ("A は B ですか", "Preguntas con ですか", [("これはほんですか。", "¿Esto es un libro?"), ("ここはみせですか。", "¿Aquí es una tienda?")]),
    ("これ・それ・あれ", "Objetos cercanos y lejanos", [("これはなんですか。", "¿Qué es esto?"), ("それはかぎです。", "Eso es una llave."), ("あれはとけいです。", "Aquello es un reloj.")]),
    ("ここ・そこ・あそこ", "Lugares cercanos y lejanos", [("ねこはどこですか。", "¿Dónde está el gato?"), ("あそこです。", "Está allí.")]),
    ("あります・います", "Existencia de cosas y seres", [("ほんがあります。", "Hay un libro."), ("ねこがいます。", "Hay un gato."), ("おかねがありません。", "No hay dinero.")]),
    ("上・中・近く・前", "Ubicación precisa", [("ほんはつくえのうえです。", "El libro está sobre el escritorio."), ("かぎははこのなかです。", "La llave está dentro de la caja."), ("ねこはまどのちかくにいます。", "El gato está cerca de la ventana.")]),
    ("の・も", "Posesión y adición", [("わたしのほんです。", "Es mi libro."), ("カードもあります。", "También hay una tarjeta.")]),
    ("が・を", "Sujeto y objeto", [("ドアがあきます。", "La puerta se abre."), ("ほんをよみます。", "Leo un libro.")]),
    ("に・で・へ・と", "Destino, lugar de acción y compañía", [("みせにいきます。", "Voy a la tienda."), ("ここでまちます。", "Espero aquí."), ("いっしょにいきます。", "Vamos juntos.")]),
    ("何・誰・どこ・どうして", "Preguntas esenciales", [("なにをしますか。", "¿Qué haces?"), ("だれがあけましたか。", "¿Quién abrió?"), ("どうしてですか。", "¿Por qué?")]),
]

VERB_SETS = {
    "Acciones con objetos": [("うごきます", "moverse"), ("みます", "ver o mirar"), ("おきます", "poner"), ("よみます", "leer"), ("かきます", "escribir")],
    "Entrar, abrir y esperar": [("いれます", "meter"), ("まちます", "esperar"), ("あけます", "abrir algo"), ("あきます", "abrirse"), ("はいります", "entrar")],
    "Ir y regresar": [("いきます", "ir"), ("きます", "venir"), ("かえります", "volver a casa"), ("もどります", "regresar"), ("いそぎます", "apresurarse")],
    "Buscar, comprar y comenzar": [("さがします", "buscar"), ("かいます", "comprar"), ("もちます", "tener o llevar"), ("わかります", "entender"), ("はじまります", "comenzar")],
}

VERB_PATTERNS = [
    ("Presente y negativo", "ます afirma y ません niega", [("よみます。", "Leo."), ("よみません。", "No leo.")]),
    ("Pasado y pasado negativo", "ました y ませんでした sitúan la acción en el pasado", [("かえりました。", "Volví."), ("ありませんでした。", "No había.")]),
    ("～ています", "Acción en progreso o estado resultante", [("はこがうごいています。", "La caja se está moviendo."), ("ドアがあいています。", "La puerta está abierta.")]),
    ("～てください", "Petición cortés", [("はこのなかをみてください。", "Mira dentro de la caja, por favor."), ("ここでまってください。", "Espera aquí, por favor.")]),
    ("～ないでください", "Petición negativa o prohibición", [("そのドアをあけないでください。", "No abras esa puerta, por favor.")]),
    ("～ましょう", "Propuesta: hagámoslo", [("いっしょにいきましょう。", "Vayamos juntos."), ("ねこをさがしましょう。", "Busquemos al gato.")]),
    ("～たいです", "Deseo de realizar una acción", [("みずをかいたいです。", "Quiero comprar agua."), ("いえにかえりたいです。", "Quiero volver a casa.")]),
    ("～てあります", "Estado preparado por una acción", [("なまえがかいてあります。", "El nombre está escrito.")]),
]

ADJECTIVE_SETS = {
    "Tamaño y valoración": [("おおきい", "grande"), ("ちいさい", "pequeño"), ("かわいい", "bonito o adorable"), ("あぶない", "peligroso"), ("あたらしい", "nuevo")],
    "Colores del relato": [("あかい", "rojo"), ("あおい", "azul"), ("しろい", "blanco"), ("くろい", "negro")],
}

ADJECTIVE_PATTERNS = [
    ("Adjetivo い + sustantivo", "Los adjetivos い van directamente antes del sustantivo", [("あかいほんです。", "Es un libro rojo."), ("しろいねこです。", "Es un gato blanco.")]),
    ("Negativo de adjetivos い", "Cambia い por くありません", [("おおきくありません。", "No es grande."), ("あまりおおきくありません。", "No es muy grande.")]),
    ("～ですね", "Pedir o compartir confirmación", [("かわいいですね。", "Es adorable, ¿verdad?")]),
    ("～ですから", "Explicar una razón", [("あぶないですから。", "Porque es peligroso.")]),
]

FUNCTIONAL_SETS = {
    "Presentarse": [("はじめまして。", "Mucho gusto."), ("わたしはミナです。", "Soy Mina."), ("よろしくおねがいします。", "Encantada / cuento contigo.")],
    "Pedir y señalar": [("このほんですか。", "¿Este libro?"), ("そのほんをください。", "Ese libro, por favor."), ("つぎのページをよんでください。", "Lee la página siguiente, por favor.")],
    "Contar libros con 冊": [("ほんがさんさつあります。", "Hay tres libros."), ("あかいほんをいっさつください。", "Un libro rojo, por favor."), ("にさつをつくえにおきます。", "Pongo dos libros en el escritorio.")],
    "Preguntar y explicar razones": [("どうしてですか。", "¿Por qué?"), ("あぶないですから。", "Porque es peligroso."), ("だめです。", "No está permitido.")],
    "Comprar": [("みずはいくらですか。", "¿Cuánto cuesta el agua?"), ("ひゃくえんです。", "Son cien yenes."), ("カードはありますか。", "¿Tienes tarjeta?")],
    "Buscar y ubicarse": [("ねこはどこにいますか。", "¿Dónde está el gato?"), ("とうのまえにいます。", "Está delante de la torre."), ("みちがわかりません。", "No conozco el camino.")],
    "Comprender y actuar": [("わかりました。", "Entendido."), ("いそいでいきましょう。", "Vayamos deprisa."), ("もういちどおねがいします。", "Otra vez, por favor.")],
}

# Los 74 caracteres usados por las frases y el vocabulario de HS-JP-B01.
KANJI_GROUPS = {
    "Biblioteca y objetos": [("図", "biblioteca en 図書館 · としょかん"), ("書", "libro/escribir en 図書館 · としょかん"), ("館", "edificio en 図書館 · としょかん"), ("本", "libro · ほん"), ("鍵", "llave · かぎ"), ("時", "reloj en 時計 · とけい"), ("計", "medir en 時計 · とけい"), ("箱", "caja · はこ"), ("机", "escritorio · つくえ"), ("窓", "ventana · まど")],
    "Personas y seres": [("私", "yo · わたし"), ("名", "nombre en 名前 · なまえ"), ("前", "nombre/delante · まえ"), ("人", "persona · ひと"), ("生", "vivir en 生き物 · いきもの"), ("物", "ser/cosa en 生き物 · いきもの"), ("猫", "gato · ねこ"), ("誰", "quién · だれ")],
    "Lugares y posición": [("上", "encima · うえ"), ("中", "dentro · なか"), ("近", "cerca en 近く · ちかく"), ("道", "camino · みち"), ("町", "ciudad o pueblo · まち"), ("店", "tienda · みせ"), ("塔", "torre · とう"), ("家", "casa · いえ")],
    "Números y dinero": [("一", "uno · いち"), ("二", "dos · に"), ("三", "tres · さん"), ("百", "cien · ひゃく"), ("円", "yen · えん"), ("冊", "contador de libros · さつ"), ("金", "dinero en お金 · おかね"), ("無", "gratis en 無料 · むりょう"), ("料", "tarifa en 無料 · むりょう")],
    "Tiempo y relato": [("今", "ahora · いま"), ("昨", "ayer en 昨日 · きのう"), ("日", "día en 昨日 · きのう"), ("朝", "mañana · あさ"), ("明", "mañana en 明日 · あした"), ("未", "futuro en 未来 · みらい"), ("来", "venir/futuro · くる / みらい"), ("次", "siguiente · つぎ"), ("新", "nuevo · あたらしい"), ("始", "comenzar · はじまる")],
    "Acciones I": [("動", "moverse · うごく"), ("見", "ver · みる"), ("置", "poner · おく"), ("仕", "trabajo en 仕事 · しごと"), ("事", "asunto/trabajo · しごと"), ("読", "leer · よむ"), ("入", "entrar o meter · はいる / いれる"), ("待", "esperar · まつ"), ("開", "abrir/abrirse · あける / あく")],
    "Acciones II": [("分", "entender en 分かる · わかる"), ("行", "ir · いく"), ("買", "comprar · かう"), ("帰", "volver a casa · かえる"), ("戻", "regresar · もどる"), ("持", "tener/llevar · もつ"), ("探", "buscar · さがす"), ("急", "apresurarse · いそぐ"), ("願", "pedir/desear · ねがう")],
    "Preguntas y cualidades": [("何", "qué · なに / なん"), ("理", "razón en 理由 · りゆう"), ("由", "motivo en 理由 · りゆう"), ("小", "pequeño · ちいさい"), ("大", "grande · おおきい"), ("危", "peligroso · あぶない"), ("赤", "rojo · あかい"), ("青", "azul · あおい"), ("白", "blanco · しろい"), ("水", "agua · みず")],
    "Composición final": [("緒", "juntos en 一緒に · いっしょに")],
}

BRIDGE_DIALOGUES = [
    ("Orientarse en una biblioteca", [("ここはとしょかんです。ほんはつくえのうえにあります。", "Aquí hay una biblioteca y el libro está sobre el escritorio.")]),
    ("Encontrar un objeto", [("かぎはどこですか。はこのなかをみてください。", "Pregunta por una llave y recibe una indicación.")]),
    ("Una regla importante", [("そのドアをあけないでください。あぶないですから。", "Se prohíbe abrir una puerta y se explica el motivo.")]),
    ("Comprar agua", [("みずはいくらですか。ひゃくえんです。みずをください。", "Pregunta el precio y compra agua.")]),
    ("Buscar el camino", [("みちがわかりません。とうのまえでまちましょう。", "No conoce el camino y propone esperar frente a una torre.")]),
    ("Leer una nota", [("なまえがかいてあります。つぎのページをよんでください。", "Hay un nombre escrito y se pide leer la página siguiente.")]),
]


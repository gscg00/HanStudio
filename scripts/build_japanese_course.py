from __future__ import annotations

import json
import random
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "HanStoryPlayerWeb" / "library" / "courses" / "japanese"
UNITS = ROOT / "units"


def activity(identifier, kind, prompt, target="", options=None, answer="", explanation="", audio="", xp=10, **extra):
    return {
        "id": identifier,
        "type": kind,
        "prompt": prompt,
        "target": target,
        "options": options or [],
        "answer": answer,
        "explanation": explanation,
        "audio": audio,
        "slow_audio": audio,
        "image": None,
        "writing_asset": None,
        "tags": extra.pop("tags", []),
        "xp": xp,
        **extra,
    }


def intro(identifier, title, explanation):
    return activity(identifier, "lesson_intro", title, explanation=explanation, xp=2, gradable=False)


def teach(identifier, symbol, sound_hint, memory_hint="", stroke_hint="", audio_key=None):
    return activity(
        identifier,
        "teach_kana",
        f"Conoce {symbol}",
        target=symbol,
        explanation=f"Mira la forma y escucha {symbol} antes de intentar reconocerlo.",
        audio=audio_key or symbol,
        xp=2,
        gradable=False,
        sound_hint=sound_hint,
        memory_hint=memory_hint,
        stroke_hint=stroke_hint,
        tags=["kana", symbol],
    )


SOUND_HINTS = {
    "あ": "Suena como la «a» de casa.", "い": "Suena como la «i» de vino.", "う": "Suena como una «u» breve, con los labios poco redondeados.", "え": "Suena como la «e» de mesa.", "お": "Suena como la «o» de sol.",
    "か": "Suena «ka».", "き": "Suena «ki».", "く": "Suena «ku».", "け": "Suena «ke».", "こ": "Suena «ko».",
    "さ": "Suena «sa».", "し": "Suena parecido a «shi».", "す": "Suena «su»; la u puede ser muy suave.", "せ": "Suena «se».", "そ": "Suena «so».",
    "た": "Suena «ta».", "ち": "Suena parecido a «chi».", "つ": "Suena parecido a «tsu».", "て": "Suena «te».", "と": "Suena «to».",
    "ん": "Es la nasal final. Su sonido cambia ligeramente según lo que sigue.", "を": "En el japonés moderno normalmente suena igual que お.",
    "っ": "No tiene un sonido aislado: crea una pausa breve antes de la consonante siguiente. Escucha きって.",
    "ー": "No tiene sonido aislado: alarga la vocal anterior. Escucha コーヒー.",
}

KATAKANA_TO_HIRAGANA = dict(zip(
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ",
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
))


def sound_hint(symbol):
    if symbol in KATAKANA_TO_HIRAGANA:
        return sound_hint(KATAKANA_TO_HIRAGANA[symbol]) + " En katakana cambia la forma escrita, no el sonido básico."
    if symbol in SOUND_HINTS:
        return SOUND_HINTS[symbol]
    voiced = {"が":"ga","ぎ":"gui","ぐ":"gu","げ":"gue","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do","ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po"}
    if symbol in voiced:
        return f"Suena aproximadamente «{voiced[symbol]}»; escucha el audio japonés."
    return f"Escucha el sonido de {symbol} y repítelo sin añadir una vocal extra."


def audio_for(symbol):
    # Estos signos solo adquieren valor sonoro dentro de una palabra.
    return {"っ": "きって", "ー": "コーヒー"}.get(symbol, symbol)


def sound_options(symbol, pool):
    correct = sound_hint(symbol)
    others = []
    for candidate in pool:
        hint = sound_hint(candidate)
        if candidate != symbol and hint != correct and hint not in others:
            others.append(hint)
    fallbacks = [
        "No representa ningún sonido.",
        "Es una consonante aislada sin vocal.",
        "Solo indica una pausa y no se pronuncia.",
    ]
    for fallback in fallbacks:
        if len(others) >= 2:
            break
        if fallback != correct and fallback not in others:
            others.append(fallback)
    return [correct, *others[:2]]


def rotated(values, offset):
    if not values:
        return values
    offset %= len(values)
    return values[offset:] + values[:offset]


def kana_family_lesson(script, index, slug, title, symbols, previously_learned=None):
    prefix = f"jp-{script}-{slug}"
    previously_learned = list(previously_learned or [])
    acts = [intro(f"{prefix}-intro", f"Aprenderás {title} paso a paso", "Verás un carácter, lo escucharás y lo practicarás antes de conocer el siguiente. Después reaparecerán algunos de los anteriores para fortalecer la memoria.")]
    learned_here = []
    for n, symbol in enumerate(symbols, 1):
        learned_here.append(symbol)
        available = [*previously_learned, *learned_here]
        acts.append(teach(f"{prefix}-teach-{n}", symbol, sound_hint(symbol), stroke_hint="Sigue la forma completa con la mirada y escúchalo varias veces antes de continuar.", audio_key=audio_for(symbol)))

        # Comprobación visual inmediata: se muestra el kana y se elige una
        # descripción del sonido, nunca otra letra como si fuera un sonido.
        descriptions = rotated(sound_options(symbol, available), n)
        acts.append(activity(
            f"{prefix}-sound-{n}", "kana_to_audio", "¿Cómo suena este kana?",
            target=symbol, options=descriptions, answer=sound_hint(symbol),
            explanation=sound_hint(symbol), audio=audio_for(symbol),
            tags=[script, symbol, "immediate_recall"],
        ))

        # Desde el segundo carácter se intercala escucha con los caracteres ya
        # enseñados. Nunca aparecen distractores que el alumno aún no conoce.
        if len(available) >= 2:
            review_target = available[-2] if n % 2 == 0 else symbol
            distractors = [value for value in reversed(available) if value != review_target][:2]
            options = rotated([review_target, *distractors], n + 1)
            acts.append(activity(
                f"{prefix}-hear-{n}", "audio_to_kana", "Escucha y elige el kana aprendido",
                target=review_target, options=options, answer=review_target,
                explanation=f"El audio completo corresponde a {review_target}.",
                audio=audio_for(review_target), tags=[script, review_target, "cumulative_recall"],
            ))

        # Cada tercera incorporación vuelve a recuperar uno anterior de esta
        # misma lección para evitar el patrón “ver todos y repasar al final”.
        if len(learned_here) >= 3:
            recall = learned_here[-3]
            recall_options = rotated(sound_options(recall, available), n + 2)
            acts.append(activity(
                f"{prefix}-spiral-{n}", "kana_to_audio", "Recuerda un kana anterior",
                target=recall, options=recall_options, answer=sound_hint(recall),
                explanation=sound_hint(recall), audio=audio_for(recall),
                tags=[script, recall, "spiral_review"],
            ))
    return {"id": f"jp-{script}-{index:02d}-{slug}", "title": title, "description": f"Aprende y practica {'・'.join(symbols)}.", "activities": acts}


def kana_review_lesson(script, index, previous_title, learned_symbols):
    """Short, deterministic interleaved review using only prior lessons."""
    prefix = f"jp-{script}-review-{index:02d}"
    rng = random.Random(f"{script}:{index}:{''.join(learned_symbols)}")
    sample_size = min(5, max(3, len(learned_symbols) // 3))
    selected = rng.sample(list(learned_symbols), sample_size)
    acts = [intro(
        f"{prefix}-intro",
        f"Repaso breve · después de {previous_title}",
        "No hay caracteres nuevos. Recupera una selección de lo estudiado en esta y en lecciones anteriores.",
    )]
    for n, symbol in enumerate(selected, 1):
        distractors = [value for value in learned_symbols if value != symbol]
        rng.shuffle(distractors)
        if n % 2 and symbol != "ー":
            options = [symbol, *distractors[:2]]
            rng.shuffle(options)
            acts.append(activity(
                f"{prefix}-hear-{n}", "audio_to_kana", "Escucha y recupera el kana",
                target=symbol, options=options, answer=symbol,
                explanation=f"El sonido corresponde a {symbol}.", audio=audio_for(symbol),
                xp=12, tags=[script, symbol, "interleaved_review"],
            ))
        else:
            options = sound_options(symbol, learned_symbols)
            rng.shuffle(options)
            acts.append(activity(
                f"{prefix}-see-{n}", "kana_to_audio", "¿Cómo suena este kana?",
                target=symbol, options=options, answer=sound_hint(symbol),
                explanation=sound_hint(symbol), audio=audio_for(symbol),
                xp=12, tags=[script, symbol, "interleaved_review"],
            ))
    return {
        "id": prefix,
        "title": f"Repaso breve {index}",
        "description": "Práctica acumulativa con una selección de kana anteriores.",
        "isReview": True,
        "activities": acts,
    }


def kana_checkpoint(script, index, title, groups):
    symbols = [symbol for group in groups for symbol in group]
    selected = symbols[:: max(1, len(symbols)//12)][:12]
    acts = [intro(f"jp-{script}-test-intro", title, "La prueba mezcla vista y escucha, pero solo contiene caracteres ya estudiados.")]
    for n, symbol in enumerate(selected, 1):
        pos = symbols.index(symbol)
        options = [symbol, symbols[(pos+3)%len(symbols)], symbols[(pos+7)%len(symbols)]]
        kind = "audio_to_kana" if n % 2 == 0 else "kana_to_audio"
        if kind == "audio_to_kana":
            acts.append(activity(f"jp-{script}-test-{n}", kind, "Escucha y elige el kana", target=symbol, options=options, answer=symbol, explanation=f"La respuesta es {symbol}.", audio=audio_for(symbol), xp=20, tags=[script,"checkpoint"]))
        else:
            descriptions = sound_options(symbol, symbols)
            acts.append(activity(f"jp-{script}-test-{n}", kind, "¿Cómo suena este kana?", target=symbol, options=descriptions, answer=sound_hint(symbol), explanation=sound_hint(symbol), audio=audio_for(symbol), xp=20, tags=[script,"checkpoint"]))
    return {"id": f"jp-{script}-{index:02d}-checkpoint", "title": title, "description": "Comprueba que reconoces los caracteres estudiados.", "isTest": True, "activities": acts}


def kana_units():
    hira_groups = [list("あいうえお"),list("かきくけこ"),list("さしすせそ"),list("たちつてと"),list("なにぬねの"),list("はひふへほ"),list("まみむめも"),list("やゆよ"),list("らりるれろ"),list("わをん")]
    hira_titles = ["Vocales","Fila K","Fila S","Fila T","Fila N","Fila H","Fila M","Fila Y","Fila R","Fila W y ん"]
    hira_specs = list(zip(hira_titles, hira_groups)) + [
        ("Dakuten: G y Z", list("がぎぐげござじずぜぞ")),
        ("Dakuten y handakuten: D, B y P", list("だぢづでどばびぶべぼぱぴぷぺぽ")),
        ("Combinaciones con ゃ・ゅ・ょ", ["きゃ","きゅ","きょ","しゃ","しゅ","しょ","ちゃ","ちゅ","ちょ"]),
        ("っ pequeña y vocal larga", ["っ","ああ","いい","うう","ええ","おお"]),
    ]
    hira, learned = [], []
    for i, (title, symbols) in enumerate(hira_specs, 1):
        hira.append(kana_family_lesson("hira", i, f"family-{i}", title, symbols, learned))
        learned.extend(symbols)
        hira.append(kana_review_lesson("hira", i, title, learned))
    hira.append(kana_checkpoint("hira", len(hira_specs) + 1, "Prueba completa de hiragana", hira_groups+[list("がぎぐげござじずぜぞ"),list("ぱぴぷぺぽ")]))
    kata_groups = [list("アイウエオ"),list("カキクケコ"),list("サシスセソ"),list("タチツテト"),list("ナニヌネノ"),list("ハヒフヘホ"),list("マミムメモ"),list("ヤユヨ"),list("ラリルレロ"),list("ワヲン")]
    kata_titles = ["Vocales","Fila K","Fila S","Fila T","Fila N","Fila H","Fila M","Fila Y","Fila R","Fila W y ン"]
    kata_specs = list(zip(kata_titles, kata_groups)) + [
        ("Dakuten y handakuten", list("ガギグゲゴザジズゼゾバビブベボパピプペポ")),
        ("Combinaciones y sonido largo", ["キャ","キュ","キョ","シャ","シュ","ショ","チャ","チュ","チョ","ー"]),
        ("Sonidos para préstamos", ["ティ","ディ","ファ","フィ","フェ","フォ","ウィ","ウェ","ウォ"]),
    ]
    kata, learned = [], []
    for i, (title, symbols) in enumerate(kata_specs, 1):
        kata.append(kana_family_lesson("kata", i, f"family-{i}", title, symbols, learned))
        learned.extend(symbols)
        kata.append(kana_review_lesson("kata", i, title, learned))
    kata.append(kana_checkpoint("kata", len(kata_specs) + 1, "Prueba completa de katakana", kata_groups+[list("ガギグゲゴ"),list("パピプペポ")]))
    return unit("hiragana-01","Hiragana","Aprende todo el silabario hiragana antes de leer vocabulario.",hira,900,"Hiragana completo"),unit("katakana","Katakana","Aprende katakana después de dominar hiragana.",kata,850,"Katakana completo")


def teaching_sequence(prefix, title, entries, kind="teach_word"):
    acts=[intro(f"{prefix}-intro",f"Primero aprende: {title}","Escucha y comprende cada elemento antes de responder.")]
    learned=[]
    for n,(target,meaning) in enumerate(entries,1):
        acts.append(activity(f"{prefix}-teach-{n}",kind,f"Aprende «{meaning}»",target=target,explanation=meaning,audio=target,xp=2,gradable=False,sound_hint=f"Significa: {meaning}",tags=[prefix]))
        learned.append((target, meaning))

        # Comprensión inmediata antes de presentar la palabra siguiente.
        other=[value for _,value in entries if value!=meaning][:2]
        acts.append(activity(f"{prefix}-quiz-{n}","word_to_translation",f"¿Qué significa {target}?",target=target,options=[meaning,*other],answer=meaning,explanation=f"{target} significa «{meaning}».",audio=target,tags=[prefix,"immediate_recall"]))

        # En palabras breves, reconstruirla obliga a mirar cada kana. Cada
        # botón reproduce su propio sonido y el control Escuchar usa siempre
        # el clip continuo de la palabra completa.
        if kind == "teach_word" and len(target) <= 5:
            kana=list(target)
            acts.append(activity(f"{prefix}-build-{n}","build_word",f"Construye «{meaning}»",target=target,options=list(reversed(kana)),answer=target,explanation=f"La palabra completa es {target}. Escúchala seguida.",audio=target,xp=15,tags=[prefix,"build_word"]))

        # Desde la segunda palabra se recupera por oído una de las ya vistas.
        if len(learned) >= 2:
            recall_target, recall_meaning = learned[-2] if n % 2 == 0 else learned[-1]
            candidates=[value for value,_ in reversed(learned) if value!=recall_target][:2]
            acts.append(activity(f"{prefix}-listen-{n}","listening_choice","Escucha y elige la palabra o frase completa",target=recall_target,options=[*candidates,recall_target],answer=recall_target,explanation=f"Escuchaste {recall_target}: {recall_meaning}.",audio=recall_target,xp=12,tags=[prefix,"cumulative_recall"]))

        # Cada tercer elemento rescata uno anterior, no únicamente el último.
        if len(learned) >= 3:
            recall_target, recall_meaning = learned[-3]
            alternatives=[value for _,value in learned if value!=recall_meaning][:2]
            acts.append(activity(f"{prefix}-spiral-{n}","word_to_translation",f"Recuerda: ¿qué significa {recall_target}?",target=recall_target,options=[*alternatives,recall_meaning],answer=recall_meaning,explanation=f"{recall_target} significa «{recall_meaning}».",audio=recall_target,xp=12,tags=[prefix,"spiral_review"]))
    return {"id":prefix,"title":title,"description":f"Aprende {len(entries)} elementos con audio y práctica.","activities":acts}


def concept_lesson(identifier,title,explanation,examples):
    acts=[intro(identifier+"-intro",title,explanation)]
    for n,(text,meaning) in enumerate(examples,1):
        acts.append(activity(f"{identifier}-model-{n}","teach_concept",f"Escucha la diferencia: {meaning}",target=text,explanation=meaning,audio=text,xp=3,gradable=False,sound_hint=meaning,tags=[identifier]))
    for n,(text,meaning) in enumerate(examples[:3],1):
        options=[text,*[item[0] for item in examples if item[0]!=text][:2]]
        acts.append(activity(f"{identifier}-listen-{n}","listening_choice","Escucha y elige la forma completa",target=text,options=options,answer=text,explanation=meaning,audio=text,xp=15,tags=[identifier,"listening"]))
    return {"id":identifier,"title":title,"description":explanation,"activities":acts}


def later_units():
    rhythm=[concept_lesson("jp-rhythm-mora","Moras y ritmo regular","Cada kana suele ocupar un pulso.",[("たまご","Tres pulsos regulares."),("さかな","Tres pulsos regulares."),("ここ","Dos pulsos.")]),concept_lesson("jp-rhythm-long","Vocales largas","Una vocal larga ocupa dos moras y puede cambiar el significado.",[("おばさん","Tía o señora."),("おばあさん","Abuela o anciana."),("ここ","Aquí."),("こうこう","Preparatoria.")]),concept_lesson("jp-rhythm-small-tsu","Consonante doble con っ","La っ pequeña crea una pausa de una mora.",[("きて","Ven / viniendo, según contexto."),("きって","Sello postal."),("さか","Cuesta."),("さっか","Escritor.")]),concept_lesson("jp-rhythm-n","La mora ん","Cuenta como una mora y se adapta al sonido siguiente.",[("ほん","Libro."),("さんぽ","Paseo."),("しんぶん","Periódico.")]),concept_lesson("jp-rhythm-particles","は・へ・を como partículas","En partículas, は suena わ, へ suena え y を normalmente suena お.",[("わたしは","En cuanto a mí…"),("がっこうへ","Hacia la escuela."),("みずを","Agua como objeto.")])]
    word_sets={"Saludos":[("おはようございます","Buenos días"),("こんにちは","Hola / buenas tardes"),("こんばんは","Buenas noches"),("ありがとうございます","Muchas gracias"),("さようなら","Adiós")],"Personas y afecto":[("わたし","yo"),("ともだち","amigo o amiga"),("あい","amor"),("せんせい","profesor"),("かぞく","familia"),("ひと","persona")],"Objetos":[("ほん","libro"),("かばん","bolsa"),("でんわ","teléfono"),("かぎ","llave"),("つくえ","escritorio")],"Casa":[("いえ","casa"),("へや","habitación"),("まど","ventana"),("いす","silla"),("おふろ","baño")],"Comida":[("みず","agua"),("ごはん","arroz o comida"),("パン","pan"),("おちゃ","té"),("さかな","pescado")],"Lugares":[("ここ","aquí"),("そこ","ahí"),("あそこ","allí"),("えき","estación"),("みせ","tienda")],"Números":[("いち","uno"),("に","dos"),("さん","tres"),("よん","cuatro"),("ご","cinco"),("ろく","seis"),("なな","siete"),("はち","ocho"),("きゅう","nueve"),("じゅう","diez")],"Hora y días":[("いま","ahora"),("きょう","hoy"),("あした","mañana"),("げつようび","lunes"),("なんじ","qué hora")]} 
    words=[teaching_sequence(f"jp-words-{i:02d}",title,entries) for i,(title,entries) in enumerate(word_sets.items(),1)]
    patterns=[("A は B です",[("わたしはアナです。","Soy Ana."),("これはほんです。","Esto es un libro.")]),("Negación con ではありません",[("せんせいではありません。","No soy profesor."),("これはみずではありません。","Esto no es agua.")]),("Preguntas con ですか",[("アナさんですか。","¿Eres Ana?"),("これはほんですか。","¿Esto es un libro?")]),("これ・それ・あれ",[("これはなんですか。","¿Qué es esto?"),("それはかばんです。","Eso es una bolsa."),("あれはえきです。","Aquello es la estación.")]),("ここ・そこ・あそこ",[("トイレはどこですか。","¿Dónde está el baño?"),("ここです。","Está aquí.")]),("の y も",[("わたしのほんです。","Es mi libro."),("わたしもがくせいです。","Yo también soy estudiante.")]),("が・を",[("ねこがいます。","Hay un gato."),("みずをのみます。","Bebo agua.")]),("に・で・へ・と",[("がっこうにいきます。","Voy a la escuela."),("うちでたべます。","Como en casa."),("ともだちとはなします。","Hablo con un amigo.")])]
    sentences=[]
    for i,(title,examples) in enumerate(patterns,1):
        acts=[intro(f"jp-sentence-{i}-intro",title,"Observa primero la función y después completa ejercicios."),activity(f"jp-sentence-{i}-pattern","teach_pattern",title,target=title,explanation="Estudia el patrón dentro de ejemplos completos.",xp=3,gradable=False)]
        for n,(text,meaning) in enumerate(examples,1):acts.append(activity(f"jp-sentence-{i}-model-{n}","dialogue_model",meaning,target=text,explanation=meaning,audio=text,xp=3,gradable=False))
        text,meaning=examples[0]; acts.append(activity(f"jp-sentence-{i}-quiz","select_translation",f"¿Qué significa {text}?",target=text,options=[meaning,"No corresponde al ejemplo.","Expresa tiempo pasado."],answer=meaning,explanation=meaning,audio=text,xp=15))
        sentences.append({"id":f"jp-sentence-{i:02d}","title":title,"description":"Aprende el patrón dentro de oraciones comprensibles.","activities":acts})
    verbs=[teaching_sequence("jp-verbs-core","Diez verbos esenciales",[("たべます","comer"),("のみます","beber"),("いきます","ir"),("きます","venir"),("みます","ver"),("よみます","leer"),("かきます","escribir"),("はなします","hablar"),("ききます","escuchar o preguntar"),("かいます","comprar")]),concept_lesson("jp-verbs-present","Presente afirmativo y negativo","La forma ます es cortés; ません forma el negativo.",[("たべます","Como / comeré."),("たべません","No como / no comeré."),("いきます","Voy / iré.")]),concept_lesson("jp-verbs-past","Pasado afirmativo y negativo","ました marca pasado afirmativo; ませんでした, pasado negativo.",[("たべました","Comí."),("たべませんでした","No comí."),("いきました","Fui.")])]
    adjectives=[teaching_sequence("jp-adj-i","Adjetivos い",[("おおきい","grande"),("ちいさい","pequeño"),("あたらしい","nuevo"),("おいしい","delicioso"),("さむい","frío")]),teaching_sequence("jp-adj-na","Adjetivos な",[("しずか","tranquilo"),("げんき","bien o animado"),("きれい","bonito o limpio"),("すき","gustar"),("べんり","práctico")]),teaching_sequence("jp-colors","Colores",[("あか","rojo"),("あお","azul"),("しろ","blanco"),("くろ","negro"),("みどり","verde")]),concept_lesson("jp-adj-sentences","Describir cosas","Los adjetivos い van directamente antes del sustantivo; los な usan な.",[("おおきいいえです。","Es una casa grande."),("しずかなまちです。","Es una ciudad tranquila."),("あおがすきです。","Me gusta el azul.")])]
    functional_sets={"Presentarse":[("はじめまして。","Mucho gusto."),("わたしはアナです。","Soy Ana."),("メキシコからきました。","Vengo de México.")],"Comprar":[("これはいくらですか。","¿Cuánto cuesta esto?"),("これをください。","Déme esto, por favor."),("カードはつかえますか。","¿Puedo usar tarjeta?")],"Pedir comida":[("これをおねがいします。","Esto, por favor."),("みずをください。","Agua, por favor."),("おいしいです。","Está delicioso.")],"Decir la hora":[("いまなんじですか。","¿Qué hora es?"),("さんじです。","Son las tres."),("しちじはんです。","Son las siete y media.")],"Pedir dirección":[("えきはどこですか。","¿Dónde está la estación?"),("みぎです。","Está a la derecha."),("まっすぐいってください。","Siga derecho, por favor.")],"Pedir repetición":[("もういちどおねがいします。","Otra vez, por favor."),("ゆっくりはなしてください。","Hable despacio, por favor."),("わかりません。","No entiendo.")],"Gustos y deseos":[("すしがすきです。","Me gusta el sushi."),("みずがほしいです。","Quiero agua."),("にほんにいきたいです。","Quiero ir a Japón.")]} 
    functional=[teaching_sequence(f"jp-functional-{i:02d}",title,entries,"dialogue_model") for i,(title,entries) in enumerate(functional_sets.items(),1)]
    kanji_groups={"Números":[("一","uno · いち"),("二","dos · に"),("三","tres · さん"),("四","cuatro · よん"),("五","cinco · ご"),("六","seis · ろく"),("七","siete · なな"),("八","ocho · はち"),("九","nueve · きゅう"),("十","diez · じゅう")],"Tiempo":[("日","día / sol · にち"),("月","mes / luna · つき"),("火","fuego · ひ"),("水","agua · みず"),("木","árbol · き"),("金","dinero / oro · かね"),("土","tierra · つち")],"Personas":[("人","persona · ひと"),("男","hombre · おとこ"),("女","mujer · おんな"),("子","niño · こ"),("友","amigo · とも")],"Direcciones":[("上","arriba · うえ"),("下","abajo · した"),("中","dentro · なか"),("外","fuera · そと"),("左","izquierda · ひだり"),("右","derecha · みぎ")],"Naturaleza":[("山","montaña · やま"),("川","río · かわ"),("田","campo de arroz · た"),("天","cielo · てん"),("気","energía / ánimo · き")],"Vida diaria":[("本","libro · ほん"),("学","estudio · がく"),("校","escuela · こう"),("先","anterior · せん"),("生","vida / nacer · せい"),("時","hora · じ"),("分","minuto · ふん"),("半","mitad · はん"),("食","comer · た"),("飲","beber · の")]} 
    kanji=[]
    for i,(title,entries) in enumerate(kanji_groups.items(),1):
        acts=[intro(f"jp-kanji-{i}-intro",title,"Aprende una lectura útil dentro de una palabra; no memorices todas las lecturas posibles.")]
        for n,(char,meaning) in enumerate(entries,1):acts.append(activity(f"jp-kanji-{i}-teach-{n}","teach_kanji",f"Conoce {char}",target=char,explanation=meaning,audio=meaning.split("·")[-1].strip(),xp=3,gradable=False,sound_hint=meaning,stroke_hint="Observa la forma completa; la práctica de trazos se añadirá como SVG."))
        for n,(char,meaning) in enumerate(entries[:4],1):
            opts=[char,*[c for c,_ in entries if c!=char][:2]];acts.append(activity(f"jp-kanji-{i}-quiz-{n}","kana_choice",f"Elige el kanji de «{meaning.split('·')[0].strip()}»",target=char,options=opts,answer=char,explanation=meaning,xp=15))
        kanji.append({"id":f"jp-kanji-{i:02d}","title":title,"description":"Kanji dentro de vocabulario útil.","activities":acts})
    dialogues=[concept_lesson("jp-bridge-intro","Presentación breve","Escucha primero el diálogo completo y luego comprueba ideas principales.",[("はじめまして。わたしはアナです。メキシコからきました。よろしくおねがいします。","Ana se presenta y dice de dónde viene.")]),concept_lesson("jp-bridge-shop","En una tienda","Comprende una compra sencilla.",[("これはいくらですか。ごひゃくえんです。これをください。","Pregunta el precio y compra el objeto.")]),concept_lesson("jp-bridge-restaurant","En un restaurante","Sigue un pedido breve.",[("すみません。これをおねがいします。みずもください。","Pide un plato y también agua.")]),concept_lesson("jp-bridge-directions","Buscar la estación","Reconoce una pregunta y una indicación.",[("えきはどこですか。まっすぐいって、みぎです。","La estación está derecho y a la derecha.")]),concept_lesson("jp-bridge-reading","Primera lectura guiada","Lee un párrafo corto con audio completo.",[("きょうはげつようびです。あさ、がっこうにいきます。ともだちとはなします。","Hoy es lunes; la persona va a la escuela y habla con un amigo.")])]
    return [unit("rhythm","Ritmo y pronunciación","Aprende moras, duración y pausas antes del vocabulario.",rhythm,350,"Oído japonés"),unit("first-words","Primeras palabras","Tu primer vocabulario aparece solo después de Hiragana, Katakana y ritmo.",words,500,"Primer vocabulario"),unit("first-sentences","Primeras oraciones","Construye estructuras y partículas esenciales.",sentences,550,"Primeras oraciones"),unit("basic-verbs","Verbos básicos","Comprende los verbos frecuentes y cuatro formas corteses.",verbs,400,"Acciones A1"),unit("adjectives","Adjetivos y descripción","Describe objetos, lugares, gustos y estados.",adjectives,350,"Descripción A1"),unit("functional-a1","Japonés funcional A1","Resuelve situaciones cotidianas con expresiones completas.",functional,500,"Supervivencia A1"),unit("starter-kanji","Kanji inicial","Aprende 50 kanji con una lectura útil inicial.",kanji,600,"50 kanji"),unit("story-bridge","Puente hacia las historias","Integra lectura, escucha y comprensión sin rōmaji.",dialogues,500,"Listo para historias")]


def unit(identifier,title,description,lessons,xp,badge):
    return {"id":identifier,"title":title,"description":description,"requirements":[],"reward":{"xp":xp,"badge":badge},"lessons":lessons}


def build():
    hiragana, katakana = kana_units()
    units=[hiragana,katakana,*later_units()]
    summaries=[
        ("hiragana-01",1,"Hiragana","Domina el silabario hiragana completo.","あ"),("katakana",2,"Katakana","Domina katakana y combinaciones para préstamos.","ア"),("rhythm",3,"Ritmo y pronunciación","Moras, duración, っ y ん.","♪"),("first-words",4,"Primeras palabras","Vocabulario que ya puedes leer.","言"),("first-sentences",5,"Primeras oraciones","Estructuras y partículas iniciales.","文"),("basic-verbs",6,"Verbos básicos","Acciones y formas corteses.","動"),("adjectives",7,"Adjetivos y descripción","Cualidades, colores y gustos.","形"),("functional-a1",8,"Japonés funcional A1","Situaciones cotidianas.","会"),("starter-kanji",9,"Kanji inicial","50 kanji dentro de palabras.","日"),("story-bridge",10,"Puente hacia las historias","Diálogos y lecturas breves.","本")]
    course={"courseId":"japanese-from-zero","title":"Japonés desde cero","language":"Japanese","version":3,"levels":[{"id":"route-a1","title":"Ruta 1 · Preparación para historias A1"},{"id":"route-a2","title":"Ruta 2 · Consolidación A1 y preparación A2","comingSoon":True}],"unlockRules":{"minimumScore":70,"masteryScore":90},"recommendedBooks":[],"units":[{"id":i,"world":w,"title":t,"description":d,"manifest":f"units/{i}.json","icon":icon} for i,w,t,d,icon in summaries]}
    UNITS.mkdir(parents=True,exist_ok=True)
    (ROOT/"course.json").write_text(json.dumps(course,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    for item in units:(UNITS/f"{item['id']}.json").write_text(json.dumps(item,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Curso generado: {len(units)} mundos, {sum(len(item['lessons']) for item in units)} lecciones")


if __name__=="__main__":build()

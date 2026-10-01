from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
CODE = "HG-AOUAD-S1"
BOOK = WEB / "library" / "books" / CODE


def P(de: str, es: str):
    return {"de": de, "es": es}


def V(de: str, es: str):
    return {"de": de, "es": es}


def E(title: str, summary: str, phrases: list[dict], vocabulary: list[dict]):
    return {"title": title, "summary": summary, "p": phrases, "v": vocabulary}


# Curated study selections from the German WEBTOON edition.  This is not a
# transcript: each chapter keeps only useful, short dialogue excerpts.
EPISODES = [
    E("Der Geruch des Lehrers", "Ein Gerücht über einen merkwürdigen Geruch lenkt den Unterricht ab.", [
        P("Ja, es stimmt.", "Sí, es verdad."), P("Gibt es denn gar keine Hoffnung?", "¿Es que no hay ninguna esperanza?"),
        P("Nein ... wir werden alle sterben ...", "No... todos vamos a morir..."), P("Das ist nicht das, was wir hören wollten.", "Eso no es lo que queríamos oír."),
        P("Ich übergebe mich gleich!", "¡Voy a vomitar enseguida!"), P("Meine Güte, ich falle noch in Ohnmacht, bevor ich überhaupt in die Klasse komme.", "Dios mío, me voy a desmayar antes siquiera de llegar al salón."),
        P("Hey, Mister, ich habe dir gesagt, dass du mich in Ruhe lassen sollst.", "Oye, señor, te dije que me dejaras en paz."), P("Du hast dir deine Haare nicht gewaschen, oder?", "No te has lavado el pelo, ¿verdad?"),
        P("Alles klar, der Unterricht ist beendet!", "Muy bien, ¡la clase ha terminado!"), P("Was war das für ein Geruch? Das war eklig!", "¿Qué olor era ese? ¡Qué asco!"),
        P("Der Naturwissenschaftslehrer hat schon immer schlecht gerochen, aber heute war das ein neuer Tiefpunkt!", "El profesor de ciencias siempre ha olido mal, pero hoy ha sido un nuevo punto bajo."), P("Oh, sei ein wenig nachsichtig mit ihm.", "Oh, ten un poco de consideración con él."),
    ], [V("die Hoffnung", "la esperanza"), V("in Ohnmacht fallen", "desmayarse"), V("jemanden in Ruhe lassen", "dejar a alguien en paz"), V("der Unterricht", "la clase / la lección"), V("beendet", "terminado"), V("der Geruch", "el olor"), V("eklig", "asqueroso"), V("nachsichtig sein", "ser indulgente / considerado")]),
    E("Das Gerücht", "Los alumnos relacionan el olor del profesor con rumores cada vez más inquietantes.", [
        P("Ich bin sicher, er hat seine Gründe!", "¡Estoy seguro de que tiene sus motivos!"), P("Namra, du bist ein echter Engel, weißt du das?", "Namra, eres un verdadero ángel, ¿lo sabías?"),
        P("Du bist meine Traumfrau!", "¡Eres la mujer de mis sueños!"), P("Willst du ein neues Gerücht über das Muttermal hören?", "¿Quieres oír un nuevo rumor sobre el lunar?"),
        P("Du weißt doch, dass er schlimmer riecht, seitdem er von seinem Urlaub wiedergekommen ist?", "Sabes que huele peor desde que volvió de sus vacaciones, ¿no?"), P("Weißt du, dass er gegangen ist, weil seine Frau und sein Sohn verschwunden sind?", "¿Sabes que se fue porque su esposa y su hijo desaparecieron?"),
        P("Das weiß doch jeder. Was hat das damit zu tun?", "Eso lo sabe todo el mundo. ¿Qué tiene que ver eso?"), P("Flipp nicht aus, aber ... anscheinend ist das Muttermal ein Kannibale!", "No te alteres, pero... ¡al parecer el lunar es un caníbal!"),
        P("Vielleicht hast du dir das gerade ausgedacht?", "¿Quizá te lo acabas de inventar?"), P("Aber ob du es glaubst oder nicht, ich weiß, dass du ein Idiot bist!", "Pero lo creas o no, sé que eres un idiota."),
        P("Du bist so langweilig.", "Eres tan aburrido."), P("Aber dieses Gerücht über unseren Naturwissenschaftslehrer ... ist es wahr?", "Pero ese rumor sobre nuestro profesor de ciencias... ¿es verdad?"),
    ], [V("der Engel", "el ángel"), V("die Traumfrau", "la mujer ideal / de los sueños"), V("das Gerücht", "el rumor"), V("das Muttermal", "el lunar"), V("anscheinend", "aparentemente"), V("sich etwas ausdenken", "inventarse algo"), V("langweilig", "aburrido"), V("ob ... oder nicht", "lo ... o no")]),
    E("Die Krankenschwester", "Una alumna pide ayuda y cuenta que el profesor la encerró en el club.", [
        P("Er hat mich zwei Tage lang im Klubzimmer eingesperrt.", "Me encerró durante dos días en el salón del club."), P("Oh mein Gott ... ist das wahr?", "Dios mío... ¿es verdad?"),
        P("Es gibt hier zu viele Leute, die mithören.", "Aquí hay demasiada gente escuchando."), P("Könntest du mir den Rest im Sprechzimmer der Krankenschwester erzählen?", "¿Podrías contarme el resto en el consultorio de la enfermera?"),
        P("Ich will hier bleiben!", "¡Quiero quedarme aquí!"), P("Was, wenn ich draußen Herrn Lee wieder begegne?", "¿Y si vuelvo a encontrarme con el señor Lee afuera?"),
        P("Na gut ... ich verstehe.", "Está bien... entiendo."), P("Bist du verletzt?", "¿Estás herida?"),
        P("Mein Körper ... er fühlt sich so heiß an ...", "Mi cuerpo... se siente tan caliente..."), P("Er bewegt sich nicht so, wie ich es will ...", "No se mueve como quiero..."),
        P("Halt noch ein wenig länger durch, die Krankenschwester ist auf dem Weg.", "Aguanta un poco más; la enfermera está en camino."), P("Gerüchte kommen nicht einfach so aus dem Nirgendwo her.", "Los rumores no salen de la nada sin más."),
    ], [V("jemanden einsperren", "encerrar a alguien"), V("mithören", "escuchar a escondidas"), V("das Sprechzimmer", "el consultorio"), V("begegnen", "encontrarse con"), V("verletzt", "herido"), V("sich heiß anfühlen", "sentirse caliente"), V("sich bewegen", "moverse"), V("durchhalten", "aguantar / resistir")]),
    E("Die Wahrheit", "El grupo intenta mantener a salvo a Hyeonju mientras descubre qué ocurrió en el laboratorio.", [
        P("Hyeonju, komm auf meinen Rücken!!!", "¡Hyeonju, súbete a mi espalda!"), P("Kennst du das Whiteboard in unserem Klassenzimmer?", "¿Conoces la pizarra blanca de nuestro salón?"),
        P("Würdest du mir das bringen?", "¿Podrías traerme eso?"), P("Und wenn man einen Tropfen Wasser hinzufügt ...", "Y si se añade una gota de agua..."),
        P("Eine Reaktion auslösen.", "Provocar una reacción."), P("Sie ist in schlechter Verfassung.", "Está en mal estado."),
        P("Wir müssen einen Krankenwagen rufen.", "Tenemos que llamar a una ambulancia."), P("Bis der Krankenwagen kommt, müssen Sie weiterhin mit ihr reden, damit sie nicht das Bewusstsein verliert!", "¡Hasta que llegue la ambulancia, siga hablando con ella para que no pierda el conocimiento!"),
        P("Glaubst du, dass du mir sagen könntest, was passiert ist?", "¿Crees que podrías decirme qué pasó?"), P("Allmählich hat sie angefangen, zu reden.", "Poco a poco empezó a hablar."),
        P("Ich wollte nur etwas holen und dann gehen!", "¡Solo quería recoger algo y después irme!"), P("Ich habe das Schloss geknackt.", "Forcé la cerradura."),
    ], [V("auf den Rücken kommen", "subirse a la espalda"), V("das Whiteboard", "la pizarra blanca"), V("hinzufügen", "añadir"), V("die Reaktion", "la reacción"), V("in schlechter Verfassung", "en mal estado"), V("der Krankenwagen", "la ambulancia"), V("das Bewusstsein verlieren", "perder el conocimiento"), V("ein Schloss knacken", "forzar una cerradura")]),
    E("Das Labor", "La explicación de Hyeonju revela una entrada no autorizada y unos hámsteres inquietantes.", [
        P("Während ich Hausaufgaben machen war, musste ich etwas holen gehen.", "Mientras estaba haciendo la tarea, tuve que ir a buscar algo."), P("Ich weiß, ich hätte es nicht tun sollen, aber ...", "Lo sé, no debí hacerlo, pero..."),
        P("Ich bin in Herrn Lees Labor gegangen.", "Entré al laboratorio del señor Lee."), P("Ich hatte nur vor, das zu holen, was ich brauchte, und dann zu gehen!", "Solo pensaba recoger lo que necesitaba y después irme."),
        P("Aber ich bemerkte, dass da eine Menge Hamster waren ...", "Pero noté que había un montón de hámsteres..."), P("Wenn ihr weiterhin eure schwächeren Freunde ärgert, werdet ihr im nächsten Leben schwache Hamster sein.", "Si siguen molestando a sus amigos más débiles, en la próxima vida serán hámsteres débiles."),
        P("Verdammt!", "¡Maldita sea!"), P("Uff! Ich hätte sie nicht anfassen sollen.", "¡Uf! No debí tocarlos."),
        P("Du ... wie bist du hier reingekommen?", "Tú... ¿cómo entraste aquí?"), P("Dann kam Herr Lee rein.", "Entonces entró el señor Lee."),
        P("Ich war überrascht, aber ich hätte nicht gedacht, dass ich so viel Ärger bekommen würde.", "Me sorprendí, pero no pensé que me metería en tantos problemas."), P("Ich habe dich gefragt, wie du hier reingekommen bist!!!", "¡¡¡Te pregunté cómo entraste aquí!!!"),
    ], [V("Hausaufgaben machen", "hacer la tarea"), V("das Labor", "el laboratorio"), V("etwas holen", "ir a buscar algo"), V("eine Menge", "un montón / una gran cantidad"), V("der Hamster", "el hámster"), V("jemanden ärgern", "molestar a alguien"), V("anfassen", "tocar"), V("Ärger bekommen", "meterse en problemas")]),
    E("Gefesselt", "Hyeonju describe el encierro, las ataduras y las extracciones de sangre.", [
        P("Wieso kommst du ohne Erlaubnis rein, hmm?", "¿Por qué entras sin permiso, eh?"), P("Es tut mir leid ...", "Lo siento..."),
        P("Einer Ihrer Hamster hat mich gebissen.", "Uno de sus hámsteres me mordió."), P("Haben Sie zufällig ein Pflaster?", "¿Por casualidad tiene una curita?"),
        P("Und so hat er mich zwei Tage lang in diesen Raum eingesperrt ...", "Y así fue como me encerró durante dos días en esta habitación..."), P("Hat er überhaupt versucht, dich anzufassen?", "¿Acaso intentó tocarte?"),
        P("Er hat mich mit einem Seil gefesselt ...", "Me ató con una cuerda..."), P("Er hat nie ein Wort gesagt ...", "Nunca dijo una palabra..."),
        P("Es schien so, als ob er mich zurück nach draußen mitnehmen wollte.", "Parecía que quería llevarme de vuelta afuera."), P("Jedes Mal, wenn er reingekommen ist, hat er auf seine Uhr gesehen.", "Cada vez que entraba, miraba su reloj."),
        P("Eine Spritze benutzt, um mir viermal Blut abzunehmen ...", "Usó una jeringa para sacarme sangre cuatro veces..."), P("Warum sollte Herr Lee so etwas tun?", "¿Por qué haría el señor Lee algo así?"),
    ], [V("ohne Erlaubnis", "sin permiso"), V("gebissen werden", "ser mordido"), V("das Pflaster", "la curita / el apósito"), V("gefesselt sein", "estar atado"), V("das Seil", "la cuerda"), V("es schien, als ob", "parecía que"), V("die Spritze", "la jeringa"), V("Blut abnehmen", "sacar sangre")]),
    E("Der Krankenwagen", "La mordida provoca pánico mientras la escuela intenta avisar a la familia.", [
        P("Sie hat mich gebissen ...", "Me mordió..."), P("Sie hat dich gebissen?! Ist alles in Ordnung?", "¿Te mordió? ¿Está todo bien?"),
        P("Es ist nichts allzu Ernstes ...", "No es nada demasiado grave..."), P("Keine große Sache!", "¡No es gran cosa!"),
        P("Ich bin sicher, dass es im Nu abheilen wird.", "Estoy seguro de que sanará en un instante."), P("Sobald ich es desinfiziere.", "En cuanto lo desinfecte."),
        P("Hyeonju hat das wahrscheinlich getan, weil sie im Schockzustand ist.", "Probablemente Hyeonju hizo eso porque está en estado de shock."), P("Der Krankenwagen wird bald da sein!", "¡La ambulancia llegará pronto!"),
        P("Hyeonju, halte durch ... nur noch ein wenig länger!!!", "Hyeonju, aguanta... ¡solo un poco más!"), P("Bitte informieren Sie Hyeonjus Eltern!", "¡Por favor, informe a los padres de Hyeonju!"),
        P("Bitte passen Sie auf Hyeonju auf!!!", "¡¡¡Por favor, cuide a Hyeonju!!!"), P("Ich werde sie anrufen, wenn wir im Krankenhaus sind!", "¡La llamaré cuando estemos en el hospital!"),
    ], [V("allzu ernst", "demasiado grave"), V("im Nu", "en un instante"), V("abheilen", "sanar"), V("desinfizieren", "desinfectar"), V("im Schockzustand", "en estado de shock"), V("bald", "pronto"), V("durchhalten", "aguantar"), V("auf jemanden aufpassen", "cuidar a alguien")]),
    E("Der stille Flur", "La policía llega a la escuela y el director confronta al profesor Lee.", [
        P("Hallo, Herr Direktor!!!", "¡¡¡Hola, director!!!"), P("Unterrichtet Herr Lee seine Klasse immer noch?", "¿El señor Lee todavía da clase a su grupo?"),
        P("Ja, er ist immer noch da drin!", "Sí, todavía está ahí dentro."), P("In fünf Minuten ist Pause, darum wird er bald rauskommen.", "En cinco minutos es el recreo, por eso saldrá pronto."),
        P("Du Schlingel, warum grüßt du mich nicht, hmm?", "Pequeño travieso, ¿por qué no me saludas, eh?"), P("Mir ist heute Morgen etwas Dringendes dazwischengekommen.", "Esta mañana me surgió algo urgente."),
        P("Haben Sie vorhin den Krankenwagen vorne gesehen?", "¿Vio antes la ambulancia al frente?"), P("War ich der Einzige, der ihn gesehen hat?", "¿Fui el único que la vio?"),
        P("Kann ich einen Moment lang mit Ihnen reden?", "¿Puedo hablar un momento con usted?"), P("Herr Lee ... ich glaube, wir müssen reden.", "Señor Lee... creo que tenemos que hablar."),
        P("Wo ist sie? Wo hält sich dieses Mädchen jetzt gerade auf?!", "¿Dónde está? ¿Dónde se encuentra ahora esa chica?"), P("Verstehen Sie nicht, in was für einer Lage Sie sich jetzt befinden?", "¿No entiende en qué situación se encuentra ahora?"),
    ], [V("der Direktor", "el director"), V("Unterricht geben", "dar clase"), V("da drin", "ahí dentro"), V("die Pause", "el recreo / descanso"), V("der Schlingel", "el travieso"), V("dazwischenkommen", "surgir / interponerse"), V("vorhin", "hace un momento / antes"), V("sich aufhalten", "encontrarse / estar en un lugar")]),
    E("Die Wahrheit kommt heraus", "Los rumores se extienden mientras los alumnos oyen que algo ocurre en el pasillo.", [
        P("Wir stecken in großen Schwierigkeiten!!", "¡¡Estamos en grandes problemas!!"), P("Haerang hat auf dem Weg zur Schule den Krankenwagen gesehen!", "¡Haerang vio la ambulancia de camino a la escuela!"),
        P("Werden sich die Gerüchte jetzt nicht allmählich verbreiten?", "¿No se extenderán ahora poco a poco los rumores?"), P("Es ist nicht so, als wäre das unsere Schuld!", "¡No es como si fuera culpa nuestra!"),
        P("Wir waren so still wie die Mäuse.", "Estuvimos tan callados como ratones."), P("Wir haben nur das gemacht, was wir mussten.", "Solo hicimos lo que teníamos que hacer."),
        P("Das Entscheidende ist, dass jeder über Hyeonju redet!", "¡Lo decisivo es que todos hablan de Hyeonju!"), P("Irgendwas geschieht auf dem Flur!!!", "¡¡¡Algo está ocurriendo en el pasillo!!!"),
        P("Es sieht so aus, als ob ein paar Lehrer miteinander kämpfen.", "Parece que algunos profesores están peleando entre sí."), P("Was meinst du mit, dabei zusehen?", "¿Qué quieres decir con mirar cómo ocurre?"),
        P("Dort drüben ist es wirklich krass!", "¡Allá es realmente intenso!"), P("Es ist die Wahrheit!!!", "¡¡¡Es la verdad!!!"),
    ], [V("in Schwierigkeiten stecken", "estar en problemas"), V("auf dem Weg", "de camino"), V("sich verbreiten", "extenderse"), V("als ob", "como si"), V("die Schuld", "la culpa"), V("entscheidend", "decisivo"), V("der Flur", "el pasillo"), V("miteinander kämpfen", "pelear entre sí")]),
    E("Das Wiedersehen", "La policía investiga el caso de Hyeonju y relaciona la desaparición con el profesor Lee.", [
        P("Was macht er hier?", "¿Qué hace él aquí?"), P("Ich habe ihn angerufen.", "Lo llamé."), P("Was?! Wieso?!", "¿Qué? ¿Por qué?"),
        P("Alles, was sie tun musste, war, sich im Krankenhaus behandeln zu lassen!", "¡Lo único que tenía que hacer era recibir tratamiento en el hospital!"), P("Ziehen Sie die Polizei mit rein?", "¿Está metiendo a la policía en esto?"),
        P("Was haben Sie dieses Mal verbrochen?", "¿Qué ha hecho esta vez?"), P("Behandeln Sie mich nicht wie einen Kriminellen!", "¡No me trate como a un criminal!"),
        P("Wieso setzen Sie sich nicht erst mal hin?", "¿Por qué no se sienta primero?"), P("Ich bin Kommissar Jeongwook Lee vom südlichen Polizeidezernat!", "¡Soy el comisario Jeongwook Lee del distrito policial del sur!"),
        P("Ich setze mich neben Ihnen hin, wenn das in Ordnung ist!", "¡Me sentaré junto a usted, si está bien!"), P("Er hat eine Schülerin gefangen gehalten.", "Mantuvo encerrada a una alumna."),
        P("Scheint das etwas mit dem vorherigen Fall zu tun zu haben?", "¿Parece que eso tiene algo que ver con el caso anterior?"),
    ], [V("jemanden anrufen", "llamar a alguien"), V("sich behandeln lassen", "recibir tratamiento"), V("die Polizei mit hineinziehen", "involucrar a la policía"), V("etwas verbrechen", "cometer algo / hacer una fechoría"), V("der Kriminelle", "el criminal"), V("der Kommissar", "el comisario"), V("gefangen halten", "mantener encerrado"), V("mit etwas zu tun haben", "tener que ver con algo")]),
]

# The first two blocks are both part of chapter 1 in the nine-chapter German
# edition. Keep that lesson substantial without turning it into a transcript.
EPISODES = [E("Der Geruch und das Gerücht", "El primer capítulo presenta el olor extraño del profesor y el rumor que empieza a circular.", EPISODES[0]["p"] + EPISODES[1]["p"][:8], EPISODES[0]["v"] + EPISODES[1]["v"][:4])] + EPISODES[2:]


def make_tracks():
    tracks, lessons = [], []
    word_no = 1
    for lesson, episode in enumerate(EPISODES, 1):
        ids = []
        for sequence, item in enumerate(episode["p"], 1):
            tid = f"HGAouadS1{lesson:02d}{sequence:02d}"; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": sequence, "speaker": "", "text": item["de"], "translation": item["es"], "tts_fallback": True, "section": "scene", "type": "phrase", "language": "German", "difficulty": "A2", "source_episode": lesson})
        for sequence, item in enumerate(episode["v"], len(episode["p"]) + 1):
            tid = f"HGAouadS1W{word_no:03d}"; word_no += 1; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": sequence, "speaker": "", "text": item["de"], "translation": item["es"], "tts_fallback": True, "section": "vocabulary", "type": "word", "language": "German", "difficulty": "A2", "source_episode": lesson})
        lessons.append({"number": lesson, "title": f"Lección {lesson:02d} — {episode['title']}", "track_ids": ids})
    return tracks, lessons


def write_support_files(tracks):
    BOOK.mkdir(parents=True, exist_ok=True)
    with (BOOK / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh); writer.writerow(["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        for t in tracks: writer.writerow([t["id"], t["type"], t["speaker"], t["text"], t["translation"]])
    (BOOK / "Audios_Tecnico.txt").write_text("# HanStory HG-AOUAD-S1 — especificación de audio\n\nVoz alemana del sistema, con respaldo TTS del navegador.\n", encoding="utf-8")
    parts = ["<!doctype html><html lang='es'><head><meta charset='utf-8'><title>All of Us Are Dead — Deutsch</title><style>body{font-family:system-ui;line-height:1.6;max-width:900px;margin:auto;padding:30px;background:#f7fbff}.box{padding:16px;margin:18px 0;border:1px solid #d7e4ee;border-radius:12px}.de{font-size:1.1em}.es{color:#555}</style></head><body>", "<h1>All of Us Are Dead — Deutsch · Kapitel 1–9</h1><p>Selección pedagógica amplia de la edición alemana. No es una transcripción íntegra.</p>"]
    for n, episode in enumerate(EPISODES, 1):
        parts.append(f"<section class='box'><h2>Lección {n:02d} — {escape(episode['title'])}</h2><p>{escape(episode['summary'])}</p><h3>Frases</h3>")
        for p in episode["p"]: parts.append(f"<p><span class='de' lang='de'>{escape(p['de'])}</span><br><span class='es'>{escape(p['es'])}</span></p>")
        parts.append("<h3>Vocabulario</h3>")
        for v in episode["v"]: parts.append(f"<p><b lang='de'>{escape(v['de'])}</b><br><span class='es'>{escape(v['es'])}</span></p>")
        parts.append("</section>")
    (BOOK / "book.html").write_text("".join(parts) + "</body></html>", encoding="utf-8")


def update_library():
    path = WEB / "library" / "library.json"; data = json.loads(path.read_text(encoding="utf-8"))
    data["books"] = [b for b in data["books"] if b.get("code") != CODE]
    data["books"].append({"code": CODE, "title": "All of Us Are Dead — Deutsch · Kapitel 1–9", "display_order": 0, "type": "Libro", "series": "HanStory", "target_language": "German", "explanation_language": "Spanish", "visibility": "public", "version": "1.0.0", "cover": "", "manifest": f"books/{CODE}/hanstory_manifest.json", "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")})
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    tracks, lessons = make_tracks(); write_support_files(tracks)
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {"schema_version": 1, "project_code": CODE, "title": "All of Us Are Dead — Deutsch · Kapitel 1–9", "subtitle": "Horror escolar · 9 capítulos", "description": "Selección pedagógica amplia de frases alemanas de los capítulos 1 a 9, con traducciones españolas, vocabulario y explicaciones palabra por palabra.", "version": "1.0.0", "source_language": "German", "target_language": "German", "explanation_language": "Spanish", "audio_mode": "browser-tts", "total_lessons": len(EPISODES), "total_tracks": len(tracks), "cover": "", "available_playback_modes": ["Frases"], "lessons": lessons, "tracks": tracks, "technical_order_source": "Audio_Master.csv + Audios_Tecnico.txt", "published_at": now, "updated_at": now, "source_title": "All of Us Are Dead", "source_url": "https://www.webtoons.com/de/horror/all-of-us-are-dead/list?title_no=3827", "source_scope": "Capítulos 1–9; selección amplia para estudio, no transcripción íntegra."}
    (BOOK / "hanstory_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BOOK / "PUBLISH_REPORT.txt").write_text(f"HanStory Web — PAQUETE CREADO\nCódigo: {CODE}\nTítulo: {manifest['title']}\n\nLecciones: {len(EPISODES)}\nPistas: {len(tracks)} ({sum(len(e['p']) for e in EPISODES)} frases + {sum(len(e['v']) for e in EPISODES)} entradas de vocabulario)\nFuente: WEBTOON, edición alemana, capítulos 1–9.\nEdición: selección amplia para estudio; no reproduce la transcripción completa.\n\nQA de contenido:\n- El OCR se utilizó únicamente como borrador.\n- Se revisaron visualmente muestras en capítulos inicial, intermedio y final y se corrigieron signos, umlauts y formas separables.\n- Se incluyen explicaciones palabra por palabra y notas gramaticales para todas las pistas.\n", encoding="utf-8")
    (BOOK / "Web_Explanations_Report.txt").write_text("Pendiente de generar el desglose palabra por palabra y las notas gramaticales.\n", encoding="utf-8")
    update_library(); print(json.dumps({"code": CODE, "lessons": len(EPISODES), "tracks": len(tracks), "book": str(BOOK)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

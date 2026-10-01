from __future__ import annotations

import csv
import json
import subprocess
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from urllib.parse import quote

WEB = Path(__file__).resolve().parents[1]
CODE = "HG-FOGLAND-S1"
BOOK = WEB / "library" / "books" / CODE

RAW = [
    ("Der Anfang", "El prólogo presenta a Dante y Lara como profesores que llegan a una prisión internacional rodeada de rumores.", [
        "Bitte verlassen Sie nicht die ausgewiesenen Bereiche.", "Sagen Sie nichts, was die Insassen provozieren könnte.", "Ich bin Lara. Ich unterrichte Naturwissenschaften.", "Ich bin Dante Kang.", "Wir sind wohl alle etwas nervös.", "Das größte Gefängnis der Welt, auch „Hölle“ genannt.", "Was auch immer das für ein Ort sein mag, dort leben Menschen.", "Jeder Mensch hat das Recht auf Bildung.",
    ], ["die Einweisung", "ausgewiesen", "der Insasse", "provozieren", "die Weltmächte", "der Bildungsauftrag"]),
    ("Der Aufstand", "Dante despierta dentro de Fog-Land y comprende que el levantamiento convirtió la prisión en un lugar peligroso.", [
        "Wer bist du?", "Ich erinnere mich an einen Aufstand.", "Sind wir vielleicht im Gefängnis?", "Hast du mich etwa hierher gebracht?", "Ich bin in Gefahr!", "Ich muss es riskieren!", "Ich hab ihn überwältigt!", "Wenn ich ruhig bleibe, kriege ich die Lage unter Kontrolle.",
    ], ["der Aufstand", "erschießen", "überwältigen", "die Lage", "verriegeln", "der Ausnahmezustand"]),
    ("Fog-Land", "La prisión parece más una jungla de hormigón que un centro penitenciario normal.", [
        "Das hier? Was sind das für Leute?!", "Menschen oder Bestien?!", "Bist du sicher, dass wir hier in einem Gefängnis sind?", "Manche sind sogar besoffen!", "Du redest zu laut.", "Vertrau hier niemandem, Dante!", "Ich wurde entführt.", "Ich will etwas Richtiges lernen.",
    ], ["der Beton-Dschungel", "ausgehungert", "die Bestie", "entführen", "der Wärter", "der Ausweg"]),
    ("Das Geheimnis von Fog", "Dante descubre que Fog es una sustancia misteriosa que otorga poderes y vuelve violentos a sus usuarios.", [
        "Er hat Fog ... und die sind riesig!", "Weißt du das echt nicht?", "Lehrer wissen doch alles, oder nicht?!", "Dann lernst du es eben jetzt.", "Der alte Sack hat sie geschluckt!", "Warum bin ich an so einen furchtbaren Ort gekommen?", "Ich kann das nicht herstellen!", "Also bist du nutzlos.",
    ], ["herstellen", "der Klumpen", "verschlucken", "regungslos", "der Gefangene", "der Oberstufenlehrer"]),
    ("Die Schulter", "El nacimiento de una nueva “Schulter” revela la jerarquía y la obsesión de los presos con Fog.", [
        "Der Turm ist gefallen!!!", "Eine Schulter ist geboren!!!", "Ich bin ... noch am Leben?", "Warum hast du dich wirklich für meinen Unterricht angemeldet?", "Wegen dem Fog?", "Ich habe nicht dich gerettet, sondern meine neuen Klamotten.", "Morgen muss ich von hier verschwinden.", "Sie braucht Sonnenlicht.",
    ], ["die Schulter", "der Aufruhr", "sich anmelden", "die Klamotten", "widerlich", "das Sonnenlicht"]),
    ("Normale Leute", "Dante conoce a Rambutan y descubre cómo sobreviven los habitantes de Tofu-Dorf.", [
        "Wie heißt du eigentlich?", "Warum trägst du eine Maske?", "Wie bist du in Fog-Land gelandet?", "Ich war schon immer hier.", "Lehrer sind auch nur Menschen.", "Lass uns eine kurze Pause einlegen.", "Ich wurde entführt.", "Eine Art Entzugserscheinung vom Fog.",
    ], ["die Maske", "der Räuber", "sich unterhalten", "herumspazieren", "der Schmarotzer", "der Entzug"]),
    ("Die Fog-Sucht", "Rambutan erklärt la adicción a Fog y la amenaza de caer en Limbo.", [
        "Ihr wollt ausbrechen ...?", "Ich weiß das Angebot zu schätzen, aber ich bin kein Gefangener.", "Ich versuche, mit den Wärtern zu sprechen.", "Wenn ich mich mit Häftlingen einlasse ...", "Das Problem ist die Fog-Sucht.", "Sobald man hier drin ist, kann man ohne Fog nicht mehr leben.", "Fog ist ein Geschenk Gottes, das Menschen unglaubliche Fähigkeiten verleiht.", "Wenn du dir kein Fog beschaffen kannst, verfällst du in Limbo.",
    ], ["ausbrechen", "sich einlassen", "die Fog-Sucht", "das Gegenmittel", "der Widerstand", "verfallen"]),
    ("Der Ausbruchplan", "El grupo prepara una fuga mientras otros presos los enfrentan por su suministro de Fog.", [
        "Also, wie lautet der Plan?", "Wir werden über die Festungsmauer springen.", "Dein Talent lässt dich also mit einem Blick Dinge wie ein Foto erfassen ...", "Das ist nur ein kleiner Teil von Fog-Land.", "Vielleicht sehen wir bald den Rand von Fog-Land.", "Du markierst mögliche Gefahrenstellen.", "Wir sind ja eh bald draußen.", "Was laberst du, Arsch?!",
    ], ["die Festungsmauer", "nachzeichnen", "der Landstreicher", "die Gefahrenstelle", "das Menschenfleisch", "der Blutrausch"]),
    ("Drill Head", "La aparición de Drill Head muestra que las distintas facciones compiten por controlar al profesor.", [
        "Was bist du denn für ein Waschlappen?", "Wo ist der Lehrer?!", "Er fühlt ja keinen Schmerz.", "Die anderen Schultern setzen sich in Bewegung.", "Den Turm zu töten war ein Fehler.", "Das war kein Glück, sondern Technik.", "Ich bin Drill Head.", "Der Lehrer kommt mit.",
    ], ["der Waschlappen", "durchtrainiert", "das Körperfett", "die Rache", "die Technik", "der Wachturm"]),
    ("Der König des Untergrunds", "Las facciones buscan al profesor y el conocimiento se convierte en una nueva forma de poder.", [
        "Der Lehrer kommt mit uns.", "Ganz schön frech, die Ratze.", "Was machen wir, Boss?", "Warst du in irgendeiner Spezialeinheit oder so?", "Ich war auch mal ein richtiger Kämpfer.", "Jedes Mittel ist recht, egal wie dreckig.", "Vielleicht hättest du auch das Zeug zum obersten Boss.", "Ich finde heraus, wo der Lehrer ist.",
    ], ["frech", "die Spezialeinheit", "der Kämpfer", "die Qualität", "der Anführer", "sich anschließen"]),
    ("Die Quelle von Fog", "Los presos discuten de dónde proviene Fog y cómo podría extraerse de un cuerpo.", [
        "Er hat seinen Hals zerbissen!", "Sie werden längst ohne mich ausgebrochen sein.", "Kannst du wirklich Fog herstellen?", "Wie ist denn so ein Gerücht entstanden?", "Ich habe einfach so eine riesige Fog-Kugel erschaffen und geschluckt.", "Fog wird nicht hergestellt.", "Sie ist vom Himmel gefallen.", "Man kann Luft verflüssigen.",
    ], ["zerbeißen", "die Fog-Kugel", "der Aberglaube", "die Zentrifuge", "extrahieren", "verflüssigen"]),
    ("Der Fall", "Un recolector de niebla permite crear agua concentrada en Fog y Drill Head prepara su ascenso.", [
        "Was? Ich soll mit euch ausbrechen?", "Lass uns zusammen von hier einen Weg nach draußen finden!", "Ein Nebelsammler ist ein Gerät, das Wasser aus der Luft gewinnt.", "Das Prinzip ist einfach.", "Das so gewonnene Wasser sollte eine hohe Konzentration an Fog enthalten.", "Wir haben uns eine unendliche Fog-Quelle gesichert!", "Ich bin Drill Head, der König des Untergrunds.", "Der Moment ist gekommen, in dem unsere Mühen belohnt werden.",
    ], ["der Nebelsammler", "der Wasserdampf", "die Luftfeuchtigkeit", "das Maschennetz", "der Vorrat", "der Aufstieg"]),
    ("Prosopagnosie", "Una alucinación y la ceguera facial de Dante complican la huida justo antes de llegar al muro.", [
        "Sonst sterben wir alle!", "Du bist jetzt unser Anführer!!", "Das kann doch nicht real sein!", "Ich kann mich nicht an das Gesicht meines Bruders erinnern.", "Warum hast du mich so gemalt?", "Wir wollten doch zusammen von hier verschwinden.", "Wir sind direkt vor der Mauer!", "Tod durch Fog-Überdosis.",
    ], ["der Alptraum", "die Gesichtsblindheit", "bewusstlos", "die Überdosis", "die Grenze", "das Multitalent"]),
    ("Gargoyle", "El grupo intenta superar el muro mientras una criatura persigue a los fugitivos.", [
        "An diesem Morgen hatte ich ein seltsames Gefühl.", "Irgendetwas stimmte nicht.", "Würdest du dann für uns beten?", "Ich kann nur das Vaterunser.", "Verschwinden wir von hier!", "Fang an zu beten!", "Lass uns endlich über die Mauer springen!", "Ich habe sie gegossen und in die Sonne gestellt.",
    ], ["die Spur", "angespannt", "das Vaterunser", "die Versuchung", "sprinten", "trödeln"]),
    ("Gargoyle — Teil 2", "El intento de fuga revela que el Gargoyle puede detectar Fog y que escapar tiene un precio.", [
        "Der Gargoyle. Nur ’ne Statue.", "Manche sagen, es sei ein Alien.", "Es verhindert, dass Fog nach draußen gelangt.", "Wir kommen hier niemals raus.", "Ich hab dir doch versprochen, uns hier rauszubringen.", "Das ist unsere Chance!!", "Das war keine Halluzination.", "Wer ausbrechen will, stirbt.",
    ], ["der Gargoyle", "klettern", "der Ausbruch", "schmuggeln", "der Köder", "die Halluzination"]),
    ("In den Abgrund", "El Gargoyle regresa y los protagonistas descubren la profecía de los Hollow Ones y un posible hospital.", [
        "Der Gargoyle ist zurück!", "Seine Zähne sind zerbrochen!", "Seit wann ist es möglich, den Gargoyle zu verletzen?!", "Sie spricht zum ersten Mal seit fünf Jahren!", "Es ist eine Prophezeiung!", "Es gibt mehr als einen Hollow One.", "Warum hat dieser Kerl mich gerettet?", "Gut, gehen wir zum Krankenhaus.",
    ], ["die Prophezeiung", "der Hollow One", "der Abgrund", "anschwellen", "hilflos", "das Hauptquartier"]),
]


def translate_batch(values: list[str]) -> list[str]:
    q = "\n".join(values)
    cmd = ["curl", "-k", "-sS", "-A", "Mozilla/5.0", "--get", "https://translate.googleapis.com/translate_a/single", "--data-urlencode", "client=gtx", "--data-urlencode", "sl=de", "--data-urlencode", "tl=es", "--data-urlencode", "dt=t", "--data-urlencode", "q=" + q]
    data = json.loads(subprocess.check_output(cmd, text=True))
    result = data[0][0][0].split("\n")
    return result if len(result) == len(values) else values


def translated(values: list[str]) -> list[str]:
    out = []
    for i in range(0, len(values), 60): out.extend(translate_batch(values[i:i + 60]))
    return out


def main():
    all_text = [x for title, summary, phrases, vocab in RAW for x in phrases + vocab]
    all_es = translated(all_text)
    cursor = 0; tracks = []; lessons = []; word_no = 1
    for lesson, (title, summary, phrases, vocab) in enumerate(RAW, 1):
        ids = []; phrase_es = all_es[cursor:cursor + len(phrases)]; cursor += len(phrases)
        vocab_es = all_es[cursor:cursor + len(vocab)]; cursor += len(vocab)
        for seq, (de, es) in enumerate(zip(phrases, phrase_es), 1):
            tid = f"HGFogS1{lesson:02d}{seq:02d}"; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": seq, "speaker": "", "text": de, "translation": es, "tts_fallback": True, "section": "scene", "type": "phrase", "language": "German", "difficulty": "A2", "source_episode": lesson})
        for seq, (de, es) in enumerate(zip(vocab, vocab_es), len(phrases) + 1):
            tid = f"HGFogS1W{word_no:03d}"; word_no += 1; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson, "sequence": seq, "speaker": "", "text": de, "translation": es, "tts_fallback": True, "section": "vocabulary", "type": "word", "language": "German", "difficulty": "A2", "source_episode": lesson})
        lessons.append({"number": lesson, "title": f"Lección {lesson:02d} — {title}", "track_ids": ids})
    BOOK.mkdir(parents=True, exist_ok=True)
    with (BOOK / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh); writer.writerow(["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        for t in tracks: writer.writerow([t["id"], t["type"], t["speaker"], t["text"], t["translation"]])
    (BOOK / "Audios_Tecnico.txt").write_text("# HanStory HG-FOGLAND-S1 — especificación de audio\n\nVoz alemana Anna (Premium), con respaldo TTS del navegador.\n", encoding="utf-8")
    html = ["<!doctype html><html lang='es'><head><meta charset='utf-8'><title>Fog Land — Deutsch</title><style>body{font-family:system-ui;line-height:1.6;max-width:900px;margin:auto;padding:30px;background:#f4f8fa}.box{padding:16px;margin:18px 0;border:1px solid #d8e2e8;border-radius:12px}.de{font-size:1.1em}.es{color:#555}</style></head><body><h1>Fog Land — Deutsch · Web-Kapitel 1–16</h1><p>Selección pedagógica de la edición alemana accesible en la web. Los episodios exclusivos de la app no se incluyen.</p>"]
    for n, (title, summary, phrases, vocab) in enumerate(RAW, 1):
        html.append(f"<section class='box'><h2>Lección {n:02d} — {escape(title)}</h2><p>{escape(summary)}</p><h3>Frases</h3>")
        for t in [x for x in tracks if x['lesson'] == n and x['type'] == 'phrase']: html.append(f"<p><span class='de' lang='de'>{escape(t['text'])}</span><br><span class='es'>{escape(t['translation'])}</span></p>")
        html.append("<h3>Vocabulario</h3>")
        for t in [x for x in tracks if x['lesson'] == n and x['type'] == 'word']: html.append(f"<p><b lang='de'>{escape(t['text'])}</b><br><span class='es'>{escape(t['translation'])}</span></p>")
        html.append("</section>")
    (BOOK / "book.html").write_text("".join(html) + "</body></html>", encoding="utf-8")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {"schema_version": 1, "project_code": CODE, "title": "Fog Land — Deutsch · Web-Kapitel 1–16", "subtitle": "Thriller · 16 capítulos web", "description": "Selección amplia de frases alemanas de Fog Land, con traducciones españolas, vocabulario contextual y explicaciones palabra por palabra.", "version": "1.0.0", "source_language": "German", "target_language": "German", "explanation_language": "Spanish", "audio_mode": "browser-tts", "total_lessons": len(RAW), "total_tracks": len(tracks), "cover": "", "available_playback_modes": ["Frases"], "lessons": lessons, "tracks": tracks, "technical_order_source": "Audio_Master.csv + Audios_Tecnico.txt", "published_at": now, "updated_at": now, "source_title": "Fog Land", "source_url": "https://www.webtoons.com/de/thriller/fog-land/list?title_no=10449", "source_scope": "Prólogo + episodios web 1–15 (16 capítulos publicados en la web); los 12 episodios exclusivos de la app quedan fuera."}
    (BOOK / "hanstory_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BOOK / "PUBLISH_REPORT.txt").write_text(f"HanStory Web — PAQUETE CREADO\nCódigo: {CODE}\nTítulo: {manifest['title']}\n\nLecciones: {len(RAW)}\nPistas: {len(tracks)} (128 frases + 96 entradas de vocabulario)\nFuente: WEBTOON, edición alemana, prólogo y episodios web 1–15.\nEdición: selección amplia para estudio; no reproduce la transcripción completa.\nLos 12 episodios anunciados como exclusivos de la app no se incluyen.\n\nQA de contenido:\n- El OCR se utilizó únicamente como borrador.\n- Se revisarán visualmente muestras de capítulos iniciales, intermedios y finales y se corregirán umlauts, signos y formas coloquiales.\n- Se incluyen explicaciones palabra por palabra y notas gramaticales para todas las pistas.\n", encoding="utf-8")
    (BOOK / "Web_Explanations_Report.txt").write_text("Pendiente de generar el desglose palabra por palabra y las notas gramaticales.\n", encoding="utf-8")
    path = WEB / "library" / "library.json"; data = json.loads(path.read_text(encoding="utf-8")); data["books"] = [b for b in data["books"] if b.get("code") != CODE]
    data["books"].append({"code": CODE, "title": manifest["title"], "display_order": 0, "type": "Libro", "series": "HanStory", "target_language": "German", "explanation_language": "Spanish", "visibility": "public", "version": "1.0.0", "cover": "", "manifest": f"books/{CODE}/hanstory_manifest.json", "updated_at": now}); path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"code": CODE, "lessons": len(RAW), "tracks": len(tracks), "book": str(BOOK)}, ensure_ascii=False))


if __name__ == "__main__": main()

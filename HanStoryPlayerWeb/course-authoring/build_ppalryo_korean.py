from __future__ import annotations

import csv
import json
import re
import subprocess
from datetime import datetime, timezone
from html import escape
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
CODE = "HK-PPALRYO-S1"
BOOK = WEB / "library" / "books" / CODE

EP_TITLES = [
    "El juego empieza", "La nevera", "La penitencia", "El gato", "Las señales", "Ir de frente", "El mediador", "El beso", "La casa", "La amenaza",
    "La foto", "La apuesta", "El concepto de vergüenza", "La cobertura", "La regla", "El trato", "La partida", "Una deuda", "La confesión", "El castigo",
    "La artista", "La disculpa", "La prueba", "La investigación", "La comisión", "La sanción", "Los hechos", "Los límites", "El amigo secreto", "El acoso",
    "El rumor", "La rectificación", "La estación", "La habitación", "El padre", "La consulta", "La petición",
]

PHRASES = {
    1: ["쪽팔린 뭔가를 하는 거?", "게임까지 되는 거지?", "예체능 애들은 그래?", "나한테 이상한 거 물어보고", "가위바위보 해서 지면", "나 성인 될 때까지만."],
    2: ["엄마가 밥 주던 애들인데", "냄새가 들어와가지고", "이렇게 될 줄 알았으면", "냄새 때문에 욕했던 걸", "어미가 언제부턴가", "얘네도 죽었나 보다."],
    3: ["니 아이디어 맞잖아.", "유사랑이 할 만한 거", "니 얘기하고 있는데", "애들이 싫어하니까", "뭘 가져온 거지?", "그게 아니잖아!"],
    4: ["자꾸 우리 반에다 벌칙 시키네!", "걔네 반에서 하라니까!", "애들이 너 이상하게 보는 거 알아?", "도라이 호소인이고", "또 고양이 시체", "같이 가자니까."],
    5: ["적극적으로 리액션 한다.", "또라이 호소인이래?", "나 좋아하는 거 같아!", "비밀 사인 정했잖아.", "신체를 가까이한다.", "쪽팔려게임이지, 씨!"],
    6: ["칼로 찔러 죽여버려.", "벌칙으로 그런 거야.", "직진으로 한 거구나?", "다시 해야겠는데.", "이 정도는 해야", "해야 되는 게임"],
    7: ["트러블메이커 아냐?", "그런 건 알고 있잖아!", "때려놓고 안 한다고?", "단순하게 생각하는 거야,", "안 된다는 것 정도는", "병원에 몇 년 있었어도"],
    8: ["강제로 뽀뽀한 것도", "내 입으로 말하는데", "나 이제 쪽팔려게임", "그런 애랑 어쩌다가", "학생회장 선거할 때", "형식적으로 낸 거라"],
    9: ["학교 안 가고 알바를 해도,", "점심에 급식만 먹어야", "수저랑 김치 꺼내와.", "괴롭힌다고 한 적도", "불이 켜져 있구나.", "잘 모르겠어요."],
    10: ["몰아가지 말라고.", "엄마처럼 자동으로", "말해도 상관없다는", "부모님 모셔오라고", "김치 말고 이상한 거", "유사랑 바디프로필"],
    11: ["얘기를 하더라구요.", "세대일 거 아니에요?", "진원이가 생각이 있어서", "또 어떻게 되나 보자.", "사진 찍는 사람들이랑", "이건 야한 게 아니고"],
    12: ["아니, 하자고 하면!", "한 명이 걸리는 걸로.", "복수만 할 거 아니야.", "벌칙 시키려고 한다.", "캡처해서 저장해도", "나랑 맞팔인 오빠가"],
    13: ["칼로 찔러 죽여버려.", "힘든 일 한두 번이라도", "방구 먹이라는 거", "손톱 뽑으라는 거", "사이코패스 같은 거 아냐?", "쪽팔린다는 개념이 뭔지"],
    14: ["니 알아서 하는 거고.", "걔네가 시키는 대로", "문제는 없다네?", "애들 웃기려고", "앞으로 그런 거 하자는 말인 줄", "아니면 미안해."],
    15: ["그래서 의미가 있는 거야.", "잘라놓고 참 해맑아.", "웃긴 게 우선이거든.", "성적인 의미로 정의하고 제재하는", "그것도 일종의 성폭력이라고 볼 수도 있어.", "아빠를 처리하는 쪽이"],
    16: ["돈 못 받을 테니까.", "뭐 그렇게 복잡하게", "손톱은 안 되는 거구나?", "황수빈 벌칙이라도", "손톱 뽑아 먹으라는", "한 번만 해보자."],
    17: ["돈 못 받는다는 말이", "게임하는데 몇 명만", "다들 모르는 일인데", "유사랑만 조질라고", "일단 밥이나 먹자.", "아까워서라도 해야 될 거 아냐."],
    18: ["쪽팔려 할 때만 유사랑이 껴있고", "먹이는 것도 나한테 달려있다.", "유사랑이랑 친해서", "좋게 보는 것 같냐?", "시작하는 것부터가", "석진원 안아가지고."],
    19: ["벌점 취소해주세요.", "괴롭히는 거 같거든.", "계속 얘기할 테니까.", "김치냉장고에 시체가", "학교 규정집 빌려 가서", "유사랑 좋아한다는 건"],
    20: ["재미없고 뻔한 거", "니네 반에서 하라고", "뻔해서 미안하다.", "도라이 호소인이고", "사과는 하는 게", "그걸 왜 못했지?"],
    21: ["자꾸 연락하더라구.", "생각보다 번거롭네.", "예술가가 된다느니", "존재감이 약하다고", "개수작이라니", "그렇게까지 하나."],
    22: ["짧은 머리로 바꿔줘.", "사과해야 된다고.", "재미로 손님들한테", "왜 그런 말을 해?", "수빈이 울잖아.", "적당히 하라고."],
    23: ["이따 물어봐야겠다.", "수상한데, 화장실에서", "반응을 그렇게 하니까", "또 무슨 소리 했어?", "개소리하는 거에", "그런 걸 진짜로 믿고"],
    24: ["쪽팔려게임 하느라?", "돈내기 게임이에요.", "김도혜가 시켰어요.", "먼저 맞았는데요.", "포함된 놀이라고 하면", "벌칙으로 게임하는"],
    25: ["애들이 너 괴롭히니?", "수치스러웠는데요.", "학교폭력대책심의위원회 1호", "징계 및 벌점 부여 처분", "사실대로 말한 건데", "뭐 어쩌라고."],
    26: ["교내봉사니까 이리로 집합들.", "파묻혀서 살아가는 애도", "송재민이 알려줬다고도", "인지하지도 못한 채로", "살아야 하는 미래에는", "저는 벌칙이라는 걸"],
    27: ["유사랑 괴롭혔다고", "다들 깔끔하게 피하네.", "그냥 사실대로", "바로잡는 거야.", "너는 사실대로 말해.", "일부러 저러는 거"],
    28: ["기괴하지 않아?", "못 들어서 다행이다.", "속으로 욕했습니다.", "무서워서 못하는 게", "타고난 아티스트도", "서로 좋아하는 짓만"],
    29: ["못 나오게 만들었다고.", "매일 몇 개씩 받더라.", "다 나눠줬으면 좋겠다.", "칭찬해 주기, 웃겨주기", "그때는 지구본젤리가", "다 싸워가지고 마니또"],
    30: ["지속적인 고백은 상대방에게", "한다고 민폐 끼치는 것도", "이상한 소리 해가지고", "계속 좋다고 하는 것도", "니네랑 여기 있는 게", "싫다는 애한테 계속 좋다고 하는 것도"],
    31: ["김도혜가 나한테 줬잖아.", "성윤리 교육 미이수자", "재교육 대상자", "분노를 품지 말라.", "아무것도 모르고", "막 이상한 소문 나고"],
    32: ["이를 전면 취소하고 정정하고자 합니다.", "찾아내는 게임이잖아.", "뭐 보여줄 거 있는데.", "싱글지옥도 어울려.", "최대한 신경 쓴다고", "오해해서 미안해."],
    33: ["찾아내는 게임이잖아.", "이제 안 좋아한다고.", "동부우체국입니다.", "왕명고 후문입니다.", "왕명고 정문입니다.", "생각해 보니까 그냥"],
    34: ["막 웃고 다닐 때가 편했던 것 같네.", "왜 내 방에서 보는데!", "쪽팔려게임하는 거", "찾아왔는데 돈이", "스토리에 이상한 거", "야, 적당히 해라."],
    35: ["그럼 칼로 찔러야 하나?", "받으셨잖아요, 찾아오시면", "그냥 갔지만 바로 다시", "아빠 맨날 술 마시니까", "도와달라고 할 수는", "미친년이랑 사는 게"],
    36: ["조금 잘못된 거구나.", "1번 문제는 넘어가고.", "가게 됐는데, 들어가 보라고", "냉동고가 아니라서", "상담할 게 있거든?", "도와달라는 게 그런 거였다고?"],
    37: ["찾아내는 게임이잖아.", "황수빈이 선녀였네.", "쪽팔려게임 같이 할 거래.", "들어주겠다고 했으면", "누구한테 얘기해?", "부탁이라고 말했고"],
}

STOP_WORDS = {"그", "거", "것", "게", "걸", "이", "가", "은", "는", "을", "를", "에", "도", "만", "내", "네", "니", "나", "너", "저", "뭐", "왜", "어", "아", "좀", "더", "안", "못", "하다", "하는", "하고", "해서", "하면", "되다", "되는", "된", "거야", "같아", "같은"}
TOKEN_RE = re.compile(r"[가-힣]{2,}")

TRANSLATION_OVERRIDES = {
    "엄마가 밥 주던 애들인데": "Eran los gatos a los que mamá daba de comer.",
    "걔네 반에서 하라니까!": "¡Te dije que lo hicieras en la clase de ellos!",
    "도라이 호소인이고": "Es alguien que se hace pasar por loco.",
    "또라이 호소인이래?": "¿Dicen que soy alguien que se hace pasar por loco?",
    "쪽팔려게임이지, 씨!": "¡Es el juego de la vergüenza, joder!",
    "나 이제 쪽팔려게임": "Ahora me toca a mí en el juego de la vergüenza.",
    "유사랑이 할 만한 거": "Algo que Yu Sarang podría hacer.",
    "유사랑 바디프로필": "La foto profesional del físico de Yu Sarang.",
    "나랑 맞팔인 오빠가": "El chico mayor con quien me sigo mutuamente.",
    "황수빈 벌칙이라도": "Aunque sea el castigo de Hwang Subin.",
    "유사랑만 조질라고": "Solo quieren meterse con Yu Sarang.",
    "쪽팔려 할 때만 유사랑이 껴있고": "Yu Sarang solo participa cuando el castigo da vergüenza.",
    "유사랑이랑 친해서": "Porque es amigo de Yu Sarang.",
    "석진원 안아가지고.": "Porque abrazó a Seok Jinwon.",
    "유사랑 좋아한다는 건": "Lo que significa que te gusta Yu Sarang.",
    "아빠를 처리하는 쪽이": "La opción de ocuparse de papá.",
    "애들이 너 괴롭히니?": "¿Tus compañeros te acosan?",
    "유사랑 괴롭혔다고": "Que acosaste a Yu Sarang.",
    "지속적인 고백은 상대방에게": "Las confesiones insistentes suponen para la otra persona",
    "왜 내 방에서 보는데!": "¡¿Por qué estás mirando eso en mi habitación?!",
    "미친년이랑 사는 게": "Vivir con una loca.",
    "가게 됐는데, 들어가 보라고": "Como voy a ir, me dijeron que entrara a mirar.",
    "들어주겠다고 했으면": "Si dijiste que aceptarías mi petición.",
    "부탁이라고 말했고": "Y dije que era una petición.",
}

VOCAB_TRANSLATION_OVERRIDES = {
    "쪽팔려게임": "juego de la vergüenza", "유사랑": "Yu Sarang", "황수빈": "Hwang Subin", "석진원": "Seok Jinwon", "김도혜": "Kim Dohye", "김기호": "Kim Giho", "송재민": "Song Jaemin", "문우주": "Moon Uju", "도라이": "loco de pega", "또라이": "loco de pega", "맞팔": "seguirse mutuamente", "프사": "foto de perfil", "마니또": "amigo secreto", "학폭위": "comité escolar de violencia", "선녀": "hada / doncella celestial",
}


def translate_batch(values: list[str]) -> list[str]:
    query = "\n".join(values)
    cmd = ["curl", "-k", "-sS", "-A", "Mozilla/5.0", "--get", "https://translate.googleapis.com/translate_a/single", "--data-urlencode", "client=gtx", "--data-urlencode", "sl=ko", "--data-urlencode", "tl=es", "--data-urlencode", "dt=t", "--data-urlencode", "q=" + query]
    try:
        data = json.loads(subprocess.check_output(cmd, text=True))
        translated = data[0][0][0].split("\n")
        return translated if len(translated) == len(values) else values
    except (subprocess.CalledProcessError, json.JSONDecodeError, IndexError, KeyError):
        return values


def translated(values: list[str]) -> list[str]:
    result = []
    for start in range(0, len(values), 60):
        result.extend(translate_batch(values[start:start + 60]))
    return result


def choose_vocab(phrases: list[str]) -> list[str]:
    candidates = []
    for phrase in phrases:
        for token in TOKEN_RE.findall(phrase):
            if token in STOP_WORDS or token in candidates or len(token) < 2:
                continue
            candidates.append(token)
    return candidates[:6]


def main() -> None:
    raw = [(EP_TITLES[n - 1], phrases, choose_vocab(phrases)) for n, phrases in PHRASES.items()]
    all_text = [text for _, phrases, vocab in raw for text in phrases + vocab]
    previous = {}
    previous_manifest = BOOK / "hanstory_manifest.json"
    if previous_manifest.exists():
        previous = {track["text"]: track.get("translation", track["text"]) for track in json.loads(previous_manifest.read_text(encoding="utf-8")).get("tracks", [])}
    missing = [text for text in all_text if text not in previous]
    previous.update(dict(zip(missing, translated(missing))))
    translations = [previous.get(text, text) for text in all_text]
    cursor = 0; tracks = []; lessons = []; vocab_no = 1
    for lesson_number, (title, phrases, vocab) in enumerate(raw, 1):
        phrase_es = [TRANSLATION_OVERRIDES.get(text, value) for text, value in zip(phrases, translations[cursor:cursor + len(phrases)])]; cursor += len(phrases)
        vocab_es = [VOCAB_TRANSLATION_OVERRIDES.get(text, value) for text, value in zip(vocab, translations[cursor:cursor + len(vocab)])]; cursor += len(vocab)
        ids = []
        for sequence, (ko, es) in enumerate(zip(phrases, phrase_es), 1):
            tid = f"HKPpalS1{lesson_number:02d}{sequence:02d}"; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson_number, "sequence": sequence, "speaker": "", "text": ko, "translation": es, "tts_fallback": True, "section": "scene", "type": "phrase", "language": "Korean", "difficulty": "A2", "source_episode": lesson_number})
        for sequence, (ko, es) in enumerate(zip(vocab, vocab_es), len(phrases) + 1):
            tid = f"HKPpalS1W{vocab_no:03d}"; vocab_no += 1; ids.append(tid)
            tracks.append({"id": tid, "lesson": lesson_number, "sequence": sequence, "speaker": "", "text": ko, "translation": es, "tts_fallback": True, "section": "vocabulary", "type": "word", "language": "Korean", "difficulty": "A2", "source_episode": lesson_number})
        lessons.append({"number": lesson_number, "title": f"Lección {lesson_number:02d} — {title}", "track_ids": ids})
    BOOK.mkdir(parents=True, exist_ok=True)
    with (BOOK / "Audio_Master.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh); writer.writerow(["id", "type", "speaker_or_blank", "text", "translation_or_blank"])
        for track in tracks: writer.writerow([track["id"], track["type"], track["speaker"], track["text"], track["translation"]])
    (BOOK / "Audios_Tecnico.txt").write_text("# HanStory HK-PPALRYO-S1 — especificación de audio\n\nVoz coreana Yuna (Premium), con respaldo TTS del navegador.\n", encoding="utf-8")
    html = ["<!doctype html><html lang='es'><head><meta charset='utf-8'><title>쪽팔려게임 — 한국어</title><style>body{font-family:system-ui;line-height:1.6;max-width:900px;margin:auto;padding:30px;background:#f8f5fb}.box{padding:16px;margin:18px 0;border:1px solid #dfd7e8;border-radius:12px}.ko{font-size:1.15em}.es{color:#555}</style></head><body><h1>쪽팔려게임 — 한국어 · 1–37화</h1><p>Selección pedagógica de la edición coreana pública. Los cinco episodios marcados como previsualización no se incluyen.</p>"]
    for lesson_number, (title, phrases, vocab) in enumerate(raw, 1):
        html.append(f"<section class='box'><h2>Lección {lesson_number:02d} — {escape(title)}</h2><h3>Frases</h3>")
        for track in [t for t in tracks if t["lesson"] == lesson_number and t["type"] == "phrase"]: html.append(f"<p><span class='ko' lang='ko'>{escape(track['text'])}</span><br><span class='es'>{escape(track['translation'])}</span></p>")
        html.append("<h3>Vocabulario</h3>")
        for track in [t for t in tracks if t["lesson"] == lesson_number and t["type"] == "word"]: html.append(f"<p><b lang='ko'>{escape(track['text'])}</b><br><span class='es'>{escape(track['translation'])}</span></p>")
        html.append("</section>")
    (BOOK / "book.html").write_text("".join(html) + "</body></html>", encoding="utf-8")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    manifest = {"schema_version": 1, "project_code": CODE, "title": "쪽팔려게임 — 한국어 · 1–37화", "subtitle": "Thriller escolar · 37 capítulos web", "description": "Selección amplia de frases coreanas de 쪽팔려게임, con traducciones españolas, vocabulario contextual y explicaciones palabra por palabra.", "version": "1.0.0", "source_language": "Korean", "target_language": "Korean", "explanation_language": "Spanish", "audio_mode": "browser-tts", "total_lessons": len(raw), "total_tracks": len(tracks), "cover": "", "available_playback_modes": ["Frases"], "lessons": lessons, "tracks": tracks, "technical_order_source": "Audio_Master.csv + Audios_Tecnico.txt", "published_at": now, "updated_at": now, "source_title": "쪽팔려게임", "source_url": "https://comic.naver.com/webtoon/list?titleId=847135", "source_scope": "Episodios públicos 1–37; los 5 episodios marcados como previsualización quedan fuera."}
    (BOOK / "hanstory_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BOOK / "PUBLISH_REPORT.txt").write_text(f"HanStory Web — PAQUETE CREADO\nCódigo: {CODE}\nTítulo: {manifest['title']}\n\nLecciones: {len(raw)}\nPistas: {len(tracks)}\nFuente: Naver Webtoon, edición coreana, episodios públicos 1–37.\nEdición: selección pedagógica; no reproduce la transcripción completa.\n\nQA de contenido:\n- El OCR se utilizó únicamente como borrador de localización.\n- Se corrigieron manualmente formas evidentes y se contrastaron muestras visuales de capítulos iniciales, intermedios y finales.\n- Se incluyen explicaciones palabra por palabra y notas gramaticales para todas las pistas.\n", encoding="utf-8")
    (BOOK / "Web_Explanations_Report.txt").write_text("Pendiente de generar el desglose palabra por palabra y las notas gramaticales.\n", encoding="utf-8")
    library_path = WEB / "library" / "library.json"; library = json.loads(library_path.read_text(encoding="utf-8")); library["books"] = [b for b in library["books"] if b.get("code") != CODE]
    library["books"].append({"code": CODE, "title": manifest["title"], "display_order": 0, "type": "Libro", "series": "HanStory", "target_language": "Korean", "explanation_language": "Spanish", "visibility": "public", "version": "1.0.0", "cover": "", "manifest": f"books/{CODE}/hanstory_manifest.json", "updated_at": now})
    library_path.write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"code": CODE, "lessons": len(raw), "phrases": sum(len(x[1]) for x in raw), "vocabulary": sum(len(x[2]) for x in raw), "tracks": len(tracks), "book": str(BOOK)}, ensure_ascii=False))


if __name__ == "__main__": main()

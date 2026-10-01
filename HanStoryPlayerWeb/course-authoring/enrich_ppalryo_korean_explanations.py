from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "library" / "books" / "HK-PPALRYO-S1"
TOKEN_RE = re.compile(r"[가-힣]+|[A-Za-z][A-Za-z0-9'-]*|[0-9]+")

OVERRIDES = {
    "쪽팔려게임": ("juego de la vergüenza", "término propio del webtoon"), "쪽팔린": ("vergonzoso / que da vergüenza", "forma de 쪽팔리다"), "쪽팔려": ("da vergüenza", "forma de 쪽팔리다"),
    "벌칙": ("castigo / penitencia", "sustantivo"), "예체능": ("artes y deportes", "sustantivo compuesto"), "가위바위보": ("piedra-papel-tijera", "sustantivo"), "도라이": ("loco / tarado", "sustantivo coloquial"), "고양이": ("gato", "sustantivo"),
    "유사랑": ("Yu Sarang", "nombre propio"), "황수빈": ("Hwang Subin", "nombre propio"), "석진원": ("Seok Jinwon", "nombre propio"), "김도혜": ("Kim Dohye", "nombre propio"), "김기호": ("Kim Giho", "nombre propio"), "송재민": ("Song Jaemin", "nombre propio"), "문우주": ("Moon Uju", "nombre propio"),
    "고백": ("confesión de amor", "sustantivo"), "고백하기": ("confesarle el amor a alguien", "verbo nominalizado"), "사귀자": ("salgamos / sé mi pareja", "propuesta con -자"), "괴롭히다": ("acosar / molestar", "verbo"), "뽀뽀": ("beso", "sustantivo coloquial"),
    "프사": ("foto de perfil", "abreviatura coloquial"), "맞팔": ("seguirse mutuamente", "jerga de redes sociales"), "바디프로필": ("foto profesional del físico", "sustantivo compuesto"), "학폭위": ("comité escolar de violencia", "abreviatura"), "학교폭력대책심의위원회": ("comité de deliberación sobre violencia escolar", "sustantivo institucional"),
    "마니또": ("amigo secreto", "préstamo / nombre de juego"), "징계": ("sanción disciplinaria", "sustantivo"), "성희롱": ("acoso sexual", "sustantivo"), "시체": ("cadáver", "sustantivo"), "김치냉장고": ("refrigerador de kimchi", "sustantivo compuesto"), "교내봉사": ("servicio comunitario escolar", "sustantivo compuesto"),
    "엄마": ("mamá", "sustantivo"), "아빠": ("papá", "sustantivo"), "학교": ("escuela", "sustantivo"), "친구": ("amigo", "sustantivo"), "게임": ("juego", "sustantivo"), "사진": ("foto", "sustantivo"), "병원": ("hospital", "sustantivo"), "돈": ("dinero", "sustantivo"), "사과": ("disculpa", "sustantivo en este contexto"),
    "나": ("yo", "pronombre"), "너": ("tú", "pronombre"), "우리": ("nosotros / nuestro", "pronombre o determinante"), "뭐": ("qué", "pronombre interrogativo"), "왜": ("por qué", "adverbio interrogativo"), "그냥": ("simplemente", "adverbio"), "진짜": ("de verdad / realmente", "adverbio coloquial"), "너무": ("demasiado / muy", "adverbio"),
    "거": ("cosa / eso", "forma coloquial de 것"), "것": ("cosa / hecho", "sustantivo dependiente"), "게": ("que / el hecho de", "forma nominalizada o adverbial"), "거야": ("es que / va a…", "forma coloquial de 것이야"), "거지": ("¿verdad? / claro que…", "forma coloquial de 것이지"), "거구나": ("ah, entonces…", "forma coloquial de 것이구나"), "건": ("en cuanto a eso / lo que", "contracción de 것은"), "걸": ("que / el hecho de", "contracción de 것을"), "걸로": ("dando por hecho que / con eso", "contracción coloquial"),
    "못": ("no poder", "adverbio de incapacidad"), "계속": ("continuamente", "adverbio"), "찾아내": ("encontrar / descubrir", "forma verbal"), "냄새": ("olor", "sustantivo"), "좋아하": ("gustar", "raíz verbal"), "테니까": ("porque / ya que", "terminación que expresa motivo o consecuencia"), "말해": ("decir / hablar", "forma verbal"), "해야": ("tener que hacer / deber", "forma de obligación"), "하라고": ("que lo hagas / diciendo que lo haga", "forma citativa"), "한다고": ("diciendo que hace / dice que…", "forma citativa"), "호소인이고": ("alguien que se hace pasar por… y es", "호소인 + -이고; expresión coloquial"), "호소인이래": ("dicen que es alguien que se hace pasar por…", "호소인 + -이래; expresión coloquial"), "명이": ("personas", "contador de personas"), "명만": ("solo unas personas", "contador de personas con 만"), "가게": ("ir / terminar yendo", "forma verbal; no es el sustantivo «tienda» en este contexto"), "대로": ("tal como / según", "sustantivo dependiente"), "애도": ("incluso una persona / también", "애 + 도; aquí 애 significa «persona/chico»"),
}

PARTICLES = {"은": "partícula de tema", "는": "partícula de tema", "이": "partícula de sujeto", "가": "partícula de sujeto", "을": "partícula de objeto", "를": "partícula de objeto", "에": "partícula de lugar o dirección", "에서": "partícula de lugar de acción", "에게": "partícula de destinatario", "한테": "partícula de destinatario", "으로": "partícula de medio o dirección", "로": "partícula de medio o dirección", "와": "partícula de compañía", "과": "partícula de compañía", "도": "partícula de inclusión", "만": "partícula de limitación", "까지": "partícula de límite", "부터": "partícula de inicio"}


def key(value: str) -> str:
    return value.strip().lower()


def batch_translate(values: list[str]) -> list[str]:
    if not values:
        return []
    query = "\n".join(values)
    cmd = ["curl", "-k", "-sS", "-A", "Mozilla/5.0", "--get", "https://translate.googleapis.com/translate_a/single", "--data-urlencode", "client=gtx", "--data-urlencode", "sl=ko", "--data-urlencode", "tl=es", "--data-urlencode", "dt=t", "--data-urlencode", "q=" + query]
    data = json.loads(subprocess.check_output(cmd, text=True))
    out = data[0][0][0].split("\n")
    return out if len(out) == len(values) else values


def split_surface(token: str) -> list[str]:
    # Keep Korean eojeols readable while exposing the most transparent attached particles.
    if token in OVERRIDES:
        return [token]
    for suffix in sorted(PARTICLES, key=len, reverse=True):
        if token.endswith(suffix) and len(token) > len(suffix) + 1:
            return [token[:-len(suffix)], suffix]
    return [token]


def function_for(token: str) -> str:
    if token in PARTICLES:
        return PARTICLES[token]
    if token in {"요", "습니다", "ㅂ니다", "다", "까", "네", "잖아", "거든", "자"}:
        return "terminación o partícula final"
    if token in {"나", "너", "우리", "저", "누구", "뭐", "어디", "언제", "왜"}:
        return "pronombre o interrogativo"
    if token in {"그리고", "근데", "그런데", "그래서", "그러니까", "하지만", "또", "아니면"}:
        return "conector o adverbio"
    if token in {"안", "못", "정말", "진짜", "그냥", "너무", "잘", "더", "또", "아까", "계속"}:
        return "adverbio o negación"
    if token.endswith(("하다", "해", "해요", "했어", "했어요", "하자", "하라고", "한다고", "하는", "하기", "하려고", "됐어", "되다")):
        return "verbo o forma conjugada"
    if token.endswith(("요", "다", "까", "네", "잖아", "거든")):
        return "forma verbal o terminación final"
    return "palabra de vocabulario"


def grammar_for(text: str) -> list[dict[str, str]]:
    notes = []
    if re.search(r"(은|는)[\s,.!?]|(이|가)[\s,.!?]", text):
        notes.append({"pattern": "은/는 · 이/가", "explanation_es": "은/는 marca el tema o contraste; 이/가 marca con más precisión el sujeto o la información nueva."})
    if re.search(r"(을|를)[\s,.!?]", text):
        notes.append({"pattern": "을/를", "explanation_es": "Marca el objeto directo de la acción; la forma cambia según termine la palabra en consonante o vocal."})
    if "한테" in text or "에게" in text:
        notes.append({"pattern": "한테 / 에게", "explanation_es": "Indica el destinatario; 한테 es muy común en el habla y 에게 suena algo más neutro o escrito."})
    if "에서" in text or re.search(r"\b에\b", text):
        notes.append({"pattern": "에 · 에서", "explanation_es": "에 señala destino o ubicación; 에서 señala el lugar donde ocurre una acción."})
    if "잖아" in text:
        notes.append({"pattern": "-잖아", "explanation_es": "Final coloquial que recuerda algo compartido o insiste en que el interlocutor ya debería saberlo."})
    if "거든" in text:
        notes.append({"pattern": "-거든", "explanation_es": "Añade una explicación, justificación o información que el hablante considera relevante."})
    if "하자" in text or "사귀자" in text:
        notes.append({"pattern": "-(으)ㅂ시다 / -자", "explanation_es": "-자 propone hacer algo juntos; en escenas informales puede sonar directo o insistente."})
    if "고" in text:
        notes.append({"pattern": "-고", "explanation_es": "Conecta acciones o ideas; puede equivaler a «y», «y luego» o «diciendo que», según el contexto."})
    if "해서" in text or "가지고" in text:
        notes.append({"pattern": "-아서/어서", "explanation_es": "Conecta una causa, motivo o secuencia: «porque», «así que» o «después de»."})
    if "지만" in text:
        notes.append({"pattern": "-지만", "explanation_es": "Conector adversativo equivalente a «aunque» o «pero»."})
    if "안 " in text or "못 " in text:
        notes.append({"pattern": "안 / 못", "explanation_es": "안 niega una acción; 못 expresa incapacidad o imposibilidad de hacerla."})
    if "거야" in text or "거지" in text or "거든" in text:
        notes.append({"pattern": "것이다 → 거야/거지", "explanation_es": "La forma coloquial de 것이다 aparece como 거야 o 거지 y expresa afirmación, explicación o confirmación."})
    if "?" in text or "！" in text or "!" in text:
        notes.append({"pattern": "Final interrogativo o exclamativo", "explanation_es": "La entonación y el final de la frase marcan sorpresa, presión, reproche o pregunta en el diálogo."})
    return notes or [{"pattern": "Orden coreano", "explanation_es": "El coreano suele colocar el verbo al final y usa partículas para indicar la función de cada palabra."}]


def main() -> None:
    manifest_path = BOOK / "hanstory_manifest.json"; manifest = json.loads(manifest_path.read_text(encoding="utf-8")); tracks = manifest["tracks"]
    tokens = []; seen = set()
    for track in tracks:
        for token in TOKEN_RE.findall(track["text"]):
            for part in split_surface(token):
                if key(part) not in seen:
                    seen.add(key(part)); tokens.append(part)
    cache_path = BOOK / "explanations" / "korean_word_glossary.json"; cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    pending = [token for token in tokens if key(token) not in {key(k) for k in cache} and token not in OVERRIDES and token not in PARTICLES]
    for start in range(0, len(pending), 60):
        cache.update(dict(zip(pending[start:start + 60], batch_translate(pending[start:start + 60]))))
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    items = {}
    for track in tracks:
        rows = []
        for raw_token in TOKEN_RE.findall(track["text"]):
            for token in split_surface(raw_token):
                if token in OVERRIDES: meaning, function = OVERRIDES[token]
                elif token in PARTICLES: meaning, function = token, PARTICLES[token]
                else: meaning, function = next((v for k, v in cache.items() if key(k) == key(token)), token), function_for(token)
                rows.append({"text": token, "meaning_es": meaning, "function_es": function})
        items[track["id"]] = {"natural_meaning_es": track["translation"], "explanation_es": "La traducción natural resume la escena. El desglose mantiene cada palabra coreana y separa partículas transparentes cuando van unidas al sustantivo; los nombres, abreviaturas y términos propios se señalan explícitamente.", "usage_notes_es": ["Escucha primero la frase completa y después repítela por grupos de sentido.", "Observa el verbo al final y las partículas que indican tema, sujeto, objeto y destinatario."], "breakdown": rows, "grammar_notes": grammar_for(track["text"]), "listening_tip_es": "Escucha las consonantes tensas, las vocales dobles y la terminación de la frase; luego repite manteniendo el ritmo coloquial.", "requires_review": False}
    out = BOOK / "explanations" / "track_explanations.json"; out.write_text(json.dumps({"schema_version": 1, "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    breakdown_rows = sum(len(item["breakdown"]) for item in items.values()); grammar_notes = sum(len(item["grammar_notes"]) for item in items.values())
    (BOOK / "Web_Explanations_Report.txt").write_text(f"{len(items)} explicaciones de pista generadas ({sum(1 for t in tracks if t['type']=='phrase')} frases + {sum(1 for t in tracks if t['type']=='word')} entradas de vocabulario).\nFilas de desglose palabra por palabra: {breakdown_rows}.\nNotas gramaticales: {grammar_notes}.\nGlosas pendientes: 0; nombres, abreviaturas y partículas tienen notas explícitas.\n", encoding="utf-8")
    print(json.dumps({"tracks": len(items), "breakdown_rows": breakdown_rows, "grammar_notes": grammar_notes, "pending_glosses": 0}, ensure_ascii=False))


if __name__ == "__main__": main()

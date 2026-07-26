#!/usr/bin/env python3
"""Añade práctica productiva a todos los cursos sin crear audio nuevo.

La fuente de verdad son pares ya publicados (texto objetivo + traducción) y sus
claves de audio. El script es idempotente: reemplaza el checkpoint generado.
"""
from __future__ import annotations

import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library" / "courses"
LANGUAGES = ("Arabic", "Chinese", "English", "French", "German", "Italian", "Japanese", "Korean", "Portuguese", "Russian")
LANGUAGE_LABELS = {
    "Arabic": "árabe",
    "Chinese": "chino",
    "English": "inglés",
    "French": "francés",
    "German": "alemán",
    "Italian": "italiano",
    "Japanese": "japonés",
    "Korean": "coreano",
    "Portuguese": "portugués",
    "Russian": "ruso",
}
SCRIPT_HEAVY = {"Chinese", "Japanese"}
READING_MARKERS = ("reading-foundations", "hangul", "hiragana", "katakana", "rhythm")
READING_LANGUAGE_MARKERS = (
    "se pronuncia",
    "sonido",
    "vocal",
    "consonante",
    "letra",
    "sílaba",
    "se lee",
    "el audio",
    "no vibra",
    "grafía",
)
TRAILING_PUNCTUATION = "。.!?！？؟…"


def dump(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def is_reading_focus(unit: dict, selected: list[dict]) -> bool:
    if any(marker in unit["id"] for marker in READING_MARKERS):
        return True
    explanatory = sum(
        any(marker in pair["meaning"].lower() for marker in READING_LANGUAGE_MARKERS)
        for pair in selected
    )
    return explanatory >= max(2, len(selected) // 2)


def pairs(unit: dict) -> list[dict]:
    found: list[dict] = []
    seen: set[str] = set()
    for lesson in unit.get("lessons", []):
        if lesson.get("generatedProduction"):
            continue
        for activity in lesson.get("activities", []):
            if activity.get("type") not in {"teach_concept", "teach_word", "teach_pattern"}:
                continue
            target = str(activity.get("target") or "").strip()
            meaning = str(activity.get("meaning") or activity.get("explanation") or "").strip()
            audio = str(activity.get("audio") or "").strip()
            if not target or not meaning or target in seen or not audio:
                continue
            seen.add(target)
            found.append({"target": target, "meaning": meaning, "audio": audio, "slow_audio": activity.get("slow_audio") or audio})
    return found


def blocks(text: str, language: str) -> tuple[list[str], str]:
    words = text.split()
    if len(words) > 1:
        tokens, joiner = words, " "
    elif language in SCRIPT_HEAVY or language == "Korean":
        tokens, joiner = list(text), ""
    else:
        tokens = [part for part in re.split(r"(?<=[aeiouyàâäéèêëîïôöùûü])", text, flags=re.I) if part]
        joiner = ""
    shuffled = list(tokens)
    random.Random(text).shuffle(shuffled)
    if shuffled == tokens and len(shuffled) > 1:
        shuffled = shuffled[1:] + shuffled[:1]
    return shuffled, joiner


def blank_activity(base: dict, prefix: str, language: str) -> dict:
    text = base["target"]
    core = text.rstrip(TRAILING_PUNCTUATION)
    suffix = text[len(core) :]
    words = core.split()
    if len(words) > 1:
        missing = words[-1]
        visible = " ".join(words[:-1] + ["___"]) + suffix
    else:
        chars = list(core)
        missing = chars[-1]
        visible = "".join(chars[:-1] + ["＿"]) + suffix
    return {
        "id": f"{prefix}-complete",
        "type": "complete_without_options",
        "prompt": "Completa el elemento que falta",
        "target": visible,
        "answer": missing,
        "accepted_answers": [missing],
        "explanation": f"La forma completa es «{text}»: {base['meaning']}",
        "audio": base["audio"],
        "slow_audio": base["slow_audio"],
        "tags": ["production", "completion", language.lower()],
        "xp": 15,
    }


def dialogue_activity(selected: list[dict], prefix: str, stage_final: bool, language: str) -> dict:
    count = min(3 if stage_final else 2, len(selected))
    turns: list[dict] = []
    for index in range(count):
        reply = selected[index]
        turns.extend(
            [
                {
                    "role": "model",
                    "speaker": "GUÍA",
                    "text": f"Situación {index + 1}",
                    "translation": f"Quieres expresar: «{reply['meaning']}».",
                },
                {
                    "role": "learner",
                    "speaker": "TÚ",
                    "prompt": f"Responde en {LANGUAGE_LABELS[language]}.",
                    "answer": reply["target"],
                    "accepted_answers": [reply["target"]],
                    "audio": reply["audio"],
                    "allow_minor_typos": True,
                    "speech_enabled": True,
                },
            ]
        )
    return {
        "id": f"{prefix}-dialogue",
        "type": "stage_scenario" if stage_final else "guided_dialogue",
        "prompt": "Misión final de la etapa" if stage_final else "Ensayo guiado de la unidad",
        "instruction": "Resuelve cada situación sin opciones. Puedes escribir, hablar o escuchar el modelo después de intentarlo.",
        "turns": turns,
        "minimum_correct": count,
        "answer": "",
        "explanation": "Repasa las respuestas que no coincidan y vuelve a decir el intercambio completo.",
        "tags": ["production", "dialogue", "stage-final" if stage_final else "unit-dialogue"],
        "xp": 30 if stage_final else 20,
    }


def checkpoint(language: str, unit: dict, stage_final: bool) -> dict | None:
    source = pairs(unit)
    if len(source) < 2:
        return None
    selected = source[-min(6, len(source)) :]
    first, second = selected[0], selected[1]
    options, joiner = blocks(first["target"], language)
    prefix = f"{language.lower()}-{unit['id']}-production"
    reading_only = is_reading_focus(unit, selected)
    first_prompt = (
        f"Copia este símbolo o grupo: «{first['target']}»"
        if reading_only
        else f"Escribe en {LANGUAGE_LABELS[language]}: «{first['meaning']}»"
    )
    first_visible = first["target"] if reading_only else first["meaning"]
    block_prompt = (
        "Reconstruye el símbolo, sílaba o grupo en el orden correcto"
        if reading_only
        else f"Construye la forma que significa «{first['meaning']}»"
    )
    activities = [
        {
            "id": f"{prefix}-intro",
            "type": "lesson_intro",
            "prompt": "Ahora te toca producir",
            "target": "",
            "answer": "",
            "explanation": "Usarás lo aprendido sin depender de respuestas visibles.",
            "audio": "",
            "slow_audio": "",
            "tags": ["production"],
            "xp": 2,
            "gradable": False,
        },
        {
            "id": f"{prefix}-translate",
            "type": "typed_translation",
            "prompt": first_prompt,
            "target": first_visible,
            "instruction": (
                "Obsérvalo, cópialo y fíjate en el orden de sus letras o trazos."
                if reading_only
                else "Escribe la idea completa sin mirar opciones."
            ),
            "answer": first["target"],
            "accepted_answers": [first["target"]],
            "allow_minor_typos": True,
            "explanation": f"Una respuesta correcta es «{first['target']}».",
            "audio": first["audio"],
            "slow_audio": first["slow_audio"],
            "tags": ["production", "copying" if reading_only else "translation"],
            "xp": 20,
        },
        {
            "id": f"{prefix}-dictation",
            "type": "dictation",
            "prompt": "Escucha y escribe exactamente lo que oyes",
            "target": "",
            "answer": second["target"],
            "accepted_answers": [second["target"]],
            "allow_minor_typos": True,
            "explanation": f"Escuchaste «{second['target']}»: {second['meaning']}",
            "audio": second["audio"],
            "slow_audio": second["slow_audio"],
            "tags": ["production", "dictation"],
            "xp": 20,
        },
        {
            "id": f"{prefix}-blocks",
            "type": "build_with_blocks",
            "prompt": block_prompt,
            "target": first_visible,
            "options": options,
            "joiner": joiner,
            "answer": first["target"],
            "accepted_answers": [first["target"]],
            "explanation": f"La forma completa es «{first['target']}».",
            "audio": first["audio"],
            "slow_audio": first["slow_audio"],
            "tags": ["production", "blocks"],
            "xp": 15,
        },
        blank_activity(second, prefix, language),
    ]
    if not reading_only:
        third = selected[min(2, len(selected) - 1)]
        activities.extend(
            [
                {
                    "id": f"{prefix}-open",
                    "type": "open_question",
                    "prompt": f"Responde sin opciones: «{third['meaning']}»",
                    "target": third["meaning"],
                    "answer": third["target"],
                    "accepted_answers": [third["target"]],
                    "allow_minor_typos": True,
                    "speech_enabled": True,
                    "explanation": f"Una respuesta adecuada es «{third['target']}».",
                    "audio": third["audio"],
                    "slow_audio": third["slow_audio"],
                    "tags": ["production", "open-answer"],
                    "xp": 20,
                },
                {
                    "id": f"{prefix}-speak",
                    "type": "speak_and_transcribe",
                    "prompt": f"Di en voz alta: «{second['meaning']}»",
                    "target": second["meaning"],
                    "answer": second["target"],
                    "accepted_answers": [second["target"]],
                    "allow_minor_typos": True,
                    "speech_enabled": True,
                    "optional": True,
                    "explanation": f"El modelo es «{second['target']}». También puedes escribirlo.",
                    "audio": second["audio"],
                    "slow_audio": second["slow_audio"],
                    "tags": ["production", "speaking", "optional"],
                    "xp": 15,
                },
                dialogue_activity(selected, prefix, stage_final, language),
            ]
        )
    return {
        "id": f"{prefix}-checkpoint",
        "title": "Producción y diálogo" if not reading_only else "Producción de lectura",
        "description": "Escribe, construye y responde usando lo aprendido en esta unidad.",
        "generatedProduction": True,
        "isUnitFinal": True,
        "xpReward": 35 if stage_final else 25,
        "activities": activities,
    }


def main() -> None:
    totals = {"languages": 0, "units": 0, "activities": 0}
    for language in LANGUAGES:
        course_path = COURSES / language / "course.json"
        course = json.loads(course_path.read_text(encoding="utf-8"))
        stage_ends = {level["unitIds"][-1] for level in course.get("levels", []) if level.get("unitIds")}
        language_units = 0
        for summary in course.get("units", []):
            path = COURSES / language / summary["manifest"]
            unit = json.loads(path.read_text(encoding="utf-8"))
            unit["lessons"] = [lesson for lesson in unit.get("lessons", []) if not lesson.get("generatedProduction")]
            lesson = checkpoint(language, unit, summary["id"] in stage_ends)
            if lesson:
                # La prueba final sigue siendo el último paso de la unidad.
                insert_at = len(unit["lessons"])
                while insert_at and unit["lessons"][insert_at - 1].get("isTest"):
                    insert_at -= 1
                unit["lessons"].insert(insert_at, lesson)
                language_units += 1
                totals["activities"] += len(lesson["activities"])
            dump(path, unit)
        course["version"] = max(int(course.get("version", 1)), 12)
        course["productionPractice"] = {
            "schemaVersion": 1,
            "inputModes": ["keyboard", "blocks", "microphone"],
            "speechOptional": True,
            "audioPolicy": "reuse-existing-only",
        }
        dump(course_path, course)
        totals["languages"] += 1
        totals["units"] += language_units
        print(f"{language}: {language_units} checkpoints")
    print(json.dumps(totals, ensure_ascii=False))


if __name__ == "__main__":
    main()

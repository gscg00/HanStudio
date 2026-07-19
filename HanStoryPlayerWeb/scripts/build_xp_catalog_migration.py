#!/usr/bin/env python3
"""Regenera el catálogo de XP desde los cursos que realmente publica la PWA."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COURSES = ROOT / "library" / "courses"
OUTPUT = ROOT / "supabase" / "migrations" / "004_guided_course_catalog.sql"
REWARDS = {"normal": 20, "short": 10, "test": 30, "unitFinal": 50, "review": 5}


def quoted(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def lesson_type(lesson: dict) -> str:
    if lesson.get("isReview"):
        return "review"
    if lesson.get("isTest"):
        return "test"
    if lesson.get("isUnitFinal"):
        return "unitFinal"
    return "normal"


rows: list[tuple[str, str, str, str, int, str, str]] = []
for course_path in sorted(COURSES.glob("*/course.json")):
    course = json.loads(course_path.read_text(encoding="utf-8"))
    language_id = str(course.get("language", course_path.parent.name)).lower()
    course_id = str(course["courseId"])
    for unit_ref in course.get("units", []):
        manifest = unit_ref.get("manifest")
        if not manifest:
            continue
        unit_path = course_path.parent / manifest
        unit = json.loads(unit_path.read_text(encoding="utf-8"))
        for lesson in unit.get("lessons", []):
            kind = lesson_type(lesson)
            reward = int(lesson.get("xpReward", REWARDS[kind]))
            rows.append((language_id, course_id, lesson["id"], kind, reward, unit["id"], course_path.parent.name))

values = ",\n".join(
    "  (" + ",".join((quoted(language), quoted(course), quoted(lesson), quoted(kind), str(reward), quoted(unit), quoted(directory))) + ")"
    for language, course, lesson, kind, reward, unit, directory in rows
)
sql = f"""begin;

-- Generado por scripts/build_xp_catalog_migration.py.
-- El cliente no elige la recompensa: Supabase solo acepta IDs publicados aquí.
insert into public.lesson_catalog(
  language_id,course_id,lesson_id,lesson_type,xp_reward,active,metadata
)
select language_id,course_id,lesson_id,lesson_type,xp_reward,true,
       jsonb_build_object('source','guided-course','unitId',unit_id,'directory',directory)
from (values
{values}
) as catalog(language_id,course_id,lesson_id,lesson_type,xp_reward,unit_id,directory)
on conflict(language_id,course_id,lesson_id) do update
set lesson_type=excluded.lesson_type,
    xp_reward=excluded.xp_reward,
    active=true,
    metadata=excluded.metadata;

-- lesson_catalog sigue siendo solo de lectura interna: complete_lesson es la
-- única función que concede XP y RLS permanece habilitado.
alter table public.lesson_catalog enable row level security;
revoke all on public.lesson_catalog from anon,authenticated;

commit;
"""
OUTPUT.write_text(sql, encoding="utf-8")
print(f"{OUTPUT}: {len(rows)} lecciones registradas")

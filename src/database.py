from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from .config import DATABASE_FILE


SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    title TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    folder_name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audio_assets (
    audio_id TEXT PRIMARY KEY COLLATE NOCASE,
    audio_type TEXT NOT NULL,
    speaker TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    translation TEXT NOT NULL DEFAULT '',
    tts_text TEXT NOT NULL DEFAULT '',
    voice_id TEXT NOT NULL DEFAULT '',
    model_id TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS book_audio (
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    audio_id TEXT NOT NULL REFERENCES audio_assets(audio_id),
    PRIMARY KEY (book_id, audio_id)
);
CREATE TABLE IF NOT EXISTS lesson_audio (
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    audio_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (book_id, lesson_number, position)
);
CREATE INDEX IF NOT EXISTS idx_audio_text ON audio_assets(text);
CREATE INDEX IF NOT EXISTS idx_audio_translation ON audio_assets(translation);
CREATE INDEX IF NOT EXISTS idx_lesson_audio_id ON lesson_audio(audio_id);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect(database_path: Path | None = None) -> Iterator[sqlite3.Connection]:
    database_path = database_path or DATABASE_FILE
    database_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize_database(database_path: Path | None = None) -> None:
    with connect(database_path) as connection:
        connection.executescript(SCHEMA)
        _ensure_column(connection, "audio_assets", "tts_text", "TEXT NOT NULL DEFAULT ''")
        _migrate_lesson_positions(connection)


def _ensure_column(
    connection: sqlite3.Connection, table: str, column: str, definition: str
) -> None:
    columns = {row["name"] for row in connection.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def _migrate_lesson_positions(connection: sqlite3.Connection) -> None:
    """Permite que un mismo audio aparezca varias veces en una lección."""
    columns = list(connection.execute("PRAGMA table_info(lesson_audio)"))
    primary_key = [
        row["name"] for row in sorted(columns, key=lambda item: item["pk"]) if row["pk"]
    ]
    expected = ["book_id", "lesson_number", "position"]
    if primary_key == expected:
        return
    connection.execute("DROP INDEX IF EXISTS idx_lesson_audio_id")
    connection.execute("DROP TABLE IF EXISTS lesson_audio_legacy")
    connection.execute("ALTER TABLE lesson_audio RENAME TO lesson_audio_legacy")
    connection.execute(
        "CREATE TABLE lesson_audio ("
        "book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE, "
        "lesson_number INTEGER NOT NULL, audio_id TEXT NOT NULL, position INTEGER NOT NULL, "
        "PRIMARY KEY (book_id, lesson_number, position))"
    )
    connection.execute(
        "INSERT INTO lesson_audio(book_id, lesson_number, audio_id, position) "
        "SELECT book_id, lesson_number, audio_id, position FROM lesson_audio_legacy"
    )
    connection.execute("DROP TABLE lesson_audio_legacy")
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_lesson_audio_id ON lesson_audio(audio_id)"
    )


def create_book_record(
    code: str, title: str, level: str, description: str, folder_name: str
) -> int:
    with connect() as connection:
        cursor = connection.execute(
            "INSERT INTO books(code, title, level, description, folder_name, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (code, title, level, description, folder_name, utc_now()),
        )
        return int(cursor.lastrowid)


def list_book_records() -> list[sqlite3.Row]:
    with connect() as connection:
        return list(connection.execute("SELECT * FROM books ORDER BY created_at, id"))


def get_book_record(book_id: int) -> sqlite3.Row | None:
    with connect() as connection:
        return connection.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()


def get_audio_asset(audio_id: str) -> sqlite3.Row | None:
    with connect() as connection:
        return connection.execute(
            "SELECT * FROM audio_assets WHERE audio_id = ?", (audio_id,)
        ).fetchone()


def register_audio_asset(
    *, audio_id: str, audio_type: str, speaker: str, text: str, translation: str,
    voice_id: str, model_id: str, file_name: str, tts_text: str = ""
) -> None:
    with connect() as connection:
        connection.execute(
            "INSERT INTO audio_assets(audio_id, audio_type, speaker, text, translation, "
            "tts_text, voice_id, model_id, file_name, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(audio_id) DO UPDATE SET audio_type=excluded.audio_type, "
            "speaker=excluded.speaker, text=excluded.text, translation=excluded.translation, "
            "tts_text=excluded.tts_text, voice_id=excluded.voice_id, "
            "model_id=excluded.model_id, file_name=excluded.file_name",
            (
                audio_id, audio_type, speaker, text, translation, tts_text, voice_id, model_id,
                file_name, utc_now(),
            ),
        )


def link_audio_to_book(book_id: int, audio_id: str) -> None:
    with connect() as connection:
        connection.execute(
            "INSERT OR IGNORE INTO book_audio(book_id, audio_id) VALUES (?, ?)",
            (book_id, audio_id),
        )


def replace_lesson_links(book_id: int, lessons: dict[int, list[str]]) -> None:
    with connect() as connection:
        connection.execute("DELETE FROM lesson_audio WHERE book_id = ?", (book_id,))
        connection.executemany(
            "INSERT INTO lesson_audio(book_id, lesson_number, audio_id, position) "
            "VALUES (?, ?, ?, ?)",
            [
                (book_id, lesson, audio_id, position)
                for lesson, audio_ids in lessons.items()
                for position, audio_id in enumerate(audio_ids, start=1)
            ],
        )


def search_audio(query: str) -> list[sqlite3.Row]:
    pattern = f"%{query.strip()}%"
    with connect() as connection:
        return list(
            connection.execute(
                "SELECT a.*, GROUP_CONCAT(DISTINCT b.title) AS books "
                "FROM audio_assets a "
                "LEFT JOIN book_audio ba ON ba.audio_id = a.audio_id "
                "LEFT JOIN books b ON b.id = ba.book_id "
                "WHERE a.audio_id LIKE ? OR a.text LIKE ? OR a.translation LIKE ? "
                "GROUP BY a.audio_id ORDER BY a.audio_id",
                (pattern, pattern, pattern),
            )
        )

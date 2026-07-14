from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path

from .book_manager import Book


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"}
SUPPORTED_EXTENSIONS = {".txt", ".html", ".htm", ".epub", ".pdf", ".mobi"} | IMAGE_EXTENSIONS


@dataclass
class SourceSection:
    section_id: str
    title: str
    text: str = ""
    page_number: int | None = None
    image_path: str = ""
    ocr_used: bool = False
    ocr_warning: str = ""
    reviewed: bool = False


@dataclass
class SourceRecord:
    source_id: str
    file_path: str
    original_path: str
    file_type: str
    detected_text_available: bool
    needs_ocr: bool
    source_language: str
    notes: str = ""
    status: str = ""
    extraction_error: str = ""
    sections: list[SourceSection] = field(default_factory=list)


@dataclass
class SourceSegment:
    segment_id: str
    title: str
    source_text: str
    target_text: str = ""
    explanation: str = ""
    key_translation: str = ""
    source_section_ids: list[str] = field(default_factory=list)
    key_phrases: str = ""
    vocabulary: str = ""
    mini_practice: str = ""
    notes: str = ""
    status: str = "Fuente extraída"


def sources_dir(book: Book) -> Path:
    path = book.folder / "sources"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _index_path(book: Book) -> Path:
    return sources_dir(book) / "index.json"


def _record_path(book: Book, source_id: str) -> Path:
    return sources_dir(book) / source_id / "source.json"


def _segments_path(book: Book, source_id: str) -> Path:
    return sources_dir(book) / source_id / "segments.json"


def list_sources(book: Book) -> list[SourceRecord]:
    path = _index_path(book)
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    records: list[SourceRecord] = []
    for item in raw:
        source_id = item if isinstance(item, str) else item.get("source_id", "") if isinstance(item, dict) else ""
        record_path = _record_path(book, source_id) if source_id else None
        if record_path is not None and record_path.exists():
            records.append(_record_from_dict(json.loads(record_path.read_text(encoding="utf-8"))))
        elif isinstance(item, dict):
            # Migra índices creados por una versión preliminar que incluían todo el texto.
            records.append(_record_from_dict(item))
    return records


def _record_from_dict(raw: dict) -> SourceRecord:
    sections = [SourceSection(**item) for item in raw.get("sections", []) if isinstance(item, dict)]
    allowed = SourceRecord.__dataclass_fields__
    values = {key: value for key, value in raw.items() if key in allowed and key != "sections"}
    return SourceRecord(**values, sections=sections)


def save_source(book: Book, record: SourceRecord) -> None:
    path = _record_path(book, record.source_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(asdict(record), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    records = list_sources(book)
    source_ids = [item.source_id for item in records]
    if record.source_id not in source_ids:
        source_ids.append(record.source_id)
    _index_path(book).write_text(
        json.dumps(source_ids, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def get_source(book: Book, source_id: str) -> SourceRecord:
    for record in list_sources(book):
        if record.source_id == source_id:
            return record
    raise ValueError("La fuente seleccionada ya no existe.")


def detect_language(text: str) -> str:
    sample = text[:10000]
    if re.search(r"[가-힣]", sample):
        return "Korean"
    if re.search(r"[ぁ-ゟ゠-ヿ]", sample):
        return "Japanese"
    if re.search(r"[А-Яа-яЁё]", sample):
        return "Russian"
    if re.search(r"[一-鿿]", sample):
        return "Chinese"
    return "Unknown / Latin script"


def import_source(book: Book, source: str | Path, source_language: str) -> SourceRecord:
    source_path = Path(source).expanduser().resolve()
    if not source_path.exists():
        raise ValueError("La fuente seleccionada no existe.")
    if source_path.is_file() and source_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Formato no compatible: {source_path.suffix or 'sin extensión'}")
    source_id = uuid.uuid4().hex[:12]
    root = sources_dir(book) / source_id
    files_dir = root / "files"
    files_dir.mkdir(parents=True)
    if source_path.is_dir():
        images = [p for p in sorted(source_path.iterdir()) if p.suffix.lower() in IMAGE_EXTENSIONS]
        if not images:
            raise ValueError("La carpeta no contiene imágenes compatibles.")
        stored = files_dir / source_path.name
        stored.mkdir()
        for image in images:
            shutil.copy2(image, stored / image.name)
        file_type = "image_folder"
    else:
        stored = files_dir / source_path.name
        shutil.copy2(source_path, stored)
        file_type = source_path.suffix.lower().lstrip(".")
    record = SourceRecord(
        source_id=source_id,
        file_path=str(stored),
        original_path=str(source_path),
        file_type=file_type,
        detected_text_available=False,
        needs_ocr=False,
        source_language=source_language,
    )
    _extract(record)
    detected = detect_language("\n".join(section.text for section in record.sections))
    if not record.source_language or record.source_language == "Auto":
        record.source_language = detected
    record.notes = f"Idioma detectado localmente: {detected}"
    save_source(book, record)
    return record


def _clean_html(raw: bytes | str) -> tuple[str, str]:
    try:
        from bs4 import BeautifulSoup
    except ImportError as exc:
        raise RuntimeError("Falta beautifulsoup4. Vuelve a abrir la app con internet.") from exc
    soup = BeautifulSoup(raw, "html.parser")
    title_node = soup.find(["h1", "h2", "title"])
    title = title_node.get_text(" ", strip=True) if title_node else "Documento"
    return title, soup.get_text("\n", strip=True)


def _extract_html_sections(raw: bytes | str) -> list[SourceSection]:
    try:
        from bs4 import BeautifulSoup
    except ImportError as exc:
        raise RuntimeError("Falta beautifulsoup4. Vuelve a abrir la app con internet.") from exc
    soup = BeautifulSoup(raw, "html.parser")
    sections: list[SourceSection] = []
    title = "Documento"
    content: list[str] = []
    for node in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote"]):
        text = node.get_text(" ", strip=True)
        if not text:
            continue
        if node.name.startswith("h"):
            if content:
                sections.append(SourceSection(f"section-{len(sections) + 1}", title, "\n".join(content)))
                content = []
            title = text
        else:
            content.append(text)
    if content:
        sections.append(SourceSection(f"section-{len(sections) + 1}", title, "\n".join(content)))
    if not sections:
        fallback_title, text = _clean_html(raw)
        sections = [SourceSection("section-1", fallback_title, text)]
    return sections


def _extract(record: SourceRecord) -> None:
    path = Path(record.file_path)
    try:
        if record.file_type == "txt":
            try:
                text = path.read_text(encoding="utf-8-sig")
            except UnicodeDecodeError:
                text = path.read_text(encoding="latin-1")
            record.sections = [SourceSection("section-1", path.stem, text.strip())]
        elif record.file_type in {"html", "htm"}:
            record.sections = _extract_html_sections(path.read_bytes())
        elif record.file_type == "epub":
            record.sections = _extract_epub(path)
        elif record.file_type == "pdf":
            record.sections = _extract_pdf(path)
        elif record.file_type in {"png", "jpg", "jpeg", "tif", "tiff", "webp"}:
            record.sections = [SourceSection("page-1", path.name, image_path=str(path), page_number=1)]
            record.needs_ocr = True
        elif record.file_type == "image_folder":
            record.sections = [
                SourceSection(f"page-{i}", image.name, image_path=str(image), page_number=i)
                for i, image in enumerate(
                    [p for p in sorted(path.iterdir()) if p.suffix.lower() in IMAGE_EXTENSIONS], start=1
                )
            ]
            record.needs_ocr = True
        elif record.file_type == "mobi":
            record.sections = _extract_mobi(path)
        text_length = sum(len(section.text.strip()) for section in record.sections)
        record.detected_text_available = text_length >= 30
        if record.file_type == "pdf":
            record.needs_ocr = text_length < max(80, len(record.sections) * 30)
            record.status = "PDF escaneado — OCR recomendado" if record.needs_ocr else "PDF con texto real"
        elif record.needs_ocr:
            record.status = "OCR recomendado"
        else:
            record.status = "Texto extraído"
    except Exception as exc:
        record.extraction_error = str(exc)
        record.status = "No se pudo extraer texto"
        if record.file_type == "mobi":
            record.extraction_error = (
                "Este MOBI no pudo extraerse directamente. Convierte a EPUB/PDF o usa imágenes. "
                + str(exc)
            )


def _extract_pdf(path: Path) -> list[SourceSection]:
    try:
        import pymupdf
    except ImportError as exc:
        raise RuntimeError("Falta PyMuPDF. Vuelve a abrir la app con internet.") from exc
    sections = []
    with pymupdf.open(path) as document:
        for index, page in enumerate(document, start=1):
            sections.append(SourceSection(f"page-{index}", f"Página {index}", page.get_text("text", sort=True).strip(), index))
    return sections


def _extract_epub(path: Path) -> list[SourceSection]:
    try:
        from ebooklib import ITEM_DOCUMENT, epub
    except ImportError as exc:
        raise RuntimeError("Falta EbookLib. Vuelve a abrir la app con internet.") from exc
    book = epub.read_epub(str(path))
    sections = []
    for index, item in enumerate(book.get_items_of_type(ITEM_DOCUMENT), start=1):
        title, text = _clean_html(item.get_content())
        if text.strip():
            sections.append(SourceSection(f"chapter-{index}", title or f"Capítulo {index}", text))
    return sections


def _extract_mobi(path: Path) -> list[SourceSection]:
    converter = shutil.which("ebook-convert")
    if not converter:
        raise RuntimeError("No se encontró la herramienta opcional ebook-convert (Calibre).")
    with tempfile.TemporaryDirectory() as temporary:
        epub_path = Path(temporary) / "converted.epub"
        process = subprocess.run([converter, str(path), str(epub_path)], capture_output=True, text=True)
        if process.returncode != 0 or not epub_path.exists():
            raise RuntimeError(process.stderr.strip() or "Calibre no pudo convertir el MOBI.")
        return _extract_epub(epub_path)


def ocr_available() -> bool:
    return shutil.which("tesseract") is not None


OCR_LANGUAGES = {
    "Spanish": "spa", "English": "eng", "Korean": "kor", "Japanese": "jpn",
    "Russian": "rus", "Italian": "ita", "French": "fra", "German": "deu",
}


def run_ocr(book: Book, record: SourceRecord, start_page: int = 1, end_page: int | None = None) -> SourceRecord:
    if not ocr_available():
        raise RuntimeError("OCR local no disponible. Instala Tesseract con: brew install tesseract tesseract-lang")
    try:
        import pymupdf
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Faltan dependencias OCR. Vuelve a abrir la app con internet.") from exc
    end_page = end_page or len(record.sections)
    language = OCR_LANGUAGES.get(record.source_language, "eng")
    output_dir = _record_path(book, record.source_id).parent / "ocr_pages"
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf = pymupdf.open(record.file_path) if record.file_type == "pdf" else None
    try:
        for index, section in enumerate(record.sections, start=1):
            if index < start_page or index > end_page:
                continue
            if pdf is not None:
                pixmap = pdf[index - 1].get_pixmap(dpi=220, alpha=False)
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            elif section.image_path:
                image = Image.open(section.image_path)
            else:
                continue
            text = pytesseract.image_to_string(image, lang=language).strip()
            section.text = text
            section.ocr_used = True
            section.ocr_warning = _ocr_warning(text)
            (output_dir / f"page_{index:04d}.txt").write_text(text + "\n", encoding="utf-8")
    finally:
        if pdf is not None:
            pdf.close()
    record.detected_text_available = any(section.text.strip() for section in record.sections)
    record.needs_ocr = any(not section.text.strip() for section in record.sections)
    record.status = "OCR completado — revisión manual necesaria"
    save_source(book, record)
    return record


def _ocr_warning(text: str) -> str:
    if len(text.strip()) < 20:
        return "Muy poco texto detectado"
    strange = len(re.findall(r"[�□■]", text))
    return "Posibles caracteres no reconocidos" if strange else ""


def load_segments(book: Book, source_id: str) -> list[SourceSegment]:
    path = _segments_path(book, source_id)
    if not path.exists():
        return []
    return [SourceSegment(**item) for item in json.loads(path.read_text(encoding="utf-8"))]


def save_segments(book: Book, source_id: str, segments: list[SourceSegment]) -> None:
    path = _segments_path(book, source_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps([asdict(item) for item in segments], ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def segment_source(book: Book, record: SourceRecord, mode: str, words_per_segment: int = 500) -> list[SourceSegment]:
    chunks: list[tuple[str, str, list[str]]] = []
    if mode in {"chapter", "page", "manual"}:
        chunks = [(section.title, section.text, [section.section_id]) for section in record.sections if section.text.strip()]
    else:
        full = "\n\n".join(section.text for section in record.sections if section.text.strip())
        if mode == "words":
            words = full.split()
            chunks = [(f"Bloque {i // words_per_segment + 1}", " ".join(words[i:i + words_per_segment]), []) for i in range(0, len(words), words_per_segment)]
        elif mode == "scene":
            parts = re.split(r"\n\s*(?:\*\s*\*\s*\*|#{1,6}\s+.+|ESCENA\s+\d+)\s*\n|\n{3,}", full, flags=re.IGNORECASE)
            chunks = [(f"Escena {i}", part.strip(), []) for i, part in enumerate(parts, start=1) if part.strip()]
        elif mode == "dialogue":
            paragraphs = [p.strip() for p in re.split(r"\n\s*\n", full) if p.strip()]
            chunks = [(f"Diálogo {i}", p, []) for i, p in enumerate(paragraphs, start=1)]
    ocr_sections = [section for section in record.sections if section.ocr_used]
    initial_status = (
        "OCR revisado"
        if ocr_sections and all(section.reviewed for section in ocr_sections)
        else "Fuente extraída"
    )
    segments = [
        SourceSegment(f"segment-{index:03d}", title or f"Unidad {index}", text.strip(), source_section_ids=ids, status=initial_status)
        for index, (title, text, ids) in enumerate(chunks, start=1)
        if text.strip()
    ]
    save_segments(book, record.source_id, segments)
    return segments


def review_summary(record: SourceRecord, segments: list[SourceSegment]) -> dict[str, object]:
    text = "\n".join(segment.target_text or segment.source_text for segment in segments)
    warnings = [section.ocr_warning for section in record.sections if section.ocr_warning]
    if any(len(segment.target_text or segment.source_text) > 5000 for segment in segments):
        warnings.append("Hay segmentos de más de 5,000 caracteres.")
    return {
        "segments": len(segments),
        "detected_language": detect_language(text),
        "characters": len(text),
        "estimated_audios": sum(max(1, len(re.findall(r"[.!?。！？]+", segment.target_text or segment.source_text))) for segment in segments),
        "warnings": warnings,
    }

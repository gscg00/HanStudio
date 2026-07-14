from __future__ import annotations

from pathlib import Path


REPORT_NAMES = (
    "audios_generados.txt", "audios_existentes.txt", "audios_faltantes.txt",
    "errores.txt", "resumen_libro.txt", "distribucion_por_leccion.txt",
    "reporte_generacion.txt",
    "Anki_Export_Report.txt",
    "Creative_Generation_Report.txt",
)


def ensure_reports(reports_dir: Path) -> None:
    reports_dir.mkdir(parents=True, exist_ok=True)
    for name in REPORT_NAMES:
        path = reports_dir / name
        if not path.exists():
            write_report(reports_dir, name, [])


def write_report(reports_dir: Path, filename: str, lines: list[str]) -> Path:
    reports_dir.mkdir(parents=True, exist_ok=True)
    content = "\n".join(str(line) for line in lines) if lines else "Ninguno"
    path = reports_dir / filename
    path.write_text(content + "\n", encoding="utf-8")
    return path

from pathlib import Path

APP = (Path(__file__).resolve().parents[1] / "src/app.js").read_text(encoding="utf-8")

def test_local_import_prefers_manifest_and_csv_metadata():
    assert "hanstory_manifest.json" in APP
    assert "Audio_Master.csv" in APP
    assert "m.text||" in APP
    assert "translation_or_blank" in APP

def test_local_import_resolves_ids_and_deduplicates_by_mode():
    assert "function audioId" in APP
    assert "const chosen=new Map()" in APP
    assert "POD[A-Z]*|V?\\d{3,}|P\\d+" in APP

def test_filename_is_only_a_fallback():
    assert "filenameFallback:!m.text" in APP
    assert "text:m.text||" in APP

def test_diagnostics_are_available():
    for label in ("manifest encontrado", "pistas en Lección 0", "duplicados por ID", "metadata sin archivo"):
        assert label in APP

def test_diagnostics_are_not_exposed_in_normal_book_view():
    detail = APP.split("function renderDetail",1)[1].split("async function startPlayer",1)[0]
    assert 'id="diagnostics"' not in detail
    assert 'diagnostic-panel' not in detail

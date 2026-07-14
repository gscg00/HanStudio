from __future__ import annotations

import subprocess
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from ..book_manager import Book
from ..config import (
    get_openai_api_key, save_creative_api_key,
    save_openai_api_key,
)
from ..creative_engine import available_engines, get_engine, process_segment, test_creative_runtime
from ..project_config import load_project_config, save_project_config
from ..source_lesson_generator import (
    LessonGenerationOptions, apply_generated_package, generate_lessons_from_source,
    write_creative_report,
)
from ..source_manager import (
    get_source,
    import_source,
    list_sources,
    load_segments,
    ocr_available,
    review_summary,
    run_ocr,
    save_segments,
    save_source,
    segment_source,
)


LANGUAGES = ("Auto", "Spanish", "English", "Korean", "Japanese", "Russian", "Italian", "French", "German", "Chinese")
COPYRIGHT_NOTICE = (
    "Usa esta función solo con material propio, material de dominio público o material que "
    "tengas derecho a transformar para uso personal. Para materiales comerciales, se "
    "recomienda generar lecciones basadas en fragmentos o escenas, no recrear libros completos."
)


class SourcesPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=12)
        self.book: Book | None = None
        self.records = []
        self.current_source = None
        self.segments = []
        self.current_segment_index: int | None = None
        self.last_output: Path | None = None
        self.source_language = tk.StringVar(value="Korean")
        self.target_language = tk.StringVar(value="Korean")
        self.explanation_language = tk.StringVar(value="Spanish")
        self.script_type = tk.StringVar(value="Auto")
        self.romanization = tk.BooleanVar(value=False)
        self.allow_unreviewed = tk.BooleanVar(value=False)

        ttk.Label(self, text="Fuentes", font=("Helvetica", 18, "bold")).pack(anchor="w")
        ttk.Label(self, text=COPYRIGHT_NOTICE, wraplength=870, foreground="#805500").pack(anchor="w", pady=(3, 8))
        self.tabs = ttk.Notebook(self)
        self.tabs.pack(fill="both", expand=True)
        self.import_tab = ttk.Frame(self.tabs, padding=10)
        self.segments_tab = ttk.Frame(self.tabs, padding=10)
        self.creative_tab = ttk.Frame(self.tabs, padding=10)
        self.generate_tab = ttk.Frame(self.tabs, padding=10)
        self.tabs.add(self.import_tab, text="Importar y revisar texto")
        self.tabs.add(self.segments_tab, text="Segmentos")
        self.tabs.add(self.creative_tab, text="Motor creativo")
        self.tabs.add(self.generate_tab, text="Generar lecciones")
        self._build_import_tab()
        self._build_segments_tab()
        self._build_creative_tab()
        self._build_generate_tab()

    def _build_import_tab(self) -> None:
        language = ttk.LabelFrame(self.import_tab, text="Idiomas del proyecto", padding=8)
        language.pack(fill="x")
        for column, (label, variable) in enumerate((
            ("Idioma fuente", self.source_language), ("Idioma objetivo", self.target_language),
            ("Explicaciones", self.explanation_language), ("Sistema de escritura", self.script_type),
        )):
            ttk.Label(language, text=label).grid(row=0, column=column, sticky="w", padx=4)
            values = LANGUAGES if column < 3 else ("Auto", "Latin", "Cyrillic", "Hangul", "Kana/Kanji", "Hanzi")
            ttk.Combobox(language, textvariable=variable, values=values, width=16).grid(row=1, column=column, padx=4)
        ttk.Checkbutton(language, text="Romanización", variable=self.romanization).grid(row=1, column=4, padx=8)
        ttk.Button(language, text="Guardar idiomas", command=self.save_languages).grid(row=1, column=5, padx=4)

        actions = ttk.Frame(self.import_tab)
        actions.pack(fill="x", pady=8)
        ttk.Button(actions, text="Importar archivo", command=self.choose_file).pack(side="left", padx=(0, 6))
        ttk.Button(actions, text="Importar carpeta de imágenes", command=self.choose_folder).pack(side="left", padx=(0, 6))
        ttk.Button(actions, text="Ejecutar OCR", command=self.start_ocr).pack(side="left", padx=(0, 6))
        ttk.Label(actions, text="Páginas").pack(side="left", padx=(10, 3))
        self.ocr_start = tk.StringVar(value="1")
        self.ocr_end = tk.StringVar(value="")
        ttk.Entry(actions, textvariable=self.ocr_start, width=5).pack(side="left")
        ttk.Label(actions, text="a").pack(side="left", padx=3)
        ttk.Entry(actions, textvariable=self.ocr_end, width=5).pack(side="left")
        self.ocr_status = ttk.Label(actions, text="OCR local disponible" if ocr_available() else "OCR no instalado")
        self.ocr_status.pack(side="right")

        body = ttk.Panedwindow(self.import_tab, orient="horizontal")
        body.pack(fill="both", expand=True)
        left = ttk.Frame(body)
        right = ttk.Frame(body)
        body.add(left, weight=1)
        body.add(right, weight=3)
        self.source_list = tk.Listbox(left, width=30)
        self.source_list.pack(fill="both", expand=True)
        self.source_list.bind("<<ListboxSelect>>", self._source_selected)
        self.source_status = ttk.Label(left, text="Selecciona un libro.", wraplength=220)
        self.source_status.pack(fill="x", pady=5)
        self.section_choice = tk.StringVar()
        self.section_combo = ttk.Combobox(right, textvariable=self.section_choice, state="readonly")
        self.section_combo.pack(fill="x")
        self.section_combo.bind("<<ComboboxSelected>>", self._section_selected)
        self.source_text = tk.Text(right, wrap="word", undo=True)
        self.source_text.pack(fill="both", expand=True, pady=5)
        ttk.Button(right, text="Guardar corrección manual", command=self.save_section_text).pack(anchor="e")

    def _build_segments_tab(self) -> None:
        controls = ttk.Frame(self.segments_tab)
        controls.pack(fill="x")
        self.segment_mode = tk.StringVar(value="Por capítulo/página")
        ttk.Combobox(
            controls, textvariable=self.segment_mode, state="readonly",
            values=("Por capítulo/página", "Cada X palabras", "Manual", "Por escenas detectadas", "Por diálogo detectado"),
            width=26,
        ).pack(side="left")
        self.words_count = tk.StringVar(value="500")
        ttk.Entry(controls, textvariable=self.words_count, width=7).pack(side="left", padx=6)
        ttk.Button(controls, text="Dividir fuente", command=self.create_segments).pack(side="left")
        ttk.Button(controls, text="Guardar unidad", command=self.save_segment_editor).pack(side="right")
        body = ttk.Panedwindow(self.segments_tab, orient="horizontal")
        body.pack(fill="both", expand=True, pady=(8, 0))
        self.segment_list = tk.Listbox(body, width=28)
        self.segment_list.bind("<<ListboxSelect>>", self._segment_selected)
        editor = ttk.Frame(body)
        body.add(self.segment_list, weight=1)
        body.add(editor, weight=3)
        self.segment_title = tk.StringVar()
        ttk.Entry(editor, textvariable=self.segment_title).pack(fill="x")
        self.segment_source_text = self._labeled_text(editor, "Texto fuente", 5)
        self.segment_target_text = self._labeled_text(editor, "Texto objetivo revisado", 5)
        self.segment_explanation = self._labeled_text(editor, "Explicación", 3)
        self.segment_key = self._labeled_text(editor, "Traducción de frase clave", 2)

    def _labeled_text(self, parent, label: str, height: int):
        ttk.Label(parent, text=label).pack(anchor="w", pady=(5, 0))
        widget = tk.Text(parent, height=height, wrap="word", undo=True)
        widget.pack(fill="both", expand=True)
        return widget

    def _build_generate_tab(self) -> None:
        form = ttk.LabelFrame(self.generate_tab, text="Parámetros", padding=10)
        form.pack(fill="x")
        self.level = tk.StringVar(value="A1")
        self.style = tk.StringVar(value="HanStory normal")
        self.generation_mode = tk.StringVar(value="extraer frases y explicar")
        self.no_translation = tk.BooleanVar(value=False)
        self.create_anki = tk.BooleanVar(value=False)
        for row, (label, variable, values) in enumerate((
            ("Nivel", self.level, ("A0", "A1", "A2", "B1", "B2")),
            ("Estilo", self.style, ("HanStory normal", "Assimil-like", "RPG/Isekai", "Variety show", "Manga/comic", "Solo vocabulario")),
            ("Modo", self.generation_mode, ("traducir/adaptar", "crear lecciones originales basadas en la escena", "extraer frases y explicar", "limpiar y rehacer lección")),
        )):
            ttk.Label(form, text=label).grid(row=row, column=0, sticky="w", pady=3)
            ttk.Combobox(form, textvariable=variable, values=values, state="readonly", width=45).grid(row=row, column=1, sticky="ew", padx=8)
        ttk.Checkbutton(form, text="No mostrar traducción completa", variable=self.no_translation).grid(row=3, column=0, columnspan=2, sticky="w", pady=4)
        ttk.Checkbutton(form, text="Crear Anki de borrador", variable=self.create_anki).grid(row=4, column=0, columnspan=2, sticky="w")
        ttk.Checkbutton(
            form,
            text="Permitir usar borradores no revisados",
            variable=self.allow_unreviewed,
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=(4, 0))
        form.columnconfigure(1, weight=1)
        buttons = ttk.Frame(self.generate_tab)
        buttons.pack(fill="x", pady=8)
        ttk.Button(buttons, text="Revisar antes de generar", command=self.show_review).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Generar lecciones desde fuente", command=self.generate_lessons).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Abrir última salida", command=self.open_last_output).pack(side="left")
        ttk.Button(buttons, text="Usar paquete en este proyecto", command=self.apply_last_output).pack(side="left", padx=6)
        self.review_text = tk.Text(self.generate_tab, wrap="word")
        self.review_text.pack(fill="both", expand=True)

    def _build_creative_tab(self) -> None:
        settings = ttk.LabelFrame(self.creative_tab, text="Proveedor configurable", padding=8)
        settings.pack(fill="x")
        self.creative_provider = tk.StringVar(value="Manual / Placeholder")
        self.creative_model = tk.StringVar()
        self.creative_api_key = tk.StringVar()
        self.creative_temperature = tk.StringVar(value="0.3")
        self.creative_max_tokens = tk.StringVar(value="4000")
        fields = (
            ("Proveedor", self.creative_provider), ("Modelo", self.creative_model),
            ("OPENAI_API_KEY / API key", self.creative_api_key), ("Temperatura", self.creative_temperature),
            ("Max tokens", self.creative_max_tokens),
        )
        for column, (label, variable) in enumerate(fields):
            ttk.Label(settings, text=label).grid(row=0, column=column, sticky="w", padx=3)
            if column == 0:
                widget = ttk.Combobox(settings, textvariable=variable, values=available_engines(), state="readonly", width=20)
                widget.bind("<<ComboboxSelected>>", self._creative_provider_selected)
            elif column == 1:
                widget = ttk.Combobox(
                    settings,
                    textvariable=variable,
                    values=("gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"),
                    width=16,
                )
            else:
                widget = ttk.Entry(settings, textvariable=variable, width=16, show="•" if column == 2 else "")
            widget.grid(row=1, column=column, sticky="ew", padx=3)
        ttk.Button(settings, text="Guardar motor", command=self.save_creative_settings).grid(row=1, column=5, padx=4)
        ttk.Button(settings, text="Probar conexión OpenAI", command=self.test_openai_connection).grid(row=1, column=6, padx=4)

        controls = ttk.Frame(self.creative_tab)
        controls.pack(fill="x", pady=7)
        self.creative_segment = tk.StringVar()
        self.creative_segment_combo = ttk.Combobox(controls, textvariable=self.creative_segment, state="readonly", width=28)
        self.creative_segment_combo.pack(side="left", padx=(0, 5))
        self.creative_segment_combo.bind("<<ComboboxSelected>>", self._creative_segment_selected)
        self.creative_level = tk.StringVar(value="A1")
        ttk.Combobox(controls, textvariable=self.creative_level, values=("A0", "A1", "A2", "B1", "B2", "Libre / avanzado"), state="readonly", width=16).pack(side="left", padx=4)
        self.creative_mode = tk.StringVar(value="Adaptación didáctica")
        ttk.Combobox(
            controls,
            textvariable=self.creative_mode,
            values=("Traducción fiel", "Adaptación didáctica", "Lección basada en escena", "Limpieza de curso", "Manga/comic"),
            state="readonly",
            width=24,
        ).pack(side="left", padx=4)
        self.allow_original_dialogue = tk.BooleanVar(value=False)
        ttk.Checkbutton(controls, text="Permitir diálogos originales", variable=self.allow_original_dialogue).pack(side="left", padx=4)
        self.creative_status = ttk.Label(controls, text="Sin segmento")
        self.creative_status.pack(side="right")

        buttons = ttk.Frame(self.creative_tab)
        buttons.pack(fill="x", pady=(0, 3))
        for label, command in (
            ("Generar borrador de traducción", lambda: self.generate_creative_draft("translation", "Traducción fiel")),
            ("Generar borrador de adaptación", lambda: self.generate_creative_draft("lesson", "Adaptación didáctica")),
            ("Generar lección desde segmento", lambda: self.generate_creative_draft("lesson", self.creative_mode.get())),
        ):
            ttk.Button(buttons, text=label, command=command).pack(side="left", padx=(0, 4))
        states = ttk.Frame(self.creative_tab)
        states.pack(fill="x", pady=(0, 7))
        for label, command in (
            ("Generar explicación gramatical", lambda: self.generate_creative_draft("explanations", self.creative_mode.get())),
            ("Generar vocabulario", lambda: self.generate_creative_draft("vocab", self.creative_mode.get())),
            ("Marcar revisado", self.mark_segment_reviewed),
            ("Marcar listo para aplicar", self.mark_segment_ready),
            ("Aplicar al proyecto", self.apply_last_output),
        ):
            ttk.Button(states, text=label, command=command).pack(side="left", padx=(0, 4))

        body = ttk.Panedwindow(self.creative_tab, orient="horizontal")
        body.pack(fill="both", expand=True)
        left = ttk.Frame(body)
        right = ttk.Frame(body)
        body.add(left, weight=1)
        body.add(right, weight=1)
        self.creative_source = self._labeled_text(left, "Texto fuente", 8)
        self.creative_target = self._labeled_text(left, "Texto objetivo generado", 8)
        self.creative_explanation = self._labeled_text(right, "Explicación", 4)
        self.creative_key_phrases = self._labeled_text(right, "Frases clave", 3)
        self.creative_vocab = self._labeled_text(right, "Vocabulario", 4)
        self.creative_practice = self._labeled_text(right, "Mini práctica", 3)
        self.creative_notes = self._labeled_text(right, "Notas", 3)

    def set_book(self, book: Book) -> None:
        self.book = book
        config = load_project_config(book)
        self.source_language.set(config.source_language)
        self.target_language.set(config.target_language)
        self.explanation_language.set(config.explanation_language)
        self.script_type.set(config.script_type)
        self.romanization.set(config.romanization_enabled)
        self.allow_unreviewed.set(config.allow_unreviewed_drafts)
        self.no_translation.set(config.no_full_translation_enabled)
        self.creative_provider.set(config.creative_provider_name)
        self.creative_model.set(config.creative_model_name)
        self.creative_temperature.set(str(config.creative_temperature))
        self.creative_max_tokens.set(str(config.creative_max_tokens))
        self.creative_api_key.set("")
        self.refresh_sources()

    def save_languages(self, show_message: bool = True) -> None:
        if self.book is None:
            return
        config = load_project_config(self.book)
        config.source_language = self.source_language.get().strip() or "Auto"
        config.target_language = self.target_language.get().strip() or "Korean"
        config.explanation_language = self.explanation_language.get().strip() or "Spanish"
        config.script_type = self.script_type.get().strip() or "Auto"
        config.romanization_enabled = self.romanization.get()
        config.allow_unreviewed_drafts = self.allow_unreviewed.get()
        config.no_full_translation_enabled = self.no_translation.get()
        save_project_config(self.book, config)
        if show_message:
            messagebox.showinfo("Idiomas", "Configuración multilingüe guardada para este proyecto.")

    def save_creative_settings(self, show_message: bool = True) -> bool:
        if self.book is None:
            return False
        try:
            temperature = float(self.creative_temperature.get())
            max_tokens = int(self.creative_max_tokens.get())
            if not 0 <= temperature <= 2 or max_tokens <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Motor creativo", "Temperatura debe estar entre 0 y 2 y max tokens debe ser positivo.")
            return False
        config = load_project_config(self.book)
        config.creative_provider_name = self.creative_provider.get().strip() or "Manual / Placeholder"
        config.creative_model_name = self.creative_model.get().strip()
        config.creative_temperature = temperature
        config.creative_max_tokens = max_tokens
        config.allow_unreviewed_drafts = self.allow_unreviewed.get()
        save_project_config(self.book, config)
        if self.creative_api_key.get().strip():
            if config.creative_provider_name == "OpenAI":
                save_openai_api_key(self.creative_api_key.get())
            else:
                save_creative_api_key(self.creative_api_key.get())
            self.creative_api_key.set("")
        if show_message:
            messagebox.showinfo("Motor creativo", "Configuración guardada. La API key quedó protegida en .env.")
        return True

    def _creative_provider_selected(self, _event=None) -> None:
        if self.creative_provider.get() == "OpenAI" and not self.creative_model.get().strip():
            self.creative_model.set("gpt-5.4-mini")

    def test_openai_connection(self) -> None:
        if self.book is None:
            messagebox.showwarning("OpenAI", "Selecciona un proyecto primero.")
            return
        if self.creative_provider.get() != "OpenAI":
            messagebox.showwarning("OpenAI", "Selecciona OpenAI como proveedor primero.")
            return
        if not self.save_creative_settings(show_message=False):
            return
        api_key = get_openai_api_key()
        model = self.creative_model.get().strip()
        if not api_key:
            messagebox.showerror("OpenAI", "Falta OPENAI_API_KEY. Escríbela y guarda el motor.")
            return
        self.creative_status.configure(text="Probando conexión OpenAI…")
        threading.Thread(target=self._test_openai_worker, daemon=True).start()

    def _test_openai_worker(self) -> None:
        try:
            result = test_creative_runtime(self.book)
            self.after(0, lambda: self._openai_test_finished(result, False))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._openai_test_finished(detail, True))

    def _openai_test_finished(self, detail: str, failed: bool) -> None:
        self.creative_status.configure(text="Error de conexión" if failed else "OpenAI conectado")
        if failed:
            messagebox.showerror("Probar conexión OpenAI", detail)
        else:
            messagebox.showinfo("Probar conexión OpenAI", detail)

    def choose_file(self) -> None:
        path = filedialog.askopenfilename(filetypes=[("Fuentes", "*.txt *.html *.htm *.epub *.pdf *.mobi *.png *.jpg *.jpeg *.tif *.tiff *.webp")])
        if path:
            self._start_import(path)

    def choose_folder(self) -> None:
        path = filedialog.askdirectory()
        if path:
            self._start_import(path)

    def _start_import(self, path: str) -> None:
        if self.book is None:
            messagebox.showwarning("Fuentes", "Selecciona un libro primero.")
            return
        self.source_status.configure(text="Extrayendo texto…")
        threading.Thread(target=self._import_worker, args=(self.book, path, self.source_language.get()), daemon=True).start()

    def _import_worker(self, book, path, language) -> None:
        try:
            record = import_source(book, path, language)
            self.after(0, lambda: self._import_finished(record))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: messagebox.showerror("Importar fuente", detail))

    def _import_finished(self, record) -> None:
        self.refresh_sources(select_id=record.source_id)
        if record.extraction_error:
            messagebox.showwarning("Fuente importada", record.extraction_error)
        else:
            messagebox.showinfo("Fuente importada", record.status)

    def refresh_sources(self, select_id: str = "") -> None:
        if self.book is None:
            return
        self.records = list_sources(self.book)
        self.source_list.delete(0, "end")
        selected = None
        for index, record in enumerate(self.records):
            self.source_list.insert("end", f"{Path(record.original_path).name} · {record.status}")
            if record.source_id == select_id:
                selected = index
        if selected is not None:
            self.source_list.selection_set(selected)
            self.source_list.event_generate("<<ListboxSelect>>")

    def _source_selected(self, _event=None) -> None:
        selection = self.source_list.curselection()
        if not selection:
            return
        self.current_source = self.records[selection[0]]
        self.current_segment_index = None
        self.segment_title.set("")
        for widget in (self.segment_source_text, self.segment_target_text, self.segment_explanation, self.segment_key):
            self._set_text(widget, "")
        self.source_status.configure(text=f"{self.current_source.status}\n{self.current_source.notes}")
        values = [f"{i + 1:03d} · {section.title}" for i, section in enumerate(self.current_source.sections)]
        self.section_combo.configure(values=values)
        if values:
            self.section_combo.current(0)
            self._section_selected()
        self.segments = load_segments(self.book, self.current_source.source_id)
        self._refresh_segment_list()

    def _section_selected(self, _event=None) -> None:
        if self.current_source is None or self.section_combo.current() < 0:
            return
        section = self.current_source.sections[self.section_combo.current()]
        self.source_text.delete("1.0", "end")
        self.source_text.insert("1.0", section.text)
        warning = f" · {section.ocr_warning}" if section.ocr_warning else ""
        self.source_status.configure(text=f"{self.current_source.status}{warning}")

    def save_section_text(self) -> None:
        if self.book is None or self.current_source is None or self.section_combo.current() < 0:
            return
        self.current_source.sections[self.section_combo.current()].text = self.source_text.get("1.0", "end-1c")
        self.current_source.sections[self.section_combo.current()].reviewed = True
        save_source(self.book, self.current_source)
        messagebox.showinfo("Revisión", "Corrección guardada.")

    def start_ocr(self) -> None:
        if self.book is None or self.current_source is None:
            messagebox.showwarning("OCR", "Selecciona una fuente primero.")
            return
        try:
            start = max(1, int(self.ocr_start.get() or "1"))
            end = int(self.ocr_end.get()) if self.ocr_end.get().strip() else None
        except ValueError:
            messagebox.showerror("OCR", "El rango de páginas debe contener números.")
            return
        self.source_status.configure(text="Ejecutando OCR; puede tardar varios minutos…")
        threading.Thread(target=self._ocr_worker, args=(self.book, self.current_source, start, end), daemon=True).start()

    def _ocr_worker(self, book, record, start, end) -> None:
        try:
            updated = run_ocr(book, record, start, end)
            self.after(0, lambda: self._import_finished(updated))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: messagebox.showerror("OCR", detail))

    def create_segments(self) -> None:
        if self.book is None or self.current_source is None:
            messagebox.showwarning("Segmentos", "Selecciona una fuente primero.")
            return
        modes = {"Por capítulo/página": "chapter", "Cada X palabras": "words", "Manual": "manual", "Por escenas detectadas": "scene", "Por diálogo detectado": "dialogue"}
        try:
            words = max(50, int(self.words_count.get() or "500"))
            self.segments = segment_source(self.book, self.current_source, modes[self.segment_mode.get()], words)
        except Exception as exc:
            messagebox.showerror("Segmentos", str(exc))
            return
        self._refresh_segment_list()
        self.tabs.select(self.segments_tab)
        messagebox.showinfo("Segmentos", f"Se crearon {len(self.segments)} unidades editables.")

    def _refresh_segment_list(self) -> None:
        self.segment_list.delete(0, "end")
        for segment in self.segments:
            self.segment_list.insert("end", f"{segment.title} · {segment.status}")
        values = [f"{index + 1:03d} · {segment.title}" for index, segment in enumerate(self.segments)]
        self.creative_segment_combo.configure(values=values)
        if values and self.creative_segment_combo.current() < 0:
            self.creative_segment_combo.current(0)
            self._creative_segment_selected()

    def _segment_selected(self, _event=None) -> None:
        selection = self.segment_list.curselection()
        if not selection:
            return
        if self.current_segment_index is not None:
            self._store_segment_editor()
        self.current_segment_index = selection[0]
        segment = self.segments[self.current_segment_index]
        self.segment_title.set(segment.title)
        self._set_text(self.segment_source_text, segment.source_text)
        self._set_text(self.segment_target_text, segment.target_text)
        self._set_text(self.segment_explanation, segment.explanation)
        self._set_text(self.segment_key, segment.key_translation)

    def _set_text(self, widget, value) -> None:
        widget.delete("1.0", "end")
        widget.insert("1.0", value)

    def _store_segment_editor(self) -> None:
        if self.current_segment_index is None or self.current_segment_index >= len(self.segments):
            return
        segment = self.segments[self.current_segment_index]
        segment.title = self.segment_title.get().strip() or segment.title
        segment.source_text = self.segment_source_text.get("1.0", "end-1c").strip()
        segment.target_text = self.segment_target_text.get("1.0", "end-1c").strip()
        segment.explanation = self.segment_explanation.get("1.0", "end-1c").strip()
        segment.key_translation = self.segment_key.get("1.0", "end-1c").strip()

    def _creative_segment_selected(self, _event=None) -> None:
        index = self.creative_segment_combo.current()
        if index < 0 or index >= len(self.segments):
            return
        segment = self.segments[index]
        self.creative_status.configure(text=segment.status)
        self._set_text(self.creative_source, segment.source_text)
        self._set_text(self.creative_target, segment.target_text)
        self._set_text(self.creative_explanation, segment.explanation)
        self._set_text(self.creative_key_phrases, segment.key_phrases)
        self._set_text(self.creative_vocab, segment.vocabulary)
        self._set_text(self.creative_practice, segment.mini_practice)
        self._set_text(self.creative_notes, segment.notes)

    def _store_creative_editor(self) -> None:
        index = self.creative_segment_combo.current()
        if index < 0 or index >= len(self.segments):
            return
        segment = self.segments[index]
        segment.source_text = self.creative_source.get("1.0", "end-1c").strip()
        segment.target_text = self.creative_target.get("1.0", "end-1c").strip()
        segment.explanation = self.creative_explanation.get("1.0", "end-1c").strip()
        segment.key_phrases = self.creative_key_phrases.get("1.0", "end-1c").strip()
        segment.vocabulary = self.creative_vocab.get("1.0", "end-1c").strip()
        segment.mini_practice = self.creative_practice.get("1.0", "end-1c").strip()
        segment.notes = self.creative_notes.get("1.0", "end-1c").strip()

    def generate_creative_draft(self, action: str, mode: str) -> None:
        if self.book is None or self.current_source is None or self.creative_segment_combo.current() < 0:
            messagebox.showwarning("Motor creativo", "Selecciona una fuente y un segmento.")
            return
        if not self.save_creative_settings(show_message=False):
            return
        self.save_languages(show_message=False)
        self._store_creative_editor()
        config = load_project_config(self.book)
        engine = get_engine(config.creative_provider_name)
        if engine.sends_data_externally:
            proceed = messagebox.askyesno(
                "Envío a proveedor externo",
                "Este texto se enviará al proveedor configurado. Asegúrate de tener derecho a procesarlo. ¿Continuar?",
            )
            if not proceed:
                return
            if not engine.get_api_key():
                messagebox.showerror("Motor creativo", "Falta la API key del proveedor.")
                return
        external_consent = engine.sends_data_externally
        self.creative_status.configure(text="Generando borrador…")
        threading.Thread(
            target=self._creative_worker,
            args=(
                self.book, self.current_source, self.segments,
                self.creative_segment_combo.current(), config, action,
                self.creative_level.get(), mode, self.no_translation.get(),
                self.allow_original_dialogue.get(), external_consent,
            ),
            daemon=True,
        ).start()

    def _creative_worker(
        self, book, record, segments, index, config, action, level, mode,
        no_translation, allow_original_dialogue, external_consent,
    ) -> None:
        try:
            result = process_segment(
                book, record, segments, index, config, action=action, level=level,
                mode=mode, no_full_translation=no_translation,
                allow_original_dialogue=allow_original_dialogue,
                external_consent=external_consent,
            )
            self.after(0, lambda: self._creative_finished(record.source_id, index, result))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._creative_failed(detail))

    def _creative_finished(self, source_id: str, index: int, result) -> None:
        _segment, draft, output = result
        if self.current_source is not None and self.current_source.source_id == source_id:
            self._refresh_segment_list()
            self.creative_segment_combo.current(index)
            self._creative_segment_selected()
        warning = "\n\n".join(draft.warnings)
        messagebox.showinfo("Borrador generado", f"Borrador guardado en:\n{output}\n\n{warning}")

    def _creative_failed(self, detail: str) -> None:
        self.creative_status.configure(text="Error al generar")
        messagebox.showerror("Motor creativo", detail)

    def mark_segment_reviewed(self) -> None:
        if self.book is None or self.current_source is None or self.creative_segment_combo.current() < 0:
            return
        self._store_creative_editor()
        segment = self.segments[self.creative_segment_combo.current()]
        if not segment.target_text.strip():
            messagebox.showerror("Revisión", "El texto objetivo no puede estar vacío.")
            return
        segment.status = "Revisado por usuario"
        save_segments(self.book, self.current_source.source_id, self.segments)
        self._refresh_segment_list()
        self._creative_segment_selected()

    def mark_segment_ready(self) -> None:
        if self.book is None or self.current_source is None or self.creative_segment_combo.current() < 0:
            return
        self._store_creative_editor()
        segment = self.segments[self.creative_segment_combo.current()]
        if segment.status not in {"Revisado por usuario", "Listo para aplicar"}:
            messagebox.showerror("Estado", "Primero marca este segmento como revisado por usuario.")
            return
        segment.status = "Listo para aplicar"
        save_segments(self.book, self.current_source.source_id, self.segments)
        self._refresh_segment_list()
        self._creative_segment_selected()

    def save_segment_editor(self, show_message: bool = True) -> None:
        if self.book is None or self.current_source is None:
            return
        self._store_segment_editor()
        save_segments(self.book, self.current_source.source_id, self.segments)
        self._refresh_segment_list()
        if show_message:
            messagebox.showinfo("Segmentos", "Unidad guardada.")

    def show_review(self) -> None:
        if self.current_source is None:
            messagebox.showwarning("Revisión", "Selecciona una fuente primero.")
            return
        self._store_creative_editor()
        self.save_segment_editor(show_message=False)
        summary = review_summary(self.current_source, self.segments)
        missing_targets = sum(not s.target_text.strip() for s in self.segments)
        lines = [
            f"Fuente: {Path(self.current_source.original_path).name}",
            f"Estado: {self.current_source.status}",
            f"Segmentos detectados: {summary['segments']}",
            f"Idioma detectado: {summary['detected_language']}",
            f"Caracteres estimados: {summary['characters']:,}",
            f"Audios estimados: {summary['estimated_audios']}",
            f"Segmentos sin texto objetivo: {missing_targets}",
            "",
            "Advertencias:",
            *(summary["warnings"] or ["Ninguna"]),
            "",
            COPYRIGHT_NOTICE,
        ]
        self.review_text.delete("1.0", "end")
        self.review_text.insert("1.0", "\n".join(str(line) for line in lines))
        self.tabs.select(self.generate_tab)

    def generate_lessons(self) -> None:
        if self.book is None or self.current_source is None:
            messagebox.showwarning("Generar", "Selecciona una fuente primero.")
            return
        self._store_creative_editor()
        self.save_languages(show_message=False)
        self.save_segment_editor(show_message=False)
        options = LessonGenerationOptions(
            self.level.get(), self.style.get(), self.generation_mode.get(),
            self.no_translation.get(), self.create_anki.get(), self.allow_unreviewed.get(),
        )
        try:
            result = generate_lessons_from_source(
                self.book, self.current_source, self.segments, load_project_config(self.book), options
            )
        except Exception as exc:
            messagebox.showerror("Generar lecciones", str(exc))
            return
        self.last_output = result.output_dir
        messagebox.showinfo("Paquete HanStory creado", f"Se crearon {result.audio_count} entradas de audio.\n\n{result.output_dir}")

    def open_last_output(self) -> None:
        if self.last_output is None or not self.last_output.exists():
            messagebox.showwarning("Salida", "Todavía no has generado un paquete en esta sesión.")
            return
        if sys.platform == "darwin":
            subprocess.run(["open", str(self.last_output)], check=False)

    def apply_last_output(self) -> None:
        if self.book is None or self.last_output is None:
            messagebox.showwarning("Aplicar paquete", "Primero genera y revisa un paquete.")
            return
        proceed = messagebox.askyesno(
            "Aplicar paquete",
            "Esto reemplazará el CSV, el archivo técnico y el HTML actuales del proyecto. "
            "Se creará una copia de seguridad antes de hacerlo. ¿Continuar?",
        )
        if not proceed:
            return
        try:
            backup = apply_generated_package(self.book, self.last_output)
        except Exception as exc:
            messagebox.showerror("Aplicar paquete", str(exc))
            return
        for segment in self.segments:
            if segment.status in {"Revisado por usuario", "Listo para aplicar"}:
                segment.status = "Aplicado al proyecto"
        if self.current_source is not None:
            save_segments(self.book, self.current_source.source_id, self.segments)
        self._refresh_segment_list()
        if self.current_source is not None:
            report_options = LessonGenerationOptions(
                self.level.get(), self.style.get(), self.generation_mode.get(),
                self.no_translation.get(), self.create_anki.get(), self.allow_unreviewed.get(),
            )
            write_creative_report(
                self.book,
                self.current_source,
                self.segments,
                load_project_config(self.book),
                report_options,
                output_dir=self.last_output,
            )
        messagebox.showinfo(
            "Paquete aplicado",
            "El proyecto ya puede validarse y generar audios desde las pestañas normales.\n\n"
            f"Respaldo anterior: {backup}",
        )

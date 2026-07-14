from __future__ import annotations

import json
import threading
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from ..book_manager import Book
from ..config import load_settings, load_voice_profiles
from ..podcast_generator import (
    ACTIVE_LISTENING_PRESETS,
    PODCAST_AUDIO_OUTPUT_MODES,
    PODCAST_MODES,
    PodcastOptions,
    default_podcast_prefix,
    generate_podcast_audio,
    generate_podcast_package,
    load_podcast_csv,
    podcast_paths,
    write_podcast_csv,
    build_podcast_report,
    build_podcast_script,
    build_podcast_technical,
    generate_podcast_explanation_with_openai,
    required_podcast_voices,
    load_podcast_draft,
    missing_podcast_voices,
    save_podcast_draft,
    set_podcast_draft_status,
    lesson_scene_rows,
    validate_podcast_draft_quality,
)
from ..project_config import ProjectConfig, load_project_config, save_project_config


class PodcastPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=16)
        self.book: Book | None = None
        self.project_config = ProjectConfig()
        self.mode = tk.StringVar(value="Podcast explicado")
        self.lesson_start = tk.StringVar()
        self.lesson_end = tk.StringVar()
        self.id_prefix = tk.StringVar()
        self.pause_seconds = tk.StringVar(value="1")
        self.output_mode = tk.StringVar(value="conservar audios separados")
        self.audio_output_mode = tk.StringVar(value="Un audio por lección")
        self.generate_lines_and_joined = tk.BooleanVar(value=True)
        self.use_multispeaker_v3 = tk.BooleanVar(value=False)
        self.multispeaker_max_chars = tk.StringVar(value="4500")
        self.word_breakdown_enabled = tk.BooleanVar(value=True)
        self.shadowing_repetitions = tk.StringVar(value="2")
        self.active_listening = tk.BooleanVar(value=False)
        self.active_preset = tk.StringVar(value="Repite conmigo")
        self.phrase_pause = tk.StringVar(value="1s")
        self.repeat_pause = tk.StringVar(value="3s")
        self.key_phrase_repetitions = tk.StringVar(value="2")
        self.include_slow_version = tk.BooleanVar(value=True)
        self.include_natural_version = tk.BooleanVar(value=True)
        self.include_brief_translation = tk.BooleanVar(value=True)
        self.include_repeat_instruction = tk.BooleanVar(value=True)
        self.creative_lesson = tk.StringVar(value="1")
        self.dry_run = tk.BooleanVar(value=True)
        self.regenerate = tk.BooleanVar(value=False)
        self.include_anki_suggestions = tk.BooleanVar(value=False)

        ttk.Label(self, text="Podcast / Lección en escucha", font=("Helvetica", 18, "bold")).pack(anchor="w")
        ttk.Label(
            self,
            text=(
                "Genera un guion editable y audios de estudio a partir del libro actual. "
                "Los MP3 de podcast se guardan aparte y no modifican la biblioteca maestra."
            ),
            wraplength=880,
        ).pack(anchor="w", pady=(3, 8))

        options = ttk.LabelFrame(self, text="Opciones", padding=10)
        options.pack(fill="x")
        fields = (
            ("Modo", self.mode, PODCAST_MODES, 24),
            ("Lección inicial", self.lesson_start, (), 8),
            ("Lección final", self.lesson_end, (), 8),
            ("Prefijo IDs", self.id_prefix, (), 18),
            ("Pausa", self.pause_seconds, ("0", "1", "2", "3"), 8),
            ("Repeticiones shadowing", self.shadowing_repetitions, ("2", "3"), 8),
        )
        for column, (label, variable, values, width) in enumerate(fields):
            ttk.Label(options, text=label).grid(row=0, column=column, sticky="w", padx=3)
            if values:
                widget = ttk.Combobox(options, textvariable=variable, values=values, state="readonly", width=width)
            else:
                widget = ttk.Entry(options, textvariable=variable, width=width)
            widget.grid(row=1, column=column, sticky="ew", padx=3)
        ttk.Checkbutton(
            options,
            text="Crear sugerencias Anki de podcast (no mezcla con deck principal)",
            variable=self.include_anki_suggestions,
        ).grid(row=2, column=0, columnspan=4, sticky="w", pady=(7, 0))
        ttk.Checkbutton(options, text="Dry run al generar audios", variable=self.dry_run).grid(row=2, column=4, columnspan=2, sticky="w", pady=(7, 0))
        ttk.Checkbutton(options, text="Regenerar audios existentes", variable=self.regenerate).grid(row=2, column=6, sticky="w", pady=(7, 0))

        audio_output = ttk.LabelFrame(self, text="Salida de audio", padding=10)
        audio_output.pack(fill="x", pady=(8, 0))
        ttk.Label(audio_output, text="Tipo de salida").grid(row=0, column=0, sticky="w", padx=3)
        ttk.Combobox(
            audio_output,
            textvariable=self.audio_output_mode,
            values=PODCAST_AUDIO_OUTPUT_MODES,
            state="readonly",
            width=34,
        ).grid(row=1, column=0, sticky="ew", padx=3)
        ttk.Checkbutton(
            audio_output,
            text="Generar separados + generar unidos",
            variable=self.generate_lines_and_joined,
        ).grid(row=1, column=1, sticky="w", padx=8)
        ttk.Checkbutton(
            audio_output,
            text="Usar diálogo multi-speaker ElevenLabs v3 cuando sea posible",
            variable=self.use_multispeaker_v3,
        ).grid(row=1, column=2, sticky="w", padx=8)
        ttk.Label(audio_output, text="Máx. caracteres por bloque").grid(row=0, column=3, sticky="w", padx=3)
        ttk.Entry(audio_output, textvariable=self.multispeaker_max_chars, width=10).grid(row=1, column=3, sticky="w", padx=3)
        audio_output.columnconfigure(0, weight=1)

        active = ttk.LabelFrame(self, text="Pausas y repeticiones — Escucha activa", padding=10)
        active.pack(fill="x", pady=(8, 0))
        ttk.Checkbutton(active, text="Activar escucha activa", variable=self.active_listening).grid(row=0, column=0, sticky="w", padx=3)
        active_fields = (
            ("Preset", self.active_preset, ACTIVE_LISTENING_PRESETS, 22),
            ("Pausa después de frase", self.phrase_pause, ("0.5s", "1s", "2s", "3s"), 8),
            ("Pausa para repetir", self.repeat_pause, ("1s", "2s", "3s", "4s"), 8),
            ("Repeticiones por frase", self.key_phrase_repetitions, ("1", "2", "3", "5"), 8),
        )
        for column, (label, variable, values, width) in enumerate(active_fields, start=1):
            ttk.Label(active, text=label).grid(row=0, column=column, sticky="w", padx=3)
            ttk.Combobox(active, textvariable=variable, values=values, state="readonly", width=width).grid(row=1, column=column, sticky="ew", padx=3)
        ttk.Checkbutton(active, text="Incluir versión lenta", variable=self.include_slow_version).grid(row=2, column=0, sticky="w", padx=3, pady=(6, 0))
        ttk.Checkbutton(active, text="Incluir versión natural", variable=self.include_natural_version).grid(row=2, column=1, sticky="w", padx=3, pady=(6, 0))
        ttk.Checkbutton(active, text="Traducción breve antes de repetir", variable=self.include_brief_translation).grid(row=2, column=2, columnspan=2, sticky="w", padx=3, pady=(6, 0))
        ttk.Checkbutton(active, text='Instrucción “repite después de mí”', variable=self.include_repeat_instruction).grid(row=2, column=4, columnspan=2, sticky="w", padx=3, pady=(6, 0))
        ttk.Checkbutton(
            active,
            text="Desglose palabra por palabra para frases largas",
            variable=self.word_breakdown_enabled,
        ).grid(row=3, column=0, columnspan=4, sticky="w", padx=3, pady=(6, 0))

        buttons = ttk.Frame(self)
        buttons.pack(fill="x", pady=8)
        ttk.Button(buttons, text="Generar guion editable", command=self.generate_script).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Guardar guion editado", command=self.save_edited_script).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Generar audios de podcast", command=self.start_audio_generation).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Recargar Podcast_Master.csv", command=self.load_existing_script).pack(side="left")

        creative = ttk.LabelFrame(self, text="Explicación didáctica con OpenAI", padding=8)
        creative.pack(fill="x", pady=(0, 8))
        ttk.Label(creative, text="Lección").pack(side="left")
        ttk.Entry(creative, textvariable=self.creative_lesson, width=5).pack(side="left", padx=(4, 8))
        ttk.Button(creative, text="Generar explicación con OpenAI", command=self.start_generate_openai_explanation).pack(side="left", padx=(0, 6))
        ttk.Button(creative, text="Regenerar explicación de esta lección", command=self.start_generate_openai_explanation).pack(side="left", padx=(0, 6))
        ttk.Button(creative, text="Regenerar explicación de esta frase", command=self.start_regenerate_phrase).pack(side="left", padx=(0, 6))
        ttk.Button(creative, text="Marcar revisado/listo", command=self.mark_draft_ready).pack(side="left", padx=(0, 6))
        ttk.Button(creative, text="Aplicar explicación al guion de podcast", command=self.generate_script).pack(side="left")

        ttk.Label(
            self,
            text=(
                "Editor: puedes cambiar speaker_or_blank, text, text_tts, lesson, section y pause_after_ms. "
                "Cada fila debe conservar las columnas de Podcast_Master.csv."
            ),
            wraplength=880,
        ).pack(anchor="w")
        body = ttk.Panedwindow(self, orient="vertical")
        body.pack(fill="both", expand=True, pady=(4, 8))
        editor_frame = ttk.Frame(body)
        preview_frame = ttk.Frame(body)
        body.add(editor_frame, weight=3)
        body.add(preview_frame, weight=2)
        self.editor = tk.Text(editor_frame, wrap="none", undo=True)
        self.editor.pack(fill="both", expand=True)
        ttk.Label(preview_frame, text="Vista legible del guion con pausas").pack(anchor="w")
        self.preview = tk.Text(preview_frame, wrap="word", height=8)
        self.preview.pack(fill="both", expand=True)
        ttk.Label(preview_frame, text="Borrador OpenAI editable de la lección seleccionada").pack(anchor="w", pady=(6, 0))
        self.draft_editor = tk.Text(preview_frame, wrap="word", height=8, undo=True)
        self.draft_editor.pack(fill="both", expand=True)
        self.status = ttk.Label(self, text="Selecciona un libro.")
        self.status.pack(anchor="w")
        self.progress = ttk.Progressbar(self, mode="determinate")
        self.progress.pack(fill="x", pady=(4, 0))

    def set_book(self, book: Book) -> None:
        self.book = book
        self.project_config = load_project_config(book)
        self.id_prefix.set(default_podcast_prefix(book, self.project_config))
        self.pause_seconds.set(str(self.project_config.podcast_pause_seconds))
        self.output_mode.set(self.project_config.podcast_output_mode)
        self.audio_output_mode.set(self.project_config.podcast_audio_output_mode)
        self.generate_lines_and_joined.set(self.project_config.podcast_generate_lines_and_joined)
        self.use_multispeaker_v3.set(self.project_config.podcast_use_multispeaker_v3)
        self.multispeaker_max_chars.set(str(self.project_config.podcast_multispeaker_max_chars))
        self.word_breakdown_enabled.set(self.project_config.podcast_word_breakdown_enabled)
        self.active_listening.set(self.project_config.podcast_active_listening_enabled)
        self.active_preset.set(self.project_config.podcast_active_preset)
        self.phrase_pause.set(self._ms_to_choice(self.project_config.podcast_phrase_pause_ms))
        self.repeat_pause.set(self._ms_to_choice(self.project_config.podcast_repeat_pause_ms))
        self.key_phrase_repetitions.set(str(self.project_config.podcast_key_phrase_repetitions))
        self.include_slow_version.set(self.project_config.podcast_include_slow_version)
        self.include_natural_version.set(self.project_config.podcast_include_natural_version)
        self.include_brief_translation.set(self.project_config.podcast_include_brief_translation)
        self.include_repeat_instruction.set(self.project_config.podcast_include_repeat_instruction)
        self.status.configure(text=f"Libro actual: {book.code} — {book.title}")
        if podcast_paths(book)["csv"].exists():
            self.load_existing_script()
        else:
            self.editor.delete("1.0", "end")
            self.preview.delete("1.0", "end")
            self.draft_editor.delete("1.0", "end")
            self._load_draft_editor_silent()

    def _options_from_screen(self) -> PodcastOptions:
        start = self._optional_int(self.lesson_start.get(), "Lección inicial")
        end = self._optional_int(self.lesson_end.get(), "Lección final")
        pause = self._required_int(self.pause_seconds.get(), "Pausa")
        repetitions = self._required_int(self.shadowing_repetitions.get(), "Repeticiones shadowing")
        if start is not None and end is not None and start > end:
            raise ValueError("La lección inicial no puede ser mayor que la final.")
        if pause not in (0, 1, 2, 3):
            raise ValueError("La pausa debe ser 0, 1, 2 o 3 segundos.")
        max_chars = self._required_int(self.multispeaker_max_chars.get(), "Máx. caracteres por bloque")
        if max_chars < 500:
            raise ValueError("Máx. caracteres por bloque debe ser al menos 500.")
        output_mode = self.audio_output_mode.get()
        if self.generate_lines_and_joined.get():
            output_mode = "Generar separados + generar unidos"
        return PodcastOptions(
            mode=self.mode.get(),
            lesson_start=start,
            lesson_end=end,
            id_prefix=self.id_prefix.get(),
            pause_seconds=pause,
            output_mode=self.output_mode.get(),
            shadowing_repetitions=max(1, repetitions),
            include_anki_suggestions=self.include_anki_suggestions.get(),
            active_listening_enabled=self.active_listening.get(),
            active_preset=self.active_preset.get(),
            phrase_pause_ms=self._pause_choice_to_ms(self.phrase_pause.get(), "Pausa después de frase"),
            repeat_pause_ms=self._pause_choice_to_ms(self.repeat_pause.get(), "Pausa para repetir"),
            key_phrase_repetitions=self._required_int(self.key_phrase_repetitions.get(), "Repeticiones por frase"),
            include_slow_version=self.include_slow_version.get(),
            include_natural_version=self.include_natural_version.get(),
            include_brief_translation=self.include_brief_translation.get(),
            include_repeat_instruction=self.include_repeat_instruction.get(),
            audio_output_mode=output_mode,
            generate_lines_and_joined=self.generate_lines_and_joined.get(),
            use_multispeaker_v3=self.use_multispeaker_v3.get(),
            multispeaker_max_chars=max_chars,
            word_breakdown_enabled=self.word_breakdown_enabled.get(),
        )

    def _save_project_options(self, options: PodcastOptions) -> None:
        if self.book is None:
            return
        self.project_config.podcast_id_prefix = options.id_prefix.strip()
        self.project_config.podcast_pause_seconds = options.pause_seconds
        self.project_config.podcast_output_mode = options.output_mode
        self.project_config.podcast_audio_output_mode = options.audio_output_mode
        self.project_config.podcast_generate_lines_and_joined = options.generate_lines_and_joined
        self.project_config.podcast_use_multispeaker_v3 = options.use_multispeaker_v3
        self.project_config.podcast_multispeaker_max_chars = options.multispeaker_max_chars
        self.project_config.podcast_word_breakdown_enabled = options.word_breakdown_enabled
        self.project_config.podcast_active_listening_enabled = options.active_listening_enabled
        self.project_config.podcast_active_preset = options.active_preset
        self.project_config.podcast_phrase_pause_ms = options.phrase_pause_ms
        self.project_config.podcast_repeat_pause_ms = options.repeat_pause_ms
        self.project_config.podcast_key_phrase_repetitions = options.key_phrase_repetitions
        self.project_config.podcast_include_slow_version = options.include_slow_version
        self.project_config.podcast_include_natural_version = options.include_natural_version
        self.project_config.podcast_include_brief_translation = options.include_brief_translation
        self.project_config.podcast_include_repeat_instruction = options.include_repeat_instruction
        save_project_config(self.book, self.project_config)

    def generate_script(self) -> None:
        if self.book is None:
            messagebox.showwarning("Podcast", "Selecciona un libro primero.")
            return
        if self.draft_editor.edit_modified() and not self.save_draft_editor(show_message=False):
            return
        try:
            options = self._options_from_screen()
            self._save_project_options(options)
            package = generate_podcast_package(
                self.book,
                load_project_config(self.book),
                options,
                load_voice_profiles(),
            )
        except Exception as exc:
            messagebox.showerror("Podcast", str(exc))
            return
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", package.csv_path.read_text(encoding="utf-8-sig"))
        self.editor.edit_modified(False)
        self._refresh_preview_from_script()
        self._load_draft_editor_silent()
        warning = ""
        if package.missing_voices:
            warning = "\n\nFaltan voces: " + ", ".join(package.missing_voices)
        messagebox.showinfo(
            "Guion creado",
            "Se creó Podcast_Master.csv, Podcast_Tecnico.txt, Podcast_Guion.txt y Podcast_Report.txt."
            + warning,
        )
        self.status.configure(text=f"Guion listo: {len(package.rows)} líneas.")

    def save_edited_script(self) -> bool:
        if self.book is None:
            messagebox.showwarning("Podcast", "Selecciona un libro primero.")
            return False
        paths = podcast_paths(self.book)
        try:
            options = self._options_from_screen()
            self._save_project_options(options)
            paths["csv"].write_text(self.editor.get("1.0", "end-1c").strip() + "\n", encoding="utf-8-sig")
            rows = load_podcast_csv(paths["csv"])
            paths["script"].write_text(build_podcast_script(self.book, rows, options), encoding="utf-8")
            paths["technical"].write_text(build_podcast_technical(self.book, rows, options), encoding="utf-8")
            required = required_podcast_voices(rows)
            missing = missing_podcast_voices(rows, load_voice_profiles(), load_project_config(self.book))
            paths["report"].write_text(
                build_podcast_report(self.book, rows, options, required, missing, generated=[], errors=[]),
                encoding="utf-8",
            )
            write_podcast_csv(paths["csv"], rows)
        except Exception as exc:
            messagebox.showerror("Guardar guion", str(exc))
            return False
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", paths["csv"].read_text(encoding="utf-8-sig"))
        self.editor.edit_modified(False)
        self._refresh_preview_from_script()
        self.status.configure(text=f"Guion guardado: {len(rows)} líneas.")
        messagebox.showinfo("Podcast", "Guion editado guardado.")
        return True

    def start_generate_openai_explanation(self) -> None:
        if self.book is None:
            messagebox.showwarning("Podcast", "Selecciona un libro primero.")
            return
        try:
            lesson = self._required_int(self.creative_lesson.get(), "Lección")
            self._save_project_options(self._options_from_screen())
        except Exception as exc:
            messagebox.showerror("Podcast OpenAI", str(exc))
            return
        if not messagebox.askyesno(
            "Enviar texto a OpenAI",
            "La escena de esta lección se enviará al Motor creativo/OpenAI para generar "
            "un borrador didáctico. Asegúrate de tener derecho a procesarla. ¿Continuar?",
        ):
            return
        self.status.configure(text=f"Generando explicación OpenAI para Lección {lesson:02d}…")
        threading.Thread(target=self._generate_openai_worker, args=(lesson, ""), daemon=True).start()

    def start_regenerate_phrase(self) -> None:
        if self.book is None:
            messagebox.showwarning("Podcast", "Selecciona un libro primero.")
            return
        phrase = simpledialog.askstring(
            "Regenerar frase",
            "Escribe la frase coreana exacta que quieres regenerar:",
            parent=self,
        )
        if not phrase:
            return
        try:
            lesson = self._required_int(self.creative_lesson.get(), "Lección")
            self._save_project_options(self._options_from_screen())
        except Exception as exc:
            messagebox.showerror("Podcast OpenAI", str(exc))
            return
        self.status.configure(text=f"Regenerando frase en Lección {lesson:02d}…")
        threading.Thread(target=self._generate_openai_worker, args=(lesson, phrase), daemon=True).start()

    def _generate_openai_worker(self, lesson: int, phrase_filter: str) -> None:
        assert self.book is not None
        try:
            payload = generate_podcast_explanation_with_openai(
                self.book,
                load_project_config(self.book),
                lesson,
                phrase_filter=phrase_filter,
            )
            self.after(0, lambda: self._openai_finished(lesson, payload))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._finish(detail, True))

    def _openai_finished(self, lesson: int, payload: dict) -> None:
        self.creative_lesson.set(str(lesson))
        self._set_draft_editor(payload)
        errors = payload.get("hanstory_validation_errors") or []
        if errors:
            self.status.configure(text=f"Borrador generado, pero requiere revisión: {len(errors)} problema(s).")
            messagebox.showwarning("Podcast OpenAI", "El borrador requiere revisión:\n\n" + "\n".join(map(str, errors)))
        else:
            self.status.configure(text="Borrador generado por OpenAI. Revísalo y márcalo listo.")
            messagebox.showinfo("Podcast OpenAI", "Borrador generado. Revísalo antes de aplicarlo al guion.")

    def mark_draft_ready(self) -> None:
        if self.book is None:
            return
        if not self.save_draft_editor(show_message=False):
            return
        try:
            lesson = self._required_int(self.creative_lesson.get(), "Lección")
            payload = load_podcast_draft(self.book, lesson)
            errors = payload.get("hanstory_validation_errors") or []
            if errors:
                messagebox.showerror(
                    "Borrador no válido",
                    "No se puede marcar listo porque aún tiene errores:\n\n" + "\n".join(map(str, errors)),
                )
                return
            payload = set_podcast_draft_status(self.book, lesson, "Listo para podcast")
        except Exception as exc:
            messagebox.showerror("Podcast", str(exc))
            return
        self._set_draft_editor(payload)
        messagebox.showinfo("Podcast", "Borrador marcado como Listo para podcast.")

    def save_draft_editor(self, show_message: bool = True) -> bool:
        if self.book is None:
            return False
        content = self.draft_editor.get("1.0", "end-1c").strip()
        if not content:
            return True
        try:
            lesson = self._required_int(self.creative_lesson.get(), "Lección")
            payload = json.loads(content)
            if not isinstance(payload, dict):
                raise ValueError("El borrador debe ser un objeto JSON.")
            payload["hanstory_validation_errors"] = validate_podcast_draft_quality(
                payload, lesson_scene_rows(self.book, lesson)
            )
            save_podcast_draft(self.book, lesson, payload)
        except Exception as exc:
            messagebox.showerror("Guardar borrador", str(exc))
            return False
        self.draft_editor.edit_modified(False)
        if show_message:
            messagebox.showinfo("Podcast", "Borrador guardado.")
        return True

    def _set_draft_editor(self, payload: dict) -> None:
        self.draft_editor.delete("1.0", "end")
        self.draft_editor.insert("1.0", json.dumps(payload, ensure_ascii=False, indent=2))
        self.draft_editor.edit_modified(False)

    def _load_draft_editor_silent(self) -> None:
        if self.book is None:
            return
        try:
            lesson = self._required_int(self.creative_lesson.get(), "Lección")
            payload = load_podcast_draft(self.book, lesson)
        except Exception:
            payload = {}
        self._set_draft_editor(payload) if payload else None

    def load_existing_script(self) -> None:
        if self.book is None:
            return
        path = podcast_paths(self.book)["csv"]
        if not path.exists():
            messagebox.showwarning("Podcast", "Todavía no existe Podcast_Master.csv.")
            return
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", path.read_text(encoding="utf-8-sig"))
        self.editor.edit_modified(False)
        self._refresh_preview_from_script()
        self._load_draft_editor_silent()
        try:
            rows = load_podcast_csv(path)
            self.status.configure(text=f"Podcast_Master.csv cargado: {len(rows)} líneas.")
        except Exception as exc:
            self.status.configure(text=f"Podcast_Master.csv cargado, pero necesita revisión: {exc}")

    def start_audio_generation(self) -> None:
        if self.book is None:
            messagebox.showwarning("Podcast", "Selecciona un libro primero.")
            return
        if not podcast_paths(self.book)["csv"].exists():
            messagebox.showwarning("Podcast", "Primero genera o guarda el guion editable.")
            return
        if self.editor.edit_modified():
            proceed = messagebox.askyesno(
                "Guion sin guardar",
                "El editor tiene cambios sin guardar. ¿Guardar antes de generar audios?",
            )
            if proceed:
                if not self.save_edited_script():
                    return
        threading.Thread(target=self._generate_audio_worker, daemon=True).start()

    def _generate_audio_worker(self) -> None:
        assert self.book is not None
        try:
            result = generate_podcast_audio(
                self.book,
                load_voice_profiles(),
                load_settings(),
                dry_run=self.dry_run.get(),
                regenerate_existing=self.regenerate.get(),
                progress=self._progress,
                project_config=load_project_config(self.book),
            )
            message = (
                f"{'Simulación' if result.dry_run else 'Generación'} de podcast terminada: "
                f"{len(result.generated)} nuevos, {len(result.existing)} existentes, "
                f"{len(result.errors)} errores."
            )
            self.after(0, lambda: self._finish(message, bool(result.errors)))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._finish(detail, True))

    def _progress(self, current: int, total: int, audio_id: str) -> None:
        def update() -> None:
            self.progress.configure(maximum=total, value=current)
            self.status.configure(text=f"Podcast: procesando {audio_id} ({current} de {total})")

        self.after(0, update)

    def _finish(self, message: str, has_problem: bool) -> None:
        self.status.configure(text=message)
        if has_problem:
            messagebox.showwarning("Podcast", message)
        else:
            messagebox.showinfo("Podcast", message)

    def _refresh_preview_from_script(self) -> None:
        if self.book is None:
            return
        script_path = podcast_paths(self.book)["script"]
        self.preview.delete("1.0", "end")
        if script_path.exists():
            self.preview.insert("1.0", script_path.read_text(encoding="utf-8"))

    @staticmethod
    def _optional_int(value: str, label: str) -> int | None:
        value = value.strip()
        if not value:
            return None
        return PodcastPanel._required_int(value, label)

    @staticmethod
    def _required_int(value: str, label: str) -> int:
        try:
            return int(value.strip())
        except ValueError as exc:
            raise ValueError(f"{label} debe ser un número entero.") from exc

    @staticmethod
    def _pause_choice_to_ms(value: str, label: str) -> int:
        clean = value.strip().lower().removesuffix("s")
        try:
            return int(float(clean) * 1000)
        except ValueError as exc:
            raise ValueError(f"{label} debe ser una pausa válida.") from exc

    @staticmethod
    def _ms_to_choice(value: int) -> str:
        if value % 1000 == 0:
            return f"{value // 1000}s"
        return f"{value / 1000:g}s"

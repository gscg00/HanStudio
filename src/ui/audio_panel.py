from __future__ import annotations

import threading
import tkinter as tk
from tkinter import messagebox, ttk
from typing import Callable

from ..audio_generator import generate_book_audio
from ..audio_organizer import organize_book_audio
from ..book_manager import Book
from ..config import get_api_key, load_settings, load_voice_profiles
from ..csv_loader import load_audio_csv
from ..elevenlabs_client import ElevenLabsClient, ElevenLabsModel
from ..podcast_generator import load_podcast_csv, podcast_paths
from ..project_config import (
    DEFAULT_MODEL_ID,
    ProjectConfig,
    character_voice_id,
    load_project_config,
    save_project_config,
)
from ..validators import validate_book


class AudioPanel(ttk.Frame):
    CUSTOM_MODEL_OPTION = "Custom model_id"
    FALLBACK_MODEL_NAME = "Eleven Multilingual v2"

    def __init__(self, parent, open_voice_manager: Callable[[], None] | None = None) -> None:
        super().__init__(parent, padding=16)
        self.book: Book | None = None
        self.open_voice_manager = open_voice_manager
        self.project_config = ProjectConfig()
        self.dry_run = tk.BooleanVar(value=True)
        self.regenerate = tk.BooleanVar(value=False)
        self.organize_after = tk.BooleanVar(value=False)
        self.model_choice = tk.StringVar()
        self.model_id = tk.StringVar(value=DEFAULT_MODEL_ID)
        self.model_name = tk.StringVar(value=self.FALLBACK_MODEL_NAME)
        self.selected_model_text = tk.StringVar()
        self.available_models: dict[str, tuple[str, str]] = {}
        self.acting_mode = tk.BooleanVar(value=False)
        self.allow_default = tk.BooleanVar(value=False)
        self.voice_choice = tk.StringVar()
        self.model_id.trace_add("write", self._model_id_changed)

        ttk.Label(self, text="Audios", font=("Helvetica", 18, "bold")).pack(anchor="w")
        self.tabs = ttk.Notebook(self)
        self.tabs.pack(fill="both", expand=True, pady=(10, 0))
        self.generation_tab = ttk.Frame(self.tabs, padding=12)
        self.characters_tab = ttk.Frame(self.tabs, padding=12)
        self.tabs.add(self.generation_tab, text="Generación")
        self.tabs.add(self.characters_tab, text="Personajes y voces")
        self._build_generation_tab()
        self._build_characters_tab()

    def _build_generation_tab(self) -> None:
        project = ttk.LabelFrame(self.generation_tab, text="Configuración de este libro", padding=10)
        project.pack(fill="x")
        ttk.Label(project, text="Modelo ElevenLabs").grid(row=0, column=0, sticky="w")
        self.model_combo = ttk.Combobox(
            project,
            textvariable=self.model_choice,
            state="readonly",
            width=48,
        )
        self.model_combo.grid(row=0, column=1, sticky="ew", padx=8)
        self.model_combo.bind("<<ComboboxSelected>>", self._model_selected)
        self.load_models_button = ttk.Button(
            project,
            text="Cargar modelos desde ElevenLabs",
            command=self.start_load_models,
        )
        self.load_models_button.grid(row=0, column=2, sticky="e")
        ttk.Label(project, text="Custom model_id").grid(row=1, column=0, sticky="w", pady=(8, 0))
        self.model_entry = ttk.Entry(project, textvariable=self.model_id)
        self.model_entry.grid(row=1, column=1, columnspan=2, sticky="ew", padx=(8, 0), pady=(8, 0))
        ttk.Label(
            project,
            textvariable=self.selected_model_text,
            font=("Helvetica", 11, "bold"),
        ).grid(row=2, column=0, columnspan=3, sticky="w", pady=(10, 2))
        ttk.Checkbutton(
            project, text="Acting / Variety Mode", variable=self.acting_mode
        ).grid(row=3, column=0, columnspan=2, sticky="w", pady=(8, 0))
        ttk.Checkbutton(
            project,
            text="Permitir voz por defecto para personajes sin asignar",
            variable=self.allow_default,
        ).grid(row=3, column=2, sticky="w", pady=(8, 0))
        ttk.Button(
            project, text="Guardar configuración del libro", command=self.save_project_settings
        ).grid(row=4, column=2, sticky="e", pady=(8, 0))
        project.columnconfigure(1, weight=1)
        self._reset_model_options()

        options = ttk.LabelFrame(self.generation_tab, text="Generación", padding=10)
        options.pack(fill="x", pady=10)
        ttk.Checkbutton(options, text="Dry run (no consume créditos)", variable=self.dry_run).pack(anchor="w")
        ttk.Checkbutton(options, text="Regenerar existentes", variable=self.regenerate).pack(anchor="w", pady=2)
        ttk.Checkbutton(options, text="Organizar después de generar", variable=self.organize_after).pack(anchor="w", pady=2)
        buttons = ttk.Frame(options)
        buttons.pack(fill="x", pady=(8, 0))
        ttk.Button(buttons, text="Generar audios nuevos", command=self.start_generate).pack(side="left", padx=(0, 8))
        ttk.Button(buttons, text="Organizar audios", command=self.start_organize).pack(side="left")
        self.status = ttk.Label(self.generation_tab, text="Selecciona un libro.")
        self.status.pack(anchor="w", pady=(8, 5))
        self.progress = ttk.Progressbar(self.generation_tab, mode="determinate")
        self.progress.pack(fill="x")

    def _build_characters_tab(self) -> None:
        ttk.Label(
            self.characters_tab,
            text="Personajes detectados en las filas phrase del Audio_Master.csv",
        ).pack(anchor="w", pady=(0, 8))
        self.character_tree = ttk.Treeview(
            self.characters_tab,
            columns=("character", "voice", "status", "action"),
            show="headings",
            height=12,
        )
        self.character_tree.heading("character", text="Personaje")
        self.character_tree.heading("voice", text="Voz asignada")
        self.character_tree.heading("status", text="Estado")
        self.character_tree.heading("action", text="Acción")
        self.character_tree.column("character", width=180)
        self.character_tree.column("voice", width=330)
        self.character_tree.column("status", width=100, anchor="center")
        self.character_tree.column("action", width=130, anchor="center")
        self.character_tree.pack(fill="both", expand=True)
        controls = ttk.Frame(self.characters_tab)
        controls.pack(fill="x", pady=(10, 0))
        ttk.Label(controls, text="Voz guardada").pack(side="left")
        self.voice_combo = ttk.Combobox(controls, textvariable=self.voice_choice, state="readonly")
        self.voice_combo.pack(side="left", fill="x", expand=True, padx=8)
        ttk.Button(controls, text="Asignar", command=self.assign_selected_voice).pack(side="left", padx=(0, 6))
        ttk.Button(
            controls, text="Aplicar a todos los faltantes", command=self.assign_all_missing
        ).pack(side="left", padx=(0, 6))
        ttk.Button(controls, text="Actualizar", command=self.refresh_characters).pack(side="left", padx=(0, 6))
        ttk.Button(
            controls,
            text="Abrir gestor de voces",
            command=self._open_voice_manager,
        ).pack(side="left")

    def set_book(self, book: Book) -> None:
        self.book = book
        try:
            self.project_config = load_project_config(book)
        except ValueError as exc:
            messagebox.showerror("Configuración del libro", str(exc))
            self.project_config = ProjectConfig()
        self.model_id.set(self.project_config.elevenlabs_model_id)
        self.model_name.set(self.project_config.elevenlabs_model_name)
        self.acting_mode.set(self.project_config.acting_mode_enabled)
        self.allow_default.set(self.project_config.allow_default_voice)
        self._reset_model_options()
        self.status.configure(text=f"Libro actual: {book.code} — {book.title}")
        self.refresh_characters()

    def _model_display(self, name: str, model_id: str) -> str:
        return f"{name} ({model_id})"

    def _reset_model_options(self, models: list[ElevenLabsModel] | None = None) -> None:
        current_id = self.model_id.get().strip() or DEFAULT_MODEL_ID
        current_name = self.model_name.get().strip() or (
            self.FALLBACK_MODEL_NAME if current_id == DEFAULT_MODEL_ID else "Modelo personalizado"
        )
        fallback = self._model_display(self.FALLBACK_MODEL_NAME, DEFAULT_MODEL_ID)
        self.available_models = {}
        for model in models or []:
            display = self._model_display(model.name, model.model_id)
            self.available_models[display] = (model.name, model.model_id)
        if not any(model_id == DEFAULT_MODEL_ID for _name, model_id in self.available_models.values()):
            self.available_models[fallback] = (self.FALLBACK_MODEL_NAME, DEFAULT_MODEL_ID)
        matching = next(
            (display for display, (_name, model_id) in self.available_models.items() if model_id == current_id),
            "",
        )
        if not matching and current_id:
            matching = self._model_display(current_name, current_id)
            self.available_models[matching] = (current_name, current_id)
        if matching:
            selected_name, selected_id = self.available_models[matching]
            self.model_name.set(selected_name)
            self.model_id.set(selected_id)
        values = list(self.available_models) + [self.CUSTOM_MODEL_OPTION]
        self.model_combo.configure(values=values)
        self.model_choice.set(matching or fallback)
        self.model_entry.configure(state="disabled")
        self._update_selected_model_text()

    def _model_selected(self, _event=None) -> None:
        choice = self.model_choice.get()
        if choice == self.CUSTOM_MODEL_OPTION:
            self.model_name.set("Custom model_id")
            self.model_id.set("")
            self.model_entry.configure(state="normal")
            self.model_entry.focus_set()
        else:
            name, model_id = self.available_models.get(
                choice, (self.FALLBACK_MODEL_NAME, DEFAULT_MODEL_ID)
            )
            self.model_name.set(name)
            self.model_id.set(model_id)
            self.model_entry.configure(state="disabled")
            if self.book is not None:
                self.save_project_settings(show_confirmation=False)
        self._update_selected_model_text()

    def _model_id_changed(self, *_args) -> None:
        self._update_selected_model_text()

    def _update_selected_model_text(self) -> None:
        model_id = self.model_id.get().strip() or "SIN MODEL_ID"
        name = self.model_name.get().strip() or "Modelo personalizado"
        self.selected_model_text.set(f"Modelo seleccionado: {name} ({model_id})")

    def start_load_models(self) -> None:
        if self.book is None:
            messagebox.showwarning("Modelos ElevenLabs", "Selecciona un libro primero.")
            return
        api_key = get_api_key()
        if not api_key:
            self._models_failed(
                "Falta la API key. Guárdala primero en Voces y ajustes."
            )
            return
        self.load_models_button.configure(state="disabled")
        self.selected_model_text.set("Cargando modelos desde ElevenLabs…")
        threading.Thread(
            target=self._load_models_worker, args=(api_key,), daemon=True
        ).start()

    def _load_models_worker(self, api_key: str) -> None:
        try:
            models = ElevenLabsClient(api_key, load_settings()).list_models()
            self.after(0, lambda: self._models_loaded(models))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._models_failed(detail))

    def _models_loaded(self, models: list[ElevenLabsModel]) -> None:
        self.load_models_button.configure(state="normal")
        self._reset_model_options(models)
        if self.book is not None:
            self.save_project_settings(show_confirmation=False)
        messagebox.showinfo(
            "Modelos ElevenLabs",
            f"Se cargaron {len(models)} modelos disponibles para Text to Speech.",
        )

    def _models_failed(self, detail: str) -> None:
        self.load_models_button.configure(state="normal")
        self.model_id.set(DEFAULT_MODEL_ID)
        self.model_name.set(self.FALLBACK_MODEL_NAME)
        self._reset_model_options()
        if self.book is not None:
            self.save_project_settings(show_confirmation=False)
        messagebox.showwarning(
            "Modelos ElevenLabs",
            detail + "\n\nSe usará Eleven Multilingual v2 como respaldo.",
        )

    def _config_from_screen(self) -> ProjectConfig:
        self.project_config.elevenlabs_model_id = self.model_id.get().strip()
        self.project_config.elevenlabs_model_name = self.model_name.get().strip()
        self.project_config.acting_mode_enabled = self.acting_mode.get()
        self.project_config.allow_default_voice = self.allow_default.get()
        return self.project_config

    def save_project_settings(self, show_confirmation: bool = True) -> bool:
        if self.book is None:
            messagebox.showwarning("Audios", "Selecciona un libro primero.")
            return False
        if not self.model_id.get().strip():
            messagebox.showerror(
                "Modelo ElevenLabs",
                "El model_id está vacío. Elige un modelo del menú o escribe un Custom model_id.",
            )
            return False
        save_project_config(self.book, self._config_from_screen())
        if show_confirmation:
            messagebox.showinfo("Audios", "La configuración de este libro quedó guardada.")
        self.refresh_characters()
        return True

    def _profiles(self) -> dict[str, dict[str, str]]:
        return load_voice_profiles()

    def _characters(self) -> list[str]:
        if self.book is None:
            return []
        speakers: set[str] = set()
        try:
            if self.book.csv_path.exists():
                speakers.update(
                    row.speaker.strip()
                    for row in load_audio_csv(self.book.csv_path)
                    if row.audio_type == "phrase" and row.speaker.strip()
                )
            podcast_csv = podcast_paths(self.book)["csv"]
            if podcast_csv.exists():
                speakers.update(
                    row.speaker.strip()
                    for row in load_podcast_csv(podcast_csv)
                    if row.speaker.strip()
                )
            return sorted(speakers, key=str.casefold)
        except ValueError:
            return []

    def refresh_characters(self) -> None:
        profiles = self._profiles()
        usable_profiles = [
            name for name, profile in sorted(profiles.items(), key=lambda item: item[0].casefold())
            if profile.get("voice_id", "").strip()
        ]
        self.voice_combo.configure(values=usable_profiles)
        if usable_profiles and self.voice_choice.get() not in usable_profiles:
            self.voice_choice.set(usable_profiles[0])
        for item in self.character_tree.get_children():
            self.character_tree.delete(item)
        for speaker in self._characters():
            voice_id = character_voice_id(speaker, profiles, self.project_config)
            profile_name = next(
                (
                    name
                    for name, profile in profiles.items()
                    if profile.get("voice_id", "").strip() == voice_id
                ),
                "",
            )
            assigned = profile_name or (voice_id[:12] + "…" if voice_id else "Sin asignar")
            self.character_tree.insert(
                "",
                "end",
                iid=speaker,
                values=(
                    speaker,
                    assigned,
                    "OK" if voice_id else "Falta voz",
                    "Asignar abajo",
                ),
            )

    def assign_selected_voice(self) -> None:
        selection = self.character_tree.selection()
        if not selection:
            messagebox.showwarning("Personajes y voces", "Selecciona un personaje de la tabla.")
            return
        if not self._assign(selection):
            return
        self.refresh_characters()

    def assign_all_missing(self) -> None:
        profiles = self._profiles()
        missing = [
            speaker
            for speaker in self._characters()
            if not character_voice_id(speaker, profiles, self.project_config)
        ]
        if not missing:
            messagebox.showinfo("Personajes y voces", "Todos los personajes ya tienen voz.")
            return
        if self._assign(missing):
            self.refresh_characters()

    def _assign(self, speakers) -> bool:
        if self.book is None:
            return False
        profile_name = self.voice_choice.get()
        voice_id = self._profiles().get(profile_name, {}).get("voice_id", "").strip()
        if not voice_id:
            messagebox.showwarning("Personajes y voces", "Elige una voz guardada válida.")
            return False
        for speaker in speakers:
            self.project_config.character_voice_map[str(speaker)] = voice_id
        save_project_config(self.book, self._config_from_screen())
        return True

    def _open_voice_manager(self) -> None:
        if self.open_voice_manager:
            self.open_voice_manager()

    def start_generate(self) -> None:
        if self.book is None:
            messagebox.showwarning("Audios", "Selecciona un libro primero.")
            return
        if not self.save_project_settings(show_confirmation=False):
            return
        self.status.configure(text=self.selected_model_text.get())
        profiles = self._profiles()
        validation = validate_book(self.book, profiles, self.project_config)
        if validation.missing_characters and not self.project_config.allow_default_voice:
            self.tabs.select(self.characters_tab)
            messagebox.showwarning(
                "Faltan voces",
                "Faltan voces para estos personajes: "
                + ", ".join(validation.missing_characters)
                + ".\n\nAsígnalas en Personajes y voces antes de generar.",
            )
            return
        options = (
            self.dry_run.get(),
            self.regenerate.get(),
            self.organize_after.get(),
            profiles,
            self.project_config,
        )
        threading.Thread(target=self._generate, args=options, daemon=True).start()

    def _generate(
        self,
        dry_run: bool,
        regenerate: bool,
        organize_after: bool,
        profiles,
        project_config: ProjectConfig,
    ) -> None:
        assert self.book is not None
        try:
            result, validation = generate_book_audio(
                self.book,
                profiles,
                load_settings(),
                dry_run=dry_run,
                regenerate_existing=regenerate,
                progress=self._progress,
                project_config=project_config,
            )
            if organize_after and not dry_run and validation.is_valid:
                organize_book_audio(self.book)
            message = (
                f"{'Simulación' if result.dry_run else 'Generación'} terminada: "
                f"{len(result.generated)} nuevos, {len(result.existing)} existentes, "
                f"{len(result.errors)} errores."
            )
            self.after(0, lambda: self._finish(message, bool(result.errors)))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._finish(detail, True))

    def start_organize(self) -> None:
        if self.book is None:
            messagebox.showwarning("Audios", "Selecciona un libro primero.")
            return
        threading.Thread(target=self._organize, daemon=True).start()

    def _organize(self) -> None:
        assert self.book is not None
        try:
            copied, missing = organize_book_audio(self.book)
            message = f"Organización terminada: {copied} copias y {len(missing)} faltantes."
            self.after(0, lambda: self._finish(message, bool(missing)))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._finish(detail, True))

    def _progress(self, current: int, total: int, audio_id: str) -> None:
        def update() -> None:
            self.progress.configure(maximum=total, value=current)
            self.status.configure(text=f"Procesando {audio_id} ({current} de {total})")

        self.after(0, update)

    def _finish(self, message: str, has_problem: bool) -> None:
        self.status.configure(text=message)
        if has_problem:
            messagebox.showwarning("HanStory Studio", message)
        else:
            messagebox.showinfo("HanStory Studio", message)

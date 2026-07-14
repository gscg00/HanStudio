from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk

from ..config import (
    get_api_key, load_settings, load_voice_profiles,
    save_api_key, save_settings, save_voice_profiles,
)


class SettingsPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=16)
        self.profiles = load_voice_profiles()
        self.profiles.setdefault("Narrador", {"voice_id": "", "description": "Voz para audiolibro y escenas"})
        self.profiles.setdefault("Profesor", {"voice_id": "", "description": "Voz para explicaciones en español"})
        self.settings = load_settings()
        header = ttk.Frame(self)
        header.pack(fill="x")
        ttk.Label(header, text="Voces y ajustes", font=("Helvetica", 18, "bold")).pack(
            side="left"
        )
        ttk.Button(
            header, text="Guardar cambios", command=self.save_all
        ).pack(side="right")
        api_frame = ttk.LabelFrame(self, text="ElevenLabs", padding=10)
        api_frame.pack(fill="x", pady=(12, 8))
        ttk.Label(api_frame, text="API key").grid(row=0, column=0, sticky="w")
        self.api_var = tk.StringVar()
        ttk.Entry(api_frame, textvariable=self.api_var, show="•").grid(row=0, column=1, sticky="ew", padx=8)
        self.api_status = ttk.Label(
            api_frame,
            text="Guardada localmente" if get_api_key() else "No guardada",
        )
        self.api_status.grid(row=0, column=2)
        api_frame.columnconfigure(1, weight=1)
        self.api_var.trace_add("write", self._api_key_changed)

        voice_frame = ttk.LabelFrame(self, text="Perfiles de voz", padding=10)
        voice_frame.pack(fill="both", expand=True, pady=8)
        self.profile_list = tk.Listbox(voice_frame, width=24)
        self.profile_list.grid(row=0, column=0, rowspan=4, sticky="nsew", padx=(0, 10))
        self.profile_list.bind("<<ListboxSelect>>", self._load_selected)
        self.name_var, self.voice_var, self.description_var = tk.StringVar(), tk.StringVar(), tk.StringVar()
        for row, (label, variable) in enumerate(
            (("Personaje", self.name_var), ("Voice ID", self.voice_var), ("Descripción", self.description_var))
        ):
            ttk.Label(voice_frame, text=label).grid(row=row, column=1, sticky="w", pady=4)
            ttk.Entry(voice_frame, textvariable=variable).grid(row=row, column=2, sticky="ew", pady=4)
        ttk.Button(voice_frame, text="Añadir / actualizar", command=self.update_profile).grid(row=3, column=1, sticky="ew", pady=6)
        ttk.Button(voice_frame, text="Eliminar", command=self.delete_profile).grid(row=3, column=2, sticky="ew", pady=6)
        voice_frame.columnconfigure(2, weight=1)
        voice_frame.rowconfigure(0, weight=1)

        advanced = ttk.LabelFrame(self, text="Generación", padding=10)
        advanced.pack(fill="x", pady=8)
        self.pause_var = tk.StringVar(value=str(self.settings.pause_seconds))
        self.stability_var = tk.StringVar(value=str(self.settings.stability))
        self.similarity_var = tk.StringVar(value=str(self.settings.similarity_boost))
        self.style_var = tk.StringVar(value=str(self.settings.style))
        self.boost_var = tk.BooleanVar(value=self.settings.use_speaker_boost)
        self.safe_var = tk.BooleanVar(value=self.settings.safe_mode)
        self.rename_lesson_var = tk.BooleanVar(value=self.settings.rename_lesson_audio)
        ttk.Label(advanced, text="Pausa entre solicitudes").grid(row=0, column=0, sticky="w", pady=5)
        ttk.Entry(advanced, textvariable=self.pause_var).grid(row=0, column=1, sticky="ew", padx=8)
        ttk.Label(advanced, text="Stability (0–1)").grid(row=1, column=0, sticky="w", pady=5)
        ttk.Entry(advanced, textvariable=self.stability_var).grid(row=1, column=1, sticky="ew", padx=8)
        ttk.Label(advanced, text="Similarity boost (0–1)").grid(row=2, column=0, sticky="w", pady=5)
        ttk.Entry(advanced, textvariable=self.similarity_var).grid(row=2, column=1, sticky="ew", padx=8)
        ttk.Label(advanced, text="Style (0–1)").grid(row=3, column=0, sticky="w", pady=5)
        ttk.Entry(advanced, textvariable=self.style_var).grid(row=3, column=1, sticky="ew", padx=8)
        ttk.Checkbutton(advanced, text="Speaker boost", variable=self.boost_var).grid(row=4, column=0, sticky="w")
        ttk.Checkbutton(advanced, text="Modo seguro (no sobrescribir)", variable=self.safe_var).grid(row=4, column=1, sticky="w")
        ttk.Checkbutton(
            advanced,
            text="Renombrar audios por orden de lección",
            variable=self.rename_lesson_var,
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=(5, 0))
        advanced.columnconfigure(1, weight=1)
        self.refresh_profiles()

    def _api_key_changed(self, *_args) -> None:
        if self.api_var.get().strip():
            self.api_status.configure(text="Pendiente de guardar")
        else:
            self.api_status.configure(
                text="Guardada localmente" if get_api_key() else "No guardada"
            )

    def refresh_profiles(self) -> None:
        self.profile_list.delete(0, "end")
        for name in sorted(self.profiles, key=str.casefold):
            self.profile_list.insert("end", name)

    def _load_selected(self, _event=None) -> None:
        selection = self.profile_list.curselection()
        if not selection:
            return
        name = self.profile_list.get(selection[0])
        self.name_var.set(name)
        self.voice_var.set(self.profiles[name].get("voice_id", ""))
        self.description_var.set(self.profiles[name].get("description", ""))

    def update_profile(self) -> None:
        if not self._store_editor_profile():
            return
        self.refresh_profiles()

    def _store_editor_profile(self, show_warning: bool = True) -> bool:
        name = self.name_var.get().strip()
        if not name:
            if show_warning:
                messagebox.showwarning("Voces", "Escribe el nombre del personaje.")
            return False
        self.profiles[name] = {
            "voice_id": self.voice_var.get().strip(),
            "description": self.description_var.get().strip(),
        }
        return True

    def delete_profile(self) -> None:
        name = self.name_var.get().strip()
        if name.casefold() == "default":
            messagebox.showwarning("Voces", "El perfil default no se puede eliminar.")
            return
        self.profiles.pop(name, None)
        self.name_var.set("")
        self.voice_var.set("")
        self.description_var.set("")
        self.refresh_profiles()

    def save_all(self) -> None:
        try:
            pause = max(0.0, float(self.pause_var.get()))
            stability = float(self.stability_var.get())
            similarity = float(self.similarity_var.get())
            style = float(self.style_var.get())
        except ValueError:
            messagebox.showerror("Ajustes", "Pausa, stability, similarity y style deben ser números.")
            return
        if not all(0.0 <= value <= 1.0 for value in (stability, similarity, style)):
            messagebox.showerror("Ajustes", "Stability, similarity y style deben estar entre 0 y 1.")
            return
        if self.name_var.get().strip():
            self._store_editor_profile(show_warning=False)
        if self.api_var.get().strip():
            save_api_key(self.api_var.get())
            self.api_var.set("")
        self.api_status.configure(
            text="Guardada localmente" if get_api_key() else "No guardada"
        )
        self.settings.pause_seconds = pause
        self.settings.stability = stability
        self.settings.similarity_boost = similarity
        self.settings.style = style
        self.settings.use_speaker_boost = self.boost_var.get()
        self.settings.safe_mode = self.safe_var.get()
        self.settings.rename_lesson_audio = self.rename_lesson_var.get()
        save_settings(self.settings)
        save_voice_profiles(self.profiles)
        messagebox.showinfo(
            "Ajustes",
            "Configuración guardada. La API key quedó protegida en el archivo local .env.",
        )

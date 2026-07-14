from __future__ import annotations

import subprocess
import sys
import threading
import tkinter as tk
from tkinter import messagebox, ttk

from ..anki_exporter import (
    AnkiExportOptions,
    anki_export_dir,
    build_anki_plan,
    create_anki_export,
    default_deck_name,
)
from ..book_manager import Book


class AnkiPanel(ttk.Frame):
    TECHNICAL_ORDER = "Por Audios_Tecnico.txt"
    CSV_ORDER = "Por Audio_Master.csv"

    def __init__(self, parent) -> None:
        super().__init__(parent, padding=16)
        self.book: Book | None = None
        self.include_audio = tk.BooleanVar(value=True)
        self.phrases_only = tk.BooleanVar(value=True)
        self.create_tsv = tk.BooleanVar(value=True)
        self.deck_name = tk.StringVar()
        self.order_name = tk.StringVar(value=self.TECHNICAL_ORDER)

        ttk.Label(self, text="Anki", font=("Helvetica", 18, "bold")).pack(anchor="w")
        ttk.Label(
            self,
            text="Crea un mazo listo para importar con audio, coreano y traducción.",
        ).pack(anchor="w", pady=(4, 12))

        settings = ttk.LabelFrame(self, text="Configuración de la exportación", padding=12)
        settings.pack(fill="x")
        ttk.Label(settings, text="Nombre del mazo").grid(row=0, column=0, sticky="w")
        ttk.Entry(settings, textvariable=self.deck_name).grid(
            row=0, column=1, columnspan=2, sticky="ew", padx=(10, 0)
        )
        ttk.Label(settings, text="Orden").grid(row=1, column=0, sticky="w", pady=(10, 0))
        ttk.Combobox(
            settings,
            textvariable=self.order_name,
            values=(self.TECHNICAL_ORDER, self.CSV_ORDER),
            state="readonly",
        ).grid(row=1, column=1, sticky="w", padx=(10, 0), pady=(10, 0))
        ttk.Checkbutton(
            settings, text="Incluir audios", variable=self.include_audio
        ).grid(row=2, column=0, sticky="w", pady=(12, 0))
        ttk.Checkbutton(
            settings, text="Usar solo frases", variable=self.phrases_only
        ).grid(row=2, column=1, sticky="w", pady=(12, 0))
        ttk.Checkbutton(
            settings, text="Crear también TSV", variable=self.create_tsv
        ).grid(row=2, column=2, sticky="w", pady=(12, 0))
        settings.columnconfigure(1, weight=1)

        buttons = ttk.Frame(self)
        buttons.pack(fill="x", pady=14)
        self.generate_button = ttk.Button(
            buttons, text="Generar mazo Anki", command=self.start_export
        )
        self.generate_button.pack(side="left", padx=(0, 8))
        ttk.Button(
            buttons,
            text="Abrir carpeta de exportación",
            command=self.open_export_folder,
        ).pack(side="left")
        self.status = ttk.Label(self, text="Selecciona un libro en Biblioteca.")
        self.status.pack(anchor="w", pady=(4, 8))
        self.progress = ttk.Progressbar(self, mode="indeterminate")
        self.progress.pack(fill="x")

        help_text = (
            "El mazo usa siempre la columna text limpia. text_tts y sus marcas de "
            "actuación nunca aparecen en la tarjeta. Los MP3 originales no se modifican."
        )
        ttk.Label(self, text=help_text, wraplength=780).pack(anchor="w", pady=(14, 0))

    def set_book(self, book: Book) -> None:
        self.book = book
        self.deck_name.set(default_deck_name(book))
        self.status.configure(text=f"Libro actual: {book.code} — {book.title}")

    def _export_options(self) -> AnkiExportOptions:
        return AnkiExportOptions(
            deck_name=self.deck_name.get().strip(),
            include_audio=self.include_audio.get(),
            phrases_only=self.phrases_only.get(),
            create_tsv=self.create_tsv.get(),
            order="technical" if self.order_name.get() == self.TECHNICAL_ORDER else "csv",
        )

    def start_export(self) -> None:
        if self.book is None:
            messagebox.showwarning("Anki", "Selecciona un libro primero.")
            return
        options = self._export_options()
        if not options.deck_name:
            messagebox.showerror("Anki", "El nombre del mazo no puede estar vacío.")
            return
        try:
            plan = build_anki_plan(self.book, options)
        except Exception as exc:
            messagebox.showerror("Anki", str(exc))
            return
        if plan.missing_audio_ids:
            proceed = messagebox.askyesno(
                "Faltan audios",
                f"Faltan audios para {len(plan.missing_audio_ids)} tarjetas. "
                "¿Quieres exportar de todos modos?\n\n"
                "Las tarjetas faltantes se crearán con texto, pero sin audio.",
            )
            if not proceed:
                self.status.configure(text="Exportación cancelada. No se modificó ningún archivo.")
                return
        self.generate_button.configure(state="disabled")
        self.progress.start(12)
        self.status.configure(
            text=(
                f"Preparando {len(plan.cards)} tarjetas · "
                f"{plan.found_audio_count} audios encontrados…"
            )
        )
        threading.Thread(
            target=self._export_worker,
            args=(self.book, options, plan),
            daemon=True,
        ).start()

    def _export_worker(self, book: Book, options: AnkiExportOptions, plan) -> None:
        try:
            result = create_anki_export(book, options, plan)
            self.after(0, lambda: self._export_finished(result))
        except Exception as exc:
            detail = str(exc)
            self.after(0, lambda detail=detail: self._export_failed(detail))

    def _export_finished(self, result) -> None:
        self.progress.stop()
        self.generate_button.configure(state="normal")
        self.status.configure(
            text=(
                f"Listo: {result.cards_created} tarjetas, {result.audio_found} audios. "
                f"Archivo: {result.apkg_path.name if result.apkg_path else result.tsv_path.name}"
            )
        )
        if result.apkg_path:
            messagebox.showinfo(
                "Mazo Anki creado",
                f"Se creó el mazo con {result.cards_created} tarjetas.\n\n{result.apkg_path}",
            )
        else:
            messagebox.showwarning(
                "TSV de Anki creado",
                "Se creó el TSV y su carpeta de audios, pero no el .apkg porque "
                "genanki aún no está instalado. Cierra y vuelve a abrir la app con "
                f"conexión a internet.\n\n{result.tsv_path}",
            )

    def _export_failed(self, detail: str) -> None:
        self.progress.stop()
        self.generate_button.configure(state="normal")
        self.status.configure(text="No se pudo completar la exportación.")
        messagebox.showerror("Anki", detail)

    def open_export_folder(self) -> None:
        if self.book is None:
            messagebox.showwarning("Anki", "Selecciona un libro primero.")
            return
        folder = anki_export_dir(self.book)
        folder.mkdir(parents=True, exist_ok=True)
        if sys.platform == "darwin":
            subprocess.run(["open", str(folder)], check=False)

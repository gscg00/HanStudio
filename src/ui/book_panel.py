from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk

from ..book_manager import Book
from ..config import load_voice_profiles
from ..reports import write_report
from ..validators import validate_book


class BookPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=16)
        self.book: Book | None = None
        ttk.Label(self, text="Libro actual", font=("Helvetica", 18, "bold")).pack(anchor="w")
        self.info = ttk.Label(self, text="Selecciona un libro en Biblioteca.")
        self.info.pack(anchor="w", pady=(5, 12))
        ttk.Button(self, text="Validar libro", command=self.validate).pack(anchor="w")
        self.text = tk.Text(self, wrap="word", height=22, padx=10, pady=10)
        self.text.pack(fill="both", expand=True, pady=(12, 0))

    def set_book(self, book: Book) -> None:
        self.book = book
        files = [
            f"Título: {book.title}", f"Código: {book.code}", f"Nivel: {book.level or 'Sin especificar'}",
            f"CSV: {'Cargado' if book.csv_path.exists() else 'Falta'}",
            f"Archivo técnico: {'Cargado' if book.technical_path.exists() else 'Falta'}",
            f"Carpeta: {book.folder}",
        ]
        self.info.configure(text=" · ".join(files[:3]))
        self._show("\n".join(files))

    def validate(self) -> None:
        if self.book is None:
            messagebox.showwarning("Validar", "Selecciona un libro primero.")
            return
        result = validate_book(self.book, load_voice_profiles())
        lines = result.summary_lines()
        write_report(self.book.reports_dir, "resumen_libro.txt", lines)
        self._show("\n".join(lines))
        if result.is_valid:
            messagebox.showinfo("Validación", "El libro pasó la validación.")
        else:
            messagebox.showerror("Validación", f"Hay {len(result.errors)} error(es). Revisa el resumen.")

    def _show(self, content: str) -> None:
        self.text.configure(state="normal")
        self.text.delete("1.0", "end")
        self.text.insert("1.0", content)
        self.text.configure(state="disabled")


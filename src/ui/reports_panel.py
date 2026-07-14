from __future__ import annotations

import subprocess
import sys
import tkinter as tk
from tkinter import messagebox, ttk

from ..book_manager import Book
from ..reports import REPORT_NAMES, ensure_reports


class ReportsPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=16)
        self.book: Book | None = None
        ttk.Label(self, text="Reportes", font=("Helvetica", 18, "bold")).pack(anchor="w")
        controls = ttk.Frame(self)
        controls.pack(fill="x", pady=10)
        self.report_name = tk.StringVar(value="resumen_libro.txt")
        ttk.Combobox(controls, textvariable=self.report_name, values=REPORT_NAMES, state="readonly").pack(side="left")
        ttk.Button(controls, text="Ver reporte", command=self.show_report).pack(side="left", padx=8)
        ttk.Button(controls, text="Abrir carpeta", command=self.open_folder).pack(side="left")
        self.text = tk.Text(self, wrap="word", padx=10, pady=10)
        self.text.pack(fill="both", expand=True)

    def set_book(self, book: Book) -> None:
        self.book = book
        ensure_reports(book.reports_dir)
        self.show_report()

    def show_report(self) -> None:
        if self.book is None:
            return
        path = self.book.reports_dir / self.report_name.get()
        content = path.read_text(encoding="utf-8") if path.exists() else "Este reporte aún no existe."
        self.text.delete("1.0", "end")
        self.text.insert("1.0", content)

    def open_folder(self) -> None:
        if self.book is None:
            messagebox.showwarning("Reportes", "Selecciona un libro primero.")
            return
        ensure_reports(self.book.reports_dir)
        if sys.platform == "darwin":
            subprocess.run(["open", str(self.book.reports_dir)], check=False)


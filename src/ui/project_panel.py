from __future__ import annotations

import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from typing import Callable

from ..book_manager import Book, create_book, delete_book, import_book_file, list_books, summarize_book_folder
from ..database import search_audio


class ProjectPanel(ttk.Frame):
    def __init__(
        self,
        parent,
        on_book_selected: Callable[[Book], None],
        on_book_deleted: Callable[[], None] | None = None,
    ) -> None:
        super().__init__(parent, padding=16)
        self.on_book_selected = on_book_selected
        self.on_book_deleted = on_book_deleted
        self.books: list[Book] = []
        self.current_book: Book | None = None
        self._build()
        self.refresh()

    def _build(self) -> None:
        ttk.Label(self, text="Biblioteca de libros", font=("Helvetica", 18, "bold")).pack(anchor="w")
        ttk.Label(self, text="Cada libro conserva sus archivos y reportes por separado.").pack(
            anchor="w", pady=(2, 12)
        )
        body = ttk.Frame(self)
        body.pack(fill="both", expand=True)
        self.listbox = tk.Listbox(body, height=14)
        self.listbox.pack(side="left", fill="both", expand=True)
        self.listbox.bind("<<ListboxSelect>>", self._select)
        actions = ttk.Frame(body, padding=(12, 0))
        actions.pack(side="right", fill="y")
        for label, command in (
            ("Crear libro", self.create_dialog),
            ("Importar CSV", lambda: self.import_file("csv")),
            ("Importar técnico", lambda: self.import_file("technical")),
            ("Importar HTML", lambda: self.import_file("html")),
            ("Importar portada", lambda: self.import_file("cover")),
            ("Actualizar lista", self.refresh),
            ("Borrar libro", self.delete_current_book),
        ):
            ttk.Button(actions, text=label, command=command).pack(fill="x", pady=4)

        search_frame = ttk.LabelFrame(self, text="Buscar en la biblioteca maestra", padding=10)
        search_frame.pack(fill="x", pady=(12, 0))
        search_row = ttk.Frame(search_frame)
        search_row.pack(fill="x")
        self.search_var = tk.StringVar()
        ttk.Entry(search_row, textvariable=self.search_var).pack(side="left", fill="x", expand=True)
        ttk.Button(search_row, text="Buscar", command=self.search_master).pack(side="left", padx=(8, 0))
        self.audio_results = ttk.Treeview(
            search_frame, columns=("id", "text", "translation", "books"), show="headings", height=4
        )
        for column, label, width in (
            ("id", "ID", 90), ("text", "Texto", 180), ("translation", "Traducción", 180),
            ("books", "Libros", 220),
        ):
            self.audio_results.heading(column, text=label)
            self.audio_results.column(column, width=width)
        self.audio_results.pack(fill="x", pady=(8, 0))

    def refresh(self) -> None:
        selected_id = self.current_book.book_id if self.current_book else None
        self.books = list_books()
        self.listbox.delete(0, "end")
        selected_index = None
        for index, book in enumerate(self.books):
            self.listbox.insert("end", f"{book.code} — {book.title}")
            if book.book_id == selected_id:
                selected_index = index
        if selected_index is not None:
            self.listbox.selection_set(selected_index)
        elif selected_id is not None:
            self.current_book = None

    def _select(self, _event=None) -> None:
        selection = self.listbox.curselection()
        if not selection:
            return
        self.current_book = self.books[selection[0]]
        self.on_book_selected(self.current_book)

    def create_dialog(self) -> None:
        dialog = tk.Toplevel(self)
        dialog.title("Crear libro")
        dialog.transient(self.winfo_toplevel())
        dialog.grab_set()
        form = ttk.Frame(dialog, padding=18)
        form.pack(fill="both", expand=True)
        fields: dict[str, tk.StringVar] = {}
        for row, (key, label) in enumerate(
            (("title", "Título"), ("code", "Código interno"), ("level", "Nivel"), ("description", "Descripción"))
        ):
            ttk.Label(form, text=label).grid(row=row, column=0, sticky="w", pady=6)
            fields[key] = tk.StringVar()
            ttk.Entry(form, textvariable=fields[key], width=42).grid(row=row, column=1, pady=6)

        def save() -> None:
            try:
                book = create_book(
                    fields["title"].get(), fields["code"].get(), fields["level"].get(),
                    fields["description"].get(),
                )
            except Exception as exc:
                messagebox.showerror("Crear libro", str(exc), parent=dialog)
                return
            dialog.destroy()
            self.current_book = book
            self.refresh()
            self.on_book_selected(book)

        ttk.Button(form, text="Crear", command=save).grid(row=4, column=0, columnspan=2, sticky="ew", pady=(12, 0))

    def import_file(self, kind: str) -> None:
        if self.current_book is None:
            messagebox.showwarning("Importar", "Selecciona o crea un libro primero.")
            return
        filters = {
            "csv": [("CSV", "*.csv")], "technical": [("Texto", "*.txt")],
            "html": [("HTML", "*.html")], "cover": [("Imagen", "*.png *.jpg *.jpeg")],
        }
        source = filedialog.askopenfilename(filetypes=filters[kind])
        if not source:
            return
        try:
            destination = import_book_file(self.current_book, source, kind)
            messagebox.showinfo("Importar", f"Archivo guardado como {destination.name}.")
            self.on_book_selected(self.current_book)
        except Exception as exc:
            messagebox.showerror("Importar", str(exc))

    def delete_current_book(self) -> None:
        if self.current_book is None:
            messagebox.showwarning("Borrar libro", "Selecciona primero el libro que quieres borrar.")
            return
        book = self.current_book
        summary = summarize_book_folder(book)
        if not summary.exists:
            status = "La carpeta del libro no existe. Solo se borrará de la lista de libros."
        elif summary.is_empty:
            status = "La carpeta del libro está vacía."
        else:
            status = (
                f"La carpeta contiene {summary.file_count} archivo(s), "
                f"{summary.folder_count} carpeta(s) y pesa aproximadamente {summary.human_size}."
            )
        message = (
            f"Vas a borrar este libro:\n\n"
            f"{book.code} — {book.title}\n\n"
            f"{status}\n\n"
            f"Carpeta:\n{book.folder}\n\n"
            "Esto borrará los archivos de este libro: CSV, archivo técnico, HTML, portada, "
            "salidas, reportes, podcast y Anki del libro.\n\n"
            "No borrará la biblioteca maestra de audios reutilizables.\n\n"
            "¿Seguro que quieres borrarlo?"
        )
        if not messagebox.askyesno("Confirmar borrado de libro", message, icon="warning"):
            return
        try:
            deleted_summary = delete_book(book)
        except Exception as exc:
            messagebox.showerror("Borrar libro", str(exc))
            return
        self.current_book = None
        self.refresh()
        if self.on_book_deleted is not None:
            self.on_book_deleted()
        if deleted_summary.exists and not deleted_summary.is_empty:
            detail = (
                f"Se borró el libro y su carpeta con {deleted_summary.file_count} archivo(s)."
            )
        elif deleted_summary.exists:
            detail = "Se borró el libro. Su carpeta estaba vacía."
        else:
            detail = "Se borró el libro de la lista. La carpeta ya no existía."
        messagebox.showinfo("Borrar libro", detail)

    def search_master(self) -> None:
        for item in self.audio_results.get_children():
            self.audio_results.delete(item)
        for row in search_audio(self.search_var.get()):
            self.audio_results.insert(
                "", "end",
                values=(row["audio_id"], row["text"], row["translation"], row["books"] or ""),
            )

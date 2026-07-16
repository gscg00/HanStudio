from __future__ import annotations

import json
import subprocess
import threading
import tkinter as tk
from tkinter import messagebox, ttk

from ..book_manager import Book
from ..creative_engine import creative_runtime_connected, load_creative_runtime, test_creative_runtime
from ..web_library import WEB_LIBRARY, build_manifest, publish_book, published_books, rebuild_library, remove_book, update_published_book, validate_book
from ..web_explanations import plan_explanations
from ..web_topics import rebuild_topics


class WebLibraryPanel(ttk.Frame):
    def __init__(self, parent) -> None:
        super().__init__(parent, padding=14); self.book: Book | None = None
        ttk.Label(self, text="Biblioteca web", font=("TkDefaultFont", 18, "bold")).pack(anchor="w")
        ttk.Label(self, text="Prepara una copia pública segura para HanStory Player Web. El progreso del teléfono no se modifica.").pack(anchor="w", pady=(4, 12))
        row = ttk.Frame(self); row.pack(fill="x")
        self.version = tk.StringVar(value="1.0.0"); ttk.Label(row, text="Versión").pack(side="left"); ttk.Entry(row, textvariable=self.version, width=10).pack(side="left", padx=6)
        self.bump = tk.StringVar(value="Sin incremento"); ttk.Combobox(row, textvariable=self.bump, values=("Sin incremento", "Patch", "Minor", "Major"), state="readonly", width=16).pack(side="left", padx=6)
        explanations = ttk.LabelFrame(self, text="Explicaciones didácticas", padding=8); explanations.pack(fill="x", pady=(8, 2))
        self.generate_explanations = tk.BooleanVar(value=False); self.reuse_explanations = tk.BooleanVar(value=True); self.regenerate_explanations = tk.BooleanVar(value=False); self.only_missing = tk.BooleanVar(value=True); self.lesson_only = tk.BooleanVar(value=False); self.explanation_lesson = tk.StringVar(); self.selected_only = tk.BooleanVar(value=False); self.explanation_ids = tk.StringVar()
        self.generate_check = ttk.Checkbutton(explanations, text="Generar explicaciones con OpenAI al publicar", variable=self.generate_explanations); self.generate_check.grid(row=0, column=0, sticky="w")
        ttk.Checkbutton(explanations, text="Reutilizar explicaciones existentes", variable=self.reuse_explanations).grid(row=0, column=1, sticky="w", padx=8)
        ttk.Checkbutton(explanations, text="Regenerar explicaciones aunque ya existan", variable=self.regenerate_explanations).grid(row=1, column=0, sticky="w")
        ttk.Checkbutton(explanations, text="Solo generar faltantes", variable=self.only_missing).grid(row=1, column=1, sticky="w", padx=8)
        ttk.Checkbutton(explanations, text="Generar por lección seleccionada", variable=self.lesson_only).grid(row=2, column=0, sticky="w"); ttk.Entry(explanations, textvariable=self.explanation_lesson, width=8).grid(row=2, column=1, sticky="w", padx=8)
        ttk.Checkbutton(explanations, text="Regenerar solo IDs seleccionados", variable=self.selected_only).grid(row=3, column=0, sticky="w"); ttk.Entry(explanations, textvariable=self.explanation_ids, width=28).grid(row=3, column=1, sticky="w", padx=8)
        self.explanation_status = ttk.Label(explanations, text="Selecciona un libro para comprobar OpenAI."); self.explanation_status.grid(row=4, column=0, columnspan=2, sticky="w", pady=(5, 0))
        ttk.Button(explanations, text="Probar OpenAI / Actualizar estado", command=self.test_openai).grid(row=4, column=2, sticky="e", padx=8)
        topics = ttk.LabelFrame(self, text="Índice por temas", padding=8); topics.pack(fill="x", pady=(8, 2)); self.classify_topics_openai = tk.BooleanVar(value=False)
        ttk.Checkbutton(topics, text="Clasificar frases por temas con OpenAI", variable=self.classify_topics_openai).pack(side="left")
        for label, command in (("Analizar libro para temas", self.rebuild_topics), ("Generar/actualizar índice de temas", self.rebuild_topics), ("Revisar frases por tema", self.open_topics_folder), ("Publicar temas", self.rebuild_topics), ("Reconstruir temas desde biblioteca publicada", self.rebuild_topics)):
            ttk.Button(topics, text=label, command=command).pack(side="left", padx=3)
        buttons = ttk.Frame(self); buttons.pack(fill="x", pady=10)
        for label, command in (("Validar paquete web", self.validate), ("Retirar", self.remove), ("Abrir carpeta publicada", self.open_folder), ("Reconstruir biblioteca desde carpetas", self.rebuild)):
            ttk.Button(buttons, text=label, command=command).pack(side="left", padx=(0, 6), pady=3)
        self.publish_button = ttk.Button(buttons, text="Publicar / actualizar", command=self.publish); self.publish_button.pack(side="left", padx=(0, 6), pady=3)
        metadata = ttk.LabelFrame(self, text="Título y orden de los libros online", padding=8); metadata.pack(fill="x", pady=(0, 8))
        ttk.Label(metadata, text="Libro publicado").grid(row=0, column=0, sticky="w")
        self.published_choice = tk.StringVar(); self.published_choices: dict[str, dict] = {}
        self.published_combo = ttk.Combobox(metadata, textvariable=self.published_choice, state="readonly", width=54)
        self.published_combo.grid(row=0, column=1, columnspan=3, sticky="ew", padx=6); self.published_combo.bind("<<ComboboxSelected>>", self._load_published_selection)
        ttk.Button(metadata, text="Actualizar lista", command=self.refresh_published_books).grid(row=0, column=4, padx=4)
        self.public_title = tk.StringVar(); self.public_order = tk.StringVar(value="0")
        ttk.Label(metadata, text="Título visible").grid(row=1, column=0, sticky="w", pady=(7, 0)); ttk.Entry(metadata, textvariable=self.public_title).grid(row=1, column=1, sticky="ew", padx=6, pady=(7, 0))
        ttk.Label(metadata, text="Orden en su idioma").grid(row=1, column=2, sticky="w", padx=(10, 0), pady=(7, 0)); ttk.Spinbox(metadata, from_=0, to=999, textvariable=self.public_order, width=7).grid(row=1, column=3, sticky="w", padx=6, pady=(7, 0))
        ttk.Button(metadata, text="Guardar título y orden", command=self.save_published_metadata).grid(row=1, column=4, padx=4, pady=(7, 0))
        ttk.Label(metadata, text="El orden se aplica dentro de cada idioma. Usa 1, 2, 3…; 0 deja el libro sin posición fija.").grid(row=2, column=0, columnspan=5, sticky="w", pady=(6, 0))
        metadata.columnconfigure(1, weight=1)
        self.report = tk.Text(self, wrap="word", height=24); self.report.pack(fill="both", expand=True)
        self.refresh_published_books()
        self._show("Selecciona un libro en Biblioteca para preparar su publicación.\n\nLos archivos publicados en un sitio público podrán ser accesibles mediante internet. Publica únicamente contenido propio o contenido que tengas autorización para distribuir.")

    def set_book(self, book: Book) -> None:
        self.book = book; self.generate_explanations.set(False); self.refresh_engine_status()
        self._show(f"Libro seleccionado: {book.title} ({book.code})")

    def refresh_published_books(self) -> None:
        books = published_books(); self.published_choices = {}
        labels = []
        for book in books:
            order = int(book.get("display_order") or 0); prefix = f"{order}. " if order else ""
            label = f"{book.get('code', '')} · {book.get('target_language', '')} · {prefix}{book.get('title', '')}"
            labels.append(label); self.published_choices[label] = book
        self.published_combo.configure(values=labels)
        if labels:
            current_code = self.book.code if self.book else ""
            selected = next((label for label in labels if self.published_choices[label].get("code") == current_code), labels[0])
            self.published_choice.set(selected); self._load_published_selection()
        else:
            self.published_choice.set(""); self.public_title.set(""); self.public_order.set("0")

    def _load_published_selection(self, _event=None) -> None:
        book = self.published_choices.get(self.published_choice.get())
        if not book: return
        self.public_title.set(str(book.get("title", ""))); self.public_order.set(str(book.get("display_order") or 0))

    def save_published_metadata(self) -> None:
        book = self.published_choices.get(self.published_choice.get())
        if not book: messagebox.showinfo("Libros online", "Todavía no hay un libro publicado para editar."); return
        try:
            order = int(self.public_order.get().strip() or "0")
            entry = update_published_book(str(book.get("code", "")), self.public_title.get(), order)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            messagebox.showerror("Libros online", str(exc)); return
        self.refresh_published_books(); self._show(f"Título online actualizado: {entry['title']}\nOrden en {entry.get('target_language') or 'su idioma'}: {entry.get('display_order') or 'sin posición fija'}\n\nNo se copiaron audios ni se usaron tokens.")
        messagebox.showinfo("Libros online", "El título y el orden se actualizaron correctamente.")

    def refresh_engine_status(self) -> None:
        if not self.book: return
        runtime = load_creative_runtime(self.book); available = runtime.openai_ready
        self.generate_check.configure(state="normal" if available else "disabled")
        if not available: self.generate_explanations.set(False); text = "Configura OpenAI en Fuentes → Motor creativo o en .env."
        elif creative_runtime_connected(self.book, runtime): text = f"OpenAI conectado · Modelo: {runtime.model_name}"
        else: text = f"OpenAI configurado · Modelo: {runtime.model_name} · pulsa Probar OpenAI para verificar conexión"
        self.explanation_status.configure(text=text)

    def test_openai(self) -> None:
        if not self.book: messagebox.showwarning("OpenAI", "Selecciona primero un libro."); return
        runtime = load_creative_runtime(self.book)
        if not runtime.openai_ready: self.refresh_engine_status(); messagebox.showerror("OpenAI", "Configura OpenAI en Fuentes → Motor creativo o en .env."); return
        self.explanation_status.configure(text=f"Probando OpenAI · Modelo: {runtime.model_name}…")
        threading.Thread(target=self._test_openai_worker, daemon=True).start()

    def _test_openai_worker(self) -> None:
        try: detail = test_creative_runtime(self.book)
        except Exception as exc: self.after(0, lambda detail=str(exc): self._test_openai_finished(detail, True)); return
        self.after(0, lambda: self._test_openai_finished(detail, False))

    def _test_openai_finished(self, detail: str, failed: bool) -> None:
        self.refresh_engine_status()
        if failed: messagebox.showerror("Probar OpenAI", detail)
        else: messagebox.showinfo("Probar OpenAI", detail)

    def _show(self, text: str) -> None:
        self.report.configure(state="normal"); self.report.delete("1.0", "end"); self.report.insert("1.0", text); self.report.configure(state="disabled")

    def _require(self) -> Book | None:
        if not self.book: messagebox.showwarning("Biblioteca web", "Selecciona primero un libro en Biblioteca.")
        return self.book

    def validate(self) -> None:
        if book := self._require():
            report = validate_book(book, self.version.get()); self._show(report.text()); self._report_window("Validación del paquete web", report.text())

    def publish(self) -> None:
        book = self._require()
        if not book: return
        preview = validate_book(book, self.version.get()); self._show(preview.text())
        if not preview.ok: return
        missing = sum(1 for warning in preview.warnings if warning.startswith("Audio no encontrado:"))
        question = f"Se publicarán {len(preview.files)} audios disponibles para {book.title}."
        if missing: question += f"\n\nSe ignorarán {missing} audios faltantes. Podrás agregarlos en otra actualización."
        lesson = None
        if self.lesson_only.get():
            try: lesson = int(self.explanation_lesson.get())
            except ValueError: messagebox.showerror("Explicaciones", "Escribe un número de lección válido."); return
        regenerate = (self.regenerate_explanations.get() or not self.reuse_explanations.get()) and not self.only_missing.get(); selected_ids = {value.strip() for value in self.explanation_ids.get().split(",") if value.strip()} if self.selected_only.get() else None
        if self.selected_only.get() and not selected_ids: messagebox.showerror("Explicaciones", "Escribe uno o más IDs separados por comas."); return
        if self.generate_explanations.get():
            manifest, _, _ = build_manifest(book, self.version.get())
            plan, _ = plan_explanations(book, manifest, regenerate=regenerate, lesson=lesson, selected_ids=selected_ids)
            question += "\n\n" + plan.text() + "\n\nSe enviarán frases del libro al proveedor configurado para generar explicaciones."
        question += "\n\n¿Crear la copia pública ahora?"
        if not messagebox.askyesno("Confirmar publicación", question): return
        bump = self.bump.get().casefold() if self.bump.get() != "Sin incremento" else None
        self.publish_button.configure(state="disabled"); self._show("Publicando… Las explicaciones pueden tardar varios minutos. Puedes seguir usando la Mac.")
        threading.Thread(target=self._publish_worker, args=(book, self.version.get(), bump, lesson, regenerate, self.generate_explanations.get(), selected_ids), daemon=True).start()

    def _publish_worker(self, book: Book, version: str, bump: str | None, lesson: int | None, regenerate: bool, generate: bool, selected_ids: set[str] | None) -> None:
        try: result = publish_book(book, version, bump, generate_web_explanations=generate, regenerate_explanations=regenerate, explanation_lesson=lesson, explanation_ids=selected_ids)
        except Exception as exc: self.after(0, lambda: self._publish_failed(str(exc))); return
        self.after(0, lambda: self._publish_finished(result))

    def _publish_finished(self, result) -> None:
        self.publish_button.configure(state="normal"); self.version.set(result.version); self._show(result.text()); self._report_window("Resultado de publicación", result.text()); self.refresh_published_books()
        if not result.ok: messagebox.showerror("Biblioteca web", "Publicación fallida: los archivos no fueron copiados.")

    def _publish_failed(self, detail: str) -> None:
        self.publish_button.configure(state="normal"); self._show("Publicación fallida: " + detail); messagebox.showerror("Biblioteca web", detail)

    def remove(self) -> None:
        book = self._require()
        if book and messagebox.askyesno("Retirar libro", f"¿Retirar {book.title} de la biblioteca web? El proyecto original se conservará."):
            remove_book(book.code); self._show(f"{book.title} fue retirado de la copia pública. El libro original y el progreso del navegador se conservaron.")

    def open_folder(self) -> None:
        book = self._require()
        if not book: return
        destination = WEB_LIBRARY / "books" / book.code
        if not destination.is_dir():
            messagebox.showinfo("Biblioteca web", "La carpeta publicada aún no existe. Usa Publicar / actualizar."); return
        try: subprocess.run(["open", str(destination)], check=False)
        except OSError: self._show(f"Carpeta publicada: {destination}")

    def rebuild(self) -> None:
        result = rebuild_library(); self._show(result.text()); self.refresh_published_books()
        if not result.ok: messagebox.showerror("Biblioteca web", "No se pudo reconstruir library.json.")

    def rebuild_topics(self) -> None:
        try: index = rebuild_topics(WEB_LIBRARY); count = sum(len(value.get("topics", [])) for value in index.get("languages", {}).values()); self._show(f"Índice temático actualizado: {count} temas.\n\nLa clasificación por reglas no consume tokens y reutiliza los audios publicados.")
        except Exception as exc: messagebox.showerror("Índice por temas", str(exc))

    def open_topics_folder(self) -> None:
        destination = WEB_LIBRARY / "topics"; destination.mkdir(parents=True, exist_ok=True)
        try: subprocess.run(["open", str(destination)], check=False)
        except OSError: self._show(f"Carpeta de temas: {destination}")

    def _report_window(self, title: str, content: str) -> None:
        window = tk.Toplevel(self); window.title(title); window.geometry("720x520"); window.transient(self.winfo_toplevel())
        frame = ttk.Frame(window, padding=12); frame.pack(fill="both", expand=True)
        text = tk.Text(frame, wrap="word"); scroll = ttk.Scrollbar(frame, orient="vertical", command=text.yview); text.configure(yscrollcommand=scroll.set)
        text.insert("1.0", content); text.configure(state="disabled"); text.pack(side="left", fill="both", expand=True); scroll.pack(side="right", fill="y")
        ttk.Button(window, text="Cerrar", command=window.destroy).pack(pady=(0, 12)); window.protocol("WM_DELETE_WINDOW", window.destroy)

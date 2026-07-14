from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from ..book_manager import Book
from ..config import ensure_app_structure
from ..database import initialize_database
from .audio_panel import AudioPanel
from .anki_panel import AnkiPanel
from .book_panel import BookPanel
from .podcast_panel import PodcastPanel
from .project_panel import ProjectPanel
from .reports_panel import ReportsPanel
from .settings_panel import SettingsPanel
from .sources_panel import SourcesPanel
from .web_library_panel import WebLibraryPanel


class MainWindow(tk.Tk):
    def __init__(self) -> None:
        ensure_app_structure()
        initialize_database()
        super().__init__()
        self.title("HanStory Studio")
        self.geometry("940x680")
        self.minsize(820, 600)
        style = ttk.Style(self)
        if "aqua" in style.theme_names():
            style.theme_use("aqua")
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True)
        self.project_panel = ProjectPanel(self.notebook, self.set_current_book)
        self.book_panel = BookPanel(self.notebook)
        self.settings_panel = SettingsPanel(self.notebook)
        self.audio_panel = AudioPanel(self.notebook, self.show_voice_manager)
        self.sources_panel = SourcesPanel(self.notebook)
        self.podcast_panel = PodcastPanel(self.notebook)
        self.anki_panel = AnkiPanel(self.notebook)
        self.reports_panel = ReportsPanel(self.notebook)
        self.web_library_panel = WebLibraryPanel(self.notebook)
        self.notebook.add(self.project_panel, text="Biblioteca")
        self.notebook.add(self.book_panel, text="Libro actual")
        self.notebook.add(self.settings_panel, text="Voces y ajustes")
        self.notebook.add(self.audio_panel, text="Audios")
        self.notebook.add(self.sources_panel, text="Fuentes")
        self.notebook.add(self.podcast_panel, text="Podcast")
        self.notebook.add(self.anki_panel, text="Anki")
        self.notebook.add(self.reports_panel, text="Reportes")
        self.notebook.add(self.web_library_panel, text="Biblioteca web")
        self.notebook.bind("<<NotebookTabChanged>>", self._tab_changed)

    def show_voice_manager(self) -> None:
        self.notebook.select(self.settings_panel)

    def _tab_changed(self, _event=None) -> None:
        if self.notebook.select() == str(self.web_library_panel): self.web_library_panel.refresh_engine_status()

    def set_current_book(self, book: Book) -> None:
        self.book_panel.set_book(book)
        self.audio_panel.set_book(book)
        self.sources_panel.set_book(book)
        self.podcast_panel.set_book(book)
        self.anki_panel.set_book(book)
        self.reports_panel.set_book(book)
        self.web_library_panel.set_book(book)

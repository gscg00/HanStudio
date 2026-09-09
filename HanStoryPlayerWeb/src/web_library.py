"""Helpers de orden y rutas usados por las pruebas del Web Player.

El publicador completo vive en ``hanstory_studio/src/web_library.py``. Este
pequeño módulo mantiene disponibles las funciones puras que prueban el sitio
cuando la suite se ejecuta desde ``HanStoryPlayerWeb`` (donde el proyecto
padre no forma parte automáticamente de ``sys.path``). No se importa desde
el navegador ni se copia al artefacto público porque el empaquetador excluye
los archivos Python.
"""

from __future__ import annotations

import re
from pathlib import PurePosixPath


def natural_key(value: str) -> list[object]:
    """Ordena texto tratando sus grupos numéricos como números."""
    return [
        int(part) if part.isdigit() else part.casefold()
        for part in re.split(r"(\d+)", value)
    ]


def bump_version(version: str, part: str = "patch") -> str:
    """Incrementa una versión ``major.minor.patch`` de forma predecible."""
    numbers = [int(value) for value in (version or "1.0.0").split(".")[:3]]
    numbers += [0] * (3 - len(numbers))
    index = {"major": 0, "minor": 1, "patch": 2}.get(part, 2)
    numbers[index] += 1
    for position in range(index + 1, 3):
        numbers[position] = 0
    return ".".join(map(str, numbers))


def is_safe_relative(path: str) -> bool:
    """Comprueba que una ruta web no sea absoluta ni escape con ``..``."""
    candidate = PurePosixPath(path.replace("\\", "/"))
    return bool(path) and not candidate.is_absolute() and ".." not in candidate.parts

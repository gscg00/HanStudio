#!/usr/bin/env python3
"""Genera los SVG de Lingua. Modo placeholder no necesita red ni claves.

Para un proveedor IA, define LINGUA_IMAGE_API_URL, LINGUA_IMAGE_API_KEY y
LINGUA_IMAGE_MODEL; este script conserva el manifiesto de prompts y deja la
integración HTTP como punto seguro de extensión, sin guardar secretos.
"""
from pathlib import Path
import json, os

root = Path(__file__).resolve().parents[1]
out = root / "Sources/LinguaApp/Resources/Illustrations"; out.mkdir(parents=True, exist_ok=True)
palette = ["#A8E6CF", "#FFD3B6", "#B8C0FF", "#FFAAA5", "#9DE0E6"]
manifest = []
for i in range(1, 121):
    color = palette[(i - 1) % len(palette)]
    prompt = f"Concepto didáctico {i}, ilustración 2D original, contornos azul marino gruesos, formas redondeadas, paleta pastel, fondo crema, sin texto"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="56" fill="#FFF9E7"/><g stroke="#20264B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><path fill="{color}" d="M106 166Q256 70 406 166V356Q256 442 106 356Z"/><circle fill="#fff" cx="202" cy="244" r="40"/><circle fill="#fff" cx="310" cy="244" r="40"/><circle fill="#20264B" stroke="none" cx="210" cy="250" r="13"/><circle fill="#20264B" stroke="none" cx="302" cy="250" r="13"/><path fill="none" d="M194 324Q256 372 318 324"/><path fill="none" opacity=".45" d="M82 116l35 20M430 116l-35 20"/></g></svg>'''
    (out / f"c{i}.svg").write_text(svg)
    manifest.append({"file": f"c{i}.svg", "prompt": prompt, "model": os.getenv("LINGUA_IMAGE_MODEL", "placeholder-svg"), "mode": "placeholder"})
(root / "Illustrations.manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"Generated {len(manifest)} original SVG illustrations in {out}")

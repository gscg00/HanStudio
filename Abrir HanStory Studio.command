#!/bin/zsh

cd "$(dirname "$0")"

echo "Abriendo HanStory Studio..."

if [ ! -d ".venv" ]; then
  echo "Creando el entorno local de Python..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Revisando dependencias..."
if ! python -m pip install -r requirements.txt; then
  echo ""
  echo "No se pudieron instalar todas las funciones. Revisa tu conexión a internet."
  echo "HanStory Studio abrirá, pero PDF, EPUB, OCR o archivos .apkg pueden no estar disponibles."
fi

echo "Iniciando la app..."
python app.py

echo ""
echo "HanStory Studio se cerró. Puedes cerrar esta ventana."
read -k 1 "?Presiona cualquier tecla para salir..."

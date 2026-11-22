#!/bin/bash
# Zrzuty ekranu aplikacji (Edge w trybie headless).
# użycie: ./tools/shoot.sh nazwa "parametry-adresu" [szerokość] [wysokość]
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd -W)"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=${3:-1500},${4:-980} --screenshot="$ROOT/docs/img/$1.png" \
  "file:///$ROOT/index.html?$2" >/dev/null 2>&1
echo "docs/img/$1.png"

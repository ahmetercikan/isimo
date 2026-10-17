#!/bin/sh
# iOS el yazısı tanımayı (ios/App/App/InkVision.swift) Mac'te dener.
#   sh scripts/ink-ios/dene.sh [kelime ...]
# Çizgiler Hershey el yazısı fontundan üretilir (gerçek parmak yazısı değil, kabaca benzer).
set -e
cd "$(dirname "$0")/../.."
out="${TMPDIR:-/tmp}/ink-ios"
mkdir -p "$out"
npx tsx scripts/ink-ios/strokes.mts "$@" > "$out/strokes.json"
swiftc -O ios/App/App/InkVision.swift scripts/ink-ios/main.swift -o "$out/dene"
"$out/dene" "$out/strokes.json" "$out"
echo "Çizilen resimler: $out"

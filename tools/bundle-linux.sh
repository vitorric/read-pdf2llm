#!/usr/bin/env bash
set -euo pipefail

ARCH="$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/')"
OUT_DIR="prebuilds/linux-${ARCH}"
NODEFILE=$(ls "$OUT_DIR"/node.napi*.node 2>/dev/null | head -n1 || true)
[ -n "${NODEFILE:-}" ] || { echo "No .node in $OUT_DIR"; exit 1; }

command -v patchelf >/dev/null || { echo "patchelf missing"; exit 1; }
patchelf --set-rpath '$ORIGIN' --force-rpath "$NODEFILE"

copy_from_ldconfig () {
  local name="$1"
  local src="$(ldconfig -p | awk -v n="$name" '$1==n {print $NF; exit}')"
  [ -n "$src" ] && [ -f "$src" ] && cp -f "$src" "$OUT_DIR/" || true
}

# Copia libpdfium do PDFIUM_DIR
if [ -n "${PDFIUM_DIR:-}" ] && [ -f "$PDFIUM_DIR/lib/libpdfium.so" ]; then
  cp -f "$PDFIUM_DIR/lib/libpdfium.so" "$OUT_DIR/"
fi

# Quais libs estão faltando segundo o ldd?
MISSING="$(ldd "$NODEFILE" | awk '/not found/ {print $1}')"
for lib in $MISSING; do
  copy_from_ldconfig "$lib"
done

# Se o .node pede .so.5, garanta o arquivo .so.5
NEED_TESS="$(readelf -d "$NODEFILE" | awk '/NEEDED/ && /libtesseract/ {print $5}' | tr -d '[]' || true)"
NEED_LEPT="$(readelf -d "$NODEFILE" | awk '/NEEDED/ && /liblept/ {print $5}' | tr -d '[]' || true)"

if echo "$NEED_TESS" | grep -q 'libtesseract\.so\.5'; then
  [ -f "$OUT_DIR/libtesseract.so.5" ] || \
    [ ! -f "$OUT_DIR/libtesseract.so" ] || cp -f "$OUT_DIR/libtesseract.so" "$OUT_DIR/libtesseract.so.5" || true
  [ -f "$OUT_DIR/libtesseract.so.5" ] || copy_from_ldconfig "libtesseract.so.5"
fi

if echo "$NEED_LEPT" | grep -q 'liblept\.so\.5'; then
  [ -f "$OUT_DIR/liblept.so.5" ] || \
    [ ! -f "$OUT_DIR/liblept.so" ] || cp -f "$OUT_DIR/liblept.so" "$OUT_DIR/liblept.so.5" || true
  [ -f "$OUT_DIR/liblept.so.5" ] || copy_from_ldconfig "liblept.so.5"
fi

# libs comuns de imagem exigidas pela Leptonica (só se faltarem)
for opt in libgif.so.7 libpng16.so.16 libjpeg.so.8 libtiff.so.6 libwebp.so.7 libopenjp2.so.7; do
  [ -f "$OUT_DIR/$opt" ] || copy_from_ldconfig "$opt" || true
done

echo "Final ldd:"
ldd "$NODEFILE" || true
if ldd "$NODEFILE" | grep -i 'not found'; then
  echo "ERROR: still missing deps"
  exit 1
fi

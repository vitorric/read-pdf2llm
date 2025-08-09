#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="prebuilds/linux-$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/')"
NODEFILE=$(ls "$OUT_DIR"/node.napi*.node 2>/dev/null | head -n1 || true)
[ -n "${NODEFILE:-}" ] || { echo "No .node in $OUT_DIR"; exit 1; }

echo ">> RPATH to \$ORIGIN"
command -v patchelf >/dev/null || sudo apt-get update && sudo apt-get install -y patchelf
patchelf --set-rpath '$ORIGIN' --force-rpath "$NODEFILE"

echo ">> Detecting missing libs"
MISSING=$(ldd "$NODEFILE" | awk '/not found/ {print $1}')
if [ -z "$MISSING" ]; then
  echo "No missing libs reported by ldd (good)."
fi

copy_one() {
  local name="$1"
  # caminho exato pelo ldconfig
  local src="$(ldconfig -p | awk -v n="$name" '$1==n {print $NF; exit}')"
  if [ -z "$src" ]; then
    echo "WARN: $name not found via ldconfig -p"
    return 0
  fi
  echo "Copy $name from $src"
  cp -f "$src" "$OUT_DIR/"
}

# Copia libs que o ldd disse faltar
for lib in $MISSING; do
  copy_one "$lib"
done

# Normaliza Tesseract/Lept (se o .node pedir .so.5 mas você só tiver .so)
need_tess=$(readelf -d "$NODEFILE" | awk '/NEEDED/ && /libtesseract/ {print $5}' | tr -d '[]' || true)
need_lept=$(readelf -d "$NODEFILE" | awk '/NEEDED/ && /liblept/ {print $5}' | tr -d '[]' || true)

if echo "$need_tess" | grep -q 'libtesseract\.so\.5'; then
  if [ ! -f "$OUT_DIR/libtesseract.so.5" ]; then
    if [ -f "$OUT_DIR/libtesseract.so" ]; then
      cp -f "$OUT_DIR/libtesseract.so" "$OUT_DIR/libtesseract.so.5"
    else
      copy_one "libtesseract.so.5" || true
    fi
  fi
fi

if echo "$need_lept" | grep -q 'liblept\.so\.5'; then
  if [ ! -f "$OUT_DIR/liblept.so.5" ]; then
    if [ -f "$OUT_DIR/liblept.so" ]; then
      cp -f "$OUT_DIR/liblept.so" "$OUT_DIR/liblept.so.5"
    else
      copy_one "liblept.so.5" || true
    fi
  fi
fi

# Alguns formatos de imagem comuns exigidos pela Leptonica:
for opt in libgif.so.7 libpng16.so.16 libjpeg.so.8 libtiff.so.6 libwebp.so.7 libopenjp2.so.7; do
  [ -f "$OUT_DIR/$opt" ] || copy_one "$opt" || true
done

echo ">> Final ldd"
ldd "$NODEFILE"
if ldd "$NODEFILE" | grep -i 'not found'; then
  echo "ERROR: still missing deps"
  exit 1
fi

echo "Bundling DONE in $OUT_DIR"

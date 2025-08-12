FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
  curl gnupg ca-certificates wget git python3 make g++ build-essential \
  tesseract-ocr libtesseract-dev libleptonica-dev software-properties-common \
  tesseract-ocr-por pkg-config patchelf

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app
COPY . .

# PDFium
ENV PDFIUM_DIR=/app/pdfium
RUN mkdir -p "$PDFIUM_DIR" && \
    curl -L https://github.com/bblanchon/pdfium-binaries/releases/latest/download/pdfium-linux-x64.tgz -o pdfium.tgz && \
    tar -xzf pdfium.tgz -C "$PDFIUM_DIR" && \
    test -f "$PDFIUM_DIR/include/fpdfview.h" && rm -f pdfium.tgz

RUN npm install --ignore-scripts
RUN npx node-gyp configure && npx node-gyp build
RUN npx prebuild --napi --strip && \
    mkdir -p prebuilds/linux-x64 && \
    cp -f $(find . -name "*.node" | head -n1) prebuilds/linux-x64/node.napi.node && \
    bash tools/bundle-linux.sh && \
    ls -al prebuilds/linux-x64 && \
    ldd prebuilds/linux-x64/node.napi.node

CMD ["node", "-e", "require('./index.js'); console.log('OK')"]

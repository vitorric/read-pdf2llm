FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
  curl gnupg ca-certificates wget git python3 make g++ build-essential \
  tesseract-ocr libtesseract-dev libleptonica-dev software-properties-common \
  tesseract-ocr-por

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

COPY . .

RUN mkdir -p pdfium && \
    curl -L https://github.com/bblanchon/pdfium-binaries/releases/latest/download/pdfium-linux-x64.tgz -o pdfium.tgz && \
    tar -xzf pdfium.tgz -C pdfium && \
    ls -l pdfium/include/fpdfview.h && \
    rm pdfium.tgz


RUN npm install node-addon-api

RUN npm install --ignore-scripts

RUN npx node-gyp configure
RUN npx node-gyp build

ENV LD_LIBRARY_PATH=/app/pdfium/lib

#CMD ["node", "--expose-gc", "benchmark/index.js"]
CMD ["node", "index.js"]

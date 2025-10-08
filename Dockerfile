# Dockerfile.dev
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

# SO + toolchain + tesseract
RUN apt-get update && apt-get install -y \
  curl gnupg ca-certificates wget git python3 make g++ build-essential \
  tesseract-ocr libtesseract-dev libleptonica-dev software-properties-common \
  tesseract-ocr-por \
  && rm -rf /var/lib/apt/lists/*

# Node 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps antes do bind mount (melhor cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# PDFium para runtime + headers
RUN mkdir -p /opt/pdfium && \
    curl -L https://github.com/bblanchon/pdfium-binaries/releases/latest/download/pdfium-linux-x64.tgz -o /tmp/pdfium.tgz && \
    tar -xzf /tmp/pdfium.tgz -C /opt/pdfium && \
    rm /tmp/pdfium.tgz

# node-gyp (vai compilar o addon quando necessário)
# se o addon não compilar via postinstall, você pode forçar com:
# RUN npx node-gyp configure && npx node-gyp build

# aponte para /opt/pdfium/lib
ENV LD_LIBRARY_PATH=/opt/pdfium/lib
ENV NODE_ENV=development

# expõe a porta padrão do Nest
EXPOSE 3000

# start de desenvolvimento (ts-node / nest --watch)
CMD ["npm", "run", "start:dev"]

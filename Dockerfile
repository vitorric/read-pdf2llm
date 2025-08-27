# ========== Base com dependências de SO ==========
FROM ubuntu:24.04 AS base
ENV DEBIAN_FRONTEND=noninteractive
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

# ========== Stage de build (compila Nest + addons) ==========
FROM base AS build

# Copie apenas os manifests primeiro (cache melhor)
COPY package*.json ./
# Caso use pnpm/yarn, ajuste aqui

# Instala dependências (com dev) sem executar scripts ainda (se necessário)
RUN npm ci --ignore-scripts

# Copia o resto do código
COPY . .

# Baixa PDFium (runtime + headers para o node-gyp)
RUN mkdir -p pdfium && \
    curl -L https://github.com/bblanchon/pdfium-binaries/releases/latest/download/pdfium-linux-x64.tgz -o pdfium.tgz && \
    tar -xzf pdfium.tgz -C pdfium && \
    rm pdfium.tgz

# Garante que node-addon-api e afins existam (se seu addon depende)
RUN npm install node-addon-api

# Agora rode os scripts (se você bloqueou com --ignore-scripts)
# Ex.: se seu projeto usa postinstall do Nest/TypeORM, etc.
# (Opcional) RUN npm rebuild

# Compila o addon nativo
# (assume que exista binding.gyp na raiz; ajuste o caminho se for em subpasta)
RUN npx node-gyp configure && npx node-gyp build

# Compila o Nest (gera dist/)
# Espera que exista: "build": "nest build" OU "tsc -p tsconfig.build.json"
RUN npm run build

# ========== Stage final (runtime enxuto) ==========
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copia apenas o que precisa para rodar
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copia artefatos compilados
COPY --from=build /app/dist ./dist
COPY --from=build /app/build/Release ./build/Release
COPY --from=build /app/pdfium ./pdfium

# Se você tiver outros assets (views, emails, schemas, etc.), copie aqui
# COPY --from=build /app/assets ./assets

# Biblioteca do PDFium no path
ENV LD_LIBRARY_PATH=/app/pdfium/lib

# Porta padrão Nest (ajuste se usa outra)
EXPOSE 3000

# Início em produção
# Espera script: "start:prod": "node dist/main.js"
CMD ["npm", "run", "start:prod"]

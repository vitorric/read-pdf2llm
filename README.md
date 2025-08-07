<div align="center">
    
# 📑 read-pdf2llm 📑
    
**Extração de texto de PDFs (com fallback OCR) de alta performance para Node.js, otimizado para pipelines LLM.**  
</div>

----

## Sumário

-   [Descrição](#descrição)
-   [Recursos](#recursos)
-   [Pré-requisitos](#pré-requisitos)
-   [Instalação](#instalação)
-   [Como usar](#como-usar)
-   [Notas técnicas](#notas-técnicas)
-   [Benchmark](#benchmark)

## Descrição

Este módulo permite extrair texto de arquivos PDF de forma rápida e eficiente, utilizando bibliotecas de baixo nível (PDFium). Caso o texto não esteja disponível no PDF (exemplo: PDFs digitalizados), ele faz fallback automático para OCR usando Tesseract, garantindo máxima cobertura. Ideal para pipelines de processamento de documentos para LLMs.

## Recursos

-   Extração nativa via PDFium (rapidez e precisão).
-   Fallback automático para OCR via Tesseract (para PDFs digitalizados ou protegidos).
-   Emissão de eventos de progresso e de páginas durante o processamento.
-   Otimizado para uso em pipelines de processamento massivo.
-   Implementação em C++ via Node-API (N-API): máxima performance.  
-   Pensado para ser usado em pipelines com LLMs, reduzindo custos de tokenização.
    

## Pré-requisitos

-   **Node.js** >= 14
-   **Python** (para node-gyp, se necessário)
-   **C++** >=17

Dependências Nativas:
- [PDFium](https://pdfium.googlesource.com/pdfium/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [Leptonica](https://github.com/DanBloomberg/leptonica)
- [node-addon-api](https://github.com/nodejs/node-addon-api) (devDependency)

## Instalação

1.  **Clone o repositório:**

```sh
 git clone https://github.com/vitorric/read-pdf2llm.git
 cd read-pdf2llm
```
    
2.   **Use Docker para simplificar o ambiente:** 

```sh
npm run build:docker
npm run run:docker
```

## Como usar

#### Estrutura dos eventos

-   **page**: Emitido para cada página processada.
    -   Payload: `{ page: <número>, text: <texto extraído> }`
-   **progress**: Emitido a cada 5 páginas ou no final.
    -   Payload: `{ current, total, percent }`
-   **end**: Emitido ao concluir a leitura do PDF.
-   **error**: Emitido em caso de erro.

### Script exemplo: `index.js`


```javascript
class PdfReader extends EventEmitter {
    constructor(path) {
        super();
        try {
            startReading(this.emit.bind(this), path);
        } catch (err) {
            this.emit('error', err);
        }
    }
}

function readPDF2LLM(name, filePath) {
    return new Promise((resolve, reject) => {
        const reader = new PdfReader(filePath);

        reader.on('page', ({ page, text }) => {
            console.log(`[${name}] Página ${page}: ${text.length}`);
        });

        reader.on('progress', ({ current, total, percent }) => {
            console.log(`[${name}] Progresso: ${current}/${total} (${percent.toFixed(1)}%)`);
        });

        reader.on('end', () => {
            console.log(`✅ ${name} concluída`);
            resolve();
        });

        reader.on('error', (err) => {
            console.error(`❌ ${name} erro:`, err);
            reject(err);
        });
    });
}
```
## Notas técnicas

-   O addon foi escrito em C++ moderno (C++17+).
-   Usa RAII para gerenciamento seguro de recursos (páginas, imagens, ponteiros).
-   Usa ThreadSafeFunction para emitir eventos do lado C++ para JS.
-   O fallback de OCR só é usado se o PDF não contiver texto embutido.
-   Pequeno cache de OCR por imagem para evitar processamento duplicado.
-   Apenas arquivos locais `.pdf` permitidos por segurança.
-   Suporte ao idioma do OCR customizável (`por` por padrão).

## Benchmark

> Neste benchmark, apenas comparei algumas libs existentes com funcionalidade de extração de texto em NodeJS:

![benchmark libs extracao texto](imgs/benchmark_text.png?no-preview=1)


# License

Released under the MIT License.

----

Dúvidas, contribuições ou sugestões?  
Abra uma [issue](https://github.com/vitorric/read-pdf2llm/issues) ou envie um PR!

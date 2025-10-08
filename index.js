const fs = require('fs');
const path = require('path');
const { startReading } = require('./build/Release/read-pdf2llm.node');
const { EventEmitter } = require('events');

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


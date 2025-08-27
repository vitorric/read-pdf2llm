import type { Pdf2LlmAddon } from './types';

const addon = require('bindings')('read-pdf2llm') as Pdf2LlmAddon;

export const { startReading } = addon;

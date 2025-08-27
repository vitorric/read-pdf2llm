export interface PageEvent {
  page: number;
  text: string;
}

export interface ProgressEvent {
  current: number;
  total: number;
  percent: number;
}

export interface Pdf2LlmAddon {
  startReading: (
    emit: (event: string, payload?: unknown) => void,
    filePath: string,
  ) => void;
}

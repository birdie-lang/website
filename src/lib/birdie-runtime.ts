import type { Diagnostic } from '@codemirror/lint';

interface BirdieDiagnostic {
  message: string;
  startByte: number;
  endByte: number;
}

interface BirdieResult {
  value: string | null;
  diagnostics: BirdieDiagnostic[];
}

type WorkerMessage = BirdieResult | { ready: true } | { error: string };

interface PendingRun {
  source: string;
  onStart: () => void;
  resolve: (result: BirdieResult) => void;
  reject: (error: Error) => void;
}

export class BirdieRuntime {
  #worker?: Worker;
  #ready = false;
  #pending?: PendingRun;
  #timeout?: ReturnType<typeof setTimeout>;

  warmUp() {
    if (this.#worker) return;
    let worker: Worker;
    try {
      worker = new Worker('/wasm/worker.js');
    } catch {
      return;
    }
    this.#worker = worker;
    this.#timeout = setTimeout(() => this.dispose('The Birdie interpreter took too long to load. Try running again.'), 20000);
    worker.onerror = () => this.dispose('The Birdie interpreter stopped. Try running again.');
    worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if ('ready' in data) {
        clearTimeout(this.#timeout);
        this.#ready = true;
        this.#execute();
      } else if ('error' in data) {
        this.dispose(data.error);
      } else {
        clearTimeout(this.#timeout);
        const pending = this.#pending;
        this.#pending = undefined;
        pending?.resolve(data);
      }
    };
  }

  run(source: string, onStart: () => void): Promise<BirdieResult> {
    this.warmUp();
    if (!this.#worker) return Promise.reject(new Error('Could not start the Birdie interpreter.'));
    if (this.#pending) return Promise.reject(new Error('Birdie is already running.'));

    return new Promise((resolve, reject) => {
      this.#pending = { source, onStart, resolve, reject };
      this.#execute();
    });
  }

  #execute() {
    if (!this.#ready || !this.#worker || !this.#pending) return;
    this.#pending.onStart();
    this.#timeout = setTimeout(() => this.dispose('Execution timed out. Run again to start a fresh interpreter.'), 2000);
    this.#worker.postMessage(this.#pending.source);
  }

  dispose(message = 'Run cancelled.') {
    clearTimeout(this.#timeout);
    this.#worker?.terminate();
    this.#worker = undefined;
    this.#ready = false;
    const pending = this.#pending;
    this.#pending = undefined;
    pending?.reject(new Error(message));
  }
}

export function editorDiagnostics(source: string, diagnostics: BirdieDiagnostic[]): Diagnostic[] {
  if (diagnostics.length === 0) return [];

  const bytes = new TextEncoder().encode(source);
  const positions = new Uint32Array(bytes.length + 1);
  let position = 0;
  for (const [index, byte] of bytes.entries()) {
    // Continuation bytes point to the start of the same character.
    if (byte >= 0x80 && byte < 0xc0) {
      positions[index] = positions[index - 1] ?? 0;
    } else {
      positions[index] = position;
      position += byte >= 0xf0 ? 2 : 1;
    }
  }
  positions[bytes.length] = position;

  return diagnostics.map(({ startByte, endByte, message }) => ({
    from: positions[startByte] ?? source.length,
    to: positions[endByte] ?? source.length,
    severity: 'error',
    message,
  }));
}

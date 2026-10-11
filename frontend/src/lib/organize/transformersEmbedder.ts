import { Embedder, EMBEDDING_MODEL_ID } from './embedder';

interface WorkerReply {
  id: number;
  vectors?: number[][];
  error?: string;
}

/**
 * Browser embedder backed by Transformers.js running in a dedicated Web Worker,
 * so model loading and inference never block the UI thread.
 */
export class TransformersEmbedder implements Embedder {
  readonly modelId = EMBEDDING_MODEL_ID;
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (v: number[][]) => void; reject: (e: Error) => void }>();

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./embed.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        const { id, vectors, error } = event.data;
        const entry = this.pending.get(id);
        if (!entry) return;
        this.pending.delete(id);
        if (error || !vectors) entry.reject(new Error(error || 'Embedding failed'));
        else entry.resolve(vectors);
      };
      this.worker.onerror = (event) => {
        const err = new Error(event.message || 'Embedding worker crashed');
        for (const entry of this.pending.values()) entry.reject(err);
        this.pending.clear();
      };
    }
    return this.worker;
  }

  embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return Promise.resolve([]);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.getWorker().postMessage({ id, texts });
    });
  }
}

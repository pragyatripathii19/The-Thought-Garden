/**
 * Turns text into vectors. The production implementation runs a small model
 * in a Web Worker (see transformersEmbedder.ts); tests use a fake.
 */
export interface Embedder {
  readonly modelId: string;
  embed(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

/**
 * Fast, stable, non-cryptographic hash (FNV-1a, 32-bit) used to detect when a
 * thought's text changed since it was embedded or classified.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** True when the browser can run the in-worker embedding model. */
export function canRunLocalEmbedder(): boolean {
  return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
}

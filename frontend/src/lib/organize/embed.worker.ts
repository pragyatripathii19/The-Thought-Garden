import { pipeline, env } from '@huggingface/transformers';
import { EMBEDDING_MODEL_ID } from './embedder';

// Model weights are fetched once (from the Hugging Face CDN) and cached by the browser.
// Only the model is downloaded — thought text never leaves this worker.
env.allowLocalModels = false;

type Extractor = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean }
) => Promise<{ tolist(): number[][] }>;

let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    const createPipeline = pipeline as unknown as (
      task: string,
      model: string,
      options: Record<string, unknown>
    ) => Promise<Extractor>;
    extractorPromise = createPipeline('feature-extraction', EMBEDDING_MODEL_ID, { dtype: 'q8' });
  }
  return extractorPromise;
}

interface EmbedRequest {
  id: number;
  texts: string[];
}

self.onmessage = async (event: MessageEvent<EmbedRequest>) => {
  const { id, texts } = event.data;
  try {
    const extractor = await getExtractor();
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    self.postMessage({ id, vectors: output.tolist() });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : 'Embedding failed' });
  }
};

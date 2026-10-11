/**
 * Runs tasks one at a time, in order, skipping keys that are queued or still
 * running. Serial execution prevents two quick thoughts from both creating the
 * same collection; holding the key until the task finishes prevents a thought
 * from being processed twice while its state update is still in flight.
 */
export class SerialQueue {
  private chain: Promise<void> = Promise.resolve();
  private queued = new Set<string>();

  enqueue(key: string, task: () => Promise<void>): Promise<void> {
    if (this.queued.has(key)) return this.chain;
    this.queued.add(key);
    this.chain = this.chain.then(async () => {
      try {
        await task();
      } catch (err) {
        console.warn('Organiser task failed:', err instanceof Error ? err.message : err);
      } finally {
        this.queued.delete(key);
      }
    });
    return this.chain;
  }

  has(key: string): boolean {
    return this.queued.has(key);
  }

  get size(): number {
    return this.queued.size;
  }
}

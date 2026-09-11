type PreviewResult = {
  blob: Blob;
  width: number;
  height: number;
  engine: "webgpu" | "cpu-tiled";
  tiled: boolean;
};

type QueueItem = {
  source: Blob;
  maxEdge: number;
  resolve: (result: PreviewResult) => void;
  reject: (error: Error) => void;
};

type Slot = { worker: Worker; busy: boolean };

class ImageWorkerPool {
  private slots: Slot[];
  private queue: QueueItem[] = [];

  constructor(size: number) {
    this.slots = Array.from({ length: size }, () => ({
      worker: new Worker("/image-worker.js"),
      busy: false,
    }));
  }

  run(source: Blob, maxEdge: number) {
    return new Promise<PreviewResult>((resolve, reject) => {
      this.queue.push({ source, maxEdge, resolve, reject });
      void this.pump();
    });
  }

  private async pump() {
    const slot = this.slots.find((candidate) => !candidate.busy);
    const item = this.queue.shift();
    if (!slot || !item) {
      if (item) this.queue.unshift(item);
      return;
    }
    slot.busy = true;
    try {
      const bitmap = await createImageBitmap(item.source);
      const result = await new Promise<PreviewResult>((resolve, reject) => {
        const cleanup = () => {
          slot.worker.onmessage = null;
          slot.worker.onerror = null;
        };
        slot.worker.onmessage = (event) => {
          cleanup();
          if (event.data?.error) reject(new Error(event.data.error));
          else resolve(event.data as PreviewResult);
        };
        slot.worker.onerror = () => {
          cleanup();
          reject(new Error("Image worker failed"));
        };
        slot.worker.postMessage(
          { bitmap, maxEdge: item.maxEdge, strength: 0.32 },
          [bitmap],
        );
      });
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error("Worker failed"));
    } finally {
      slot.busy = false;
      void this.pump();
    }
  }
}

let pool: ImageWorkerPool | null = null;

export function createPreviewInWorker(source: Blob, maxEdge: number) {
  if (!pool) {
    const cores = navigator.hardwareConcurrency || 4;
    pool = new ImageWorkerPool(Math.max(1, Math.min(4, Math.floor(cores / 2))));
  }
  return pool.run(source, maxEdge);
}

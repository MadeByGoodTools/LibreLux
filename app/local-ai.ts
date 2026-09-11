type ProgressCallback = (message: string, progress?: number) => void;

const RESTORE_MODEL = "Xenova/swin2SR-lightweight-x2-64";
const SEGMENT_MODEL = "Xenova/segformer_b0_clothes";

type PipelineRunner = (input: unknown) => Promise<unknown>;
type PipelineFactory = (
  task: "image-to-image" | "image-segmentation",
  model: string,
  options: Record<string, unknown>,
) => Promise<PipelineRunner>;

let restorePipeline: Promise<PipelineRunner> | null = null;
let segmentPipeline: Promise<PipelineRunner> | null = null;

async function createLocalPipeline(
  task: "image-to-image" | "image-segmentation",
  model: string,
  onProgress?: ProgressCallback,
) {
  const { env, pipeline } = await import("@huggingface/transformers");
  const createPipeline = pipeline as unknown as PipelineFactory;
  env.allowLocalModels = true;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
  const progress_callback = (event: { status?: string; progress?: number }) =>
    onProgress?.(
      event.status === "progress" ? "Downloading local AI pack" : "Preparing local AI",
      event.progress,
    );
  if ("gpu" in navigator) {
    try {
      return await createPipeline(task, model, {
        device: "webgpu",
        dtype: "q8",
        progress_callback,
      });
    } catch {
      onProgress?.("WebGPU unavailable; using local WebAssembly");
    }
  }
  return createPipeline(task, model, {
    device: "wasm",
    dtype: "q8",
    progress_callback,
  });
}

function getRestorePipeline(onProgress?: ProgressCallback) {
  restorePipeline ??= createLocalPipeline(
    "image-to-image",
    RESTORE_MODEL,
    onProgress,
  );
  return restorePipeline;
}

function getSegmentPipeline(onProgress?: ProgressCallback) {
  segmentPipeline ??= createLocalPipeline(
    "image-segmentation",
    SEGMENT_MODEL,
    onProgress,
  );
  return segmentPipeline;
}

export async function installLocalAiPack(
  kind: "restore" | "segment" | "all",
  onProgress?: ProgressCallback,
) {
  if (kind === "restore" || kind === "all") await getRestorePipeline(onProgress);
  if (kind === "segment" || kind === "all") await getSegmentPipeline(onProgress);
  localStorage.setItem(`librelux-ai-${kind}`, "installed");
  return true;
}

export function localAiPackState() {
  return {
    restore:
      localStorage.getItem("librelux-ai-restore") === "installed" ||
      localStorage.getItem("librelux-ai-all") === "installed",
    segment:
      localStorage.getItem("librelux-ai-segment") === "installed" ||
      localStorage.getItem("librelux-ai-all") === "installed",
  };
}

export async function runNeuralRestore(
  source: Blob,
  strength: number,
  outputScale = 1,
  onProgress?: ProgressCallback,
) {
  const { RawImage } = await import("@huggingface/transformers");
  const raw = await RawImage.fromBlob(source);
  const restorer = await getRestorePipeline(onProgress);
  onProgress?.("Running neural detail recovery", 100);
  const enhanced = (await restorer(raw)) as { toCanvas: () => HTMLCanvasElement };
  const originalCanvas = raw.toCanvas() as HTMLCanvasElement;
  const enhancedCanvas = enhanced.toCanvas() as HTMLCanvasElement;
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(raw.width * outputScale));
  output.height = Math.max(1, Math.round(raw.height * outputScale));
  const context = output.getContext("2d");
  if (!context) throw new Error("Neural output canvas unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(originalCanvas, 0, 0, output.width, output.height);
  context.globalAlpha = Math.max(0, Math.min(1, strength / 100));
  context.drawImage(enhancedCanvas, 0, 0, output.width, output.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Neural output encoding failed");
  return blob;
}

const categoryMatches = (label: string, target: string) => {
  const normalized = label.toLowerCase();
  if (target === "skin")
    return /skin|face|arm|leg|neck/.test(normalized);
  if (target === "clothes")
    return /shirt|dress|coat|pant|skirt|shoe|sock|hat|jacket|clothes|bag/.test(
      normalized,
    );
  if (target === "hair") return /hair|hat/.test(normalized);
  if (target === "person" || target === "subject")
    return !/background/.test(normalized);
  return normalized.includes(target);
};

export async function buildSemanticAiMask(
  canvas: HTMLCanvasElement,
  target: string,
  point: { x: number; y: number },
  onProgress?: ProgressCallback,
) {
  const { RawImage } = await import("@huggingface/transformers");
  const segmenter = await getSegmentPipeline(onProgress);
  onProgress?.("Running semantic selection", 100);
  const raw = RawImage.fromCanvas(canvas);
  const results = (await segmenter(raw)) as Array<{
    label: string | null;
    score: number | null;
    mask: InstanceType<typeof RawImage>;
  }>;
  let matches = results.filter((result) =>
    categoryMatches(result.label ?? "", target),
  );
  if (!matches.length || target === "object") {
    const atPoint = results.filter((result) => {
      const x = Math.min(result.mask.width - 1, Math.floor(point.x * result.mask.width));
      const y = Math.min(result.mask.height - 1, Math.floor(point.y * result.mask.height));
      const offset = (y * result.mask.width + x) * result.mask.channels;
      return Number(result.mask.data[offset]) > 96;
    });
    if (atPoint.length) matches = [atPoint.at(-1)!];
  }
  if (!matches.length) throw new Error(`No ${target} region was found`);
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const context = mask.getContext("2d");
  if (!context) throw new Error("Mask canvas unavailable");
  for (const result of matches) {
    const source = result.mask.toCanvas() as HTMLCanvasElement;
    context.globalCompositeOperation = "lighter";
    context.drawImage(source, 0, 0, mask.width, mask.height);
  }
  context.globalCompositeOperation = "source-over";
  return {
    dataUrl: mask.toDataURL("image/png"),
    labels: matches.map((result) => result.label ?? "Region"),
  };
}

export const localAiModels = {
  restore: RESTORE_MODEL,
  segmentation: SEGMENT_MODEL,
};

type ProgressCallback = (message: string, progress?: number) => void;

const RESTORE_MODEL = "Xenova/swin2SR-lightweight-x2-64";
const SEGMENT_MODEL = "Xenova/segformer_b0_clothes";
const PORTRAIT_MATTE_MODEL = "Xenova/modnet";

type PipelineRunner = (input: unknown) => Promise<unknown>;
type PipelineFactory = (
  task: "image-to-image" | "image-segmentation" | "background-removal",
  model: string,
  options: Record<string, unknown>,
) => Promise<PipelineRunner>;

let restorePipeline: Promise<PipelineRunner> | null = null;
let segmentPipeline: Promise<PipelineRunner> | null = null;
let portraitMattePipeline: Promise<PipelineRunner> | null = null;
let restoreReady = false;
let segmentReady = false;

async function createLocalPipeline(
  task: "image-to-image" | "image-segmentation" | "background-removal",
  model: string,
  onProgress?: ProgressCallback,
) {
  const { env, pipeline } = await import("@huggingface/transformers");
  const createPipeline = pipeline as unknown as PipelineFactory;
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  // Keep model weights in memory for this editing session only. Closing the
  // LibreLux tab releases the pipelines instead of leaving an app-owned cache.
  env.useBrowserCache = false;
  const progress_callback = (event: { status?: string; progress?: number }) =>
    onProgress?.(
      event.status === "progress" ? "Downloading local AI pack" : "Preparing local AI",
      event.progress,
    );
  const gpu = (
    navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown | null> };
    }
  ).gpu;
  const gpuAdapter = gpu ? await gpu.requestAdapter().catch(() => null) : null;
  if (gpuAdapter) {
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
  restorePipeline ??= createLocalPipeline("image-to-image", RESTORE_MODEL, onProgress).catch(
    (error) => {
      restorePipeline = null;
      throw error;
    },
  );
  return restorePipeline;
}

function getSegmentPipeline(onProgress?: ProgressCallback) {
  segmentPipeline ??= createLocalPipeline("image-segmentation", SEGMENT_MODEL, onProgress).catch(
    (error) => {
      segmentPipeline = null;
      throw error;
    },
  );
  return segmentPipeline;
}

function getPortraitMattePipeline(onProgress?: ProgressCallback) {
  portraitMattePipeline ??= createLocalPipeline(
    "background-removal",
    PORTRAIT_MATTE_MODEL,
    onProgress,
  ).catch((error) => {
    portraitMattePipeline = null;
    throw error;
  });
  return portraitMattePipeline;
}

export async function installLocalAiPack(
  kind: "restore" | "segment" | "all",
  onProgress?: ProgressCallback,
) {
  if (kind === "restore" || kind === "all") {
    await getRestorePipeline(onProgress);
    restoreReady = true;
  }
  if (kind === "segment" || kind === "all") {
    await Promise.all([
      getSegmentPipeline(onProgress),
      getPortraitMattePipeline(onProgress),
    ]);
    segmentReady = true;
  }
  return true;
}

export function localAiPackState() {
  return {
    restore: restoreReady,
    segment: segmentReady,
  };
}

export async function clearLocalAiSession() {
  restorePipeline = null;
  segmentPipeline = null;
  portraitMattePipeline = null;
  restoreReady = false;
  segmentReady = false;
  localStorage.removeItem("librelux-ai-restore");
  localStorage.removeItem("librelux-ai-segment");
  localStorage.removeItem("librelux-ai-all");
  if (typeof caches !== "undefined")
    await caches.delete("transformers-cache").catch(() => false);
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
  if (target === "skin") return /skin|face|arm|leg|neck/.test(normalized);
  if (target === "facial-skin" || target === "face")
    return /face|facial.skin/.test(normalized);
  if (target === "body-skin") return /arm|leg|body.skin|neck/.test(normalized);
  if (target === "clothes")
    return /shirt|dress|coat|pant|skirt|shoe|sock|hat|jacket|clothes|bag/.test(
      normalized,
    );
  if (target === "hair") return /hair/.test(normalized);
  if (target === "person" || target === "subject")
    return !/background/.test(normalized);
  return normalized.includes(target);
};

function alphaMaskCanvas(
  source: HTMLCanvasElement,
  width: number,
  height: number,
) {
  const scaled = document.createElement("canvas");
  scaled.width = width;
  scaled.height = height;
  const context = scaled.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Mask canvas unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance = Math.max(
      pixels.data[index],
      pixels.data[index + 1],
      pixels.data[index + 2],
    );
    const alpha = (pixels.data[index + 3] * luminance) / 255;
    pixels.data[index] = 255;
    pixels.data[index + 1] = 255;
    pixels.data[index + 2] = 255;
    pixels.data[index + 3] = alpha;
  }
  context.putImageData(pixels, 0, 0);
  return scaled;
}

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
    context.drawImage(alphaMaskCanvas(source, mask.width, mask.height), 0, 0);
  }
  context.globalCompositeOperation = "source-over";
  return {
    dataUrl: mask.toDataURL("image/png"),
    labels: matches.map((result) => result.label ?? "Region"),
  };
}

export async function buildPortraitMatte(
  canvas: HTMLCanvasElement,
  target: "subject" | "background" | "person",
  onProgress?: ProgressCallback,
) {
  const { RawImage } = await import("@huggingface/transformers");
  const segmenter = await getPortraitMattePipeline(onProgress);
  onProgress?.("Building a high-detail subject edge", 100);
  const result = (await segmenter(RawImage.fromCanvas(canvas))) as
    | { toCanvas: () => HTMLCanvasElement }
    | Array<{ toCanvas: () => HTMLCanvasElement }>;
  const rawMask = Array.isArray(result) ? result[0] : result;
  if (!rawMask?.toCanvas) throw new Error("No portrait subject was found");
  const mask = alphaMaskCanvas(rawMask.toCanvas(), canvas.width, canvas.height);
  if (target === "background") {
    const context = mask.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Background mask canvas unavailable");
    const pixels = context.getImageData(0, 0, mask.width, mask.height);
    for (let index = 3; index < pixels.data.length; index += 4)
      pixels.data[index] = 255 - pixels.data[index];
    context.putImageData(pixels, 0, 0);
  }
  return {
    dataUrl: mask.toDataURL("image/png"),
    labels: [target === "background" ? "Background" : "Portrait subject"],
  };
}

export const localAiModels = {
  restore: RESTORE_MODEL,
  segmentation: SEGMENT_MODEL,
  portraitMatte: PORTRAIT_MATTE_MODEL,
};

export type DetailOptions = {
  deconvolution: number;
  apertureCorrection: number;
  cornerSharpness: number;
  outputSharpen: number;
};

const clampByte = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

export function applyTiledDetail(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: DetailOptions,
) {
  const sharpeningAmount = Math.min(
    1.8,
    (options.apertureCorrection * 0.7 + options.outputSharpen) / 100,
  );
  if (
    sharpeningAmount <= 0 &&
    options.cornerSharpness <= 0 &&
    options.deconvolution <= 0
  )
    return;
  const tileSize = 512;
  for (let top = 0; top < height; top += tileSize) {
    for (let left = 0; left < width; left += tileSize) {
      const originX = Math.max(0, left - 1);
      const originY = Math.max(0, top - 1);
      const tileWidth = Math.min(width - originX, tileSize + 2);
      const tileHeight = Math.min(height - originY, tileSize + 2);
      const image = context.getImageData(
        originX,
        originY,
        tileWidth,
        tileHeight,
      );
      const source = new Uint8ClampedArray(image.data);
      let deconvolved: Float32Array | null = null;
      if (options.deconvolution > 0) {
        deconvolved = new Float32Array(source.length);
        deconvolved.set(source);
        const blend = Math.min(1, options.deconvolution / 100);
        for (let channel = 0; channel < 3; channel++) {
          const estimate = new Float32Array(tileWidth * tileHeight);
          const original = new Float32Array(tileWidth * tileHeight);
          for (let pixel = 0; pixel < estimate.length; pixel++) {
            estimate[pixel] = source[pixel * 4 + channel] / 255;
            original[pixel] = estimate[pixel];
          }
          for (let iteration = 0; iteration < 2; iteration++) {
            const ratio = new Float32Array(estimate.length);
            for (let y = 1; y < tileHeight - 1; y++)
              for (let x = 1; x < tileWidth - 1; x++) {
                const pixel = y * tileWidth + x;
                const blurred =
                  (estimate[pixel] * 4 +
                    estimate[pixel - 1] +
                    estimate[pixel + 1] +
                    estimate[pixel - tileWidth] +
                    estimate[pixel + tileWidth]) /
                  8;
                ratio[pixel] = original[pixel] / Math.max(0.003, blurred);
              }
            const next = new Float32Array(estimate);
            for (let y = 2; y < tileHeight - 2; y++)
              for (let x = 2; x < tileWidth - 2; x++) {
                const pixel = y * tileWidth + x;
                const correction =
                  (ratio[pixel] * 4 +
                    ratio[pixel - 1] +
                    ratio[pixel + 1] +
                    ratio[pixel - tileWidth] +
                    ratio[pixel + tileWidth]) /
                  8;
                next[pixel] = Math.max(
                  0,
                  Math.min(1, estimate[pixel] * correction),
                );
              }
            estimate.set(next);
          }
          for (let pixel = 0; pixel < estimate.length; pixel++)
            deconvolved[pixel * 4 + channel] =
              source[pixel * 4 + channel] * (1 - blend) +
              estimate[pixel] * 255 * blend;
        }
      }
      const detailSource = deconvolved ?? source;
      for (let y = 1; y < tileHeight - 1; y++) {
        for (let x = 1; x < tileWidth - 1; x++) {
          const offset = (y * tileWidth + x) * 4;
          const globalX = originX + x;
          const globalY = originY + y;
          const nx = (globalX / Math.max(1, width - 1) - 0.5) * 2;
          const ny = (globalY / Math.max(1, height - 1) - 0.5) * 2;
          const edgeWeight = Math.min(1, Math.sqrt(nx * nx + ny * ny));
          const strength =
            sharpeningAmount + (options.cornerSharpness / 100) * edgeWeight;
          for (let channel = 0; channel < 3; channel++) {
            const center = detailSource[offset + channel];
            const average =
              (detailSource[offset - 4 + channel] +
                detailSource[offset + 4 + channel] +
                detailSource[offset - tileWidth * 4 + channel] +
                detailSource[offset + tileWidth * 4 + channel]) /
              4;
            image.data[offset + channel] = clampByte(
              center + (center - average) * strength,
            );
          }
        }
      }
      const cropLeft = left - originX;
      const cropTop = top - originY;
      const outputWidth = Math.min(tileSize, width - left);
      const outputHeight = Math.min(tileSize, height - top);
      context.putImageData(
        image,
        originX,
        originY,
        cropLeft,
        cropTop,
        outputWidth,
        outputHeight,
      );
    }
  }
}

export function applyDepthAwareLensBlur(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
) {
  if (amount <= 0) return;
  const sharp = document.createElement("canvas");
  sharp.width = width;
  sharp.height = height;
  sharp.getContext("2d")?.drawImage(context.canvas, 0, 0);
  const blurred = document.createElement("canvas");
  blurred.width = width;
  blurred.height = height;
  const blurContext = blurred.getContext("2d");
  if (!blurContext) return;
  blurContext.filter = `blur(${Math.max(1, amount)}px)`;
  blurContext.drawImage(sharp, 0, 0);
  context.save();
  context.resetTransform();
  context.clearRect(0, 0, width, height);
  context.drawImage(blurred, 0, 0);

  const subject = document.createElement("canvas");
  subject.width = width;
  subject.height = height;
  const subjectContext = subject.getContext("2d", { willReadFrequently: true });
  if (!subjectContext) {
    context.restore();
    return;
  }
  subjectContext.drawImage(sharp, 0, 0);
  const pixels = subjectContext.getImageData(0, 0, width, height);
  const source = new Uint8ClampedArray(pixels.data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const offset = (y * width + x) * 4;
      const nx = (x / Math.max(1, width - 1) - 0.5) / 0.34;
      const ny = (y / Math.max(1, height - 1) - 0.5) / 0.48;
      const centerPrior = Math.max(0, 1.2 - Math.sqrt(nx * nx + ny * ny));
      const luminance =
        source[offset] * 0.2126 +
        source[offset + 1] * 0.7152 +
        source[offset + 2] * 0.0722;
      const neighbor =
        (source[offset - 4] +
          source[offset + 4] +
          source[offset - width * 4] +
          source[offset + width * 4]) /
        4;
      const saliency = Math.min(1, Math.abs(luminance - neighbor) / 42);
      pixels.data[offset + 3] = clampByte(
        255 * Math.min(1, centerPrior * 0.82 + saliency * 0.32),
      );
    }
  }
  subjectContext.putImageData(pixels, 0, 0);
  context.drawImage(subject, 0, 0);
  context.restore();
}

export function estimateGpuBudget(deviceMemory = 4) {
  const budgetMb = Math.max(96, Math.min(1024, deviceMemory * 128));
  const maxPixels = Math.floor((budgetMb * 1024 * 1024) / 20);
  return { budgetMb, maxPixels, tileSize: maxPixels > 30_000_000 ? 1024 : 512 };
}

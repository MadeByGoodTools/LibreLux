self.onmessage = async (event) => {
  const { bitmap, maxEdge } = event.data;
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const pixels = context.getImageData(0, 0, width, height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const offset = (y * width + x) * 4;
        const average = [0, 1, 2].map((channel) =>
          Math.round(
            (pixels.data[offset - 4 + channel] +
              pixels.data[offset + 4 + channel] +
              pixels.data[offset - width * 4 + channel] +
              pixels.data[offset + width * 4 + channel]) /
              4,
          ),
        );
        if (
          Math.max(
            Math.abs(pixels.data[offset] - average[0]),
            Math.abs(pixels.data[offset + 1] - average[1]),
            Math.abs(pixels.data[offset + 2] - average[2]),
          ) > 110
        ) {
          pixels.data[offset] = average[0];
          pixels.data[offset + 1] = average[1];
          pixels.data[offset + 2] = average[2];
        }
      }
    }
    context.putImageData(pixels, 0, 0);
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.82,
    });
    self.postMessage({ blob, width, height });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Worker failed",
    });
  }
};

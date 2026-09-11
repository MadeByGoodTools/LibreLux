const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)));

function cpuRepairAndSharpen(pixels, width, height, strength) {
  const source = new Uint8ClampedArray(pixels.data);
  const tileSize = 512;
  for (let tileY = 0; tileY < height; tileY += tileSize) {
    for (let tileX = 0; tileX < width; tileX += tileSize) {
      const endY = Math.min(height - 1, tileY + tileSize);
      const endX = Math.min(width - 1, tileX + tileSize);
      for (let y = Math.max(1, tileY); y < endY; y++) {
        for (let x = Math.max(1, tileX); x < endX; x++) {
          const offset = (y * width + x) * 4;
          for (let channel = 0; channel < 3; channel++) {
            const average =
              (source[offset - 4 + channel] +
                source[offset + 4 + channel] +
                source[offset - width * 4 + channel] +
                source[offset + width * 4 + channel]) /
              4;
            const value = source[offset + channel];
            pixels.data[offset + channel] =
              Math.abs(value - average) > 110
                ? Math.round(average)
                : clamp(value + (value - average) * strength);
          }
        }
      }
    }
  }
}

async function gpuRepairAndSharpen(pixels, width, height, strength) {
  if (!self.navigator?.gpu) return false;
  const adapter = await self.navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) return false;
  const device = await adapter.requestDevice();
  const input = new Uint32Array(pixels.data.buffer.slice(0));
  const byteLength = input.byteLength;
  const inputBuffer = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const outputBuffer = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const readBuffer = device.createBuffer({
    size: byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const params = new Float32Array([width, height, strength, 0]);
  const paramsBuffer = device.createBuffer({
    size: params.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(inputBuffer, 0, input);
  device.queue.writeBuffer(paramsBuffer, 0, params);
  const shader = device.createShaderModule({
    code: `
      struct Params { width: f32, height: f32, strength: f32, padding: f32 }
      @group(0) @binding(0) var<storage, read> inputPixels: array<u32>;
      @group(0) @binding(1) var<storage, read_write> outputPixels: array<u32>;
      @group(0) @binding(2) var<uniform> params: Params;
      fn channel(pixel: u32, shift: u32) -> f32 { return f32((pixel >> shift) & 255u); }
      fn packed(r: f32, g: f32, b: f32, a: f32) -> u32 {
        return u32(clamp(r, 0.0, 255.0)) |
          (u32(clamp(g, 0.0, 255.0)) << 8u) |
          (u32(clamp(b, 0.0, 255.0)) << 16u) |
          (u32(clamp(a, 0.0, 255.0)) << 24u);
      }
      @compute @workgroup_size(16, 16)
      fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
        let width = u32(params.width);
        let height = u32(params.height);
        if (gid.x >= width || gid.y >= height) { return; }
        let index = gid.y * width + gid.x;
        let center = inputPixels[index];
        if (gid.x == 0u || gid.y == 0u || gid.x + 1u >= width || gid.y + 1u >= height) {
          outputPixels[index] = center;
          return;
        }
        let neighbors = array<u32, 4>(inputPixels[index - 1u], inputPixels[index + 1u], inputPixels[index - width], inputPixels[index + width]);
        var out = vec3<f32>(channel(center, 0u), channel(center, 8u), channel(center, 16u));
        var avg = vec3<f32>(0.0);
        for (var n = 0u; n < 4u; n++) {
          avg += vec3<f32>(channel(neighbors[n], 0u), channel(neighbors[n], 8u), channel(neighbors[n], 16u));
        }
        avg /= 4.0;
        let delta = abs(out - avg);
        out = select(out + (out - avg) * params.strength, avg, delta > vec3<f32>(110.0));
        outputPixels[index] = packed(out.r, out.g, out.b, channel(center, 24u));
      }`,
  });
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: shader, entryPoint: "main" },
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: inputBuffer } },
      { binding: 1, resource: { buffer: outputBuffer } },
      { binding: 2, resource: { buffer: paramsBuffer } },
    ],
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16));
  pass.end();
  encoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, byteLength);
  device.queue.submit([encoder.finish()]);
  await readBuffer.mapAsync(GPUMapMode.READ);
  pixels.data.set(new Uint8ClampedArray(readBuffer.getMappedRange().slice(0)));
  readBuffer.unmap();
  device.destroy();
  return true;
}

self.onmessage = async (event) => {
  const {
    bitmap,
    maxEdge,
    strength = 0.32,
    mime = "image/jpeg",
    quality = 0.84,
  } = event.data;
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const pixels = context.getImageData(0, 0, width, height);
    let engine = "cpu-tiled";
    try {
      if (await gpuRepairAndSharpen(pixels, width, height, strength))
        engine = "webgpu";
      else cpuRepairAndSharpen(pixels, width, height, strength);
    } catch {
      cpuRepairAndSharpen(pixels, width, height, strength);
    }
    context.putImageData(pixels, 0, 0);
    const blob = await canvas.convertToBlob({
      type: mime,
      quality,
    });
    self.postMessage({ blob, width, height, engine, tiled: true });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Worker failed",
    });
  }
};

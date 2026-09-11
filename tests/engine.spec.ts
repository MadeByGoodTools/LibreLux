import { expect, test } from "@playwright/test";

test("16-bit TIFF, linear DNG, and 32-bit HDR masters contain required tags", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('html[data-librelux-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite exposes this browser module during release QA.
    const engine = await import("/app/advanced-engine.ts");
    // @ts-expect-error Vite exposes this browser module during release QA.
    const linearEngine = await import("/app/linear-raw-engine.ts");
    const first = new ImageData(
      new Uint8ClampedArray([16, 80, 240, 255, 220, 130, 30, 255]),
      2,
      1,
    );
    const second = new ImageData(
      new Uint8ClampedArray([40, 110, 255, 255, 255, 180, 70, 255]),
      2,
      1,
    );
    const readTags = async (blob: Blob) => {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const view = new DataView(bytes.buffer);
      const offset = view.getUint32(4, true);
      const count = view.getUint16(offset, true);
      const tags: Record<number, { type: number; count: number; value: number }> = {};
      for (let index = 0; index < count; index++) {
        const entry = offset + 2 + index * 12;
        tags[view.getUint16(entry, true)] = {
          type: view.getUint16(entry + 2, true),
          count: view.getUint32(entry + 4, true),
          value: view.getUint32(entry + 8, true),
        };
      }
      return { prefix: String.fromCharCode(bytes[0], bytes[1]), tags };
    };
    const tiff = await readTags(engine.encodeRgb16(first, "tiff16", "display-p3"));
    const dng = await readTags(
      engine.encodeRgb16(first, "dng16", "prophoto-rgb", "QA camera"),
    );
    const merged = engine.mergeHdrFloat32([first, second]);
    const hdr = await readTags(
      engine.encodeHdrFloat32(2, 1, merged.linear, "prophoto-rgb"),
    );
    const fineSource = {
      width: 2,
      height: 1,
      sourceBitDepth: 16,
      workingSpace: "linear-prophoto-rgb" as const,
      data: new Float32Array([
        0.5, 0.4, 0.3,
        0.5005, 0.4005, 0.3005,
      ]),
    };
    const fineDeveloped = linearEngine.applyLinearDevelop(fineSource, {
      exposure: 0.25,
      contrast: 8,
    });
    const fineBlob = engine.encodeLinearRgb16(
      fineDeveloped,
      "tiff16",
      "prophoto-rgb",
    );
    const fineBytes = new Uint8Array(await fineBlob.arrayBuffer());
    const fineView = new DataView(fineBytes.buffer);
    const fineIfd = fineView.getUint32(4, true);
    const fineCount = fineView.getUint16(fineIfd, true);
    let finePixelOffset = 0;
    for (let index = 0; index < fineCount; index++) {
      const entry = fineIfd + 2 + index * 12;
      if (fineView.getUint16(entry, true) === 273)
        finePixelOffset = fineView.getUint32(entry + 8, true);
    }
    return {
      tiff,
      dng,
      hdr,
      mergedLength: merged.linear.length,
      converted: Array.from(
        engine.convertImageColorSpace(first, "adobe-rgb").data.slice(0, 3),
      ),
      fineLinearSamples: [
        fineView.getUint16(finePixelOffset, true),
        fineView.getUint16(finePixelOffset + 6, true),
      ],
    };
  });
  expect(result.tiff.prefix).toBe("II");
  expect(result.tiff.tags[258].count).toBe(3);
  expect(result.tiff.tags[34675].count).toBeGreaterThan(100);
  expect(result.dng.tags[50706].count).toBe(4);
  expect(result.dng.tags[50717].count).toBe(3);
  expect(result.hdr.tags[258].count).toBe(3);
  expect(result.hdr.tags[339].count).toBe(3);
  expect(result.mergedLength).toBe(6);
  expect(result.converted).not.toEqual([16, 80, 240]);
  expect(result.fineLinearSamples[1]).toBeGreaterThan(result.fineLinearSamples[0]);
  expect(result.fineLinearSamples[1] - result.fineLinearSamples[0]).toBeLessThan(257);
});

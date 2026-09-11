import { expect, test } from "@playwright/test";

test("16-bit TIFF, linear DNG, and 32-bit HDR masters contain required tags", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('html[data-librelux-ready="true"]').waitFor();
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite exposes this browser module during release QA.
    const engine = await import("/app/advanced-engine.ts");
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
    return {
      tiff,
      dng,
      hdr,
      mergedLength: merged.linear.length,
      converted: Array.from(
        engine.convertImageColorSpace(first, "adobe-rgb").data.slice(0, 3),
      ),
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
});

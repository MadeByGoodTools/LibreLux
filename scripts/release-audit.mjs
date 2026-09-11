import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const required = {
  "app/page.tsx": [
    "previewPhoto",
    "Preset amount",
    "mergeHdrFloat32",
    "encodeHdrFloat32",
    "encodeRgb16",
    "buildSemanticAiMask",
    "installMeasuredOpticsPack",
    "installSpectralFilmPack",
    "effectStack",
    "reviewComments",
    "/librelux-logo.svg",
  ],
  "app/advanced-engine.ts": ["tiff16", "dng16", "tiff32", "ICCProfile"],
  "app/local-ai.ts": ["swin2SR", "segformer_b0_clothes", "webgpu", "wasm"],
  "app/open-packs.ts": ["lensfun", "darktable-spektrafilm", "filmHistory"],
  "public/image-worker.js": ["OffscreenCanvas", "convertToBlob", "webgpu"],
  "qa/browser-matrix.md": ["Chromium", "WebKit", "Gecko", "Tablet"],
};

const failures = [];
for (const [file, tokens] of Object.entries(required)) {
  const text = read(file);
  for (const token of tokens)
    if (!text.toLowerCase().includes(token.toLowerCase()))
      failures.push(`${file}: missing ${token}`);
}
for (const checklist of [
  "librelux-feature-checklist.md",
  "librelux-optics-suite-checklist.md",
]) {
  const remaining = read(checklist)
    .split("\n")
    .filter((line) => line.startsWith("- [ ]"));
  if (remaining.length) failures.push(`${checklist}: ${remaining.length} incomplete items`);
}
const texture = fs.readFileSync(
  path.join(root, "public/textures/analog-dust-scratches.png"),
);
if (texture.subarray(1, 4).toString() !== "PNG")
  failures.push("analog texture is not a PNG");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("LibreLux release audit passed");

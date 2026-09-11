import type { LinearRawImage } from "./image-codecs";

type CurveBand = { shadows?: number; midtones?: number; highlights?: number };
type ChannelCurves = Partial<Record<"rgb" | "red" | "green" | "blue", CurveBand>>;

export type LinearDevelopAdjustments = {
  exposure?: number;
  contrast?: number;
  highlights?: number;
  shadows?: number;
  whites?: number;
  blacks?: number;
  temperature?: number;
  tint?: number;
  vibrance?: number;
  saturation?: number;
  hue?: number;
  fade?: number;
  vignette?: number;
  vignetteMidpoint?: number;
  vignetteFeather?: number;
  shadowHue?: number;
  shadowSaturation?: number;
  midtoneHue?: number;
  midtoneSaturation?: number;
  highlightHue?: number;
  highlightSaturation?: number;
  globalGradeHue?: number;
  globalGradeSaturation?: number;
  gradingBalance?: number;
  redPrimaryHue?: number;
  redPrimarySaturation?: number;
  greenPrimaryHue?: number;
  greenPrimarySaturation?: number;
  bluePrimaryHue?: number;
  bluePrimarySaturation?: number;
  negativeInversion?: number;
  grain?: number;
  grainSize?: number;
  grainRoughness?: number;
  sharpness?: number;
  lensSharpness?: number;
  deconvolution?: number;
  noise?: number;
  neuralDenoise?: number;
  colorNoise?: number;
  clarity?: number;
  dehaze?: number;
  highlightRecovery?: number;
  hdrGain?: number;
  wideGamut?: number;
  curves?: ChannelCurves;
  curveShadows?: number;
  curveMidtones?: number;
  curveHighlights?: number;
};

export type LinearGeometry = {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  rotation?: number;
  flipX?: number;
  flipY?: number;
  perspectiveH?: number;
  perspectiveV?: number;
  perspectiveScale?: number;
  distortion?: number;
  anamorphic?: number;
  offsetX?: number;
  offsetY?: number;
};

export type LinearEffectLayer = {
  enabled: boolean;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "color" | "luminosity";
  settings: LinearDevelopAdjustments;
};

const clamp = (value: number, low = 0, high = 1) =>
  Math.max(low, Math.min(high, value));

const luminance = (r: number, g: number, b: number) =>
  0.288 * r + 0.712 * g + 0.0001 * b;

function sampleBilinear(source: LinearRawImage, x: number, y: number, channel: number) {
  const x0 = Math.max(0, Math.min(source.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(source.height - 1, Math.floor(y)));
  const x1 = Math.min(source.width - 1, x0 + 1);
  const y1 = Math.min(source.height - 1, y0 + 1);
  const tx = clamp(x - x0);
  const ty = clamp(y - y0);
  const a = source.data[(y0 * source.width + x0) * 3 + channel];
  const b = source.data[(y0 * source.width + x1) * 3 + channel];
  const c = source.data[(y1 * source.width + x0) * 3 + channel];
  const d = source.data[(y1 * source.width + x1) * 3 + channel];
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

/** Crop, rotate, correct perspective, and resize without reducing channel precision. */
export function resampleLinearRaw(source: LinearRawImage, geometry: LinearGeometry): LinearRawImage {
  const width = Math.max(1, Math.round(geometry.width));
  const height = Math.max(1, Math.round(geometry.height));
  const identity =
    width === source.width &&
    height === source.height &&
    Math.abs(geometry.sourceX) < 0.001 &&
    Math.abs(geometry.sourceY) < 0.001 &&
    Math.abs(geometry.sourceWidth - source.width) < 0.001 &&
    Math.abs(geometry.sourceHeight - source.height) < 0.001 &&
    Math.abs(geometry.rotation ?? 0) < 0.001 &&
    (geometry.flipX ?? 1) === 1 &&
    (geometry.flipY ?? 1) === 1 &&
    Math.abs(geometry.perspectiveH ?? 0) < 0.001 &&
    Math.abs(geometry.perspectiveV ?? 0) < 0.001 &&
    Math.abs((geometry.perspectiveScale ?? 100) - 100) < 0.001 &&
    Math.abs(geometry.distortion ?? 0) < 0.001 &&
    Math.abs(geometry.anamorphic ?? 0) < 0.001 &&
    Math.abs(geometry.offsetX ?? 0) < 0.001 &&
    Math.abs(geometry.offsetY ?? 0) < 0.001;
  if (identity) return source;
  const output = new Float32Array(width * height * 3);
  const radians = -((geometry.rotation ?? 0) * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const flipX = geometry.flipX ?? 1;
  const flipY = geometry.flipY ?? 1;
  const scale = Math.max(
    0.05,
    ((geometry.perspectiveScale ?? 100) / 100) *
      (1 + (geometry.distortion ?? 0) / 700),
  );
  const anamorphic = Math.max(0.1, 1 + (geometry.anamorphic ?? 0) / 200);
  const shearX = (geometry.perspectiveH ?? 0) / 450;
  const shearY = (geometry.perspectiveV ?? 0) / 450;
  const offsetX = (geometry.offsetX ?? 0) / Math.max(1, width);
  const offsetY = (geometry.offsetY ?? 0) / Math.max(1, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nx = (x + 0.5) / width - 0.5 - offsetX;
      let ny = (y + 0.5) / height - 0.5 - offsetY;
      const rx = nx * cosine - ny * sine;
      const ry = nx * sine + ny * cosine;
      nx = (rx - shearX * ry) / (scale * flipX * anamorphic);
      ny = (ry - shearY * rx) / (scale * flipY);
      const sx = geometry.sourceX + (nx + 0.5) * geometry.sourceWidth;
      const sy = geometry.sourceY + (ny + 0.5) * geometry.sourceHeight;
      const target = (y * width + x) * 3;
      if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) continue;
      output[target] = sampleBilinear(source, sx, sy, 0);
      output[target + 1] = sampleBilinear(source, sx, sy, 1);
      output[target + 2] = sampleBilinear(source, sx, sy, 2);
    }
  }
  return { ...source, width, height, data: output };
}

function hueVector(hue = 0) {
  const angle = (hue * Math.PI) / 180;
  return [
    0.5 + 0.5 * Math.cos(angle),
    0.5 + 0.5 * Math.cos(angle - (2 * Math.PI) / 3),
    0.5 + 0.5 * Math.cos(angle + (2 * Math.PI) / 3),
  ];
}

function gradePixel(rgb: number[], a: LinearDevelopAdjustments, x: number, y: number, width: number, height: number) {
  const exposure = 2 ** ((a.exposure ?? 0) + (a.hdrGain ?? 0) / 80);
  const warmth = (a.temperature ?? 0) / 300;
  const tint = (a.tint ?? 0) / 350;
  let r = rgb[0] * exposure * (1 + warmth + tint * 0.25);
  let g = rgb[1] * exposure * (1 - tint * 0.45);
  let b = rgb[2] * exposure * (1 - warmth + tint * 0.2);
  let luma = Math.max(0, luminance(r, g, b));

  const shadows = (a.shadows ?? 0) / 100;
  const highlights = (a.highlights ?? 0) / 100;
  const whites = (a.whites ?? 0) / 100;
  const blacks = (a.blacks ?? 0) / 100;
  const shadowWeight = (1 - clamp(luma)) ** 2;
  const highlightWeight = clamp(luma) ** 2;
  const tone =
    1 + shadows * shadowWeight * 0.75 + highlights * highlightWeight * 0.6;
  const lift = blacks * shadowWeight * 0.08 + whites * highlightWeight * 0.12;
  r = r * tone + lift;
  g = g * tone + lift;
  b = b * tone + lift;
  const recovery = clamp((a.highlightRecovery ?? 0) / 100);
  if (recovery) {
    r = r / (1 + Math.max(0, r - 0.72) * recovery * 1.8);
    g = g / (1 + Math.max(0, g - 0.72) * recovery * 1.8);
    b = b / (1 + Math.max(0, b - 0.72) * recovery * 1.8);
  }

  const contrast = 2 ** (((a.contrast ?? 0) + (a.clarity ?? 0) * 0.3 + (a.dehaze ?? 0) * 0.22) / 100);
  const pivot = 0.18;
  r = pivot * Math.sign(r / pivot) * Math.abs(r / pivot) ** contrast;
  g = pivot * Math.sign(g / pivot) * Math.abs(g / pivot) ** contrast;
  b = pivot * Math.sign(b / pivot) * Math.abs(b / pivot) ** contrast;

  const curves = a.curves ?? {};
  const curveApply = (value: number, channel: keyof ChannelCurves) => {
    const global = curves.rgb ?? {};
    const local = curves[channel] ?? {};
    const apply = (band: CurveBand) => {
      const low = (band.shadows ?? 0) / 100;
      const mid = (band.midtones ?? 0) / 100;
      const high = (band.highlights ?? 0) / 100;
      const encoded = clamp(value) ** (1 / 2.2);
      return value + low * (1 - encoded) ** 2 * 0.18 + mid * (1 - Math.abs(encoded - 0.5) * 2) * 0.16 + high * encoded ** 2 * 0.18;
    };
    return apply(local) + (apply(global) - value);
  };
  r = curveApply(r, "red");
  g = curveApply(g, "green");
  b = curveApply(b, "blue");

  luma = Math.max(0, luminance(r, g, b));
  const saturation = Math.max(0, 1 + (a.saturation ?? 0) / 100 + (a.wideGamut ?? 0) / 500);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const vibrance = 1 + ((a.vibrance ?? 0) / 100) * (1 - clamp(chroma));
  const sat = saturation * vibrance;
  r = luma + (r - luma) * sat;
  g = luma + (g - luma) * sat;
  b = luma + (b - luma) * sat;

  const hue = ((a.hue ?? 0) * Math.PI) / 180;
  if (hue) {
    const u = Math.cos(hue), v = Math.sin(hue);
    const nr = (0.299 + 0.701 * u + 0.168 * v) * r + (0.587 - 0.587 * u + 0.33 * v) * g + (0.114 - 0.114 * u - 0.497 * v) * b;
    const ng = (0.299 - 0.299 * u - 0.328 * v) * r + (0.587 + 0.413 * u + 0.035 * v) * g + (0.114 - 0.114 * u + 0.292 * v) * b;
    const nb = (0.299 - 0.3 * u + 1.25 * v) * r + (0.587 - 0.588 * u - 1.05 * v) * g + (0.114 + 0.886 * u - 0.203 * v) * b;
    r = nr; g = ng; b = nb;
  }

  const addGrade = (gradeHue: number | undefined, amount: number | undefined, weight: number) => {
    const strength = ((amount ?? 0) / 100) * weight * 0.22;
    if (!strength) return;
    const vector = hueVector(gradeHue);
    r += (vector[0] - 0.5) * strength;
    g += (vector[1] - 0.5) * strength;
    b += (vector[2] - 0.5) * strength;
  };
  const balance = (a.gradingBalance ?? 0) / 200;
  addGrade(a.shadowHue, a.shadowSaturation, clamp(1 - luma + balance));
  addGrade(a.midtoneHue, a.midtoneSaturation, clamp(1 - Math.abs(luma - 0.45) * 2));
  addGrade(a.highlightHue, a.highlightSaturation, clamp(luma - balance));
  addGrade(a.globalGradeHue, a.globalGradeSaturation, 1);

  const primary = (value: number, sat: number | undefined, primaryHue: number | undefined, other: number) =>
    value * (1 + (sat ?? 0) / 250) + other * (primaryHue ?? 0) / 1800;
  const pr = primary(r, a.redPrimarySaturation, a.redPrimaryHue, g - b);
  const pg = primary(g, a.greenPrimarySaturation, a.greenPrimaryHue, b - r);
  const pb = primary(b, a.bluePrimarySaturation, a.bluePrimaryHue, r - g);
  r = pr; g = pg; b = pb;

  const fade = (a.fade ?? 0) / 100;
  r = r * (1 - fade * 0.28) + fade * 0.035;
  g = g * (1 - fade * 0.28) + fade * 0.035;
  b = b * (1 - fade * 0.28) + fade * 0.035;
  const invert = (a.negativeInversion ?? 0) / 100;
  if (invert) {
    r = r * (1 - invert) + (1 - clamp(r)) * invert;
    g = g * (1 - invert) + (1 - clamp(g)) * invert;
    b = b * (1 - invert) + (1 - clamp(b)) * invert;
  }
  const vignette = (a.vignette ?? 0) / 100;
  if (vignette) {
    const dx = (x + 0.5) / width - 0.5;
    const dy = (y + 0.5) / height - 0.5;
    const midpoint = Math.max(0.05, (a.vignetteMidpoint ?? 50) / 100);
    const feather = Math.max(0.05, (a.vignetteFeather ?? 50) / 100);
    const edge = clamp((Math.hypot(dx, dy) - midpoint * 0.35) / feather);
    const gain = Math.max(0, 1 - vignette * edge * edge * 0.8);
    r *= gain; g *= gain; b *= gain;
  }
  return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
}

/** Apply tone and colour operations in 32-bit float scene-linear space. */
export function applyLinearDevelop(
  source: LinearRawImage,
  adjustments: LinearDevelopAdjustments,
  inPlace = false,
): LinearRawImage {
  const data = inPlace ? source.data : new Float32Array(source.data.length);
  for (let pixel = 0; pixel < source.width * source.height; pixel++) {
    const offset = pixel * 3;
    const [r, g, b] = gradePixel(
      [source.data[offset], source.data[offset + 1], source.data[offset + 2]],
      adjustments,
      pixel % source.width,
      Math.floor(pixel / source.width),
      source.width,
      source.height,
    );
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
  }
  return { ...source, data };
}

function blendChannel(base: number, layer: number, mode: LinearEffectLayer["blendMode"]) {
  if (mode === "multiply") return base * layer;
  if (mode === "screen") return 1 - (1 - base) * (1 - layer);
  if (mode === "overlay") return base < 0.5 ? 2 * base * layer : 1 - 2 * (1 - base) * (1 - layer);
  if (mode === "soft-light") return (1 - 2 * layer) * base * base + 2 * layer * base;
  return layer;
}

export function applyLinearEffectLayers(
  ungraded: LinearRawImage,
  base: LinearRawImage,
  global: LinearDevelopAdjustments,
  layers: LinearEffectLayer[],
) {
  const output = { ...base, data: new Float32Array(base.data) };
  for (const layer of layers.filter((item) => item.enabled && item.opacity > 0)) {
    const graded = applyLinearDevelop(ungraded, { ...global, ...layer.settings });
    const opacity = clamp(layer.opacity / 100);
    for (let offset = 0; offset < output.data.length; offset += 3) {
      const baseLuma = luminance(output.data[offset], output.data[offset + 1], output.data[offset + 2]);
      const layerLuma = luminance(graded.data[offset], graded.data[offset + 1], graded.data[offset + 2]);
      for (let channel = 0; channel < 3; channel++) {
        let blended = blendChannel(output.data[offset + channel], graded.data[offset + channel], layer.blendMode);
        if (layer.blendMode === "luminosity")
          blended = output.data[offset + channel] * (layerLuma / Math.max(0.00001, baseLuma));
        else if (layer.blendMode === "color")
          blended = graded.data[offset + channel] * (baseLuma / Math.max(0.00001, layerLuma));
        output.data[offset + channel] += (blended - output.data[offset + channel]) * opacity;
      }
    }
  }
  return output;
}

export function applyLinearMask(
  ungraded: LinearRawImage,
  base: LinearRawImage,
  global: LinearDevelopAdjustments,
  local: LinearDevelopAdjustments,
  alpha: Float32Array,
  inverted = false,
) {
  const localSettings: LinearDevelopAdjustments = {
    ...global,
    ...local,
    curves:
      local.curveShadows || local.curveMidtones || local.curveHighlights
        ? {
            ...global.curves,
            rgb: {
              shadows: local.curveShadows ?? 0,
              midtones: local.curveMidtones ?? 0,
              highlights: local.curveHighlights ?? 0,
            },
          }
        : global.curves,
  };
  const graded = applyLinearDevelop(ungraded, localSettings);
  const output = { ...base, data: new Float32Array(base.data) };
  for (let pixel = 0; pixel < output.width * output.height; pixel++) {
    const weight = clamp(inverted ? 1 - (alpha[pixel] ?? 0) : alpha[pixel] ?? 0);
    const offset = pixel * 3;
    for (let channel = 0; channel < 3; channel++)
      output.data[offset + channel] +=
        (graded.data[offset + channel] - output.data[offset + channel]) * weight;
  }
  return output;
}

/** Deterministic floating-point output sharpening and grain. */
export function finishLinearRaw(
  source: LinearRawImage,
  adjustments: LinearDevelopAdjustments,
  outputSharpen = 0,
  inPlace = false,
) {
  const amount = Math.max(
    0,
    ((adjustments.sharpness ?? 0) +
      (adjustments.lensSharpness ?? 0) * 0.5 +
      (adjustments.deconvolution ?? 0) * 0.55 +
      outputSharpen) /
      300,
  );
  const noiseReduction = clamp(
    ((adjustments.noise ?? 0) +
      (adjustments.neuralDenoise ?? 0) * 0.75 +
      (adjustments.colorNoise ?? 0) * 0.3) /
      180,
  );
  const output = inPlace ? source.data : new Float32Array(source.data);
  if (amount || noiseReduction) {
    for (let y = 1; y < source.height - 1; y++) {
      for (let x = 1; x < source.width - 1; x++) {
        const offset = (y * source.width + x) * 3;
        for (let channel = 0; channel < 3; channel++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++)
            for (let kx = -1; kx <= 1; kx++)
              sum += source.data[((y + ky) * source.width + x + kx) * 3 + channel];
          const blur = sum / 9;
          const denoised = source.data[offset + channel] * (1 - noiseReduction) + blur * noiseReduction;
          output[offset + channel] = Math.max(0, denoised + (denoised - blur) * amount);
        }
      }
    }
  }
  const grain = clamp((adjustments.grain ?? 0) / 100) * 0.035;
  if (grain) {
    for (let pixel = 0; pixel < source.width * source.height; pixel++) {
      const random = (((pixel * 1664525 + 1013904223) >>> 8) & 0xffff) / 65535 - 0.5;
      for (let channel = 0; channel < 3; channel++)
        output[pixel * 3 + channel] = Math.max(0, output[pixel * 3 + channel] + random * grain);
    }
  }
  return { ...source, data: output };
}

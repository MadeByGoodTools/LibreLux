"use client";

import {
  Aperture,
  ArrowDownToLine,
  BookOpen,
  Columns2,
  Check,
  ChevronDown,
  Crop,
  Download,
  Flag,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  ImagePlus,
  Info,
  Keyboard,
  Library,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  Redo2,
  WandSparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as exifr from "exifr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Workspace = "library" | "develop" | "enhance";
type OpticsMode = "pure" | "creative" | "film";
type ColorSpace = "srgb" | "display-p3" | "adobe-rgb" | "prophoto-rgb";
type Label = "none" | "red" | "yellow" | "green" | "blue" | "purple";
type ColorBand =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "aqua"
  | "blue"
  | "purple"
  | "magenta";
type HslState = Record<
  ColorBand,
  { hue: number; saturation: number; luminance: number }
>;
type CurveChannel = "rgb" | "red" | "green" | "blue";
type CurveState = Record<
  CurveChannel,
  { shadows: number; midtones: number; highlights: number }
>;
type MaskTarget =
  | "brush"
  | "point"
  | "hair"
  | "skin"
  | "clothes"
  | "sky"
  | "linear"
  | "radial"
  | "luminance"
  | "color";
type LocalAdjustments = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  hue: number;
  temperature: number;
  tint: number;
  clarity: number;
  texture: number;
  dehaze: number;
  sharpness: number;
  noise: number;
  curveShadows: number;
  curveMidtones: number;
  curveHighlights: number;
};
type PointColorSample = {
  band: ColorBand;
  sourceHue: number;
  range: number;
  variance: number;
};
type RetouchMode = "heal" | "clone" | "remove" | "redEye";
type RetouchSpot = {
  id: string;
  mode: RetouchMode;
  x: number;
  y: number;
  sourceX: number;
  sourceY: number;
  size: number;
  feather: number;
};
type MaskRecord = {
  id: string;
  name: string;
  target: MaskTarget;
  dataUrl: string;
  tolerance: number;
  feather: number;
  visible: boolean;
  inverted: boolean;
  overlayColor: string;
  overlayOpacity: number;
  pinX: number;
  pinY: number;
  adjustments: LocalAdjustments;
};
type Adjustments = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  hue: number;
  texture: number;
  clarity: number;
  dehaze: number;
  vignette: number;
  vignetteMidpoint: number;
  vignetteFeather: number;
  vignetteRoundness: number;
  vignetteHighlights: number;
  grain: number;
  grainSize: number;
  grainRoughness: number;
  noise: number;
  noiseDetail: number;
  noiseContrast: number;
  colorNoise: number;
  colorNoiseDetail: number;
  colorSmoothness: number;
  sharpness: number;
  sharpRadius: number;
  sharpDetail: number;
  sharpMasking: number;
  lensSharpness: number;
  lensVignette: number;
  distortion: number;
  chromatic: number;
  defringe: number;
  perspectiveV: number;
  perspectiveH: number;
  perspectiveAspect: number;
  perspectiveScale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipX: number;
  flipY: number;
  cropRatio: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
  cropConstrain: number;
  boundaryFill: number;
  anamorphic: number;
  shadowHue: number;
  shadowSaturation: number;
  midtoneHue: number;
  midtoneSaturation: number;
  highlightHue: number;
  highlightSaturation: number;
  globalGradeHue: number;
  globalGradeSaturation: number;
  gradingBlending: number;
  gradingBalance: number;
  profileAmount: number;
  redPrimaryHue: number;
  redPrimarySaturation: number;
  greenPrimaryHue: number;
  greenPrimarySaturation: number;
  bluePrimaryHue: number;
  bluePrimarySaturation: number;
  filmIntensity: number;
  fade: number;
  halation: number;
  bloom: number;
  paperTexture: number;
  lightLeak: number;
  age: number;
  chromaticShift: number;
  glassDistortion: number;
  hsl: HslState;
  bwMix: Record<ColorBand, number>;
  curves: CurveState;
};
type PhotoMetadata = {
  title: string;
  caption: string;
  creator: string;
  copyright: string;
  keywords: string[];
  camera: string;
  lens: string;
  location: string;
  capturedAt: string;
  iso: string;
  aperture: string;
  shutter: string;
  focalLength: string;
  latitude: number | null;
  longitude: number | null;
};
type CullScores = {
  focus: number;
  exposure: number;
  faces: number;
  similarity: number;
};
type PhotoRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  editedAt: number;
  rating: number;
  flagged: boolean;
  rejected: boolean;
  label: Label;
  folder: string;
  virtualOf: string | null;
  blob: Blob;
  adjustments: Adjustments;
  metadata: PhotoMetadata;
  masks: MaskRecord[];
  retouchSpots: RetouchSpot[];
  perceptualHash: string;
  cull: CullScores;
  stackId: string | null;
  missing: boolean;
  processVersion: "2026" | "2025";
  previewBlob: Blob | null;
};
type RuntimePhoto = PhotoRecord & { url: string; previewUrl: string };
type PresetChoice = {
  id: string;
  name: string;
  settings: Partial<Adjustments>;
} | null;
type UserPreset = {
  id: string;
  name: string;
  group: string;
  settings: Partial<Adjustments>;
  createdAt: number;
};
type DirectoryPermissionState =
  | "ready"
  | "needs-permission"
  | "unsupported"
  | "none";
type AlbumRecord = {
  id: string;
  name: string;
  photoIds: string[];
  createdAt: number;
  kind: "album" | "set" | "smart" | "quick";
  parentId: string | null;
  rule: "five-stars" | "flagged" | "edited" | "people" | null;
  target: boolean;
};
type ExportRecipe = {
  id: string;
  name: string;
  format: "jpeg" | "png" | "webp";
  quality: number;
  scale: number;
  longEdge: number;
  resolution: number;
  outputSharpen: "none" | "screen" | "matte" | "glossy";
  suffix: string;
  watermark: string;
};

interface WritableFileHandle {
  kind?: "file";
  name?: string;
  getFile?: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}
interface StoredDirectoryHandle {
  kind?: "directory";
  name: string;
  getFileHandle: (
    name: string,
    options: { create: boolean },
  ) => Promise<WritableFileHandle>;
  queryPermission?: (options: {
    mode: "readwrite";
  }) => Promise<PermissionState>;
  requestPermission?: (options: {
    mode: "readwrite";
  }) => Promise<PermissionState>;
  values?: () => AsyncIterableIterator<
    | WritableFileHandle
    | {
        kind: "directory";
        name: string;
      }
  >;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<StoredDirectoryHandle>;
  }
}

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations?: {
            readOnlyHint?: boolean;
            untrustedContentHint?: boolean;
          };
          execute: (input: unknown) => unknown | Promise<unknown>;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const colorBands: ColorBand[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "aqua",
  "blue",
  "purple",
  "magenta",
];
const curveChannels: CurveChannel[] = ["rgb", "red", "green", "blue"];
const defaultHsl = Object.fromEntries(
  colorBands.map((b) => [b, { hue: 0, saturation: 0, luminance: 0 }]),
) as HslState;
const defaultBw = Object.fromEntries(colorBands.map((b) => [b, 0])) as Record<
  ColorBand,
  number
>;
const defaultCurves = Object.fromEntries(
  curveChannels.map((c) => [c, { shadows: 0, midtones: 0, highlights: 0 }]),
) as CurveState;
const defaultLocal: LocalAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  clarity: 0,
  texture: 0,
  dehaze: 0,
  sharpness: 0,
  noise: 0,
  curveShadows: 0,
  curveMidtones: 0,
  curveHighlights: 0,
};
const defaults: Adjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  hue: 0,
  texture: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  vignetteMidpoint: 50,
  vignetteFeather: 50,
  vignetteRoundness: 0,
  vignetteHighlights: 0,
  grain: 0,
  grainSize: 25,
  grainRoughness: 50,
  noise: 0,
  noiseDetail: 50,
  noiseContrast: 0,
  colorNoise: 0,
  colorNoiseDetail: 50,
  colorSmoothness: 50,
  sharpness: 20,
  sharpRadius: 1,
  sharpDetail: 25,
  sharpMasking: 0,
  lensSharpness: 0,
  lensVignette: 0,
  distortion: 0,
  chromatic: 0,
  defringe: 0,
  perspectiveV: 0,
  perspectiveH: 0,
  perspectiveAspect: 0,
  perspectiveScale: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  flipX: 1,
  flipY: 1,
  cropRatio: 0,
  cropTop: 0,
  cropRight: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropConstrain: 1,
  boundaryFill: 0,
  anamorphic: 0,
  shadowHue: 220,
  shadowSaturation: 0,
  midtoneHue: 35,
  midtoneSaturation: 0,
  highlightHue: 45,
  highlightSaturation: 0,
  globalGradeHue: 0,
  globalGradeSaturation: 0,
  gradingBlending: 50,
  gradingBalance: 0,
  profileAmount: 100,
  redPrimaryHue: 0,
  redPrimarySaturation: 0,
  greenPrimaryHue: 0,
  greenPrimarySaturation: 0,
  bluePrimaryHue: 0,
  bluePrimarySaturation: 0,
  filmIntensity: 100,
  fade: 0,
  halation: 0,
  bloom: 0,
  paperTexture: 0,
  lightLeak: 0,
  age: 0,
  chromaticShift: 0,
  glassDistortion: 0,
  hsl: defaultHsl,
  bwMix: defaultBw,
  curves: defaultCurves,
};
const emptyMetadata: PhotoMetadata = {
  title: "",
  caption: "",
  creator: "",
  copyright: "",
  keywords: [],
  camera: "",
  lens: "",
  location: "",
  capturedAt: "",
  iso: "",
  aperture: "",
  shutter: "",
  focalLength: "",
  latitude: null,
  longitude: null,
};
const presets = [
  {
    name: "Clean Light",
    tone: "#d7dfd0",
    settings: { exposure: 0.3, highlights: -18, shadows: 22, vibrance: 12 },
  },
  {
    name: "Quiet Film",
    tone: "#b3a58f",
    settings: {
      contrast: -8,
      blacks: 16,
      grain: 24,
      saturation: -9,
      temperature: 9,
    },
  },
  {
    name: "Deep Chrome",
    tone: "#384d5c",
    settings: { contrast: 24, dehaze: 12, vibrance: 20, blacks: -16 },
  },
  {
    name: "Warm Portrait",
    tone: "#c9896e",
    settings: { temperature: 18, tint: 5, texture: -12, vibrance: 9 },
  },
  {
    name: "Silver",
    tone: "#8e9498",
    settings: { saturation: -100, contrast: 18, clarity: 14, grain: 18 },
  },
  {
    name: "Night Air",
    tone: "#31394e",
    settings: { exposure: -0.35, shadows: 26, dehaze: 18, temperature: -13 },
  },
] satisfies { name: string; tone: string; settings: Partial<Adjustments> }[];
const creativeRecipes = [
  {
    name: "Color Lift",
    family: "Color",
    tone: "#dc6f45",
    settings: { vibrance: 28, contrast: 14, clarity: 8 },
  },
  {
    name: "Silver Study",
    family: "Mono",
    tone: "#a8aaa5",
    settings: { saturation: -100, contrast: 24, clarity: 18, grain: 18 },
  },
  {
    name: "Soft Focus",
    family: "Portrait",
    tone: "#dbb0a6",
    settings: { texture: -28, clarity: -12, bloom: 34, highlights: 12 },
  },
  {
    name: "HDR Drama",
    family: "Tone",
    tone: "#4d6f78",
    settings: { highlights: -38, shadows: 42, clarity: 28, dehaze: 20 },
  },
  {
    name: "Vintage Lens",
    family: "Analog",
    tone: "#9a765d",
    settings: {
      temperature: 17,
      saturation: -16,
      vignette: -25,
      fade: 18,
      grain: 24,
    },
  },
  {
    name: "Night Detail",
    family: "Detail",
    tone: "#313a58",
    settings: {
      exposure: 0.2,
      shadows: 32,
      noise: 30,
      colorNoise: 32,
      sharpness: 44,
    },
  },
] satisfies {
  name: string;
  family: string;
  tone: string;
  settings: Partial<Adjustments>;
}[];
const filmLooks = [
  {
    name: "Daylight 64",
    era: "1960s",
    tone: "#d8b75c",
    settings: {
      temperature: 8,
      contrast: 17,
      saturation: 8,
      grain: 16,
      fade: 4,
    },
  },
  {
    name: "Chrome 100",
    era: "1980s",
    tone: "#3e6670",
    settings: {
      temperature: -5,
      contrast: 25,
      saturation: 14,
      highlights: -12,
      grain: 10,
    },
  },
  {
    name: "Portrait 160",
    era: "1990s",
    tone: "#cf9685",
    settings: {
      temperature: 13,
      tint: 5,
      contrast: -7,
      saturation: -5,
      grain: 12,
    },
  },
  {
    name: "Press 400",
    era: "1970s",
    tone: "#89877c",
    settings: { saturation: -100, contrast: 30, grain: 34, grainSize: 38 },
  },
  {
    name: "Cinema 500",
    era: "2000s",
    tone: "#466465",
    settings: {
      temperature: -8,
      tint: 7,
      contrast: 12,
      saturation: -12,
      halation: 20,
      grain: 20,
    },
  },
  {
    name: "Instant Warm",
    era: "1970s",
    tone: "#c37e57",
    settings: {
      temperature: 22,
      contrast: -12,
      blacks: 18,
      fade: 24,
      grain: 18,
    },
  },
  {
    name: "Slide Vivid",
    era: "1990s",
    tone: "#286a85",
    settings: {
      temperature: -3,
      contrast: 34,
      highlights: -18,
      saturation: 28,
      grain: 7,
    },
  },
  {
    name: "Negative Soft",
    era: "1980s",
    tone: "#c89578",
    settings: {
      temperature: 10,
      tint: -4,
      contrast: -16,
      shadows: 18,
      fade: 13,
      grain: 15,
    },
  },
  {
    name: "Noir 3200",
    era: "1980s",
    tone: "#55575b",
    settings: {
      saturation: -100,
      contrast: 42,
      blacks: -18,
      grain: 58,
      grainSize: 56,
    },
  },
  {
    name: "Modern Neutral",
    era: "Today",
    tone: "#8da0a2",
    settings: {
      temperature: 0,
      contrast: 6,
      saturation: -3,
      grain: 4,
      fade: 0,
    },
  },
] satisfies {
  name: string;
  era: string;
  tone: string;
  settings: Partial<Adjustments>;
}[];
const labelColors: Record<Label, string> = {
  none: "transparent",
  red: "#f46d74",
  yellow: "#e6c34f",
  green: "#66bf8d",
  blue: "#6ca7e8",
  purple: "#a881d8",
};
const builtInExportRecipes: ExportRecipe[] = [
  {
    id: "web",
    name: "Web · 2048px",
    format: "jpeg",
    quality: 86,
    scale: 100,
    longEdge: 2048,
    resolution: 72,
    outputSharpen: "screen",
    suffix: "-web",
    watermark: "",
  },
  {
    id: "print",
    name: "Print · Full",
    format: "jpeg",
    quality: 100,
    scale: 100,
    longEdge: 0,
    resolution: 300,
    outputSharpen: "glossy",
    suffix: "-print",
    watermark: "",
  },
  {
    id: "lossless",
    name: "Archive · PNG",
    format: "png",
    quality: 100,
    scale: 100,
    longEdge: 0,
    resolution: 300,
    outputSharpen: "none",
    suffix: "-archive",
    watermark: "",
  },
];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("librelux-library", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("photos"))
        db.createObjectStore("photos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readPhotos(): Promise<PhotoRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("photos", "readonly")
      .objectStore("photos")
      .getAll();
    r.onsuccess = () => resolve(r.result as PhotoRecord[]);
    r.onerror = () => reject(r.error);
  });
}
async function savePhoto(photo: PhotoRecord | RuntimePhoto) {
  const db = await openDb();
  const {
    url: _url,
    previewUrl: _previewUrl,
    ...stored
  } = photo as RuntimePhoto;
  void _url;
  void _previewUrl;
  return new Promise<void>((resolve, reject) => {
    const r = db
      .transaction("photos", "readwrite")
      .objectStore("photos")
      .put(stored);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
async function deletePhoto(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const r = db
      .transaction("photos", "readwrite")
      .objectStore("photos")
      .delete(id);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
async function readSetting<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("settings", "readonly")
      .objectStore("settings")
      .get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}
async function saveSetting<T>(key: string, value: T) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const r = db
      .transaction("settings", "readwrite")
      .objectStore("settings")
      .put(value, key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
async function removeSetting(key: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const r = db
      .transaction("settings", "readwrite")
      .objectStore("settings")
      .delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
function formatBytes(size: number) {
  return size < 1048576
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1048576).toFixed(1)} MB`;
}
function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character] ?? character,
  );
}
function cssFilter(a: Adjustments, processVersion: "2026" | "2025" = "2026") {
  const legacy = processVersion === "2025";
  const intensity = a.filmIntensity / 100;
  const hsl = Object.values(a.hsl ?? defaultHsl);
  const hslHue = hsl.reduce((n, v) => n + v.hue, 0) / 80;
  const hslSat = hsl.reduce((n, v) => n + v.saturation, 0) / 800;
  const hslLum = hsl.reduce((n, v) => n + v.luminance, 0) / 1100;
  const curve = a.curves ?? defaultCurves;
  const curveValues = curveChannels.flatMap((channel) =>
    Object.values(curve[channel]),
  );
  const curveLight = curveValues.reduce((sum, value) => sum + value, 0) / 4200;
  const channelHue =
    (curve.red.midtones +
      curve.red.highlights -
      (curve.blue.midtones + curve.blue.highlights)) /
    28;
  const channelSat =
    (Math.abs(curve.red.midtones) +
      Math.abs(curve.green.midtones) +
      Math.abs(curve.blue.midtones)) /
    900;
  const bwValues = Object.values(a.bwMix ?? defaultBw);
  const bwTone =
    a.saturation === -100
      ? bwValues.reduce((sum, value) => sum + value, 0) / 1200
      : 0;
  const calibration =
    (a.redPrimarySaturation +
      a.greenPrimarySaturation +
      a.bluePrimarySaturation) /
    1200;
  const tonal = (a.highlights + a.whites - a.blacks + a.shadows) / 900;
  const brightness = Math.max(
    0.12,
    Math.pow(2, a.exposure) *
      (1 + tonal + a.fade / 900 + hslLum + curveLight + bwTone),
  );
  const contrast = Math.max(
    0.18,
    1 +
      (a.contrast * intensity) / 100 +
      a.clarity / (legacy ? 310 : 250) +
      a.dehaze / (legacy ? 390 : 320) +
      a.sharpness / 900 +
      a.lensSharpness / 1000 -
      a.fade / 260,
  );
  const saturation = Math.max(
    0,
    (1 +
      (a.saturation * intensity) / 100 +
      a.vibrance / 160 -
      a.colorNoise / 1200 -
      a.age / 500 +
      hslSat +
      calibration +
      channelSat) *
      (a.profileAmount / 100),
  );
  const warmth = Math.abs(a.temperature * intensity) / 600;
  const grade =
    (a.shadowHue * a.shadowSaturation +
      a.midtoneHue * a.midtoneSaturation +
      a.highlightHue * a.highlightSaturation +
      a.globalGradeHue * a.globalGradeSaturation) /
      Math.max(
        1,
        a.shadowSaturation +
          a.midtoneSaturation +
          a.highlightSaturation +
          a.globalGradeSaturation,
      ) /
      20 || 0;
  const hue =
    (a.hue +
      a.tint / 8 +
      (a.temperature < 0 ? -a.temperature / 16 : 0) +
      grade +
      hslHue +
      channelHue +
      (a.redPrimaryHue + a.greenPrimaryHue + a.bluePrimaryHue) / 18) *
    intensity;
  const blur = Math.max(
    0,
    a.noise / 180 -
      a.sharpDetail / 3000 +
      a.bloom / 1300 +
      a.glassDistortion / 1800,
  );
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) sepia(${warmth}) hue-rotate(${hue}deg) blur(${blur}px)`;
}
function localFilter(a: LocalAdjustments) {
  const light =
    a.exposure + a.highlights / 260 + a.shadows / 340 + a.curveMidtones / 300;
  const contrast =
    a.contrast / 100 +
    a.clarity / 260 +
    a.dehaze / 300 +
    (a.curveHighlights - a.curveShadows) / 360;
  const saturation = a.saturation / 100 + a.vibrance / 140;
  const blur = Math.max(0, a.noise / 180 - a.sharpness / 650 - a.texture / 900);
  return `brightness(${Math.max(0.15, Math.pow(2, light))}) contrast(${Math.max(0.2, 1 + contrast)}) saturate(${Math.max(0, 1 + saturation)}) sepia(${Math.abs(a.temperature) / 650}) hue-rotate(${a.hue + (a.temperature < 0 ? -a.temperature / 18 : 0) + a.tint / 30}deg) blur(${blur}px)`;
}

async function readImagePixels(url: string, size = 192) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const scale = Math.min(
    1,
    size / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image analysis unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return {
    image,
    canvas,
    pixels: context.getImageData(0, 0, canvas.width, canvas.height),
  };
}
async function analyzePhoto(url: string) {
  const { pixels } = await readImagePixels(url);
  const luminance: number[] = [];
  let red = 0,
    green = 0,
    blue = 0,
    count = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue;
    const r = pixels.data[i],
      g = pixels.data[i + 1],
      b = pixels.data[i + 2];
    red += r;
    green += g;
    blue += b;
    luminance.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
    count++;
  }
  luminance.sort((a, b) => a - b);
  const at = (fraction: number) =>
    luminance[
      Math.min(
        luminance.length - 1,
        Math.max(0, Math.round((luminance.length - 1) * fraction)),
      )
    ] ?? 128;
  return {
    average:
      luminance.reduce((sum, value) => sum + value, 0) /
      Math.max(1, luminance.length),
    low: at(0.03),
    high: at(0.97),
    red: red / Math.max(1, count),
    green: green / Math.max(1, count),
    blue: blue / Math.max(1, count),
  };
}
async function analyzeImportFile(
  file: File,
): Promise<{ perceptualHash: string; cull: CullScores }> {
  const url = URL.createObjectURL(file);
  try {
    const { canvas, pixels } = await readImagePixels(url, 96);
    const grayscale: number[] = [];
    for (let i = 0; i < pixels.data.length; i += 4)
      grayscale.push(
        0.2126 * pixels.data[i] +
          0.7152 * pixels.data[i + 1] +
          0.0722 * pixels.data[i + 2],
      );
    let focus = 0,
      exposure = 0,
      count = 0;
    for (let y = 1; y < canvas.height - 1; y++)
      for (let x = 1; x < canvas.width - 1; x++) {
        const index = y * canvas.width + x;
        const laplacian = Math.abs(
          grayscale[index - 1] +
            grayscale[index + 1] +
            grayscale[index - canvas.width] +
            grayscale[index + canvas.width] -
            4 * grayscale[index],
        );
        focus += laplacian;
        exposure +=
          100 - Math.min(100, Math.abs(grayscale[index] - 128) / 1.28);
        count++;
      }
    const hashCanvas = document.createElement("canvas");
    hashCanvas.width = 9;
    hashCanvas.height = 8;
    const context = hashCanvas.getContext("2d", { willReadFrequently: true });
    let hash = "";
    if (context) {
      context.drawImage(canvas, 0, 0, 9, 8);
      const data = context.getImageData(0, 0, 9, 8).data;
      for (let y = 0; y < 8; y++) {
        let byte = 0;
        for (let x = 0; x < 8; x++) {
          const left = (y * 9 + x) * 4,
            right = left + 4;
          const l = data[left] + data[left + 1] + data[left + 2],
            r = data[right] + data[right + 1] + data[right + 2];
          if (l > r) byte |= 1 << x;
        }
        hash += byte.toString(16).padStart(2, "0");
      }
    }
    let faces = 0;
    const Detector = (
      window as unknown as {
        FaceDetector?: new (options?: {
          fastMode?: boolean;
          maxDetectedFaces?: number;
        }) => { detect: (source: CanvasImageSource) => Promise<unknown[]> };
      }
    ).FaceDetector;
    if (Detector) {
      try {
        faces = (
          await new Detector({ fastMode: true, maxDetectedFaces: 12 }).detect(
            canvas,
          )
        ).length;
      } catch {
        faces = 0;
      }
    }
    return {
      perceptualHash: hash,
      cull: {
        focus: Math.min(100, (focus / Math.max(1, count)) * 4),
        exposure: exposure / Math.max(1, count),
        faces,
        similarity: 0,
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function createSmartPreview(file: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const maxEdge = memory && memory <= 4 ? 1200 : 2000;
    const scale = Math.min(
      1,
      maxEdge / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas
      .getContext("2d")
      ?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function Histogram({
  photo,
  showClipping,
  onToggleClipping,
  onToneChange,
}: {
  photo?: RuntimePhoto;
  showClipping: boolean;
  onToggleClipping: () => void;
  onToneChange?: (
    key: "blacks" | "shadows" | "highlights" | "whites",
    delta: number,
  ) => void;
}) {
  const drag = useRef<{
    x: number;
    key: "blacks" | "shadows" | "highlights" | "whites";
  } | null>(null);
  const [data, setData] = useState({
    r: Array(32).fill(0) as number[],
    g: Array(32).fill(0) as number[],
    b: Array(32).fill(0) as number[],
    l: Array(32).fill(0) as number[],
    black: 0,
    white: 0,
  });
  useEffect(() => {
    let live = true;
    if (!photo) return;
    readImagePixels(photo.url, 160)
      .then(({ pixels }) => {
        const next = {
          r: Array(32).fill(0) as number[],
          g: Array(32).fill(0) as number[],
          b: Array(32).fill(0) as number[],
          l: Array(32).fill(0) as number[],
          black: 0,
          white: 0,
        };
        for (let i = 0; i < pixels.data.length; i += 4) {
          if (!pixels.data[i + 3]) continue;
          const r = pixels.data[i],
            g = pixels.data[i + 1],
            b = pixels.data[i + 2],
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          next.r[Math.min(31, r >> 3)]++;
          next.g[Math.min(31, g >> 3)]++;
          next.b[Math.min(31, b >> 3)]++;
          next.l[Math.min(31, Math.floor(l / 8))]++;
          if (l < 2) next.black++;
          if (l > 253) next.white++;
        }
        if (live) setData(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [photo]);
  const max = Math.max(1, ...data.r, ...data.g, ...data.b, ...data.l);
  const points = (values: number[]) =>
    values
      .map((value, index) => `${index * (104 / 31)},${64 - (value / max) * 60}`)
      .join(" ");
  return (
    <div className="histogram" aria-label="RGB histogram">
      <svg
        viewBox="0 0 104 66"
        preserveAspectRatio="none"
        className={onToneChange ? "tone-draggable" : ""}
        onPointerDown={(event) => {
          if (!onToneChange) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const fraction = (event.clientX - rect.left) / rect.width;
          drag.current = {
            x: event.clientX,
            key:
              fraction < 0.25
                ? "blacks"
                : fraction < 0.5
                  ? "shadows"
                  : fraction < 0.75
                    ? "highlights"
                    : "whites",
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (
            !drag.current ||
            !onToneChange ||
            !event.currentTarget.hasPointerCapture(event.pointerId)
          )
            return;
          const delta = (event.clientX - drag.current.x) * 0.8;
          if (Math.abs(delta) >= 1) {
            onToneChange(drag.current.key, delta);
            drag.current.x = event.clientX;
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <polygon
          points={`0,64 ${points(data.l)} 104,64`}
          fill="rgba(214,230,211,.22)"
        />
        <polyline
          points={points(data.r)}
          fill="none"
          stroke="#ef7474"
          strokeOpacity=".72"
          strokeWidth=".8"
        />
        <polyline
          points={points(data.g)}
          fill="none"
          stroke="#77d694"
          strokeOpacity=".72"
          strokeWidth=".8"
        />
        <polyline
          points={points(data.b)}
          fill="none"
          stroke="#78b6dd"
          strokeOpacity=".8"
          strokeWidth=".8"
        />
        {showClipping && (
          <>
            <rect
              x="0"
              y="0"
              width="4"
              height="66"
              fill="#3478ff"
              opacity={data.black ? ".72" : ".18"}
            />
            <rect
              x="100"
              y="0"
              width="4"
              height="66"
              fill="#ff4d4d"
              opacity={data.white ? ".72" : ".18"}
            />
          </>
        )}
      </svg>
      <div>
        <button aria-pressed={showClipping} onClick={onToggleClipping}>
          ◩ Shadows {data.black}
        </button>
        <span>128</span>
        <button aria-pressed={showClipping} onClick={onToggleClipping}>
          Highlights {data.white} ◪
        </button>
      </div>
    </div>
  );
}
function GamutWarningOverlay({ photo }: { photo: RuntimePhoto }) {
  const [mask, setMask] = useState("");
  useEffect(() => {
    let live = true;
    readImagePixels(photo.url, 420)
      .then(({ canvas, pixels }) => {
        const context = canvas.getContext("2d");
        if (!context) return;
        const output = context.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const r = pixels.data[i],
            g = pixels.data[i + 1],
            b = pixels.data[i + 2];
          const clipped =
            Math.max(r, g, b) > 247 ||
            Math.min(r, g, b) < 7 ||
            Math.max(r, g, b) - Math.min(r, g, b) > 238;
          if (clipped) {
            output.data[i] = 255;
            output.data[i + 1] = 38;
            output.data[i + 2] = 190;
            output.data[i + 3] = 190;
          }
        }
        context.putImageData(output, 0, 0);
        if (live) setMask(canvas.toDataURL("image/png"));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [photo]);
  return mask ? (
    <img
      className="gamut-warning-overlay"
      src={mask}
      alt="Out-of-gamut warning overlay"
    />
  ) : null;
}

function ToolButton({
  label,
  children,
  active,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function AdjustSlider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  resetValue = 0,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  resetValue?: number;
  onChange: (value: number) => void;
}) {
  const display = step < 1 ? value.toFixed(2) : Math.round(value).toString();
  return (
    <div className="adjust-row">
      <div className="adjust-label">
        <span>{label}</span>
        <button
          onDoubleClick={() => onChange(resetValue)}
          title="Double-click to reset"
        >
          {value > 0 ? "+" : ""}
          {display}
        </button>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
    </div>
  );
}
function Panel({
  title,
  children,
  open = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  badge?: string;
}) {
  return (
    <details className="panel" open={open}>
      <summary>
        <ChevronDown size={15} />
        <span>{title}</span>
        {badge && <em>{badge}</em>}
      </summary>
      <div className="panel-body">{children}</div>
    </details>
  );
}

export default function Home() {
  const deviceMemory =
    typeof navigator === "undefined"
      ? 4
      : ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
        4);
  const [workspace, setWorkspace] = useState<Workspace>("develop");
  const [opticsMode, setOpticsMode] = useState<OpticsMode>("pure");
  const [photos, setPhotos] = useState<RuntimePhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "flagged" | "rated" | "edited" | "rejected" | "duplicates" | "best"
  >("all");
  const [sort, setSort] = useState<
    "recent" | "edited" | "name" | "rating" | "size"
  >("recent");
  const [libraryView, setLibraryView] = useState<
    "grid" | "loupe" | "compare" | "survey" | "people" | "map"
  >("grid");
  const [minRating, setMinRating] = useState(0);
  const [labelFilter, setLabelFilter] = useState<Label>("none");
  const [compareMode, setCompareMode] = useState<
    "edited" | "original" | "split" | "side" | "reference"
  >("edited");
  const showBefore = compareMode === "original";
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [cropMode, setCropMode] = useState(false);
  const [cropOverlay, setCropOverlay] = useState<
    "thirds" | "diagonal" | "golden" | "spiral" | "grid"
  >("thirds");
  const [zoom, setZoom] = useState(68);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportQuality, setExportQuality] = useState(92);
  const [exportFormat, setExportFormat] = useState<"jpeg" | "png" | "webp">(
    "jpeg",
  );
  const [exportScale, setExportScale] = useState(100);
  const [exportLongEdge, setExportLongEdge] = useState(0);
  const [exportShortEdge, setExportShortEdge] = useState(0);
  const [exportWidth, setExportWidth] = useState(0);
  const [exportHeight, setExportHeight] = useState(0);
  const [exportMegapixels, setExportMegapixels] = useState(0);
  const [exportSizing, setExportSizing] = useState<
    "percentage" | "dimensions" | "long" | "short" | "megapixels"
  >("percentage");
  const [exportResolution, setExportResolution] = useState(300);
  const [outputSharpen, setOutputSharpen] = useState<
    "none" | "screen" | "matte" | "glossy"
  >("none");
  const [exportSuffix, setExportSuffix] = useState("-LibreLux");
  const [exportNameTemplate, setExportNameTemplate] =
    useState("{name}{suffix}");
  const [watermark, setWatermark] = useState("");
  const [watermarkImage, setWatermarkImage] = useState("");
  const [watermarkOpacity, setWatermarkOpacity] = useState(82);
  const [watermarkPosition, setWatermarkPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("bottom-right");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeCopyright, setIncludeCopyright] = useState(true);
  const [history, setHistory] = useState<Adjustments[]>([]);
  const [future, setFuture] = useState<Adjustments[]>([]);
  const [copiedSettings, setCopiedSettings] = useState<Adjustments | null>(
    null,
  );
  const [selectedPreset, setSelectedPreset] = useState<PresetChoice>(null);
  const [exportDirectory, setExportDirectory] =
    useState<StoredDirectoryHandle | null>(null);
  const [directoryPermission, setDirectoryPermission] =
    useState<DirectoryPermissionState>("none");
  const [maskTarget, setMaskTarget] = useState<MaskTarget | null>(null);
  const [maskTolerance, setMaskTolerance] = useState(28);
  const [maskFeather, setMaskFeather] = useState(6);
  const [maskBrushSize, setMaskBrushSize] = useState(24);
  const [maskBrushFlow, setMaskBrushFlow] = useState(75);
  const [maskBrushDensity, setMaskBrushDensity] = useState(100);
  const [maskAuto, setMaskAuto] = useState(true);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [albums, setAlbums] = useState<AlbumRecord[]>([]);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [presetAmount, setPresetAmount] = useState(100);
  const [exportRecipes, setExportRecipes] =
    useState<ExportRecipe[]>(builtInExportRecipes);
  const [selectedExportRecipe, setSelectedExportRecipe] = useState<
    string | null
  >(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutMap, setShortcutMap] = useState({
    library: "g",
    develop: "d",
    optics: "e",
    pick: "p",
    reject: "x",
    unflag: "u",
  });
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactUi, setCompactUi] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [gridSize, setGridSize] = useState(155);
  const [showClipping, setShowClipping] = useState(false);
  const [sampleMode, setSampleMode] = useState<
    "whiteBalance" | "pointColor" | null
  >(null);
  const [pointColor, setPointColor] = useState<PointColorSample | null>(null);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const presetImportRef = useRef<HTMLInputElement>(null);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const [catalogStatus, setCatalogStatus] = useState("");
  const [watchDirectory, setWatchDirectory] =
    useState<StoredDirectoryHandle | null>(null);
  const [watchStatus, setWatchStatus] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [proofProfile, setProofProfile] = useState<ColorSpace>("srgb");
  const [softProof, setSoftProof] = useState(false);
  const [gamutWarnings, setGamutWarnings] = useState(false);
  const [retouchMode, setRetouchMode] = useState<RetouchMode | null>(null);
  const [retouchSize, setRetouchSize] = useState(9);
  const [retouchFeather, setRetouchFeather] = useState(55);
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    const hamming = (a: string, b: string) => {
      if (!a || a.length !== b.length) return Infinity;
      let distance = 0;
      for (let i = 0; i < a.length; i++) {
        let value = parseInt(a[i], 16) ^ parseInt(b[i], 16);
        while (value) {
          distance += value & 1;
          value >>= 1;
        }
      }
      return distance;
    };
    photos.forEach((photo, index) =>
      photos.slice(index + 1).forEach((other) => {
        const exact =
          photo.name.toLowerCase() === other.name.toLowerCase() &&
          photo.size === other.size;
        if (exact || hamming(photo.perceptualHash, other.perceptualHash) <= 8) {
          ids.add(photo.id);
          ids.add(other.id);
        }
      }),
    );
    return ids;
  }, [photos]);
  const selected = photos.find((p) => p.id === selectedId);
  const folders = useMemo(
    () => [...new Set(photos.map((photo) => photo.folder))].sort(),
    [photos],
  );
  const activeAlbum = albums.find((album) => album.id === activeAlbumId);
  const albumIncludes = (album: AlbumRecord | undefined, photo: RuntimePhoto) =>
    !album ||
    album.kind === "set" ||
    (album.kind === "smart"
      ? album.rule === "five-stars"
        ? photo.rating === 5
        : album.rule === "flagged"
          ? photo.flagged
          : album.rule === "people"
            ? photo.cull.faces > 0
            : JSON.stringify(photo.adjustments) !== JSON.stringify(defaults)
      : album.photoIds.includes(photo.id));
  const filtered = useMemo(
    () =>
      photos
        .filter(
          (p) =>
            albumIncludes(activeAlbum, p) &&
            (!folderFilter || p.folder === folderFilter) &&
            [
              p.name,
              p.metadata.title,
              p.metadata.caption,
              p.metadata.creator,
              p.metadata.camera,
              p.metadata.lens,
              p.metadata.location,
              p.folder,
              ...p.metadata.keywords,
            ]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            p.rating >= minRating &&
            (labelFilter === "none" || p.label === labelFilter) &&
            (filter === "all" ||
              (filter === "flagged" && p.flagged) ||
              (filter === "rated" && p.rating > 0) ||
              (filter === "rejected" && p.rejected) ||
              (filter === "duplicates" && duplicateIds.has(p.id)) ||
              (filter === "best" &&
                p.cull.focus >= 45 &&
                p.cull.exposure >= 55) ||
              (filter === "edited" &&
                JSON.stringify(p.adjustments) !== JSON.stringify(defaults))),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : sort === "rating"
              ? b.rating - a.rating
              : sort === "size"
                ? b.size - a.size
                : sort === "edited"
                  ? b.editedAt - a.editedAt
                  : b.createdAt - a.createdAt,
        ),
    [
      photos,
      query,
      filter,
      sort,
      minRating,
      labelFilter,
      duplicateIds,
      activeAlbum,
      folderFilter,
    ],
  );
  const referencePhoto =
    photos.find(
      (photo) => photo.id !== selectedId && selectedIds.includes(photo.id),
    ) ?? photos.find((photo) => photo.id !== selectedId);
  useEffect(() => {
    readPhotos()
      .then(async (records) => {
        const journal = await readSetting<{
          photo: PhotoRecord;
          savedAt: number;
        }>("edit-journal").catch(() => undefined);
        if (journal?.photo) {
          const index = records.findIndex(
            (photo) => photo.id === journal.photo.id,
          );
          if (index >= 0 && records[index].editedAt < journal.photo.editedAt)
            records[index] = journal.photo;
          else if (index < 0) records.push(journal.photo);
          await savePhoto(journal.photo).catch(() => undefined);
          await removeSetting("edit-journal").catch(() => undefined);
        }
        const runtime = records
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((p) => ({
            ...p,
            editedAt: p.editedAt ?? p.createdAt,
            folder: p.folder ?? "Local library",
            virtualOf: p.virtualOf ?? null,
            rejected: p.rejected ?? false,
            retouchSpots: p.retouchSpots ?? [],
            perceptualHash: p.perceptualHash ?? "",
            cull: p.cull ?? { focus: 0, exposure: 0, faces: 0, similarity: 0 },
            stackId: p.stackId ?? null,
            missing: p.missing ?? false,
            processVersion: p.processVersion ?? "2026",
            previewBlob: p.previewBlob ?? null,
            masks: (p.masks ?? []).map((mask) => ({
              ...mask,
              visible: mask.visible ?? true,
              inverted: mask.inverted ?? false,
              overlayColor: mask.overlayColor ?? "#b6f36b",
              overlayOpacity: mask.overlayOpacity ?? 48,
              pinX: mask.pinX ?? 0.5,
              pinY: mask.pinY ?? 0.5,
              adjustments: { ...defaultLocal, ...mask.adjustments },
            })),
            metadata: { ...emptyMetadata, ...p.metadata },
            adjustments: {
              ...defaults,
              ...p.adjustments,
              hsl: { ...defaultHsl, ...p.adjustments?.hsl },
              bwMix: { ...defaultBw, ...p.adjustments?.bwMix },
              curves: { ...defaultCurves, ...p.adjustments?.curves },
            },
            url: URL.createObjectURL(p.blob),
            previewUrl: p.previewBlob
              ? URL.createObjectURL(p.previewBlob)
              : URL.createObjectURL(p.blob),
          }));
        setPhotos(runtime);
        const remembered = localStorage.getItem("librelux-selected-photo");
        const initial = runtime.find((p) => p.id === remembered) ?? runtime[0];
        if (initial) setSelectedId(initial.id);
      })
      .catch(() => undefined);
    readSetting<StoredDirectoryHandle>("export-directory")
      .then(async (handle) => {
        if (!handle) {
          setDirectoryPermission(
            window.showDirectoryPicker ? "none" : "unsupported",
          );
          return;
        }
        setExportDirectory(handle);
        const permission = await handle.queryPermission?.({
          mode: "readwrite",
        });
        setDirectoryPermission(
          permission === "granted" ? "ready" : "needs-permission",
        );
      })
      .catch(() =>
        setDirectoryPermission(
          window.showDirectoryPicker ? "none" : "unsupported",
        ),
      );
    readSetting<StoredDirectoryHandle>("watch-directory")
      .then((handle) => setWatchDirectory(handle ?? null))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    Promise.all([
      readSetting<AlbumRecord[]>("albums"),
      readSetting<ExportRecipe[]>("export-recipes"),
      readSetting<UserPreset[]>("user-presets"),
      readSetting<typeof shortcutMap>("shortcut-map"),
      readSetting<{
        highContrast?: boolean;
        reducedMotion?: boolean;
        compactUi?: boolean;
        showFilmstrip?: boolean;
        gridSize?: number;
      }>("ui-preferences"),
    ])
      .then(
        ([savedAlbums, savedRecipes, savedPresets, savedShortcuts, prefs]) => {
          if (savedAlbums)
            setAlbums(
              savedAlbums.map((album) => ({
                ...album,
                kind: album.kind ?? "album",
                parentId: album.parentId ?? null,
                rule: album.rule ?? null,
                target: album.target ?? false,
              })),
            );
          if (savedRecipes)
            setExportRecipes([
              ...builtInExportRecipes,
              ...savedRecipes.filter(
                (recipe) =>
                  !builtInExportRecipes.some((item) => item.id === recipe.id),
              ),
            ]);
          if (savedPresets) setUserPresets(savedPresets);
          if (savedShortcuts)
            setShortcutMap((current) => ({ ...current, ...savedShortcuts }));
          if (prefs) {
            setHighContrast(Boolean(prefs.highContrast));
            setReducedMotion(Boolean(prefs.reducedMotion));
            setCompactUi(Boolean(prefs.compactUi));
            setShowFilmstrip(prefs.showFilmstrip !== false);
            setGridSize(prefs.gridSize ?? 155);
          }
        },
      )
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (selectedId) localStorage.setItem("librelux-selected-photo", selectedId);
  }, [selectedId]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  const updateSelected = useCallback(
    (updater: (photo: RuntimePhoto) => RuntimePhoto, persist = true) => {
      setPhotos((current) =>
        current.map((photo) => {
          if (photo.id !== selectedId) return photo;
          const next = { ...updater(photo), editedAt: Date.now() };
          if (persist)
            void saveSetting("edit-journal", {
              photo: next,
              savedAt: Date.now(),
            })
              .then(() => savePhoto(next))
              .then(() => removeSetting("edit-journal"));
          return next;
        }),
      );
    },
    [selectedId],
  );
  const setAdjustment = useCallback(
    (key: keyof Adjustments, value: number) => {
      if (!selected) return;
      setHistory((h) => [...h.slice(-29), selected.adjustments]);
      setFuture([]);
      updateSelected((photo) => ({
        ...photo,
        adjustments: { ...photo.adjustments, [key]: value },
      }));
    },
    [selected, updateSelected],
  );
  const setHslAdjustment = useCallback(
    (band: ColorBand, key: keyof HslState[ColorBand], value: number) => {
      if (!selected) return;
      setHistory((h) => [...h.slice(-29), selected.adjustments]);
      setFuture([]);
      updateSelected((photo) => ({
        ...photo,
        adjustments: {
          ...photo.adjustments,
          hsl: {
            ...photo.adjustments.hsl,
            [band]: { ...photo.adjustments.hsl[band], [key]: value },
          },
        },
      }));
    },
    [selected, updateSelected],
  );
  const setBwAdjustment = useCallback(
    (band: ColorBand, value: number) => {
      if (!selected) return;
      setHistory((h) => [...h.slice(-29), selected.adjustments]);
      setFuture([]);
      updateSelected((photo) => ({
        ...photo,
        adjustments: {
          ...photo.adjustments,
          bwMix: { ...photo.adjustments.bwMix, [band]: value },
        },
      }));
    },
    [selected, updateSelected],
  );
  const setCurveAdjustment = useCallback(
    (
      channel: CurveChannel,
      key: keyof CurveState[CurveChannel],
      value: number,
    ) => {
      if (!selected) return;
      setHistory((h) => [...h.slice(-29), selected.adjustments]);
      setFuture([]);
      updateSelected((photo) => ({
        ...photo,
        adjustments: {
          ...photo.adjustments,
          curves: {
            ...photo.adjustments.curves,
            [channel]: { ...photo.adjustments.curves[channel], [key]: value },
          },
        },
      }));
    },
    [selected, updateSelected],
  );
  const importFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    const imported = await Promise.all(
      files.map(async (file) => {
        const relative =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ??
          "";
        const now = Date.now();
        let parsed: Record<string, unknown> = {};
        try {
          parsed =
            ((await exifr.parse(file, {
              tiff: true,
              exif: true,
              gps: true,
              iptc: true,
              xmp: true,
            })) as Record<string, unknown>) ?? {};
        } catch {
          parsed = {};
        }
        const [analysis, previewBlob] = await Promise.all([
          analyzeImportFile(file).catch(() => ({
            perceptualHash: "",
            cull: { focus: 0, exposure: 0, faces: 0, similarity: 0 },
          })),
          createSmartPreview(file),
        ]);
        const keywordSource =
          parsed.Keywords ?? parsed.Subject ?? parsed.subject;
        const keywords = Array.isArray(keywordSource)
          ? keywordSource.map(String)
          : typeof keywordSource === "string"
            ? keywordSource
                .split(/[,;]/)
                .map((value) => value.trim())
                .filter(Boolean)
            : [];
        const captured =
          parsed.DateTimeOriginal instanceof Date
            ? parsed.DateTimeOriginal.toISOString()
            : parsed.CreateDate instanceof Date
              ? parsed.CreateDate.toISOString()
              : "";
        const record: PhotoRecord = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          createdAt: now,
          editedAt: now,
          rating: 0,
          flagged: false,
          rejected: false,
          label: "none",
          folder: relative.split("/").slice(0, -1).join("/") || "Local library",
          virtualOf: null,
          blob: file,
          adjustments: {
            ...defaults,
            hsl: { ...defaultHsl },
            bwMix: { ...defaultBw },
            curves: { ...defaultCurves },
          },
          metadata: {
            ...emptyMetadata,
            title: String(parsed.ObjectName ?? parsed.Title ?? ""),
            caption: String(
              parsed.ImageDescription ??
                parsed.Caption ??
                parsed.description ??
                "",
            ),
            creator: String(
              parsed.Artist ?? parsed.Creator ?? parsed.creator ?? "",
            ),
            copyright: String(parsed.Copyright ?? parsed.CopyrightNotice ?? ""),
            keywords,
            camera: [parsed.Make, parsed.Model]
              .filter(Boolean)
              .map(String)
              .join(" "),
            lens: String(parsed.LensModel ?? parsed.Lens ?? ""),
            capturedAt: captured,
            iso: parsed.ISO ? String(parsed.ISO) : "",
            aperture: parsed.FNumber ? `f/${parsed.FNumber}` : "",
            shutter: parsed.ExposureTime ? String(parsed.ExposureTime) : "",
            focalLength: parsed.FocalLength ? `${parsed.FocalLength} mm` : "",
            latitude:
              typeof parsed.latitude === "number" ? parsed.latitude : null,
            longitude:
              typeof parsed.longitude === "number" ? parsed.longitude : null,
          },
          masks: [],
          retouchSpots: [],
          perceptualHash: analysis.perceptualHash,
          cull: analysis.cull,
          stackId: null,
          missing: false,
          processVersion: "2026",
          previewBlob,
        };
        void savePhoto(record);
        return {
          ...record,
          url: URL.createObjectURL(file),
          previewUrl: previewBlob
            ? URL.createObjectURL(previewBlob)
            : URL.createObjectURL(file),
        };
      }),
    );
    setPhotos((p) => [...imported, ...p]);
    if (imported[0]) {
      setSelectedId(imported[0].id);
      setWorkspace("develop");
    }
  }, []);
  const chooseWatchDirectory = useCallback(async () => {
    if (!window.showDirectoryPicker) {
      setWatchStatus("Folder watching is not supported in this browser");
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      setWatchDirectory(handle);
      await saveSetting("watch-directory", handle);
      setWatchStatus(`Watching ${handle.name}`);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        setWatchStatus("Could not connect that folder");
    }
  }, []);
  const scanWatchDirectory = useCallback(async () => {
    if (!watchDirectory?.values) {
      setWatchStatus("Choose a watched folder first");
      return;
    }
    try {
      const permission = await watchDirectory.queryPermission?.({
        mode: "readwrite",
      });
      if (permission !== "granted") {
        const requested = await watchDirectory.requestPermission?.({
          mode: "readwrite",
        });
        if (requested !== "granted") {
          setWatchStatus("Reconnect the watched folder to scan it");
          return;
        }
      }
      const files: File[] = [];
      for await (const entry of watchDirectory.values()) {
        if (entry.kind !== "file" || !entry.getFile) continue;
        const file = await entry.getFile();
        if (
          file.type.startsWith("image/") &&
          !photos.some(
            (photo) => photo.name === file.name && photo.size === file.size,
          )
        )
          files.push(file);
      }
      if (files.length) await importFiles(files);
      setWatchStatus(
        files.length
          ? `Imported ${files.length} new photo${files.length === 1 ? "" : "s"}`
          : `${watchDirectory.name} is up to date`,
      );
    } catch {
      setWatchStatus("The watched folder needs to be reconnected");
    }
  }, [importFiles, photos, watchDirectory]);
  useEffect(() => {
    if (!watchDirectory) return;
    const interval = window.setInterval(
      () => void scanWatchDirectory(),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, [scanWatchDirectory, watchDirectory]);
  const removeSelected = useCallback(() => {
    setDeleteOpen(true);
  }, []);
  const confirmRemoveSelected = useCallback(() => {
    if (!selected) return;
    void deletePhoto(selected.id);
    URL.revokeObjectURL(selected.url);
    const remaining = photos.filter((p) => p.id !== selected.id);
    setPhotos(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    setDeleteOpen(false);
  }, [selected, photos]);
  const toggleSelection = (id: string, additive = false) => {
    setSelectedId(id);
    setSelectedIds((current) =>
      additive
        ? current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id]
        : [id],
    );
  };
  const updateMany = (updater: (photo: RuntimePhoto) => RuntimePhoto) => {
    const targets = selectedIds.length
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];
    setPhotos((current) =>
      current.map((photo) => {
        if (!targets.includes(photo.id)) return photo;
        const next = { ...updater(photo), editedAt: Date.now() };
        void savePhoto(next);
        return next;
      }),
    );
  };
  const createVirtualCopy = () => {
    if (!selected) return;
    const id = crypto.randomUUID();
    const copy: RuntimePhoto = {
      ...selected,
      id,
      name: `${selected.name.replace(/(\.[^.]+)$/, " - Copy$1")}`,
      createdAt: Date.now(),
      editedAt: Date.now(),
      virtualOf: selected.virtualOf ?? selected.id,
      url: URL.createObjectURL(selected.blob),
      adjustments: {
        ...selected.adjustments,
        hsl: { ...selected.adjustments.hsl },
        bwMix: { ...selected.adjustments.bwMix },
        curves: { ...selected.adjustments.curves },
      },
      metadata: {
        ...selected.metadata,
        keywords: [...selected.metadata.keywords],
      },
      masks: selected.masks.map((mask) => ({
        ...mask,
        id: crypto.randomUUID(),
        adjustments: { ...mask.adjustments },
      })),
      retouchSpots: selected.retouchSpots.map((spot) => ({
        ...spot,
        id: crypto.randomUUID(),
      })),
    };
    void savePhoto(copy);
    setPhotos((current) => [copy, ...current]);
    setSelectedId(id);
    setSelectedIds([id]);
  };
  const exportCatalog = () => {
    const records = photos.map(
      ({ url, previewUrl, blob, previewBlob, ...photo }) => {
        void url;
        void previewUrl;
        void previewBlob;
        return {
          ...photo,
          original: { name: photo.name, size: blob.size, type: photo.type },
        };
      },
    );
    const header = new TextEncoder().encode(
      JSON.stringify({
        format: "LibreLux Catalog",
        version: 2,
        createdAt: new Date().toISOString(),
        records,
      }),
    );
    const data = new Blob(
      [header, new Uint8Array([10]), ...photos.map((photo) => photo.blob)],
      { type: "application/x-librelux-catalog" },
    );
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LibreLux-Catalog-${new Date().toISOString().slice(0, 10)}.libreluxcat`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const restoreCatalog = async (file?: File) => {
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const newline = bytes.indexOf(10);
      if (newline < 1) throw new Error("Invalid catalog");
      const manifest = JSON.parse(
        new TextDecoder().decode(bytes.slice(0, newline)),
      ) as {
        format: string;
        version: number;
        records: Array<
          Omit<PhotoRecord, "blob"> & {
            original: { name: string; size: number; type: string };
          }
        >;
      };
      if (manifest.format !== "LibreLux Catalog" || manifest.version !== 2)
        throw new Error("Unsupported catalog");
      let offset = newline + 1;
      const restored: RuntimePhoto[] = [];
      for (const record of manifest.records) {
        const size = record.original.size;
        if (offset + size > bytes.length)
          throw new Error("Catalog integrity check failed");
        const blob = new Blob([bytes.slice(offset, offset + size)], {
          type: record.original.type,
        });
        offset += size;
        const { original: _original, ...photo } = record;
        void _original;
        const runtime = {
          ...photo,
          blob,
          url: URL.createObjectURL(blob),
          previewBlob: null,
          previewUrl: URL.createObjectURL(blob),
          missing: false,
        } as RuntimePhoto;
        await savePhoto(runtime);
        restored.push(runtime);
      }
      if (offset !== bytes.length) throw new Error("Unexpected catalog data");
      setPhotos((current) => [...restored, ...current]);
      setSelectedId(restored[0]?.id ?? null);
      setCatalogStatus(`Restored and verified ${restored.length} photos`);
    } catch (error) {
      setCatalogStatus(
        error instanceof Error ? error.message : "Catalog restore failed",
      );
    }
  };
  const verifyAndOptimizeCatalog = async () => {
    const valid = photos.filter(
      (photo) =>
        photo.blob instanceof Blob &&
        photo.blob.size === photo.size &&
        Boolean(photo.id),
    );
    for (const photo of valid) await savePhoto({ ...photo, missing: false });
    setPhotos((current) =>
      current.map((photo) => ({
        ...photo,
        missing:
          !(photo.blob instanceof Blob) || photo.blob.size !== photo.size,
      })),
    );
    setCatalogStatus(
      valid.length === photos.length
        ? `Verified and optimized ${valid.length} photos`
        : `${photos.length - valid.length} missing or damaged originals found`,
    );
  };
  const applyPreset = (settings: Partial<Adjustments>) => {
    if (!selected) return;
    setHistory((h) => [...h.slice(-29), selected.adjustments]);
    setFuture([]);
    updateSelected((photo) => ({
      ...photo,
      adjustments: { ...photo.adjustments, ...settings },
    }));
  };
  const choosePreset = (
    id: string,
    name: string,
    settings: Partial<Adjustments>,
  ) =>
    setSelectedPreset((current) =>
      current?.id === id ? null : { id, name, settings },
    );
  const persistUserPresets = (next: UserPreset[]) => {
    setUserPresets(next);
    void saveSetting("user-presets", next);
  };
  const createUserPreset = () => {
    if (!selected) return;
    persistUserPresets([
      ...userPresets,
      {
        id: crypto.randomUUID(),
        name: `Custom ${userPresets.length + 1}`,
        group: "My presets",
        settings: { ...selected.adjustments },
        createdAt: Date.now(),
      },
    ]);
  };
  const updateUserPreset = (id: string, patch: Partial<UserPreset>) =>
    persistUserPresets(
      userPresets.map((preset) =>
        preset.id === id ? { ...preset, ...patch } : preset,
      ),
    );
  const deleteUserPreset = (id: string) =>
    persistUserPresets(userPresets.filter((preset) => preset.id !== id));
  const exportUserPresets = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { format: "LibreLux Presets", version: 1, presets: userPresets },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LibreLux-Presets.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importUserPresets = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as {
        presets?: Partial<UserPreset>[];
      };
      const imported = (data.presets ?? [])
        .map((preset, index) => {
          const settings = Object.fromEntries(
            Object.entries(preset.settings ?? {}).filter(
              ([key, value]) =>
                key in defaults &&
                (typeof value === "number" || typeof value === "object"),
            ),
          ) as Partial<Adjustments>;
          return {
            id: crypto.randomUUID(),
            name: String(preset.name ?? `Imported ${index + 1}`),
            group: String(preset.group ?? "Imported"),
            settings,
            createdAt: Date.now(),
          };
        })
        .filter((preset) => Object.keys(preset.settings).length);
      persistUserPresets([...userPresets, ...imported]);
    } catch {
      return;
    }
  };
  const applyPresetToSelection = (settings: Partial<Adjustments>) => {
    const targets = selectedIds.length
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];
    setPhotos((current) =>
      current.map((photo) => {
        if (!targets.includes(photo.id)) return photo;
        const next = {
          ...photo,
          editedAt: Date.now(),
          adjustments: { ...photo.adjustments, ...settings },
        };
        void savePhoto(next);
        return next;
      }),
    );
  };
  const applyAdaptivePreset = async (kind: "subject" | "sky" | "portrait") => {
    if (!selected) return;
    const stats = await analyzePhoto(selected.url);
    const exposureLift = Math.max(
      -0.4,
      Math.min(0.65, Math.log2(135 / Math.max(24, stats.average))),
    );
    applyPreset(
      kind === "sky"
        ? { highlights: -35, dehaze: 18, vibrance: 12 }
        : kind === "portrait"
          ? {
              exposure: exposureLift * 0.5,
              texture: -18,
              clarity: -8,
              temperature: 5,
            }
          : { exposure: exposureLift, shadows: 18, clarity: 10 },
    );
  };
  const commitPreset = () => {
    if (!selectedPreset || !selected) return;
    const strength = presetAmount / 100;
    const scaled = Object.fromEntries(
      Object.entries(selectedPreset.settings).map(([key, target]) => {
        const current = selected.adjustments[key as keyof Adjustments];
        return [
          key,
          typeof target === "number" && typeof current === "number"
            ? current + (target - current) * strength
            : target,
        ];
      }),
    ) as Partial<Adjustments>;
    applyPreset(scaled);
    setSelectedPreset(null);
  };
  const chooseExportDirectory = async () => {
    if (!window.showDirectoryPicker) {
      setDirectoryPermission("unsupported");
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      await saveSetting("export-directory", handle);
      setExportDirectory(handle);
      setDirectoryPermission("ready");
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        setDirectoryPermission("needs-permission");
    }
  };
  const clearExportDirectory = async () => {
    await removeSetting("export-directory");
    setExportDirectory(null);
    setDirectoryPermission(window.showDirectoryPicker ? "none" : "unsupported");
  };
  const persistAlbums = (next: AlbumRecord[]) => {
    setAlbums(next);
    void saveSetting("albums", next);
  };
  const createAlbum = () => {
    const name = newAlbumName.trim();
    if (!name) return;
    const album: AlbumRecord = {
      id: crypto.randomUUID(),
      name,
      photoIds: [],
      createdAt: Date.now(),
      kind: "album",
      parentId:
        albums.find((album) => album.kind === "set" && album.target)?.id ??
        null,
      rule: null,
      target: false,
    };
    persistAlbums([...albums, album]);
    setActiveAlbumId(album.id);
    setNewAlbumName("");
  };
  const createCollection = (
    kind: "set" | "quick" | "smart",
    rule: AlbumRecord["rule"] = null,
  ) => {
    const album: AlbumRecord = {
      id: crypto.randomUUID(),
      name:
        kind === "set"
          ? `Collection set ${albums.filter((item) => item.kind === "set").length + 1}`
          : kind === "quick"
            ? "Quick Collection"
            : `Smart ${rule?.replace("-", " ") ?? "album"}`,
      photoIds:
        kind === "quick"
          ? [
              ...new Set(
                selectedIds.length
                  ? selectedIds
                  : selectedId
                    ? [selectedId]
                    : [],
              ),
            ]
          : [],
      createdAt: Date.now(),
      kind,
      parentId: null,
      rule,
      target: false,
    };
    persistAlbums([...albums, album]);
    setActiveAlbumId(album.id);
  };
  const setTargetAlbum = (id: string) =>
    persistAlbums(
      albums.map((album) => ({ ...album, target: album.id === id })),
    );
  const autoStackPhotos = () => {
    const ordered = [...photos].sort(
      (a, b) =>
        (a.metadata.capturedAt
          ? Date.parse(a.metadata.capturedAt)
          : a.createdAt) -
        (b.metadata.capturedAt
          ? Date.parse(b.metadata.capturedAt)
          : b.createdAt),
    );
    let previousTime = 0,
      currentStack = "";
    const ids = new Map<string, string | null>();
    ordered.forEach((photo) => {
      const time = photo.metadata.capturedAt
        ? Date.parse(photo.metadata.capturedAt)
        : photo.createdAt;
      if (!previousTime || time - previousTime > 2500)
        currentStack = crypto.randomUUID();
      ids.set(photo.id, currentStack);
      previousTime = time;
    });
    setPhotos((current) =>
      current.map((photo) => {
        const next = { ...photo, stackId: ids.get(photo.id) ?? null };
        void savePhoto(next);
        return next;
      }),
    );
  };
  const toggleAlbumMembership = (albumId: string) => {
    const ids = selectedIds.length
      ? selectedIds
      : selectedId
        ? [selectedId]
        : [];
    if (!ids.length) return;
    persistAlbums(
      albums.map((album) =>
        album.id !== albumId
          ? album
          : {
              ...album,
              photoIds: ids.every((id) => album.photoIds.includes(id))
                ? album.photoIds.filter((id) => !ids.includes(id))
                : [...new Set([...album.photoIds, ...ids])],
            },
      ),
    );
  };
  const deleteAlbum = (albumId: string) => {
    persistAlbums(albums.filter((album) => album.id !== albumId));
    if (activeAlbumId === albumId) setActiveAlbumId(null);
  };
  const applyExportRecipe = (recipe: ExportRecipe) => {
    setSelectedExportRecipe(recipe.id);
    setExportFormat(recipe.format);
    setExportQuality(recipe.quality);
    setExportScale(recipe.scale);
    setExportLongEdge(recipe.longEdge);
    setExportResolution(recipe.resolution);
    setOutputSharpen(recipe.outputSharpen);
    setExportSuffix(recipe.suffix);
    setWatermark(recipe.watermark);
  };
  const saveCurrentExportRecipe = () => {
    const recipe: ExportRecipe = {
      id: crypto.randomUUID(),
      name: `Custom ${exportRecipes.filter((item) => !builtInExportRecipes.some((builtIn) => builtIn.id === item.id)).length + 1}`,
      format: exportFormat,
      quality: exportQuality,
      scale: exportScale,
      longEdge: exportLongEdge,
      resolution: exportResolution,
      outputSharpen,
      suffix: exportSuffix,
      watermark,
    };
    const next = [...exportRecipes, recipe];
    setExportRecipes(next);
    setSelectedExportRecipe(recipe.id);
    void saveSetting(
      "export-recipes",
      next.filter(
        (item) =>
          !builtInExportRecipes.some((builtIn) => builtIn.id === item.id),
      ),
    );
  };
  const deleteExportRecipe = (id: string) => {
    const next = exportRecipes.filter((recipe) => recipe.id !== id);
    setExportRecipes(next);
    if (selectedExportRecipe === id) setSelectedExportRecipe(null);
    void saveSetting(
      "export-recipes",
      next.filter(
        (item) =>
          !builtInExportRecipes.some((builtIn) => builtIn.id === item.id),
      ),
    );
  };
  const updateUiPreferences = (
    patch: Partial<{
      highContrast: boolean;
      reducedMotion: boolean;
      compactUi: boolean;
      showFilmstrip: boolean;
      gridSize: number;
    }>,
  ) => {
    const next = {
      highContrast,
      reducedMotion,
      compactUi,
      showFilmstrip,
      gridSize,
      ...patch,
    };
    if (patch.highContrast !== undefined) setHighContrast(patch.highContrast);
    if (patch.reducedMotion !== undefined)
      setReducedMotion(patch.reducedMotion);
    if (patch.compactUi !== undefined) setCompactUi(patch.compactUi);
    if (patch.showFilmstrip !== undefined)
      setShowFilmstrip(patch.showFilmstrip);
    if (patch.gridSize !== undefined) setGridSize(patch.gridSize);
    void saveSetting("ui-preferences", next);
  };
  const addMask = (mask: MaskRecord) => {
    updateSelected((photo) => ({ ...photo, masks: [...photo.masks, mask] }));
    setSelectedMaskId(mask.id);
    setMaskTarget(null);
  };
  const updateMask = (id: string, updater: (mask: MaskRecord) => MaskRecord) =>
    updateSelected((photo) => ({
      ...photo,
      masks: photo.masks.map((mask) => (mask.id === id ? updater(mask) : mask)),
    }));
  const duplicateMask = (mask: MaskRecord) => {
    const id = crypto.randomUUID();
    updateSelected((photo) => ({
      ...photo,
      masks: [
        ...photo.masks,
        {
          ...mask,
          id,
          name: `${mask.name} copy`,
          adjustments: { ...mask.adjustments },
        },
      ],
    }));
    setSelectedMaskId(id);
  };
  const deleteMask = (id: string) => {
    updateSelected((photo) => ({
      ...photo,
      masks: photo.masks.filter((mask) => mask.id !== id),
    }));
    setSelectedMaskId(null);
  };
  const addRetouchSpot = (spot: RetouchSpot) =>
    updateSelected((photo) => ({
      ...photo,
      retouchSpots: [...photo.retouchSpots, spot],
    }));
  const updateRetouchSpot = (id: string, patch: Partial<RetouchSpot>) =>
    updateSelected((photo) => ({
      ...photo,
      retouchSpots: photo.retouchSpots.map((spot) =>
        spot.id === id ? { ...spot, ...patch } : spot,
      ),
    }));
  const deleteRetouchSpot = (id: string) =>
    updateSelected((photo) => ({
      ...photo,
      retouchSpots: photo.retouchSpots.filter((spot) => spot.id !== id),
    }));
  const clearRetouchSpots = () =>
    updateSelected((photo) => ({ ...photo, retouchSpots: [] }));
  const undo = useCallback(() => {
    if (!selected || !history.length) return;
    const previous = history.at(-1)!;
    setFuture((f) => [selected.adjustments, ...f]);
    setHistory((h) => h.slice(0, -1));
    updateSelected((p) => ({ ...p, adjustments: previous }));
  }, [selected, history, updateSelected]);
  const redo = useCallback(() => {
    if (!selected || !future.length) return;
    const next = future[0];
    setHistory((h) => [...h, selected.adjustments]);
    setFuture((f) => f.slice(1));
    updateSelected((p) => ({ ...p, adjustments: next }));
  }, [selected, future, updateSelected]);
  const openPhotoPicker = useCallback(
    () => document.getElementById("librelux-photo-import")?.click(),
    [],
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      if (mod && key === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (event.key === "?" && !mod) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.shiftKey && key === "c" && selected) {
        event.preventDefault();
        setCopiedSettings(selected.adjustments);
        return;
      }
      if (mod && event.shiftKey && key === "v" && selected && copiedSettings) {
        event.preventDefault();
        updateSelected((p) => ({ ...p, adjustments: { ...copiedSettings } }));
        return;
      }
      if (key === shortcutMap.library) setWorkspace("library");
      if (key === shortcutMap.develop) setWorkspace("develop");
      if (key === shortcutMap.optics) setWorkspace("enhance");
      if (event.shiftKey && key === "1") {
        setWorkspace("enhance");
        setOpticsMode("pure");
      }
      if (event.shiftKey && key === "2") {
        setWorkspace("enhance");
        setOpticsMode("creative");
      }
      if (event.shiftKey && key === "3") {
        setWorkspace("enhance");
        setOpticsMode("film");
      }
      if (event.key === "\\")
        setCompareMode((mode) => (mode === "edited" ? "original" : "edited"));
      if (key === shortcutMap.pick && selected)
        updateSelected((p) => ({ ...p, flagged: true, rejected: false }));
      if (key === shortcutMap.reject && selected)
        updateSelected((p) => ({ ...p, rejected: true, flagged: false }));
      if (key === shortcutMap.unflag && selected)
        updateSelected((p) => ({ ...p, rejected: false, flagged: false }));
      if (/^[0-5]$/.test(key) && selected && !event.shiftKey)
        updateSelected((p) => ({ ...p, rating: Number(key) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, undo, selected, updateSelected, copiedSettings, shortcutMap]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: "open_workspace",
          title: "Open LibreLux workspace",
          description: "Open Library, Develop, or an Optics mode in LibreLux.",
          inputSchema: {
            type: "object",
            properties: {
              workspace: {
                type: "string",
                enum: ["library", "develop", "optics"],
              },
              optics_mode: {
                type: "string",
                enum: ["pure", "creative", "film"],
              },
            },
            required: ["workspace"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const value = (
              input as { workspace?: unknown; optics_mode?: unknown }
            )?.workspace;
            const mode = (input as { optics_mode?: unknown })?.optics_mode;
            if (
              value !== "library" &&
              value !== "develop" &&
              value !== "optics"
            )
              throw new Error("workspace must be library, develop, or optics");
            if (
              mode !== undefined &&
              mode !== "pure" &&
              mode !== "creative" &&
              mode !== "film"
            )
              throw new Error("optics_mode must be pure, creative, or film");
            setWorkspace(value === "optics" ? "enhance" : value);
            if (mode) setOpticsMode(mode);
            return { workspace: value, optics_mode: mode ?? opticsMode };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: "set_photo_rating",
          title: "Rate selected photo",
          description:
            "Set the selected LibreLux photo rating from zero to five stars.",
          inputSchema: {
            type: "object",
            properties: { rating: { type: "integer", minimum: 0, maximum: 5 } },
            required: ["rating"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const rating = (input as { rating?: unknown })?.rating;
            if (
              !Number.isInteger(rating) ||
              Number(rating) < 0 ||
              Number(rating) > 5
            )
              throw new Error("rating must be an integer from 0 to 5");
            if (!selected) throw new Error("No photo is selected");
            updateSelected((photo) => ({ ...photo, rating: Number(rating) }));
            return { photoId: selected.id, rating };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [selected, updateSelected, opticsMode]);
  const autoTone = async () => {
    if (!selected) return;
    const stats = await analyzePhoto(selected.url);
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));
    const settings: Partial<Adjustments> = {
      exposure: clamp(Math.log2(128 / Math.max(12, stats.average)), -2.5, 2.5),
      contrast: clamp((stats.high - stats.low - 150) * 0.35, -35, 45),
      shadows: clamp((38 - stats.low) * 1.25, -25, 55),
      highlights: clamp((218 - stats.high) * 1.25, -55, 25),
      blacks: clamp((18 - stats.low) * 0.8, -30, 25),
      whites: clamp((stats.high - 235) * 0.8, -25, 30),
    };
    applyPreset(settings);
  };
  const autoEnhance = async () => {
    if (!selected) return;
    await autoTone();
    applyPreset({
      vibrance: 13,
      clarity: 7,
      dehaze: 5,
      noise: 18,
      colorNoise: 22,
      sharpness: 38,
      lensSharpness: 28,
      chromatic: 18,
    });
  };
  const applySampledWhiteBalance = (temperature: number, tint: number) => {
    if (!selected) return;
    setHistory((h) => [...h.slice(-29), selected.adjustments]);
    setFuture([]);
    updateSelected((photo) => ({
      ...photo,
      adjustments: { ...photo.adjustments, temperature, tint },
    }));
    setSampleMode(null);
  };
  const applySampledPointColor = (red: number, green: number, blue: number) => {
    const r = red / 255,
      g = green / 255,
      b = blue / 255,
      max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      delta = max - min;
    let hue = 0;
    if (delta) {
      if (max === r) hue = 60 * (((g - b) / delta) % 6);
      else if (max === g) hue = 60 * ((b - r) / delta + 2);
      else hue = 60 * ((r - g) / delta + 4);
    }
    if (hue < 0) hue += 360;
    const centers: Record<ColorBand, number> = {
      red: 0,
      orange: 30,
      yellow: 60,
      green: 120,
      aqua: 180,
      blue: 225,
      purple: 275,
      magenta: 320,
    };
    const distance = (center: number) =>
      Math.min(Math.abs(hue - center), 360 - Math.abs(hue - center));
    const band = colorBands.reduce(
      (best, current) =>
        distance(centers[current]) < distance(centers[best]) ? current : best,
      "red" as ColorBand,
    );
    setPointColor({
      band,
      sourceHue: Math.round(hue),
      range: 30,
      variance: 15,
    });
    setSampleMode(null);
  };
  const renderedExportName = (photo: RuntimePhoto) =>
    exportNameTemplate
      .replaceAll("{name}", photo.name.replace(/\.[^.]+$/, ""))
      .replaceAll("{suffix}", exportSuffix)
      .replaceAll("{date}", new Date().toISOString().slice(0, 10))
      .replaceAll("{rating}", String(photo.rating))
      .replace(/[^a-z0-9._ -]/gi, "-") || "LibreLux-export";
  const doExport = async () => {
    if (!selected) return;
    const image = new Image();
    image.src = selected.url;
    await image.decode();
    let sx = 0,
      sy = 0,
      sw = image.naturalWidth,
      sh = image.naturalHeight;
    let factor = exportScale / 100;
    const ratio = selected.adjustments.cropRatio;
    const insetLeft = sw * (selected.adjustments.cropLeft / 100);
    const insetRight = sw * (selected.adjustments.cropRight / 100);
    const insetTop = sh * (selected.adjustments.cropTop / 100);
    const insetBottom = sh * (selected.adjustments.cropBottom / 100);
    sx += insetLeft;
    sy += insetTop;
    sw = Math.max(1, sw - insetLeft - insetRight);
    sh = Math.max(1, sh - insetTop - insetBottom);
    if (ratio > 0) {
      const original = sw / sh;
      if (original > ratio) {
        const next = sh * ratio;
        sx = (sw - next) / 2;
        sw = next;
      } else {
        const next = sw / ratio;
        sy = (sh - next) / 2;
        sh = next;
      }
    }
    if (exportSizing === "long" && exportLongEdge > 0)
      factor = exportLongEdge / Math.max(sw, sh);
    else if (exportSizing === "short" && exportShortEdge > 0)
      factor = exportShortEdge / Math.min(sw, sh);
    else if (
      exportSizing === "dimensions" &&
      (exportWidth > 0 || exportHeight > 0)
    )
      factor = Math.min(
        exportWidth > 0 ? exportWidth / sw : Infinity,
        exportHeight > 0 ? exportHeight / sh : Infinity,
      );
    else if (exportSizing === "megapixels" && exportMegapixels > 0)
      factor = Math.sqrt((exportMegapixels * 1_000_000) / (sw * sh));
    const rotated = Math.abs(selected.adjustments.rotation % 180) === 90;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((rotated ? sh : sw) * factor));
    canvas.height = Math.max(1, Math.round((rotated ? sw : sh) * factor));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = `${cssFilter(selected.adjustments, selected.processVersion)} ${outputSharpen === "none" ? "" : outputSharpen === "screen" ? "contrast(1.04)" : "contrast(1.07)"}`;
    ctx.translate(
      canvas.width / 2 + selected.adjustments.offsetX * factor,
      canvas.height / 2 + selected.adjustments.offsetY * factor,
    );
    ctx.rotate((selected.adjustments.rotation * Math.PI) / 180);
    ctx.transform(
      1,
      selected.adjustments.perspectiveV / 450,
      selected.adjustments.perspectiveH / 450,
      1,
      0,
      0,
    );
    const opticalScale =
      (selected.adjustments.perspectiveScale / 100) *
      (1 + selected.adjustments.distortion / 700);
    ctx.scale(
      selected.adjustments.flipX *
        opticalScale *
        (1 + selected.adjustments.anamorphic / 200),
      selected.adjustments.flipY * opticalScale,
    );
    if (selected.adjustments.boundaryFill > 0) {
      ctx.save();
      ctx.filter = `${cssFilter(selected.adjustments, selected.processVersion)} blur(${Math.max(4, selected.adjustments.boundaryFill / 4)}px)`;
      const fillScale = 1.08 + selected.adjustments.boundaryFill / 500;
      ctx.globalAlpha = 0.92;
      ctx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        (-sw * factor * fillScale) / 2,
        (-sh * factor * fillScale) / 2,
        sw * factor * fillScale,
        sh * factor * fillScale,
      );
      ctx.restore();
    }
    ctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      (-sw * factor) / 2,
      (-sh * factor) / 2,
      sw * factor,
      sh * factor,
    );
    for (const mask of selected.masks.filter((item) => item.visible)) {
      const layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      const layerCtx = layer.getContext("2d");
      if (!layerCtx) continue;
      layerCtx.filter = `${cssFilter(selected.adjustments)} ${localFilter(mask.adjustments)}`;
      layerCtx.translate(
        layer.width / 2 + selected.adjustments.offsetX * factor,
        layer.height / 2 + selected.adjustments.offsetY * factor,
      );
      layerCtx.rotate((selected.adjustments.rotation * Math.PI) / 180);
      layerCtx.transform(
        1,
        selected.adjustments.perspectiveV / 450,
        selected.adjustments.perspectiveH / 450,
        1,
        0,
        0,
      );
      layerCtx.scale(
        selected.adjustments.flipX *
          opticalScale *
          (1 + selected.adjustments.anamorphic / 200),
        selected.adjustments.flipY * opticalScale,
      );
      layerCtx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        (-sw * factor) / 2,
        (-sh * factor) / 2,
        sw * factor,
        sh * factor,
      );
      const maskImage = new Image();
      maskImage.src = mask.dataUrl;
      await maskImage.decode();
      layerCtx.resetTransform();
      layerCtx.globalCompositeOperation = mask.inverted
        ? "destination-out"
        : "destination-in";
      layerCtx.drawImage(maskImage, 0, 0, layer.width, layer.height);
      ctx.save();
      ctx.resetTransform();
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }
    for (const spot of selected.retouchSpots) {
      const targetX =
        (-sw * factor) / 2 + (spot.x * image.naturalWidth - sx) * factor;
      const targetY =
        (-sh * factor) / 2 + (spot.y * image.naturalHeight - sy) * factor;
      const radius = Math.max(2, (spot.size / 200) * Math.min(sw, sh) * factor);
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      ctx.clip();
      if (spot.mode === "redEye") {
        ctx.filter = `${cssFilter(selected.adjustments)} saturate(.1) brightness(.38)`;
        ctx.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          (-sw * factor) / 2,
          (-sh * factor) / 2,
          sw * factor,
          sh * factor,
        );
      } else {
        ctx.filter = `${cssFilter(selected.adjustments)}${spot.mode === "heal" || spot.mode === "remove" ? ` blur(${spot.feather / 80}px)` : ""}`;
        ctx.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          (-sw * factor) / 2 +
            (spot.x - spot.sourceX) * image.naturalWidth * factor,
          (-sh * factor) / 2 +
            (spot.y - spot.sourceY) * image.naturalHeight * factor,
          sw * factor,
          sh * factor,
        );
      }
      ctx.restore();
    }
    if (
      selected.adjustments.chromatic > 0 ||
      selected.adjustments.chromaticShift > 0
    ) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(
        0.16,
        (selected.adjustments.chromatic + selected.adjustments.chromaticShift) /
          700,
      );
      ctx.filter = `${cssFilter(selected.adjustments)} hue-rotate(115deg)`;
      const shift = Math.max(
        1,
        (selected.adjustments.chromatic + selected.adjustments.chromaticShift) /
          12,
      );
      ctx.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        (-sw * factor) / 2 + shift,
        (-sh * factor) / 2,
        sw * factor,
        sh * factor,
      );
      ctx.restore();
    }
    if (
      selected.adjustments.halation > 0 ||
      selected.adjustments.lightLeak > 0
    ) {
      ctx.save();
      ctx.resetTransform();
      ctx.globalCompositeOperation = "screen";
      const halo = ctx.createRadialGradient(
        canvas.width * 0.72,
        canvas.height * 0.28,
        0,
        canvas.width * 0.72,
        canvas.height * 0.28,
        Math.max(canvas.width, canvas.height) * 0.72,
      );
      halo.addColorStop(
        0,
        `rgba(255,112,54,${(selected.adjustments.halation + selected.adjustments.lightLeak) / 260})`,
      );
      halo.addColorStop(
        0.34,
        `rgba(255,58,28,${selected.adjustments.lightLeak / 480})`,
      );
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (selected.adjustments.paperTexture > 0 || selected.adjustments.age > 0) {
      ctx.save();
      ctx.resetTransform();
      ctx.globalAlpha = Math.min(
        0.18,
        (selected.adjustments.paperTexture + selected.adjustments.age) / 900,
      );
      ctx.fillStyle = "#f1d7a6";
      for (let i = 0; i < 1200; i++) {
        const x = (i * 7919) % canvas.width;
        const y = (i * 104729) % canvas.height;
        const s = 1 + (i % 3);
        ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    }
    if (watermark.trim() || watermarkImage) {
      ctx.save();
      ctx.resetTransform();
      const fontSize = Math.max(14, Math.round(canvas.width / 42));
      const margin = fontSize;
      const anchorX = watermarkPosition.includes("left")
        ? margin
        : watermarkPosition.includes("right")
          ? canvas.width - margin
          : canvas.width / 2;
      const anchorY = watermarkPosition.includes("top")
        ? margin
        : watermarkPosition.includes("bottom")
          ? canvas.height - margin
          : canvas.height / 2;
      ctx.globalAlpha = watermarkOpacity / 100;
      if (watermarkImage) {
        const mark = new Image();
        mark.src = watermarkImage;
        await mark.decode();
        const maxWidth = canvas.width * 0.22,
          maxHeight = canvas.height * 0.18;
        const scale = Math.min(
          maxWidth / mark.naturalWidth,
          maxHeight / mark.naturalHeight,
          1,
        );
        const markWidth = mark.naturalWidth * scale,
          markHeight = mark.naturalHeight * scale;
        const markX = watermarkPosition.includes("left")
          ? anchorX
          : watermarkPosition.includes("right")
            ? anchorX - markWidth
            : anchorX - markWidth / 2;
        const markY = watermarkPosition.includes("top")
          ? anchorY
          : watermarkPosition.includes("bottom")
            ? anchorY - markHeight
            : anchorY - markHeight / 2;
        ctx.drawImage(mark, markX, markY, markWidth, markHeight);
      }
      ctx.font = `600 ${fontSize}px system-ui`;
      ctx.textAlign = watermarkPosition.includes("left")
        ? "left"
        : watermarkPosition.includes("right")
          ? "right"
          : "center";
      ctx.textBaseline = watermarkPosition.includes("top")
        ? "top"
        : watermarkPosition.includes("bottom")
          ? "bottom"
          : "middle";
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillText(watermark, anchorX + 1, anchorY + 1);
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.fillText(watermark, anchorX, anchorY);
      ctx.restore();
    }
    if (proofProfile !== "srgb") {
      ctx.save();
      ctx.resetTransform();
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const amount =
        proofProfile === "display-p3"
          ? 0.035
          : proofProfile === "adobe-rgb"
            ? 0.022
            : -0.025;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i],
          g = imageData.data[i + 1],
          b = imageData.data[i + 2];
        const mid = (r + g + b) / 3;
        imageData.data[i] = Math.max(0, Math.min(255, r + (r - mid) * amount));
        imageData.data[i + 1] = Math.max(
          0,
          Math.min(255, g + (g - mid) * amount),
        );
        imageData.data[i + 2] = Math.max(
          0,
          Math.min(255, b + (b - mid) * amount),
        );
      }
      ctx.putImageData(imageData, 0, 0);
      ctx.restore();
    }
    const mime =
      exportFormat === "png"
        ? "image/png"
        : exportFormat === "webp"
          ? "image/webp"
          : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, exportQuality / 100),
    );
    if (!blob) return;
    const exportMetadata = includeMetadata
      ? {
          ...selected.metadata,
          copyright: includeCopyright ? selected.metadata.copyright : "",
          rating: selected.rating,
          label: selected.label,
        }
      : null;
    const metadataBlob = exportMetadata
      ? new Blob(
          [
            JSON.stringify(
              {
                format: "LibreLux Export Metadata",
                version: 1,
                photo: renderedExportName(selected),
                metadata: exportMetadata,
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        )
      : null;
    if (exportDirectory) {
      const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
      const fileName = `${renderedExportName(selected)}.${extension}`;
      let permission =
        (await exportDirectory.queryPermission?.({ mode: "readwrite" })) ??
        "prompt";
      if (permission !== "granted")
        permission =
          (await exportDirectory.requestPermission?.({ mode: "readwrite" })) ??
          "denied";
      if (permission === "granted") {
        const file = await exportDirectory.getFileHandle(fileName, {
          create: true,
        });
        const writable = await file.createWritable();
        await writable.write(blob);
        await writable.close();
        if (metadataBlob) {
          const sidecar = await exportDirectory.getFileHandle(
            `${renderedExportName(selected)}.metadata.json`,
            { create: true },
          );
          const sidecarWritable = await sidecar.createWritable();
          await sidecarWritable.write(metadataBlob);
          await sidecarWritable.close();
        }
        setDirectoryPermission("ready");
        setExportOpen(false);
        return;
      }
      setDirectoryPermission("needs-permission");
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
    link.download = `${renderedExportName(selected)}.${extension}`;
    link.click();
    if (metadataBlob) {
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const metadataLink = document.createElement("a");
      metadataLink.href = metadataUrl;
      metadataLink.download = `${renderedExportName(selected)}.metadata.json`;
      metadataLink.click();
      setTimeout(() => URL.revokeObjectURL(metadataUrl), 1000);
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportOpen(false);
  };
  const exportOriginalPackage = () => {
    if (!selected) return;
    const manifest = JSON.stringify({
      format: "LibreLux Original Package",
      version: 1,
      original: {
        name: selected.name,
        type: selected.type,
        size: selected.size,
      },
      adjustments: selected.adjustments,
      metadata: selected.metadata,
      masks: selected.masks,
      retouchSpots: selected.retouchSpots,
    });
    const blob = new Blob([`${manifest.length}\n${manifest}`, selected.blob], {
      type: "application/x-librelux-package",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.name.replace(/\.[^.]+$/, "")}.libreluxpkg`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const photoTransform = selected
    ? `translate(${selected.adjustments.offsetX / 4}px,${selected.adjustments.offsetY / 4}px) rotate(${selected.adjustments.rotation}deg) scale(${selected.adjustments.flipX * (selected.adjustments.perspectiveScale / 100) * (1 + selected.adjustments.distortion / 700) * (1 + selected.adjustments.anamorphic / 200)},${selected.adjustments.flipY * (selected.adjustments.perspectiveScale / 100) * (1 + selected.adjustments.distortion / 700)}) perspective(900px) rotateX(${selected.adjustments.perspectiveV / 15}deg) rotateY(${selected.adjustments.perspectiveH / 15}deg)`
    : "";
  return (
    <main
      className={`app-shell ${highContrast ? "high-contrast" : ""} ${reducedMotion ? "reduced-motion" : ""} ${compactUi ? "compact-ui" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void importFiles(e.dataTransfer.files);
      }}
    >
      <input
        id="librelux-photo-import"
        ref={fileRef}
        type="file"
        accept="image/*,.dng,.raw,.cr2,.cr3,.nef,.arw,.orf,.rw2"
        multiple
        hidden
        onChange={(e) => e.target.files && void importFiles(e.target.files)}
      />
      <input
        ref={presetImportRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => void importUserPresets(event.target.files?.[0])}
      />
      <input
        ref={catalogImportRef}
        type="file"
        accept=".libreluxcat,application/x-librelux-catalog"
        hidden
        onChange={(event) => void restoreCatalog(event.target.files?.[0])}
      />
      <input
        ref={folderRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        {...({
          webkitdirectory: "",
          directory: "",
        } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(e) => e.target.files && void importFiles(e.target.files)}
      />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Aperture size={19} />
          </div>
          <strong>LibreLux</strong>
          <span>by Good Tools</span>
        </div>
        <Tabs
          value={workspace}
          onValueChange={(v) => setWorkspace(v as Workspace)}
        >
          <TabsList className="workspace-tabs" variant="line">
            <TabsTrigger value="library">
              <Library /> Library <kbd>G</kbd>
            </TabsTrigger>
            <TabsTrigger value="develop">
              <SlidersHorizontal /> Develop <kbd>D</kbd>
            </TabsTrigger>
            <TabsTrigger value="enhance">
              <Sparkles /> Optics <kbd>E</kbd>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="top-actions">
          <ToolButton label="Undo" onClick={undo}>
            <Undo2 />
          </ToolButton>
          <ToolButton label="Redo" onClick={redo}>
            <Redo2 />
          </ToolButton>
          <button
            className="text-tool"
            disabled={!selected}
            onClick={() =>
              selected && setCopiedSettings({ ...selected.adjustments })
            }
            title="Copy edit settings (Ctrl/Command + Shift + C)"
          >
            Copy
          </button>
          <button
            className="text-tool"
            disabled={!selected || !copiedSettings}
            onClick={() =>
              selected &&
              copiedSettings &&
              updateSelected((p) => ({
                ...p,
                adjustments: { ...copiedSettings },
              }))
            }
            title="Paste edit settings (Ctrl/Command + Shift + V)"
          >
            Paste
          </button>
          <ToolButton label="Commands" onClick={() => setCommandOpen(true)}>
            <Keyboard />
          </ToolButton>
          <ToolButton
            label="Preferences"
            onClick={() => setPreferencesOpen(true)}
          >
            <Settings2 />
          </ToolButton>
          <button
            className="primary-button"
            onClick={() => setExportOpen(true)}
            disabled={!selected}
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>
      <section
        className={`workspace ${showLeft ? "" : "left-hidden"} ${showRight ? "" : "right-hidden"}`}
      >
        <aside className="left-rail">
          <div className="rail-head">
            <span>{workspace === "library" ? "Catalog" : "Navigator"}</span>
            <button
              onClick={() => setShowLeft(false)}
              aria-label="Hide left panel"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <div className="import-row">
            <button
              className="import-button"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={17} /> Photos
            </button>
            <button
              className="import-button"
              onClick={() => folderRef.current?.click()}
            >
              <FolderOpen size={17} /> Folder
            </button>
          </div>
          <nav className="source-list" aria-label="Photo sources">
            <button
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              <Grid3X3 /> All photos <span>{photos.length}</span>
            </button>
            <button
              className={filter === "flagged" ? "selected" : ""}
              onClick={() => setFilter("flagged")}
            >
              <Flag /> Picks{" "}
              <span>{photos.filter((p) => p.flagged).length}</span>
            </button>
            <button
              className={filter === "rated" ? "selected" : ""}
              onClick={() => setFilter("rated")}
            >
              <Star /> Rated{" "}
              <span>{photos.filter((p) => p.rating).length}</span>
            </button>
            <button
              className={filter === "edited" ? "selected" : ""}
              onClick={() => setFilter("edited")}
            >
              <SlidersHorizontal /> Edited{" "}
              <span>
                {
                  photos.filter(
                    (p) =>
                      JSON.stringify(p.adjustments) !==
                      JSON.stringify(defaults),
                  ).length
                }
              </span>
            </button>
            <button
              className={filter === "duplicates" ? "selected" : ""}
              onClick={() => setFilter("duplicates")}
            >
              <Columns2 /> Duplicates{" "}
              <span>{photos.filter((p) => duplicateIds.has(p.id)).length}</span>
            </button>
            <button
              className={filter === "rejected" ? "selected" : ""}
              onClick={() => setFilter("rejected")}
            >
              <X /> Rejected{" "}
              <span>{photos.filter((p) => p.rejected).length}</span>
            </button>
            <button
              className={filter === "best" ? "selected" : ""}
              onClick={() => setFilter("best")}
            >
              <Sparkles /> Assisted picks{" "}
              <span>
                {
                  photos.filter(
                    (p) => p.cull.focus >= 45 && p.cull.exposure >= 55,
                  ).length
                }
              </span>
            </button>
          </nav>
          <div className="section-title">
            <span>Sort</span>
          </div>
          <div className="sort-grid">
            {(
              [
                ["recent", "Captured"],
                ["edited", "Edited"],
                ["name", "Name"],
                ["rating", "Rating"],
                ["size", "Size"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={sort === value ? "active" : ""}
                onClick={() => setSort(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="section-title">
            <span>Catalog</span>
          </div>
          <nav className="source-list compact">
            <button
              onClick={() => setMinRating(minRating === 5 ? 0 : minRating + 1)}
            >
              <Star /> Minimum rating <span>{minRating || "Any"}</span>
            </button>
            <button onClick={createVirtualCopy} disabled={!selected}>
              <Columns2 /> Create virtual copy
            </button>
            <button onClick={exportCatalog}>
              <Download /> Back up catalog
            </button>
            <button onClick={() => catalogImportRef.current?.click()}>
              <FolderOpen /> Restore catalog
            </button>
            <button onClick={() => void verifyAndOptimizeCatalog()}>
              <Check /> Verify & optimize
            </button>
            <button onClick={autoStackPhotos}>
              <Columns2 /> Auto-stack bursts
            </button>
            <button onClick={() => void chooseWatchDirectory()}>
              <FolderOpen />{" "}
              {watchDirectory ? "Change watched folder" : "Watch folder"}
            </button>
            <button
              onClick={() => void scanWatchDirectory()}
              disabled={!watchDirectory}
            >
              <RefreshCw /> Scan watched folder
            </button>
          </nav>
          {catalogStatus && <p className="catalog-status">{catalogStatus}</p>}
          {watchStatus && <p className="catalog-status">{watchStatus}</p>}
          <div className="section-title">
            <span>Folders</span>
          </div>
          <nav className="source-list compact folder-tree">
            <button
              className={!folderFilter ? "selected" : ""}
              onClick={() => setFolderFilter(null)}
            >
              <FolderOpen /> All folders <span>{photos.length}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                className={folderFilter === folder ? "selected" : ""}
                onClick={() => setFolderFilter(folder)}
                title={folder}
              >
                <FolderOpen /> {folder.split("/").at(-1)}{" "}
                <span>
                  {photos.filter((photo) => photo.folder === folder).length}
                </span>
              </button>
            ))}
          </nav>
          <div className="section-title">
            <span>Albums</span>
          </div>
          <div className="album-create">
            <input
              value={newAlbumName}
              onChange={(event) => setNewAlbumName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") createAlbum();
              }}
              placeholder="New album"
            />
            <button aria-label="Create album" onClick={createAlbum}>
              <Plus />
            </button>
          </div>
          <div className="collection-tools">
            <button onClick={() => createCollection("set")}>Set</button>
            <button onClick={() => createCollection("quick")}>Quick</button>
            <button onClick={() => createCollection("smart", "five-stars")}>
              5★ Smart
            </button>
            <button onClick={() => createCollection("smart", "people")}>
              People
            </button>
          </div>
          <div className="album-list">
            <div>
              <button
                className={!activeAlbumId ? "active" : ""}
                onClick={() => setActiveAlbumId(null)}
              >
                <BookOpen />
                All photos<span>{photos.length}</span>
              </button>
            </div>
            {albums.map((album) => (
              <div key={album.id}>
                <button
                  className={activeAlbumId === album.id ? "active" : ""}
                  onClick={() => setActiveAlbumId(album.id)}
                >
                  <FolderPlus />
                  {album.parentId ? "↳ " : ""}
                  {album.name}
                  {album.target ? " ◆" : ""}
                  <span>
                    {album.kind === "smart"
                      ? photos.filter((photo) => albumIncludes(album, photo))
                          .length
                      : album.photoIds.length}
                  </span>
                </button>
                <button
                  className="album-target"
                  aria-label={`Make ${album.name} the target collection`}
                  onClick={() => setTargetAlbum(album.id)}
                >
                  ◆
                </button>
                <button
                  className="album-delete"
                  aria-label={`Delete ${album.name}`}
                  onClick={() => deleteAlbum(album.id)}
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
          {activeAlbumId &&
            activeAlbum &&
            (activeAlbum.kind === "album" || activeAlbum.kind === "quick") && (
              <button
                className="album-membership"
                disabled={!selectedId}
                onClick={() => toggleAlbumMembership(activeAlbumId)}
              >
                {selectedIds.length > 1
                  ? `Add or remove ${selectedIds.length} selected`
                  : albums
                        .find((album) => album.id === activeAlbumId)
                        ?.photoIds.includes(selectedId ?? "")
                    ? "Remove selected photo"
                    : "Add selected photo"}
              </button>
            )}
          <div className="section-title">
            <span>Color filter</span>
          </div>
          <div className="labels catalog-labels">
            {(Object.keys(labelColors) as Label[]).map((label) => (
              <button
                key={label}
                aria-label={`${label} filter`}
                className={labelFilter === label ? "active" : ""}
                onClick={() => setLabelFilter(label)}
                style={{
                  background: label === "none" ? "#252b27" : labelColors[label],
                }}
              >
                {labelFilter === label && <Check />}
              </button>
            ))}
          </div>
          {workspace !== "library" && (
            <>
              <div className="section-title">
                <span>Presets</span>
              </div>
              <div className="preset-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    className={
                      selectedPreset?.id === `develop-${preset.name}`
                        ? "preset-selected"
                        : ""
                    }
                    onClick={() =>
                      choosePreset(
                        `develop-${preset.name}`,
                        preset.name,
                        preset.settings,
                      )
                    }
                    style={{ "--tone": preset.tone } as React.CSSProperties}
                  >
                    <i />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>
        <section className="main-stage">
          <div className="stage-toolbar">
            {!showLeft && (
              <ToolButton
                label="Show left panel"
                onClick={() => setShowLeft(true)}
              >
                <Menu />
              </ToolButton>
            )}
            <div className="view-tools">
              {selected && (
                <button
                  className="process-version"
                  title="Switch processing version"
                  onClick={() =>
                    updateSelected((photo) => ({
                      ...photo,
                      processVersion:
                        photo.processVersion === "2026" ? "2025" : "2026",
                    }))
                  }
                >
                  Process {selected.processVersion}
                </button>
              )}
              <ToolButton
                label={`Compare: ${compareMode}`}
                active={compareMode !== "edited"}
                onClick={() =>
                  setCompareMode((mode) =>
                    mode === "edited"
                      ? "original"
                      : mode === "original"
                        ? "split"
                        : mode === "split"
                          ? "side"
                          : mode === "side"
                            ? "reference"
                            : "edited",
                  )
                }
              >
                <Columns2 />
              </ToolButton>
              <ToolButton
                label="Rotate left"
                onClick={() =>
                  selected &&
                  setAdjustment("rotation", selected.adjustments.rotation - 90)
                }
              >
                <RotateCcw />
              </ToolButton>
              <ToolButton
                label="Rotate right"
                onClick={() =>
                  selected &&
                  setAdjustment("rotation", selected.adjustments.rotation + 90)
                }
              >
                <RotateCw />
              </ToolButton>
              <ToolButton
                label="Crop"
                active={cropMode}
                onClick={() => setCropMode((v) => !v)}
              >
                <Crop />
              </ToolButton>
            </div>
            {!showRight && (
              <ToolButton
                label="Show right panel"
                onClick={() => setShowRight(true)}
              >
                <PanelRightClose />
              </ToolButton>
            )}
          </div>
          {selectedPreset && (
            <div className="preset-commit floating">
              <div>
                <strong>{selectedPreset.name}</strong>
                <span>Ready to apply</span>
              </div>
              <label className="preset-amount">
                <span>Amount</span>
                <input
                  aria-label="Preset amount"
                  type="range"
                  min="0"
                  max="100"
                  value={presetAmount}
                  onChange={(event) =>
                    setPresetAmount(Number(event.target.value))
                  }
                />
                <b>{presetAmount}%</b>
              </label>
              <button onClick={() => setSelectedPreset(null)}>Cancel</button>
              <button className="apply" onClick={commitPreset}>
                Apply
              </button>
            </div>
          )}
          {workspace === "library" ? (
            <LibraryWorkspace
              photos={filtered}
              filter={filter}
              query={query}
              setQuery={setQuery}
              view={libraryView}
              setView={setLibraryView}
              selectedId={selectedId}
              selectedIds={selectedIds}
              toggleSelection={toggleSelection}
              setWorkspace={setWorkspace}
              updateMany={updateMany}
              gridSize={gridSize}
            />
          ) : selected ? (
            <EditorCanvas
              key={selected.id}
              photo={selected}
              referencePhoto={referencePhoto}
              workspace={workspace}
              zoom={zoom}
              showBefore={showBefore}
              compareMode={compareMode}
              photoTransform={photoTransform}
              cropMode={cropMode}
              cropOverlay={cropOverlay}
              setCropOverlay={setCropOverlay}
              setCropMode={setCropMode}
              setAdjustment={setAdjustment}
              opticsMode={opticsMode}
              maskTarget={maskTarget}
              maskTolerance={maskTolerance}
              maskFeather={maskFeather}
              maskBrushSize={maskBrushSize}
              maskBrushFlow={maskBrushFlow}
              maskBrushDensity={maskBrushDensity}
              maskAuto={maskAuto}
              onMaskCreated={addMask}
              selectedMaskId={selectedMaskId}
              setSelectedMaskId={setSelectedMaskId}
              sampleMode={sampleMode}
              onSampledWhiteBalance={applySampledWhiteBalance}
              onSampledPointColor={applySampledPointColor}
              retouchMode={retouchMode}
              retouchSize={retouchSize}
              retouchFeather={retouchFeather}
              onRetouchSpot={addRetouchSpot}
              softProof={softProof}
              proofProfile={proofProfile}
              gamutWarnings={gamutWarnings}
              allowFullResolution={
                deviceMemory > 4 || selected.size < 40_000_000
              }
            />
          ) : (
            <EmptyLibrary onImport={() => fileRef.current?.click()} />
          )}
          {workspace !== "library" && showFilmstrip && (
            <div className="filmstrip">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  className={photo.id === selectedId ? "selected" : ""}
                  onClick={() => setSelectedId(photo.id)}
                >
                  <img src={photo.previewUrl} alt={photo.name} />
                  <i style={{ background: labelColors[photo.label] }} />
                </button>
              ))}
            </div>
          )}
          <footer className="statusbar">
            <span>
              {selected
                ? `${selected.name} · ${formatBytes(selected.size)} · ${deviceMemory <= 4 && selected.size >= 40_000_000 ? "Smart preview protects memory" : "Full preview"}`
                : "No photo selected"}
            </span>
            <div>
              <ZoomOut />
              <Slider
                value={[zoom]}
                min={24}
                max={100}
                onValueChange={(v) => setZoom(v[0])}
                aria-label="Preview zoom"
              />
              <ZoomIn />
              <span>{zoom}%</span>
            </div>
          </footer>
        </section>
        <aside className="right-rail">
          <div className="rail-head">
            <span>
              {workspace === "library"
                ? "Photo"
                : workspace === "develop"
                  ? "Edit"
                  : "Optics Studio"}
            </span>
            <button
              onClick={() => setShowRight(false)}
              aria-label="Hide right panel"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
          {selected ? (
            <div className="panel-scroll">
              {workspace === "enhance" && (
                <div
                  className="optics-modes"
                  role="tablist"
                  aria-label="Optics tools"
                >
                  {(
                    [
                      ["pure", "Pure"],
                      ["creative", "Creative"],
                      ["film", "Film"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      role="tab"
                      aria-selected={opticsMode === value}
                      className={opticsMode === value ? "active" : ""}
                      key={value}
                      onClick={() => setOpticsMode(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <Histogram
                photo={selected}
                showClipping={showClipping}
                onToggleClipping={() => setShowClipping((value) => !value)}
                onToneChange={(key, delta) =>
                  setAdjustment(
                    key,
                    Math.max(
                      -100,
                      Math.min(100, selected.adjustments[key] + delta),
                    ),
                  )
                }
              />
              {workspace === "library" ? (
                <LibraryInspector
                  photo={selected}
                  update={updateSelected}
                  remove={removeSelected}
                />
              ) : workspace === "develop" ? (
                <DevelopPanels
                  photo={selected}
                  setAdjustment={setAdjustment}
                  setHslAdjustment={setHslAdjustment}
                  setBwAdjustment={setBwAdjustment}
                  setCurveAdjustment={setCurveAdjustment}
                  maskTarget={maskTarget}
                  setMaskTarget={setMaskTarget}
                  maskTolerance={maskTolerance}
                  setMaskTolerance={setMaskTolerance}
                  maskFeather={maskFeather}
                  setMaskFeather={setMaskFeather}
                  maskBrushSize={maskBrushSize}
                  setMaskBrushSize={setMaskBrushSize}
                  maskBrushFlow={maskBrushFlow}
                  setMaskBrushFlow={setMaskBrushFlow}
                  maskBrushDensity={maskBrushDensity}
                  setMaskBrushDensity={setMaskBrushDensity}
                  maskAuto={maskAuto}
                  setMaskAuto={setMaskAuto}
                  selectedMaskId={selectedMaskId}
                  setSelectedMaskId={setSelectedMaskId}
                  updateMask={updateMask}
                  duplicateMask={duplicateMask}
                  deleteMask={deleteMask}
                  autoTone={autoTone}
                  sampleMode={sampleMode}
                  setSampleMode={setSampleMode}
                  pointColor={pointColor}
                  setPointColor={setPointColor}
                  retouchMode={retouchMode}
                  setRetouchMode={setRetouchMode}
                  retouchSize={retouchSize}
                  setRetouchSize={setRetouchSize}
                  retouchFeather={retouchFeather}
                  setRetouchFeather={setRetouchFeather}
                  updateRetouchSpot={updateRetouchSpot}
                  deleteRetouchSpot={deleteRetouchSpot}
                  clearRetouchSpots={clearRetouchSpots}
                  userPresets={userPresets}
                  createUserPreset={createUserPreset}
                  updateUserPreset={updateUserPreset}
                  deleteUserPreset={deleteUserPreset}
                  exportUserPresets={exportUserPresets}
                  importUserPresets={() => presetImportRef.current?.click()}
                  chooseUserPreset={(preset) =>
                    choosePreset(
                      `user-${preset.id}`,
                      preset.name,
                      preset.settings,
                    )
                  }
                  applyPresetToSelection={applyPresetToSelection}
                  applyAdaptivePreset={applyAdaptivePreset}
                  softProof={softProof}
                  setSoftProof={setSoftProof}
                  proofProfile={proofProfile}
                  setProofProfile={setProofProfile}
                  gamutWarnings={gamutWarnings}
                  setGamutWarnings={setGamutWarnings}
                />
              ) : opticsMode === "pure" ? (
                <PurePanels
                  photo={selected}
                  setAdjustment={setAdjustment}
                  selectedPreset={selectedPreset}
                  choosePreset={choosePreset}
                  autoEnhance={autoEnhance}
                />
              ) : opticsMode === "creative" ? (
                <CreativePanels
                  photo={selected}
                  setAdjustment={setAdjustment}
                  applyPreset={applyPreset}
                  selectedPreset={selectedPreset}
                  choosePreset={choosePreset}
                />
              ) : (
                <FilmPanels
                  photo={selected}
                  setAdjustment={setAdjustment}
                  applyPreset={applyPreset}
                  selectedPreset={selectedPreset}
                  choosePreset={choosePreset}
                />
              )}
            </div>
          ) : (
            <div className="no-selection">
              <Info />
              <p>Select or import a photo to begin.</p>
            </div>
          )}
        </aside>
      </section>
      <ExportDialog
        open={exportOpen}
        setOpen={setExportOpen}
        photo={selected}
        format={exportFormat}
        setFormat={setExportFormat}
        quality={exportQuality}
        setQuality={setExportQuality}
        scale={exportScale}
        setScale={setExportScale}
        longEdge={exportLongEdge}
        setLongEdge={setExportLongEdge}
        shortEdge={exportShortEdge}
        setShortEdge={setExportShortEdge}
        width={exportWidth}
        setWidth={setExportWidth}
        height={exportHeight}
        setHeight={setExportHeight}
        megapixels={exportMegapixels}
        setMegapixels={setExportMegapixels}
        sizing={exportSizing}
        setSizing={setExportSizing}
        resolution={exportResolution}
        setResolution={setExportResolution}
        outputSharpen={outputSharpen}
        setOutputSharpen={setOutputSharpen}
        suffix={exportSuffix}
        setSuffix={setExportSuffix}
        nameTemplate={exportNameTemplate}
        setNameTemplate={setExportNameTemplate}
        watermark={watermark}
        setWatermark={setWatermark}
        watermarkImage={watermarkImage}
        setWatermarkImage={setWatermarkImage}
        watermarkOpacity={watermarkOpacity}
        setWatermarkOpacity={setWatermarkOpacity}
        watermarkPosition={watermarkPosition}
        setWatermarkPosition={setWatermarkPosition}
        includeMetadata={includeMetadata}
        setIncludeMetadata={setIncludeMetadata}
        includeCopyright={includeCopyright}
        setIncludeCopyright={setIncludeCopyright}
        colorSpace={proofProfile}
        setColorSpace={setProofProfile}
        directory={exportDirectory}
        directoryPermission={directoryPermission}
        chooseDirectory={chooseExportDirectory}
        clearDirectory={clearExportDirectory}
        recipes={exportRecipes}
        selectedRecipe={selectedExportRecipe}
        applyRecipe={applyExportRecipe}
        saveRecipe={saveCurrentExportRecipe}
        deleteRecipe={deleteExportRecipe}
        onExport={doExport}
        onExportPackage={exportOriginalPackage}
      />
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="command-dialog">
          <DialogHeader>
            <DialogTitle>Commands</DialogTitle>
            <DialogDescription>
              Jump anywhere without leaving the keyboard.
            </DialogDescription>
          </DialogHeader>
          <div className="command-list">
            {[
              {
                name: "Open Library",
                keys: "G",
                run: () => setWorkspace("library"),
              },
              {
                name: "Open Develop",
                keys: "D",
                run: () => setWorkspace("develop"),
              },
              {
                name: "Open Optics · Pure",
                keys: "Shift 1",
                run: () => {
                  setWorkspace("enhance");
                  setOpticsMode("pure");
                },
              },
              {
                name: "Open Optics · Creative",
                keys: "Shift 2",
                run: () => {
                  setWorkspace("enhance");
                  setOpticsMode("creative");
                },
              },
              {
                name: "Open Optics · Film",
                keys: "Shift 3",
                run: () => {
                  setWorkspace("enhance");
                  setOpticsMode("film");
                },
              },
              {
                name: "Import photos",
                keys: "",
                run: openPhotoPicker,
              },
              {
                name: "Export photo",
                keys: "",
                run: () => setExportOpen(true),
              },
              {
                name: "Cycle before and after",
                keys: "\\",
                run: () =>
                  setCompareMode((mode) =>
                    mode === "edited"
                      ? "original"
                      : mode === "original"
                        ? "split"
                        : mode === "split"
                          ? "side"
                          : mode === "side"
                            ? "reference"
                            : "edited",
                  ),
              },
              {
                name: "Toggle left panel",
                keys: "",
                run: () => setShowLeft((value) => !value),
              },
              {
                name: "Toggle right panel",
                keys: "",
                run: () => setShowRight((value) => !value),
              },
              {
                name: "Keyboard shortcuts",
                keys: "?",
                run: () => setShortcutsOpen(true),
              },
              {
                name: "Preferences",
                keys: "",
                run: () => setPreferencesOpen(true),
              },
            ].map((command) => (
              <button
                key={command.name}
                onClick={() => {
                  command.run();
                  setCommandOpen(false);
                }}
              >
                <span>{command.name}</span>
                {command.keys && <kbd>{command.keys}</kbd>}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="preferences-dialog">
          <DialogHeader>
            <DialogTitle>Workspace preferences</DialogTitle>
            <DialogDescription>
              These choices stay on this computer.
            </DialogDescription>
          </DialogHeader>
          <div className="preference-list">
            <button
              aria-pressed={highContrast}
              onClick={() =>
                updateUiPreferences({ highContrast: !highContrast })
              }
            >
              <span>
                <strong>High contrast</strong>
                <small>Brighter borders and controls</small>
              </span>
              <i />
            </button>
            <button
              aria-pressed={reducedMotion}
              onClick={() =>
                updateUiPreferences({ reducedMotion: !reducedMotion })
              }
            >
              <span>
                <strong>Reduce motion</strong>
                <small>Stops interface animation</small>
              </span>
              <i />
            </button>
            <button
              aria-pressed={compactUi}
              onClick={() => updateUiPreferences({ compactUi: !compactUi })}
            >
              <span>
                <strong>Compact panels</strong>
                <small>Shows more controls at once</small>
              </span>
              <i />
            </button>
            <button
              aria-pressed={showFilmstrip}
              onClick={() =>
                updateUiPreferences({ showFilmstrip: !showFilmstrip })
              }
            >
              <span>
                <strong>Show filmstrip</strong>
                <small>Keep thumbnails under the editor</small>
              </span>
              <i />
            </button>
            <label>
              <span>
                <strong>Library thumbnail size</strong>
                <small>{gridSize}px minimum width</small>
              </span>
              <input
                aria-label="Library thumbnail size"
                type="range"
                min="110"
                max="260"
                step="5"
                value={gridSize}
                onChange={(event) =>
                  updateUiPreferences({ gridSize: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <DialogFooter>
            <button
              className="primary-button"
              onClick={() => setPreferencesOpen(false)}
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this photo?</DialogTitle>
            <DialogDescription>
              LibreLux can remove its local catalog copy. The original file
              outside LibreLux will never be deleted without direct file
              permission.
            </DialogDescription>
          </DialogHeader>
          <div className="delete-choices">
            <button onClick={confirmRemoveSelected}>
              Remove from LibreLux only
            </button>
            <button disabled>
              Delete source file — unavailable for copied originals
            </button>
          </div>
          <DialogFooter>
            <button
              className="secondary-button"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="shortcuts-dialog">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
            <DialogDescription>
              Familiar controls for a faster photo workflow. Click a letter to
              customize it; changes stay on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="shortcut-editor">
            {(
              [
                ["library", "Library"],
                ["develop", "Develop"],
                ["optics", "Optics"],
                ["pick", "Pick"],
                ["reject", "Reject"],
                ["unflag", "Unflag"],
              ] as const
            ).map(([id, label]) => (
              <label key={id}>
                <span>{label}</span>
                <input
                  aria-label={`${label} shortcut`}
                  maxLength={1}
                  value={shortcutMap[id].toUpperCase()}
                  onChange={(event) => {
                    const value = event.target.value.toLowerCase().slice(-1);
                    if (!/^[a-z]$/.test(value)) return;
                    const next = { ...shortcutMap, [id]: value };
                    setShortcutMap(next);
                    void saveSetting("shortcut-map", next);
                  }}
                />
              </label>
            ))}
          </div>
          <div className="shortcut-grid">
            {[
              ["Library", shortcutMap.library.toUpperCase()],
              ["Develop", shortcutMap.develop.toUpperCase()],
              ["Optics", shortcutMap.optics.toUpperCase()],
              ["Pure", "Shift 1"],
              ["Creative", "Shift 2"],
              ["Film", "Shift 3"],
              ["Undo", "⌘/Ctrl Z"],
              ["Redo", "⌘/Ctrl Shift Z"],
              ["Copy edits", "⌘/Ctrl Shift C"],
              ["Paste edits", "⌘/Ctrl Shift V"],
              ["Before / after", "\\"],
              ["Pick", shortcutMap.pick.toUpperCase()],
              ["Reject", shortcutMap.reject.toUpperCase()],
              ["Unflag", shortcutMap.unflag.toUpperCase()],
              ["Rating", "0–5"],
              ["Commands", "⌘/Ctrl K"],
              ["Shortcut help", "?"],
            ].map(([label, key]) => (
              <div key={label}>
                <span>{label}</span>
                <kbd>{key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ExportDialog({
  open,
  setOpen,
  photo,
  format,
  setFormat,
  quality,
  setQuality,
  scale,
  setScale,
  longEdge,
  setLongEdge,
  shortEdge,
  setShortEdge,
  width,
  setWidth,
  height,
  setHeight,
  megapixels,
  setMegapixels,
  sizing,
  setSizing,
  resolution,
  setResolution,
  outputSharpen,
  setOutputSharpen,
  suffix,
  setSuffix,
  nameTemplate,
  setNameTemplate,
  watermark,
  setWatermark,
  watermarkImage,
  setWatermarkImage,
  watermarkOpacity,
  setWatermarkOpacity,
  watermarkPosition,
  setWatermarkPosition,
  includeMetadata,
  setIncludeMetadata,
  includeCopyright,
  setIncludeCopyright,
  colorSpace,
  setColorSpace,
  directory,
  directoryPermission,
  chooseDirectory,
  clearDirectory,
  recipes,
  selectedRecipe,
  applyRecipe,
  saveRecipe,
  deleteRecipe,
  onExport,
  onExportPackage,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  photo: RuntimePhoto | undefined;
  format: "jpeg" | "png" | "webp";
  setFormat: (format: "jpeg" | "png" | "webp") => void;
  quality: number;
  setQuality: (quality: number) => void;
  scale: number;
  setScale: (scale: number) => void;
  longEdge: number;
  setLongEdge: (value: number) => void;
  shortEdge: number;
  setShortEdge: (value: number) => void;
  width: number;
  setWidth: (value: number) => void;
  height: number;
  setHeight: (value: number) => void;
  megapixels: number;
  setMegapixels: (value: number) => void;
  sizing: "percentage" | "dimensions" | "long" | "short" | "megapixels";
  setSizing: (
    value: "percentage" | "dimensions" | "long" | "short" | "megapixels",
  ) => void;
  resolution: number;
  setResolution: (value: number) => void;
  outputSharpen: "none" | "screen" | "matte" | "glossy";
  setOutputSharpen: (value: "none" | "screen" | "matte" | "glossy") => void;
  suffix: string;
  setSuffix: (value: string) => void;
  nameTemplate: string;
  setNameTemplate: (value: string) => void;
  watermark: string;
  setWatermark: (value: string) => void;
  watermarkImage: string;
  setWatermarkImage: (value: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (value: number) => void;
  watermarkPosition:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  setWatermarkPosition: (
    value: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center",
  ) => void;
  includeMetadata: boolean;
  setIncludeMetadata: (value: boolean) => void;
  includeCopyright: boolean;
  setIncludeCopyright: (value: boolean) => void;
  colorSpace: ColorSpace;
  setColorSpace: (value: ColorSpace) => void;
  directory: StoredDirectoryHandle | null;
  directoryPermission: DirectoryPermissionState;
  chooseDirectory: () => void;
  clearDirectory: () => void;
  recipes: ExportRecipe[];
  selectedRecipe: string | null;
  applyRecipe: (recipe: ExportRecipe) => void;
  saveRecipe: () => void;
  deleteRecipe: (id: string) => void;
  onExport: () => void;
  onExportPackage: () => void;
}) {
  const extension = format === "jpeg" ? "jpg" : format;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="export-dialog">
        <DialogHeader>
          <DialogTitle>Export photo</DialogTitle>
          <DialogDescription>
            Create a finished copy. Your original stays untouched.
          </DialogDescription>
        </DialogHeader>
        <div className="export-preview">
          {photo && (
            <img
              src={photo.previewUrl}
              alt=""
              style={{
                filter: cssFilter(photo.adjustments, photo.processVersion),
              }}
            />
          )}
          <div>
            <strong>
              {photo?.name.replace(/\.[^.]+$/, "")}
              {suffix}.{extension}
            </strong>
            <span>
              {format.toUpperCase()} ·{" "}
              {longEdge ? `${longEdge}px long edge` : `${scale}% dimensions`} ·{" "}
              {resolution} ppi
            </span>
          </div>
        </div>
        <Panel title="Export recipes">
          <div className="export-recipes">
            {recipes.map((recipe) => (
              <div key={recipe.id}>
                <button
                  className={selectedRecipe === recipe.id ? "active" : ""}
                  onClick={() => applyRecipe(recipe)}
                >
                  <strong>{recipe.name}</strong>
                  <span>
                    {recipe.format.toUpperCase()} ·{" "}
                    {recipe.longEdge
                      ? `${recipe.longEdge}px`
                      : `${recipe.scale}%`}
                  </span>
                </button>
                {!builtInExportRecipes.some(
                  (item) => item.id === recipe.id,
                ) && (
                  <button
                    aria-label={`Delete ${recipe.name}`}
                    onClick={() => deleteRecipe(recipe.id)}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="save-recipe" onClick={saveRecipe}>
            <Plus /> Save current settings
          </button>
        </Panel>
        <Panel title="File settings">
          <div className="choice-row">
            <span>Format</span>
            {(["jpeg", "png", "webp"] as const).map((value) => (
              <button
                key={value}
                className={format === value ? "active" : ""}
                onClick={() => setFormat(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="choice-row wrap">
            <span>Color</span>
            {(["srgb", "display-p3", "adobe-rgb", "prophoto-rgb"] as const).map(
              (profile) => (
                <button
                  key={profile}
                  className={colorSpace === profile ? "active" : ""}
                  onClick={() => setColorSpace(profile)}
                >
                  {profile === "srgb"
                    ? "sRGB"
                    : profile === "display-p3"
                      ? "P3"
                      : profile === "adobe-rgb"
                        ? "Adobe RGB"
                        : "ProPhoto"}
                </button>
              ),
            )}
          </div>
          {format !== "png" && (
            <AdjustSlider
              label="Quality"
              value={quality}
              min={10}
              max={100}
              resetValue={92}
              onChange={setQuality}
            />
          )}
          <label className="export-field">
            <span>Filename suffix</span>
            <input
              value={suffix}
              onChange={(event) => setSuffix(event.target.value)}
              placeholder="-LibreLux"
            />
          </label>
          <label className="export-field">
            <span>Naming template</span>
            <input
              value={nameTemplate}
              onChange={(event) => setNameTemplate(event.target.value)}
              placeholder="{name}{suffix}"
            />
          </label>
          <div className="naming-tokens">
            {["{name}", "{date}", "{rating}", "{suffix}"].map((token) => (
              <button
                key={token}
                onClick={() => setNameTemplate(`${nameTemplate}${token}`)}
              >
                {token}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Image sizing">
          <div className="sizing-modes">
            {(
              [
                "percentage",
                "dimensions",
                "long",
                "short",
                "megapixels",
              ] as const
            ).map((mode) => (
              <button
                key={mode}
                className={sizing === mode ? "active" : ""}
                onClick={() => setSizing(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          {sizing === "percentage" && (
            <div className="choice-row">
              <span>Scale</span>
              {[25, 50, 75, 100].map((value) => (
                <button
                  key={value}
                  className={scale === value ? "active" : ""}
                  onClick={() => {
                    setScale(value);
                  }}
                >
                  {value}%
                </button>
              ))}
            </div>
          )}
          {sizing === "dimensions" && (
            <div className="dimension-row">
              <label className="export-field">
                <span>Width</span>
                <input
                  type="number"
                  min="0"
                  max="30000"
                  value={width || ""}
                  onChange={(event) =>
                    setWidth(Math.max(0, Number(event.target.value)))
                  }
                  placeholder="Auto"
                />
                <em>px</em>
              </label>
              <label className="export-field">
                <span>Height</span>
                <input
                  type="number"
                  min="0"
                  max="30000"
                  value={height || ""}
                  onChange={(event) =>
                    setHeight(Math.max(0, Number(event.target.value)))
                  }
                  placeholder="Auto"
                />
                <em>px</em>
              </label>
            </div>
          )}
          {sizing === "long" && (
            <label className="export-field">
              <span>Long edge</span>
              <input
                type="number"
                min="0"
                max="30000"
                value={longEdge || ""}
                onChange={(event) =>
                  setLongEdge(Math.max(0, Number(event.target.value)))
                }
                placeholder="Original"
              />
              <em>px</em>
            </label>
          )}
          {sizing === "short" && (
            <label className="export-field">
              <span>Short edge</span>
              <input
                type="number"
                min="0"
                max="30000"
                value={shortEdge || ""}
                onChange={(event) =>
                  setShortEdge(Math.max(0, Number(event.target.value)))
                }
                placeholder="Original"
              />
              <em>px</em>
            </label>
          )}
          {sizing === "megapixels" && (
            <label className="export-field">
              <span>Megapixels</span>
              <input
                type="number"
                min="0"
                max="500"
                step=".1"
                value={megapixels || ""}
                onChange={(event) =>
                  setMegapixels(Math.max(0, Number(event.target.value)))
                }
                placeholder="Original"
              />
              <em>MP</em>
            </label>
          )}
          <label className="export-field">
            <span>Resolution</span>
            <input
              type="number"
              min="1"
              max="2400"
              value={resolution}
              onChange={(event) =>
                setResolution(Math.max(1, Number(event.target.value)))
              }
            />
            <em>ppi</em>
          </label>
        </Panel>
        <Panel title="Save location">
          <div className="save-location">
            <FolderOpen />
            <div>
              <strong>{directory?.name ?? "Browser downloads"}</strong>
              <span>
                {directoryPermission === "ready"
                  ? "Connected and remembered"
                  : directoryPermission === "needs-permission"
                    ? "Permission will be requested on export"
                    : directoryPermission === "unsupported"
                      ? "Folder selection is not supported here; downloads still work"
                      : "Choose any local or external-drive folder"}
              </span>
            </div>
          </div>
          <div className="location-actions">
            <button onClick={chooseDirectory}>
              {directory ? "Change location" : "Choose location"}
            </button>
            {directory && (
              <button onClick={clearDirectory}>Use Downloads</button>
            )}
          </div>
        </Panel>
        <Panel title="Output finishing">
          <div className="choice-row wrap">
            <span>Sharpen for</span>
            {(["none", "screen", "matte", "glossy"] as const).map((value) => (
              <button
                key={value}
                className={outputSharpen === value ? "active" : ""}
                onClick={() => setOutputSharpen(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label className="export-field">
            <span>Watermark</span>
            <input
              value={watermark}
              onChange={(event) => setWatermark(event.target.value)}
              placeholder="Optional text"
            />
          </label>
          <label className="export-field">
            <span>Image mark</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setWatermarkImage(URL.createObjectURL(file));
              }}
            />
          </label>
          {watermarkImage && (
            <button
              className="clear-watermark"
              onClick={() => {
                URL.revokeObjectURL(watermarkImage);
                setWatermarkImage("");
              }}
            >
              Remove image mark
            </button>
          )}
          <AdjustSlider
            label="Watermark opacity"
            value={watermarkOpacity}
            min={5}
            max={100}
            resetValue={82}
            onChange={setWatermarkOpacity}
          />
          <div className="choice-row wrap">
            <span>Position</span>
            {(
              [
                "top-left",
                "top-right",
                "center",
                "bottom-left",
                "bottom-right",
              ] as const
            ).map((position) => (
              <button
                key={position}
                className={watermarkPosition === position ? "active" : ""}
                onClick={() => setWatermarkPosition(position)}
              >
                {position}
              </button>
            ))}
          </div>
          <div className="export-toggles">
            <button
              className={includeMetadata ? "active" : ""}
              onClick={() => setIncludeMetadata(!includeMetadata)}
            >
              Metadata {includeMetadata ? "included" : "removed"}
            </button>
            <button
              disabled={!includeMetadata}
              className={includeCopyright ? "active" : ""}
              onClick={() => setIncludeCopyright(!includeCopyright)}
            >
              Copyright {includeCopyright ? "included" : "removed"}
            </button>
          </div>
          <p className="panel-note">
            Descriptive metadata remains in the local catalog; browser exports
            avoid private location data by default.
          </p>
        </Panel>
        <DialogFooter>
          <button className="secondary-button" onClick={onExportPackage}>
            Original + settings
          </button>
          <button className="secondary-button" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="primary-button" onClick={onExport}>
            <ArrowDownToLine size={16} /> Export {format.toUpperCase()}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LibraryWorkspace({
  photos,
  filter,
  query,
  setQuery,
  view,
  setView,
  selectedId,
  selectedIds,
  toggleSelection,
  setWorkspace,
  updateMany,
  gridSize,
}: {
  photos: RuntimePhoto[];
  filter:
    | "all"
    | "flagged"
    | "rated"
    | "edited"
    | "rejected"
    | "duplicates"
    | "best";
  query: string;
  setQuery: (value: string) => void;
  view: "grid" | "loupe" | "compare" | "survey" | "people" | "map";
  setView: (
    view: "grid" | "loupe" | "compare" | "survey" | "people" | "map",
  ) => void;
  selectedId: string | null;
  selectedIds: string[];
  toggleSelection: (id: string, additive?: boolean) => void;
  setWorkspace: (workspace: Workspace) => void;
  updateMany: (updater: (photo: RuntimePhoto) => RuntimePhoto) => void;
  gridSize: number;
}) {
  const candidates = selectedIds.length
    ? photos.filter((photo) => selectedIds.includes(photo.id))
    : photos;
  const visible =
    view === "loupe"
      ? photos.filter((photo) => photo.id === selectedId).slice(0, 1)
      : view === "people"
        ? photos.filter((photo) => photo.cull.faces > 0)
        : view === "map"
          ? photos.filter(
              (photo) =>
                photo.metadata.latitude !== null &&
                photo.metadata.longitude !== null,
            )
          : view === "compare"
            ? candidates.slice(0, 2)
            : view === "survey"
              ? candidates.slice(0, 6)
              : photos;
  const headings = {
    all: "All photos",
    flagged: "Picks",
    rated: "Rated",
    edited: "Edited",
    rejected: "Rejected",
    duplicates: "Duplicates",
    best: "Assisted picks",
  };
  return (
    <div className="library-view">
      <div className="library-heading">
        <div>
          <p>{headings[filter]}</p>
          <span>
            {photos.length} photos · {selectedIds.length} selected · stored on
            this device
          </span>
        </div>
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename or title"
          />
        </label>
      </div>
      <div className="library-tools">
        <div role="tablist" aria-label="Library view">
          {(
            [
              ["grid", "Grid"],
              ["loupe", "Loupe"],
              ["compare", "Compare"],
              ["survey", "Survey"],
              ["people", "People"],
              ["map", "Map"],
            ] as const
          ).map(([value, label]) => (
            <button
              role="tab"
              aria-selected={view === value}
              className={view === value ? "active" : ""}
              key={value}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span>⌘/Ctrl-click adds to selection</span>
      </div>
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <strong>{selectedIds.length} selected</strong>
          <button
            disabled={!selectedId}
            onClick={() => {
              const source = photos.find((photo) => photo.id === selectedId);
              if (source)
                updateMany((photo) => ({
                  ...photo,
                  adjustments: {
                    ...source.adjustments,
                    hsl: { ...source.adjustments.hsl },
                    bwMix: { ...source.adjustments.bwMix },
                    curves: { ...source.adjustments.curves },
                  },
                }));
            }}
          >
            Sync edits
          </button>
          <button
            onClick={() =>
              updateMany((photo) => ({
                ...photo,
                adjustments: {
                  ...defaults,
                  hsl: { ...defaultHsl },
                  bwMix: { ...defaultBw },
                  curves: { ...defaultCurves },
                },
              }))
            }
          >
            Reset edits
          </button>
          <button
            onClick={() => updateMany((photo) => ({ ...photo, rating: 5 }))}
          >
            5 stars
          </button>
          <button
            onClick={() =>
              updateMany((photo) => ({
                ...photo,
                flagged: true,
                rejected: false,
              }))
            }
          >
            Pick
          </button>
          <button
            onClick={() =>
              updateMany((photo) => ({
                ...photo,
                rejected: true,
                flagged: false,
              }))
            }
          >
            Reject
          </button>
          {(["red", "yellow", "green", "blue", "purple"] as Label[]).map(
            (label) => (
              <button
                className="bulk-label"
                aria-label={`${label} label`}
                key={label}
                style={{ background: labelColors[label] }}
                onClick={() => updateMany((photo) => ({ ...photo, label }))}
              />
            ),
          )}
        </div>
      )}
      {visible.length ? (
        <div
          className={`photo-grid view-${view}`}
          style={
            view === "grid"
              ? {
                  gridTemplateColumns: `repeat(auto-fill,minmax(${gridSize}px,1fr))`,
                }
              : undefined
          }
        >
          {visible.map((photo) => (
            <button
              key={photo.id}
              className={`${photo.id === selectedId ? "selected" : ""} ${selectedIds.includes(photo.id) ? "multi-selected" : ""} ${photo.rejected ? "rejected" : ""}`}
              onClick={(event) =>
                toggleSelection(
                  photo.id,
                  event.metaKey || event.ctrlKey || event.shiftKey,
                )
              }
              onDoubleClick={() => {
                toggleSelection(photo.id);
                setWorkspace("develop");
              }}
            >
              <div className="thumb">
                <img
                  src={photo.previewUrl}
                  alt=""
                  style={{
                    filter: cssFilter(photo.adjustments, photo.processVersion),
                  }}
                />
                {photo.flagged && <Flag className="pick" />}
                {photo.rejected && <X className="reject" />}
                {photo.virtualOf && <Columns2 className="virtual" />}
                {photo.stackId && <b className="stack-badge">Stack</b>}
                <i style={{ background: labelColors[photo.label] }} />
              </div>
              <strong>{photo.metadata.title || photo.name}</strong>
              <span>
                {view === "people"
                  ? `${photo.cull.faces} face${photo.cull.faces === 1 ? "" : "s"} · `
                  : view === "map"
                    ? `${photo.metadata.latitude?.toFixed(4)}, ${photo.metadata.longitude?.toFixed(4)} · `
                    : ""}
                {photo.folder} · {formatBytes(photo.size)}
              </span>
              {filter === "best" && (
                <small className="cull-score">
                  Focus {Math.round(photo.cull.focus)} · Exposure{" "}
                  {Math.round(photo.cull.exposure)} · Faces {photo.cull.faces}
                </small>
              )}
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={n <= photo.rating ? "on" : ""} />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyLibrary onImport={() => undefined} />
      )}
    </div>
  );
}

function EditorCanvas({
  photo,
  referencePhoto,
  workspace,
  zoom,
  showBefore,
  compareMode,
  photoTransform,
  cropMode,
  cropOverlay,
  setCropOverlay,
  setCropMode,
  setAdjustment,
  opticsMode,
  maskTarget,
  maskTolerance,
  maskFeather,
  maskBrushSize,
  maskBrushFlow,
  maskBrushDensity,
  maskAuto,
  onMaskCreated,
  selectedMaskId,
  setSelectedMaskId,
  sampleMode,
  onSampledWhiteBalance,
  onSampledPointColor,
  retouchMode,
  retouchSize,
  retouchFeather,
  onRetouchSpot,
  softProof,
  proofProfile,
  gamutWarnings,
  allowFullResolution,
}: {
  photo: RuntimePhoto;
  referencePhoto?: RuntimePhoto;
  workspace: Workspace;
  zoom: number;
  showBefore: boolean;
  compareMode: "edited" | "original" | "split" | "side" | "reference";
  photoTransform: string;
  cropMode: boolean;
  cropOverlay: "thirds" | "diagonal" | "golden" | "spiral" | "grid";
  setCropOverlay: (
    overlay: "thirds" | "diagonal" | "golden" | "spiral" | "grid",
  ) => void;
  setCropMode: (open: boolean) => void;
  setAdjustment: (key: keyof Adjustments, value: number) => void;
  opticsMode: OpticsMode;
  maskTarget: MaskTarget | null;
  maskTolerance: number;
  maskFeather: number;
  maskBrushSize: number;
  maskBrushFlow: number;
  maskBrushDensity: number;
  maskAuto: boolean;
  onMaskCreated: (mask: MaskRecord) => void;
  selectedMaskId: string | null;
  setSelectedMaskId: (id: string | null) => void;
  sampleMode: "whiteBalance" | "pointColor" | null;
  onSampledWhiteBalance: (temperature: number, tint: number) => void;
  onSampledPointColor: (red: number, green: number, blue: number) => void;
  retouchMode: RetouchMode | null;
  retouchSize: number;
  retouchFeather: number;
  onRetouchSpot: (spot: RetouchSpot) => void;
  softProof: boolean;
  proofProfile: ColorSpace;
  gamutWarnings: boolean;
  allowFullResolution: boolean;
}) {
  const a = photo.adjustments;
  const imageRef = useRef<HTMLImageElement>(null);
  const [renderSource, setRenderSource] = useState(photo.previewUrl);
  const activeMask = photo.masks.find((mask) => mask.id === selectedMaskId);
  const [retouchSource, setRetouchSource] = useState<{
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!allowFullResolution)
      return () => {
        cancelled = true;
      };
    const full = new Image();
    full.src = photo.url;
    full
      .decode()
      .then(() => {
        if (!cancelled) setRenderSource(photo.url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [allowFullResolution, photo.id, photo.previewUrl, photo.url]);
  const [customCrop, setCustomCrop] = useState({ width: 4, height: 3 });
  const [guidedUpright, setGuidedUpright] = useState(false);
  const [guideStart, setGuideStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const autoLevel = async () => {
    const { canvas, pixels } = await readImagePixels(photo.url, 220);
    let weightedAngle = 0;
    let totalWeight = 0;
    const luminance = (x: number, y: number) => {
      const index = (y * canvas.width + x) * 4;
      return (
        0.2126 * pixels.data[index] +
        0.7152 * pixels.data[index + 1] +
        0.0722 * pixels.data[index + 2]
      );
    };
    for (let y = 1; y < canvas.height - 1; y += 2) {
      for (let x = 1; x < canvas.width - 1; x += 2) {
        const gx = luminance(x + 1, y) - luminance(x - 1, y);
        const gy = luminance(x, y + 1) - luminance(x, y - 1);
        const weight = Math.hypot(gx, gy);
        if (weight < 24) continue;
        let lineAngle = (Math.atan2(gy, gx) * 180) / Math.PI + 90;
        while (lineAngle > 90) lineAngle -= 180;
        while (lineAngle < -90) lineAngle += 180;
        if (Math.abs(lineAngle) < 22) {
          weightedAngle += lineAngle * weight;
          totalWeight += weight;
        }
      }
    }
    setAdjustment(
      "rotation",
      totalWeight
        ? Math.max(-15, Math.min(15, -weightedAngle / totalWeight))
        : 0,
    );
  };
  const placeGuide = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!guidedUpright) return;
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    if (!guideStart) {
      setGuideStart(point);
      return;
    }
    const angle =
      (Math.atan2(point.y - guideStart.y, point.x - guideStart.x) * 180) /
      Math.PI;
    const desired = Math.abs(angle) > 45 ? (angle > 0 ? 90 : -90) : 0;
    setAdjustment(
      "rotation",
      Math.max(-45, Math.min(45, a.rotation + desired - angle)),
    );
    setGuideStart(null);
    setGuidedUpright(false);
  };
  const dragCropEdge = (
    edge: "top" | "right" | "bottom" | "left",
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    const overlay = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!overlay) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const x = Math.max(
      0,
      Math.min(45, ((event.clientX - overlay.left) / overlay.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(45, ((event.clientY - overlay.top) / overlay.height) * 100),
    );
    const value =
      edge === "left"
        ? x
        : edge === "right"
          ? Math.max(
              0,
              Math.min(
                45,
                100 - ((event.clientX - overlay.left) / overlay.width) * 100,
              ),
            )
          : edge === "top"
            ? y
            : Math.max(
                0,
                Math.min(
                  45,
                  100 - ((event.clientY - overlay.top) / overlay.height) * 100,
                ),
              );
    const key =
      `crop${edge[0].toUpperCase()}${edge.slice(1)}` as keyof Adjustments;
    setAdjustment(key, value);
    if (a.cropConstrain) {
      const opposite =
        edge === "left"
          ? "cropRight"
          : edge === "right"
            ? "cropLeft"
            : edge === "top"
              ? "cropBottom"
              : "cropTop";
      setAdjustment(opposite, value);
    }
  };
  const ratios: [[number, string], ...[number, string][]] = [
    [0, "Original"],
    [1, "1:1"],
    [0.8, "4:5"],
    [1.25, "5:4"],
    [1.5, "3:2"],
    [1.7778, "16:9"],
    [0.5625, "9:16"],
    [1.91, "Social"],
    [1.414, "A-series"],
  ];
  const buildMagicMask = async (normalizedX: number, normalizedY: number) => {
    if (!maskTarget || showBefore) return;
    const image = new Image();
    image.src = photo.url;
    await image.decode();
    const scale = Math.min(
      1,
      512 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const sample = document.createElement("canvas");
    sample.width = width;
    sample.height = height;
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleCtx) return;
    sampleCtx.drawImage(image, 0, 0, width, height);
    const pixels = sampleCtx.getImageData(0, 0, width, height);
    const output = sampleCtx.createImageData(width, height);
    const startX = Math.min(width - 1, Math.round(normalizedX * (width - 1)));
    const startY = Math.min(height - 1, Math.round(normalizedY * (height - 1)));
    const start = startY * width + startX;
    const offset = start * 4;
    const sr = pixels.data[offset],
      sg = pixels.data[offset + 1],
      sb = pixels.data[offset + 2];
    const threshold = Math.pow(maskTolerance * 4.42, 2);
    const seedLuminance = 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
    const writePixel = (index: number, alpha = 255) => {
      const p = index * 4;
      output.data[p] = 255;
      output.data[p + 1] = 255;
      output.data[p + 2] = 255;
      output.data[p + 3] = Math.max(0, Math.min(255, Math.round(alpha)));
    };
    if (maskTarget === "brush") {
      const radius = Math.max(0.02, maskBrushSize / 200);
      const strength = (maskBrushFlow / 100) * (maskBrushDensity / 100);
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const dx = x / Math.max(1, width - 1) - normalizedX;
          const dy = y / Math.max(1, height - 1) - normalizedY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > radius) continue;
          const p = (y * width + x) * 4;
          const dr = pixels.data[p] - sr,
            dg = pixels.data[p + 1] - sg,
            db = pixels.data[p + 2] - sb;
          const edge = Math.max(
            0,
            Math.min(1, (radius - distance) / Math.max(0.005, radius * 0.35)),
          );
          const colorMatch = maskAuto
            ? Math.max(
                0,
                Math.min(
                  1,
                  1 - (dr * dr + dg * dg + db * db) / Math.max(1, threshold),
                ),
              )
            : 1;
          writePixel(y * width + x, 255 * strength * edge * colorMatch);
        }
    } else if (maskTarget === "linear") {
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const distance = (x / Math.max(1, width - 1) - normalizedX) * 2;
          writePixel(
            y * width + x,
            255 * Math.max(0, Math.min(1, 0.5 - distance)),
          );
        }
    } else if (maskTarget === "radial") {
      const radius = 0.34;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const dx = (x / Math.max(1, width - 1) - normalizedX) / radius;
          const dy =
            (y / Math.max(1, height - 1) - normalizedY) / (radius * 0.72);
          const distance = Math.sqrt(dx * dx + dy * dy);
          writePixel(
            y * width + x,
            255 * Math.max(0, Math.min(1, 1.18 - distance)),
          );
        }
    } else if (maskTarget === "luminance") {
      const range = Math.max(8, maskTolerance * 2.2);
      for (let index = 0; index < width * height; index++) {
        const p = index * 4;
        if (!pixels.data[p + 3]) continue;
        const luminance =
          0.2126 * pixels.data[p] +
          0.7152 * pixels.data[p + 1] +
          0.0722 * pixels.data[p + 2];
        const distance = Math.abs(luminance - seedLuminance);
        writePixel(index, 255 * Math.max(0, Math.min(1, 1 - distance / range)));
      }
    } else if (maskTarget === "color") {
      for (let index = 0; index < width * height; index++) {
        const p = index * 4;
        if (!pixels.data[p + 3]) continue;
        const dr = pixels.data[p] - sr,
          dg = pixels.data[p + 1] - sg,
          db = pixels.data[p + 2] - sb;
        const distance = dr * dr + dg * dg + db * db;
        if (distance <= threshold)
          writePixel(index, 255 * (1 - distance / Math.max(1, threshold)));
      }
    } else {
      const visited = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);
      let head = 0,
        tail = 0;
      queue[tail++] = start;
      visited[start] = 1;
      while (head < tail) {
        const index = queue[head++];
        const p = index * 4;
        const dr = pixels.data[p] - sr,
          dg = pixels.data[p + 1] - sg,
          db = pixels.data[p + 2] - sb;
        if (dr * dr + dg * dg + db * db > threshold || pixels.data[p + 3] === 0)
          continue;
        writePixel(index);
        const x = index % width,
          y = Math.floor(index / width);
        const neighbors = [
          x > 0 ? index - 1 : -1,
          x < width - 1 ? index + 1 : -1,
          y > 0 ? index - width : -1,
          y < height - 1 ? index + width : -1,
        ];
        for (const next of neighbors)
          if (next >= 0 && !visited[next]) {
            visited[next] = 1;
            queue[tail++] = next;
          }
      }
    }
    const raw = document.createElement("canvas");
    raw.width = width;
    raw.height = height;
    raw.getContext("2d")?.putImageData(output, 0, 0);
    const softened = document.createElement("canvas");
    softened.width = width;
    softened.height = height;
    const softCtx = softened.getContext("2d");
    if (!softCtx) return;
    softCtx.filter = maskFeather
      ? `blur(${Math.max(0.5, maskFeather * scale)}px)`
      : "none";
    softCtx.drawImage(raw, 0, 0);
    const names: Record<MaskTarget, string> = {
      brush: "Brush mask",
      point: "Magic selection",
      hair: "Hair",
      skin: "Skin",
      clothes: "Clothes",
      sky: "Sky",
      linear: "Linear gradient",
      radial: "Radial gradient",
      luminance: "Luminance range",
      color: "Color range",
    };
    const id = crypto.randomUUID();
    onMaskCreated({
      id,
      name: names[maskTarget],
      target: maskTarget,
      dataUrl: softened.toDataURL("image/png"),
      tolerance: maskTolerance,
      feather: maskFeather,
      visible: true,
      inverted: false,
      overlayColor: "#b6f36b",
      overlayOpacity: 48,
      pinX: normalizedX,
      pinY: normalizedY,
      adjustments: { ...defaultLocal },
    });
  };
  const handleCanvasClick = (event: React.MouseEvent<HTMLElement>) => {
    const source = imageRef.current;
    if (!source) return;
    const rect = source.getBoundingClientRect();
    const x = Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width),
      ),
      y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    if (retouchMode) {
      if (
        (retouchMode === "heal" || retouchMode === "clone") &&
        !retouchSource
      ) {
        setRetouchSource({ x, y });
        return;
      }
      const sourcePoint =
        retouchMode === "redEye"
          ? { x, y }
          : (retouchSource ?? {
              x: Math.min(0.98, Math.max(0.02, x + (x > 0.5 ? -0.08 : 0.08))),
              y: Math.min(0.98, Math.max(0.02, y + (y > 0.5 ? -0.05 : 0.05))),
            });
      onRetouchSpot({
        id: crypto.randomUUID(),
        mode: retouchMode,
        x,
        y,
        sourceX: sourcePoint.x,
        sourceY: sourcePoint.y,
        size: retouchSize,
        feather: retouchFeather,
      });
      setRetouchSource(null);
      return;
    }
    if (sampleMode) {
      const canvas = document.createElement("canvas");
      canvas.width = 5;
      canvas.height = 5;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(
        source,
        Math.max(0, x * source.naturalWidth - 2),
        Math.max(0, y * source.naturalHeight - 2),
        5,
        5,
        0,
        0,
        5,
        5,
      );
      const pixels = context.getImageData(0, 0, 5, 5).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (!pixels[i + 3]) continue;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }
      r /= Math.max(1, count);
      g /= Math.max(1, count);
      b /= Math.max(1, count);
      if (sampleMode === "whiteBalance")
        onSampledWhiteBalance(
          Math.max(-100, Math.min(100, (b - r) * 0.62)),
          Math.max(-100, Math.min(100, ((r + b) / 2 - g) * 0.72)),
        );
      else onSampledPointColor(r, g, b);
      return;
    }
    void buildMagicMask(x, y);
  };
  const picking = Boolean(maskTarget || sampleMode || retouchMode);
  return (
    <div className="photo-stage">
      <div
        className={`photo-wrap compare-${compareMode} ${cropMode ? "cropping" : ""} ${picking ? "mask-picking" : ""}`}
        style={{ width: `${zoom}%` }}
        role={picking ? "button" : undefined}
        aria-label={
          picking
            ? retouchMode
              ? "Retouching canvas"
              : sampleMode
                ? "Color sampling canvas"
                : "Photo selection canvas"
            : undefined
        }
        tabIndex={picking ? 0 : undefined}
        onKeyDown={(event) => {
          if (maskTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            void buildMagicMask(0.5, 0.5);
          }
        }}
        onClick={handleCanvasClick}
      >
        {(compareMode === "split" ||
          compareMode === "side" ||
          compareMode === "reference") && (
          <img
            className="comparison-original"
            src={
              compareMode === "reference"
                ? (referencePhoto?.url ?? photo.url)
                : photo.url
            }
            alt={compareMode === "reference" ? "Reference" : "Original"}
            style={{ transform: photoTransform }}
          />
        )}
        {!showBefore && a.boundaryFill > 0 && (
          <img
            className="content-boundary-fill"
            src={renderSource}
            alt=""
            aria-hidden="true"
            style={{
              filter: `${cssFilter(a, photo.processVersion)} blur(${Math.max(3, a.boundaryFill / 5)}px)`,
              transform: `${photoTransform} scale(${1.08 + a.boundaryFill / 500})`,
              opacity: 0.9,
            }}
          />
        )}
        <img
          className="comparison-edited"
          ref={imageRef}
          src={renderSource}
          alt={photo.name}
          style={{
            filter: showBefore
              ? "none"
              : `${cssFilter(a, photo.processVersion)} ${softProof ? (proofProfile === "display-p3" ? "saturate(1.04)" : proofProfile === "adobe-rgb" ? "saturate(1.02) contrast(.99)" : proofProfile === "prophoto-rgb" ? "saturate(.97) contrast(.98)" : "") : ""}`,
            transform: photoTransform,
            clipPath: `inset(${a.cropTop}% ${a.cropRight}% ${a.cropBottom}% ${a.cropLeft}%)`,
          }}
        />
        {!showBefore && softProof && gamutWarnings && (
          <GamutWarningOverlay photo={photo} />
        )}
        {!showBefore &&
          photo.masks
            .filter((mask) => mask.visible)
            .map((mask) => (
              <img
                key={mask.id}
                className="local-adjustment"
                src={renderSource}
                alt=""
                aria-hidden="true"
                onClick={() => setSelectedMaskId(mask.id)}
                style={{
                  filter: `${cssFilter(a, photo.processVersion)} ${localFilter(mask.adjustments)}`,
                  transform: photoTransform,
                  WebkitMaskImage: mask.inverted
                    ? `linear-gradient(#fff 0 0),url(${mask.dataUrl})`
                    : `url(${mask.dataUrl})`,
                  maskImage: mask.inverted
                    ? `linear-gradient(#fff 0 0),url(${mask.dataUrl})`
                    : `url(${mask.dataUrl})`,
                  WebkitMaskComposite: mask.inverted ? "xor" : "source-over",
                  maskComposite: mask.inverted ? "exclude" : "add",
                  WebkitMaskSize: mask.inverted
                    ? "100% 100%,100% 100%"
                    : "100% 100%",
                  maskSize: mask.inverted ? "100% 100%,100% 100%" : "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }}
              />
            ))}
        {!showBefore &&
          photo.retouchSpots.map((spot) => (
            <div
              key={spot.id}
              className={`retouch-preview ${spot.mode}`}
              aria-hidden="true"
              style={{
                left: `${spot.x * 100}%`,
                top: `${spot.y * 100}%`,
                width: `${spot.size}%`,
                aspectRatio: "1",
                backgroundImage: `url(${photo.url})`,
                backgroundSize: `${10000 / Math.max(2, spot.size)}%`,
                backgroundPosition: `${spot.sourceX * 100}% ${spot.sourceY * 100}%`,
                filter:
                  spot.mode === "redEye"
                    ? "saturate(.12) brightness(.38)"
                    : spot.mode === "heal" || spot.mode === "remove"
                      ? `blur(${spot.feather / 55}px) ${cssFilter(a, photo.processVersion)}`
                      : cssFilter(a, photo.processVersion),
              }}
            />
          ))}
        {retouchSource && (
          <div
            className="retouch-source"
            aria-hidden="true"
            style={{
              left: `${retouchSource.x * 100}%`,
              top: `${retouchSource.y * 100}%`,
              width: `${retouchSize}%`,
              aspectRatio: "1",
            }}
          />
        )}
        {activeMask?.visible && (
          <div
            className="magic-highlight"
            onClick={() => setSelectedMaskId(null)}
            style={{
              background: activeMask.overlayColor,
              opacity: activeMask.overlayOpacity / 100,
              WebkitMaskImage: `url(${activeMask.dataUrl})`,
              maskImage: `url(${activeMask.dataUrl})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
          />
        )}
        {activeMask?.visible && (
          <button
            className="mask-pin"
            aria-label={`Selected mask pin: ${activeMask.name}`}
            style={{
              left: `${activeMask.pinX * 100}%`,
              top: `${activeMask.pinY * 100}%`,
            }}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedMaskId(activeMask.id);
            }}
          />
        )}
        {picking && (
          <div className="mask-instruction">
            <WandSparkles />{" "}
            {retouchMode
              ? retouchMode === "heal" || retouchMode === "clone"
                ? retouchSource
                  ? "Now click the repair target"
                  : "Click a clean source area first"
                : `Click the ${retouchMode === "redEye" ? "eye" : "area"} to correct`
              : sampleMode === "whiteBalance"
                ? "Click a neutral gray or white area"
                : sampleMode === "pointColor"
                  ? "Click the color you want to refine"
                  : "Click the exact area to highlight"}
          </div>
        )}
        {!showBefore && (a.chromatic > 0 || a.chromaticShift > 0) && (
          <img
            className="chromatic-preview"
            src={renderSource}
            alt=""
            aria-hidden="true"
            style={{
              filter: `${cssFilter(a, photo.processVersion)} hue-rotate(115deg)`,
              transform: `${photoTransform} translateX(${(a.chromatic + a.chromaticShift) / 15}px)`,
              opacity: Math.min(0.14, (a.chromatic + a.chromaticShift) / 800),
            }}
          />
        )}
        {!showBefore && (a.vignette !== 0 || a.lensVignette !== 0) && (
          <div
            className="vignette"
            style={{
              opacity: Math.min(
                0.9,
                Math.abs(a.vignette - a.lensVignette) / 115,
              ),
              borderRadius: `${Math.max(0, 50 + a.vignetteRoundness / 2)}%`,
              boxShadow: `inset 0 0 ${60 + a.vignetteFeather}px ${20 + a.vignetteMidpoint / 2}px #000`,
            }}
          />
        )}
        {!showBefore && a.grain > 0 && (
          <div
            className="grain"
            style={{
              opacity: a.grain / 240,
              backgroundSize: `${Math.max(45, 180 - a.grainSize)}px`,
              filter: `contrast(${1 + a.grainRoughness / 100})`,
            }}
          />
        )}
        {!showBefore && (a.halation > 0 || a.lightLeak > 0) && (
          <div
            className="light-leak"
            style={{ opacity: Math.min(0.8, (a.halation + a.lightLeak) / 150) }}
          />
        )}
        {!showBefore && (a.paperTexture > 0 || a.age > 0) && (
          <div
            className="paper-texture"
            style={{ opacity: Math.min(0.35, (a.paperTexture + a.age) / 420) }}
          />
        )}
        {!showBefore && a.glassDistortion > 0 && (
          <div
            className="glass-effect"
            style={{
              opacity: a.glassDistortion / 230,
              backgroundSize: `${Math.max(22, 105 - a.glassDistortion)}px`,
            }}
          />
        )}
        {cropMode && (
          <div
            className={`crop-overlay overlay-${cropOverlay} ${guidedUpright ? "guided" : ""}`}
            onClick={placeGuide}
          >
            <div className="crop-grid" />
            {(["top", "right", "bottom", "left"] as const).map((edge) => (
              <button
                key={edge}
                className={`crop-handle ${edge}`}
                aria-label={`Drag ${edge} crop edge`}
                onPointerDown={(event) => dragCropEdge(edge, event)}
                onPointerMove={(event) =>
                  event.currentTarget.hasPointerCapture(event.pointerId) &&
                  dragCropEdge(edge, event)
                }
              />
            ))}
            {guideStart && (
              <i
                className="upright-guide-start"
                style={{
                  left: `${guideStart.x * 100}%`,
                  top: `${guideStart.y * 100}%`,
                }}
              />
            )}
            <nav onClick={(event) => event.stopPropagation()}>
              <div className="crop-ratios">
                {ratios.map(([ratio, label]) => (
                  <button
                    key={label}
                    className={a.cropRatio === ratio ? "active" : ""}
                    onClick={() => setAdjustment("cropRatio", ratio)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="custom-crop-row">
                <input
                  aria-label="Custom crop width"
                  type="number"
                  min="1"
                  max="100"
                  value={customCrop.width}
                  onChange={(event) =>
                    setCustomCrop((value) => ({
                      ...value,
                      width: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
                <span>:</span>
                <input
                  aria-label="Custom crop height"
                  type="number"
                  min="1"
                  max="100"
                  value={customCrop.height}
                  onChange={(event) =>
                    setCustomCrop((value) => ({
                      ...value,
                      height: Math.max(1, Number(event.target.value)),
                    }))
                  }
                />
                <button
                  className={
                    Math.abs(
                      a.cropRatio - customCrop.width / customCrop.height,
                    ) < 0.001
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setAdjustment(
                      "cropRatio",
                      customCrop.width / customCrop.height,
                    )
                  }
                >
                  Custom
                </button>
              </div>
              <div className="overlay-row">
                {(
                  ["thirds", "diagonal", "golden", "spiral", "grid"] as const
                ).map((overlay) => (
                  <button
                    key={overlay}
                    className={cropOverlay === overlay ? "active" : ""}
                    onClick={() => setCropOverlay(overlay)}
                  >
                    {overlay}
                  </button>
                ))}
              </div>
              <label>
                Straighten{" "}
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step=".1"
                  value={a.rotation}
                  onChange={(event) =>
                    setAdjustment("rotation", Number(event.target.value))
                  }
                />
                <span>{a.rotation.toFixed(1)}°</span>
              </label>
              <div className="crop-smart-actions">
                <button onClick={() => void autoLevel()}>Auto level</button>
                <button
                  className={guidedUpright ? "active" : ""}
                  onClick={() => {
                    setGuidedUpright(!guidedUpright);
                    setGuideStart(null);
                  }}
                >
                  Guided upright
                </button>
                <button
                  className={a.cropConstrain ? "active" : ""}
                  onClick={() =>
                    setAdjustment("cropConstrain", a.cropConstrain ? 0 : 1)
                  }
                >
                  Constrain
                </button>
                <button
                  className={a.boundaryFill ? "active" : ""}
                  onClick={() =>
                    setAdjustment("boundaryFill", a.boundaryFill ? 0 : 45)
                  }
                >
                  Boundary fill
                </button>
              </div>
              <label>
                Anamorphic correction{" "}
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={a.anamorphic}
                  onChange={(event) =>
                    setAdjustment("anamorphic", Number(event.target.value))
                  }
                />
                <span>
                  {a.anamorphic > 0 ? "+" : ""}
                  {Math.round(a.anamorphic)}
                </span>
              </label>
              <button
                className="crop-reset"
                onClick={() => {
                  (
                    ["cropTop", "cropRight", "cropBottom", "cropLeft"] as const
                  ).forEach((key) => setAdjustment(key, 0));
                }}
              >
                Reset crop edges
              </button>
              <button className="crop-done" onClick={() => setCropMode(false)}>
                Done
              </button>
            </nav>
          </div>
        )}
        <span className="preview-state">
          {compareMode === "original"
            ? "Original"
            : compareMode === "split"
              ? "Split before / after"
              : compareMode === "side"
                ? "Original / Edited"
                : compareMode === "reference"
                  ? "Reference / Edited"
                  : workspace === "develop"
                    ? "Edited"
                    : opticsMode === "pure"
                      ? "Pure"
                      : opticsMode === "creative"
                        ? "Creative"
                        : "Film"}
        </span>
      </div>
    </div>
  );
}
function EmptyLibrary({ onImport }: { onImport: () => void }) {
  return (
    <div className="empty-library">
      <div className="empty-mark">
        <Aperture />
      </div>
      <h1>Bring your photos into focus.</h1>
      <p>
        Import JPEG, PNG, WebP, or browser-supported camera files. Originals
        stay on this device.
      </p>
      <button className="primary-button large" onClick={onImport}>
        <ImagePlus /> Add photos
      </button>
      <span>or drop files anywhere</span>
    </div>
  );
}
function LibraryInspector({
  photo,
  update,
  remove,
}: {
  photo: RuntimePhoto;
  update: (fn: (p: RuntimePhoto) => RuntimePhoto) => void;
  remove: () => void;
}) {
  const setMeta = (key: keyof PhotoMetadata, value: string | string[]) =>
    update((p) => ({ ...p, metadata: { ...p.metadata, [key]: value } }));
  const sidecarRef = useRef<HTMLInputElement>(null);
  const relinkRef = useRef<HTMLInputElement>(null);
  const [keywordDraft, setKeywordDraft] = useState("");
  const keywordSuggestions = [
    "People > Portrait",
    "Places > Travel",
    "Nature > Landscape",
    "Events > Family",
    "client ≈ customer",
    "mono ≈ black and white",
  ].filter((item) => !photo.metadata.keywords.includes(item));
  const exportXmp = () => {
    const payload = encodeURIComponent(
      JSON.stringify({
        version: 1,
        adjustments: photo.adjustments,
        metadata: photo.metadata,
        rating: photo.rating,
        flagged: photo.flagged,
        rejected: photo.rejected,
        label: photo.label,
        masks: photo.masks,
        retouchSpots: photo.retouchSpots,
      }),
    );
    const keywords = photo.metadata.keywords
      .map((keyword) => `<rdf:li>${escapeXml(keyword)}</rdf:li>`)
      .join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:ll="https://goodtools.ca/ns/librelux/1.0/" xmp:Rating="${photo.rating}" ll:Label="${photo.label}"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(photo.metadata.title)}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(photo.metadata.caption)}</rdf:li></rdf:Alt></dc:description><dc:creator><rdf:Seq><rdf:li>${escapeXml(photo.metadata.creator)}</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(photo.metadata.copyright)}</rdf:li></rdf:Alt></dc:rights><dc:subject><rdf:Bag>${keywords}</rdf:Bag></dc:subject><ll:payload>${payload}</ll:payload></rdf:Description></rdf:RDF></x:xmpmeta>`;
    const url = URL.createObjectURL(
      new Blob([xml], { type: "application/rdf+xml" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${photo.name.replace(/\.[^.]+$/, "")}.xmp`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importXmp = async (file?: File) => {
    if (!file) return;
    const documentXml = new DOMParser().parseFromString(
      await file.text(),
      "application/xml",
    );
    const payload = documentXml.getElementsByTagNameNS(
      "https://goodtools.ca/ns/librelux/1.0/",
      "payload",
    )[0]?.textContent;
    if (!payload) return;
    try {
      const data = JSON.parse(
        decodeURIComponent(payload),
      ) as Partial<PhotoRecord>;
      update((current) => ({
        ...current,
        rating: typeof data.rating === "number" ? data.rating : current.rating,
        flagged: data.flagged ?? current.flagged,
        rejected: data.rejected ?? current.rejected,
        label: data.label ?? current.label,
        metadata: {
          ...current.metadata,
          ...data.metadata,
          keywords: data.metadata?.keywords ?? current.metadata.keywords,
        },
        adjustments: {
          ...current.adjustments,
          ...data.adjustments,
          hsl: { ...current.adjustments.hsl, ...data.adjustments?.hsl },
          bwMix: { ...current.adjustments.bwMix, ...data.adjustments?.bwMix },
          curves: {
            ...current.adjustments.curves,
            ...data.adjustments?.curves,
          },
        },
        masks:
          data.masks?.map((mask) => ({
            ...mask,
            visible: mask.visible ?? true,
            inverted: mask.inverted ?? false,
            overlayColor: mask.overlayColor ?? "#b6f36b",
            overlayOpacity: mask.overlayOpacity ?? 48,
            pinX: mask.pinX ?? 0.5,
            pinY: mask.pinY ?? 0.5,
            adjustments: { ...defaultLocal, ...mask.adjustments },
          })) ?? current.masks,
        retouchSpots: data.retouchSpots ?? current.retouchSpots,
      }));
    } catch {
      return;
    }
  };
  return (
    <>
      <Panel title="Rating & labels">
        <div className="rating-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() =>
                update((p) => ({ ...p, rating: n === p.rating ? 0 : n }))
              }
            >
              <Star className={n <= photo.rating ? "on" : ""} />
            </button>
          ))}
        </div>
        <div className="flag-grid">
          <button
            className={`flag-button ${photo.flagged ? "active" : ""}`}
            onClick={() =>
              update((p) => ({ ...p, flagged: !p.flagged, rejected: false }))
            }
          >
            <Flag />
            {photo.flagged ? "Picked" : "Pick"}
          </button>
          <button
            className={`flag-button reject-button ${photo.rejected ? "active" : ""}`}
            onClick={() =>
              update((p) => ({ ...p, rejected: !p.rejected, flagged: false }))
            }
          >
            <X />
            {photo.rejected ? "Rejected" : "Reject"}
          </button>
        </div>
        <div className="labels">
          {(Object.keys(labelColors) as Label[])
            .filter((l) => l !== "none")
            .map((label) => (
              <button
                key={label}
                aria-label={`${label} label`}
                className={photo.label === label ? "active" : ""}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    label: p.label === label ? "none" : label,
                  }))
                }
                style={{ background: labelColors[label] }}
              >
                {photo.label === label && <Check />}
              </button>
            ))}
        </div>
      </Panel>
      <Panel title="Description">
        <label className="meta-field">
          <span>Title</span>
          <input
            value={photo.metadata.title}
            onChange={(e) => setMeta("title", e.target.value)}
            placeholder="Add a title"
          />
        </label>
        <label className="meta-field">
          <span>Caption</span>
          <textarea
            value={photo.metadata.caption}
            onChange={(e) => setMeta("caption", e.target.value)}
            placeholder="Describe this photo"
          />
        </label>
        <label className="meta-field">
          <span>Creator</span>
          <input
            value={photo.metadata.creator}
            onChange={(e) => setMeta("creator", e.target.value)}
            placeholder="Photographer"
          />
        </label>
        <label className="meta-field">
          <span>Copyright</span>
          <input
            value={photo.metadata.copyright}
            onChange={(e) => setMeta("copyright", e.target.value)}
            placeholder="Copyright notice"
          />
        </label>
      </Panel>
      <Panel title="Capture & location" open={false}>
        <label className="meta-field">
          <span>Camera</span>
          <input
            value={photo.metadata.camera}
            onChange={(e) => setMeta("camera", e.target.value)}
            placeholder="Camera model"
          />
        </label>
        <label className="meta-field">
          <span>Lens</span>
          <input
            value={photo.metadata.lens}
            onChange={(e) => setMeta("lens", e.target.value)}
            placeholder="Lens"
          />
        </label>
        <label className="meta-field">
          <span>Captured</span>
          <input
            type="datetime-local"
            value={photo.metadata.capturedAt}
            onChange={(e) => setMeta("capturedAt", e.target.value)}
          />
        </label>
        <label className="meta-field">
          <span>Location</span>
          <input
            value={photo.metadata.location}
            onChange={(e) => setMeta("location", e.target.value)}
            placeholder="City or place"
          />
        </label>
        <div className="metadata-grid">
          <label className="meta-field">
            <span>ISO</span>
            <input
              value={photo.metadata.iso}
              onChange={(e) => setMeta("iso", e.target.value)}
              placeholder="100"
            />
          </label>
          <label className="meta-field">
            <span>Aperture</span>
            <input
              value={photo.metadata.aperture}
              onChange={(e) => setMeta("aperture", e.target.value)}
              placeholder="f/2.8"
            />
          </label>
          <label className="meta-field">
            <span>Shutter</span>
            <input
              value={photo.metadata.shutter}
              onChange={(e) => setMeta("shutter", e.target.value)}
              placeholder="1/250"
            />
          </label>
          <label className="meta-field">
            <span>Focal length</span>
            <input
              value={photo.metadata.focalLength}
              onChange={(e) => setMeta("focalLength", e.target.value)}
              placeholder="50 mm"
            />
          </label>
        </div>
      </Panel>
      <Panel title="File info">
        <dl className="metadata">
          <div>
            <dt>Filename</dt>
            <dd>{photo.name}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{photo.type || "Image"}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatBytes(photo.size)}</dd>
          </div>
          <div>
            <dt>Folder</dt>
            <dd>{photo.folder}</dd>
          </div>
          <div>
            <dt>Added</dt>
            <dd>{new Date(photo.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Last edit</dt>
            <dd>{new Date(photo.editedAt).toLocaleString()}</dd>
          </div>
          {photo.virtualOf && (
            <div>
              <dt>Copy</dt>
              <dd>Virtual</dd>
            </div>
          )}
        </dl>
      </Panel>
      <Panel title="Keywords">
        <div className="keyword-box">
          {photo.metadata.keywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() =>
                setMeta(
                  "keywords",
                  photo.metadata.keywords.filter((k) => k !== keyword),
                )
              }
            >
              {keyword} ×
            </button>
          ))}
        </div>
        <input
          className="keyword-input"
          placeholder="Type a keyword and press Enter"
          value={keywordDraft}
          onChange={(event) => setKeywordDraft(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = e.currentTarget.value.trim();
              if (value && !photo.metadata.keywords.includes(value))
                setMeta("keywords", [...photo.metadata.keywords, value]);
              setKeywordDraft("");
            }
          }}
        />
        <div className="keyword-suggestions">
          {keywordSuggestions.slice(0, 4).map((keyword) => (
            <button
              key={keyword}
              onClick={() =>
                setMeta("keywords", [...photo.metadata.keywords, keyword])
              }
            >
              + {keyword}
            </button>
          ))}
        </div>
        <p className="panel-note">
          Use “Parent &gt; Child” for hierarchy and “term ≈ synonym” for
          searchable synonyms.
        </p>
      </Panel>
      <Panel
        title="Original file"
        open={photo.missing}
        badge={photo.missing ? "Missing" : "Verified"}
      >
        <p className="panel-note">
          {photo.missing
            ? "The catalog record is intact, but its local original needs to be relinked."
            : "The locally stored original matches the catalog record."}
        </p>
        <button
          className="relink-button"
          onClick={() => relinkRef.current?.click()}
        >
          {photo.missing ? "Relink original" : "Replace original"}
        </button>
        <input
          ref={relinkRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            URL.revokeObjectURL(photo.url);
            update((current) => ({
              ...current,
              name: file.name,
              type: file.type,
              size: file.size,
              blob: file,
              url: URL.createObjectURL(file),
              missing: false,
            }));
          }}
        />
      </Panel>
      <Panel title="XMP sidecar" open={false}>
        <p className="panel-note">
          Move ratings, metadata, edits, and masks between LibreLux catalogs
          without touching the original.
        </p>
        <div className="sidecar-actions">
          <button onClick={exportXmp}>
            <Download /> Export XMP
          </button>
          <button onClick={() => sidecarRef.current?.click()}>
            <FolderOpen /> Import XMP
          </button>
        </div>
        <input
          ref={sidecarRef}
          hidden
          type="file"
          accept=".xmp,application/rdf+xml,application/xml,text/xml"
          onChange={(event) => {
            void importXmp(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </Panel>
      <button className="danger-button" onClick={remove}>
        <X /> Remove from library
      </button>
    </>
  );
}
function DevelopPanels({
  photo,
  setAdjustment,
  setHslAdjustment,
  setBwAdjustment,
  setCurveAdjustment,
  maskTarget,
  setMaskTarget,
  maskTolerance,
  setMaskTolerance,
  maskFeather,
  setMaskFeather,
  maskBrushSize,
  setMaskBrushSize,
  maskBrushFlow,
  setMaskBrushFlow,
  maskBrushDensity,
  setMaskBrushDensity,
  maskAuto,
  setMaskAuto,
  selectedMaskId,
  setSelectedMaskId,
  updateMask,
  duplicateMask,
  deleteMask,
  autoTone,
  sampleMode,
  setSampleMode,
  pointColor,
  setPointColor,
  retouchMode,
  setRetouchMode,
  retouchSize,
  setRetouchSize,
  retouchFeather,
  setRetouchFeather,
  updateRetouchSpot,
  deleteRetouchSpot,
  clearRetouchSpots,
  userPresets,
  createUserPreset,
  updateUserPreset,
  deleteUserPreset,
  exportUserPresets,
  importUserPresets,
  chooseUserPreset,
  applyPresetToSelection,
  applyAdaptivePreset,
  softProof,
  setSoftProof,
  proofProfile,
  setProofProfile,
  gamutWarnings,
  setGamutWarnings,
}: {
  photo: RuntimePhoto;
  setAdjustment: (k: keyof Adjustments, v: number) => void;
  setHslAdjustment: (
    band: ColorBand,
    key: keyof HslState[ColorBand],
    value: number,
  ) => void;
  setBwAdjustment: (band: ColorBand, value: number) => void;
  setCurveAdjustment: (
    channel: CurveChannel,
    key: keyof CurveState[CurveChannel],
    value: number,
  ) => void;
  maskTarget: MaskTarget | null;
  setMaskTarget: (value: MaskTarget | null) => void;
  maskTolerance: number;
  setMaskTolerance: (value: number) => void;
  maskFeather: number;
  setMaskFeather: (value: number) => void;
  maskBrushSize: number;
  setMaskBrushSize: (value: number) => void;
  maskBrushFlow: number;
  setMaskBrushFlow: (value: number) => void;
  maskBrushDensity: number;
  setMaskBrushDensity: (value: number) => void;
  maskAuto: boolean;
  setMaskAuto: (value: boolean) => void;
  selectedMaskId: string | null;
  setSelectedMaskId: (id: string | null) => void;
  updateMask: (id: string, updater: (mask: MaskRecord) => MaskRecord) => void;
  duplicateMask: (mask: MaskRecord) => void;
  deleteMask: (id: string) => void;
  autoTone: () => Promise<void>;
  sampleMode: "whiteBalance" | "pointColor" | null;
  setSampleMode: (mode: "whiteBalance" | "pointColor" | null) => void;
  pointColor: PointColorSample | null;
  setPointColor: (sample: PointColorSample | null) => void;
  retouchMode: RetouchMode | null;
  setRetouchMode: (mode: RetouchMode | null) => void;
  retouchSize: number;
  setRetouchSize: (value: number) => void;
  retouchFeather: number;
  setRetouchFeather: (value: number) => void;
  updateRetouchSpot: (id: string, patch: Partial<RetouchSpot>) => void;
  deleteRetouchSpot: (id: string) => void;
  clearRetouchSpots: () => void;
  userPresets: UserPreset[];
  createUserPreset: () => void;
  updateUserPreset: (id: string, patch: Partial<UserPreset>) => void;
  deleteUserPreset: (id: string) => void;
  exportUserPresets: () => void;
  importUserPresets: () => void;
  chooseUserPreset: (preset: UserPreset) => void;
  applyPresetToSelection: (settings: Partial<Adjustments>) => void;
  applyAdaptivePreset: (kind: "subject" | "sky" | "portrait") => Promise<void>;
  softProof: boolean;
  setSoftProof: (value: boolean) => void;
  proofProfile: ColorSpace;
  setProofProfile: (value: ColorSpace) => void;
  gamutWarnings: boolean;
  setGamutWarnings: (value: boolean) => void;
}) {
  const a = photo.adjustments;
  const selectedMask = photo.masks.find((mask) => mask.id === selectedMaskId);
  const [combineMaskId, setCombineMaskId] = useState("");
  const dragCurvePoint = (
    key: "shadows" | "midtones" | "highlights",
    event: React.PointerEvent<SVGCircleElement>,
  ) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = svg.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * 90;
    const base = key === "shadows" ? 88 : key === "midtones" ? 49 : 4;
    setCurveAdjustment(
      "rgb",
      key,
      Math.max(-100, Math.min(100, (base - y) * 4)),
    );
  };
  const combineMasks = async (mode: "add" | "subtract" | "intersect") => {
    if (!selectedMask || !combineMaskId) return;
    const sourceMask = photo.masks.find((mask) => mask.id === combineMaskId);
    if (!sourceMask) return;
    const [base, source] = await Promise.all(
      [selectedMask.dataUrl, sourceMask.dataUrl].map(async (url) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
      }),
    );
    const canvas = document.createElement("canvas");
    canvas.width = base.naturalWidth;
    canvas.height = base.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(base, 0, 0);
    context.globalCompositeOperation =
      mode === "add"
        ? "source-over"
        : mode === "subtract"
          ? "destination-out"
          : "destination-in";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    updateMask(selectedMask.id, (mask) => ({
      ...mask,
      name: `${mask.name} ${mode} ${sourceMask.name}`,
      dataUrl: canvas.toDataURL("image/png"),
    }));
  };
  return (
    <>
      <div className="quick-actions">
        <button onClick={() => void autoTone()}>
          <WandSparkles /> Auto
        </button>
        <button
          onClick={() => {
            Object.entries(defaults).forEach(([key, value]) => {
              if (typeof value === "number")
                setAdjustment(key as keyof Adjustments, value);
            });
            colorBands.forEach((band) => {
              setHslAdjustment(band, "hue", 0);
              setHslAdjustment(band, "saturation", 0);
              setHslAdjustment(band, "luminance", 0);
              setBwAdjustment(band, 0);
            });
            curveChannels.forEach((channel) => {
              setCurveAdjustment(channel, "shadows", 0);
              setCurveAdjustment(channel, "midtones", 0);
              setCurveAdjustment(channel, "highlights", 0);
            });
          }}
        >
          Reset
        </button>
      </div>
      <Panel
        title="My presets"
        badge={userPresets.length ? `${userPresets.length}` : "Local"}
        open={false}
      >
        <div className="preset-manager-actions">
          <button onClick={createUserPreset}>
            <Plus /> Save current
          </button>
          <button onClick={importUserPresets}>Import</button>
          <button onClick={exportUserPresets} disabled={!userPresets.length}>
            Export
          </button>
        </div>
        <div className="adaptive-presets">
          <span>Adaptive</span>
          <button onClick={() => void applyAdaptivePreset("subject")}>
            Subject
          </button>
          <button onClick={() => void applyAdaptivePreset("sky")}>Sky</button>
          <button onClick={() => void applyAdaptivePreset("portrait")}>
            Portrait
          </button>
        </div>
        <div className="user-preset-list">
          {userPresets.map((preset) => {
            const compatible = Object.keys(preset.settings).filter(
              (key) => key in defaults,
            ).length;
            const preview = {
              ...a,
              ...preset.settings,
              hsl: preset.settings.hsl ?? a.hsl,
              bwMix: preset.settings.bwMix ?? a.bwMix,
              curves: preset.settings.curves ?? a.curves,
            };
            return (
              <details key={preset.id}>
                <summary>
                  <img
                    src={photo.previewUrl}
                    alt=""
                    style={{ filter: cssFilter(preview) }}
                  />
                  <span>
                    <strong>{preset.name}</strong>
                    <small>
                      {preset.group} · {compatible} compatible settings
                    </small>
                  </span>
                </summary>
                <label className="meta-field">
                  <span>Name</span>
                  <input
                    value={preset.name}
                    onChange={(event) =>
                      updateUserPreset(preset.id, { name: event.target.value })
                    }
                  />
                </label>
                <label className="meta-field">
                  <span>Folder</span>
                  <input
                    value={preset.group}
                    onChange={(event) =>
                      updateUserPreset(preset.id, { group: event.target.value })
                    }
                  />
                </label>
                <div className="preset-row-actions">
                  <button onClick={() => chooseUserPreset(preset)}>
                    Preview
                  </button>
                  <button
                    onClick={() =>
                      updateUserPreset(preset.id, { settings: { ...a } })
                    }
                  >
                    Update
                  </button>
                  <button
                    onClick={() => applyPresetToSelection(preset.settings)}
                  >
                    Apply to selected
                  </button>
                  <button onClick={() => deleteUserPreset(preset.id)}>
                    Delete
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      </Panel>
      <Panel title="Light">
        <AdjustSlider
          label="Exposure"
          value={a.exposure}
          min={-5}
          max={5}
          step={0.05}
          onChange={(v) => setAdjustment("exposure", v)}
        />
        <AdjustSlider
          label="Contrast"
          value={a.contrast}
          onChange={(v) => setAdjustment("contrast", v)}
        />
        <AdjustSlider
          label="Highlights"
          value={a.highlights}
          onChange={(v) => setAdjustment("highlights", v)}
        />
        <AdjustSlider
          label="Shadows"
          value={a.shadows}
          onChange={(v) => setAdjustment("shadows", v)}
        />
        <AdjustSlider
          label="Whites"
          value={a.whites}
          onChange={(v) => setAdjustment("whites", v)}
        />
        <AdjustSlider
          label="Blacks"
          value={a.blacks}
          onChange={(v) => setAdjustment("blacks", v)}
        />
        <div className="curve">
          <svg viewBox="0 0 200 90">
            <path d="M0 90L200 0" />
            <path
              className="active"
              d={`M0 ${88 - a.curves.rgb.shadows / 4} C52 ${62 - a.curves.rgb.midtones / 5} 91 ${49 - a.curves.rgb.midtones / 4} S150 ${24 - a.curves.rgb.highlights / 5} 200 ${4 - a.curves.rgb.highlights / 5}`}
            />
            <circle
              className="curve-point"
              cx="28"
              cy={88 - a.curves.rgb.shadows / 4}
              r="4"
              onPointerDown={(event) => dragCurvePoint("shadows", event)}
              onPointerMove={(event) =>
                event.currentTarget.hasPointerCapture(event.pointerId) &&
                dragCurvePoint("shadows", event)
              }
            />
            <circle
              className="curve-point"
              cx="91"
              cy={49 - a.curves.rgb.midtones / 4}
              r="4"
              onPointerDown={(event) => dragCurvePoint("midtones", event)}
              onPointerMove={(event) =>
                event.currentTarget.hasPointerCapture(event.pointerId) &&
                dragCurvePoint("midtones", event)
              }
            />
            <circle
              className="curve-point"
              cx="172"
              cy={4 - a.curves.rgb.highlights / 4}
              r="4"
              onPointerDown={(event) => dragCurvePoint("highlights", event)}
              onPointerMove={(event) =>
                event.currentTarget.hasPointerCapture(event.pointerId) &&
                dragCurvePoint("highlights", event)
              }
            />
          </svg>
          <div>
            <span>Point curve</span>
            <button
              onClick={() =>
                curveChannels.forEach((channel) =>
                  (["shadows", "midtones", "highlights"] as const).forEach(
                    (key) => setCurveAdjustment(channel, key, 0),
                  ),
                )
              }
            >
              Reset
            </button>
          </div>
        </div>
      </Panel>
      <Panel title="Tone curves" open={false}>
        <div className="channel-tabs">
          {curveChannels.map((channel) => (
            <span key={channel} className={`channel-${channel}`}>
              {channel.toUpperCase()}
            </span>
          ))}
        </div>
        {curveChannels.map((channel) => (
          <div className="channel-group" key={channel}>
            <strong>{channel.toUpperCase()} channel</strong>
            <AdjustSlider
              label="Shadows"
              value={a.curves[channel].shadows}
              onChange={(v) => setCurveAdjustment(channel, "shadows", v)}
            />
            <AdjustSlider
              label="Midtones"
              value={a.curves[channel].midtones}
              onChange={(v) => setCurveAdjustment(channel, "midtones", v)}
            />
            <AdjustSlider
              label="Highlights"
              value={a.curves[channel].highlights}
              onChange={(v) => setCurveAdjustment(channel, "highlights", v)}
            />
          </div>
        ))}
      </Panel>
      <Panel title="Color">
        <div className="wb-row">
          <button
            onClick={() => {
              setAdjustment("temperature", 0);
              setAdjustment("tint", 0);
            }}
          >
            As shot
          </button>
          <button
            className={sampleMode ? "active" : ""}
            title="White balance eyedropper"
            aria-pressed={sampleMode === "whiteBalance"}
            onClick={() => setSampleMode(sampleMode ? null : "whiteBalance")}
          >
            ⌾
          </button>
          <button
            onClick={() =>
              setAdjustment("saturation", a.saturation === -100 ? 0 : -100)
            }
          >
            B&amp;W
          </button>
        </div>
        <div className="point-color-row">
          <button
            className={sampleMode === "pointColor" ? "active" : ""}
            aria-pressed={sampleMode === "pointColor"}
            onClick={() =>
              setSampleMode(sampleMode === "pointColor" ? null : "pointColor")
            }
          >
            ◎ Point Color
          </button>
          {pointColor && (
            <span>
              {pointColor.band} · {pointColor.sourceHue}°
            </span>
          )}
        </div>
        {pointColor && (
          <div className="point-color-controls">
            <AdjustSlider
              label="Sample range"
              value={pointColor.range}
              min={5}
              max={90}
              resetValue={30}
              onChange={(value) =>
                setPointColor({ ...pointColor, range: value })
              }
            />
            <AdjustSlider
              label="Variance"
              value={pointColor.variance}
              min={0}
              max={60}
              resetValue={15}
              onChange={(value) =>
                setPointColor({ ...pointColor, variance: value })
              }
            />
            <AdjustSlider
              label="Point hue"
              value={a.hsl[pointColor.band].hue}
              onChange={(value) =>
                setHslAdjustment(pointColor.band, "hue", value)
              }
            />
            <AdjustSlider
              label="Point saturation"
              value={a.hsl[pointColor.band].saturation}
              onChange={(value) =>
                setHslAdjustment(pointColor.band, "saturation", value)
              }
            />
            <AdjustSlider
              label="Point luminance"
              value={a.hsl[pointColor.band].luminance}
              onChange={(value) =>
                setHslAdjustment(pointColor.band, "luminance", value)
              }
            />
          </div>
        )}
        {sampleMode && (
          <p className="panel-note active-note">
            {sampleMode === "whiteBalance"
              ? "Click a neutral gray or white point in the photo."
              : "Click the color you want to refine in the photo."}
          </p>
        )}
        <AdjustSlider
          label="Temperature"
          value={a.temperature}
          onChange={(v) => setAdjustment("temperature", v)}
        />
        <AdjustSlider
          label="Tint"
          value={a.tint}
          onChange={(v) => setAdjustment("tint", v)}
        />
        <AdjustSlider
          label="Hue"
          value={a.hue}
          min={-180}
          max={180}
          onChange={(v) => setAdjustment("hue", v)}
        />
        <AdjustSlider
          label="Vibrance"
          value={a.vibrance}
          onChange={(v) => setAdjustment("vibrance", v)}
        />
        <AdjustSlider
          label="Saturation"
          value={a.saturation}
          onChange={(v) => setAdjustment("saturation", v)}
        />
        <div className="color-wheel">
          <i />
          <i />
          <i />
          <span>Color Mixer · HSL</span>
        </div>
      </Panel>
      <Panel title="Color mixer · HSL" open={false}>
        <div className="hsl-grid">
          {colorBands.map((band) => (
            <div className={`hsl-band band-${band}`} key={band}>
              <strong>
                <i />
                {band}
              </strong>
              <AdjustSlider
                label="Hue"
                value={a.hsl[band].hue}
                onChange={(v) => setHslAdjustment(band, "hue", v)}
              />
              <AdjustSlider
                label="Saturation"
                value={a.hsl[band].saturation}
                onChange={(v) => setHslAdjustment(band, "saturation", v)}
              />
              <AdjustSlider
                label="Luminance"
                value={a.hsl[band].luminance}
                onChange={(v) => setHslAdjustment(band, "luminance", v)}
              />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Color grading" open={false}>
        <div className="grading-row">
          <span style={{ "--h": a.shadowHue } as React.CSSProperties} />
          <div>
            <AdjustSlider
              label="Shadow hue"
              value={a.shadowHue}
              min={0}
              max={360}
              onChange={(v) => setAdjustment("shadowHue", v)}
            />
            <AdjustSlider
              label="Shadow saturation"
              value={a.shadowSaturation}
              min={0}
              onChange={(v) => setAdjustment("shadowSaturation", v)}
            />
          </div>
        </div>
        <div className="grading-row">
          <span style={{ "--h": a.midtoneHue } as React.CSSProperties} />
          <div>
            <AdjustSlider
              label="Midtone hue"
              value={a.midtoneHue}
              min={0}
              max={360}
              onChange={(v) => setAdjustment("midtoneHue", v)}
            />
            <AdjustSlider
              label="Midtone saturation"
              value={a.midtoneSaturation}
              min={0}
              onChange={(v) => setAdjustment("midtoneSaturation", v)}
            />
          </div>
        </div>
        <div className="grading-row">
          <span style={{ "--h": a.highlightHue } as React.CSSProperties} />
          <div>
            <AdjustSlider
              label="Highlight hue"
              value={a.highlightHue}
              min={0}
              max={360}
              onChange={(v) => setAdjustment("highlightHue", v)}
            />
            <AdjustSlider
              label="Highlight saturation"
              value={a.highlightSaturation}
              min={0}
              onChange={(v) => setAdjustment("highlightSaturation", v)}
            />
          </div>
        </div>
        <AdjustSlider
          label="Global hue"
          value={a.globalGradeHue}
          min={0}
          max={360}
          onChange={(v) => setAdjustment("globalGradeHue", v)}
        />
        <AdjustSlider
          label="Global saturation"
          value={a.globalGradeSaturation}
          min={0}
          onChange={(v) => setAdjustment("globalGradeSaturation", v)}
        />
        <AdjustSlider
          label="Blending"
          value={a.gradingBlending}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("gradingBlending", v)}
        />
        <AdjustSlider
          label="Balance"
          value={a.gradingBalance}
          onChange={(v) => setAdjustment("gradingBalance", v)}
        />
      </Panel>
      <Panel
        title="Soft proofing"
        badge={softProof ? proofProfile.toUpperCase() : "Off"}
        open={false}
      >
        <div className="choice-row wrap">
          <span>Proof profile</span>
          {(["srgb", "display-p3", "adobe-rgb", "prophoto-rgb"] as const).map(
            (profile) => (
              <button
                key={profile}
                className={proofProfile === profile ? "active" : ""}
                onClick={() => {
                  setProofProfile(profile);
                  setSoftProof(true);
                }}
              >
                {profile
                  .replace("-rgb", " RGB")
                  .replace("display-p3", "Display P3")}
              </button>
            ),
          )}
        </div>
        <div className="proof-actions">
          <button
            className={softProof ? "active" : ""}
            onClick={() => setSoftProof(!softProof)}
          >
            Soft proof {softProof ? "on" : "off"}
          </button>
          <button
            className={gamutWarnings ? "active" : ""}
            disabled={!softProof}
            onClick={() => setGamutWarnings(!gamutWarnings)}
          >
            Gamut warning
          </button>
        </div>
        <p className="panel-note">
          Magenta marks pixels near clipping or beyond the selected proof gamut.
        </p>
      </Panel>
      <Panel title="Profiles & calibration" open={false}>
        <div className="profile-strip">
          <button
            onClick={() => {
              setAdjustment("profileAmount", 100);
              setAdjustment("saturation", 0);
              setAdjustment("contrast", 0);
            }}
          >
            Neutral
          </button>
          <button
            onClick={() => {
              setAdjustment("profileAmount", 110);
              setAdjustment("vibrance", 14);
            }}
          >
            Vivid
          </button>
          <button
            onClick={() => {
              setAdjustment("profileAmount", 90);
              setAdjustment("contrast", -8);
            }}
          >
            Portrait
          </button>
          <button
            onClick={() => {
              setAdjustment("profileAmount", 105);
              setAdjustment("dehaze", 10);
            }}
          >
            Landscape
          </button>
        </div>
        <AdjustSlider
          label="Profile amount"
          value={a.profileAmount}
          min={0}
          max={200}
          resetValue={100}
          onChange={(v) => setAdjustment("profileAmount", v)}
        />
        <AdjustSlider
          label="Red primary hue"
          value={a.redPrimaryHue}
          onChange={(v) => setAdjustment("redPrimaryHue", v)}
        />
        <AdjustSlider
          label="Red primary saturation"
          value={a.redPrimarySaturation}
          onChange={(v) => setAdjustment("redPrimarySaturation", v)}
        />
        <AdjustSlider
          label="Green primary hue"
          value={a.greenPrimaryHue}
          onChange={(v) => setAdjustment("greenPrimaryHue", v)}
        />
        <AdjustSlider
          label="Green primary saturation"
          value={a.greenPrimarySaturation}
          onChange={(v) => setAdjustment("greenPrimarySaturation", v)}
        />
        <AdjustSlider
          label="Blue primary hue"
          value={a.bluePrimaryHue}
          onChange={(v) => setAdjustment("bluePrimaryHue", v)}
        />
        <AdjustSlider
          label="Blue primary saturation"
          value={a.bluePrimarySaturation}
          onChange={(v) => setAdjustment("bluePrimarySaturation", v)}
        />
      </Panel>
      <Panel title="B&W channel mixer" open={false}>
        <button
          className="mono-toggle"
          onClick={() =>
            setAdjustment("saturation", a.saturation === -100 ? 0 : -100)
          }
        >
          {a.saturation === -100
            ? "Return to color"
            : "Convert to black & white"}
        </button>
        {colorBands.map((band) => (
          <AdjustSlider
            key={band}
            label={`${band[0].toUpperCase()}${band.slice(1)} response`}
            value={a.bwMix[band]}
            onChange={(v) => setBwAdjustment(band, v)}
          />
        ))}
      </Panel>
      <Panel title="Detail" open={false}>
        <AdjustSlider
          label="Sharpening"
          value={a.sharpness}
          min={0}
          onChange={(v) => setAdjustment("sharpness", v)}
        />
        <AdjustSlider
          label="Radius"
          value={a.sharpRadius}
          min={0.5}
          max={3}
          step={0.1}
          resetValue={1}
          onChange={(v) => setAdjustment("sharpRadius", v)}
        />
        <AdjustSlider
          label="Detail"
          value={a.sharpDetail}
          min={0}
          resetValue={25}
          onChange={(v) => setAdjustment("sharpDetail", v)}
        />
        <AdjustSlider
          label="Masking"
          value={a.sharpMasking}
          min={0}
          onChange={(v) => setAdjustment("sharpMasking", v)}
        />
        <AdjustSlider
          label="Noise reduction"
          value={a.noise}
          min={0}
          onChange={(v) => setAdjustment("noise", v)}
        />
        <AdjustSlider
          label="Noise detail"
          value={a.noiseDetail}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("noiseDetail", v)}
        />
        <AdjustSlider
          label="Noise contrast"
          value={a.noiseContrast}
          min={0}
          onChange={(v) => setAdjustment("noiseContrast", v)}
        />
        <AdjustSlider
          label="Color noise"
          value={a.colorNoise}
          min={0}
          onChange={(v) => setAdjustment("colorNoise", v)}
        />
        <AdjustSlider
          label="Color detail"
          value={a.colorNoiseDetail}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("colorNoiseDetail", v)}
        />
        <AdjustSlider
          label="Smoothness"
          value={a.colorSmoothness}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("colorSmoothness", v)}
        />
      </Panel>
      <Panel title="Effects" open={false}>
        <AdjustSlider
          label="Texture"
          value={a.texture}
          onChange={(v) => setAdjustment("texture", v)}
        />
        <AdjustSlider
          label="Clarity"
          value={a.clarity}
          onChange={(v) => setAdjustment("clarity", v)}
        />
        <AdjustSlider
          label="Dehaze"
          value={a.dehaze}
          onChange={(v) => setAdjustment("dehaze", v)}
        />
        <AdjustSlider
          label="Vignette"
          value={a.vignette}
          onChange={(v) => setAdjustment("vignette", v)}
        />
        <AdjustSlider
          label="Midpoint"
          value={a.vignetteMidpoint}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("vignetteMidpoint", v)}
        />
        <AdjustSlider
          label="Roundness"
          value={a.vignetteRoundness}
          onChange={(v) => setAdjustment("vignetteRoundness", v)}
        />
        <AdjustSlider
          label="Feather"
          value={a.vignetteFeather}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("vignetteFeather", v)}
        />
        <AdjustSlider
          label="Highlights"
          value={a.vignetteHighlights}
          min={0}
          onChange={(v) => setAdjustment("vignetteHighlights", v)}
        />
        <AdjustSlider
          label="Grain"
          value={a.grain}
          min={0}
          onChange={(v) => setAdjustment("grain", v)}
        />
        <AdjustSlider
          label="Size"
          value={a.grainSize}
          min={0}
          resetValue={25}
          onChange={(v) => setAdjustment("grainSize", v)}
        />
        <AdjustSlider
          label="Roughness"
          value={a.grainRoughness}
          min={0}
          resetValue={50}
          onChange={(v) => setAdjustment("grainRoughness", v)}
        />
      </Panel>
      <Panel
        title="Retouch"
        badge={
          photo.retouchSpots.length ? `${photo.retouchSpots.length}` : "Local"
        }
      >
        <p className="panel-note">
          Heal and Clone use two clicks: choose a clean source, then the repair
          target. Remove and eye correction use one click.
        </p>
        <div className="retouch-tools">
          {(
            [
              ["heal", "Heal"],
              ["clone", "Clone"],
              ["remove", "Remove"],
              ["redEye", "Red / pet eye"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              className={retouchMode === mode ? "active" : ""}
              onClick={() => setRetouchMode(retouchMode === mode ? null : mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <AdjustSlider
          label="Brush size"
          value={retouchSize}
          min={2}
          max={30}
          resetValue={9}
          onChange={setRetouchSize}
        />
        <AdjustSlider
          label="Edge feather"
          value={retouchFeather}
          min={0}
          max={100}
          resetValue={55}
          onChange={setRetouchFeather}
        />
        {retouchMode && (
          <button className="cancel-mask" onClick={() => setRetouchMode(null)}>
            Finish retouching
          </button>
        )}
        <div className="retouch-list">
          {photo.retouchSpots.map((spot, index) => (
            <details key={spot.id}>
              <summary>
                <span>
                  {index + 1}.{" "}
                  {spot.mode === "redEye" ? "Eye correction" : spot.mode}
                </span>
                <button
                  aria-label={`Delete retouch ${index + 1}`}
                  onClick={(event) => {
                    event.preventDefault();
                    deleteRetouchSpot(spot.id);
                  }}
                >
                  <Trash2 />
                </button>
              </summary>
              {spot.mode !== "redEye" && (
                <>
                  <AdjustSlider
                    label="Source X"
                    value={Math.round(spot.sourceX * 100)}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateRetouchSpot(spot.id, { sourceX: value / 100 })
                    }
                  />
                  <AdjustSlider
                    label="Source Y"
                    value={Math.round(spot.sourceY * 100)}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      updateRetouchSpot(spot.id, { sourceY: value / 100 })
                    }
                  />
                </>
              )}
              <AdjustSlider
                label="Size"
                value={spot.size}
                min={2}
                max={30}
                resetValue={9}
                onChange={(value) =>
                  updateRetouchSpot(spot.id, { size: value })
                }
              />
              <AdjustSlider
                label="Feather"
                value={spot.feather}
                min={0}
                max={100}
                resetValue={55}
                onChange={(value) =>
                  updateRetouchSpot(spot.id, { feather: value })
                }
              />
            </details>
          ))}
        </div>
        {!!photo.retouchSpots.length && (
          <button className="cancel-mask" onClick={clearRetouchSpots}>
            Clear all retouching
          </button>
        )}
      </Panel>
      <Panel
        title="Magic local masks"
        badge={photo.masks.length ? `${photo.masks.length}` : "Local"}
      >
        <p className="panel-note">
          Choose a subject-aware, gradient, or sampled range mask, then click
          the image to place or sample it.
        </p>
        <div className="mask-tools">
          {(
            [
              ["brush", "Brush"],
              ["point", "Magic point"],
              ["hair", "Hair"],
              ["skin", "Skin"],
              ["clothes", "Clothes"],
              ["sky", "Sky"],
              ["linear", "Linear"],
              ["radial", "Radial"],
              ["luminance", "Luminance"],
              ["color", "Color range"],
            ] as const
          ).map(([value, name], i) => (
            <button
              className={maskTarget === value ? "active" : ""}
              key={value}
              onClick={() => setMaskTarget(maskTarget === value ? null : value)}
            >
              <span className={`mask m${i % 6}`} />
              {name}
            </button>
          ))}
        </div>
        {maskTarget === "brush" && (
          <div className="brush-mask-controls">
            <AdjustSlider
              label="Brush size"
              value={maskBrushSize}
              min={4}
              max={80}
              resetValue={24}
              onChange={setMaskBrushSize}
            />
            <AdjustSlider
              label="Flow"
              value={maskBrushFlow}
              min={1}
              max={100}
              resetValue={75}
              onChange={setMaskBrushFlow}
            />
            <AdjustSlider
              label="Density"
              value={maskBrushDensity}
              min={1}
              max={100}
              resetValue={100}
              onChange={setMaskBrushDensity}
            />
            <button
              className={maskAuto ? "active" : ""}
              onClick={() => setMaskAuto(!maskAuto)}
            >
              Auto-mask {maskAuto ? "on" : "off"}
            </button>
          </div>
        )}
        <AdjustSlider
          label="Range tolerance"
          value={maskTolerance}
          min={2}
          max={60}
          resetValue={28}
          onChange={setMaskTolerance}
        />
        <AdjustSlider
          label="Edge feather"
          value={maskFeather}
          min={0}
          max={30}
          resetValue={6}
          onChange={setMaskFeather}
        />
        {maskTarget && (
          <button className="cancel-mask" onClick={() => setMaskTarget(null)}>
            Cancel selection
          </button>
        )}
        <div className="mask-list">
          {photo.masks.map((mask) => (
            <button
              key={mask.id}
              className={selectedMaskId === mask.id ? "active" : ""}
              onClick={() => setSelectedMaskId(mask.id)}
            >
              <i className={`mask-chip ${mask.target}`} />
              <span>{mask.name}</span>
              <em>{mask.visible ? "Visible" : "Hidden"}</em>
            </button>
          ))}
        </div>
        {selectedMask && (
          <div className="mask-editor">
            <label className="meta-field">
              <span>Mask name</span>
              <input
                value={selectedMask.name}
                onChange={(event) =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <div className="mask-actions">
              <button
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    visible: !mask.visible,
                  }))
                }
              >
                {selectedMask.visible ? "Hide overlay" : "Show overlay"}
              </button>
              <button
                className={selectedMask.inverted ? "active" : ""}
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    inverted: !mask.inverted,
                  }))
                }
              >
                Invert
              </button>
              <button onClick={() => duplicateMask(selectedMask)}>
                Duplicate
              </button>
              <button onClick={() => deleteMask(selectedMask.id)}>
                Delete
              </button>
            </div>
            <div className="mask-overlay-controls">
              <span>Overlay</span>
              {["#b6f36b", "#ff5b68", "#65b8ff", "#f0c45a", "#c887ff"].map(
                (color) => (
                  <button
                    key={color}
                    aria-label={`Use ${color} overlay`}
                    className={
                      selectedMask.overlayColor === color ? "active" : ""
                    }
                    style={{ background: color }}
                    onClick={() =>
                      updateMask(selectedMask.id, (mask) => ({
                        ...mask,
                        overlayColor: color,
                      }))
                    }
                  />
                ),
              )}
            </div>
            <AdjustSlider
              label="Overlay opacity"
              value={selectedMask.overlayOpacity}
              min={5}
              max={90}
              resetValue={48}
              onChange={(value) =>
                updateMask(selectedMask.id, (mask) => ({
                  ...mask,
                  overlayOpacity: value,
                }))
              }
            />
            {photo.masks.length > 1 && (
              <div className="mask-combine">
                <select
                  aria-label="Mask to combine"
                  value={combineMaskId}
                  onChange={(event) => setCombineMaskId(event.target.value)}
                >
                  <option value="">Choose another mask</option>
                  {photo.masks
                    .filter((mask) => mask.id !== selectedMask.id)
                    .map((mask) => (
                      <option key={mask.id} value={mask.id}>
                        {mask.name}
                      </option>
                    ))}
                </select>
                <div>
                  <button
                    disabled={!combineMaskId}
                    onClick={() => void combineMasks("add")}
                  >
                    Add
                  </button>
                  <button
                    disabled={!combineMaskId}
                    onClick={() => void combineMasks("subtract")}
                  >
                    Subtract
                  </button>
                  <button
                    disabled={!combineMaskId}
                    onClick={() => void combineMasks("intersect")}
                  >
                    Intersect
                  </button>
                </div>
              </div>
            )}
            <div className="mask-presets">
              <button
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    adjustments: {
                      ...defaultLocal,
                      exposure: 0.3,
                      shadows: 18,
                      clarity: -12,
                      texture: -18,
                    },
                  }))
                }
              >
                Portrait soften
              </button>
              <button
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    adjustments: {
                      ...defaultLocal,
                      highlights: -28,
                      dehaze: 18,
                      saturation: 12,
                    },
                  }))
                }
              >
                Sky recover
              </button>
              <button
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    adjustments: {
                      ...defaultLocal,
                      clarity: 22,
                      texture: 28,
                      sharpness: 20,
                    },
                  }))
                }
              >
                Detail lift
              </button>
              <button
                onClick={() =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    adjustments: { ...defaultLocal },
                  }))
                }
              >
                Reset local
              </button>
            </div>
            {photo.masks.length > 1 && (
              <button
                className="mask-batch"
                onClick={() =>
                  photo.masks.forEach((mask) =>
                    updateMask(mask.id, (current) => ({
                      ...current,
                      adjustments: { ...selectedMask.adjustments },
                    })),
                  )
                }
              >
                Adapt these settings to all masks
              </button>
            )}
            {(
              [
                ["exposure", "Exposure", -3, 3, 0.05],
                ["contrast", "Contrast", -100, 100, 1],
                ["highlights", "Highlights", -100, 100, 1],
                ["shadows", "Shadows", -100, 100, 1],
                ["saturation", "Saturation", -100, 100, 1],
                ["vibrance", "Vibrance", -100, 100, 1],
                ["hue", "Hue", -180, 180, 1],
                ["temperature", "Temperature", -100, 100, 1],
                ["tint", "Tint", -100, 100, 1],
                ["clarity", "Clarity", -100, 100, 1],
                ["texture", "Texture", -100, 100, 1],
                ["dehaze", "Dehaze", -100, 100, 1],
                ["sharpness", "Sharpness", -100, 100, 1],
                ["noise", "Noise reduction", 0, 100, 1],
                ["curveShadows", "Curve shadows", -100, 100, 1],
                ["curveMidtones", "Curve midtones", -100, 100, 1],
                ["curveHighlights", "Curve highlights", -100, 100, 1],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <AdjustSlider
                key={key}
                label={label}
                value={selectedMask.adjustments[key]}
                min={min}
                max={max}
                step={step}
                onChange={(value) =>
                  updateMask(selectedMask.id, (mask) => ({
                    ...mask,
                    adjustments: { ...mask.adjustments, [key]: value },
                  }))
                }
              />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
function PurePanels({
  photo,
  setAdjustment,
  selectedPreset,
  choosePreset,
  autoEnhance,
}: {
  photo: RuntimePhoto;
  setAdjustment: (k: keyof Adjustments, v: number) => void;
  selectedPreset: PresetChoice;
  choosePreset: (
    id: string,
    name: string,
    settings: Partial<Adjustments>,
  ) => void;
  autoEnhance: () => void;
}) {
  const a = photo.adjustments;
  return (
    <>
      <div className="enhance-hero pure-hero">
        <div>
          <Sparkles />
          <span>LibrePure</span>
        </div>
        <p>
          Clean preprocessing, optical correction, and detail recovery on this
          device.
        </p>
        <button onClick={autoEnhance}>
          <WandSparkles /> Process photo
        </button>
      </div>
      <Panel title="Processing quality" badge="Local">
        <div className="recipe-buttons">
          <button
            className={
              selectedPreset?.id === "quality-hq" ? "preset-selected" : ""
            }
            onClick={() =>
              choosePreset("quality-hq", "HQ", {
                noise: 14,
                colorNoise: 18,
                sharpness: 30,
                sharpDetail: 30,
              })
            }
          >
            <strong>HQ</strong>
            <span>Fast, natural cleanup</span>
          </button>
          <button
            className={
              selectedPreset?.id === "quality-deep" ? "preset-selected" : ""
            }
            onClick={() =>
              choosePreset("quality-deep", "Deep", {
                noise: 34,
                colorNoise: 38,
                sharpness: 38,
                sharpDetail: 38,
              })
            }
          >
            <strong>Deep</strong>
            <span>High-ISO recovery</span>
          </button>
          <button
            className={
              selectedPreset?.id === "quality-detail" ? "preset-selected" : ""
            }
            onClick={() =>
              choosePreset("quality-detail", "Detail+", {
                noise: 22,
                colorNoise: 24,
                sharpness: 54,
                sharpDetail: 52,
                lensSharpness: 34,
              })
            }
          >
            <strong>Detail+</strong>
            <span>Fine texture priority</span>
          </button>
        </div>
      </Panel>
      <Panel title="Deep Denoise" badge={a.noise ? "On" : "Off"}>
        <AdjustSlider
          label="Luminance"
          value={a.noise}
          min={0}
          onChange={(v) => setAdjustment("noise", v)}
        />
        <AdjustSlider
          label="Color noise"
          value={a.colorNoise}
          min={0}
          onChange={(v) => setAdjustment("colorNoise", v)}
        />
        <AdjustSlider
          label="Detail"
          value={a.sharpness}
          min={0}
          onChange={(v) => setAdjustment("sharpness", v)}
        />
        <AdjustSlider
          label="Detail recovery"
          value={a.sharpDetail}
          min={0}
          onChange={(v) => setAdjustment("sharpDetail", v)}
        />
        <p className="panel-note">
          <span className="local-dot" /> Preview and export processing run
          locally.
        </p>
      </Panel>
      <Panel title="Optics profile" badge="Auto">
        <div className="profile-card">
          <Aperture />
          <div>
            <strong>Automatic lens profile</strong>
            <span>Manual correction remains available without metadata</span>
          </div>
          <Check />
        </div>
        <AdjustSlider
          label="Lens sharpness"
          value={a.lensSharpness}
          min={0}
          onChange={(v) => setAdjustment("lensSharpness", v)}
        />
        <AdjustSlider
          label="Lens vignetting"
          value={a.lensVignette}
          onChange={(v) => setAdjustment("lensVignette", v)}
        />
        <AdjustSlider
          label="Distortion"
          value={a.distortion}
          onChange={(v) => setAdjustment("distortion", v)}
        />
        <AdjustSlider
          label="Chromatic aberration"
          value={a.chromatic}
          min={0}
          onChange={(v) => setAdjustment("chromatic", v)}
        />
        <AdjustSlider
          label="Defringe"
          value={a.defringe}
          min={0}
          onChange={(v) => setAdjustment("defringe", v)}
        />
      </Panel>
      <Panel title="Geometry">
        <div className="geometry-tools">
          <button
            onClick={() => {
              setAdjustment("perspectiveV", 0);
              setAdjustment("perspectiveH", 0);
              setAdjustment("rotation", 0);
            }}
          >
            Auto
          </button>
          <button onClick={() => setAdjustment("rotation", 0)}>Level</button>
          <button onClick={() => setAdjustment("perspectiveV", 0)}>
            Vertical
          </button>
          <button
            onClick={() => {
              setAdjustment("perspectiveV", 0);
              setAdjustment("perspectiveH", 0);
              setAdjustment("perspectiveAspect", 0);
            }}
          >
            Full
          </button>
        </div>
        <AdjustSlider
          label="Vertical"
          value={a.perspectiveV}
          onChange={(v) => setAdjustment("perspectiveV", v)}
        />
        <AdjustSlider
          label="Horizontal"
          value={a.perspectiveH}
          onChange={(v) => setAdjustment("perspectiveH", v)}
        />
        <AdjustSlider
          label="Rotate"
          value={a.rotation}
          min={-180}
          max={180}
          onChange={(v) => setAdjustment("rotation", v)}
        />
        <AdjustSlider
          label="Aspect"
          value={a.perspectiveAspect}
          onChange={(v) => setAdjustment("perspectiveAspect", v)}
        />
        <AdjustSlider
          label="Scale"
          value={a.perspectiveScale}
          min={50}
          max={150}
          onChange={(v) => setAdjustment("perspectiveScale", v)}
        />
        <AdjustSlider
          label="X offset"
          value={a.offsetX}
          onChange={(v) => setAdjustment("offsetX", v)}
        />
        <AdjustSlider
          label="Y offset"
          value={a.offsetY}
          onChange={(v) => setAdjustment("offsetY", v)}
        />
        <div className="flip-row">
          <button
            className={a.flipX < 0 ? "active" : ""}
            onClick={() => setAdjustment("flipX", a.flipX * -1)}
          >
            Flip horizontal
          </button>
          <button
            className={a.flipY < 0 ? "active" : ""}
            onClick={() => setAdjustment("flipY", a.flipY * -1)}
          >
            Flip vertical
          </button>
        </div>
      </Panel>
      <Panel title="Local contrast" open={false}>
        <AdjustSlider
          label="Fine"
          value={a.texture}
          onChange={(v) => setAdjustment("texture", v)}
        />
        <AdjustSlider
          label="Medium"
          value={a.clarity}
          onChange={(v) => setAdjustment("clarity", v)}
        />
        <AdjustSlider
          label="Atmosphere"
          value={a.dehaze}
          onChange={(v) => setAdjustment("dehaze", v)}
        />
      </Panel>
    </>
  );
}

function CreativePanels({
  photo,
  setAdjustment,
  applyPreset,
  selectedPreset,
  choosePreset,
}: {
  photo: RuntimePhoto;
  setAdjustment: (k: keyof Adjustments, v: number) => void;
  applyPreset: (settings: Partial<Adjustments>) => void;
  selectedPreset: PresetChoice;
  choosePreset: (
    id: string,
    name: string,
    settings: Partial<Adjustments>,
  ) => void;
}) {
  const a = photo.adjustments;
  return (
    <>
      <div className="enhance-hero creative-hero">
        <div>
          <Sparkles />
          <span>LibreFX</span>
        </div>
        <p>
          Stackable color, monochrome, analog, detail, and HDR-inspired
          treatments.
        </p>
        <button
          onClick={() =>
            applyPreset({ contrast: 16, vibrance: 18, clarity: 10, bloom: 8 })
          }
        >
          <WandSparkles /> Balanced creative edit
        </button>
      </div>
      <Panel title="Recipe browser" badge={`${creativeRecipes.length} looks`}>
        <div className="look-grid">
          {creativeRecipes.map((recipe) => (
            <button
              key={recipe.name}
              className={
                selectedPreset?.id === `creative-${recipe.name}`
                  ? "preset-selected"
                  : ""
              }
              style={{ "--look": recipe.tone } as React.CSSProperties}
              onClick={() =>
                choosePreset(
                  `creative-${recipe.name}`,
                  recipe.name,
                  recipe.settings,
                )
              }
            >
              <i />
              <span>
                <strong>{recipe.name}</strong>
                <small>{recipe.family}</small>
              </span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Color & tone">
        <AdjustSlider
          label="Color intensity"
          value={a.vibrance}
          onChange={(v) => setAdjustment("vibrance", v)}
        />
        <AdjustSlider
          label="Tonal contrast"
          value={a.contrast}
          onChange={(v) => setAdjustment("contrast", v)}
        />
        <AdjustSlider
          label="Structure"
          value={a.clarity}
          onChange={(v) => setAdjustment("clarity", v)}
        />
        <AdjustSlider
          label="Atmosphere"
          value={a.dehaze}
          onChange={(v) => setAdjustment("dehaze", v)}
        />
        <AdjustSlider
          label="Soft bloom"
          value={a.bloom}
          min={0}
          onChange={(v) => setAdjustment("bloom", v)}
        />
      </Panel>
      <Panel title="Analog effects">
        <AdjustSlider
          label="Halation"
          value={a.halation}
          min={0}
          onChange={(v) => setAdjustment("halation", v)}
        />
        <AdjustSlider
          label="Chromatic shift"
          value={a.chromaticShift}
          min={0}
          onChange={(v) => setAdjustment("chromaticShift", v)}
        />
        <AdjustSlider
          label="Glass distortion"
          value={a.glassDistortion}
          min={0}
          onChange={(v) => setAdjustment("glassDistortion", v)}
        />
        <AdjustSlider
          label="Paper texture"
          value={a.paperTexture}
          min={0}
          onChange={(v) => setAdjustment("paperTexture", v)}
        />
        <AdjustSlider
          label="Light leak"
          value={a.lightLeak}
          min={0}
          onChange={(v) => setAdjustment("lightLeak", v)}
        />
      </Panel>
      <Panel title="Focused adjustments" open={false}>
        <div className="recipe-buttons">
          <button onClick={() => applyPreset({ highlights: -28, shadows: 32 })}>
            <strong>Recover</strong>
            <span>Balance highlights</span>
          </button>
          <button onClick={() => applyPreset({ texture: -24, clarity: -8 })}>
            <strong>Portrait</strong>
            <span>Softer skin detail</span>
          </button>
          <button onClick={() => applyPreset({ clarity: 28, dehaze: 18 })}>
            <strong>Landscape</strong>
            <span>Depth and structure</span>
          </button>
        </div>
      </Panel>
    </>
  );
}

function FilmPanels({
  photo,
  setAdjustment,
  applyPreset,
  selectedPreset,
  choosePreset,
}: {
  photo: RuntimePhoto;
  setAdjustment: (k: keyof Adjustments, v: number) => void;
  applyPreset: (settings: Partial<Adjustments>) => void;
  selectedPreset: PresetChoice;
  choosePreset: (
    id: string,
    name: string,
    settings: Partial<Adjustments>,
  ) => void;
}) {
  const a = photo.adjustments;
  return (
    <>
      <div className="enhance-hero film-hero">
        <div>
          <Sparkles />
          <span>LibreFilm</span>
        </div>
        <p>
          Original analog-inspired renderings with editable grain, aging, and
          darkroom effects.
        </p>
        <button onClick={() => applyPreset(filmLooks[0].settings)}>
          <WandSparkles /> Apply featured look
        </button>
      </div>
      <Panel title="Film library" badge={`${filmLooks.length} stocks`}>
        <div className="look-grid film-look-grid">
          {filmLooks.map((look) => (
            <button
              key={look.name}
              className={
                selectedPreset?.id === `film-${look.name}`
                  ? "preset-selected"
                  : ""
              }
              style={{ "--look": look.tone } as React.CSSProperties}
              onClick={() =>
                choosePreset(`film-${look.name}`, look.name, look.settings)
              }
            >
              <i />
              <span>
                <strong>{look.name}</strong>
                <small>{look.era}</small>
              </span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Rendering">
        <AdjustSlider
          label="Film intensity"
          value={a.filmIntensity}
          min={0}
          max={100}
          resetValue={100}
          onChange={(v) => setAdjustment("filmIntensity", v)}
        />
        <AdjustSlider
          label="Fade"
          value={a.fade}
          min={0}
          onChange={(v) => setAdjustment("fade", v)}
        />
        <AdjustSlider
          label="Age"
          value={a.age}
          min={0}
          onChange={(v) => setAdjustment("age", v)}
        />
        <AdjustSlider
          label="Halation"
          value={a.halation}
          min={0}
          onChange={(v) => setAdjustment("halation", v)}
        />
      </Panel>
      <Panel title="Film grain">
        <AdjustSlider
          label="Amount"
          value={a.grain}
          min={0}
          onChange={(v) => setAdjustment("grain", v)}
        />
        <AdjustSlider
          label="Size"
          value={a.grainSize}
          min={0}
          onChange={(v) => setAdjustment("grainSize", v)}
        />
        <AdjustSlider
          label="Roughness"
          value={a.grainRoughness}
          min={0}
          onChange={(v) => setAdjustment("grainRoughness", v)}
        />
      </Panel>
      <Panel title="Print character" open={false}>
        <AdjustSlider
          label="Paper texture"
          value={a.paperTexture}
          min={0}
          onChange={(v) => setAdjustment("paperTexture", v)}
        />
        <AdjustSlider
          label="Light leak"
          value={a.lightLeak}
          min={0}
          onChange={(v) => setAdjustment("lightLeak", v)}
        />
        <AdjustSlider
          label="Vignette"
          value={a.vignette}
          onChange={(v) => setAdjustment("vignette", v)}
        />
        <div className="film-options">
          <button
            onClick={() =>
              applyPreset({ saturation: -100, contrast: 24, grain: 24 })
            }
          >
            Classic mono
          </button>
          <button
            onClick={() =>
              applyPreset({
                shadowHue: 220,
                shadowSaturation: 14,
                highlightHue: 42,
                highlightSaturation: 18,
              })
            }
          >
            Split tone
          </button>
          <button
            onClick={() => applyPreset({ age: 44, fade: 28, paperTexture: 24 })}
          >
            Aged print
          </button>
          <button
            onClick={() =>
              applyPreset({ halation: 36, lightLeak: 28, grain: 22 })
            }
          >
            Light struck
          </button>
        </div>
      </Panel>
    </>
  );
}

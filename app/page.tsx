"use client";

/* eslint-disable @next/next/no-img-element */

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
  Heart,
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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Slider } from "@/components/ui/slider";
import * as exifr from "exifr";
import {
  decodeEditableSource,
  decodeRawLinear,
  isRawFile,
  isTiffFile,
  type RawDecodeInfo,
} from "./image-codecs";
import {
  applyDepthAwareLensBlur,
  applyFilmGrain,
  applyTiledDetail,
  estimateGpuBudget,
} from "./image-processing";
import { createPreviewInWorker } from "./image-worker-pool";
import { VideoLab } from "./video-lab";
import {
  convertImageColorSpace,
  encodeHdrFloat32,
  encodeLinearRgb16,
  encodeRgb16,
  mergeHdrFloat32,
} from "./advanced-engine";
import {
  applyLinearDevelop,
  applyLinearEffectLayers,
  applyLinearMask,
  finishLinearRaw,
  resampleLinearRaw,
} from "./linear-raw-engine";
import {
  buildSemanticAiMask,
  installLocalAiPack,
  localAiPackState,
  runNeuralRestore,
} from "./local-ai";
import {
  cacheFilmHistoryImages,
  filmHistory,
  installMeasuredOpticsPack,
  installSpectralFilmPack,
  loadInstalledOpticsPack,
  loadSpectralFilmPack,
  openPackCredits,
  spectralProfileSettings,
  type SpectralFilmProfile,
} from "./open-packs";
import {
  availableCollisionName,
  defaultLabelDefinitions,
  editFingerprint,
  evaluateCull,
  landscapeMaskTargets,
  normalizeLabels,
  personMaskTargets,
  refineMaskAlpha,
  type LabelDefinition,
  type CullPreferences,
  type DetailedCullScores,
  type LandscapeMaskTarget,
  type PersonMaskTarget,
} from "./lightroom-2026";
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
type ExportFormat = "jpeg" | "png" | "webp" | "avif" | "tiff" | "dng";
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
  | "polygon"
  | "luminance"
  | "color"
  | "depth"
  | "subject"
  | "background"
  | "object"
  | "person"
  | "face"
  | "eyes"
  | "teeth"
  | LandscapeMaskTarget
  | PersonMaskTarget;
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
  moire: number;
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
type RetouchMode = "heal" | "clone" | "remove" | "generativeRemove" | "redEye";
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
  baseDataUrl?: string;
  tolerance: number;
  feather: number;
  edge: number;
  visible: boolean;
  inverted: boolean;
  overlayColor: string;
  overlayOpacity: number;
  pinX: number;
  pinY: number;
  adjustments: LocalAdjustments;
  sourceFingerprint?: string;
};
type DevelopSnapshot = {
  id: string;
  name: string;
  createdAt: number;
  adjustments: Adjustments;
};
type EffectBlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light"
  | "color"
  | "luminosity";
type EffectLayer = {
  id: string;
  name: string;
  enabled: boolean;
  opacity: number;
  blendMode: EffectBlendMode;
  settings: Partial<Adjustments>;
};
type ReviewComment = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  resolved: boolean;
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
  hdrGain: number;
  wideGamut: number;
  volumeDeform: number;
  glareReduction: number;
  reflectionQuality: number;
  dustRemoval: number;
  highlightRecovery: number;
  hotPixelRepair: number;
  moireReduction: number;
  neuralDenoise: number;
  deconvolution: number;
  coarseContrast: number;
  superResolution: number;
  lensBlur: number;
  lensBlurFocus: number;
  lensBlurHighlights: number;
  lensBlurBokeh: number;
  cornerSharpness: number;
  apertureCorrection: number;
  negativeInversion: number;
  paperGrade: number;
  darkroomFilter: number;
  textureAsset: number;
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
  faceScores?: number[];
  subject?: number;
  blur?: number;
  duplicate?: number;
  shallowDepth?: number;
};

function perceptualHashDistance(a: string, b: string) {
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
}

const defaultCullPreferences: CullPreferences = {
  focusStrictness: 55,
  exposureStrictness: 50,
  protectShallowDepth: true,
};

function detailedCullScores(cull: CullScores): DetailedCullScores {
  return {
    subjectSharpness: cull.subject ?? cull.focus,
    eyeSharpness:
      cull.faceScores?.length
        ? Math.max(...cull.faceScores)
        : cull.faces
          ? cull.focus
          : cull.subject ?? cull.focus,
    eyesOpen: cull.faces ? Math.min(100, 48 + cull.focus * 0.52) : 0,
    exposure: cull.exposure,
    blur: cull.blur ?? 100 - cull.focus,
    duplicate: cull.duplicate ?? cull.similarity,
    shallowDepthConfidence: cull.shallowDepth ?? 0,
  };
}
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
  stackCover?: boolean;
  missing: boolean;
  processVersion: "2026" | "2025";
  previewBlob: Blob | null;
  displayBlob: Blob | null;
  sourceBitDepth: number;
  rawInfo: RawDecodeInfo | null;
  aiHistory: Array<{
    id: string;
    action: string;
    model: string;
    createdAt: number;
  }>;
  peopleCluster: string;
  snapshots: DevelopSnapshot[];
  effectStack: EffectLayer[];
  reviewComments: ReviewComment[];
  reviewLikes: string[];
  importMethod: ImportMethod;
  sourceHandle: StoredFileHandle | null;
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
  favorite: boolean;
};
type DirectoryPermissionState =
  | "ready"
  | "needs-permission"
  | "unsupported"
  | "none";
type ImportMethod = "copy" | "add" | "move";
type AlbumRecord = {
  id: string;
  name: string;
  photoIds: string[];
  createdAt: number;
  kind: "album" | "set" | "smart" | "quick";
  parentId: string | null;
  rule: "five-stars" | "flagged" | "edited" | "people" | null;
  target: boolean;
  advancedRule?: SmartAlbumRule;
};
type SmartAlbumRule =
  | { op: "and" | "or"; rules: SmartAlbumRule[] }
  | {
      field: "rating" | "flagged" | "rejected" | "label" | "camera" | "keyword";
      operator: "equals" | "at-least" | "contains";
      value: string | number | boolean;
    };

function matchesSmartAlbum(photo: RuntimePhoto, rule: SmartAlbumRule): boolean {
  if ("op" in rule)
    return rule.op === "and"
      ? rule.rules.every((item) => matchesSmartAlbum(photo, item))
      : rule.rules.some((item) => matchesSmartAlbum(photo, item));
  const source =
    rule.field === "keyword"
      ? photo.metadata.keywords.join(" ")
      : rule.field === "camera"
        ? photo.metadata.camera
        : photo[rule.field];
  if (rule.operator === "at-least") return Number(source) >= Number(rule.value);
  if (rule.operator === "contains")
    return String(source).toLowerCase().includes(String(rule.value).toLowerCase());
  return source === rule.value;
}
type ExportRecipe = {
  id: string;
  name: string;
  format: ExportFormat;
  quality: number;
  scale: number;
  longEdge: number;
  resolution: number;
  outputSharpen: "none" | "screen" | "matte" | "glossy";
  suffix: string;
  watermark: string;
};
type ProgressJob = {
  id: string;
  name: string;
  kind: "import" | "analyze" | "export" | "merge";
  progress: number;
  status: "queued" | "running" | "paused" | "done" | "cancelled" | "failed";
};
type PublishService = {
  id: string;
  name: string;
  endpoint: string;
  method: "POST" | "PUT";
};
type OpticsProfile = {
  id: string;
  version: number;
  camera: string;
  lens: string;
  settings: Partial<Adjustments>;
  source: "LibreLux community" | "User import" | "Measured open data";
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
interface StoredFileHandle extends WritableFileHandle {
  name: string;
  getFile: () => Promise<File>;
  queryPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: "read" }) => Promise<PermissionState>;
  remove?: () => Promise<void>;
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
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<StoredFileHandle[]>;
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
  moire: 0,
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
  hdrGain: 0,
  wideGamut: 0,
  volumeDeform: 0,
  glareReduction: 0,
  reflectionQuality: 2,
  dustRemoval: 0,
  highlightRecovery: 0,
  hotPixelRepair: 0,
  moireReduction: 0,
  neuralDenoise: 0,
  deconvolution: 0,
  coarseContrast: 0,
  superResolution: 100,
  lensBlur: 0,
  lensBlurFocus: 50,
  lensBlurHighlights: 20,
  lensBlurBokeh: 50,
  cornerSharpness: 0,
  apertureCorrection: 0,
  negativeInversion: 0,
  paperGrade: 0,
  darkroomFilter: 0,
  textureAsset: 0,
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
const communityOpticsProfiles: OpticsProfile[] = [
  {
    id: "community-standard-24",
    version: 1,
    camera: "Full-frame mirrorless",
    lens: "24 mm wide angle",
    settings: { distortion: 16, lensVignette: 18, cornerSharpness: 28 },
    source: "LibreLux community",
  },
  {
    id: "community-standard-50",
    version: 1,
    camera: "Full-frame mirrorless",
    lens: "50 mm standard",
    settings: { distortion: 3, lensVignette: 12, cornerSharpness: 18 },
    source: "LibreLux community",
  },
  {
    id: "community-portrait-85",
    version: 1,
    camera: "Interchangeable lens camera",
    lens: "85 mm portrait",
    settings: { distortion: -2, lensVignette: 16, cornerSharpness: 10 },
    source: "LibreLux community",
  },
];
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
      grainSize: 20,
      grainRoughness: 42,
      textureAsset: 1,
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
      grainSize: 14,
      grainRoughness: 32,
      textureAsset: 2,
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
      grainSize: 18,
      grainRoughness: 28,
      textureAsset: 1,
    },
  },
  {
    name: "Press 400",
    era: "1970s",
    tone: "#89877c",
    settings: {
      saturation: -100,
      contrast: 30,
      grain: 34,
      grainSize: 38,
      grainRoughness: 68,
      textureAsset: 3,
    },
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
      grainSize: 26,
      grainRoughness: 52,
      textureAsset: 2,
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
      grainSize: 30,
      grainRoughness: 38,
      textureAsset: 1,
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
      grainSize: 10,
      grainRoughness: 24,
      textureAsset: 2,
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
      grainSize: 22,
      grainRoughness: 34,
      textureAsset: 1,
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
      grainRoughness: 82,
      textureAsset: 3,
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
      grainSize: 8,
      grainRoughness: 18,
      textureAsset: 1,
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
  red: "var(--label-red, #f46d74)",
  yellow: "var(--label-yellow, #e6c34f)",
  green: "var(--label-green, #66bf8d)",
  blue: "var(--label-blue, #6ca7e8)",
  purple: "var(--label-purple, #a881d8)",
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
const defaultPanelOrder = [
  "My presets",
  "Light",
  "Color",
  "Color mixer",
  "Tone curve",
  "Detail",
  "Effects",
  "Magic local masks",
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
const binaryBuffers = new WeakMap<Blob, Promise<ArrayBuffer>>();
const blobBuffer = (blob: Blob) => {
  let buffer = binaryBuffers.get(blob);
  if (!buffer) {
    buffer = blob.arrayBuffer();
    binaryBuffers.set(blob, buffer);
  }
  return buffer;
};
async function serializePhoto(photo: PhotoRecord | RuntimePhoto) {
  const { url: _url, previewUrl: _previewUrl, ...stored } = photo as RuntimePhoto;
  void _url;
  void _previewUrl;
  const omitOriginal = stored.importMethod === "add" && stored.sourceHandle;
  return {
    ...stored,
    blob: omitOriginal ? new ArrayBuffer(0) : await blobBuffer(stored.blob),
    previewBlob: stored.previewBlob
      ? await blobBuffer(stored.previewBlob)
      : null,
    displayBlob: stored.displayBlob
      ? await blobBuffer(stored.displayBlob)
      : null,
  };
}
function deserializePhoto(record: PhotoRecord) {
  const stored = record as unknown as PhotoRecord & {
    blob: Blob | ArrayBuffer;
    previewBlob: Blob | ArrayBuffer | null;
    displayBlob: Blob | ArrayBuffer | null;
  };
  return {
    ...stored,
    blob:
      stored.blob instanceof Blob
        ? stored.blob
        : new Blob([stored.blob], { type: stored.type }),
    previewBlob:
      stored.previewBlob instanceof Blob
        ? stored.previewBlob
        : stored.previewBlob
          ? new Blob([stored.previewBlob], { type: "image/jpeg" })
          : null,
    displayBlob:
      stored.displayBlob instanceof Blob
        ? stored.displayBlob
        : stored.displayBlob
          ? new Blob([stored.displayBlob], { type: "image/png" })
          : null,
  } as PhotoRecord;
}
async function readPhotos(): Promise<PhotoRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("photos", "readonly")
      .objectStore("photos")
      .getAll();
    r.onsuccess = () =>
      resolve((r.result as PhotoRecord[]).map(deserializePhoto));
    r.onerror = () => reject(r.error);
  });
}
async function savePhoto(photo: PhotoRecord | RuntimePhoto) {
  const db = await openDb();
  const stored = await serializePhoto(photo);
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
  const tonal =
    (a.highlights +
      a.whites -
      a.blacks +
      a.shadows +
      a.highlightRecovery * 0.6 +
      a.hdrGain * 1.4 -
      a.glareReduction * 0.35) /
    900;
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
      a.lensSharpness / 1000 +
      a.coarseContrast / 220 +
      a.paperGrade / 500 +
      a.deconvolution / 1100 +
      a.cornerSharpness / 1400 +
      -a.fade / 260,
  );
  const saturation = Math.max(
    0,
    (1 +
      (a.saturation * intensity) / 100 +
      a.vibrance / 160 -
      (a.colorNoise + a.moireReduction * 0.35) / 1200 -
      a.age / 500 +
      hslSat +
      calibration +
      channelSat) *
      (a.profileAmount / 100) *
      (1 + a.wideGamut / 500),
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
    (a.noise +
      a.neuralDenoise * 0.7 +
      a.hotPixelRepair * 0.15 +
      a.moireReduction * 0.18 +
      a.dustRemoval * 0.1) /
      180 -
      a.sharpDetail / 3000 +
      a.bloom / 1300 +
      a.glassDistortion / 1800,
  );
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) sepia(${warmth}) hue-rotate(${hue + a.darkroomFilter}deg) invert(${a.negativeInversion / 100}) blur(${blur}px)`;
}
function localFilter(a: LocalAdjustments) {
  const light =
    a.exposure + a.highlights / 260 + a.shadows / 340 + a.curveMidtones / 300;
  const contrast =
    a.contrast / 100 +
    a.clarity / 260 +
    a.dehaze / 300 +
    (a.curveHighlights - a.curveShadows) / 360;
  const saturation =
    a.saturation / 100 + a.vibrance / 140 - Math.max(0, a.moire) / 320;
  const blur = Math.max(
    0,
    a.noise / 180 + Math.max(0, a.moire) / 900 - a.sharpness / 650 - a.texture / 900,
  );
  return `brightness(${Math.max(0.15, Math.pow(2, light))}) contrast(${Math.max(0.2, 1 + contrast)}) saturate(${Math.max(0, 1 + saturation)}) sepia(${Math.abs(a.temperature) / 650}) hue-rotate(${a.hue + (a.temperature < 0 ? -a.temperature / 18 : 0) + a.tint / 30}deg) blur(${blur}px)`;
}

async function maskAlphaAtSize(dataUrl: string, width: number, height: number) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Mask processing is unavailable");
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const alpha = new Float32Array(width * height);
  for (let pixel = 0; pixel < alpha.length; pixel++)
    alpha[pixel] = pixels[pixel * 4 + 3] / 255;
  return alpha;
}

async function refineMaskDataUrl(
  dataUrl: string,
  edge: number,
  feather: number,
) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new Error("Mask refinement is unavailable");
  sourceContext.drawImage(image, 0, 0);
  const pixels = sourceContext.getImageData(0, 0, source.width, source.height);
  const alpha = new Uint8ClampedArray(source.width * source.height);
  for (let index = 0; index < alpha.length; index++)
    alpha[index] = pixels.data[index * 4 + 3];
  const refined = refineMaskAlpha(alpha, source.width, source.height, edge);
  for (let index = 0; index < refined.length; index++)
    pixels.data[index * 4 + 3] = refined[index];
  sourceContext.putImageData(pixels, 0, 0);
  if (!feather) return source.toDataURL("image/png");
  const output = document.createElement("canvas");
  output.width = source.width;
  output.height = source.height;
  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("Mask feathering is unavailable");
  outputContext.filter = `blur(${Math.max(0.5, feather)}px)`;
  outputContext.drawImage(source, 0, 0);
  return output.toDataURL("image/png");
}

async function buildLinearRawExport(
  photo: RuntimePhoto,
  geometry: {
    sourceX: number;
    sourceY: number;
    sourceWidth: number;
    sourceHeight: number;
    width: number;
    height: number;
  },
  outputSharpen: "none" | "screen" | "matte" | "glossy",
) {
  const original =
    photo.sourceHandle && photo.importMethod === "add"
      ? await photo.sourceHandle.getFile()
      : new File([photo.blob], photo.name, { type: photo.type });
  const decoded = await decodeRawLinear(original);
  const ungraded = resampleLinearRaw(decoded, {
    ...geometry,
    rotation: photo.adjustments.rotation,
    flipX: photo.adjustments.flipX,
    flipY: photo.adjustments.flipY,
    perspectiveH: photo.adjustments.perspectiveH,
    perspectiveV: photo.adjustments.perspectiveV,
    perspectiveScale: photo.adjustments.perspectiveScale,
    distortion: photo.adjustments.distortion,
    anamorphic: photo.adjustments.anamorphic,
    offsetX: photo.adjustments.offsetX,
    offsetY: photo.adjustments.offsetY,
  });
  const effectLayers = photo.effectStack.filter(
    (item) => item.enabled && item.opacity > 0,
  );
  const masks = photo.masks.filter((item) => item.visible);
  const canProcessInPlace = effectLayers.length === 0 && masks.length === 0;
  let rendered = applyLinearDevelop(
    ungraded,
    photo.adjustments,
    canProcessInPlace,
  );
  if (effectLayers.length)
    rendered = applyLinearEffectLayers(
      ungraded,
      rendered,
      photo.adjustments,
      effectLayers,
    );
  for (const mask of masks) {
    rendered = applyLinearMask(
      ungraded,
      rendered,
      photo.adjustments,
      mask.adjustments,
      await maskAlphaAtSize(mask.dataUrl, rendered.width, rendered.height),
      mask.inverted,
    );
  }
  const sharpen =
    outputSharpen === "none" ? 0 : outputSharpen === "screen" ? 18 : 28;
  return finishLinearRaw(rendered, photo.adjustments, sharpen, true);
}

function applyComputationalCorrections(
  context: CanvasRenderingContext2D,
  adjustments: Adjustments,
) {
  if (
    adjustments.highlightRecovery <= 0 &&
    adjustments.hotPixelRepair <= 0 &&
    adjustments.dustRemoval <= 0 &&
    adjustments.moireReduction <= 0 &&
    adjustments.glareReduction === 0
  )
    return;
  const width = context.canvas.width;
  const height = context.canvas.height;
  const image = context.getImageData(0, 0, width, height);
  const source = new Uint8ClampedArray(image.data);
  const highlight = adjustments.highlightRecovery / 100;
  const repair = Math.max(
    adjustments.hotPixelRepair / 100,
    adjustments.dustRemoval / 150,
  );
  const moire = adjustments.moireReduction / 100;
  const reflection = adjustments.glareReduction / 100;
  const sampleRadius = Math.max(
    1,
    Math.min(3, Math.round(adjustments.reflectionQuality || 2)),
  );
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const offset = (y * width + x) * 4;
      const neighbors = [0, 1, 2].map(
        (channel) =>
          (source[offset - 4 + channel] +
            source[offset + 4 + channel] +
            source[offset - width * 4 + channel] +
            source[offset + width * 4 + channel]) /
          4,
      );
      for (let channel = 0; channel < 3; channel++) {
        const value = source[offset + channel];
        if (value > 238 && highlight > 0) {
          const other =
            (source[offset + ((channel + 1) % 3)] +
              source[offset + ((channel + 2) % 3)]) /
            2;
          image.data[offset + channel] = Math.round(
            value * (1 - highlight * 0.45) +
              Math.min(255, other * 1.12) * highlight * 0.45,
          );
        }
        if (repair > 0 && Math.abs(value - neighbors[channel]) > 95)
          image.data[offset + channel] = Math.round(
            value * (1 - repair) + neighbors[channel] * repair,
          );
      }
      if (moire > 0) {
        const localRange =
          Math.max(source[offset], source[offset + 1], source[offset + 2]) -
          Math.min(source[offset], source[offset + 1], source[offset + 2]);
        if (localRange > 70)
          for (let channel = 0; channel < 3; channel++)
            image.data[offset + channel] = Math.round(
              image.data[offset + channel] * (1 - moire * 0.35) +
                neighbors[channel] * moire * 0.35,
            );
      }
      if (reflection !== 0) {
        const reflectionNeighbors = [0, 1, 2].map(
          (channel) => {
            const sample = (sx: number, sy: number) =>
              source[
                (Math.max(0, Math.min(height - 1, sy)) * width +
                  Math.max(0, Math.min(width - 1, sx))) *
                  4 +
                  channel
              ];
            return (
              (sample(x - sampleRadius, y) +
                sample(x + sampleRadius, y) +
                sample(x, y - sampleRadius) +
                sample(x, y + sampleRadius)) /
              4
            );
          },
        );
        const localLuma =
          (source[offset] + source[offset + 1] + source[offset + 2]) / 3;
        const neighborLuma =
          (reflectionNeighbors[0] +
            reflectionNeighbors[1] +
            reflectionNeighbors[2]) /
          3;
        const reflectedVeil = Math.max(0, localLuma - neighborLuma * 0.82);
        for (let channel = 0; channel < 3; channel++) {
          const value = image.data[offset + channel];
          image.data[offset + channel] = Math.round(
            reflection > 0
              ? Math.max(
                  0,
                  value - reflectedVeil * reflection * 0.72 +
                    (value - localLuma) * reflection * 0.18,
                )
              : Math.min(
                  255,
                  neighborLuma +
                    Math.max(0, value - reflectionNeighbors[channel]) *
                      Math.abs(reflection) *
                      2.2,
                ),
          );
        }
      }
    }
  }
  context.putImageData(image, 0, 0);
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
      centerFocus = 0,
      centerCount = 0,
      edgeFocus = 0,
      edgeCount = 0,
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
        const central =
          x > canvas.width * 0.24 &&
          x < canvas.width * 0.76 &&
          y > canvas.height * 0.24 &&
          y < canvas.height * 0.76;
        if (central) {
          centerFocus += laplacian;
          centerCount++;
        } else {
          edgeFocus += laplacian;
          edgeCount++;
        }
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
    let faceScores: number[] = [];
    const Detector = (
      window as unknown as {
        FaceDetector?: new (options?: {
          fastMode?: boolean;
          maxDetectedFaces?: number;
        }) => {
          detect: (source: CanvasImageSource) => Promise<
            Array<{ boundingBox?: DOMRectReadOnly }>
          >;
        };
      }
    ).FaceDetector;
    if (Detector) {
      try {
        const detected = await new Detector({
          fastMode: true,
          maxDetectedFaces: 12,
        }).detect(canvas);
        faces = detected.length;
        const overallFocus = Math.min(
          100,
          (focus / Math.max(1, count)) * 4,
        );
        faceScores = detected.map((face) => {
          const box = face.boundingBox;
          if (!box) return overallFocus;
          let local = 0;
          let samples = 0;
          const startX = Math.max(1, Math.floor(box.x));
          const endX = Math.min(canvas.width - 1, Math.ceil(box.x + box.width));
          const startY = Math.max(1, Math.floor(box.y));
          const endY = Math.min(canvas.height - 1, Math.ceil(box.y + box.height));
          for (let y = startY; y < endY; y += 2)
            for (let x = startX; x < endX; x += 2) {
              const index = y * canvas.width + x;
              local += Math.abs(
                grayscale[index - 1] +
                  grayscale[index + 1] +
                  grayscale[index - canvas.width] +
                  grayscale[index + canvas.width] -
                  4 * grayscale[index],
              );
              samples++;
            }
          return Math.min(100, (local / Math.max(1, samples)) * 4);
        });
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
        faceScores,
        subject: Math.min(
          100,
          (centerFocus / Math.max(1, centerCount)) * 4,
        ),
        blur: Math.max(
          0,
          100 - Math.min(100, (focus / Math.max(1, count)) * 4),
        ),
        shallowDepth: Math.min(
          100,
          Math.max(
            0,
            ((centerFocus / Math.max(1, centerCount) -
              edgeFocus / Math.max(1, edgeCount)) /
              8) *
              100,
          ),
        ),
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function createSmartPreview(file: Blob): Promise<Blob | null> {
  if (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  ) {
    try {
      const memory = (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory;
      const maxEdge = memory && memory <= 4 ? 1200 : 2000;
      return (await createPreviewInWorker(file, maxEdge)).blob;
    } catch {
      // Continue through the main-thread compatibility path below.
    }
  }
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
type PanelWorkspacePreferences = {
  order: string[];
  hidden: string[];
  solo: boolean;
  active: string | null;
  setActive: (title: string | null) => void;
};
const PanelWorkspaceContext = createContext<PanelWorkspacePreferences | null>(
  null,
);

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
  const workspacePreferences = useContext(PanelWorkspaceContext);
  if (workspacePreferences?.hidden.includes(title)) return null;
  const order = workspacePreferences?.order.indexOf(title) ?? -1;
  const isOpen = workspacePreferences?.solo
    ? workspacePreferences.active === title
    : open;
  return (
    <details
      className="panel"
      open={isOpen}
      style={{ order: order < 0 ? 999 : order }}
      onToggle={(event) => {
        if (!workspacePreferences?.solo) return;
        workspacePreferences.setActive(event.currentTarget.open ? title : null);
      }}
    >
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
  const processingBudget = useMemo(
    () => estimateGpuBudget(deviceMemory),
    [deviceMemory],
  );
  const [workspace, setWorkspace] = useState<Workspace>("develop");
  const [opticsMode, setOpticsMode] = useState<OpticsMode>("pure");
  const [photos, setPhotos] = useState<RuntimePhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
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
  const [cullPreferences, setCullPreferences] = useState<CullPreferences>(() => {
    if (typeof window === "undefined") return defaultCullPreferences;
    try {
      return {
        ...defaultCullPreferences,
        ...JSON.parse(localStorage.getItem("librelux-cull-preferences") ?? "{}"),
      };
    } catch {
      return defaultCullPreferences;
    }
  });
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
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressJobs, setProgressJobs] = useState<ProgressJob[]>([]);
  const progressJobsLoaded = useRef(false);
  const cancelJobsRef = useRef(false);
  const pauseJobsRef = useRef(false);
  const [exportQuality, setExportQuality] = useState(92);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("jpeg");
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
  const [maskEdge, setMaskEdge] = useState(0);
  const [maskBrushSize, setMaskBrushSize] = useState(24);
  const [maskBrushFlow, setMaskBrushFlow] = useState(75);
  const [maskBrushDensity, setMaskBrushDensity] = useState(100);
  const [maskAuto, setMaskAuto] = useState(true);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
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
  const [largeText, setLargeText] = useState(false);
  const [learningTips, setLearningTips] = useState(true);
  const [panelOrder, setPanelOrder] = useState(defaultPanelOrder);
  const [hiddenPanels, setHiddenPanels] = useState<string[]>([]);
  const [soloPanels, setSoloPanels] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [gridSize, setGridSize] = useState(155);
  const [showClipping, setShowClipping] = useState(false);
  const [sampleMode, setSampleMode] = useState<
    "whiteBalance" | "pointColor" | null
  >(null);
  const [pointColor, setPointColor] = useState<PointColorSample | null>(null);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const presetImportRef = useRef<HTMLInputElement>(null);
  const lutImportRef = useRef<HTMLInputElement>(null);
  const psdImportRef = useRef<HTMLInputElement>(null);
  const opticsProfileRef = useRef<HTMLInputElement>(null);
  const [opticsProfiles, setOpticsProfiles] = useState<OpticsProfile[]>(
    communityOpticsProfiles,
  );
  const [aiPack, setAiPack] = useState({ restore: false, segment: false });
  const [aiStatus, setAiStatus] = useState("");
  const [openPackStatus, setOpenPackStatus] = useState("");
  const [spectralProfiles, setSpectralProfiles] = useState<
    SpectralFilmProfile[]
  >([]);
  const catalogImportRef = useRef<HTMLInputElement>(null);
  const publishServiceRef = useRef<HTMLInputElement>(null);
  const [catalogStatus, setCatalogStatus] = useState("");
  const [publishServices, setPublishServices] = useState<PublishService[]>([]);
  const [watchDirectory, setWatchDirectory] =
    useState<StoredDirectoryHandle | null>(null);
  const [watchStatus, setWatchStatus] = useState("");
  const [importOrganization, setImportOrganization] = useState<
    "source" | "date" | "custom"
  >("source");
  const [importDestination, setImportDestination] = useState("Imported photos");
  const [duplicateImport, setDuplicateImport] = useState<"skip" | "copy">(
    "skip",
  );
  const [importMethod, setImportMethod] = useState<ImportMethod>("copy");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tetherOpen, setTetherOpen] = useState(false);
  const [tetherStream, setTetherStream] = useState<MediaStream | null>(null);
  const [tetherControls, setTetherControls] = useState({
    exposure: 0,
    whiteBalance: 5000,
    focus: 0,
    zoom: 1,
  });
  const [tetherCapabilities, setTetherCapabilities] = useState<
    Record<string, { min?: number; max?: number; step?: number }>
  >({});
  const tetherVideoRef = useRef<HTMLVideoElement>(null);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [videoLabOpen, setVideoLabOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowMusic, setSlideshowMusic] = useState("");
  const [proofProfile, setProofProfile] = useState<ColorSpace>("srgb");
  const [softProof, setSoftProof] = useState(false);
  const [gamutWarnings, setGamutWarnings] = useState(false);
  const [retouchMode, setRetouchMode] = useState<RetouchMode | null>(null);
  const [retouchSize, setRetouchSize] = useState(9);
  const [retouchFeather, setRetouchFeather] = useState(55);
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    photos.forEach((photo, index) =>
      photos.slice(index + 1).forEach((other) => {
        const exact =
          photo.name.toLowerCase() === other.name.toLowerCase() &&
          photo.size === other.size;
        if (
          exact ||
          perceptualHashDistance(photo.perceptualHash, other.perceptualHash) <=
            8
        ) {
          ids.add(photo.id);
          ids.add(other.id);
        }
      }),
    );
    return ids;
  }, [photos]);
  const selected = photos.find((p) => p.id === selectedId);
  const previewPhoto = useMemo(() => {
    if (!selected || !selectedPreset) return selected;
    const strength = presetAmount / 100;
    const previewSettings = Object.fromEntries(
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
    return {
      ...selected,
      adjustments: { ...selected.adjustments, ...previewSettings },
    };
  }, [presetAmount, selected, selectedPreset]);
  const folders = useMemo(
    () => [...new Set(photos.map((photo) => photo.folder))].sort(),
    [photos],
  );
  const captureMonths = useMemo(
    () =>
      [...new Set(
        photos
          .map((photo) => photo.metadata.capturedAt || new Date(photo.createdAt).toISOString())
          .map((value) => value.slice(0, 7))
          .filter(Boolean),
      )].sort().reverse(),
    [photos],
  );
  const activeAlbum = albums.find((album) => album.id === activeAlbumId);
  const albumIncludes = (album: AlbumRecord | undefined, photo: RuntimePhoto) =>
    !album ||
    album.kind === "set" ||
    (album.kind === "smart"
      ? album.advancedRule
        ? matchesSmartAlbum(photo, album.advancedRule)
        : album.rule === "five-stars"
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
            (!monthFilter ||
              (p.metadata.capturedAt || new Date(p.createdAt).toISOString()).startsWith(
                monthFilter,
              )) &&
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
                evaluateCull(detailedCullScores(p.cull), cullPreferences)
                  .decision !== "reject") ||
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
      monthFilter,
      cullPreferences,
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
          journal.photo = deserializePhoto(journal.photo);
          const index = records.findIndex(
            (photo) => photo.id === journal.photo.id,
          );
          if (index >= 0 && records[index].editedAt < journal.photo.editedAt)
            records[index] = journal.photo;
          else if (index < 0) records.push(journal.photo);
          await savePhoto(journal.photo).catch(() => undefined);
          await removeSetting("edit-journal").catch(() => undefined);
        }
        const runtime = await Promise.all(
          records
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(async (p) => {
              let original = p.blob;
              let missing = p.missing ?? false;
              if (p.importMethod === "add" && p.sourceHandle) {
                try {
                  const permission = await p.sourceHandle.queryPermission?.({
                    mode: "read",
                  });
                  if (permission === "granted")
                    original = await p.sourceHandle.getFile();
                  else missing = true;
                } catch {
                  missing = true;
                }
              }
              const display =
                p.displayBlob ?? (original.size ? original : p.previewBlob);
              if (!display) missing = true;
              return {
                ...p,
                blob: original,
                importMethod: p.importMethod ?? "copy",
                sourceHandle: p.sourceHandle ?? null,
                editedAt: p.editedAt ?? p.createdAt,
                folder: p.folder ?? "Local library",
                virtualOf: p.virtualOf ?? null,
                rejected: p.rejected ?? false,
                retouchSpots: p.retouchSpots ?? [],
                perceptualHash: p.perceptualHash ?? "",
                cull: p.cull ?? {
                  focus: 0,
                  exposure: 0,
                  faces: 0,
                  similarity: 0,
                },
                stackId: p.stackId ?? null,
                stackCover: p.stackCover ?? false,
                missing,
                processVersion: p.processVersion ?? "2026",
                previewBlob: p.previewBlob ?? null,
                displayBlob: p.displayBlob ?? null,
                sourceBitDepth: p.sourceBitDepth ?? 8,
                rawInfo: p.rawInfo ?? null,
                aiHistory: p.aiHistory ?? [],
                peopleCluster: p.peopleCluster ?? "",
                snapshots: p.snapshots ?? [],
                effectStack: p.effectStack ?? [],
                reviewComments: p.reviewComments ?? [],
                reviewLikes: p.reviewLikes ?? [],
                masks: (p.masks ?? []).map((mask) => ({
                  ...mask,
                  edge: mask.edge ?? 0,
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
                url: URL.createObjectURL(display ?? new Blob()),
                previewUrl: p.previewBlob
                  ? URL.createObjectURL(p.previewBlob)
                  : URL.createObjectURL(display ?? new Blob()),
              };
            }),
        );
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
      readSetting<OpticsProfile[]>("community-optics-profiles"),
      readSetting<{
        organization: "source" | "date" | "custom";
        destination: string;
        duplicates: "skip" | "copy";
        method?: ImportMethod;
      }>("import-preset"),
      readSetting<{
        highContrast?: boolean;
        reducedMotion?: boolean;
        compactUi?: boolean;
        largeText?: boolean;
        learningTips?: boolean;
        showFilmstrip?: boolean;
        gridSize?: number;
      }>("ui-preferences"),
      readSetting<{
        order: string[];
        hidden: string[];
        solo: boolean;
      }>("panel-workspace"),
      readSetting<PublishService[]>("publish-services"),
    ])
      .then(
        ([
          savedAlbums,
          savedRecipes,
          savedPresets,
          savedShortcuts,
          savedOpticsProfiles,
          importPreset,
          prefs,
          panelWorkspace,
          savedPublishServices,
        ]) => {
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
          if (savedPresets)
            setUserPresets(
              savedPresets.map((preset) => ({
                ...preset,
                favorite: Boolean(preset.favorite),
              })),
            );
          if (savedShortcuts)
            setShortcutMap((current) => ({ ...current, ...savedShortcuts }));
          if (savedOpticsProfiles)
            setOpticsProfiles([
              ...communityOpticsProfiles,
              ...savedOpticsProfiles.filter(
                (profile) =>
                  !communityOpticsProfiles.some(
                    (builtIn) => builtIn.id === profile.id,
                  ),
              ),
            ]);
          if (importPreset) {
            setImportOrganization(importPreset.organization);
            setImportDestination(importPreset.destination);
            setDuplicateImport(importPreset.duplicates);
            setImportMethod(importPreset.method ?? "copy");
          }
          if (prefs) {
            setHighContrast(Boolean(prefs.highContrast));
            setReducedMotion(Boolean(prefs.reducedMotion));
            setCompactUi(Boolean(prefs.compactUi));
            setLargeText(Boolean(prefs.largeText));
            setLearningTips(prefs.learningTips !== false);
            setShowFilmstrip(prefs.showFilmstrip !== false);
            setGridSize(prefs.gridSize ?? 155);
          }
          if (panelWorkspace) {
            setPanelOrder(panelWorkspace.order ?? defaultPanelOrder);
            setHiddenPanels(panelWorkspace.hidden ?? []);
            setSoloPanels(Boolean(panelWorkspace.solo));
          }
          if (savedPublishServices) setPublishServices(savedPublishServices);
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
    document.documentElement.dataset.libreluxReady = "true";
    return () => {
      delete document.documentElement.dataset.libreluxReady;
    };
  }, []);
  useEffect(() => {
    if (progressJobsLoaded.current)
      void saveSetting("progress-jobs", progressJobs);
  }, [progressJobs]);
  useEffect(() => {
    readSetting<ProgressJob[]>("progress-jobs")
      .then((jobs) => {
        if (jobs?.length)
          setProgressJobs(
            jobs.map((job) =>
              job.status === "running" || job.status === "queued"
                ? { ...job, status: "paused" }
                : job,
            ),
          );
      })
      .catch(() => undefined);
    progressJobsLoaded.current = true;
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      setAiPack(localAiPackState());
      const measuredProfiles = loadInstalledOpticsPack();
      if (measuredProfiles.length)
        setOpticsProfiles((current) => [
          ...current.filter(
            (profile) => profile.source !== "Measured open data",
          ),
          ...measuredProfiles,
        ]);
      void loadSpectralFilmPack().then(setSpectralProfiles);
    });
  }, []);
  const updateSelected = useCallback(
    (updater: (photo: RuntimePhoto) => RuntimePhoto, persist = true) => {
      setPhotos((current) =>
        current.map((photo) => {
          if (photo.id !== selectedId) return photo;
          const next = { ...updater(photo), editedAt: Date.now() };
          if (persist)
            void serializePhoto(next)
              .then((photo) =>
                saveSetting("edit-journal", {
                  photo,
                  savedAt: Date.now(),
                }),
              )
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
  const importFiles = useCallback(
    async (
      fileList: FileList | File[],
      sourceHandles = new Map<File, StoredFileHandle>(),
    ) => {
      const files = Array.from(fileList).filter(
        (file) =>
          (file.type.startsWith("image/") ||
            /\.(heic|heif)$/i.test(file.name) ||
            isRawFile(file) ||
            isTiffFile(file)) &&
          (duplicateImport === "copy" ||
            !photos.some(
              (photo) => photo.name === file.name && photo.size === file.size,
            )),
      );
      const jobIds = files.map(() => crypto.randomUUID());
      if (files.length)
        setProgressJobs((current) => [
          ...current.filter((job) => job.status === "running"),
          ...files.map((file, index) => ({
            id: jobIds[index],
            name: file.name,
            kind: "import" as const,
            progress: 5,
            status: "queued" as const,
          })),
        ]);
      const imported = await Promise.all(
        files.map(async (sourceFile, sourceIndex) => {
          const jobId = jobIds[sourceIndex];
          setProgressJobs((current) =>
            current.map((job) =>
              job.id === jobId
                ? { ...job, status: "running", progress: 20 }
                : job,
            ),
          );
          let file = sourceFile;
          if (/\.(heic|heif)$/i.test(sourceFile.name)) {
            try {
              const { default: heic2any } = await import("heic2any");
              const converted = await heic2any({
                blob: sourceFile,
                toType: "image/jpeg",
                quality: 0.94,
              });
              const blob = Array.isArray(converted) ? converted[0] : converted;
              file = new File(
                [blob],
                sourceFile.name.replace(/\.(heic|heif)$/i, ".jpg"),
                { type: "image/jpeg", lastModified: sourceFile.lastModified },
              );
            } catch {
              setCatalogStatus(
                `Could not decode ${sourceFile.name} in this browser`,
              );
              setProgressJobs((current) =>
                current.map((job) =>
                  job.id === jobId ? { ...job, status: "failed" } : job,
                ),
              );
              return null;
            }
          }
          let decoded;
          try {
            decoded = await decodeEditableSource(file);
          } catch (error) {
            setCatalogStatus(
              `Could not decode ${sourceFile.name}: ${error instanceof Error ? error.message : "unsupported source"}`,
            );
            setProgressJobs((current) =>
              current.map((job) =>
                job.id === jobId ? { ...job, status: "failed" } : job,
              ),
            );
            return null;
          }
          const displayFile = decoded.displayFile;
          const relative =
            (sourceFile as File & { webkitRelativePath?: string })
              .webkitRelativePath ?? "";
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
            analyzeImportFile(displayFile).catch(() => ({
              perceptualHash: "",
              cull: { focus: 0, exposure: 0, faces: 0, similarity: 0 },
            })),
            createSmartPreview(displayFile),
          ]);
          setProgressJobs((current) =>
            current.map((job) =>
              job.id === jobId ? { ...job, progress: 75 } : job,
            ),
          );
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
          const identifiedCamera = [
            parsed.Make ?? decoded.rawInfo?.cameraMake,
            parsed.Model ?? decoded.rawInfo?.cameraModel,
          ]
            .filter(Boolean)
            .map(String)
            .join(" ");
          const identifiedLens = String(
            parsed.LensModel ?? parsed.Lens ?? decoded.rawInfo?.lens ?? "",
          );
          const automaticProfile = opticsProfiles.find(
            (profile) =>
              (!profile.camera ||
                identifiedCamera
                  .toLowerCase()
                  .includes(profile.camera.toLowerCase())) &&
              (!profile.lens ||
                identifiedLens
                  .toLowerCase()
                  .includes(profile.lens.toLowerCase())),
          );
          const record: PhotoRecord = {
            id: crypto.randomUUID(),
            name: sourceFile.name,
            type: sourceFile.type || file.type || "application/octet-stream",
            size: sourceFile.size,
            createdAt: now,
            editedAt: now,
            rating: 0,
            flagged: false,
            rejected: false,
            label: "none",
            folder:
              importOrganization === "date"
                ? captured.slice(0, 7) || new Date().toISOString().slice(0, 7)
                : importOrganization === "custom"
                  ? importDestination.trim() || "Imported photos"
                  : relative.split("/").slice(0, -1).join("/") ||
                    "Local library",
            virtualOf: null,
            blob: sourceFile,
            adjustments: {
              ...defaults,
              ...(automaticProfile?.settings ?? {}),
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
              copyright: String(
                parsed.Copyright ?? parsed.CopyrightNotice ?? "",
              ),
              keywords,
              camera: identifiedCamera,
              lens: identifiedLens,
              capturedAt: captured || decoded.rawInfo?.capturedAt || "",
              iso: String(parsed.ISO ?? decoded.rawInfo?.iso ?? ""),
              aperture:
                parsed.FNumber || decoded.rawInfo?.aperture
                  ? `f/${parsed.FNumber ?? decoded.rawInfo?.aperture}`
                  : "",
              shutter: String(
                parsed.ExposureTime ?? decoded.rawInfo?.shutter ?? "",
              ),
              focalLength:
                parsed.FocalLength || decoded.rawInfo?.focalLength
                  ? `${parsed.FocalLength ?? decoded.rawInfo?.focalLength} mm`
                  : "",
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
            stackCover: false,
            missing: false,
            processVersion: "2026",
            previewBlob,
            displayBlob:
              displayFile === sourceFile ? null : (displayFile as Blob),
            sourceBitDepth: decoded.sourceBitDepth,
            rawInfo: decoded.rawInfo,
            aiHistory: [],
            peopleCluster:
              analysis.cull.faces > 0
                ? `Person ${analysis.perceptualHash.slice(0, 4).toUpperCase()}`
                : "",
            snapshots: [],
            effectStack: [],
            reviewComments: [],
            reviewLikes: [],
            importMethod,
            sourceHandle:
              importMethod === "add"
                ? (sourceHandles.get(sourceFile) ?? null)
                : null,
          };
          await savePhoto(record);
          if (importMethod === "move") {
            const handle = sourceHandles.get(sourceFile);
            if (handle?.remove) {
              await handle.remove().catch(() => undefined);
            }
          }
          setProgressJobs((current) =>
            current.map((job) =>
              job.id === jobId
                ? { ...job, status: "done", progress: 100 }
                : job,
            ),
          );
          return {
            ...record,
            url: URL.createObjectURL(displayFile),
            previewUrl: previewBlob
              ? URL.createObjectURL(previewBlob)
              : URL.createObjectURL(displayFile),
          };
        }),
      );
      const successful = imported.filter(
        (photo): photo is RuntimePhoto => photo !== null,
      );
      setPhotos((p) => [...successful, ...p]);
      if (successful[0]) {
        setSelectedId(successful[0].id);
        setWorkspace("develop");
      }
    },
    [
      duplicateImport,
      importDestination,
      importOrganization,
      importMethod,
      opticsProfiles,
      photos,
    ],
  );
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
  const startTetheredCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 4096 }, height: { ideal: 2160 } },
        audio: false,
      });
      setTetherStream(stream);
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as unknown as Record<
        string,
        { min?: number; max?: number; step?: number }
      >;
      setTetherCapabilities(capabilities ?? {});
      setTetherOpen(true);
      window.setTimeout(() => {
        if (tetherVideoRef.current) {
          tetherVideoRef.current.srcObject = stream;
          void tetherVideoRef.current.play();
        }
      });
    } catch {
      setCatalogStatus("Camera access was not available");
    }
  }, []);
  const setTetherConstraint = async (
    key: "exposureCompensation" | "colorTemperature" | "focusDistance" | "zoom",
    value: number,
  ) => {
    const track = tetherStream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ [key]: value }],
      } as MediaTrackConstraints);
      setTetherControls((current) => ({
        ...current,
        [key === "exposureCompensation"
          ? "exposure"
          : key === "colorTemperature"
            ? "whiteBalance"
            : key === "focusDistance"
              ? "focus"
              : "zoom"]: value,
      }));
    } catch {
      setCatalogStatus(`${key} is not controllable on this camera/browser`);
    }
  };
  const stopTetheredCapture = useCallback(() => {
    tetherStream?.getTracks().forEach((track) => track.stop());
    setTetherStream(null);
    setTetherOpen(false);
  }, [tetherStream]);
  const captureTetheredFrame = useCallback(async () => {
    const video = tetherVideoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95),
    );
    if (!blob) return;
    await importFiles([
      new File(
        [blob],
        `Tether-${new Date().toISOString().replaceAll(":", "-")}.jpg`,
        {
          type: "image/jpeg",
        },
      ),
    ]);
    setCatalogStatus("Tethered frame captured into the catalog");
  }, [importFiles]);
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
  const batchRenameAndSync = () => {
    if (!selected) return;
    const targets = selectedIds.length ? selectedIds : [selected.id];
    const ordered = photos
      .filter((photo) => targets.includes(photo.id))
      .sort((a, b) =>
        (a.metadata.capturedAt || String(a.createdAt)).localeCompare(
          b.metadata.capturedAt || String(b.createdAt),
        ),
      );
    const positions = new Map(
      ordered.map((photo, index) => [photo.id, index + 1]),
    );
    const base = (selected.metadata.title || selected.name).replace(
      /\.[^.]+$/,
      "",
    );
    updateMany((photo) => ({
      ...photo,
      name: `${base}-${String(positions.get(photo.id) ?? 1).padStart(4, "0")}.${photo.name.split(".").at(-1) ?? "jpg"}`,
      adjustments: { ...selected.adjustments },
      metadata: {
        ...photo.metadata,
        creator: selected.metadata.creator || photo.metadata.creator,
        copyright: selected.metadata.copyright || photo.metadata.copyright,
        keywords: [
          ...new Set([...photo.metadata.keywords, "Time-lapse sequence"]),
        ],
      },
    }));
    setCatalogStatus(
      `Prepared ${ordered.length} synchronized time-lapse frames`,
    );
  };
  const createContactSheet = async () => {
    const targets = photos.filter((photo) =>
      (selectedIds.length
        ? selectedIds
        : photos.map((item) => item.id)
      ).includes(photo.id),
    );
    if (!targets.length) return;
    const columns = 4;
    const cellWidth = 420;
    const cellHeight = 320;
    const canvas = document.createElement("canvas");
    canvas.width = columns * cellWidth;
    canvas.height = Math.ceil(targets.length / columns) * cellHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#111";
    context.font = "20px sans-serif";
    for (let index = 0; index < targets.length; index++) {
      const photo = targets[index];
      const image = new Image();
      image.src = photo.previewUrl;
      await image.decode();
      const x = (index % columns) * cellWidth;
      const y = Math.floor(index / columns) * cellHeight;
      const scale = Math.min(
        380 / image.naturalWidth,
        260 / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(
        image,
        x + (cellWidth - width) / 2,
        y + 15,
        width,
        height,
      );
      context.fillText(photo.name, x + 20, y + 300, 380);
    }
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "LibreLux-contact-sheet.png";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };
  const exportLocalLayout = useCallback(
    async (
      kind: "gallery" | "book" | "slideshow" | "print",
      share = false,
    ) => {
      const targets = photos.filter((photo) =>
        (selectedIds.length
          ? selectedIds
          : photos.map((item) => item.id)
        ).includes(photo.id),
      );
      const dataUrls = await Promise.all(
        targets.map(
          (photo) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.readAsDataURL(
                photo.previewBlob ?? photo.displayBlob ?? photo.blob,
              );
            }),
        ),
      );
      const items = targets
        .map(
          (photo, index) =>
            `<figure><img src="${dataUrls[index]}" alt=""><figcaption>${escapeXml(photo.metadata.title || photo.name)}</figcaption></figure>`,
        )
        .join("");
      const slideshowScript =
        kind === "slideshow"
          ? `<script>const slides=[...document.querySelectorAll('figure')];let i=0;function show(n){slides.forEach((s,j)=>s.hidden=j!==n);document.querySelector('output').textContent=(n+1)+' / '+slides.length}show(0);addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' '){i=(i+1)%slides.length;show(i)}if(e.key==='ArrowLeft'){i=(i-1+slides.length)%slides.length;show(i)}});setInterval(()=>{i=(i+1)%slides.length;show(i)},5000)</script>`
          : "";
      const paged = kind === "book" || kind === "print";
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LibreLux ${kind}</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:${kind === "slideshow" ? "0" : "clamp(16px,4vw,48px)"};background:#101310;color:#eef3ee}main{display:grid;grid-template-columns:${paged || kind === "slideshow" ? "1fr" : "repeat(auto-fit,minmax(min(100%,260px),1fr))"};gap:24px;max-width:${kind === "slideshow" ? "none" : "1200px"};margin:auto}figure{margin:0;${paged ? "break-after:page;min-height:92vh;display:grid;place-items:center" : kind === "slideshow" ? "height:100vh;display:grid;place-items:center;background:#080a08" : "background:#171b17;border-radius:12px;overflow:hidden;padding:10px"}}img{max-width:100%;max-height:${kind === "slideshow" ? "92vh" : "82vh"};display:block;margin:auto}figcaption{text-align:center;margin-top:10px;color:#bac5ba}${kind === "slideshow" ? "output{position:fixed;right:18px;bottom:16px;background:#0009;padding:8px 12px;border-radius:99px}" : ""}@page{size:auto;margin:12mm}@media print{body{background:white;color:black;padding:0}figure{break-inside:avoid}figcaption{color:#333}}</style></head><body><main>${items}</main>${kind === "slideshow" ? "<output></output>" : ""}${slideshowScript}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const file = new File([blob], `LibreLux-${kind}.html`, {
        type: "text/html",
      });
      if (share && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `LibreLux ${kind}`,
          text: "Private photo review from LibreLux",
          files: [file],
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      if (kind === "print") {
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `LibreLux-${kind}.html`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [photos, selectedIds],
  );
  const importPublishService = async (file?: File) => {
    if (!file) return;
    try {
      const source = JSON.parse(await file.text()) as Partial<PublishService>;
      const endpoint = new URL(String(source.endpoint ?? ""));
      if (endpoint.protocol !== "https:")
        throw new Error("Publish services must use HTTPS");
      const service: PublishService = {
        id: String(source.id ?? crypto.randomUUID()),
        name: String(source.name ?? endpoint.hostname).slice(0, 48),
        endpoint: endpoint.toString(),
        method: source.method === "PUT" ? "PUT" : "POST",
      };
      const next = [
        ...publishServices.filter((item) => item.id !== service.id),
        service,
      ];
      setPublishServices(next);
      await saveSetting("publish-services", next);
      setCatalogStatus(`${service.name} publish service installed locally`);
    } catch (error) {
      setCatalogStatus(
        error instanceof Error ? error.message : "Invalid publish service",
      );
    }
  };
  const publishSelection = async (service: PublishService) => {
    const targets = photos.filter((photo) =>
      (selectedIds.length ? selectedIds : selectedId ? [selectedId] : []).includes(
        photo.id,
      ),
    );
    if (!targets.length) return;
    if (
      !window.confirm(
        `Send ${targets.length} selected photo${targets.length === 1 ? "" : "s"} to ${service.name}?`,
      )
    )
      return;
    for (const photo of targets) {
      const body = new FormData();
      body.append("file", photo.displayBlob ?? photo.blob, photo.name);
      body.append("metadata", JSON.stringify(photo.metadata));
      const response = await fetch(service.endpoint, {
        method: service.method,
        body,
      });
      if (!response.ok) throw new Error(`${service.name} returned ${response.status}`);
    }
    setCatalogStatus(`Published ${targets.length} photo${targets.length === 1 ? "" : "s"} to ${service.name}`);
  };
  const handoffPsd = async (openLibreLayer = false) => {
    if (!selected) return;
    const { writePsd } = await import("ag-psd");
    const image = new Image();
    image.src = selected.url;
    await image.decode();
    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = image.naturalWidth;
    originalCanvas.height = image.naturalHeight;
    const originalContext = originalCanvas.getContext("2d");
    if (!originalContext) return;
    originalContext.drawImage(image, 0, 0);
    const editedCanvas = document.createElement("canvas");
    editedCanvas.width = image.naturalWidth;
    editedCanvas.height = image.naturalHeight;
    const editedContext = editedCanvas.getContext("2d");
    if (!editedContext) return;
    editedContext.filter = cssFilter(
      selected.adjustments,
      selected.processVersion,
    );
    editedContext.drawImage(image, 0, 0);
    const buffer = writePsd({
      width: image.naturalWidth,
      height: image.naturalHeight,
      children: [
        {
          name: "LibreLux edit",
          imageData: editedContext.getImageData(
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
          ),
        },
        {
          name: "Original",
          imageData: originalContext.getImageData(
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
          ),
        },
      ],
    });
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "image/vnd.adobe.photoshop" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.name.replace(/\.[^.]+$/, "")}-LibreLux.psd`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (openLibreLayer)
      window.open(
        "https://librelayer.goodtools.ca/?from=librelux",
        "_blank",
        "noopener,noreferrer",
      );
  };
  const importReturnedPsd = async (file?: File) => {
    if (!file) return;
    try {
      const { readPsd } = await import("ag-psd");
      const psd = readPsd(await file.arrayBuffer(), { useImageData: true });
      const imageData = psd.imageData;
      if (!imageData) throw new Error("No composite image");
      const canvas = document.createElement("canvas");
      canvas.width = psd.width;
      canvas.height = psd.height;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.putImageData(
        new ImageData(
          new Uint8ClampedArray(imageData.data),
          psd.width,
          psd.height,
        ),
        0,
        0,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob)
        await importFiles([
          new File([blob], file.name.replace(/\.psd$/i, "-returned.png"), {
            type: "image/png",
          }),
        ]);
      setCatalogStatus("Returned LibreLayer edit imported");
    } catch {
      setCatalogStatus("This PSD did not contain a readable composite image");
    }
  };
  const mergeSelectedHdr = async () => {
    const targets = photos.filter((photo) => selectedIds.includes(photo.id));
    if (targets.length < 2) {
      setCatalogStatus("Select at least two bracketed photos for HDR merge");
      return;
    }
    const jobId = crypto.randomUUID();
    setProgressJobs((current) => [
      ...current,
      {
        id: jobId,
        name: `HDR merge · ${targets.length} frames`,
        kind: "merge",
        progress: 5,
        status: "running",
      },
    ]);
    try {
      const images = await Promise.all(
        targets.map(async (photo) => {
          const image = new Image();
          image.src = photo.url;
          await image.decode();
          return image;
        }),
      );
      const width = Math.min(...images.map((image) => image.naturalWidth));
      const height = Math.min(...images.map((image) => image.naturalHeight));
      const framePixels = images.map((image) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(
          image,
          (image.naturalWidth - width) / 2,
          (image.naturalHeight - height) / 2,
          width,
          height,
          0,
          0,
          width,
          height,
        );
        return context.getImageData(0, 0, width, height);
      });
      setProgressJobs((current) =>
        current.map((job) =>
          job.id === jobId ? { ...job, progress: 55 } : job,
        ),
      );
      const merged = mergeHdrFloat32(framePixels);
      const output = document.createElement("canvas");
      output.width = width;
      output.height = height;
      output.getContext("2d")?.putImageData(merged.toneMapped, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        output.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Merge encoding failed");
      const hdrMaster = encodeHdrFloat32(
        width,
        height,
        merged.linear,
        "prophoto-rgb",
      );
      const masterName = `HDR-Merge-${Date.now()}-32bit.tif`;
      if (exportDirectory) {
        const permission = await exportDirectory.queryPermission?.({
          mode: "readwrite",
        });
        if (permission === "granted") {
          const file = await exportDirectory.getFileHandle(masterName, {
            create: true,
          });
          const writable = await file.createWritable();
          await writable.write(hdrMaster);
          await writable.close();
        }
      } else {
        const masterUrl = URL.createObjectURL(hdrMaster);
        const masterLink = document.createElement("a");
        masterLink.href = masterUrl;
        masterLink.download = masterName;
        masterLink.click();
        window.setTimeout(() => URL.revokeObjectURL(masterUrl), 1000);
      }
      await importFiles([
        new File([blob], `HDR-Merge-${Date.now()}.png`, { type: "image/png" }),
      ]);
      setProgressJobs((current) =>
        current.map((job) =>
          job.id === jobId ? { ...job, status: "done", progress: 100 } : job,
        ),
      );
      setCatalogStatus(
        `Merged ${targets.length} exposures into a 32-bit float master and tone-mapped preview`,
      );
    } catch {
      setProgressJobs((current) =>
        current.map((job) =>
          job.id === jobId ? { ...job, status: "failed" } : job,
        ),
      );
    }
  };
  const mergeSelectedPanorama = async () => {
    const targets = photos.filter((photo) => selectedIds.includes(photo.id));
    if (targets.length < 2) {
      setCatalogStatus(
        "Select at least two overlapping photos for panorama merge",
      );
      return;
    }
    const images = await Promise.all(
      targets.map(async (photo) => {
        const image = new Image();
        image.src = photo.url;
        await image.decode();
        return image;
      }),
    );
    const height = Math.min(...images.map((image) => image.naturalHeight));
    const widths = images.map((image) =>
      Math.round((image.naturalWidth / image.naturalHeight) * height),
    );
    const overlap = Math.round(Math.min(...widths) * 0.14);
    const canvas = document.createElement("canvas");
    canvas.width =
      widths.reduce((sum, width) => sum + width, 0) -
      overlap * (images.length - 1);
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.save();
    context.filter = "blur(18px) brightness(.8)";
    context.drawImage(images[0], 0, 0, canvas.width, height);
    context.restore();
    let x = 0;
    images.forEach((image, index) => {
      context.save();
      context.globalAlpha = index ? 0.88 : 1;
      context.drawImage(image, x, 0, widths[index], height);
      context.restore();
      x += widths[index] - overlap;
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    await importFiles([
      new File([blob], `Panorama-${Date.now()}.png`, { type: "image/png" }),
    ]);
    setCatalogStatus(
      `Merged ${targets.length} frames with overlap and edge fill`,
    );
  };
  const loadSelectedMergeFrames = async () => {
    const targets = photos.filter((photo) => selectedIds.includes(photo.id));
    if (targets.length < 2)
      throw new Error("Select at least two source frames");
    const images = await Promise.all(
      targets.map(async (photo) => {
        const image = new Image();
        image.src = photo.url;
        await image.decode();
        return image;
      }),
    );
    const width = Math.min(...images.map((image) => image.naturalWidth));
    const height = Math.min(...images.map((image) => image.naturalHeight));
    const frames = images.map((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(
        image,
        (image.naturalWidth - width) / 2,
        (image.naturalHeight - height) / 2,
        width,
        height,
        0,
        0,
        width,
        height,
      );
      return context.getImageData(0, 0, width, height);
    });
    return { targets, frames, width, height };
  };
  const importMergedPixels = async (
    pixels: ImageData,
    prefix: string,
    message: string,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    canvas.getContext("2d")?.putImageData(pixels, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Merge encoding failed");
    await importFiles([
      new File([blob], `${prefix}-${Date.now()}.png`, { type: "image/png" }),
    ]);
    setCatalogStatus(message);
  };
  const mergeSelectedFocusStack = async () => {
    try {
      const { targets, frames, width, height } =
        await loadSelectedMergeFrames();
      const output = new ImageData(width, height);
      output.data.set(frames[0].data);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pixel = y * width + x;
          let bestFrame = 0;
          let bestSharpness = -1;
          frames.forEach((frame, frameIndex) => {
            const offset = pixel * 4;
            let sharpness = 0;
            for (let channel = 0; channel < 3; channel++) {
              const center = frame.data[offset + channel] * 4;
              const neighbors =
                frame.data[offset - 4 + channel] +
                frame.data[offset + 4 + channel] +
                frame.data[offset - width * 4 + channel] +
                frame.data[offset + width * 4 + channel];
              sharpness += Math.abs(center - neighbors);
            }
            if (sharpness > bestSharpness) {
              bestSharpness = sharpness;
              bestFrame = frameIndex;
            }
          });
          const offset = pixel * 4;
          output.data.set(
            frames[bestFrame].data.slice(offset, offset + 4),
            offset,
          );
        }
      }
      await importMergedPixels(
        output,
        "Focus-Stack",
        `Focus-stacked ${targets.length} aligned frames`,
      );
    } catch (error) {
      setCatalogStatus(
        error instanceof Error ? error.message : "Focus stack failed",
      );
    }
  };
  const mergeSelectedMultiFrame = async () => {
    try {
      const { targets, frames, width, height } =
        await loadSelectedMergeFrames();
      const output = new ImageData(width, height);
      for (let offset = 0; offset < output.data.length; offset += 4) {
        for (let channel = 0; channel < 3; channel++) {
          const values = frames
            .map((frame) => frame.data[offset + channel])
            .sort((a, b) => a - b);
          const middle = Math.floor(values.length / 2);
          output.data[offset + channel] =
            values.length % 2
              ? values[middle]
              : Math.round((values[middle - 1] + values[middle]) / 2);
        }
        output.data[offset + 3] = 255;
      }
      await importMergedPixels(
        output,
        "Multi-Frame-Clean",
        `Combined ${targets.length} frames for pixel-shift noise reduction`,
      );
    } catch (error) {
      setCatalogStatus(
        error instanceof Error ? error.message : "Multi-frame merge failed",
      );
    }
  };
  const mergeSelectedHdrPanorama = async () => {
    const targets = photos.filter((photo) => selectedIds.includes(photo.id));
    if (targets.length < 3) {
      setCatalogStatus("Select at least three bracketed panorama frames");
      return;
    }
    try {
      const images = await Promise.all(
        targets.map(async (photo) => {
          const image = new Image();
          image.src = photo.url;
          await image.decode();
          return image;
        }),
      );
      const height = Math.min(...images.map((image) => image.naturalHeight));
      const widths = images.map((image) =>
        Math.round((image.naturalWidth / image.naturalHeight) * height),
      );
      const overlap = Math.round(Math.min(...widths) * 0.22);
      const canvas = document.createElement("canvas");
      canvas.width =
        widths.reduce((sum, width) => sum + width, 0) -
        overlap * (images.length - 1);
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      let x = 0;
      images.forEach((image, index) => {
        const width = widths[index];
        const gradient = context.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, index ? "rgba(255,255,255,0)" : "white");
        gradient.addColorStop(index ? 0.18 : 0, "white");
        gradient.addColorStop(index < images.length - 1 ? 0.82 : 1, "white");
        gradient.addColorStop(
          1,
          index < images.length - 1 ? "rgba(255,255,255,0)" : "white",
        );
        const layer = document.createElement("canvas");
        layer.width = canvas.width;
        layer.height = height;
        const layerContext = layer.getContext("2d");
        if (!layerContext) return;
        layerContext.filter = `brightness(${Math.max(0.72, Math.min(1.35, 1 + (index - (images.length - 1) / 2) * -0.08))})`;
        layerContext.drawImage(image, x, 0, width, height);
        layerContext.globalCompositeOperation = "destination-in";
        layerContext.fillStyle = gradient;
        layerContext.fillRect(x, 0, width, height);
        context.globalCompositeOperation = "screen";
        context.globalAlpha = index ? 0.72 : 1;
        context.drawImage(layer, 0, 0);
        x += width - overlap;
      });
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("HDR panorama encoding failed");
      await importFiles([
        new File([blob], `HDR-Panorama-${Date.now()}.png`, {
          type: "image/png",
        }),
      ]);
      setCatalogStatus(
        `Merged ${targets.length} exposure-aware panorama frames`,
      );
    } catch (error) {
      setCatalogStatus(
        error instanceof Error ? error.message : "HDR panorama failed",
      );
    }
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
      url: URL.createObjectURL(selected.displayBlob ?? selected.blob),
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
      ({
        url,
        previewUrl,
        blob,
        previewBlob,
        displayBlob,
        sourceHandle,
        ...photo
      }) => {
        void url;
        void previewUrl;
        void previewBlob;
        void sourceHandle;
        return {
          ...photo,
          original: { name: photo.name, size: blob.size, type: photo.type },
          display: displayBlob
            ? { size: displayBlob.size, type: displayBlob.type }
            : null,
        };
      },
    );
    const header = new TextEncoder().encode(
      JSON.stringify({
        format: "LibreLux Catalog",
        version: 3,
        createdAt: new Date().toISOString(),
        records,
      }),
    );
    const data = new Blob(
      [
        header,
        new Uint8Array([10]),
        ...photos.flatMap((photo) =>
          photo.displayBlob ? [photo.blob, photo.displayBlob] : [photo.blob],
        ),
      ],
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
            display?: { size: number; type: string } | null;
          }
        >;
      };
      if (
        manifest.format !== "LibreLux Catalog" ||
        ![2, 3].includes(manifest.version)
      )
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
        const displaySize = record.display?.size ?? 0;
        const displayBlob = displaySize
          ? new Blob([bytes.slice(offset, offset + displaySize)], {
              type: record.display?.type,
            })
          : null;
        offset += displaySize;
        const { original: _original, display: _display, ...photo } = record;
        void _original;
        void _display;
        const runtime = {
          ...photo,
          blob,
          displayBlob,
          sourceBitDepth: photo.sourceBitDepth ?? 8,
          rawInfo: photo.rawInfo ?? null,
          importMethod: photo.importMethod ?? "copy",
          sourceHandle: null,
          snapshots: photo.snapshots ?? [],
          effectStack: photo.effectStack ?? [],
          reviewComments: photo.reviewComments ?? [],
          reviewLikes: photo.reviewLikes ?? [],
          url: URL.createObjectURL(displayBlob ?? blob),
          previewBlob: null,
          previewUrl: URL.createObjectURL(displayBlob ?? blob),
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
  ) => {
    setPresetAmount(100);
    setSelectedPreset((current) =>
      current?.id === id ? null : { id, name, settings },
    );
  };
  const persistUserPresets = (next: UserPreset[]) => {
    setUserPresets(next);
    void saveSetting("user-presets", next);
  };
  const createUserPreset = (group = "My presets") => {
    if (!selected) return;
    persistUserPresets([
      ...userPresets,
      {
        id: crypto.randomUUID(),
        name: `Custom ${userPresets.length + 1}`,
        group,
        settings: { ...selected.adjustments },
        createdAt: Date.now(),
        favorite: false,
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
      const source = await file.text();
      if (/\.xmp$/i.test(file.name)) {
        const attributes: Array<[RegExp, keyof Adjustments]> = [
          [/crs:Exposure(?:2012)?="([+-]?[\d.]+)"/i, "exposure"],
          [/crs:Contrast(?:2012)?="([+-]?[\d.]+)"/i, "contrast"],
          [/crs:Highlights(?:2012)?="([+-]?[\d.]+)"/i, "highlights"],
          [/crs:Shadows(?:2012)?="([+-]?[\d.]+)"/i, "shadows"],
          [/crs:Whites(?:2012)?="([+-]?[\d.]+)"/i, "whites"],
          [/crs:Blacks(?:2012)?="([+-]?[\d.]+)"/i, "blacks"],
          [/crs:Texture="([+-]?[\d.]+)"/i, "texture"],
          [/crs:Clarity(?:2012)?="([+-]?[\d.]+)"/i, "clarity"],
          [/crs:Dehaze="([+-]?[\d.]+)"/i, "dehaze"],
          [/crs:Vibrance="([+-]?[\d.]+)"/i, "vibrance"],
          [/crs:Saturation="([+-]?[\d.]+)"/i, "saturation"],
        ];
        const settings = Object.fromEntries(
          attributes.flatMap(([pattern, key]) => {
            const match = source.match(pattern);
            return match ? [[key, Number(match[1])]] : [];
          }),
        ) as Partial<Adjustments>;
        if (!Object.keys(settings).length) return;
        persistUserPresets([
          ...userPresets,
          {
            id: crypto.randomUUID(),
            name: file.name.replace(/\.xmp$/i, ""),
            group: "Camera Raw imports",
            settings,
            createdAt: Date.now(),
            favorite: false,
          },
        ]);
        return;
      }
      const data = JSON.parse(source) as {
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
            favorite: Boolean(preset.favorite),
          };
        })
        .filter((preset) => Object.keys(preset.settings).length);
      persistUserPresets([...userPresets, ...imported]);
    } catch {
      return;
    }
  };
  const importCreativeLut = async (file?: File) => {
    if (!file) return;
    const rows = (await file.text())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[\d.+-]/.test(line))
      .map((line) => line.split(/\s+/).slice(0, 3).map(Number))
      .filter((row) => row.length === 3 && row.every(Number.isFinite));
    if (rows.length < 2) return;
    const average = rows
      .reduce(
        (sum, row) => sum.map((value, index) => value + row[index]),
        [0, 0, 0],
      )
      .map((value) => value / rows.length);
    const settings: Partial<Adjustments> = {
      exposure: Math.max(
        -2,
        Math.min(
          2,
          Math.log2(Math.max(0.05, average.reduce((a, b) => a + b, 0) / 1.5)),
        ),
      ),
      temperature: Math.round((average[0] - average[2]) * 90),
      tint: Math.round((average[0] + average[2] - average[1] * 2) * 45),
      contrast: Math.round(
        Math.min(
          60,
          Math.max(
            -40,
            (rows.at(-1)!.reduce((a, b) => a + b, 0) -
              rows[0].reduce((a, b) => a + b, 0) -
              3) *
              25,
          ),
        ),
      ),
      saturation: Math.round(
        (Math.max(...average) - Math.min(...average)) * 70,
      ),
    };
    persistUserPresets([
      ...userPresets,
      {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.cube$/i, ""),
        group: "Imported LUTs",
        settings,
        createdAt: Date.now(),
        favorite: false,
      },
    ]);
    choosePreset(`lut-${file.name}`, file.name, settings);
  };
  const importOpticsProfiles = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as {
        profiles?: Partial<OpticsProfile>[];
      };
      const imported = (data.profiles ?? [])
        .filter((profile) => profile.camera && profile.lens && profile.settings)
        .map((profile) => ({
          id: crypto.randomUUID(),
          version: Number(profile.version) || 1,
          camera: String(profile.camera),
          lens: String(profile.lens),
          settings: profile.settings ?? {},
          source: "User import" as const,
        }));
      const next = [...opticsProfiles, ...imported];
      setOpticsProfiles(next);
      await saveSetting(
        "community-optics-profiles",
        next.filter((profile) => profile.source === "User import"),
      );
    } catch {
      setCatalogStatus("That optics profile package could not be read");
    }
  };
  const exportOpticsProfiles = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "LibreLux Community Optics",
            version: 1,
            profiles: opticsProfiles,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LibreLux-community-optics.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const installAiPack = async (kind: "restore" | "segment" | "all") => {
    try {
      setAiStatus("Preparing local AI pack…");
      await installLocalAiPack(kind, (message, progress) =>
        setAiStatus(
          `${message}${typeof progress === "number" ? ` · ${Math.round(progress)}%` : ""}`,
        ),
      );
      setAiPack(localAiPackState());
      setAiStatus("Local AI pack ready and cached on this device");
    } catch (error) {
      setAiStatus(
        error instanceof Error ? error.message : "Local AI pack install failed",
      );
    }
  };
  const buildNeuralPreview = async () => {
    if (!selected) return;
    try {
      setAiStatus("Running local neural restore…");
      const restored = await runNeuralRestore(
        selected.displayBlob ?? selected.blob,
        Math.max(1, selected.adjustments.neuralDenoise),
        Math.max(1, selected.adjustments.superResolution / 100),
        (message, progress) =>
          setAiStatus(
            `${message}${typeof progress === "number" ? ` · ${Math.round(progress)}%` : ""}`,
          ),
      );
      updateSelected((photo) => ({
        ...photo,
        displayBlob: restored,
        url: URL.createObjectURL(restored),
        aiHistory: [
          ...photo.aiHistory,
          {
            id: crypto.randomUUID(),
            action: "Local neural denoise and detail recovery",
            model: "Swin2SR lightweight x2 · local WebGPU/WASM",
            createdAt: Date.now(),
          },
        ],
      }));
      setAiPack(localAiPackState());
      setAiStatus("Neural preview ready; the original remains untouched");
    } catch (error) {
      setAiStatus(error instanceof Error ? error.message : "Neural restore failed");
    }
  };
  const installOpenOptics = async () => {
    try {
      const measured = await installMeasuredOpticsPack(setOpenPackStatus);
      setOpticsProfiles((current) => [
        ...current.filter((profile) => profile.source !== "Measured open data"),
        ...measured,
      ]);
      setOpenPackStatus(`${measured.length} measured lens profiles ready offline`);
    } catch (error) {
      setOpenPackStatus(
        error instanceof Error ? error.message : "Measured optics install failed",
      );
    }
  };
  const installSpectralProfiles = async () => {
    try {
      const installed = await installSpectralFilmPack(setOpenPackStatus);
      setSpectralProfiles(installed);
      setOpenPackStatus(`${installed.length} spectral film profiles ready offline`);
    } catch (error) {
      setOpenPackStatus(
        error instanceof Error ? error.message : "Measured film install failed",
      );
    }
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
  const createAdvancedSmartAlbum = () => {
    const album: AlbumRecord = {
      id: crypto.randomUUID(),
      name: `Smart selects ${albums.filter((item) => item.kind === "smart").length + 1}`,
      photoIds: [],
      createdAt: Date.now(),
      kind: "smart",
      parentId: null,
      rule: null,
      target: false,
      advancedRule: {
        op: "or",
        rules: [
          {
            op: "and",
            rules: [
              { field: "rating", operator: "at-least", value: 4 },
              { field: "rejected", operator: "equals", value: false },
            ],
          },
          { field: "flagged", operator: "equals", value: true },
        ],
      },
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
    let currentGroup: RuntimePhoto[] = [];
    const groups: RuntimePhoto[][] = [];
    ordered.forEach((photo, index) => {
      const time = photo.metadata.capturedAt
        ? Date.parse(photo.metadata.capturedAt)
        : photo.createdAt;
      const previous = ordered[index - 1];
      const previousTime = previous
        ? previous.metadata.capturedAt
          ? Date.parse(previous.metadata.capturedAt)
          : previous.createdAt
        : 0;
      const visuallyRelated =
        previous &&
        perceptualHashDistance(photo.perceptualHash, previous.perceptualHash) <=
          18;
      if (!previous || time - previousTime > 30000 || !visuallyRelated) {
        if (currentGroup.length) groups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(photo);
    });
    if (currentGroup.length) groups.push(currentGroup);
    const ids = new Map<string, string | null>();
    const covers = new Set<string>();
    groups.forEach((group) => {
      if (group.length < 2) {
        ids.set(group[0].id, null);
        return;
      }
      const stackId = crypto.randomUUID();
      group.forEach((photo) => ids.set(photo.id, stackId));
      const cover = [...group].sort(
        (a, b) =>
          evaluateCull(detailedCullScores(b.cull), cullPreferences).score -
          evaluateCull(detailedCullScores(a.cull), cullPreferences).score,
      )[0];
      covers.add(cover.id);
    });
    setPhotos((current) =>
      current.map((photo) => {
        const next = {
          ...photo,
          stackId: ids.get(photo.id) ?? null,
          stackCover: covers.has(photo.id),
        };
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
      largeText: boolean;
      learningTips: boolean;
      showFilmstrip: boolean;
      gridSize: number;
    }>,
  ) => {
    const next = {
      highContrast,
      reducedMotion,
      compactUi,
      largeText,
      learningTips,
      showFilmstrip,
      gridSize,
      ...patch,
    };
    if (patch.highContrast !== undefined) setHighContrast(patch.highContrast);
    if (patch.reducedMotion !== undefined)
      setReducedMotion(patch.reducedMotion);
    if (patch.compactUi !== undefined) setCompactUi(patch.compactUi);
    if (patch.largeText !== undefined) setLargeText(patch.largeText);
    if (patch.learningTips !== undefined) setLearningTips(patch.learningTips);
    if (patch.showFilmstrip !== undefined)
      setShowFilmstrip(patch.showFilmstrip);
    if (patch.gridSize !== undefined) setGridSize(patch.gridSize);
    void saveSetting("ui-preferences", next);
  };
  const savePanelWorkspace = (
    nextOrder = panelOrder,
    nextHidden = hiddenPanels,
    nextSolo = soloPanels,
  ) => {
    setPanelOrder(nextOrder);
    setHiddenPanels(nextHidden);
    setSoloPanels(nextSolo);
    void saveSetting("panel-workspace", {
      order: nextOrder,
      hidden: nextHidden,
      solo: nextSolo,
    });
  };
  const movePanel = (title: string, direction: -1 | 1) => {
    const index = panelOrder.indexOf(title);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= panelOrder.length) return;
    const next = [...panelOrder];
    [next[index], next[target]] = [next[target], next[index]];
    savePanelWorkspace(next);
  };
  const saveWorkspaceLayoutPreset = () =>
    void saveSetting("workspace-layout-preset", {
      showLeft,
      showRight,
      showFilmstrip,
      compactUi,
      panelOrder,
      hiddenPanels,
      soloPanels,
    }).then(() => setCatalogStatus("Workspace preset saved on this device"));
  const loadWorkspaceLayoutPreset = async () => {
    const preset = await readSetting<{
      showLeft: boolean;
      showRight: boolean;
      showFilmstrip: boolean;
      compactUi: boolean;
      panelOrder: string[];
      hiddenPanels: string[];
      soloPanels: boolean;
    }>("workspace-layout-preset");
    if (!preset) {
      setCatalogStatus("No saved workspace preset yet");
      return;
    }
    setShowLeft(preset.showLeft);
    setShowRight(preset.showRight);
    setShowFilmstrip(preset.showFilmstrip);
    setCompactUi(preset.compactUi);
    savePanelWorkspace(
      preset.panelOrder,
      preset.hiddenPanels,
      preset.soloPanels,
    );
    setCatalogStatus("Workspace preset restored");
  };
  const updateImportPreset = (
    patch: Partial<{
      organization: "source" | "date" | "custom";
      destination: string;
      duplicates: "skip" | "copy";
      method: ImportMethod;
    }>,
  ) => {
    const next = {
      organization: importOrganization,
      destination: importDestination,
      duplicates: duplicateImport,
      method: importMethod,
      ...patch,
    };
    if (patch.organization) setImportOrganization(patch.organization);
    if (patch.destination !== undefined)
      setImportDestination(patch.destination);
    if (patch.duplicates) setDuplicateImport(patch.duplicates);
    if (patch.method) setImportMethod(patch.method);
    void saveSetting("import-preset", next);
  };
  const addMask = (mask: MaskRecord) => {
    updateSelected((photo) => ({ ...photo, masks: [...photo.masks, mask] }));
    setSelectedMaskId(mask.id);
    setMaskTarget(null);
  };
  const saveDevelopSnapshot = () => {
    if (!selected) return;
    updateSelected((photo) => ({
      ...photo,
      snapshots: [
        ...photo.snapshots,
        {
          id: crypto.randomUUID(),
          name: `Snapshot ${photo.snapshots.length + 1}`,
          createdAt: Date.now(),
          adjustments: structuredClone(photo.adjustments),
        },
      ],
    }));
  };
  const applyDevelopSnapshot = (snapshot: DevelopSnapshot) => {
    if (!selected) return;
    setHistory((current) => [...current.slice(-29), selected.adjustments]);
    updateSelected((photo) => ({
      ...photo,
      adjustments: structuredClone(snapshot.adjustments),
    }));
  };
  const deleteDevelopSnapshot = (id: string) =>
    updateSelected((photo) => ({
      ...photo,
      snapshots: photo.snapshots.filter((snapshot) => snapshot.id !== id),
    }));
  const renameDevelopSnapshot = (id: string, name: string) =>
    updateSelected((photo) => ({
      ...photo,
      snapshots: photo.snapshots.map((snapshot) =>
        snapshot.id === id
          ? { ...snapshot, name: name.trim() || snapshot.name }
          : snapshot,
      ),
    }));
  const addEffectLayer = (
    name: string,
    settings: Partial<Adjustments>,
  ) =>
    updateSelected((photo) => ({
      ...photo,
      effectStack: [
        ...photo.effectStack,
        {
          id: crypto.randomUUID(),
          name,
          enabled: true,
          opacity: 100,
          blendMode: "normal",
          settings: structuredClone(settings),
        },
      ],
    }));
  const updateEffectLayer = (id: string, patch: Partial<EffectLayer>) =>
    updateSelected((photo) => ({
      ...photo,
      effectStack: photo.effectStack.map((layer) =>
        layer.id === id ? { ...layer, ...patch } : layer,
      ),
    }));
  const moveEffectLayer = (id: string, direction: -1 | 1) =>
    updateSelected((photo) => {
      const index = photo.effectStack.findIndex((layer) => layer.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= photo.effectStack.length)
        return photo;
      const effectStack = [...photo.effectStack];
      [effectStack[index], effectStack[target]] = [
        effectStack[target],
        effectStack[index],
      ];
      return { ...photo, effectStack };
    });
  const deleteEffectLayer = (id: string) =>
    updateSelected((photo) => ({
      ...photo,
      effectStack: photo.effectStack.filter((layer) => layer.id !== id),
    }));
  const saveSensorDustMap = async () => {
    if (!selected) return;
    const spots = selected.retouchSpots.filter(
      (spot) => spot.mode === "heal" || spot.mode === "remove",
    );
    if (!spots.length) {
      setCatalogStatus(
        "Mark dust spots with Heal or Remove before learning a map",
      );
      return;
    }
    const camera = selected.metadata.camera || "generic-camera";
    await saveSetting(`sensor-dust-map:${camera}`, spots);
    setCatalogStatus(`Saved ${spots.length}-spot dust map for ${camera}`);
  };
  const applySensorDustMap = async () => {
    if (!selected) return;
    const camera = selected.metadata.camera || "generic-camera";
    const spots = await readSetting<RetouchSpot[]>(`sensor-dust-map:${camera}`);
    if (!spots?.length) {
      setCatalogStatus(`No dust map saved for ${camera}`);
      return;
    }
    updateSelected((photo) => ({
      ...photo,
      retouchSpots: [
        ...photo.retouchSpots,
        ...spots.map((spot) => ({ ...spot, id: crypto.randomUUID() })),
      ],
      adjustments: {
        ...photo.adjustments,
        dustRemoval: Math.max(35, photo.adjustments.dustRemoval),
      },
    }));
    setCatalogStatus(`Applied ${spots.length}-spot dust map for ${camera}`);
  };
  const detectSensorDust = async () => {
    if (!selected) return;
    const { canvas, pixels } = await readImagePixels(selected.url, 320);
    const candidates: Array<{ x: number; y: number; strength: number }> = [];
    for (let y = 3; y < canvas.height - 3; y += 2)
      for (let x = 3; x < canvas.width - 3; x += 2) {
        const offset = (y * canvas.width + x) * 4;
        const luma =
          pixels.data[offset] * 0.2126 +
          pixels.data[offset + 1] * 0.7152 +
          pixels.data[offset + 2] * 0.0722;
        const around = [
          offset - 12,
          offset + 12,
          offset - canvas.width * 12,
          offset + canvas.width * 12,
        ].reduce(
          (sum, point) =>
            sum +
            pixels.data[point] * 0.2126 +
            pixels.data[point + 1] * 0.7152 +
            pixels.data[point + 2] * 0.0722,
          0,
        ) / 4;
        const strength = around - luma;
        if (strength > 34 && around > 55) candidates.push({ x, y, strength });
      }
    const chosen = candidates
      .sort((a, b) => b.strength - a.strength)
      .filter(
        (candidate, index, all) =>
          all.slice(0, index).every(
            (other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) > 12,
          ),
      )
      .slice(0, 24);
    updateSelected((photo) => ({
      ...photo,
      retouchSpots: [
        ...photo.retouchSpots,
        ...chosen.map((candidate) => ({
          id: crypto.randomUUID(),
          mode: "remove" as const,
          x: candidate.x / canvas.width,
          y: candidate.y / canvas.height,
          sourceX: Math.min(1, (candidate.x + 12) / canvas.width),
          sourceY: candidate.y / canvas.height,
          size: 2.5,
          feather: 72,
        })),
      ],
    }));
    setCatalogStatus(
      chosen.length
        ? `${chosen.length} possible dust spots added for individual review`
        : "No strong dust candidates found",
    );
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
      aiHistory:
        spot.mode === "generativeRemove"
          ? [
              ...photo.aiHistory,
              {
                id: crypto.randomUUID(),
                action: "Generative remove",
                model: "LibreLux local browser fill",
                createdAt: Date.now(),
              },
            ]
          : photo.aiHistory,
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
  const recordAiOperation = (action: string) =>
    updateSelected((photo) => ({
      ...photo,
      aiHistory: [
        ...photo.aiHistory,
        {
          id: crypto.randomUUID(),
          action,
          model: "LibreLux local browser pipeline",
          createdAt: Date.now(),
        },
      ],
    }));
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
  const openPhotoPicker = useCallback(async () => {
    if (importMethod !== "copy" && window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: "Photos and camera RAW files",
              accept: {
                "image/*": [
                  ".jpg",
                  ".jpeg",
                  ".png",
                  ".webp",
                  ".heic",
                  ".heif",
                  ".tif",
                  ".tiff",
                  ".dng",
                  ".cr2",
                  ".cr3",
                  ".nef",
                  ".arw",
                  ".raf",
                  ".orf",
                  ".rw2",
                ],
              },
            },
          ],
        });
        const pairs = await Promise.all(
          handles.map(
            async (handle) => [await handle.getFile(), handle] as const,
          ),
        );
        await importFiles(
          pairs.map(([file]) => file),
          new Map(pairs),
        );
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    document.getElementById("librelux-photo-import")?.click();
  }, [importFiles, importMethod]);
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
          name: "export_local_review_gallery",
          title: "Export local review gallery",
          description:
            "Build a private, self-contained HTML review gallery from the current LibreLux selection without uploading photos.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute() {
            void exportLocalLayout("gallery");
            return {
              exported: true,
              localOnly: true,
              photoCount: selectedIds.length || photos.length,
            };
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
  }, [
    selected,
    updateSelected,
    opticsMode,
    selectedIds.length,
    photos.length,
    exportLocalLayout,
  ]);
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
  const doExport = async (formatOverride?: ExportFormat) => {
    if (!selected) return;
    const targetFormat = formatOverride ?? exportFormat;
    const image = new Image();
    image.src = selected.url;
    await image.decode();
    let sx = 0,
      sy = 0,
      sw = image.naturalWidth,
      sh = image.naturalHeight;
    let factor =
      (exportScale / 100) *
      Math.max(1, selected.adjustments.superResolution / 100);
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
    for (const layer of selected.effectStack.filter(
      (item) => item.enabled && item.opacity > 0,
    )) {
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation =
        layer.blendMode === "normal" ? "source-over" : layer.blendMode;
      ctx.filter = cssFilter(
        { ...selected.adjustments, ...layer.settings },
        selected.processVersion,
      );
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
      ctx.restore();
    }
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
        ctx.filter = `${cssFilter(selected.adjustments)}${spot.mode === "heal" || spot.mode === "remove" || spot.mode === "generativeRemove" ? ` blur(${spot.feather / 80}px)` : ""}`;
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
    if (
      selected.adjustments.paperTexture > 0 ||
      selected.adjustments.age > 0 ||
      selected.adjustments.textureAsset > 0
    ) {
      ctx.save();
      ctx.resetTransform();
      ctx.globalAlpha = Math.min(
        0.18,
        (selected.adjustments.paperTexture +
          selected.adjustments.age +
          selected.adjustments.textureAsset * 8) /
          900,
      );
      ctx.fillStyle = "#f1d7a6";
      for (let i = 0; i < 1200; i++) {
        const x = (i * 7919) % canvas.width;
        const y = (i * 104729) % canvas.height;
        const s = 1 + ((i + selected.adjustments.textureAsset) % 4);
        if (selected.adjustments.textureAsset === 2 && i % 9 === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 18 + (i % 31), y + 2);
          ctx.strokeStyle = "#fff";
          ctx.stroke();
        } else ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    }
    if (selected.adjustments.textureAsset > 0) {
      const texture = new Image();
      texture.src = "/textures/analog-dust-scratches.png";
      await texture.decode();
      ctx.save();
      ctx.resetTransform();
      ctx.globalCompositeOperation =
        selected.adjustments.textureAsset === 1 ? "soft-light" : "screen";
      ctx.globalAlpha = Math.min(
        0.32,
        0.06 + selected.adjustments.textureAsset * 0.055,
      );
      const tile = Math.max(720, Math.min(canvas.width, canvas.height));
      for (let y = 0; y < canvas.height; y += tile)
        for (let x = 0; x < canvas.width; x += tile)
          ctx.drawImage(texture, x, y, tile, tile);
      ctx.restore();
    }
    applyTiledDetail(ctx, canvas.width, canvas.height, {
      deconvolution: selected.adjustments.deconvolution,
      apertureCorrection: selected.adjustments.apertureCorrection,
      cornerSharpness: selected.adjustments.cornerSharpness,
      outputSharpen:
        outputSharpen === "none" ? 0 : outputSharpen === "screen" ? 18 : 28,
    });
    applyDepthAwareLensBlur(
      ctx,
      canvas.width,
      canvas.height,
      selected.adjustments.lensBlur,
      selected.adjustments.lensBlurFocus,
      selected.adjustments.lensBlurHighlights,
      selected.adjustments.lensBlurBokeh,
    );
    applyComputationalCorrections(ctx, selected.adjustments);
    applyFilmGrain(
      ctx,
      canvas.width,
      canvas.height,
      selected.adjustments.grain,
      selected.adjustments.grainSize,
      selected.adjustments.grainRoughness,
      selected.adjustments.textureAsset,
    );
    if (
      selected.adjustments.neuralDenoise > 0 ||
      selected.adjustments.superResolution > 100
    ) {
      const input = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (input) {
        const restored = await runNeuralRestore(
          input,
          Math.max(
            selected.adjustments.neuralDenoise,
            selected.adjustments.superResolution - 100,
          ),
          1,
          (message, progress) =>
            setAiStatus(
              `${message}${typeof progress === "number" ? ` · ${Math.round(progress)}%` : ""}`,
            ),
        );
        const restoredImage = new Image();
        restoredImage.src = URL.createObjectURL(restored);
        await restoredImage.decode();
        ctx.save();
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.drawImage(restoredImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        URL.revokeObjectURL(restoredImage.src);
      }
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
    if (
      proofProfile !== "srgb" &&
      targetFormat !== "tiff" &&
      targetFormat !== "dng"
    )
      ctx.putImageData(
        convertImageColorSpace(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
          proofProfile,
        ),
        0,
        0,
      );
    const mime =
      targetFormat === "png"
        ? "image/png"
        : targetFormat === "webp"
          ? "image/webp"
          : targetFormat === "avif"
            ? "image/avif"
            : "image/jpeg";
    let blob: Blob | null;
    const highBitRawExport =
      (targetFormat === "tiff" || targetFormat === "dng") &&
      isRawFile({ name: selected.name }) &&
      selected.retouchSpots.length === 0 &&
      !watermark.trim() &&
      !watermarkImage;
    if (highBitRawExport) {
      try {
        const linear = await buildLinearRawExport(
          selected,
          {
            sourceX: sx,
            sourceY: sy,
            sourceWidth: sw,
            sourceHeight: sh,
            width: canvas.width,
            height: canvas.height,
          },
          outputSharpen,
        );
        blob = encodeLinearRgb16(
          linear,
          targetFormat === "tiff" ? "tiff16" : "dng16",
          proofProfile,
          selected.metadata.camera,
        );
      } catch (error) {
        setCatalogStatus(
          `Linear RAW export fell back to the display renderer: ${error instanceof Error ? error.message : "source unavailable"}`,
        );
        blob = encodeRgb16(
          ctx.getImageData(0, 0, canvas.width, canvas.height),
          targetFormat === "tiff" ? "tiff16" : "dng16",
          proofProfile,
          selected.metadata.camera,
        );
      }
    } else if (targetFormat === "tiff" || targetFormat === "dng") {
      blob = encodeRgb16(
        ctx.getImageData(0, 0, canvas.width, canvas.height),
        targetFormat === "tiff" ? "tiff16" : "dng16",
        proofProfile,
        selected.metadata.camera,
      );
    } else {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, exportQuality / 100),
      );
    }
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
                contentCredentials: {
                  localOnly: true,
                  aiOperations: selected.aiHistory,
                },
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        )
      : null;
    if (exportDirectory) {
      const extension = targetFormat === "jpeg" ? "jpg" : targetFormat;
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
    const extension = targetFormat === "jpeg" ? "jpg" : targetFormat;
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
  const runBatchExport = async () => {
    const targets = photos.filter((photo) =>
      (selectedIds.length
        ? selectedIds
        : selectedId
          ? [selectedId]
          : []
      ).includes(photo.id),
    );
    if (!targets.length) return;
    cancelJobsRef.current = false;
    pauseJobsRef.current = false;
    setProgressOpen(true);
    setProgressJobs(
      targets.map((photo) => ({
        id: photo.id,
        name: photo.name,
        kind: "export",
        progress: 0,
        status: "queued",
      })),
    );
    for (const photo of targets) {
      while (pauseJobsRef.current && !cancelJobsRef.current)
        await new Promise((resolve) => window.setTimeout(resolve, 200));
      if (cancelJobsRef.current) {
        setProgressJobs((current) =>
          current.map((job) =>
            job.status === "queued" ? { ...job, status: "cancelled" } : job,
          ),
        );
        break;
      }
      setProgressJobs((current) =>
        current.map((job) =>
          job.id === photo.id
            ? { ...job, status: "running", progress: 15 }
            : job,
        ),
      );
      try {
        const image = new Image();
        image.src = photo.url;
        await image.decode();
        const factor = Math.max(0.01, exportScale / 100);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.filter = cssFilter(photo.adjustments, photo.processVersion);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const layer of photo.effectStack.filter(
          (item) => item.enabled && item.opacity > 0,
        )) {
          context.save();
          context.globalAlpha = layer.opacity / 100;
          context.globalCompositeOperation =
            layer.blendMode === "normal" ? "source-over" : layer.blendMode;
          context.filter = cssFilter(
            { ...photo.adjustments, ...layer.settings },
            photo.processVersion,
          );
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          context.restore();
        }
        applyTiledDetail(context, canvas.width, canvas.height, {
          deconvolution: photo.adjustments.deconvolution,
          apertureCorrection: photo.adjustments.apertureCorrection,
          cornerSharpness: photo.adjustments.cornerSharpness,
          outputSharpen:
            outputSharpen === "none" ? 0 : outputSharpen === "screen" ? 18 : 28,
        });
        applyDepthAwareLensBlur(
          context,
          canvas.width,
          canvas.height,
          photo.adjustments.lensBlur,
          photo.adjustments.lensBlurFocus,
          photo.adjustments.lensBlurHighlights,
          photo.adjustments.lensBlurBokeh,
        );
        applyComputationalCorrections(context, photo.adjustments);
        applyFilmGrain(
          context,
          canvas.width,
          canvas.height,
          photo.adjustments.grain,
          photo.adjustments.grainSize,
          photo.adjustments.grainRoughness,
          photo.adjustments.textureAsset,
        );
        setProgressJobs((current) =>
          current.map((job) =>
            job.id === photo.id ? { ...job, progress: 70 } : job,
          ),
        );
        const mime =
          exportFormat === "png"
            ? "image/png"
            : exportFormat === "webp"
              ? "image/webp"
              : exportFormat === "avif"
                ? "image/avif"
                : "image/jpeg";
        let blob: Blob | null;
        const highBitRawExport =
          (exportFormat === "tiff" || exportFormat === "dng") &&
          isRawFile({ name: photo.name }) &&
          photo.retouchSpots.length === 0;
        if (highBitRawExport) {
          const linear = await buildLinearRawExport(
            photo,
            {
              sourceX: 0,
              sourceY: 0,
              sourceWidth: image.naturalWidth,
              sourceHeight: image.naturalHeight,
              width: canvas.width,
              height: canvas.height,
            },
            outputSharpen,
          );
          blob = encodeLinearRgb16(
            linear,
            exportFormat === "tiff" ? "tiff16" : "dng16",
            proofProfile,
            photo.metadata.camera,
          );
        } else if (exportFormat === "tiff" || exportFormat === "dng") {
          blob = encodeRgb16(
            context.getImageData(0, 0, canvas.width, canvas.height),
            exportFormat === "tiff" ? "tiff16" : "dng16",
            proofProfile,
            photo.metadata.camera,
          );
        } else {
          const workerInput = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png"),
          );
          if (!workerInput) throw new Error("Batch worker input failed");
          const rendered = await createPreviewInWorker(
            workerInput,
            Math.max(canvas.width, canvas.height),
            {
              mime,
              quality: exportQuality / 100,
              strength: Math.max(0, photo.adjustments.sharpness / 180),
            },
          );
          blob = rendered.blob;
        }
        if (!blob) throw new Error("Export encoding failed");
        const extension = exportFormat === "jpeg" ? "jpg" : exportFormat;
        let name = `${renderedExportName(photo)}.${extension}`;
        if (exportDirectory) {
          if (exportDirectory.values) {
            const existing: string[] = [];
            for await (const entry of exportDirectory.values())
              if (entry.kind === "file" && entry.name) existing.push(entry.name);
            name = availableCollisionName(name, existing);
          }
          const handle = await exportDirectory.getFileHandle(name, {
            create: true,
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          const written = await handle.getFile?.();
          if (written && written.size !== blob.size)
            throw new Error("Export verification failed");
        } else {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = name;
          anchor.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        setProgressJobs((current) =>
          current.map((job) =>
            job.id === photo.id
              ? { ...job, status: "done", progress: 100 }
              : job,
          ),
        );
      } catch {
        setProgressJobs((current) =>
          current.map((job) =>
            job.id === photo.id ? { ...job, status: "failed" } : job,
          ),
        );
      }
    }
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
      aiHistory: selected.aiHistory,
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
  const transformPhoto = previewPhoto ?? selected;
  const photoTransform = transformPhoto
    ? `translate(${transformPhoto.adjustments.offsetX / 4}px,${transformPhoto.adjustments.offsetY / 4}px) rotate(${transformPhoto.adjustments.rotation}deg) scale(${transformPhoto.adjustments.flipX * (transformPhoto.adjustments.perspectiveScale / 100) * (1 + transformPhoto.adjustments.distortion / 700) * (1 + transformPhoto.adjustments.anamorphic / 200) * (1 + transformPhoto.adjustments.volumeDeform / 1000)},${transformPhoto.adjustments.flipY * (transformPhoto.adjustments.perspectiveScale / 100) * (1 + transformPhoto.adjustments.distortion / 700) * (1 - transformPhoto.adjustments.volumeDeform / 1500)}) perspective(900px) rotateX(${transformPhoto.adjustments.perspectiveV / 15}deg) rotateY(${transformPhoto.adjustments.perspectiveH / 15}deg)`
    : "";
  return (
    <main
      className={`app-shell ${highContrast ? "high-contrast" : ""} ${reducedMotion ? "reduced-motion" : ""} ${compactUi ? "compact-ui" : ""} ${largeText ? "large-text" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void importFiles(e.dataTransfer.files);
      }}
    >
      <a className="skip-link" href="#librelux-workspace">
        Skip to photo workspace
      </a>
      <input
        id="librelux-photo-import"
        type="file"
        accept="image/*,.dng,.raw,.cr2,.cr3,.nef,.arw,.orf,.rw2"
        multiple
        hidden
        onChange={(e) => e.target.files && void importFiles(e.target.files)}
      />
      <input
        ref={presetImportRef}
        type="file"
        accept="application/json,.json,.xmp,application/rdf+xml"
        hidden
        onChange={(event) => void importUserPresets(event.target.files?.[0])}
      />
      <input
        ref={lutImportRef}
        type="file"
        accept=".cube,text/plain"
        hidden
        onChange={(event) => void importCreativeLut(event.target.files?.[0])}
      />
      <input
        ref={psdImportRef}
        type="file"
        accept=".psd,image/vnd.adobe.photoshop"
        hidden
        onChange={(event) => void importReturnedPsd(event.target.files?.[0])}
      />
      <input
        ref={opticsProfileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => void importOpticsProfiles(event.target.files?.[0])}
      />
      <input
        ref={catalogImportRef}
        type="file"
        accept=".libreluxcat,application/x-librelux-catalog"
        hidden
        onChange={(event) => void restoreCatalog(event.target.files?.[0])}
      />
      <input
        ref={publishServiceRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          void importPublishService(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
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
            <img src="/librelux-logo.svg" alt="" aria-hidden="true" />
          </div>
          <strong>LibreLux</strong>
          <span>by Good Tools</span>
        </div>
        <nav className="workspace-tabs" role="tablist" aria-label="Workspaces">
            <button
              role="tab"
              aria-selected={workspace === "library"}
              onClick={() => setWorkspace("library")}
            >
              <Library /> Library <kbd>G</kbd>
            </button>
            <button
              role="tab"
              aria-selected={workspace === "develop"}
              onClick={() => setWorkspace("develop")}
            >
              <SlidersHorizontal /> Develop <kbd>D</kbd>
            </button>
            <button
              role="tab"
              aria-selected={workspace === "enhance"}
              onClick={() => setWorkspace("enhance")}
            >
              <Sparkles /> Optics <kbd>E</kbd>
            </button>
        </nav>
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
              onClick={() => void openPhotoPicker()}
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
            <button onClick={() => void startTetheredCapture()}>
              <Aperture /> Tethered capture
            </button>
            <button onClick={batchRenameAndSync} disabled={!selected}>
              <SlidersHorizontal /> Batch rename & sync
            </button>
            <button onClick={() => void createContactSheet()}>
              <Grid3X3 /> Contact sheet
            </button>
            <button
              onClick={() => {
                setSlideshowIndex(0);
                setSlideshowOpen(true);
              }}
              disabled={!photos.length}
            >
              <ImagePlus /> Slideshow
            </button>
            <button onClick={() => void exportLocalLayout("gallery")}>
              <Download /> Local web gallery
            </button>
            <button onClick={() => void exportLocalLayout("gallery", true)}>
              <ArrowDownToLine /> Share review gallery
            </button>
            <button onClick={() => void exportLocalLayout("book")}>
              <BookOpen /> Photo-book layout
            </button>
            <button onClick={() => void exportLocalLayout("print")}>
              <BookOpen /> Print workspace / PDF
            </button>
            <button onClick={() => void exportLocalLayout("slideshow")}>
              <Download /> Export slideshow
            </button>
            <button onClick={() => publishServiceRef.current?.click()}>
              <Plus /> Install publish service
            </button>
            {publishServices.map((service) => (
              <button
                key={service.id}
                onClick={() => void publishSelection(service)}
                disabled={!selected}
              >
                <ArrowDownToLine /> Publish to {service.name}
              </button>
            ))}
            <button onClick={() => void handoffPsd(false)} disabled={!selected}>
              <Download /> Export layered PSD
            </button>
            <button onClick={() => void handoffPsd(true)} disabled={!selected}>
              <ArrowDownToLine /> Send to LibreLayer
            </button>
            <button onClick={() => psdImportRef.current?.click()}>
              <FolderOpen /> Return from LibreLayer
            </button>
            <button onClick={() => void mergeSelectedHdr()}>
              <Sparkles /> HDR merge & deghost
            </button>
            <button onClick={() => void mergeSelectedPanorama()}>
              <Columns2 /> Panorama & edge fill
            </button>
            <button onClick={() => void mergeSelectedHdrPanorama()}>
              <Sparkles /> HDR panorama
            </button>
            <button onClick={() => void mergeSelectedFocusStack()}>
              <Columns2 /> Focus stack
            </button>
            <button onClick={() => void mergeSelectedMultiFrame()}>
              <Grid3X3 /> Multi-frame clean
            </button>
            <button onClick={() => setVideoLabOpen(true)}>
              <SlidersHorizontal /> Video lab
            </button>
          </nav>
          {!!captureMonths.length && (
            <>
              <div className="section-title">
                <span>Calendar</span>
              </div>
              <nav className="source-list compact" aria-label="Capture month">
                <button
                  className={monthFilter === null ? "selected" : ""}
                  onClick={() => setMonthFilter(null)}
                >
                  <span>All dates</span>
                </button>
                {captureMonths.slice(0, 18).map((month) => (
                  <button
                    key={month}
                    className={monthFilter === month ? "selected" : ""}
                    onClick={() => setMonthFilter(monthFilter === month ? null : month)}
                  >
                    <span>
                      {new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </nav>
            </>
          )}
          {catalogStatus && (
            <p className="catalog-status" role="status" aria-live="polite">
              {catalogStatus}
            </p>
          )}
          {watchStatus && (
            <p className="catalog-status" role="status" aria-live="polite">
              {watchStatus}
            </p>
          )}
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
            <button onClick={createAdvancedSmartAlbum}>Nested smart</button>
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
        <section
          className="main-stage"
          id="librelux-workspace"
          aria-label={`${workspace} photo workspace`}
          tabIndex={-1}
        >
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
          {learningTips && (
            <div className="learning-overlay" role="note">
              <span>
                {workspace === "library"
                  ? "Tip: Shift-click photos to compare, batch, or build a sequence."
                  : workspace === "develop"
                    ? "Tip: Drag the histogram regions or press \\ for before and after."
                    : "Tip: LibrePure, LibreFX, and LibreFilm stay non-destructive."}
              </span>
              <button
                aria-label="Hide learning overlays"
                onClick={() => updateUiPreferences({ learningTips: false })}
              >
                <X />
              </button>
            </div>
          )}
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
                    cullPreferences={cullPreferences}
                    setCullPreferences={(next) => {
                      setCullPreferences(next);
                      localStorage.setItem(
                        "librelux-cull-preferences",
                        JSON.stringify(next),
                      );
                    }}
            />
          ) : selected ? (
            <EditorCanvas
              key={selected.id}
              photo={previewPhoto ?? selected}
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
              maskEdge={maskEdge}
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
                selected.size < processingBudget.maxPixels * 2
              }
            />
          ) : (
            <EmptyLibrary onImport={() => void openPhotoPicker()} />
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
                ? `${selected.name} · ${formatBytes(selected.size)} · ${selected.size >= processingBudget.maxPixels * 2 ? `Smart preview · ${processingBudget.tileSize}px tiles` : `Full preview · ${processingBudget.budgetMb} MB budget`}`
                : "No photo selected"}
            </span>
            <button
              className="progress-button"
              onClick={() => setProgressOpen(true)}
            >
              Jobs{" "}
              {
                progressJobs.filter(
                  (job) => job.status === "running" || job.status === "queued",
                ).length
              }
            </button>
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
            <PanelWorkspaceContext.Provider
              value={{
                order: panelOrder,
                hidden: hiddenPanels,
                solo: soloPanels,
                active: activePanel,
                setActive: setActivePanel,
              }}
            >
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
                    maskEdge={maskEdge}
                    setMaskEdge={setMaskEdge}
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
                    recordAiOperation={recordAiOperation}
                    importCreativeLut={() => lutImportRef.current?.click()}
                    saveSnapshot={saveDevelopSnapshot}
                    applySnapshot={applyDevelopSnapshot}
                    deleteSnapshot={deleteDevelopSnapshot}
                    renameSnapshot={renameDevelopSnapshot}
                  />
                ) : opticsMode === "pure" ? (
                  <PurePanels
                    photo={selected}
                    setAdjustment={setAdjustment}
                    selectedPreset={selectedPreset}
                    choosePreset={choosePreset}
                    autoEnhance={autoEnhance}
                    opticsProfiles={opticsProfiles}
                    importOpticsProfiles={() =>
                      opticsProfileRef.current?.click()
                    }
                    exportOpticsProfiles={exportOpticsProfiles}
                    saveSensorDustMap={saveSensorDustMap}
                    applySensorDustMap={applySensorDustMap}
                    detectSensorDust={detectSensorDust}
                    aiPack={aiPack}
                    aiStatus={aiStatus}
                    installAiPack={installAiPack}
                    buildNeuralPreview={buildNeuralPreview}
                    installOpenOptics={installOpenOptics}
                    openPackStatus={openPackStatus}
                  />
                ) : opticsMode === "creative" ? (
                  <CreativePanels
                    photo={selected}
                    setAdjustment={setAdjustment}
                    applyPreset={applyPreset}
                    selectedPreset={selectedPreset}
                    choosePreset={choosePreset}
                    addEffectLayer={addEffectLayer}
                    updateEffectLayer={updateEffectLayer}
                    moveEffectLayer={moveEffectLayer}
                    deleteEffectLayer={deleteEffectLayer}
                  />
                ) : (
                  <FilmPanels
                    photo={selected}
                    setAdjustment={setAdjustment}
                    applyPreset={applyPreset}
                    selectedPreset={selectedPreset}
                    choosePreset={choosePreset}
                    createFilmProfile={() => createUserPreset("Film profiles")}
                    exportFilmProfiles={exportUserPresets}
                    spectralProfiles={spectralProfiles}
                    installSpectralProfiles={installSpectralProfiles}
                    cacheHistory={async () => {
                      try {
                        setOpenPackStatus("Caching licensed film history images…");
                        await cacheFilmHistoryImages();
                        setOpenPackStatus("Film history is available offline");
                      } catch (error) {
                        setOpenPackStatus(
                          error instanceof Error
                            ? error.message
                            : "Film history cache failed",
                        );
                      }
                    }}
                    openPackStatus={openPackStatus}
                  />
                )}
              </div>
            </PanelWorkspaceContext.Provider>
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
        onRenderDng={() => void doExport("dng")}
        onBatchExport={runBatchExport}
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
              aria-pressed={largeText}
              onClick={() => updateUiPreferences({ largeText: !largeText })}
            >
              <span>
                <strong>200% interface text</strong>
                <small>Enlarges labels without hiding tools</small>
              </span>
              <i />
            </button>
            <button
              aria-pressed={learningTips}
              onClick={() =>
                updateUiPreferences({ learningTips: !learningTips })
              }
            >
              <span>
                <strong>Learning overlays</strong>
                <small>Show contextual workflow guidance</small>
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
            <label>
              <span>
                <strong>Import organization</strong>
                <small>Saved import preset</small>
              </span>
              <select
                value={importOrganization}
                onChange={(event) =>
                  updateImportPreset({
                    organization: event.target.value as
                      | "source"
                      | "date"
                      | "custom",
                  })
                }
              >
                <option value="source">Source folder</option>
                <option value="date">Capture month</option>
                <option value="custom">Custom destination</option>
              </select>
            </label>
            {importOrganization === "custom" && (
              <label>
                <span>
                  <strong>Import destination</strong>
                  <small>Catalog folder name</small>
                </span>
                <input
                  value={importDestination}
                  onChange={(event) =>
                    updateImportPreset({ destination: event.target.value })
                  }
                />
              </label>
            )}
            <label>
              <span>
                <strong>Import method</strong>
                <small>
                  Add keeps originals in place; move removes the source when the
                  browser permits it
                </small>
              </span>
              <select
                value={importMethod}
                onChange={(event) =>
                  updateImportPreset({
                    method: event.target.value as ImportMethod,
                  })
                }
              >
                <option value="copy">Copy into local catalog</option>
                <option value="add">Add in place</option>
                <option value="move">Move into local catalog</option>
              </select>
            </label>
            <label>
              <span>
                <strong>Duplicate imports</strong>
                <small>Skip matches or create another copy</small>
              </span>
              <select
                value={duplicateImport}
                onChange={(event) =>
                  updateImportPreset({
                    duplicates: event.target.value as "skip" | "copy",
                  })
                }
              >
                <option value="skip">Skip exact matches</option>
                <option value="copy">Import another copy</option>
              </select>
            </label>
            <section className="panel-workspace-editor">
              <div>
                <strong>Panel workspace</strong>
                <small>
                  Reorder tools, hide panels, or keep one open at a time
                </small>
              </div>
              <button
                aria-pressed={soloPanels}
                onClick={() =>
                  savePanelWorkspace(panelOrder, hiddenPanels, !soloPanels)
                }
              >
                Solo mode {soloPanels ? "on" : "off"}
              </button>
              {panelOrder.map((title, index) => (
                <div className="panel-order-row" key={title}>
                  <button
                    aria-pressed={!hiddenPanels.includes(title)}
                    onClick={() =>
                      savePanelWorkspace(
                        panelOrder,
                        hiddenPanels.includes(title)
                          ? hiddenPanels.filter((item) => item !== title)
                          : [...hiddenPanels, title],
                      )
                    }
                  >
                    {hiddenPanels.includes(title) ? "Show" : "Hide"}
                  </button>
                  <span>{title}</span>
                  <button
                    disabled={index === 0}
                    onClick={() => movePanel(title, -1)}
                    aria-label={`Move ${title} up`}
                  >
                    ↑
                  </button>
                  <button
                    disabled={index === panelOrder.length - 1}
                    onClick={() => movePanel(title, 1)}
                    aria-label={`Move ${title} down`}
                  >
                    ↓
                  </button>
                </div>
              ))}
              <div className="workspace-preset-actions">
                <button onClick={saveWorkspaceLayoutPreset}>
                  Save workspace
                </button>
                <button onClick={() => void loadWorkspaceLayoutPreset()}>
                  Load workspace
                </button>
              </div>
            </section>
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
      <Dialog
        open={tetherOpen}
        onOpenChange={(open) => {
          if (!open) stopTetheredCapture();
        }}
      >
        <DialogContent className="tether-dialog">
          <DialogHeader>
            <DialogTitle>Tethered camera</DialogTitle>
            <DialogDescription>
              Capture directly from a connected camera or webcam. Frames stay on
              this device.
            </DialogDescription>
          </DialogHeader>
          <video ref={tetherVideoRef} muted playsInline />
          <div className="tether-controls">
            {(
              [
                ["exposureCompensation", "Exposure", "exposure"],
                ["colorTemperature", "White balance", "whiteBalance"],
                ["focusDistance", "Focus", "focus"],
                ["zoom", "Zoom", "zoom"],
              ] as const
            ).map(([capability, label, stateKey]) => {
              const range = tetherCapabilities[capability];
              if (!range || range.min === undefined || range.max === undefined)
                return null;
              return (
                <label key={capability}>
                  <span>{label}</span>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step ?? (range.max - range.min) / 100}
                    value={tetherControls[stateKey]}
                    onChange={(event) =>
                      void setTetherConstraint(
                        capability,
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
              );
            })}
          </div>
          <p className="panel-note">
            Controls appear only when the connected camera and browser expose
            them. USB/PTP-only camera settings still require the maker&apos;s
            desktop bridge.
          </p>
          <DialogFooter>
            <button onClick={stopTetheredCapture}>Disconnect</button>
            <button
              className="primary-button"
              onClick={() => void captureTetheredFrame()}
            >
              Capture frame
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Progress center</DialogTitle>
            <DialogDescription>
              Background imports, analysis, merges, and exports appear here.
            </DialogDescription>
          </DialogHeader>
          <div className="progress-jobs">
            {progressJobs.length ? (
              progressJobs.map((job) => (
                <div key={`${job.kind}-${job.id}`}>
                  <span>{job.name}</span>
                  <progress max="100" value={job.progress} />
                  <b>{job.status}</b>
                </div>
              ))
            ) : (
              <p className="panel-note">No background jobs yet.</p>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                cancelJobsRef.current = true;
                setProgressJobs((current) =>
                  current.map((job) =>
                    job.status === "running" || job.status === "queued"
                      ? { ...job, status: "cancelled" }
                      : job,
                  ),
                );
              }}
            >
              Cancel active
            </button>
            <button
              onClick={() => {
                pauseJobsRef.current = !pauseJobsRef.current;
                setProgressJobs((current) =>
                  current.map((job) =>
                    job.status === "running"
                      ? { ...job, status: "paused" }
                      : job.status === "paused"
                        ? { ...job, status: "queued" }
                        : job,
                  ),
                );
              }}
            >
              Pause / resume
            </button>
            <button onClick={() => void runBatchExport()}>Retry batch</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={slideshowOpen} onOpenChange={setSlideshowOpen}>
        <DialogContent className="slideshow-dialog">
          {photos[slideshowIndex] && (
            <>
              <img
                src={photos[slideshowIndex].url}
                alt={photos[slideshowIndex].name}
                style={{
                  filter: cssFilter(
                    photos[slideshowIndex].adjustments,
                    photos[slideshowIndex].processVersion,
                  ),
                }}
              />
              <strong>
                {photos[slideshowIndex].metadata.title ||
                  photos[slideshowIndex].name}
              </strong>
            </>
          )}
          <label className="meta-field">
            <span>Music URL (optional)</span>
            <input
              type="url"
              value={slideshowMusic}
              placeholder="https://…"
              onChange={(event) => setSlideshowMusic(event.target.value)}
            />
          </label>
          {slideshowMusic && <audio controls src={slideshowMusic} />}
          <DialogFooter>
            <button
              onClick={() =>
                setSlideshowIndex(
                  (index) => (index - 1 + photos.length) % photos.length,
                )
              }
            >
              Previous
            </button>
            <button
              onClick={() =>
                setSlideshowIndex((index) => (index + 1) % photos.length)
              }
            >
              Next
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VideoLab open={videoLabOpen} onOpenChange={setVideoLabOpen} />
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
  onRenderDng,
  onBatchExport,
  onExportPackage,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  photo: RuntimePhoto | undefined;
  format: ExportFormat;
  setFormat: (format: ExportFormat) => void;
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
  onRenderDng: () => void;
  onBatchExport: () => void;
  onExportPackage: () => void;
}) {
  const extension = format === "jpeg" ? "jpg" : format;
  const avifSupported =
    typeof document !== "undefined" &&
    document
      .createElement("canvas")
      .toDataURL("image/avif")
      .startsWith("data:image/avif");
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
            {(["jpeg", "png", "webp", "avif", "tiff", "dng"] as const).map(
              (value) => (
                <button
                  key={value}
                  disabled={value === "avif" && !avifSupported}
                  className={format === value ? "active" : ""}
                  onClick={() => setFormat(value)}
                >
                  {value.toUpperCase()}
                </button>
              ),
            )}
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
          <button className="secondary-button" onClick={onRenderDng}>
            Render to DNG
          </button>
          <button className="secondary-button" onClick={onExportPackage}>
            Original + settings
          </button>
          <button className="secondary-button" onClick={onBatchExport}>
            Export selected batch
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
  cullPreferences,
  setCullPreferences,
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
  cullPreferences: CullPreferences;
  setCullPreferences: (value: CullPreferences) => void;
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
      {filter === "best" && (
        <section className="cull-controls" aria-label="Assisted culling controls">
          <label>
            <span>Focus strictness</span>
            <input
              type="range"
              min="0"
              max="100"
              value={cullPreferences.focusStrictness}
              onChange={(event) =>
                setCullPreferences({
                  ...cullPreferences,
                  focusStrictness: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            <span>Exposure strictness</span>
            <input
              type="range"
              min="0"
              max="100"
              value={cullPreferences.exposureStrictness}
              onChange={(event) =>
                setCullPreferences({
                  ...cullPreferences,
                  exposureStrictness: Number(event.target.value),
                })
              }
            />
          </label>
          <button
            className={cullPreferences.protectShallowDepth ? "active" : ""}
            onClick={() =>
              setCullPreferences({
                ...cullPreferences,
                protectShallowDepth: !cullPreferences.protectShallowDepth,
              })
            }
          >
            Protect shallow depth of field
          </button>
          <button
            onClick={() =>
              updateMany((photo) => {
                const decision = evaluateCull(
                  detailedCullScores(photo.cull),
                  cullPreferences,
                );
                return decision.decision === "select"
                  ? { ...photo, flagged: true, rejected: false }
                  : decision.decision === "reject"
                    ? { ...photo, rejected: true, flagged: false }
                    : photo;
              })
            }
          >
            Apply decisions to selected
          </button>
        </section>
      )}
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
                {photo.stackId && (
                  <b className="stack-badge">
                    {photo.stackCover ? "Best in stack" : "Stack"}
                  </b>
                )}
                <i style={{ background: labelColors[photo.label] }} />
              </div>
              <strong>{photo.metadata.title || photo.name}</strong>
              <span>
                {view === "people"
                  ? `${photo.peopleCluster || "Unclustered"} · ${photo.cull.faces} face${photo.cull.faces === 1 ? "" : "s"} · `
                  : view === "map"
                    ? `${photo.metadata.latitude?.toFixed(4)}, ${photo.metadata.longitude?.toFixed(4)} · `
                    : ""}
                {photo.folder} · {formatBytes(photo.size)}
              </span>
              {filter === "best" && (
                (() => {
                  const decision = evaluateCull(
                    detailedCullScores(photo.cull),
                    cullPreferences,
                  );
                  return (
                    <small className={`cull-score ${decision.decision}`}>
                      {decision.score}/100 · {decision.reasons.join(" · ")}
                      {photo.cull.faceScores?.length
                        ? ` · Faces ${photo.cull.faceScores.map(Math.round).join("/")}`
                        : ""}
                    </small>
                  );
                })()
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
  maskEdge,
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
  maskEdge: number;
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
  const [cropOutsideOpacity, setCropOutsideOpacity] = useState(42);
  useEffect(() => {
    const saved = Number(localStorage.getItem("librelux-crop-outside-opacity"));
    if (Number.isFinite(saved) && saved >= 0 && saved <= 90)
      setCropOutsideOpacity(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "librelux-crop-outside-opacity",
      String(cropOutsideOpacity),
    );
  }, [cropOutsideOpacity]);
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
    if (
      ["hair", "skin", "clothes", "person", "subject", "object"].includes(
        maskTarget,
      )
    ) {
      try {
        const semantic = await buildSemanticAiMask(
          sample,
          maskTarget,
          { x: normalizedX, y: normalizedY },
        );
        const names: Record<string, string> = {
          hair: "AI hair",
          skin: "AI skin",
          clothes: "AI clothes",
          person: "AI person",
          subject: "AI subject",
          object: "AI object",
        };
        const refinedDataUrl = await refineMaskDataUrl(
          semantic.dataUrl,
          maskEdge,
          maskFeather,
        );
        onMaskCreated({
          id: crypto.randomUUID(),
          name: `${names[maskTarget]} · ${semantic.labels.join(", ")}`,
          target: maskTarget,
          dataUrl: refinedDataUrl,
          baseDataUrl: semantic.dataUrl,
          tolerance: maskTolerance,
          feather: maskFeather,
          edge: maskEdge,
          visible: true,
          inverted: false,
          overlayColor: "#b6f36b",
          overlayOpacity: 48,
          pinX: normalizedX,
          pinY: normalizedY,
          adjustments: { ...defaultLocal },
          sourceFingerprint: editFingerprint({
            cropTop: photo.adjustments.cropTop,
            cropRight: photo.adjustments.cropRight,
            cropBottom: photo.adjustments.cropBottom,
            cropLeft: photo.adjustments.cropLeft,
            rotation: photo.adjustments.rotation,
            retouchCount: photo.retouchSpots.length,
          }),
        });
        return;
      } catch {
        // If the optional local model cannot run, keep the fast geometric and
        // color-aware selector available instead of losing the user's click.
      }
    }
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
    } else if (maskTarget === "polygon") {
      const points = Array.from({ length: 6 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
        return [
          normalizedX + Math.cos(angle) * 0.28,
          normalizedY + Math.sin(angle) * 0.22,
        ];
      });
      const insidePolygon = (px: number, py: number) => {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i];
          const [xj, yj] = points[j];
          if (
            yi > py !== yj > py &&
            px < ((xj - xi) * (py - yi)) / Math.max(0.00001, yj - yi) + xi
          )
            inside = !inside;
        }
        return inside;
      };
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if (
            insidePolygon(
              x / Math.max(1, width - 1),
              y / Math.max(1, height - 1),
            )
          )
            writePixel(y * width + x);
    } else if (maskTarget === "depth") {
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const depth = 1 - y / Math.max(1, height - 1);
          const selectedDepth = 1 - normalizedY;
          writePixel(
            y * width + x,
            255 * Math.max(0, 1 - Math.abs(depth - selectedDepth) * 5),
          );
        }
    } else if (maskTarget === "sky") {
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const p = (y * width + x) * 4;
          const blueBias = Math.max(
            0,
            (pixels.data[p + 2] - pixels.data[p]) / 85,
          );
          const topBias = Math.max(0, 1 - y / Math.max(1, height * 0.7));
          writePixel(y * width + x, 255 * Math.min(1, topBias + blueBias));
        }
    } else if (landscapeMaskTargets.includes(maskTarget as LandscapeMaskTarget)) {
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const p = (y * width + x) * 4;
          const r = pixels.data[p], g = pixels.data[p + 1], b = pixels.data[p + 2];
          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const nx = x / Math.max(1, width - 1);
          const ny = y / Math.max(1, height - 1);
          let confidence = 0;
          if (maskTarget === "landscape-snow")
            confidence = (luminance - 155) / 80 + (35 - chroma) / 90;
          else if (maskTarget === "landscape-mountains")
            confidence = 1 - Math.abs(ny - (0.42 + Math.abs(nx - 0.5) * 0.35)) * 4;
          else if (maskTarget === "landscape-architecture") {
            const right = x + 1 < width ? p + 4 : p;
            const down = y + 1 < height ? p + width * 4 : p;
            const edgeStrength =
              Math.abs(r - pixels.data[right]) + Math.abs(r - pixels.data[down]);
            confidence = edgeStrength / 90 + (chroma < 42 ? 0.25 : 0);
          } else if (maskTarget === "landscape-vegetation")
            confidence = (g - Math.max(r, b)) / 70 + (ny > 0.25 ? 0.25 : 0);
          else if (maskTarget === "landscape-water")
            confidence = (b + g * 0.45 - r * 1.15) / 150 + (ny > 0.35 ? 0.25 : 0);
          else if (maskTarget === "landscape-natural-ground")
            confidence = (ny - 0.42) * 1.8 + (r - b) / 130 + chroma / 260;
          else
            confidence = (ny - 0.48) * 2 + (48 - chroma) / 95;
          writePixel(y * width + x, 255 * Math.max(0, Math.min(1, confidence)));
        }
    } else if (
      maskTarget === "subject" ||
      maskTarget === "background" ||
      maskTarget === "person" ||
      maskTarget === "face" ||
      maskTarget === "eyes" ||
      maskTarget === "teeth" ||
      personMaskTargets.includes(maskTarget as PersonMaskTarget)
    ) {
      const centerX =
        maskTarget === "subject" || maskTarget === "background"
          ? 0.5
          : normalizedX;
      const centerY =
        maskTarget === "face" ||
        maskTarget === "eyes" ||
        maskTarget === "teeth" ||
        personMaskTargets.includes(maskTarget as PersonMaskTarget)
          ? normalizedY
          : 0.52;
      const radiusX =
        maskTarget === "person"
          ? 0.2
          : maskTarget === "face"
            ? 0.13
            : maskTarget === "eyes"
              ? 0.12
              : maskTarget === "teeth" || maskTarget === "lips"
                ? 0.06
                : maskTarget === "eyebrows" || maskTarget === "eye-sclera"
                  ? 0.12
                  : maskTarget === "facial-hair"
                    ? 0.1
                : 0.32;
      const radiusY =
        maskTarget === "person"
          ? 0.42
          : maskTarget === "face"
            ? 0.17
            : maskTarget === "eyes"
              ? 0.035
              : maskTarget === "teeth" || maskTarget === "lips"
                ? 0.025
                : maskTarget === "eyebrows" || maskTarget === "eye-sclera"
                  ? 0.035
                  : maskTarget === "facial-hair"
                    ? 0.09
                    : maskTarget === "body-skin"
                      ? 0.3
                : 0.4;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const dx = (x / Math.max(1, width - 1) - centerX) / radiusX;
          const dy = (y / Math.max(1, height - 1) - centerY) / radiusY;
          const inside = Math.max(
            0,
            Math.min(1, 1.15 - Math.sqrt(dx * dx + dy * dy)),
          );
          writePixel(
            y * width + x,
            255 * (maskTarget === "background" ? 1 - inside : inside),
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
    const baseDataUrl = raw.toDataURL("image/png");
    const refinedDataUrl = await refineMaskDataUrl(
      baseDataUrl,
      maskEdge,
      maskFeather * scale,
    );
    const names: Record<MaskTarget, string> = {
      brush: "Brush mask",
      point: "Magic selection",
      hair: "Hair",
      skin: "Skin",
      clothes: "Clothes",
      sky: "Sky",
      linear: "Linear gradient",
      radial: "Radial gradient",
      polygon: "Polygon control mask",
      luminance: "Luminance range",
      color: "Color range",
      depth: "Depth range",
      subject: "Subject",
      background: "Background",
      object: "Object",
      person: "Person",
      face: "Face",
      eyes: "Eyes",
      teeth: "Teeth",
      "facial-skin": "Facial skin",
      "body-skin": "Body skin",
      eyebrows: "Eyebrows",
      "eye-sclera": "Eye whites",
      lips: "Lips",
      "facial-hair": "Facial hair",
      "landscape-snow": "Snow",
      "landscape-mountains": "Mountains",
      "landscape-architecture": "Architecture",
      "landscape-vegetation": "Vegetation",
      "landscape-water": "Water",
      "landscape-natural-ground": "Natural ground",
      "landscape-artificial-ground": "Artificial ground",
    };
    const id = crypto.randomUUID();
    onMaskCreated({
      id,
      name: names[maskTarget],
      target: maskTarget,
      dataUrl: refinedDataUrl,
      baseDataUrl,
      tolerance: maskTolerance,
      feather: maskFeather,
      edge: maskEdge,
      visible: true,
      inverted: false,
      overlayColor: "#b6f36b",
      overlayOpacity: 48,
      pinX: normalizedX,
      pinY: normalizedY,
      adjustments: { ...defaultLocal },
      sourceFingerprint: editFingerprint({
        cropTop: photo.adjustments.cropTop,
        cropRight: photo.adjustments.cropRight,
        cropBottom: photo.adjustments.cropBottom,
        cropLeft: photo.adjustments.cropLeft,
        rotation: photo.adjustments.rotation,
        retouchCount: photo.retouchSpots.length,
      }),
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
              : `${cssFilter(a, photo.processVersion)} ${softProof ? (proofProfile === "display-p3" ? "saturate(1.04)" : proofProfile === "adobe-rgb" ? "saturate(1.02) contrast(.99)" : proofProfile === "prophoto-rgb" ? "saturate(.97) contrast(.98)" : "") : ""} ${a.lensBlur > 0 ? `blur(${a.lensBlur}px)` : ""}`,
            transform: photoTransform,
            clipPath: `inset(${a.cropTop}% ${a.cropRight}% ${a.cropBottom}% ${a.cropLeft}%)`,
          }}
        />
        {!showBefore && a.lensBlur > 0 && (
          <img
            className="depth-focus-preview"
            src={renderSource}
            alt=""
            aria-hidden="true"
            style={{
              filter: cssFilter(a, photo.processVersion),
              transform: photoTransform,
              clipPath: `inset(${a.cropTop}% ${a.cropRight}% ${a.cropBottom}% ${a.cropLeft}%)`,
              WebkitMaskImage:
                "radial-gradient(ellipse 38% 52% at 50% 48%, #000 42%, transparent 100%)",
              maskImage:
                "radial-gradient(ellipse 38% 52% at 50% 48%, #000 42%, transparent 100%)",
            }}
          />
        )}
        {!showBefore &&
          photo.effectStack
            .filter((layer) => layer.enabled && layer.opacity > 0)
            .map((layer) => (
              <img
                key={layer.id}
                className="effect-layer-preview"
                src={renderSource}
                alt=""
                aria-hidden="true"
                style={{
                  filter: cssFilter(
                    { ...photo.adjustments, ...layer.settings },
                    photo.processVersion,
                  ),
                  transform: photoTransform,
                  opacity: layer.opacity / 100,
                  mixBlendMode: layer.blendMode,
                  clipPath: `inset(${a.cropTop}% ${a.cropRight}% ${a.cropBottom}% ${a.cropLeft}%)`,
                }}
              />
            ))}
        {!showBefore && a.dustRemoval > 0 && (
          <img
            className="dust-visualization"
            src={renderSource}
            alt="Sensor dust visualization"
            style={{ opacity: Math.min(0.48, a.dustRemoval / 210) }}
          />
        )}
        {!showBefore && a.textureAsset > 0 && (
          <img
            className="analog-texture-overlay"
            src="/textures/analog-dust-scratches.png"
            alt=""
            aria-hidden="true"
            style={{
              opacity: Math.min(0.32, 0.06 + a.textureAsset * 0.055),
              mixBlendMode: a.textureAsset === 1 ? "soft-light" : "screen",
            }}
          />
        )}
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
                    : spot.mode === "heal" ||
                        spot.mode === "remove" ||
                        spot.mode === "generativeRemove"
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
            <i
              className="crop-dim top"
              style={{ height: `${a.cropTop}%`, opacity: cropOutsideOpacity / 100 }}
            />
            <i
              className="crop-dim bottom"
              style={{ height: `${a.cropBottom}%`, opacity: cropOutsideOpacity / 100 }}
            />
            <i
              className="crop-dim left"
              style={{
                top: `${a.cropTop}%`,
                bottom: `${a.cropBottom}%`,
                width: `${a.cropLeft}%`,
                opacity: cropOutsideOpacity / 100,
              }}
            />
            <i
              className="crop-dim right"
              style={{
                top: `${a.cropTop}%`,
                bottom: `${a.cropBottom}%`,
                width: `${a.cropRight}%`,
                opacity: cropOutsideOpacity / 100,
              }}
            />
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
              <label>
                Outside opacity{" "}
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={cropOutsideOpacity}
                  onChange={(event) =>
                    setCropOutsideOpacity(Number(event.target.value))
                  }
                />
                <span>{cropOutsideOpacity}%</span>
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
  const acrSidecarRef = useRef<HTMLInputElement>(null);
  const relinkRef = useRef<HTMLInputElement>(null);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState(
    () =>
      typeof window === "undefined"
        ? "Local reviewer"
        : localStorage.getItem("librelux-review-author") ?? "Local reviewer",
  );
  const [commentDraft, setCommentDraft] = useState("");
  const [metadataTemplate, setMetadataTemplate] = useState<
    Pick<PhotoMetadata, "creator" | "copyright" | "keywords"> | null
  >(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("librelux-metadata-template") ?? "null");
    } catch {
      return null;
    }
  });
  const [customLabels, setCustomLabels] = useState<LabelDefinition[]>(() => {
    if (typeof window === "undefined") return defaultLabelDefinitions;
    try {
      return normalizeLabels(
        JSON.parse(localStorage.getItem("librelux-custom-labels") ?? "null"),
      );
    } catch {
      return defaultLabelDefinitions;
    }
  });
  const updateCustomLabel = (
    id: Exclude<Label, "none">,
    patch: Partial<LabelDefinition>,
  ) => {
    const next = normalizeLabels(
      customLabels.map((definition) =>
        definition.id === id ? { ...definition, ...patch } : definition,
      ),
    );
    setCustomLabels(next);
    localStorage.setItem("librelux-custom-labels", JSON.stringify(next));
  };
  useEffect(() => {
    customLabels.forEach((definition) =>
      document.documentElement.style.setProperty(
        `--label-${definition.id}`,
        definition.color,
      ),
    );
  }, [customLabels]);
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
  const exportAcrSidecar = () => {
    const a = photo.adjustments;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:Version="16.0" crs:ProcessVersion="15.4" crs:Exposure2012="${a.exposure}" crs:Contrast2012="${a.contrast}" crs:Highlights2012="${a.highlights}" crs:Shadows2012="${a.shadows}" crs:Whites2012="${a.whites}" crs:Blacks2012="${a.blacks}" crs:Temperature="${a.temperature}" crs:Tint="${a.tint}" crs:Texture="${a.texture}" crs:Clarity2012="${a.clarity}" crs:Dehaze="${a.dehaze}" crs:Vibrance="${a.vibrance}" crs:Saturation="${a.saturation}" /></rdf:RDF></x:xmpmeta>`;
    const url = URL.createObjectURL(
      new Blob([xml], { type: "application/rdf+xml" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${photo.name.replace(/\.[^.]+$/, "")}.acr.xmp`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importAcrSidecar = async (file?: File) => {
    if (!file) return;
    const documentXml = new DOMParser().parseFromString(
      await file.text(),
      "application/xml",
    );
    const description = documentXml.getElementsByTagNameNS(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "Description",
    )[0];
    if (!description) return;
    const read = (name: string, fallback: number) => {
      const value = Number(
        description.getAttributeNS(
          "http://ns.adobe.com/camera-raw-settings/1.0/",
          name,
        ),
      );
      return Number.isFinite(value) ? value : fallback;
    };
    update((current) => ({
      ...current,
      adjustments: {
        ...current.adjustments,
        exposure: read("Exposure2012", current.adjustments.exposure),
        contrast: read("Contrast2012", current.adjustments.contrast),
        highlights: read("Highlights2012", current.adjustments.highlights),
        shadows: read("Shadows2012", current.adjustments.shadows),
        whites: read("Whites2012", current.adjustments.whites),
        blacks: read("Blacks2012", current.adjustments.blacks),
        temperature: read("Temperature", current.adjustments.temperature),
        tint: read("Tint", current.adjustments.tint),
        texture: read("Texture", current.adjustments.texture),
        clarity: read("Clarity2012", current.adjustments.clarity),
        dehaze: read("Dehaze", current.adjustments.dehaze),
        vibrance: read("Vibrance", current.adjustments.vibrance),
        saturation: read("Saturation", current.adjustments.saturation),
      },
    }));
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
          {customLabels.map((definition) => {
            const label = definition.id as Exclude<Label, "none">;
            return (
              <button
                key={label}
                aria-label={`${definition.name} label`}
                title={definition.name}
                className={photo.label === label ? "active" : ""}
                onClick={() =>
                  update((p) => ({
                    ...p,
                    label: p.label === label ? "none" : label,
                  }))
                }
                style={{ background: definition.color }}
              >
                {photo.label === label && <Check />}
              </button>
            );
          })}
        </div>
        <details className="label-editor">
          <summary>Edit label names and colors</summary>
          {customLabels.map((definition) => (
            <label key={definition.id}>
              <input
                type="color"
                value={definition.color}
                aria-label={`${definition.name} color`}
                onChange={(event) =>
                  updateCustomLabel(definition.id as Exclude<Label, "none">, { color: event.target.value })
                }
              />
              <input
                value={definition.name}
                aria-label={`${definition.id} label name`}
                onChange={(event) =>
                  updateCustomLabel(definition.id as Exclude<Label, "none">, { name: event.target.value })
                }
              />
            </label>
          ))}
        </details>
      </Panel>
      <Panel
        title="Review"
        badge={`${photo.reviewComments.filter((comment) => !comment.resolved).length}`}
        open={false}
      >
        <label className="meta-field">
          <span>Review identity</span>
          <input
            value={reviewAuthor}
            onChange={(event) => {
              setReviewAuthor(event.target.value);
              localStorage.setItem("librelux-review-author", event.target.value);
            }}
            placeholder="Your name"
          />
        </label>
        <button
          className={
            photo.reviewLikes.includes(reviewAuthor) ? "review-like active" : "review-like"
          }
          aria-pressed={photo.reviewLikes.includes(reviewAuthor)}
          onClick={() =>
            update((current) => ({
              ...current,
              reviewLikes: current.reviewLikes.includes(reviewAuthor)
                ? current.reviewLikes.filter((name) => name !== reviewAuthor)
                : [...current.reviewLikes, reviewAuthor],
            }))
          }
        >
          <Heart /> {photo.reviewLikes.length} likes
        </button>
        <div className="review-composer">
          <textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            placeholder="Leave a review note"
          />
          <button
            disabled={!commentDraft.trim() || !reviewAuthor.trim()}
            onClick={() => {
              const text = commentDraft.trim();
              if (!text || !reviewAuthor.trim()) return;
              update((current) => ({
                ...current,
                reviewComments: [
                  ...current.reviewComments,
                  {
                    id: crypto.randomUUID(),
                    author: reviewAuthor.trim(),
                    text,
                    createdAt: Date.now(),
                    resolved: false,
                  },
                ],
              }));
              setCommentDraft("");
            }}
          >
            Add comment
          </button>
        </div>
        <div className="review-comments">
          {photo.reviewComments.map((comment) => (
            <article key={comment.id} className={comment.resolved ? "resolved" : ""}>
              <header>
                <strong>{comment.author}</strong>
                <time>{new Date(comment.createdAt).toLocaleString()}</time>
              </header>
              <p>{comment.text}</p>
              <div>
                <button
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      reviewComments: current.reviewComments.map((item) =>
                        item.id === comment.id
                          ? { ...item, resolved: !item.resolved }
                          : item,
                      ),
                    }))
                  }
                >
                  {comment.resolved ? "Reopen" : "Resolve"}
                </button>
                <button
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      reviewComments: current.reviewComments.filter(
                        (item) => item.id !== comment.id,
                      ),
                    }))
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Description">
        <div className="preset-manager-actions">
          <button
            onClick={() => {
              const template = {
                creator: photo.metadata.creator,
                copyright: photo.metadata.copyright,
                keywords: photo.metadata.keywords,
              };
              setMetadataTemplate(template);
              localStorage.setItem(
                "librelux-metadata-template",
                JSON.stringify(template),
              );
            }}
          >
            Save metadata template
          </button>
          <button
            disabled={!metadataTemplate}
            onClick={() =>
              metadataTemplate &&
              update((current) => ({
                ...current,
                metadata: { ...current.metadata, ...metadataTemplate },
              }))
            }
          >
            Apply template
          </button>
        </div>
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
        {photo.rawInfo && (
          <dl className="raw-details">
            <div>
              <dt>RAW engine</dt>
              <dd>{photo.rawInfo.engine}</dd>
            </div>
            <div>
              <dt>Develop master</dt>
              <dd>32-bit float · Linear ProPhoto RGB</dd>
            </div>
            <div>
              <dt>Sensor</dt>
              <dd>
                {photo.rawInfo.sensorPattern} · {photo.rawInfo.bitDepth}-bit
              </dd>
            </div>
            <div>
              <dt>Levels</dt>
              <dd>
                {photo.rawInfo.blackLevel}–{photo.rawInfo.whiteLevel}
              </dd>
            </div>
            <div>
              <dt>Camera matrix</dt>
              <dd>
                {photo.rawInfo.colorMatrix.length
                  ? "Applied"
                  : "Camera default"}
              </dd>
            </div>
          </dl>
        )}
        {!photo.rawInfo && photo.sourceBitDepth > 8 && (
          <p className="panel-note">
            Decoded from a {photo.sourceBitDepth}-bit source while preserving
            the original.
          </p>
        )}
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
          Catalog XMP keeps LibreLux metadata and masks. Camera Raw XMP keeps
          standard develop values for compatible editors.
        </p>
        <div className="sidecar-actions">
          <button onClick={exportXmp}>
            <Download /> Export XMP
          </button>
          <button onClick={() => sidecarRef.current?.click()}>
            <FolderOpen /> Import XMP
          </button>
          <button onClick={exportAcrSidecar}>
            <Download /> Export Camera Raw XMP
          </button>
          <button onClick={() => acrSidecarRef.current?.click()}>
            <FolderOpen /> Import Camera Raw XMP
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
        <input
          ref={acrSidecarRef}
          hidden
          type="file"
          accept=".xmp,application/rdf+xml,application/xml,text/xml"
          onChange={(event) => {
            void importAcrSidecar(event.target.files?.[0]);
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
  maskEdge,
  setMaskEdge,
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
  recordAiOperation,
  importCreativeLut,
  saveSnapshot,
  applySnapshot,
  deleteSnapshot,
  renameSnapshot,
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
  maskEdge: number;
  setMaskEdge: (value: number) => void;
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
  recordAiOperation: (action: string) => void;
  importCreativeLut: () => void;
  saveSnapshot: () => void;
  applySnapshot: (snapshot: DevelopSnapshot) => void;
  deleteSnapshot: (id: string) => void;
  renameSnapshot: (id: string, name: string) => void;
}) {
  const a = photo.adjustments;
  const selectedMask = photo.masks.find((mask) => mask.id === selectedMaskId);
  const [combineMaskId, setCombineMaskId] = useState("");
  const [presetQuery, setPresetQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const maskRefineRequest = useRef(0);
  const currentMaskFingerprint = editFingerprint({
    cropTop: photo.adjustments.cropTop,
    cropRight: photo.adjustments.cropRight,
    cropBottom: photo.adjustments.cropBottom,
    cropLeft: photo.adjustments.cropLeft,
    rotation: photo.adjustments.rotation,
    retouchCount: photo.retouchSpots.length,
  });
  const setSavedMaskRefinement = (edge: number, feather: number) => {
    if (!selectedMask) return;
    const request = ++maskRefineRequest.current;
    void refineMaskDataUrl(
      selectedMask.baseDataUrl ?? selectedMask.dataUrl,
      edge,
      feather,
    ).then((dataUrl) => {
      if (request !== maskRefineRequest.current) return;
      updateMask(selectedMask.id, (mask) => ({
        ...mask,
        dataUrl,
        baseDataUrl: mask.baseDataUrl ?? mask.dataUrl,
        edge,
        feather,
      }));
    });
  };
  const updateAllMasks = async () => {
    await Promise.all(
      photo.masks.map(async (mask) => {
        const dataUrl = await refineMaskDataUrl(
          mask.baseDataUrl ?? mask.dataUrl,
          mask.edge,
          mask.feather,
        );
        updateMask(mask.id, (current) => ({
          ...current,
          dataUrl,
          sourceFingerprint: currentMaskFingerprint,
        }));
      }),
    );
  };
  const visibleUserPresets = userPresets.filter(
    (preset) =>
      (!favoritesOnly || preset.favorite) &&
      `${preset.name} ${preset.group}`
        .toLowerCase()
        .includes(presetQuery.trim().toLowerCase()),
  );
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
        <div className="preset-search-row">
          <input
            type="search"
            aria-label="Search presets"
            placeholder="Search presets or folders"
            value={presetQuery}
            onChange={(event) => setPresetQuery(event.target.value)}
          />
          <button
            className={favoritesOnly ? "active" : ""}
            onClick={() => setFavoritesOnly((value) => !value)}
          >
            ★ Favorites
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
          {visibleUserPresets.map((preset) => {
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
                  <button
                    aria-label={`${preset.favorite ? "Remove" : "Add"} ${preset.name} ${preset.favorite ? "from" : "to"} favorites`}
                    onClick={() =>
                      updateUserPreset(preset.id, {
                        favorite: !preset.favorite,
                      })
                    }
                  >
                    {preset.favorite ? "★" : "☆"}
                  </button>
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
      <Panel title="Snapshots" badge={`${photo.snapshots.length}`} open={false}>
        <button className="mask-batch" onClick={saveSnapshot}>
          Save current variation
        </button>
        <div className="snapshot-grid">
          <div className="snapshot-current">
            <button type="button">
              <img
                src={photo.previewUrl}
                alt="Current edit"
                style={{ filter: cssFilter(a, photo.processVersion) }}
              />
              <span>Current edit</span>
            </button>
          </div>
          {photo.snapshots.map((snapshot) => (
            <div key={snapshot.id}>
              <button onClick={() => applySnapshot(snapshot)}>
                <img
                  src={photo.previewUrl}
                  alt=""
                  style={{ filter: cssFilter(snapshot.adjustments) }}
                />
                <span>{snapshot.name}</span>
              </button>
              <input
                className="snapshot-name"
                value={snapshot.name}
                aria-label={`Rename ${snapshot.name}`}
                onChange={(event) =>
                  renameSnapshot(snapshot.id, event.target.value)
                }
              />
              <button
                aria-label={`Delete ${snapshot.name}`}
                onClick={() => deleteSnapshot(snapshot.id)}
              >
                <Trash2 />
              </button>
            </div>
          ))}
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
              d={`M0 ${88 - a.curves.rgb.shadows / 4} C18 ${82 - a.curves.rgb.shadows / 6} 52 ${62 - a.curves.rgb.midtones / 5} 91 ${49 - a.curves.rgb.midtones / 4} S150 ${24 - a.curves.rgb.highlights / 5} 200 ${4 - a.curves.rgb.highlights / 5}`}
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
        <button className="mask-batch" onClick={importCreativeLut}>
          Import .cube LUT as creative profile
        </button>
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
        title="HDR & scene color"
        badge={a.hdrGain ? "HDR" : "SDR"}
        open={false}
      >
        <AdjustSlider
          label="HDR gain"
          value={a.hdrGain}
          min={0}
          max={100}
          onChange={(v) => setAdjustment("hdrGain", v)}
        />
        <AdjustSlider
          label="Highlight reconstruction"
          value={a.highlightRecovery}
          min={0}
          max={100}
          onChange={(v) => setAdjustment("highlightRecovery", v)}
        />
        <AdjustSlider
          label="Scene-wide gamut"
          value={a.wideGamut}
          min={0}
          max={100}
          onChange={(v) => setAdjustment("wideGamut", v)}
        />
        <p className="panel-note">
          Scene-referred adjustments preserve highlight headroom before the
          selected display proof transform.
        </p>
      </Panel>
      <Panel title="Portrait & cleanup" open={false}>
        <div className="mask-presets">
          <button onClick={() => setMaskTarget("skin")}>Select skin</button>
          <button onClick={() => setMaskTarget("teeth")}>Select teeth</button>
          <button onClick={() => setMaskTarget("eyes")}>Select eyes</button>
          <button onClick={() => setMaskTarget("hair")}>Select hair</button>
          <button onClick={() => setMaskTarget("clothes")}>
            Select clothing
          </button>
          <button onClick={() => setMaskTarget("person")}>Select person</button>
        </div>
        <AdjustSlider
          label="Face / corner volume"
          value={a.volumeDeform}
          min={-100}
          max={100}
          onChange={(v) => setAdjustment("volumeDeform", v)}
        />
        <AdjustSlider
          label="Reflection isolate / suppress"
          value={a.glareReduction}
          min={-100}
          max={100}
          onChange={(v) => setAdjustment("glareReduction", v)}
        />
        <div className="preset-manager-actions" aria-label="Reflection quality">
          {([
            [1, "Preview"],
            [2, "Balanced"],
            [3, "Precise"],
          ] as const).map(([quality, label]) => (
            <button
              key={quality}
              className={a.reflectionQuality === quality ? "active" : ""}
              onClick={() => setAdjustment("reflectionQuality", quality)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="panel-note">
          Negative values isolate reflections for inspection; positive values
          suppress reflective glare while preserving local color.
        </p>
        <AdjustSlider
          label="Sensor dust cleanup"
          value={a.dustRemoval}
          min={0}
          max={100}
          onChange={(v) => setAdjustment("dustRemoval", v)}
        />
        <button className="mask-batch" onClick={() => setRetouchMode("remove")}>
          Remove blemish or person
        </button>
        <button
          className="mask-batch"
          onClick={() => setRetouchMode("generativeRemove")}
        >
          Local generative remove
        </button>
        <button
          className="mask-batch"
          onClick={() => {
            setAdjustment("boundaryFill", 100);
            recordAiOperation("Generative expand with local edge synthesis");
          }}
        >
          Local generative expand
        </button>
        {!!photo.aiHistory.length && (
          <div className="ai-history">
            <strong>AI disclosure history</strong>
            {photo.aiHistory
              .slice(-4)
              .reverse()
              .map((entry) => (
                <span key={entry.id}>
                  {entry.action} · {entry.model}
                </span>
              ))}
          </div>
        )}
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
              ["generativeRemove", "Local generative remove"],
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
                  {(spot.mode === "remove" ||
                    spot.mode === "generativeRemove") && (
                    <div className="preset-manager-actions">
                      {[1, 2, 3].map((variation) => (
                        <button
                          key={variation}
                          onClick={() => {
                            const angle = variation * 2.094 + spot.x * Math.PI;
                            const distance = Math.max(0.025, spot.size / 180);
                            updateRetouchSpot(spot.id, {
                              sourceX: Math.max(
                                0,
                                Math.min(1, spot.x + Math.cos(angle) * distance),
                              ),
                              sourceY: Math.max(
                                0,
                                Math.min(1, spot.y + Math.sin(angle) * distance),
                              ),
                            });
                          }}
                        >
                          Variation {variation}
                        </button>
                      ))}
                    </div>
                  )}
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
              ["subject", "Subject"],
              ["background", "Background"],
              ["object", "Object"],
              ["person", "Person"],
              ["face", "Face"],
              ["eyes", "Eyes"],
              ["teeth", "Teeth"],
              ["linear", "Linear"],
              ["radial", "Radial"],
              ["polygon", "Polygon"],
              ["luminance", "Luminance"],
              ["color", "Color range"],
              ["depth", "Depth range"],
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
        <details className="mask-target-group">
          <summary>Landscape parts</summary>
          <div className="mask-tools compact">
            {landscapeMaskTargets.map((value) => (
              <button
                className={maskTarget === value ? "active" : ""}
                key={value}
                onClick={() => setMaskTarget(maskTarget === value ? null : value)}
              >
                {value.replace("landscape-", "").replaceAll("-", " ")}
              </button>
            ))}
          </div>
        </details>
        <details className="mask-target-group">
          <summary>Person details</summary>
          <div className="mask-tools compact">
            {personMaskTargets.map((value) => (
              <button
                className={maskTarget === value ? "active" : ""}
                key={value}
                onClick={() => setMaskTarget(maskTarget === value ? null : value)}
              >
                {value.replaceAll("-", " ")}
              </button>
            ))}
          </div>
        </details>
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
        <AdjustSlider
          label="Expand / contract edge"
          value={maskEdge}
          min={-100}
          max={100}
          onChange={setMaskEdge}
        />
        {maskTarget && (
          <button className="cancel-mask" onClick={() => setMaskTarget(null)}>
            Cancel selection
          </button>
        )}
        {!!photo.masks.length && (
          <button className="mask-batch" onClick={() => void updateAllMasks()}>
            Update all masks
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
              <em>
                {mask.sourceFingerprint &&
                mask.sourceFingerprint !== currentMaskFingerprint
                  ? "Needs update"
                  : mask.visible
                    ? "Visible"
                    : "Hidden"}
              </em>
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
            <AdjustSlider
              label="Mask edge"
              value={selectedMask.edge}
              min={-100}
              max={100}
              onChange={(value) =>
                setSavedMaskRefinement(value, selectedMask.feather)
              }
            />
            <AdjustSlider
              label="Mask feather"
              value={selectedMask.feather}
              min={0}
              max={30}
              resetValue={6}
              onChange={(value) =>
                setSavedMaskRefinement(selectedMask.edge, value)
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
                ["moire", "Moiré / false color", 0, 100, 1],
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
  opticsProfiles,
  importOpticsProfiles,
  exportOpticsProfiles,
  saveSensorDustMap,
  applySensorDustMap,
  detectSensorDust,
  aiPack,
  aiStatus,
  installAiPack,
  buildNeuralPreview,
  installOpenOptics,
  openPackStatus,
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
  opticsProfiles: OpticsProfile[];
  importOpticsProfiles: () => void;
  exportOpticsProfiles: () => void;
  saveSensorDustMap: () => Promise<void>;
  applySensorDustMap: () => Promise<void>;
  detectSensorDust: () => Promise<void>;
  aiPack: { restore: boolean; segment: boolean };
  aiStatus: string;
  installAiPack: (kind: "restore" | "segment" | "all") => Promise<void>;
  buildNeuralPreview: () => Promise<void>;
  installOpenOptics: () => Promise<void>;
  openPackStatus: string;
}) {
  const a = photo.adjustments;
  const profileQuery = `${photo.metadata.camera} ${photo.metadata.lens}`
    .trim()
    .toLowerCase();
  const visibleOpticsProfiles = opticsProfiles
    .filter((profile) =>
      profileQuery
        ? `${profile.camera} ${profile.lens}`.toLowerCase().includes(profileQuery) ||
          profileQuery.includes(profile.camera.toLowerCase()) ||
          profileQuery.includes(profile.lens.toLowerCase())
        : true,
    )
    .slice(0, 48);
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
        <div className="preset-manager-actions">
          <button
            onClick={() => {
              const iso = Math.max(50, Number(photo.metadata.iso) || 100);
              const strength = Math.min(100, Math.max(0, Math.log2(iso / 100) * 13));
              setAdjustment("noise", Math.round(strength * 0.72));
              setAdjustment("colorNoise", Math.round(strength * 0.88));
              setAdjustment("sharpDetail", Math.round(48 - strength * 0.2));
            }}
          >
            ISO-adaptive cleanup
          </button>
          <button
            disabled={!photo.rawInfo}
            onClick={() => {
              setAdjustment("highlightRecovery", 72);
              setAdjustment("shadows", 28);
              setAdjustment("noise", Math.max(a.noise, 18));
            }}
          >
            Dual-gain RAW recovery
          </button>
        </div>
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
        <div className="pack-actions">
          <button onClick={() => void installAiPack("all")}>
            {aiPack.restore && aiPack.segment
              ? "Reinstall local AI packs"
              : "Install local AI packs"}
          </button>
          <button className="apply" onClick={() => void buildNeuralPreview()}>
            Build neural preview
          </button>
        </div>
        {aiStatus && <p className="pack-status" role="status">{aiStatus}</p>}
      </Panel>
      <Panel title="Sensor dust map" open={false}>
        <p className="panel-note">
          Learn repeatable sensor spots from Heal or Remove marks, then reuse
          them for the same camera body.
        </p>
        <div className="preset-manager-actions">
          <button onClick={() => void saveSensorDustMap()}>
            Learn from this photo
          </button>
          <button onClick={() => void applySensorDustMap()}>
            Apply camera map
          </button>
          <button onClick={() => void detectSensorDust()}>
            Find dust for review
          </button>
        </div>
      </Panel>
      <Panel title="Optics profile" badge="Auto">
        <div className="preset-manager-actions">
          <button onClick={() => void installOpenOptics()}>
            Install measured profiles
          </button>
          <button onClick={importOpticsProfiles}>Import profiles</button>
          <button onClick={exportOpticsProfiles}>Export profiles</button>
        </div>
        <p className="panel-note">{openPackCredits.optics}</p>
        {openPackStatus && <p className="pack-status" role="status">{openPackStatus}</p>}
        <div className="optics-profile-list">
          {visibleOpticsProfiles.map((profile) => (
            <button
              key={profile.id}
              className={
                selectedPreset?.id === `optics-profile-${profile.id}`
                  ? "preset-selected"
                  : ""
              }
              onClick={() =>
                choosePreset(
                  `optics-profile-${profile.id}`,
                  `${profile.lens} correction`,
                  profile.settings,
                )
              }
            >
              <strong>{profile.lens}</strong>
              <span>
                {profile.camera} · v{profile.version} · {profile.source} · {Math.round(
                  (profile.camera.toLowerCase() === photo.metadata.camera.toLowerCase()
                    ? 0.55
                    : profileQuery.includes(profile.camera.toLowerCase())
                      ? 0.35
                      : 0.12) *
                    100 +
                    (profile.lens.toLowerCase() === photo.metadata.lens.toLowerCase()
                      ? 45
                      : profileQuery.includes(profile.lens.toLowerCase())
                        ? 30
                        : 8),
                )}% match
              </span>
            </button>
          ))}
        </div>
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
        <div className="profile-strip">
          <button
            className={
              selectedPreset?.id === "optics-barrel" ? "preset-selected" : ""
            }
            onClick={() =>
              choosePreset("optics-barrel", "Barrel correction", {
                distortion: -18,
                lensVignette: 14,
              })
            }
          >
            Barrel
          </button>
          <button
            className={
              selectedPreset?.id === "optics-pincushion"
                ? "preset-selected"
                : ""
            }
            onClick={() =>
              choosePreset("optics-pincushion", "Pincushion correction", {
                distortion: 18,
              })
            }
          >
            Pincushion
          </button>
          <button
            className={
              selectedPreset?.id === "optics-moustache"
                ? "preset-selected"
                : ""
            }
            onClick={() =>
              choosePreset("optics-moustache", "Moustache correction", {
                distortion: -10,
                perspectiveAspect: 8,
              })
            }
          >
            Moustache
          </button>
          <button
            className={
              selectedPreset?.id === "optics-fisheye"
                ? "preset-selected"
                : ""
            }
            onClick={() =>
              choosePreset("optics-fisheye", "Fisheye correction", {
                distortion: -45,
              })
            }
          >
            Fisheye
          </button>
        </div>
        <div className="profile-card">
          <Aperture />
          <div>
            <strong>{photo.metadata.camera || "Generic camera"}</strong>
            <span>{photo.metadata.lens || "Manual lens profile"}</span>
          </div>
          <button
            aria-label="Cache community profile"
            onClick={() =>
              void saveSetting(
                `optics-profile-${photo.metadata.lens || "generic"}`,
                {
                  version: 1,
                  camera: photo.metadata.camera,
                  lens: photo.metadata.lens,
                  distortion: a.distortion,
                  vignette: a.lensVignette,
                  sharpness: a.lensSharpness,
                },
              )
            }
          >
            Save
          </button>
        </div>
        <button
          className="mask-batch"
          onClick={() => {
            const aperture =
              Number(photo.metadata.aperture.replace(/[^0-9.]/g, "")) || 5.6;
            const focal =
              Number(photo.metadata.focalLength.replace(/[^0-9.]/g, "")) || 50;
            setAdjustment(
              "apertureCorrection",
              Math.round(Math.max(0, 18 - aperture * 2)),
            );
            setAdjustment(
              "cornerSharpness",
              Math.round(Math.min(60, focal / 2)),
            );
          }}
        >
          Apply EXIF-aware correction
        </button>
        <AdjustSlider
          label="Aperture softening"
          value={a.apertureCorrection}
          min={0}
          onChange={(v) => setAdjustment("apertureCorrection", v)}
        />
        <AdjustSlider
          label="Corner sharpness"
          value={a.cornerSharpness}
          min={0}
          onChange={(v) => setAdjustment("cornerSharpness", v)}
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
          label="Coarse"
          value={a.coarseContrast}
          onChange={(v) => setAdjustment("coarseContrast", v)}
        />
        <AdjustSlider
          label="Atmosphere"
          value={a.dehaze}
          onChange={(v) => setAdjustment("dehaze", v)}
        />
      </Panel>
      <Panel title="Computational detail" badge="Local" open={false}>
        <AdjustSlider
          label="Highlight reconstruction"
          value={a.highlightRecovery}
          min={0}
          onChange={(v) => setAdjustment("highlightRecovery", v)}
        />
        <AdjustSlider
          label="Hot / dead pixel repair"
          value={a.hotPixelRepair}
          min={0}
          onChange={(v) => setAdjustment("hotPixelRepair", v)}
        />
        <AdjustSlider
          label="Moiré reduction"
          value={a.moireReduction}
          min={0}
          onChange={(v) => setAdjustment("moireReduction", v)}
        />
        <AdjustSlider
          label="Neural denoise"
          value={a.neuralDenoise}
          min={0}
          onChange={(v) => setAdjustment("neuralDenoise", v)}
        />
        <AdjustSlider
          label="Deconvolution"
          value={a.deconvolution}
          min={0}
          onChange={(v) => setAdjustment("deconvolution", v)}
        />
        <AdjustSlider
          label="Super resolution"
          value={a.superResolution}
          min={100}
          max={200}
          resetValue={100}
          onChange={(v) => setAdjustment("superResolution", v)}
        />
        <AdjustSlider
          label="Subject-aware lens blur"
          value={a.lensBlur}
          min={0}
          max={20}
          onChange={(v) => setAdjustment("lensBlur", v)}
        />
        <AdjustSlider
          label="Focus plane"
          value={a.lensBlurFocus}
          min={0}
          max={100}
          resetValue={50}
          onChange={(v) => setAdjustment("lensBlurFocus", v)}
        />
        <AdjustSlider
          label="Bokeh character"
          value={a.lensBlurBokeh}
          min={0}
          max={100}
          resetValue={50}
          onChange={(v) => setAdjustment("lensBlurBokeh", v)}
        />
        <AdjustSlider
          label="Bokeh highlights"
          value={a.lensBlurHighlights}
          min={0}
          max={100}
          resetValue={20}
          onChange={(v) => setAdjustment("lensBlurHighlights", v)}
        />
        <p className="panel-note">
          The preview uses a memory-safe proxy. Export runs from the original at
          the selected resolution.
        </p>
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
  addEffectLayer,
  updateEffectLayer,
  moveEffectLayer,
  deleteEffectLayer,
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
  addEffectLayer: (name: string, settings: Partial<Adjustments>) => void;
  updateEffectLayer: (id: string, patch: Partial<EffectLayer>) => void;
  moveEffectLayer: (id: string, direction: -1 | 1) => void;
  deleteEffectLayer: (id: string) => void;
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
        {selectedPreset && (
          <button
            className="mask-batch"
            onClick={() =>
              addEffectLayer(selectedPreset.name, selectedPreset.settings)
            }
          >
            Add previewed look to effect stack
          </button>
        )}
      </Panel>
      <Panel title="Effect stack" badge={`${photo.effectStack.length}`}>
        <div className="effect-stack">
          {photo.effectStack.map((layer, index) => (
            <div key={layer.id} className={!layer.enabled ? "disabled" : ""}>
              <button
                aria-label={`${layer.enabled ? "Disable" : "Enable"} ${layer.name}`}
                onClick={() =>
                  updateEffectLayer(layer.id, { enabled: !layer.enabled })
                }
              >
                {layer.enabled ? <Check /> : <X />}
              </button>
              <strong>{layer.name}</strong>
              <select
                aria-label={`${layer.name} blend mode`}
                value={layer.blendMode}
                onChange={(event) =>
                  updateEffectLayer(layer.id, {
                    blendMode: event.target.value as EffectBlendMode,
                  })
                }
              >
                {(
                  [
                    "normal",
                    "multiply",
                    "screen",
                    "overlay",
                    "soft-light",
                    "color",
                    "luminosity",
                  ] as EffectBlendMode[]
                ).map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
              <input
                aria-label={`${layer.name} opacity`}
                type="range"
                min="0"
                max="100"
                value={layer.opacity}
                onChange={(event) =>
                  updateEffectLayer(layer.id, {
                    opacity: Number(event.target.value),
                  })
                }
              />
              <button
                aria-label={`Move ${layer.name} up`}
                disabled={index === 0}
                onClick={() => moveEffectLayer(layer.id, -1)}
              >
                ↑
              </button>
              <button
                aria-label={`Move ${layer.name} down`}
                disabled={index === photo.effectStack.length - 1}
                onClick={() => moveEffectLayer(layer.id, 1)}
              >
                ↓
              </button>
              <button
                aria-label={`Delete ${layer.name}`}
                onClick={() => deleteEffectLayer(layer.id)}
              >
                <Trash2 />
              </button>
            </div>
          ))}
          {!photo.effectStack.length && (
            <p className="panel-note">
              Preview a recipe, then add it here to blend and reorder it.
            </p>
          )}
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
  createFilmProfile,
  exportFilmProfiles,
  spectralProfiles,
  installSpectralProfiles,
  cacheHistory,
  openPackStatus,
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
  createFilmProfile: () => void;
  exportFilmProfiles: () => void;
  spectralProfiles: SpectralFilmProfile[];
  installSpectralProfiles: () => Promise<void>;
  cacheHistory: () => Promise<void>;
  openPackStatus: string;
}) {
  const a = photo.adjustments;
  const eras = [
    "All",
    ...Array.from(new Set(filmLooks.map((look) => look.era))),
  ];
  const [filmEra, setFilmEra] = useState("All");
  const visibleLooks = filmLooks.filter(
    (look) => filmEra === "All" || look.era === filmEra,
  );
  const cameraFilmTransform = (settings: Partial<Adjustments>) => {
    const identity = `${photo.metadata.camera}|${photo.rawInfo?.colorMatrix.flat().join(",") ?? ""}`;
    const seed = Array.from(identity).reduce(
      (sum, character) => (sum * 31 + character.charCodeAt(0)) % 997,
      17,
    );
    return {
      ...settings,
      redPrimaryHue: ((seed % 13) - 6) * 0.7,
      greenPrimaryHue: (((seed >> 2) % 11) - 5) * 0.6,
      bluePrimaryHue: (((seed >> 4) % 15) - 7) * 0.7,
      redPrimarySaturation: (seed % 9) - 4,
      greenPrimarySaturation: ((seed >> 3) % 9) - 4,
      bluePrimarySaturation: ((seed >> 5) % 9) - 4,
    };
  };
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
        <button
          className={selectedPreset?.id === "film-featured" ? "preset-selected" : ""}
          onClick={() =>
            choosePreset(
              "film-featured",
              filmLooks[0].name,
              cameraFilmTransform(filmLooks[0].settings),
            )
          }
        >
          <WandSparkles /> Apply featured look
        </button>
      </div>
      <Panel title="Film library" badge={`${filmLooks.length} stocks`}>
        <div className="film-era-browser" role="tablist" aria-label="Film era">
          {eras.map((era) => (
            <button
              key={era}
              role="tab"
              aria-selected={filmEra === era}
              className={filmEra === era ? "active" : ""}
              onClick={() => setFilmEra(era)}
            >
              {era}
            </button>
          ))}
        </div>
        <div className="look-grid film-look-grid">
          {visibleLooks.map((look) => (
            <button
              key={look.name}
              className={
                selectedPreset?.id === `film-${look.name}`
                  ? "preset-selected"
                  : ""
              }
              style={{ "--look": look.tone } as React.CSSProperties}
              onClick={() =>
                choosePreset(
                  `film-${look.name}`,
                  look.name,
                  cameraFilmTransform(look.settings),
                )
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
      <Panel title="Measured film" badge={`${spectralProfiles.length}`} open={false}>
        <div className="preset-manager-actions">
          <button onClick={() => void installSpectralProfiles()}>
            Install spectral profiles
          </button>
        </div>
        <p className="panel-note">{openPackCredits.spectral}</p>
        <div className="spectral-profile-list">
          {spectralProfiles.map((profile) => {
            const id = `spectral-${profile.info.stock}`;
            return (
              <button
                key={id}
                className={selectedPreset?.id === id ? "preset-selected" : ""}
                onClick={() =>
                  choosePreset(id, profile.info.name, {
                    ...cameraFilmTransform(spectralProfileSettings(profile)),
                    textureAsset: 3,
                  })
                }
              >
                <strong>{profile.info.name}</strong>
                <span>{profile.info.type} · measured response</span>
              </button>
            );
          })}
        </div>
        {openPackStatus && <p className="pack-status" role="status">{openPackStatus}</p>}
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
          label="Paper grade"
          value={a.paperGrade}
          min={-100}
          max={100}
          onChange={(v) => setAdjustment("paperGrade", v)}
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
        <AdjustSlider
          label="Vignette"
          value={a.vignette}
          onChange={(v) => setAdjustment("vignette", v)}
        />
        <div className="film-options">
          <button
            onClick={() =>
              applyPreset({
                negativeInversion: a.negativeInversion ? 0 : 100,
                temperature: a.negativeInversion ? a.temperature : -24,
                tint: a.negativeInversion ? a.tint : 18,
              })
            }
          >
            {a.negativeInversion ? "Positive" : "Invert negative"}
          </button>
          <button
            onClick={() =>
              applyPreset({ darkroomFilter: -22, saturation: -100 })
            }
          >
            Blue filter
          </button>
          <button
            onClick={() =>
              applyPreset({ darkroomFilter: 18, saturation: -100 })
            }
          >
            Amber filter
          </button>
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
      <Panel title="Texture library" open={false}>
        <div className="film-options">
          <button
            className={a.textureAsset === 0 ? "active" : ""}
            onClick={() => setAdjustment("textureAsset", 0)}
          >
            Clean
          </button>
          <button
            className={a.textureAsset === 1 ? "active" : ""}
            onClick={() => setAdjustment("textureAsset", 1)}
          >
            Fiber paper
          </button>
          <button
            className={a.textureAsset === 2 ? "active" : ""}
            onClick={() => setAdjustment("textureAsset", 2)}
          >
            Fine scratches
          </button>
          <button
            className={a.textureAsset === 3 ? "active" : ""}
            onClick={() => setAdjustment("textureAsset", 3)}
          >
            Dust & glass
          </button>
        </div>
        <p className="panel-note">
          High-resolution scanned-style dust and scratch texture scales to the
          finished output and stays on this device.
        </p>
      </Panel>
      <Panel title="Film history" open={false}>
        <div className="film-history">
          {filmHistory.map((item) => (
            <article key={item.era}>
              <img src={item.image} alt="" loading="lazy" />
              <div>
                <small>{item.era}</small>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <a href={item.source} target="_blank" rel="noreferrer">
                  {item.credit}
                </a>
              </div>
            </article>
          ))}
        </div>
        <button className="mask-batch" onClick={() => void cacheHistory()}>
          Make history images available offline
        </button>
      </Panel>
      <Panel title="Film profiles" open={false}>
        <div className="preset-manager-actions">
          <button onClick={createFilmProfile}>Save current film profile</button>
          <button onClick={exportFilmProfiles}>Export profiles</button>
        </div>
      </Panel>
    </>
  );
}

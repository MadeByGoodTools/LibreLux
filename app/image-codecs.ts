export type RawDecodeInfo = {
  engine: "LibRaw WebAssembly";
  cameraMake: string;
  cameraModel: string;
  lens: string;
  iso: number;
  aperture: number;
  shutter: number;
  focalLength: number;
  capturedAt: string;
  bitDepth: number;
  sensorPattern: "Bayer" | "X-Trans" | "Other";
  blackLevel: number;
  whiteLevel: number;
  colorMatrix: number[][];
  embeddedProfile: boolean;
};

export type DecodedSource = {
  displayFile: File;
  rawInfo: RawDecodeInfo | null;
  sourceBitDepth: number;
};

export type LinearRawImage = {
  width: number;
  height: number;
  data: Float32Array;
  sourceBitDepth: number;
  workingSpace: "linear-prophoto-rgb";
};

const rawPattern =
  /\.(3fr|ari|arw|bay|braw|cap|cr2|cr3|crw|dcr|dcs|dng|drf|eip|erf|fff|gpr|iiq|k25|kdc|mef|mos|mrw|nef|nrw|orf|pef|ptx|pxn|r3d|raf|raw|rwl|rw2|rwz|sr2|srf|srw|x3f)$/i;
const tiffPattern = /\.(tif|tiff)$/i;

export function isRawFile(file: { name: string }) {
  return rawPattern.test(file.name);
}

const rawDecodeSettings = {
  useCameraWb: true,
  useCameraMatrix: 3,
  outputBps: 16,
  userQual: 11,
  highlight: 5,
  greenMatching: true,
  fbddNoiserd: 1,
  medPasses: 1,
} as const;

/** Decode a camera RAW into a wide-gamut, scene-linear floating-point master. */
export async function decodeRawLinear(file: Blob): Promise<LinearRawImage> {
  const { default: LibRaw } = await import("libraw-wasm");
  const decoder = new LibRaw();
  try {
    await decoder.open(new Uint8Array(await file.arrayBuffer()), {
      ...rawDecodeSettings,
      outputColor: 4,
      gamm: [1, 1],
      noAutoBright: true,
    });
    const decoded = await decoder.imageData();
    if (!decoded?.data || !decoded.width || !decoded.height)
      throw new Error("RAW file did not produce linear pixels");
    const colors = Math.max(1, decoded.colors || 3);
    const maximum = decoded.data instanceof Uint16Array ? 65535 : 255;
    const data = new Float32Array(decoded.width * decoded.height * 3);
    for (let pixel = 0; pixel < decoded.width * decoded.height; pixel++) {
      const sourceOffset = pixel * colors;
      const targetOffset = pixel * 3;
      data[targetOffset] = Number(decoded.data[sourceOffset] ?? 0) / maximum;
      data[targetOffset + 1] =
        Number(decoded.data[sourceOffset + Math.min(1, colors - 1)] ?? 0) /
        maximum;
      data[targetOffset + 2] =
        Number(decoded.data[sourceOffset + Math.min(2, colors - 1)] ?? 0) /
        maximum;
    }
    return {
      width: decoded.width,
      height: decoded.height,
      data,
      sourceBitDepth: decoded.bits || 16,
      workingSpace: "linear-prophoto-rgb",
    };
  } finally {
    decoder.dispose();
  }
}

export function isTiffFile(file: File) {
  return tiffPattern.test(file.name) || /image\/tiff/i.test(file.type);
}

function canvasBlob(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  type = "image/png",
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas image conversion is unavailable");
  const safeRgba = new Uint8ClampedArray(new ArrayBuffer(rgba.byteLength));
  safeRgba.set(rgba);
  context.putImageData(new ImageData(safeRgba, width, height), 0, 0);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image encoding failed")),
      type,
      0.96,
    ),
  );
}

async function decodeRaw(file: File): Promise<DecodedSource> {
  const { default: LibRaw } = await import("libraw-wasm");
  const decoder = new LibRaw();
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await decoder.open(bytes, {
      ...rawDecodeSettings,
      outputColor: 1,
      noAutoBright: false,
    });
    const [metadata, decoded] = await Promise.all([
      decoder.metadata(true),
      decoder.imageData(),
    ]);
    if (!decoded?.data || !decoded.width || !decoded.height)
      throw new Error("RAW file did not produce display pixels");
    const colors = Math.max(1, decoded.colors || 3);
    const rgba = new Uint8ClampedArray(decoded.width * decoded.height * 4);
    const source = decoded.data;
    const divisor = source instanceof Uint16Array ? 257 : 1;
    for (let pixel = 0; pixel < decoded.width * decoded.height; pixel++) {
      const sourceOffset = pixel * colors;
      const targetOffset = pixel * 4;
      rgba[targetOffset] = Math.round(
        Number(source[sourceOffset] ?? 0) / divisor,
      );
      rgba[targetOffset + 1] = Math.round(
        Number(source[sourceOffset + Math.min(1, colors - 1)] ?? 0) / divisor,
      );
      rgba[targetOffset + 2] = Math.round(
        Number(source[sourceOffset + Math.min(2, colors - 1)] ?? 0) / divisor,
      );
      rgba[targetOffset + 3] = 255;
    }
    const blob = await canvasBlob(rgba, decoded.width, decoded.height);
    const color = metadata?.color_data;
    const sensorPattern: RawDecodeInfo["sensorPattern"] = metadata?.fuji
      ? "X-Trans"
      : metadata?.filters
        ? "Bayer"
        : "Other";
    return {
      displayFile: new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "-RAW-preview.png"),
        { type: "image/png", lastModified: file.lastModified },
      ),
      sourceBitDepth: decoded.bits || 16,
      rawInfo: {
        engine: "LibRaw WebAssembly",
        cameraMake: metadata?.camera_make ?? "",
        cameraModel: metadata?.camera_model ?? "",
        lens: metadata?.lens?.Lens ?? metadata?.lens?.makernotes?.Lens ?? "",
        iso: metadata?.iso_speed ?? 0,
        aperture: metadata?.aperture ?? 0,
        shutter: metadata?.shutter ?? 0,
        focalLength: metadata?.focal_len ?? 0,
        capturedAt:
          metadata?.timestamp instanceof Date
            ? metadata.timestamp.toISOString()
            : "",
        bitDepth: decoded.bits || color?.raw_bps || 16,
        sensorPattern,
        blackLevel: color?.black ?? color?.dng_levels?.dng_black ?? 0,
        whiteLevel:
          color?.maximum ?? color?.dng_levels?.dng_whitelevel?.[0] ?? 0,
        colorMatrix: color?.cmatrix ?? color?.dng_color?.[0]?.colormatrix ?? [],
        embeddedProfile: Boolean(color?.profile_length),
      },
    };
  } finally {
    decoder.dispose();
  }
}

async function decodeTiff(file: File): Promise<DecodedSource> {
  const UTIF = await import("utif");
  const buffer = await file.arrayBuffer();
  const pages = UTIF.decode(buffer);
  const page = pages[0];
  if (!page) throw new Error("TIFF does not contain an image page");
  UTIF.decodeImage(buffer, page);
  const rgba = new Uint8ClampedArray(UTIF.toRGBA8(page));
  const bits = Array.isArray(page.t258)
    ? Math.max(...page.t258.map(Number))
    : 8;
  const blob = await canvasBlob(rgba, page.width, page.height);
  return {
    displayFile: new File(
      [blob],
      file.name.replace(/\.(tif|tiff)$/i, "-TIFF-preview.png"),
      { type: "image/png", lastModified: file.lastModified },
    ),
    sourceBitDepth: bits,
    rawInfo: null,
  };
}

export async function decodeEditableSource(file: File): Promise<DecodedSource> {
  if (isRawFile(file)) return decodeRaw(file);
  if (isTiffFile(file)) return decodeTiff(file);
  return { displayFile: file, rawInfo: null, sourceBitDepth: 8 };
}

export const landscapeMaskTargets = [
  "landscape-snow",
  "landscape-mountains",
  "landscape-architecture",
  "landscape-vegetation",
  "landscape-water",
  "landscape-natural-ground",
  "landscape-artificial-ground",
] as const;

export const personMaskTargets = [
  "facial-skin",
  "body-skin",
  "eyebrows",
  "eye-sclera",
  "lips",
  "facial-hair",
] as const;

export type LandscapeMaskTarget = (typeof landscapeMaskTargets)[number];
export type PersonMaskTarget = (typeof personMaskTargets)[number];

export type DetailedCullScores = {
  subjectSharpness: number;
  eyeSharpness: number;
  eyesOpen: number;
  exposure: number;
  blur: number;
  duplicate: number;
  shallowDepthConfidence: number;
};

export type CullPreferences = {
  focusStrictness: number;
  exposureStrictness: number;
  protectShallowDepth: boolean;
};

export type CullDecision = {
  decision: "select" | "review" | "reject";
  score: number;
  reasons: string[];
};

export type LabelDefinition = {
  id: string;
  name: string;
  color: string;
};

export type CatalogHealthItem = {
  kind: "missing" | "preview" | "sidecar" | "backup";
  photoId: string;
  message: string;
};

export const defaultLabelDefinitions: LabelDefinition[] = [
  { id: "red", name: "Urgent", color: "#e35c66" },
  { id: "yellow", name: "Review", color: "#d7ad45" },
  { id: "green", name: "Approved", color: "#50b889" },
  { id: "blue", name: "Client", color: "#5c8fda" },
  { id: "purple", name: "Portfolio", color: "#aa79d7" },
];

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function normalizeMaskEdge(value: number) {
  return clamp(value, -100, 100);
}

/** Expands positive masks and contracts negative masks without softening edges. */
export function refineMaskAlpha(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  edge: number,
) {
  if (alpha.length !== width * height || width < 1 || height < 1)
    throw new Error("Mask dimensions do not match its alpha channel");
  const radius = Math.min(12, Math.round(Math.abs(normalizeMaskEdge(edge)) / 9));
  if (!radius) return new Uint8ClampedArray(alpha);
  const expand = edge > 0;
  const output = new Uint8ClampedArray(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = expand ? 0 : 255;
      for (let oy = -radius; oy <= radius; oy++) {
        const sy = Math.min(height - 1, Math.max(0, y + oy));
        for (let ox = -radius; ox <= radius; ox++) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const sample = alpha[sy * width + Math.min(width - 1, Math.max(0, x + ox))];
          value = expand ? Math.max(value, sample) : Math.min(value, sample);
        }
      }
      output[y * width + x] = value;
    }
  }
  return output;
}

export function editFingerprint(input: {
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  cropLeft: number;
  rotation: number;
  retouchCount: number;
}) {
  return [
    input.cropTop,
    input.cropRight,
    input.cropBottom,
    input.cropLeft,
    input.rotation,
    input.retouchCount,
  ]
    .map((value) => Math.round(value * 1000) / 1000)
    .join(":");
}

export function evaluateCull(
  scores: DetailedCullScores,
  preferences: CullPreferences,
): CullDecision {
  const focusFloor = 72 - clamp(preferences.focusStrictness) * 0.42;
  const exposureFloor = 70 - clamp(preferences.exposureStrictness) * 0.38;
  const protectedFocus =
    preferences.protectShallowDepth && scores.shallowDepthConfidence >= 70
      ? Math.max(scores.subjectSharpness, scores.eyeSharpness)
      : Math.min(scores.subjectSharpness, scores.eyeSharpness || scores.subjectSharpness);
  const reasons: string[] = [];
  if (protectedFocus < focusFloor) reasons.push("Soft primary subject");
  if (scores.eyesOpen > 0 && scores.eyesOpen < 45) reasons.push("Eyes may be closed");
  if (scores.exposure < exposureFloor) reasons.push("Exposure needs review");
  if (scores.duplicate > 92) reasons.push("Near duplicate");
  const score = Math.round(
    clamp(
      protectedFocus * 0.42 +
        scores.exposure * 0.25 +
        Math.max(scores.eyesOpen, 60) * 0.18 +
        (100 - scores.duplicate) * 0.15,
    ),
  );
  return {
    decision: reasons.length >= 2 ? "reject" : reasons.length ? "review" : "select",
    score,
    reasons: reasons.length ? reasons : ["Sharp subject and balanced exposure"],
  };
}

export function normalizeLabels(labels: LabelDefinition[]) {
  const seen = new Set<string>();
  return labels.slice(0, 10).map((label, index) => {
    const fallback = defaultLabelDefinitions[index % defaultLabelDefinitions.length];
    let id = label.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || fallback.id;
    while (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    return {
      id,
      name: label.name.trim().slice(0, 30) || fallback.name,
      color: /^#[0-9a-f]{6}$/i.test(label.color) ? label.color : fallback.color,
    };
  });
}

export function availableCollisionName(name: string, existing: Iterable<string>) {
  const names = new Set(Array.from(existing, (item) => item.toLowerCase()));
  if (!names.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";
  for (let index = 2; index < 10000; index++) {
    const candidate = `${base}-${index}${extension}`;
    if (!names.has(candidate.toLowerCase())) return candidate;
  }
  throw new Error("Could not create a collision-free export name");
}

export function renderFilenameTemplate(
  template: string,
  values: { filename: string; date: string; camera: string; sequence: number },
) {
  const base = values.filename.replace(/\.[^.]+$/, "");
  return template
    .replaceAll("{filename}", base)
    .replaceAll("{date}", values.date || "undated")
    .replaceAll("{camera}", values.camera || "camera")
    .replaceAll("{sequence}", String(Math.max(1, values.sequence)).padStart(4, "0"))
    .replace(/[\\/:*?"<>|]/g, "-")
    .slice(0, 180);
}

export function buildCatalogHealth(input: Array<{
  id: string;
  missing: boolean;
  hasPreview: boolean;
  sidecarCurrent: boolean;
  backupAgeDays: number;
}>): CatalogHealthItem[] {
  return input.flatMap((photo) => {
    const items: CatalogHealthItem[] = [];
    if (photo.missing) items.push({ kind: "missing", photoId: photo.id, message: "Original is disconnected" });
    if (!photo.hasPreview) items.push({ kind: "preview", photoId: photo.id, message: "Smart preview should be rebuilt" });
    if (!photo.sidecarCurrent) items.push({ kind: "sidecar", photoId: photo.id, message: "Sidecar is older than the edit" });
    if (photo.backupAgeDays > 30) items.push({ kind: "backup", photoId: photo.id, message: "Catalog backup is overdue" });
    return items;
  });
}

export function groupBySimilarity<T extends { id: string; similarity: number }>(
  items: T[],
  sensitivity: number,
) {
  const threshold = 100 - clamp(sensitivity) * 0.7;
  const groups: T[][] = [];
  for (const item of items) {
    const group = groups.find((candidate) =>
      Math.abs(candidate[0].similarity - item.similarity) <= threshold,
    );
    if (group) group.push(item);
    else groups.push([item]);
  }
  return groups;
}

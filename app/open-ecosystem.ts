export type JsonObject = Record<string, unknown>;

export type CommunityPackage = {
  format: "LibreLux Community Package";
  version: 1;
  id: string;
  name: string;
  publisher: string;
  kind: "camera-profile" | "lens-profile" | "effect" | "metadata";
  payload: JsonObject;
  publicKey: JsonWebKey;
  signature: string;
};

export type LibreLuxPlugin = {
  format: "LibreLux Plugin";
  version: 1;
  id: string;
  name: string;
  publisher: string;
  permissions: Array<"masks" | "raw" | "export" | "metadata" | "effects">;
  hooks: Partial<Record<"masks" | "raw" | "export" | "metadata" | "effects", JsonObject>>;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as JsonObject)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function syncKey(passphrase: string, salt: Uint8Array) {
  if (passphrase.trim().length < 8)
    throw new Error("Use a sync phrase with at least 8 characters");
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations: 210_000,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptCatalogSync(payload: unknown, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await syncKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(stableJson(payload)),
  );
  return JSON.stringify({
    format: "LibreLux Encrypted Sync",
    version: 1,
    cipher: "AES-256-GCM",
    kdf: "PBKDF2-SHA256-210000",
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  });
}

export async function decryptCatalogSync(source: string, passphrase: string) {
  const envelope = JSON.parse(source) as {
    format?: string;
    version?: number;
    salt?: string;
    iv?: string;
    data?: string;
  };
  if (
    envelope.format !== "LibreLux Encrypted Sync" ||
    envelope.version !== 1 ||
    !envelope.salt ||
    !envelope.iv ||
    !envelope.data
  )
    throw new Error("This is not a LibreLux encrypted sync file");
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const key = await syncKey(passphrase, salt);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      base64ToBytes(envelope.data) as BufferSource,
    );
    return JSON.parse(decoder.decode(plaintext)) as JsonObject;
  } catch {
    throw new Error("The sync phrase is incorrect or the file was changed");
  }
}

export async function sha256(value: unknown) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(stableJson(value)));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyCommunityPackage(candidate: unknown) {
  const pack = candidate as CommunityPackage;
  if (
    pack?.format !== "LibreLux Community Package" ||
    pack.version !== 1 ||
    !pack.id ||
    !pack.name ||
    !pack.publisher ||
    !pack.payload ||
    !pack.publicKey ||
    !pack.signature
  )
    throw new Error("Community package manifest is incomplete");
  if (!["camera-profile", "lens-profile", "effect", "metadata"].includes(pack.kind))
    throw new Error("Community package type is not supported");
  const signed = {
    format: pack.format,
    version: pack.version,
    id: pack.id,
    name: pack.name,
    publisher: pack.publisher,
    kind: pack.kind,
    payload: pack.payload,
  };
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      pack.publicKey,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      base64ToBytes(pack.signature) as BufferSource,
      encoder.encode(stableJson(signed)),
    );
    if (!verified) throw new Error("Signature mismatch");
    return pack;
  } catch {
    throw new Error("The community package signature is not valid");
  }
}

export async function createEditRecipe(input: {
  name: string;
  processVersion: string;
  adjustments: JsonObject;
  masks: unknown[];
  effects: unknown[];
}) {
  const steps = {
    processVersion: input.processVersion,
    adjustments: input.adjustments,
    masks: input.masks,
    effects: input.effects,
  };
  return {
    format: "LibreLux Edit Recipe",
    version: 1,
    name: input.name,
    createdAt: new Date().toISOString(),
    digest: await sha256(steps),
    steps,
  };
}

export function adjustmentDifference(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .flatMap((key) => {
      const left = before[key];
      const right = after[key];
      if (typeof left !== "number" || typeof right !== "number" || left === right)
        return [];
      return [{ key, before: left, after: right, delta: right - left }];
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function automaticQualityPlan(input: {
  webGpu: boolean;
  deviceMemory: number;
  hardwareConcurrency: number;
}) {
  const score =
    (input.webGpu ? 4 : 0) +
    Math.min(4, Math.max(1, input.deviceMemory / 2)) +
    Math.min(4, Math.max(1, input.hardwareConcurrency / 2));
  if (score >= 10)
    return { tier: "Maximum", previewEdge: 4096, workers: 6, tile: 1024 };
  if (score >= 7)
    return { tier: "Balanced", previewEdge: 2560, workers: 4, tile: 768 };
  return { tier: "Responsive", previewEdge: 1600, workers: 2, tile: 512 };
}

export function validatePlugin(candidate: unknown): LibreLuxPlugin {
  const plugin = candidate as LibreLuxPlugin;
  const allowed = new Set(["masks", "raw", "export", "metadata", "effects"]);
  if (
    plugin?.format !== "LibreLux Plugin" ||
    plugin.version !== 1 ||
    !plugin.id ||
    !plugin.name ||
    !plugin.publisher ||
    !Array.isArray(plugin.permissions) ||
    plugin.permissions.some((permission) => !allowed.has(permission)) ||
    !plugin.hooks ||
    Object.keys(plugin.hooks).some((hook) => !plugin.permissions.includes(hook as never))
  )
    throw new Error("Plug-in manifest or permissions are invalid");
  return plugin;
}

export function portableCatalogManifest(input: {
  catalogId: string;
  photoCount: number;
  lastBackupAt: number;
}) {
  return {
    format: "LibreLux Portable Catalog",
    version: 1,
    catalogId: input.catalogId,
    photoCount: input.photoCount,
    lastBackupAt: new Date(input.lastBackupAt).toISOString(),
    folders: { originals: "Originals", previews: "Previews", sidecars: "Sidecars" },
  };
}

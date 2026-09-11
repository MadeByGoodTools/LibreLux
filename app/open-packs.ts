export type OpenOpticsProfile = {
  id: string;
  version: number;
  camera: string;
  lens: string;
  settings: Record<string, number>;
  source: "Measured open data";
};

export type SpectralFilmProfile = {
  metadata: { license?: string; copyright?: string; datasource?: string };
  info: { stock: string; name: string; type: string };
  data: {
    wavelengths: number[];
    log_sensitivity?: Array<[number, number, number]>;
    channel_density?: Array<[number | null, number | null, number | null]>;
  };
};

const LENSFUN_ROOT =
  "https://raw.githubusercontent.com/lensfun/lensfun/master/data/db";
const SPEKTRAFILM_ROOT =
  "https://raw.githubusercontent.com/darktable-org/darktable-spektrafilm/main/packs/0.3.3/profiles";

const opticsSources = [
  "slr-canon.xml",
  "mil-canon.xml",
  "slr-nikon.xml",
  "mil-nikon.xml",
  "mil-sony.xml",
  "mil-fujifilm.xml",
  "mil-panasonic.xml",
  "mil-olympus.xml",
  "mil-leica.xml",
];

export const spectralSources = [
  "kodak_portra_400.json",
  "kodak_ektachrome_100.json",
  "fujifilm_provia_100f.json",
  "kodak_doublex.json",
];

async function cachedFetch(url: string, refresh = false) {
  const cache = await caches.open("librelux-open-packs-v1");
  if (!refresh) {
    const saved = await cache.match(url);
    if (saved) return saved;
  }
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Pack download failed (${response.status})`);
  await cache.put(url, response.clone());
  return response;
}

const numberAttribute = (element: Element | undefined, name: string) =>
  Number(element?.getAttribute(name) ?? 0) || 0;

export async function installMeasuredOpticsPack(
  onProgress?: (message: string) => void,
) {
  const profiles: OpenOpticsProfile[] = [];
  for (let sourceIndex = 0; sourceIndex < opticsSources.length; sourceIndex++) {
    const file = opticsSources[sourceIndex];
    onProgress?.(`Installing measured optics ${sourceIndex + 1}/${opticsSources.length}`);
    const xml = await (await cachedFetch(`${LENSFUN_ROOT}/${file}`)).text();
    const document = new DOMParser().parseFromString(xml, "application/xml");
    for (const [index, lens] of [...document.querySelectorAll("lens")].entries()) {
      const calibration = lens.querySelector("calibration");
      if (!calibration) continue;
      const distortion = calibration.querySelector("distortion") ?? undefined;
      const vignetting = calibration.querySelector("vignetting") ?? undefined;
      const tca = calibration.querySelector("tca") ?? undefined;
      const model = lens.querySelector("model")?.textContent?.trim();
      const maker = lens.querySelector("maker")?.textContent?.trim() ?? "";
      if (!model || (!distortion && !vignetting && !tca)) continue;
      const distortionValue =
        numberAttribute(distortion, "k1") ||
        numberAttribute(distortion, "b") ||
        numberAttribute(distortion, "a");
      const vignetteValue =
        numberAttribute(vignetting, "k1") || numberAttribute(vignetting, "alpha1");
      const chromaticValue =
        Math.abs(numberAttribute(tca, "kr") - 1) +
        Math.abs(numberAttribute(tca, "kb") - 1);
      profiles.push({
        id: `lensfun-${file}-${index}`,
        version: 1,
        camera: maker,
        lens: model,
        settings: {
          distortion: Math.max(-100, Math.min(100, Math.round(distortionValue * 950))),
          lensVignette: Math.max(-100, Math.min(100, Math.round(vignetteValue * 120))),
          chromatic: Math.max(0, Math.min(100, Math.round(chromaticValue * 2200))),
          lensSharpness: 24,
        },
        source: "Measured open data",
      });
    }
  }
  localStorage.setItem("librelux-optics-pack", String(Date.now()));
  localStorage.setItem(
    "librelux-optics-pack-data",
    JSON.stringify(profiles.slice(0, 1800)),
  );
  return profiles;
}

export function loadInstalledOpticsPack() {
  try {
    return JSON.parse(
      localStorage.getItem("librelux-optics-pack-data") ?? "[]",
    ) as OpenOpticsProfile[];
  } catch {
    return [];
  }
}

export async function installSpectralFilmPack(
  onProgress?: (message: string) => void,
) {
  const profiles: SpectralFilmProfile[] = [];
  for (let index = 0; index < spectralSources.length; index++) {
    onProgress?.(`Installing measured film ${index + 1}/${spectralSources.length}`);
    const response = await cachedFetch(`${SPEKTRAFILM_ROOT}/${spectralSources[index]}`);
    profiles.push((await response.json()) as SpectralFilmProfile);
  }
  localStorage.setItem("librelux-spectral-pack", String(Date.now()));
  return profiles;
}

export async function loadSpectralFilmPack() {
  if (!localStorage.getItem("librelux-spectral-pack")) return [];
  const profiles: SpectralFilmProfile[] = [];
  for (const file of spectralSources) {
    try {
      profiles.push(
        (await (
          await cachedFetch(`${SPEKTRAFILM_ROOT}/${file}`)
        ).json()) as SpectralFilmProfile,
      );
    } catch {
      // Keep other installed profiles available if one cache entry is damaged.
    }
  }
  return profiles;
}

export function spectralProfileSettings(profile: SpectralFilmProfile) {
  const sensitivity = profile.data.log_sensitivity ?? [];
  const density = profile.data.channel_density ?? [];
  const channelEnergy = [0, 0, 0];
  sensitivity.forEach((row) =>
    row.forEach((value, channel) => {
      if (Number.isFinite(value)) channelEnergy[channel] += 10 ** value;
    }),
  );
  const maxEnergy = Math.max(...channelEnergy, 0.0001);
  const normalized = channelEnergy.map((value) => value / maxEnergy);
  const validDensity = density.flat().filter((value): value is number => value !== null);
  const densityRange = validDensity.length
    ? Math.max(...validDensity) - Math.min(...validDensity)
    : 1;
  return {
    temperature: Math.round((normalized[0] - normalized[2]) * 32),
    tint: Math.round((normalized[0] + normalized[2] - normalized[1] * 2) * 20),
    saturation: Math.round(Math.max(-20, Math.min(24, densityRange * 9 - 8))),
    contrast: Math.round(Math.max(-12, Math.min(30, densityRange * 11))),
    fade: profile.info.type === "negative" ? 8 : 2,
    grain: /400|double/i.test(profile.info.name) ? 28 : 16,
    filmIntensity: 100,
  };
}

export const filmHistory = [
  {
    era: "1900s",
    title: "The portable roll-film camera",
    text: "Factory-loaded roll film helped move photography beyond glass plates and specialist darkrooms.",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kodak_stereo_camera.jpg?width=720",
    source: "https://commons.wikimedia.org/wiki/File:Kodak_stereo_camera.jpg",
    credit: "Eastman Kodak Co., 1905 · Public domain",
  },
  {
    era: "1920s",
    title: "Pocket cameras become everyday tools",
    text: "Compact folding cameras made candid travel and family photography much more practical.",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/1921_Kodak.png?width=720",
    source: "https://commons.wikimedia.org/wiki/File:1921_Kodak.png",
    credit: "Porsche997SBS · Public domain worldwide",
  },
  {
    era: "1940s",
    title: "35 mm defines a working format",
    text: "The small negative and fast handling of 35 mm cameras shaped documentary and editorial photography.",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kodak35Camera.jpg?width=720",
    source: "https://commons.wikimedia.org/wiki/File:Kodak35Camera.jpg",
    credit: "Kevin Murray · CC0",
  },
  {
    era: "2000s",
    title: "Digital capture joins the compact camera",
    text: "Digital compacts brought immediate review and editable files into ordinary photo workflows.",
    image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/KODAK_M753.jpg?width=720",
    source: "https://commons.wikimedia.org/wiki/File:KODAK_M753.jpg",
    credit: "Stanisław · CC0",
  },
] as const;

export async function cacheFilmHistoryImages() {
  for (const item of filmHistory) await cachedFetch(item.image);
  localStorage.setItem("librelux-history-pack", String(Date.now()));
}

export const openPackCredits = {
  optics:
    "Lensfun measured camera/lens database · CC BY-SA 3.0 database license",
  spectral:
    "Spektrafilm profiles by Andrea Volpato · CC BY-SA 4.0 · unmodified measurement data",
};

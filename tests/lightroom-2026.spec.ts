import { expect, test } from "@playwright/test";
import {
  availableCollisionName,
  buildCatalogHealth,
  evaluateCull,
  groupBySimilarity,
  normalizeLabels,
  refineMaskAlpha,
  renderFilenameTemplate,
} from "../app/lightroom-2026";

test("mask edge expansion and contraction are deterministic", () => {
  const source = new Uint8ClampedArray(25);
  source[12] = 255;
  const expanded = refineMaskAlpha(source, 5, 5, 30);
  expect(Array.from(expanded).filter(Boolean).length).toBeGreaterThan(1);
  const filled = new Uint8ClampedArray(25).fill(255);
  filled[12] = 0;
  const contracted = refineMaskAlpha(filled, 5, 5, -30);
  expect(Array.from(contracted).filter((value) => value === 0).length).toBeGreaterThan(1);
  expect(() => refineMaskAlpha(source, 4, 4, 10)).toThrow();
});

test("assisted culling explains decisions and protects shallow focus", () => {
  const scores = {
    subjectSharpness: 88,
    eyeSharpness: 24,
    eyesOpen: 92,
    exposure: 84,
    blur: 30,
    duplicate: 10,
    shallowDepthConfidence: 91,
  };
  expect(
    evaluateCull(scores, {
      focusStrictness: 60,
      exposureStrictness: 50,
      protectShallowDepth: true,
    }).decision,
  ).toBe("select");
  expect(
    evaluateCull(
      { ...scores, subjectSharpness: 20, eyeSharpness: 18, exposure: 20 },
      { focusStrictness: 80, exposureStrictness: 80, protectShallowDepth: false },
    ).reasons,
  ).toEqual(expect.arrayContaining(["Soft primary subject", "Exposure needs review"]));
});

test("labels, templates and export collisions normalize safely", () => {
  expect(normalizeLabels([{ id: "Client Pick", name: "", color: "bad" }])[0]).toEqual({
    id: "client-pick",
    name: "Urgent",
    color: "#e35c66",
  });
  expect(
    renderFilenameTemplate("{date}_{camera}_{filename}_{sequence}", {
      filename: "portrait.raw",
      date: "2026-09-12",
      camera: "X-T5",
      sequence: 7,
    }),
  ).toBe("2026-09-12_X-T5_portrait_0007");
  expect(availableCollisionName("photo.jpg", ["PHOTO.JPG", "photo-2.jpg"])).toBe(
    "photo-3.jpg",
  );
});

test("catalog health and similarity groups produce actionable results", () => {
  expect(
    buildCatalogHealth([
      {
        id: "p1",
        missing: true,
        hasPreview: false,
        sidecarCurrent: false,
        backupAgeDays: 45,
      },
    ]),
  ).toHaveLength(4);
  expect(
    groupBySimilarity(
      [
        { id: "a", similarity: 10 },
        { id: "b", similarity: 12 },
        { id: "c", similarity: 90 },
      ],
      95,
    ),
  ).toHaveLength(2);
});

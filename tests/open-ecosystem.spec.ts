import { expect, test } from "@playwright/test";
import {
  adjustmentDifference,
  automaticQualityPlan,
  createEditRecipe,
  decryptCatalogSync,
  encryptCatalogSync,
  portableCatalogManifest,
  stableJson,
  validatePlugin,
  verifyCommunityPackage,
} from "../app/open-ecosystem";

test("encrypted sync round-trips and rejects the wrong phrase", async () => {
  const source = { photos: [{ id: "p1", exposure: 1.25 }], albums: ["Work"] };
  const encrypted = await encryptCatalogSync(source, "correct horse battery staple");
  expect(encrypted).not.toContain("exposure");
  await expect(
    decryptCatalogSync(encrypted, "correct horse battery staple"),
  ).resolves.toEqual(source);
  await expect(decryptCatalogSync(encrypted, "incorrect phrase")).rejects.toThrow(
    /incorrect|changed/,
  );
});

test("community packages require a valid P-256 signature", async () => {
  const keys = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const signed = {
    format: "LibreLux Community Package" as const,
    version: 1 as const,
    id: "lens.example.50",
    name: "Example 50mm",
    publisher: "Open Profiles",
    kind: "lens-profile" as const,
    payload: { distortion: -3, vignette: 12 },
  };
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keys.privateKey,
    new TextEncoder().encode(stableJson(signed)),
  );
  const packageFile = {
    ...signed,
    publicKey: await crypto.subtle.exportKey("jwk", keys.publicKey),
    signature: Buffer.from(signature).toString("base64"),
  };
  await expect(verifyCommunityPackage(packageFile)).resolves.toMatchObject({
    id: signed.id,
  });
  await expect(
    verifyCommunityPackage({ ...packageFile, payload: { distortion: 99 } }),
  ).rejects.toThrow(/signature/);
});

test("recipes are stable and differences are ordered by magnitude", async () => {
  const recipe = await createEditRecipe({
    name: "Portrait",
    processVersion: "2026",
    adjustments: { exposure: 1, contrast: 12 },
    masks: [{ id: "skin" }],
    effects: [],
  });
  expect(recipe.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(
    adjustmentDifference(
      { exposure: 0, contrast: 0, nested: {} },
      { exposure: 1, contrast: 12, nested: {} },
    ).map((item) => item.key),
  ).toEqual(["contrast", "exposure"]);
});

test("automatic tuning, plug-in permissions and portable manifests are bounded", () => {
  expect(
    automaticQualityPlan({ webGpu: true, deviceMemory: 16, hardwareConcurrency: 12 }),
  ).toMatchObject({ tier: "Maximum", workers: 6 });
  expect(
    automaticQualityPlan({ webGpu: false, deviceMemory: 2, hardwareConcurrency: 2 }),
  ).toMatchObject({ tier: "Responsive", workers: 2 });
  expect(
    validatePlugin({
      format: "LibreLux Plugin",
      version: 1,
      id: "open.warm",
      name: "Open Warmth",
      publisher: "Community",
      permissions: ["effects"],
      hooks: { effects: { temperature: 8 } },
    }).permissions,
  ).toEqual(["effects"]);
  expect(() =>
    validatePlugin({
      format: "LibreLux Plugin",
      version: 1,
      id: "bad",
      name: "Bad",
      publisher: "Unknown",
      permissions: ["effects"],
      hooks: { metadata: {} },
    }),
  ).toThrow(/permissions/);
  expect(
    portableCatalogManifest({ catalogId: "c1", photoCount: 24, lastBackupAt: 0 }),
  ).toMatchObject({ photoCount: 24, folders: { originals: "Originals" } });
});

test("open ecosystem workspace exposes items 51 through 60 without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('html[data-librelux-ready="true"]')).toHaveCount(1, {
    timeout: 30_000,
  });
  const ecosystemButton = page.getByRole("button", { name: "Open ecosystem" });
  if (await ecosystemButton.isVisible()) await ecosystemButton.click();
  else {
    await page.getByRole("button", { name: "Commands" }).click();
    await page
      .getByRole("dialog", { name: "Commands" })
      .getByRole("button", { name: "Open ecosystem" })
      .click();
  }
  await expect(page.getByRole("dialog", { name: "Open ecosystem" })).toBeVisible();
  for (let item = 51; item <= 60; item++)
    await expect(page.getByRole("dialog").getByText(String(item), { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use automatic plan" })).toBeVisible();
  expect(errors).toEqual([]);
});

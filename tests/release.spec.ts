import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

const fixture = path.resolve("tests/fixtures/photo.png");

async function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function openReady(page: Page) {
  await page.goto("/");
  await expect(page.locator('html[data-librelux-ready="true"]')).toHaveCount(1, {
    timeout: 30_000,
  });
}

test("loads cleanly, exposes the family logo, and restores a local catalog", async ({
  page,
}) => {
  const errors = await collectErrors(page);
  await openReady(page);
  await expect(page.getByRole("heading", { name: "Bring your photos into focus." })).toBeVisible();
  await expect(page.locator('img[src="/librelux-logo.svg"]')).toBeVisible();
  await page.locator("#librelux-photo-import").setInputFiles(fixture);
  await expect(page.locator(".comparison-edited")).toBeVisible();
  await page.reload();
  await expect(page.locator('html[data-librelux-ready="true"]')).toHaveCount(1, {
    timeout: 30_000,
  });
  await expect(page.locator(".comparison-edited")).toBeVisible();
  expect(errors).toEqual([]);
});

test("all optics presets preview live and Apply clears the selected outline", async ({
  page,
}) => {
  const errors = await collectErrors(page);
  await openReady(page);
  if (!(await page.locator(".comparison-edited").count())) {
    await page.locator("#librelux-photo-import").setInputFiles(fixture);
    await expect(page.locator(".comparison-edited")).toBeVisible();
  }
  await page.getByRole("tab", { name: /Optics/ }).click();
  await page.getByRole("button", { name: /^Barrel$/ }).click();
  const preset = page.getByRole("button", { name: /^Barrel$/ });
  await expect(preset).toHaveClass(/preset-selected/);
  const photo = page.locator(".comparison-edited");
  const atFull = await photo.getAttribute("style");
  const amount = page.getByRole("slider", { name: "Preset amount" });
  await amount.fill("25");
  await expect(page.getByText("25%", { exact: true })).toBeVisible();
  await expect.poll(() => photo.getAttribute("style")).not.toBe(atFull);
  await page.locator(".preset-commit").getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".preset-commit")).toHaveCount(0);
  await expect(preset).not.toHaveClass(/preset-selected/);
  expect(errors).toEqual([]);
});

test("keyboard, 200 percent text, contrast, and reduced motion remain usable", async ({
  page,
}) => {
  const errors = await collectErrors(page);
  await openReady(page);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement !== document.body),
  ).toBe(true);
  await page.getByRole("button", { name: "Preferences" }).click();
  await page.getByRole("button", { name: /High contrast/ }).click();
  await page.getByRole("button", { name: /Reduce motion/ }).click();
  await page.getByRole("button", { name: /200% interface text/ }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/high-contrast/);
  await expect(page.locator(".app-shell")).toHaveClass(/reduced-motion/);
  await expect(page.locator(".app-shell")).toHaveClass(/large-text/);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

test("has no serious automated accessibility violations", async ({ page }) => {
  await openReady(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const blocking = results.violations.filter((item) =>
    ["serious", "critical"].includes(item.impact ?? ""),
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test("album tools stay separated inside the narrow catalog rail", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet-chromium", "The catalog rail is hidden in tablet mode");
  const errors = await collectErrors(page);
  await openReady(page);
  const tools = page.locator(".collection-tools");
  await tools.scrollIntoViewIfNeeded();
  await expect(tools.getByRole("button")).toHaveCount(5);
  const layout = await tools.evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(layout.columns).toBe(2);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  const boxes = await tools.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const box = button.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }),
  );
  for (let index = 0; index < boxes.length; index++)
    for (let other = index + 1; other < boxes.length; other++) {
      const a = boxes[index];
      const b = boxes[other];
      const overlaps =
        Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
        Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      expect(overlaps).toBe(false);
    }
  expect(errors).toEqual([]);
});

test("interactive accents use the LibreLux logo palette", async ({ page }) => {
  await openReady(page);
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const primary = getComputedStyle(document.querySelector(".primary-button")!);
    const activeTab = getComputedStyle(
      document.querySelector('.workspace-tabs button[aria-selected="true"]')!,
      "::after",
    );
    return {
      mint: root.getPropertyValue("--brand-mint").trim(),
      teal: root.getPropertyValue("--brand-teal").trim(),
      blue: root.getPropertyValue("--brand-blue").trim(),
      ice: root.getPropertyValue("--brand-ice").trim(),
      primaryBackground: primary.backgroundImage,
      activeTabBackground: activeTab.backgroundImage,
    };
  });
  expect(palette).toMatchObject({
    mint: "#43dba4",
    teal: "#35c5ad",
    blue: "#269fbf",
    ice: "#d7ffeb",
  });
  expect(palette.primaryBackground).toContain("linear-gradient");
  expect(palette.activeTabBackground).toContain("linear-gradient");
});

test("local masks support click selection and brush corrections", async ({ page }) => {
  const errors = await collectErrors(page);
  await openReady(page);
  if (!(await page.locator(".comparison-edited").count())) {
    await page.locator("#librelux-photo-import").setInputFiles(fixture);
    await expect(page.locator(".comparison-edited")).toBeVisible();
  }
  await expect(
    page.getByRole("button", {
      name: /Smart Masks (loading|ready)|Retry Smart Masks/,
    }),
  ).toBeVisible();
  const magicPoint = page.getByRole("button", { name: "Magic point", exact: true });
  await magicPoint.scrollIntoViewIfNeeded();
  await magicPoint.click();
  const canvas = page.getByRole("button", { name: "Photo selection canvas" });
  await page.locator(".comparison-edited").click({ position: { x: 48, y: 48 } });
  await expect(page.locator(".mask-list").getByText("Magic selection")).toBeVisible();
  const add = page.getByRole("button", { name: "Brush add", exact: true });
  await add.click();
  await expect(add).toHaveClass(/active/);
  await canvas.click({ position: { x: 42, y: 42 }, force: true });
  const subtract = page.getByRole("button", {
    name: "Brush subtract",
    exact: true,
  });
  await subtract.click();
  await expect(subtract).toHaveClass(/active/);
  await canvas.click({ position: { x: 60, y: 60 }, force: true });
  await page.getByRole("button", { name: "Finish selection" }).click();
  await expect(subtract).not.toHaveClass(/active/);
  expect(errors).toEqual([]);
});

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

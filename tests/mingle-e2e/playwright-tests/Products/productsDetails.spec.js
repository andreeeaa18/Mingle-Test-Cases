/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.beforeEach("Go to Dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("Verify 3D model color changes in fullscreen mode", async ({ page }) => {
  await page
    .locator("div:nth-child(2) > .model-view > model-viewer > .fullscreen-btn")
    .click();

  await page
    .locator(
      "div:nth-child(2) > .model-view > model-viewer > .controls > .css-b62m3t-container > .css-6wdqt6-control > .css-1wy0on6 > .css-187o9ak-indicatorContainer > .css-tj5bde-Svg",
    )
    .click();
  await page.getByRole("option", { name: /black/i }).click();
  await page.waitForTimeout(1500);

  const model = page.locator("model-viewer").first();
  const blackScreenshot = await model.screenshot();

  await page
    .locator("model-viewer")
    .filter({ hasText: "⛶full screen?helpioption" })
    .locator("svg")
    .first()
    .click();

  await page.getByRole("option", { name: /dark-medo/i }).click();
  await page.waitForTimeout(1500);

  const darkMedoScreenshot = await model.screenshot();

  expect(blackScreenshot.equals(darkMedoScreenshot)).toBeFalsy();
});

test("Rotate 3D model 360° horizontally and vertically in fullscreen", async ({
  page,
}) => {
  await page
    .locator("div:nth-child(2) > .model-view > model-viewer > .fullscreen-btn")
    .click();
  console.log("Entered fullscreen mode.");

  const model = page.locator("model-viewer").first();
  await expect(model).toBeVisible({ timeout: 10000 });

  const box = await model.boundingBox();
  if (!box) throw new Error("Could not locate model-viewer area.");

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  console.log("Rotating horizontally...");
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  const horizontalSteps = 200;
  const horizontalDistance = box.width * 2;
  for (let i = 0; i <= horizontalSteps; i++) {
    const progress = i / horizontalSteps;
    const x = startX + horizontalDistance * Math.sin(progress * Math.PI * 2);
    await page.mouse.move(x, startY, { steps: 1 });
    await page.waitForTimeout(15);
  }

  await page.mouse.up();
  console.log("Completed horizontal rotation.");
  await page.waitForTimeout(1000);

  console.log("Rotating vertically...");
  await page.mouse.move(startX, startY);
  await page.mouse.down();

  const verticalSteps = 160;
  const verticalDistance = box.height * 0.7;
  for (let i = 0; i <= verticalSteps; i++) {
    const progress = i / verticalSteps;
    const y = startY + verticalDistance * Math.sin(progress * Math.PI * 2);
    await page.mouse.move(startX, y, { steps: 1 });
    await page.waitForTimeout(15);
  }

  await page.mouse.up();
  console.log("Completed vertical rotation.");

  const finalScreenshot = await model.screenshot();
  await page.waitForTimeout(1000);
  expect(finalScreenshot).toBeTruthy();

  console.log("Captured final model view after rotations.");
});

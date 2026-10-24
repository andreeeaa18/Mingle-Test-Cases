/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test.beforeEach("Go to Dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("Browse and Select a Product", async ({ page }) => {
  await page.waitForLoadState("networkidle");

  const listView = page.locator(".list-view");
  await expect(listView).toBeVisible({ timeout: 10000 });

  await page.locator("section.list-view").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  await page
    .locator("div:nth-child(4) > .model-view > model-viewer > .annotate-btn")
    .click();
  await expect(
    page.getByRole("button", { name: "back-support" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "armrest" })).toBeVisible();

  await page
    .locator("div:nth-child(2) > .model-view > model-viewer > .help-btn")
    .click();
  await expect(page.getByText("NAVIGATION HELP Move camera")).toBeVisible();

  await page.getByRole("link", { name: "ChairNew" }).click();
  await expect(page.getByText("A blue chair with a modern")).toBeVisible();
});

test("Search products and filter: Price low to high", async ({ page }) => {
  await page
    .getByRole("textbox", { name: "Search..." })
    .pressSequentially("table", { delay: 120 });

  await page.waitForTimeout(1500);

  const products = page.locator("section.list-view a.pname");
  const scrollStep = 200;
  const maxScrolls = 20;

  for (let i = 0; i < maxScrolls; i++) {
    const count = await products.count();
    if (count >= 2) break;

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(600);
  }

  await expect(products.first()).toBeVisible({ timeout: 20000 });
  const visibleProducts = await products.allTextContents();
  console.log(`Visible products: ${visibleProducts}`);

  await page
    .locator(
      "div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6 > .css-t5yjle-indicatorContainer",
    )
    .click();
  await page.getByRole("option", { name: "Price: Low to High" }).click();
  await page.waitForTimeout(1000);

  await page.waitForTimeout(1200);

  const priceItems = page.locator(".priceCurrency");

  for (let i = 0; i < maxScrolls; i++) {
    const count = await priceItems.count();

    if (count >= 2) break;

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(700);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);

  await expect(priceItems.first()).toBeVisible({ timeout: 20000 });
});

test("Test product's color change", async ({ page }) => {
  const model = page.locator("model-viewer").nth(0);

  const colorDropdown = await page
    .locator(".css-187o9ak-indicatorContainer")
    .first();

  await expect(model).toBeVisible({ timeout: 10000 });
  const initialColor = await model.getAttribute("data-color");
  console.log("Initial color:", initialColor);

  await colorDropdown.click();
  await page.getByRole("option", { name: "Mango Velvet" }).click();
  await page.waitForTimeout(1500); // wait for render
  const mangoScreenshot = await model.screenshot();

  await page.locator(".css-lj5nuc-indicatorContainer").click();
  await page.getByRole("option", { name: "Peacock Velvet" }).click();
  await page.waitForTimeout(1500);
  const peacockScreenshot = await model.screenshot();

  expect(mangoScreenshot.equals(peacockScreenshot)).toBeFalsy();
});

test("Model rotates horizontally and vertically on mouse drag", async ({
  page,
}) => {
  const model = page.locator("model-viewer").first();
  await expect(model).toBeVisible({ timeout: 10000 });

  const before = await model.screenshot();

  const box = await model.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  const horizontalEndX = startX + box.width / 3;
  const verticalEndY = startY + box.height / 3;
  await page.mouse.down();
  await page.mouse.move(startX, startY);

  await page.mouse.move(horizontalEndX, startY, { steps: 60 });
  // await page.mouse.up();

  await page.waitForTimeout(1000);
  // await page.mouse.down();
  await page.mouse.move(startX, startY);

  await page.mouse.move(startX, verticalEndY, { steps: 60 });
  await page.mouse.up();

  await page.waitForTimeout(1000);

  const after = await model.screenshot();

  expect(before.equals(after)).toBeFalsy();
  console.log("Model visually changed after drags (rotation verified).");
});

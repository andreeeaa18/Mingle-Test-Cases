/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

async function loadAllProducts(page, locator, scrollStep = 600, wait = 700) {
  let previousCount = 0;
  let currentCount = await locator.count();

  while (currentCount > previousCount) {
    previousCount = currentCount;
    await page.mouse.wheel(0, scrollStep);
    await page.waitForTimeout(wait);
    currentCount = await locator.count();
  }

  return currentCount;
}

test.beforeEach("Go to Dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("Filter products - Price low to high", async ({ page }) => {
  const scrollStep = 150;
  const maxScrolls = 30;

  await page.waitForTimeout(1500);
  const lastEL = page.getByRole("link", { name: /Wooden Display She/i });

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastEL.isVisible();

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(1000);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const priceElements = page.locator(
    ".product-detailsBox .priceCurrency:not(:has(.priceCurrency))",
  );

  await expect(priceElements.first()).toBeVisible({ timeout: 20000 });
  const pricesTextBefore = await priceElements.allInnerTexts();

  const pricesBefore = pricesTextBefore
    .map((text) => parseFloat(text.replace(/[^\d.]/g, "")))
    .filter(Boolean);

  console.log("Prices before sorting):", pricesBefore);
  await page
    .locator("div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6")
    .click();
  await page.getByRole("option", { name: "Price: Low to High" }).click();

  await page.waitForTimeout(1500);

  for (let i = 0; i < maxScrolls; i++) {
    const count = await priceElements.count();

    if (count === 12) break;

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(1000);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  const pricesTextAfter = await priceElements.allInnerTexts();
  const pricesAfter = pricesTextAfter
    .map((text) => parseFloat(text.replace(/[^\d.]/g, "")))
    .filter(Boolean);

  console.log("Prices after sorting (Low -> High):", pricesAfter);

  const sortedPrices = [...pricesAfter].sort((a, b) => a - b);
  expect(pricesAfter).toEqual(sortedPrices);
});

test("Filter products - Price high to low", async ({ page }) => {
  const scrollStep = 150;
  const maxScrolls = 30;

  await page.waitForTimeout(1500);
  const lastEL = page.getByRole("link", { name: /Wooden Display She/i });

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastEL.isVisible();

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(1000);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  const priceElements = page.locator(
    ".product-detailsBox .priceCurrency:not(:has(.priceCurrency))",
  );

  await expect(priceElements.first()).toBeVisible({ timeout: 20000 });
  const pricesTextBefore = await priceElements.allInnerTexts();

  const pricesBefore = pricesTextBefore
    .map((text) => parseFloat(text.replace(/[^\d.]/g, "")))
    .filter(Boolean);

  console.log("Prices before sorting):", pricesBefore);
  await page
    .locator("div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6")
    .click();
  await page.getByRole("option", { name: "Price: High to Low" }).click();

  await page.waitForTimeout(1500);

  for (let i = 0; i < maxScrolls; i++) {
    const count = await priceElements.count();

    if (count === 12) break;

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(1000);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  const pricesTextAfter = await priceElements.allInnerTexts();
  const pricesAfter = pricesTextAfter
    .map((text) => parseFloat(text.replace(/[^\d.]/g, "")))
    .filter(Boolean);

  console.log("Prices after sorting (High -> Low):", pricesAfter);

  const sortedPrices = [...pricesAfter].sort((a, b) => b - a);
  expect(pricesAfter).toEqual(sortedPrices);
});

test("Filter products - A to Z", async ({ page }) => {
  const scrollStep = 150;
  const maxScrolls = 30;

  await page.waitForTimeout(1500);

  const lastProduct = page.getByRole("link", { name: /Wooden Display She/i });
  const products = page.locator("section.list-view a.pname");

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastProduct.isVisible().catch(() => false);

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(900);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  await expect(products.first()).toBeVisible({ timeout: 15000 });

  const productNamesBefore = (await products.allTextContents()).map((t) =>
    t.trim(),
  );

  console.log("Product names before sorting:", productNamesBefore);

  await page
    .locator("div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6")
    .click();
  await page.getByRole("option", { name: "A-Z" }).click();

  await page.waitForTimeout(2000);

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastProduct.isVisible().catch(() => false);

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(900);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  const productNamesAfter = (await products.allTextContents()).map((t) =>
    t.trim(),
  );

  console.log("Product names after A-Z sort:", productNamesAfter);

  const sortedNames = [...productNamesAfter].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  expect(productNamesAfter).toEqual(sortedNames);
});

test("Filter products - Z to A", async ({ page }) => {
  const scrollStep = 150;
  const maxScrolls = 30;

  await page.waitForTimeout(1500);

  const lastProduct = page.getByRole("link", { name: /Wooden Display She/i });
  const products = page.locator("section.list-view a.pname");

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastProduct.isVisible().catch(() => false);

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(900);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  await expect(products.first()).toBeVisible({ timeout: 15000 });

  const productNamesBefore = (await products.allTextContents()).map((t) =>
    t.trim(),
  );

  console.log("Product names before sorting:", productNamesBefore);

  await page
    .locator("div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6")
    .click();
  await page.getByRole("option", { name: "Z-A" }).click();

  await page.waitForTimeout(2000);

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await lastProduct.isVisible().catch(() => false);

    if (isVisible) {
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(900);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);

  const productNamesAfter = (await products.allTextContents()).map((t) =>
    t.trim(),
  );

  console.log("Product names after Z-A sort:", productNamesAfter);

  const sortedNames = [...productNamesAfter].sort((b, a) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  expect(productNamesAfter).toEqual(sortedNames);
});

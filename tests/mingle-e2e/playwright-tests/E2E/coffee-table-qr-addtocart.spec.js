import { mergeTests } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";
import { rotationTest } from "../../fixtures/rotation-full-screen.fixtures.js";

import { expect } from "@playwright/test";

export const fullTest = mergeTests(authTest, rotationTest);

const test = fullTest;

test("User Flow - View coffee table", async ({ page, rotateModel, login }) => {
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  const targetProduct = "White Round Coffee...";
  const product = page.getByRole("link", {
    name: targetProduct,
  });
  let productName;

  const scrollStep = 200;
  const maxScrolls = 20;

  await page.waitForTimeout(1500);

  let found = false;

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await product.isVisible().catch(() => false);
    if (isVisible) {
      productName = (await product.innerText()).trim();
      console.log(`Product "${product}" found after ${i + 1} scrolls`);
      await expect(product).toBeVisible({ timeout: 2000 });
      found = true;
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);

    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1800); //
  }

  if (!found) {
    throw new Error(
      `Product "${targetProduct}" was not found after ${maxScrolls} scrolls`,
    );
  }

  await rotateModel(
    page.locator(
      "div:nth-child(10) > .model-view > model-viewer > .fullscreen-btn",
    ),
  );

  await expect
    .poll(async () => page.evaluate(() => !!document.fullscreenElement))
    .toBe(true);

  await page.evaluate(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  });

  await expect
    .poll(async () => page.evaluate(() => !!document.fullscreenElement))
    .toBe(false);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(1000);

  const coffeeCard = page
    .locator(".lazyload-wrapper", {
      has: page.getByRole("link", { name: /White Round Coffee\.\.\./i }),
    })
    .first();

  for (let i = 0; i < 10; i++) {
    if (await coffeeCard.isVisible().catch(() => false)) break;
    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(250);
  }

  await expect(coffeeCard).toBeVisible();

  await coffeeCard.getByRole("button", { name: "Show QR" }).click();
  await expect(page.getByText(/QR Code for White Round/i)).toBeVisible();

  await page.getByRole("button").filter({ hasText: /^$/ }).click();

  const addIcon = coffeeCard.locator(".add-icon").first();
  await expect(addIcon).toBeVisible();
  await addIcon.click();
  await expect(page).toHaveURL("http://localhost:3000/sign-in");

  await login();
  await expect(page).toHaveURL(/localhost:3000/);

  const searchBox = page.getByRole("textbox", { name: "Search..." });
  await searchBox.fill("White Round Coffee Table");

  const productCard = page
    .locator(".lazyload-wrapper", {
      has: page.getByRole("link", { name: /White Round Coffee/i }),
    })
    .first();

  for (let i = 0; i < 10; i++) {
    if ((await productCard.count()) > 0) break;

    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(250);
  }

  await expect(productCard).toBeVisible();

  const wishlistToggle = productCard.locator(".add-icon").first();
  await expect(wishlistToggle).toBeVisible();

  if ((await wishlistToggle.innerText()).trim() === "-") {
    await wishlistToggle.click();
    await expect(
      page.getByText(/White Round Coffee Table removed from wishlist!/i),
    ).toBeVisible();
    await expect(wishlistToggle).toHaveText("+");
  }

  await wishlistToggle.click();
  await expect(
    page.getByText(/White Round Coffee Table added to wishlist!/i),
  ).toBeVisible();
  await expect(wishlistToggle).toHaveText("-");
});

const toggleFullscreen = async (element) => {
  try {
    if (!document.fullscreenElement) {
      await element.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn("Fullscreen unavailable in this environment", error);
  }
};

/* eslint-disable jest/no-conditional-expect, testing-library/prefer-screen-queries */
import { expect } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";

const test = authTest;

test.beforeEach(async ({ page, login }) => {
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");
  await login();
});

test("Adding and removing product from cart from dashboard logged", async ({
  page,
}) => {
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1000);

  const productName = await page
    .getByRole("link", { name: "ChairNew" })
    .innerText();
  const icon = await page.locator(".add-icon").nth(1);
  if ((await icon.innerText()) === "+") {
    await icon.click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(`${productName} added to wishlist!`),
    ).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("http://localhost:3000/wishlist");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1000);

    const productCard = page
      .locator(".product-detailsBox", { hasText: productName })
      .first();
    await expect(productCard).toBeVisible();

    const minusButton = page.getByRole("button", { name: "-" });
    const minusButtonCount = await minusButton.count();
    const lastMinusButton = minusButton.nth(minusButtonCount - 1);

    await lastMinusButton.click();

    await expect(
      page.getByText(`${productName} removed from wishlist!`),
    ).toBeVisible();
  } else {
    console.log("Product already added to cart");
  }
});

test("Adding and removing product from cart from product's page logged in", async ({
  page,
}) => {
  await page.mouse.wheel(0, 1300);
  await page.waitForTimeout(1000);

  const product = page.getByRole("link", { name: "Ceramic Vase" });
  const productName = await product.innerText();
  await product.click();

  const icon = await page.locator(".add-icon");
  await page.waitForLoadState("domcontentloaded");
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1000);
  if ((await icon.innerText()) === "+") {
    await icon.click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(`${productName} added to wishlist!`),
    ).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("http://localhost:3000/wishlist");
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle");
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1000);

    const productCard = page
      .locator(".product-detailsBox", { hasText: productName })
      .first();
    await expect(productCard).toBeVisible();

    const minusButton = page.getByRole("button", { name: "-" });
    const minusButtonCount = await minusButton.count();
    const lastMinusButton = minusButton.nth(minusButtonCount - 1);

    await lastMinusButton.click();

    await expect(
      page.getByText(`${productName} removed from wishlist!`),
    ).toBeVisible();
  } else {
    await icon.click();
    await expect(
      page.getByText(`${productName} removed from wishlist!`),
    ).toBeVisible();
  }
});

test("Cart number is counted correctly", async ({ page }) => {
  await page.mouse.wheel(0, 400);
  await page.waitForSelector(".add-icon", { timeout: 10000 });

  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
  }

  await page.mouse.wheel(0, -5000);
  await page.waitForTimeout(700);

  const addButtons = page.locator(".add-icon");
  const total = await addButtons.count();
  console.log(`Found ${total} add/remove buttons`);

  for (let i = 0; i < total; i++) {
    const button = addButtons.nth(i);
    const iconText = (await button.innerText()).trim();

    const productLink = button
      .locator("xpath=ancestor::div[contains(@class,'lazyload-wrapper')]")
      .getByRole("link");
    const productName = (await productLink.first().textContent())?.trim();
    console.log(
      `Button ${i + 1}: ${productName || "(unknown)"} | icon: "${iconText}"`,
    );
  }

  expect(total).toBeGreaterThan(0);

  const cartCountLocator = page.locator(".cart-count");
  // const addButtons = page.locator(".add-icon");
  // const total = await addButtons.count();
  console.log("Found", total, "add buttons");

  for (let i = 0; i < total; i++) {
    const button = addButtons.nth(i);

    const text = (await button.innerText()).trim();
    const initialCount = parseInt(await cartCountLocator.innerText(), 10);

    console.log(`Button ${i + 1}: ${text}, initial count = ${initialCount}`);

    if (text === "+") {
      await button.click();
      await page.waitForTimeout(700);
      const newCount = parseInt(await cartCountLocator.innerText(), 10);
      expect(newCount).toBe(initialCount + 1);
      console.log(`Cart increased from ${initialCount} to ${newCount}`);
    } else if (text === "-") {
      await button.click();
      await page.waitForTimeout(700);
      const newCount = parseInt(await cartCountLocator.innerText(), 10);
      expect(newCount).toBe(initialCount - 1);
      console.log(`Cart decreased from ${initialCount} to ${newCount}`);
    } else {
      console.log(`Skipped unknown button type: "${text}"`);
    }
  }

  const finalCount = parseInt(await cartCountLocator.innerText(), 10);
  if (finalCount === 0) {
    const minusCount = await page
      .locator(".add-icon", { hasText: "-" })
      .count();
    expect(minusCount).toBe(0);
    console.log("No minus buttons exist when cart count is 0");
  }
});

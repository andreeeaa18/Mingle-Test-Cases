/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test("Adding and removing product from cart from dashboard without account", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  const targetButton = page.locator(".product-details .add-icon").nth(6);

  const scrollStep = 400;
  const maxScrolls = 25;
  let found = false;

  for (let i = 0; i < maxScrolls; i++) {
    const isVisible = await targetButton.isVisible().catch(() => false);
    if (isVisible) {
      found = true;
      break;
    }

    await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
    await page.waitForTimeout(400);
  }

  if (!found) throw new Error("Target product not found after scrolling");

  await targetButton.scrollIntoViewIfNeeded();
  await expect(targetButton).toBeVisible({ timeout: 10000 });
  await targetButton.click();

  await expect(page).toHaveURL("http://localhost:3000/sign-in");
});

test("Adding and removing product from cart from product's page without account", async ({
  page,
}) => {
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  const product = data.data.find((p) =>
    p.name.toLowerCase().includes("modern wooden armc"),
  );
  if (!product)
    throw new Error(
      "Product 'Modern Wooden Armchair' not found in backend data.",
    );

  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  const targetLink = page.getByRole("link", {
    name: "Modern Wooden Armc...",
  });
  for (let i = 0; i < 10; i++) {
    if (await targetLink.isVisible()) break;

    await page.evaluate(() => window.scrollBy(0, 300));

    await page.waitForTimeout(300);
  }

  await targetLink.waitFor({ state: "visible", timeout: 10000 });
  await targetLink.scrollIntoViewIfNeeded();
  await targetLink.click();

  await expect(page).toHaveURL(new RegExp(`/products/${product._id}`));

  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);

  const addButton = page.getByRole("button", { name: "+" });
  await addButton.waitFor({ state: "visible", timeout: 10000 });
  await addButton.click();

  await expect(page).toHaveURL("http://localhost:3000/sign-in");
});

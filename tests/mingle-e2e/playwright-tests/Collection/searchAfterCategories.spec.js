/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test("Verify all categories display correct items", async ({ page }) => {
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  const data = await response.json();
  const products = data.data;
  console.log(products);

  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");

  const listView = page.locator(".list-view");
  await expect(listView).toBeVisible({ timeout: 10000 });

  const scrollStep = 150;
  const maxScrolls = 30;

  async function scrollUntilLastVisible(categoryProducts) {
    const lastName = categoryProducts.at(-1).name;
    const truncatedName =
      lastName.length > 18 ? lastName.slice(0, 18) : lastName;

    const lastEL = page.locator("section.list-view a.pname", {
      hasText: truncatedName,
    });

    for (let i = 0; i < maxScrolls; i++) {
      const isVisible = await lastEL.isVisible();
      if (isVisible) break;

      await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
      await page.waitForTimeout(1000);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
  }

  const allProducts = products.length > 0 ? products : [];
  await scrollUntilLastVisible(allProducts);

  const categories = [
    "All",
    "Furniture",
    "Environment",
    "Outdoor Furniture",
    "Home Decor",
    "Art",
  ];

  for (const category of categories) {
    console.log(`\nChecking category: ${category}`);

    await page.locator('[class*="indicatorContainer"]').first().click();
    await page.getByRole("option", { name: category }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(listView).toBeVisible({ timeout: 10000 });

    const expectedProducts =
      category === "All"
        ? products
        : products.filter((p) => p.category === category);

    console.log(
      `Expected ${expectedProducts.length} product(s) from API:`,
      expectedProducts.map((p) => p.name),
    );

    await scrollUntilLastVisible(expectedProducts);

    const productElements = page.locator("section.list-view a.pname");
    await expect(productElements.first()).toBeVisible({ timeout: 10000 });
    const visibleRaw = await productElements.allTextContents();

    const visibleNames = visibleRaw.map((n) => n.trim().replace(/\.{2,}$/, ""));
    console.log("Visible items in UI:", visibleNames);

    expect(
      visibleNames.length,
      `Category "${category}": expected ${expectedProducts.length} item(s) in UI but found ${visibleNames.length}`,
    ).toBe(expectedProducts.length);

    for (const uiName of visibleNames) {
      const found = expectedProducts.some((p) =>
        p.name.toLowerCase().startsWith(uiName.toLowerCase()),
      );
      expect(
        found,
        `Category "${category}": UI item "${uiName}" does not belong to this category`,
      ).toBe(true);
    }

    console.log(
      `Category "${category}" — UI shows exactly ${visibleNames.length} correct product(s).`,
    );
  }
});

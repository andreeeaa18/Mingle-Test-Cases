import { test as base, expect } from "@playwright/test";

export const sortByPriceTest = base.extend({
  verifyPriceSorting: async ({ page }, use) => {
    const verifyPriceSortingFn = async () => {
      await page.waitForLoadState("domcontentloaded");

      const sortDropdown = page.locator(
        "div:nth-child(3) > .css-n0l2we-control > .css-1wy0on6",
      );
      await expect(sortDropdown).toBeVisible({ timeout: 15000 });

      await sortDropdown.click();
      await page.getByRole("option", { name: "Price: Low to High" }).click();

      const scrollStep = 200;
      const maxScrolls = 20;

      const product = page.locator("section.list-view a.pname").first();
      let found = false;

      await page.waitForTimeout(1500);

      for (let i = 0; i < maxScrolls; i++) {
        const isVisible = await product.isVisible().catch(() => false);
        if (isVisible) {
          await expect(product).toBeVisible({ timeout: 3000 });
          found = true;
          break;
        }

        await page.evaluate((y) => window.scrollBy(0, y), scrollStep);
        await page.waitForTimeout(800);
      }

      if (!found) {
        throw new Error(`No products visible after ${maxScrolls} scrolls`);
      }

      const priceElements = page.locator("section.list-view .priceCurrency");
      await expect(priceElements.first()).toBeVisible({ timeout: 10000 });

      const pricesText = await priceElements.allTextContents();
      const prices = pricesText
        .map((text) => {
          const match = text.match(/(\d+\.?\d*)\$/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter((n) => n !== null);

      console.log("Extracted prices:", prices);

      if (prices.length < 2) {
        return;
      }

      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
      console.log("Prices sorted correctly (low -> high).");
    };

    await use(verifyPriceSortingFn);
  },
});

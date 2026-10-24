import { test, expect } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test("Homepage loads and matches Percy snapshot", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  // Wait for main title
  await expect(page.locator("text=MINGLE®")).toBeVisible();

  // ✅ Wait for list-view content to appear
  await expect(page.locator(".list-view")).toBeVisible({ timeout: 10000 });

  // Percy visual snapshot
  await percySnapshot(page, "Homepage");
});

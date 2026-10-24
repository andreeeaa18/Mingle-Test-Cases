/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

test("Chat window opens/closes correctly", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page.locator(".closeBtn")).toBeVisible();
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: /^MinglerAI$/ })
    .getByRole("button")
    .click();

  await expect(page.locator(".chatBox")).not.toBeVisible();
});

test("Chat visibility persists across navigation", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  await page
    .locator("div")
    .filter({ hasText: /^MinglerAI$/ })
    .getByRole("button")
    .click();

  await expect(page.locator(".chatBox")).not.toBeVisible();

  await expect(page.locator(".navigationLinks")).toHaveCount(5, {
    timeout: 5000,
  });

  const elements = await page.$$(".navigationLinks");
  console.log(`Found ${elements.length} nav links`);

  for (const element of elements) {
    const href = await element.getAttribute("href");

    await element.scrollIntoViewIfNeeded();
    await element.click();
    await page.waitForLoadState("domcontentloaded");

    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1000);

    await page.locator(".closeBtn").click();
    await page.waitForTimeout(1000);
    await expect(page.locator(".chatBox")).toBeVisible();
    await page
      .locator("div")
      .filter({ hasText: /^MinglerAI$/ })
      .getByRole("button")
      .click();

    await expect(page.locator(".chatBox")).not.toBeVisible();
  }
});

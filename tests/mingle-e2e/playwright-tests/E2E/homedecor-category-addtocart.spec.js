/* eslint-disable testing-library/prefer-screen-queries */
import { expect } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";

const test = authTest;

test("User Flow - Searches for home decor", async ({ page, login }) => {
  await page.goto("http://localhost:3000/");
  await login();

  await page.locator(".css-t5yjle-indicatorContainer").first().click();
  await page.getByRole("option", { name: "Home Decor" }).click();

  const product = page.getByRole("link", { name: "Ceramic Vase" });
  await expect(product).toBeVisible();
  await product.click();

  await expect(
    page.locator(".productItem-title", { hasText: /^Ceramic Vase$/ }),
  ).toBeVisible();

  await expect(
    page.locator(".itemDescription", {
      hasText: /A beautiful ceramic vase for indoor decorations/i,
    }),
  ).toBeVisible();

  await page.mouse.wheel(0, 200);
  const addBtn = page.getByRole("button", { name: "+" });
  const removeBtn = page.getByRole("button", { name: "-" });

  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 250));

    if (
      (await addBtn.isVisible().catch(() => false)) ||
      (await removeBtn.isVisible().catch(() => false))
    ) {
      break;
    }
  }

  await expect(addBtn.or(removeBtn)).toBeVisible();

  if (await removeBtn.isVisible()) {
    await removeBtn.click();
    await expect(
      page.getByText(/Ceramic Vase removed from wishlist!/i),
    ).toBeVisible();
  }

  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await expect(
    page.getByText(/Ceramic Vase added to wishlist!/i),
  ).toBeVisible();
});

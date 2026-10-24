/* eslint-disable testing-library/prefer-screen-queries */
import { mergeTests, expect } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";
import { sortByPriceTest } from "../../fixtures/filter.fixtures.js";

export const fullTest = mergeTests(authTest, sortByPriceTest);
const test = fullTest;

test("User Flow - Verify price sorting", async ({
  page,
  login,
  verifyPriceSorting,
}) => {
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  const searchForChairs = async (afterLogin = false) => {
    const searchBox = page.getByRole("textbox", { name: "Search..." });
    await searchBox.click();
    await searchBox.pressSequentially("chair", { delay: 200 });

    await verifyPriceSorting();

    await page.waitForTimeout(1000);

    const addBtn = page.getByRole("button", { name: "+" }).first();
    const deleteBtn = page.getByRole("button", { name: "-" }).first();

    for (let i = 0; i < 8; i++) {
      if (await addBtn.isVisible().catch(() => false)) break;
      if (await deleteBtn.isVisible().catch(() => false)) break;

      await page.evaluate(() => window.scrollBy(0, 250));
      await page.waitForTimeout(250);
    }

    let actionPerformed = null;

    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      actionPerformed = "removed";
      await page.waitForTimeout(1000);
      await expect(
        page.getByText(`Beige Deck Chair removed from wishlist!`),
      ).toBeVisible();
    } else {
      await addBtn.click();
      actionPerformed = "added";
      await page.waitForTimeout(1000);
    }

    const accountButton = page.locator('a:has-text("Login")');
    const isLoginVisible = await accountButton.isVisible().catch(() => false);

    if (isLoginVisible && !afterLogin) {
      await expect(page).toHaveURL("http://localhost:3000/sign-in");
    } else if (actionPerformed === "added") {
      await expect(
        page.getByText(`Beige Deck Chair added to wishlist!`),
      ).toBeVisible();
    }
  };

  await searchForChairs();

  await login();

  await searchForChairs(true);
});

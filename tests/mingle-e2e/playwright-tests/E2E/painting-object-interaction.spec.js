// src/tests/fixtures/combined.fixtures.js
import { mergeTests } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";
import { rotationTest } from "../../fixtures/rotation.fixtures.js";

/* eslint-disable testing-library/prefer-screen-queries */
import { expect } from "@playwright/test";

export const fullTest = mergeTests(authTest, rotationTest);

const test = fullTest;

test("User Flow - Searching for painting and verifying 3D rotation", async ({
  page,
  rotateModel,
  login,
}) => {
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  expect(response.ok()).toBeTruthy();

  const data = await response.json();
  const product = data.data.find((p) =>
    p.name.toLowerCase().includes("painting"),
  );
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  const searchBox = page.getByRole("textbox", { name: "Search..." });
  await searchBox.click();
  await searchBox.pressSequentially("painting", { delay: 200 });

  await page.mouse.wheel(0, 200);
  await expect(page.getByRole("link", { name: "Painting" })).toBeVisible();
  await rotateModel();

  await page.locator(".css-187o9ak-indicatorContainer").click();
  await page.waitForTimeout(1000);
  await page.locator(".css-lj5nuc-indicatorContainer").click();

  await page.getByRole("button", { name: "i" }).click();

  await page.evaluate(() => {
    const viewer = document.querySelector("model-viewer");
    if (viewer) viewer.autoRotate = false;
  });

  const frameLabel = page.locator("model-viewer").locator("text=frame");
  await expect(frameLabel).toBeVisible({ timeout: 4000 });
  await frameLabel.click({ force: true });

  await page.getByRole("link", { name: "Painting" }).click();
  await expect(page).toHaveURL(new RegExp(`/products/${product._id}`));
  await page.waitForLoadState("domcontentloaded");

  await page.mouse.wheel(0, 200);
  await page.getByRole("button", { name: "+" }).click();

  await expect(page).toHaveURL("http://localhost:3000/sign-in");
  await login();

  await page.waitForLoadState("domcontentloaded");

  await searchBox.click();
  await searchBox.pressSequentially("painting");

  await page.mouse.wheel(0, 200);
  await expect(page.getByRole("link", { name: "Painting" })).toBeVisible();
  const addBtn = page.getByRole("button", { name: "+" });
  const deleteBtn = page.getByRole("button", { name: "-" });

  if (await addBtn.isVisible()) {
    await addBtn.click();
    await expect(
      page.getByText(`${product.name} added to wishlist!`, { exact: false }),
    ).toBeVisible({ timeout: 7000 });
  } else if (await deleteBtn.isVisible()) {
    await deleteBtn.click();
    await expect(
      page.getByText(`${product.name} removed from wishlist!`, {
        exact: false,
      }),
    ).toBeVisible({ timeout: 7000 });
  } else {
    throw new Error("Neither add nor remove button was visible.");
  }

  await page.getByRole("link", { name: "Cart" }).click();
});

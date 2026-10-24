/* eslint-disable testing-library/prefer-screen-queries */
import { expect } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";

const test = authTest;

test("User Flow - Chatting with the bot", async ({ page, login }) => {
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const products = data.data;

  const officeChair = products.find((p) =>
    p.name.toLowerCase().includes("office chair"),
  );
  const armchair = products.find((p) =>
    p.name.toLowerCase().includes("armchair"),
  );

  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  await page.getByRole("list").getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL("http://localhost:3000/about");

  await login();

  await page.locator(".closeBtn").click();
  const chatBox = page.locator(".chatBox");
  await expect(chatBox).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });
  await input.pressSequentially("what is on discount", { delay: 150 });
  await input.press("Enter");

  const loading = page.locator("div", { hasText: /^Loading...$/ });
  await expect(loading).toBeVisible({ timeout: 5000 });
  await expect(loading).toBeHidden({ timeout: 15000 });

  const firstProductLink = page.getByRole("link", { name: /• Office Chair/i });
  await expect(firstProductLink).toBeVisible({ timeout: 10000 });
  await firstProductLink.click();

  await expect(page).toHaveURL(new RegExp(`/products/${officeChair._id}`));

  await page.mouse.wheel(0, 400);
  await page.locator(".closeBtn").click();
  await page
    .locator(".chatContent")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(400);

  const secondProductLink = page.getByRole("link", {
    name: /• Modern Wooden Armchair/i,
  });
  await expect(secondProductLink).toBeVisible();
  await secondProductLink.click();

  await expect(page).toHaveURL(new RegExp(`/products/${armchair._id}`));

  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 400);
  const productToBeBought = page.getByRole("link", {
    name: /Modern Wooden Armc.../i,
  });
  const productName = await productToBeBought.innerText();
  console.log(productName);

  const addBtn = page.getByRole("button", { name: "+" });
  const deleteBtn = page.getByRole("button", { name: "-" });

  for (let i = 0; i < 8; i++) {
    if (await addBtn.isVisible().catch(() => false)) break;
    if (await deleteBtn.isVisible().catch(() => false)) break;

    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(250);
  }

  await expect(addBtn.or(deleteBtn)).toBeVisible();

  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();

    await expect(
      page.getByText(
        new RegExp(`Modern Wooden Armchair removed from wishlist!`, "i"),
      ),
    ).toBeVisible({ timeout: 8000 });
  }

  await expect(addBtn).toBeVisible();
  await addBtn.click();

  await expect(
    page.getByText(
      new RegExp(`Modern Wooden Armchair added to wishlist!`, "i"),
    ),
  ).toBeVisible({ timeout: 8000 });

  await page.waitForTimeout(1000);
});

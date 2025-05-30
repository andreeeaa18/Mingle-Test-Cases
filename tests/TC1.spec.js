import { test, expect } from "@playwright/test";

test("Log in", async ({ page }) => {
  await page.goto("https://frontend-mingle.vercel.app");

  await page.locator('a:has-text("Login")').click();
  await page.locator('[name="email"]').fill("andreevandreea.18@gmail.com");
  await page.locator('[name="password"]').fill("1234554321");

  await page.locator('button:has-text("Login")').click();

  await page
    .locator("text=Signed in successfully! ")
    .waitFor({ state: "visible" });
});

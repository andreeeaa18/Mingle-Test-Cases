import { test, expect } from "@playwright/test";

test("Sign up", async ({ page }) => {
  await page.goto("https://frontend-mingle.vercel.app");

  await page.locator('a:has-text("Login")').click();
  await page.locator('a:has-text("Sign up")').click();

  await page.locator('[name="name"]').fill("Andreea");
  await page.locator('[name="email"]').fill("andreevandreea.18@gmail.com");
  await page.locator('[name="password"]').fill("1234554321");
  await page.locator('[name="confirm_password"]').fill("1234554321");
  await page.locator('button:has-text("Sing up")').click();

  // await page
  //   .locator("text=Signed in successfully! ")
  //   .waitFor({ state: "visible" });
});

// await page.locator('a:has-text("SUPPORT")').click();
// await page.locator('[name="name"]').fill("Andr325243");
// await page.locator('[name="email"]').fill("andreevandreea.18@gmail.com");
// await page.locator('[name="subject"]').fill("!!!!%%%%%");
// await page.locator('[name="message"]').fill("E functional totul?");
// await page.locator('a:has-text("SEND MESSAGE")').click();

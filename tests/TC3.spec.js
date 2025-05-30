import { test } from "@playwright/test";
import { login } from "../utils";
test("Log out", async ({ page }) => {
  await page.goto("https://frontend-mingle.vercel.app");
  await login(page);

  await page.locator('[class="navigationLinks"]').nth(4).click();
  await page.locator('[class="navigationLinks"]').nth(6).click();

  await page.locator('button:has-text("CONFIRM")').click();

  await page
    .locator("text=Logged out successfully! ")
    .waitFor({ state: "visible" });
});

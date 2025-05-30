// import { test } from "@playwright/test";
// import { login } from "/Users/andreevandreea/Desktop/QA/ScenariiMingle/utils.js";
// test("Log out", async ({ page }) => {
//   await page.goto("https://frontend-mingle.vercel.app");
//   await login(page);

//   await page.locator('input:has-text("Search")').click().fill("vase");

//   await page.locator('[class="css-n0l2we-control"]').nth(0).click();
//   await page.locator('[class="css-hlgwow"]').nth(0).click();
//   await page.locator('[class="css-hlgwow"]').nth(1).click();
//   await page.locator('[class="css-hlgwow"]').nth(2).click();
//   await page.locator('[class="css-hlgwow"]').nth(3).click();

//   await page.locator('[class="css-n0l2we-control"]').nth(1).click();
//   await page.locator('button:has-text("CONFIRM")').click();

//   await page
//     .locator("text=Logged out successfully! ")
//     .waitFor({ state: "visible" });
// });

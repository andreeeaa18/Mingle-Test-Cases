// src/tests/fixtures/auth.fixtures.js
import { test as base, expect } from "@playwright/test";
import loggedInUsers from "../test-data/loggedInUsers.js";

export const authTest = base.extend({
  login: async ({ page }, use) => {
    const user =
      loggedInUsers[Math.floor(Math.random() * loggedInUsers.length)];

    const loginFn = async () => {
      // await page.goto("http://localhost:3000/");
      await page.locator('a:has-text("Login")').click();

      await page.locator('[name="email"]').fill(user.email);
      await page.locator('[name="password"]').fill(user.password);
      await page.locator('button:has-text("Login")').click();

      await expect(page.getByText("Signed in successfully!")).toBeVisible();
      await expect(page.getByText(user.name, { exact: false })).toBeVisible();

      await page.waitForLoadState("networkidle");

      console.log(`Logged in as ${user.email}`);
    };

    await use(loginFn);
  },
});

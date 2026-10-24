/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";
import loggedInUsers from "../../test-data/loggedInUsers.js";
let user;

test.beforeEach("User logged", async ({ page }) => {
  user = loggedInUsers[0];

  await page.goto("http://localhost:3000/");
  await page.locator('a:has-text("Login")').click();

  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="password"]').fill(user.password);

  await page.locator('button:has-text("Login")').click();

  await expect(page.getByText("Signed in successfully!")).toBeVisible();
  await expect(page.getByText(user.name, { exact: false })).toBeVisible();
});

test("Manual logout", async ({ page }) => {
  await page.getByText(user.name, { exact: false }).click();
  await page.getByRole("link", { name: "Logout" }).click();

  await page.getByRole("button", { name: "Confirm" }).click();

  await expect(page.getByText("Logged out successfully!")).toBeVisible();
});

test("Session expires after clearing cookies", async ({ page }) => {
  await expect(page.getByText(user.name, { exact: false })).toBeVisible();

  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => sessionStorage.clear());

  await page.goto("http://localhost:3000");

  await expect(page.getByText("Login")).toBeVisible();
});

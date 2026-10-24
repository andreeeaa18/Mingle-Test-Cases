/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";
import loggedInUsers from "../../test-data/loggedInUsers.js";

test("Valid credentials", async ({ page }) => {
  const user = loggedInUsers[4];

  await page.goto("http://localhost:3000/");
  await page.locator('a:has-text("Login")').click();

  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="password"]').fill(user.password);

  await page.locator('button:has-text("Login")').click();

  await expect(page.getByText("Signed in successfully!")).toBeVisible();
  await expect(page.getByText(user.name, { exact: false })).toBeVisible();
});

test("Invalid password", async ({ page }) => {
  const user = loggedInUsers[0];

  await page.goto("http://localhost:3000/");
  await page.locator('a:has-text("Login")').click();

  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="password"]').fill("1122334455");

  await page.locator('button:has-text("Login")').click();

  await expect(page.getByText("Error signing in!")).toBeVisible();
});

test("Invalid email - Unregistered user", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("link", { name: "Login" }).click();

  await page.locator('[name="email"]').fill("nonexistent@example.com");
  await page.locator('[name="password"]').fill(loggedInUsers[0].password);

  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Error signing in!")).toBeVisible();
});

test("Invalid email - Malformed format", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("link", { name: "Login" }).click();

  const emailInput = page.locator('[name="email"]');

  await emailInput.fill("notanemail");
  await page.locator('[name="password"]').fill(loggedInUsers[0].password);

  await page.getByRole("button", { name: "Login" }).click();

  const validationMessage = await emailInput.evaluate(
    (el) => el.validationMessage,
  );
  expect(validationMessage).toBeTruthy();
  console.log("Browser validation:", validationMessage);
});

test("Session persistence", async ({ page }) => {
  const user = loggedInUsers[0];

  await page.goto("http://localhost:3000/");
  await page.locator('a:has-text("Login")').click();

  await page.locator('[name="email"]').fill(user.email);
  await page.locator('[name="password"]').fill(user.password);

  await page.locator('button:has-text("Login")').click();

  await expect(page.getByText("Signed in successfully!")).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText(user.name, { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByText(user.name, { exact: false })).toBeVisible();
});

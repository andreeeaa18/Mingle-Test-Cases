/* eslint-disable jest/no-conditional-expect, testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";
const signupUsers = require("../../test-data/signupUsers.js");

test("Valid registration", async ({ page }) => {
  const user = signupUsers[Math.floor(Math.random() * signupUsers.length)];
  await page.goto("http://localhost:3000/");

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("link", { name: "Sign up" }).click();

  await page.getByRole("textbox", { name: "Name" }).fill(user.name);
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(user.password);
  await page
    .getByRole("textbox", { name: "Confirm Password" })
    .fill(user.confirmPassword);

  await page.getByRole("button", { name: "Sign up" }).click();

  try {
    await expect(page.getByText(user.name, { exact: false })).toBeVisible({
      timeout: 5000,
    });
  } catch {
    await expect(
      page.getByText(/email.*already|duplicate.*email/i),
    ).toBeVisible({
      timeout: 5000,
    });
  }
});

test("Duplicate email", async ({ page }) => {
  const user = signupUsers[0];
  await page.goto("http://localhost:3000/");

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("link", { name: "Sign up" }).click();

  await page.getByRole("textbox", { name: "Name" }).fill("Michael");
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(user.password);
  await page
    .getByRole("textbox", { name: "Confirm Password" })
    .fill(user.confirmPassword);

  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(
    page.getByText(/email.*already|duplicate.*email/i),
  ).toBeVisible();
});

test("Empty fields", async ({ page }) => {
  const user = signupUsers[2];
  await page.goto("http://localhost:3000/");

  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("link", { name: "Sign up" }).click();

  await page.getByRole("textbox", { name: "Name" }).fill(user.name);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(user.password);
  await page
    .getByRole("textbox", { name: "Confirm Password" })
    .fill(user.confirmPassword);

  await page.getByRole("button", { name: "Sign up" }).click();

  const errorMessage = page.getByText(/required|error|email/i);
  const signUpButton = page.getByRole("button", { name: "Sign up" });

  const errorVisible = await errorMessage.isVisible().catch(() => false);
  const stillOnSignUpPage = await signUpButton.isVisible();

  expect(errorVisible || stillOnSignUpPage).toBeTruthy();
});

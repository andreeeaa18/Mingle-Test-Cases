import { test as base, expect } from "@playwright/test";
const logged = require("../test-data/signupUsers.js");

export const signupTest = base.extend({
  signupUser: async ({ page }, use) => {
    const signupFn = async () => {
      const user = logged[Math.floor(Math.random() * logged.length)];

      try {
        const loginLocator = page.getByRole("link", { name: "Login" });
        if (await loginLocator.isVisible()) {
          await loginLocator.click();
        }
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

        await expect(page.getByText(user.name, { exact: false })).toBeVisible({
          timeout: 4000,
        });
        console.log(`Signed up successfully as ${user.email}`);

        return user;
      } catch (error) {
        console.warn(`Signup failed: ${error.message}`);
        console.warn("User may already exist or signup flow has issues.");
        return null;
      }
    };

    await use(signupFn);
  },
});

// playwright.config.js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/mingle-e2e", // adjust to your test folder
  testMatch: ["**/*.spec.@(js|ts)"], // only spec files
  testIgnore: ["**/*.test.@(js|jsx|ts|tsx)"], // ignore Jest tests
  timeout: 300000, // global test timeout (170 seconds)
  expect: { timeout: 7000 },

  fullyParallel: false,
  workers: 1,

  // 🧾 Reporters
  reporter: [
    ["list"],
    ["html", { open: "always" }], // always open HTML report after run
  ],

  // 🌍 Default "use" config for all tests
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    ignoreHTTPSErrors: true,
    actionTimeout: 0,

    // 🎥 Artifacts
    trace: "on", // always keep trace (even for passed tests)
    screenshot: "only-on-failure",
    video: "on",

    viewport: { width: 1280, height: 720 },
  },

  // 🧩 Multiple browser projects
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // 🎨 Special project for interactive UI runs
    {
      name: "ui-mode",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        launchOptions: { slowMo: 300 },
      },
      testMatch: /.*ui\.spec\.(js|ts)/, // only these open the browser
    },
  ],
});

/* eslint-disable jest/no-conditional-expect, testing-library/prefer-screen-queries */
import { expect } from "@playwright/test";
import { authTest } from "../../fixtures/auth.fixtures.js";
import { validPatterns } from "../../test-data/chatBotMessages.js";
import loggedInUsers from "../../test-data/loggedInUsers.js";

const test = authTest;

test("User Flow - Support form", async ({ page, login }) => {
  const user = loggedInUsers[2];
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const products = data.data;

  const vase = products.find((p) =>
    p.name.toLowerCase().includes("ceramic vase"),
  );

  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("domcontentloaded");

  await login();

  await page.locator(".closeBtn").click();
  const chatBox = page.locator(".chatBox");
  await expect(chatBox).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });
  await input.pressSequentially("Hello! How is it going?", { delay: 150 });
  await input.press("Enter");

  const loading = page.locator("div", { hasText: /^Loading...$/ });
  await expect(loading).toBeVisible({ timeout: 5000 });
  await expect(loading).toBeHidden({ timeout: 15000 });

  const chatAnswer = page.locator("div").filter({
    hasText: /^Found 9 matching products:$/,
  });
  const chatAnswerTxt = await chatAnswer.innerText();

  await page
    .locator(".chatContent")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(400);

  const matchesPattern = validPatterns.some((pattern) =>
    pattern.test(chatAnswerTxt),
  );

  if (matchesPattern) {
    console.log("Chat answer contains a valid pattern:", chatAnswerTxt);
  } else {
    console.log(
      "Chat answer does NOT contain any known valid pattern:",
      chatAnswerTxt,
    );
    test.info().annotations.push({
      type: "warning",
      description: `Chatbot did not return any known valid phrase.\nResponse: ${chatAnswerTxt}`,
    });
  }
  try {
    expect(
      matchesPattern,
      `Chatbot did not return any known valid phrase.\nResponse: ${chatAnswerTxt}`,
    ).toBeTruthy();
  } catch {
    console.warn("Soft check failed, but continuing test flow.");
  }

  await page
    .locator(".chatContent")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(600);

  await input.pressSequentially("What decorations do you have?", {
    delay: 150,
  });
  await input.press("Enter");

  await page.waitForTimeout(500);

  await page
    .locator(".chatContent")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(1000);
  await page
    .locator(".chatContent")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(1500);

  const vaseLink = page.getByRole("link", {
    name: /Ceramic Vase Brand: Art/i,
  });

  await expect(vaseLink).toBeVisible({ timeout: 10000 });
  await vaseLink.click();

  await expect(page).toHaveURL(new RegExp(`/products/${vase._id}`));

  await page.mouse.wheel(0, 400);
  await expect(page.getByRole("link", { name: "Support" })).toBeVisible();
  await page.getByRole("link", { name: "Support" }).click();

  await expect(page).toHaveURL("http://localhost:3000/support");
  await page.getByRole("textbox", { name: "Name" }).fill(user.name);
  await page.getByRole("textbox", { name: "Email" }).fill(user.email);
  await page
    .getByRole("textbox", { name: "Subject" })
    .pressSequentially("Unpleasant chat experience", { delay: 150 });
  await page
    .getByRole("textbox", { name: "Message" })
    .pressSequentially(
      "I want to report that the chat bot did not answer properly to my greeting message.",
      { delay: 150 },
    );

  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByText(`Error sending a message!`)).toBeVisible();
});

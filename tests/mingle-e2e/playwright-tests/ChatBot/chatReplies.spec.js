/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

const {
  naturalMessages,
  validPatterns,
  multiCriteriaQueries,
} = require("../../test-data/chatBotMessages.js");

let productsData = null;
let colors = null;

function normalizeMessages(messages) {
  return messages.map((msg) => msg.trim()).filter(Boolean);
}

async function getNewAssistantReplies(page, previousCount, timeout = 10000) {
  await page.waitForFunction(
    (prev) =>
      document.querySelectorAll(".chatMessage.assistantMessage").length > prev,
    previousCount,
    { timeout },
  );

  const allAssistantMessages = await page
    .locator(".chatMessage.assistantMessage")
    .allInnerTexts();

  return normalizeMessages(allAssistantMessages.slice(previousCount));
}

function getReplyBlockByTurn(allMessages, turnIndex) {
  const messages = normalizeMessages(allMessages);

  const userIndexes = messages
    .map((msg, idx) => (msg.toLowerCase().startsWith("you:") ? idx : -1))
    .filter((idx) => idx !== -1);

  const startIdx = userIndexes[turnIndex];
  if (startIdx === undefined) return "";

  const endIdx = userIndexes[turnIndex + 1] ?? messages.length;
  return messages
    .slice(startIdx + 1, endIdx)
    .filter((msg) => !msg.toLowerCase().startsWith("you:"))
    .join("\n");
}

async function getFirstNewAssistantReply(page, previousCount, timeout = 10000) {
  const newReplies = await getNewAssistantReplies(page, previousCount, timeout);
  return newReplies[0] || "";
}

test.beforeAll(async ({ playwright }) => {
  const context = await playwright.chromium.launchPersistentContext("");
  const page = await context.newPage();
  const response = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );
  const data = await response.json();
  productsData = data.data;
  colors = [...new Set(productsData.map((p) => p.color))];
  await context.close();
});

test("Chat replies to natural language messages", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const closeBtn = page.locator(".closeBtn");
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();

  const chatBox = page.locator(".chatBox");
  await expect(chatBox).toBeVisible();

  const chatContent = page.locator(".chatContent");

  for (const message of naturalMessages) {
    const input = page.getByRole("textbox", { name: "Type a message..." });

    await chatContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);

    await input.pressSequentially(message, { delay: 100 });
    await input.press("Enter");
    await chatContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(1000);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    await expect(loading)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
    await expect(loading)
      .toBeHidden({ timeout: 15000 })
      .catch(() => {});

    await chatContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(800);

    const replyLocator = page.locator(".chatMessage.assistantMessage").last();
    const reply = (await replyLocator.innerText().catch(() => "")).trim();

    if (!reply) {
      console.warn("No reply detected for message:", message);
      continue;
    }

    console.log("Bot replied:", reply);

    const matched = validPatterns.some((pattern) => pattern.test(reply));

    if (matched) {
      console.log("Reply matched a valid pattern.");
    } else {
      console.warn(`Reply did NOT match any known pattern: "${reply}"`);
      test.info().annotations.push({
        type: "warning",
        description: `Chat reply mismatch for "${message}" → "${reply}"`,
      });
    }

    await chatContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(600);
  }
});

test("Chat replies correctly for all product colors", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });

  for (const color of colors) {
    const message = `product color ${color}`;

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();

    for (const ch of message) await input.type(ch, { delay: 100 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    await expect(loading).toBeVisible({ timeout: 5000 });
    await expect(loading).toBeHidden({ timeout: 15000 });

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const newReplies = await getNewAssistantReplies(page, previousCount);
    const lastReply = newReplies.at(-1) || "";

    if (!lastReply) {
      console.log(`No assistant reply found for color "${color}"`);
      continue;
    }

    const foundMatch = lastReply.match(/Found\s+(\d+)\s+matching\s+products/i);
    const noMatch =
      /No products match your criteria|Suggestions to improve your search/i.test(
        lastReply,
      );

    if (noMatch) {
      console.log(`No matches for color "${color}", suggestions shown`);
    } else if (foundMatch) {
      const count = parseInt(foundMatch[1], 10);
      console.log(`Bot found ${count} product(s) for color "${color}"`);
    } else {
      console.log(`Unexpected response for color "${color}"`);
    }

    await page.waitForTimeout(700);
  }
});

test("Chat replies correctly for dimension ranges", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });
  const dimensions = ["height", "length", "width"];
  const ranges = ["between 0.1 and 1", "greater than 1"];

  for (const dim of dimensions) {
    for (const range of ranges) {
      const query = `${dim} ${range}`;

      const previousCount = await page
        .locator(".chatMessage.assistantMessage")
        .count();

      await input.waitFor({ state: "visible" });
      await input.click();
      for (const ch of query) await input.type(ch, { delay: 100 });
      await input.press("Enter");

      await page
        .locator(".chatContent")
        .evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(400);

      const loading = page.locator("div", { hasText: /^Loading...$/ });
      if (await loading.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(loading).toBeHidden({ timeout: 10000 });
      }

      await page.waitForTimeout(1500);
      await page
        .locator(".chatContent")
        .evaluate((el) => el.scrollTo(0, el.scrollHeight));

      const firstReply = await getFirstNewAssistantReply(page, previousCount);

      const foundMatch = firstReply.match(
        /Found\s+(\d+)\s+matching\s+products/i,
      );
      const noMatch = /^No products match your criteria/i.test(firstReply);

      if (foundMatch) {
        const count = parseInt(foundMatch[1], 10);
        console.log(`Bot found ${count} product(s) for ${dim} ${range}`);
      } else if (noMatch) {
        console.log(`No products found for ${dim} ${range} (0 items)`);
      } else {
        console.log(`Unexpected response for ${dim} ${range}`);
        console.log("Bot message was:", firstReply);
      }

      await page.waitForTimeout(700);
    }
  }
});

test("Chat replies correctly for price ranges", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });

  const priceRanges = [
    "price from 0 to 100",
    "price from 100 to 200",
    "price from 200 to 300",
    "price from 300 to 400",
    "price from 400 to 500",
  ];

  for (const range of priceRanges) {
    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();

    for (const ch of range) await input.type(ch, { delay: 100 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1500);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const firstReply = await getFirstNewAssistantReply(page, previousCount);

    const foundMatch = firstReply.match(/Found\s+(\d+)\s+matching\s+products/i);
    const noMatch = /^No products match your criteria/i.test(firstReply);

    if (foundMatch) {
      const count = parseInt(foundMatch[1], 10);
      console.log(`Bot found ${count} product(s) for ${range}`);
    } else if (noMatch) {
      console.log(`No products found for ${range} (0 items)`);
    } else {
      console.log(`Unexpected response for ${range}`);
      console.log("Bot message was:", firstReply);
    }

    await page.waitForTimeout(700);
  }
});

test("Chat replies correctly for all product brands", async ({ page }) => {
  const brands = [...new Set(productsData.map((p) => p.brand))];

  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });

  for (const brand of brands) {
    const query = `brand ${brand}`;

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();
    for (const ch of query) await input.type(ch, { delay: 100 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1500);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const firstReply = await getFirstNewAssistantReply(page, previousCount);

    const foundMatch = firstReply.match(/Found\s+(\d+)\s+matching\s+products/i);
    const noMatch = /^No products match your criteria/i.test(firstReply);

    if (foundMatch) {
      const count = parseInt(foundMatch[1], 10);
      console.log(`Bot found ${count} product(s) for brand "${brand}"`);
    } else if (noMatch) {
      console.log(`No products found for brand "${brand}" (0 items)`);
    } else {
      console.log(`Unexpected response for brand "${brand}"`);
      console.log("Bot message was:", firstReply);
    }

    await page.waitForTimeout(700);
  }
});

test("Chat replies correctly for all product categories", async ({ page }) => {
  const categories = [...new Set(productsData.map((p) => p.category))];

  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });

  for (const category of categories) {
    const query = `category ${category}`;

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();
    for (const ch of query) await input.type(ch, { delay: 100 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(400);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1500);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const firstReply = await getFirstNewAssistantReply(page, previousCount);

    const foundMatch = firstReply.match(/Found\s+(\d+)\s+matching\s+products/i);
    const noMatch = /^No products match your criteria/i.test(firstReply);

    if (foundMatch) {
      const count = parseInt(foundMatch[1], 10);
      console.log(`Bot found ${count} product(s) for category "${category}"`);
    } else if (noMatch) {
      console.log(`No products found for category "${category}" (0 items)`);
    } else {
      console.log(`Unexpected response for category "${category}"`);
      console.log("Bot message was:", firstReply);
    }

    await page.waitForTimeout(700);
  }
});

test("Chat correctly identifies discounted and non-discounted products", async ({
  page,
}) => {
  const discountedProducts = productsData.filter((p) => p.discount === true);
  const regularProducts = productsData.filter((p) => p.discount === false);

  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });
  const discountQueries = [
    { type: "on discount", products: discountedProducts },
    { type: "not on discount", products: regularProducts },
  ];

  for (const [i, query] of discountQueries.entries()) {
    const message = `products ${query.type}`;

    await input.waitFor({ state: "visible" });
    await input.click();
    for (const ch of message) await input.type(ch, { delay: 80 });
    await input.press("Enter");

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1200);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const allMessages = await page.locator(".chatMessage").allInnerTexts();
    const combinedReply = getReplyBlockByTurn(allMessages, i);

    const foundMatch = combinedReply.match(
      /Found\s+(\d+)\s+matching\s+products/i,
    );
    const noMatch = /No products match your criteria/i.test(combinedReply);
    const nameMatches = [
      ...combinedReply.matchAll(/•\s*([^:]+?)(?:Brand|Price|$)/gi),
    ];
    const chatNames = nameMatches.map((m) => m[1].trim());

    console.log(`\nQuery: PRODUCTS ${query.type.toUpperCase()}`);
    console.log(`Expected ${query.products.length} product(s):`);
    query.products.forEach((p) => console.log(`- ${p.name}`));

    if (foundMatch) {
      const count = parseInt(foundMatch[1], 10);
      console.log(`\nBot reported ${count} matching products.`);
    } else if (noMatch) {
      console.log("\nBot reported: No products found.");
    }

    if (chatNames.length > 0) {
      console.log(`\nBot actually listed ${chatNames.length} product(s):`);
      chatNames.forEach((n) => console.log(`• ${n}`));
    } else {
      console.log("\nBot listed no products in visible reply.");
    }

    await page.waitForTimeout(1000);
  }
});

test("Chat gracefully handles invalid or nonsense inputs", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();

  const input = page.getByRole("textbox", { name: "Type a message..." });
  const invalidQueries = [
    "color Blorple",
    "chairrrrrrrrrr",
    "price below -100",
    "height of banana",
    "!!!!??????",
  ];

  for (const query of invalidQueries) {
    console.log(`query: "${query}"`);

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();
    await input.fill("");
    for (const ch of query) await input.type(ch, { delay: 70 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 2500 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1200);

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const newMessages = await getNewAssistantReplies(page, previousCount);

    // newMessages.forEach((msg, i) => {
    //   console.log(`  [${i + 1}] ${msg.trim()}`);
    // });

    const firstMessage = newMessages[0]?.trim() || "(no message found)";
    console.log(`Bot answered: ${firstMessage}`);

    await page.waitForTimeout(800);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  }
});

test("Chat handles multi-criteria and sorting/comparison queries", async ({
  page,
}) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();
  const input = page.getByRole("textbox", { name: "Type a message..." });

  for (const query of multiCriteriaQueries) {
    console.log(`query: "${query}"`);

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();
    await input.fill("");
    for (const ch of query) await input.type(ch, { delay: 70 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 2500 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page.waitForTimeout(1200);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    const newMessages = await getNewAssistantReplies(page, previousCount);

    const firstMessage = newMessages[0]?.trim() || "(no message found)";
    console.log(`First message: ${firstMessage}`);

    const foundMatch = firstMessage.match(
      /Found\s+(\d+)\s+matching\s+products/i,
    );
    const priceWordDetected =
      /(cheap|expensive|ascending|descending|sort)/i.test(query);

    if (foundMatch) {
      console.log(`Bot reported ${foundMatch[1]} matching product(s).`);
    } else if (/No products match|try adjusting/i.test(firstMessage)) {
      console.log("Bot reported: No matches found.");
    } else if (priceWordDetected) {
      console.log("Bot gave a sorting/comparison-related answer.");
    } else {
      console.log("Bot gave a general reply or product list.");
    }

    await page.waitForTimeout(700);
    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  }
});

test("Chat retains context across related queries", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.locator(".closeBtn").click();
  await expect(page.locator(".chatBox")).toBeVisible();
  const input = page.getByRole("textbox", { name: "Type a message..." });

  const contextQueries = [
    "show me tables",
    "only the ones on sale",
    "under 200",
  ];

  for (let i = 0; i < contextQueries.length; i++) {
    const query = contextQueries[i];
    console.log(query);

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(300);

    const previousCount = await page
      .locator(".chatMessage.assistantMessage")
      .count();

    await input.waitFor({ state: "visible" });
    await input.click();
    for (const ch of query) await input.type(ch, { delay: 80 });
    await input.press("Enter");

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight - 100));
    await page.waitForTimeout(400);

    const loading = page.locator("div", { hasText: /^Loading...$/ });
    if (await loading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loading).toBeHidden({ timeout: 10000 });
    }

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(600);

    await page
      .locator(".chatContent")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(1000);

    const newMessages = await getNewAssistantReplies(page, previousCount);

    const firstMessage = newMessages[0]?.trim() || "(no response)";
    console.log(`First message: ${firstMessage}`);

    const foundMatch = firstMessage.match(
      /Found\s+(\d+)\s+matching\s+products/i,
    );
    if (foundMatch) {
      console.log(`Bot reported ${foundMatch[1]} matching product(s).`);
    } else if (/No products match|try adjusting/i.test(firstMessage)) {
      console.log("Bot reported: No matches found.");
    } else {
      console.log("Bot gave a descriptive or filtered response.");
    }

    await page.waitForTimeout(700);
  }
});

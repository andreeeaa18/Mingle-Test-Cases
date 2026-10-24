/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";
import jsQR from "jsqr";

test.beforeEach("Go to Dashboard", async ({ page }) => {
  await page.goto("http://localhost:3000/");
});

test("QR code redirects to product page with AR view available", async ({
  page,
}) => {
  const listView = page.locator("section.list-view");
  await expect(listView).toBeVisible({ timeout: 10000 });

  const listBox = await listView.boundingBox();
  if (listBox) {
    await page.mouse.move(listBox.x + listBox.width / 2, listBox.y + 100);
  }

  const scrollDuration = 5000;
  const scrollStep = 800;
  const scrollInterval = 200;
  const start = Date.now();
  let qrVisible = false;

  while (Date.now() - start < scrollDuration && !qrVisible) {
    await page.mouse.wheel(0, scrollStep);
    await page.waitForTimeout(scrollInterval);

    qrVisible = await page
      .getByRole("button", { name: "Show QR" })
      .nth(2)
      .isVisible();
  }

  await page.getByRole("button", { name: "Show QR" }).nth(2).click();
  await expect(
    page.getByRole("button", { name: "Show QR" }).nth(2),
  ).toBeVisible();

  const qrName = await page
    .getByRole("link", { name: "Beige Deck Chair" })
    .innerText();
  await expect(page.getByRole("heading").nth(1)).toHaveText(
    new RegExp(`QR Code for ${qrName}`, "i"),
  );

  const canvas = page.locator("canvas[id*='Beige Deck Chair']");
  await expect(canvas).toBeVisible({ timeout: 5000 });

  // Extract pixel data from canvas
  const { data, width, height } = await canvas.evaluate((c) => {
    const ctx = c.getContext("2d");
    const imageData = ctx.getImageData(0, 0, c.width, c.height);
    return {
      data: Array.from(imageData.data),
      width: c.width,
      height: c.height,
    };
  });

  // Convert array to Uint8ClampedArray for jsQR
  const uint8 = new Uint8ClampedArray(data);
  const code = jsQR(uint8, width, height);

  const productsInfo = await page.request.get(
    "https://backend-mingle.vercel.app/products",
  );

  const info = await productsInfo.json();
  const product = info.data.find(
    (p) => p.name.toLowerCase() === qrName.toLowerCase(),
  );
  const productID = product?._id;
  console.log(productID);

  expect(code).not.toBeNull();
  expect(code.data).toContain(`http://localhost:3000/products/${productID}`);
  console.log("QR points to:", code.data);
});

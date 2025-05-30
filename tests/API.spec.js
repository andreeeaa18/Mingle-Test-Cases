import { test, expect } from "@playwright/test";
import { log } from "console";

test("@API Place the order", async ({ request }) => {
  const response = await request.get(
    "https://backend-mingle.vercel.app/products/66e99ccb33882fb50d1750e6"
  );

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const responseData = await response.json();
  console.log(JSON.stringify(responseData, null, 2));
});

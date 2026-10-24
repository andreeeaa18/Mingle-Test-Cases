// fixtures/rotation.fixture.js
import { test as base, expect } from "@playwright/test";

export const rotationTest = base.extend({
  rotateModel: async ({ page }, use) => {
    const rotate = async () => {
      const model = page.locator("model-viewer").first();
      await expect(model).toBeVisible({ timeout: 10000 });

      const before = await model.screenshot();

      const box = await model.boundingBox();
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      const horizontalEndX = startX + box.width / 3;
      const verticalEndY = startY + box.height / 3;

      // Horizontal drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(horizontalEndX, startY, { steps: 60 });
      await page.mouse.up();

      await page.waitForTimeout(1000);

      // Vertical drag
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, verticalEndY, { steps: 60 });
      await page.mouse.up();

      await page.waitForTimeout(1000);

      const after = await model.screenshot();
      expect(before.equals(after)).toBeFalsy();
      console.log("Model visually changed after drags (rotation verified).");
    };

    await use(rotate);
  },
});

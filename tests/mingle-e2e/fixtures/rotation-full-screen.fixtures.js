import { test as base, expect } from "@playwright/test";

export const rotationTest = base.extend({
  rotateModel: async ({ page }, use) => {
    const rotateModelFn = async (fullscreenLocator) => {
      await fullscreenLocator.click();
      console.log("Entered fullscreen mode.");
      await page.waitForTimeout(1000);

      const model = page.locator("model-viewer").first();
      await expect(model).toBeVisible({ timeout: 10000 });

      const box = await model.boundingBox();
      if (!box) throw new Error("Could not locate model-viewer area.");

      const startX = box.x + box.width * 0.25;
      const startY = box.y + box.height / 2;

      console.log("Performing diagonal drag...");
      await page.mouse.down();
      await page.mouse.move(startX, startY);

      const diagSteps = 180;
      const diagDistanceX = box.width * 0.6;
      const diagDistanceY = box.height * 0.6;

      for (let i = 0; i <= diagSteps; i++) {
        const progress = i / diagSteps;
        const x = startX + diagDistanceX * Math.sin(progress * Math.PI);
        const y = startY + diagDistanceY * Math.sin(progress * Math.PI);
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(8);
      }

      console.log("Completed diagonal drag.");
      await page.waitForTimeout(800);

      console.log("Performing circular rotation...");
      const circleRadiusX = box.width * 0.4;
      const circleRadiusY = box.height * 0.4;
      const circleCenterX = box.x + box.width / 2;
      const circleCenterY = box.y + box.height / 2;

      const circleStartX = circleCenterX - circleRadiusX;
      const circleStartY = circleCenterY;

      await page.mouse.down();
      await page.mouse.move(circleStartX, circleStartY);

      const circleSteps = 360;
      for (let i = 0; i <= circleSteps; i++) {
        const angle = (i / circleSteps) * 2 * Math.PI;
        const x = circleCenterX + circleRadiusX * Math.cos(angle);
        const y = circleCenterY + circleRadiusY * Math.sin(angle);
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(6);
      }

      await page.mouse.up();
      console.log("Completed circular rotation.");

      const finalScreenshot = await model.screenshot();
      await page.waitForTimeout(1000);
      expect(finalScreenshot).toBeTruthy();

      console.log("Captured final model view after rotations.");
    };

    await use(rotateModelFn);
  },
});

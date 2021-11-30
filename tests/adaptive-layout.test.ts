import { test } from "@playwright/test";
import { PORT } from ".";

test.describe("Adaptive Layout - L", () => {
    test.use({ viewport: { height: 720, width: 1280 } });
    test("large", async ({ page }, testInfo) => {
        await page.goto(`http://localhost:${PORT}`);
        await page.screenshot({ path: testInfo.outputPath("layout.png") });
    });
});

test.describe("Adaptive Layout - M", () => {
    test.use({ viewport: { height: 580, width: 880 } });
    test("middle", async ({ page }, testInfo) => {
        await page.goto(`http://localhost:${PORT}`);
        await page.screenshot({ path: testInfo.outputPath("layout.png") });
    });
});

test.describe("Adaptive Layout - S", () => {
    test.use({ viewport: { height: 915, width: 415 } });
    test("small", async ({ page }, testInfo) => {
        await page.goto(`http://localhost:${PORT}`);
        await page.screenshot({ path: testInfo.outputPath("layout.png") });
    });
});

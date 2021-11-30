import { test } from "@playwright/test";
import Tracelib from "tracelib";
import { PORT, computeStats, writeJSON, TRACE_PATH } from ".";

test("Animation FPS", async ({ page, browser }, testInfo) => {
    await page.goto(`http://localhost:${PORT}`);

    // Open file menu
    await page.click("text=File");
    const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.click("text=Open File..."),
    ]);
    // Upload rainbow.pxr
    await fileChooser.setFiles("./tests/rainbow.pxr");
    // Start animation
    await page.click("text=Play");
    // Trace
    await browser.startTracing(page, { path: testInfo.outputPath(TRACE_PATH) });
    await page.waitForTimeout(2000);
    const buffer = await browser.stopTracing();
    // Save results
    const trace = new Tracelib(JSON.parse(buffer.toString()).traceEvents);
    await writeJSON(testInfo.outputPath("results.json"), computeStats(trace.getFPS().values));
});

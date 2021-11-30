import { PORT, perf, TRACE_PATH, PERF_USAGE_PATH } from ".";

perf("Latency", async ({ page, tracer }, testInfo) => {
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

    await tracer.start();

    // Draw pixels to a new canvas
    await page.click("text=Add", { force: true });
    await page.click("text=Move to left", { force: true });

    for (let i = 0; i < 16; i += 2) {
        const y = i * 33;
        for (let j = 0; j < 16; j += 2) {
            const x = j * 33;
            await page.click("#drawing-canvas", {
                position: { x, y },
                force: true,
            });
        }
    }
    // Stop animation
    await page.click("text=Pause");
    await tracer.end(testInfo.outputPath(TRACE_PATH), testInfo.outputPath(PERF_USAGE_PATH));
});

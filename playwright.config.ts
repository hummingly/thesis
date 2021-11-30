import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
    use: {
        browserName: "chromium",
    },
};

export default config;

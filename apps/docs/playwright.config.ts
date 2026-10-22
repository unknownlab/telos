// START_MODULE_CONTRACT
//   PURPOSE: Run the browser suites with Chromium against the static files of the build, served by serve-static, with no retries and no dev server.
//   SCOPE: The Playwright configuration: the e2e directory, the *.e2e.ts match, the global setup, the chromium project and the static web server on 127.0.0.1:4173.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   default - the Playwright configuration of the docs browser suites
// END_MODULE_MAP

import { defineConfig, devices } from "@playwright/test";

// START_CONTRACT: default
//   PURPOSE: Configure the browser suites so that each test runs once in Chromium against dist/client.
//   INPUTS: none
//   OUTPUTS: { PlaywrightTestConfig - the test configuration }
//   SIDE_EFFECTS: none at import; the web server starts when the suites run
//   LINKS: M-DOCS-SITE
// END_CONTRACT: default
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun scripts/serve-static.ts --port 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

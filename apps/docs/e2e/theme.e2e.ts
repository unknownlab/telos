// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that the theme follows the system setting by default, that a chosen theme is stored and applied before first paint and survives a reload, that the system choice follows the emulated colour scheme, and that a blocked storage falls back to the system setting without an error (FR-015).
//   SCOPE: The theme suite over the static build: the pre-paint class, the three toggle choices, the stored key, the reload at domcontentloaded, the JavaScript-blocked reload and the blocked storage.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   THEME_KEY - the localStorage key of the theme choice
//   DARK_CLASS - the class of the document root that shows the dark palette
//   themeChoice - the toggle button of one theme choice
//   darkAtContentLoaded - reads whether the root has the dark class when the document reaches DOMContentLoaded
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

const THEME_KEY = "telos-theme";
const DARK_CLASS = /(^|\s)dark(\s|$)/;

// START_CONTRACT: themeChoice
//   PURPOSE: Locate the toggle button of one theme choice by its data attribute.
//   INPUTS: { page: Page - a page with the header, choice: string - light, dark or system }
//   OUTPUTS: { Locator - the toggle button }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: themeChoice
function themeChoice(page: Page, choice: string) {
  return page.locator(`button[data-theme-choice="${choice}"]`);
}

// START_CONTRACT: darkAtContentLoaded
//   PURPOSE: Start watching for the DOMContentLoaded event so that the dark class can be read at that moment, before any reader action.
//   INPUTS: { page: Page - the page that is about to reload }
//   OUTPUTS: { Promise<boolean> - true when the root has the dark class at DOMContentLoaded }
//   SIDE_EFFECTS: attaches a one-time listener through the page event
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: darkAtContentLoaded
function darkAtContentLoaded(page: Page): Promise<boolean> {
  return page
    .waitForEvent("domcontentloaded")
    .then(() =>
      page.evaluate(() => document.documentElement.classList.contains("dark")),
    );
}

test.describe("theme with a dark system setting", () => {
  test.use({ colorScheme: "dark" });

  test("with empty storage the system setting applies before any click", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    const root = page.locator("html");
    await expect(root).toHaveClass(DARK_CLASS);
    await expect(root).toHaveAttribute("data-theme", "system");
    await expect(themeChoice(page, "system")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    check();
  });

  test("Dark theme is applied, stored, and still applied at DOMContentLoaded after a reload", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await themeChoice(page, "dark").click();
    const root = page.locator("html");
    await expect(root).toHaveClass(DARK_CLASS);
    await expect(root).toHaveAttribute("data-theme", "dark");
    expect(
      await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
    ).toBe("dark");

    const atContentLoaded = darkAtContentLoaded(page);
    await page.reload();
    expect(await atContentLoaded).toBe(true);
    await expect(themeChoice(page, "dark")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    check();
  });

  test("the stored dark theme applies even when the page scripts are blocked", async ({
    page,
  }) => {
    await page.goto("/");
    await themeChoice(page, "dark").click();
    await page.route(/\/assets\/[^?]*\.js(\?.*)?$/, (route) => route.abort());
    await page.reload();
    await expect(page.locator("html")).toHaveClass(DARK_CLASS);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("Light theme under a dark system setting removes the dark class and survives a reload", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await themeChoice(page, "light").click();
    await expect(page.locator("html")).not.toHaveClass(DARK_CLASS);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(DARK_CLASS);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    check();
  });
});

test.describe("theme with a light system setting", () => {
  test.use({ colorScheme: "light" });

  test("with empty storage there is no dark class", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(DARK_CLASS);
  });

  test("System theme follows the emulated colour scheme", async ({ page }) => {
    const check = trackPageErrors(page);
    await page.goto("/");
    await themeChoice(page, "system").click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), THEME_KEY),
    ).toBe("system");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(DARK_CLASS);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(DARK_CLASS);
    check();
  });
});

test.describe("theme with blocked storage", () => {
  test.use({ colorScheme: "dark" });

  test("the system setting applies, and a click still applies for that page, with no page error", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new Error("storage is blocked");
        },
      });
    });
    const check = trackPageErrors(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(DARK_CLASS);
    await themeChoice(page, "light").click();
    await expect(page.locator("html")).not.toHaveClass(DARK_CLASS);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    check();
  });
});

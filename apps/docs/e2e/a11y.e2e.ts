// START_MODULE_CONTRACT
//   PURPOSE: Prove that the pages that carry the site's content, its playground and its verification report have no serious or critical WCAG 2.0 and 2.1 A and AA violations in the light and the dark theme (NFR-004).
//   SCOPE: The accessibility suite over the static build: the home page, the first principle, term and decision of the index, the playground after a valid run and after a run with diagnostics, and the verification page, each scanned with axe-core in both themes. Out: rule configuration; no rule is disabled.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   WCAG_TAGS - the WCAG rule tags that the scan runs
//   BLOCKING_IMPACTS - the impacts that fail the suite
//   THEMES - the two themes each page is scanned in
//   PAGES - the pages the suite audits, in the order the report lists them
//   AuditedPage - one page of the suite, with the steps that prepare it
//   firstDocumentOf - the path of the first document of a kind in the build index
//   describeViolation - one line per blocking violation, with its rule, help and first three targets
//   settleAnimations - waits until no CSS transition or animation of the page is still running
//   runExample - opens the playground and runs one example, so that its result panels are part of the scan
// END_MODULE_MAP

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { readIndex } from "./helpers";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const BLOCKING_IMPACTS: ReadonlyArray<string> = ["serious", "critical"];
const THEMES = ["light", "dark"] as const;

interface AuditedPage {
  readonly name: string;
  readonly path: string;
  readonly prepare?: (page: Page) => Promise<void>;
}

// START_CONTRACT: firstDocumentOf
//   PURPOSE: Find the route of the first document of one kind in the build index, so that the suite audits real content pages.
//   INPUTS: { kind: string - the document kind }
//   OUTPUTS: { string - the URL of the first document of that kind; throws when the build has none }
//   SIDE_EFFECTS: reads dist/client/index.json
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: firstDocumentOf
function firstDocumentOf(kind: string): string {
  const doc = readIndex().find((item) => item.kind === kind);
  if (doc === undefined) throw new Error(`the build has no ${kind} document`);
  return doc.url;
}

// START_CONTRACT: describeViolation
//   PURPOSE: Describe one blocking violation with its rule id, its help text and the first three target selectors, so that a failure names what to fix.
//   INPUTS: { violation: { id: string, impact?: string | null, help: string, nodes: ReadonlyArray<{ target: ReadonlyArray<unknown> }> } - an axe violation }
//   OUTPUTS: { string - one line for the failure message }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: describeViolation
function describeViolation(violation: {
  readonly id: string;
  readonly impact?: string | null;
  readonly help: string;
  readonly nodes: ReadonlyArray<{ readonly target: ReadonlyArray<unknown> }>;
}): string {
  const targets = violation.nodes
    .slice(0, 3)
    .map((node) => node.target.map(String).join(" "))
    .join(" | ");
  return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}. Targets: ${targets}`;
}

// START_CONTRACT: settleAnimations
//   PURPOSE: Wait until no transition or animation of the page is running, so that the colours the scan reads are the final ones.
//   INPUTS: { page: Page - the page to settle }
//   OUTPUTS: { Promise<void> - resolves when every animation has finished }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: settleAnimations
async function settleAnimations(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running"),
  );
}

// START_CONTRACT: runExample
//   PURPOSE: Open the playground, pick one example and run it, so that its result panels are on the page when the scan runs.
//   INPUTS: { page: Page - the page to use, name: string - the example name, such as "composed" }
//   OUTPUTS: { Promise<void> - resolves when the playground is hydrated and the example has run }
//   SIDE_EFFECTS: navigates the page, selects the example and presses the run button
//   LINKS: V-M-DOCS-SITE
// END_CONTRACT: runExample
async function runExample(page: Page, name: string): Promise<void> {
  await page.goto("/playground");
  await expect(page.locator('[data-slot="playground"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.selectOption("#playground-example", name);
  await page.locator('[data-action="run"]').click();
  await expect(page.locator("[data-result]").first()).toBeVisible();
}

const PAGES: ReadonlyArray<AuditedPage> = [
  { name: "home", path: "/" },
  { name: "principle", path: firstDocumentOf("principle") },
  { name: "term", path: firstDocumentOf("term") },
  { name: "decision", path: firstDocumentOf("decision") },
  {
    name: "playground after a valid run",
    path: "/playground",
    prepare: (page) => runExample(page, "composed"),
  },
  {
    name: "playground with diagnostics",
    path: "/playground",
    prepare: (page) => runExample(page, "cycle"),
  },
  { name: "verification", path: "/verification" },
];

test.describe("accessibility", () => {
  for (const theme of THEMES) {
    for (const audited of PAGES) {
      test(`${audited.name} has no serious or critical violations in the ${theme} theme`, async ({
        page,
      }) => {
        await page.context().addInitScript((chosen: string) => {
          try {
            localStorage.setItem("telos-theme", chosen);
          } catch {
            // Storage blocked: the page then follows the system setting, which the test does not rely on.
          }
        }, theme);

        if (audited.prepare !== undefined) {
          await audited.prepare(page);
        } else {
          await page.goto(audited.path);
        }

        const isDark = await page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        );
        expect(isDark, `the ${theme} theme is applied`).toBe(theme === "dark");
        await settleAnimations(page);

        const results = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();
        const blocking = results.violations
          .filter((violation) =>
            BLOCKING_IMPACTS.includes(violation.impact ?? ""),
          )
          .map(describeViolation);
        expect(
          blocking,
          `${audited.name} (${theme}) blocking axe violations`,
        ).toEqual([]);
      });
    }
  }
});

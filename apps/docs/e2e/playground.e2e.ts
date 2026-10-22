// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that playground scenarios A to E run the real package on explicit presses, mark stale results as historical without recomputing them, refuse oversized and hostile input safely, show the walk-through of the history, and compare the browser specification run with the build report (FR-019, FR-020, INV-013).
//   SCOPE: The playground suite over the static build: scenario A (valid Fabric, historical marking), B (diagnostics, decode errors, size limit, markup as text), C (relations), D (two Revisions, change set, history with compare-and-set appends) and E (specifications run in the browser against the build report).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CHECKOUT_REVISION_A - the Revision id of shop:checkout in the A side of the history example, as the package computes it
//   REVISION_B - the Revision id of the B side of the history example
//   OVERSIZED_INPUT_LENGTH - one character more than the 1 MB input limit
//   IMG_PURPOSE - a purpose made of markup, which must be shown as text and never executed
//   openScenario - opens one scenario and waits until its playground is hydrated
//   revisionIdsOf - the locus-to-Revision-id map of every Revision id on the page
//   historyOutcomes - the outcome of every history step, in order
//   historyEntries - the Revision ids of the history log, in order
//   fabricInputWith - the example Fabric with the purpose of loci[1] replaced
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import { examples } from "@telos/locus-specs";
import { caretToEnd, trackPageErrors } from "./helpers";

const CHECKOUT_REVISION_A =
  "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6";
const REVISION_B =
  "sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315";
const OVERSIZED_INPUT_LENGTH = 1_048_577;
const IMG_PURPOSE = "<img src=x onerror=alert(1)>";

// START_CONTRACT: openScenario
//   PURPOSE: Open one scenario and wait for its playground to hydrate, so that no interaction runs before the page is ready.
//   INPUTS: { page: Page - the page to use, id: string - the scenario letter a to e }
//   OUTPUTS: { Promise<void> - resolves when data-ready is true on the playground }
//   SIDE_EFFECTS: navigates the page
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: openScenario
async function openScenario(page: Page, id: string): Promise<void> {
  await page.goto(`/playground/${id}`);
  await expect(page.locator('[data-slot="playground"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
}

// START_CONTRACT: revisionIdsOf
//   PURPOSE: Read the Revision id that each element on the page shows, keyed by the locus it names.
//   INPUTS: { page: Page - the page of a scenario that has run }
//   OUTPUTS: { Promise<Map<string, string>> - the Revision id of each locus shown on the page }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: revisionIdsOf
async function revisionIdsOf(page: Page): Promise<Map<string, string>> {
  const pairs = await page
    .locator("[data-revision-id]")
    .evaluateAll((elements) =>
      elements.map((element) => [
        element.getAttribute("data-locus") ?? "",
        element.getAttribute("data-revision-id") ?? "",
      ]),
    );
  return new Map(pairs as Array<[string, string]>);
}

// START_CONTRACT: historyEntries
//   PURPOSE: Read the Revision id of each entry of the history log of scenario D, in order.
//   INPUTS: { page: Page - the page of scenario D }
//   OUTPUTS: { Promise<Array<string | null>> - the data-history-entry of each entry }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: historyEntries
async function historyEntries(page: Page): Promise<Array<string | null>> {
  return page
    .locator("[data-history-entry]")
    .evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-history-entry")),
    );
}

// START_CONTRACT: historyOutcomes
//   PURPOSE: Read the outcome of each history step of scenario D, in order.
//   INPUTS: { page: Page - the page of scenario D }
//   OUTPUTS: { Promise<string[]> - the data-history-outcome of each step }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: historyOutcomes
async function historyOutcomes(page: Page): Promise<string[]> {
  return page
    .locator("[data-history-step]")
    .evaluateAll((steps) =>
      steps.map((step) => step.getAttribute("data-history-outcome") ?? ""),
    );
}

// START_CONTRACT: fabricInputWith
//   PURPOSE: Build the text of the example Fabric with the purpose of its second Locus replaced, for the markup test.
//   INPUTS: { purpose: string - the purpose to give the checkout Locus }
//   OUTPUTS: { string - the Fabric as JSON text }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: fabricInputWith
function fabricInputWith(purpose: string): string {
  const copy = JSON.parse(JSON.stringify(examples.invalid)) as {
    loci: Array<{ charter: { purpose: string } }>;
  };
  const locus = copy.loci[1];
  if (locus === undefined)
    throw new Error("the invalid example has no second Locus");
  locus.charter.purpose = purpose;
  return JSON.stringify(copy, null, 2);
}

test.describe("scenario A", () => {
  test("Validate reports a valid Fabric with the Revision id of each Locus, marked browser", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "a");
    await page.locator('[data-action="run"]').click();
    await expect(page.locator('[data-valid="true"]')).toBeVisible();
    await expect(page.locator("[data-revision-id]")).toHaveCount(3);
    await expect(
      page.locator('li[data-locus="shop:checkout"]'),
    ).toHaveAttribute("data-revision-id", CHECKOUT_REVISION_A);
    const panels = page.locator("[data-result]");
    await expect(panels).toHaveCount(2);
    for (const panel of await panels.all()) {
      await expect(panel).toHaveAttribute("data-provenance", "browser");
    }
    check();
  });

  test("an edit marks the results historical and keeps their ids; a run makes them browser again", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "a");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-result][data-provenance="browser"]'),
    ).toHaveCount(2);
    const before = await revisionIdsOf(page);

    const input = page.locator("#fabric-input");
    await caretToEnd(input);
    await page.keyboard.type(" ");
    const panels = page.locator("[data-result]");
    await expect(panels).toHaveCount(2);
    for (const panel of await panels.all()) {
      await expect(panel).toHaveAttribute("data-provenance", "historical");
      await expect(panel).toHaveAttribute("data-stale", "true");
    }
    expect(await revisionIdsOf(page)).toEqual(before);
    await expect(
      page.locator('[data-slot="results"] > p', {
        hasText: "The input has changed since this run",
      }),
    ).toBeVisible();

    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-result][data-provenance="browser"]'),
    ).toHaveCount(2);
    await expect(page.locator("[data-stale]")).toHaveCount(0);

    await caretToEnd(input);
    await page.keyboard.type(" ");
    await expect(
      page.locator('[data-result][data-provenance="historical"]'),
    ).toHaveCount(2);
    await page.keyboard.press("Backspace");
    await expect(
      page.locator('[data-result][data-provenance="browser"]'),
    ).toHaveCount(2);
    await expect(page.locator("[data-stale]")).toHaveCount(0);
    check();
  });
});

test.describe("scenario B", () => {
  test("Validate lists the diagnostics in order, with no Valid label and no Revision id", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "b");
    await page.locator('[data-action="run"]').click();
    await expect(page.locator('[data-valid="false"]')).toBeVisible();
    const codes = await page
      .locator("[data-diagnostic-code]")
      .evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-diagnostic-code")),
      );
    expect(codes).toEqual(["charter.entry-duplicate", "charter.purpose-blank"]);
    await expect(page.locator("main")).not.toContainText("Valid:");
    await expect(page.locator("[data-revision-id]")).toHaveCount(0);
    check();
  });

  test("malformed JSON gives a decode error for the whole input", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "b");
    await page.locator("#fabric-input").fill('{"loci": [');
    await page.locator('[data-action="run"]').click();
    const panel = page.locator('[data-result="decode-error"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('li[data-issue-path=""]')).toContainText(
      "(whole input)",
    );
    check();
  });

  test("input over 1 MB is refused and the page stays responsive", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "b");
    await page
      .locator("#fabric-input")
      .fill("x".repeat(OVERSIZED_INPUT_LENGTH));
    await page.locator('[data-action="run"]').click();
    await expect(page.locator('[data-result="decode-error"]')).toBeVisible();
    await expect(page.locator('[data-action="run"]')).toBeEnabled();
    await page.getByRole("button", { name: "Reset to example" }).click();
    await expect(page.locator("#fabric-input")).toHaveValue(/shop:checkout/);
    check();
  });

  test("a purpose of markup is never rendered as an element, and no dialog opens", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    let dialogs = 0;
    page.on("dialog", (dialog) => {
      dialogs += 1;
      void dialog.dismiss();
    });
    await openScenario(page, "b");
    await page.locator("#fabric-input").fill(fabricInputWith(IMG_PURPOSE));
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-result="validation-report"]'),
    ).toBeVisible();
    await expect(page.locator('[data-slot="results"] img')).toHaveCount(0);
    expect(dialogs).toBe(0);
    check();
  });
});

test.describe("scenario C", () => {
  test("the relation table flags the refines cycle and the missing target", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "c");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-relation="shop:checkout refines shop:payment"]'),
    ).toHaveAttribute("data-relation-status", "refines-cycle");
    await expect(
      page.locator('[data-relation="shop:payment refines shop:checkout"]'),
    ).toHaveAttribute("data-relation-status", "refines-cycle");
    await expect(
      page.locator('[data-relation="shop:storefront depends-on shop:ghost"]'),
    ).toHaveAttribute("data-relation-status", "target-missing");
    check();
  });
});

test.describe("scenario D", () => {
  test("Compute shows both Revision ids and the change set from A to B", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="a"] [data-revision-id]'),
    ).toHaveAttribute("data-revision-id", CHECKOUT_REVISION_A);
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toHaveAttribute("data-revision-id", REVISION_B);
    const kinds = await page
      .locator("[data-change-part]")
      .evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-change-kind")),
      );
    expect(kinds).toEqual(["removed", "added"]);
    check();
  });

  test("the history walk-through gives appended, stale, appended and no-op, with the head and entries", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();
    await expect(page.locator('[data-slot="expected-head"]')).toHaveValue("");
    await expect(
      page.locator('[data-slot="results"][aria-live="polite"]'),
    ).toHaveCount(1);

    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="1"]')).toHaveAttribute(
      "data-history-outcome",
      "stale",
    );
    // The refusal changed nothing: the log still holds only A, and the head is still A.
    expect(await historyEntries(page)).toEqual([CHECKOUT_REVISION_A]);
    await expect(page.locator("[data-history-head]")).toHaveAttribute(
      "data-history-head",
      CHECKOUT_REVISION_A,
    );
    await page.locator('[data-action="use-head"]').click();
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="2"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await page.locator('[data-action="use-head"]').click();
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="3"]')).toHaveAttribute(
      "data-history-outcome",
      "no-op",
    );

    expect(await historyOutcomes(page)).toEqual([
      "appended",
      "stale",
      "appended",
      "no-op",
    ]);
    await expect(page.locator("[data-history-head]")).toHaveAttribute(
      "data-history-head",
      REVISION_B,
    );
    expect(await historyEntries(page)).toEqual([
      CHECKOUT_REVISION_A,
      REVISION_B,
    ]);
    check();
  });

  test("Reset history empties the log, and the next append starts a new history", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();
    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="1"]')).toHaveAttribute(
      "data-history-outcome",
      "stale",
    );
    await page.locator('[data-action="use-head"]').click();
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="2"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await expect(page.locator("[data-history-entry]")).toHaveCount(2);

    await page.getByRole("button", { name: "Reset history" }).click();
    await expect(page.locator("[data-history-step]")).toHaveCount(0);
    await expect(page.locator("[data-history-entry]")).toHaveCount(0);
    await expect(page.locator("[data-history-head]")).toHaveCount(0);
    await expect(
      page
        .locator('[data-result="history-state"]')
        .getByText("The history is empty. Append A or B to start it."),
    ).toBeVisible();

    // A new history: the head the field still holds is cleared, and A is appended on its own.
    await page.locator('[data-slot="expected-head"]').fill("");
    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await expect(page.locator("[data-history-step]")).toHaveCount(1);
    expect(await historyEntries(page)).toEqual([CHECKOUT_REVISION_A]);
    check();
  });

  test("a second Compute clears the history log", async ({ page }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();
    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator('[data-history-step="1"]')).toHaveAttribute(
      "data-history-outcome",
      "stale",
    );
    await expect(page.locator("[data-history-step]")).toHaveCount(2);

    await page.locator('[data-action="run"]').click();
    await expect(page.locator("[data-history-step]")).toHaveCount(0);
    await expect(page.locator("[data-history-entry]")).toHaveCount(0);
    await expect(
      page
        .locator('[data-result="history-state"]')
        .getByText("The history is empty. Append A or B to start it."),
    ).toBeVisible();
    check();
  });

  test("a malformed expected head shows the hint and adds no step", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();
    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toBeVisible();

    const head = page.locator('[data-slot="expected-head"]');
    await head.fill("not-a-revision");
    await expect(head).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByText("Expected head must be empty or a sha256: id."),
    ).toBeVisible();
    await page.locator('[data-action="append-b"]').click();
    await expect(page.locator("[data-history-step]")).toHaveCount(1);
    check();
  });

  test("an edit to Locus B makes the history historical and disables the appends", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toBeVisible();
    await page.locator('[data-action="append-a"]').click();
    await expect(page.locator('[data-history-step="0"]')).toHaveAttribute(
      "data-history-outcome",
      "appended",
    );
    await expect(
      page.locator('[data-result="history-state"][data-provenance="browser"]'),
    ).toBeVisible();
    await caretToEnd(page.locator("#locus-b-input"));
    await page.keyboard.type(" ");
    await expect(
      page.locator('[data-slot="results"] > p', {
        hasText: "The input has changed since this run",
      }),
    ).toBeVisible();
    await expect(
      page.locator(
        '[data-result="history-state"][data-provenance="historical"]',
      ),
    ).toBeVisible();
    await expect(page.locator('[data-action="append-a"]')).toBeDisabled();
    await expect(page.locator('[data-action="append-b"]')).toBeDisabled();
    await expect(
      page.getByText("Compute again to append the edited input."),
    ).toBeVisible();
    check();
  });
  test("a purpose made of markup is shown as text in the change set, with no element and no dialog", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    let dialogs = 0;
    page.on("dialog", (dialog) => {
      dialogs += 1;
      void dialog.dismiss();
    });
    await openScenario(page, "d");
    const changed = JSON.parse(JSON.stringify(examples.history.b)) as {
      charter: { purpose: string };
    };
    changed.charter.purpose = IMG_PURPOSE;
    await page.locator("#locus-b-input").fill(JSON.stringify(changed, null, 2));
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-change-part="charter.purpose"]'),
    ).toContainText(IMG_PURPOSE);
    await expect(page.locator('[data-slot="results"] img')).toHaveCount(0);
    expect(dialogs).toBe(0);
    check();
  });
});

test.describe("scenario E", () => {
  test("the build report is shown before a run, with 44 rows", async ({
    page,
  }) => {
    await openScenario(page, "e");
    const build = page.locator(
      '[data-result="spec-report"][data-provenance="bun-build"]',
    );
    await expect(build).toHaveCount(1);
    await expect(build.locator("[data-spec-id]")).toHaveCount(44);
  });

  test("Run all gives 44 passing browser rows, the same as the build, and eight matching goldens", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "e");
    await page.locator('[data-action="run"]').click();
    // The comparison panel is also a browser spec-report, so the report is the one that holds the rows.
    const browser = page
      .locator('[data-result="spec-report"][data-provenance="browser"]')
      .filter({
        has: page.locator("[data-spec-id]"),
      });
    await expect(browser).toHaveCount(1);
    await expect(browser.locator("[data-spec-id]")).toHaveCount(44);
    await expect(
      browser.locator('[data-spec-id][data-spec-status="pass"]'),
    ).toHaveCount(44);
    await expect(page.locator('[data-compare="same"]')).toBeVisible();
    await expect(page.locator('[data-golden-match="true"]')).toHaveCount(8);
    await expect(page.locator('[data-golden-match="false"]')).toHaveCount(0);
    check();
  });
});

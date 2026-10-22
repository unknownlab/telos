// START_MODULE_CONTRACT
//   PURPOSE: Prove that the Revision ids the browser shows are the ids the Bun runtime computes for the same inputs, and that the browser specification run agrees with the build report id by id (NFR-001).
//   SCOPE: The equality suite. The expected ids are computed in this Bun test process with the real @telos/locus and @telos/locus-specs packages, and compared with the ids and statuses that scenarios A, D and E show in Chromium, plus the golden constants. Out: the Revision algorithm itself, which the package tests cover.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   bunRevisionIdsOfFabric - the Revision id of every Locus of a Fabric, computed in Bun
//   bunRevisionIdOfLocus - the Revision id of one Locus JSON value, computed in Bun
//   openScenario - opens one scenario and waits until its playground is hydrated
//   statusesOfReport - the status of every specification row of a report, keyed by id
//   revisionCompareSides - every side of every revision-compare record, with its fixture key
// END_MODULE_MAP

import { expect, type Page, test } from "@playwright/test";
import {
  createRevision,
  decodeFabric,
  decodeLocus,
  type RevisionId,
} from "@telos/locus";
import { catalogue, examples, revisionGoldens } from "@telos/locus-specs";
import { Effect, Result } from "effect";
import { trackPageErrors } from "./helpers";

// START_CONTRACT: bunRevisionIdsOfFabric
//   PURPOSE: Compute the Revision id of every Locus of a Fabric with the Bun runtime, so that the browser ids can be checked against them.
//   INPUTS: { fabric: unknown - a FabricJson value }
//   OUTPUTS: { Promise<Map<string, RevisionId>> - the id of each Locus, keyed by its identity }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: bunRevisionIdsOfFabric
async function bunRevisionIdsOfFabric(
  fabric: Parameters<typeof decodeFabric>[0],
): Promise<Map<string, RevisionId>> {
  const decoded = await Effect.runPromise(Effect.result(decodeFabric(fabric)));
  if (Result.isFailure(decoded))
    throw new Error("the example Fabric does not decode in Bun");
  const revisions = await Effect.runPromise(
    Effect.forEach(decoded.success.loci, (locus) => createRevision(locus)),
  );
  return new Map(
    revisions.map((revision) => [revision.locus as string, revision.id]),
  );
}

// START_CONTRACT: bunRevisionIdOfLocus
//   PURPOSE: Compute the Revision id of one Locus JSON value with the Bun runtime.
//   INPUTS: { json: Parameters<typeof decodeLocus>[0] - a LocusJson value }
//   OUTPUTS: { Promise<RevisionId> - the Revision id; throws when the value does not decode }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: bunRevisionIdOfLocus
async function bunRevisionIdOfLocus(
  json: Parameters<typeof decodeLocus>[0],
): Promise<RevisionId> {
  const decoded = await Effect.runPromise(Effect.result(decodeLocus(json)));
  if (Result.isFailure(decoded))
    throw new Error("the Locus does not decode in Bun");
  const revision = await Effect.runPromise(createRevision(decoded.success));
  return revision.id;
}

// START_CONTRACT: openScenario
//   PURPOSE: Open one scenario and wait for its playground to hydrate, so that no interaction runs before the page is ready.
//   INPUTS: { page: Page - the page to use, id: string - the scenario letter }
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

// START_CONTRACT: statusesOfReport
//   PURPOSE: Read the status that each specification row of a report shows, keyed by the specification id.
//   INPUTS: { page: Page - the page of scenario E, rows: "browser" or "bun-build" }
//   OUTPUTS: { Promise<Map<string, string>> - the status of each row of the chosen report }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: statusesOfReport
async function statusesOfReport(
  page: Page,
  origin: "browser" | "bun-build",
): Promise<Map<string, string>> {
  const rows = page.locator(
    `[data-result="spec-report"][data-provenance="${origin}"] [data-spec-id]`,
  );
  const pairs = await rows.evaluateAll((elements) =>
    elements.map((element) => [
      element.getAttribute("data-spec-id") ?? "",
      element.getAttribute("data-spec-status") ?? "",
    ]),
  );
  return new Map(pairs as Array<[string, string]>);
}

// START_CONTRACT: revisionCompareSides
//   PURPOSE: List both sides of every revision-compare record of the catalogue under the fixture key the golden table uses.
//   INPUTS: none
//   OUTPUTS: { Array<{ key: string, json: Parameters<typeof decodeLocus>[0] }> - one entry per side, in catalogue order }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: revisionCompareSides
function revisionCompareSides(): Array<{
  key: string;
  json: Parameters<typeof decodeLocus>[0];
}> {
  const sides: Array<{ key: string; json: Parameters<typeof decodeLocus>[0] }> =
    [];
  for (const spec of catalogue) {
    if (spec.check.kind !== "revision-compare") continue;
    sides.push({ key: `${spec.id}.a`, json: spec.check.a });
    sides.push({ key: `${spec.id}.b`, json: spec.check.b });
  }
  return sides;
}

test.describe("Bun and browser agree", () => {
  test("scenario A shows the Bun Revision id of every Locus of the valid example", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    const expected = await bunRevisionIdsOfFabric(examples.valid);
    expect(expected.size).toBe(3);

    await openScenario(page, "a");
    await page.locator('[data-action="run"]').click();
    const shown = page.locator("li[data-locus][data-revision-id]");
    await expect(shown).toHaveCount(expected.size);
    const pairs = await shown.evaluateAll((items) =>
      items.map((item) => [
        item.getAttribute("data-locus") ?? "",
        item.getAttribute("data-revision-id") ?? "",
      ]),
    );
    for (const [locus, id] of pairs as Array<[string, string]>) {
      expect(id, locus).toBe(expected.get(locus));
    }
    check();
  });

  test("scenario D shows the Bun Revision ids of both history examples", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    const expectedA = await bunRevisionIdOfLocus(examples.history.a);
    const expectedB = await bunRevisionIdOfLocus(examples.history.b);

    await openScenario(page, "d");
    await page.locator('[data-action="run"]').click();
    await expect(
      page.locator('[data-side="a"] [data-revision-id]'),
    ).toHaveAttribute("data-revision-id", expectedA);
    await expect(
      page.locator('[data-side="b"] [data-revision-id]'),
    ).toHaveAttribute("data-revision-id", expectedB);
    check();
  });

  test("scenario E shows the Bun Revision id and the golden constant of every revision-compare side", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    const sides = revisionCompareSides();
    expect(sides.length).toBe(Object.keys(revisionGoldens).length);

    await openScenario(page, "e");
    await page.locator('[data-action="run"]').click();
    const rows = page.locator("tr[data-golden-key]");
    await expect(rows).toHaveCount(sides.length);
    const shown = await rows.evaluateAll((items) =>
      items.map((item) => [
        item.getAttribute("data-golden-key") ?? "",
        item
          .querySelector("[data-revision-id]")
          ?.getAttribute("data-revision-id") ?? "",
      ]),
    );
    const browserIds = new Map(shown as Array<[string, string]>);

    for (const side of sides) {
      const bunId = await bunRevisionIdOfLocus(side.json);
      expect(browserIds.get(side.key), side.key).toBe(bunId);
      expect(revisionGoldens[side.key], side.key).toBe(bunId);
    }
    check();
  });

  test("scenario E's browser statuses equal the build report statuses, id by id", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openScenario(page, "e");
    const built = await statusesOfReport(page, "bun-build");
    expect(built.size).toBe(44);

    await page.locator('[data-action="run"]').click();
    await expect(page.locator('[data-compare="same"]')).toBeVisible();
    const browser = await statusesOfReport(page, "browser");
    expect(browser.size).toBe(44);
    expect([...browser.entries()].sort()).toEqual([...built.entries()].sort());
    check();
  });
});

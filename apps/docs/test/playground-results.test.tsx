// START_MODULE_CONTRACT
//   PURPOSE: Prove that a playground result names its origin and is labelled historical as soon as the editor text differs from the text that was run (FR-021).
//   SCOPE: The static markup of PlaygroundResults for one real run of the minimal example, with the same and with a changed editor text. Bun only; no browser.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MINIMAL - the JSON text of the minimal playground example
//   RUN - one real run of MINIMAL
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaygroundResults } from "@/playground/components/playground-results";
import { PLAYGROUND_EXAMPLES } from "@/playground/examples";
import { runDefinition } from "@/playground/run";

const MINIMAL =
  PLAYGROUND_EXAMPLES.find((example) => example.name === "minimal")?.json ?? "";
const RUN = {
  text: MINIMAL,
  result: await Effect.runPromise(runDefinition(MINIMAL)),
  ranAt: "2026-01-01T00:00:00.000Z",
};

describe("playground results: the stale-result label", () => {
  test("a result for the current text is from the browser and not historical", () => {
    const html = renderToStaticMarkup(
      <PlaygroundResults run={RUN} currentText={MINIMAL} />,
    );
    expect(html).toContain('data-provenance="browser"');
    expect(html).toContain("Run in this browser at ");
    expect(html).not.toContain("Historical:");
  });

  test("a result for a changed text is labelled historical", () => {
    const html = renderToStaticMarkup(
      <PlaygroundResults run={RUN} currentText={`${MINIMAL} `} />,
    );
    expect(html).toContain('data-provenance="historical"');
    expect(html).toContain("Historical: run in this browser at ");
    expect(html).toContain("The input has changed since this run.");
  });
});

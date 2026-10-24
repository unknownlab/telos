// START_MODULE_CONTRACT
//   PURPOSE: Prove that the playground runs the real @telos/kernel on the example inputs, reports the expected diagnostics and decode issues, refuses oversized input, and marks each example valid exactly when its run is valid (FR-026, NFR-001).
//   SCOPE: runDefinition on every PLAYGROUND_EXAMPLES entry, on a syntax error, on an unknown extension and on an oversized text. Bun only; no DOM and no browser.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   run - runs one JSON text through the playground pipeline
//   builtOf - the built outcome of a run, failing the test for a decode error
//   codesOf - the diagnostic codes of a built run, in order
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { PLAYGROUND_EXAMPLES } from "@/playground/examples";
import {
  MAX_INPUT_LENGTH,
  type PlaygroundResult,
  runDefinition,
} from "@/playground/run";

// START_CONTRACT: run
//   PURPOSE: Run one JSON text through the playground pipeline in the test runtime.
//   INPUTS: { text: string - the JSON text of a Locus definition }
//   OUTPUTS: { Promise<PlaygroundResult> - the playground result }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: run
const run = (text: string): Promise<PlaygroundResult> =>
  Effect.runPromise(runDefinition(text));

// START_CONTRACT: builtOf
//   PURPOSE: Narrow a playground result to a built run, so that the tests read its report and description.
//   INPUTS: { result: PlaygroundResult - a playground result }
//   OUTPUTS: { built result - the same result, typed as built }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: builtOf
function builtOf(
  result: PlaygroundResult,
): Extract<PlaygroundResult, { readonly kind: "built" }> {
  if (result.kind !== "built") {
    throw new Error(`expected a built run, got ${result.kind}`);
  }
  return result;
}

// START_CONTRACT: codesOf
//   PURPOSE: List the diagnostic codes of a built run in their reported order.
//   INPUTS: { result: PlaygroundResult - a playground result }
//   OUTPUTS: { ReadonlyArray<string> - the codes, empty for a decode error }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: codesOf
function codesOf(result: PlaygroundResult): ReadonlyArray<string> {
  return result.kind === "built"
    ? result.diagnostics.map((diagnostic) => diagnostic.code)
    : [];
}

describe("the playground runs the real kernel on each example", () => {
  test("minimal is built with no diagnostics, in the browser runner", async () => {
    const result = builtOf(await run('{"id":"demo:hello"}'));
    expect(result.diagnostics).toEqual([]);
    expect(result.report.provenance.runner).toBe("browser");
    expect(result.description.root).toBe("demo:hello");
  });

  test("composed has no diagnostics and two passing flow.labelled findings", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "composed",
    );
    if (example === undefined)
      throw new Error("the composed example is missing");
    const result = builtOf(await run(example.json));
    expect(result.diagnostics).toEqual([]);
    const flowFindings = result.report.findings.filter(
      (finding) => finding.rule === "flow.labelled",
    );
    expect(flowFindings).toHaveLength(2);
    expect(flowFindings.every((finding) => finding.outcome === "passed")).toBe(
      true,
    );
  });

  test("property-conflict reports composition.property-conflict", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "property-conflict",
    );
    if (example === undefined) throw new Error("the example is missing");
    expect(codesOf(await run(example.json))).toContain(
      "composition.property-conflict",
    );
  });

  test("invalid-property reports property.invalid", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "invalid-property",
    );
    if (example === undefined) throw new Error("the example is missing");
    expect(codesOf(await run(example.json))).toContain("property.invalid");
  });

  test("missing-target reports relation.target-missing", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "missing-target",
    );
    if (example === undefined) throw new Error("the example is missing");
    expect(codesOf(await run(example.json))).toContain(
      "relation.target-missing",
    );
  });

  test("cycle reports relation.cycle", async () => {
    const example = PLAYGROUND_EXAMPLES.find((item) => item.name === "cycle");
    if (example === undefined) throw new Error("the example is missing");
    expect(codesOf(await run(example.json))).toContain("relation.cycle");
  });

  test("malformed-id reports identity.malformed", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "malformed-id",
    );
    if (example === undefined) throw new Error("the example is missing");
    expect(codesOf(await run(example.json))).toContain("identity.malformed");
  });

  test("every example's valid flag equals its run being decoded with no error diagnostic", async () => {
    for (const example of PLAYGROUND_EXAMPLES) {
      const result = await run(example.json);
      const valid =
        result.kind === "built" &&
        result.diagnostics.every(
          (diagnostic) => diagnostic.severity !== "error",
        );
      expect({ name: example.name, valid: valid }).toEqual({
        name: example.name,
        valid: example.valid,
      });
    }
  });
});

describe("the playground refuses input it cannot decode", () => {
  test("an unknown extension is a decode error with the registry message", async () => {
    const example = PLAYGROUND_EXAMPLES.find(
      (item) => item.name === "unknown-extension",
    );
    if (example === undefined) throw new Error("the example is missing");
    const result = await run(example.json);
    expect(result.kind).toBe("decode-error");
    if (result.kind !== "decode-error") return;
    expect(result.decodeIssues.map((issue) => issue.message)).toContain(
      "Unknown extension demo.unknown.",
    );
  });

  test("a syntax error is a decode error with one issue at the root path", async () => {
    const result = await run('{"id":');
    expect(result.kind).toBe("decode-error");
    if (result.kind !== "decode-error") return;
    expect(result.decodeIssues).toHaveLength(1);
    expect(result.decodeIssues[0]?.path).toBe("");
  });

  test("input longer than the limit is refused with the size message", async () => {
    expect(MAX_INPUT_LENGTH).toBe(1_000_000);
    const result = await run("x".repeat(MAX_INPUT_LENGTH + 1));
    expect(result).toEqual({
      kind: "decode-error",
      decodeIssues: [{ path: "", message: "The input is larger than 1 MB." }],
    });
  });
});

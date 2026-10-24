// START_MODULE_CONTRACT
//   PURPOSE: Prove that the code the first-locus guide quotes runs: the demo model has no diagnostics, the composition has no conflict, inspect describes demo:greeter and the greet capability answers through the kernel.
//   SCOPE: The exports of guide-snippets.ts, run with the real @telos/kernel. No file access.
//   DEPENDS: M-KERNEL-API, M-DOCS-CONTENT
//   LINKS: V-M-DOCS-CONTENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { invoke } from "@telos/kernel";
import { Greeter, demoModel, greeter, inspectGreeter } from "./guide-snippets";

describe("guide snippets: the first-locus code runs", () => {
  test("the demo model has no diagnostics", () => {
    expect(demoModel.diagnostics).toEqual([]);
  });

  test("composing Purpose and Greeting has no conflict", () => {
    expect(Greeter.conflicts).toEqual([]);
  });

  test("inspect describes demo:greeter with its extensions and capability", async () => {
    const description = await Effect.runPromise(inspectGreeter);
    expect(description.id).toBe("demo:greeter");
    expect(description.extensions.map((extension) => extension.id)).toEqual([
      "telos.purpose",
      "demo.greeting",
    ]);
    expect(
      description.capabilities.map((capability) => capability.name),
    ).toEqual(["greet"]);
  });

  test("greet invoked by demo:greeter answers with the greeting", async () => {
    const outcome = await Effect.runPromise(
      invoke(
        demoModel,
        greeter.capability("greet"),
        { name: "Ada" },
        {
          via: "demo:greeter",
        },
      ),
    );
    expect(outcome).toEqual({ ok: true, output: { text: "Hello, Ada." } });
  });
});

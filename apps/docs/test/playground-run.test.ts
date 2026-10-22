// START_MODULE_CONTRACT
//   PURPOSE: Prove that the playground runs the real @telos/locus package on the example inputs and reports the same diagnostics, revision ids and decode issues as the package does (FR-019, FR-020).
//   SCOPE: runFabric and relationRows on the valid, invalid and relations examples, on decode errors and on a hand-built Fabric. Bun only; no DOM.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SHA_PATTERN - the shape of every Revision id
//   CHECKOUT_ID - the Revision id of shop:checkout in the valid example
//   DECODE_ERROR_FABRIC - the Fabric of the decode-error example in docs/guides/examples.md
//   validatedOf - the validated outcome, failing the test for any other outcome
//   codesOf - the diagnostic codes of a report in order
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  decodeFabric,
  defineFabric,
  defineLocus,
  type FabricJson,
  validateFabric,
} from "@telos/locus";
import { examples } from "@telos/locus/specs";
import { Effect } from "effect";
import {
  type FabricOutcome,
  relationRows,
  runFabric,
} from "@/playground/run-fabric";

const SHA_PATTERN = /^sha256:[0-9a-f]{64}$/;
const CHECKOUT_ID =
  "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6";

// The Fabric of the decode-error example in docs/guides/examples.md.
const DECODE_ERROR_FABRIC = {
  id: "shop:system",
  loci: [
    {
      id: "shop:a",
      charter: { purpose: "A.", responsibilities: ["Do A"] },
      relations: [{ kind: "owns", target: "shop:b" }],
    },
  ],
};

function validatedOf(
  outcome: FabricOutcome,
): Extract<FabricOutcome, { kind: "validated" }> {
  if (outcome.kind !== "validated") {
    throw new Error(`expected a validated outcome, got ${outcome.kind}`);
  }
  return outcome;
}

function codesOf(report: {
  readonly diagnostics: ReadonlyArray<{ readonly code: string }>;
}) {
  return report.diagnostics.map((d) => d.code);
}

describe("runFabric on the valid example", () => {
  test("validates with no diagnostics and gives the Revision of each Locus in order", async () => {
    const outcome = validatedOf(
      await runFabric(JSON.stringify(examples.valid)),
    );
    expect(outcome.report.valid).toBe(true);
    expect(outcome.report.diagnostics).toEqual([]);
    if (!outcome.revisions.ok) throw new Error(outcome.revisions.message);
    expect(outcome.revisions.rows.map((row) => row.locus)).toEqual([
      "shop:storefront",
      "shop:checkout",
      "shop:payment",
    ]);
    const checkout = outcome.revisions.rows.find(
      (row) => row.locus === "shop:checkout",
    );
    expect(checkout?.id).toBe(CHECKOUT_ID);
    for (const row of outcome.revisions.rows) {
      expect(row.id).toMatch(SHA_PATTERN);
    }
  });
});

describe("runFabric on the invalid example", () => {
  test("reports exactly the two diagnostics on shop:checkout", async () => {
    const outcome = validatedOf(
      await runFabric(JSON.stringify(examples.invalid)),
    );
    expect(outcome.report.valid).toBe(false);
    expect(codesOf(outcome.report)).toEqual([
      "charter.entry-duplicate",
      "charter.purpose-blank",
    ]);
    for (const diagnostic of outcome.report.diagnostics) {
      expect(diagnostic.subject).toBe("shop:checkout");
    }
  });
});

describe("runFabric on the relations example", () => {
  test("reports the refines cycle and the missing target", async () => {
    const outcome = validatedOf(
      await runFabric(JSON.stringify(examples.relations)),
    );
    expect(codesOf(outcome.report)).toEqual([
      "relation.refines-cycle",
      "relation.target-missing",
    ]);
    expect(outcome.relations).toEqual([
      {
        from: "shop:storefront",
        kind: "depends-on",
        target: "shop:ghost",
        problems: ["target-missing"],
      },
      {
        from: "shop:checkout",
        kind: "refines",
        target: "shop:payment",
        problems: ["refines-cycle"],
      },
      {
        from: "shop:payment",
        kind: "refines",
        target: "shop:checkout",
        problems: ["refines-cycle"],
      },
    ]);
  });
});

describe("runFabric decode errors", () => {
  test("malformed JSON gives one issue at the whole input", async () => {
    const outcome = await runFabric("{");
    if (outcome.kind !== "decode-error") {
      throw new Error(`expected decode-error, got ${outcome.kind}`);
    }
    expect(outcome.issues.map((issue) => issue.path)).toEqual([""]);
  });

  test("text over 1,048,576 characters is refused with one issue at the whole input", async () => {
    const outcome = await runFabric("x".repeat(1_048_577));
    if (outcome.kind !== "decode-error") {
      throw new Error(`expected decode-error, got ${outcome.kind}`);
    }
    expect(outcome.issues.map((issue) => issue.path)).toEqual([""]);
  });

  test("an unknown Relation kind gives one issue at its path and never a validation", async () => {
    const outcome = await runFabric(JSON.stringify(DECODE_ERROR_FABRIC));
    if (outcome.kind !== "decode-error") {
      throw new Error(`expected decode-error, got ${outcome.kind}`);
    }
    expect(outcome.issues.map((issue) => issue.path)).toEqual([
      "loci[0].relations[0].kind",
    ]);
  });
});

describe("a refines Relation to a Locus outside the cycle", () => {
  test("is not marked as in a refines cycle, while the two cycle ends are", async () => {
    // shop:a and shop:b refine each other, and form the only cycle. Two
    // Relations lead out of or into that cycle from Loci outside it:
    // shop:a refines shop:d (member to outside), and shop:c refines shop:a
    // (outside into member). Neither outside Relation is in a cycle.
    const text = JSON.stringify({
      id: "shop:system",
      loci: [
        {
          id: "shop:a",
          charter: { purpose: "A.", responsibilities: ["Do A"] },
          relations: [
            { kind: "refines", target: "shop:b" },
            { kind: "refines", target: "shop:d" },
          ],
        },
        {
          id: "shop:b",
          charter: { purpose: "B.", responsibilities: ["Do B"] },
          relations: [{ kind: "refines", target: "shop:a" }],
        },
        {
          id: "shop:c",
          charter: { purpose: "C.", responsibilities: ["Do C"] },
          relations: [{ kind: "refines", target: "shop:a" }],
        },
        {
          id: "shop:d",
          charter: { purpose: "D.", responsibilities: ["Do D"] },
        },
      ],
    });
    const outcome = validatedOf(await runFabric(text));
    expect(codesOf(outcome.report)).toEqual(["relation.refines-cycle"]);
    expect(outcome.relations).toEqual([
      {
        from: "shop:a",
        kind: "refines",
        target: "shop:b",
        problems: ["refines-cycle"],
      },
      {
        from: "shop:a",
        kind: "refines",
        target: "shop:d",
        problems: [],
      },
      {
        from: "shop:b",
        kind: "refines",
        target: "shop:a",
        problems: ["refines-cycle"],
      },
      {
        from: "shop:c",
        kind: "refines",
        target: "shop:a",
        problems: [],
      },
    ]);
  });
});

describe("relationRows", () => {
  test("marks a self refines and a duplicate depends-on, and never marks the self row as a cycle", () => {
    const fabric = defineFabric({
      id: "shop:system",
      loci: [
        defineLocus({
          id: "shop:a",
          charter: { purpose: "A.", responsibilities: ["Do A"] },
          relations: [{ kind: "refines", target: "shop:a" }],
        }),
        defineLocus({
          id: "shop:b",
          charter: { purpose: "B.", responsibilities: ["Do B"] },
          relations: [
            { kind: "depends-on", target: "shop:c" },
            { kind: "depends-on", target: "shop:c" },
          ],
        }),
        defineLocus({
          id: "shop:c",
          charter: { purpose: "C.", responsibilities: ["Do C"] },
        }),
      ],
    });
    const rows = relationRows(fabric, validateFabric(fabric));
    expect(rows.map((row) => row.problems)).toEqual([
      ["self"],
      ["duplicate"],
      ["duplicate"],
    ]);
  });
});

describe("the playground path is the package path (FR-020)", () => {
  for (const [name, example] of [
    ["valid", examples.valid],
    ["invalid", examples.invalid],
    ["relations", examples.relations],
  ] as const) {
    test(`runFabric report equals validateFabric of the decoded ${name} example`, async () => {
      const outcome = validatedOf(
        await runFabric(JSON.stringify(example as FabricJson)),
      );
      const direct = validateFabric(
        Effect.runSync(decodeFabric(example as FabricJson)),
      );
      expect(outcome.report).toEqual(direct);
    });
  }
});

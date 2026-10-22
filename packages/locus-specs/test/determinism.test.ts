import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  createRevision,
  decodeFabric,
  decodeLocus,
  type FabricJson,
  type LocusJson,
  validateFabric,
} from "@telos/locus";
import { catalogue } from "../src/catalogue";
import { revisionGoldens as exportedGoldens } from "../src/goldens";

// NFR-001 on the Bun side. The golden ids are recorded here, as the contract's
// Determinism adapter requires. They were computed independently of this code with
// `shasum -a 256` over the canonical form (version 1). If a value does not match,
// compare the fixture with the WP08 prompt before changing anything here.
const revisionGoldens: Readonly<Record<string, `sha256:${string}`>> = {
  "LOC-008.a":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-008.b":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.a":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.b":
    "sha256:a7ab044ffa34fd3a0e5e2e044da0f49c7757c1e3cabc276173f18c698ddfe20b",
  "LOC-034.a":
    "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-034.b":
    "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-039.a":
    "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
  "LOC-039.b":
    "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
};

const revisionCompareRecords = catalogue.filter(
  (s) => s.check.kind === "revision-compare",
);

const revisionIdOf = (json: LocusJson): Promise<string> =>
  Effect.runPromise(
    decodeLocus(json).pipe(
      Effect.flatMap(createRevision),
      Effect.map((revision) => revision.id),
    ),
  );

// The golden for one side of a fixture. A missing key is a test failure, not a silent undefined.
const goldenOf = (key: string): string => {
  const value: string | undefined = revisionGoldens[key];
  if (value === undefined) {
    throw new Error(`no golden Revision id recorded for ${key}`);
  }
  return value;
};

describe("revision id goldens", () => {
  test("the recorded literals equal the exported revisionGoldens", () => {
    expect(exportedGoldens).toStrictEqual(revisionGoldens);
  });

  test("every revision-compare record has both golden keys", () => {
    expect(revisionCompareRecords.length).toBe(4);
    for (const spec of revisionCompareRecords) {
      expect(goldenOf(`${spec.id}.a`)).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(goldenOf(`${spec.id}.b`)).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  for (const spec of revisionCompareRecords) {
    test(`${spec.id} Revision ids equal the goldens`, async () => {
      if (spec.check.kind !== "revision-compare") {
        throw new Error("unreachable: filtered to revision-compare");
      }
      expect(await revisionIdOf(spec.check.a)).toBe(goldenOf(`${spec.id}.a`));
      expect(await revisionIdOf(spec.check.b)).toBe(goldenOf(`${spec.id}.b`));
    });
  }
});

describe("validation determinism", () => {
  test("validating LOC-030 100 times gives byte-identical output", async () => {
    const record = catalogue.find((s) => s.id === "LOC-030");
    if (record === undefined || record.check.kind !== "validate") {
      throw new Error("LOC-030 must be a validate record");
    }
    const json: FabricJson = record.check.fabric;
    const fabric = await Effect.runPromise(decodeFabric(json));
    const outputs = Array.from({ length: 100 }, () =>
      JSON.stringify(validateFabric(fabric)),
    );
    expect(outputs.length).toBe(100);
    expect(new Set(outputs).size).toBe(1);
  });
});

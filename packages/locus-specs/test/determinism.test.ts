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
import { revisionGoldens } from "../src/goldens";

// NFR-001 on the Bun side. The golden ids were computed independently with
// `shasum -a 256` over the canonical form (version 1) and are not produced here.

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

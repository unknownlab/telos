import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { catalogue } from "../../specs/catalogue";
import { runSpecification } from "../../specs/runner";

// One test per catalogue record. A record passes only when its observed value
// equals the expectation written in the record.
for (const spec of catalogue) {
  test(`${spec.id} ${spec.title}`, async () => {
    const result = await Effect.runPromise(runSpecification(spec));
    if (result.status !== "pass") {
      console.error(
        JSON.stringify(
          { expected: result.expected, observed: result.observed },
          null,
          2,
        ),
      );
    }
    expect(result.status).toBe("pass");
  });
}

// The Catalogue (version 1) table of specifications.md, as
// [id, kind, polarity, invariant | null, scenario | null].
const contractTable: ReadonlyArray<
  readonly [
    string,
    string,
    "positive" | "negative",
    string | null,
    string | null,
  ]
> = [
  ["LOC-001", "validate", "positive", "INV-001", null],
  ["LOC-002", "validate", "negative", "INV-001", "NS-001"],
  ["LOC-003", "validate", "negative", "INV-001", "NS-001"],
  ["LOC-004", "validate", "negative", "INV-001", "NS-001"],
  ["LOC-005", "validate", "negative", "INV-001", "NS-001"],
  ["LOC-006", "validate", "positive", "INV-002", null],
  ["LOC-007", "validate", "negative", "INV-002", "NS-002"],
  ["LOC-008", "revision-compare", "positive", "INV-003", null],
  ["LOC-009", "revision-compare", "negative", "INV-003", null],
  ["LOC-010", "validate", "positive", "INV-004", null],
  ["LOC-011", "validate", "negative", "INV-004", "NS-003"],
  ["LOC-012", "validate", "negative", "INV-004", "NS-004"],
  ["LOC-013", "validate", "negative", "INV-004", "NS-004"],
  ["LOC-014", "validate", "negative", "INV-004", "NS-004"],
  ["LOC-015", "validate", "positive", "INV-005", null],
  ["LOC-016", "validate", "negative", "INV-005", "NS-005"],
  ["LOC-017", "validate", "negative", "INV-005", "NS-006"],
  ["LOC-018", "validate", "negative", "INV-006", "NS-007"],
  ["LOC-019", "validate", "negative", "INV-006", "NS-007"],
  ["LOC-020", "validate", "positive", "INV-006", null],
  ["LOC-021", "validate", "positive", "INV-007", null],
  ["LOC-022", "decode", "negative", "INV-007", "NS-008"],
  ["LOC-023", "validate", "negative", "INV-007", "NS-009"],
  ["LOC-024", "validate", "negative", "INV-007", "NS-009"],
  ["LOC-025", "validate", "negative", "INV-007", "NS-009"],
  ["LOC-026", "validate", "positive", "INV-007", null],
  ["LOC-027", "validate", "negative", "INV-008", "NS-010"],
  ["LOC-028", "validate", "positive", "INV-008", "NS-011"],
  ["LOC-029", "validate", "positive", "INV-008", null],
  ["LOC-030", "validate", "negative", "INV-009", "NS-012"],
  ["LOC-031", "validate-stable", "positive", "INV-009", null],
  ["LOC-032", "validate-stable", "positive", "INV-009", null],
  ["LOC-033", "revision-immutable", "negative", "INV-010", "NS-013"],
  ["LOC-034", "revision-compare", "positive", "INV-010", null],
  ["LOC-035", "history", "positive", "INV-011", null],
  ["LOC-036", "history", "negative", "INV-011", "NS-014"],
  ["LOC-037", "history", "negative", "INV-011", "NS-015"],
  ["LOC-038", "history", "positive", "INV-011", null],
  ["LOC-039", "revision-compare", "positive", "INV-012", null],
  ["LOC-040", "diff", "negative", "INV-012", null],
  ["LOC-041", "diff", "negative", "INV-012", "NS-016"],
  ["LOC-042", "decode", "negative", null, "NS-017"],
  ["LOC-043", "decode", "negative", null, "NS-017"],
  ["LOC-044", "validate", "positive", null, null],
];

const invariantIds = Array.from(
  { length: 12 },
  (_, i) => `INV-${String(i + 1).padStart(3, "0")}`,
);
const scenarioIds = Array.from(
  { length: 17 },
  (_, i) => `NS-${String(i + 1).padStart(3, "0")}`,
);

describe("catalogue integrity", () => {
  test("ids are LOC-001 to LOC-044, unique and in sequence", () => {
    const expected = Array.from(
      { length: 44 },
      (_, i) => `LOC-${String(i + 1).padStart(3, "0")}`,
    );
    const ids: string[] = catalogue.map((s) => s.id);
    expect(ids).toEqual(expected);
    expect(new Set(ids).size).toBe(catalogue.length);
  });

  test("every title is a non-blank sentence", () => {
    for (const spec of catalogue) {
      expect(spec.title.trim().length).toBeGreaterThan(0);
    }
  });

  test("every record survives a JSON round trip unchanged", () => {
    for (const spec of catalogue) {
      expect(JSON.parse(JSON.stringify(spec))).toStrictEqual(spec);
    }
  });

  test("invariants match INV-001 to INV-012 and are empty only for decode records and LOC-044", () => {
    for (const spec of catalogue) {
      for (const invariant of spec.invariants) {
        expect(invariant).toMatch(/^INV-0(0[1-9]|1[0-2])$/);
      }
      if (spec.invariants.length === 0) {
        expect(spec.check.kind === "decode" || spec.id === "LOC-044").toBe(
          true,
        );
      }
    }
  });

  test("scenarios match NS-001 to NS-017", () => {
    for (const spec of catalogue) {
      for (const scenario of spec.scenarios) {
        expect(scenario).toMatch(/^NS-0(0[1-9]|1[0-7])$/);
      }
    }
  });

  test("every kind, polarity, invariant and scenario matches the contract table", () => {
    expect(catalogue.length).toBe(contractTable.length);
    for (const [id, kind, polarity, invariant, scenario] of contractTable) {
      const spec = catalogue.find((s) => s.id === id);
      expect(spec).toBeDefined();
      if (spec === undefined) continue;
      const actualKind: string = spec.check.kind;
      const actualInvariants: string[] = [...spec.invariants];
      const actualScenarios: string[] = [...spec.scenarios];
      expect(actualKind).toBe(kind);
      expect(spec.polarity).toBe(polarity);
      expect(actualInvariants).toEqual(invariant === null ? [] : [invariant]);
      expect(actualScenarios).toEqual(scenario === null ? [] : [scenario]);
    }
  });

  test("every INV-001 to INV-012 has at least one positive and one negative record (NFR-007)", () => {
    for (const invariant of invariantIds) {
      const records = catalogue.filter((s) =>
        (s.invariants as ReadonlyArray<string>).includes(invariant),
      );
      expect(records.some((s) => s.polarity === "positive")).toBe(true);
      expect(records.some((s) => s.polarity === "negative")).toBe(true);
    }
  });

  test("every NS-001 to NS-017 is referenced by some record", () => {
    for (const scenario of scenarioIds) {
      expect(
        catalogue.some((s) =>
          (s.scenarios as ReadonlyArray<string>).includes(scenario),
        ),
      ).toBe(true);
    }
  });
});

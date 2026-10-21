import { describe, expect, test } from "bun:test";
import {
  defineFabric,
  defineLocus,
  type Fabric,
  type LocusInput,
  validateFabric,
} from "../src/index";

const charter = (purpose: string, responsibilities: string[]) => ({
  purpose,
  responsibilities,
});

// A Fabric that exercises every rule: malformed and duplicated identities,
// Charter problems, missing and cyclic owners, and Relation problems.
const BASE: LocusInput[] = [
  { id: "Shop:Bad", charter: charter("Bad identity.", ["Do bad"]) },
  {
    id: "shop:blank",
    charter: {
      purpose: " ",
      responsibilities: ["Take orders", "Pay", "Pay"],
      excluded: ["", "x"],
      successConditions: ["ok", "ok"],
    },
    relations: [
      { kind: "depends-on", target: "shop:void" },
      { kind: "refines", target: "shop:blank" },
    ],
  },
  {
    id: "shop:orphan",
    owner: "shop:nobody",
    charter: charter("Orphan.", ["Do"]),
    relations: [
      { kind: "verifies", target: "shop:lost" },
      { kind: "verifies", target: "shop:lost" },
    ],
  },
  {
    id: "shop:lost",
    charter: charter("Lost.", ["Do lost"]),
    relations: [{ kind: "depends-on", target: "shop:void" }],
  },
  {
    id: "shop:r1",
    charter: charter("Ring one.", ["Do r1"]),
    relations: [{ kind: "refines", target: "shop:r2" }],
  },
  {
    id: "shop:r2",
    charter: charter("Ring two.", ["Do r2"]),
    relations: [{ kind: "refines", target: "shop:r3" }],
  },
  {
    id: "shop:r3",
    charter: charter("Ring three.", ["Do r3"]),
    relations: [{ kind: "refines", target: "shop:r1" }],
  },
  {
    id: "shop:o1",
    owner: "shop:o2",
    charter: charter("Owner one.", ["Do o1"]),
  },
  {
    id: "shop:o2",
    owner: "shop:o1",
    charter: charter("Owner two.", ["Do o2"]),
  },
];

function rotate<T>(items: ReadonlyArray<T>, k: number): T[] {
  const n = items.length;
  if (n === 0) return [];
  const shift = ((k % n) + n) % n;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

function reversedInner(input: LocusInput): LocusInput {
  return {
    ...input,
    charter: {
      ...input.charter,
      responsibilities: [...input.charter.responsibilities].reverse(),
      ...(input.charter.excluded === undefined
        ? {}
        : { excluded: [...input.charter.excluded].reverse() }),
      ...(input.charter.successConditions === undefined
        ? {}
        : {
            successConditions: [...input.charter.successConditions].reverse(),
          }),
    },
    ...(input.relations === undefined
      ? {}
      : { relations: [...input.relations].reverse() }),
  };
}

function fabricOf(loci: LocusInput[]): Fabric {
  return defineFabric({
    id: "shop:system",
    loci: loci.map((l) => defineLocus(l)),
  });
}

describe("validateFabric determinism (NFR-001)", () => {
  test("validating the same Fabric 100 times gives byte-identical JSON", () => {
    const fabric = fabricOf(BASE);
    const first = JSON.stringify(validateFabric(fabric));
    expect(JSON.parse(first).diagnostics.length).toBeGreaterThan(0);
    for (let i = 0; i < 100; i += 1) {
      expect(JSON.stringify(validateFabric(fabric))).toBe(first);
    }
  });

  test("reordering Loci, Charter entries and Relations never changes the output", () => {
    const expected = JSON.stringify(validateFabric(fabricOf(BASE)));
    const permutations: LocusInput[][] = [
      [...BASE].reverse(),
      rotate(BASE, 1),
      rotate(BASE, 4),
      [...BASE].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      [...BASE].sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0)),
    ];
    for (const loci of permutations) {
      expect(JSON.stringify(validateFabric(fabricOf(loci)))).toBe(expected);
      const innerReversed = loci.map(reversedInner);
      expect(JSON.stringify(validateFabric(fabricOf(innerReversed)))).toBe(
        expected,
      );
    }
  });
});

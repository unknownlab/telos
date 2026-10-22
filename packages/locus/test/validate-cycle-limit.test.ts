import { describe, expect, test } from "bun:test";
import {
  defineFabric,
  defineLocus,
  type Fabric,
  type LocusDefinition,
  type Relation,
  type ValidationReport,
  validateFabric,
} from "../src/index";

// Counts of elementary cycles below were checked by a brute-force enumeration
// outside this suite: K3 has 5, K4 has 20, K9 has 125,664, five disjoint K4
// graphs have 100 and five disjoint K4 graphs plus one 2-cycle have 101.

const CAP = 100;

function rel(target: string): Relation {
  return { kind: "refines", target };
}

function locus(id: string, relations: Relation[] = []): LocusDefinition {
  return defineLocus({
    id,
    charter: { purpose: `Purpose of ${id}.`, responsibilities: [`Do ${id}`] },
    relations,
  });
}

function fabric(loci: LocusDefinition[], id = "shop:system"): Fabric {
  return defineFabric({ id, loci });
}

// Every Locus refines every other Locus of its group.
function completeGroup(prefix: string, size: number): LocusDefinition[] {
  const names = Array.from(
    { length: size },
    (_, i) => `shop:${prefix}-${String.fromCharCode(97 + i)}`,
  );
  return names.map((id) =>
    locus(
      id,
      names.filter((other) => other !== id).map((other) => rel(other)),
    ),
  );
}

function cyclesOf(report: ValidationReport) {
  return report.diagnostics.filter((d) => d.code === "relation.refines-cycle");
}

function limitsOf(report: ValidationReport) {
  return report.diagnostics.filter(
    (d) => d.code === "relation.refines-cycle-limit",
  );
}

// Deterministic pseudo-random permutation, so the test is repeatable.
function shuffled<T>(items: ReadonlyArray<T>, seed: number): T[] {
  const out = [...items];
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// The same content as `loci`, with the Loci and each Locus's Relations shuffled.
function reorder(loci: LocusDefinition[], seed: number): LocusDefinition[] {
  return shuffled(loci, seed).map((l) =>
    defineLocus({
      id: l.id,
      charter: l.charter,
      relations: shuffled(l.relations, seed + 1),
    }),
  );
}

describe("validateFabric: refines cycles are capped at 100", () => {
  test("nine mutually refining Loci report 100 cycles and one limit, in under 1 s", () => {
    const f = fabric(completeGroup("k9", 9));
    const start = performance.now();
    const report = validateFabric(f);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(report.valid).toBe(false);
    expect(cyclesOf(report)).toHaveLength(CAP);
    expect(report.diagnostics).toHaveLength(CAP + 1);
    expect(limitsOf(report)).toEqual([
      expect.objectContaining({
        code: "relation.refines-cycle-limit",
        scope: "fabric",
        subject: "shop:system",
        path: "relations",
        detail: "100",
      }),
    ]);
    const limit = limitsOf(report)[0]!;
    expect(limit).not.toHaveProperty("members");
  });

  test("every reported cycle is rotated to its smallest member, and the 2-cycle through the smallest pair sorts first", () => {
    const cycles = cyclesOf(validateFabric(fabric(completeGroup("k9", 9))));
    // The search from shop:k9-a alone has far more than 100 cycles, so the cap
    // stops it before any other start is searched: every reported cycle has
    // shop:k9-a as its smallest member. The final sort puts the shortest first.
    expect(cycles[0]!.members).toEqual(["shop:k9-a", "shop:k9-b"]);
    for (const d of cycles) expect(d.subject).toBe("shop:k9-a");
  });

  test("the output for nine mutually refining Loci is byte-identical for any input order", () => {
    const loci = completeGroup("k9", 9);
    const expected = JSON.stringify(validateFabric(fabric(loci)));
    for (const seed of [1, 7, 42, 2026]) {
      const actual = JSON.stringify(
        validateFabric(fabric(reorder(loci, seed))),
      );
      expect(actual).toBe(expected);
    }
    const reversed = JSON.stringify(
      validateFabric(fabric([...loci].reverse())),
    );
    expect(reversed).toBe(expected);
  });

  test("exactly 100 cycles give 100 cycle diagnostics and no limit", () => {
    // Five disjoint complete graphs of four Loci: 5 x 20 = 100 cycles.
    const loci = ["c1", "c2", "c3", "c4", "c5"].flatMap((p) =>
      completeGroup(p, 4),
    );
    const report = validateFabric(fabric(loci));
    expect(cyclesOf(report)).toHaveLength(CAP);
    expect(limitsOf(report)).toEqual([]);
    expect(report.diagnostics).toHaveLength(CAP);
  });

  test("101 cycles give 100 cycle diagnostics and one limit", () => {
    // The five groups above, plus one 2-cycle whose identities sort last. The
    // 101st cycle must be found for the limit to be reported, and the first 100
    // reported are the ones in the groups that come first in search order.
    const loci = [
      ...["c1", "c2", "c3", "c4", "c5"].flatMap((p) => completeGroup(p, 4)),
      locus("shop:z-a", [rel("shop:z-b")]),
      locus("shop:z-b", [rel("shop:z-a")]),
    ];
    const report = validateFabric(fabric(loci));
    expect(cyclesOf(report)).toHaveLength(CAP);
    expect(cyclesOf(report).some((d) => d.subject === "shop:z-a")).toBe(false);
    expect(limitsOf(report)).toHaveLength(1);
    expect(limitsOf(report)[0]).toMatchObject({
      scope: "fabric",
      subject: "shop:system",
      path: "relations",
      detail: "100",
    });
    expect(report.diagnostics).toHaveLength(CAP + 1);
    expect(report.valid).toBe(false);
  });

  test("a refines cycle of three is unchanged: one cycle and no limit", () => {
    const f = fabric([
      locus("shop:a", [rel("shop:b")]),
      locus("shop:b", [rel("shop:c")]),
      locus("shop:c", [rel("shop:a")]),
    ]);
    const report = validateFabric(f);
    expect(report.diagnostics).toEqual([
      expect.objectContaining({
        code: "relation.refines-cycle",
        scope: "locus",
        subject: "shop:a",
        path: "relations",
        members: ["shop:a", "shop:b", "shop:c"],
      }),
    ]);
  });

  test("a refines chain with no cycle is valid and has no limit", () => {
    const chain = Array.from({ length: 9 }, (_, i) =>
      locus(`shop:n${i}`, i === 8 ? [] : [rel(`shop:n${i + 1}`)]),
    );
    expect(validateFabric(fabric(chain))).toEqual({
      valid: true,
      diagnostics: [],
    });
  });
});

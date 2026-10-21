import { describe, expect, test } from "bun:test";
import {
  defineFabric,
  defineLocus,
  type Fabric,
  type LocusDefinition,
  type Relation,
  type RelationKind,
  type ValidationReport,
  validateFabric,
} from "../src/index";

const strip = (r: ValidationReport) =>
  r.diagnostics.map(({ message: _m, ...rest }) => rest);

interface Spec {
  purpose?: string;
  responsibilities?: string[];
  excluded?: string[];
  successConditions?: string[];
  owner?: string;
  relations?: Relation[];
}

function locus(id: string, spec: Spec = {}): LocusDefinition {
  return defineLocus({
    id,
    charter: {
      purpose: spec.purpose ?? `Purpose of ${id}.`,
      responsibilities: spec.responsibilities ?? [`Do ${id}`],
      ...(spec.excluded === undefined ? {} : { excluded: spec.excluded }),
      ...(spec.successConditions === undefined
        ? {}
        : { successConditions: spec.successConditions }),
    },
    ...(spec.owner === undefined ? {} : { owner: spec.owner }),
    ...(spec.relations === undefined ? {} : { relations: spec.relations }),
  });
}

function rel(kind: RelationKind, target: string): Relation {
  return { kind, target };
}

function fabric(loci: LocusDefinition[], id = "shop:system"): Fabric {
  return defineFabric({ id, loci });
}

describe("validateFabric: identity and duplicates", () => {
  test("US1-1: a valid Fabric gives an empty report", () => {
    const f = fabric([
      locus("shop:storefront"),
      locus("shop:checkout", {
        owner: "shop:storefront",
        relations: [rel("depends-on", "shop:payment")],
      }),
      locus("shop:payment", { owner: "shop:storefront" }),
    ]);
    expect(validateFabric(f)).toEqual({ valid: true, diagnostics: [] });
  });

  test("US1-2: malformed identity, blank purpose and missing target are all reported", () => {
    const f = fabric([
      locus("Shop:Checkout", {
        purpose: " ",
        responsibilities: ["Take orders"],
        relations: [rel("depends-on", "shop:payment")],
      }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "charter.purpose-blank",
        scope: "locus",
        subject: "Shop:Checkout",
        path: "charter.purpose",
      },
      {
        code: "identity.malformed",
        scope: "locus",
        subject: "Shop:Checkout",
        path: "id",
      },
      {
        code: "relation.target-missing",
        scope: "locus",
        subject: "Shop:Checkout",
        path: "relations",
        detail: "depends-on shop:payment",
      },
    ]);
  });

  test("US1-3: reordering Loci, responsibilities and Relations gives identical JSON", () => {
    const original = fabric([
      locus("Shop:Checkout", {
        purpose: " ",
        responsibilities: ["Take orders", "Pay"],
        relations: [
          rel("depends-on", "shop:payment"),
          rel("refines", "shop:storefront"),
        ],
      }),
      locus("shop:storefront", {
        responsibilities: ["Sell", "Show"],
        relations: [rel("verifies", "shop:void")],
      }),
    ]);
    const reversed = fabric([
      locus("shop:storefront", {
        responsibilities: ["Show", "Sell"],
        relations: [rel("verifies", "shop:void")],
      }),
      locus("Shop:Checkout", {
        purpose: " ",
        responsibilities: ["Pay", "Take orders"],
        relations: [
          rel("refines", "shop:storefront"),
          rel("depends-on", "shop:payment"),
        ],
      }),
    ]);
    const a = validateFabric(original);
    expect(a.valid).toBe(false);
    expect(a.diagnostics.length).toBeGreaterThan(0);
    expect(JSON.stringify(validateFabric(reversed))).toBe(JSON.stringify(a));
  });

  test("a malformed Fabric identity is reported on the Fabric", () => {
    const f = fabric([locus("shop:a")], "System");
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "identity.malformed",
        scope: "fabric",
        subject: "System",
        path: "id",
      },
    ]);
  });

  test("two Loci with the same identity give one duplicate with detail 2", () => {
    const f = fabric([locus("shop:a"), locus("shop:a")]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "identity.duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "id",
        detail: "2",
      },
    ]);
  });

  test("three Loci with the same identity give one duplicate with detail 3", () => {
    const f = fabric([locus("shop:a"), locus("shop:a"), locus("shop:a")]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "identity.duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "id",
        detail: "3",
      },
    ]);
  });
});

describe("validateFabric: Charter", () => {
  test("empty responsibilities give charter.responsibilities-empty", () => {
    const f = fabric([locus("shop:a", { responsibilities: [] })]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "charter.responsibilities-empty",
        scope: "locus",
        subject: "shop:a",
        path: "charter.responsibilities",
      },
    ]);
  });

  test("blank entries give one charter.entry-blank per field", () => {
    const blankResp = fabric([
      locus("shop:a", { responsibilities: ["a", " ", ""] }),
    ]);
    expect(strip(validateFabric(blankResp))).toEqual([
      {
        code: "charter.entry-blank",
        scope: "locus",
        subject: "shop:a",
        path: "charter.responsibilities",
      },
    ]);

    const blankExcluded = fabric([locus("shop:a", { excluded: [""] })]);
    expect(strip(validateFabric(blankExcluded))).toEqual([
      {
        code: "charter.entry-blank",
        scope: "locus",
        subject: "shop:a",
        path: "charter.excluded",
      },
    ]);
  });

  test("duplicated entries give one charter.entry-duplicate per value", () => {
    const f = fabric([
      locus("shop:a", { responsibilities: ["a", "a", "b", "b", "b"] }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "charter.entry-duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "charter.responsibilities",
        detail: "a",
      },
      {
        code: "charter.entry-duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "charter.responsibilities",
        detail: "b",
      },
    ]);
  });

  test("a duplicated success condition is reported on charter.successConditions", () => {
    const f = fabric([locus("shop:a", { successConditions: ["x", "x"] })]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "charter.entry-duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "charter.successConditions",
        detail: "x",
      },
    ]);
  });
});

describe("validateFabric: owner", () => {
  test("an owner that is not in the Fabric gives owner.missing", () => {
    const f = fabric([locus("shop:a", { owner: "shop:ghost" })]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "owner.missing",
        scope: "locus",
        subject: "shop:a",
        path: "owner",
        detail: "shop:ghost",
      },
    ]);
  });

  test("a malformed owner that exists nowhere is reported as missing, not malformed", () => {
    const f = fabric([locus("shop:a", { owner: "Ghost" })]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "owner.missing",
        scope: "locus",
        subject: "shop:a",
        path: "owner",
        detail: "Ghost",
      },
    ]);
  });

  test("a Locus that owns itself gives owner.self only", () => {
    const f = fabric([locus("shop:a", { owner: "shop:a" })]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "owner.self",
        scope: "locus",
        subject: "shop:a",
        path: "owner",
      },
    ]);
  });

  test("an ownership cycle of two is reported once, on its smallest member", () => {
    const f = fabric([
      locus("shop:a", { owner: "shop:b" }),
      locus("shop:b", { owner: "shop:a" }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "owner.cycle",
        scope: "locus",
        subject: "shop:a",
        path: "owner",
        members: ["shop:a", "shop:b"],
      },
    ]);
  });

  test("an ownership cycle of three with a lead-in reports only the cycle", () => {
    const f = fabric([
      locus("shop:c", { owner: "shop:a" }),
      locus("shop:a", { owner: "shop:b" }),
      locus("shop:b", { owner: "shop:c" }),
      locus("shop:x", { owner: "shop:c" }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "owner.cycle",
        scope: "locus",
        subject: "shop:a",
        path: "owner",
        members: ["shop:a", "shop:b", "shop:c"],
      },
    ]);
  });

  test("an ownership chain 200 levels deep is valid", () => {
    const loci = Array.from({ length: 200 }, (_, i) =>
      i === 0
        ? locus("deep:l0")
        : locus(`deep:l${i}`, { owner: `deep:l${i - 1}` }),
    );
    expect(validateFabric(fabric(loci, "deep:system"))).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  test("an owner that is itself invalid still counts as existing", () => {
    const f = fabric([
      locus("shop:child", { owner: "shop:parent" }),
      locus("shop:parent", { purpose: " " }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "charter.purpose-blank",
        scope: "locus",
        subject: "shop:parent",
        path: "charter.purpose",
      },
    ]);
  });
});

describe("validateFabric: Relations", () => {
  test("one Relation of each kind to an existing Locus is valid", () => {
    const f = fabric([
      locus("shop:a", {
        relations: [
          rel("depends-on", "shop:b"),
          rel("refines", "shop:c"),
          rel("satisfies", "shop:d"),
          rel("verifies", "shop:e"),
        ],
      }),
      locus("shop:b"),
      locus("shop:c"),
      locus("shop:d"),
      locus("shop:e"),
    ]);
    expect(validateFabric(f)).toEqual({ valid: true, diagnostics: [] });
  });

  test("the same target with two different kinds is valid", () => {
    const f = fabric([
      locus("shop:a", {
        relations: [rel("depends-on", "shop:b"), rel("refines", "shop:b")],
      }),
      locus("shop:b"),
    ]);
    expect(validateFabric(f)).toEqual({ valid: true, diagnostics: [] });
  });

  test("a Relation to itself gives relation.self and no refines cycle", () => {
    const f = fabric([
      locus("shop:a", { relations: [rel("refines", "shop:a")] }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "relation.self",
        scope: "locus",
        subject: "shop:a",
        path: "relations",
        detail: "refines shop:a",
      },
    ]);
  });

  test("the same kind and target twice gives one relation.duplicate", () => {
    const f = fabric([
      locus("shop:a", {
        relations: [rel("depends-on", "shop:b"), rel("depends-on", "shop:b")],
      }),
      locus("shop:b"),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "relation.duplicate",
        scope: "locus",
        subject: "shop:a",
        path: "relations",
        detail: "depends-on shop:b",
      },
    ]);
  });

  test("a refines cycle of three gives one cycle in cycle order", () => {
    const f = fabric([
      locus("shop:a", { relations: [rel("refines", "shop:b")] }),
      locus("shop:b", { relations: [rel("refines", "shop:c")] }),
      locus("shop:c", { relations: [rel("refines", "shop:a")] }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "relation.refines-cycle",
        scope: "locus",
        subject: "shop:a",
        path: "relations",
        members: ["shop:a", "shop:b", "shop:c"],
      },
    ]);
  });

  test("a depends-on cycle of three is valid", () => {
    const f = fabric([
      locus("shop:a", { relations: [rel("depends-on", "shop:b")] }),
      locus("shop:b", { relations: [rel("depends-on", "shop:c")] }),
      locus("shop:c", { relations: [rel("depends-on", "shop:a")] }),
    ]);
    expect(validateFabric(f)).toEqual({ valid: true, diagnostics: [] });
  });

  test("a refines chain without a cycle is valid", () => {
    const f = fabric([
      locus("shop:a", { relations: [rel("refines", "shop:b")] }),
      locus("shop:b", { relations: [rel("refines", "shop:c")] }),
      locus("shop:c"),
    ]);
    expect(validateFabric(f)).toEqual({ valid: true, diagnostics: [] });
  });

  test("a refines cycle of two reports once and a Locus leading into it is not reported", () => {
    const f = fabric([
      locus("shop:a", { relations: [rel("refines", "shop:b")] }),
      locus("shop:b", { relations: [rel("refines", "shop:c")] }),
      locus("shop:c", { relations: [rel("refines", "shop:b")] }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "relation.refines-cycle",
        scope: "locus",
        subject: "shop:b",
        path: "relations",
        members: ["shop:b", "shop:c"],
      },
    ]);
  });

  test("every refines cycle is reported, including overlapping cycles", () => {
    // Three Loci that all refine each other: five elementary cycles.
    const all = ["shop:a", "shop:b", "shop:c"];
    const f = fabric(
      all.map((id) =>
        locus(id, {
          relations: all
            .filter((other) => other !== id)
            .map((other) => rel("refines", other)),
        }),
      ),
    );
    const report = strip(validateFabric(f));
    expect(report.map((d) => d.code)).toEqual(
      Array(5).fill("relation.refines-cycle"),
    );
    expect(report.map((d) => d.members)).toEqual([
      ["shop:a", "shop:b"],
      ["shop:a", "shop:b", "shop:c"],
      ["shop:a", "shop:c"],
      ["shop:a", "shop:c", "shop:b"],
      ["shop:b", "shop:c"],
    ]);
  });

  test("NS-012: all four unrelated violations are reported in order", () => {
    const f = fabric([
      locus("Shop:Bad"),
      locus("shop:blank", { purpose: " " }),
      locus("shop:orphan", { owner: "shop:nobody" }),
      locus("shop:lost", { relations: [rel("depends-on", "shop:void")] }),
    ]);
    expect(strip(validateFabric(f))).toEqual([
      {
        code: "identity.malformed",
        scope: "locus",
        subject: "Shop:Bad",
        path: "id",
      },
      {
        code: "charter.purpose-blank",
        scope: "locus",
        subject: "shop:blank",
        path: "charter.purpose",
      },
      {
        code: "relation.target-missing",
        scope: "locus",
        subject: "shop:lost",
        path: "relations",
        detail: "depends-on shop:void",
      },
      {
        code: "owner.missing",
        scope: "locus",
        subject: "shop:orphan",
        path: "owner",
        detail: "shop:nobody",
      },
    ]);
  });
});

describe("validateFabric: totality", () => {
  test("an empty Fabric is valid", () => {
    expect(validateFabric(fabric([]))).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  test("odd strings are reported and never throw", () => {
    const f = defineFabric({
      id: "",
      loci: [locus(""), locus("ünï:ß"), locus("🙂:x")],
    });
    let report: ValidationReport | undefined;
    expect(() => {
      report = validateFabric(f);
    }).not.toThrow();
    expect(report?.valid).toBe(false);
    expect(strip(report!)).toContainEqual({
      code: "identity.malformed",
      scope: "locus",
      subject: "",
      path: "id",
    });
  });
});

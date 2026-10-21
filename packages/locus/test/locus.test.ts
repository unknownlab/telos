import { describe, expect, test } from "bun:test";
import { RELATION_KINDS } from "../src/relation";
import {
  defineLocus,
  type LocusDefinition,
  type LocusInput,
} from "../src/locus";

function minimalInput(overrides: Partial<LocusInput> = {}): LocusInput {
  return {
    id: "shop:checkout",
    charter: {
      purpose: "Turn a basket into an order.",
      responsibilities: ["Collect payment details"],
    },
    ...overrides,
  };
}

describe("defineLocus defaults", () => {
  test("missing excluded, successConditions and relations become empty arrays", () => {
    const def = defineLocus(minimalInput());
    expect(def.charter.excluded).toEqual([]);
    expect(def.charter.successConditions).toEqual([]);
    expect(def.relations).toEqual([]);
  });

  test("without owner and metadata the result has no such key", () => {
    const def = defineLocus(minimalInput());
    expect("owner" in def).toBe(false);
    expect("metadata" in def).toBe(false);
  });

  test("owner and metadata are kept when given", () => {
    const def = defineLocus(
      minimalInput({
        owner: "shop:storefront",
        metadata: { team: "payments" },
      }),
    );
    expect(def.owner).toBe("shop:storefront");
    expect(def.metadata).toEqual({ team: "payments" });
  });
});

describe("defineLocus order and duplicates", () => {
  test("responsibilities keep their order and duplicates", () => {
    const def = defineLocus(
      minimalInput({
        charter: { purpose: "p", responsibilities: ["b", "a", "b"] },
      }),
    );
    expect(def.charter.responsibilities).toEqual(["b", "a", "b"]);
  });

  test("relations keep their order and duplicates", () => {
    const def = defineLocus(
      minimalInput({
        relations: [
          { kind: "depends-on", target: "shop:payment" },
          { kind: "refines", target: "shop:cart" },
          { kind: "depends-on", target: "shop:payment" },
        ],
      }),
    );
    expect(def.relations).toEqual([
      { kind: "depends-on", target: "shop:payment" },
      { kind: "refines", target: "shop:cart" },
      { kind: "depends-on", target: "shop:payment" },
    ]);
  });
});

describe("defineLocus freezing", () => {
  function fullInput(): LocusInput {
    return {
      id: "shop:checkout",
      owner: "shop:storefront",
      charter: {
        purpose: "Turn a basket into an order.",
        responsibilities: ["Collect payment details", "Confirm order"],
        excluded: ["Shipping"],
        successConditions: ["Order is confirmed"],
      },
      relations: [{ kind: "depends-on", target: "shop:payment" }],
      metadata: { team: "payments" },
    };
  }

  test("the definition and everything beneath it is frozen", () => {
    const def = defineLocus(fullInput());
    expect(Object.isFrozen(def)).toBe(true);
    expect(Object.isFrozen(def.charter)).toBe(true);
    expect(Object.isFrozen(def.charter.responsibilities)).toBe(true);
    expect(Object.isFrozen(def.charter.excluded)).toBe(true);
    expect(Object.isFrozen(def.charter.successConditions)).toBe(true);
    expect(Object.isFrozen(def.relations)).toBe(true);
    for (const relation of def.relations) {
      expect(Object.isFrozen(relation)).toBe(true);
    }
    expect(def.metadata).toBeDefined();
    expect(Object.isFrozen(def.metadata)).toBe(true);
  });

  test("assigning into the frozen charter throws a TypeError in strict mode", () => {
    const def = defineLocus(fullInput());
    expect(() => {
      (def.charter as { purpose: string }).purpose = "x";
    }).toThrow(TypeError);
    expect(def.charter.purpose).toBe("Turn a basket into an order.");
  });

  test("the result is a copy: mutating the input later does not change it", () => {
    const input = fullInput();
    const def = defineLocus(input);
    (input.charter.responsibilities as string[]).push("Mutated");
    (input.relations as { kind: string; target: string }[]).push({
      kind: "refines",
      target: "shop:cart",
    });
    expect(def.charter.responsibilities).toEqual([
      "Collect payment details",
      "Confirm order",
    ]);
    expect(def.relations).toHaveLength(1);
  });

  test("the input arrays and objects are not frozen by the call", () => {
    const input = fullInput();
    defineLocus(input);
    expect(Object.isFrozen(input.charter)).toBe(false);
    expect(Object.isFrozen(input.charter.responsibilities)).toBe(false);
    expect(Object.isFrozen(input.relations)).toBe(false);
    expect(Object.isFrozen(input.metadata)).toBe(false);
  });
});

describe("defineLocus never throws", () => {
  test("invalid content still constructs", () => {
    const def: LocusDefinition = defineLocus({
      id: "Not An Id",
      charter: { purpose: "", responsibilities: [] },
    });
    expect(def.id).toBe("Not An Id");
    expect(def.charter.purpose).toBe("");
  });

  test("unicode text is preserved exactly", () => {
    const def = defineLocus(
      minimalInput({
        charter: { purpose: "Café — ✓", responsibilities: ["Naïve ✓"] },
      }),
    );
    expect(def.charter.purpose).toBe("Café — ✓");
    expect(def.charter.responsibilities).toEqual(["Naïve ✓"]);
  });
});

describe("RELATION_KINDS", () => {
  test("lists the four kinds in the fixed order", () => {
    expect([...RELATION_KINDS]).toEqual([
      "depends-on",
      "refines",
      "satisfies",
      "verifies",
    ]);
  });

  test("is frozen", () => {
    expect(Object.isFrozen(RELATION_KINDS)).toBe(true);
    expect(() => {
      (RELATION_KINDS as string[]).push("extra");
    }).toThrow(TypeError);
    expect(RELATION_KINDS).toHaveLength(4);
  });
});

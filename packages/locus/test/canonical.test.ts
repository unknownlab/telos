import { describe, expect, test } from "bun:test";
import { canonicalDefinition, canonicalForm } from "../src/canonical";
import { defineLocus } from "../src/locus";

const checkout = defineLocus({
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: {
    purpose: "Turn a basket into an order.",
    responsibilities: ["Collect payment details"],
  },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
});

describe("canonicalForm version 1", () => {
  test("gives exactly the contract string for a full definition", () => {
    expect(canonicalForm(checkout)).toBe(
      '{"v":1,"id":"shop:checkout","charter":{"purpose":"Turn a basket into an order.","responsibilities":["Collect payment details"],"excluded":[],"successConditions":[]},"owner":"shop:storefront","relations":[{"kind":"depends-on","target":"shop:payment"}]}',
    );
  });

  test("an absent owner is written as null", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["r"] },
    });
    expect(canonicalForm(definition)).toContain('"owner":null');
  });

  test("responsibilities are de-duplicated and sorted by UTF-16 code unit", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["b", "a", "b", "B"] },
    });
    expect(canonicalDefinition(definition).charter.responsibilities).toEqual([
      "B",
      "a",
      "b",
    ]);
    expect(canonicalForm(definition)).toContain(
      '"responsibilities":["B","a","b"]',
    );
  });

  test("excluded and successConditions are de-duplicated and sorted", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: {
        purpose: "p",
        responsibilities: ["r"],
        excluded: ["z", "y", "z"],
        successConditions: ["s2", "s1", "s1"],
      },
    });
    const canonical = canonicalDefinition(definition);
    expect(canonical.charter.excluded).toEqual(["y", "z"]);
    expect(canonical.charter.successConditions).toEqual(["s1", "s2"]);
  });

  test("relations are de-duplicated by kind and target, then sorted by kind and target", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["r"] },
      relations: [
        { kind: "refines", target: "x:b" },
        { kind: "depends-on", target: "x:c" },
        { kind: "depends-on", target: "x:a" },
        { kind: "refines", target: "x:b" },
      ],
    });
    expect(canonicalDefinition(definition).relations).toEqual([
      { kind: "depends-on", target: "x:a" },
      { kind: "depends-on", target: "x:c" },
      { kind: "refines", target: "x:b" },
    ]);
    expect(canonicalForm(definition)).toContain(
      '"relations":[{"kind":"depends-on","target":"x:a"},{"kind":"depends-on","target":"x:c"},{"kind":"refines","target":"x:b"}]',
    );
  });

  test("metadata does not appear in the canonical form", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["r"] },
      metadata: { source: "a.ts" },
    });
    expect(canonicalForm(definition)).not.toContain("metadata");
    expect(canonicalForm(definition)).not.toContain("a.ts");
  });

  test("leading spaces are kept, so ' a' and 'a' stay distinct", () => {
    const spaced = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: [" a", "a"] },
    });
    expect(canonicalDefinition(spaced).charter.responsibilities).toEqual([
      " a",
      "a",
    ]);
    const plain = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["a"] },
    });
    expect(canonicalForm(spaced)).not.toBe(canonicalForm(plain));
  });

  test("precomposed and decomposed é stay distinct", () => {
    const precomposed = "é";
    const decomposed = "é";
    const a = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: [precomposed] },
    });
    const b = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: [decomposed] },
    });
    expect(canonicalForm(a)).not.toBe(canonicalForm(b));
  });
});

describe("canonicalDefinition", () => {
  test("has no metadata key and keeps the owner only when present", () => {
    const withMetadata = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["r"] },
      metadata: { team: "payments" },
    });
    const canonical = canonicalDefinition(withMetadata);
    expect("metadata" in canonical).toBe(false);
    expect("owner" in canonical).toBe(false);

    const withOwner = canonicalDefinition(checkout);
    expect(withOwner.owner).toBe("shop:storefront");
  });

  test("is deeply frozen at every level", () => {
    const canonical = canonicalDefinition(checkout);
    expect(Object.isFrozen(canonical)).toBe(true);
    expect(Object.isFrozen(canonical.charter)).toBe(true);
    expect(Object.isFrozen(canonical.charter.responsibilities)).toBe(true);
    expect(Object.isFrozen(canonical.charter.excluded)).toBe(true);
    expect(Object.isFrozen(canonical.charter.successConditions)).toBe(true);
    expect(Object.isFrozen(canonical.relations)).toBe(true);
    expect(Object.isFrozen(canonical.relations[0])).toBe(true);
  });

  test("does not mutate the input definition", () => {
    const definition = defineLocus({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["b", "a"] },
      metadata: { source: "a.ts" },
    });
    canonicalDefinition(definition);
    expect(definition.charter.responsibilities).toEqual(["b", "a"]);
    expect(definition.metadata).toEqual({ source: "a.ts" });
  });
});

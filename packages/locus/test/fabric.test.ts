import { describe, expect, test } from "bun:test";
import { defineFabric } from "../src/fabric";
import { defineLocus, type LocusDefinition } from "../src/locus";

const checkout = defineLocus({
  id: "shop:checkout",
  charter: {
    purpose: "Turn a basket into an order.",
    responsibilities: ["Collect payment details"],
  },
});

const payment = defineLocus({
  id: "shop:payment",
  charter: {
    purpose: "Authorise payments.",
    responsibilities: ["Call the payment provider"],
  },
});

describe("defineFabric", () => {
  test("keeps the id and the order of loci", () => {
    const fabric = defineFabric({
      id: "shop:system",
      loci: [checkout, payment],
    });
    expect(fabric.id).toBe("shop:system");
    expect(fabric.loci.map((l) => l.id)).toEqual([
      "shop:checkout",
      "shop:payment",
    ]);
  });

  test("the result and its loci array are frozen", () => {
    const fabric = defineFabric({
      id: "shop:system",
      loci: [checkout, payment],
    });
    expect(Object.isFrozen(fabric)).toBe(true);
    expect(Object.isFrozen(fabric.loci)).toBe(true);
    for (const locus of fabric.loci) {
      expect(Object.isFrozen(locus)).toBe(true);
      expect(Object.isFrozen(locus.charter)).toBe(true);
    }
  });

  test("a non-frozen plain object passed as a Locus is copied, not frozen in place", () => {
    const member: LocusDefinition = {
      id: "shop:cart",
      charter: {
        purpose: "Hold items.",
        responsibilities: ["Add items"],
        excluded: [],
        successConditions: [],
      },
      relations: [],
    };
    const fabric = defineFabric({ id: "shop:system", loci: [member] });
    expect(Object.isFrozen(member)).toBe(false);
    expect(Object.isFrozen(member.charter.responsibilities)).toBe(false);
    const copied = fabric.loci[0];
    expect(copied).toBeDefined();
    expect(copied).not.toBe(member);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(copied?.id).toBe("shop:cart");
  });

  test("an empty Fabric is allowed", () => {
    const fabric = defineFabric({ id: "shop:empty", loci: [] });
    expect(fabric.loci).toEqual([]);
    expect(Object.isFrozen(fabric.loci)).toBe(true);
  });
});

import { describe, expect, spyOn, test } from "bun:test";
import { Effect } from "effect";
import { defineLocus, type LocusInput } from "../src/locus";
import { createRevision, type Revision } from "../src/revision";

const checkoutInput: LocusInput = {
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: {
    purpose: "Turn a basket into an order.",
    responsibilities: ["Collect payment details"],
  },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
};

const checkout = defineLocus(checkoutInput);

async function revisionOf(input: LocusInput): Promise<Revision> {
  return Effect.runPromise(createRevision(defineLocus(input)));
}

const GOLDEN_CHECKOUT =
  "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6";
const GOLDEN_CAFE =
  "sha256:7dcb7751232a9bb0f92162e1a2c440da7c86aab588c39c99bf2e65806900b457";

describe("golden revision ids", () => {
  test("checkout matches the id computed independently with shasum", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    expect(revision.id).toBe(GOLDEN_CHECKOUT);
  });

  test("a non-ASCII charter matches the id computed independently with shasum", async () => {
    const cafe = defineLocus({
      id: "shop:cafe",
      charter: { purpose: "Café ☕ für alle", responsibilities: ["Brew"] },
    });
    const revision = await Effect.runPromise(createRevision(cafe));
    expect(revision.id).toBe(GOLDEN_CAFE);
  });
});

describe("createRevision identity rules", () => {
  test("creating a revision twice from the same definition gives the same id", async () => {
    const first = await Effect.runPromise(createRevision(checkout));
    const second = await Effect.runPromise(createRevision(checkout));
    expect(first.id).toBe(second.id);
  });

  test("responsibility order and metadata do not change the id", async () => {
    const plain = await revisionOf({
      id: "shop:checkout",
      charter: {
        purpose: "p",
        responsibilities: ["Take orders", "Collect payment details"],
      },
    });
    const reordered = await revisionOf({
      id: "shop:checkout",
      charter: {
        purpose: "p",
        responsibilities: ["Collect payment details", "Take orders"],
      },
      metadata: { source: "checkout.ts", line: "12" },
    });
    expect(reordered.id).toBe(plain.id);
  });

  test("duplicated set entries give the same id as the de-duplicated set", async () => {
    const single = await revisionOf({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["a", "b"] },
    });
    const duplicated = await revisionOf({
      id: "shop:checkout",
      charter: { purpose: "p", responsibilities: ["b", "a", "b", "a"] },
    });
    expect(duplicated.id).toBe(single.id);
  });

  test("a changed purpose gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      charter: {
        ...checkoutInput.charter,
        purpose: "Turn a basket into a paid order.",
      },
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("an added responsibility gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      charter: {
        ...checkoutInput.charter,
        responsibilities: [
          ...checkoutInput.charter.responsibilities,
          "Send receipts",
        ],
      },
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("an added exclusion gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      charter: { ...checkoutInput.charter, excluded: ["Shipping"] },
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("an added success condition gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      charter: {
        ...checkoutInput.charter,
        successConditions: ["Order is paid"],
      },
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("a changed owner gives a different id", async () => {
    const changed = await revisionOf({ ...checkoutInput, owner: "shop:other" });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("a removed owner gives a different id", async () => {
    const { owner: _owner, ...withoutOwner } = checkoutInput;
    const changed = await revisionOf(withoutOwner);
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("an added Relation gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      relations: [
        ...(checkoutInput.relations ?? []),
        { kind: "verifies", target: "shop:payment" },
      ],
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });

  test("a changed Relation kind gives a different id", async () => {
    const changed = await revisionOf({
      ...checkoutInput,
      relations: [{ kind: "refines", target: "shop:payment" }],
    });
    const original = await Effect.runPromise(createRevision(checkout));
    expect(changed.id).not.toBe(original.id);
  });
});

describe("Revision shape", () => {
  test("the id matches sha256 followed by 64 lowercase hex digits", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    expect(revision.id).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("locus equals the definition id", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    expect(revision.locus).toBe("shop:checkout");
  });

  test("the definition is the canonical definition without metadata", async () => {
    const withMetadata = defineLocus({
      ...checkoutInput,
      charter: { ...checkoutInput.charter, responsibilities: ["b", "a"] },
      metadata: { source: "checkout.ts" },
    });
    const revision = await Effect.runPromise(createRevision(withMetadata));
    expect("metadata" in revision.definition).toBe(false);
    expect(revision.definition.charter.responsibilities).toEqual(["a", "b"]);
  });

  test("the revision, its definition, its charter and its arrays are frozen", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    expect(Object.isFrozen(revision)).toBe(true);
    expect(Object.isFrozen(revision.definition)).toBe(true);
    expect(Object.isFrozen(revision.definition.charter)).toBe(true);
    expect(Object.isFrozen(revision.definition.charter.responsibilities)).toBe(
      true,
    );
    expect(Object.isFrozen(revision.definition.relations)).toBe(true);
  });

  test("assigning to the id throws a TypeError", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    expect(() => {
      (revision as { id: string }).id = "sha256:0";
    }).toThrow(TypeError);
    expect(revision.id).toBe(GOLDEN_CHECKOUT);
  });

  test("creating a revision from its own definition gives the same id", async () => {
    const revision = await Effect.runPromise(createRevision(checkout));
    const again = await Effect.runPromise(createRevision(revision.definition));
    expect(again.id).toBe(revision.id);
  });

  test("an invalid definition still gets a revision", async () => {
    const invalid = defineLocus({
      id: "Bad",
      charter: { purpose: "   ", responsibilities: [] },
    });
    const revision = await Effect.runPromise(createRevision(invalid));
    expect(revision.id).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(revision.locus).toBe("Bad");
  });
});

describe("createRevision failures", () => {
  test("a rejected digest fails with DigestError", async () => {
    const spy = spyOn(globalThis.crypto.subtle, "digest").mockImplementation(
      () => Promise.reject(new Error("boom")),
    );
    try {
      const error = await Effect.runPromise(
        Effect.flip(createRevision(checkout)),
      );
      expect(error._tag).toBe("DigestError");
    } finally {
      spy.mockRestore();
    }
  });

  test("missing Web Crypto fails with DigestError", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    try {
      const error = await Effect.runPromise(
        Effect.flip(createRevision(checkout)),
      );
      expect(error._tag).toBe("DigestError");
    } finally {
      if (descriptor === undefined) {
        Reflect.deleteProperty(globalThis, "crypto");
      } else {
        Object.defineProperty(globalThis, "crypto", descriptor);
      }
    }
  });
});

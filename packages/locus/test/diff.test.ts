import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { diffRevisions, type Change } from "../src/diff";
import { defineLocus, type LocusInput } from "../src/locus";
import { createRevision, type Revision } from "../src/revision";

const PURPOSE_BEFORE = "Turn a basket into an order.";
const PURPOSE_AFTER = "Turn a basket into a paid order.";

const checkoutInput: LocusInput = {
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: {
    purpose: PURPOSE_BEFORE,
    responsibilities: ["Collect payment details"],
  },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
};

async function revisionOf(input: LocusInput): Promise<Revision> {
  return Effect.runPromise(createRevision(defineLocus(input)));
}

async function diff(from: LocusInput, to: LocusInput) {
  return Effect.runPromise(
    diffRevisions(await revisionOf(from), await revisionOf(to)),
  );
}

describe("diffRevisions basics", () => {
  test("a changed purpose is the only change, with old and new values", async () => {
    const changeSet = await diff(checkoutInput, {
      ...checkoutInput,
      charter: { ...checkoutInput.charter, purpose: PURPOSE_AFTER },
    });
    expect(changeSet.changes).toEqual([
      {
        part: "charter.purpose",
        kind: "changed",
        from: PURPOSE_BEFORE,
        to: PURPOSE_AFTER,
      },
    ]);
  });

  test("reordered responsibilities and changed metadata give no changes", async () => {
    const from = await revisionOf({
      ...checkoutInput,
      charter: { purpose: "p", responsibilities: ["a", "b"] },
    });
    const to = await revisionOf({
      ...checkoutInput,
      charter: { purpose: "p", responsibilities: ["b", "a"] },
      metadata: { source: "checkout.ts" },
    });
    const changeSet = await Effect.runPromise(diffRevisions(from, to));
    expect(changeSet.changes).toEqual([]);
    expect(from.id).toBe(to.id);
  });

  test("the change set names the locus and both revision ids", async () => {
    const from = await revisionOf(checkoutInput);
    const to = await revisionOf({
      ...checkoutInput,
      charter: { ...checkoutInput.charter, purpose: PURPOSE_AFTER },
    });
    const changeSet = await Effect.runPromise(diffRevisions(from, to));
    expect(changeSet.locus).toBe("shop:checkout");
    expect(changeSet.from).toBe(from.id);
    expect(changeSet.to).toBe(to.id);
  });

  test("the change set is deeply frozen", async () => {
    const changeSet = await diff(checkoutInput, {
      ...checkoutInput,
      charter: { ...checkoutInput.charter, purpose: PURPOSE_AFTER },
    });
    expect(Object.isFrozen(changeSet)).toBe(true);
    expect(Object.isFrozen(changeSet.changes)).toBe(true);
    expect(Object.isFrozen(changeSet.changes[0])).toBe(true);
  });

  test("an owner removed gives a changed owner with a null target, keys in contract order", async () => {
    const { owner: _owner, ...withoutOwner } = checkoutInput;
    const changeSet = await diff(checkoutInput, withoutOwner);
    expect(changeSet.changes).toEqual([
      { part: "owner", kind: "changed", from: "shop:storefront", to: null },
    ]);
    expect(JSON.stringify(changeSet.changes[0])).toBe(
      '{"part":"owner","kind":"changed","from":"shop:storefront","to":null}',
    );
  });

  test("set values are in code-unit order, with removed before added", async () => {
    const changeSet = await diff(
      { ...checkoutInput, charter: { purpose: "p", responsibilities: ["x"] } },
      {
        ...checkoutInput,
        charter: { purpose: "p", responsibilities: ["b", "a", "B"] },
      },
    );
    expect(changeSet.changes).toEqual([
      { part: "charter.responsibilities", kind: "removed", value: "x" },
      { part: "charter.responsibilities", kind: "added", value: "B" },
      { part: "charter.responsibilities", kind: "added", value: "a" },
      { part: "charter.responsibilities", kind: "added", value: "b" },
    ]);
  });
});

describe("diffRevisions full ordering", () => {
  test("one change of every kind comes out in the fixed part order", async () => {
    const from: LocusInput = {
      id: "shop:checkout",
      owner: "shop:storefront",
      charter: {
        purpose: PURPOSE_BEFORE,
        responsibilities: ["a", "b"],
        excluded: ["x"],
        successConditions: ["s1"],
      },
      relations: [{ kind: "depends-on", target: "shop:payment" }],
    };
    const to: LocusInput = {
      id: "shop:checkout",
      owner: "shop:other",
      charter: {
        purpose: PURPOSE_AFTER,
        responsibilities: ["b", "c"],
        excluded: [],
        successConditions: ["s1", "s2"],
      },
      relations: [{ kind: "refines", target: "shop:payment" }],
    };
    const changeSet = await diff(from, to);
    const expected: Change[] = [
      {
        part: "charter.purpose",
        kind: "changed",
        from: PURPOSE_BEFORE,
        to: PURPOSE_AFTER,
      },
      {
        part: "owner",
        kind: "changed",
        from: "shop:storefront",
        to: "shop:other",
      },
      { part: "charter.responsibilities", kind: "removed", value: "a" },
      { part: "charter.responsibilities", kind: "added", value: "c" },
      { part: "charter.excluded", kind: "removed", value: "x" },
      { part: "charter.successConditions", kind: "added", value: "s2" },
      { part: "relations", kind: "removed", value: "depends-on shop:payment" },
      { part: "relations", kind: "added", value: "refines shop:payment" },
    ];
    expect(changeSet.changes).toEqual(expected);
  });
});

describe("diffRevisions locus mismatch", () => {
  test("revisions of two different loci fail with LocusMismatchError", async () => {
    const from = await revisionOf({ ...checkoutInput, id: "shop:a" });
    const to = await revisionOf({ ...checkoutInput, id: "shop:b" });
    const error = await Effect.runPromise(Effect.flip(diffRevisions(from, to)));
    expect(error._tag).toBe("LocusMismatchError");
    expect(error.from).toBe("shop:a");
    expect(error.to).toBe("shop:b");
  });
});

describe("diffRevisions empty exactly when the ids are equal", () => {
  test("over 50 deterministic pairs, changes is empty exactly when the ids match", async () => {
    const base: LocusInput = {
      id: "shop:checkout",
      owner: "shop:storefront",
      charter: {
        purpose: PURPOSE_BEFORE,
        responsibilities: ["Collect payment details", "Take orders"],
        excluded: ["Shipping"],
        successConditions: ["Order is paid"],
      },
      relations: [
        { kind: "depends-on", target: "shop:payment" },
        { kind: "satisfies", target: "shop:payment" },
      ],
    };
    // Variants: some keep the meaning (same id), some change one part (new id).
    const variants: ReadonlyArray<LocusInput> = [
      base,
      {
        ...base,
        charter: {
          ...base.charter,
          responsibilities: ["Take orders", "Collect payment details"],
        },
        metadata: { source: "checkout.ts" },
      },
      {
        ...base,
        charter: {
          ...base.charter,
          responsibilities: [
            "Collect payment details",
            "Take orders",
            "Collect payment details",
          ],
        },
      },
      { ...base, charter: { ...base.charter, purpose: PURPOSE_AFTER } },
      {
        ...base,
        charter: {
          ...base.charter,
          responsibilities: [...base.charter.responsibilities, "Send receipts"],
        },
      },
      { ...base, charter: { ...base.charter, excluded: [] } },
      {
        ...base,
        charter: {
          ...base.charter,
          successConditions: [
            ...(base.charter.successConditions ?? []),
            "Stock held",
          ],
        },
      },
      { ...base, owner: "shop:other" },
    ];
    const revisions = await Promise.all(variants.map(revisionOf));

    let equalPairs = 0;
    let differentPairs = 0;
    for (let i = 0; i < 50; i++) {
      const from = revisions[i % revisions.length];
      const to = revisions[(i * 7 + 3) % revisions.length];
      if (from === undefined || to === undefined) {
        throw new Error("fixture index out of range");
      }
      const changeSet = await Effect.runPromise(diffRevisions(from, to));
      expect(changeSet.changes.length === 0).toBe(from.id === to.id);
      if (from.id === to.id) equalPairs++;
      else differentPairs++;
    }
    // Guard against a vacuous property: both outcomes must actually occur.
    expect(equalPairs).toBeGreaterThan(0);
    expect(differentPairs).toBeGreaterThan(0);
  });
});

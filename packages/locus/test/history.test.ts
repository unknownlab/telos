import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { RevisionHistory, RevisionHistoryInMemory } from "../src/history";
import { RevisionNotFoundError, StaleBaselineError } from "../src/errors";
import { defineLocus, type LocusInput } from "../src/locus";
import {
  createRevision,
  type Revision,
  type RevisionId,
} from "../src/revision";

const revisionOf = (input: LocusInput): Promise<Revision> =>
  Effect.runPromise(createRevision(defineLocus(input)));

const checkoutCharter = (purpose: string): LocusInput => ({
  id: "shop:checkout",
  charter: { purpose, responsibilities: ["Collect payment details"] },
});

const A = await revisionOf(checkoutCharter("Turn a basket into an order."));
const B = await revisionOf(checkoutCharter("Turn a basket into a paid order."));
const C = await revisionOf(
  checkoutCharter("Turn a basket into a reserved order."),
);
const X = await revisionOf({
  id: "shop:other",
  charter: { purpose: "Hold unrelated things.", responsibilities: ["Exist"] },
});

const CHECKOUT = "shop:checkout";
const OTHER = "shop:other";
const NO_SUCH_ID = `sha256:${"0".repeat(64)}` as RevisionId;

const run = <A, E>(program: Effect.Effect<A, E, RevisionHistory>) =>
  Effect.runPromise(Effect.provide(program, RevisionHistoryInMemory));

describe("RevisionHistory on an empty history", () => {
  test("head is null and entries is empty", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        return {
          head: yield* history.head(CHECKOUT),
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.head).toBeNull();
    expect(result.entries).toEqual([]);
  });

  test("appending the first Revision with expected null makes it the head", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        const outcome = yield* history.append(A, null);
        return {
          outcome,
          head: yield* history.head(CHECKOUT),
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.outcome).toEqual({ appended: true, head: A.id });
    expect(result.head).toBe(A.id);
    expect(result.entries).toEqual([A.id]);
  });

  test("NS-015: a non-null expected head on an empty history is stale", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        const failure = yield* Effect.flip(history.append(A, B.id));
        return {
          failure,
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.failure).toBeInstanceOf(StaleBaselineError);
    expect(result.failure).toMatchObject({
      _tag: "StaleBaselineError",
      locus: CHECKOUT,
      expected: B.id,
      actual: null,
    });
    expect(result.entries).toEqual([]);
  });
});

describe("RevisionHistory append rules", () => {
  test("US2-4: appending a Revision against the current head advances the head", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        const outcome = yield* history.append(B, A.id);
        return {
          outcome,
          head: yield* history.head(CHECKOUT),
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.outcome).toEqual({ appended: true, head: B.id });
    expect(result.head).toBe(B.id);
    expect(result.entries).toEqual([A.id, B.id]);
  });

  test("US2-5 / NS-014: a stale expected head fails and leaves the history unchanged", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        yield* history.append(B, A.id);
        const failure = yield* Effect.flip(history.append(C, A.id));
        return {
          failure,
          head: yield* history.head(CHECKOUT),
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.failure).toBeInstanceOf(StaleBaselineError);
    expect(result.failure).toMatchObject({
      _tag: "StaleBaselineError",
      locus: CHECKOUT,
      expected: A.id,
      actual: B.id,
    });
    expect(result.head).toBe(B.id);
    expect(result.entries).toEqual([A.id, B.id]);
  });

  test("the stale check comes before the no-op check", async () => {
    // Head is A. Appending A with expected B is stale, not a no-op.
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        const failure = yield* Effect.flip(history.append(A, B.id));
        return {
          failure,
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.failure).toBeInstanceOf(StaleBaselineError);
    expect(result.failure).toMatchObject({
      _tag: "StaleBaselineError",
      locus: CHECKOUT,
      expected: B.id,
      actual: A.id,
    });
    expect(result.entries).toEqual([A.id]);
  });

  test("appending the current head against itself is a no-op", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        const outcome = yield* history.append(A, A.id);
        return {
          outcome,
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.outcome).toEqual({ appended: false, head: A.id });
    expect(result.entries).toEqual([A.id]);
  });

  test("a revert is allowed: A, B, then A again gives A, B, A", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        yield* history.append(B, A.id);
        const outcome = yield* history.append(A, B.id);
        return {
          outcome,
          head: yield* history.head(CHECKOUT),
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    expect(result.outcome).toEqual({ appended: true, head: A.id });
    expect(result.head).toBe(A.id);
    expect(result.entries).toEqual([A.id, B.id, A.id]);
  });
});

describe("RevisionHistory per-Locus state and lookup", () => {
  test("each Locus has its own head and entries", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        const outcome = yield* history.append(X, null);
        return {
          outcome,
          checkoutHead: yield* history.head(CHECKOUT),
          otherHead: yield* history.head(OTHER),
          checkoutEntries: yield* history.entries(CHECKOUT),
          otherEntries: yield* history.entries(OTHER),
        };
      }),
    );
    expect(result.outcome).toEqual({ appended: true, head: X.id });
    expect(result.checkoutHead).toBe(A.id);
    expect(result.otherHead).toBe(X.id);
    expect(result.checkoutEntries).toEqual([A.id]);
    expect(result.otherEntries).toEqual([X.id]);
  });

  test("get returns the stored Revision", async () => {
    const found = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        return yield* history.get(A.id);
      }),
    );
    expect(found.id).toBe(A.id);
    expect(found.locus).toBe(CHECKOUT);
    expect(found.definition).toEqual(A.definition);
  });

  test("get fails with RevisionNotFoundError for an unknown id", async () => {
    const failure = await run(
      Effect.flip(
        Effect.gen(function* () {
          const history = yield* RevisionHistory;
          return yield* history.get(NO_SUCH_ID);
        }),
      ),
    );
    expect(failure).toBeInstanceOf(RevisionNotFoundError);
    expect(failure).toMatchObject({
      _tag: "RevisionNotFoundError",
      id: NO_SUCH_ID,
    });
  });
});

describe("RevisionHistory layer lifetime and atomicity", () => {
  test("each provided layer starts with fresh, empty state", async () => {
    const program = Effect.gen(function* () {
      const history = yield* RevisionHistory;
      const before = yield* history.head(CHECKOUT);
      yield* history.append(A, null);
      return before;
    });
    const first = await run(program);
    const second = await run(program);
    expect(first).toBeNull();
    expect(second).toBeNull();
  });

  test("twenty concurrent appends with the same expected head produce exactly one success", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        const attempts = Array.from({ length: 20 }, () =>
          Effect.result(history.append(A, null)),
        );
        const results = yield* Effect.all(attempts, {
          concurrency: "unbounded",
        });
        return {
          results,
          entries: yield* history.entries(CHECKOUT),
        };
      }),
    );
    const successes = result.results.filter((r) => r._tag === "Success");
    const failures = result.results.filter((r) => r._tag === "Failure");
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(19);
    for (const failure of failures) {
      if (failure._tag === "Failure") {
        expect(failure.failure).toBeInstanceOf(StaleBaselineError);
        expect(failure.failure._tag).toBe("StaleBaselineError");
      }
    }
    expect(result.entries).toEqual([A.id]);
  });

  test("the returned entries array cannot be used to change the history", async () => {
    const result = await run(
      Effect.gen(function* () {
        const history = yield* RevisionHistory;
        yield* history.append(A, null);
        const first = yield* history.entries(CHECKOUT);
        try {
          (first as RevisionId[]).push(B.id);
        } catch {
          // Pushing to a frozen copy throws; either outcome is acceptable.
        }
        return {
          again: yield* history.entries(CHECKOUT),
          head: yield* history.head(CHECKOUT),
        };
      }),
    );
    expect(result.again).toEqual([A.id]);
    expect(result.head).toBe(A.id);
  });
});

import { describe, expect, spyOn, test } from "bun:test";
import { Effect } from "effect";
import * as locus from "@telos/locus";
import type { FabricJson, LocusJson } from "@telos/locus";
import type { Specification, SpecResult } from "../src/model";
import { runSpecification, runSpecifications } from "../src/runner";

// Meta-tests: each inline record has a hand-derived, correct expectation. Wrong
// expectations, made by editing a structuredClone of the record, must report "fail".
// None of these expectations is copied from runner output.

const run = (spec: Specification): Promise<SpecResult> =>
  Effect.runPromise(runSpecification(spec));

// Edits the expectation of a copy of a record. The original record is never changed.
const withExpect = <T>(
  spec: Specification,
  edit: (expect: T) => void,
): Specification => {
  const copy = structuredClone(spec);
  edit((copy.check as unknown as { expect: T }).expect);
  return copy;
};

const replaceExpect = (spec: Specification, value: unknown): Specification => {
  const copy = structuredClone(spec);
  (copy.check as unknown as { expect: unknown }).expect = value;
  return copy;
};

const charter = (
  purpose: string,
  responsibilities: string[] = ["Do one thing"],
) => ({
  purpose,
  responsibilities,
});

const checkoutA: LocusJson = {
  id: "shop:checkout",
  charter: charter("Turn a basket into an order.", ["Collect payment details"]),
};
// A Locus whose only Relation lacks a target and has an unknown kind; decoding must reject it.
const malformedOwnsLocus = (purpose: string): LocusJson =>
  ({
    id: "t:a",
    charter: charter(purpose),
    relations: [{ kind: "owns" }],
  }) as unknown as LocusJson;

const checkoutWithSource = (source: string): LocusJson => ({
  ...checkoutA,
  metadata: { source },
});

// -- One correct record per check kind ----------------------------------------

const validateBlankPurpose: Specification = {
  id: "LOC-901",
  title: "A blank purpose is reported at the Locus purpose path",
  invariants: ["INV-004"],
  scenarios: [],
  polarity: "negative",
  check: {
    kind: "validate",
    fabric: {
      id: "t:f",
      loci: [{ id: "t:a", charter: charter("") }],
    },
    expect: {
      valid: false,
      diagnostics: [
        {
          code: "charter.purpose-blank",
          scope: "locus",
          subject: "t:a",
          path: "charter.purpose",
        },
      ],
    },
  },
};

const twoLociInBothOrders: ReadonlyArray<FabricJson> = [
  {
    id: "t:f",
    loci: [
      { id: "t:a", charter: charter("A purpose.") },
      { id: "t:b", charter: charter("B purpose.") },
    ],
  },
  {
    id: "t:f",
    loci: [
      { id: "t:b", charter: charter("B purpose.") },
      { id: "t:a", charter: charter("A purpose.") },
    ],
  },
];

const validateStableReordered: Specification = {
  id: "LOC-902",
  title: "Reordering the Loci of a Fabric gives an identical report",
  invariants: ["INV-009"],
  scenarios: [],
  polarity: "positive",
  check: {
    kind: "validate-stable",
    variants: twoLociInBothOrders,
    runs: 2,
    expect: "identical",
  },
};

const decodeUnknownRelationKind: Specification = {
  id: "LOC-903",
  title: "An unknown Relation kind is a decode error at its path",
  invariants: ["INV-007"],
  scenarios: ["NS-008"],
  polarity: "negative",
  check: {
    kind: "decode",
    input: JSON.stringify({
      id: "t:f",
      loci: [
        {
          id: "t:a",
          charter: charter("A purpose."),
          relations: [{ kind: "owns", target: "t:b" }],
        },
      ],
    }),
    expect: { ok: false, paths: ["loci[0].relations[0].kind"] },
  },
};

const revisionCompareMetadataOnly: Specification = {
  id: "LOC-904",
  title: "Metadata differences keep the Locus and the Revision id",
  invariants: ["INV-003"],
  scenarios: [],
  polarity: "positive",
  check: {
    kind: "revision-compare",
    a: checkoutWithSource("a.json"),
    b: checkoutWithSource("b.json"),
    expect: { sameLocus: true, sameId: true },
  },
};

const revisionImmutableCheckout: Specification = {
  id: "LOC-905",
  title: "Attempts to modify a Revision have no effect",
  invariants: ["INV-010"],
  scenarios: ["NS-013"],
  polarity: "negative",
  check: {
    kind: "revision-immutable",
    locus: checkoutA,
    expect: "immutable",
  },
};

const historyAppendAndStale: Specification = {
  id: "LOC-906",
  title: "A stale expected head is refused and leaves the entries unchanged",
  invariants: ["INV-011"],
  scenarios: ["NS-014"],
  polarity: "negative",
  check: {
    kind: "history",
    revisions: [
      { id: "t:a", charter: charter("A.") },
      { id: "t:a", charter: charter("B.") },
    ],
    steps: [
      { append: 0, expectedHead: null },
      { append: 1, expectedHead: 0 },
      { append: 0, expectedHead: 0 },
    ],
    expect: { outcomes: ["appended", "appended", "stale"], entries: [0, 1] },
  },
};

const diffPurposeChange: Specification = {
  id: "LOC-907",
  title: "A purpose change gives the expected change set",
  invariants: ["INV-012"],
  scenarios: [],
  polarity: "negative",
  check: {
    kind: "diff",
    from: { id: "t:a", charter: charter("x") },
    to: { id: "t:a", charter: charter("y") },
    expect: {
      ok: true,
      changes: [
        { part: "charter.purpose", kind: "changed", from: "x", to: "y" },
      ],
    },
  },
};

// -- Mutations per kind. Each one changes the expectation and must fail. ------

type ValidateExpect = {
  valid: boolean;
  diagnostics: Array<{
    code: string;
    scope: string;
    subject: string;
    path: string;
  }>;
};
type DecodeExpect = { ok: true } | { ok: false; paths: string[] };
type CompareExpect = { sameLocus: boolean; sameId: boolean };
type HistoryExpect = { outcomes: string[]; entries: number[] };
type DiffExpect = {
  ok: boolean;
  changes?: Array<Record<string, unknown>>;
  error?: string;
};

interface Case {
  readonly name: string;
  readonly record: Specification;
  readonly wrong: ReadonlyArray<{
    readonly label: string;
    readonly spec: Specification;
  }>;
}

const CASES: ReadonlyArray<Case> = [
  {
    name: "validate",
    record: validateBlankPurpose,
    wrong: [
      {
        label: "valid flipped to true",
        spec: withExpect<ValidateExpect>(validateBlankPurpose, (e) => {
          e.valid = true;
        }),
      },
      {
        label: "the diagnostic removed",
        spec: withExpect<ValidateExpect>(validateBlankPurpose, (e) => {
          e.diagnostics = [];
        }),
      },
      {
        label: "the diagnostic path changed",
        spec: withExpect<ValidateExpect>(validateBlankPurpose, (e) => {
          const [first] = e.diagnostics;
          if (first) first.path = "charter.responsibilities";
        }),
      },
    ],
  },
  {
    name: "validate-stable",
    record: validateStableReordered,
    wrong: [
      {
        label: "expected different",
        spec: replaceExpect(validateStableReordered, "different"),
      },
      {
        label: "expected an outcome object",
        spec: replaceExpect(validateStableReordered, { outcome: "different" }),
      },
    ],
  },
  {
    name: "decode",
    record: decodeUnknownRelationKind,
    wrong: [
      {
        label: "ok flipped to true",
        spec: replaceExpect(decodeUnknownRelationKind, { ok: true }),
      },
      {
        label: "the path changed to target",
        spec: withExpect<DecodeExpect>(decodeUnknownRelationKind, (e) => {
          if ("paths" in e) e.paths = ["loci[0].relations[0].target"];
        }),
      },
      {
        label: "the path list emptied",
        spec: withExpect<DecodeExpect>(decodeUnknownRelationKind, (e) => {
          if ("paths" in e) e.paths = [];
        }),
      },
    ],
  },
  {
    name: "revision-compare",
    record: revisionCompareMetadataOnly,
    wrong: [
      {
        label: "sameId flipped to false",
        spec: withExpect<CompareExpect>(revisionCompareMetadataOnly, (e) => {
          e.sameId = false;
        }),
      },
      {
        label: "sameLocus flipped to false",
        spec: withExpect<CompareExpect>(revisionCompareMetadataOnly, (e) => {
          e.sameLocus = false;
        }),
      },
    ],
  },
  {
    name: "revision-immutable",
    record: revisionImmutableCheckout,
    wrong: [
      {
        label: "expected mutable",
        spec: replaceExpect(revisionImmutableCheckout, "mutable"),
      },
      {
        label: "expected a list of writable aspects",
        spec: replaceExpect(revisionImmutableCheckout, ["id-writable"]),
      },
    ],
  },
  {
    name: "history",
    record: historyAppendAndStale,
    wrong: [
      {
        label: "two outcomes swapped",
        spec: withExpect<HistoryExpect>(historyAppendAndStale, (e) => {
          e.outcomes = ["stale", "appended", "appended"];
        }),
      },
      {
        label: "the last outcome changed to no-op",
        spec: withExpect<HistoryExpect>(historyAppendAndStale, (e) => {
          e.outcomes[2] = "no-op";
        }),
      },
      {
        label: "entries reversed",
        spec: withExpect<HistoryExpect>(historyAppendAndStale, (e) => {
          e.entries = [1, 0];
        }),
      },
    ],
  },
  {
    name: "diff",
    record: diffPurposeChange,
    wrong: [
      {
        label: "one change value altered",
        spec: withExpect<DiffExpect>(diffPurposeChange, (e) => {
          const [first] = e.changes ?? [];
          if (first) first.to = "z";
        }),
      },
      {
        label: "the change list emptied",
        spec: withExpect<DiffExpect>(diffPurposeChange, (e) => {
          e.changes = [];
        }),
      },
      {
        label: "expected a LocusMismatchError",
        spec: replaceExpect(diffPurposeChange, {
          ok: false,
          error: "LocusMismatchError",
        }),
      },
    ],
  },
];

describe("runner meta-tests: each check kind", () => {
  for (const c of CASES) {
    describe(c.name, () => {
      test("the correct expectation passes, with expected and durationMs reported", async () => {
        const result = await run(c.record);
        expect(result.status).toBe("pass");
        expect(result.id).toBe(c.record.id);
        expect(result.expected).toEqual(c.record.check.expect);
        expect(result.durationMs).toBeGreaterThanOrEqual(0);
      });

      test("at least two wrong expectations fail", () => {
        expect(c.wrong.length).toBeGreaterThanOrEqual(2);
      });

      for (const wrong of c.wrong) {
        test(`fails when ${wrong.label}`, async () => {
          const result = await run(wrong.spec);
          expect(result.status).toBe("fail");
          expect(result.expected).toEqual(wrong.spec.check.expect);
        });
      }
    });
  }
});

describe("runner meta-tests: the observed values", () => {
  test("validate reports the expected diagnostic with no message field", async () => {
    const result = await run(validateBlankPurpose);
    expect(result.observed).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "charter.purpose-blank",
          scope: "locus",
          subject: "t:a",
          path: "charter.purpose",
        },
      ],
    });
  });

  test("validate-stable reports the first differing report and its position", async () => {
    const differing: Specification = {
      ...validateStableReordered,
      check: {
        kind: "validate-stable",
        variants: [
          twoLociInBothOrders[0] as FabricJson,
          {
            id: "t:f",
            loci: [
              { id: "t:a", charter: charter("A purpose.") },
              { id: "t:a", charter: charter("A purpose.") },
            ],
          },
        ],
        runs: 1,
        expect: "identical",
      },
    };
    const result = await run(differing);
    expect(result.status).toBe("fail");
    const observed = result.observed as {
      outcome: string;
      first: string;
      differing: string;
      at: { variant: number; run: number };
    };
    expect(observed.outcome).toBe("different");
    expect(observed.at).toEqual({ variant: 1, run: 0 });
    expect(observed.differing).not.toBe(observed.first);
  });
});

describe("runner meta-tests: fixtures that do not decode are errors", () => {
  test("a validate fixture with a relation missing its target is error, not pass or fail", async () => {
    const spec: Specification = {
      ...validateBlankPurpose,
      check: {
        kind: "validate",
        fabric: {
          id: "t:f",
          loci: [malformedOwnsLocus("A purpose.")],
        },
        expect: { valid: true, diagnostics: [] },
      },
    };
    const result = await run(spec);
    expect(result.status).toBe("error");
    expect((result.observed as { error: string }).error).toBe(
      "fixture did not decode",
    );
  });

  test("a history step whose append index is out of range is error", async () => {
    const spec: Specification = {
      ...historyAppendAndStale,
      check: {
        kind: "history",
        revisions: [
          { id: "t:a", charter: charter("A.") },
          { id: "t:a", charter: charter("B.") },
        ],
        steps: [{ append: 5, expectedHead: null }],
        expect: { outcomes: ["appended"], entries: [0] },
      },
    };
    const result = await run(spec);
    expect(result.status).toBe("error");
  });

  test("a history step whose expected head index is out of range is error", async () => {
    const spec: Specification = {
      ...historyAppendAndStale,
      check: {
        kind: "history",
        revisions: [{ id: "t:a", charter: charter("A.") }],
        steps: [{ append: 0, expectedHead: 3 }],
        expect: { outcomes: ["stale"], entries: [] },
      },
    };
    expect((await run(spec)).status).toBe("error");
  });

  test("a history with no revisions is error", async () => {
    const spec: Specification = {
      ...historyAppendAndStale,
      check: {
        kind: "history",
        revisions: [],
        steps: [{ append: 0, expectedHead: null }],
        expect: { outcomes: ["appended"], entries: [] },
      },
    };
    expect((await run(spec)).status).toBe("error");
  });

  test("a revision-compare fixture that does not decode is error", async () => {
    const spec: Specification = {
      ...revisionCompareMetadataOnly,
      check: {
        kind: "revision-compare",
        a: { id: 7, charter: charter("A.") } as unknown as LocusJson,
        b: checkoutA,
        expect: { sameLocus: false, sameId: false },
      },
    };
    expect((await run(spec)).status).toBe("error");
  });

  test("a validate-stable record with runs below 1 is error", async () => {
    const spec: Specification = {
      ...validateStableReordered,
      check: {
        kind: "validate-stable",
        variants: twoLociInBothOrders,
        runs: 0,
        expect: "identical",
      },
    };
    expect((await run(spec)).status).toBe("error");
  });

  test("a validate-stable record with fewer than two variants is error", async () => {
    const spec: Specification = {
      ...validateStableReordered,
      check: {
        kind: "validate-stable",
        variants: [twoLociInBothOrders[0] as FabricJson],
        runs: 2,
        expect: "identical",
      },
    };
    expect((await run(spec)).status).toBe("error");
  });

  test("a check kind the runner does not know is error, reported from a defect", async () => {
    const spec = {
      ...validateBlankPurpose,
      check: { kind: "bogus", expect: true },
    } as unknown as Specification;
    const result = await run(spec);
    expect(result.status).toBe("error");
    expect((result.observed as { error: string }).error).toBe("defect");
  });
});

describe("runner meta-tests: other cases", () => {
  test("a diff across two different Loci reports LocusMismatchError as an expected value", async () => {
    const spec: Specification = {
      ...diffPurposeChange,
      check: {
        kind: "diff",
        from: { id: "t:a", charter: charter("x") },
        to: { id: "t:b", charter: charter("x") },
        expect: { ok: false, error: "LocusMismatchError" },
      },
    };
    expect((await run(spec)).status).toBe("pass");
  });

  test("a revision-immutable record passes, so the strict-mode assumption holds in Bun", async () => {
    expect((await run(revisionImmutableCheckout)).status).toBe("pass");
  });

  test("runSpecifications keeps input order and counts each status", async () => {
    const failing = withExpect<ValidateExpect>(validateBlankPurpose, (e) => {
      e.valid = true;
    });
    const erroring: Specification = {
      ...validateBlankPurpose,
      id: "LOC-909",
      check: {
        kind: "validate",
        fabric: {
          id: "t:f",
          loci: [malformedOwnsLocus("A.")],
        },
        expect: { valid: true, diagnostics: [] },
      },
    };
    const report = await Effect.runPromise(
      runSpecifications([validateBlankPurpose, failing, erroring]),
    );
    expect(report.results.map((r) => r.id)).toEqual([
      "LOC-901",
      "LOC-901",
      "LOC-909",
    ]);
    expect(report.results.map((r) => r.status)).toEqual([
      "pass",
      "fail",
      "error",
    ]);
    expect(report.summary).toEqual({
      total: 3,
      passed: 1,
      failed: 1,
      errored: 1,
    });
  });

  test("two runs of the same history record do not share history state", async () => {
    const report = await Effect.runPromise(
      runSpecifications([historyAppendAndStale, historyAppendAndStale]),
    );
    expect(report.results.map((r) => r.status)).toEqual(["pass", "pass"]);
  });
});

// -- Diagnostic order, identity and repeated runs ------------------------------

// A Locus with a blank purpose and no responsibilities gives two diagnostics,
// sorted by code: charter.purpose-blank, then charter.responsibilities-empty.
const twoDiagnosticsFabric: FabricJson = {
  id: "t:f",
  loci: [{ id: "t:a", charter: charter("", []) }],
};

const validateTwoDiagnostics: Specification = {
  id: "LOC-910",
  title: "Two diagnostics of one Locus are compared in their reported order",
  invariants: ["INV-004"],
  scenarios: [],
  polarity: "negative",
  check: {
    kind: "validate",
    fabric: twoDiagnosticsFabric,
    expect: {
      valid: false,
      diagnostics: [
        {
          code: "charter.purpose-blank",
          scope: "locus",
          subject: "t:a",
          path: "charter.purpose",
        },
        {
          code: "charter.responsibilities-empty",
          scope: "locus",
          subject: "t:a",
          path: "charter.responsibilities",
        },
      ],
    },
  },
};

describe("runner meta-tests: two diagnostics", () => {
  test("the same order passes when the object keys are written in another order", async () => {
    const reordered = replaceExpect(validateTwoDiagnostics, {
      diagnostics: [
        {
          path: "charter.purpose",
          subject: "t:a",
          scope: "locus",
          code: "charter.purpose-blank",
        },
        {
          path: "charter.responsibilities",
          subject: "t:a",
          scope: "locus",
          code: "charter.responsibilities-empty",
        },
      ],
      valid: false,
    });
    const result = await run(reordered);
    expect(result.status).toBe("pass");
    expect(result.observed).toEqual({
      valid: false,
      diagnostics: [
        {
          code: "charter.purpose-blank",
          scope: "locus",
          subject: "t:a",
          path: "charter.purpose",
        },
        {
          code: "charter.responsibilities-empty",
          scope: "locus",
          subject: "t:a",
          path: "charter.responsibilities",
        },
      ],
    });
  });

  test("the same two diagnostics written in swapped order fail", async () => {
    const swapped = withExpect<{ diagnostics: unknown[] }>(
      validateTwoDiagnostics,
      (e) => {
        e.diagnostics.reverse();
      },
    );
    const result = await run(swapped);
    expect(result.status).toBe("fail");
    expect(result.expected).toEqual(swapped.check.expect);
  });
});

// The same Locus with a different identity: not the same Locus and not the same Revision.
const differentLociPair: Specification = {
  id: "LOC-911",
  title:
    "Two Loci with different identities are different Loci with different Revisions",
  invariants: ["INV-003"],
  scenarios: [],
  polarity: "negative",
  check: {
    kind: "revision-compare",
    a: checkoutA,
    b: { ...checkoutA, id: "shop:other" },
    expect: { sameLocus: false, sameId: false },
  },
};

describe("runner meta-tests: revision-compare across Loci", () => {
  test("different identities give sameLocus false and sameId false", async () => {
    const result = await run(differentLociPair);
    expect(result.status).toBe("pass");
    expect(result.observed).toEqual({ sameLocus: false, sameId: false });
  });

  test("an expectation of sameLocus true fails", async () => {
    const wrong = withExpect<CompareExpect>(differentLociPair, (e) => {
      e.sameLocus = true;
    });
    expect((await run(wrong)).status).toBe("fail");
  });
});

// Two variants checked three times each must call validateFabric 2 × 3 = 6 times.
const repeatedStable: Specification = {
  id: "LOC-912",
  title: "Each run of a validate-stable record validates its variant again",
  invariants: ["INV-009"],
  scenarios: [],
  polarity: "positive",
  check: {
    kind: "validate-stable",
    variants: twoLociInBothOrders,
    runs: 3,
    expect: "identical",
  },
};

describe("runner meta-tests: repeated runs", () => {
  test("a validate-stable record with three runs calls validateFabric once per variant and run", async () => {
    const calls = spyOn(locus, "validateFabric");
    try {
      const result = await run(repeatedStable);
      expect(result.status).toBe("pass");
      expect(calls.mock.calls.length).toBe(
        twoLociInBothOrders.length *
          (repeatedStable.check as { runs: number }).runs,
      );
    } finally {
      calls.mockRestore();
    }
  });
});

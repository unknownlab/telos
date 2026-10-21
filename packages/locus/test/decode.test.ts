import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { decodeFabric, decodeFabricJson, decodeLocus } from "../src/decode";
import { DecodeError } from "../src/errors";
import { defineFabric, type Fabric } from "../src/fabric";
import { defineLocus, type LocusDefinition } from "../src/locus";

const EXAMPLE_LOCI = [
  {
    id: "shop:storefront",
    charter: {
      purpose: "Sell products online.",
      responsibilities: ["Present the catalogue", "Take orders"],
    },
  },
  {
    id: "shop:checkout",
    owner: "shop:storefront",
    charter: {
      purpose: "Turn a basket into an order.",
      responsibilities: ["Collect payment details"],
    },
    relations: [{ kind: "depends-on", target: "shop:payment" }],
  },
  {
    id: "shop:payment",
    owner: "shop:storefront",
    charter: {
      purpose: "Authorise payments.",
      responsibilities: ["Call the payment provider"],
    },
  },
];

const EXAMPLE = { id: "shop:system", loci: EXAMPLE_LOCI };
const EXAMPLE_TEXT = JSON.stringify(EXAMPLE);
const MAX_LENGTH = 1_048_576;

function withLoci(loci: ReadonlyArray<unknown>): unknown {
  return { id: "shop:system", loci };
}

function locusAt(fabric: Fabric, index: number): LocusDefinition {
  const locus = fabric.loci[index];
  if (locus === undefined) throw new Error(`no locus at index ${index}`);
  return locus;
}

function issuesOf(error: DecodeError): ReadonlyArray<{
  readonly path: string;
  readonly message: string;
}> {
  return error.issues;
}

function pathsOf(error: DecodeError): ReadonlyArray<string> {
  return issuesOf(error).map((issue) => issue.path);
}

describe("decodeFabricJson with the contract example", () => {
  test("decodes to the same Fabric as defineFabric and defineLocus", async () => {
    const fabric = await Effect.runPromise(decodeFabricJson(EXAMPLE_TEXT));
    const expected = defineFabric({
      id: "shop:system",
      loci: [
        defineLocus({
          id: "shop:storefront",
          charter: {
            purpose: "Sell products online.",
            responsibilities: ["Present the catalogue", "Take orders"],
          },
        }),
        defineLocus({
          id: "shop:checkout",
          owner: "shop:storefront",
          charter: {
            purpose: "Turn a basket into an order.",
            responsibilities: ["Collect payment details"],
          },
          relations: [{ kind: "depends-on", target: "shop:payment" }],
        }),
        defineLocus({
          id: "shop:payment",
          owner: "shop:storefront",
          charter: {
            purpose: "Authorise payments.",
            responsibilities: ["Call the payment provider"],
          },
        }),
      ],
    });
    expect(fabric).toEqual(expected);
  });

  test("the decoded Fabric is frozen all the way down", async () => {
    const fabric = await Effect.runPromise(decodeFabricJson(EXAMPLE_TEXT));
    expect(Object.isFrozen(fabric)).toBe(true);
    expect(Object.isFrozen(fabric.loci)).toBe(true);
    const checkout = locusAt(fabric, 1);
    expect(Object.isFrozen(checkout)).toBe(true);
    expect(Object.isFrozen(checkout.relations)).toBe(true);
    expect(Object.isFrozen(checkout.relations[0])).toBe(true);
  });

  test("missing optional fields are absent or default to empty arrays", async () => {
    const fabric = await Effect.runPromise(decodeFabricJson(EXAMPLE_TEXT));
    const storefront = locusAt(fabric, 0);
    expect("owner" in storefront).toBe(false);
    expect("metadata" in storefront).toBe(false);
    expect(storefront.relations).toEqual([]);
    expect(storefront.charter.excluded).toEqual([]);
    expect(storefront.charter.successConditions).toEqual([]);
  });
});

describe("decode errors for wrong values", () => {
  test("NS-008: a Relation kind that is not one of the four gives exactly one issue at its path", async () => {
    const loci: unknown[] = [
      {
        ...EXAMPLE_LOCI[0],
        relations: [{ kind: "owns", target: "shop:payment" }],
      },
      EXAMPLE_LOCI[1],
      EXAMPLE_LOCI[2],
    ];
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric(withLoci(loci))),
    );
    expect(error).toBeInstanceOf(DecodeError);
    expect(issuesOf(error)).toEqual([
      {
        path: "loci[0].relations[0].kind",
        message: 'Expected "depends-on" | "refines" | "satisfies" | "verifies"',
      },
    ]);
  });

  test("NS-017: wrong shapes are reported at their paths, sorted", async () => {
    const loci: unknown[] = [
      { id: "shop:a" },
      {
        id: "shop:b",
        charter: { purpose: 3, responsibilities: [] },
      },
      {
        id: "shop:c",
        charter: { purpose: "p", responsibilities: [] },
        extra: true,
      },
    ];
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric(withLoci(loci))),
    );
    expect(pathsOf(error)).toEqual([
      "loci[0].charter",
      "loci[1].charter.purpose",
      "loci[2].extra",
    ]);
    expect(issuesOf(error).map((issue) => issue.message)).toEqual([
      "Missing key",
      "Expected string",
      "Expected no excess property",
    ]);
  });

  test("a metadata value that is not a string fails at its path", async () => {
    const loci: unknown[] = [
      { ...EXAMPLE_LOCI[0], metadata: { n: 1 } },
      EXAMPLE_LOCI[1],
      EXAMPLE_LOCI[2],
    ];
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric(withLoci(loci))),
    );
    expect(pathsOf(error)).toEqual(["loci[0].metadata.n"]);
    expect(issuesOf(error)[0]?.message).toBe("Expected string");
  });

  test("a metadata object of strings decodes", async () => {
    const loci: unknown[] = [
      { ...EXAMPLE_LOCI[0], metadata: { source: "a.ts" } },
      EXAMPLE_LOCI[1],
      EXAMPLE_LOCI[2],
    ];
    const fabric = await Effect.runPromise(decodeFabric(withLoci(loci)));
    expect(fabric.loci[0]?.metadata).toEqual({ source: "a.ts" });
  });

  test("the top-level unknown key is an error at its path", async () => {
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric({ id: "shop:system", loci: [], extra: 1 })),
    );
    expect(pathsOf(error)).toEqual(["extra"]);
  });
});

describe("decode errors for text that is not a Fabric", () => {
  test("NS-017: text that is not JSON gives one issue at path '' with a message", async () => {
    const error = await Effect.runPromise(Effect.flip(decodeFabricJson("{")));
    expect(error).toBeInstanceOf(DecodeError);
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message.length).toBeGreaterThan(0);
  });

  test.each(["[]", "null", '"x"'])(
    "JSON %s that is not an object gives one issue at path ''",
    async (text) => {
      const error = await Effect.runPromise(
        Effect.flip(decodeFabricJson(text)),
      );
      expect(issuesOf(error)).toEqual([
        { path: "", message: "Expected object" },
      ]);
    },
  );

  test("the unknown input values 'nope', null and [] each give one issue at path ''", async () => {
    for (const input of ["nope", null, []]) {
      const error = await Effect.runPromise(Effect.flip(decodeFabric(input)));
      expect(issuesOf(error)).toEqual([
        { path: "", message: "Expected object" },
      ]);
    }
  });
});

describe("size limit", () => {
  test("text of 1,048,577 characters gives one issue at path '' that names the limit", async () => {
    const text = "x".repeat(MAX_LENGTH + 1);
    const error = await Effect.runPromise(Effect.flip(decodeFabricJson(text)));
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message).toContain("1048576");
  });

  test("an over-long valid Fabric is refused before JSON.parse runs", async () => {
    const text =
      EXAMPLE_TEXT + " ".repeat(MAX_LENGTH + 1 - EXAMPLE_TEXT.length);
    expect(text.length).toBe(MAX_LENGTH + 1);
    const error = await Effect.runPromise(Effect.flip(decodeFabricJson(text)));
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message).toContain("1048576");
  });

  test("a valid Fabric padded with spaces to exactly 1,048,576 characters decodes", async () => {
    const text = EXAMPLE_TEXT + " ".repeat(MAX_LENGTH - EXAMPLE_TEXT.length);
    expect(text.length).toBe(MAX_LENGTH);
    const fabric = await Effect.runPromise(decodeFabricJson(text));
    expect(fabric.loci).toHaveLength(3);
  });
});

describe("decode does not report rule violations", () => {
  test("bad identity, blank purpose, duplicates and a missing owner all decode", async () => {
    const loci = [
      {
        id: "Bad Id",
        charter: { purpose: " ", responsibilities: ["Same", "Same"] },
      },
      {
        id: "shop:dup",
        owner: "shop:missing",
        charter: { purpose: "p", responsibilities: [] },
      },
      {
        id: "shop:dup",
        charter: { purpose: "q", responsibilities: [] },
      },
    ];
    const fabric = await Effect.runPromise(decodeFabric(withLoci(loci)));
    expect(fabric.loci.map((l) => l.id)).toEqual([
      "Bad Id",
      "shop:dup",
      "shop:dup",
    ]);
    expect(fabric.loci[0]?.charter.purpose).toBe(" ");
    expect(fabric.loci[0]?.charter.responsibilities).toEqual(["Same", "Same"]);
    expect(fabric.loci[1]?.owner).toBe("shop:missing");
  });
});

describe("decodeLocus", () => {
  test("accepts one Locus object", async () => {
    const locus = await Effect.runPromise(decodeLocus(EXAMPLE_LOCI[1]));
    expect(locus).toEqual(
      defineLocus({
        id: "shop:checkout",
        owner: "shop:storefront",
        charter: {
          purpose: "Turn a basket into an order.",
          responsibilities: ["Collect payment details"],
        },
        relations: [{ kind: "depends-on", target: "shop:payment" }],
      }),
    );
  });

  test("rejects an unknown key at path 'extra'", async () => {
    const error = await Effect.runPromise(
      Effect.flip(decodeLocus({ ...EXAMPLE_LOCI[0], extra: 1 })),
    );
    expect(error).toBeInstanceOf(DecodeError);
    expect(pathsOf(error)).toEqual(["extra"]);
  });
});

describe("issue order", () => {
  test("issues are sorted by path, then by message, in UTF-16 order", async () => {
    const loci: unknown[] = [
      { id: "shop:a", charter: { purpose: 3, responsibilities: [] } },
      { id: "shop:b", charter: { purpose: "p", responsibilities: [] }, x: 1 },
      { id: "shop:c" },
    ];
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric(withLoci(loci))),
    );
    const sorted = [...issuesOf(error)].sort((a, b) => {
      if (a.path !== b.path) return a.path < b.path ? -1 : 1;
      if (a.message !== b.message) return a.message < b.message ? -1 : 1;
      return 0;
    });
    expect(issuesOf(error)).toEqual(sorted);
    expect(pathsOf(error)).toEqual([
      "loci[0].charter.purpose",
      "loci[1].x",
      "loci[2].charter",
    ]);
  });

  test("two problems in one Locus are sorted by path, not by Effect's order", async () => {
    // Effect reports the excess key "extra" before the non-string purpose.
    // Only the sort puts "loci[0].charter.purpose" first.
    const error = await Effect.runPromise(
      Effect.flip(
        decodeFabricJson(
          '{"id":"x","loci":[{"id":"a","extra":1,"charter":{"purpose":3,"responsibilities":[]}}]}',
        ),
      ),
    );
    expect(issuesOf(error)).toEqual([
      { path: "loci[0].charter.purpose", message: "Expected string" },
      { path: "loci[0].extra", message: "Expected no excess property" },
    ]);
  });

  test("two issues at one path string are ordered by message", async () => {
    // A key named "charter.responsibilities" gives the same path string as the
    // real field, so both issues carry the path "loci[0].charter.responsibilities".
    // Effect reports "Expected no excess property" first; the message tiebreak
    // puts "Expected array" first.
    const error = await Effect.runPromise(
      Effect.flip(
        decodeFabricJson(
          '{"id":"x","loci":[{"id":"a","charter":{"purpose":"p","responsibilities":"x"},"charter.responsibilities":["y"]}]}',
        ),
      ),
    );
    expect(issuesOf(error)).toEqual([
      {
        path: "loci[0].charter.responsibilities",
        message: "Expected array",
      },
      {
        path: "loci[0].charter.responsibilities",
        message: "Expected no excess property",
      },
    ]);
  });
});

describe("decoders never throw", () => {
  test.each([
    ["undefined", undefined],
    ["null", null],
    ["a number", 42],
    ["an object", { id: "shop:system", loci: [] }],
  ])(
    "decodeFabricJson with %s gives one issue at path '' and does not throw",
    async (_label, text) => {
      const error = await Effect.runPromise(
        Effect.flip(decodeFabricJson(text as unknown as string)),
      );
      expect(error).toBeInstanceOf(DecodeError);
      expect(issuesOf(error)).toEqual([
        { path: "", message: "Input must be a string." },
      ]);
    },
  );

  test("decodeFabric with a getter that throws gives one issue at path '' and does not throw", async () => {
    const input = {
      get id(): string {
        throw new Error("boom");
      },
      loci: [],
    };
    const error = await Effect.runPromise(Effect.flip(decodeFabric(input)));
    expect(error).toBeInstanceOf(DecodeError);
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message).toContain("boom");
  });

  test("decodeFabric with a nested getter that throws gives one issue and does not throw", async () => {
    const locus = {
      id: "shop:a",
      get charter(): unknown {
        throw new Error("boom");
      },
    };
    const error = await Effect.runPromise(
      Effect.flip(decodeFabric(withLoci([locus]))),
    );
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message).toContain("boom");
  });

  test("decodeLocus with a getter that throws gives one issue at path '' and does not throw", async () => {
    const input = {
      id: "shop:a",
      get charter(): unknown {
        throw new Error("boom");
      },
    };
    const error = await Effect.runPromise(Effect.flip(decodeLocus(input)));
    expect(error).toBeInstanceOf(DecodeError);
    expect(issuesOf(error)).toHaveLength(1);
    expect(pathsOf(error)).toEqual([""]);
    expect(issuesOf(error)[0]?.message).toContain("boom");
  });
});

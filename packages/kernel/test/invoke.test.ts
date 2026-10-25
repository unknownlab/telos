import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability } from "../src/capability";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { invoke, isGranted } from "../src/invoke";
import { Locus } from "../src/locus";
import { buildModel, type SemanticModel } from "../src/model";
import { CapabilityRef, RelationType } from "../src/relation";

const Num = Schema.Struct({ n: Schema.Finite });
const Val = Schema.Struct({ value: Schema.Finite });
class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}
class Undeclared extends Schema.TaggedError<Undeclared>()("Undeclared", {
  message: Schema.String,
}) {}

const calls = RelationType.make("test.calls", {
  description: "Calls a capability.",
  target: "capability",
  grantsInvocation: true,
});
const refers = RelationType.make("test.refers", {
  description: "Refers to a capability without granting it.",
  target: "capability",
});
const Ui = Extension.make("test.ui", {
  description: "A test interface Locus kind.",
  relationTypes: [calls],
});
const Other = Extension.make("test.other", {
  description: "A test Locus kind that refers only.",
  relationTypes: [refers],
});

let calledCount = 0;

const double = Capability.make({
  description: "Doubles n.",
  input: Num,
  output: Val,
  errors: [Negative],
  effect: "pure",
  handler: ({ n }) =>
    n < 0
      ? Effect.fail(new Negative({ message: "n is negative." }))
      : Effect.succeed({ value: n * 2 }),
});
const boom = Capability.make({
  description: "Throws.",
  input: Num,
  output: Val,
  effect: "pure",
  handler: () => {
    throw new Error("boom");
  },
});
const undeclared = Capability.make({
  description: "Fails with an undeclared error.",
  input: Num,
  output: Val,
  effect: "pure",
  handler: () =>
    Effect.fail(
      new Undeclared({ message: "not declared." }),
    ) as unknown as Effect.Effect<{ readonly value: number }>,
});
const liar = Capability.make({
  description: "Returns output of the wrong shape.",
  input: Num,
  output: Val,
  effect: "pure",
  handler: () =>
    Effect.succeed({ value: "no" } as unknown as { readonly value: number }),
});
const declared = Capability.declare({
  description: "Declared only.",
  input: Num,
  output: Val,
  effect: "pure",
});
const counted = Capability.make({
  description: "Counts its calls.",
  input: Num,
  output: Val,
  effect: "pure",
  handler: ({ n }) =>
    Effect.sync(() => {
      calledCount += 1;
      return { value: n };
    }),
});

const math = Locus.extend(Purpose).make({
  id: "app:math",
  properties: { purpose: "Math." },
  capabilities: { double, boom, undeclared, liar, declared, counted },
});
const ui = Locus.extend(Ui).make({
  id: "app:ui",
  relations: [calls.to(math.capability("double"))],
});
const other = Locus.extend(Other).make({
  id: "app:other",
  relations: [refers.to(math.capability("double"))],
});
const bad = Locus.make({
  id: "app:bad",
  relations: [calls.to(math.capability("double"))],
});
const root = Locus.make({
  id: "app:root",
  contains: [math, ui, other, bad],
});
const model: SemanticModel = buildModel(root);

const run = (ref: CapabilityRef | string, input: unknown, via: string) =>
  Effect.runPromise(invoke(model, ref, input, { via }));

describe("isGranted", () => {
  test("a Locus is granted its own capabilities", () => {
    expect(
      isGranted(model, CapabilityRef.make("app:math", "double"), "app:math"),
    ).toBe(true);
  });

  test("a valid granting relation grants invocation", () => {
    expect(
      isGranted(model, CapabilityRef.make("app:math", "double"), "app:ui"),
    ).toBe(true);
  });

  test("a non-granting relation does not grant invocation", () => {
    expect(
      isGranted(model, CapabilityRef.make("app:math", "double"), "app:other"),
    ).toBe(false);
  });

  test("an invalid relation does not grant invocation", () => {
    expect(
      isGranted(model, CapabilityRef.make("app:math", "double"), "app:bad"),
    ).toBe(false);
  });
});

describe("invoke outcomes", () => {
  test("a granted call returns the encoded output", async () => {
    expect(await run("app:math#double", { n: 2 }, "app:math")).toEqual({
      ok: true,
      output: { value: 4 },
    });
  });

  test("a call granted through a relation returns the encoded output", async () => {
    expect(await run("app:math#double", { n: 2 }, "app:ui")).toEqual({
      ok: true,
      output: { value: 4 },
    });
  });

  test("a reference without # gives CapabilityNotFound", async () => {
    expect(await run("nohash", {}, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "CapabilityNotFound",
        message: "Not a capability reference: nohash.",
        issues: [],
      },
    });
  });

  test("an unknown Locus gives LocusNotFound", async () => {
    expect(await run("app:none#double", { n: 2 }, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "LocusNotFound",
        message: "No Locus app:none in the model.",
        issues: [],
      },
    });
  });

  test("an unknown capability gives CapabilityNotFound", async () => {
    expect(await run("app:math#nope", {}, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "CapabilityNotFound",
        message: "Locus app:math has no capability nope.",
        issues: [],
      },
    });
  });

  test("a caller without a grant gives NotGranted", async () => {
    expect(await run("app:math#double", { n: 2 }, "app:other")).toEqual({
      ok: false,
      error: {
        tag: "NotGranted",
        message: "app:other is not granted to invoke app:math#double.",
        issues: [],
      },
    });
  });

  test("invalid input gives InvalidInput with issues", async () => {
    expect(await run("app:math#double", { n: "x" }, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "InvalidInput",
        message: "Invalid input for app:math#double.",
        issues: [{ path: ["n"], message: "Expected number" }],
      },
    });
  });

  test("a declared error of the handler is returned with its tag and message", async () => {
    expect(await run("app:math#double", { n: -1 }, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "Negative",
        message: "n is negative.",
        issues: [],
      },
    });
  });

  test("a capability without handler gives NotImplemented", async () => {
    expect(await run("app:math#declared", { n: 1 }, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "NotImplemented",
        message: "app:math#declared has no implementation.",
        issues: [],
      },
    });
  });

  test("a handler that throws gives Defect with the thrown value", async () => {
    expect(await run("app:math#boom", { n: 1 }, "app:math")).toEqual({
      ok: false,
      error: {
        tag: "Defect",
        message: "app:math#boom failed unexpectedly: Error: boom.",
        issues: [],
      },
    });
  });

  test("a handler that fails with an undeclared error gives Defect", async () => {
    const outcome = await run("app:math#undeclared", { n: 1 }, "app:math");
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.tag).toBe("Defect");
    expect(
      outcome.error.message.startsWith(
        "app:math#undeclared failed unexpectedly: ",
      ),
    ).toBe(true);
  });

  test("output that does not match its contract gives InvalidOutput with issues", async () => {
    const outcome = await run("app:math#liar", { n: 1 }, "app:math");
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error.tag).toBe("InvalidOutput");
    expect(outcome.error.message).toBe(
      "app:math#liar returned output that does not match its contract.",
    );
    expect(outcome.error.issues.length).toBeGreaterThan(0);
  });

  test("invalid input never reaches the handler", async () => {
    calledCount = 0;
    const outcome = await run("app:math#counted", { n: "x" }, "app:math");
    expect(outcome.ok).toBe(false);
    expect(calledCount).toBe(0);
  });

  test("a valid input reaches the handler once", async () => {
    calledCount = 0;
    expect(await run("app:math#counted", { n: 3 }, "app:math")).toEqual({
      ok: true,
      output: { value: 3 },
    });
    expect(calledCount).toBe(1);
  });
});

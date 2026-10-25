import { describe, expect, test } from "bun:test";
import { Cause, Effect, Exit, Layer, Option, Schema } from "effect";
import { Archetype, type Rule, violation } from "../src/archetype";
import { Capability } from "../src/capability";
import { describeLocus, describeModel } from "../src/describe";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { CapabilityNotFound, LocusNotFound, Telos } from "../src/introspection";
import { Locus } from "../src/locus";
import { buildModel } from "../src/model";
import { RelationType } from "../src/relation";

const Num = Schema.Struct({ n: Schema.Finite });
const Val = Schema.Struct({ value: Schema.Finite });
class Negative extends Schema.TaggedError<Negative>()("Negative", {
  message: Schema.String,
}) {}

const calls = RelationType.make("test.calls", {
  description: "Calls a capability.",
  target: "capability",
  grantsInvocation: true,
});
const uses = RelationType.make("test.uses", {
  description: "Uses a Locus.",
  target: "locus",
});
const Ui = Extension.make("test.ui", {
  description: "A test interface Locus kind.",
  relationTypes: [calls, uses],
});

const ruleA: Rule = {
  id: "r.a",
  description: "always passes",
  method: "static",
  check: () => Effect.void,
};
const ruleB: Rule = {
  id: "r.b",
  description: "always fails",
  method: "static",
  check: () => violation("Rule r.b failed."),
};
const MathRules = Extension.make("test.math", {
  description: "Carries the math archetype.",
  archetypes: [
    Archetype.make({
      id: "test.math-rules",
      description: "Rules for every Locus with a purpose.",
      appliesTo: ["telos.purpose"],
      rules: [ruleA, ruleB],
    }),
  ],
});

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

const math = Locus.extend(Purpose).make({
  id: "app:math",
  properties: { purpose: "Math." },
  capabilities: { double },
});
const ui = Locus.extend(Ui).make({
  id: "app:ui",
  relations: [calls.to(math.capability("double")), uses.to(math)],
});
const root = Locus.extend(MathRules).make({
  id: "app:root",
  contains: [math, ui],
});
const model = buildModel(root);

function failureOf<A, E>(exit: Exit.Exit<A, E>): E {
  expect(Exit.isFailure(exit)).toBe(true);
  if (!Exit.isFailure(exit)) throw new Error("expected a failure");
  const error = Cause.findErrorOption(exit.cause);
  if (!Option.isSome(error)) throw new Error("expected a typed failure");
  return error.value;
}

describe("Telos service", () => {
  test("make exposes the model root and the model ids", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    expect(api.model.root).toBe("app:root");
    expect(await Effect.runPromise(api.loci())).toEqual(api.model.ids);
  });

  test("resolve fails with LocusNotFound for an unknown id", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const error = failureOf(
      await Effect.runPromiseExit(api.resolve("app:none")),
    );
    expect(error).toBeInstanceOf(LocusNotFound);
    expect(error.id).toBe("app:none");
    expect(error.message).toBe("No Locus app:none in the model.");
  });

  test("resolve returns a view whose inspect, relations and capabilities match the description", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const view = await Effect.runPromise(api.resolve("app:math"));
    expect(view.id).toBe("app:math");
    const described = await Effect.runPromise(describeLocus(model, "app:math"));
    expect(await Effect.runPromise(view.inspect())).toEqual(described);
    expect(await Effect.runPromise(view.relations())).toEqual(
      described.relations,
    );
    expect(await Effect.runPromise(view.capabilities())).toEqual(
      described.capabilities,
    );
  });

  test("verifications are not-run before a verify and reflect the stored report after it", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const view = await Effect.runPromise(api.resolve("app:math"));

    const before = await Effect.runPromise(view.verifications());
    expect(before.length).toBeGreaterThan(0);
    expect(before.every((entry) => entry.outcome === "not-run")).toBe(true);

    await Effect.runPromise(api.verify({ runner: "test" }));
    const after = await Effect.runPromise(view.verifications());
    const passed = after.find((entry) => entry.rule === "r.a");
    const failed = after.find((entry) => entry.rule === "r.b");
    expect(passed?.knowledge).toBe("verified");
    expect(failed?.knowledge).toBe("failed");
  });

  test("describe and diagnostics equal the model description and diagnostics", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    expect(await Effect.runPromise(api.describe())).toEqual(
      await Effect.runPromise(describeModel(model)),
    );
    expect(await Effect.runPromise(api.diagnostics())).toEqual(
      model.diagnostics,
    );
  });

  test("impact fails with LocusNotFound for an unknown Locus", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const error = failureOf(
      await Effect.runPromiseExit(api.impact("app:none")),
    );
    if (!(error instanceof LocusNotFound))
      throw new Error("expected LocusNotFound");
    expect(error.id).toBe("app:none");
  });

  test("impact fails with LocusNotFound for a capability of an unknown Locus", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const error = failureOf(
      await Effect.runPromiseExit(api.impact("app:none#x")),
    );
    if (!(error instanceof LocusNotFound))
      throw new Error("expected LocusNotFound");
    expect(error.id).toBe("app:none");
  });

  test("impact fails with CapabilityNotFound for an unknown capability", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const error = failureOf(
      await Effect.runPromiseExit(api.impact("app:math#nope")),
    );
    if (!(error instanceof CapabilityNotFound))
      throw new Error("expected CapabilityNotFound");
    expect(error.ref).toBe("app:math#nope");
    expect(error.message).toBe("Locus app:math has no capability nope.");
  });

  test("impact of a known capability returns a derived report for that target", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const report = await Effect.runPromise(api.impact("app:math#double"));
    expect(report.target).toBe("app:math#double");
    expect(report.knowledge).toBe("derived");
    expect(report.affected.map((entry) => entry.locus)).toEqual(["app:ui"]);
  });

  test("invoke runs a granted capability through the kernel", async () => {
    const api = await Effect.runPromise(Telos.make(root));
    const outcome = await Effect.runPromise(
      api.invoke("app:math#double", { n: 2 }, { via: "app:ui" }),
    );
    expect(outcome).toEqual({ ok: true, output: { value: 4 } });
  });

  test("the layer provides the same service to an Effect program", async () => {
    const ids = await Effect.runPromise(
      Effect.gen(function* () {
        const telos = yield* Telos;
        return yield* telos.loci();
      }).pipe(Effect.provide(Telos.layer(root))),
    );
    expect(ids).toEqual(model.ids);
    expect(Layer.isLayer(Telos.layer(root))).toBe(true);
  });
});

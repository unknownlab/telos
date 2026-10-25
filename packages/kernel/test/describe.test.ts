import { describe, expect, test } from "bun:test";
import { Effect, Exit, Schema } from "effect";
import { Archetype, violation, type Rule } from "../src/archetype";
import { Capability } from "../src/capability";
import {
  describeCapability,
  describeLocus,
  describeModel,
  describeVerifications,
} from "../src/describe";
import { digestOf } from "../src/digest";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { Locus } from "../src/locus";
import { buildModel, type SemanticModel } from "../src/model";
import { RelationType } from "../src/relation";
import { verify } from "../src/verify";

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
const half = Capability.make({
  description: "Halves n.",
  input: Num,
  output: Val,
  effect: "pure",
  handler: ({ n }) => Effect.succeed({ value: n / 2 }),
});

const math = Locus.extend(Purpose).make({
  id: "app:math",
  properties: { purpose: "Math." },
  capabilities: { double, half },
});
const ui = Locus.extend(Ui).make({
  id: "app:ui",
  relations: [calls.to(math.capability("double")), uses.to(math)],
});
const root = Locus.extend(MathRules).make({
  id: "app:root",
  contains: [math, ui],
});
const model: SemanticModel = buildModel(root);

function declaredModel(output: Schema.Codec<any, any>): SemanticModel {
  const declared = Capability.declare({
    description: "Declared only.",
    input: Num,
    output,
    effect: "pure",
  });
  return buildModel(
    Locus.extend(Purpose).make({
      id: "app:x",
      properties: { purpose: "X." },
      capabilities: { c: declared },
    }),
  );
}

describe("describeCapability", () => {
  test("describes a capability with its ref, effect, schemas, implementation and exposure", async () => {
    const d = await Effect.runPromise(
      describeCapability(model, "app:math", "double"),
    );
    expect(d.ref).toBe("app:math#double");
    expect(d.effect).toBe("pure");
    expect(d.input.schema).toMatchObject({ type: "object" });
    expect(d.errors[0]!.tag).toBe("Negative");
    expect(d.implemented).toBe(true);
    expect(d.exposedBy).toEqual([
      { locus: "app:ui", relationType: "test.calls" },
    ]);
    expect(d.knowledge).toBe("declared");
  });

  test("contractDigest equals digestOf of the contract fields", async () => {
    const d = await Effect.runPromise(
      describeCapability(model, "app:math", "double"),
    );
    const expected = await Effect.runPromise(
      digestOf({
        input: d.input,
        output: d.output,
        errors: d.errors,
        effect: d.effect,
      }),
    );
    expect(d.contractDigest).toBe(expected);
  });

  test("contractDigest changes when the output schema changes", async () => {
    const same = await Effect.runPromise(
      describeCapability(declaredModel(Val), "app:x", "c"),
    );
    const other = await Effect.runPromise(
      describeCapability(
        declaredModel(Schema.Struct({ value: Schema.String })),
        "app:x",
        "c",
      ),
    );
    expect(other.contractDigest).not.toBe(same.contractDigest);
  });

  test("contractDigest stays the same for an identical schema built again", async () => {
    const first = await Effect.runPromise(
      describeCapability(declaredModel(Val), "app:x", "c"),
    );
    const second = await Effect.runPromise(
      describeCapability(
        declaredModel(Schema.Struct({ value: Schema.Finite })),
        "app:x",
        "c",
      ),
    );
    expect(second.contractDigest).toBe(first.contractDigest);
  });

  test("a declared capability without handler is not implemented", async () => {
    const d = await Effect.runPromise(
      describeCapability(declaredModel(Val), "app:x", "c"),
    );
    expect(d.implemented).toBe(false);
    expect(d.exposedBy).toEqual([]);
  });

  test("an unknown Locus or capability dies", async () => {
    const unknownLocus = await Effect.runPromiseExit(
      describeCapability(model, "app:none", "double"),
    );
    const unknownCapability = await Effect.runPromiseExit(
      describeCapability(model, "app:math", "nope"),
    );
    expect(Exit.isFailure(unknownLocus)).toBe(true);
    expect(Exit.isFailure(unknownCapability)).toBe(true);
  });
});

describe("describeLocus", () => {
  test("lists the extensions, decoded properties and capabilities sorted by name", async () => {
    const d = await Effect.runPromise(describeLocus(model, "app:math"));
    expect(d.extensions).toEqual([
      { id: "telos.purpose", description: Purpose.description },
    ]);
    expect(d.properties).toEqual({ purpose: "Math." });
    expect(d.capabilities.map((c) => c.name)).toEqual(["double", "half"]);
    expect(d.knowledge).toBe("declared");
  });

  test("incoming relations are derived and come from app:ui", async () => {
    const d = await Effect.runPromise(describeLocus(model, "app:math"));
    expect(d.relations.incoming.map((r) => r.from).sort()).toEqual([
      "app:ui",
      "app:ui",
    ]);
    for (const relation of d.relations.incoming) {
      expect(relation.knowledge).toBe("derived");
    }
  });

  test("archetype rules are listed with their methods", async () => {
    const d = await Effect.runPromise(describeLocus(model, "app:math"));
    expect(d.archetypes.map((a) => a.id)).toEqual(["test.math-rules"]);
    expect(d.archetypes[0]!.rules).toEqual([
      { id: "r.a", description: "always passes", method: "static" },
      { id: "r.b", description: "always fails", method: "static" },
    ]);
  });

  test("outgoing relations are declared and carry grantsInvocation and typeDescription", async () => {
    const d = await Effect.runPromise(describeLocus(model, "app:ui"));
    expect(d.relations.outgoing.length).toBe(2);
    for (const relation of d.relations.outgoing) {
      expect(relation.knowledge).toBe("declared");
      expect(relation.typeDescription.length).toBeGreaterThan(0);
    }
    const call = d.relations.outgoing.find((r) => r.type === "test.calls");
    expect(call?.grantsInvocation).toBe(true);
    expect(call?.target).toEqual({ locus: "app:math", capability: "double" });
  });

  test("diagnostics contain only diagnostics whose subject is that id", async () => {
    const broken = buildModel(
      Locus.extend(MathRules).make({
        id: "app:root",
        contains: [
          math,
          Locus.extend(Ui).make({
            id: "app:ui",
            relations: [uses.to("app:missing")],
          }),
        ],
      }),
    );
    const ui2 = await Effect.runPromise(describeLocus(broken, "app:ui"));
    const math2 = await Effect.runPromise(describeLocus(broken, "app:math"));
    expect(ui2.diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of ui2.diagnostics) {
      expect(diagnostic.subject).toBe("app:ui");
    }
    expect(math2.diagnostics).toEqual([]);
  });

  test("digest equals digestOf of the description without digest and knowledge", async () => {
    const d = await Effect.runPromise(describeLocus(model, "app:math"));
    const { digest, knowledge, ...rest } = d;
    expect(digest).toBe(await Effect.runPromise(digestOf(rest)));
    expect(knowledge).toBe("declared");
  });

  test("an unknown id dies", async () => {
    const exit = await Effect.runPromiseExit(describeLocus(model, "app:none"));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("describeModel", () => {
  test("loci follow model.ids and the digest covers the locus digests", async () => {
    const d = await Effect.runPromise(describeModel(model));
    expect(d.root).toBe("app:root");
    expect(d.loci.map((l) => l.id)).toEqual([...model.ids]);
    expect(d.digest).toBe(
      await Effect.runPromise(digestOf(d.loci.map((l) => l.digest))),
    );
  });

  test("describing twice gives identical JSON", async () => {
    const first = await Effect.runPromise(describeModel(model));
    const second = await Effect.runPromise(describeModel(model));
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  test("the description never contains observed or invalidated", async () => {
    const d = await Effect.runPromise(describeModel(model));
    const text = JSON.stringify(d);
    expect(text.includes('"observed"')).toBe(false);
    expect(text.includes('"invalidated"')).toBe(false);
  });

  test("returned descriptions are frozen", async () => {
    const d = await Effect.runPromise(describeModel(model));
    expect(Object.isFrozen(d)).toBe(true);
    expect(Object.isFrozen(d.loci[0])).toBe(true);
  });
});

describe("describeVerifications", () => {
  test("without a report every rule is not-run, with null message and provenance", () => {
    const entries = describeVerifications(model, "app:math", null);
    expect(entries.map((e) => `${e.archetype}/${e.rule}`)).toEqual([
      "test.math-rules/r.a",
      "test.math-rules/r.b",
    ]);
    for (const entry of entries) {
      expect(entry.outcome).toBe("not-run");
      expect(entry.knowledge).toBe("not-run");
      expect(entry.message).toBeNull();
      expect(entry.provenance).toBeNull();
    }
  });

  test("with a report a passed rule is verified and a failed rule is failed with its message", async () => {
    const report = await Effect.runPromise(verify(model, { runner: "test" }));
    const entries = describeVerifications(model, "app:math", report);
    const passed = entries.find((e) => e.rule === "r.a")!;
    const failed = entries.find((e) => e.rule === "r.b")!;
    expect(passed.outcome).toBe("passed");
    expect(passed.knowledge).toBe("verified");
    expect(passed.provenance).toEqual(report.provenance);
    expect(failed.outcome).toBe("failed");
    expect(failed.knowledge).toBe("failed");
    expect(failed.message).toBe("Rule r.b failed.");
    expect(failed.provenance).toEqual(report.provenance);
  });
});

// START_MODULE_CONTRACT
//   PURPOSE: Prove that impact derives the affected Loci, their shortest relation paths and the applicable checks from the model, and that diffModels reports contract, capability and Locus changes between two models.
//   SCOPE: Tests of impact and diffModels. Out: the Telos service (introspection.test.ts) and the public export list (api.test.ts).
//   DEPENDS: M-KERNEL-IMPACT, M-KERNEL-MODEL, M-KERNEL-DESCRIBE, M-KERNEL-VERIFY, M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-IMPACT, V-M-KERNEL-IMPACT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Num - the input schema of the fixture capabilities
//   Sum - the output schema of the fixture capabilities
//   passRule - the static rule r.pass that always passes
//   calls - the test.calls relation type that grants invocation to a capability
//   uses - the test.uses relation type that points at a Locus
//   Ui - the test.ui extension with calls, uses and the test.ui-rules archetype
//   Core - the test.core extension with the test.core-rules archetype
//   RootRules - the test.root extension with the test.root-rules archetype
//   buildTree - builds the fixture root with optional changes to the core contract, the core subset, app:other and app:late
//   model - the fixture model with every Locus
//   checkOf - maps a check to a comparable record for the expected list
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Archetype, type Rule } from "../src/archetype";
import { Capability, type EffectClass } from "../src/capability";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { Locus } from "../src/locus";
import { buildModel, type SemanticModel } from "../src/model";
import { RelationType } from "../src/relation";
import { diffModels, impact } from "../src/impact";

const Num = Schema.Struct({ a: Schema.Finite, b: Schema.Finite });
const Sum = Schema.Struct({ value: Schema.Finite });

const passRule: Rule = {
  id: "r.pass",
  description: "always passes",
  method: "static",
  check: () => Effect.void,
};

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
  archetypes: [
    Archetype.make({
      id: "test.ui-rules",
      description: "Rules for interface Loci.",
      appliesTo: ["test.ui"],
      rules: [passRule],
    }),
  ],
});
const Core = Extension.make("test.core", {
  description: "A test core Locus kind.",
  archetypes: [
    Archetype.make({
      id: "test.core-rules",
      description: "Rules for core Loci.",
      appliesTo: ["test.core"],
      rules: [passRule],
    }),
  ],
});
const RootRules = Extension.make("test.root", {
  description: "Carries the root archetype.",
  archetypes: [
    Archetype.make({
      id: "test.root-rules",
      description: "Rules for the root Locus.",
      appliesTo: ["test.root"],
      rules: [passRule],
    }),
  ],
});

function buildTree(options: {
  readonly addEffect?: EffectClass;
  readonly withSub?: boolean;
  readonly withOther?: boolean;
  readonly otherPurpose?: string;
  readonly withLate?: boolean;
}): SemanticModel {
  const add = Capability.make({
    description: "Adds a and b.",
    input: Num,
    output: Sum,
    effect: options.addEffect ?? "pure",
    handler: ({ a, b }) => Effect.succeed({ value: a + b }),
  });
  const sub = Capability.make({
    description: "Subtracts b from a.",
    input: Num,
    output: Sum,
    effect: "pure",
    handler: ({ a, b }) => Effect.succeed({ value: a - b }),
  });
  const core = Locus.extend(Core).make({
    id: "app:core",
    capabilities: options.withSub === false ? { add } : { add, sub },
  });
  const cli = Locus.extend(Ui).make({
    id: "app:cli",
    relations: [calls.to(core.capability("add"))],
  });
  const web = Locus.extend(Ui).make({
    id: "app:web",
    relations: [calls.to(core.capability("add"))],
  });
  const gate = Locus.extend(Ui).make({
    id: "app:gate",
    relations: [uses.to(cli)],
  });
  const other = Locus.extend(Purpose).make({
    id: "app:other",
    properties: { purpose: options.otherPurpose ?? "Other." },
  });
  const late = Locus.extend(Ui).make({
    id: "app:late",
    relations: [calls.to(core.capability("add"))],
  });
  const contains = [
    core,
    cli,
    web,
    gate,
    ...(options.withOther === false ? [] : [other]),
    ...(options.withLate === true ? [late] : []),
  ];
  const root = Locus.extend(RootRules).make({
    id: "app:root",
    contains,
  });
  return buildModel(root);
}

const model = buildTree({});

function checkOf(check: {
  readonly locus: string;
  readonly archetype: string;
  readonly rule: string;
  readonly method: string;
}) {
  return { ...check };
}

describe("impact", () => {
  test("a capability target lists the Loci granting it, then their dependants, with shortest paths", () => {
    const report = impact(model, "app:core#add");
    expect(report.affected).toEqual([
      {
        locus: "app:cli",
        distance: 1,
        path: [{ from: "app:cli", type: "test.calls", to: "app:core#add" }],
      },
      {
        locus: "app:web",
        distance: 1,
        path: [{ from: "app:web", type: "test.calls", to: "app:core#add" }],
      },
      {
        locus: "app:gate",
        distance: 2,
        path: [
          { from: "app:gate", type: "test.uses", to: "app:cli" },
          { from: "app:cli", type: "test.calls", to: "app:core#add" },
        ],
      },
    ]);
  });

  test("a capability with no granting relation affects nothing", () => {
    expect(impact(model, "app:core#sub").affected).toEqual([]);
  });

  test("a Locus target includes the relations to any of its capabilities", () => {
    const affected = impact(model, "app:core").affected.map(
      (entry) => entry.locus,
    );
    expect(affected).toContain("app:cli");
    expect(affected).toContain("app:web");
  });

  test("a locus that is itself the target is never listed as affected", () => {
    const affected = impact(model, "app:core").affected.map(
      (entry) => entry.locus,
    );
    expect(affected).not.toContain("app:core");
  });

  test("checks cover the target, every affected Locus and their ancestors, once each, sorted", () => {
    const report = impact(model, "app:core#add");
    expect(report.knowledge).toBe("derived");
    expect(report.checks.map(checkOf)).toEqual([
      {
        locus: "app:cli",
        archetype: "test.ui-rules",
        rule: "r.pass",
        method: "static",
      },
      {
        locus: "app:core",
        archetype: "test.core-rules",
        rule: "r.pass",
        method: "static",
      },
      {
        locus: "app:gate",
        archetype: "test.ui-rules",
        rule: "r.pass",
        method: "static",
      },
      {
        locus: "app:root",
        archetype: "test.root-rules",
        rule: "r.pass",
        method: "static",
      },
      {
        locus: "app:web",
        archetype: "test.ui-rules",
        rule: "r.pass",
        method: "static",
      },
    ]);
  });

  test("a Locus added with a granting relation appears in affected after the model is rebuilt", () => {
    const grown = buildTree({ withLate: true });
    const affected = impact(grown, "app:core#add").affected;
    expect(affected).toContainEqual({
      locus: "app:late",
      distance: 1,
      path: [{ from: "app:late", type: "test.calls", to: "app:core#add" }],
    });
    expect(affected.map((entry) => entry.locus)).toEqual([
      "app:cli",
      "app:late",
      "app:web",
      "app:gate",
    ]);
  });
});

describe("diffModels", () => {
  test("identical models have no changes", async () => {
    const changes = await Effect.runPromise(diffModels(model, buildTree({})));
    expect(changes).toEqual([]);
  });

  test("a changed contract of a shared capability is one contract-changed with a non-empty patch", async () => {
    const changes = await Effect.runPromise(
      diffModels(model, buildTree({ addEffect: "write" })),
    );
    expect(changes).toHaveLength(1);
    const [change] = changes;
    expect(change?.kind).toBe("contract-changed");
    expect(change?.locus).toBe("app:core");
    expect(change?.capability).toBe("add");
    expect(change?.patch.length).toBeGreaterThan(0);
  });

  test("a Locus added is reported as locus-added with an empty patch", async () => {
    const changes = await Effect.runPromise(
      diffModels(model, buildTree({ withLate: true })),
    );
    expect(changes).toContainEqual({
      kind: "locus-added",
      locus: "app:late",
      capability: null,
      patch: [],
    });
  });

  test("a Locus removed is reported as locus-removed with an empty patch", async () => {
    const changes = await Effect.runPromise(
      diffModels(model, buildTree({ withOther: false })),
    );
    expect(changes).toContainEqual({
      kind: "locus-removed",
      locus: "app:other",
      capability: null,
      patch: [],
    });
  });

  test("a capability removed or added is reported as capability-removed or capability-added", async () => {
    const without = buildTree({ withSub: false });
    const removed = await Effect.runPromise(diffModels(model, without));
    expect(removed).toContainEqual({
      kind: "capability-removed",
      locus: "app:core",
      capability: "sub",
      patch: [],
    });
    const added = await Effect.runPromise(diffModels(without, model));
    expect(added).toContainEqual({
      kind: "capability-added",
      locus: "app:core",
      capability: "sub",
      patch: [],
    });
  });

  test("a changed description of a shared Locus is one locus-changed with a non-empty patch", async () => {
    const changes = await Effect.runPromise(
      diffModels(model, buildTree({ otherPurpose: "Changed." })),
    );
    expect(changes).toHaveLength(1);
    const [change] = changes;
    expect(change?.kind).toBe("locus-changed");
    expect(change?.locus).toBe("app:other");
    expect(change?.capability).toBeNull();
    expect(change?.patch.length).toBeGreaterThan(0);
  });

  test("changes are sorted by locus, then capability, then kind", async () => {
    const changes = await Effect.runPromise(
      diffModels(
        model,
        buildTree({ addEffect: "write", otherPurpose: "Changed." }),
      ),
    );
    expect(changes.map((change) => [change.locus, change.kind])).toEqual([
      ["app:core", "contract-changed"],
      ["app:other", "locus-changed"],
    ]);
  });
});

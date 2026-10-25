import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { Archetype } from "../src/archetype";
import { Capability } from "../src/capability";
import type { Diagnostic, DiagnosticCode } from "../src/diagnostic";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { Locus } from "../src/locus";
import {
  ancestors,
  buildModel,
  hasErrors,
  type SemanticModel,
} from "../src/model";
import { RelationType } from "../src/relation";

function codesOf(model: SemanticModel): ReadonlyArray<DiagnosticCode> {
  return model.diagnostics.map((d) => d.code);
}

function withCode(
  model: SemanticModel,
  code: DiagnosticCode,
): ReadonlyArray<Diagnostic> {
  return model.diagnostics.filter((d) => d.code === code);
}

describe("buildModel structure", () => {
  test("a root with no children gives one id, no relations and no diagnostics", () => {
    const model = buildModel(Locus.make({ id: "app:root" }));
    expect(model.root).toBe("app:root");
    expect(model.ids).toEqual(["app:root"]);
    expect(model.relations).toEqual([]);
    expect(model.diagnostics).toEqual([]);
    expect(model.loci.get("app:root")).toMatchObject({
      container: null,
      depth: 0,
      contains: [],
    });
  });

  test("ids are sorted and each container lists its children sorted", () => {
    const a = Locus.make({ id: "app:a" });
    const b = Locus.make({ id: "app:b" });
    const model = buildModel(Locus.make({ id: "app:root", contains: [b, a] }));
    expect(model.ids).toEqual(["app:a", "app:b", "app:root"]);
    expect(model.loci.get("app:root")?.contains).toEqual(["app:a", "app:b"]);
    expect(model.loci.get("app:a")).toMatchObject({
      container: "app:root",
      depth: 1,
    });
  });
});

describe("identity.malformed", () => {
  test("reports an id that fails the identity grammar, with its exact message", () => {
    const model = buildModel(Locus.make({ id: "Bad Id" }));
    expect(withCode(model, "identity.malformed")).toEqual([
      {
        code: "identity.malformed",
        severity: "error",
        subject: "Bad Id",
        path: "id",
        members: [],
        message: 'Locus id "Bad Id" does not match the identity grammar.',
      },
    ]);
  });

  test("does not report a well-formed id", () => {
    const model = buildModel(Locus.make({ id: "app:good" }));
    expect(withCode(model, "identity.malformed")).toEqual([]);
  });
});

describe("identity.duplicate", () => {
  test("reports two different Locus objects with the same id, with the exact message", () => {
    const first = Locus.make({ id: "app:x" });
    const second = Locus.make({ id: "app:x" });
    const model = buildModel(
      Locus.make({ id: "app:root", contains: [first, second] }),
    );
    expect(withCode(model, "identity.duplicate")).toEqual([
      {
        code: "identity.duplicate",
        severity: "error",
        subject: "app:x",
        path: "id",
        members: [],
        message: "Locus id app:x is declared by two different Locus objects.",
      },
    ]);
    expect(model.ids).toEqual(["app:root", "app:x"]);
  });

  test("does not report one Locus object that appears once", () => {
    const first = Locus.make({ id: "app:x" });
    const model = buildModel(Locus.make({ id: "app:root", contains: [first] }));
    expect(withCode(model, "identity.duplicate")).toEqual([]);
  });
});

describe("ownership.multiple", () => {
  test("reports one Locus object contained by two containers, with both container ids", () => {
    const c = Locus.make({ id: "app:c" });
    const a = Locus.make({ id: "app:a", contains: [c] });
    const b = Locus.make({ id: "app:b", contains: [c] });
    const model = buildModel(Locus.make({ id: "app:root", contains: [a, b] }));
    expect(withCode(model, "ownership.multiple")).toEqual([
      {
        code: "ownership.multiple",
        severity: "error",
        subject: "app:c",
        path: "contains",
        members: ["app:a", "app:b"],
        message: "Locus app:c is contained by both app:a and app:b.",
      },
    ]);
    expect(model.loci.get("app:c")?.container).toBe("app:a");
  });

  test("does not report when each container holds a different object", () => {
    const a = Locus.make({
      id: "app:a",
      contains: [Locus.make({ id: "app:c1" })],
    });
    const b = Locus.make({
      id: "app:b",
      contains: [Locus.make({ id: "app:c2" })],
    });
    const model = buildModel(Locus.make({ id: "app:root", contains: [a, b] }));
    expect(withCode(model, "ownership.multiple")).toEqual([]);
  });
});

describe("composition conflicts", () => {
  test("composition.extension-id-conflict is reported for two extension objects with one id", () => {
    const other = Extension.make("telos.purpose", { description: "d" });
    const locus = Locus.extend(Purpose)
      .extend(other)
      .make({
        id: "app:x",
        properties: { purpose: "p" },
      });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "composition.extension-id-conflict")).toEqual([
      {
        code: "composition.extension-id-conflict",
        severity: "error",
        subject: "app:x",
        path: "kind",
        members: ["telos.purpose", "telos.purpose"],
        message: "Two different extensions share the id telos.purpose.",
      },
    ]);
  });

  test("composition.property-conflict is reported for a property defined twice", () => {
    const other = Extension.make("other.purpose", {
      description: "d",
      properties: { purpose: Schema.String },
    });
    const locus = Locus.extend(Purpose, other).make({
      id: "app:x",
      properties: { purpose: "p" },
    });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "composition.property-conflict")).toEqual([
      {
        code: "composition.property-conflict",
        severity: "error",
        subject: "app:x",
        path: "kind",
        members: ["telos.purpose", "other.purpose"],
        message:
          "Extensions telos.purpose and other.purpose both define property purpose.",
      },
    ]);
  });

  test("composition.relation-type-conflict is reported for two relation type objects with one id", () => {
    const first = RelationType.make("x.rel", {
      description: "d",
      target: "locus",
    });
    const second = RelationType.make("x.rel", {
      description: "d",
      target: "locus",
    });
    const one = Extension.make("x.one", {
      description: "d",
      relationTypes: [first],
    });
    const two = Extension.make("x.two", {
      description: "d",
      relationTypes: [second],
    });
    const locus = Locus.extend(one, two).make({ id: "app:x" });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "composition.relation-type-conflict")).toEqual([
      {
        code: "composition.relation-type-conflict",
        severity: "error",
        subject: "app:x",
        path: "kind",
        members: ["x.one", "x.two"],
        message: "Extensions x.one and x.two both define relation type x.rel.",
      },
    ]);
  });

  test("composition.archetype-id-conflict is reported for two archetype objects with one id", () => {
    const first = Archetype.make({
      id: "x.arch",
      description: "d",
      appliesTo: [],
      rules: [],
    });
    const second = Archetype.make({
      id: "x.arch",
      description: "d",
      appliesTo: [],
      rules: [],
    });
    const one = Extension.make("x.one", {
      description: "d",
      archetypes: [first],
    });
    const two = Extension.make("x.two", {
      description: "d",
      archetypes: [second],
    });
    const locus = Locus.extend(one, two).make({ id: "app:x" });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "composition.archetype-id-conflict")).toEqual([
      {
        code: "composition.archetype-id-conflict",
        severity: "error",
        subject: "app:x",
        path: "kind",
        members: ["x.one", "x.two"],
        message: "Extensions x.one and x.two both define archetype x.arch.",
      },
    ]);
  });

  test("a kind without conflicts reports no composition code", () => {
    const locus = Locus.extend(Purpose).make({
      id: "app:x",
      properties: { purpose: "p" },
    });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    const composition = codesOf(model).filter((code) =>
      code.startsWith("composition."),
    );
    expect(composition).toEqual([]);
  });
});

describe("property.invalid", () => {
  test("reports properties that do not decode, with the exact example message", () => {
    const locus = Locus.extend(Purpose).make({
      id: "app:x",
      properties: { purpose: 3 } as never,
    });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "property.invalid")).toEqual([
      {
        code: "property.invalid",
        severity: "error",
        subject: "app:x",
        path: "properties",
        members: [],
        message: "Properties of app:x are invalid: purpose: Expected string.",
      },
    ]);
  });

  test("does not report valid properties", () => {
    const locus = Locus.extend(Purpose).make({
      id: "app:x",
      properties: { purpose: "p" },
    });
    const model = buildModel(Locus.make({ id: "app:root", contains: [locus] }));
    expect(withCode(model, "property.invalid")).toEqual([]);
  });
});

describe("capability.name-malformed", () => {
  const cap = Capability.declare({
    description: "d",
    input: Schema.String,
    output: Schema.String,
    effect: "pure",
  });

  test("reports a capability name that fails the grammar, with the path of the name", () => {
    const model = buildModel(
      Locus.make({ id: "app:x", capabilities: { Add: cap } }),
    );
    expect(withCode(model, "capability.name-malformed")).toEqual([
      {
        code: "capability.name-malformed",
        severity: "error",
        subject: "app:x",
        path: "capabilities/Add",
        members: [],
        message:
          'Capability name "Add" does not match the capability name grammar.',
      },
    ]);
  });

  test("does not report a camelCase capability name", () => {
    const model = buildModel(
      Locus.make({ id: "app:x", capabilities: { add: cap } }),
    );
    expect(withCode(model, "capability.name-malformed")).toEqual([]);
  });
});

describe("hasErrors", () => {
  test("is false for a model with no diagnostics", () => {
    expect(hasErrors(buildModel(Locus.make({ id: "app:ok" })))).toBe(false);
  });

  test("is true for a model with an error diagnostic", () => {
    expect(hasErrors(buildModel(Locus.make({ id: "Bad Id" })))).toBe(true);
  });
});

describe("ancestors", () => {
  test("lists the containers of a Locus nearest first, and nothing for the root or an unknown id", () => {
    const c = Locus.make({ id: "app:c" });
    const a = Locus.make({ id: "app:a", contains: [c] });
    const model = buildModel(Locus.make({ id: "app:root", contains: [a] }));
    expect(ancestors(model, "app:c")).toEqual(["app:a", "app:root"]);
    expect(ancestors(model, "app:root")).toEqual([]);
    expect(ancestors(model, "app:unknown")).toEqual([]);
  });
});

describe("frozen model", () => {
  test("the model and its arrays and Loci are frozen", () => {
    const model = buildModel(
      Locus.make({ id: "app:root", contains: [Locus.make({ id: "app:a" })] }),
    );
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.ids)).toBe(true);
    expect(Object.isFrozen(model.relations)).toBe(true);
    expect(Object.isFrozen(model.diagnostics)).toBe(true);
    expect(Object.isFrozen(model.loci.get("app:a"))).toBe(true);
    expect(Object.isFrozen(model.loci.get("app:root")?.contains)).toBe(true);
  });
});

describe("extensions and archetypes of the model", () => {
  test("extensions and archetypes are keyed in sorted order and keep the first object per id", () => {
    const zeta = Extension.make("x.zeta", { description: "d" });
    const alpha = Extension.make("x.alpha", { description: "d" });
    const alphaAgain = Extension.make("x.alpha", { description: "d" });
    const rule = Archetype.make({
      id: "x.rule",
      description: "d",
      appliesTo: ["x.zeta"],
      rules: [],
    });
    const zetaWithRule = Extension.make("x.zeta", {
      description: "d",
      archetypes: [rule],
    });
    const model = buildModel(
      Locus.make({
        id: "app:root",
        contains: [
          Locus.extend(zeta).make({ id: "app:z" }),
          Locus.extend(alpha).make({ id: "app:a" }),
          Locus.extend(alphaAgain).make({ id: "app:b" }),
          Locus.extend(zetaWithRule).make({ id: "app:y" }),
        ],
      }),
    );
    expect([...model.extensions.keys()]).toEqual(["x.alpha", "x.zeta"]);
    expect(model.extensions.get("x.alpha")).toBe(alpha);
    expect([...model.archetypes.keys()]).toEqual(["x.rule"]);
    expect(model.archetypes.get("x.rule")).toBe(rule);
  });
});

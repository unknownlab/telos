import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Archetype } from "../src/archetype";
import { Capability } from "../src/capability";
import { Extension } from "../src/extension";
import { Purpose } from "../src/extensions/purpose";
import { External, Source } from "../src/extensions/source";
import { Locus } from "../src/locus";
import { RelationType } from "../src/relation";

describe("Locus.make minimality", () => {
  test("a Locus with only an id has empty optional parts and is deep-frozen", () => {
    const locus = Locus.make({ id: "app:a" });
    expect(locus.description).toBeNull();
    expect(locus.contains).toEqual([]);
    expect(locus.relations).toEqual([]);
    expect(locus.capabilities).toEqual({});
    expect(locus.properties).toEqual({});
    expect(locus.propertyIssues).toEqual([]);
    expect(locus.kind.extensions).toEqual([]);
    expect(Object.isFrozen(locus)).toBe(true);
    expect(Object.isFrozen(locus.contains)).toBe(true);
    expect(Object.isFrozen(locus.relations)).toBe(true);
    expect(Object.isFrozen(locus.properties)).toBe(true);
  });
});

describe("Locus.extend composition", () => {
  test("two composed extensions keep their order, decode their properties and have no conflicts", () => {
    const kind = Locus.extend(Purpose, Source);
    const locus = kind.make({
      id: "app:a",
      properties: { purpose: "p", sources: ["a/**"] },
    });
    expect(locus.kind.extensions.map((e) => e.id)).toEqual([
      "telos.purpose",
      "telos.source",
    ]);
    expect(locus.properties).toEqual({ purpose: "p", sources: ["a/**"] });
    expect(locus.propertyIssues).toEqual([]);
    expect(kind.conflicts).toEqual([]);
  });

  test("extend skips the same extension object given twice", () => {
    const kind = Locus.extend(Purpose, Purpose);
    expect(kind.extensions.map((e) => e.id)).toEqual(["telos.purpose"]);
    expect(kind.conflicts).toEqual([]);
  });

  test("extend skips an extension object already present from an earlier extend", () => {
    const kind = Locus.extend(Purpose).extend(Purpose);
    expect(kind.extensions.map((e) => e.id)).toEqual(["telos.purpose"]);
    expect(kind.conflicts).toEqual([]);
  });
});

describe("composition.extension-id-conflict", () => {
  test("a different extension object with the same id is reported", () => {
    const other = Extension.make("telos.purpose", { description: "d" });
    const kind = Locus.extend(Purpose).extend(other);
    expect(kind.conflicts).toEqual([
      {
        code: "composition.extension-id-conflict",
        subject: "telos.purpose",
        extensions: ["telos.purpose", "telos.purpose"],
      },
    ]);
  });
});

describe("composition.property-conflict", () => {
  test("a property defined by two extensions is reported and the first schema wins", () => {
    const other = Extension.make("other.purpose", {
      description: "d",
      properties: { purpose: Schema.String },
    });
    const kind = Locus.extend(Purpose, other);
    expect(kind.conflicts).toEqual([
      {
        code: "composition.property-conflict",
        subject: "purpose",
        extensions: ["telos.purpose", "other.purpose"],
      },
    ]);
    expect(kind.properties.purpose).toBe(Purpose.properties.purpose);
  });
});

describe("composition.relation-type-conflict", () => {
  const first = RelationType.make("x.rel", {
    description: "d",
    target: "locus",
  });
  const second = RelationType.make("x.rel", {
    description: "d",
    target: "locus",
  });

  test("two different relation type objects with the same id are reported", () => {
    const one = Extension.make("x.one", {
      description: "d",
      relationTypes: [first],
    });
    const two = Extension.make("x.two", {
      description: "d",
      relationTypes: [second],
    });
    expect(Locus.extend(one, two).conflicts).toEqual([
      {
        code: "composition.relation-type-conflict",
        subject: "x.rel",
        extensions: ["x.one", "x.two"],
      },
    ]);
  });

  test("the same relation type object in two extensions is not a conflict", () => {
    const one = Extension.make("x.one", {
      description: "d",
      relationTypes: [first],
    });
    const three = Extension.make("x.three", {
      description: "d",
      relationTypes: [first],
    });
    expect(Locus.extend(one, three).conflicts).toEqual([]);
  });
});

describe("composition.archetype-id-conflict", () => {
  const first = Archetype.make({
    id: "x.arch",
    description: "d",
    appliesTo: ["x.one"],
    rules: [],
  });
  const second = Archetype.make({
    id: "x.arch",
    description: "d",
    appliesTo: ["x.two"],
    rules: [],
  });

  test("two different archetype objects with the same id are reported", () => {
    const one = Extension.make("x.one", {
      description: "d",
      archetypes: [first],
    });
    const two = Extension.make("x.two", {
      description: "d",
      archetypes: [second],
    });
    expect(Locus.extend(one, two).conflicts).toEqual([
      {
        code: "composition.archetype-id-conflict",
        subject: "x.arch",
        extensions: ["x.one", "x.two"],
      },
    ]);
  });

  test("the same archetype object in two extensions is not a conflict", () => {
    const one = Extension.make("x.one", {
      description: "d",
      archetypes: [first],
    });
    const three = Extension.make("x.three", {
      description: "d",
      archetypes: [first],
    });
    expect(Locus.extend(one, three).conflicts).toEqual([]);
  });
});

describe("Locus.make never throws", () => {
  test("invalid properties are kept raw and reported as property issues", () => {
    const locus = Locus.extend(Purpose).make({
      id: "app:x",
      properties: { purpose: 3 } as never,
    });
    expect(locus.properties).toEqual({ purpose: 3 });
    expect(locus.propertyIssues).toEqual([
      { path: ["purpose"], message: "Expected string" },
    ]);
  });
});

describe("Locus capabilities", () => {
  const add = Capability.make({
    description: "d",
    input: Schema.Finite,
    output: Schema.Finite,
    effect: "pure",
    handler: (x) => Effect.succeed(x),
  });

  test("schemas inside a capability stay unfrozen", () => {
    const locus = Locus.make({ id: "app:c", capabilities: { add } });
    expect(Object.isFrozen(locus.capabilities.add.input)).toBe(false);
  });

  test("definition.capability returns a CapabilityRef for the locus id", () => {
    const locus = Locus.make({ id: "app:c", capabilities: { add } });
    expect(locus.capability("add")).toEqual({
      _tag: "CapabilityRef",
      locus: "app:c",
      capability: "add",
    });
  });
});

describe("External extension", () => {
  test("a Locus of an extension with a required property and no value has a property issue", () => {
    const noPackages = Locus.extend(External).make({
      id: "app:e",
      // @ts-expect-error packages is required
      properties: {},
    });
    expect(noPackages.propertyIssues.length).toBeGreaterThan(0);
  });
});

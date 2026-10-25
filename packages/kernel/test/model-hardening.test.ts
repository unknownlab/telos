import { describe, expect, test } from "bun:test";
import { Archetype } from "../src/archetype";
import type { Diagnostic, DiagnosticCode } from "../src/diagnostic";
import { Extension } from "../src/extension";
import { Locus } from "../src/locus";
import {
  buildModel,
  hasErrors,
  type ModelLocus,
  type SemanticModel,
} from "../src/model";

function withCode(
  model: SemanticModel,
  code: DiagnosticCode,
): ReadonlyArray<Diagnostic> {
  return model.diagnostics.filter((d) => d.code === code);
}

const READ_ONLY = new TypeError("SemanticModel maps are read-only.");

describe("archetype.applies-to-empty", () => {
  test("archetype.applies-to-empty is reported for every Locus whose kind has the archetype", () => {
    const empty = Archetype.make({
      id: "x.empty",
      description: "d",
      appliesTo: [],
      rules: [],
    });
    const ext = Extension.make("x.ext", {
      description: "d",
      archetypes: [empty],
    });
    const Kind = Locus.extend(ext);
    const model = buildModel(
      Locus.make({
        id: "app:root",
        contains: [Kind.make({ id: "app:b" }), Kind.make({ id: "app:a" })],
      }),
    );
    expect(withCode(model, "archetype.applies-to-empty")).toEqual([
      {
        code: "archetype.applies-to-empty",
        severity: "error",
        subject: "app:a",
        path: "kind",
        members: ["x.empty"],
        message:
          "Archetype x.empty of extension x.ext has an empty appliesTo list, so it would apply to every Locus.",
      },
      {
        code: "archetype.applies-to-empty",
        severity: "error",
        subject: "app:b",
        path: "kind",
        members: ["x.empty"],
        message:
          "Archetype x.empty of extension x.ext has an empty appliesTo list, so it would apply to every Locus.",
      },
    ]);
    expect(hasErrors(model)).toBe(true);
  });

  test("archetype.applies-to-empty is not reported when appliesTo names an extension", () => {
    const named = Archetype.make({
      id: "x.empty",
      description: "d",
      appliesTo: ["x.ext"],
      rules: [],
    });
    const ext = Extension.make("x.ext", {
      description: "d",
      archetypes: [named],
    });
    const Kind = Locus.extend(ext);
    const model = buildModel(
      Locus.make({
        id: "app:root",
        contains: [Kind.make({ id: "app:b" }), Kind.make({ id: "app:a" })],
      }),
    );
    expect(withCode(model, "archetype.applies-to-empty")).toEqual([]);
    expect(model.diagnostics).toEqual([]);
  });

  test("archetype.applies-to-empty is reported once per Locus when an extension lists the same archetype twice", () => {
    const empty = Archetype.make({
      id: "x.empty",
      description: "d",
      appliesTo: [],
      rules: [],
    });
    const ext = Extension.make("x.ext", {
      description: "d",
      archetypes: [empty, empty],
    });
    const model = buildModel(
      Locus.make({
        id: "app:root",
        contains: [Locus.extend(ext).make({ id: "app:a" })],
      }),
    );
    const found = withCode(model, "archetype.applies-to-empty");
    expect(found.length).toBe(1);
    expect(found[0]?.subject).toBe("app:a");
  });

  test("archetype.applies-to-empty names the extension that declares the archetype", () => {
    const first = Archetype.make({
      id: "x.first",
      description: "d",
      appliesTo: [],
      rules: [],
    });
    const second = Archetype.make({
      id: "x.second",
      description: "d",
      appliesTo: ["x.two"],
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
    const model = buildModel(Locus.extend(one, two).make({ id: "app:a" }));
    expect(withCode(model, "archetype.applies-to-empty")).toEqual([
      {
        code: "archetype.applies-to-empty",
        severity: "error",
        subject: "app:a",
        path: "kind",
        members: ["x.first"],
        message:
          "Archetype x.first of extension x.one has an empty appliesTo list, so it would apply to every Locus.",
      },
    ]);
  });
});

describe("read-only model maps", () => {
  const ext = Extension.make("x.ext", {
    description: "d",
    archetypes: [
      Archetype.make({
        id: "x.rule",
        description: "d",
        appliesTo: ["x.ext"],
        rules: [],
      }),
    ],
  });

  function build(): SemanticModel {
    return buildModel(
      Locus.make({
        id: "app:root",
        contains: [Locus.extend(ext).make({ id: "app:a" })],
      }),
    );
  }

  test("model.loci rejects set, delete and clear and stays unchanged", () => {
    const model = build();
    const loci = model.loci as unknown as Map<string, ModelLocus>;
    const before = [...model.loci.keys()];
    expect(() => loci.set("app:x", model.loci.get("app:a")!)).toThrow(
      READ_ONLY,
    );
    expect(() => loci.delete("app:a")).toThrow(READ_ONLY);
    expect(() => loci.clear()).toThrow(READ_ONLY);
    expect([...model.loci.keys()]).toEqual(before);
    expect(model.loci.has("app:x")).toBe(false);
  });

  test("model.extensions and model.archetypes reject set, delete and clear", () => {
    const model = build();
    const extensions = model.extensions as unknown as Map<string, unknown>;
    const archetypes = model.archetypes as unknown as Map<string, unknown>;
    expect(() => extensions.set("x.other", ext)).toThrow(READ_ONLY);
    expect(() => extensions.delete("x.ext")).toThrow(READ_ONLY);
    expect(() => extensions.clear()).toThrow(READ_ONLY);
    expect(() => archetypes.set("x.other", 1)).toThrow(READ_ONLY);
    expect(() => archetypes.delete("x.rule")).toThrow(READ_ONLY);
    expect(() => archetypes.clear()).toThrow(READ_ONLY);
    expect(model.extensions.get("x.ext")).toBe(ext);
    expect(model.archetypes.has("x.rule")).toBe(true);
  });

  test("the model maps are frozen, are not Map instances and reject Map.prototype methods", () => {
    const model = build();
    for (const m of [model.loci, model.extensions, model.archetypes]) {
      expect(Object.isFrozen(m)).toBe(true);
      expect(m instanceof Map).toBe(false);
      expect(() => Map.prototype.set.call(m as never, "k", 1)).toThrow(
        TypeError,
      );
    }
  });

  test("model.loci keeps the ids order and reads like a Map", () => {
    const model = build();
    expect([...model.loci.keys()]).toEqual([...model.ids]);
    expect(model.loci.size).toBe(model.ids.length);
    expect(model.loci.get("app:a")?.container).toBe("app:root");
    expect([...model.loci].map(([id]) => id)).toEqual([...model.ids]);
  });
});

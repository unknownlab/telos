import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { buildModel } from "../src/model";
import { Extension } from "../src/extension";
import { Locus, type LocusDefinition } from "../src/locus";
import {
  type DecodeResult,
  LocusJsonSchema,
  decodeLocus,
  decodeLocusText,
} from "../src/decode";
import { External, Source } from "../src/extensions/source";
import { Purpose } from "../src/extensions/purpose";
import { RelationType } from "../src/relation";

const flowsTo = RelationType.make("test.flows-to", {
  description: "d",
  target: "locus",
  acyclic: true,
});
const Flow = Extension.make("test.flow", {
  description: "d",
  relationTypes: [flowsTo],
});
const registry = { extensions: [Purpose, Source, External, Flow] };

function expectRoot(result: DecodeResult): LocusDefinition {
  if (!result.ok)
    throw new Error(`expected ok, got ${JSON.stringify(result.issues)}`);
  return result.root;
}

function issuesOf(
  result: DecodeResult,
): ReadonlyArray<{ path: string; message: string }> {
  if (result.ok) throw new Error("expected issues, got ok");
  return result.issues;
}

function parseError(text: string): string {
  try {
    JSON.parse(text);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected a JSON syntax error");
}

describe("decodeLocus basics", () => {
  test("a Locus with only an id decodes, has no extensions and no description, and builds with no diagnostics", () => {
    const result = decodeLocus({ id: "demo:hello" }, registry);
    expect(result.ok).toBe(true);
    const root = expectRoot(result);
    expect(root.id).toBe("demo:hello");
    expect(root.kind.extensions).toEqual([]);
    expect(root.description).toBeNull();
    expect(buildModel(root).diagnostics).toEqual([]);
  });

  test("extensions are composed in the listed order and their properties are decoded", () => {
    const root = expectRoot(
      decodeLocus(
        {
          id: "demo:a",
          extensions: ["telos.purpose", "telos.source"],
          properties: { purpose: "p", sources: ["x/**"] },
        },
        registry,
      ),
    );
    expect(root.kind.extensions.map((extension) => extension.id)).toEqual([
      "telos.purpose",
      "telos.source",
    ]);
    expect(root.properties).toEqual({ purpose: "p", sources: ["x/**"] });
  });

  test("contained Loci and relations decode to the RelationType object and a locus target", () => {
    const root = expectRoot(
      decodeLocus(
        {
          id: "demo:a",
          extensions: ["telos.purpose", "test.flow"],
          properties: { purpose: "a" },
          contains: [
            {
              id: "demo:b",
              extensions: ["telos.purpose"],
              properties: { purpose: "b" },
            },
          ],
          relations: [{ type: "test.flows-to", target: "demo:b" }],
        },
        registry,
      ),
    );
    expect(root.contains.map((child) => child.id)).toEqual(["demo:b"]);
    expect(root.relations[0]?.type).toBe(flowsTo);
    expect(root.relations[0]?.target).toEqual({
      locus: "demo:b",
      capability: null,
    });
  });

  test("a capability target string gives the locus and the capability name", () => {
    const root = expectRoot(
      decodeLocus(
        {
          id: "demo:a",
          extensions: ["test.flow"],
          relations: [{ type: "test.flows-to", target: "demo:b#run" }],
        },
        registry,
      ),
    );
    expect(root.relations[0]?.target).toEqual({
      locus: "demo:b",
      capability: "run",
    });
  });

  test("declared capabilities have no handler, keep their effect, and decode their input schema", () => {
    const root = expectRoot(
      decodeLocus(
        {
          id: "demo:a",
          capabilities: {
            run: {
              description: "d",
              effect: "read",
              input: { n: "integer" },
              output: { ok: "boolean" },
            },
          },
        },
        registry,
      ),
    );
    const cap = root.capabilities.run;
    expect(cap).toBeDefined();
    expect(cap?.handler).toBeNull();
    expect(cap?.effect).toBe("read");
    expect(Schema.decodeUnknownSync(cap!.input)({ n: 1 })).toEqual({ n: 1 });
    expect(() => Schema.decodeUnknownSync(cap!.input)({ n: 1.5 })).toThrow();
  });

  test("number accepts a fraction and rejects Infinity, string and boolean follow their schemas", () => {
    const root = expectRoot(
      decodeLocus(
        {
          id: "demo:a",
          capabilities: {
            run: {
              description: "d",
              effect: "pure",
              input: { x: "number", s: "string", b: "boolean" },
              output: {},
            },
          },
        },
        registry,
      ),
    );
    const input = root.capabilities.run!.input;
    expect(
      Schema.decodeUnknownSync(input)({ x: 1.5, s: "a", b: true }),
    ).toEqual({
      x: 1.5,
      s: "a",
      b: true,
    });
    expect(() =>
      Schema.decodeUnknownSync(input)({ x: Infinity, s: "a", b: true }),
    ).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(input)({ x: 1, s: 1, b: true }),
    ).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(input)({ x: 1, s: "a", b: "yes" }),
    ).toThrow();
  });
});

describe("decodeLocus issues", () => {
  test("an unknown extension id is reported at its index", () => {
    const result = decodeLocus(
      { id: "demo:a", extensions: ["demo.unknown"] },
      registry,
    );
    expect(result.ok).toBe(false);
    expect(issuesOf(result)).toEqual([
      { path: "extensions/0", message: "Unknown extension demo.unknown." },
    ]);
  });

  test("an unknown relation type is reported at relations/<i>/type", () => {
    const result = decodeLocus(
      { id: "demo:a", relations: [{ type: "demo.nope", target: "demo:b" }] },
      registry,
    );
    expect(issuesOf(result)).toEqual([
      { path: "relations/0/type", message: "Unknown relation type demo.nope." },
    ]);
  });

  test("a relation type that the registry declares but the Locus does not use decodes, and buildModel reports relation.type-unavailable", () => {
    const result = decodeLocus(
      {
        id: "demo:a",
        relations: [{ type: "test.flows-to", target: "demo:b" }],
      },
      registry,
    );
    expect(result.ok).toBe(true);
    const diagnostics = buildModel(expectRoot(result)).diagnostics;
    expect(
      diagnostics.some(
        (diagnostic) => diagnostic.code === "relation.type-unavailable",
      ),
    ).toBe(true);
  });

  test("a structural error reports the path of the missing or wrong key", () => {
    expect(
      issuesOf(decodeLocus({ id: 5 }, registry)).map((issue) => issue.path),
    ).toEqual(["id"]);
    expect(
      issuesOf(decodeLocus({ id: "demo:a", contains: [{}] }, registry)).map(
        (issue) => issue.path,
      ),
    ).toEqual(["contains/0/id"]);
  });

  test("an unknown relation type deep in the tree gets its full nested path", () => {
    const result = decodeLocus(
      {
        id: "demo:a",
        contains: [
          {
            id: "demo:b",
            relations: [
              { type: "test.flows-to", target: "demo:c" },
              { type: "demo.nope", target: "demo:c" },
            ],
          },
        ],
      },
      registry,
    );
    expect(issuesOf(result)).toEqual([
      {
        path: "contains/0/relations/1/type",
        message: "Unknown relation type demo.nope.",
      },
    ]);
  });

  test("issues are sorted by path, then message", () => {
    const result = decodeLocus(
      {
        id: "demo:a",
        extensions: ["demo.unknown"],
        relations: [{ type: "demo.nope", target: "demo:b" }],
      },
      registry,
    );
    expect(issuesOf(result).map((issue) => issue.path)).toEqual([
      "extensions/0",
      "relations/0/type",
    ]);
  });
});

describe("decodeLocusText", () => {
  test("a JSON syntax error gives one issue at the empty path with the parser message", () => {
    const result = decodeLocusText("{", registry);
    expect(issuesOf(result)).toEqual([{ path: "", message: parseError("{") }]);
  });

  test("valid JSON text decodes to the same Locus", () => {
    const result = decodeLocusText('{"id":"demo:a"}', registry);
    expect(result.ok).toBe(true);
    expect(expectRoot(result).id).toBe("demo:a");
  });

  test("the text is data and is never evaluated", () => {
    const result = decodeLocusText(
      '{"id":"demo:a","description":"${process.exit(1)}"}',
      registry,
    );
    expect(expectRoot(result).description).toBe("${process.exit(1)}");
  });
});

describe("LocusJsonSchema", () => {
  test("accepts a structurally valid definition and is exported as a schema", () => {
    expect(Schema.decodeUnknownSync(LocusJsonSchema)({ id: "demo:a" })).toEqual(
      { id: "demo:a" },
    );
  });
});

describe("code and JSON parity", () => {
  test("a code model and its JSON form give the same diagnostics, in the same order", () => {
    const codeA = Locus.extend(Purpose, Flow).make({
      id: "demo:a",
      properties: { purpose: "a" },
      relations: [flowsTo.to("demo:b"), flowsTo.to("demo:missing")],
    });
    const codeB = Locus.extend(Purpose, Flow).make({
      id: "demo:b",
      properties: { purpose: "b" },
      relations: [flowsTo.to("demo:a")],
    });
    const codeRoot = Locus.extend(Purpose, Flow).make({
      id: "demo:root",
      properties: { purpose: "root" },
      contains: [codeA, codeB],
    });
    const jsonRoot = expectRoot(
      decodeLocus(
        {
          id: "demo:root",
          extensions: ["telos.purpose", "test.flow"],
          properties: { purpose: "root" },
          contains: [
            {
              id: "demo:a",
              extensions: ["telos.purpose", "test.flow"],
              properties: { purpose: "a" },
              relations: [
                { type: "test.flows-to", target: "demo:b" },
                { type: "test.flows-to", target: "demo:missing" },
              ],
            },
            {
              id: "demo:b",
              extensions: ["telos.purpose", "test.flow"],
              properties: { purpose: "b" },
              relations: [{ type: "test.flows-to", target: "demo:a" }],
            },
          ],
        },
        registry,
      ),
    );
    const codeDiagnostics = buildModel(codeRoot).diagnostics;
    expect(codeDiagnostics.length).toBeGreaterThan(0);
    expect(JSON.stringify(buildModel(jsonRoot).diagnostics)).toBe(
      JSON.stringify(codeDiagnostics),
    );
  });
});

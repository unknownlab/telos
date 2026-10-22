import { describe, expect, test } from "bun:test";
import {
  forbiddenBundleReferences,
  forbiddenCoreImports,
  forbiddenDependencies,
  forbiddenRuntimeUses,
} from "./scan";

// Each sample is a bad example that the matching scanner must flag.
describe("forbiddenCoreImports detects forbidden imports", () => {
  const bad: ReadonlyArray<[string, string]> = [
    [
      "a static import of the specs sub-path",
      `import { x } from "@telos/locus/specs";`,
    ],
    [
      "a type import of a file under the specs sub-path",
      `import type { Y } from "@telos/locus/specs/runner";`,
    ],
    [
      "a relative import of the specs folder",
      `import { catalogue } from "../specs/index";`,
    ],
    [
      "a relative import of the runner",
      `import { runSpecification } from "./runner";`,
    ],
    [
      "a dynamic import of a relative catalogue with a template literal",
      "const c = await import(`../../specs/catalogue`);",
    ],
    ["a require of the goldens", `const g = require("../specs/goldens");`],
    ["a re-export from an adapter", `export * from "./adapters/bun";`],
    ["a side-effect import of bun:test", `import "bun:test";`],
    [
      "an import of bun:test with single quotes",
      `import { test } from 'bun:test';`,
    ],
    [
      "a multi-line import of bun:test",
      `import {\n  describe,\n  test,\n} from "bun:test";`,
    ],
    ["a re-export from vitest", `export { a } from "vitest";`],
    [
      "a star re-export from a playwright package",
      `export * from "@playwright/test";`,
    ],
    ["a require of jest", `const jest = require("jest");`],
    [
      "a dynamic import of a jest package",
      `const g = await import("@jest/globals");`,
    ],
    ["a dynamic import with spaces", `const m = await import ( "mocha" );`],
    [
      "a dynamic import of a test runner written as a template literal",
      "const m = await import(`mocha`);",
    ],
  ];

  for (const [label, source] of bad) {
    test(label, () => {
      expect(forbiddenCoreImports(source).length).toBe(1);
    });
  }

  test("reports every forbidden import in a file", () => {
    const source = [
      `import "bun:test";`,
      `import { Effect } from "effect";`,
      `import "vitest";`,
    ].join("\n");
    expect(forbiddenCoreImports(source)).toEqual(["bun:test", "vitest"]);
  });
});

describe("forbiddenCoreImports ignores harmless text", () => {
  test("allowed imports pass", () => {
    expect(forbiddenCoreImports(`import { Effect } from "effect";`)).toEqual(
      [],
    );
    expect(forbiddenCoreImports(`export * from "./locus";`)).toEqual([]);
  });

  test("a commented-out import is not an import", () => {
    expect(forbiddenCoreImports(`// import "bun:test";`)).toEqual([]);
    expect(forbiddenCoreImports(`/* import { x } from "vitest"; */`)).toEqual(
      [],
    );
  });

  test("a bare string that names a forbidden module is not an import", () => {
    expect(forbiddenCoreImports(`const name = "bun:test";`)).toEqual([]);
  });

  test("a relative import whose name only contains a specs word is allowed", () => {
    expect(
      forbiddenCoreImports(`import { s } from "./specifications";`),
    ).toEqual([]);
    expect(forbiddenCoreImports(`export * from "./runners-of-tea";`)).toEqual(
      [],
    );
  });
});

describe("forbiddenRuntimeUses detects runtime-specific module specifiers", () => {
  const bad: ReadonlyArray<[string, string]> = [
    ["a node:fs import", `import { readFileSync } from "node:fs";`],
    ["a node:path require", `const p = require("node:path");`],
    ["a dynamic node:url import", `const u = await import("node:url");`],
    [
      "a dynamic node:fs import written as a template literal",
      "const fs = await import(`node:fs`);",
    ],
    [
      "a require of node:path written as a template literal",
      "const p = require(`node:path`);",
    ],
    ["a bare bun import", `import { file } from "bun";`],
    ["a bun:sqlite import", `import { Database } from "bun:sqlite";`],
    ["a bun:test import", `import "bun:test";`],
  ];

  for (const [label, source] of bad) {
    test(label, () => {
      expect(forbiddenRuntimeUses(source).length).toBe(1);
    });
  }
});

describe("forbiddenRuntimeUses detects runtime-specific identifiers", () => {
  const bad: ReadonlyArray<[string, string]> = [
    ["a process.env read", `const home = process.env.HOME;`],
    ["a globalThis.process read", `const v = globalThis.process.version;`],
    ["a Buffer call", `const b = Buffer.from("x");`],
    ["a Buffer type reference", `function f(b: Buffer) { return b; }`],
    ["a Bun global", `const f = Bun.file("x");`],
  ];

  for (const [label, source] of bad) {
    test(label, () => {
      expect(forbiddenRuntimeUses(source).length).toBe(1);
    });
  }
});

describe("forbiddenRuntimeUses ignores comments and string contents", () => {
  test("the word process in a line comment is not a use", () => {
    expect(forbiddenRuntimeUses(`// process.env is not read here`)).toEqual([]);
  });

  test("the word Buffer in a block comment is not a use", () => {
    expect(
      forbiddenRuntimeUses(`/* a Buffer would break the browser */`),
    ).toEqual([]);
  });

  test("the word Buffer inside a string in a comment is not a use", () => {
    expect(
      forbiddenRuntimeUses(`// the string "Buffer" is only mentioned`),
    ).toEqual([]);
  });

  test("the word Buffer inside a string in code is not a use", () => {
    expect(forbiddenRuntimeUses(`const label = "Buffer";`)).toEqual([]);
  });

  test("process as a plain word in a string is not a use", () => {
    expect(forbiddenRuntimeUses(`const label = "process.env";`)).toEqual([]);
  });

  test("a URL in a string does not hide a later use on the same line", () => {
    expect(
      forbiddenRuntimeUses(
        `const u = "https://example.com"; const h = process.env.HOME;`,
      ),
    ).toEqual(["process"]);
  });

  test("allowed code and allowed imports pass", () => {
    const source = [
      `import { Effect } from "effect";`,
      `const x = performance.now();`,
      `const t = new TextEncoder().encode("ok");`,
    ].join("\n");
    expect(forbiddenRuntimeUses(source)).toEqual([]);
  });
});

describe("forbiddenDependencies", () => {
  test("an empty manifest and an allowed dependency pass", () => {
    expect(forbiddenDependencies({})).toEqual([]);
    expect(
      forbiddenDependencies({ dependencies: { effect: "4.0.4" } }),
    ).toEqual([]);
  });

  test("a dev dependency on a test runner is reported", () => {
    expect(
      forbiddenDependencies({ devDependencies: { vitest: "1.0.0" } }),
    ).toEqual(["vitest"]);
  });

  test("a peer dependency on a playwright package is reported", () => {
    expect(
      forbiddenDependencies({
        peerDependencies: { "@playwright/test": "1.0.0" },
      }),
    ).toEqual(["@playwright/test"]);
  });

  test("several forbidden packages across fields are all reported", () => {
    expect(
      forbiddenDependencies({
        dependencies: { effect: "4.0.4" },
        devDependencies: { "@jest/globals": "29.0.0", mocha: "10.0.0" },
      }),
    ).toEqual(["@jest/globals", "mocha"]);
  });
});

describe("forbiddenBundleReferences detects node: and bun: module references in built output", () => {
  test("a static import of a node module left in the bundle is reported", () => {
    expect(
      forbiddenBundleReferences(`import { readFileSync } from "node:fs";`),
    ).toEqual(["node:fs"]);
  });

  test("a minified import with no spaces is reported", () => {
    expect(forbiddenBundleReferences(`import"node:path";var a=1;`)).toEqual([
      "node:path",
    ]);
  });

  test("a require or dynamic import of a bun module is reported", () => {
    expect(
      forbiddenBundleReferences(
        `var t=require("bun:test");var u=import("bun:sqlite");`,
      ),
    ).toEqual(["bun:test", "bun:sqlite"]);
  });

  test("an object property named node is not a module reference", () => {
    expect(
      forbiddenBundleReferences(
        `const v = { node: s, next: 0, found: false };`,
      ),
    ).toEqual([]);
  });

  test("a runtime lookup that names a node module is not an import", () => {
    expect(
      forbiddenBundleReferences(
        `var A = globalThis.process?.getBuiltinModule?.("node:async_hooks")?.AsyncResource;`,
      ),
    ).toEqual([]);
  });
});

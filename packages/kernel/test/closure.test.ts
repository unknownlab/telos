// START_MODULE_CONTRACT
//   PURPOSE: Prove that checkClosure reports each closure code exactly when its rule fails, with the exact finding fields, messages and sort order, over temporary fixture repositories.
//   SCOPE: Tests of closure.ts scope, claims, owners, import resolution, externals, dynamic imports, limits and the report shape. Out: the model rules (model tests) and the repository's own closure (checked by telos:check).
//   DEPENDS: M-KERNEL-CLOSURE, M-KERNEL-MODEL, M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-CLOSURE, V-M-KERNEL-CLOSURE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Owned - the test kind with the source extension
//   OwnedExt - the test kind with the source and external extensions
//   created - the fixture directories to remove after each test
//   fixture - writes the files of a fixture repository into a new temporary directory
//   check - runs checkClosure over a built model of the fixture repository
//   withCode - the findings of a report that carry one closure code
// END_MODULE_MAP

import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Effect } from "effect";
import {
  CLOSURE_LIMITS,
  checkClosure,
  hasClosureErrors,
  type ClosureCode,
  type ClosureFinding,
  type ClosureOptions,
  type ClosureReport,
} from "../src/closure";
import { Locus, type LocusDefinition } from "../src/locus";
import { buildModel } from "../src/model";
import type { Relation } from "../src/relation";
import { External, Source, SourceDependsOn } from "../src/extensions/source";

const Owned = Locus.extend(Source);
const OwnedExt = Locus.extend(Source, External);

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "telos-closure-"));
  created.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  return dir;
}

function check(
  model: LocusDefinition,
  root: string,
  options: Partial<ClosureOptions> = {},
): Promise<ClosureReport> {
  return Effect.runPromise(
    checkClosure(buildModel(model), {
      root,
      include: ["**/*.ts"],
      ...options,
    }),
  );
}

function withCode(
  report: ClosureReport,
  code: ClosureCode,
): ReadonlyArray<ClosureFinding> {
  return report.findings.filter((f) => f.code === code);
}

describe("closure scope and claims", () => {
  test("closure.unowned is reported for an in-scope file that no glob claims", async () => {
    const dir = fixture({ "a/x.ts": "export const x = 1;", "b/y.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["b/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.unowned",
        severity: "error",
        file: "a/x.ts",
        loci: [],
        detail: "a/x.ts",
        message: "a/x.ts is not claimed by any Locus.",
        knowledge: "derived",
      },
    ]);
    expect(report.files).toEqual([
      { file: "a/x.ts", owner: null },
      { file: "b/y.ts", owner: "app:root" },
    ]);
  });

  test("closure.unowned is not reported when a glob claims every file", async () => {
    const dir = fixture({ "a/x.ts": "export const x = 1;", "b/y.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts", "b/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unowned")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.ambiguous is reported when two sibling Loci claim the same file", async () => {
    const dir = fixture({ "a/x.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({ id: "app:a", properties: { sources: ["a/**/*.ts"] } }),
        Owned.make({ id: "app:b", properties: { sources: ["a/**/*.ts"] } }),
      ],
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.ambiguous",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:a", "app:b"],
        detail: "a/x.ts",
        message: "a/x.ts is claimed by unrelated Loci app:a, app:b.",
        knowledge: "derived",
      },
    ]);
    expect(report.files).toEqual([{ file: "a/x.ts", owner: null }]);
  });

  test("closure.ambiguous is not reported when a child claims a narrower part of its container's claim", async () => {
    const dir = fixture({ "a/x.ts": "", "a/b/y.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
      contains: [
        Owned.make({
          id: "app:child",
          properties: { sources: ["a/b/**/*.ts"] },
        }),
      ],
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.ambiguous")).toEqual([]);
    expect(report.findings).toEqual([]);
    expect(report.files).toEqual([
      { file: "a/b/y.ts", owner: "app:child" },
      { file: "a/x.ts", owner: "app:root" },
    ]);
  });

  test("closure.empty-claim is a warning and does not make the report an error", async () => {
    const dir = fixture({ "a/x.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts", "none/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.empty-claim",
        severity: "warning",
        file: null,
        loci: ["app:root"],
        detail: "none/**/*.ts",
        message: "Source glob none/**/*.ts of app:root matches no file.",
        knowledge: "derived",
      },
    ]);
    expect(hasClosureErrors(report)).toBe(false);
  });

  test("closure.empty-claim is not reported when the glob matches a file", async () => {
    const dir = fixture({ "a/x.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.empty-claim")).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

describe("closure.undeclared-dependency", () => {
  const importer = 'import { y } from "../b/y";\nexport const x = y;\n';

  function siblings(
    aRelations: ReadonlyArray<Relation> = [],
    rootRelations: ReadonlyArray<Relation> = [],
  ): LocusDefinition {
    return Owned.make({
      id: "app:root",
      properties: { sources: [] },
      relations: rootRelations,
      contains: [
        Owned.make({
          id: "app:a",
          properties: { sources: ["a/**/*.ts"] },
          relations: aRelations,
        }),
        Owned.make({ id: "app:b", properties: { sources: ["b/**/*.ts"] } }),
      ],
    });
  }

  test("closure.undeclared-dependency is reported for an import of an unrelated Locus", async () => {
    const dir = fixture({
      "a/x.ts": importer,
      "b/y.ts": "export const y = 1;",
    });
    const report = await check(siblings(), dir);
    expect(report.findings).toEqual([
      {
        code: "closure.undeclared-dependency",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:a", "app:b"],
        detail: "../b/y",
        message:
          "app:a imports app:b through ../b/y without a declared relation.",
        knowledge: "derived",
      },
    ]);
  });

  test("closure.undeclared-dependency is not reported when the importer declares source.depends-on", async () => {
    const dir = fixture({
      "a/x.ts": importer,
      "b/y.ts": "export const y = 1;",
    });
    const report = await check(siblings([SourceDependsOn.to("app:b")]), dir);
    expect(withCode(report, "closure.undeclared-dependency")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.undeclared-dependency is not reported when a container of the importer declares the relation", async () => {
    const dir = fixture({
      "a/x.ts": importer,
      "b/y.ts": "export const y = 1;",
    });
    const report = await check(
      siblings([], [SourceDependsOn.to("app:b")]),
      dir,
    );
    expect(withCode(report, "closure.undeclared-dependency")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.undeclared-dependency is not reported when the target Locus is contained in the importer", async () => {
    const dir = fixture({
      "a/x.ts": importer,
      "b/y.ts": "export const y = 1;",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({
          id: "app:a",
          properties: { sources: ["a/**/*.ts"] },
          contains: [
            Owned.make({ id: "app:b", properties: { sources: ["b/**/*.ts"] } }),
          ],
        }),
      ],
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.undeclared-dependency")).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

describe("externals", () => {
  test("closure.unknown-external is reported for a bare package that no External lists", async () => {
    const dir = fixture({
      "a/x.ts": 'import { Effect } from "effect";\nexport const x = Effect;\n',
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({ id: "app:a", properties: { sources: ["a/**/*.ts"] } }),
      ],
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.unknown-external",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:a"],
        detail: "effect",
        message:
          "app:a imports effect, which no External declaration of app:a or its containers lists.",
        knowledge: "derived",
      },
    ]);
  });

  test("closure.unknown-external is not reported when the owner declares the package", async () => {
    const dir = fixture({
      "a/x.ts": 'import { Effect } from "effect";\nexport const x = Effect;\n',
    });
    const model = OwnedExt.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"], packages: ["effect"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unknown-external")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.unknown-external is not reported when a container of the owner declares the package", async () => {
    const dir = fixture({
      "a/x.ts": 'import { Effect } from "effect";\nexport const x = Effect;\n',
    });
    const model = OwnedExt.make({
      id: "app:root",
      properties: { sources: [], packages: ["effect"] },
      contains: [
        Owned.make({ id: "app:a", properties: { sources: ["a/**/*.ts"] } }),
      ],
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unknown-external")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.unknown-external is not reported for a scoped subpath of a listed package", async () => {
    const dir = fixture({ "a/x.ts": 'import "@scope/pkg/sub";\n' });
    const model = OwnedExt.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"], packages: ["@scope/pkg"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unknown-external")).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

describe("closure.unresolved-import", () => {
  test("closure.unresolved-import is reported for a relative import of a missing file", async () => {
    const dir = fixture({ "a/x.ts": 'import "./missing";\n' });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.unresolved-import",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "./missing",
        message: "./missing does not resolve to a file.",
        knowledge: "derived",
      },
    ]);
  });

  test("closure.unresolved-import is reported when the target exists outside the scope", async () => {
    const dir = fixture({
      "a/x.ts": 'import "../c/z";\n',
      "c/z.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir, { include: ["a/**/*.ts"] });
    expect(report.findings).toEqual([
      {
        code: "closure.unresolved-import",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "../c/z",
        message: "../c/z resolves to c/z.ts, which no Locus owns.",
        knowledge: "derived",
      },
    ]);
  });

  test("closure.unresolved-import is not reported for .ts, directory index and .js-to-.ts resolutions", async () => {
    const dir = fixture({
      "a/x.ts": 'import "./y";\nimport "./dir";\nimport "./z.js";\n',
      "a/y.ts": "export {};\n",
      "a/dir/index.ts": "export {};\n",
      "a/z.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.unresolved-import")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("platform imports node:*, bun and bun:* are always allowed", async () => {
    const dir = fixture({
      "a/x.ts":
        'import fs from "node:fs";\nimport "bun";\nimport { test } from "bun:test";\nexport { fs, test };\n',
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([]);
  });

  test("asset imports are allowed when the file exists and are unresolved when it does not", async () => {
    const present = fixture({
      "a/x.ts":
        'import "./style.css";\nimport u from "./logo.svg?url";\nexport { u };\n',
      "a/style.css": "",
      "a/logo.svg": "",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    expect((await check(model, present)).findings).toEqual([]);

    const absent = fixture({ "a/x.ts": 'import "./style.css";\n' });
    const report = await check(model, absent);
    expect(report.findings).toEqual([
      {
        code: "closure.unresolved-import",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "./style.css",
        message: "./style.css does not resolve to a file.",
        knowledge: "derived",
      },
    ]);
  });
});

describe("workspace packages", () => {
  const packageFiles = {
    "packages/k/package.json": JSON.stringify({
      name: "@x/k",
      exports: { ".": "./src/index.ts", "./sub": "./src/sub.ts" },
    }),
    "packages/k/src/index.ts": "export {};\n",
    "packages/k/src/sub.ts": "export {};\n",
  };
  const importer =
    'import "@x/k";\nimport "@x/k/sub";\nimport "@x/k/nope";\nimport "@x/k/package.json";\n';

  function model(relations: ReadonlyArray<Relation>) {
    return Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({
          id: "app:a",
          properties: { sources: ["a/**/*.ts"] },
          relations,
        }),
        Owned.make({
          id: "app:k",
          properties: { sources: ["packages/k/**/*.ts"] },
        }),
      ],
    });
  }

  test("a workspace subpath that exports nothing is reported as unresolved, and the package.json asset is allowed", async () => {
    const dir = fixture({ ...packageFiles, "a/x.ts": importer });
    const report = await check(model([SourceDependsOn.to("app:k")]), dir, {
      packages: [{ name: "@x/k", dir: "packages/k" }],
    });
    expect(report.findings).toEqual([
      {
        code: "closure.unresolved-import",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:a"],
        detail: "@x/k/nope",
        message: "@x/k/nope does not resolve to a file.",
        knowledge: "derived",
      },
    ]);
  });

  test("workspace imports follow the dependency rule of the owner of the resolved file", async () => {
    const dir = fixture({ ...packageFiles, "a/x.ts": importer });
    const report = await check(model([]), dir, {
      packages: [{ name: "@x/k", dir: "packages/k" }],
    });
    expect(
      report.findings
        .filter((f) => f.code === "closure.undeclared-dependency")
        .map((f) => [f.detail, f.loci]),
    ).toEqual([
      ["@x/k", ["app:a", "app:k"]],
      ["@x/k/sub", ["app:a", "app:k"]],
    ]);
  });
});

describe("path aliases", () => {
  test("an alias import from a file under the alias app resolves to the aliased file", async () => {
    const dir = fixture({
      "apps/d/src/lib/x.ts": "export const x = 1;\n",
      "apps/d/src/main.ts": 'import { x } from "@/lib/x";\nexport { x };\n',
    });
    const model = Owned.make({
      id: "app:d",
      properties: { sources: ["apps/d/**/*.ts"] },
    });
    const report = await check(model, dir, {
      aliases: [{ prefix: "@/", dir: "apps/d/src/" }],
    });
    expect(report.findings).toEqual([]);
  });
});

describe("closure.dynamic-import", () => {
  test("closure.dynamic-import is reported for a computed import with a variable", async () => {
    const dir = fixture({
      "a/x.ts": "const name = 'y';\nexport const m = await import(name);\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.dynamic-import",
        severity: "warning",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "import(",
        message:
          "a/x.ts contains a computed import(...); its dependency is unknown.",
        knowledge: "unknown",
      },
    ]);
  });

  test("closure.dynamic-import is reported for a template literal with an interpolation", async () => {
    const dir = fixture({
      "a/x.ts":
        "const name = 'y';\nexport const m = await import(`./m/${name}`);\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.dynamic-import")).toEqual([
      {
        code: "closure.dynamic-import",
        severity: "warning",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "import(",
        message:
          "a/x.ts contains a computed import(...); its dependency is unknown.",
        knowledge: "unknown",
      },
    ]);
  });

  test("a string literal and a template literal without an interpolation are resolved like static imports", async () => {
    const dir = fixture({
      "a/x.ts":
        'export const a = await import("./y");\nexport const b = await import(`./y`);\n',
      "a/y.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(withCode(report, "closure.dynamic-import")).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

describe("report", () => {
  test("the report echoes the scope, lists owners sorted by file, and carries the four limits", async () => {
    const dir = fixture({
      "a/x.ts": "",
      "gen/x.ts": "",
      "b/y.ts": "",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["**/*.ts"] },
    });
    const report = await check(model, dir, { exclude: ["**/gen/**"] });
    expect(report.scope).toEqual({
      include: ["**/*.ts"],
      exclude: ["**/gen/**"],
    });
    expect(report.files).toEqual([
      { file: "a/x.ts", owner: "app:root" },
      { file: "b/y.ts", owner: "app:root" },
    ]);
    expect(report.limits).toEqual(CLOSURE_LIMITS);
    expect(report.knowledge).toBe("derived");
  });

  test("the default scope has an empty exclude list", async () => {
    const dir = fixture({ "a/x.ts": "" });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.scope.exclude).toEqual([]);
  });

  test("the same fixture gives identical JSON on two runs", async () => {
    const files = {
      "a/x.ts": 'import "./y";\nimport { Effect } from "effect";\n',
      "a/y.ts": "",
      "b/z.ts": "",
    };
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const first = await check(model, fixture(files));
    const second = await check(model, fixture(files));
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test("hasClosureErrors is true for an error finding and false when there are only warnings", async () => {
    const withError = await check(
      Owned.make({ id: "app:root", properties: { sources: ["b/**/*.ts"] } }),
      fixture({ "a/x.ts": "", "b/y.ts": "" }),
    );
    expect(hasClosureErrors(withError)).toBe(true);
  });
});

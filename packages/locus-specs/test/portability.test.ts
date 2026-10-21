import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { forbiddenBundleReferences, forbiddenRuntimeUses } from "./scan";

// NFR-003 and C-004: the core and the spec sources run in the browser playground,
// so they may not use bun, bun:*, node:*, process or Buffer, and they must bundle for the browser.
const LOCUS_DIR = join(import.meta.dir, "..", "..", "locus");
const SPECS_DIR = join(import.meta.dir, "..");

const sourceFiles = (dir: string): string[] =>
  [...new Bun.Glob("**/*.ts").scanSync({ cwd: join(dir, "src") })]
    .sort()
    .map((file) => join(dir, "src", file));

const PORTABLE_SOURCES = [...sourceFiles(LOCUS_DIR), ...sourceFiles(SPECS_DIR)];

describe("NFR-003 portable source", () => {
  test("the scanned trees contain source files", () => {
    expect(sourceFiles(LOCUS_DIR).length).toBeGreaterThan(5);
    expect(sourceFiles(SPECS_DIR).length).toBeGreaterThan(0);
  });

  test("no source file in locus or locus-specs uses bun, node:*, process or Buffer", () => {
    const violations = PORTABLE_SOURCES.flatMap((path) =>
      forbiddenRuntimeUses(readFileSync(path, "utf8")).map(
        (use) => `${path}: ${use}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});

describe("C-004 browser bundle", () => {
  for (const [label, dir] of [
    ["@telos/locus", LOCUS_DIR],
    ["@telos/locus-specs", SPECS_DIR],
  ] as const) {
    test(`${label} bundles for the browser without node: or bun: references`, async () => {
      const result = await Bun.build({
        entrypoints: [join(dir, "src", "index.ts")],
        target: "browser",
      });
      if (!result.success) {
        throw new Error(
          `${label} did not bundle for the browser:\n${result.logs.join("\n")}`,
        );
      }
      expect(result.outputs.length).toBeGreaterThan(0);
      const references: string[] = [];
      for (const output of result.outputs) {
        references.push(...forbiddenBundleReferences(await output.text()));
      }
      expect(references).toEqual([]);
    });
  }
});

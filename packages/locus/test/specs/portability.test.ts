import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { forbiddenBundleReferences, forbiddenRuntimeUses } from "./scan";

// NFR-003 and C-004: the core and the specs run in the browser playground,
// so they may not use bun, bun:*, node:*, process or Buffer, and they must bundle for the browser.
const CORE_SRC = join(import.meta.dir, "..", "..", "src");
const SPECS_SRC = join(import.meta.dir, "..", "..", "specs");

const sourceFiles = (dir: string): string[] =>
  [...new Bun.Glob("**/*.ts").scanSync({ cwd: dir })]
    .sort()
    .map((file) => join(dir, file));

const PORTABLE_SOURCES = [...sourceFiles(CORE_SRC), ...sourceFiles(SPECS_SRC)];

describe("NFR-003 portable source", () => {
  test("the scanned trees contain source files", () => {
    expect(sourceFiles(CORE_SRC).length).toBeGreaterThan(5);
    expect(sourceFiles(SPECS_SRC).length).toBeGreaterThan(0);
  });

  test("no source file in locus or its specs uses bun, node:*, process or Buffer", () => {
    const violations = PORTABLE_SOURCES.flatMap((path) =>
      forbiddenRuntimeUses(readFileSync(path, "utf8")).map(
        (use) => `${path}: ${use}`,
      ),
    );
    expect(violations).toEqual([]);
  });
});

// Names that only the specifications and their runner export or contain. Their bundle must not carry them.
const SPEC_MARKERS = [
  "LOC-001",
  "LOC-044",
  "runSpecification",
  "runSpecifications",
  "revisionGoldens",
  "catalogue",
];

const bundleText = async (entry: string): Promise<string> => {
  const result = await Bun.build({ entrypoints: [entry], target: "browser" });
  if (!result.success) {
    throw new Error(
      `${entry} did not bundle for the browser:\n${result.logs.join("\n")}`,
    );
  }
  return (await Promise.all(result.outputs.map((o) => o.text()))).join("\n");
};

describe("INV-014 browser bundle of the core", () => {
  test("importing @telos/locus for the browser bundles no specification, runner or catalogue", async () => {
    const text = await bundleText(join(CORE_SRC, "index.ts"));
    expect(SPEC_MARKERS.filter((marker) => text.includes(marker))).toEqual([]);
  });

  test("the specifications bundle carries every marker, so the check above is not vacuous", async () => {
    const text = await bundleText(join(SPECS_SRC, "index.ts"));
    expect(SPEC_MARKERS.filter((marker) => !text.includes(marker))).toEqual([]);
  });
});

describe("C-004 browser bundle", () => {
  for (const [label, entry] of [
    ["@telos/locus", join(CORE_SRC, "index.ts")],
    ["@telos/locus/specs", join(SPECS_SRC, "index.ts")],
  ] as const) {
    test(`${label} bundles for the browser without node: or bun: references`, async () => {
      const result = await Bun.build({
        entrypoints: [entry],
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

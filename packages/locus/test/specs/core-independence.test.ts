import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { forbiddenCoreImports, forbiddenDependencies } from "./scan";

// INV-014 (NS-019): the core package never depends on the spec package, a test runner or Playwright.
const LOCUS_DIR = join(import.meta.dir, "..", "..");
const CORE_SRC = join(LOCUS_DIR, "src");

const coreFiles = [
  ...new Bun.Glob("**/*.ts").scanSync({ cwd: CORE_SRC }),
].sort();

const readManifest = (): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
} => JSON.parse(readFileSync(join(LOCUS_DIR, "package.json"), "utf8"));

describe("INV-014 core independence", () => {
  test("the core source tree is found, so the scan is not vacuous", () => {
    expect(coreFiles).toContain("index.ts");
    expect(coreFiles.length).toBeGreaterThan(5);
  });

  test("no core source file imports the spec package, bun:test, Playwright or a test runner", () => {
    const violations = coreFiles.flatMap((file) =>
      forbiddenCoreImports(readFileSync(join(CORE_SRC, file), "utf8")).map(
        (specifier) => `${file}: ${specifier}`,
      ),
    );
    expect(violations).toEqual([]);
  });

  test("the core manifest does not depend on the spec package, a test runner or Playwright", () => {
    expect(forbiddenDependencies(readManifest())).toEqual([]);
  });

  test("the core manifest has exactly one dependency, effect", () => {
    expect(Object.keys(readManifest().dependencies ?? {})).toEqual(["effect"]);
  });
});

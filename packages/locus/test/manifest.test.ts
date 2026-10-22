import { describe, expect, test } from "bun:test";
import pkg from "../package.json";
import root from "../../../package.json";

describe("@telos/locus manifest", () => {
  test("depends on effect 4.0.4 and nothing else", () => {
    expect(pkg.dependencies).toEqual({ effect: "4.0.4" });
  });

  test("has no dev, peer or optional dependencies and no trusted install scripts", () => {
    expect(Object.keys(pkg).sort()).toEqual(
      ["dependencies", "exports", "name", "private", "type", "version"].sort(),
    );
  });

  test("exposes exactly the entry point, the specs entry point and the manifest", () => {
    expect(pkg.exports).toEqual({
      ".": "./src/index.ts",
      "./specs": "./specs/index.ts",
      "./package.json": "./package.json",
    });
  });

  test("no workspace manifest trusts dependency install scripts, and every pin is exact", () => {
    expect("trustedDependencies" in pkg).toBe(false);
    expect("trustedDependencies" in root).toBe(false);
    for (const version of Object.values(pkg.dependencies)) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

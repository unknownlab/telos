import { describe, expect, test } from "bun:test";
import pkg from "../package.json";

describe("@telos/locus manifest", () => {
  test("depends on effect 4.0.4 and nothing else", () => {
    expect(pkg.dependencies).toEqual({ effect: "4.0.4" });
  });

  test("has no dev, peer or optional dependencies and no trusted install scripts", () => {
    expect(Object.keys(pkg).sort()).toEqual(
      ["dependencies", "exports", "name", "private", "type", "version"].sort(),
    );
  });

  test("exposes only the entry point and its manifest", () => {
    expect(pkg.exports).toEqual({
      ".": "./src/index.ts",
      "./package.json": "./package.json",
    });
  });
});

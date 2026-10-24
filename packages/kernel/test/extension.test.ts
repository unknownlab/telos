// START_MODULE_CONTRACT
//   PURPOSE: Prove that Extension.make fills the default fields and returns a frozen extension.
//   SCOPE: Tests of extension.ts only. Out: composing extensions into a Locus kind.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Extension } from "../src/extension";

describe("Extension.make", () => {
  test("defaults properties, relationTypes and archetypes to empty values", () => {
    const extension = Extension.make("x.y", { description: "d" });
    expect(extension._tag).toBe("Extension");
    expect(extension.id).toBe("x.y");
    expect(extension.description).toBe("d");
    expect(extension.properties).toEqual({});
    expect(extension.relationTypes).toEqual([]);
    expect(extension.archetypes).toEqual([]);
  });

  test("returns a frozen extension", () => {
    const extension = Extension.make("x.y", { description: "d" });
    expect(Object.isFrozen(extension)).toBe(true);
  });
});

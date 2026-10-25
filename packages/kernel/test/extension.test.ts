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

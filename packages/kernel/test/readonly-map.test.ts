// START_MODULE_CONTRACT
//   PURPOSE: Prove that readonlyMap reads like a Map in insertion order, copies its entries, is frozen and rejects every mutation.
//   SCOPE: Tests of readonly-map.ts only. Out: the semantic model that uses it (model-hardening.test.ts).
//   DEPENDS: M-KERNEL-MODEL
//   LINKS: M-KERNEL-MODEL, V-M-KERNEL-MODEL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { readonlyMap } from "../src/readonly-map";

describe("readonlyMap", () => {
  const m = readonlyMap<string, number>([
    ["b", 2],
    ["a", 1],
    ["c", 3],
  ]);

  test("reads like a Map in insertion order", () => {
    expect(m.size).toBe(3);
    expect(m.get("a")).toBe(1);
    expect(m.get("z")).toBeUndefined();
    expect(m.has("c")).toBe(true);
    expect(m.has("z")).toBe(false);
    expect([...m.keys()]).toEqual(["b", "a", "c"]);
    expect([...m.values()]).toEqual([2, 1, 3]);
    expect([...m.entries()]).toEqual([
      ["b", 2],
      ["a", 1],
      ["c", 3],
    ]);
    expect([...m]).toEqual([
      ["b", 2],
      ["a", 1],
      ["c", 3],
    ]);
  });

  test("forEach passes value, key and the read-only map, with thisArg", () => {
    const marker = { name: "marker" };
    const calls: Array<[number, string]> = [];
    const thisValues: unknown[] = [];
    const maps: unknown[] = [];
    m.forEach(function (this: unknown, value, key, map) {
      calls.push([value, key]);
      thisValues.push(this);
      maps.push(map);
    }, marker);
    expect(calls).toEqual([
      [2, "b"],
      [1, "a"],
      [3, "c"],
    ]);
    for (const thisValue of thisValues) {
      expect(thisValue).toBe(marker);
    }
    for (const map of maps) {
      expect(map).toBe(m);
    }
  });

  test("copies its entries so later changes of the source do not show", () => {
    const source = new Map([["a", 1]]);
    const view = readonlyMap(source);
    source.set("b", 2);
    source.delete("a");
    expect([...view]).toEqual([["a", 1]]);
  });

  test("keeps the first position of a repeated key with the last value", () => {
    const view = readonlyMap([
      ["a", 1],
      ["b", 2],
      ["a", 3],
    ]);
    expect([...view]).toEqual([
      ["a", 3],
      ["b", 2],
    ]);
  });

  test("set, delete and clear throw and change nothing", () => {
    const mutable = m as unknown as Map<string, number>;
    const readOnly = new TypeError("SemanticModel maps are read-only.");
    expect(() => mutable.set("d", 4)).toThrow(readOnly);
    expect(() => mutable.delete("a")).toThrow(readOnly);
    expect(() => mutable.clear()).toThrow(readOnly);
    expect([...m]).toEqual([
      ["b", 2],
      ["a", 1],
      ["c", 3],
    ]);
  });

  test("is frozen with a frozen prototype", () => {
    expect(Object.isFrozen(m)).toBe(true);
    expect(Object.isFrozen(Object.getPrototypeOf(m))).toBe(true);
    expect(() => {
      (m as unknown as { extra: number }).extra = 1;
    }).toThrow(TypeError);
  });

  test("is not a Map and rejects Map.prototype methods", () => {
    expect(m instanceof Map).toBe(false);
    expect(Object.prototype.toString.call(m)).toBe("[object ReadonlyMap]");
    expect(() => Map.prototype.set.call(m as never, "d", 4)).toThrow(TypeError);
    expect(() => Map.prototype.get.call(m as never, "a")).toThrow(TypeError);
  });

  test("an empty view has size 0", () => {
    expect(readonlyMap([]).size).toBe(0);
    expect([...readonlyMap([])]).toEqual([]);
  });
});

import { describe, expect, test } from "bun:test";
import { canonicalJson, jsonEqual } from "../src/canonical-json";

describe("canonicalJson", () => {
  test("key order does not matter", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(jsonEqual({ b: 1, a: 2 }, { a: 2, b: 1 })).toBe(true);
  });

  test("array order does matter", () => {
    expect(jsonEqual([1, 2], [2, 1])).toBe(false);
    expect(jsonEqual([1, 2], [1, 2])).toBe(true);
  });

  test("objects nested inside arrays are sorted too", () => {
    expect(jsonEqual([{ b: 1, a: 2 }], [{ a: 2, b: 1 }])).toBe(true);
    expect(canonicalJson([{ b: 1, a: [{ d: 0, c: 0 }] }])).toBe(
      '[{"a":[{"c":0,"d":0}],"b":1}]',
    );
  });

  test("undefined members are dropped", () => {
    expect(jsonEqual({ a: undefined }, {})).toBe(true);
    expect(canonicalJson({ a: undefined, b: 1 })).toBe('{"b":1}');
  });

  test("a string and a number are different", () => {
    expect(jsonEqual("1", 1)).toBe(false);
  });

  test("null and an empty object are different", () => {
    expect(jsonEqual(null, {})).toBe(false);
  });

  test("values with different content are different", () => {
    expect(jsonEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(jsonEqual({ a: 1 }, { a: 1, b: 1 })).toBe(false);
  });
});

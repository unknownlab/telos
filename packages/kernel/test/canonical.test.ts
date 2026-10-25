import { describe, expect, test } from "bun:test";
import { canonicalJson, jsonEqual, sortKeys } from "../src/canonical";

describe("canonicalJson", () => {
  test("sorts object keys recursively and writes no spaces", () => {
    expect(canonicalJson({ b: [2, { d: 1, c: 0 }], a: "x" })).toBe(
      '{"a":"x","b":[2,{"c":0,"d":1}]}',
    );
  });

  test("drops undefined members", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  test("keeps array order", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("sortKeys", () => {
  test("returns a sorted copy and does not mutate the input", () => {
    const input = { b: 1, a: { d: 2, c: undefined } };
    const copy = sortKeys(input) as Record<string, unknown>;
    expect(Object.keys(copy)).toEqual(["a", "b"]);
    expect(Object.keys(copy.a as object)).toEqual(["d"]);
    expect(Object.keys(input)).toEqual(["b", "a"]);
  });
});

describe("jsonEqual", () => {
  test("is true for the same members in a different key order", () => {
    expect(jsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  test("is false for arrays whose order differs", () => {
    expect(jsonEqual([1, 2], [2, 1])).toBe(false);
  });
});

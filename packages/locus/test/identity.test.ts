import { describe, expect, test } from "bun:test";
import { isIdentity } from "../src/identity";

describe("isIdentity", () => {
  const cases: ReadonlyArray<readonly [string, boolean]> = [
    ["shop:checkout", true],
    ["telos:locus-core", true],
    ["a1:b2-c3", true],
    ["a:b", true],
    ["checkout", false],
    ["Shop:checkout", false],
    ["shop:check out", false],
    ["shop:", false],
    [":x", false],
    ["shop:-x", false],
    ["shop:x-", false],
    ["shop:x--y", false],
    ["shop:a:b", false],
    ["1shop:x", false],
    ["shop:ü", false],
    [" shop:x", false],
    ["shop:x\n", false],
    ["a:" + "b".repeat(126), true],
    ["a:" + "b".repeat(127), false],
  ];

  test.each(cases)("%j is %p", (value, expected) => {
    expect(isIdentity(value)).toBe(expected);
  });

  test("accepts exactly 128 characters and rejects 129", () => {
    expect("a:" + "b".repeat(126)).toHaveLength(128);
    expect("a:" + "b".repeat(127)).toHaveLength(129);
    expect(isIdentity("a:" + "b".repeat(126))).toBe(true);
    expect(isIdentity("a:" + "b".repeat(127))).toBe(false);
  });
});

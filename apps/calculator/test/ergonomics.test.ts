// START_MODULE_CONTRACT
//   PURPOSE: Enforce NFR-008 on the arithmetic definition by counting its real lines and rejecting explicit type arguments and casts.
//   SCOPE: Reads the START_BLOCK_ARITHMETIC_LOCUS region of arithmetic.ts and checks its size and call-site style. Out: the behaviour of the definition (arithmetic.test.ts).
//   DEPENDS: M-CALC-ARITHMETIC
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   START - the opening block marker of the arithmetic Locus
//   END - the closing block marker of the arithmetic Locus
//   source - the text of arithmetic.ts
//   readBlock - the text strictly between the two arithmetic Locus block markers
//   countedLines - the lines that are neither blank nor comments
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const START = "// START_BLOCK_ARITHMETIC_LOCUS";
const END = "// END_BLOCK_ARITHMETIC_LOCUS";

const source = await Bun.file(
  join(import.meta.dir, "../src/arithmetic.ts"),
).text();

const readBlock = (text: string): string => {
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  return text.slice(start + START.length, end);
};

const countedLines = (block: string): string[] =>
  block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//"));

describe("NFR-008 arithmetic definition ergonomics", () => {
  test("both block markers exist exactly once", () => {
    expect(source.split(START).length - 1).toBe(1);
    expect(source.split(END).length - 1).toBe(1);
  });

  test("the block has at most 80 counted lines", () => {
    const lines = countedLines(readBlock(source));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(80);
  });

  test("the block has no explicit type arguments at call sites", () => {
    expect(readBlock(source)).not.toMatch(/\.make\s*</);
  });

  test("the block has no casts", () => {
    for (const line of countedLines(readBlock(source))) {
      expect(line).not.toMatch(/\bas\s+[A-Z]/);
    }
  });
});

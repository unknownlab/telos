import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as api from "../src/index";

const SRC_DIR = join(import.meta.dir, "..", "src");

// Export declarations that carry a runtime or type name. Re-export lines
// (`export {`, `export type {`, `export *`) are excluded because they only
// point at declarations that are checked where they are declared.
const DECLARATION =
  /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;

const isDeclarationLine = (line: string): boolean =>
  line.startsWith("export ") &&
  !line.startsWith("export {") &&
  !line.startsWith("export type {") &&
  !line.startsWith("export *");

function previousNonBlankIndex(
  lines: ReadonlyArray<string>,
  from: number,
): number {
  for (let i = from - 1; i >= 0; i--) {
    if ((lines[i] ?? "").trim() !== "") return i;
  }
  return -1;
}

function hasTsdocAbove(
  lines: ReadonlyArray<string>,
  exportIndex: number,
): boolean {
  const end = previousNonBlankIndex(lines, exportIndex);
  if (end < 0 || !(lines[end] ?? "").trim().endsWith("*/")) return false;
  // Walk up through the comment body only; any non-comment line ends the search.
  for (let i = end; i >= 0; i--) {
    const line = (lines[i] ?? "").trim();
    if (line.startsWith("/**")) return true;
    if (!line.startsWith("*")) return false;
  }
  return false;
}

describe("@telos/locus public surface", () => {
  test("runtime exports are exactly the contract list", () => {
    expect(Object.keys(api).sort()).toEqual([
      "DecodeError",
      "DigestError",
      "LocusMismatchError",
      "RELATION_KINDS",
      "RevisionHistory",
      "RevisionHistoryInMemory",
      "RevisionNotFoundError",
      "StaleBaselineError",
      "canonicalForm",
      "createRevision",
      "decodeFabric",
      "decodeFabricJson",
      "decodeLocus",
      "defineFabric",
      "defineLocus",
      "diffRevisions",
      "isIdentity",
      "validateFabric",
    ]);
  });
});

describe("documentation coverage (NFR-006)", () => {
  test("every exported declaration in src has TSDoc and a START_CONTRACT block", () => {
    const files = readdirSync(SRC_DIR)
      .filter((file) => file.endsWith(".ts"))
      .sort();
    const violations: string[] = [];
    let checked = 0;

    for (const file of files) {
      const text = readFileSync(join(SRC_DIR, file), "utf8");
      const lines = text.split("\n");
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? "";
        if (!isDeclarationLine(line)) continue;
        const match = DECLARATION.exec(line);
        if (match === null) {
          violations.push(`${file}: cannot read an identifier from "${line}"`);
          continue;
        }
        const name = match[1] ?? "";
        checked++;
        if (!hasTsdocAbove(lines, index)) {
          violations.push(`${file}: ${name} has no TSDoc comment above it`);
        }
        const contract = new RegExp(
          `^\\s*//\\s*START_CONTRACT:\\s*${name}\\s*$`,
          "m",
        );
        if (!contract.test(text)) {
          violations.push(`${file}: ${name} has no START_CONTRACT block`);
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});

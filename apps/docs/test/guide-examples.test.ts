// START_MODULE_CONTRACT
//   PURPOSE: Prove that every code example in the guides is real: each source= block is the text of a named region of compiled code, and each playground= block is the JSON of a playground example (FR-031).
//   SCOPE: The fenced blocks of the four guides in docs/guides with a source= or playground= annotation, the regions they quote and PLAYGROUND_EXAMPLES. No other block kinds (guides.test.ts checks those).
//   DEPENDS: M-DOCS-CONTENT, M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   GUIDE_FILES - the four guide sources, in navigation order
//   FENCE - a fenced block with its info string and body
//   SOURCE - the source= annotation of an info string
//   PLAYGROUND - the playground= annotation of an info string
//   GuideFence - one fenced block: its guide file, its info string and its body
//   FENCES - every fenced block of the four guides
//   REQUIRED_REGIONS - the regions the guides must quote at least once
//   regionOf - the text of a named region of a repository file
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLAYGROUND_EXAMPLES } from "../src/playground/examples";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const GUIDE_FILES = [
  "docs/guides/introduction.md",
  "docs/guides/first-locus.md",
  "docs/guides/examples.md",
  "docs/guides/agent-reference.md",
] as const;

const FENCE = /^```([^\n]*)\n([\s\S]*?)^```$/gm;
const SOURCE = /^ts source=(\S+)#([A-Z0-9_]+)$/;
const PLAYGROUND = /^json playground=([a-z-]+)$/;

interface GuideFence {
  readonly file: string;
  readonly info: string;
  readonly body: string;
}

const FENCES: ReadonlyArray<GuideFence> = GUIDE_FILES.flatMap((file) =>
  [...readFileSync(resolve(REPO_ROOT, file), "utf8").matchAll(FENCE)].map(
    (match) => ({ file, info: match[1] ?? "", body: match[2] ?? "" }),
  ),
);

const REQUIRED_REGIONS = [
  "ARITHMETIC_LOCUS",
  "CALCULATOR_APP",
  "GUIDE_FIRST_LOCUS",
  "GUIDE_EXTENSION",
  "GUIDE_COMPOSITION",
  "GUIDE_CAPABILITY",
  "GUIDE_MODEL",
  "GUIDE_INSPECT",
] as const;

// START_CONTRACT: regionOf
//   PURPOSE: Read the text between the START_BLOCK and END_BLOCK markers of one region, as the guides quote it.
//   INPUTS: { path: string - a repository-relative file path, region: string - the region name without the START_BLOCK_ prefix }
//   OUTPUTS: { string - the lines strictly between the markers, without their common leading spaces and without outer blank lines, joined with newlines; throws when a marker is missing }
//   SIDE_EFFECTS: reads one repository file
//   LINKS: V-M-DOCS-PLAYGROUND
// END_CONTRACT: regionOf
function regionOf(path: string, region: string): string {
  const lines = readFileSync(resolve(REPO_ROOT, path), "utf8").split("\n");
  const start = lines.findIndex(
    (line) => line.trim() === `// START_BLOCK_${region}`,
  );
  const end = lines.findIndex(
    (line) => line.trim() === `// END_BLOCK_${region}`,
  );
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${path} has no region ${region}`);
  }
  const inner = lines.slice(start + 1, end);
  const indents = inner
    .filter((line) => line.trim() !== "")
    .map((line) => line.length - line.trimStart().length);
  const indent = indents.length === 0 ? 0 : Math.min(...indents);
  const dedented = inner.map((line) => line.slice(indent));
  while (dedented.length > 0 && dedented[0]?.trim() === "") dedented.shift();
  while (dedented.length > 0 && dedented.at(-1)?.trim() === "") dedented.pop();
  return dedented.join("\n");
}

describe("guide examples: source= blocks", () => {
  test("every source= block equals its region", () => {
    const mismatches = FENCES.flatMap((fence) => {
      const match = SOURCE.exec(fence.info);
      if (match === null) return [];
      const [, path = "", region = ""] = match;
      return fence.body.replace(/\n$/, "") === regionOf(path, region)
        ? []
        : [`${fence.file}: ${fence.info}`];
    });
    expect(mismatches).toEqual([]);
  });

  test("the guides quote ARITHMETIC_LOCUS, CALCULATOR_APP and all six GUIDE_ regions", () => {
    const quoted = new Set(
      FENCES.flatMap((fence) => {
        const region = SOURCE.exec(fence.info)?.[2];
        return region === undefined ? [] : [region];
      }),
    );
    expect(REQUIRED_REGIONS.filter((region) => !quoted.has(region))).toEqual(
      [],
    );
  });
});

describe("guide examples: playground= blocks", () => {
  const names = new Set(PLAYGROUND_EXAMPLES.map((example) => example.name));

  test("every playground= name is a playground example", () => {
    const unknown = FENCES.flatMap((fence) => {
      const name = PLAYGROUND.exec(fence.info)?.[1];
      return name === undefined || names.has(name) ? [] : [name];
    });
    expect(unknown).toEqual([]);
  });

  test("every playground= block is the example JSON", () => {
    const mismatches = FENCES.flatMap((fence) => {
      const name = PLAYGROUND.exec(fence.info)?.[1];
      if (name === undefined) return [];
      const example = PLAYGROUND_EXAMPLES.find((item) => item.name === name);
      return example !== undefined &&
        JSON.stringify(JSON.parse(fence.body)) ===
          JSON.stringify(JSON.parse(example.json))
        ? []
        : [`${fence.file}: ${fence.info}`];
    });
    expect(mismatches).toEqual([]);
  });
});

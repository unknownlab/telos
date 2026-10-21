// START_MODULE_CONTRACT
//   PURPOSE: Prove that every example= block in the guides is the same data as the examples of @telos/locus-specs, so that a reader's example is the input that the playground runs (FR-019).
//   SCOPE: The fenced blocks of docs/guides/*.md that carry an example= annotation, their JSON, and the five example names.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   GUIDES - the guide directory
//   FENCE - a fenced block with its info string and body
//   EXAMPLE_TABLE - the example names with the example data they name
//   GuideExample - one example= block: its guide file, its example name and its body
//   ANNOTATION - the example= annotation of an info string
//   examplesInGuides - every example= block of every guide, with its file and name
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { examples } from "@telos/locus-specs";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const GUIDES = resolve(REPO_ROOT, "docs/guides");

const FENCE = /^```([^\n]*)\n([\s\S]*?)^```$/gm;
const ANNOTATION = /\bexample=(\S+)/;

const EXAMPLE_TABLE: Readonly<Record<string, unknown>> = {
  valid: examples.valid,
  invalid: examples.invalid,
  relations: examples.relations,
  "history.a": examples.history.a,
  "history.b": examples.history.b,
};

interface GuideExample {
  readonly file: string;
  readonly name: string;
  readonly body: string;
}

function examplesInGuides(): GuideExample[] {
  const found: GuideExample[] = [];
  const files = readdirSync(GUIDES)
    .filter((name) => name.endsWith(".md"))
    .sort();
  for (const file of files) {
    const text = readFileSync(resolve(GUIDES, file), "utf8");
    for (const match of text.matchAll(FENCE)) {
      const annotation = ANNOTATION.exec(match[1] ?? "");
      if (annotation === null) continue;
      found.push({ file, name: annotation[1] ?? "", body: match[2] ?? "" });
    }
  }
  return found;
}

describe("example= blocks in the guides", () => {
  const found = examplesInGuides();

  test("every example= name is one of the five playground examples", () => {
    const unknown = found
      .filter((block) => !(block.name in EXAMPLE_TABLE))
      .map((block) => `${block.file}: unknown example ${block.name}`);
    expect(unknown).toEqual([]);
  });

  test("every example= block is the JSON of the matching example", () => {
    for (const block of found) {
      if (!(block.name in EXAMPLE_TABLE)) continue;
      expect({
        file: block.file,
        name: block.name,
        json: JSON.parse(block.body),
      }).toEqual({
        file: block.file,
        name: block.name,
        json: EXAMPLE_TABLE[block.name],
      });
    }
  });

  test("each of the five example names occurs in at least one guide", () => {
    const seen = new Set(found.map((block) => block.name));
    for (const name of Object.keys(EXAMPLE_TABLE)) {
      expect(seen.has(name)).toBe(true);
    }
  });
});

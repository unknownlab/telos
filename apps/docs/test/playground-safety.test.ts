// START_MODULE_CONTRACT
//   PURPOSE: Prove C-002 on the sources: the scanner catches each forbidden form, every site source is clean, every playground source is clean, and the two known raw-HTML exceptions stay where they are.
//   SCOPE: The scanner samples, the site scan of apps/docs/src and the playground scan of apps/docs/src/playground, and the allow-lists of innerHTML and dangerouslySetInnerHTML.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   APP_ROOT - the apps/docs directory
//   SRC - the site source directory
//   PLAYGROUND - the playground source directory
//   SITE_FORBIDDEN_SAMPLES - sources that each contain one forbidden construct, for the site rules
//   PLAYGROUND_FORBIDDEN_SAMPLES - sources that each contain one forbidden construct, for the playground rules only
//   sourcesUnder - the relative paths of the .ts and .tsx files under a directory, skipping the generated route tree
//   readSource - the text of a file under apps/docs
//   filesContaining - the relative paths of the files whose code, without comments, contains a name
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  playgroundViolations,
  siteViolations,
  stripComments,
} from "./safety-scan";

const APP_ROOT = resolve(import.meta.dir, "..");
const SRC = resolve(APP_ROOT, "src");
const PLAYGROUND = resolve(SRC, "playground");

const SITE_FORBIDDEN_SAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["eval(", 'const value = eval("1 + 1");'],
  ["new Function", 'const make = new Function("return 1");'],
  ["Function(", 'const make = Function("return 1");'],
  ["setTimeout with a string", 'setTimeout("alert(1)", 0);'],
  ["setInterval with a string", "setInterval('alert(1)', 10);"],
  ["import() of user text", "const mod = await import(userText);"],
];

const PLAYGROUND_FORBIDDEN_SAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["innerHTML", "node.innerHTML = text;"],
  ["outerHTML", "node.outerHTML = text;"],
  ["insertAdjacentHTML", 'node.insertAdjacentHTML("beforeend", text);'],
  [
    "dangerouslySetInnerHTML",
    "<div dangerouslySetInnerHTML={{ __html: text }} />;",
  ],
  ["document.write", "document.write(text);"],
  ["createElement script", 'document.createElement("script");'],
  ["createElement iframe", "document.createElement('iframe');"],
  ["a script tag", "const markup = '<script>alert(1)</script>';"],
  ["srcdoc", "frame.srcdoc = text;"],
  ["import() of a literal module", 'const mod = await import("mermaid");'],
];

function sourcesUnder(directory: string): string[] {
  return [...new Bun.Glob("**/*.{ts,tsx}").scanSync({ cwd: directory })]
    .filter((path) => !path.endsWith("routeTree.gen.ts"))
    .sort();
}

async function readSource(relative: string): Promise<string> {
  return Bun.file(resolve(APP_ROOT, relative)).text();
}

async function filesContaining(name: string): Promise<string[]> {
  const found: string[] = [];
  for (const path of sourcesUnder(SRC)) {
    const code = stripComments(await Bun.file(resolve(SRC, path)).text());
    if (code.includes(name)) found.push(`src/${path}`);
  }
  return found;
}

describe("the scanner catches each forbidden form", () => {
  for (const [name, sample] of SITE_FORBIDDEN_SAMPLES) {
    test(`site rule: ${name}`, () => {
      expect(siteViolations(sample).length).toBeGreaterThan(0);
      expect(playgroundViolations(sample).length).toBeGreaterThan(0);
    });
  }

  for (const [name, sample] of PLAYGROUND_FORBIDDEN_SAMPLES) {
    test(`playground rule: ${name}`, () => {
      expect(playgroundViolations(sample).length).toBeGreaterThan(0);
    });
  }

  test("a literal module name is allowed in the site but not in the playground", () => {
    const sample = 'const mermaid = await import("mermaid");';
    expect(siteViolations(sample)).toEqual([]);
    expect(playgroundViolations(sample).length).toBeGreaterThan(0);
  });

  test("a construct named only in a comment is not reported", () => {
    const sample = [
      "// eval(text) and new Function(text) are not used here",
      "/* node.innerHTML = text; document.write(text); */",
      "const safe = 1;",
    ].join("\n");
    expect(siteViolations(sample)).toEqual([]);
    expect(playgroundViolations(sample)).toEqual([]);
  });

  test("a comment mark inside a string does not hide the code after it", () => {
    const sample = 'const url = "https://example.org"; eval("1");';
    expect(siteViolations(sample)).toEqual(["eval("]);
  });
});

describe("the sources are clean", () => {
  test("every .ts and .tsx file under apps/docs/src passes the site rules", async () => {
    const files = sourcesUnder(SRC);
    expect(files.length).toBeGreaterThan(0);
    const problems: string[] = [];
    for (const path of files) {
      for (const name of siteViolations(
        await Bun.file(resolve(SRC, path)).text(),
      )) {
        problems.push(`src/${path}: ${name}`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("every file under apps/docs/src/playground passes the playground rules", async () => {
    const files = sourcesUnder(PLAYGROUND);
    expect(files.length).toBeGreaterThan(0);
    const problems: string[] = [];
    for (const path of files) {
      const text = await Bun.file(resolve(PLAYGROUND, path)).text();
      for (const name of playgroundViolations(text)) {
        problems.push(`src/playground/${path}: ${name}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("the two known raw-HTML exceptions stay exceptions", () => {
  test("dangerouslySetInnerHTML occurs only in the document page, which renders build-time content", async () => {
    expect(await filesContaining("dangerouslySetInnerHTML")).toEqual([
      "src/components/document-page.tsx",
    ]);
  });

  test("innerHTML occurs only in the Mermaid renderer, which renders strict-mode SVG of repository content", async () => {
    expect(await filesContaining("innerHTML")).toEqual([
      "src/components/mermaid-renderer.tsx",
    ]);
  });

  test("the document page exception is the one that the scan reads", async () => {
    const text = await readSource("src/components/document-page.tsx");
    expect(text).toContain("dangerouslySetInnerHTML");
  });
});

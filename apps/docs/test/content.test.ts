// START_MODULE_CONTRACT
//   PURPOSE: Prove the content compiler turns docs/ into the generated site files and fails every NS-020 case with the exact problem list.
//   SCOPE: Slug rule, entity and tag helpers, the 23 failure cases on a fixture tree, the valid fixture's routes, outline, links, search, llms.txt and index.json, the real docs tree, and the CLI exit codes and outputs.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: V-M-DOCS-CONTENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   APP_DOCS - the apps/docs package directory
//   FIXTURE - the valid miniature repository used by most cases
//   GIT - a fixed git reader so the output does not depend on the checkout
//   PRIOR - the fixture research document that most failure cases edit
//   P01 - the fixture principle P01 file
//   LOCUS - the fixture terminology file for the locus term
//   ADR - the fixture ADR-0001 file
//   FOUNDATION - the fixture foundation index file
//   PRINCIPLES - the fixture principles index file
//   KIND_MESSAGE - the exact kind enumeration message
//   STATUS_MESSAGE - the exact status enumeration message
//   MATURITY_MESSAGE - the exact maturity enumeration message
//   EXPECTED_LLMS - the exact llms.txt text for the valid fixture
//   EXPECTED_INDEX - the eight index.json entries for the valid fixture
//   Changes - a map of fixture path to replacement text, null deletes the file
//   Case - one failure case with its changes and its exact problem lines
//   CASES - the 23 failure cases of NS-020
//   dirs - temporary directories created by withFixture and removed after each test
//   withFixture - copy the valid fixture to a fresh directory and apply changes
//   fixture - read one fixture file as text
//   editFront - replace the front matter text of a Markdown file
//   setLine - replace one key line of a front matter block
//   dropLine - remove one key line of a front matter block
//   addLine - append one line to a front matter block
//   problemsOf - a compile result as "<file>: <message>" lines
// END_MODULE_MAP

import { afterEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import MiniSearch from "minisearch";
import {
  type ContentDocument,
  type SearchSection,
  compareInSection,
} from "../src/lib/content-types";
import { SEARCH_OPTIONS } from "../src/lib/search-options";
import {
  type CompileResult,
  compileContent,
  decodeEntities,
  plainText,
  slugify,
  stripTags,
} from "../scripts/content";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const APP_DOCS = resolve(import.meta.dir, "..");
const FIXTURE = join(import.meta.dir, "fixtures/valid");
const GIT = () => ({ commit: "0123abc", dirty: true });

const PRIOR = "docs/research/prior-art.md";
const P01 = "docs/foundation/principles/P01-everything-is-code.md";
const LOCUS = "docs/foundation/terminology/locus.md";
const ADR = "docs/decisions/ADR-0001-record-architecture-decisions.md";
const FOUNDATION = "docs/foundation/README.md";
const PRINCIPLES = "docs/foundation/principles/README.md";

const KIND_MESSAGE =
  'Expected "index" | "doctrine" | "principle" | "term" | "model" | "capability-map" | "direction" | "roadmap" | "questions" | "decision" | "research" | "guide"';
const STATUS_MESSAGE =
  'Expected "provisional" | "proposed" | "accepted" | "open" | "superseded" | "deprecated"';
const MATURITY_MESSAGE = 'Expected "vision" | "proposed" | "implemented"';

const EXPECTED_LLMS = `# Telos by UnknownLab

> Telos by UnknownLab is a framework in which software systems are described, verified and evolved as code. This file lists the pages of the local documentation site, which is generated from docs/ in the repository.

## Introduction

- [Introduction](/): Start here.

## Philosophy

- [Evolution of determinism](/philosophy): Why determinism grows.

## Principles

- [Principles](/principles): The fixture principles.
- [P01 — Everything is code](/principles/P01-everything-is-code): Every artifact is code.

## Terminology

- [Locus](/terminology/locus): The unit of meaning and ownership.

## Architecture

- [Foundation](/architecture/foundation): Entry point of the fixture foundation.
- [Prior art](/architecture/prior-art): What exists already.

## Inspector

- [Inspector](/inspector): The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json.

## Playground

- [Playground](/playground): Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser.

## Calculator

- [Calculator](/calculator): The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.

## Verification

- [Verification](/verification): The Archetype verification and Semantic Closure report from the build-time run, with its provenance.

## Decisions

- [ADR-0001: Record architecture decisions](/decisions/ADR-0001): Decisions are recorded as ADRs.
`;

const EXPECTED_INDEX = {
  version: 1,
  generatedFrom: { commit: "0123abc", dirty: true },
  documents: [
    {
      id: "ADR-0001",
      title: "ADR-0001: Record architecture decisions",
      kind: "decision",
      status: "accepted",
      maturity: "implemented",
      summary: "Decisions are recorded as ADRs.",
      related: [],
      url: "/decisions/ADR-0001",
      source: "docs/decisions/ADR-0001-record-architecture-decisions.md",
    },
    {
      id: "P01-everything-is-code",
      title: "P01 — Everything is code",
      kind: "principle",
      status: "provisional",
      maturity: "proposed",
      summary: "Every artifact is code.",
      related: ["locus"],
      url: "/principles/P01-everything-is-code",
      source: "docs/foundation/principles/P01-everything-is-code.md",
    },
    {
      id: "evolution-of-determinism",
      title: "Evolution of determinism",
      kind: "doctrine",
      status: "provisional",
      maturity: "vision",
      summary: "Why determinism grows.",
      related: [],
      url: "/philosophy",
      source: "docs/foundation/philosophy/evolution-of-determinism.md",
    },
    {
      id: "foundation",
      title: "Foundation",
      kind: "index",
      status: "provisional",
      maturity: "proposed",
      summary: "Entry point of the fixture foundation.",
      related: ["principles"],
      url: "/architecture/foundation",
      source: "docs/foundation/README.md",
    },
    {
      id: "introduction",
      title: "Introduction",
      kind: "guide",
      status: "provisional",
      maturity: "proposed",
      summary: "Start here.",
      related: ["foundation"],
      url: "/",
      source: "docs/guides/introduction.md",
    },
    {
      id: "locus",
      title: "Locus",
      kind: "term",
      status: "provisional",
      maturity: "proposed",
      summary: "The unit of meaning and ownership.",
      related: ["P01-everything-is-code"],
      url: "/terminology/locus",
      source: "docs/foundation/terminology/locus.md",
    },
    {
      id: "principles",
      title: "Principles",
      kind: "index",
      status: "provisional",
      maturity: "proposed",
      summary: "The fixture principles.",
      related: ["P01-everything-is-code"],
      url: "/principles",
      source: "docs/foundation/principles/README.md",
    },
    {
      id: "prior-art",
      title: "Prior art",
      kind: "research",
      status: "provisional",
      maturity: "vision",
      summary: "What exists already.",
      related: ["foundation"],
      url: "/architecture/prior-art",
      source: "docs/research/prior-art.md",
    },
  ],
};

type Changes = Record<string, string | null>;

interface Case {
  readonly name: string;
  readonly changes: () => Changes;
  readonly problems: string[];
}

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

function fixture(path: string): string {
  return readFileSync(join(FIXTURE, path), "utf8");
}

function withFixture(changes: Changes): string {
  const root = mkdtempSync(join(tmpdir(), "telos-content-"));
  dirs.push(root);
  cpSync(FIXTURE, root, { recursive: true });
  for (const [path, text] of Object.entries(changes)) {
    const target = join(root, path);
    if (text === null) {
      rmSync(target, { force: true });
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
  return root;
}

function editFront(text: string, edit: (front: string) => string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error("fixture text has no front matter");
  return `---\n${edit(match[1] ?? "")}\n---\n${text.slice(match[0].length)}`;
}

function setLine(front: string, key: string, value: string): string {
  const line = new RegExp(`^${key}:.*$`, "m");
  if (!line.test(front)) throw new Error(`no ${key} line in front matter`);
  return front.replace(line, `${key}: ${value}`);
}

function dropLine(front: string, key: string): string {
  const line = new RegExp(`^${key}:.*\\n?`, "m");
  if (!line.test(front)) throw new Error(`no ${key} line in front matter`);
  return front.replace(line, "");
}

function addLine(front: string, line: string): string {
  return `${front}\n${line}`;
}

function problemsOf(result: CompileResult): string[] {
  return result.ok ? [] : result.problems.map((p) => `${p.file}: ${p.message}`);
}

const CASES: readonly Case[] = [
  {
    name: "case 1: a document without front matter is dropped",
    changes: () => ({ [PRIOR]: "# Prior art\n" }),
    problems: [`${PRIOR}: missing front matter`],
  },
  {
    name: "case 2: invalid YAML in the front matter",
    changes: () => ({ [PRIOR]: editFront(fixture(PRIOR), () => "id: [") }),
    problems: [
      `${PRIOR}: front matter is not valid YAML: YAML Parse error: Unexpected token`,
    ],
  },
  {
    name: "case 3: front matter that is a list, not a mapping",
    changes: () => ({ [PRIOR]: editFront(fixture(PRIOR), () => "- a") }),
    problems: [`${PRIOR}: front matter must be a mapping`],
  },
  {
    name: "case 4: an unknown kind reports every consequence",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) => setLine(f, "kind", "principal")),
    }),
    problems: [
      `${P01}: front matter: kind: ${KIND_MESSAGE}`,
      `${PRINCIPLES}: related id "P01-everything-is-code" does not resolve to a document`,
      `${LOCUS}: related id "P01-everything-is-code" does not resolve to a document`,
    ],
  },
  {
    name: "case 5: a missing title",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) => dropLine(f, "title")),
    }),
    problems: [`${P01}: front matter: title: Missing key`],
  },
  {
    name: "case 6: an invalid status and an invalid maturity",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) =>
        setLine(setLine(f, "status", "verified"), "maturity", "done"),
      ),
    }),
    problems: [
      `${P01}: front matter: maturity: ${MATURITY_MESSAGE}`,
      `${P01}: front matter: status: ${STATUS_MESSAGE}`,
    ],
  },
  {
    name: "case 7: an unknown field is an error",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) => addLine(f, "owner: me")),
    }),
    problems: [`${P01}: front matter: owner: Expected no excess property`],
  },
  {
    name: "case 8: a term boolean given as a string",
    changes: () => ({
      [LOCUS]: editFront(fixture(LOCUS), (f) =>
        setLine(f, "fundamental", '"yes"'),
      ),
    }),
    problems: [`${LOCUS}: front matter: fundamental: Expected boolean`],
  },
  {
    name: "case 9: a principle number out of range",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) => setLine(f, "number", "17")),
    }),
    problems: [
      `${P01}: front matter: number: Expected a value between 1 and 16`,
    ],
  },
  {
    name: "case 10: a duplicate id reports the later path",
    changes: () => ({
      [PRIOR]: editFront(fixture(PRIOR), (f) => setLine(f, "id", "foundation")),
    }),
    problems: [`${PRIOR}: duplicate id "foundation" (also in ${FOUNDATION})`],
  },
  {
    name: "case 11: an unresolved related id",
    changes: () => ({
      [PRIOR]: editFront(fixture(PRIOR), (f) =>
        setLine(f, "related", "[foundation, nope]"),
      ),
    }),
    problems: [`${PRIOR}: related id "nope" does not resolve to a document`],
  },
  {
    name: "case 12: a link to a missing content file",
    changes: () => ({
      [PRIOR]: fixture(PRIOR).replace(
        "../foundation/README.md#maturity-vocabulary",
        "../foundation/missing.md",
      ),
    }),
    problems: [
      `${PRIOR}: broken link "../foundation/missing.md": no such file docs/foundation/missing.md`,
    ],
  },
  {
    name: "case 13: a link to a fragment that is not a heading",
    changes: () => ({
      [PRIOR]: fixture(PRIOR).replace(
        "../foundation/README.md#maturity-vocabulary",
        "../foundation/README.md#nope",
      ),
    }),
    problems: [
      `${PRIOR}: broken link "../foundation/README.md#nope": no heading "nope" in docs/foundation/README.md`,
    ],
  },
  {
    name: "case 14: a link to a missing repository file",
    changes: () => ({
      [PRIOR]: fixture(PRIOR).replace(
        "../foundation/README.md#maturity-vocabulary",
        "../../scripts/missing.ts",
      ),
    }),
    problems: [
      `${PRIOR}: broken link "../../scripts/missing.ts": no such file scripts/missing.ts`,
    ],
  },
  {
    name: "case 15: a link that leaves the repository",
    changes: () => ({
      [PRIOR]: fixture(PRIOR).replace(
        "../foundation/README.md#maturity-vocabulary",
        "../../../outside.md",
      ),
    }),
    problems: [
      `${PRIOR}: broken link "../../../outside.md": points outside the repository`,
    ],
  },
  {
    name: "case 16: a site link to an unknown route",
    changes: () => ({
      [PRIOR]: fixture(PRIOR).replace("](/playground)", "](/playground/z)"),
    }),
    problems: [`${PRIOR}: unknown site route "/playground/z"`],
  },
  {
    name: "case 17: two documents on one route",
    changes: () => ({
      "docs/foundation/philosophy/second.md":
        "---\nid: second\ntitle: Second\nkind: doctrine\nstatus: provisional\nmaturity: vision\nsummary: A second doctrine.\nrelated: []\n---\n\n# Second\n",
    }),
    problems: [
      'docs/foundation/philosophy/second.md: route "/philosophy" is also used by docs/foundation/philosophy/evolution-of-determinism.md',
    ],
  },
  {
    name: "case 18: a verified claim in a Status column",
    changes: () => ({
      [ADR]: fixture(ADR).replace(
        "| ADR-0001 | accepted |",
        "| ADR-0001 | verified |",
      ),
    }),
    problems: [
      `${ADR}: forbidden verification claim "verified" in the Status column`,
    ],
  },
  {
    name: "case 19: the vocabulary table outside its exempt file is checked",
    changes: () => ({
      [PRIOR]: `${fixture(PRIOR)}
## Maturity vocabulary

| Maturity | Meaning |
| --- | --- |
| \`vision\` | Intended direction. |
| \`verified\` | Never written by hand. |
`,
    }),
    problems: [
      `${PRIOR}: forbidden verification claim "verified" in the Maturity column`,
    ],
  },
  {
    name: "case 20: the vocabulary table under another heading is checked",
    changes: () => ({
      [FOUNDATION]: fixture(FOUNDATION).replace(
        "## Maturity vocabulary\n",
        "## Maturity vocabulary\n\nDefinitions follow.\n\n## Other\n",
      ),
    }),
    problems: [
      `${FOUNDATION}: forbidden verification claim "verified" in the Maturity column`,
    ],
  },
  {
    name: "case 21: a verified claim in a summary",
    changes: () => ({
      [PRIOR]: editFront(fixture(PRIOR), (f) =>
        setLine(f, "summary", "All tests pass."),
      ),
    }),
    problems: [
      `${PRIOR}: forbidden verification claim "All tests pass" in front matter field "summary"`,
    ],
  },
  {
    name: "case 22: a passing word in a Notes column is allowed",
    changes: () => ({
      [PRIOR]: `${fixture(PRIOR)}
| Name | Notes |
| --- | --- |
| x | passing |
`,
    }),
    problems: [],
  },
  {
    name: "case 23: errors are collected, not stopped at the first",
    changes: () => ({
      [P01]: editFront(fixture(P01), (f) =>
        addLine(dropLine(f, "title"), "owner: me"),
      ),
    }),
    problems: [
      `${P01}: front matter: owner: Expected no excess property`,
      `${P01}: front matter: title: Missing key`,
    ],
  },
];

describe("slugify follows the GitHub rule", () => {
  test.each([
    ["P08 — Preserve the baseline", "p08--preserve-the-baseline"],
    ["Commitment vs. current invariant", "commitment-vs-current-invariant"],
    ["Café ☕ für alle", "café--für-alle"],
    ["5. Invariants", "5-invariants"],
    ["CAP-07 Evolution", "cap-07-evolution"],
    ["A &amp; B", "a--b"],
    ["snake_case and <code>code</code>", "snake_case-and-code"],
    ["  Trim me  ", "trim-me"],
  ])("heading html %p gives slug %p", (heading, slug) => {
    expect(slugify(decodeEntities(stripTags(heading)))).toBe(slug);
  });
});

describe("text helpers", () => {
  test("stripTags removes every tag and keeps the text", () => {
    expect(stripTags("<code>x</code> y <em>z</em>")).toBe("x y z");
  });

  test("decodeEntities decodes named and numeric references", () => {
    expect(decodeEntities("&amp;&lt;&gt;&quot;&#39;&#65;&#x42;")).toBe(
      `&<>"'AB`,
    );
  });

  test("plainText collapses tags, entities and whitespace", () => {
    expect(plainText("<p>A &amp; <em>B</em></p>\n<p>C</p>")).toBe("A & B C");
  });
});

describe("NS-020 failure cases", () => {
  for (const c of CASES) {
    test(c.name, async () => {
      const root = withFixture(c.changes());
      const result = await compileContent({ root, git: GIT });
      expect(problemsOf(result)).toEqual(c.problems);
      expect(result.ok).toBe(c.problems.length === 0);
    });
  }
});

describe("valid fixture output", () => {
  test("compiles with zero problems", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    expect(problemsOf(result)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test("routes by id are exact", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const routes = Object.fromEntries(
      result.output.content.documents.map((d) => [d.id, d.route]),
    );
    expect(routes).toEqual({
      "ADR-0001": "/decisions/ADR-0001",
      "P01-everything-is-code": "/principles/P01-everything-is-code",
      "evolution-of-determinism": "/philosophy",
      foundation: "/architecture/foundation",
      introduction: "/",
      locus: "/terminology/locus",
      principles: "/principles",
      "prior-art": "/architecture/prior-art",
    });
  });

  test("documents are sorted by id and carry only their own kind fields", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const documents = result.output.content.documents;
    const ids = documents.map((d) => d.id);
    expect(ids).toEqual([...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    const locus = documents.find((d) => d.id === "locus");
    expect(locus).toMatchObject({
      order: 1,
      classification: "semantic-primitive",
      fundamental: true,
      engine: false,
      stage0: "in-scope",
    });
    expect("number" in (locus ?? {})).toBe(false);
  });

  test("P01 outline has GitHub ids and a duplicate suffix", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const p01 = result.output.content.documents.find(
      (d) => d.id === "P01-everything-is-code",
    );
    expect(p01?.outline).toEqual([
      {
        level: 1,
        id: "p01--everything-is-code",
        text: "P01 — Everything is code",
      },
      { level: 2, id: "definition", text: "Definition" },
      { level: 2, id: "notes", text: "Notes" },
      { level: 2, id: "notes-1", text: "Notes" },
    ]);
  });

  test("the term heading and the mermaid block keep their text", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const locus = result.output.content.documents.find((d) => d.id === "locus");
    expect(locus?.html).toContain('<h2 id="café--für-alle">');
    expect(locus?.html).toContain(
      '<pre><code class="language-mermaid">graph LR\n  a --&gt; b\n</code></pre>',
    );
  });

  test("links to content become site routes", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const byId = (id: string) =>
      result.output.content.documents.find((d) => d.id === id)?.html ?? "";
    expect(byId("foundation")).toContain('href="/principles"');
    expect(byId("foundation")).toContain(
      'href="https://github.com/unknownlab/telos/blob/main/docs/tooling.md"',
    );
    expect(byId("evolution-of-determinism")).toContain(
      'href="/principles/P01-everything-is-code#definition"',
    );
    const prior = byId("prior-art");
    expect(prior).toContain(
      'href="/architecture/foundation#maturity-vocabulary"',
    );
    expect(prior).toContain('href="/playground"');
    expect(prior).toContain('href="https://example.org/x?a=1&amp;b=2"');
  });

  test("a link to a directory becomes a GitHub tree link without problems", async () => {
    const root = withFixture({
      [PRIOR]: `${fixture(PRIOR)}\nSee [the folder](../foundation/).\n`,
    });
    const result = await compileContent({ root, git: GIT });
    expect(problemsOf(result)).toEqual([]);
    if (!result.ok) throw new Error("fixture must compile");
    const prior = result.output.content.documents.find(
      (d) => d.id === "prior-art",
    );
    expect(prior?.html).toContain(
      'href="https://github.com/unknownlab/telos/tree/main/docs/foundation"',
    );
  });

  test("llms.txt is the exact expected text", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    expect(result.output.llms).toBe(EXPECTED_LLMS);
  });

  test("index.json is the exact expected object and format", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    expect(JSON.parse(result.output.index)).toEqual(EXPECTED_INDEX);
    expect(result.output.index).toBe(
      `${JSON.stringify(EXPECTED_INDEX, null, 2)}\n`,
    );
  });

  test("search finds a body word and a heading with its route", async () => {
    const result = await compileContent({ root: FIXTURE, git: GIT });
    if (!result.ok) throw new Error("fixture must compile");
    const loaded = MiniSearch.loadJSON<SearchSection>(
      result.output.search,
      SEARCH_OPTIONS,
    );
    const determinism = loaded.search("determinism").map((r) => r.id);
    expect(determinism).toContain("/philosophy");
    const vocabulary = loaded.search("vocabulary");
    const hit = vocabulary.find(
      (r) => r.id === "/architecture/foundation#maturity-vocabulary",
    );
    expect(hit?.route).toBe("/architecture/foundation");
  });
});

describe("real docs tree", () => {
  test("compiles with zero problems", async () => {
    const result = await compileContent({ root: REPO_ROOT, git: GIT });
    expect(problemsOf(result)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test("counts match the files on disk", async () => {
    const result = await compileContent({ root: REPO_ROOT, git: GIT });
    if (!result.ok) throw new Error("real docs must compile");
    const glob = new Bun.Glob(
      "docs/{foundation,decisions,research,guides}/**/*.md",
    );
    const files = await Array.fromAsync(glob.scan({ cwd: REPO_ROOT }));
    const documents: readonly ContentDocument[] =
      result.output.content.documents;
    expect(documents.length).toBe(files.length);
    const ofKind = (kind: string) => documents.filter((d) => d.kind === kind);
    expect(
      ofKind("principle")
        .map((d) => d.number)
        .sort((a, b) => Number(a) - Number(b)),
    ).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    expect(ofKind("term").length).toBe(25);
    const adrFiles = await Array.fromAsync(
      new Bun.Glob("docs/decisions/ADR-*.md").scan({ cwd: REPO_ROOT }),
    );
    expect(adrFiles.length).toBeGreaterThan(0);
    expect(ofKind("decision").length).toBe(adrFiles.length);
  });

  test("principles and terms sort by number and order, not by id text", async () => {
    const result = await compileContent({ root: REPO_ROOT, git: GIT });
    if (!result.ok) throw new Error("real docs must compile");
    const documents = result.output.content.documents;
    const numbers = documents
      .filter((d) => d.kind === "principle")
      .sort(compareInSection)
      .map((d) => d.number);
    expect(numbers).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    const orders = documents
      .filter((d) => d.kind === "term")
      .sort(compareInSection)
      .map((d) => d.order);
    expect(orders).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  test("the technical direction links to tooling on GitHub", async () => {
    const result = await compileContent({ root: REPO_ROOT, git: GIT });
    if (!result.ok) throw new Error("real docs must compile");
    const direction = result.output.content.documents.find(
      (d) => d.id === "technical-direction",
    );
    expect(direction?.html).toContain(
      "https://github.com/unknownlab/telos/blob/main/docs/tooling.md",
    );
  });

  test("searching for archetype finds P06 and the archetype term", async () => {
    const result = await compileContent({ root: REPO_ROOT, git: GIT });
    if (!result.ok) throw new Error("real docs must compile");
    const loaded = MiniSearch.loadJSON<SearchSection>(
      result.output.search,
      SEARCH_OPTIONS,
    );
    const ids = loaded.search("archetype").map((r) => r.id);
    expect(
      ids.some((id) =>
        id.startsWith("/principles/P06-archetypes-specialize-verification"),
      ),
    ).toBe(true);
    expect(ids.some((id) => id.startsWith("/terminology/archetype"))).toBe(
      true,
    );
  });
});

describe("content CLI", () => {
  // Git hooks export GIT_DIR and friends. Without this filter, a fixture copy
  // in a temp directory would read the enclosing repository instead of taking
  // the no-repository fallback that these tests assert.
  const cleanEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  );

  function runCli(root: string, out: string) {
    return Bun.spawnSync({
      cmd: [
        process.execPath,
        "scripts/content.ts",
        "--root",
        root,
        "--out",
        out,
      ],
      cwd: APP_DOCS,
      env: cleanEnv,
      stdout: "pipe",
      stderr: "pipe",
    });
  }

  test("writes the four outputs for the valid fixture", () => {
    const root = withFixture({});
    const out = mkdtempSync(join(tmpdir(), "telos-content-out-"));
    dirs.push(out);
    const run = runCli(root, out);
    expect(run.exitCode).toBe(0);
    expect(run.stdout.toString()).toContain("content: 8 documents");
    const content = JSON.parse(
      readFileSync(join(out, "src/generated/content.json"), "utf8"),
    );
    expect(content.version).toBe(1);
    expect(content.documents.length).toBe(8);
    const search = MiniSearch.loadJSON<SearchSection>(
      readFileSync(join(out, "src/generated/search.json"), "utf8"),
      SEARCH_OPTIONS,
    );
    expect(search.search("determinism").map((r) => r.id)).toContain(
      "/philosophy",
    );
    expect(readFileSync(join(out, "public/llms.txt"), "utf8")).toBe(
      EXPECTED_LLMS,
    );
    const index = JSON.parse(
      readFileSync(join(out, "public/index.json"), "utf8"),
    );
    expect(index.generatedFrom).toEqual({ commit: "unknown", dirty: true });
  });

  test("exits 1 and names the problem for case 11", () => {
    const root = withFixture({
      [PRIOR]: editFront(fixture(PRIOR), (f) =>
        setLine(f, "related", "[foundation, nope]"),
      ),
    });
    const out = mkdtempSync(join(tmpdir(), "telos-content-out-"));
    dirs.push(out);
    const run = runCli(root, out);
    expect(run.exitCode).toBe(1);
    const stderr = run.stderr.toString();
    expect(stderr).toContain(
      `${PRIOR}: related id "nope" does not resolve to a document`,
    );
    expect(stderr).toContain("content: 1 problem(s)");
  });
});

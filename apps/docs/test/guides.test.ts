// START_MODULE_CONTRACT
//   PURPOSE: Prove that the four guides in docs/guides make only the claims the real @telos/locus package, the repository and the content compiler support.
//   SCOPE: Front matter and body shape of each guide; every annotated json block decoded, validated, revised or appended with the real package; every sh command line against package.json and AGENTS.md; the Agent Reference API table and diagnostic code list; the content compile of the whole docs tree.
//   DEPENDS: M-DOCS-CONTENT, M-LOCUS-MODEL, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-LOCUS-HISTORY, M-LOCUS-DECODE
//   LINKS: V-M-DOCS-GUIDES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   GUIDES_DIR - the directory of the four guide sources
//   GUIDE_SPECS - file, title, order, section and maturity of each guide, in nav order
//   GuideSpec - one entry of GUIDE_SPECS
//   DIAGNOSTIC_CODES - the thirteen stable diagnostic codes of contracts/locus-api.md
//   FRONT_MATTER - the front matter pattern the content compiler uses
//   FENCE - the fenced block pattern the guides are read with
//   ANNOTATABLE - the json kinds that may carry an example= annotation
//   JSON_KINDS - every json kind a guide block may use
//   EXAMPLE_NAMES - the example= names that the playground inputs use
//   kindOf - the kind of an info string, or undefined when it is not an allowed annotation
//   Fence - one fenced block with its line, annotation, kind, text and section
//   Guide - one loaded guide with its front matter, body and fences
//   loadGuide - read one guide and collect its fences and their sections
//   GUIDES - the four loaded guides, in nav order
//   AGENTS - the text of AGENTS.md, the source of the spec-kitty and grace command lines
//   sectionOf - the text under one level-two heading of a body
//   decodeFabricText - decode Fabric JSON text with the real package, or throw
//   decodeFabricFailure - the DecodeError of Fabric JSON text, or undefined when it decodes
//   decodeLocusText - decode Locus JSON text with the real package, or throw
//   revisionOf - the Revision of Locus JSON text
//   earlierInSection - the nearest earlier fence of one kind in the same section
//   laterInSection - whether a fence of one kind follows in the same section
//   withoutMessage - a diagnostic without its human-readable message
//   nameOf - the guide's name ("a" or "b") of a Revision id, or the id itself
//   idOfName - the Revision id that a guide name ("a", "b" or null) stands for
//   Step - one step of a json history-steps block
//   PACKAGE_SCRIPTS - the scripts of the root package.json
//   DOCS_SCRIPTS - the scripts of apps/docs/package.json
//   commandProblem - why one sh line is not a known command, or undefined
//   checkFence - check one annotated block against the real package and the repository
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Effect } from "effect";
import * as locus from "@telos/locus";
import docsPackage from "../package.json";
import rootPackage from "../../../package.json";
import { compileContent } from "../scripts/content";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const GUIDES_DIR = resolve(import.meta.dir, "../../../docs/guides");

const GUIDE_SPECS = [
  {
    file: "introduction",
    title: "Introduction",
    order: 1,
    section: "introduction",
    maturity: "proposed",
  },
  {
    file: "first-locus",
    title: "Your first Locus",
    order: 2,
    section: "first-locus",
    maturity: "implemented",
  },
  {
    file: "examples",
    title: "Examples",
    order: 3,
    section: "examples",
    maturity: "implemented",
  },
  {
    file: "agent-reference",
    title: "Agent Reference",
    order: 4,
    section: "agent-reference",
    maturity: "implemented",
  },
] as const;

type GuideSpec = (typeof GUIDE_SPECS)[number];

// The thirteen stable diagnostic codes of the Diagnostic codes table in
// kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md. The
// DiagnosticCode type of @telos/locus has the same thirteen members.
const DIAGNOSTIC_CODES = [
  "identity.malformed",
  "identity.duplicate",
  "charter.purpose-blank",
  "charter.responsibilities-empty",
  "charter.entry-blank",
  "charter.entry-duplicate",
  "owner.missing",
  "owner.self",
  "owner.cycle",
  "relation.target-missing",
  "relation.self",
  "relation.duplicate",
  "relation.refines-cycle",
] as const;

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const FENCE = /^```([^\n]*)\n([\s\S]*?)^```$/gm;

const ANNOTATABLE = new Set([
  "fabric valid",
  "fabric invalid",
  "locus a",
  "locus b",
]);
const JSON_KINDS = new Set([
  ...ANNOTATABLE,
  "fabric decode-error",
  "diagnostics",
  "decode-issues",
  "revisions",
  "changes",
  "history-steps",
]);
const EXAMPLE_NAMES = new Set([
  "valid",
  "invalid",
  "relations",
  "history.a",
  "history.b",
]);

// The annotation of a fenced block, as the guides' Block annotations section
// defines it. Anything else is undefined and fails the test.
function kindOf(info: string): string | undefined {
  if (info === "sh" || info === "text" || info === "mermaid") return info;
  const match = /^json (.+?)( example=(\S+))?$/.exec(info);
  if (match === null) return undefined;
  const kind = match[1] ?? "";
  if (!JSON_KINDS.has(kind)) return undefined;
  if (match[2] !== undefined) {
    if (!ANNOTATABLE.has(kind)) return undefined;
    if (!EXAMPLE_NAMES.has(match[3] ?? "")) return undefined;
  }
  return kind;
}

interface Fence {
  readonly index: number;
  readonly line: number;
  readonly info: string;
  readonly kind: string | undefined;
  readonly text: string;
  readonly section: number;
}

interface Guide {
  readonly spec: GuideSpec;
  readonly front: Readonly<Record<string, unknown>>;
  readonly body: string;
  readonly fences: ReadonlyArray<Fence>;
}

// START_CONTRACT: loadGuide
//   PURPOSE: Read one guide and collect its fenced blocks, each with its line and the level-two section it is in.
//   INPUTS: { spec: GuideSpec - the expected file, title, order, section and maturity }
//   OUTPUTS: { Guide - front matter (empty when the file or its front matter is missing), body and fences }
//   SIDE_EFFECTS: reads one file under docs/guides
//   LINKS: V-M-DOCS-GUIDES
// END_CONTRACT: loadGuide
function loadGuide(spec: GuideSpec): Guide {
  const path = join(GUIDES_DIR, `${spec.file}.md`);
  const text = existsSync(path) ? readFileSync(path, "utf8") : "";
  const match = FRONT_MATTER.exec(text);
  const front: Record<string, unknown> =
    match === null
      ? {}
      : (Bun.YAML.parse(match[1] ?? "") as Record<string, unknown>);
  const bodyOffset = match === null ? 0 : match[0].length;
  const body = text.slice(bodyOffset);

  const ranges = [...body.matchAll(FENCE)].map((m) => ({
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
    info: m[1] ?? "",
    text: m[2] ?? "",
  }));
  const headings = [...body.matchAll(/^## /gm)]
    .map((m) => m.index ?? 0)
    .filter((at) => !ranges.some((r) => at >= r.start && at < r.end));

  const fences: Fence[] = ranges.map((r, index) => ({
    index,
    line: text.slice(0, bodyOffset + r.start).split("\n").length,
    info: r.info,
    kind: kindOf(r.info),
    text: r.text,
    section: headings.filter((at) => at < r.start).length,
  }));
  return { spec, front, body, fences };
}

const GUIDES = GUIDE_SPECS.map(loadGuide);
const AGENTS = readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8");

function sectionOf(body: string, heading: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex(
    (line) => line.startsWith("## ") && line.slice(3).trim() === heading,
  );
  if (start === -1) return "";
  const next = lines.findIndex(
    (line, i) => i > start && line.startsWith("## "),
  );
  return lines.slice(start + 1, next === -1 ? undefined : next).join("\n");
}

function decodeFabricText(text: string): locus.Fabric {
  const result = Effect.runSync(Effect.result(locus.decodeFabricJson(text)));
  if (result._tag === "Failure") {
    throw new Error(
      `decodeFabricJson failed: ${JSON.stringify(result.failure.issues)}`,
    );
  }
  return result.success;
}

function decodeFabricFailure(text: string): locus.DecodeError | undefined {
  const result = Effect.runSync(Effect.result(locus.decodeFabricJson(text)));
  return result._tag === "Failure" ? result.failure : undefined;
}

function decodeLocusText(text: string): locus.LocusDefinition {
  const result = Effect.runSync(
    Effect.result(locus.decodeLocus(JSON.parse(text))),
  );
  if (result._tag === "Failure") {
    throw new Error(
      `decodeLocus failed: ${JSON.stringify(result.failure.issues)}`,
    );
  }
  return result.success;
}

async function revisionOf(text: string): Promise<locus.Revision> {
  return Effect.runPromise(locus.createRevision(decodeLocusText(text)));
}

function earlierInSection(
  guide: Guide,
  fence: Fence,
  kind: string,
): Fence | undefined {
  return guide.fences
    .filter(
      (f) =>
        f.index < fence.index && f.section === fence.section && f.kind === kind,
    )
    .at(-1);
}

function laterInSection(guide: Guide, fence: Fence, kind: string): boolean {
  return guide.fences.some(
    (f) =>
      f.index > fence.index && f.section === fence.section && f.kind === kind,
  );
}

function withoutMessage(diagnostic: locus.Diagnostic): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(diagnostic).filter(([key]) => key !== "message"),
  );
}

// Names a history outcome with the guide's words: "a", "b", null, or the raw id when it is neither.
function nameOf(
  id: locus.RevisionId | null,
  a: locus.Revision,
  b: locus.Revision,
): string | null {
  if (id === null) return null;
  if (id === a.id) return "a";
  if (id === b.id) return "b";
  return id;
}

function idOfName(
  name: unknown,
  a: locus.Revision,
  b: locus.Revision,
): locus.RevisionId | null {
  if (name === null) return null;
  if (name === "a") return a.id;
  if (name === "b") return b.id;
  throw new Error(`expected "a", "b" or null, found ${JSON.stringify(name)}`);
}

interface Step {
  readonly append: unknown;
  readonly expectedHead: unknown;
  readonly result: unknown;
}

const PACKAGE_SCRIPTS = rootPackage.scripts as Record<string, string>;
const DOCS_SCRIPTS = docsPackage.scripts as Record<string, string>;

// START_CONTRACT: commandProblem
//   PURPOSE: Decide whether one line of an sh block is a command the guides may list.
//   INPUTS: { line: string - one non-empty line of an sh block }
//   OUTPUTS: { string | undefined - undefined for a known command, otherwise the reason }
//   SIDE_EFFECTS: runs "git status" and "git worktree list" at the repository root
//   LINKS: V-M-DOCS-GUIDES
// END_CONTRACT: commandProblem
function commandProblem(line: string): string | undefined {
  const docsPrefix = "bun run --cwd apps/docs ";
  if (line.startsWith(docsPrefix)) {
    const script = line.slice(docsPrefix.length);
    return Object.hasOwn(DOCS_SCRIPTS, script)
      ? undefined
      : `no script "${script}" in apps/docs/package.json`;
  }
  if (line.startsWith("bun run ")) {
    const script = line.slice("bun run ".length);
    return Object.hasOwn(PACKAGE_SCRIPTS, script)
      ? undefined
      : `no script "${script}" in package.json`;
  }
  if (line.startsWith("spec-kitty ") || line.startsWith("grace ")) {
    return AGENTS.includes(line) ? undefined : "not a line of AGENTS.md";
  }
  if (line === "git status" || line === "git worktree list") {
    const run = Bun.spawnSync({
      cmd: line.split(" "),
      cwd: REPO_ROOT,
      stdout: "ignore",
      stderr: "ignore",
    });
    return run.exitCode === 0 ? undefined : `exit code ${run.exitCode}`;
  }
  return "not a command this test knows";
}

// START_CONTRACT: checkFence
//   PURPOSE: Check one annotated block against the real package, its pairing rules and the repository.
//   INPUTS: { guide: Guide - the guide holding the block; fence: Fence - the block }
//   OUTPUTS: { Promise<void> - resolves when the claim holds; throws or fails an expectation otherwise }
//   SIDE_EFFECTS: none beyond the commands checkFence runs for sh blocks
//   LINKS: V-M-DOCS-GUIDES
// END_CONTRACT: checkFence
async function checkFence(guide: Guide, fence: Fence): Promise<void> {
  const next = guide.fences[fence.index + 1];
  const previous = guide.fences[fence.index - 1];
  switch (fence.kind) {
    case undefined:
      throw new Error(
        `unannotated or unknown code block "${fence.info}": use an annotation from the Block annotations table`,
      );

    case "fabric valid": {
      const report = locus.validateFabric(decodeFabricText(fence.text));
      expect(report).toEqual({ valid: true, diagnostics: [] });
      return;
    }

    case "fabric invalid": {
      const report = locus.validateFabric(decodeFabricText(fence.text));
      expect(report.valid).toBe(false);
      expect(next?.kind).toBe("diagnostics");
      return;
    }

    case "diagnostics": {
      if (previous?.kind !== "fabric invalid") {
        throw new Error(
          "a diagnostics block must follow a fabric invalid block",
        );
      }
      const report = locus.validateFabric(decodeFabricText(previous.text));
      expect(report.diagnostics.map(withoutMessage)).toEqual(
        JSON.parse(fence.text),
      );
      return;
    }

    case "fabric decode-error": {
      const failure = decodeFabricFailure(fence.text);
      expect(failure?._tag).toBe("DecodeError");
      expect(next?.kind).toBe("decode-issues");
      return;
    }

    case "decode-issues": {
      if (previous?.kind !== "fabric decode-error") {
        throw new Error(
          "a decode-issues block must follow a fabric decode-error block",
        );
      }
      expect(decodeFabricFailure(previous.text)?.issues).toEqual(
        JSON.parse(fence.text),
      );
      return;
    }

    case "locus a": {
      decodeLocusText(fence.text);
      expect(laterInSection(guide, fence, "locus b")).toBe(true);
      return;
    }

    case "locus b": {
      decodeLocusText(fence.text);
      expect(earlierInSection(guide, fence, "locus a") !== undefined).toBe(
        true,
      );
      return;
    }

    case "revisions": {
      const a = earlierInSection(guide, fence, "locus a");
      const b = earlierInSection(guide, fence, "locus b");
      if (a === undefined || b === undefined) {
        throw new Error(
          "a revisions block needs a locus a and a locus b earlier in its section",
        );
      }
      expect(JSON.parse(fence.text)).toEqual({
        a: (await revisionOf(a.text)).id,
        b: (await revisionOf(b.text)).id,
      });
      return;
    }

    case "changes": {
      const a = earlierInSection(guide, fence, "locus a");
      const b = earlierInSection(guide, fence, "locus b");
      if (a === undefined || b === undefined) {
        throw new Error(
          "a changes block needs a locus a and a locus b earlier in its section",
        );
      }
      const changeSet = await Effect.runPromise(
        locus.diffRevisions(await revisionOf(a.text), await revisionOf(b.text)),
      );
      expect(changeSet.changes).toEqual(JSON.parse(fence.text));
      return;
    }

    case "history-steps": {
      const a = earlierInSection(guide, fence, "locus a");
      const b = earlierInSection(guide, fence, "locus b");
      if (a === undefined || b === undefined) {
        throw new Error(
          "a history-steps block needs a locus a and a locus b earlier in its section",
        );
      }
      const revA = await revisionOf(a.text);
      const revB = await revisionOf(b.text);
      const steps = JSON.parse(fence.text) as ReadonlyArray<Step>;
      const observed: unknown[] = await Effect.runPromise(
        Effect.gen(function* () {
          const history = yield* locus.RevisionHistory;
          const outcomes: unknown[] = [];
          for (const step of steps) {
            const revision =
              idOfName(step.append, revA, revB) === revA.id ? revA : revB;
            const expected = idOfName(step.expectedHead, revA, revB);
            const attempt = yield* Effect.result(
              history.append(revision, expected),
            );
            outcomes.push(
              attempt._tag === "Success"
                ? {
                    appended: attempt.success.appended,
                    head: nameOf(attempt.success.head, revA, revB),
                  }
                : {
                    error: attempt.failure._tag,
                    actual: nameOf(attempt.failure.actual, revA, revB),
                  },
            );
          }
          return outcomes;
        }).pipe(Effect.provide(locus.RevisionHistoryInMemory)),
      );
      expect(observed).toEqual(steps.map((step) => step.result));
      return;
    }

    case "sh": {
      const problems = fence.text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .flatMap((line) => {
          const problem = commandProblem(line);
          return problem === undefined ? [] : [`${line}: ${problem}`];
        });
      expect(problems).toEqual([]);
      return;
    }

    case "text":
    case "mermaid":
      // A reader is not meant to paste these blocks, so they must not be JSON.
      expect(() => JSON.parse(fence.text)).toThrow();
      return;

    default:
      throw new Error(`no check for block kind "${fence.kind}"`);
  }
}

describe("guides: front matter and body", () => {
  for (const guide of GUIDES) {
    const { spec } = guide;

    test(`${spec.file}.md front matter: guide ${spec.file}, order ${spec.order}, section ${spec.section}`, () => {
      expect(guide.front).toMatchObject({
        id: spec.file,
        title: spec.title,
        kind: "guide",
        order: spec.order,
        section: spec.section,
        status: "provisional",
        maturity: spec.maturity,
      });
    });

    test(`${spec.file}.md body: one H1, the title, as its first line`, () => {
      const prose = guide.body.replace(FENCE, "");
      const lines = prose.split("\n");
      expect(lines.filter((line) => /^# /.test(line))).toHaveLength(1);
      expect(lines.find((line) => line.trim() !== "")).toBe(`# ${spec.title}`);
    });

    test(`${spec.file}.md body: no verification claim in prose`, () => {
      const prose = guide.body.replace(FENCE, "");
      expect(prose.match(/\b(verified|passing|all tests pass)\b/i)).toBeNull();
    });

    test(`${spec.file}.md body: no table has a Status or Maturity column`, () => {
      const lines = guide.body.replace(FENCE, "").split("\n");
      const headers = lines.filter(
        (line, i) =>
          line.startsWith("|") && /^\|[-| :]+\|$/.test(lines[i + 1] ?? ""),
      );
      const forbidden = headers.flatMap((row) =>
        row
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell === "Status" || cell === "Maturity"),
      );
      expect(forbidden).toEqual([]);
    });
  }
});

describe("guides: annotated blocks", () => {
  for (const guide of GUIDES) {
    for (const fence of guide.fences) {
      test(`${guide.spec.file}.md:${fence.line} ${fence.info}`, async () => {
        await checkFence(guide, fence);
      });
    }
  }
});

describe("guides: Agent Reference", () => {
  const agent = GUIDES.find((g) => g.spec.file === "agent-reference");
  const body = agent?.body ?? "";

  test("the public API table lists exactly the runtime exports of @telos/locus", () => {
    const rows = sectionOf(body, "Public API of `@telos/locus`")
      .split("\n")
      .filter((line) => line.startsWith("|"))
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      );
    expect(rows[0]).toEqual(["Export", "What it does"]);
    const names = rows
      .map((cells) => /^`([^`]+)`$/.exec(cells[0] ?? "")?.[1])
      .filter((name): name is string => name !== undefined);
    expect([...names].sort()).toEqual(Object.keys(locus).sort());
  });

  test("the diagnostic codes are exactly the thirteen codes of the contract", () => {
    const section = sectionOf(body, "Diagnostic codes");
    const listed = [...section.matchAll(/^- `([^`]+)`$/gm)].map(
      (m) => m[1] ?? "",
    );
    expect([...listed].sort()).toEqual([...DIAGNOSTIC_CODES].sort());
    expect(section).toContain(
      "(../../kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md)",
    );
  });
});

describe("guides: claims about behaviour", () => {
  for (const guide of GUIDES) {
    for (const fence of guide.fences) {
      if (fence.kind !== "fabric valid" && fence.kind !== "fabric invalid") {
        continue;
      }
      test(`${guide.spec.file}.md:${fence.line} the report does not depend on the order of the Loci`, () => {
        const fabric = decodeFabricText(fence.text);
        const reversed = locus.defineFabric({
          id: fabric.id,
          loci: [...fabric.loci].reverse(),
        });
        const report = JSON.stringify(locus.validateFabric(fabric));
        expect(JSON.stringify(locus.validateFabric(fabric))).toBe(report);
        expect(JSON.stringify(locus.validateFabric(reversed))).toBe(report);
      });
    }
  }

  test("a depends-on cycle is valid", () => {
    const loop = locus.defineFabric({
      id: "shop:system",
      loci: [
        locus.defineLocus({
          id: "shop:a",
          charter: { purpose: "A.", responsibilities: ["Do A"] },
          relations: [{ kind: "depends-on", target: "shop:b" }],
        }),
        locus.defineLocus({
          id: "shop:b",
          charter: { purpose: "B.", responsibilities: ["Do B"] },
          relations: [{ kind: "depends-on", target: "shop:a" }],
        }),
      ],
    });
    expect(locus.validateFabric(loop)).toEqual({
      valid: true,
      diagnostics: [],
    });
  });

  test("the four Relation kinds are depends-on, refines, satisfies and verifies, in that order", () => {
    expect([...locus.RELATION_KINDS]).toEqual([
      "depends-on",
      "refines",
      "satisfies",
      "verifies",
    ]);
  });

  test("shop:checkout is an identity; checkout and Shop:checkout are not", () => {
    expect(locus.isIdentity("shop:checkout")).toBe(true);
    expect(locus.isIdentity("checkout")).toBe(false);
    expect(locus.isIdentity("Shop:checkout")).toBe(false);
  });

  test("a malformed identity is a diagnostic, not a decode error", () => {
    const result = Effect.runSync(
      Effect.result(
        locus.decodeFabricJson(
          '{"id":"shop:system","loci":[{"id":"Shop:checkout","charter":{"purpose":"Turn a basket into an order.","responsibilities":["Collect payment details"]}}]}',
        ),
      ),
    );
    expect(result._tag).toBe("Success");
    if (result._tag !== "Success") return;
    expect(
      locus.validateFabric(result.success).diagnostics.map((d) => d.code),
    ).toEqual(["identity.malformed"]);
  });

  test("the first-locus Revision id is the SHA-256 of the canonical form of its Locus", async () => {
    const guide = GUIDES.find((g) => g.spec.file === "first-locus");
    const a = guide?.fences.find((f) => f.kind === "locus a");
    if (a === undefined) throw new Error("first-locus has no locus a block");
    const digest = new Bun.CryptoHasher("sha256")
      .update(locus.canonicalForm(decodeLocusText(a.text)))
      .digest("hex");
    expect((await revisionOf(a.text)).id).toBe(`sha256:${digest}`);
  });

  test("a Revision and its definition are frozen", async () => {
    const guide = GUIDES.find((g) => g.spec.file === "first-locus");
    const a = guide?.fences.find((f) => f.kind === "locus a");
    if (a === undefined) throw new Error("first-locus has no locus a block");
    const revision = await revisionOf(a.text);
    expect(Object.isFrozen(revision)).toBe(true);
    expect(Object.isFrozen(revision.definition)).toBe(true);
  });
});

describe("guides: content compile", () => {
  test("the content compiler accepts the docs tree and routes each guide", async () => {
    const result = await compileContent({
      root: REPO_ROOT,
      git: () => ({ commit: "guides-test", dirty: false }),
    });
    expect(result.ok ? [] : result.problems).toEqual([]);
    if (!result.ok) return;
    const routes = Object.fromEntries(
      result.output.content.documents
        .filter((d) => d.kind === "guide")
        .map((d) => [d.id, d.route]),
    );
    expect(routes).toEqual({
      introduction: "/",
      "first-locus": "/first-locus",
      examples: "/examples",
      "agent-reference": "/agent-reference",
    });
  });
});

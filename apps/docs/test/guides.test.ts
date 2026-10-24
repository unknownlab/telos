// START_MODULE_CONTRACT
//   PURPOSE: Prove that the four guides in docs/guides make only the claims the real @telos/kernel, the calculator, the repository and the content compiler support.
//   SCOPE: Front matter and body shape of each guide; the info string of every fenced block; every sh command line against package.json and AGENTS.md; every text block against the real calculator output; the Agent Reference API table, introspection tools and diagnostic codes; the content compile of the whole docs tree. Out: source= and playground= bodies (guide-examples.test.ts).
//   DEPENDS: M-DOCS-CONTENT, M-KERNEL-API, M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-CONTENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   GUIDES_DIR - the directory of the four guide sources
//   GUIDE_SPECS - file, title, order, section and maturity of each guide, in nav order
//   GuideSpec - one entry of GUIDE_SPECS
//   FRONT_MATTER - the front matter pattern the content compiler uses
//   FENCE - the fenced block pattern the guides are read with
//   kindOf - the kind of an info string, or undefined when it is not allowed
//   Fence - one fenced block with its line, info string, kind, text and section
//   Guide - one loaded guide with its front matter, body and fences
//   loadGuide - read one guide and collect its fences and their sections
//   GUIDES - the four loaded guides, in nav order
//   AGENTS - the text of AGENTS.md, the source of the spec-kitty and grace command lines
//   sectionOf - the text under one level-two heading of a body
//   PACKAGE_SCRIPTS - the scripts of the root package.json
//   DOCS_SCRIPTS - the scripts of apps/docs/package.json
//   commandProblem - why one sh line is not a known command, or undefined
//   CALCULATOR_PREFIX - the start of an sh line that runs the calculator command line
//   calculatorOutput - the trimmed stdout and stderr of one calculator command line
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
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
    maturity: "implemented",
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

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const FENCE = /^```([^\n]*)\n([\s\S]*?)^```$/gm;

// START_CONTRACT: kindOf
//   PURPOSE: Name the kind of a fenced block from its info string, so that a block with any other info string fails.
//   INPUTS: { info: string - the info string of a fenced block }
//   OUTPUTS: { string | undefined - sh, text, mermaid, source or playground; undefined when the info string is not allowed }
//   SIDE_EFFECTS: none
//   LINKS: V-M-DOCS-CONTENT
// END_CONTRACT: kindOf
function kindOf(info: string): string | undefined {
  if (info === "sh" || info === "text" || info === "mermaid") return info;
  if (/^ts source=\S+#[A-Z0-9_]+$/.test(info)) return "source";
  if (/^json playground=[a-z-]+$/.test(info)) return "playground";
  return undefined;
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
//   LINKS: V-M-DOCS-CONTENT
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

const PACKAGE_SCRIPTS = rootPackage.scripts as Record<string, string>;
const DOCS_SCRIPTS = docsPackage.scripts as Record<string, string>;

// START_CONTRACT: commandProblem
//   PURPOSE: Decide whether one line of an sh block is a command the guides may list.
//   INPUTS: { line: string - one non-empty line of an sh block }
//   OUTPUTS: { string | undefined - undefined for a known command, otherwise the reason }
//   SIDE_EFFECTS: runs "git status" and "git worktree list" at the repository root
//   LINKS: V-M-DOCS-CONTENT
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
    const script = line.slice("bun run ".length).split(" ")[0] ?? "";
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

const CALCULATOR_PREFIX = "bun run calculator ";

// START_CONTRACT: calculatorOutput
//   PURPOSE: Run one calculator command line of a guide and capture what a reader sees.
//   INPUTS: { line: string - an sh line that starts with "bun run calculator " }
//   OUTPUTS: { Promise<string> - the trimmed stdout followed by stderr of the command }
//   SIDE_EFFECTS: spawns bun run --silent calculator at the repository root
//   LINKS: V-M-DOCS-CONTENT
// END_CONTRACT: calculatorOutput
async function calculatorOutput(line: string): Promise<string> {
  const args = line.slice(CALCULATOR_PREFIX.length).split(" ");
  const proc = Bun.spawn(
    [process.execPath, "run", "--silent", "calculator", ...args],
    { cwd: REPO_ROOT, stdout: "pipe", stderr: "pipe" },
  );
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  return (stdout + stderr).trim();
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
      const prose = guide.body.replace(FENCE, "").replace(/`[^`]*`/g, "");
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

describe("guides: fenced blocks", () => {
  test("every fenced block has an allowed info string", () => {
    const unknown = GUIDES.flatMap((guide) =>
      guide.fences
        .filter((fence) => fence.kind === undefined)
        .map((fence) => `${guide.spec.file}.md:${fence.line} ${fence.info}`),
    );
    expect(unknown).toEqual([]);
  });

  test("every sh line is a known command", () => {
    const problems = GUIDES.flatMap((guide) =>
      guide.fences
        .filter((fence) => fence.kind === "sh")
        .flatMap((fence) =>
          fence.text
            .split("\n")
            .filter((line) => line.trim() !== "")
            .flatMap((line) => {
              const problem = commandProblem(line);
              return problem === undefined
                ? []
                : [`${guide.spec.file}.md:${fence.line} ${line}: ${problem}`];
            }),
        ),
    );
    expect(problems).toEqual([]);
  });

  test("text blocks show the real output of the calculator command before them", async () => {
    const texts = GUIDES.flatMap((guide) =>
      guide.fences
        .filter((fence) => fence.kind === "text")
        .map((fence) => ({ guide, fence })),
    );
    expect(texts.length).toBeGreaterThan(0);
    for (const { guide, fence } of texts) {
      const previous = guide.fences[fence.index - 1];
      expect(previous?.kind).toBe("sh");
      const lines = (previous?.text ?? "")
        .split("\n")
        .filter((line) => line.startsWith(CALCULATOR_PREFIX));
      expect(lines).toHaveLength(1);
      expect(await calculatorOutput(lines[0] ?? "")).toBe(fence.text.trim());
    }
  }, 20_000);
});

describe("guides: Agent Reference", () => {
  const agent = GUIDES.find((g) => g.spec.file === "agent-reference");
  const body = agent?.body ?? "";

  test("the public API table lists exactly the runtime exports of @telos/kernel", async () => {
    const rows = sectionOf(body, "Public API of `@telos/kernel`")
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
    const kernel = await import("@telos/kernel");
    expect([...names].sort()).toEqual(Object.keys(kernel).sort());
  });

  test("the introspection tools are the six names of INTROSPECTION_TOOL_NAMES", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/agent/src/introspection-tools.ts"),
      "utf8",
    );
    const expected = [
      ...new Set(
        [...source.matchAll(/"(telos_[a-z_]+)"/g)].map((m) => m[1] ?? ""),
      ),
    ].sort();
    const listed = [
      ...sectionOf(body, "Introspection tools").matchAll(
        /^- `(telos_[a-z_]+)`:/gm,
      ),
    ]
      .map((m) => m[1] ?? "")
      .sort();
    expect(expected).toHaveLength(6);
    expect(listed).toEqual(expected);
  });

  test("the diagnostic codes are the DiagnosticCode values of the kernel", () => {
    const source = readFileSync(
      join(REPO_ROOT, "packages/kernel/src/diagnostic.ts"),
      "utf8",
    );
    const start = source.indexOf("export type DiagnosticCode =");
    const declaration = source.slice(start, source.indexOf(";", start));
    const expected = [...declaration.matchAll(/"([a-z]+\.[a-z-]+)"/g)]
      .map((m) => m[1] ?? "")
      .sort();
    const section = sectionOf(body, "Diagnostic codes");
    const listed = [...section.matchAll(/^- `([^`]+)`$/gm)]
      .map((m) => m[1] ?? "")
      .sort();
    expect(start).toBeGreaterThan(-1);
    expect(expected).toHaveLength(18);
    expect(listed).toEqual(expected);
    expect(section).toContain(
      "(../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md)",
    );
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

---
work_package_id: WP20
title: Calculator page, guides and removal of @telos/locus
dependencies:
- WP19
requirement_refs:
- FR-026
- FR-029
- FR-031
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: e8ba623fa308599d42995c2bbe593ec374b5b0c2
created_at: '2026-10-24T20:19:17.855560+00:00'
subtasks:
- T120
- T121
- T122
- T123
- T124
- T125
phase: Phase 7 – Documentation site
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/
create_intent:
- apps/docs/src/routes/calculator.tsx
- apps/docs/e2e/calculator.e2e.ts
- apps/docs/test/calculator.test.tsx
- apps/docs/src/components/calculator-view.tsx
- apps/docs/test/guide-snippets.ts
- apps/docs/test/guide-snippets.test.ts
- .grace/graph/legacy.xml
- .grace/verification/legacy.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/routes/calculator.tsx
- apps/docs/e2e/calculator.e2e.ts
- apps/docs/test/calculator.test.tsx
- docs/guides/**
- apps/docs/test/guide-examples.test.ts
- apps/docs/test/guides.test.ts
- packages/locus/**
- apps/docs/src/components/calculator-view.tsx
- apps/docs/test/guide-snippets.ts
- apps/docs/test/guide-snippets.test.ts
- .grace/graph/legacy.xml
- .grace/verification/legacy.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP20 – Calculator page, guides and removal of @telos/locus

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Resume: the remaining work (added 2026-10-24)

WP20 is `in_progress`. Its worktree is `/Users/unknownhero/projects/unknownlab/telos/.worktrees/semantic-foundation-rebuild-01M5JFR0-lane-t` (branch `kitty/mission-semantic-foundation-rebuild-01M5JFR0-lane-t`). The first run stopped because `Effect.runSync(formModel(...))` threw `AsyncFiberError`. The planner chose the fix: top-level `await Effect.runPromise(...)` at module scope (see the quoted calculator page contract). It was proven on a scratch copy of this worktree. `docs:build` passed, the browser bundle pulled in no Bun-only module, and the prerendered `/calculator` HTML held the four forms. The full `bun run verify` passed with every step below applied.

**Already done in the worktree, and not committed yet. Keep this work.** Do not delete, rewrite, stash, `git checkout` or `git restore` these files. Change them only where a step below says so.

- T123 is done except its grep: `packages/locus` is removed with `git rm` (51 staged deletions); `tsconfig.json`, `apps/docs/package.json`, `apps/docs/test/manifest.test.ts`, `telos.ts` and `bun.lock` are edited. Do not run `bun install` again.
- T120 is partly written (untracked): `apps/docs/src/components/calculator-view.tsx` (complete; keep it), `apps/docs/src/routes/calculator.tsx` and `apps/docs/test/calculator.test.tsx` (each needs the R1 fix).

Work only in that worktree. Run `git status --short` first: it must show the five modified files, the three untracked files and the staged `packages/locus` deletions, and nothing else. Do not run `spec-kitty agent action implement` again: the WP is already claimed. The first run already took the baseline (commit `4d1407b`), so skip rule 1 "Baseline first". Where this Resume and the sections below differ, the Resume wins. Then do R1 to R13 in order.

### R1 – Fix the form model in the route and its test (T120)

1. `apps/docs/src/routes/calculator.tsx`: replace these four lines

   ```ts
   // The form model is built here, not in a loader: loader data is serialized and the submit functions are not.
   const CALCULATOR_FORMS = Effect.runSync(
     formModel(calculatorModel, "calculator:web"),
   );
   ```

   with

   ```ts
   // Built once at module load with top-level await: formModel hashes contracts with Web Crypto, which is
   // asynchronous, so runSync cannot be used. Not a loader: loader data is serialized and submit is a function.
   const CALCULATOR_FORMS = await Effect.runPromise(
     formModel(calculatorModel, "calculator:web"),
   );
   ```

2. `apps/docs/test/calculator.test.tsx`:
   - Replace `const FORMS = Effect.runSync(formModel(calculatorModel, "calculator:web"));` with

     ```ts
     const FORMS = await Effect.runPromise(
       formModel(calculatorModel, "calculator:web"),
     );
     ```

   - In the module map, add the line `//   FORMS - the form model of calculator:web, built once with the real kernel` directly above the `formOf` line. `grace lint` reads every top-level local of a LOCALS test file. Without this line it fails with `markup.module-map-mismatch ... Missing: FORMS`.
3. Run `bun test apps/docs/test/calculator.test.tsx`. Expected: 9 pass, 0 fail.

### R2 – Navigation edits (T120, sanctioned)

Make exactly these edits. Each insertion point is given by the line before it.

- `apps/docs/src/lib/content-types.ts`:
  - In `NavSectionId`, after `  | "playground"`, add `  | "calculator"`.
  - In `NAV_SECTIONS`, after `{ id: "playground", title: "Playground", route: "/playground" },`, add `{ id: "calculator", title: "Calculator", route: "/calculator" },`.
  - In `APP_ROUTES`, after `"/architecture",`, add `"/calculator",`. The list stays sorted.
- `apps/docs/src/lib/prerender.ts`: in `APP_PAGES`, after `"/playground",`, add `"/calculator",`.
- `apps/docs/scripts/content.ts`, function `llmsText`: directly before `    if (section.id === "inspector") {`, add

  ```ts
      if (section.id === "calculator") {
        blocks.push(
          `## ${section.title}\n\n- [${section.title}](${section.route}): The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.`,
        );
        continue;
      }
  ```

- `apps/docs/test/content.test.ts`, in `EXPECTED_LLMS`: after the Playground bullet line and its blank line, add these lines, followed by one blank line:

  ```text
  ## Calculator

  - [Calculator](/calculator): The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.
  ```

- `apps/docs/test/site.test.ts`: in `SECTION_CASES`, after `["/playground", "playground"],`, add `["/calculator", "calculator"],`.
- `apps/docs/e2e/machine-files.e2e.ts`:
  - In `APP_PAGE_LINES`, after the Playground line, add `"- [Calculator](/calculator): The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.",`.
  - In the module map, change "the three llms.txt bullets" to "the four llms.txt bullets".
  - In the comment above `APP_PAGE_LINES`, change "The two llms.txt bullets" to "The four llms.txt bullets".
  - Leave the Playground line's `/kernel` wording alone. WP21 fixes it in all three files.
- `apps/docs/e2e/a11y.e2e.ts`: in `PAGES`, after `{ name: "inspector Locus page", path: "/inspector/calculator--arithmetic" },`, add `{ name: "calculator", path: "/calculator" },`.
- `apps/docs/e2e/navigation.e2e.ts` needs no edit.

### R3 – The calculator browser test (T120)

Create `apps/docs/e2e/calculator.e2e.ts` with exactly this content:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove in Chromium that the calculator page submits each derived form through the real calculator and shows the same outcomes as the command line and the agent tools (FR-026).
//   SCOPE: The /calculator page of the static build: a valid add, a division by zero and a non-numeric operand. Out: the static markup (calculator.test.tsx) and the accessibility scan (a11y.e2e.ts).
//   DEPENDS: M-DOCS-CALCULATOR
//   LINKS: V-M-DOCS-CALCULATOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   openCalculator - opens the calculator page and waits until it is hydrated
//   submitForm - fills the fields of one form, submits it and returns its outcome locator
// END_MODULE_MAP

import { expect, type Locator, type Page, test } from "@playwright/test";
import { trackPageErrors } from "./helpers";

// START_CONTRACT: openCalculator
//   PURPOSE: Open the calculator page and wait for it to hydrate, so that no submit runs before React handles it.
//   INPUTS: { page: Page - the page to use }
//   OUTPUTS: { Promise<void> - resolves when data-ready is true on the calculator }
//   SIDE_EFFECTS: navigates the page
//   LINKS: V-M-DOCS-CALCULATOR
// END_CONTRACT: openCalculator
async function openCalculator(page: Page): Promise<void> {
  await page.goto("/calculator");
  await expect(page.locator('[data-slot="calculator"]')).toHaveAttribute(
    "data-ready",
    "true",
  );
}

// START_CONTRACT: submitForm
//   PURPOSE: Fill the operands of one capability form and submit it, so that its outcome panel appears.
//   INPUTS: { page: Page - the calculator page, form: string - the capability name, a: string - the first operand, b: string - the second operand }
//   OUTPUTS: { Promise<Locator> - the outcome text of that form }
//   SIDE_EFFECTS: types into the form and clicks its Submit button
//   LINKS: V-M-DOCS-CALCULATOR
// END_CONTRACT: submitForm
async function submitForm(
  page: Page,
  form: string,
  a: string,
  b: string,
): Promise<Locator> {
  await page.fill(`#${form}-a`, a);
  await page.fill(`#${form}-b`, b);
  await page.locator(`[data-form="${form}"] [data-action="submit"]`).click();
  return page.locator(
    `[data-result="calculator"][data-form="${form}"] [data-slot="outcome"]`,
  );
}

test.describe("the calculator page invokes the real calculator in the browser", () => {
  test("add of 2 and 3 shows result 5", async ({ page }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "add", "2", "3");
    await expect(outcome).toContainText('"result":5');
    check();
  });

  test("divide of 1 by 0 shows DivisionByZero", async ({ page }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "divide", "1", "0");
    await expect(outcome).toContainText("DivisionByZero");
    check();
  });

  test("add with a non-numeric operand shows InvalidInput", async ({
    page,
  }) => {
    const check = trackPageErrors(page);
    await openCalculator(page);
    const outcome = await submitForm(page, "add", "x", "1");
    await expect(outcome).toContainText("InvalidInput");
    check();
  });
});
```

### R4 – The guide tests, first (T122)

Write these three files before the guides. Then run `bun test apps/docs/test/guide-snippets.test.ts apps/docs/test/guide-examples.test.ts apps/docs/test/guides.test.ts` and note the failures. They fail because `guide-snippets.ts` and the new guides do not exist yet.

`apps/docs/test/guide-snippets.test.ts` (new):

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that the code the first-locus guide quotes runs: the demo model has no diagnostics, the composition has no conflict, inspect describes demo:greeter and the greet capability answers through the kernel.
//   SCOPE: The exports of guide-snippets.ts, run with the real @telos/kernel. No file access.
//   DEPENDS: M-KERNEL-API, M-DOCS-CONTENT
//   LINKS: V-M-DOCS-CONTENT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { invoke } from "@telos/kernel";
import { Greeter, demoModel, greeter, inspectGreeter } from "./guide-snippets";

describe("guide snippets: the first-locus code runs", () => {
  test("the demo model has no diagnostics", () => {
    expect(demoModel.diagnostics).toEqual([]);
  });

  test("composing Purpose and Greeting has no conflict", () => {
    expect(Greeter.conflicts).toEqual([]);
  });

  test("inspect describes demo:greeter with its extensions and capability", async () => {
    const description = await Effect.runPromise(inspectGreeter);
    expect(description.id).toBe("demo:greeter");
    expect(description.extensions.map((extension) => extension.id)).toEqual([
      "telos.purpose",
      "demo.greeting",
    ]);
    expect(
      description.capabilities.map((capability) => capability.name),
    ).toEqual(["greet"]);
  });

  test("greet invoked by demo:greeter answers with the greeting", async () => {
    const outcome = await Effect.runPromise(
      invoke(
        demoModel,
        greeter.capability("greet"),
        { name: "Ada" },
        {
          via: "demo:greeter",
        },
      ),
    );
    expect(outcome).toEqual({ ok: true, output: { text: "Hello, Ada." } });
  });
});
```

`apps/docs/test/guide-examples.test.ts` (replace the whole file):

```ts
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
```

`apps/docs/test/guides.test.ts` (replace the whole file). The parts that T122 says to keep are already in it unchanged. The old rule "text and mermaid blocks must not be JSON" is gone, because the calculator prints JSON:

```ts
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
```

### R5 – The guide snippets file (T121)

Create `apps/docs/test/guide-snippets.ts` with exactly this content. It is the code from "Guide snippets file" above, plus the GRACE header. It has no `START_CONTRACT` blocks, so the quoted regions stay clean. `grace lint` accepts this.

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Hold the real, compiled code that the first-locus guide quotes, so that every TypeScript block of that guide is code the typecheck and a test run.
//   SCOPE: The demo Loci, extension, composed kind, capability, model and inspect program of the first-locus guide, each inside a named region. It never reads files and never runs at import beyond building the frozen definitions and the model.
//   DEPENDS: M-KERNEL-API
//   LINKS: M-DOCS-CONTENT, V-M-DOCS-CONTENT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   hello - the smallest complete Locus, demo:hello
//   Greeting - the demo.greeting extension with a greeting property
//   Greeter - the Locus kind composed from Purpose and Greeting
//   greet - the greet capability of demo:greeter
//   greeter - the demo:greeter Locus of kind Greeter with the greet capability
//   demo - the demo:app root Locus that contains hello and greeter
//   demoModel - the semantic model built from demo
//   inspectGreeter - the program that resolves demo:greeter and inspects it
// END_MODULE_MAP

import { Effect, Schema } from "effect";
import {
  Capability,
  Extension,
  Locus,
  Purpose,
  Telos,
  buildModel,
} from "@telos/kernel";

// START_BLOCK_GUIDE_FIRST_LOCUS
export const hello = Locus.make({
  id: "demo:hello",
  description: "The smallest complete Locus: an identity and a description.",
});
// END_BLOCK_GUIDE_FIRST_LOCUS

// START_BLOCK_GUIDE_EXTENSION
export const Greeting = Extension.make("demo.greeting", {
  description: "Gives a Locus the greeting it answers with.",
  properties: { greeting: Schema.String },
});
// END_BLOCK_GUIDE_EXTENSION

// START_BLOCK_GUIDE_COMPOSITION
export const Greeter = Locus.extend(Purpose, Greeting);
// END_BLOCK_GUIDE_COMPOSITION

// START_BLOCK_GUIDE_CAPABILITY
export const greet = Capability.make({
  description: "Greets a person by name.",
  input: Schema.Struct({ name: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
  effect: "pure",
  handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}.` }),
});

export const greeter = Greeter.make({
  id: "demo:greeter",
  description: "Answers with a greeting.",
  properties: { purpose: "Greet people by name.", greeting: "Hello" },
  capabilities: { greet },
});
// END_BLOCK_GUIDE_CAPABILITY

// START_BLOCK_GUIDE_MODEL
export const demo = Locus.make({ id: "demo:app", contains: [hello, greeter] });
export const demoModel = buildModel(demo);
// END_BLOCK_GUIDE_MODEL

// START_BLOCK_GUIDE_INSPECT
export const inspectGreeter = Effect.gen(function* () {
  const telos = yield* Telos;
  const view = yield* telos.resolve("demo:greeter");
  return yield* view.inspect();
}).pipe(Effect.provide(Telos.layer(demo)));
// END_BLOCK_GUIDE_INSPECT
```

### R6 – Rewrite the four guides (T121)

Follow "Content of each guide" above. Never type a `source=` or `playground=` block by hand. Print it with this helper and paste the output.

Save the helper in your own scratchpad or temp directory, never in the repository, for example as `<tmp>/wp20-fence.ts`:

```ts
// Prints a guide fence. Usage (run in apps/docs):
//   bun <this file> source <repo path> <REGION>
//   bun <this file> playground <name>
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const [kind, a = "", b = ""] = process.argv.slice(2);
const root = resolve(process.cwd(), "../..");
if (kind === "source") {
  const lines = readFileSync(resolve(root, a), "utf8").split("\n");
  const s = lines.findIndex((l) => l.trim() === `// START_BLOCK_${b}`);
  const e = lines.findIndex((l) => l.trim() === `// END_BLOCK_${b}`);
  if (s === -1 || e === -1) throw new Error(`no region ${b} in ${a}`);
  const inner = lines.slice(s + 1, e);
  const ind = Math.min(...inner.filter((l) => l.trim() !== "").map((l) => l.length - l.trimStart().length));
  const d = inner.map((l) => l.slice(ind));
  while (d.length && d[0]!.trim() === "") d.shift();
  while (d.length && d.at(-1)!.trim() === "") d.pop();
  console.log("```ts source=" + a + "#" + b + "\n" + d.join("\n") + "\n```");
} else if (kind === "playground") {
  const { PLAYGROUND_EXAMPLES } = await import(resolve(process.cwd(), "src/playground/examples.ts"));
  const ex = PLAYGROUND_EXAMPLES.find((x: { name: string }) => x.name === a);
  if (!ex) throw new Error(`no example ${a}`);
  console.log("```json playground=" + a + "\n" + ex.json + "\n```");
} else throw new Error("usage: source <path> <REGION> | playground <name>");
```

Run it from `apps/docs` (one fence per call):

- `bun <tmp>/wp20-fence.ts source apps/calculator/src/arithmetic.ts ARITHMETIC_LOCUS`
- `bun <tmp>/wp20-fence.ts source apps/calculator/src/app.ts CALCULATOR_APP`
- `bun <tmp>/wp20-fence.ts source apps/docs/test/guide-snippets.ts GUIDE_FIRST_LOCUS`. Do the same for `GUIDE_EXTENSION`, `GUIDE_COMPOSITION`, `GUIDE_CAPABILITY`, `GUIDE_MODEL` and `GUIDE_INSPECT`.
- `bun <tmp>/wp20-fence.ts playground minimal`. Do the same for `property-conflict`, `composed`, `missing-target` and `cycle`.

Facts measured at planning time, for your prose. Rerun each command yourself and use what it prints:

- `bun run --silent calculator add --a 2 --b 3` prints `{"result":5}` and exits 0.
- `bun run --silent calculator divide --a 1 --b 0` prints `{"tag":"DivisionByZero","message":"Division by zero is not defined.","issues":[]}` and exits 1.
- The `text` block after each of these two `sh` blocks is exactly that output. Its `sh` block holds the command without `--silent`, for example `bun run calculator add --a 2 --b 3`.
- `bun run calculator:agent-demo` starts the MCP server, lists its tools, reads the capabilities through `telos_capabilities`, calls `add`, calls `divide` by zero, sends an invalid input (`InvalidInput`), asks for the impact of `calculator:arithmetic#add`, and ends with `{"ok":true}`. It needs no network and no credentials.
- `bun run telos impact calculator:arithmetic#add` lists `calculator:cli` (`cli.command`), `calculator:web` (`web.form`) and `calculator:agent` (`agent.tool`) at distance 1, with the Archetype checks that apply. Its knowledge status is `derived`.
- The calculator Archetypes are `calculator.arithmetic-behavior` (rules `arithmetic.*`) and `calculator.interfaces` (rules `interfaces.*`); read `apps/calculator/src/archetypes.ts` for each rule's meaning. The Packs check their own interfaces with `telos.cli.interface`, `telos.web.interface` and `telos.agent.interface` (rules `cli.*`, `web.*` and `agent.*`).
- The kernel's runtime exports (51 at planning time) come from `bun -e 'console.log(Object.keys(await import("@telos/kernel")).sort().join("\n"))'`, run in `apps/docs`. Describe each export in one sentence, taken from its `START_CONTRACT` PURPOSE in `packages/kernel/src/`.
- `Knowledge` (in `packages/kernel/src/describe.ts`) has the values `declared`, `derived`, `verified`, `failed`, `not-run`, `observed`, `invalidated` and `unknown`. The closure check produces `unknown` for a file it cannot parse. `observed` and `invalidated` are produced by no function yet.
- `introduction.md`: the `## Maturity and evidence` text follows the corrected bullet in "Content of each guide". The calculator page shows invocation outcomes, not check results.
- The Agent Reference "Start here" and "State queries" sections stay as they are today. Copy them from the current file before you rewrite it.

Then run `bun run --cwd apps/docs content`. It must print no problem: the old guides link to `packages/locus`, and the build fails until all four are rewritten. Then run `bun run format`. **The formatter reflows JSON fences in Markdown**: it puts short arrays on one line. That is why the playground test compares parsed JSON. Never fight the formatter.

### R7 – Unit tests and the removal grep (T122, T123)

1. `bun test apps/docs/test`. Expected: 0 fail. At planning time it was 318 pass, before your guides' prose differed.
2. The T123 grep must print nothing:
   `git grep -n "@telos/locus\|packages/locus" -- . ':!kitty-specs' ':!docs/research' ':!docs/decisions' ':!docs/tooling.md' ':!README.md'`
3. `bun run telos check` exits 0 with `"ok":true` and closure `"errors":0`. Before your rewrite, the two old guide tests caused two `closure.unknown-external @telos/locus` errors. They are gone now.

### R8 – Build and browser tests, through the lock wrapper (T120)

Other agents may run browser tests on the same fixed port, so run these through the lock wrapper:

1. `bash /private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/48f2abba-47cc-4641-91d5-0369d350dc60/scratchpad/withlock.sh bun run docs:build`. It must exit 0. It regenerates `apps/docs/src/routeTree.gen.ts`, which gains the `/calculator` route. That file is yours to commit.
   - If the client bundle fails because a Bun-only module is pulled in (`bun:*`, `node:child_process`, `@telos/agent/mcp`), stop and report the exact error.
2. Check the prerendered page: `grep -c 'data-form=' apps/docs/dist/client/calculator/index.html` prints a number greater than 0. The file also contains `inputMode="decimal"` and `data-ready="false"`.
3. `bash /private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/48f2abba-47cc-4641-91d5-0369d350dc60/scratchpad/withlock.sh bun run test:e2e`. Expected: 0 failed. The three calculator tests pass, and a11y, machine-files and navigation pass with the calculator page.

### R9 – GRACE (T124)

1. `git rm .grace/graph/legacy.xml .grace/verification/legacy.xml`.
2. In `.grace/graph/index.xml`, delete the whole `<GD-LEGACY>` … `</GD-LEGACY>` block. In `<GD-DOCS>`'s `<Owns>`, add `<M-DOCS-CALCULATOR />` after `<M-DOCS-INSPECTOR />`.
3. In `.grace/verification/index.xml`, delete the whole `<VD-LEGACY>` … `</VD-LEGACY>` block. In `<VD-DOCS>`'s `<Owns>`, add `<V-M-DOCS-CALCULATOR />` after `<V-M-DOCS-INSPECTOR />`.
4. `.grace/graph/tooling.xml` has no `M-LOCUS-` child. Leave it unchanged.
5. In `.grace/graph/docs.xml`, insert directly before `    <M-DOCS-SITE>`:

   ```xml
       <M-DOCS-CALCULATOR>
         <Summary>The calculator page: web forms derived from the capability contracts of calculator:arithmetic, invoked in the browser.</Summary>
         <Path>apps/docs/src/routes/calculator.tsx</Path>
         <Path>apps/docs/src/components/calculator-view.tsx</Path>
         <M-PACK-WEB />
         <M-CALC-INTERFACES />
         <M-DOCS-SITE />
       </M-DOCS-CALCULATOR>
   ```

6. In `.grace/verification/docs.xml`:
   - In `<V-M-DOCS-CONTENT>`, add `        <File>apps/docs/test/guide-snippets.test.ts</File>` after the `guides.test.ts` `<File>`.
   - Change its first `<Command>` to `<Command>bun test apps/docs/test/content.test.ts apps/docs/test/guides.test.ts apps/docs/test/guide-snippets.test.ts</Command>`.
   - Replace the Scenario that begins "The public API table in the Agent Reference lists exactly the runtime exports of @telos/locus" with these three Scenarios:

     ```xml
           <Scenario>The public API table in the Agent Reference lists exactly the runtime exports of @telos/kernel, the introspection tools are the six tool names of the agent Pack, and the diagnostic codes are exactly the DiagnosticCode values of the kernel.</Scenario>
           <Scenario>Every sh line of a guide is a known command, and every text block is the real output of the calculator command before it.</Scenario>
           <Scenario>The code the first-locus guide quotes builds a model with no diagnostics, inspects demo:greeter and invokes greet through the kernel.</Scenario>
     ```

   - Replace its `<TraceAssertion>` with:

     ```xml
           <TraceAssertion>The "valid fixture output" tests in content.test.ts, the "NS-020 failure cases" tests, the "guides: front matter and body" tests, the "every sh line is a known command", "text blocks show the real output of the calculator command before them", "the public API table lists exactly the runtime exports of @telos/kernel", "the introspection tools are the six names of INTROSPECTION_TOOL_NAMES" and "the diagnostic codes are the DiagnosticCode values of the kernel" tests, and the four tests of guide-snippets.test.ts pass. The content command writes the content files without error.</TraceAssertion>
     ```

   - Insert directly before `    <V-M-DOCS-SITE>`:

     ```xml
         <V-M-DOCS-CALCULATOR>
           <TestFiles>
             <File>apps/docs/test/calculator.test.tsx</File>
             <File>apps/docs/e2e/calculator.e2e.ts</File>
           </TestFiles>
           <Command>bun test apps/docs/test/calculator.test.tsx</Command>
           <Command>bun run test:e2e apps/docs/e2e/calculator.e2e.ts</Command>
           <Scenario>The calculator page renders one form per capability of calculator:arithmetic, derived by the web Pack, with labelled decimal inputs.</Scenario>
           <Scenario>Submitting a form in Chromium shows the same outcome as the command line: a result, DivisionByZero or InvalidInput.</Scenario>
           <TraceAssertion>The calculator.test.tsx tests and the three tests of calculator.e2e.ts pass.</TraceAssertion>
         </V-M-DOCS-CALCULATOR>
     ```

7. `git grep -n "M-LOCUS-\|telos/locus\|fourteen" -- .grace apps packages scripts telos.ts` must print nothing.
8. `bun run grace:lint`: `Errors: 0`.

### R10 – Format and the fast checks (T125)

`bun run format` (it writes; at planning time `calculator-view.tsx`, `calculator.test.tsx`, the new tests and the guides needed it), then `bun run format:check`, `bun run lint` (exit 0; the existing warnings are warnings), `bun run typecheck`, `bun test apps/docs/test`, `bun run grace:lint`. If `format` changed a guide, rerun `bun test apps/docs/test`.

### R11 – The full gate, through the lock wrapper (T125)

`bash /private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/48f2abba-47cc-4641-91d5-0369d350dc60/scratchpad/withlock.sh bun run verify`

Report each step exactly: `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `docs:build`, `test:e2e`, `grace:lint`, `telos:check`. On the scratch copy it passed with 844 unit tests, 102 browser tests, `grace lint` with 0 errors and `telos check` with `"ok":true`. Then run `bun run telos check` once more on its own: exit 0. If a step fails and the fix is outside your files and the sanctioned edits, stop and report it.

### R12 – Commit in the lane worktree

Commit only after R11 is green. The pre-commit hook runs `bun test` and `grace lint` on the whole working tree. Stage paths explicitly. Never use `git add -A` or `git add .`, and never `--no-verify`. Add no AI names, and no author, co-author or session lines. The shell is fish: pass the body with a second `-m`.

1. `git add apps/docs/src/components/calculator-view.tsx apps/docs/src/routes/calculator.tsx apps/docs/src/routeTree.gen.ts apps/docs/test/calculator.test.tsx apps/docs/e2e/calculator.e2e.ts apps/docs/src/lib/content-types.ts apps/docs/src/lib/prerender.ts apps/docs/scripts/content.ts apps/docs/test/content.test.ts apps/docs/test/site.test.ts apps/docs/e2e/machine-files.e2e.ts apps/docs/e2e/a11y.e2e.ts`
   `git commit -m "feat(docs): add the calculator page with forms derived from calculator:web" -m "Sanctioned edits: content-types.ts, prerender.ts, scripts/content.ts, machine-files.e2e.ts, a11y.e2e.ts (WP19); content.test.ts, site.test.ts (WP16); routeTree.gen.ts regenerated (WP18)."`
2. `git add docs/guides apps/docs/test/guide-snippets.ts apps/docs/test/guide-snippets.test.ts apps/docs/test/guide-examples.test.ts apps/docs/test/guides.test.ts`
   `git commit -m "docs(guides): rewrite the guides on the kernel and the calculator" -m "Every ts block quotes a compiled region, every json block is a playground example, and every text block is real calculator output."`
3. `git add tsconfig.json bun.lock apps/docs/package.json apps/docs/test/manifest.test.ts telos.ts` (the `packages/locus` deletions are already staged)
   `git commit -m "refactor(workspace)!: remove the @telos/locus package" -m "Sanctioned edits: tsconfig.json, bun.lock, apps/docs/package.json, apps/docs/test/manifest.test.ts (WP01); telos.ts (WP15)." -m "BREAKING CHANGE: @telos/locus and packages/locus are removed with no compatibility alias; use @telos/kernel."`
4. `git add .grace/graph/index.xml .grace/verification/index.xml .grace/graph/docs.xml .grace/verification/docs.xml` (the two `legacy.xml` deletions are already staged by `git rm`)
   `git commit -m "chore(grace): register the calculator page and drop the legacy area" -m "Sanctioned edits: graph/docs.xml, verification/docs.xml (WP18); the GD-LEGACY and VD-LEGACY blocks of the index files (WP01)."`
5. `git status --short` must now show nothing outside `kitty-specs/`. `git diff --stat HEAD~4 HEAD` must list only your owned files and the sanctioned edits.

If the hook fails, fix the cause and commit again. Never bypass it.

### R13 – Clean the lane's planning files, then hand over to review

1. In the lane worktree, run `git restore --source feat/semantic-foundation-rebuild --staged --worktree -- kitty-specs/`. If `git status --short -- kitty-specs/` then shows changes, commit them with `git commit -m "chore(workspace): remove planning artifacts from lane branch"`. Then `git diff --stat feat/semantic-foundation-rebuild -- kitty-specs/` must print nothing.
2. Mark T120 to T125 done: run `spec-kitty agent tasks mark-status T120 --status done --mission semantic-foundation-rebuild-01M5JFR0`, then the same for T121, T122, T123, T124 and T125.
3. `spec-kitty agent tasks move-task WP20 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "Calculator page, kernel guides with checked examples, packages/locus and the legacy GRACE area removed"`.
4. If `mark-status` or `move-task` refuses, stop and report the exact message. Do not use `--force` or any skip flag.

Your final message is the reviewer's evidence. Report:

- the R1 test result
- the R4 failures before the guides existed
- the R7 grep output and the `telos check` result
- the R8 build and browser results
- each `verify` step from R11, and `grace lint`
- the commit hashes
- the move-task result

---

## Objective

Finish the documentation site and remove the old model:

1. Add the `/calculator` page. Its forms are derived from the capability contracts of `calculator:arithmetic` through `@telos/web`, and they invoke the real calculator in the browser (FR-026).
2. Rewrite the four guides in `docs/guides/`. Every code example in them is checked against the real code (FR-031).
3. Delete `packages/locus` and every reference to it, with no compatibility alias (FR-029).
4. Remove the legacy GRACE area, and register the calculator page in GRACE.

State when you start:

- WP19 is merged. The site has `/inspector`, `/inspector/<slug>`, `/verification` (semantic report) and `/playground` (WP18).
- Only `apps/docs/test/guides.test.ts` and `apps/docs/test/guide-examples.test.ts` still import `@telos/locus`. You rewrite both.
- `apps/calculator/src/arithmetic.ts` has the region `START_BLOCK_ARITHMETIC_LOCUS` (WP13).
- `apps/calculator/src/app.ts` has `START_BLOCK_CALCULATOR_APP` (WP14).
- The root scripts `calculator`, `calculator:mcp`, `calculator:agent-demo`, `telos` and `telos:check` exist (WP14, WP15).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

### Calculator page (WP20, `/calculator`)

- `src/routes/calculator.tsx` renders `formModel(calculatorModel, "calculator:web")`. It builds the form model once, with top-level `await Effect.runPromise(...)` at module scope. `Effect.runSync` cannot be used: `formModel` computes contract digests with Web Crypto, which is asynchronous, so `runSync` throws `AsyncFiberError`. A route loader cannot be used either: loader data is serialized, and each form's `submit` is a function. The route module is code-split, so the top-level await runs in the prerender (Bun) and in the lazily loaded browser chunk, and the prerendered HTML contains the derived forms.
- There is one form per capability. Labeled inputs use `inputMode`. The Submit button shows the `InvocationOutcome` JSON in a result panel with `data-result="calculator"`.
- The page states that the forms are derived from the capability contracts.

### Guides (WP20; `docs/guides/`, `section` values unchanged)

| File | Content |
| --- | --- |
| `introduction.md` | What Telos is now and where to start |
| `first-locus.md` | `Locus.make`, then an extension, composition, a capability, `buildModel`, `Telos.resolve(...).inspect()` |
| `examples.md` | The calculator reference implementation: model diagram, the four capabilities, the three interfaces, the Archetypes, change impact, and how to run the CLI, Web and Agent Tools (`bun run calculator add --a 2 --b 3`, `bun run calculator:mcp`, `bun run calculator:agent-demo`, `/calculator`) and verification (`bun run telos verify`) |
| `agent-reference.md` | For agents: the introspection tools, `bun run telos` commands, `/semantic-report.json`, knowledge statuses, the grant rule |

**Checked examples** (`apps/docs/test/guide-examples.test.ts`, rewritten). These are fenced blocks whose info string is:

- `ts source=<repo path>#<REGION>`: the block body must equal the text between `// START_BLOCK_<REGION>` and `// END_BLOCK_<REGION>` in that file, with common leading indentation removed and outer blank lines trimmed. The markers already exist: WP13 adds `ARITHMETIC_LOCUS` to `apps/calculator/src/arithmetic.ts`, and WP14 adds `CALCULATOR_APP` to `apps/calculator/src/app.ts`. WP20 only quotes them.
- `json playground=<name>`: the body must parse to the same JSON value as `PLAYGROUND_EXAMPLES` entry `<name>`'s `json` (`JSON.stringify(JSON.parse(body)) === JSON.stringify(JSON.parse(example.json))`). The comparison is on the parsed value because `bun run format` reflows JSON fences in Markdown (it puts short arrays on one line); key order still has to match.

### Removal (WP20)

- Delete `packages/locus/` entirely.
- The workspace manifest check (exact pins, no trusted scripts) already lives in `scripts/manifest.test.ts`: WP01 creates it for the new packages. Deleting `packages/locus/` also deletes `packages/locus/test/manifest.test.ts`; WP20 removes the `@telos/locus` entry from `scripts/manifest.test.ts`'s package list if it has one.
- Remove the `packages/locus` references from the root `tsconfig.json`, `apps/docs/package.json` (`@telos/locus`), `telos.ts` (`telos:legacy-locus`) and its `.grace` legacy area documents. Run `bun install` to update `bun.lock` (workspace entries only).

The Calculator llms bullet (contract, `scripts/content.ts` `llmsText`): "The calculator web interface: forms derived from the capability contracts of calculator:arithmetic."

### APIs you use

`@telos/web` (WP12):

```ts
export interface WebField {
  readonly name: string
  readonly label: string                 // "a" -> "A"
  readonly type: InputFieldType
  readonly required: boolean
  readonly inputMode: "decimal" | "numeric" | "text"
  readonly description: string | null
}
export interface WebFormDefinition {
  readonly name: string                  // capability name
  readonly ref: string                   // capability key
  readonly description: string
  readonly fields: ReadonlyArray<WebField>
  readonly submit: (raw: Readonly<Record<string, string | undefined>>) => Effect.Effect<InvocationOutcome>
}
export interface WebFormModel { readonly locus: string; readonly title: string; readonly forms: ReadonlyArray<WebFormDefinition> }
export const formModel: (model: SemanticModel, webLocusId: string) => Effect.Effect<WebFormModel, LocusNotFound>
```

`@telos/calculator` (WP13, WP14) exports `calculatorModel` (`buildModel(app)`), `app` (`calculator:app`), `arithmetic` (`calculator:arithmetic`) and the capabilities `add`, `subtract`, `multiply` and `divide`. `divide` with `b === 0` fails with `DivisionByZero` (message "Division by zero is not defined."). Non-numeric input gives `InvalidInput`.

The calculator CLI (WP10, WP14):

- `bun run calculator add --a 2 --b 3` prints `{"result":5}` on stdout and exits 0.
- `bun run calculator divide --a 1 --b 0` prints `{"tag":"DivisionByZero","message":"Division by zero is not defined.","issues":[]}` on stderr and exits 1.

Kernel APIs for the first-locus guide snippets (from the kernel contract):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## capability.ts (WP03)

```ts
export type EffectClass = "pure" | "read" | "write"
/** A TaggedError class schema with a `message: string` field, e.g. Schema.TaggedError<X>()("X", { message: Schema.String }). */
export type ErrorSchema = Schema.Codec<{ readonly _tag: string; readonly message: string }, any> & { readonly identifier: string }
export interface Capability<I = any, O = any, E = any> {
  readonly _tag: "Capability"
  readonly description: string
  readonly input: Schema.Codec<I, any>
  readonly output: Schema.Codec<O, any>
  readonly errors: ReadonlyArray<ErrorSchema>
  readonly effect: EffectClass
  readonly handler: ((input: I) => Effect.Effect<O, E>) | null
}
export const Capability: {
  make: <I, IE, O, OE, const Errs extends ReadonlyArray<ErrorSchema> = readonly []>(options: {
    readonly description: string
    readonly input: Schema.Codec<I, IE>
    readonly output: Schema.Codec<O, OE>
    readonly errors?: Errs
    readonly effect: EffectClass
    readonly handler: (input: I) => Effect.Effect<O, Errs[number]["Type"]>
  }) => Capability<I, O, Errs[number]["Type"]>
  /** A declared capability without implementation, used by decodeLocus; handler is null. */
  declare: (options: { readonly description: string; readonly input: Schema.Codec<any, any>; readonly output: Schema.Codec<any, any>; readonly errors?: ReadonlyArray<ErrorSchema>; readonly effect: EffectClass }) => Capability
}
export function errorTag(schema: ErrorSchema): string // schema.identifier
```

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## extension.ts (WP03)

```ts
export interface Extension<Id extends string = string, F extends Schema.Struct.Fields = Schema.Struct.Fields> {
  readonly _tag: "Extension"
  readonly id: Id
  readonly description: string
  readonly properties: F
  readonly relationTypes: ReadonlyArray<RelationType>
  readonly archetypes: ReadonlyArray<Archetype>
}
export const Extension: {
  make: <const Id extends string, const F extends Schema.Struct.Fields = {}>(id: Id, options: {
    readonly description: string
    readonly properties?: F
    readonly relationTypes?: ReadonlyArray<RelationType>
    readonly archetypes?: ReadonlyArray<Archetype>
  }) => Extension<Id, F>
}
```

## locus.ts (WP03)

Copy these type helpers verbatim. They were type-checked in research R2.

```ts
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type FieldsOf<E> = E extends Extension<string, infer F> ? F : never
export type MergedFields<Es extends ReadonlyArray<Extension>> =
  [Es[number]] extends [never] ? {} :
  UnionToIntersection<FieldsOf<Es[number]>> extends infer I extends Schema.Struct.Fields ? I : {}
export type PropertiesOf<Es extends ReadonlyArray<Extension>> = Schema.Struct.Type<MergedFields<Es>>

export interface CompositionConflict {
  readonly code: "composition.extension-id-conflict" | "composition.property-conflict" | "composition.relation-type-conflict" | "composition.archetype-id-conflict"
  readonly subject: string                  // the conflicting extension id, property name, relation type id or archetype id
  readonly extensions: ReadonlyArray<string> // the two extension ids involved, in composition order
}

export interface LocusDefinition<Caps extends Record<string, Capability> = Record<string, Capability>> {
  readonly _tag: "Locus"
  readonly id: string
  readonly kind: LocusKind<ReadonlyArray<Extension>>
  readonly description: string | null
  readonly contains: ReadonlyArray<LocusDefinition>
  readonly relations: ReadonlyArray<Relation>
  readonly capabilities: Caps
  readonly properties: Readonly<Record<string, unknown>>   // decoded value, or the raw input when decoding failed
  readonly propertyIssues: ReadonlyArray<{ readonly path: ReadonlyArray<PropertyKey>; readonly message: string }>
  readonly capability: <K extends keyof Caps & string>(name: K) => CapabilityRef
}

export interface LocusKind<Es extends ReadonlyArray<Extension>> {
  readonly _tag: "LocusKind"
  readonly extensions: Es                       // deduplicated by object identity, composition order kept
  readonly conflicts: ReadonlyArray<CompositionConflict>
  readonly properties: Schema.Struct.Fields     // merged fields; first definition wins on conflict
  readonly relationTypes: ReadonlyArray<RelationType>   // all relation types of the extensions, first wins on id conflict
  readonly archetypes: ReadonlyArray<Archetype>         // all archetypes of the extensions, first wins on id conflict
  readonly extend: <const More extends ReadonlyArray<Extension>>(...more: More) => LocusKind<readonly [...Es, ...More]>
  readonly make: <const Caps extends Record<string, Capability> = {}>(definition: {
    readonly id: string
    readonly description?: string
    readonly contains?: ReadonlyArray<LocusDefinition<any>>
    readonly relations?: ReadonlyArray<Relation>
    readonly capabilities?: Caps
  } & ({} extends PropertiesOf<Es> ? { readonly properties?: PropertiesOf<Es> } : { readonly properties: PropertiesOf<Es> })) => LocusDefinition<Caps>
}

/** The universal Locus kind: no extensions. `Locus.make({ id })` is a complete Locus. */
export const Locus: LocusKind<readonly []>
```

Rules for `extend` and `make`:

- `extend` builds a new kind from `[...this.extensions, ...more]`. An extension object that is already present is skipped (no conflict). It then computes `conflicts` in composition order:
  1. A different extension object with an id already seen → `composition.extension-id-conflict` (subject = the id).
  2. For each property name of each extension: if an earlier *different* extension defined it → `composition.property-conflict` (subject = the property name).
  3. For each relation type: if a *different* RelationType object with the same id was seen → `composition.relation-type-conflict`.
  4. For each archetype: if a *different* Archetype object with the same id was seen → `composition.archetype-id-conflict`.
- `make` never throws:
  - It decodes `properties ?? {}` with `Schema.decodeUnknownExit(Schema.Struct(kind.properties))(raw, { errors: "all" })`.
  - On failure it keeps the raw value and fills `propertyIssues` from `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues`.
  - The result is frozen with `deepFreeze` (schemas and handlers are skipped).
  - Missing optional fields become `null` (`description`) or empty (`contains`, `relations`, `capabilities`).
- `definition.capability(name)` returns `CapabilityRef.make(definition.id, name)`.

## extensions/purpose.ts (WP03)

```ts
export const Purpose: Extension<"telos.purpose", {
  purpose: Schema.String
  responsibilities: Schema.optionalKey<Schema.$Array<Schema.String>>
  excluded: Schema.optionalKey<Schema.$Array<Schema.String>>
}>
// description: "States why a Locus exists, what it is responsible for and what it explicitly excludes."
```

Use `Schema.Array(Schema.String)` in the value. The written type above is illustrative, so let TypeScript infer it from `Extension.make`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## introspection.ts (WP09)

```ts
export class LocusNotFound extends Schema.TaggedError<LocusNotFound>()("LocusNotFound", { id: Schema.String, message: Schema.String }) {}
export class CapabilityNotFound extends Schema.TaggedError<CapabilityNotFound>()("CapabilityNotFound", { ref: Schema.String, message: Schema.String }) {}
export interface LocusView {
  readonly id: string
  readonly inspect: () => Effect.Effect<LocusDescription>
  readonly relations: () => Effect.Effect<LocusDescription["relations"]>
  readonly capabilities: () => Effect.Effect<ReadonlyArray<CapabilityDescription>>
  readonly verifications: () => Effect.Effect<ReadonlyArray<VerificationDescription>>  // uses the latest report of this service, else not-run
}
export interface TelosApi {
  readonly model: SemanticModel
  readonly loci: () => Effect.Effect<ReadonlyArray<string>>                      // model.ids
  readonly resolve: (id: string) => Effect.Effect<LocusView, LocusNotFound>
  readonly describe: () => Effect.Effect<ModelDescription>
  readonly diagnostics: () => Effect.Effect<ReadonlyArray<Diagnostic>>
  readonly verify: (options: VerifyOptions) => Effect.Effect<VerificationReport>  // also stores it as the latest report (Ref)
  readonly impact: (target: string) => Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound>
  readonly invoke: (ref: CapabilityRef | string, input: unknown, options: InvokeOptions) => Effect.Effect<InvocationOutcome>
}
export class Telos extends Context.Service<Telos, TelosApi>()("@telos/kernel/Telos") {
  static readonly make: (root: LocusDefinition) => Effect.Effect<TelosApi>
  static readonly layer: (root: LocusDefinition) => Layer.Layer<Telos>
}
```

`LocusNotFound` message: `"No Locus <id> in the model."`.

`buildModel(root)` returns a `SemanticModel` whose `diagnostics` is `[]` for a valid model. `invoke(model, ref, input, { via })` is described in the kernel contract; a Locus may always invoke its own capabilities (`via === ref.locus`).

### Calculator page (exact selectors and texts; tests rely on them)

`apps/docs/src/components/calculator-view.tsx`:

- `CALCULATOR_INTRO` is exactly the llms bullet text above.
- `outcomeText(outcome: InvocationOutcome): string` returns `JSON.stringify(outcome)`.
- `CalculatorView({ formModel }: { readonly formModel: WebFormModel })` renders:
  - `<main id="content" data-page="calculator" className="flex flex-col gap-8 py-8">`, `<h1>Calculator</h1>` and `<p>{CALCULATOR_INTRO}</p>`.
  - A paragraph: "Each form is derived from a capability contract of calculator:arithmetic and submits through the calculator:web interface, so it reports the same errors as the command line and the agent tools."
  - Hydration flag: `useState(false)` plus `useEffect(() => setHydrated(true), [])`. Then `<div data-slot="calculator" data-ready={hydrated ? "true" : "false"}>`.
  - Per form, in `formModel.forms` order, a `<form data-form={form.name} aria-labelledby={\`form-${form.name}-title\`}>` holding:
    - `<h2 id={\`form-${form.name}-title\`}>{form.name}</h2>` and `<p>{form.description}</p>`
    - for each field: `<label htmlFor={\`${form.name}-${field.name}\`}>{field.label}</label>` and the existing `Input` (`@/components/ui/input`) with `id={\`${form.name}-${field.name}\`}`, `name={field.name}`, `inputMode={field.inputMode}` and `aria-required={field.required}`. Do **not** set the HTML `required` attribute: the kernel must report missing input.
    - `<Button type="submit" data-action="submit">Submit</Button>` (`@/components/ui/button`)
    - after a submit, `<section data-result="calculator" data-form={form.name} aria-live="polite"><pre data-slot="outcome">{outcomeText(outcome)}</pre></section>`
  - `onSubmit`:
    1. Call `event.preventDefault()`.
    2. Build `const data = new FormData(event.currentTarget)` and `raw = Object.fromEntries(form.fields.map((f) => [f.name, String(data.get(f.name) ?? "")]))`.
    3. Run `Effect.runPromise(form.submit(raw)).then((outcome) => setOutcomes((prev) => ({ ...prev, [form.name]: outcome })))`. The state is `Readonly<Record<string, InvocationOutcome>>`.
- `apps/docs/src/routes/calculator.tsx`: `createFileRoute("/calculator")`.
  - Module constant, with top-level await: `const CALCULATOR_FORMS = await Effect.runPromise(formModel(calculatorModel, "calculator:web"));`. Never `Effect.runSync`: `formModel` hashes contracts with Web Crypto, which is asynchronous, so `runSync` throws `AsyncFiberError`. Build it here, not in a loader, because loader data is serialized and `submit` is a function.
  - head: title `pageTitle("Calculator")`, meta description `CALCULATOR_INTRO`
  - component: `<CalculatorView formModel={CALCULATOR_FORMS} />`

Navigation (sanctioned edits in WP19's files):

- `content-types.ts`: add `"calculator"` to `NavSectionId`, insert `{ id: "calculator", title: "Calculator", route: "/calculator" }` after `playground`, and add `"/calculator"` to `APP_ROUTES`.
- `prerender.ts`: add `"/calculator"` to `APP_PAGES`.
- `scripts/content.ts`: add a `calculator` branch in `llmsText` with the bullet above.
- `e2e/machine-files.e2e.ts`: add the Calculator line after the Playground line in `APP_PAGE_LINES`.
- `e2e/a11y.e2e.ts`: add `{ name: "calculator", path: "/calculator" }`.
- `test/content.test.ts`: add `## Calculator\n\n- [Calculator](/calculator): <bullet>` after the Playground block in the expected llms text.
- `test/site.test.ts`: add `["/calculator", "calculator"]` to `SECTION_CASES`.

### Guides (rewrite all four; keep `id`, `title`, `kind: guide`, `order`, `section`, `status: provisional`, `maturity: implemented`)

The front matter `related` lists use document ids that exist after WP16:

- `introduction`: `[foundation, locus, semantic-extension, archetype, first-locus]`
- `first-locus`: `[locus, semantic-extension, composition, capability, semantic-model, examples]`
- `examples`: `[first-locus, capability, interface-locus, archetype, impact]`
- `agent-reference`: `[foundation, decisions, knowledge-status, grant, capability]`

Each `summary` is one new sentence. None of them contains `verified` or `passing`.

**Allowed fenced blocks.** Any other info string fails `guides.test.ts`:

| Info string | Rule (checked by tests) |
| --- | --- |
| `ts source=<repo path>#<REGION>` | The body equals the region between `// START_BLOCK_<REGION>` and `// END_BLOCK_<REGION>` of that file. Common leading indentation is removed and outer blank lines are trimmed. |
| `json playground=<name>` | The body parses to the same JSON value as `PLAYGROUND_EXAMPLES` entry `<name>`'s `json` (`bun run format` reflows JSON fences, so the text may differ). |
| `sh` | Every line is a known command (see `commandProblem` below). |
| `text` | Allowed only directly after an `sh` block that has exactly one line starting with `bun run calculator ` (with a trailing space). The body equals the trimmed `stdout + stderr` of that command. A `text` body may be JSON (the calculator prints JSON); the old rule "text and mermaid blocks are not JSON" is gone. |
| `mermaid` | A diagram; not checked beyond the content build. |

**Inline code and prose.** The prose check rejects `verified`, `passing` and `all tests pass` outside code. Write knowledge statuses as inline code, for example `` `verified` ``. Site links to app pages may only target `/`, `/inspector`, `/playground`, `/calculator`, `/verification` and document routes. Write `/semantic-report.json`, `/llms.txt` and `/index.json` as inline code, never as links.

**Guide snippets file.** The first-locus guide quotes `apps/docs/test/guide-snippets.ts`. That file is real code and its own test runs it. Write exactly:

```ts
import { Effect, Schema } from "effect";
import { Capability, Extension, Locus, Purpose, Telos, buildModel } from "@telos/kernel";

// START_BLOCK_GUIDE_FIRST_LOCUS
export const hello = Locus.make({
  id: "demo:hello",
  description: "The smallest complete Locus: an identity and a description.",
});
// END_BLOCK_GUIDE_FIRST_LOCUS

// START_BLOCK_GUIDE_EXTENSION
export const Greeting = Extension.make("demo.greeting", {
  description: "Gives a Locus the greeting it answers with.",
  properties: { greeting: Schema.String },
});
// END_BLOCK_GUIDE_EXTENSION

// START_BLOCK_GUIDE_COMPOSITION
export const Greeter = Locus.extend(Purpose, Greeting);
// END_BLOCK_GUIDE_COMPOSITION

// START_BLOCK_GUIDE_CAPABILITY
export const greet = Capability.make({
  description: "Greets a person by name.",
  input: Schema.Struct({ name: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
  effect: "pure",
  handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}.` }),
});

export const greeter = Greeter.make({
  id: "demo:greeter",
  description: "Answers with a greeting.",
  properties: { purpose: "Greet people by name.", greeting: "Hello" },
  capabilities: { greet },
});
// END_BLOCK_GUIDE_CAPABILITY

// START_BLOCK_GUIDE_MODEL
export const demo = Locus.make({ id: "demo:app", contains: [hello, greeter] });
export const demoModel = buildModel(demo);
// END_BLOCK_GUIDE_MODEL

// START_BLOCK_GUIDE_INSPECT
export const inspectGreeter = Effect.gen(function* () {
  const telos = yield* Telos;
  const view = yield* telos.resolve("demo:greeter");
  return yield* view.inspect();
}).pipe(Effect.provide(Telos.layer(demo)));
// END_BLOCK_GUIDE_INSPECT
```

Add the GRACE module header above the imports (`ROLE: RUNTIME`, `MAP_MODE: EXPORTS`, a map line for each export). If the typecheck rejects a line, fix the snippet minimally so that it matches the kernel contract, then report the change.

**Content of each guide** (the headings are required, and the prose is yours: short, plain English, present tense, describing only what exists):

- `introduction.md`, title "Introduction":
  - `## What Telos is`: a semantic-first, agent-native framework. Software is described as Loci composed from semantic extensions, verified by Archetypes and exposed through Packs. Link the terms (`../foundation/terminology/<id>.md`) and the foundation README.
  - `## What exists today`: the kernel `@telos/kernel`; the Packs `@telos/cli`, `@telos/agent` and `@telos/web`; the calculator reference implementation; `telos.ts` and `bun run telos`; this site. Link the package entry files with repository-relative links (`../../packages/kernel/src/index.ts`, …).
  - `## How to read this site`: one bullet per `NAV_SECTIONS` entry, in order (14 sections), each linking its route or document.
  - `## Maturity and evidence`: keep the meaning of the current section. Results of running checks appear only on the Verification page, the inspector and the playground, each with where and when it was produced. The calculator page shows the outcome of each submit, computed in the browser at that moment (it is an invocation result, not a check result, and it has no provenance label).
- `first-locus.md`, title "Your first Locus":
  - `## 1. A Locus` with `ts source=apps/docs/test/guide-snippets.ts#GUIDE_FIRST_LOCUS` and `json playground=minimal` (the example's JSON is pretty-printed over three lines: `{`, `  "id": "demo:hello"`, `}`; print it with the R6 fence command). Explain that the JSON block is the smallest definition the playground accepts: an identity alone is a complete Locus.
  - `## 2. A semantic extension` with `#GUIDE_EXTENSION`
  - `## 3. Composition` with `#GUIDE_COMPOSITION` and `json playground=property-conflict`. Explain the conflict diagnostic.
  - `## 4. A capability` with `#GUIDE_CAPABILITY`
  - `## 5. The semantic model` with `#GUIDE_MODEL` and `json playground=composed`
  - `## 6. Inspect it` with `#GUIDE_INSPECT`
  - `## Next steps`: links to Examples, the playground (`/playground`) and the inspector (`/inspector`).
- `examples.md`, title "Examples" (the calculator reference implementation):
  - `## The model`: a `mermaid` flowchart. `calculator:app` contains `calculator:arithmetic`, `calculator:cli`, `calculator:web` and `calculator:agent`, and the three interfaces point to the four capabilities.
  - `## The arithmetic Locus`: `ts source=apps/calculator/src/arithmetic.ts#ARITHMETIC_LOCUS`
  - `## The application and its interfaces`: `ts source=apps/calculator/src/app.ts#CALCULATOR_APP`
  - `## Command line`: an `sh` block `bun run calculator add --a 2 --b 3` followed by `text` `{"result":5}`. Then an `sh` block `bun run calculator divide --a 1 --b 0` followed by `text` with the exact error JSON.
  - `## Web`: a link to `/calculator`.
  - `## Agent tools`: an `sh` block with `bun run calculator:mcp` and `bun run calculator:agent-demo`, and what the demo does.
  - `## Archetypes and verification`: the calculator Archetypes, and an `sh` block with `bun run telos verify`
  - `## Change impact`: an `sh` block with `bun run telos impact calculator:arithmetic#add`, and what it lists
  - `## Invalid definitions`: the playground examples `json playground=missing-target` and `json playground=cycle`, with the diagnostic each one gives
- `agent-reference.md`, title "Agent Reference":
  - `## Start here`: keep as today.
  - `## Entry points`: a table with these rows:
    - `packages/kernel/src/index.ts`
    - `packages/agent/src/introspection-tools.ts`
    - `telos.ts`
    - `scripts/telos.ts`
    - `apps/docs/scripts/content.ts`
    - `apps/docs/package.json`
    - `package.json`
    - `bunfig.toml`
    - `docs/tooling.md`
    - `.grace/`
  - `## State queries`: keep the `sh` block exactly as today.
  - `## Check commands`: keep the block, and add `bun run telos:check` after `bun run grace:lint`. Update the `bun run verify` sentence to end with the Telos check.
  - `## Repository model commands`: one `sh` block with these commands, each explained in one bullet:
    - `bun run telos list`
    - `bun run telos inspect telos:kernel`
    - `bun run telos verify`
    - `bun run telos closure`
    - `bun run telos impact calculator:arithmetic#add`
    - `bun run telos check`
    - `bun run telos report --out semantic-report.json`
  - `## Introspection tools`: one line per tool, `` - `telos_<name>`: <what it returns> ``, for the six names of `INTROSPECTION_TOOL_NAMES`. Discovery never grants invocation.
  - `## Knowledge statuses`: `declared`, `derived`, `verified`, `failed`, `not-run`, `unknown`, and the reserved `observed` and `invalidated` (no function returns them yet), as inline code with one sentence each. These are the values of the kernel type `Knowledge`.
  - `## Grant rule`: who may invoke a capability (the Locus itself, or a Locus with a relation whose type grants invocation).
  - `## Machine-readable files`: `/semantic-report.json`, `/llms.txt` and `/index.json` as inline code.
  - `## Public API of \`@telos/kernel\``: a table `| Export | What it does |` with one row per runtime export, written as `` `name` ``. Get the list with `bun -e 'console.log(Object.keys(await import("@telos/kernel")).sort().join("\n"))'` run in `apps/docs`.
  - `## Diagnostic codes`: one line per code, `` - `<code>` ``, for the 18 `DiagnosticCode` values, and a link to `(../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md)`.

## Rules for this work package

Read these rules before you write anything. They are part of the acceptance criteria.

1. **Baseline first.** Before you change a file, run `bun run verify` in your worktree and note the result of each step. If the baseline is not green, stop and report it; do not fix unrelated failures.
2. **Only your files.** Edit only the files in `owned_files` (frontmatter) and the sanctioned edits listed below. If you need any other change, stop and report it. Never edit `kitty-specs/**`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` or the charter.
3. **Contracts are exact.** Names, signatures, messages, ids and sort orders are copied from the quoted contracts. If an Effect API in a contract does not exist or behaves differently, stop and report it. Do not invent a replacement.
4. **Tests first.** Write the tests of a subtask before its implementation, run them and see them fail, then implement.
5. **No new dependencies** and no global installs. Do not run `bun add`. `bun install` is allowed only where this prompt says so.
6. **No fake work.** No placeholder code, no `TODO`, no skipped tests, no test that asserts nothing, no hard-coded counts of things that grow.
7. **Shell.** The shell is fish. Use `echo '-----'` as a separator, and pass paths explicitly instead of shell globs with `--include=*.ts`.
8. **Report exactly.** In your final message, list every check you ran and its exact result. Never claim a check passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Commands

| Purpose | Command |
| --- | --- |
| Full gate (run before handing a WP to review, and it must pass) | `bun run verify` |
| Fast loop while working | `bun run typecheck`, `bun test <paths>`, `bun run lint`, `bun run format` (writes), `bun run grace:lint` |
| One package's tests | `bun test packages/kernel/test` (example) |

`bun run verify` = `check:bun && format:check && lint && typecheck && test && docs:build && test:e2e && grace:lint`, plus `&& telos:check` from WP15 on. Report each step's result exactly. Never claim a step passed that you did not run.

## Code

- TypeScript, strict, using the repository `tsconfig.base.json`. Imports have **no** `.ts` extension. Use `import type` for types only.
- Format: run `bun run format` and follow its output. The repository uses double quotes, semicolons and trailing commas.
- Effect 4.0.4 APIs only, as quoted in the contracts. If an API in a contract does not exist, stop and report it. Do not invent a replacement.
- No new dependency, no upgrade, no global install (C-002). Workspace links already exist from WP01.
- No placeholder code, no `TODO` stubs, no tests that assert nothing, no skipped tests.
- No compatibility aliases for removed names (C-004).
- Comments and messages are in English (C-009). Diagnostic and error messages are exactly as written in the contracts.
- Determinism (NFR-002): sort with plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`), never `localeCompare`. Never depend on object key insertion order from user input. Never use `Date.now()` or randomness in output except the `now` option of `verify`.

## Tests

- `bun:test` (`describe`, `test`, `expect`). Test files are `test/<module>.test.ts` next to the package's `src/`.
- Every diagnostic code, closure code and Archetype rule has at least one test where it is reported or fails, and one where it is not reported or passes (NFR-005). The test name names the code or rule id.
- Never hard-code counts of documents, files, Loci or findings that change as the repository grows. Assert membership, or compare with a value computed from the same source.
- No network and no credentials (NFR-007). Subprocess tests use `Bun.spawn(["bun", <absolute path>], ...)` with a 20 s test timeout.
- Fixtures are built in the test file or in `test/fixture.ts`. Never import another package's `test/` files.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Git

- Spec Kitty creates your worktree and branch. Commit only inside it.
- Commit messages follow Conventional Commits 1.0.0: `feat(kernel): build the semantic model`, `docs(foundation): ...`, `test(cli): ...`.
- No AI names, and no author, co-author or session lines. The `.githooks/commit-msg` hook enforces this. Never use `--no-verify`.
- Never edit files that another WP owns (see each WP's "Owned files"). If a needed change falls outside your files, stop and report it.

**Sanctioned edits outside `owned_files`** (name each one in your commit body):

- `tsconfig.json`, `bun.lock`, `apps/docs/package.json`, `apps/docs/test/manifest.test.ts` (WP01): remove `packages/locus` and `@telos/locus` only.
- `telos.ts` (WP15): remove `telos:legacy-locus` and the relation to it. `.grace/graph/tooling.xml` (WP15): remove legacy module dependencies only.
- `apps/docs/src/lib/content-types.ts`, `apps/docs/src/lib/prerender.ts`, `apps/docs/scripts/content.ts`, `apps/docs/e2e/machine-files.e2e.ts`, `apps/docs/e2e/navigation.e2e.ts`, `apps/docs/e2e/a11y.e2e.ts` (WP19): add the calculator page.
- `apps/docs/test/content.test.ts`, `apps/docs/test/site.test.ts` (WP16): the Calculator llms bullet and route rows only.
- `apps/docs/src/routeTree.gen.ts`, `.grace/graph/docs.xml`, `.grace/verification/docs.xml` (WP18): regenerate the route tree; add M-DOCS-CALCULATOR and V-M-DOCS-CALCULATOR; add guide-snippets.test.ts to the guides verification entry; rewrite the `V-M-DOCS-CONTENT` Scenario and TraceAssertion that still name `@telos/locus` and "the fourteen codes" (exact text in R9); drop legacy dependencies.
- `apps/docs/e2e/machine-files.e2e.ts` (WP19): besides the Calculator line, change the map line "the three llms.txt bullets" and the comment "The two llms.txt bullets" to say "four".
- `docs/tooling.md` is **not** yours: WP21 owns it and adds the `bun run telos` and `telos:check` rows. Leave it as it is.
- `.grace/graph/index.xml`, `.grace/verification/index.xml` (WP01): delete the `GD-LEGACY` and `VD-LEGACY` blocks.

## GRACE synchronisation (part of this WP)

Every source and test file you create carries GRACE markup, and your modules are registered in **your own** area documents in the same commit as the code. `bun run grace:lint` (`grace lint --path . --assertions current`) must pass.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## GRACE file markup

Every new `src/*.ts`, `bin/*.ts` and `scripts/*.ts` file starts with this header. Copy the shape from `scripts/review-gate.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: <one sentence>
//   SCOPE: <what the file contains and what it never does>
//   DEPENDS: <module ids, comma-separated, or none>
//   LINKS: <M-ID>, <V-M-ID>
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   <exportName> - <short description>      (one line per export, every export, in file order)
// END_MODULE_MAP
```

Each exported function, constant or class has a contract block right above it:

```ts
// START_CONTRACT: <exportName>
//   PURPOSE: ...
//   INPUTS: { name: type - meaning, ... }
//   OUTPUTS: { type - meaning }
//   SIDE_EFFECTS: none | <what>
//   LINKS: <M-ID>
// END_CONTRACT: <exportName>
```

Exported types and interfaces need only the MODULE_MAP line. Test files use `ROLE: TEST` and `MAP_MODE: LOCALS`, and list their local helpers in the map. A test file with no local helpers has exactly one map line `(none) - no local helpers`, with the parentheses. Never write `none - no local helpers`: `grace lint` reads the leading identifier of each map line as a symbol name, so a bare `none` counts as a helper that does not exist and fails with `markup.module-map-mismatch`. `(none)` does not start with an identifier, so it keeps the map non-empty (no `markup.module-map-missing`) without naming a symbol. Optional named regions use `// START_BLOCK_<NAME>` / `// END_BLOCK_<NAME>`. The guides quote these regions (contracts/docs.md).

## GRACE graph and verification layout (created by WP01)

WP01 replaces `graph/main.xml` and `verification/main.xml` with one document per area:

- It moves the existing modules unchanged into `tooling`, `legacy` and `docs`.
- It creates the other documents empty with `<Owns />`.
- It rewrites both index files to list every document.

A WP edits **only** its own area documents and its own `<GD-…>` / `<VD-…>` block in `graph/index.xml` and `verification/index.xml`.

| Area | Graph doc / id | Verification doc / id | Owner WP | Modules (graph id → paths) |
| --- | --- | --- | --- | --- |
| tooling | `graph/tooling.xml` `GD-TOOLING` | `verification/tooling.xml` `VD-TOOLING` | WP01 (move), WP15, WP20 | `M-BUN-VERSION-GUARD`, `M-REVIEW-GATE` (moved); WP15: `M-REPOSITORY-MODEL` → `telos.ts`, `M-TELOS-COMMAND` → `scripts/telos.ts` |
| legacy | `graph/legacy.xml` `GD-LEGACY` | `verification/legacy.xml` `VD-LEGACY` | WP01 (move), WP20 (delete) | the six `M-LOCUS-*` modules (moved) |
| docs | `graph/docs.xml` `GD-DOCS` | `verification/docs.xml` `VD-DOCS` | WP01 (move), WP18, WP19, WP20 | `M-DOCS-CONTENT`, `M-DOCS-SPEC-REPORT`, `M-DOCS-SITE`, `M-DOCS-PLAYGROUND` (moved); WP18: rewrite `M-DOCS-PLAYGROUND`; WP19: `M-DOCS-SPEC-REPORT` → `M-DOCS-SEMANTIC-REPORT`, add `M-DOCS-INSPECTOR`; WP20: add `M-DOCS-CALCULATOR` |
| kernel-base | `graph/kernel-base.xml` `GD-KERNEL-BASE` | `verification/kernel-base.xml` `VD-KERNEL-BASE` | WP02 | `M-KERNEL-IDENTITY` → identity.ts, freeze.ts; `M-KERNEL-CANONICAL` → canonical.ts, digest.ts; `M-KERNEL-DIAGNOSTIC` → diagnostic.ts, cycles.ts |
| kernel-definitions | `GD-KERNEL-DEFINITIONS` | `VD-KERNEL-DEFINITIONS` | WP03 | `M-KERNEL-DEFINITIONS` → relation.ts, capability.ts, extension.ts, archetype.ts, locus.ts, extensions/purpose.ts, extensions/source.ts |
| kernel-model | `GD-KERNEL-MODEL` | `VD-KERNEL-MODEL` | WP04 (WP22: adds a path and test files) | `M-KERNEL-MODEL` → model.ts; WP22 adds readonly-map.ts |
| kernel-verify | `GD-KERNEL-VERIFY` | `VD-KERNEL-VERIFY` | WP05 | `M-KERNEL-VERIFY` → verify.ts |
| kernel-describe | `GD-KERNEL-DESCRIBE` | `VD-KERNEL-DESCRIBE` | WP06 | `M-KERNEL-DESCRIBE` → describe.ts, fields.ts; `M-KERNEL-INVOKE` → invoke.ts |
| kernel-decode | `GD-KERNEL-DECODE` | `VD-KERNEL-DECODE` | WP07 | `M-KERNEL-DECODE` → decode.ts |
| kernel-closure | `GD-KERNEL-CLOSURE` | `VD-KERNEL-CLOSURE` | WP08 (WP22: adds a test file) | `M-KERNEL-CLOSURE` → closure.ts |
| kernel-api | `GD-KERNEL-API` | `VD-KERNEL-API` | WP09 | `M-KERNEL-INTROSPECTION` → introspection.ts; `M-KERNEL-IMPACT` → impact.ts; `M-KERNEL-API` → index.ts |
| pack-cli | `GD-PACK-CLI` | `VD-PACK-CLI` | WP10 | `M-PACK-CLI` → all `packages/cli/src/*.ts` |
| pack-agent | `GD-PACK-AGENT` | `VD-PACK-AGENT` | WP11 | `M-PACK-AGENT` → semantics, archetype, tools, introspection-tools, index; `M-PACK-AGENT-MCP` → mcp.ts, client.ts |
| pack-web | `GD-PACK-WEB` | `VD-PACK-WEB` | WP12 | `M-PACK-WEB` → all `packages/web/src/*.ts` |
| calculator-core | `GD-CALCULATOR-CORE` | `VD-CALCULATOR-CORE` | WP13 | `M-CALC-ARITHMETIC` → errors.ts, arithmetic.ts, archetypes.ts (index.ts until WP14 takes it) |
| calculator-interfaces | `GD-CALCULATOR-INTERFACES` | `VD-CALCULATOR-INTERFACES` | WP14 | `M-CALC-INTERFACES` → interfaces.ts, app.ts, index.ts, bin/cli.ts, bin/mcp.ts, bin/agent-demo.ts |

The file name of a graph or verification document is the area name, e.g. `graph/kernel-model.xml`. Kernel paths are under `packages/kernel/src/`, and calculator paths under `apps/calculator/`.

### Graph entry

Each module lists its dependency modules as empty child elements, as in the existing documents:

```xml
<M-KERNEL-MODEL>
  <Summary>Builds a checked semantic model from a root Locus and reports structural diagnostics.</Summary>
  <Path>packages/kernel/src/model.ts</Path>
  <M-KERNEL-DEFINITIONS />
  <M-KERNEL-DIAGNOSTIC />
</M-KERNEL-MODEL>
```

### Verification entry

```xml
<V-M-KERNEL-MODEL>
  <TestFiles>
    <File>packages/kernel/test/model.test.ts</File>
  </TestFiles>
  <Command>bun test packages/kernel/test/model.test.ts</Command>
  <Scenario>One sentence per tested behaviour.</Scenario>
  <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
</V-M-KERNEL-MODEL>
```

Register a module **only together with** its verification entry, and only once the listed test files exist. Otherwise `grace lint` reports `missing-module-coverage` or `invalid-test-file` (research R8). Add the ids to your `<Owns>` blocks in both index files.

### How to edit the area documents (exact shapes)

WP01 created your area documents empty. Replace the empty element with the filled one. Example for the area `kernel-base` (use your own area name and ids):

```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-KERNEL-BASE>
    <M-KERNEL-IDENTITY>
      <Summary>One sentence.</Summary>
      <Path>packages/kernel/src/identity.ts</Path>
      <Path>packages/kernel/src/freeze.ts</Path>
    </M-KERNEL-IDENTITY>
  </GD-KERNEL-BASE>
</GraceGraphDocument>
```

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-BASE>
    <V-M-KERNEL-IDENTITY>
      <TestFiles>
        <File>packages/kernel/test/identity.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/identity.test.ts</Command>
      <Scenario>One sentence per tested behaviour.</Scenario>
      <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
    </V-M-KERNEL-IDENTITY>
  </VD-KERNEL-BASE>
</GraceVerificationDocument>
```

In `.grace/graph/index.xml` change only your block, from `<Owns />` to:

```xml
    <GD-KERNEL-BASE>
      <Path>graph/kernel-base.xml</Path>
      <Owns>
        <M-KERNEL-IDENTITY />
      </Owns>
    </GD-KERNEL-BASE>
```

and in `.grace/verification/index.xml` the same with `<VD-…>` and `<V-M-… />`. Editing your own `GD-`/`VD-` block of the two index files is a sanctioned edit for every WP.

Lint rules that were confirmed while planning (they fail the gate when ignored):

- `START_MODULE_MAP` lists **every** export of the file, one line each (types and interfaces too), in file order.
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or exactly one line `(none) - no local helpers` (with the parentheses; a bare `none` fails `grace lint` with `markup.module-map-mismatch`).
- Every `<File>` in a verification entry must exist. Register a module only together with its verification entry, after the test files exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP20 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T120 – Calculator page

1. Write `calculator-view.tsx`, `routes/calculator.tsx` and the navigation edits above.
2. Write `apps/docs/test/calculator.test.tsx` (`renderToStaticMarkup`, as in `components.test.tsx`):
   - `formModel(calculatorModel, "calculator:web")` has forms whose names, sorted, are `["add", "divide", "multiply", "subtract"]`.
   - The rendered page has:
     - one `data-form="<name>"` per form
     - `inputMode="decimal"` (React's static markup keeps the camel-case attribute name)
     - a label `for="add-a"` with the text `A`
     - `data-ready="false"`, because effects do not run in static rendering
   - `outcomeText` of `await Effect.runPromise(addForm.submit({ a: "2", b: "3" }))` contains `"result":5`. Divide `{ a: "1", b: "0" }` contains `DivisionByZero`. Add `{ a: "x", b: "1" }` contains `InvalidInput`.
3. Write `apps/docs/e2e/calculator.e2e.ts` (use `trackPageErrors`). Go to `/calculator` and wait for `[data-slot="calculator"]` to have `data-ready="true"`. Then:
   - Fill `#add-a` = 2 and `#add-b` = 3, and click `[data-form="add"] [data-action="submit"]`. `[data-result="calculator"][data-form="add"] [data-slot="outcome"]` contains `"result":5`.
   - Divide 1 by 0 gives `DivisionByZero`.
   - Add with `a = x` and `b = 1` gives `InvalidInput`.

**Vite bundle check.** Run `bun run docs:build` as soon as the route exists. If the client bundle fails because `@telos/calculator` pulls in a Bun-only module (for example `bun:*`, `node:child_process`, or `@telos/agent/mcp`), **stop and report the exact error**. Do not work around it.

### T121 – Guides

Write `apps/docs/test/guide-snippets.ts` (above), then rewrite the four guides as specified. Run `bun run --cwd apps/docs content` until it reports no problem.

### T122 – Guide tests

**`apps/docs/test/guide-snippets.test.ts`** (new):

- `demoModel.diagnostics` equals `[]`.
- `Greeter.conflicts` equals `[]`.
- `await Effect.runPromise(inspectGreeter)` has `id` `"demo:greeter"`, `extensions.map((e) => e.id)` equal to `["telos.purpose", "demo.greeting"]`, and `capabilities.map((c) => c.name)` equal to `["greet"]`.
- `await Effect.runPromise(invoke(demoModel, greeter.capability("greet"), { name: "Ada" }, { via: "demo:greeter" }))` equals `{ ok: true, output: { text: "Hello, Ada." } }`.

**`apps/docs/test/guide-examples.test.ts`** (rewrite; no `@telos/locus`):

- Read the four guides and collect the fences with the regex ``/^```([^\n]*)\n([\s\S]*?)^```$/gm``.
- `regionOf(path, region)`:
  - Read `<repo>/<path>` and take the lines strictly between the line whose trimmed text is `// START_BLOCK_<region>` and the line whose trimmed text is `// END_BLOCK_<region>`. Throw when either line is missing.
  - Remove the smallest leading-space count of the non-blank lines from every line.
  - Trim leading and trailing blank lines, and join with `"\n"`.
- Tests:
  - "every source= block equals its region": for each `ts source=<path>#<REGION>` fence, `fence body without its final newline` equals `regionOf(path, REGION)`.
  - "every playground= name is a playground example": the names exist in `PLAYGROUND_EXAMPLES` (import from `../src/playground/examples`).
  - "every playground= block is the example JSON": `JSON.stringify(JSON.parse(body)) === JSON.stringify(JSON.parse(example.json))` for each block.
  - "the guides quote ARITHMETIC_LOCUS, CALCULATOR_APP and all six GUIDE_ regions": each region appears at least once.

**`apps/docs/test/guides.test.ts`** (rewrite; no `@telos/locus`). Keep these parts of the current file unchanged:

- `GUIDE_SPECS`, `FRONT_MATTER`, `FENCE`, `loadGuide`, `GUIDES`, `AGENTS`, `sectionOf`
- the front matter and body tests, except one change: the prose check removes inline code first, `guide.body.replace(FENCE, "").replace(/`[^`]*`/g, "")`
- the table-column test and the content compile test

Then:

- `kindOf(info)`: returns `"sh"`, `"text"` or `"mermaid"` for those exact strings, `"source"` for `/^ts source=\S+#[A-Z0-9_]+$/`, `"playground"` for `/^json playground=[a-z-]+$/`, and `undefined` otherwise. Test: "every fenced block has an allowed info string".
- `commandProblem(line)`:
  - `bun run --cwd apps/docs <script>`: the script is in `apps/docs/package.json`.
  - `bun run <script> [args…]`: the **first word** after `bun run ` is a script of the root `package.json`.
  - `spec-kitty …` and `grace …` lines are in `AGENTS.md`.
  - `git status` and `git worktree list` exit 0.
  - Anything else is unknown.

  Test: "every sh line is a known command".
- Test: "text blocks show the real output of the calculator command before them". For each `text` fence, the previous fence is an `sh` fence with exactly one line starting with `bun run calculator `. Spawn `[process.execPath, "run", "--silent", "calculator", ...args]` in the repository root, where `args` are the words after `bun run calculator`. The trimmed `stdout + stderr` equals the trimmed body.
- Agent Reference tests:
  - "the public API table lists exactly the runtime exports of @telos/kernel": the `## Public API of \`@telos/kernel\`` table names, sorted, equal `Object.keys(await import("@telos/kernel")).sort()`.
  - "the introspection tools are the six names of INTROSPECTION_TOOL_NAMES": read `packages/agent/src/introspection-tools.ts` as text. Do not import it, because the docs app does not depend on `@telos/agent`. Collect the unique sorted matches of `/"(telos_[a-z_]+)"/g` and compare them with the `` - `telos_…` `` names of the `## Introspection tools` section. Also expect 6 names.
  - "the diagnostic codes are the DiagnosticCode values of the kernel": read `packages/kernel/src/diagnostic.ts`, take the text from `export type DiagnosticCode =` to the next `;`, and collect `/"([a-z]+\.[a-z-]+)"/g`. That gives 18 codes (WP22 added `archetype.applies-to-empty`). Compare them, sorted, with the `## Diagnostic codes` list. The section contains the link `(../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md)`.

Update the module headers: `DEPENDS: M-DOCS-CONTENT, M-KERNEL-API, M-DOCS-PLAYGROUND` and a map line per local helper. Run `bun test apps/docs/test`.

### T123 – Remove `packages/locus`

1. `git rm -r packages/locus`.
2. Make these sanctioned edits:
   - root `tsconfig.json`: remove `{ "path": "packages/locus" }` and `{ "path": "packages/locus/test" }`
   - `apps/docs/package.json`: remove `"@telos/locus": "workspace:*"`
   - `apps/docs/test/manifest.test.ts`: remove the `@telos/locus` entry
   - `telos.ts`: remove the `telos:legacy-locus` Locus, its entry in the repository's `contains`, and the docs-site relation to it
3. Run `bun install`. The `bun.lock` diff must only remove the `@telos/locus` workspace entries.
4. Run `git grep -n "@telos/locus\|packages/locus" -- . ':!kitty-specs' ':!docs/research' ':!docs/decisions' ':!docs/tooling.md' ':!README.md'`. It must print nothing. WP21 handles `README.md`, `docs/tooling.md` and the decision records.

### T124 – GRACE

- Delete `.grace/graph/legacy.xml` and `.grace/verification/legacy.xml`, and remove the `GD-LEGACY` and `VD-LEGACY` blocks from the two index files.
- In `.grace/graph/tooling.xml`, remove any `<M-LOCUS-* />` child (sanctioned).
- Add `M-DOCS-CALCULATOR` to `.grace/graph/docs.xml`:
  - Summary: "The calculator page: web forms derived from the capability contracts of calculator:arithmetic, invoked in the browser."
  - Paths: `apps/docs/src/routes/calculator.tsx`, `apps/docs/src/components/calculator-view.tsx`
  - Children: `<M-PACK-WEB />`, `<M-CALC-INTERFACES />`, `<M-DOCS-SITE />`
- Add `V-M-DOCS-CALCULATOR` to `.grace/verification/docs.xml`:
  - TestFiles: `apps/docs/test/calculator.test.tsx`, `apps/docs/e2e/calculator.e2e.ts`
  - Commands: `bun test apps/docs/test/calculator.test.tsx`, `bun run test:e2e apps/docs/e2e/calculator.e2e.ts`
- Add `apps/docs/test/guide-snippets.test.ts` to the TestFiles and Command of the verification entry that lists `guides.test.ts`.
- Update the `GD-DOCS` and `VD-DOCS` `<Owns>` blocks.
- `git grep -n "M-LOCUS-" -- .grace apps packages scripts telos.ts` must print nothing.

Run `bun run grace:lint`.

### T125 – Verify

Run `bun run format`, then `bun run verify`, and report each step. Then run `bun run telos check` once more on its own. It must exit 0 after the legacy Locus is gone.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP20 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- **Vite bundle**: the browser bundle must not pull Bun-only modules. Stop and report if it does.
- **Command echo**: `bun run` prints the command line to stderr. The output check uses `bun run --silent`.
- **Prose check**: `verified` in prose fails the guide test unless it is inline code.
- Removing `packages/locus` while a file still imports it breaks the typecheck. Run the T123 grep before `bun install`.

## Reviewer guidance

- `/calculator` works in Chromium (`calculator.e2e.ts`). Its forms come from `formModel`, not hand-written fields.
- Every TS block in the guides is a `source=` region of real, compiled code, and every JSON block is a playground example.
- `packages/locus` and the legacy GRACE area are gone, and the removal grep is clean.

## Activity Log

- 2026-10-24T20:23:01Z – claude – shell_pid=39069 – Blocked: formModel is asynchronous under Effect.runSync (kernel digestOf uses Effect.promise over crypto.subtle, via describeCapability). The prompt's module-level Effect.runSync(formModel(calculatorModel, 'calculator:web')) fails with AsyncFiberError. Owner decision needed: runPromise with top-level await, or a client-side form model.

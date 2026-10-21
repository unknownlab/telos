---
work_package_id: WP02
title: Review gate runner and wiring
dependencies:
- WP01
requirement_refs:
- C-004
- FR-009
- NFR-003
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts were generated on feat/bun-monorepo-toolchain; completed changes must merge back into feat/bun-monorepo-toolchain.
subtasks:
- T008
- T009
- T010
- T011
- T012
phase: Phase 2 - Gates
history:
- !!omap
  - at: '2026-10-21T03:16:03Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/review-gate.ts
create_intent:
- scripts/review-gate.ts
- scripts/review-gate.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .kittify/config.yaml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Review gate runner and wiring

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, mid to max effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via `spec-kitty agent tasks status --mission bun-monorepo-toolchain-01M5E4T4`) or the Activity Log below.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[If this WP was returned from review, the reviewer feedback reference appears in the Activity Log below or in the status event log.]*

---

## Objectives & Success Criteria

Make Spec Kitty's review gate run the whole check suite and block on **any** failure: format, lint, typecheck, tests, or grace lint (FR-009, SC-003).

Background (research R-05): Spec Kitty blocks a review only on JUnit test cases that are new failures compared to the baseline. A plain `bun run verify && bun test --reporter=junit …` command writes no JUnit file when `verify` fails. Spec Kitty then parses the run as text instead of JUnit and reports `SOURCE_MISMATCH`, which only warns. So you build a small runner that **always** writes JUnit, with one test case per check step.

Done means:

1. `scripts/review-gate.test.ts` was written first and failed, then passes (5 tests).
2. `scripts/review-gate.ts` matches `contracts/review-gate.md`.
3. `.kittify/config.yaml` has the new `review:` section and no other change.
4. With a type error present, Spec Kitty's own JUnit parser reads the runner's report as exactly one failure, `verify.typecheck`.
5. Running the runner modifies 0 tracked files (NFR-003).

## Context & Constraints

- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/review-gate.md` (**authoritative**)
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/research.md`: R-05
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/data-model.md`: ReviewGateConfig, ReviewGateRunner
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/plan.md`: IC-04
- `.kittify/charter/charter.md`: test-first; editing `.kittify/config.yaml` is limited to the `review:` section (spec C-004)

Hard rules:

- Test-first: T008 before T009.
- In `.kittify/config.yaml` you may **only append** the `review:` block. Changing any other line breaks C-004.
- No new dependencies. Use only Bun and `node:` built-ins.
- Copy the `// START_…` / `// END_…` GRACE markup exactly. WP04 models this file as module `M-REVIEW-GATE`.
- Conventional Commits, e.g. `feat(review): run the full check suite in the review gate`. No AI names. Never `--no-verify`.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on `feat/bun-monorepo-toolchain`; completed changes must merge back into `feat/bun-monorepo-toolchain`.
- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP02 --agent claude`.

## Before you start

```sh
bun install          # each worktree needs its own node_modules
bun run test         # 6 pass (WP01's guard test)
```

## Subtasks & Detailed Guidance

### Subtask T008 – Write the failing runner tests

- **File**: create `scripts/review-gate.test.ts` with exactly:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove the review gate report marks every failing step as a JUnit failure and keeps bun test's suites.
//   SCOPE: Unit tests of escapeXml and buildReport.
//   DEPENDS: M-REVIEW-GATE
//   LINKS: V-M-REVIEW-GATE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BUN_JUNIT - a minimal bun test JUnit document
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { buildReport, escapeXml } from "./review-gate";

const BUN_JUNIT = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="bun test" tests="1">
  <testsuite name="a.test.ts" tests="1">
    <testcase name="adds" classname="" />
  </testsuite>
</testsuites>
`;

describe("escapeXml", () => {
  test("escapes the five XML special characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });
});

describe("buildReport", () => {
  test("a passing step is a test case without a failure", () => {
    const report = buildReport([{ name: "lint", ok: true, message: "" }], null);
    expect(report).toContain('<testcase classname="verify" name="lint" />');
    expect(report).not.toContain("<failure");
  });

  test("a failing step is a test case with an escaped failure message", () => {
    const report = buildReport(
      [{ name: "typecheck", ok: false, message: 'x.ts: "1" < 2' }],
      null,
    );
    expect(report).toContain('<testcase classname="verify" name="typecheck">');
    expect(report).toContain(
      '<failure message="x.ts: &quot;1&quot; &lt; 2" />',
    );
    expect(report).toContain('tests="1" failures="1"');
  });

  test("bun test suites are kept inside the single testsuites root", () => {
    const report = buildReport(
      [{ name: "test", ok: true, message: "" }],
      BUN_JUNIT,
    );
    expect(report).toContain('<testsuite name="a.test.ts" tests="1">');
    expect(report).toContain('<testcase name="adds" classname="" />');
    expect(report.match(/<testsuites[\s>]/g)).toHaveLength(1);
  });

  test("no bun test output still gives a valid report", () => {
    const report = buildReport([{ name: "test", ok: true, message: "" }], null);
    expect(
      report.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>'),
    ).toBe(true);
    expect(report.trimEnd().endsWith("</testsuites>")).toBe(true);
  });
});
```

- **Check**: `bun test scripts/review-gate.test.ts` must **fail** (module missing). Record that in the Activity Log.

### Subtask T009 – Implement the runner

- **File**: create `scripts/review-gate.ts` with exactly:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Run the whole check suite for Spec Kitty's review gate and always write one JUnit report.
//   SCOPE: Run every check step, record each as a JUnit test case, merge in bun test's own JUnit suites, exit 1 on any failure.
//   DEPENDS: M-BUN-VERSION-GUARD
//   LINKS: M-REVIEW-GATE, V-M-REVIEW-GATE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   StepResult - outcome of one check step
//   escapeXml - escape text for an XML attribute
//   buildReport - JUnit report with a "verify" suite plus bun test's suites
// END_MODULE_MAP

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type StepResult = {
  name: string;
  ok: boolean;
  message: string;
};

// START_CONTRACT: escapeXml
//   PURPOSE: Escape text so it is safe inside a double-quoted XML attribute.
//   INPUTS: { text: string - raw text }
//   OUTPUTS: { string - text with & < > " ' escaped }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: escapeXml
export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// START_CONTRACT: buildReport
//   PURPOSE: Build the JUnit report the review gate parses.
//   INPUTS: { steps: StepResult[] - one per check step, bunJunit: string | null - bun test's JUnit file content, or null when it wrote none }
//   OUTPUTS: { string - a <testsuites> document: a "verify" suite with one test case per step, then every <testsuite> from bunJunit }
//   SIDE_EFFECTS: none
//   LINKS: M-REVIEW-GATE
// END_CONTRACT: buildReport
export function buildReport(
  steps: StepResult[],
  bunJunit: string | null,
): string {
  const failures = steps.filter((step) => !step.ok).length;
  const cases = steps.map((step) => {
    const open = `    <testcase classname="verify" name="${escapeXml(step.name)}"`;
    if (step.ok) return `${open} />`;
    return `${open}>\n      <failure message="${escapeXml(step.message)}" />\n    </testcase>`;
  });
  const bunSuites = bunJunit?.match(/<testsuite[\s>][\s\S]*<\/testsuite>/)?.[0];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<testsuites>",
    `  <testsuite name="verify" tests="${steps.length}" failures="${failures}">`,
    ...cases,
    "  </testsuite>",
    ...(bunSuites ? [`  ${bunSuites}`] : []),
    "</testsuites>",
    "",
  ].join("\n");
}

function lastLine(text: string): string {
  return text.trim().split("\n").at(-1) ?? "";
}

function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function runStep(name: string, command: string[]): StepResult {
  const result = Bun.spawnSync(command, { stdout: "pipe", stderr: "pipe" });
  const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;
  const ok = result.exitCode === 0;
  const message = ok ? "" : lastLine(output) || `exit code ${result.exitCode}`;
  return { name, ok, message };
}

if (import.meta.main) {
  // START_BLOCK_READ_OUTPUT_PATH
  const outputFile = process.argv[2];
  if (!outputFile) {
    console.error("usage: bun scripts/review-gate.ts <junit-output-file>");
    process.exit(2);
  }
  // END_BLOCK_READ_OUTPUT_PATH

  // START_BLOCK_RUN_STEPS
  const tempDir = mkdtempSync(join(tmpdir(), "review-gate-"));
  const bunJunitPath = join(tempDir, "bun-test.xml");
  const steps = [
    runStep("check:bun", ["bun", "run", "check:bun"]),
    runStep("format:check", ["bun", "run", "format:check"]),
    runStep("lint", ["bun", "run", "lint"]),
    runStep("typecheck", ["bun", "run", "typecheck"]),
    runStep("test", [
      "bun",
      "test",
      "--pass-with-no-tests",
      "--reporter=junit",
      `--reporter-outfile=${bunJunitPath}`,
    ]),
    runStep("grace:lint", ["bun", "run", "grace:lint"]),
  ];
  // END_BLOCK_RUN_STEPS

  // START_BLOCK_WRITE_REPORT
  const bunJunit = readOptional(bunJunitPath);
  rmSync(tempDir, { recursive: true, force: true });
  writeFileSync(outputFile, buildReport(steps, bunJunit));
  for (const step of steps) {
    console.log(
      `${step.ok ? "PASS" : "FAIL"} verify.${step.name}${step.ok ? "" : `: ${step.message}`}`,
    );
  }
  process.exit(steps.every((step) => step.ok) ? 0 : 1);
  // END_BLOCK_WRITE_REPORT
}
```

- **Check**: `bun run test` passes 11 tests (6 guard + 5 runner). `bun run typecheck` and `bun run lint` exit 0. `bun fmt --no-script --check scripts/` reports nothing to format.
- **Design notes**: all steps run with no early stop, so the report lists every failure. The regex keeps every `<testsuite>` of bun's report but never the `<testsuites>` root, because `[\s>]` cannot match the `s` in `testsuites`.

### Subtask T010 – Wire the gate in `.kittify/config.yaml`

- Append this block at the **end** of `.kittify/config.yaml`, with no other change:

```yaml
review:
  test_command: bun scripts/review-gate.ts {output_file}
  test_output_format: junit_xml
  fail_on_pre_review_regression: true
```

- **Check**: `git diff .kittify/config.yaml` shows only these 4 added lines. `python3 -c "import yaml,sys; print(yaml.safe_load(open('.kittify/config.yaml'))['review'])"` prints the three keys (if PyYAML is missing, use `spec-kitty`'s Python: `~/.local/share/uv/tools/spec-kitty-cli/bin/python`).

### Subtask T011 – Prove the runner's behavior

Run from the worktree root. Use a path outside the repo for the report, e.g. `R=$(mktemp -d)/junit.xml`.

1. **Current state**: `bun scripts/review-gate.ts "$R"; echo exit=$?`. Expected now:
   - `PASS` for `check:bun`, `lint`, `typecheck`, `test`.
   - `FAIL verify.format:check`, only because `docs/tooling.md` is unformatted until WP03 merges. If WP03 is already in your base, this passes.
   - `FAIL verify.grace:lint` because `.grace/` arrives in WP04, or because `grace` is not on PATH.
   - exit=1. Record the exact lines.
2. **Spec Kitty parses it**: run

   ```sh
   ~/.local/share/uv/tools/spec-kitty-cli/bin/python -c "
   from pathlib import Path
   from specify_cli.review.baseline import _parse_junit_xml
   print(_parse_junit_xml(Path('$R')))"
   ```

   Expected: one `BaselineFailure` per failed step, named `verify.<step>`, plus the 11 passing test cases.
3. **Type error is a named failure**: create a temporary `scripts/x.ts` containing `export const n: number = "x";`, rerun steps 1 and 2, and confirm a new failure `verify.typecheck`. Delete `scripts/x.ts`.
4. **No argument**: `bun scripts/review-gate.ts; echo exit=$?` → usage line on stderr, exit=2.
5. **Read-only**: `git status --porcelain` is empty apart from your intended changes (NFR-003).

### Subtask T012 – Record the gate evidence

- In the Activity Log, record the outputs of T011 steps 1–4 (trimmed) and the final `bun run test` count.
- Note for the reviewer: the gate becomes fully green only after WP03 (docs formatting) and WP04 (`.grace/`) are merged. WP05 runs the full end-to-end check.

## Test Strategy

- Unit tests: `scripts/review-gate.test.ts` (5 tests) for `escapeXml` and `buildReport`.
- Behavior: the T011 runs, including parsing with Spec Kitty's own JUnit parser.

## Definition of Done

- [ ] T008's failing run is recorded before T009.
- [ ] Both scripts match this prompt exactly (after `bun fmt`).
- [ ] `.kittify/config.yaml` diff is exactly the 4-line `review:` block.
- [ ] T011 evidence recorded; a type error shows as `verify.typecheck` in Spec Kitty's parser.
- [ ] `bun run test` passes 11 tests; `typecheck` and `lint` pass.

## Risks & Mitigations

- **Spec Kitty reads the config from the primary checkout**: the gate takes effect for later reviews once this WP is merged into `feat/bun-monorepo-toolchain`. That is expected.
- **Baseline already failing**: before WP03 and WP04 land, `format:check` and `grace:lint` fail on the base too. The gate blocks only on *new* failures, so these do not block other WPs.
- **`grace` missing on PATH**: the `grace:lint` step fails with a clear message. Installation is an owner decision (see `docs/tooling.md`).

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Compare both scripts with this prompt and `contracts/review-gate.md`.
- Re-run T011 steps 2 and 3 yourself. The gate design depends on the parser result.
- Confirm the `.kittify/config.yaml` diff touches nothing outside `review:`.
- Confirm no tracked file changes after running the runner.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`.

- 2026-10-21T03:16:03Z – system – Prompt created.

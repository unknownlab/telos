---
work_package_id: WP01
title: Review gate report hardening
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-010
- NFR-001
- NFR-004
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts for this mission were generated on feat/bun-monorepo-toolchain. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/bun-monorepo-toolchain unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-toolchain-hardening-01M5EFAX
base_commit: 28c7f2fc1b79e1ba3548c24ff6e66924efe11094
created_at: '2026-10-21T05:41:13.951631+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - Hardening
history:
- at: '2026-10-21T05:50:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/review-gate.ts
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .grace/graph/main.xml
- .grace/verification/main.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Review gate report hardening

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission toolchain-hardening-01M5EFAX` for review feedback. You must address all feedback before your work is complete.

---

## Objectives & Success Criteria

`scripts/review-gate.ts` must never write a JUnit report that Spec Kitty cannot parse, and its failure messages must show the cause (FR-001, FR-002, FR-003, FR-010, NFR-001, NFR-004).

Why it matters: when a harness forces colour (`FORCE_COLOR=1`), a failing step's message contains the ESC character (0x1B). XML 1.0 forbids it, Spec Kitty's parser raises, and Spec Kitty then only warns "no coverage", so the review is **not blocked**. The gate exists to block failing work.

Done means:

1. `sanitizeText` removes ANSI CSI escape sequences and every character XML 1.0 cannot represent, and keeps all other text.
2. `escapeXml` sanitizes first; `buildReport` also sanitizes the embedded `bun test` JUnit text.
3. `failureMessage` returns the first real error line (contract rules below), at most 300 characters.
4. Child steps run with `NO_COLOR=1` and without `FORCE_COLOR`.
5. The GRACE file markup and `.grace/` entries match the code, and `grace lint` is clean with both modules `ready`.
6. Real tests prove all of it, and you showed them failing before the fix.

## Context & Constraints

Read, in this order:

- `kitty-specs/002-toolchain-hardening-01M5EFAX/contracts/review-gate-report.md` (**authoritative**)
- `kitty-specs/002-toolchain-hardening-01M5EFAX/research.md` R-01 and R-02
- `scripts/review-gate.ts`, `scripts/review-gate.test.ts` (existing code)
- `AGENTS.md` (rules: Conventional Commits, no AI author lines, no `--no-verify`)

Hard rules:

- Only these files change: `scripts/review-gate.ts`, `scripts/review-gate.test.ts`, `.grace/graph/main.xml`, `.grace/verification/main.xml`.
- No new dependency. Bun only. No fake tests (a test must fail when the behavior breaks).
- **Do not edit or delete anything under `kitty-specs/` in your lane worktree** (the review gate rejects it). Record your evidence in your final report and in your commit body, not in the WP file.
- Do not use `--force` or `--no-verify`. Do not push. Do not touch `AGENTS.md`, `CLAUDE.md`, the charter or `.kittify/config.yaml`.
- Commit messages: Conventional Commits, no AI names, no `Co-Authored-By` line. Example: `fix(review-gate): keep the report well-formed when output has escape codes`.

## Branch Strategy

- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP01 --agent claude` and work only inside the worktree it gives you. Run `bun install` there first (the pre-commit hook needs `node_modules/`).

## Subtasks & Detailed Guidance

### Subtask T001 – Write the failing gate tests

**Purpose**: Encode the acceptance examples as tests **before** any code changes (charter: test-first).

**File**: `scripts/review-gate.test.ts` (existing file with 5 tests; keep them, add the new ones, extend the import line).

Add imports for `sanitizeText` and `failureMessage` from `./review-gate`. Add these tests (adapt names to the file's style):

```ts
describe("sanitizeText", () => {
  test("removes ANSI colour sequences but keeps the text", () => {
    expect(sanitizeText("\u001b[31mfailed\u001b[0m")).toBe("failed");
  });

  test("removes characters XML 1.0 cannot represent", () => {
    expect(sanitizeText("a\u0000b\u0001c\u000bd￾e")).toBe("abcde");
  });

  test("keeps tab, newline, carriage return and non-ASCII text", () => {
    expect(sanitizeText("a\tb\nc\rd é 日本 😀")).toBe("a\tb\nc\rd é 日本 😀");
  });

  test("drops a lone surrogate but keeps a valid pair", () => {
    expect(sanitizeText("x\ud800y😀")).toBe("xy😀");
  });
});

describe("escapeXml and buildReport with escape codes", () => {
  test("escapeXml strips escape codes before escaping", () => {
    expect(escapeXml("\u001b[1m<a>\u001b[0m")).toBe("&lt;a&gt;");
  });

  test("buildReport never contains an ESC character, even from the bun test report", () => {
    const report = buildReport(
      [{ name: "typecheck", ok: false, message: "\u001b[31mTS2322\u001b[0m" }],
      '<testsuites><testsuite name="x" tests="1" failures="0"><testcase name="a\u001b[0m" /></testsuite></testsuites>',
    );
    expect(report.includes("\u001b")).toBe(false);
    expect(report).toContain('message="TS2322"');
    expect(sanitizeText(report)).toBe(report);
  });
});

describe("failureMessage", () => {
  const wrapper = 'error: script "typecheck" exited with code 1';

  test("prefers the first real error line over bun's wrapper line", () => {
    expect(failureMessage(`a.ts(3,1): error TS2322: x\n${wrapper}\n`, 1)).toBe(
      "a.ts(3,1): error TS2322: x",
    );
  });

  test("shows the failing test line, not the summary", () => {
    expect(
      failureMessage("(fail) f\n 1 fail\nRan 12 tests across 3 files.\n", 1),
    ).toBe("(fail) f");
  });

  test("falls back to the last real line when no line looks like an error", () => {
    expect(
      failureMessage(
        'docs/tooling.md\n1 file needs formatting.\nerror: script "format:check" exited with code 1\n',
        1,
      ),
    ).toBe("1 file needs formatting.");
  });

  test("falls back to the wrapper line, then to the exit code", () => {
    expect(failureMessage(`${wrapper}\n`, 1)).toBe(wrapper);
    expect(failureMessage("", 3)).toBe("exit code 3");
  });

  test("strips colour and limits the length to 300 characters", () => {
    expect(failureMessage("\u001b[31merror: boom\u001b[0m", 1)).toBe("error: boom");
    expect(failureMessage(`error: ${"x".repeat(500)}`, 1).length).toBe(300);
  });
});
```

Make sure `describe` is imported from `bun:test` if the file does not already import it.

**Show it failing** (record the exact output for your final report):

```
bun test scripts/review-gate.test.ts
```

Expected: a failure for the missing exports (for example `SyntaxError: Export named 'sanitizeText' not found`), or failing assertions. Keep this output.

### Subtask T002 – Implement `sanitizeText` and use it

**File**: `scripts/review-gate.ts`. Add this next to `escapeXml` (above it), exported, with the same contract-comment style as the neighbouring functions (`START_CONTRACT: sanitizeText` … `END_CONTRACT: sanitizeText`, `PURPOSE`, `INPUTS`, `OUTPUTS`, `SIDE_EFFECTS: none`, `LINKS: M-REVIEW-GATE`).

Do **not** use a regular expression with control characters (the linter's `no-control-regex` rule can fail). Use this loop:

```ts
function isXmlChar(point: number): boolean {
  return (
    point === 0x9 ||
    point === 0xa ||
    point === 0xd ||
    (point >= 0x20 && point <= 0xd7ff) ||
    (point >= 0xe000 && point <= 0xfffd) ||
    (point >= 0x10000 && point <= 0x10ffff)
  );
}

export function sanitizeText(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text.charCodeAt(i) === 0x1b && text[i + 1] === "[") {
      // ANSI CSI: ESC [ parameter bytes, intermediate bytes, one final byte
      let j = i + 2;
      while (j < text.length && text.charCodeAt(j) >= 0x30 && text.charCodeAt(j) <= 0x3f) j++;
      while (j < text.length && text.charCodeAt(j) >= 0x20 && text.charCodeAt(j) <= 0x2f) j++;
      if (j < text.length && text.charCodeAt(j) >= 0x40 && text.charCodeAt(j) <= 0x7e) {
        i = j + 1;
        continue;
      }
    }
    const point = text.codePointAt(i) ?? 0;
    const width = point > 0xffff ? 2 : 1;
    if (isXmlChar(point)) out += text.slice(i, i + width);
    i += width;
  }
  return out;
}
```

Then:

- Make `escapeXml` start with `sanitizeText(text)` and chain the existing `.replaceAll` calls on that result (the `&` replacement must stay first).
- In `buildReport`, sanitize the Bun JUnit before matching: `const bunSuites = sanitizeText(bunJunit ?? "").match(/<testsuite[\s>][\s\S]*<\/testsuite>/)?.[0];`.

Add `sanitizeText` and `failureMessage` to the `START_MODULE_MAP` comment (see T004).

### Subtask T003 – Implement `failureMessage`; clean child environment

**File**: `scripts/review-gate.ts`. Replace `lastLine` with this exported function (same contract-comment style; remove `lastLine`, which is no longer used):

```ts
const WRAPPER_LINE = /^error: script "[^"]*" exited with code \d+$/;

export function failureMessage(output: string, exitCode: number): string {
  const lines = sanitizeText(output)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const real = lines.filter((line) => !WRAPPER_LINE.test(line));
  const pick =
    real.find((line) => /error/i.test(line) || line.startsWith("(fail)")) ??
    real.at(-1) ??
    lines.at(-1) ??
    `exit code ${exitCode}`;
  return pick.slice(0, 300);
}
```

In `runStep`, use it and clean the environment:

```ts
function runStep(name: string, command: string[]): StepResult {
  const env: Record<string, string | undefined> = { ...process.env, NO_COLOR: "1" };
  delete env.FORCE_COLOR;
  const result = Bun.spawnSync(command, { stdout: "pipe", stderr: "pipe", env });
  const output = `${result.stdout.toString()}\n${result.stderr.toString()}`;
  const ok = result.exitCode === 0;
  const message = ok ? "" : failureMessage(output, result.exitCode);
  return { name, ok, message };
}
```

If `bun run typecheck` reports a type problem with the `env` type, adjust the annotation minimally (do not use `any`). Run `bun test scripts/review-gate.test.ts`: all tests (old and new) must pass now.

### Subtask T004 – Update GRACE

1. In `scripts/review-gate.ts`, update the `START_MODULE_CONTRACT`/`START_MODULE_MAP` header: add `sanitizeText - strip escape codes and characters XML cannot represent` and `failureMessage - pick the first real error line of a failed step` to the map; update `SCOPE` to mention sanitizing and message selection. Keep `LINKS`, `ROLE`, `MAP_MODE` as they are. Make sure `escapeXml`'s contract text says it sanitizes first.
2. Open `.grace/verification/main.xml` and the `V-M-REVIEW-GATE` entry. Keep the command `bun test scripts/review-gate.test.ts`. If the entry lists scenarios, add: report stays well-formed with escape codes; failure message picks the first real error line. Match the style of the existing lines exactly.
3. Open `.grace/graph/main.xml`; change it only if the module's described exports or purpose text would now be false (usually no change).
4. Run `grace lint --path . --assertions current`. It must report 0 errors and 0 warnings. Run `grace status --path . --with modules --json` and confirm `M-REVIEW-GATE` is `ready`.

### Subtask T005 – Prove the behavior end to end

Run and record the **verbatim** results of each. Use scratch files under `/private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/ca615710-6f3b-44bf-bbd6-219a016818ad/scratchpad/` (never `/tmp`).

1. `bun run verify` → exit 0.
2. Colour regression, **before** your fix you cannot run this, so run it **after** and also with the old code on a scratch copy if easy. After the fix: create `scripts/x.ts` with `export const n: number = "x";`, then run `FORCE_COLOR=1 bun scripts/review-gate.ts <scratch>/gate.xml`. Expect exit 1, `FAIL verify.typecheck: <message with the TS error text, no escape characters>`, and `xmllint --noout <scratch>/gate.xml` exits 0 (if `xmllint` is missing, say so and use `grep -c $'\x1b'` to show 0 ESC bytes). **Delete `scripts/x.ts` afterwards.**
3. Spec Kitty's parser: if you can import it, run `python3 -c` with `specify_cli`'s `_parse_junit_xml` (find it with `grep -rn "def _parse_junit_xml" /Users/unknownhero/.local/share/uv/tools/spec-kitty-cli/lib/python3.14/site-packages/specify_cli`) against the report and show the failure `verify.typecheck` is counted. If this is too awkward, skip and say why.
4. Mutation check: temporarily make `sanitizeText` return its input unchanged (`return text;`), run `bun test scripts/review-gate.test.ts`, show the failing tests, then **restore** the function and show the tests pass again. `git diff` must show no leftover mutation.
5. Clean run: `bun scripts/review-gate.ts <scratch>/clean.xml` → exit 0, six `PASS verify.*` lines; `git status --porcelain` shows only your intended changes (NFR-004).

## Definition of Done

- [ ] New tests written first and shown failing; then all pass (`bun test scripts/review-gate.test.ts`).
- [ ] `sanitizeText`, `failureMessage` exported and used as specified; `lastLine` removed.
- [ ] Child steps run with `NO_COLOR=1` and no `FORCE_COLOR`.
- [ ] GRACE markup and `.grace/` updated; `grace lint --path . --assertions current` has 0 errors and 0 warnings.
- [ ] `FORCE_COLOR=1` run with a deliberate type error gives exit 1 and a well-formed report; `scripts/x.ts` removed.
- [ ] Mutation check done and reverted.
- [ ] Only the four owned files changed; Conventional Commit with no AI attribution.

## Risks & Mitigations

- **`no-control-regex` lint failures**: avoid control characters in regexes; use the loop above.
- **Over-stripping**: only escape sequences and XML-invalid characters are removed; the tests keep tab, newline, non-ASCII text and emoji.
- **Lone surrogate handling**: `codePointAt` returns the surrogate itself; it is not an XML character and is dropped; a valid pair is kept.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Re-run `bun test`, `bun run verify`, and the `FORCE_COLOR=1` scenario yourself; confirm the report parses and names the type error.
- Confirm the new tests fail when `sanitizeText` or `failureMessage` is broken (do your own mutation check).
- Check GRACE: `grace lint --path . --assertions current` clean; the module map in the file matches the exports.
- Confirm only the four owned files changed and no `kitty-specs/` change on the lane.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`. Lane workspaces may not edit `kitty-specs/`; put evidence in the final report.

- 2026-10-21T05:50:00Z – system – Prompt created.

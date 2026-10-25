---
work_package_id: WP01
title: Check suite, review gate and hook without docs and GRACE steps
dependencies: []
requirement_refs:
- FR-004
- FR-005
planning_base_branch: feat/m0-cleanup
merge_target_branch: feat/m0-cleanup
branch_strategy: Planning artifacts for this mission were generated on feat/m0-cleanup. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/m0-cleanup unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-m0-cleanup-01M5SPZC
base_commit: 7adc5e8fc221e7f34ba7d95e04ed08c8f5e6b123
created_at: '2026-10-25T17:43:25.138334+00:00'
subtasks:
- T001
- T002
- T003
- T004
phase: Phase 1 - Decouple the checks
history:
- at: '2026-10-25T17:25:46Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- package.json
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .githooks/pre-commit
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Check suite, review gate and hook without docs and GRACE steps

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Review Feedback

If this WP was returned from review, the feedback reference is in the status event log (`spec-kitty agent tasks status --mission m0-cleanup-01M5SPZC`). Address every item before you hand the WP back.

---

## Objective

Remove the three steps that check only the documentation site and GRACE (`docs:build`, `test:e2e`, `grace:lint`) from the root `verify` script and from the review gate's step list, and remove the `grace` step from the pre-commit hook. After this WP every commit needs only the Bun toolchain, so WP02 can delete `apps/docs`, `docs/` and `.grace/`.

Nothing else changes in this WP. The scripts `grace:lint`, `docs:build`, `docs:preview` and `test:e2e` stay in `package.json` until WP02, because a docs test (`apps/docs/test/guides.test.ts`) still reads `grace:lint`.

## Context

- Spec: `kitty-specs/m0-cleanup-01M5SPZC/spec.md` (FR-004, FR-005, User Story 2).
- Plan: `kitty-specs/m0-cleanup-01M5SPZC/plan.md`, section "Commit-safety: hook, gate and test couplings".
- Exact target text: `kitty-specs/m0-cleanup-01M5SPZC/contracts/check-suite.md`.
- Reference patch, rehearsed on a clone of `feat/m0-cleanup` (all checks green, the hook passed): `kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp01-checks.patch`.

The no-drift test in `scripts/review-gate.test.ts` requires `verify` and `CHECK_STEPS` to list the same steps, so both change in the same commit.

## Branch Strategy

- **Planning base branch**: `feat/m0-cleanup`
- **Merge target branch**: `feat/m0-cleanup`
- Execution worktrees are allocated per computed lane from `kitty-specs/m0-cleanup-01M5SPZC/lanes.json`. Work only in the lane worktree that `spec-kitty agent action implement WP01 --agent claude` gives you.

## Rules for this WP

- Work in the lane worktree. Run every command from its root.
- **Preflight (stop if it fails).** Run `git config --get core.hooksPath`. It must print exactly `.githooks`. If it prints anything else (for example an absolute path), stop and report "P1 precondition not met"; do not change git config yourself.
- Run `bun install --frozen-lockfile` once before anything else.
- Never use `--no-verify`, `--force`, `--skip-*` or any `*_DISABLE` variable. If the hook fails, fix the cause.
- Never run `bun kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts capture`. The baseline is fixed.
- Do not edit or stage anything under `kitty-specs/`, and do not touch `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml` or `human-notes.md`.
- The `AGENTS.md` rules about GRACE (`grace lint`, keeping `.grace/` in sync) do not apply to this mission: M0 removes GRACE. Do not run `grace` commands and do not edit `.grace/`.
- Do not change any comment other than the one `OUTPUTS` line named in T002. WP03 removes all comments.
- Commit message rules: Conventional Commits, no AI names, no co-author lines.

`P` below means the parity harness: `P=kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts`.

### Baseline (before any edit)

```sh
bun run verify            # must exit 0; note the test count (846 expected)
bun $P check              # must print "parity check passed: ..."
```

If either fails before you edit anything, stop and report.

---

### Subtask T001: Change the review-gate tests to the six-step suite first

**Purpose**: test first. The tests describe the new step list before the code changes.

**File**: `scripts/review-gate.test.ts` (3 edits).

**Steps**:

1. In `describe("failureMessage", ...)`, test "falls back to the last real line when no line looks like an error", change the sample text. Old:
   ```ts
           'docs/tooling.md\n1 file needs formatting.\nerror: script "format:check" exited with code 1\n',
   ```
   New:
   ```ts
           'tools/README.md\n1 file needs formatting.\nerror: script "format:check" exited with code 1\n',
   ```
   (Only the file name in the sample changes; it is sample text, the file does not need to exist.)

2. In `describe("CHECK_STEPS and the root verify script", ...)`, replace the whole test that starts with `test("docs:build runs after test, test:e2e runs after docs:build, grace:lint runs after test:e2e, and telos:check runs last", () => {` (and ends at its `});`) with:
   ```ts
     test("the gate runs exactly check:bun, format:check, lint, typecheck, test and telos:check, in that order", () => {
       expect(CHECK_STEPS.map((step) => step.name)).toEqual([
         "check:bun",
         "format:check",
         "lint",
         "typecheck",
         "test",
         "telos:check",
       ]);
     });
   ```

3. Replace the whole next test, `test("a failing docs:build is a failing verify.docs:build case, and a passing test:e2e stays passing", () => {` ... `});`, with:
   ```ts
     test("a failing telos:check is a failing verify.telos:check case, and a passing typecheck stays passing", () => {
       const report = buildReport(
         [
           {
             name: "telos:check",
             ok: false,
             message: "closure has 1 error",
           },
           { name: "typecheck", ok: true, message: "" },
         ],
         null,
       );
       expect(report).toContain(
         '<testcase classname="verify" name="telos:check">\n      <failure message="closure has 1 error" />\n    </testcase>',
       );
       expect(report).toContain(
         '<testcase classname="verify" name="typecheck" />',
       );
       expect(report).toContain('tests="2" failures="1"');
     });
   ```

Leave every other test unchanged, in particular the no-drift test ("verifyStepNames of the verify script equals the gate's step names, in order (no drift)"), "every step name is unique" and "each step runs the root script of the same name, and the test step runs bun test".

**Validation**:

```sh
bun test scripts/review-gate.test.ts
```

Expected now: exactly one failing test, "the gate runs exactly check:bun, format:check, lint, typecheck, test and telos:check, in that order" (CHECK_STEPS still has nine steps). Every other test passes. Record this output for the report; it is the test-first evidence.

---

### Subtask T002: Drop the three steps from `verify` and `CHECK_STEPS`

**Purpose**: make the gate and `verify` run only checks that still have something to check (FR-004), in the same order.

**Files**: `package.json`, `scripts/review-gate.ts`.

**Steps**:

1. `package.json`, the `verify` script. Old:
   ```json
       "verify": "bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run docs:build && bun run test:e2e && bun run grace:lint && bun run telos:check"
   ```
   New (exact value from `contracts/check-suite.md`):
   ```json
       "verify": "bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run telos:check"
   ```
   Do not remove any other script in this WP.

2. `scripts/review-gate.ts`, `CHECK_STEPS`: delete these three lines and nothing else:
   ```ts
     { name: "docs:build", command: ["bun", "run", "docs:build"] },
     { name: "test:e2e", command: ["bun", "run", "test:e2e"] },
     { name: "grace:lint", command: ["bun", "run", "grace:lint"] },
   ```
   The result must equal the `CHECK_STEPS` block in `contracts/check-suite.md` (six entries; `test` runs `["bun", "test", "--pass-with-no-tests"]`, the others `["bun", "run", <name>]`).

3. `scripts/review-gate.ts`, the contract comment just above `CHECK_STEPS`. In the line that starts with `//   OUTPUTS: { ReadonlyArray<CheckStep> - `, change `test, docs:build, test:e2e, grace:lint, telos:check;` to `test, telos:check;`. This is the only comment you change.

**Validation**:

```sh
bun test scripts/review-gate.test.ts     # all pass, 0 fail
```

---

### Subtask T003: Remove the GRACE step from the pre-commit hook

**Purpose**: a commit needs only the Bun toolchain (FR-005). After this, the hook no longer runs `grace lint`, so later WPs can delete `.grace/` and `apps/docs`.

**File**: `.githooks/pre-commit`.

**Steps**: delete the last three lines of the file, that is the blank line and the two `grace` lines:

```sh

command -v grace >/dev/null 2>&1 || fail "grace not found. See docs/tooling.md"
grace lint --path . --assertions current || fail "grace lint failed"
```

The file must then end with the line `bun test --pass-with-no-tests || fail "tests failed"` followed by one newline. Keep the file mode (it is executable; editing in place keeps it). Do not change the `bun not found. See docs/tooling.md` line; WP02 changes it once `tools/README.md` exists.

**Validation**:

```sh
grep -c grace .githooks/pre-commit    # prints 0
test -x .githooks/pre-commit && echo executable
sh -n .githooks/pre-commit && echo syntax-ok
```

---

### Subtask T004: Run all checks and commit

**Steps**:

1. Compare your edits with the reference patch:
   ```sh
   git diff -- package.json scripts/review-gate.ts scripts/review-gate.test.ts .githooks/pre-commit \
     | diff - kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp01-checks.patch && echo same-as-reference
   ```
   Run this after `bun run format`. It should print `same-as-reference`. If it shows differences, fix your edits until it does. Fallback if your edits went wrong: `git checkout -- package.json scripts/review-gate.ts scripts/review-gate.test.ts .githooks/pre-commit`, then `git apply kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp01-checks.patch`, and say so in your report.
2. Run:
   ```sh
   bun run format
   bun run verify                                   # exit 0; six steps; 846 tests pass
   bun test scripts/review-gate.test.ts             # 0 fail
   grep -c grace .githooks/pre-commit               # 0
   bun $P check                                     # "parity check passed: ..."
   git status --short                               # exactly the four owned files modified
   ```
   `verify` output must not mention `docs:build`, `test:e2e` or `grace`.
3. Stage only the owned files and commit (the hook runs; let it):
   ```sh
   git add package.json scripts/review-gate.ts scripts/review-gate.test.ts .githooks/pre-commit
   git commit -m "chore(checks): drop docs, browser and GRACE steps from the check suite"
   ```
4. Hand the WP to review the way your Spec Kitty workflow says (`spec-kitty agent tasks move-task WP01 --to for_review --mission m0-cleanup-01M5SPZC` or the command the implement action printed). Record subtasks done: `spec-kitty agent tasks mark-status T001 T002 T003 T004 --status done --mission m0-cleanup-01M5SPZC`.

## Definition of Done

- `verify` in `package.json` equals the value in `contracts/check-suite.md`.
- `CHECK_STEPS` holds exactly `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `telos:check`, in that order.
- `scripts/review-gate.test.ts` pins that list; the no-drift test still exists and passes.
- `.githooks/pre-commit` has no `grace` line and is still executable.
- `bun run verify` exits 0 (846 tests); `bun $P check` passes.
- One commit, staging only the four owned files, message `chore(checks): drop docs, browser and GRACE steps from the check suite`, made with the hook running.
- `mark-status` recorded for T001-T004.

## Risks

- The hook path. If `core.hooksPath` were absolute, this lane would run the main checkout's hook and the commit would still need GRACE; the preflight catches that.
- Removing a script from `package.json` too early breaks `apps/docs/test/guides.test.ts`. This WP removes none.

## Reviewer Guidance

- `git show --stat HEAD` lists exactly the four owned files.
- The WP commit's diff of the four files equals `contracts/patches/wp01-checks.patch`: `git diff <commit>~1 <commit> -- package.json scripts/review-gate.ts scripts/review-gate.test.ts .githooks/pre-commit | diff - kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp01-checks.patch` prints nothing.
- Test-first evidence: the implementer's T001 run with one failing test.
- Run `bun run verify` and `bun scripts/review-gate.ts /tmp/wp01-gate.xml; echo $?` (0, six `verify.*` cases).

## Report

End with: result, changed files, each check command and its outcome (with test counts), the T001 failing-test output, the commit hash, and any unresolved issue.

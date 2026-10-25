---
work_package_id: WP03
title: Remove all code comments except owner notes and directives
dependencies:
- WP02
requirement_refs:
- FR-007
- FR-008
- FR-009
- NFR-001
- NFR-004
- NFR-005
- C-001
- C-005
- C-007
planning_base_branch: feat/m0-cleanup
merge_target_branch: feat/m0-cleanup
branch_strategy: Planning artifacts for this mission were generated on feat/m0-cleanup. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/m0-cleanup unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
- T013
phase: Phase 3 - Remove comments
history:
- at: '2026-10-25T17:25:46Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- packages/**
- apps/calculator/**
- scripts/**
- telos.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Remove all code comments except owner notes and directives

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

Remove every comment from the tracked TypeScript files in `packages/`, `apps/calculator/`, `scripts/` and `telos.ts`, including all GRACE markup (`START_MODULE_CONTRACT`, `START_MODULE_MAP`, `START_CONTRACT`, `START_BLOCK_*` and their `END_*` lines) and all JSDoc. Keep exactly two kinds of comment: the 34 owner review notes (`//@unknownhero ...`, word for word, at the same place) and the 7 `// @ts-expect-error` directives. Delete `apps/calculator/test/ergonomics.test.ts`, the only test that reads the `START_BLOCK_ARITHMETIC_LOCUS` markers (owner decision Q2: no replacement). Prove that no code changed.

**You do not edit comments by hand.** The mission's stripper does it, and the parity harness proves the result.

## Context

- Spec: `kitty-specs/m0-cleanup-01M5SPZC/spec.md` (FR-007, FR-008, FR-009, NFR-001, NFR-004; edge cases on strings, same-line notes and notes next to GRACE blocks).
- Plan: `plan.md` (IC-03, "Behavior parity strategy"); `research.md` R3 and R4 (how the stripper and the proofs work, and the dry-run result).
- Harness contract: `kitty-specs/m0-cleanup-01M5SPZC/contracts/parity-harness.md`. Comment classes: `data-model.md`.
- The stripper lives in `kitty-specs/m0-cleanup-01M5SPZC/parity/lex.ts` and runs through `parity.ts strip`. It refuses to run (throws) if a comment it would remove looks like an owner note or a toolchain directive.
- Rehearsal: on a clone with WP01 and WP02 applied, `strip` changed 112 files, `bun run format` then changed 0 files, the scan gave 34 / 7 / 0, `same-code` and `check` passed, `verify` passed with 522 tests, lint showed the same 31 warnings as before.
- WP02 is already in this lane: the docs site, `docs/` and `.grace/` are gone, so nothing reads the GRACE markup any more.

C-001 and C-007: this WP changes comments and formatting only. It does not act on any owner review note and changes no code, test assertion or name.

## Branch Strategy

- **Planning base branch**: `feat/m0-cleanup`
- **Merge target branch**: `feat/m0-cleanup`
- Execution worktrees are allocated per computed lane from `kitty-specs/m0-cleanup-01M5SPZC/lanes.json`. Work only in the lane worktree that `spec-kitty agent action implement WP03 --agent claude` gives you.

## Rules for this WP

- Work in the lane worktree. Run every command from its root.
- **Preflight (stop if it fails).** `git config --get core.hooksPath` must print exactly `.githooks`. Otherwise stop and report "P1 precondition not met"; do not change git config yourself.
- Check that WP02 is present: `test ! -e apps/docs && test ! -e .grace && test -f tools/README.md && echo wp02-present`. If it does not print `wp02-present`, stop and report.
- Check that the harness exists in this worktree: `test -f kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts && test -f kitty-specs/m0-cleanup-01M5SPZC/baseline/meta.json && echo harness-present`. If not, stop and report; do not copy it in.
- Run `bun install --frozen-lockfile` once before anything else.
- Never use `--no-verify`, `--force`, `--skip-*` or any `*_DISABLE` variable.
- **Never run `parity.ts capture`.** The baseline at `f95ae8d` is the proof; a new capture would destroy it.
- Do not edit the harness (`parity/`) or the baseline (`baseline/`), and do not stage anything under `kitty-specs/`.
- Do not hand-edit any `.ts` file. If a check fails after `strip`, stop and report the exact output; do not patch around it.
- The `AGENTS.md` rules about GRACE do not apply: M0 removes GRACE. Do not run `grace` commands.
- Commit message rules: Conventional Commits, no AI names, no co-author lines.

`P` below means the parity harness: `P=kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts`.

### Baseline (before any change)

```sh
bun run verify          # exit 0; about 526 tests pass
bun $P selftest         # exit 0
bun $P check            # "parity check passed: 105 code files, ..."
bun $P scan             # {"ownerNotes":34,"directives":7,"other":<about 3,180>}
git status --short      # empty
BASE=$(git rev-parse HEAD); echo "$BASE"    # keep it; T012 compares against it
```

---

### Subtask T010: Delete the ergonomics test

**Purpose**: FR-009 and Q2. `apps/calculator/test/ergonomics.test.ts` reads the `// START_BLOCK_ARITHMETIC_LOCUS` / `// END_BLOCK_ARITHMETIC_LOCUS` markers in `apps/calculator/src/arithmetic.ts`. Once the markers are gone it would fail, and the owner decided not to replace it ("all tests must be part of the App"). It is deleted, not emptied or skipped (C-005).

**Steps**:

```sh
git rm -q apps/calculator/test/ergonomics.test.ts
```

Do this before `strip`, so the stripper does not process the file.

**Validation**: `git status --short` shows `D  apps/calculator/test/ergonomics.test.ts`.

---

### Subtask T011: Strip the comments and format

**Purpose**: FR-007. One reviewed tool removes the comments the same way in every file.

**Steps**:

1. Run the stripper:
   ```sh
   bun $P strip
   ```
   Expected last line: `stripped comments from 112 file(s); now run: bun run format`. If it throws (for example `strip: refusing, comments look like notes or directives: ...`), stop and report the message; do not edit files to get past it.
2. Format, as the harness contract requires:
   ```sh
   bun run format
   ```
   Expected: `Formatted 0 files` (the rehearsal changed none). If it formats files, that is allowed; T012 proves the code is unchanged either way.

What the stripper does (so you can recognize the diff): a line that holds only comments is deleted; a trailing comment is deleted with the spaces before it; an inline block comment is deleted; runs of blank lines collapse to one; leading blank lines of a file go; each file ends with one newline. Owner notes (`//@unknownhero`) and `// @ts-expect-error` lines are kept, also when they sit on a line with code. Text inside strings, template literals and regex literals is never touched (for example `"**/*.ts"` or `"// START_BLOCK"` inside a string).

**Validation**: `git status --short | grep -v -E '^( M|M |D ) (packages/|apps/calculator/|scripts/|telos\.ts)'` prints nothing (only files in scope changed).

---

### Subtask T012: Prove parity and run all checks

**Purpose**: NFR-001..NFR-004, FR-008, C-001.

**Steps** (all must pass; record every output line shown):

```sh
bun $P scan --expect-clean
# {"ownerNotes":34,"directives":7,"other":0}
# scan passed

bun $P same-code "$BASE"
# same-code passed: 112 files have the same code as <BASE> apart from comments and formatting

bun $P check
# parity check passed: 104 code files, 14 commands, exports, model outputs and owner notes match baseline f95ae8d

bun run verify
# exit 0; six steps; about 522 tests pass (526 minus the 4 ergonomics tests), 0 fail;
# lint warnings: the same 31 as before (26 no-explicit-any, 5 no-empty-object-type), no new kind

bun scripts/review-gate.ts /tmp/m0-wp03-gate.xml; echo "gate exit $?"
# gate exit 0
```

`same-code` compares every file in scope with the same file at `$BASE`: the runtime code (Bun transpiler output) and the token stream without comments must be equal. `check` compares commands, exports, model outputs and owner-note anchors with the baseline taken before M0. `104 code files` is right: the baseline had 105, and the ergonomics test is the one allowed removal.

Then the reference search, now without any filter (NFR-005). It must print only `AGENTS.md` lines (21, 29, 37, 44, 47, 48, 49, 102, 112), which WP04 fixes:

```sh
git ls-files \
  | grep -v -E '^(kitty-specs/|kitty-ops/|\.kittify/archive/|tools/agents/experiments/|tools/agents/usage/ledgers/|human-notes\.md$|\.kittify/charter/charter\.yaml$)' \
  | tr '\n' '\0' \
  | xargs -0 grep -n -E 'apps/docs|@telos/docs|docs/|\.grace|grace lint|grace:lint|docs:build|docs:preview|test:e2e|START_MODULE|START_CONTRACT|END_CONTRACT|START_BLOCK|END_BLOCK' \
  | grep -v '^AGENTS.md:'
```

Expected: no output. (Before staging, the search reads the working tree, which is what you want.)

If any check fails, stop and report the exact output. Do not re-run `strip` on a half-stripped tree; to start over, run `git checkout -- packages apps/calculator scripts telos.ts` (this keeps the ergonomics deletion staged) and repeat T011.

---

### Subtask T013: Commit

**Steps**:

1. Stage only the scope:
   ```sh
   git add -A packages apps/calculator scripts telos.ts
   git status --short       # only M/D entries under packages/, apps/calculator/, scripts/, telos.ts; nothing else
   ```
2. Commit (the hook runs; let it):
   ```sh
   git commit -m "refactor(code): remove every comment except owner notes and directives" \
     -m "Strip all comments, GRACE markup and JSDoc from packages/, apps/calculator/, scripts/ and telos.ts with the mission's stripper, keeping the 34 owner review notes and the 7 @ts-expect-error directives. Delete the calculator ergonomics test, which only read the removed START_BLOCK markers."
   ```
3. Hand the WP to review as your Spec Kitty workflow says, and record `spec-kitty agent tasks mark-status T010 T011 T012 T013 --status done --mission m0-cleanup-01M5SPZC`.

## Definition of Done

- `apps/calculator/test/ergonomics.test.ts` is deleted.
- `bun $P scan --expect-clean` gives `{"ownerNotes":34,"directives":7,"other":0}`.
- `bun $P same-code <BASE>` and `bun $P check` pass.
- `bun run verify` and the review gate exit 0.
- The unfiltered reference search shows only `AGENTS.md` lines.
- One commit, message `refactor(code): remove every comment except owner notes and directives`, touching only `packages/`, `apps/calculator/`, `scripts/`, `telos.ts`, made with the hook running.

## Risks

- A lexer mistake could change code (for example inside a template literal or regex). `same-code` and `check` catch it; report instead of fixing by hand.
- An owner note could move away from its code. `check` compares each note's anchor with the baseline.
- Re-running `capture` would erase the proof. It is forbidden here.

## Reviewer Guidance

- Re-run, in the lane worktree at the WP commit: `bun $P scan --expect-clean`, `bun $P same-code <commit>~1`, `bun $P check`, `bun run verify`.
- `git diff <commit>~1 <commit> --stat` touches only the scope; `git diff <commit>~1 <commit> | grep '^+' | grep -v '^+++'` adds only lines that existed before with a comment removed, or reflowed code (no new code).
- `git grep -n '//@unknownhero' <commit> -- apps/calculator/src | wc -l` prints 34.
- Spot-check `apps/calculator/src/app.ts` line 1 and `apps/calculator/src/interfaces.ts`: notes kept on their lines.

## Report

End with: result, changed files (count, plus the deleted test), each check command and its output line, `BASE`, the commit hash, and any unresolved issue.

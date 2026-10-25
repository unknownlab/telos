---
work_package_id: WP02
title: Remove the docs site, the docs folder and GRACE
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-006
- FR-010
- FR-011
- FR-012
- FR-013
- FR-014
- NFR-002
- NFR-003
- NFR-006
- NFR-007
- C-002
- C-003
- C-006
- C-008
planning_base_branch: feat/m0-cleanup
merge_target_branch: feat/m0-cleanup
branch_strategy: Planning artifacts for this mission were generated on feat/m0-cleanup. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/m0-cleanup unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
- T009
phase: Phase 2 - Remove docs and GRACE
history:
- at: '2026-10-25T17:25:46Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: docs/
create_intent:
- tools/README.md
execution_mode: code_change
model: ''
owned_files:
- apps/docs/**
- docs/**
- .grace/**
- package.json
- bun.lock
- tsconfig.json
- bunfig.toml
- .gitignore
- .githooks/pre-commit
- README.md
- tools/README.md
- tools/agents/settings/README.md
- .kittify/glossaries/team_domain.yaml
- telos.ts
- scripts/telos.ts
- scripts/telos.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Remove the docs site, the docs folder and GRACE

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

Delete the documentation site (`apps/docs`, workspace `@telos/docs`), the `docs/` folder and the GRACE folder (`.grace/`), and every script, configuration entry, model entry and pointer that names them. Move the useful tooling text of `docs/tooling.md` to a new `tools/README.md`. Kernel, Pack and calculator behavior does not change, and the lockfile only loses entries.

## Context

- Spec: `kitty-specs/m0-cleanup-01M5SPZC/spec.md` (FR-001..FR-006, FR-010..FR-014; NFR-002, NFR-003, NFR-006; resolved Q1 and Q3).
- Plan: `kitty-specs/m0-cleanup-01M5SPZC/plan.md` (IC-02) and `research.md` (R6 for `tools/README.md`, R7 for the expected changes).
- Target state of the checks: `kitty-specs/m0-cleanup-01M5SPZC/contracts/check-suite.md`.
- **Reference patch** with every text edit of this WP, rehearsed on a clone (all checks green, the hook passed): `kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp02-edits.patch`. It covers all owned files except the three deleted folders and `bun.lock`. You apply it with `git apply`; T005-T007 tell you what it changes so you can check it.
- WP01 is already in this lane: `verify` and the review gate run six steps, and the hook has no `grace` step. That is why the deletions here can commit.

Why one commit: deleting `apps/docs` breaks the `tsconfig.json` reference, the closure scope, the model and the `bunfig.toml` entries at the same moment, so the deletions and the edits go together or the hook fails.

## Branch Strategy

- **Planning base branch**: `feat/m0-cleanup`
- **Merge target branch**: `feat/m0-cleanup`
- Execution worktrees are allocated per computed lane from `kitty-specs/m0-cleanup-01M5SPZC/lanes.json`. Work only in the lane worktree that `spec-kitty agent action implement WP02 --agent claude` gives you.

## Rules for this WP

- Work in the lane worktree. Run every command from its root.
- **Preflight (stop if it fails).** `git config --get core.hooksPath` must print exactly `.githooks`. Otherwise stop and report "P1 precondition not met"; do not change git config yourself.
- Check that WP01 is present: `grep -c grace .githooks/pre-commit` prints `0` and `grep -c docs:build scripts/review-gate.ts` prints `0`. If not, stop and report.
- Run `bun install --frozen-lockfile` once before anything else.
- Never use `--no-verify`, `--force`, `--skip-*` or any `*_DISABLE` variable.
- Never run `bun kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts capture`.
- Do not edit or stage anything under `kitty-specs/`. Do not touch `AGENTS.md` (WP04), `CLAUDE.md`, `.kittify/config.yaml`, `.kittify/charter/` or `human-notes.md`. Do not touch the historical records: other missions' `kitty-specs/`, `kitty-ops/`, `.kittify/archive/`, `tools/agents/experiments/`, `tools/agents/usage/ledgers/`.
- The `AGENTS.md` rules about GRACE do not apply: M0 removes GRACE. Do not run `grace` commands.
- Do not uninstall anything machine-local (GRACE CLI, GRACE skills, Chromium). C-008.
- Do not add, upgrade or downgrade any dependency (C-003). The only `bun install` here removes the docs workspace.
- Leave comments in `.ts` files alone, even when they mention docs. WP03 removes all comments.
- Commit message rules: Conventional Commits, no AI names, no co-author lines.

`P` below means the parity harness: `P=kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts`. `PATCH=kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp02-edits.patch`.

### Baseline (before any edit)

```sh
bun run verify     # exit 0; six steps; 846 tests pass
bun $P check       # "parity check passed: 105 code files, 14 commands, ..."
BASE=$(git rev-parse HEAD); echo "$BASE"   # keep this value for T008 and the report
```

---

### Subtask T005: Apply the reference patch; check `tools/README.md` and the pointers

**Purpose**: FR-002 (move `docs/tooling.md`), FR-011, FR-012, FR-013.

**Steps**:

1. Apply all text edits of this WP at once:
   ```sh
   git apply --check "$PATCH" && git apply "$PATCH"
   git status --short
   ```
   Expected: modified `.githooks/pre-commit`, `.gitignore`, `.kittify/glossaries/team_domain.yaml`, `README.md`, `bunfig.toml`, `package.json`, `scripts/telos.test.ts`, `scripts/telos.ts`, `telos.ts`, `tools/agents/settings/README.md`, `tsconfig.json`; new `tools/README.md`. If `git apply --check` fails, stop and report the error; do not hand-edit around it.
2. Check these files against the list below (open each one; the patch is the exact text).

**What the patch does in these files**:

- `tools/README.md` (new): `docs/tooling.md` without any docs or GRACE content. Kept sections: Who does what (without the GRACE row), What you will be asked, Enforced vs. advisory, Toolchain (Bun version, Layout, Commands, Pre-commit hook, Review gate), One-time setup, After a mission merge, Global footprint, Upgrading. Removed: the GRACE row; the `apps/docs` layout line; the `grace:lint`, `docs:build`, `docs:preview`, `test:e2e` command rows; hook step 5 (`grace lint`) and the docs sentence after the steps; the review-gate sentence about `verify.docs:build` / `verify.test:e2e`; the GRACE marketplace, `grace-cli` and Playwright setup lines; the GRACE CLI and Chromium footprint bullets; the GRACE upgrade bullet. Rewritten: the `verify` row ("version, format check, lint, typecheck, tests, the Telos check"), the `telos report` row ("Writes the semantic report of the repository model to the given path."), the `bunfig.toml` layout line, the pre-commit bullet ("lint, typecheck or test failure"). Links are relative to `tools/`: `../AGENTS.md`, `agents/settings/README.md`.
- `README.md`: the "Start here" section is replaced by the line `There is no product documentation until Telos is written by Telos. [`tools/README.md`](tools/README.md) covers setup, commands and checks.`; the `apps/docs` workspace line and the `bun run docs:build` command line are gone.
- `tools/agents/settings/README.md`, Setup paragraph: the link [`docs/tooling.md`](../../../docs/tooling.md) becomes [`tools/README.md`](../../README.md).
- `.githooks/pre-commit`: `fail "bun not found. See docs/tooling.md"` becomes `fail "bun not found. See tools/README.md"`. Nothing else in the hook changes.
- `.kittify/glossaries/team_domain.yaml`: `telos` drops ", see docs/foundation"; `check suite` ends "... typecheck, test and the Telos check (telos:check)."; `pre-commit hook` reads "... blocks the commit on lint, typecheck or test failure."; the `grace` term (4 lines) is deleted.

**Validation** (after T008's deletion, run again):

```sh
grep -n -E 'docs/|\.grace|grace|test:e2e|docs:build|playwright|chromium' -i tools/README.md   # prints nothing
grep -c 'tools/README.md' README.md tools/agents/settings/README.md .githooks/pre-commit       # each >= 1
```

---

### Subtask T006: Check the repository model and the closure scope

**Purpose**: FR-006 and FR-014. `telos:check` covers exactly the files that remain; the `report` command stays unchanged.

**What the patch does**:

- `telos.ts`: deletes the whole `export const docsSite = Module.make({ ... });` block (Locus `telos:docs-site`), removes `docsSite` from `repository.contains` (now `[kernel, cliPack, agentPack, webPack, calculator, tooling]`), and rewords `telos:repository`:
  - description: `"The Telos repository holds the framework, its packs and the calculator proof as one model."`
  - purpose: `"Holds the Telos framework, its packs and the calculator proof."`
  No other Locus, Rule or verification changes (C-002: M0 adds no Rule, Archetype or verification).
- `scripts/telos.ts`, `CLOSURE_SCOPE`: the seven `"apps/docs/..."` include globs and the two `"apps/docs/..."` exclude globs are gone (`exclude: ["**/node_modules/**", "**/*.d.ts"]`), and `aliases: []`.
- `scripts/telos.test.ts`: the test "the closure scope names the repository source globs and the docs alias" is renamed "... and no path alias" and asserts `expect(CLOSURE_SCOPE.aliases).toEqual([]);`. Its two `include` assertions stay.

The `report` command and its tests are not touched (Q3).

**Validation** (after T008):

```sh
bun test scripts/telos.test.ts                 # 0 fail
bun run telos list                             # no "telos:docs-site"; 12 loci
bun run telos:check                            # {"ok":true,...,"verification":{"passed":20,...},"closure":{"errors":0,"warnings":3,...}}
```

Expected `telos list` output exactly:

```json
{"loci":["calculator:agent","calculator:app","calculator:arithmetic","calculator:cli","calculator:web","telos:agent-pack","telos:calculator","telos:cli-pack","telos:kernel","telos:repository","telos:tooling","telos:web-pack"]}
```

---

### Subtask T007: Check the scripts and the configuration

**Purpose**: FR-003 (`grace:lint` script), FR-004 (doc-only scripts), FR-010.

**What the patch does**:

- `package.json`: deletes the scripts `grace:lint`, `docs:build`, `docs:preview` and `test:e2e`. `verify` stays as WP01 left it. No other script, dependency or field changes.
- `tsconfig.json`: deletes the reference `{ "path": "apps/docs" }`.
- `bunfig.toml`: deletes `".grace/**"` from `[lint]` and `[fmt]`, and every `"apps/docs/..."` entry from `[lint]`, `[fmt]` and `[test]`. All other entries stay.
- `.gitignore`: deletes the block `# docs app build output (locus-foundation)` with its eight `apps/docs/...` lines and the blank line after it. All other entries stay.

**Validation**:

```sh
grep -c -E 'grace|docs:|test:e2e' package.json      # 0
grep -c -E 'apps/docs|\.grace' tsconfig.json bunfig.toml .gitignore   # 0 for each file
```

---

### Subtask T008: Delete `apps/docs`, `docs/` and `.grace/`; refresh the lockfile

**Purpose**: FR-001, FR-002, FR-003; NFR-006 (removal-only lockfile change).

**Steps**:

1. Delete the folders from git and from disk (the disk delete also removes untracked build output and `node_modules` inside `apps/docs`):
   ```sh
   git rm -r -q apps/docs docs .grace
   rm -rf apps/docs docs .grace
   ```
   This deletes `docs/tooling.md`; its content now lives in `tools/README.md` (T005).
2. Update the lockfile. Use plain `bun install` here (not `--frozen-lockfile`), because the docs workspace has to leave the lockfile:
   ```sh
   bun install
   git diff --numstat -- bun.lock      # first column (added lines) must be 0; about 776 deleted
   ```
   If the added-lines column is not `0`, stop and report: a remaining dependency version changed, which NFR-006 and C-003 forbid. Do not try to fix it by editing `bun.lock`.
3. `bun run format` (expected: it changes no file, or only re-aligns Markdown tables in `tools/README.md`).

**Validation**:

```sh
git ls-files apps/docs docs .grace | wc -l      # 0
test -f tools/README.md && echo ok              # ok
grep -c '@telos/docs' bun.lock                  # 0
```

---

### Subtask T009: Run all checks and commit

**Steps**:

1. Run every check and record the outputs:
   ```sh
   bun run verify                    # exit 0; six steps; about 526 tests pass (846 minus the docs tests), 0 fail
   bun scripts/review-gate.ts /tmp/m0-wp02-gate.xml; echo "gate exit $?"   # 0
   bun $P check                      # "parity check passed: 105 code files, 14 commands, exports, model outputs and owner notes match baseline f95ae8d"
   git diff --numstat "$BASE" -- bun.lock   # added column 0
   ```
2. Reference search (NFR-005, as far as WP02 can go). It skips `.ts` comment lines, which WP03 removes:
   ```sh
   git ls-files \
     | grep -v -E '^(kitty-specs/|kitty-ops/|\.kittify/archive/|tools/agents/experiments/|tools/agents/usage/ledgers/|human-notes\.md$|\.kittify/charter/charter\.yaml$)' \
     | tr '\n' '\0' \
     | xargs -0 grep -n -E 'apps/docs|@telos/docs|docs/|\.grace|grace lint|grace:lint|docs:build|docs:preview|test:e2e|START_MODULE|START_CONTRACT|END_CONTRACT|START_BLOCK|END_BLOCK' \
     | grep -v -E '\.ts:[0-9]+:\s*//'
   ```
   Expected matches, and only these: `AGENTS.md` lines 21, 29, 37, 44, 47, 48, 49, 102, 112 (WP04 fixes them) and `apps/calculator/test/ergonomics.test.ts` lines 21 and 22 (WP03 deletes that file). Any other match is a miss of this WP: fix it if the file is owned here, otherwise report it.
3. Compare your text edits with the reference patch:
   ```sh
   git add -A
   git diff --cached -- . ':!apps/docs' ':!docs' ':!.grace' ':!bun.lock' | diff - "$PATCH" && echo same-as-reference
   ```
   It should print `same-as-reference` (it can differ only if `bun run format` re-aligned a table; then report the difference).
4. Check what is staged: `git status --short` must show only the owned paths (the deletions under `apps/docs/`, `docs/`, `.grace/`, the modified files from T005-T007, `bun.lock`, and `tools/README.md`, which git may show as a rename from `docs/tooling.md`). Nothing under `kitty-specs/`. If anything else is staged, unstage it with `git restore --staged <path>`.
5. Commit (the hook runs; let it):
   ```sh
   git commit -m "chore(repo): remove the docs site, the docs folder and GRACE" \
     -m "Move the setup and tooling guide from docs/tooling.md to tools/README.md, drop the docs-site Locus and the docs closure scope, and drop the doc-only scripts and configuration entries."
   ```
6. Hand the WP to review as your Spec Kitty workflow says, and record `spec-kitty agent tasks mark-status T005 T006 T007 T008 T009 --status done --mission m0-cleanup-01M5SPZC`.

## Definition of Done

- `git ls-files apps/docs docs .grace` lists nothing; `tools/README.md` exists with the content of the reference patch.
- `package.json` has no `grace:lint`, `docs:build`, `docs:preview`, `test:e2e`; `verify` is unchanged from WP01.
- `tsconfig.json`, `bunfig.toml`, `.gitignore` name no `apps/docs` or `.grace` path.
- `telos.ts` has no `docsSite`; `bun run telos list` prints the 12 loci above; `telos:check` is ok with 20 verifications passed.
- `bun.lock` diff: 0 added lines.
- `bun run verify` exits 0; the review gate exits 0; `bun $P check` passes.
- The reference search shows only the expected `AGENTS.md` and ergonomics-test lines.
- One commit with message `chore(repo): remove the docs site, the docs folder and GRACE`, made with the hook running; nothing under `kitty-specs/` staged.

## Risks

- `bun install` could change a kept dependency. The numstat check catches it; stop and report rather than editing the lockfile.
- A forgotten reference makes `typecheck` or `telos:check` fail on the deleted folder. The patch was rehearsed; if a check fails, read its first error line and report it with the file name.
- `rm -rf` is limited to `apps/docs`, `docs` and `.grace`. Never widen it.

## Reviewer Guidance

- `git show --stat <commit> -- . ':!apps/docs' ':!docs' ':!.grace'` lists only the owned files.
- The text diff equals `contracts/patches/wp02-edits.patch` (command in T009 step 3, with `git diff <commit>~1 <commit>` instead of `--cached`).
- `git diff --numstat <commit>~1 <commit> -- bun.lock` shows `0` added.
- Read `tools/README.md` against `docs/tooling.md` at `<commit>~1`: nothing useful lost except docs and GRACE content (spec Q1).
- Run `bun run verify`, `bun scripts/review-gate.ts /tmp/g.xml`, `bun kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts check`.

## Report

End with: result, changed files (grouped: deleted folders, edited files, new file), each check command and its outcome (test count, gate exit, parity line, lockfile numstat, reference-search output), the commit hash, and any unresolved issue.

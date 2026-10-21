---
work_package_id: WP02
title: Hook bookkeeping rule, ignore list, guard scripts and docs
dependencies: []
requirement_refs:
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- FR-009
- NFR-002
- NFR-003
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts for this mission were generated on feat/bun-monorepo-toolchain. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/bun-monorepo-toolchain unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-toolchain-hardening-01M5EFAX
base_commit: 28c7f2fc1b79e1ba3548c24ff6e66924efe11094
created_at: '2026-10-21T05:41:23.333021+00:00'
subtasks:
- T006
- T007
- T008
- T009
- T010
- T011
phase: Phase 1 - Hardening
history:
- at: '2026-10-21T05:50:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: .githooks/pre-commit
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- .githooks/pre-commit
- package.json
- .gitignore
- docs/tooling.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Hook bookkeeping rule, ignore list, guard scripts and docs

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

Four small, independent changes (FR-004..FR-009, NFR-002, NFR-003):

1. `.githooks/pre-commit` exits 0 silently, without installed dependencies, when at least one path is staged and **every** staged path is under `kitty-specs/` or `.kittify/`. Spec Kitty's bookkeeping commits in coordination and lane worktrees (which have no `node_modules/`) are blocked today.
2. `.gitignore` ignores `.spec-kitty/`.
3. The `lint`, `typecheck` and `test` scripts run the Bun version guard first.
4. `docs/tooling.md` describes the hook rule and the gate behavior.

Done means each change works as the acceptance table below says, `bun run verify` still exits 0, and the full hook still runs in under 5 s.

## Context & Constraints

Read, in this order:

- `kitty-specs/002-toolchain-hardening-01M5EFAX/contracts/hook-bookkeeping.md` (**authoritative** for the hook)
- `kitty-specs/002-toolchain-hardening-01M5EFAX/contracts/review-gate-report.md` (for the docs text)
- `kitty-specs/002-toolchain-hardening-01M5EFAX/research.md` R-03, R-04, R-05
- `.githooks/pre-commit`, `package.json`, `.gitignore`, `docs/tooling.md`
- `AGENTS.md` (Conventional Commits, no AI author lines, no `--no-verify`)

Hard rules:

- Only these files change: `.githooks/pre-commit`, `package.json`, `.gitignore`, `docs/tooling.md`. `.githooks/commit-msg` must stay byte-identical (compare `sha256` before and after).
- No new dependency, no CI, no fake tests.
- **Do not edit or delete anything under `kitty-specs/` in your lane worktree** (the review gate rejects it). Record evidence in your final report and commit bodies.
- **Test the hook only in a throwaway clone** under `/private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/ca615710-6f3b-44bf-bbd6-219a016818ad/scratchpad/` with `git config core.hooksPath` set **in the clone only**. Never change git config of the real repository or your worktree. Delete the clone at the end.
- No `--force`, no `--no-verify`, no push. Do not touch `AGENTS.md`, `CLAUDE.md`, the charter or `.kittify/config.yaml`.
- Commit messages: Conventional Commits, no AI names, no `Co-Authored-By` line.

## Branch Strategy

- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP02 --agent claude` and work only inside the worktree it gives you. Run `bun install` there first.

## Subtasks & Detailed Guidance

### Subtask T006 – Bookkeeping early exit in the hook

**File**: `.githooks/pre-commit`. Current beginning (keep as is):

```sh
fail() { ... }

cd "$(git rev-parse --show-toplevel)" || fail "cannot find the repository root"

command -v bun >/dev/null 2>&1 || fail "bun not found. See docs/tooling.md"
```

Insert **between** the `cd` line and the `command -v bun` line:

```sh
# Spec Kitty bookkeeping commits touch only kitty-specs/ and .kittify/, which no check covers.
# They must pass in worktrees without installed dependencies.
staged=$(git diff --cached --name-only)
if [ -n "$staged" ] && ! printf '%s\n' "$staged" | grep -q -v -E '^(kitty-specs|\.kittify)/'; then
  exit 0
fi
```

How it works: `grep -q -v` succeeds when any staged line does **not** start with `kitty-specs/` or `.kittify/`; the `!` makes the condition true only when there is no such line. A path with spaces stays one line. Do not change any other line of the hook. Keep the file executable (`git ls-files -s .githooks/pre-commit` must still show `100755`).

### Subtask T007 – Guard first in the single-check scripts

**File**: `package.json`, `scripts` only. Change exactly these three values:

```json
"typecheck": "bun run check:bun && bun check -b",
"lint": "bun run check:bun && bun lint --no-script",
"test": "bun run check:bun && bun test --pass-with-no-tests",
```

Leave every other script unchanged (`lint:fix`, `format`, `format:check`, `grace:lint`, `verify`, `preinstall`, `check:bun`). Confirm `bun run lint`, `bun run typecheck`, `bun run test` still pass. Note: the hook and `scripts/review-gate.ts` call the built-in commands directly, so they are unaffected.

### Subtask T008 – Ignore `.spec-kitty/`

**File**: `.gitignore`. The first line is `node_modules/`. Add a line `.spec-kitty/` directly below it, **above** the `# Added by Spec Kitty CLI (auto-managed)` block. Do not touch the auto-managed block. Check: create `.spec-kitty/review-lock.json` (any small JSON), `git status --short` must not list it; leave the file in place if it already existed, otherwise delete it.

### Subtask T009 – Update `docs/tooling.md`

Find the "Toolchain" section and the paragraphs on the pre-commit hook and the review gate (`grep -n -i "hook\|review gate" docs/tooling.md`). Make these edits, keeping the file's style, then run `bun fmt --no-script docs/tooling.md` and confirm `bun run format:check` exits 0:

1. In the hook description add: commits that stage only files under `kitty-specs/` or `.kittify/` (Spec Kitty's bookkeeping commits) pass without running the checks and without installed dependencies; any other staged path brings back the full checks, including the "dependencies not installed" message.
2. In the review gate description add: the report is always well-formed; escape codes and other characters XML cannot represent are removed from messages; a failed check's message shows the first real error line of that check; the checks run without colour.
3. In the command table, no change is needed for the scripts, but mention (one sentence, where the table or the Bun-version text is) that the `lint`, `typecheck` and `test` commands also refuse an unsupported Bun.
4. Do not add statements about CI. Do not change the "under two seconds" hook timing sentence unless it is now wrong (a bookkeeping-only commit is faster; the full run is still under 2 s warm).

### Subtask T010 – Prove the hook scenarios in a throwaway clone

1. Commit your work in the worktree first (T006–T009). Then `git clone <worktree path> <scratch>/hookclone`, `cd` into the clone, set `git config core.hooksPath "$(pwd)/.githooks"` **there**, set `git config user.name`/`user.email` to any values, and `bun install` once.
2. Run these cases and record the **verbatim** result of each (exit code, message, wall time via `time`):

| # | Setup | Expected |
|---|---|---|
| 1 | `mv node_modules node_modules.off`; stage one change to a file under `kitty-specs/` | commit succeeds, hook prints nothing, under 2 s |
| 2 | `node_modules` still off; stage a change under `.kittify/` and a change under `kitty-specs/` | commit succeeds |
| 3 | `node_modules` still off; stage `kitty-specs/...` plus `scripts/x.ts` (`export const a = 1;`) | blocked: `pre-commit: dependencies not installed. Run: bun install` |
| 4 | `node_modules` still off; stage `kitty-specs-extra/a.md` (create the folder) | blocked with the same message |
| 5 | `mv node_modules.off node_modules`; stage `kitty-specs/...` plus `scripts/x.ts` containing `debugger;` | blocked: `pre-commit: lint failed` |
| 6 | `node_modules` on; stage only `docs/tooling.md` with a harmless line | commit succeeds (full checks), record the time (must be under 5 s) |
| 7 | `node_modules` off; stage a file under `kitty-specs/` with message `update stuff` | blocked by `commit-msg: subject does not follow Conventional Commits` |

Use valid Conventional Commit messages (for example `chore: probe`) in cases 1–6. After the cases, delete the clone.

### Subtask T011 – Check the synced documents; run everything

1. The orchestrator already updated, on the planning branch, `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md`, `.../contracts/review-gate.md` and `.../data-model.md`. **Read-only check**: confirm the data model's `[lint]` row lists `.spec-kitty` and that `bunfig.toml` ignores `.spec-kitty/**` in both `[lint]` and `[fmt]`. Report a mismatch, do not edit `kitty-specs/`.
2. Run `bun run verify` (exit 0), `bun run lint`, `bun run typecheck`, `bun run test` individually (exit 0), `grace lint --path . --assertions current` (0 errors).
3. Confirm `.githooks/commit-msg` is unchanged: `git diff <merge-target>...HEAD -- .githooks/commit-msg` is empty.
4. `git status --porcelain` shows only your four owned files before the commit and is clean after.

## Definition of Done

- [ ] Hook early exit added exactly as specified; `.githooks/pre-commit` still `100755`; all seven T010 cases behave as expected, with the recorded output.
- [ ] `lint`, `typecheck`, `test` scripts run the guard first; other scripts unchanged.
- [ ] `.spec-kitty/` ignored; `git status` does not list a `.spec-kitty/` file.
- [ ] `docs/tooling.md` updated and formatted; `bun run format:check` exits 0.
- [ ] `bun run verify` and `grace lint` pass; `.githooks/commit-msg` unchanged.
- [ ] Only the four owned files changed; Conventional Commits, no AI attribution.

## Risks & Mitigations

- **Over-broad match**: the pattern requires the slash, so `kitty-specs-extra/` falls through to the full checks (case 4).
- **Quoted paths**: git quotes non-ASCII paths; they do not match and fall through to the full checks, which is the safe direction.
- **Hook not active in your worktree**: expected (`core.hooksPath` points at the primary checkout). Only the throwaway clone exercises it.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Reproduce at least cases 1, 3, 4 and 5 yourself in your own throwaway clone; time case 1.
- Confirm the hook diff is only the inserted block, the mode is still `100755`, and `commit-msg` is unchanged.
- Run `bun run lint`, `typecheck`, `test` and check they run the guard first (`bun run lint` output starts with the guard command).
- Check `docs/tooling.md` against the two contracts in `kitty-specs/002-toolchain-hardening-01M5EFAX/contracts/`.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`. Lane workspaces may not edit `kitty-specs/`; put evidence in the final report.

- 2026-10-21T05:50:00Z – system – Prompt created.

---
work_package_id: WP05
title: Pre-commit hook and end-to-end check
dependencies:
- WP01
- WP02
- WP03
- WP04
requirement_refs:
- C-003
- FR-008
- NFR-002
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts for this mission were generated on feat/bun-monorepo-toolchain. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/bun-monorepo-toolchain unless the human explicitly redirects the landing branch.
subtasks:
- T021
- T022
- T023
- T024
- T025
phase: Phase 4 - Enforcement
history:
- at: '2026-10-21T03:16:03Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: .githooks/pre-commit
create_intent:
- .githooks/pre-commit
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- .githooks/pre-commit
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP05 – Pre-commit hook and end-to-end check

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, mid to max effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

- **Has review feedback?**: Check the `review_ref` field in the event log (via `spec-kitty agent tasks status --mission bun-monorepo-toolchain-01M5E4T4`) or the Activity Log below.
- **You must address all feedback** before your work is complete.

---

## Review Feedback

*[If this WP was returned from review, the reviewer feedback reference appears in the Activity Log below or in the status event log.]*

---

## Objectives & Success Criteria

Add the `pre-commit` hook (FR-008, NFR-002, SC-002) and run the mission's end-to-end check: everything from WP01–WP04 works together.

Done means:

1. `.githooks/pre-commit` exists, is executable, and matches `contracts/pre-commit-hook.md`.
2. Every acceptance example in the hook contract behaves as specified, tested in a **throwaway clone**.
3. The hook takes under 5 s on the skeleton.
4. `bun run verify` and `bun scripts/review-gate.ts <file>` pass on the merged skeleton, and `git status` stays clean (NFR-001, NFR-003).
5. `.githooks/commit-msg` is unchanged (C-003).

## Context & Constraints

- `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md` (**authoritative**)
- `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/contracts/commands.md`, `contracts/review-gate.md`
- `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/quickstart.md`
- `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/research.md`: R-06, R-09
- `.githooks/commit-msg`: copy its style (POSIX `sh`, `fail()` helper, prefix in messages)

Hard rules:

- **Test the hook only in a throwaway clone.** This repo's `core.hooksPath` points at the primary checkout's `.githooks/`, so your new hook is not active in your worktree until it is merged. Do not change git config in the real repo.
- No `--no-verify` anywhere, in messages or instructions.
- Do not edit any file outside `.githooks/pre-commit`. If the end-to-end check finds a defect in another WP's file, record it in the Activity Log and report it as a blocker; do not fix it here.
- Conventional Commits, e.g. `feat(hooks): add pre-commit format, lint, typecheck, test and grace checks`. No AI names.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on `feat/bun-monorepo-toolchain`; completed changes must merge back into `feat/bun-monorepo-toolchain`.
- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP05 --agent claude`.

## Before you start

```sh
bun install
bun run verify      # all WP01–WP04 work is in your base; this must exit 0
```

If `verify` fails, stop and report which step failed. Your WP depends on it.

## Subtasks & Detailed Guidance

### Subtask T021 – Write the hook

Create `.githooks/pre-commit` with exactly this content, then `chmod +x .githooks/pre-commit`:

```sh
#!/bin/sh
# Format and restage staged files, then block the commit on any check failure.
# Contract: kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md
# Enabled per clone: git config core.hooksPath "$(git rev-parse --show-toplevel)/.githooks"

fail() {
  echo "pre-commit: $1" >&2
  exit 1
}

cd "$(git rev-parse --show-toplevel)" || fail "cannot find the repository root"

command -v bun >/dev/null 2>&1 || fail "bun not found. See docs/tooling.md"
bun scripts/check-bun-version.ts || exit 1
[ -d node_modules ] || fail "dependencies not installed. Run: bun install"

bun fmt --no-script --staged || fail "format failed"
bun lint --no-script --staged || fail "lint failed"
bun check -b || fail "typecheck failed"
bun test --pass-with-no-tests || fail "tests failed"

command -v grace >/dev/null 2>&1 || fail "grace not found. See docs/tooling.md"
grace lint --path . --assertions current || fail "grace lint failed"
```

Check that `git ls-files -s .githooks/pre-commit` shows mode `100755` after you stage it.

### Subtask T022 – Set up a throwaway clone

```sh
W=$(git rev-parse --show-toplevel)
T=$(mktemp -d)/clone
git clone -q "$W" "$T"
cp "$W/.githooks/pre-commit" "$T/.githooks/pre-commit"   # in case it is not committed yet
cd "$T"
git config core.hooksPath "$T/.githooks"
bun install
```

### Subtask T023 – Run the hook acceptance examples

In `$T`, run each case, record the exit code and the `pre-commit:` line, then reset with `git reset -q --hard HEAD` (plus `git reset -q --hard HEAD~1` after a successful commit) and delete the temporary files.

| # | Staged change | Expected |
|---|---|---|
| 1 | `scripts/x.ts`: `export const a = {b:1}` | commit succeeds; `git show HEAD:scripts/x.ts` is `export const a = { b: 1 };` |
| 2 | `scripts/x.ts`: `debugger;` | blocked, `pre-commit: lint failed` |
| 3 | `scripts/x.ts`: `export const n: number = "x";` | blocked, `pre-commit: typecheck failed` |
| 4 | `scripts/x.test.ts` with `import { expect, test } from "bun:test"; test("f", () => { expect(1).toBe(2); });` | blocked, `pre-commit: tests failed` |
| 5 | a one-line edit to `docs/tooling.md` (a new paragraph `Test.`) | commit succeeds |
| 6 | any change, after `mv node_modules ../nm` (move it back afterwards) | blocked, `pre-commit: dependencies not installed. Run: bun install` |
| 7 | any change, commit message `update stuff` | blocked by the commit-msg hook (`commit-msg:` message) |

Use `git add -A && git commit -q -m "chore: try"` (except case 7). Time one successful commit with `time git commit …` and record it (must be < 5 s).

### Subtask T024 – End-to-end mission check

In `$T` (clean state):

```sh
bun install --frozen-lockfile
bun run verify; echo verify=$?
R=$(mktemp -d)/junit.xml; bun scripts/review-gate.ts "$R"; echo gate=$?
git status --porcelain      # must be empty
grep -n "review:" -A3 .kittify/config.yaml
grace status --path . --json | python3 -c "import json,sys;print(json.load(sys.stdin)['summary'])"
```

Expected: verify=0, gate=0 with six `PASS verify.*` lines, empty status, the three review keys, 2 ready modules. Then read `docs/tooling.md`'s Toolchain section and confirm every command and message matches what you observed. Record any mismatch as a finding for the owner. Do not fix it here.

### Subtask T025 – Clean up and record

- Delete the throwaway clone (`rm -rf "$(dirname "$T")"`).
- In the Activity Log, record the results table for T023, the commit timing, and the T024 outputs.
- Note for the owner: after this mission merges, run `bun install` once in the primary checkout. The hook needs `node_modules/` there, because Spec Kitty also commits in the primary checkout.

## Definition of Done

- [ ] Hook file exact, executable (`100755`).
- [ ] All 7 acceptance cases behave as expected; commit time < 5 s.
- [ ] T024 end-to-end check green; docs match observed behavior (or mismatches recorded).
- [ ] `.githooks/commit-msg` unchanged; only `.githooks/pre-commit` added.

## Risks & Mitigations

- **Hook not active in the worktree**: expected, see the hard rules. Always test in the clone.
- **Spec Kitty commits pass through the hook**: they only touch `kitty-specs/` and `.kittify/`, which `bunfig.toml` ignores, so format and lint are no-ops. Typecheck, tests and grace still run (~0.5 s).
- **Partially staged files**: `bun fmt --staged` restages whole files. This is documented in `docs/tooling.md`, not worked around.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Re-run at least cases 1, 3 and 6 of T023 in your own throwaway clone.
- Run T024 yourself. This is the mission's last WP; the whole suite must be green.
- After all WPs are merged, the mission review runs on Claude Opus at high effort (`/spec-kitty-mission-review`).

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`.

- 2026-10-21T03:16:03Z – system – Prompt created.

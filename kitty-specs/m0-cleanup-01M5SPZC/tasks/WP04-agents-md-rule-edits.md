---
work_package_id: WP04
title: Apply the owner-approved AGENTS.md edits
dependencies:
- WP02
requirement_refs:
- FR-015
- NFR-005
- C-004
planning_base_branch: feat/m0-cleanup
merge_target_branch: feat/m0-cleanup
branch_strategy: Planning artifacts for this mission were generated on feat/m0-cleanup. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/m0-cleanup unless the human explicitly redirects the landing branch.
subtasks:
- T014
- T015
- T016
phase: Phase 3 - Agent rules
history:
- at: '2026-10-25T17:25:46Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: AGENTS.md
create_intent: []
execution_mode: code_change
model: ''
owned_files:
- AGENTS.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP04 – Apply the owner-approved AGENTS.md edits

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

Apply exactly the eleven `AGENTS.md` edits the owner approved (spec, section "Owner-approved rule edits", subsection "`AGENTS.md`"), in one dedicated commit, and nothing else. After this WP the agent rules no longer point at removed files, no longer route to GRACE, and forbid new code comments.

`AGENTS.md` is an owner-only file. The owner authorized exactly these edits for this mission (spec C-004). Any other change to it, and any change to `CLAUDE.md`, `.kittify/config.yaml` or `human-notes.md`, is out of scope.

## Context

- Spec: `kitty-specs/m0-cleanup-01M5SPZC/spec.md`, FR-015, User Story 4, and "Owner-approved rule edits" items 1-11.
- Why after WP02: the docs test `apps/docs/test/guides.test.ts` read `AGENTS.md` lines; it is gone once WP02 is in.
- WP03 runs in parallel in another lane and touches only `.ts` files; there is no overlap.
- **Reference patch**, rehearsed (hook passed): `kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp04-agents.patch`.
- `AGENTS.md` is excluded from the formatter (`bunfig.toml`), so `bun run format` will not touch it.

## Branch Strategy

- **Planning base branch**: `feat/m0-cleanup`
- **Merge target branch**: `feat/m0-cleanup`
- Execution worktrees are allocated per computed lane from `kitty-specs/m0-cleanup-01M5SPZC/lanes.json`. Work only in the lane worktree that `spec-kitty agent action implement WP04 --agent claude` gives you.

## Rules for this WP

- Work in the lane worktree. Run every command from its root.
- **Preflight (stop if it fails).** `git config --get core.hooksPath` must print exactly `.githooks`. Otherwise stop and report "P1 precondition not met".
- Check that WP02 is present: `test ! -e apps/docs && test -f tools/README.md && echo wp02-present`. If not, stop and report.
- Run `bun install --frozen-lockfile` once before anything else.
- Never use `--no-verify`, `--force`, `--skip-*` or any `*_DISABLE` variable.
- Do not touch the Spec Kitty block at the top of `AGENTS.md` (lines 1-17, from `<!-- spec-kitty:orientation -->` to `<!-- /spec-kitty:orientation -->`).
- Do not edit or stage anything except `AGENTS.md`. Never edit `CLAUDE.md`, `.kittify/config.yaml`, `human-notes.md` or anything under `kitty-specs/`.
- The current `AGENTS.md` rules about GRACE do not apply to this mission (they are what you remove).
- Commit message rules: Conventional Commits, no AI names, no co-author lines.

### Baseline

```sh
bun run verify     # exit 0
git status --short # empty
```

---

### Subtask T014: Apply edits 1-11

**Steps**:

1. Apply the reference patch:
   ```sh
   PATCH=kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp04-agents.patch
   git apply --check "$PATCH" && git apply "$PATCH"
   ```
2. If `git apply --check` fails (for example because Spec Kitty rewrote the top block), make the edits by hand with exact string replacement, using the table below. Each "old" text occurs exactly once in `AGENTS.md`. Say in your report that you edited by hand.

| # | Where | Old text | New text |
| --- | --- | --- | --- |
| 1 | intro paragraph under `# Agent rules` | `The owner-facing overview is `docs/tooling.md`.` | `The owner-facing overview is `tools/README.md`.` |
| 2 | section `## Telos foundation` | the heading line `## Telos foundation`, the blank line after it, and the paragraph that starts `Telos by UnknownLab is defined in `docs/foundation/README.md`` | the single line `There is no product documentation until Telos is written by Telos. Product terms are used as they appear in the code.` (a plain paragraph, no heading; the blank line before `## Read state before working` stays) |
| 3 | `## Read state before working`, bullet list | the line `- if `.grace/` exists: `grace status --path . --json`` | (line deleted) |
| 4 | `## Routing`, bullet "Questions, investigation, explanation" | `answer directly. When `.grace/` exists, use `grace-ask` and `grace-cli`.` | `answer directly.` |
| 5 | `## Routing` | the whole bullet line that starts `- **GRACE** owns architecture knowledge and its validation` | (line deleted) |
| 6 | `## Routing` | `- **Spec Kitty** owns the change lifecycle. Do not use `grace-spec`, `grace-plan`, `grace-execute`, `grace-setup-subagents`, or `.grace/changes/`. The mission is the change record.` | `- **Spec Kitty** owns the change lifecycle. The mission is the change record.` |
| 7 | `## Routing` | the whole bullet line that starts `- If `.grace/` is absent, do not create it yourself.` | (line deleted) |
| 8 | `## Owner decisions`, bullet "Architecture" | `adding or upgrading dependencies, `grace-init`.` | `adding or upgrading dependencies.` |
| 9 | `## Verification`, third bullet | ` Add `grace lint` when `.grace/` exists.` (with its leading space) | (deleted; the sentences before and after now follow each other with one space) |
| 10 | `## Git and setup`, last bullet | `- If `spec-kitty`, `grace`, or the project skills are missing on a machine, point the owner to the one-time setup in `docs/tooling.md` instead of installing anything globally.` | `- If `spec-kitty` or the project skills are missing on a machine, point the owner to the one-time setup in `tools/README.md` instead of installing anything globally.` |
| 11 | `## Verification`, new last bullet, directly after the bullet that ends `Never bypass a gate on your own.` | (nothing) | `- Write no code comments. The only exceptions are owner review notes (`//@unknownhero`) and directives the toolchain reads, such as `@ts-expect-error`.` |

**Validation**: `git diff --stat` shows `AGENTS.md | 20 ++++++++------------` (8 insertions, 12 deletions).

---

### Subtask T015: Check the diff and run the checks

**Steps**:

```sh
git diff -- AGENTS.md | diff - kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp04-agents.patch && echo same-as-reference
grep -n -E 'grace|\.grace|docs/' AGENTS.md          # prints nothing
grep -c 'tools/README.md' AGENTS.md                  # 2
sed -n 1,17p AGENTS.md | diff - <(git show HEAD:AGENTS.md | sed -n 1,17p) && echo top-block-unchanged
git status --short                                   # only " M AGENTS.md"
bun run verify                                       # exit 0
```

If you edited by hand, `same-as-reference` must still print; if it does not, compare line by line with the table and fix.

---

### Subtask T016: Commit as one dedicated commit

**Steps**:

1. Stage only `AGENTS.md` and commit (the hook runs; let it):
   ```sh
   git add AGENTS.md
   git commit -m "chore(agents): drop docs and GRACE rules from the agent rules" \
     -m "Apply the owner-approved AGENTS.md edits 1-11 of mission m0-cleanup-01M5SPZC: point to tools/README.md, drop the foundation section and every GRACE route, and add the no-comments rule."
   ```
2. `git show --stat HEAD` must list only `AGENTS.md`.
3. Hand the WP to review as your Spec Kitty workflow says, and record `spec-kitty agent tasks mark-status T014 T015 T016 --status done --mission m0-cleanup-01M5SPZC`.

## Definition of Done

- `AGENTS.md` differs from its base exactly by `contracts/patches/wp04-agents.patch` (edits 1-11).
- The Spec Kitty block (lines 1-17) is unchanged.
- `AGENTS.md` contains no `grace`, `.grace` or `docs/`.
- `bun run verify` exits 0.
- One commit touching only `AGENTS.md`, message `chore(agents): drop docs and GRACE rules from the agent rules`, made with the hook running.

## Risks

- An extra or missing word changes an owner-approved rule. The patch comparison catches it.
- A Spec Kitty upgrade could rewrite the top block before this WP runs; then the patch context fails and the hand-edit table applies. Never edit the top block.

## Reviewer Guidance

- Compare the commit with the spec's 11 edits item by item: `git diff <commit>~1 <commit> -- AGENTS.md`.
- `git diff <commit>~1 <commit> -- AGENTS.md | diff - kitty-specs/m0-cleanup-01M5SPZC/contracts/patches/wp04-agents.patch` prints nothing.
- `git show --stat <commit>` lists only `AGENTS.md`.

## Report

End with: result, whether the patch applied or you edited by hand, each check command and its outcome, the commit hash, and any unresolved issue.

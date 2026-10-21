---
work_package_id: WP03
title: Tooling documentation
dependencies:
- WP01
requirement_refs:
- FR-011
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts for this mission were generated on feat/bun-monorepo-toolchain. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/bun-monorepo-toolchain unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
- T016
phase: Phase 2 - Gates
history:
- at: '2026-10-21T03:16:03Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: docs/
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- docs/tooling.md
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Tooling documentation

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, mid to max effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer or documentation profile.

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

Update `docs/tooling.md`, the owner-facing overview, so it describes the Bun toolchain this mission ships (FR-011, charter DIRECTIVE_037 living documentation). Then format it with `bun fmt` so `format:check` is clean before the hook and the review gate start enforcing it.

Done means:

1. `docs/tooling.md` covers: the Bun canary minimum and how to upgrade, the workspace layout, the command table, the pre-commit hook (including whole-file restaging), the review gate, and GRACE as active.
2. No statement says the toolchain or code checks do not exist yet, or that CI will be added.
3. `bun run format:check` exits 0 for the whole repo.
4. Only `docs/tooling.md` changed.

## Context & Constraints

Write from the contracts. They are authoritative, and the code they describe is built in parallel (WP02, WP04, WP05).

- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/commands.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/review-gate.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/quickstart.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/research.md`: R-01 (canary), R-07 (format scope), R-08 (GRACE), R-09 (fresh worktrees)

Hard rules:

- Keep the file's style: plain, short sentences, second person ("you"), no marketing words.
- Keep every existing section that is still true (Who does what, What you will be asked, Global footprint, Upgrading). Change only what this mission makes stale, plus the new section.
- **Do not edit `AGENTS.md`**. It is a governance file; editing it is an owner decision.
- Conventional Commits, e.g. `docs(tooling): document the bun toolchain, hook and review gate`. No AI names. Never `--no-verify`.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on `feat/bun-monorepo-toolchain`; completed changes must merge back into `feat/bun-monorepo-toolchain`.
- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP03 --agent claude`.

## Before you start

```sh
bun install
bun run format:check    # expected now: lists docs/tooling.md only
```

## Subtasks & Detailed Guidance

### Subtask T013 – Update the stale statements

Make these edits in `docs/tooling.md`:

1. **Who does what** table, GRACE row: replace `Inactive until you approve \`grace-init\`` with `Active: \`.grace/\` models the code modules, and \`grace lint\` runs in the pre-commit hook and the review gate`.
2. **Enforced vs. advisory**, the "Enforced by the tools" list: add two bullets after the `commit-msg` bullet:
   - `The \`pre-commit\` hook in \`.githooks/\` formats and restages your staged files, then blocks the commit on any lint, typecheck, test or \`grace lint\` failure. See [Toolchain](#toolchain).`
   - `Spec Kitty's review gate runs the whole check suite through \`scripts/review-gate.ts\` and blocks a review on any new failure (\`review:\` in \`.kittify/config.yaml\`).`
3. In the advisory list, change `running typecheck, lint, format, tests and \`grace lint\`` to `running \`bun run verify\` before review, accept and merge`.
4. Replace the paragraph that starts `Not in place yet: CI and code checks` with: `No CI, by owner decision. All checks run locally, in the pre-commit hook and in Spec Kitty's review gate.`

### Subtask T014 – Add the Toolchain section

Insert this section directly **before** `## One-time setup on a new machine or fresh clone`. Keep the wording; you may only fix a fact that contradicts a contract (record any such fix in the Activity Log).

````markdown
## Toolchain

The repository is a Bun workspaces monorepo. Bun is the only tool: package manager, test runner, type checker (`bun check`), linter (`bun lint`) and formatter (`bun fmt`). There is no Turborepo, Nx, ESLint or Prettier.

### Bun version

You need Bun `1.4.4-canary.1` or later, because `bun lint` and `bun fmt` exist only in canary builds so far. The minimum lives in `engines.bun` in `package.json`. Bun does not enforce that field, so `scripts/check-bun-version.ts` does: `bun install`, `bun run verify` and the pre-commit hook stop on an older Bun with:

```text
Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary
```

### Layout

- `apps/`: applications, one directory per app.
- `packages/`: library packages, one directory per package.
- `scripts/`: repository scripts (the version guard and the review gate runner).
- `tsconfig.base.json`: strict compiler options shared by every package. `tsconfig.json` at the root checks `scripts/` and lists packages under `references`.
- `bunfig.toml`: linter and formatter settings. Spec Kitty, GRACE and generated files are excluded from both.

Both areas are empty for now. A new package gets its own `package.json`, a reference `{ "path": "<area>/<name>" }` in the root `tsconfig.json`, and this `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "emitDeclarationOnly": true
  },
  "include": ["src"]
}
```

`bun run typecheck` checks every referenced package and writes no files.

### Commands

Run them from the repository root.

| Command | What it does |
| --- | --- |
| `bun install` | Installs dependencies. Run it once per clone and once in every Spec Kitty worktree. |
| `bun run verify` | The whole check suite: version, format check, lint, typecheck, tests, `grace lint`. Stops at the first failure. |
| `bun run typecheck` | `bun check -b`: the root and every referenced package. |
| `bun run lint` / `bun run lint:fix` | Lint, or lint and apply safe fixes. Warnings do not fail. |
| `bun run format` / `bun run format:check` | Format files, or only report unformatted files. |
| `bun run test` | `bun test`. Passes when no test files exist. |
| `bun run grace:lint` | `grace lint --path . --assertions current`. |
| `bun run check:bun` | The version guard alone. |

### Pre-commit hook

`.githooks/pre-commit` runs on every commit once `core.hooksPath` is set (see setup). In order, it:

1. checks that Bun is installed and new enough, and that `node_modules/` exists,
2. formats your staged files and stages the result (`bun fmt --staged`),
3. lints your staged files (`bun lint --staged`),
4. type-checks and tests the whole repository,
5. runs `grace lint`.

Any failure stops the commit with a `pre-commit:` message. On the empty skeleton the hook takes about half a second.

Formatting restages whole files. If you staged only part of a file, the rest of that file is committed too.

### Review gate

Spec Kitty runs `bun scripts/review-gate.ts` when a work package goes to review. It runs every check, writes one JUnit report with a test case per check (`verify.lint`, `verify.typecheck`, and so on) plus every `bun test` result, and Spec Kitty blocks the review on any failure that is not already failing on the base branch.
````

### Subtask T015 – Update setup, then format

1. In the setup code block, replace the line
   `bun upgrade && bun add -g @osovv/grace-cli    # the grace CLI needs Bun >= 1.3.14`
   with these two lines:

   ```sh
   bun upgrade --canary && bun add -g @osovv/grace-cli    # Bun >= 1.4.4-canary.1; also installs the grace CLI
   bun install    # project dependencies; repeat in every Spec Kitty worktree
   ```

2. Change the comment on the `git config core.hooksPath` line from `# commit message checks` to `# commit-msg and pre-commit hooks`.
3. Run `bun run format` (or `bun fmt --no-script docs/tooling.md`). The formatter adds blank lines around lists and may normalize tables. That is expected.
4. Run `bun run format:check`. It must exit 0 and list nothing.

### Subtask T016 – Check and record

- Run `git diff --stat`. Only `docs/tooling.md` may appear.
- Re-read the whole file once. Every command and message must match the contracts exactly (`pre-commit:` prefix, `bun upgrade --canary`, script names).
- In the Activity Log, record:
  - the `format:check` result,

## Definition of Done

- [ ] T013 edits made; no "not in place yet" or "adds CI" statements remain.
- [ ] Toolchain section inserted before the setup section.
- [ ] Setup block updated; file formatted; `bun run format:check` exits 0.
- [ ] Only `docs/tooling.md` changed; `format:check` result recorded.

## Risks & Mitigations

- **Docs describe code that lands in parallel WPs**: the contracts are the source. WP05's end-to-end check re-reads this file against the shipped hook and gate.
- **Formatter changes tables**: harmless. Keep the content and accept the formatting.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Check each command, message and file path against `contracts/commands.md`, `contracts/pre-commit-hook.md` and `contracts/review-gate.md`.
- Confirm `bun run format:check` exits 0 in the worktree.
- Confirm `AGENTS.md` is unchanged.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>`.

- 2026-10-21T03:16:03Z – system – Prompt created.

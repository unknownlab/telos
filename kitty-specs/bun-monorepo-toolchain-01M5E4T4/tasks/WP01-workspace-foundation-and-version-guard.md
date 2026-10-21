---
work_package_id: WP01
title: Workspace foundation and version guard
dependencies: []
requirement_refs:
- C-001
- C-002
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- NFR-001
planning_base_branch: feat/bun-monorepo-toolchain
merge_target_branch: feat/bun-monorepo-toolchain
branch_strategy: Planning artifacts for this mission were generated on feat/bun-monorepo-toolchain. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/bun-monorepo-toolchain unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-bun-monorepo-toolchain-01M5E4T4
base_commit: bf1f5451684fccf89b53aa59f7ed2679b7b35a56
created_at: '2026-10-21T03:34:52.636616+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
phase: Phase 1 - Foundation
history:
- at: '2026-10-21T03:16:03Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/check-bun-version.ts
create_intent:
- package.json
- bun.lock
- bunfig.toml
- tsconfig.base.json
- tsconfig.json
- apps/.gitkeep
- packages/.gitkeep
- scripts/check-bun-version.ts
- scripts/check-bun-version.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- package.json
- bun.lock
- bunfig.toml
- tsconfig.base.json
- tsconfig.json
- .gitignore
- apps/.gitkeep
- packages/.gitkeep
- scripts/check-bun-version.ts
- scripts/check-bun-version.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Workspace foundation and version guard

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
- **You must address all feedback** before your work is complete. Feedback items are your implementation TODO list.

---

## Review Feedback

*[If this WP was returned from review, the reviewer feedback reference appears in the Activity Log below or in the status event log.]*

---

## Objectives & Success Criteria

Turn the repository root into a Bun workspaces monorepo skeleton with a strict TypeScript base, Bun's linter and formatter configured, and a test-first version guard that refuses Bun older than `>=1.4.4-canary.1`.

Done means:

1. `bun install` succeeds on Bun `1.4.4-canary.1` and writes `bun.lock`. `bun install --frozen-lockfile` then passes.
2. `bun run check:bun`, `bun run lint`, `bun run typecheck` and `bun run test` all exit 0.
3. `bun run test` runs 6 passing tests from `scripts/check-bun-version.test.ts`.
4. An older Bun is refused with exactly: `Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary`.
5. `bun run format:check` reports **only** `docs/tooling.md` as unformatted. That file belongs to WP03; do not touch it.
6. `bun run grace:lint` and `bun run verify` are **expected to fail** in this WP, because `.grace/` arrives in WP04. Do not try to fix that.

## Context & Constraints

Read these before you start. The contracts are authoritative. If this prompt and a contract disagree, the contract wins; report the conflict in the Activity Log.

- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/spec.md`: FR-001..FR-007, NFR-001, C-001, C-002
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/plan.md`: IC-01, IC-02
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/data-model.md`: RootManifest, Lockfile, BunConfig, TypeScriptBase, TypeScriptRoot, WorkspaceArea, VersionGuard
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/commands.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/version-guard.md`
- `kitty-specs/bun-monorepo-toolchain-01M5E4T4/research.md`: R-01..R-04, R-07, R-08
- `.kittify/charter/charter.md`: test-first, no fake tests, Bun only

Hard rules:

- **Test-first** (charter, DIRECTIVE_034): write the failing test (T001) and see it fail before writing `isSupported` (T002).
- **No fake checks** (C-002): do not add placeholder source or test files. The guard and its test are the only TypeScript files in this WP.
- **Only one dependency**: `@types/bun` at exactly `1.4.3` (owner decision). Add nothing else.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `.kittify/`, `docs/` or `kitty-specs/` (except this WP's Activity Log).
- The `// START_…` / `// END_…` comment lines in the scripts are GRACE semantic markup. Copy them exactly. WP04 relies on them.
- Commit messages follow Conventional Commits, e.g. `feat(toolchain): add workspace skeleton and bun version guard`. No AI names or co-author lines. Never use `--no-verify`.

## Branch Strategy

- **Strategy**: Planning artifacts were generated on `feat/bun-monorepo-toolchain`; completed changes must merge back into `feat/bun-monorepo-toolchain`.
- **Planning base branch**: `feat/bun-monorepo-toolchain`
- **Merge target branch**: `feat/bun-monorepo-toolchain`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP01 --agent claude` and work only inside the worktree it gives you.

## Before you start

```sh
bun --version            # must print 1.4.4-canary.1 or later
git status --porcelain   # the worktree must be clean
```

If `bun --version` prints an older version, stop and report it. Do not upgrade Bun yourself (global installs are owner decisions).

## Subtasks & Detailed Guidance

### Subtask T001 – Write the failing version-guard test

- **Purpose**: Encode the acceptance table of `contracts/version-guard.md` before the code exists.
- **File**: create `scripts/check-bun-version.test.ts` with exactly this content:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove the version guard accepts every Bun at or above the minimum and rejects older ones.
//   SCOPE: Table test of isSupported against ">=1.4.4-canary.1".
//   DEPENDS: M-BUN-VERSION-GUARD
//   LINKS: V-M-BUN-VERSION-GUARD
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MINIMUM - the engines.bun value the table is checked against
// END_MODULE_MAP

import { expect, test } from "bun:test";
import { isSupported } from "./check-bun-version";

const MINIMUM = ">=1.4.4-canary.1";

test.each([
  ["1.4.3", false],
  ["1.4.4-canary.1", true],
  ["1.4.4-canary.7", true],
  ["1.4.4", true],
  ["1.4.5-canary.1", true],
  ["1.5.0", true],
] as const)(
  "Bun %s against >=1.4.4-canary.1 is supported: %p",
  (version, expected) => {
    expect(isSupported(version, MINIMUM)).toBe(expected);
  },
);
```

- **Check**: `bun test scripts/check-bun-version.test.ts` must **fail** now (the module does not exist). Record the failure line in the Activity Log as test-first evidence.

### Subtask T002 – Implement the version guard

- **Purpose**: Enforce the minimum Bun version. Bun itself does not enforce `engines.bun` (research R-02).
- **File**: create `scripts/check-bun-version.ts` with exactly this content:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Refuse to run the toolchain on a Bun older than engines.bun in package.json.
//   SCOPE: Compare Bun.version with the engines.bun minimum; print one fix-it line and exit 1 when unsupported.
//   DEPENDS: none
//   LINKS: M-BUN-VERSION-GUARD, V-M-BUN-VERSION-GUARD
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   isSupported - true when a Bun version is at or above a ">=<version>" minimum
// END_MODULE_MAP

import pkg from "../package.json";

// START_CONTRACT: isSupported
//   PURPOSE: Decide whether a Bun version meets a ">=<version>" minimum, prereleases included.
//   INPUTS: { actual: string - a Bun version such as Bun.version, required: string - engines.bun such as ">=1.4.4-canary.1" }
//   OUTPUTS: { boolean - true when actual is at or above the minimum }
//   SIDE_EFFECTS: none
//   LINKS: M-BUN-VERSION-GUARD
// END_CONTRACT: isSupported
export function isSupported(actual: string, required: string): boolean {
  return Bun.semver.order(actual, required.replace(/^>=/, "")) >= 0;
}

if (import.meta.main) {
  // START_BLOCK_READ_MINIMUM
  const required: unknown = pkg.engines?.bun;
  if (typeof required !== "string" || !required.startsWith(">=")) {
    console.error('package.json engines.bun must be ">=<version>"');
    process.exit(1);
  }
  // END_BLOCK_READ_MINIMUM

  // START_BLOCK_ENFORCE_MINIMUM
  if (!isSupported(Bun.version, required)) {
    console.error(
      `Bun ${required} required, found ${Bun.version}. Run: bun upgrade --canary`,
    );
    process.exit(1);
  }
  // END_BLOCK_ENFORCE_MINIMUM
}
```

- **Why `Bun.semver.order`**: `Bun.semver.satisfies("1.4.5-canary.1", ">=1.4.4-canary.1")` wrongly returns `false` (research R-02). Never use `satisfies` here.
- **Note**: the file imports `../package.json`, which T003 creates. The test passes only after T003.

### Subtask T003 – Write the root manifest

- **File**: create `package.json` with exactly this content:

```json
{
  "name": "telos",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "engines": {
    "bun": ">=1.4.4-canary.1"
  },
  "packageManager": "bun@1.4.4-canary.1",
  "scripts": {
    "preinstall": "$npm_execpath scripts/check-bun-version.ts",
    "check:bun": "bun scripts/check-bun-version.ts",
    "typecheck": "bun check -b",
    "lint": "bun lint --no-script",
    "lint:fix": "bun lint --no-script --fix",
    "format": "bun fmt --no-script",
    "format:check": "bun fmt --no-script --check",
    "test": "bun test --pass-with-no-tests",
    "grace:lint": "grace lint --path . --assertions current",
    "verify": "bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run grace:lint"
  },
  "devDependencies": {
    "@types/bun": "1.4.3"
  }
}
```

- **Why `$npm_execpath`**: in `preinstall` it is the Bun binary running the install. Plain `bun` would pick the first `bun` on `PATH`, which may be a different version.
- **Why `bun check -b`**: plain `bun check` skips projects listed in `references`, so future packages would go unchecked (research R-10). `-b` checks them and writes nothing.
- **Why `--no-script`**: bare `bun lint` runs the package's own `lint` script when one exists (it would call itself). `--no-script` forces the built-in.
- Now run `bun test scripts/check-bun-version.test.ts`: 6 pass, 0 fail.

### Subtask T004 – Write the TypeScript configs

- **File** `tsconfig.base.json`, exactly:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "module": "Preserve",
    "moduleResolution": "bundler",
    "target": "ESNext",
    "lib": ["ESNext"],
    "types": ["bun"],
    "skipLibCheck": true,
    "noEmit": true,
    "resolveJsonModule": true
  }
}
```

- **File** `tsconfig.json`, exactly:

```json
{
  "extends": "./tsconfig.base.json",
  "include": ["scripts"],
  "references": []
}
```

- **Rules** (data-model): the base has no `include`, `files` or `references`. The root must include `scripts` (an empty input list fails with TS18002). Future packages add `{ "path": "<area>/<name>" }` to `references`. Do not add any now.

### Subtask T005 – Configure lint and format in `bunfig.toml`

- **File** `bunfig.toml`, exactly:

```toml
[lint]
ignorePatterns = [
  "node_modules/**",
  ".worktrees/**",
  "kitty-specs/**",
  ".kittify/**",
  ".grace/**",
]

[fmt]
ignorePatterns = [
  "node_modules/**",
  ".worktrees/**",
  "kitty-specs/**",
  ".kittify/**",
  ".grace/**",
  "bun.lock",
  "AGENTS.md",
  "CLAUDE.md",
]
```

- **Why** (research R-07): `bun fmt` also formats Markdown, JSON, YAML and TOML. Without these patterns it would rewrite Spec Kitty's files and `AGENTS.md`, whose orientation block Spec Kitty regenerates. Bun's rule defaults stay as they are; do not add options that restate a default.

### Subtask T006 – Workspace areas and `.gitignore`

- Create the empty files `apps/.gitkeep` and `packages/.gitkeep`. Nothing else goes in those directories.
- In `.gitignore`, add the line `node_modules/` as the **first line** of the file. Leave every other line unchanged. (The rest of the file is managed by Spec Kitty.)
- Do not add `bun.lock` to `.gitignore`: the lockfile is committed.

### Subtask T007 – Install and verify

Run these from the worktree root, in order, and paste the summarized results into the Activity Log:

```sh
bun install                      # creates node_modules/ and bun.lock
bun install --frozen-lockfile    # must pass: the lockfile is stable
bun run check:bun                # exit 0, prints nothing
bun run typecheck                # "No type errors"
bun run lint                     # "No problems"
bun run test                     # 6 pass, 0 fail
bun run format:check             # expected: lists ONLY docs/tooling.md (WP03 fixes it)
git status --porcelain           # node_modules/ must not appear
```

Then prove the guard's failure paths. Do not commit any of these temporary changes:

1. **Old Bun**: if an old Bun binary is available (for example from `bunx bun@1.4.3`, or `npm pack bun@1.4.3`), run `<old-bun> scripts/check-bun-version.ts`. Expect exit 1 and exactly `Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary`. If you cannot get an old binary without a global install, skip this and say so in the Activity Log. The unit test already covers the comparison.
2. **Malformed engines**: temporarily change `"bun": ">=1.4.4-canary.1"` to `"bun": "1.4.4-canary.1"` in `package.json` and run `bun scripts/check-bun-version.ts`. Expect exit 1 and `package.json engines.bun must be ">=<version>"`. Restore the file and confirm `git diff package.json` is empty.

If `bun run format:check` lists any file of yours, run `bun run format` and re-check. Your files must already match the exact contents above.

## Test Strategy

- Real test: `scripts/check-bun-version.test.ts`, with 6 table rows from the contract. It is the first test in the repo.
- Behavior checks without test files: the old-Bun and malformed-engines runs in T007.

## Definition of Done

- [x] All ten owned files exist with the exact contents above; `bun.lock` is committed.
- [x] T001's failing run is recorded before T002.
- [x] `bun install --frozen-lockfile`, `check:bun`, `typecheck`, `lint` and `test` all exit 0.
- [x] `format:check` reports only `docs/tooling.md`.
- [x] Malformed-engines check done; old-Bun check done or explicitly skipped with a reason.
- [x] No other files changed (`git status` clean after commit).

## Risks & Mitigations

- **Bun on PATH is older than the canary**: stop and report it. Do not upgrade globally.
- **`bun install` deletes `bun.lock` when there are no dependencies** (research): this cannot happen here because `@types/bun` is a devDependency. If `bun.lock` is missing after install, check `package.json`.
- **Formatter disagreement**: the contents above are already `bun fmt` output on `1.4.4-canary.1`. If a newer canary formats differently, run `bun run format` and note it in the Activity Log.

## Review Guidance

Reviewer: Claude Sonnet (`reviewer-renata` profile).

- Diff the owned files against the exact contents in this prompt and the data-model.
- Check the test-first evidence (T001 failure recorded before T002).
- Run the T007 commands yourself in the worktree.
- Confirm only `@types/bun@1.4.3` is installed: `bun pm ls` shows `@types/bun@1.4.3`, and `package.json` has no `dependencies` key.
- Confirm `AGENTS.md`, `CLAUDE.md`, `.kittify/` and `docs/` are untouched.

## Activity Log

> Append entries at the END, oldest first, using: `- YYYY-MM-DDTHH:MM:SSZ – <agent_id> – <action>` (UTC from `date -u "+%Y-%m-%dT%H:%M:%SZ"`).

- 2026-10-21T03:16:03Z – system – Prompt created.
- 2026-10-21T03:40:30Z – implementer-ivan – Re-claimed WP01 after review cycle 1 (`spec-kitty agent action implement WP01 --agent claude`). No code changed in this cycle. This entry adds process evidence for the two requested changes: test-first evidence (issue 1) and T007 results (issue 2). Activity Log is written in the planning-branch copy in the main checkout, because the pre-review gate refuses kitty-specs changes on the lane branch. Neither `.spec-kitty/review-lock.json` nor any other extra file exists in either checkout, so nothing is excluded from commits.
- 2026-10-21T03:40:30Z – implementer-ivan – T001 test-first evidence, part 1 (original observation, not logged at the time). During the first implementation session, the test file was created and `bun test scripts/check-bun-version.test.ts` was run before `scripts/check-bun-version.ts` existed. That run failed with `Cannot find module './check-bun-version'`, 0 pass, 1 fail, 1 error. It was reported in that session but not written to this log.
- 2026-10-21T03:40:30Z – implementer-ivan – T001 test-first evidence, part 2 (REPRODUCTION, run now). Run in a scratch copy that holds only the test file and `package.json`, with no `check-bun-version.ts`. The lane worktree was not touched. Output:
  ```
  bun test v1.4.4-canary.1 (9b4284f78)

  scripts/check-bun-version.test.ts:

  # Unhandled error between tests
  error: Cannot find module './check-bun-version' from '.../scratchpad/t001-red/scripts/check-bun-version.test.ts'

   0 pass
   1 fail
   1 error
  Ran 1 test across 1 file.
  ```
- 2026-10-21T03:40:30Z – implementer-ivan – Mutation check (run now, scratch copy). `isSupported` was replaced with `return true;` in a copy of `scripts/check-bun-version.ts`, and the test was run. Result: 5 pass, 1 fail. The failing row was `(fail) Bun 1.4.3 against >=1.4.4-canary.1 is supported: false`, with `Expected: false` and `Received: true`. The other five rows still passed. The lane file was never edited for this check.
- 2026-10-21T03:40:30Z – implementer-ivan – T007 results, re-run in the lane worktree now (tree at commit `86a9839`, with the later lane commits present). All commands run from the worktree root.
  - `bun --version`: 1.4.4, which satisfies `>=1.4.4-canary.1`.
  - `bun install`: exit 0, "Checked 4 installs across 5 packages (no changes)". The lockfile was created in the first session.
  - `bun install --frozen-lockfile`: exit 0, no changes.
  - `bun run check:bun`: exit 0, no guard output.
  - `bun run typecheck`: exit 0, "No type errors in 2 files across 1 project".
  - `bun run lint`: exit 0, "No problems in 2 files".
  - `bun run test`: exit 0, 6 pass, 0 fail, 6 expect() calls.
  - `bun run format:check`: exit 1, as expected. The only listed file is `docs/tooling.md`, which WP03 owns.
  - `bun pm ls`: only `@types/bun@1.4.3`. `package.json` has no `dependencies` key.
  - `git status --porcelain`: empty. `node_modules/` is ignored and does not appear.
  - `bun run grace:lint` (from the earlier session): exit 1, "No .grace directory found". This is expected in WP01.
- 2026-10-21T03:40:30Z – implementer-ivan – Malformed-engines check (run now, scratch copy). `package.json` with `"bun": "1.4.4-canary.1"` and a copy of the guard were run with `bun scripts/check-bun-version.ts`. Output: `package.json engines.bun must be ">=<version>"`, exit 1. The lane `package.json` was not edited. The first session ran this against the lane file, restored it from a backup, and confirmed the restore with `cmp`. The output was the same.
- 2026-10-21T03:40:30Z – implementer-ivan – Old-Bun check (run now, scratch copy). `bunx bun@1.4.3 --version` printed `1.4.3`. `bunx bun@1.4.3 scripts/check-bun-version.ts` printed `Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary`, exit 1. The check was not skipped. `bunx` uses a temporary package-cache download, not a global install. The first session got the same output from the lane worktree.
- 2026-10-21T03:40:30Z – implementer-ivan – All WP01 Definition of Done boxes ticked. The commit is `86a9839` on `kitty/mission-bun-monorepo-toolchain-01M5E4T4-lane-a`. Ready for review.

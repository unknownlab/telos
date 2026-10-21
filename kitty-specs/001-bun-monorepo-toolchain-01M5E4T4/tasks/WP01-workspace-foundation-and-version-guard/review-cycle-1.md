---
affected_files: []
cycle_number: 1
mission_slug: bun-monorepo-toolchain-01M5E4T4
reproduction_command:
reviewed_at: '2026-10-21T03:38:59Z'
reviewer_agent: user
wp_id: WP01
---

# WP01 review feedback 1

The code deliverables are correct. All six files with exact contents in the WP match byte for byte (package.json, tsconfig.base.json, tsconfig.json, bunfig.toml, both scripts). `node_modules/` is the first line of `.gitignore`. Only `@types/bun@1.4.3` is installed and there is no `dependencies` key. The WP commit message is a clean Conventional Commit with no AI attribution. `bun install --frozen-lockfile`, `check:bun`, `typecheck`, `lint` and `test` (6 pass, 0 fail) all exit 0. The malformed-engines run exits 1 with the expected message.

Changes requested, process evidence only (the charter makes test-first a blocking rule, DIRECTIVE_034):

**Issue 1: no test-first evidence.** The WP Definition of Done says "T001's failing run is recorded before T002", and the review guidance says to check it. The test and the implementation landed together in one commit (86a9839), and the Activity Log has no entry from the implementer. A reviewer cannot confirm the test was seen failing.
Fix: add an Activity Log entry with the real failing output of `bun test scripts/check-bun-version.test.ts` run without `scripts/check-bun-version.ts` (for example by moving that file aside temporarily and restoring it). Label it as a reproduction, not an original capture. Do not claim it was captured at the time if it was not. Also add a mutation check: with `isSupported` made to return `true`, the `1.4.3 -> false` row must fail.

**Issue 2: T007 results are not logged.** The WP requires the summarized T007 results in the Activity Log: install, frozen-lockfile, check:bun, typecheck, lint, test, the format:check output, the malformed-engines run, and the old-Bun run or an explicit skip reason. None is logged. Add them.

**Note, no action needed in code.** `format:check` in the worktree also lists the untracked `.spec-kitty/review-lock.json` (Spec Kitty review bookkeeping) besides `docs/tooling.md`. Do not commit that file.

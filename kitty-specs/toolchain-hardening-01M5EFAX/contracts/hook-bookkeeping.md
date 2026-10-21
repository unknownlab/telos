# Contract: pre-commit hook, bookkeeping rule (amends `.githooks/pre-commit`)

Applies to the hook defined in `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md`; every other step and message there is unchanged.

## Rule (new step 0a, after changing to the repository root and before step 0)

1. Read the staged paths: `git diff --cached --name-only`.
2. If there is at least one path and every path matches `kitty-specs/*` or `.kittify/*`, exit 0 immediately. No output, no check, no dependency needed.
3. Otherwise continue with step 0 as before.

## Rules

- A path counts only with the slash: `kitty-specs-extra/x` and `kitty-specs` (a file) do not match.
- An empty staged set does not trigger the rule.
- A single path outside both directories triggers the full existing behavior, including `pre-commit: dependencies not installed. Run: bun install` when `node_modules/` is absent.
- Runtime of a bookkeeping-only commit without `node_modules/` is under 2 s (NFR-002); the full run stays under 5 s (NFR-003).
- `.githooks/commit-msg` is not modified (C-003).

## Acceptance examples

| Staged | `node_modules/` | Expected |
|---|---|---|
| `kitty-specs/m/status.json` | absent | commit succeeds, hook silent |
| `.kittify/config.yaml` + `kitty-specs/m/spec.md` | absent | commit succeeds |
| `kitty-specs/m/a.md` + `scripts/x.ts` | absent | blocked: `pre-commit: dependencies not installed. Run: bun install` |
| `kitty-specs-extra/a.md` | absent | blocked: same message |
| `kitty-specs/m/a.md` + `scripts/x.ts` (lint error) | present | blocked: `pre-commit: lint failed` |
| `docs/tooling.md` only | present | commit succeeds (full checks) |
| bad message `update stuff`, only `kitty-specs/...` staged | absent | blocked by the commit-msg hook as before |

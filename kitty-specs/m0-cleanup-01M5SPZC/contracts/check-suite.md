# Contract: the check suite after M0

## Root `verify` script (`package.json`)

Exact value after WP01:

```json
"verify": "bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run telos:check"
```

Root scripts removed in WP02: `grace:lint`, `docs:build`, `docs:preview`, `test:e2e`. Every other script stays unchanged.

## `CHECK_STEPS` (`scripts/review-gate.ts`)

Exact value after WP01, in this order:

```ts
export const CHECK_STEPS: ReadonlyArray<CheckStep> = [
  { name: "check:bun", command: ["bun", "run", "check:bun"] },
  { name: "format:check", command: ["bun", "run", "format:check"] },
  { name: "lint", command: ["bun", "run", "lint"] },
  { name: "typecheck", command: ["bun", "run", "typecheck"] },
  { name: "test", command: ["bun", "test", "--pass-with-no-tests"] },
  { name: "telos:check", command: ["bun", "run", "telos:check"] },
];
```

The no-drift test (`verifyStepNames(pkg.scripts.verify)` equals the `CHECK_STEPS` names) stays and must pass. A new test pins the exact list of the six names.

## Pre-commit hook (`.githooks/pre-commit`)

After WP02, in order:

| # | Step | On failure |
| --- | --- | --- |
| 0a | staged paths all under `kitty-specs/` or `.kittify/` | exit 0 silently |
| 0 | `command -v bun` | `pre-commit: bun not found. See tools/README.md` |
| 1 | `bun scripts/check-bun-version.ts` | the guard's message |
| 2 | `[ -d node_modules ]` | `pre-commit: dependencies not installed. Run: bun install` |
| 3 | `bun fmt --no-script --staged` | `pre-commit: format failed` |
| 4 | `bun lint --no-script --staged` | `pre-commit: lint failed` |
| 5 | `bun check -b` | `pre-commit: typecheck failed` |
| 6 | `bun test --pass-with-no-tests` | `pre-commit: tests failed` |

WP01 deletes the two `grace` lines (the `command -v grace` check and `grace lint`). WP02 changes the `bun not found` pointer to `tools/README.md`. Nothing else in the hook changes.

## `CLOSURE_SCOPE` (`scripts/telos.ts`)

After WP02: `include` without the seven `apps/docs/...` globs, `exclude` without the two `apps/docs/...` globs, and `aliases: []`.

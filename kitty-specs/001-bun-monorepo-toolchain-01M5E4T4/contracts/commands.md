# Contract: root command surface

Every command runs from the repository root. "Read-only" means the command modifies 0 tracked files (NFR-003). Exit code 0 means pass; any non-zero exit code means fail (NFR-001).

| Script (`bun run <name>`) | Exact command | Mode | Covers |
|---|---|---|---|
| `preinstall` | `$npm_execpath scripts/check-bun-version.ts` | guard | FR-007 |
| `check:bun` | `bun scripts/check-bun-version.ts` | guard | FR-007 |
| `typecheck` | `bun check -b` | read-only | FR-003 |
| `lint` | `bun lint --no-script` | read-only | FR-004 |
| `lint:fix` | `bun lint --no-script --fix` | writes | FR-004 |
| `format` | `bun fmt --no-script` | writes | FR-005 |
| `format:check` | `bun fmt --no-script --check` | read-only | FR-005 |
| `test` | `bun test --pass-with-no-tests` | read-only | FR-006 |
| `grace:lint` | `grace lint --path . --assertions current` | read-only | FR-010 |
| `verify` | `bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run grace:lint` | read-only | FR-009, NFR-001 |

## Rules

- `--no-script` stops `bun lint` / `bun fmt` from running a package script of the same name instead of the built-in (verified on 1.4.4-canary.1: bare `bun lint` runs the `lint` script when one exists).
- `verify` stops at the first failing step. Its exit code is that step's exit code.
- Output is Bun's own. No wrapper reformats it.
- Lint warnings never fail `lint` (Bun exits 0 when there are only warnings).
- `typecheck` uses `-b`: plain `bun check` checks only the root project and silently skips projects listed in `references` (verified on 1.4.4-canary.1, research R-10). `-b` checks them without writing any output files.

## Acceptance examples

| Given | When | Then |
|---|---|---|
| Clean skeleton | `bun run verify` | exit 0, `git status --porcelain` empty |
| `scripts/x.ts` containing `export const n: number = "x";` | `bun run typecheck` | exit ≠ 0, output names `scripts/x.ts` |
| `scripts/x.ts` containing `debugger;` | `bun run lint` | exit ≠ 0, output names `no-debugger` |
| `scripts/x.ts` containing `export const a = {b:1}` | `bun run format:check` | exit ≠ 0, output names `scripts/x.ts` |
| No `*.test.ts` files | `bun run test` | exit 0 |

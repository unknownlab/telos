# Contract: pre-commit hook (`.githooks/pre-commit`)

POSIX `sh`, executable, run by git through `core.hooksPath`. Steps run in order. The first failing step stops the hook with a non-zero exit, and the commit is aborted.

| # | Step | Command | On failure |
|---|------|---------|------------|
| 0 | Bun present | `command -v bun` | `pre-commit: bun not found. See docs/tooling.md` |
| 1 | Version | `bun scripts/check-bun-version.ts` | the guard's own message |
| 2 | Format staged | `bun fmt --no-script --staged` (formats and restages) | `pre-commit: format failed` |
| 3 | Lint staged | `bun lint --no-script --staged` (errors fail, warnings pass) | `pre-commit: lint failed` |
| 4 | Typecheck | `bun check` | `pre-commit: typecheck failed` |
| 5 | Test | `bun test --pass-with-no-tests` | `pre-commit: tests failed` |
| 6 | grace present | `command -v grace` | `pre-commit: grace not found. See docs/tooling.md` |
| 7 | Architecture | `grace lint --path . --assertions current` | `pre-commit: grace lint failed` |

Every failure message goes to stderr and is prefixed with `pre-commit:`, matching the `commit-msg:` prefix style of the existing hook.

## Rules

- No `--no-verify` guidance in any message.
- `--no-script` is required: when a `lint` script exists, bare `bun lint` runs that script instead of the linter (verified on 1.4.4-canary.1).
- With zero matching staged files, `bun fmt --staged` and `bun lint --staged` print "No staged files…" and exit 0 (verified). Steps 4–7 still run.
- `bun fmt --staged` restages whole files. A partially staged file gets its unstaged hunks staged too. This is documented in `docs/tooling.md`, not worked around.
- Total runtime on the skeleton < 5 s (NFR-002).
- `.githooks/commit-msg` is not modified (C-003).

## Acceptance examples

| Staged change | Expected |
|---|---|
| `scripts/x.ts`: `export const a = {b:1}` | commit succeeds; committed file is `export const a = { b: 1 };` |
| `scripts/x.ts`: `debugger;` | commit blocked, `pre-commit: lint failed` |
| `scripts/x.ts`: `export const n: number = "x";` | commit blocked, `pre-commit: typecheck failed` |
| failing `scripts/x.test.ts` | commit blocked, `pre-commit: tests failed` |
| `docs/tooling.md` only | commit succeeds |
| bad message `update stuff` | blocked by the commit-msg hook as before |

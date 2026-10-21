# Contract: review gate report (amends `scripts/review-gate.ts`)

Applies to the runner defined in `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/review-gate.md`; wiring, steps, console lines and exit codes are unchanged.

## New and changed pure functions (unit-tested in `scripts/review-gate.test.ts`)

- `sanitizeText(text: string): string` removes ANSI CSI escape sequences (`ESC [ <params> <final byte>`) and then every character not allowed by XML 1.0 (`#x9 | #xA | #xD | #x20-#xD7FF | #xE000-#xFFFD | #x10000-#x10FFFF`). It keeps all other text, including non-ASCII letters.
- `escapeXml(text)` sanitizes first, then escapes `&`, `<`, `>`, `"`, `'`.
- `failureMessage(output: string, exitCode: number): string` picks, after sanitizing and trimming lines: the first non-wrapper line that contains `error` (case-insensitive) or starts with `(fail)`; else the last non-empty non-wrapper line; else the wrapper line; else `exit code <n>`. The wrapper line is `error: script "<name>" exited with code <n>`. Result is at most 300 characters.
- `buildReport(steps, bunJunit)` passes the embedded `bun test` JUnit text through `sanitizeText` before embedding.

## Rules

- Child steps run with the environment returned by `cleanEnv(env)`: `NO_COLOR=1`, and without `FORCE_COLOR`, `CLAUDECODE` and `CLAUDE_CODE_ENTRYPOINT` (the last two make `bun check` and `bun lint` print XML-like errors). This only improves messages; well-formedness comes from sanitizing.
- `needsInstall(dir: string): boolean` is true when `<dir>/node_modules` does not exist. When it is true the runner first runs `bun install --frozen-lockfile`. Spec Kitty runs the gate on the base branch in a temporary worktree without `node_modules`; without the install, `verify.typecheck` always failed there and new type errors were never counted as new.
- `verify.install` is an extra test case that exists only when the install was needed and failed (message from `failureMessage`). On success or when not needed there is no such case, so a clean tree has exactly six `verify` cases. All other steps still run after a failed install.
- A report built from any input, including strings with ESC, NUL, lone surrogates and C0 controls, is well-formed XML (NFR-001).
- The gate still modifies 0 tracked files (NFR-004).

## Acceptance examples

| Input | Expected |
|---|---|
| message `\x1b[31mfailed\x1b[0m` | report text contains `failed`, no `\x1b`, parses as XML |
| output `a.ts(3,1): error TS2322: x\nerror: script "typecheck" exited with code 1` | message `a.ts(3,1): error TS2322: x` |
| output `(fail) f\n 1 fail\nRan 12 tests across 3 files.` | message `(fail) f` |
| output `docs/tooling.md\n1 file needs formatting.\nerror: script "format:check" exited with code 1` | message `1 file needs formatting.` |
| empty output, exit code 3 | message `exit code 3` |
| no `node_modules`, type error present | gate installs, then `verify.typecheck` fails naming the TS error (not `TS2688`) |
| no `node_modules`, install fails | `verify.install` fails, other steps still run, exit 1 |
| `CLAUDECODE=1`, type error present | message is `scripts/x.ts(1,14): error TS2322: ...`, not an `<error ...>` tag line |
| `FORCE_COLOR=1`, type error present | gate exits 1; Spec Kitty's parser counts the `verify.typecheck` failure |

# Contract: review gate runner (`scripts/review-gate.ts`)

Spec Kitty's review gate runs `review.test_command` and blocks only on failing JUnit test cases that are new compared to the baseline. The runner turns every check step into a JUnit test case, so a format, lint, typecheck or grace failure blocks a review just as a failing test does (FR-009, SC-003).

## Wiring (`.kittify/config.yaml`)

```yaml
review:
  test_command: bun scripts/review-gate.ts {output_file}
  test_output_format: junit_xml
  fail_on_pre_review_regression: true
```

No other key in `.kittify/config.yaml` changes (C-004).

## Interface

- **Invocation**: `bun scripts/review-gate.ts <junit-output-file>`. With no argument: exit 2 and print `usage: bun scripts/review-gate.ts <junit-output-file>` on stderr.
- **Steps**, all run (no early stop), in this order. The test case name is the step name:

| Step | Command |
|------|---------|
| `check:bun` | `bun run check:bun` |
| `format:check` | `bun run format:check` |
| `lint` | `bun run lint` |
| `typecheck` | `bun run typecheck` |
| `test` | `bun test --pass-with-no-tests --reporter=junit --reporter-outfile=<temp file>` |
| `grace:lint` | `bun run grace:lint` |

- **Report** written to `<junit-output-file>`: one `<testsuites>` root containing
  1. `<testsuite name="verify" tests="<n>" failures="<f>">` with one `<testcase classname="verify" name="<step>">` per step. A failed step has a `<failure message="<last non-empty output line>" />` child. Spec Kitty reads its identity as `verify.<step>`.
  2. Every `<testsuite>` element from `bun test`'s JUnit file, unchanged. When `bun test` wrote no file (no test files exist), nothing is added.
- **Console**: one line per step, `PASS verify.<step>` or `FAIL verify.<step>: <message>`.
- **Exit code**: 0 when every step passed, otherwise 1.
- **Side effects**: writes `<junit-output-file>` and one temp directory under the OS temp dir, which it removes. It modifies 0 tracked files (NFR-003).

## Pure functions (unit-tested in `scripts/review-gate.test.ts`)

- `escapeXml(text: string): string` escapes `&`, `<`, `>`, `"`, `'`.
- `buildReport(steps: StepResult[], bunJunit: string | null): string`, where `StepResult = { name: string; ok: boolean; message: string }`.

## Acceptance examples

| Given | When | Then |
|---|---|---|
| Clean skeleton | `bun scripts/review-gate.ts out.xml` | exit 0; `out.xml` has a `verify` suite with 6 passing cases plus the `bun test` suites |
| `scripts/x.ts` containing `export const n: number = "x";` | same | exit 1; console shows `FAIL verify.typecheck`; Spec Kitty's JUnit parser reports exactly one failure, `verify.typecheck` |
| No argument | `bun scripts/review-gate.ts` | exit 2, usage line on stderr |

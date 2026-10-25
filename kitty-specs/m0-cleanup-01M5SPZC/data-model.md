# Data Model: M0 Cleanup

M0 adds no product data. This file defines the entities the cleanup and its proofs work with.

## Comment

A TypeScript comment outside string, template and regex literals, as found by `parity/lex.ts`.

| Class | Rule | Count at baseline | After M0 |
| --- | --- | --- | --- |
| Owner note | a `//` comment whose text starts with `//@unknownhero` | 34 (`apps/calculator/src/`: `app.ts` 28, `arithmetic.ts` 3, `interfaces.ts` 2, `errors.ts` 1) | 34, unchanged |
| Directive | a `//` comment matching `^//\s*@ts-expect-error\b` | 7 (kernel tests: `extensions.test.ts`, `locus.test.ts`, `types.test.ts`) | 7, unchanged |
| Other | every other comment, including GRACE markup and JSDoc | 3,182 | 0 |

Scope: tracked `.ts` files under `packages/`, `apps/calculator/`, `scripts/`, and `telos.ts`.

Invariant: an owner note keeps its exact text and its anchor.

## Owner note anchor

| Field | Meaning |
| --- | --- |
| `text` | the full comment text, for example `//@unknownhero NOT GLOBAL ERRORS ...` |
| `placement` | `same-line` when code precedes the note on its line, otherwise `line-above` |
| `anchor` | for `same-line`, the code before the note; for `line-above`, the next line that holds code; comments removed and whitespace squashed |

## Baseline (`kitty-specs/m0-cleanup-01M5SPZC/baseline/`)

Captured by `parity.ts capture` at `f95ae8d` (code identical to `5fcb4dc`), Bun `1.4.4-canary.1`.

| File | Content |
| --- | --- |
| `meta.json` | `commit`, `bun`, `codeFiles` (105 tracked `.ts` files under `packages/` and `apps/calculator/`) |
| `commands.json` | per command name: `exitCode`, `stdout`, `stderr`; plus `mcp tools/list`: `server`, `tools` |
| `exports.json` | per entry point id (for example `@telos/kernel/closure`): sorted runtime export names |
| `model.json` | calculator `ids`, `diagnostics`, `describe`, `verify` (runner `parity`, clock at epoch), `webForms` |
| `owner-notes.json` | per file under `apps/calculator/src/`: the list of owner note anchors |

The baseline is immutable for the mission. Re-capturing it after any product change would invalidate the proof.

## Check suite

| Surface | Before M0 | After M0 |
| --- | --- | --- |
| `verify` script | `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `docs:build`, `test:e2e`, `grace:lint`, `telos:check` | `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `telos:check` |
| `CHECK_STEPS` (review gate) | same as `verify` | same as `verify` |
| pre-commit hook | bookkeeping exit, bun, version, `node_modules`, fmt, lint, typecheck, test, grace | bookkeeping exit, bun, version, `node_modules`, fmt, lint, typecheck, test |

The exact text is in `contracts/check-suite.md`.

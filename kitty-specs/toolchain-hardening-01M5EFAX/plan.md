# Implementation Plan: Toolchain Hardening

**Branch**: `feat/bun-monorepo-toolchain` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/toolchain-hardening-01M5EFAX/spec.md`

## Summary

Close the gaps from the post-merge review of `bun-monorepo-toolchain`. The review gate runner sanitizes every piece of check output before it enters the JUnit report, so the report is always well-formed XML, and it shows the first real error line per failed check. The pre-commit hook exits early, without installed dependencies, when every staged path is under `kitty-specs/` or `.kittify/`. `.spec-kitty/` is ignored by git, the lint, typecheck and test scripts run the Bun version guard first, and GRACE and the docs follow. Everything uses Bun and code that already exists; no dependency is added.

## Technical Context

**Language/Version**: TypeScript (strict) on Bun `>=1.4.4-canary.1`; POSIX `sh` for the hook
**Primary Dependencies**: none added (`@types/bun@1.4.3` stays the only devDependency)
**Storage**: N/A
**Testing**: `bun test` (real tests in `scripts/review-gate.test.ts`); hook behavior verified by scripted scenarios in a throwaway clone, as in the previous mission
**Target Platform**: Developer machines (macOS/Linux, POSIX `sh`); no CI
**Project Type**: Monorepo skeleton (Bun workspaces)
**Performance Goals**: bookkeeping-only commit through the hook < 2 s; full hook run < 5 s
**Constraints**: Bun only; no new dependency; no fake tests; `.githooks/commit-msg`, `AGENTS.md`, `CLAUDE.md`, the charter and `.kittify/config.yaml` unchanged
**Scale/Scope**: about 8 changed files plus a few lines in `.grace/` and two contract documents

## Charter Check

| Charter rule | Status |
|------|--------|
| Product change via mission | Pass: this mission |
| Test-first (DIRECTIVE_034) | Pass: the escape-code regression test and the message tests are written and seen failing before the fix |
| Test and typecheck gate (DIRECTIVE_030) | Pass: `bun run verify` and the hook still gate every commit |
| Tests as scaffold, no fake tests (DIRECTIVE_041) | Pass: new tests fail when the sanitizer or message selection breaks (mutation check required in the WP) |
| Supply-chain safety (DIRECTIVE_051) | Pass: no dependency added or changed |
| Specification fidelity (DIRECTIVE_010) | Pass: every WP maps to FR/NFR/C IDs |
| Living documentation sync (DIRECTIVE_037) | Pass: `docs/tooling.md`, both contracts and the data model are updated |
| Locality of change (DIRECTIVE_024) | Pass: only the files named below change |
| Model routing | Pass: two Haiku-class WPs, Sonnet review, Opus mission review |
| GRACE (AGENTS.md) | Pass: `M-REVIEW-GATE` contract, map and verification are updated with the code (FR-010) |

## Project Structure

### Documentation (this mission)

```
kitty-specs/toolchain-hardening-01M5EFAX/
├── spec.md
├── plan.md          # this file
├── research.md      # decisions and the evidence behind them
├── contracts/       # hook-bookkeeping.md, review-gate-report.md (authoritative)
├── quickstart.md    # how to verify the finished work
└── tasks/
```

### Source Code (repository root)

```
scripts/review-gate.ts        # sanitize + failure message selection (WP01)
scripts/review-gate.test.ts   # new real tests (WP01)
.grace/graph/main.xml         # only if the module map changes (WP01)
.grace/verification/main.xml  # V-M-REVIEW-GATE scenarios (WP01)
.githooks/pre-commit          # bookkeeping early exit (WP02)
package.json                  # lint/typecheck/test run the guard (WP02)
.gitignore                    # + .spec-kitty/ (WP02)
docs/tooling.md               # hook rule, report/message behavior (WP02)
```

Planning-branch documents owned by the orchestrator, not by a lane (lanes may not change `kitty-specs/`): `kitty-specs/bun-monorepo-toolchain-01M5E4T4/contracts/pre-commit-hook.md`, `.../contracts/review-gate.md` and `.../data-model.md` are updated in place to match this mission's contracts (FR-006, FR-008).

## Implementation Concern Map

### IC-01 — Review gate report hardening (WP01)

- **Purpose**: `sanitizeText` removes ANSI escape sequences and any character XML 1.0 cannot represent; `escapeXml` and the embedded `bun test` JUnit both pass through it; `failureMessage` picks the first real error line. Runs of the child steps also drop `FORCE_COLOR` and set `NO_COLOR=1`, which makes messages cleaner but is not what guarantees well-formedness.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-010, NFR-001, NFR-004, C-001, C-002
- **Affected surfaces**: `scripts/review-gate.ts`, `scripts/review-gate.test.ts`, `.grace/` (module `M-REVIEW-GATE`)
- **Sequencing/depends-on**: none
- **Risks**: Over-stripping hides real text (mitigate: strip only escape sequences and invalid characters, test a message with colour around real text); `bun test`'s own JUnit file may carry invalid characters (sanitize it too).

### IC-02 — Hook bookkeeping rule, ignore list, guard on scripts, docs (WP02)

- **Purpose**: `.githooks/pre-commit` exits 0 right after changing to the root when staged paths are non-empty and all match `kitty-specs/*` or `.kittify/*`; `.gitignore` gains `.spec-kitty/`; `lint`, `typecheck` and `test` scripts run `bun run check:bun` first; `docs/tooling.md` describes the hook rule and the gate behavior.
- **Relevant requirements**: FR-004, FR-005, FR-006, FR-007, FR-009, NFR-002, NFR-003, C-001, C-003, C-005
- **Affected surfaces**: `.githooks/pre-commit`, `package.json`, `.gitignore`, `docs/tooling.md`
- **Sequencing/depends-on**: none (parallel with IC-01)
- **Risks**: A prefix like `kitty-specs-extra/` must not match (case pattern ends in `/*`); quoted non-ASCII paths fall through to the full checks, which is the safe direction; the hook is only tested in a throwaway clone because `core.hooksPath` points at the primary checkout.

### IC-03 — Contract and data model sync (orchestrator, planning branch)

- **Purpose**: Update the two contracts and the data model of the previous mission so they match what ships.
- **Relevant requirements**: FR-006, FR-008
- **Affected surfaces**: `kitty-specs/bun-monorepo-toolchain-01M5E4T4/{contracts/pre-commit-hook.md,contracts/review-gate.md,data-model.md}`
- **Sequencing/depends-on**: done during planning, before tasks
- **Risks**: none beyond keeping the wording identical to this mission's contracts.

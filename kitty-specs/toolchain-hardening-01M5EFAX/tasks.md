# Work Packages: Toolchain Hardening

**Inputs**: `kitty-specs/toolchain-hardening-01M5EFAX/` (spec.md, plan.md, research.md, contracts/, quickstart.md)
**Routing (owner policy)**: implementers are Claude Haiku-class models at high effort; WP review by Claude Sonnet (`reviewer-renata`); mission review after merge by Claude Opus, high effort.
**Rule**: every WP prompt carries the exact code and commands. Contracts in `contracts/` are authoritative. Lanes may not change `kitty-specs/`; the previous mission's contracts and data model were already synced by the orchestrator (plan IC-03).

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Write the failing gate tests (sanitize, message, report) | WP01 | |
| T002 | Implement `sanitizeText` and use it in `escapeXml` and `buildReport` | WP01 | |
| T003 | Implement `failureMessage` and clean child environment in `runStep` | WP01 | |
| T004 | Update the GRACE contract, module map and verification entry | WP01 | |
| T005 | Prove the behavior end to end (FORCE_COLOR run, mutation check) | WP01 | |
| T006 | Add the bookkeeping early exit to the pre-commit hook | WP02 | [P] |
| T007 | Run the guard first in `lint`, `typecheck` and `test` scripts | WP02 | [P] |
| T008 | Ignore `.spec-kitty/` in `.gitignore` | WP02 | [P] |
| T009 | Update `docs/tooling.md` | WP02 | |
| T010 | Prove the hook scenarios in a throwaway clone | WP02 | |
| T011 | Check the synced contracts and data model, run the full suite | WP02 | |

## Phase 1 – Hardening

### WP01 – Review gate report hardening

**Prompt**: `tasks/WP01-review-gate-report-hardening.md`
**Goal**: The gate report is well-formed XML for any step output and failure messages show the first real error line; GRACE is in sync.
**Priority**: P1. **Dependencies**: none. **Requirements**: FR-001, FR-002, FR-003, FR-010, NFR-001, NFR-004.
**Estimated prompt size**: ~330 lines.

T001 Write the failing gate tests (WP01)
T002 Implement `sanitizeText` and use it in `escapeXml` and `buildReport` (WP01)
T003 Implement `failureMessage` and clean child environment in `runStep` (WP01)
T004 Update the GRACE contract, module map and verification entry (WP01)
T005 Prove the behavior end to end (WP01)

**Risks**: lint rule `no-control-regex` (the prompt avoids regexes with control characters); over-stripping real text.

### WP02 – Hook bookkeeping rule, ignore list, guard scripts and docs

**Prompt**: `tasks/WP02-hook-bookkeeping-rule-and-config.md`
**Goal**: Bookkeeping-only commits pass the hook without dependencies; `.spec-kitty/` is ignored; the single-check scripts run the version guard; docs describe it.
**Priority**: P1. **Dependencies**: none (parallel with WP01). **Requirements**: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, NFR-002, NFR-003.
**Estimated prompt size**: ~300 lines.

T006 Add the bookkeeping early exit to the pre-commit hook (WP02)
T007 Run the guard first in `lint`, `typecheck` and `test` scripts (WP02)
T008 Ignore `.spec-kitty/` in `.gitignore` (WP02)
T009 Update `docs/tooling.md` (WP02)
T010 Prove the hook scenarios in a throwaway clone (WP02)
T011 Check the synced contracts and data model, run the full suite (WP02)

**Risks**: the hook can only be tested in a throwaway clone; the lane's own commits go through the primary checkout's hook configuration.

## Dependency graph

```
WP01 ─┐
      ├─> (independent, merge together)
WP02 ─┘
```

MVP: WP01. Parallel: WP01 and WP02.

# Work Packages: Bun Monorepo Toolchain

**Inputs**: `kitty-specs/001-bun-monorepo-toolchain-01M5E4T4/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)
**Routing (owner policy)**: implementers are Claude Haiku-class models (mid to max effort); WP review by Claude Sonnet (`reviewer-renata`); mission review after merge by Claude Opus, high effort.
**Rule**: every WP prompt carries the exact file contents and commands, prototyped on Bun `1.4.4-canary.1`. Contracts are authoritative.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Write the failing version-guard test | WP01 | |
| T002 | Implement the version guard | WP01 | |
| T003 | Write the root manifest | WP01 | [P] |
| T004 | Write the TypeScript configs | WP01 | [P] |
| T005 | Configure lint and format in `bunfig.toml` | WP01 | [P] |
| T006 | Workspace areas and `.gitignore` | WP01 | [P] |
| T007 | Install and verify | WP01 | |
| T008 | Write the failing runner tests | WP02 | |
| T009 | Implement the review-gate runner | WP02 | |
| T010 | Wire the gate in `.kittify/config.yaml` | WP02 | |
| T011 | Prove the runner's behavior | WP02 | |
| T012 | Record the gate evidence | WP02 | |
| T013 | Update stale statements in `docs/tooling.md` | WP03 | |
| T014 | Add the Toolchain section | WP03 | |
| T015 | Update setup, then format | WP03 | |
| T016 | Check and record | WP03 | |
| T017 | Create the `.grace/` skeleton | WP04 | |
| T018 | Write the GRACE context files | WP04 | [P] |
| T019 | Write the graph and verification files | WP04 | [P] |
| T020 | Validate GRACE and record | WP04 | |
| T021 | Write the pre-commit hook | WP05 | |
| T022 | Set up a throwaway clone | WP05 | |
| T023 | Run the hook acceptance examples | WP05 | |
| T024 | End-to-end mission check | WP05 | |
| T025 | Clean up and record | WP05 | |

## Phase 1 – Foundation

### WP01 – Workspace foundation and version guard

**Prompt**: `tasks/WP01-workspace-foundation-and-version-guard.md`
**Goal**: Root Bun workspaces skeleton, strict TypeScript with project references, lint/format config, `@types/bun`, and a test-first Bun version guard. `bun run verify` (without the GRACE step passing yet) works.
**Priority**: P1 (MVP). **Dependencies**: none.
**Requirements**: FR-001..FR-007.

T001 Write the failing version-guard test (WP01)
T002 Implement the version guard (WP01)
T003 Write the root manifest (WP01)
T004 Write the TypeScript configs (WP01)
T005 Configure lint and format in `bunfig.toml` (WP01)
T006 Workspace areas and `.gitignore` (WP01)
T007 Install and verify (WP01)

**Risks**: `Bun.semver.satisfies` rejects later prerelease tuples (use `order`); empty tsconfig `files` fails `bun check`.

## Phase 2 – Gates

### WP02 – Review gate runner and wiring

**Prompt**: `tasks/WP02-review-gate-runner-and-wiring.md`
**Goal**: `scripts/review-gate.ts` always writes one JUnit report with a test case per check; `.kittify/config.yaml` `review:` runs it.
**Dependencies**: Depends on WP01. **Requirements**: FR-009.

T008 Write the failing runner tests (WP02)
T009 Implement the review-gate runner (WP02)
T010 Wire the gate in `.kittify/config.yaml` (WP02)
T011 Prove the runner's behavior (WP02)
T012 Record the gate evidence (WP02)

**Risks**: a plain `verify && bun test` command fails open (research R-05); the runner prevents it.

### WP03 – Tooling documentation

**Prompt**: `tasks/WP03-tooling-documentation.md`
**Goal**: `docs/tooling.md` describes the shipped toolchain and is formatted, so `format:check` is clean before enforcement.
**Dependencies**: Depends on WP01. Parallel with WP02. **Requirements**: FR-011.

T013 Update stale statements in `docs/tooling.md` (WP03)
T014 Add the Toolchain section (WP03)
T015 Update setup, then format (WP03)
T016 Check and record (WP03)

**Risks**: written from contracts while code lands in parallel; WP05 re-checks it.

## Phase 3 – Architecture

### WP04 – GRACE initialisation

**Prompt**: `tasks/WP04-grace-initialisation.md`
**Goal**: `.grace/` models `M-BUN-VERSION-GUARD` and `M-REVIEW-GATE`; `grace lint --path . --assertions current` is clean with both modules ready.
**Dependencies**: Depends on WP01, WP02. **Requirements**: FR-010.

T017 Create the `.grace/` skeleton (WP04)
T018 Write the GRACE context files (WP04)
T019 Write the graph and verification files (WP04)
T020 Validate GRACE and record (WP04)

**Risks**: module markup must match the scripts from WP01/WP02 exactly.

## Phase 4 – Enforcement

### WP05 – Pre-commit hook and end-to-end check

**Prompt**: `tasks/WP05-pre-commit-hook-and-end-to-end-check.md`
**Goal**: `.githooks/pre-commit` formats and restages, then blocks on lint, typecheck, test and `grace lint`; whole-mission check is green.
**Dependencies**: Depends on WP01, WP02, WP03, WP04. **Requirements**: FR-008.

T021 Write the pre-commit hook (WP05)
T022 Set up a throwaway clone (WP05)
T023 Run the hook acceptance examples (WP05)
T024 End-to-end mission check (WP05)
T025 Clean up and record (WP05)

**Risks**: `core.hooksPath` points at the primary checkout, so the hook is tested only in a throwaway clone.

## Dependency graph

```
WP01 ─┬─> WP02 ──> WP04 ─┐
      └─> WP03 ──────────┴─> WP05
```

MVP: WP01. Parallel: WP02 and WP03 after WP01.

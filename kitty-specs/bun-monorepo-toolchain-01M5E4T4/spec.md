# Mission Specification: Bun Monorepo Toolchain

**Mission Branch**: `feat/bun-monorepo-toolchain`
**Created**: 2026-10-21
**Status**: Draft
**Input**: User description: "setup latest bun full ecosystem for monorepo development"

## Intent Summary

The repository has agent workflow tooling (Spec Kitty, GRACE skills, commit-message hook) but no application toolchain. This mission turns it into a Bun workspaces monorepo skeleton with Bun's own type checking, linting, formatting and testing, a minimum Bun version, a pre-commit hook, Spec Kitty's review gate wired to the same checks, and GRACE architecture tracking initialised for the workspace boundaries. No application or library packages are created; later product missions add them into a consistent, verified base.

Owner decisions (recorded as Decision Moments): Bun only, no extra task runner or linter; skeleton only; strict TypeScript with project references; Bun canary at or above `1.4.4-canary.1` (the first build that ships `bun lint` and `bun fmt`); pre-commit auto-formats and blocks on lint, typecheck, test and GRACE failures; no CI for now; `grace-init` included.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install and run checks on a fresh clone (Priority: P1)

A developer or coding agent clones the repository on a machine with a supported Bun, installs dependencies, and runs one command per check (typecheck, lint, format check, test, architecture lint). Every check passes on the empty skeleton.

**Why this priority**: Every later mission depends on a working install and trustworthy checks.

**Independent Test**: On a fresh clone, run install and each check command; all exit 0.

**Acceptance Scenarios**:

1. **Given** a fresh clone and a supported Bun, **When** the developer installs dependencies, **Then** install succeeds and the lockfile is unchanged.
2. **Given** an installed skeleton, **When** the developer runs each check command, **Then** each exits 0.
3. **Given** a file with a type error, lint error or formatting deviation, **When** the matching check runs, **Then** it exits non-zero and names the file.

---

### User Story 2 - Commit with automatic checks (Priority: P1)

A developer stages changes and commits. The hook formats the staged files and restages them, then runs lint, typecheck, tests and the architecture lint. Any error blocks the commit; lint warnings do not.

**Why this priority**: Keeps `main` and mission branches clean without relying on memory.

**Independent Test**: Stage a badly formatted but valid file and commit (commit succeeds, file is formatted). Stage a file with a lint error and commit (commit is blocked).

**Acceptance Scenarios**:

1. **Given** a staged file with formatting deviations only, **When** the developer commits, **Then** the file is reformatted, restaged, and the commit succeeds.
2. **Given** a staged file with a lint error, a type error or a failing test, **When** the developer commits, **Then** the commit is blocked with a message naming the failing check.
3. **Given** a commit that touches no source files, **When** the developer commits, **Then** the hook completes without error.
4. **Given** a commit message that breaks Conventional Commits, **When** the developer commits, **Then** the existing commit-message hook still rejects it.

---

### User Story 3 - Review gate runs the same checks (Priority: P2)

When a work package goes to review, Spec Kitty runs the repository's full read-only check suite and blocks on any failure.

**Why this priority**: AGENTS.md requires the toolchain mission to wire checks into the review gate.

**Independent Test**: Run the configured review command on the skeleton (passes), then with an introduced error (fails).

**Acceptance Scenarios**:

1. **Given** the skeleton, **When** the review command runs, **Then** it exits 0 and modifies no files.
2. **Given** any check failing, **When** the review command runs, **Then** it exits non-zero.

---

### User Story 4 - Unsupported Bun is refused clearly (Priority: P2)

A developer with a Bun older than the minimum tries to install or run checks and gets a clear message stating the required version and how to upgrade.

**Why this priority**: `bun lint` and `bun fmt` do not exist before the minimum version; silent failures would confuse.

**Independent Test**: Simulate an older version and confirm the message.

**Acceptance Scenarios**:

1. **Given** Bun older than `1.4.4-canary.1`, **When** the developer installs or runs a check, **Then** it fails with the required version and the upgrade command.

---

### User Story 5 - Architecture tracking starts with the skeleton (Priority: P3)

The GRACE knowledge base exists and describes the workspace layout (apps and packages areas), and its lint passes, so later missions extend it instead of bootstrapping it.

**Why this priority**: Owner chose to start GRACE now; it must be valid from day one.

**Independent Test**: Run `grace lint --path . --assertions current`; it passes.

**Acceptance Scenarios**:

1. **Given** the mission is complete, **When** the architecture lint runs, **Then** it exits 0.

### Edge Cases

- Bun missing entirely: hook and checks report that Bun is required instead of a shell error.
- A newer canary changes formatter output: allowed by the minimum-version rule; a reformat is an ordinary follow-up commit.
- No source files exist in the skeleton: typecheck, lint, format and test all pass without placeholder code.
- Spec Kitty commits made on mission branches pass through the pre-commit hook and must not be broken by it.
- `grace` CLI missing on a machine: the hook fails with a pointer to the setup in `docs/tooling.md`.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Workspace skeleton | As a developer, I want the root to declare `apps/*` and `packages/*` workspaces with a committed lockfile so that a fresh install succeeds. | High | Open |
| FR-002 | Strict shared TypeScript base | As a developer, I want a strict shared TypeScript base that future packages extend, with project references at the root, so that typing is consistent. | High | Open |
| FR-003 | Typecheck command | As a developer, I want one command that type-checks the whole repository with Bun's built-in checker so that type errors are caught. | High | Open |
| FR-004 | Lint command | As a developer, I want one command that lints the repository with Bun's built-in linter, configured in the repository's Bun config, so that defects are caught. | High | Open |
| FR-005 | Format and format-check commands | As a developer, I want a command that formats the repository and a read-only command that checks formatting so that style is consistent. | High | Open |
| FR-006 | Test command | As a developer, I want one command that runs Bun's test runner and passes when no tests exist so that real tests run as soon as packages add them, without fake tests. | High | Open |
| FR-007 | Minimum Bun version | As a developer, I want the minimum Bun version (`>=1.4.4-canary.1`) declared and enforced so that an unsupported Bun fails clearly with upgrade guidance. | High | Open |
| FR-008 | Pre-commit hook | As a developer, I want a pre-commit hook in `.githooks/` that formats and restages staged files, then runs lint, typecheck, tests and the architecture lint, blocking on any error, so that broken code is not committed. | High | Open |
| FR-009 | Review gate wiring | As the workflow owner, I want Spec Kitty's review test command to run format check, lint, typecheck, tests and the architecture lint so that reviews block on failures. | High | Open |
| FR-010 | GRACE initialisation | As the architecture owner, I want GRACE initialised to describe the workspace skeleton and pass its lint so that architecture tracking starts now. | Medium | Open |
| FR-011 | Tooling documentation | As a developer, I want `docs/tooling.md` to describe the toolchain, the canary requirement, the commands, the hook and GRACE so that setup on a new machine is clear. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Clean baseline | 100% of check commands exit 0 on the skeleton; any failure exits non-zero. | Reliability | High | Open |
| NFR-002 | Fast commits | The pre-commit hook completes in under 5 seconds on the skeleton on the owner's machine. | Performance | Medium | Open |
| NFR-003 | Read-only review | The review command modifies 0 tracked files. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Bun-only toolchain | No CI, no extra task runner (Turborepo, Nx), no extra linter or formatter, no example packages. | Technical | High | Open |
| C-002 | No fake checks | No placeholder tests, scripts or source files that exist only to make checks pass. | Technical | High | Open |
| C-003 | Commit-msg hook intact | The existing `.githooks/commit-msg` behavior is unchanged. | Technical | High | Open |
| C-004 | Governance files | `AGENTS.md`, `CLAUDE.md` and the charter are not edited without separate owner approval; `.kittify/config.yaml` changes are limited to the review gate wiring approved here. | Business | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh clone on a supported Bun goes from clone to all checks passing with one install command and no manual edits.
- **SC-002**: 100% of commits containing a lint error, type error or failing test are blocked by the hook.
- **SC-003**: 100% of reviews run the full check suite and block on any failure.
- **SC-004**: An unsupported Bun produces a message naming the required version in 100% of install and check attempts.

## Assumptions

- The owner's machine runs Bun `1.4.4-canary.1` (verified) and `grace` CLI 4.2.1 (verified).
- `core.hooksPath` already points at `.githooks/` per `docs/tooling.md`.
- When a stable Bun release ships `bun lint` and `bun fmt`, a follow-up change may raise the minimum to that stable version.

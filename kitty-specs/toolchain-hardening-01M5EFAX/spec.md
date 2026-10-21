# Mission Specification: Toolchain Hardening

**Mission Branch**: `feat/bun-monorepo-toolchain`
**Created**: 2026-10-21
**Status**: Draft
**Input**: User description: "Toolchain hardening follow-up to bun-monorepo-toolchain. Fix findings from the post-merge mission review."

## Intent Summary

The Bun monorepo toolchain mission shipped a review gate, a pre-commit hook and their documentation. Its post-merge review found gaps where the safety net can silently fail open or get in the way of Spec Kitty's own commits. This mission closes those gaps with the tools already in the repository. It adds no tools, no dependencies and no example packages.

Discovery was minimized at the owner's request ("less questions, do what you recommend"). The scenarios below come from the review report's reproduced findings (F1, F3, F7, F8, F10). Assumptions are listed at the end and are the author's recommendations, not confirmed owner answers.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The review gate never fails open (Priority: P1)

A coding agent claims a work package for review in a harness that forces coloured terminal output. A check fails, for example a type error. The review gate still records the failure and blocks the review.

**Why this priority**: The gate exists to block failing work. With colour forced, the report is unreadable to Spec Kitty, which then only warns. That defeats the gate.

**Independent Test**: Run the gate with colour forced and a deliberately failing check. Spec Kitty's parser reads the report and counts the failure.

**Acceptance Scenarios**:

1. **Given** colour output is forced and a check fails, **When** the review gate runs, **Then** the report is well-formed, names the failing check, and the gate exits non-zero.
2. **Given** a check prints control characters (for example escape codes), **When** the gate builds the report, **Then** those characters never make the report unparsable.
3. **Given** a check fails, **When** the reviewer reads the report, **Then** the failure message shows the first real error line from that check, not Bun's wrapper line or a test summary line.

---

### User Story 2 - Spec Kitty's own commits are not blocked by the hook (Priority: P1)

Spec Kitty records status and planning files in its coordination and lane worktrees. Those worktrees often have no installed dependencies. A commit that only touches mission bookkeeping files goes through the pre-commit hook without needing them.

**Why this priority**: Today the hook blocks Spec Kitty's bookkeeping commits until someone runs an install in every new worktree, which stalls the mission workflow.

**Independent Test**: In a worktree with no installed dependencies, commit a change to one file under `kitty-specs/`. The commit succeeds quickly. Then commit a change to a source file there. The commit is blocked with the existing message.

**Acceptance Scenarios**:

1. **Given** no installed dependencies and every staged path under `kitty-specs/` or `.kittify/`, **When** the developer commits, **Then** the hook passes without running checks.
2. **Given** no installed dependencies and at least one staged path elsewhere, **When** the developer commits, **Then** the hook blocks with `pre-commit: dependencies not installed. Run: bun install`.
3. **Given** installed dependencies and a mix of bookkeeping and source paths, **When** the developer commits, **Then** all existing checks run as before.
4. **Given** a commit message that breaks Conventional Commits, **When** the developer commits, **Then** the existing commit-message hook still rejects it.

---

### User Story 3 - Local review artifacts and docs are consistent (Priority: P2)

Spec Kitty's untracked `.spec-kitty/` folder is ignored by git, and the documented ignore lists match the shipped configuration.

**Why this priority**: A stray `git add -A` can otherwise commit a transient lock file. Documentation that disagrees with the configuration misleads the next author.

**Independent Test**: Create `.spec-kitty/review-lock.json` and run `git status`; it is not listed. Read the data model and compare its ignore list to `bunfig.toml`.

**Acceptance Scenarios**:

1. **Given** `.spec-kitty/review-lock.json` exists, **When** the developer runs `git status`, **Then** it is not shown as untracked.
2. **Given** the data model document, **When** compared with `bunfig.toml`, **Then** the lint and format ignore lists match.

---

### User Story 4 - Every check refuses an unsupported Bun (Priority: P3)

A developer who downgrades Bun after installing runs a single check, not the full suite, and still gets the clear upgrade message.

**Why this priority**: The version guard currently runs on install and in the full suite only. This is a small completeness gap.

**Independent Test**: Run each of `lint`, `typecheck` and `test` with a simulated old Bun; each prints the required version and the upgrade command.

**Acceptance Scenarios**:

1. **Given** Bun older than the minimum, **When** the developer runs the lint, typecheck or test command, **Then** it fails with the required version and the upgrade command.
2. **Given** a supported Bun, **When** the developer runs those commands, **Then** behavior is unchanged.

### Edge Cases

- A staged set that is empty (for example some merge commits): the hook behaves as it does today.
- A check prints no output at all before failing: the failure message falls back to the last non-empty line, then to the exit code.
- Control characters inside multi-byte text: the report keeps valid text and drops only characters that XML cannot represent.
- A path that merely starts with `kitty-specs` or `.kittify` (for example `kitty-specs-extra/`) is not treated as bookkeeping.
- A rename or deletion under `kitty-specs/` counts as a bookkeeping path.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Well-formed review report | As a reviewer, I want the review report to stay well-formed when any check prints control or escape characters so that failures are never lost. | High | Open |
| FR-002 | Escape-code regression test | As a maintainer, I want an automated test that feeds escape-code output through the report builder and proves the result is well-formed so that FR-001 cannot regress. | High | Open |
| FR-003 | Useful failure messages | As a reviewer, I want each failed check's message to show the first line of that check's output that reports an error, falling back to the last non-empty line, so that I can see the cause. | Medium | Open |
| FR-004 | Bookkeeping commits pass | As Spec Kitty, I want commits whose staged paths are all under `kitty-specs/` or `.kittify/` to pass the pre-commit hook without installed dependencies so that workflow commits are not blocked. | High | Open |
| FR-005 | Mixed commits unchanged | As a developer, I want any commit with at least one staged path outside `kitty-specs/` and `.kittify/` to keep the full existing hook behavior so that code is still checked. | High | Open |
| FR-006 | Contract and docs updated | As a developer, I want the hook contract, the review gate contract and `docs/tooling.md` to describe the new hook rule, the report sanitizing and the message format so that documentation matches behavior. | Medium | Open |
| FR-007 | Ignore the review lock folder | As a developer, I want `.spec-kitty/` listed in `.gitignore` so that its transient files are never committed by accident. | Medium | Open |
| FR-008 | Data model matches config | As an author, I want the data model document's ignore lists to match `bunfig.toml` so that documentation is accurate. | Low | Open |
| FR-009 | Guard on every check | As a developer, I want the lint, typecheck and test commands to run the Bun version guard first so that an unsupported Bun is always refused clearly. | Low | Open |
| FR-010 | GRACE kept in sync | As the architecture owner, I want the GRACE model and the file markup of the review gate module updated with every change to it (contract text, module map, verification entry and its test command) so that the architecture lint stays clean and the model stays truthful. | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Report always parsable | For 100% of tested check outputs that contain characters XML 1.0 cannot represent, the generated report parses without error. | Reliability | High | Open |
| NFR-002 | Fast bookkeeping commits | A bookkeeping-only commit completes the pre-commit hook in under 2 seconds in a worktree without installed dependencies. | Performance | Medium | Open |
| NFR-003 | Full hook still fast | A full hook run on the skeleton stays under 5 seconds. | Performance | Medium | Open |
| NFR-004 | Gate stays read-only | The review gate modifies 0 tracked files. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No new tools or dependencies | No new dependency, runner, linter or CI; Bun only. | Technical | High | Open |
| C-002 | No fake checks | No placeholder tests or scripts; every new test fails when its behavior breaks. | Technical | High | Open |
| C-003 | Commit-msg hook intact | `.githooks/commit-msg` is unchanged. | Technical | High | Open |
| C-004 | Governance files | `AGENTS.md`, `CLAUDE.md`, the charter and `.kittify/config.yaml` are not edited. | Business | High | Open |
| C-005 | Hook verified safely | The hook is exercised only in throwaway clones; `core.hooksPath` of the real repository is not changed. | Technical | Medium | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With colour forced, 100% of deliberately failing checks are counted as failures by Spec Kitty's report parser.
- **SC-002**: 100% of bookkeeping-only commits succeed in a worktree without installed dependencies, and 100% of commits that include a source path in such a worktree are blocked.
- **SC-003**: `git status` lists 0 files from `.spec-kitty/`.
- **SC-004**: Every failed check in a report shows a message that is not Bun's wrapper line in 100% of tested failure types (type error, lint error, failing test, format difference).
- **SC-005**: The full suite, including the architecture lint (`grace lint --path . --assertions current`), passes on the repository after the change with both GRACE modules still `ready`.

## Assumptions

- The owner approves this scope as recommended by the post-merge review (findings F1, F3, F7, F8, F10); F10 is included because it is small.
- Bookkeeping paths are exactly those under `kitty-specs/` and `.kittify/`; `.grace/` and the hook's own files are code and stay fully checked.
- Skipping all checks for bookkeeping-only commits is safe because those directories are excluded from lint and format and hold no source that the type checker, tests or GRACE govern.
- Dropping characters that XML cannot represent, or replacing them visibly, is acceptable for failure messages; the exact replacement is a plan decision.
- The `NO_COLOR`/escape-stripping choice is a plan decision, but must not hide real error text.
- GRACE scope: only `M-REVIEW-GATE` (`scripts/review-gate.ts` and its test) and, if the version guard script changes, `M-BUN-VERSION-GUARD` are affected; the hook, `.gitignore` and documents are not GRACE-governed modules, so no new module is added.
- Lock files and other Spec Kitty runtime folders stay untracked; only `.spec-kitty/` is added to `.gitignore`.

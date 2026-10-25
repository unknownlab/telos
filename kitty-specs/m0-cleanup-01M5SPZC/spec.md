# Mission Specification: M0 Cleanup

**Mission Branch**: `feat/m0-cleanup`
**Created**: 2026-10-25
**Status**: Draft
**Input**: User description: "M0 cleanup: drop all docs, GRACE artifacts and doc-only checks from the Telos repo without changing kernel, packs or calculator behavior"

## Intent Summary

M0 is the first mission of the owner's framework rewrite. The owner decided to drop everything about documentation at this stage: "we can drop everything about docs; when Telos is written by Telos we will build new docs" (relayed by the coordinator, recorded as decision `01M5SPZR7EDPG88GN26BZND70E`). The owner also asked to "just remove comments everywhere" (`apps/calculator/src/app.ts`, line 1; decision `01M5SPZSTWB18VBTM1SQ9AS1VY`).

- **Primary actor**: the owner and the agents that run the next rewrite missions (M1 onward).
- **Trigger**: the rewrite plan (`human-notes.md`, item 5 "drop docs, its cost a lot for this stage") and the inline review notes recorded in commit `5fcb4dc`.
- **Outcome**: a repository that holds only working code, its tests and its tooling. The documentation site, the `docs/` folder, the GRACE knowledge layer, all code comments and the checks that exist only for them are gone. Every remaining check is green.
- **Invariant**: kernel, Pack and calculator behavior does not change. Every owner review note (`//@unknownhero`) stays in place, word for word, until M1 acts on it.
- **Boundary**: until Telos is rewritten by Telos, the kernel is developed through Spec Kitty missions, not through its own Rules. M0 adds no Telos Rule, Archetype or verification.

The intent was confirmed by the owner's answers that the coordinator relayed to this specify session. Three smaller scope questions remain open for the owner (see the markers below and "Open Questions").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start the rewrite from working code only (Priority: P1)

The owner opens the repository to start M1. Apart from code, tests, tooling and mission records, nothing else is left: no documentation site, no `docs/` folder, no `.grace/` folder and no contract or prose comments in the code. The only comments left in the code are the owner's own review notes, so M1 can find each one with a single search.

**Why this priority**: this is the whole point of M0. Documentation and GRACE artifacts cost effort on every change, and the rewrite would otherwise have to keep them in sync.

**Independent Test**: search the tracked files for the removed folders, the GRACE markers and comments. Only the allowed exceptions are found.

**Acceptance Scenarios**:

1. **Given** the merged M0 branch, **When** the tracked files are listed, **Then** nothing is tracked under `apps/docs/`, `docs/` or `.grace/`.
2. **Given** the merged M0 branch, **When** the TypeScript sources are scanned for comments, **Then** the only comments found are the 34 owner review notes and the 7 `@ts-expect-error` directives.
3. **Given** the merged M0 branch, **When** each of the 34 owner review notes is compared with its text at commit `5fcb4dc`, **Then** every note is present with unchanged text and still sits next to the same code.

---

### User Story 2 - Every remaining check is green (Priority: P1)

An agent runs the full check suite and the Spec Kitty review gate. Both run only the checks that still have something to check, and all of them pass.

**Why this priority**: the next missions rely on an honest, green baseline. A check that points at removed files would block every review.

**Independent Test**: run the full check suite and the review gate on the M0 branch.

**Acceptance Scenarios**:

1. **Given** the M0 branch, **When** the full check suite runs, **Then** it runs the version guard, format check, lint, typecheck, tests and the repository self-check (`telos:check`), and every step passes.
2. **Given** the M0 branch, **When** the review gate runs, **Then** it runs the same steps in the same order, writes one well-formed report and exits successfully.
3. **Given** the M0 branch, **When** the pre-commit hook runs on a staged code change, **Then** it runs format, lint, typecheck and tests, does not ask for the GRACE CLI, and passes.

---

### User Story 3 - Behavior stays the same (Priority: P1)

A user of the calculator (CLI, web page or agent tools) and a user of the kernel and Packs see exactly the same behavior as before M0.

**Why this priority**: M0 is a cleanup. Any behavior change would be a silent defect, which is the failure the project fears most.

**Independent Test**: run the kernel, Pack and calculator tests, and compare a fixed set of command outputs before and after M0.

**Acceptance Scenarios**:

1. **Given** the M0 branch, **When** the kernel, Pack and calculator tests run, **Then** every test that exists at the M0 baseline and is not listed for removal passes without any change to what it asserts.
2. **Given** the same inputs, **When** the calculator CLI, the calculator MCP server and the agent demo run before and after M0, **Then** their outputs are byte-identical.
3. **Given** the M0 branch, **When** the public exports of the kernel and Pack packages are listed, **Then** they are identical to the baseline.

---

### User Story 4 - The owner approves the rule changes (Priority: P2)

The owner reads one list of the exact edits that `AGENTS.md`, `CLAUDE.md` and the charter need now that documentation and GRACE are gone, and approves or rejects each one. Agents may not make those edits themselves.

**Why this priority**: without these edits the agent rules still point at removed files and offer GRACE, but the edits are owner-only.

**Independent Test**: the "Owner-only follow-ups" section below lists each edit with its file, its location and the replacement text.

**Acceptance Scenarios**:

1. **Given** this spec, **When** the owner reads "Owner-only follow-ups", **Then** each needed edit names the file, the passage and the proposed change.
2. **Given** the M0 implementation, **When** its diff is reviewed, **Then** it does not change `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml` or any charter file.

---

### Edge Cases

- **Comment-like text inside strings** (URLs, source fixtures in closure tests, glob patterns such as `**/*.ts`) is data, not a comment, and stays unchanged.
- **`@ts-expect-error` directives** (7 in kernel tests) are type-level tests read by the type checker. They are functional and stay.
- **A note on the same line as code** (for example `readonly tag: string; //@unknownhero ...`) stays on that line after the other comments are removed.
- **A note inside or next to a removed GRACE block** (for example line 1 of `apps/calculator/src/app.ts`) stays at the same place relative to the code it is about.
- **Owner notes inside the docs**: `docs/guides/examples.md` holds 7 `//@unknownhero` notes. Each one is a copy of a note in `apps/calculator/src/app.ts` or `apps/calculator/src/arithmetic.ts`, which stays. Dropping the guide loses no note.
- **Snippet regions**: the docs build copied code regions marked by `START_BLOCK_*` / `END_BLOCK_*` markers into the guides. With the docs gone, these markers lose their last reader. The one other reader is the calculator ergonomics test (open question Q2).
- **Line positions**: removing comments moves lines up. Kernel and Pack results for the same input do not change. The repository self-report (`bun run telos ...`) may show different line positions for repository files and no longer lists the docs-site Locus. Both are expected.
- **Historical records** (`kitty-specs/`, `kitty-ops/`, `.kittify/archive/`, `tools/agents/experiments/`, `tools/agents/usage/ledgers/`) mention removed paths. They are records of past work and stay unchanged.
- **Lockfile**: removing the documentation workspace removes its dependencies from the lockfile. No version of a remaining dependency may change.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Remove the documentation site | As the owner, I want the `apps/docs` workspace (`@telos/docs`) removed completely, including its sources, tests, browser tests, scripts and configuration, so that no code exists only to render documentation. | High | Open |
| FR-002 | Remove the docs folder | As the owner, I want `docs/foundation/`, `docs/decisions/`, `docs/research/` and `docs/guides/` removed, so that no documentation has to be kept in sync during the rewrite. What happens to `docs/tooling.md` is open question Q1. | High | Open |
| FR-003 | Remove the GRACE knowledge layer | As the owner, I want the `.grace/` folder and the `grace:lint` script removed, so that no architecture artifact has to be kept in sync with the code. | High | Open |
| FR-004 | Remove documentation-only check steps | As an agent, I want `docs:build`, `docs:preview`, `test:e2e` and `grace:lint` removed from the root scripts, the full check suite (`verify`) and the review gate's step list, so that the gate runs only checks that still have something to check. The review gate keeps the order of the remaining steps and stays in step with `verify`. | High | Open |
| FR-005 | Remove the GRACE step from the pre-commit hook | As a developer, I want the pre-commit hook to stop requiring the GRACE CLI and running `grace lint`, so that a commit needs only the Bun toolchain. | High | Open |
| FR-006 | Remove the docs-site Locus from the repository model | As an agent, I want the `telos:docs-site` Locus removed from the repository model, and the documentation globs, exclusions and the `@/` path alias removed from the closure scope, so that `telos:check` covers exactly the files that remain. No other Locus, Rule or verification of the repository model changes. | High | Open |
| FR-007 | Remove all code comments except owner notes and directives | As the owner, I want every comment removed from the tracked TypeScript sources in `packages/`, `apps/calculator/`, `scripts/` and `telos.ts`, including all GRACE markup (`START_MODULE_CONTRACT`, `START_MODULE_MAP`, `START_CONTRACT`, `START_BLOCK_*` and their `END_*` counterparts), so that the code carries no description that can drift from it. Owner review notes (`//@unknownhero ...`) and functional directives (`@ts-expect-error`) stay. | High | Open |
| FR-008 | Keep every owner review note | As the owner, I want all 34 `//@unknownhero` notes in `apps/calculator/src/` kept word for word, each next to the code it comments on, so that M1 can act on each one. | High | Open |
| FR-009 | Remove tests that check only docs or markup | As an agent, I want each test that exists only to check documentation, the docs build or GRACE markup removed, and each test that also checks real behavior updated to the new state, so that no test checks something that is gone and no fake test is left. The calculator ergonomics test is open question Q2. | High | Open |
| FR-010 | Update tooling configuration | As a developer, I want every reference to removed paths taken out of the workspace configuration: the TypeScript project references, the formatter and linter ignore lists, the test configuration and the ignore files, so that the toolchain no longer expects removed folders. | High | Open |
| FR-011 | Update the README | As a reader of the repository, I want `README.md` to list only the workspaces and commands that exist, with no links into removed documentation. | Medium | Open |
| FR-012 | Update the project glossary | As an agent, I want the project glossary entries (`.kittify/glossaries/team_domain.yaml`) that mention `docs/foundation`, `grace lint` or GRACE updated or removed, so that the glossary does not describe removed checks or folders. | Medium | Open |
| FR-013 | Update agent tooling notes | As an agent, I want `tools/agents/settings/README.md` and any other tracked tooling note outside the historical records to stop pointing at removed files, following the answer to Q1. | Medium | Open |
| FR-014 | Keep the repository report command as decided | As an agent, I want the `report` command of `bun run telos` handled as the owner decides in Q3. If it stays, its behavior and tests stay; only wording that names the docs site goes. | Low | Open |
| FR-015 | List the owner-only rule edits | As the owner, I want the exact edits that `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml` and the charter need listed for my approval, so that agent rules stop pointing at removed files once I approve them. The mission makes none of these edits itself. | High | Open |

[NEEDS CLARIFICATION: Q1 - drop docs/tooling.md, or move a trimmed copy (no docs or GRACE content) out of docs/, for example to tools/README.md? AGENTS.md, the pre-commit hook messages and tools/agents/settings/README.md point to it for one-time setup.] <!-- decision_id: 01M5SQ070BR65M0VX1JHQXG5XT -->

[NEEDS CLARIFICATION: Q2 - apps/calculator/test/ergonomics.test.ts enforces the old NFR-008 size and style limit on the arithmetic definition and finds it through the START_BLOCK_ARITHMETIC_LOCUS markers. Drop the test with the markers, or keep the two markers and the test as the only exception?] <!-- decision_id: 01M5SQ08RWEEYCR1W3EB2FKF6J -->

[NEEDS CLARIFICATION: Q3 - bun run telos report --out writes the semantic report the docs site consumed; with the site gone it has no consumer. Keep the command unchanged, or remove it and its tests?] <!-- decision_id: 01M5SQ0AEYG7J8VNE7GP1XM4PH -->

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Behavior preserved | 100% of the kernel, Pack and calculator test cases that exist at the M0 baseline and are not listed for removal under FR-009 pass, and none of their assertions changes. | Reliability | High | Open |
| NFR-002 | Identical command outputs | For a fixed sample (at least each calculator operation through the CLI, one division by zero, one invalid input, `--help`, the MCP tool list and the agent demo), output and exit code are byte-identical before and after M0. | Reliability | High | Open |
| NFR-003 | Identical public surface | The set of exported names of every kernel and Pack entry point is identical before and after M0. | Reliability | High | Open |
| NFR-004 | No stray comments | A scan of the tracked TypeScript sources finds exactly 34 `//@unknownhero` comments, 7 `@ts-expect-error` directives and 0 other comments. | Maintainability | High | Open |
| NFR-005 | No references to removed paths | A search of the tracked files, outside the historical records and the owner-only files listed in C-004, finds 0 matches for `apps/docs`, `@telos/docs`, a `docs/` path, `.grace`, `grace lint`, `grace:lint`, `docs:build`, `docs:preview`, `test:e2e`, `START_MODULE`, `START_CONTRACT`, `END_CONTRACT`, `START_BLOCK` and `END_BLOCK`, except the exceptions allowed by the answers to Q1 and Q2. | Maintainability | High | Open |
| NFR-006 | Removal-only lockfile change | The lockfile diff only removes entries. No version of a dependency that a remaining workspace uses changes, and no dependency is added. | Security | High | Open |
| NFR-007 | Fast checks | The full check suite finishes in under 60 seconds on the owner's machine (charter target), and no slower than at the M0 baseline. | Performance | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | No behavior change | Kernel, Pack and calculator behavior does not change. Code changes in `packages/` and `apps/calculator/` remove comments and markup only. | Technical | High | Open |
| C-002 | Kernel stays driven by Spec Kitty | M0 adds no Telos Rule, Archetype or verification. Until Telos is rewritten by Telos, kernel work is governed by Spec Kitty missions, not by the kernel's own Rules. | Business | High | Open |
| C-003 | No new or upgraded dependencies | M0 adds no dependency and upgrades none. `effect-machine` and any other library the owner named for the rewrite belong to M1. | Technical | High | Open |
| C-004 | Owner-only files untouched | The mission does not edit `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml`, `.kittify/charter/` or `human-notes.md`. The needed edits are listed under "Owner-only follow-ups". | Business | High | Open |
| C-005 | No fake tests | No test or check is replaced by a placeholder or a check that verifies nothing. A removed test is deleted, not emptied or skipped. | Technical | High | Open |
| C-006 | Historical records unchanged | `kitty-specs/` of earlier missions, `kitty-ops/`, `.kittify/archive/`, `tools/agents/experiments/` and `tools/agents/usage/ledgers/` stay unchanged, even where they mention removed paths. | Business | Medium | Open |
| C-007 | No rewrite work | M0 does not act on any owner review note and does not start the redesign (state machines, branded types, compositions, a single global Locus). That is M1 and later. | Business | High | Open |
| C-008 | Machine-local installs untouched | M0 does not uninstall the GRACE CLI or the GRACE skills that are installed locally under `.claude/skills/`, `.agents/skills/` or `.codex/`. Those are outside the tracked repository (see "Owner-only follow-ups"). | Business | Medium | Open |

### Key Entities

- **Owner review note**: a TypeScript line comment that begins with `//@unknownhero`. There are 34 in `apps/calculator/src/` (28 in `app.ts`, 3 in `arithmetic.ts`, 2 in `interfaces.ts`, 1 in `errors.ts`).
- **Functional directive**: a comment that the toolchain reads and that changes its result. Today only `@ts-expect-error` exists (7, in kernel tests).
- **GRACE markup**: the `START_*` / `END_*` comment blocks (module contracts, module maps, function contracts, code blocks) that GRACE and the docs build read.
- **Check suite**: the steps that `bun run verify` runs and the review gate mirrors. After M0: `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `telos:check`.
- **Historical record**: a file that records past work (mission artifacts, Ops, archives, experiments, usage ledgers). It is never rewritten to match the present.

## Domain Language

| Term | Meaning in this spec | Avoid |
|------|----------------------|-------|
| Comment | A TypeScript line comment (`// ...`) or block comment (`/* ... */`, `/** ... */`) outside string and template literals. | "doc comment" for GRACE markup |
| Owner review note | See Key Entities. Never removed or reworded by M0. | "TODO", "annotation" |
| Docs | The `apps/docs` site, the `docs/` folder and everything that exists only to build, check or test them. | |
| Locus, Archetype, Rule, Pack | As used in the current code. M0 does not redefine them. The definitions in `docs/foundation/terminology/` go away with the docs. | |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 tracked files remain under `apps/docs/`, `.grace/` and `docs/` (with only the `docs/tooling.md` outcome that Q1 allows).
- **SC-002**: Every step of the full check suite and of the review gate passes on the M0 branch (6 of 6 steps), and both list the same steps in the same order.
- **SC-003**: 100% of the remaining kernel, Pack and calculator test cases pass with unchanged assertions, and 100% of the sampled command outputs are byte-identical to the baseline.
- **SC-004**: The comment scan finds exactly 34 owner review notes, 7 `@ts-expect-error` directives and 0 other comments.
- **SC-005**: The reference search of NFR-005 finds 0 matches.
- **SC-006**: The owner can approve or reject each owner-only follow-up from this spec without reading any other file.

## Assumptions

- The coordinator relayed the owner's answers faithfully. They are recorded as resolved decisions `01M5SPZR7EDPG88GN26BZND70E` (docs scope) and `01M5SPZSTWB18VBTM1SQ9AS1VY` (comment policy).
- "All in-code comments" means comments in the tracked TypeScript sources. Comments in shell hooks, TOML, YAML and other configuration files are out of scope, because they are tooling, not code. Comments that only describe removed docs or GRACE steps in those files are removed under FR-004, FR-005 and FR-010.
- Removing the dependencies that only the documentation workspace used follows from the owner's decision to drop the docs. It is not a new dependency decision.
- `human-notes.md` is an owner file and stays.
- This is not a bulk-edit (rename) mission in the DIRECTIVE_035 sense: it renames no identifier, path or key, it removes whole folders and comments. The plan may revisit this if it finds a cross-file string change.

## Open Questions (for the owner)

- **Q1 - `docs/tooling.md`** (decision `01M5SQ070BR65M0VX1JHQXG5XT`): drop it, or move a trimmed copy (no docs or GRACE content) out of `docs/`? Recommended: move it to `tools/README.md`. It is the only description of the one-time machine setup (hooks path, Spec Kitty hooks, Bun canary), and `AGENTS.md` sends the owner there when tools are missing.
- **Q2 - calculator ergonomics test** (decision `01M5SQ08RWEEYCR1W3EB2FKF6J`): drop `apps/calculator/test/ergonomics.test.ts` together with the `START_BLOCK_ARITHMETIC_LOCUS` markers, or keep both as the only exception? Recommended: drop both. The test measures the shape of the old calculator API that M1 replaces, and it cannot find its region without the markers.
- **Q3 - `telos report`** (decision `01M5SQ0AEYG7J8VNE7GP1XM4PH`): keep the command, or remove it and its tests? Recommended: keep it unchanged. It is a general command, it is tested, and removing it is not needed to drop the docs.

## Owner-only follow-ups

The mission does not make these edits (C-004). Each one needs the owner's approval. After approval the coordinator or a follow-up commit applies them. Where the text depends on Q1, both variants are given.

### `AGENTS.md`

1. **Intro paragraph, last sentence**: "The owner-facing overview is `docs/tooling.md`."
   If Q1 = move: change the path to `tools/README.md`. If Q1 = drop: delete the sentence.
2. **Section "Telos foundation"**: delete the whole section (heading and paragraph). It points to `docs/foundation/`, `docs/decisions/`, `docs/research/`, `docs/foundation/terminology/` and `apps/docs`, which are all removed. Optional replacement, one line: "There is no product documentation until Telos is written by Telos. Product terms are used as they appear in the code."
3. **Section "Read state before working"**: delete the bullet "if `.grace/` exists: `grace status --path . --json`".
4. **Section "Routing"**, bullet "Questions, investigation, explanation": delete the sentence "When `.grace/` exists, use `grace-ask` and `grace-cli`."
5. **Section "Routing"**: delete the bullet that begins "**GRACE** owns architecture knowledge and its validation".
6. **Section "Routing"**, bullet "**Spec Kitty** owns the change lifecycle": shorten to "**Spec Kitty** owns the change lifecycle. The mission is the change record." (drop the list of GRACE skills not to use).
7. **Section "Routing"**: delete the bullet "If `.grace/` is absent, do not create it yourself. Offer `grace-init` ...". Without this edit agents would keep offering `grace-init` once `.grace/` is gone.
8. **Section "Owner decisions"**, bullet "Architecture": remove ", `grace-init`".
9. **Section "Verification"**, first bullet group: delete "Add `grace lint` when `.grace/` exists."
10. **Section "Git and setup"**, last bullet: change "If `spec-kitty`, `grace`, or the project skills are missing" to "If `spec-kitty` or the project skills are missing", and change `docs/tooling.md` to `tools/README.md` (Q1 = move) or to "the one-time setup the owner keeps" (Q1 = drop; the owner chooses where).
11. **Optional new rule** (section "Verification" or a new "Code" section), proposed so the cleanup holds: "Write no code comments. The only exceptions are owner review notes (`//@unknownhero`) and directives the toolchain reads, such as `@ts-expect-error`."

The Spec Kitty-generated block at the top of `AGENTS.md` needs no change.

### `CLAUDE.md`

No change. It only imports `AGENTS.md`.

### `.kittify/config.yaml`

No change needed. `review.test_command` still runs `scripts/review-gate.ts`, which M0 keeps and updates. `project.path_conventions` names only `packages/`.

### Charter (`.kittify/charter/`)

The charter text lives in `interview/answers.yaml` and `charter.md`. `charter.yaml` is regenerated from them. Proposed edits:

1. `answers.yaml` `project_intent`: delete "; GRACE holds architecture knowledge".
2. `answers.yaml` `quality_gates`: replace "format check, lint, typecheck, tests, the documentation build with its Verification check, the browser tests and grace lint (bun run verify). The pre-commit hook runs the fast checks on staged work (no documentation build, no browser tests)." with "format check, lint, typecheck, tests and the repository self-check (bun run verify). The pre-commit hook runs format, lint, typecheck and tests on staged work."
3. `answers.yaml` `review_policy`: in "gate results reported exactly, and GRACE sync", delete ", and GRACE sync".
4. `answers.yaml` `documentation_policy`: replace the whole value. Q1 = move: "tools/README.md is the owner-facing tooling overview and must match shipped behavior in the same mission that changes it. There is no product documentation until Telos is written by Telos. Process terms live in the Spec Kitty glossary." Q1 = drop: the same without the first sentence.
5. `answers.yaml` `risk_boundaries`: in "spec-fidelity review, GRACE contracts and verification, smallest viable diffs", delete "GRACE contracts and verification, ".
6. `charter.md` "What Telos is": delete ", GRACE owns architecture knowledge".
7. `charter.md` "How we work", "Blocking gates": same change as edit 2.
8. `charter.md` "How we work", "One vocabulary": replace with "Process terms live in the Spec Kitty glossary (`.kittify/glossaries/`). There is no product terminology document until Telos is written by Telos."
9. **Directive choice**: decide whether to keep DIRECTIVE_037 (living documentation sync) selected. With no documentation it has nothing to apply to. Recommended: deselect it until docs return.
10. Regenerate `charter.yaml` and commit with a `chore(charter)` message, as the amendment process says.

### Outside the repository

- The GRACE CLI and the GRACE skills installed under `.claude/skills/grace-*`, `.agents/skills/grace-*` and `.codex/` are machine-local and not tracked. Uninstalling them is an owner decision. Keeping them is harmless once `AGENTS.md` no longer routes to them.

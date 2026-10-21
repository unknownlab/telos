# Mission Specification: Locus Foundation — Semantic Identity and Ownership

**Mission Branch**: `feat/locus-foundation` (planning base and merge target)
**Created**: 2026-10-21
**Status**: Draft
**Input**: User description: "Locus Foundation — Semantic Identity and Ownership: first executable slice of Telos CAP-01 (package @telos/locus) plus the documentation site (apps/docs) and controlled playground, per docs/foundation and ADR-0002..ADR-0014"

## Context

Telos by UnknownLab has a written doctrine ([docs/foundation](../../docs/foundation/README.md)) and proposed decisions ([docs/decisions](../../docs/decisions/README.md)) but no working code. This mission delivers the first executable slice of the Semantic Foundation ([CAP-01](../../docs/foundation/architecture/capabilities.md#cap-01-semantic-foundation)) and a documentation site that presents the doctrine and lets readers exercise the real implementation.

The model this mission implements is the Stage 0 model of the [conceptual model](../../docs/foundation/conceptual-model/README.md#4-stage-0-model). The rules it enforces are invariants INV-001 to INV-014 of that document. Where this spec and the foundation documents disagree, this spec governs the mission and the foundation documents are corrected in the same mission.

## Domain Language

Canonical terms are defined in [docs/foundation/terminology](../../docs/foundation/terminology/README.md). The ones this mission uses:

| Term | Meaning in this mission | Avoid |
| --- | --- | --- |
| Locus (plural Loci) | A bounded semantic unit with an Identity, a Charter, at most one owner and typed Relations | component, module, node, entity |
| Identity | The declared name of a Locus or Fabric, `namespace:name` | id path, key, slug |
| Charter | Purpose, responsibilities, exclusions and success conditions of a Locus | contract, spec, description |
| Owner | The one Locus a Locus belongs to; absent for a root | parent (in prose), container |
| Relation | A typed, directed link from one Locus to another | edge, link, dependency (for all kinds) |
| Fabric | A named set of Loci validated together | system, graph, workspace |
| Diagnostic | One reported rule violation, with a stable code | error (for rule violations), warning |
| Decode error | Input that could not be read as a definition at all | diagnostic |
| Revision | An immutable, content-addressed snapshot of one Locus definition | version, commit |
| History | The append-only sequence of Revisions of one Locus; its last entry is the head (baseline) | log, timeline |
| Change set | The structured difference between two Revisions of the same Locus | diff (in prose), patch |
| Executable specification | A data record describing one check with an expected outcome, run by the spec runner | test case (for the record itself) |
| Provenance | Where and when a displayed result was produced | source, status |

"Verified" is not used for anything a person writes; it is only shown next to a real execution result.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Contributor**: a person working in this repository.
- **Agent**: an AI coding agent with access to the repository only.
- **Reader**: a person using the documentation site, who may not have the repository.

### User Story 1 — Define and validate Loci (Priority: P1)

A contributor or agent defines a few Loci, gives some of them owners, connects them with Relations, puts them in a Fabric and validates it. They get back either "valid" or the complete, ordered list of everything wrong.

**Why this priority**: Defining and checking Loci is the core of the Stage 0 model; every other story builds on it.

**Independent Test**: Run the repository test command; the executable specifications for INV-001 to INV-009 pass, including the negative ones.

**Acceptance Scenarios**:

1. **Given** a Fabric of three Loci with well-formed identities and charters, one owning the other two, and a `depends-on` Relation between the two children, **When** the Fabric is validated, **Then** the result is valid with no diagnostics.
2. **Given** a Fabric containing a Locus with a malformed identity, a blank purpose and a Relation to a Locus that does not exist, **When** the Fabric is validated, **Then** the result reports three diagnostics, one per violation, each with a stable code and the identity of the Locus concerned, in a fixed order.
3. **Given** the same invalid Fabric with its Loci, responsibilities and Relations listed in a different order, **When** it is validated, **Then** the diagnostics are identical, in the same order.

---

### User Story 2 — Record and compare Revisions (Priority: P1)

A contributor or agent snapshots a Locus as a Revision, appends it to the Locus's history, changes the definition, appends again and asks what changed. If someone else advanced the history first, the append is refused.

**Why this priority**: Immutable, comparable states and protected baselines are the second half of the Stage 0 model (P07, P08).

**Independent Test**: Run the repository test command; the executable specifications for INV-003 and INV-010 to INV-012 pass.

**Acceptance Scenarios**:

1. **Given** a Locus definition, **When** a Revision is created twice from it, **Then** both have the same id, and the id is the same whether computed in Bun or in a browser.
2. **Given** two definitions that differ only in the order of responsibilities and in source-location metadata, **When** Revisions are created, **Then** their ids are equal and their change set is empty.
3. **Given** a definition and a copy with a changed purpose, **When** Revisions are created, **Then** the ids differ and the change set names the purpose as changed with its old and new values.
4. **Given** a history whose head is Revision A, **When** a caller appends Revision B stating A as the expected head, **Then** B becomes the head.
5. **Given** a history whose head is B, **When** a caller appends Revision C stating A as the expected head, **Then** the append is refused with a stale-baseline error naming the expected and actual heads, and the history still has head B.

---

### User Story 3 — Read the doctrine on the documentation site (Priority: P2)

A reader opens the documentation site, follows the sections from introduction through decisions, searches for a term, switches theme, and sees for every page how mature its content is. An agent fetches `/llms.txt` or the JSON index and gets the same content in machine-readable form.

**Why this priority**: The doctrine must be usable by people and agents who do not read the repository directly.

**Independent Test**: Build the site; the build succeeds only if all content is valid; browser tests open each section, search, and toggle theme.

**Acceptance Scenarios**:

1. **Given** the built site, **When** a reader opens the Principles section, **Then** all 16 principles are listed with their titles and summaries taken from the files in `docs/foundation/principles/`.
2. **Given** a foundation document whose `related` field names an id that does not exist, **When** the site is built, **Then** the build fails and names the file and the missing id.
3. **Given** the built site, **When** a reader searches for "baseline", **Then** the results include the principle "Preserve the baseline" and the term "Revision".
4. **Given** a reader whose system prefers dark mode, **When** they open the site, **Then** it shows the dark theme; **When** they toggle to light and reload, **Then** it stays light.
5. **Given** the built site, **When** an agent fetches `/llms.txt` and the JSON index, **Then** every foundation, decision and research document appears with its id, title, kind, status, maturity, summary and URL.

---

### User Story 4 — Exercise the real package in the playground (Priority: P2)

A reader opens the playground, loads a sample Fabric, edits it, validates it, creates Revisions, appends them to a history, compares them and runs the executable specifications, all in their browser. Every result says that it was run in this browser, when, and against which package version.

**Why this priority**: It makes the model tangible and is the evidence that the documentation shows real behaviour (P09, ADR-0014).

**Independent Test**: Browser tests drive scenarios A–E and compare playground output with output of the same inputs produced in Bun.

**Acceptance Scenarios** (scenarios A–E):

1. **A — Define a Locus**: **Given** the playground's sample definition, **When** the reader validates it, **Then** the result is valid, labelled "run in this browser" with time and package version, and shows the Revision id.
2. **B — Invalid definition**: **Given** the reader removes the purpose and adds a duplicate responsibility, **When** they validate, **Then** both diagnostics are shown with their codes, and no other result is shown as valid.
3. **C — Relations**: **Given** the reader adds a Relation to a missing Locus and two `refines` Relations forming a cycle, **When** they validate, **Then** the missing-target and the cycle diagnostics are shown.
4. **D — Revisions and history**: **Given** a valid definition appended to a history, **When** the reader changes a responsibility and appends again, **Then** the new head and the change set are shown; **When** they then try to append against the earlier head, **Then** the stale-baseline refusal is shown and the history is unchanged.
5. **E — Run the specifications**: **Given** the playground's specification view, **When** the reader runs all specifications, **Then** each specification's id, title, linked invariants and pass or fail result is shown, labelled as a browser run; the build-time Bun results are shown alongside, labelled with the git commit and time of that run.

---

### User Story 5 — Reconstruct the project state as an agent (Priority: P3)

An agent with only the repository finds, from `AGENTS.md`, the foundation entry point, the decision register, the open questions, the mission status and what is implemented, without relying on previous conversations.

**Why this priority**: The directive requires the project state to be reconstructable from the repository; this story checks it explicitly.

**Independent Test**: The Agent Reference page and the `AGENTS.md` pointer section exist, and every path and command they name exists and runs.

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`, **When** an agent follows the foundation pointer, **Then** it reaches `docs/foundation/README.md`, which links the reading order, decisions and open questions.
2. **Given** the Agent Reference page, **When** an agent runs each command it lists, **Then** each command exists and succeeds on a clean checkout.

### Negative Scenarios

Each negative scenario is covered by at least one executable specification expected to fail validation (or to be refused), with the stated diagnostic code family. Exact codes are fixed in the plan.

| ID | Situation | Expected outcome | Invariant |
| --- | --- | --- | --- |
| NS-001 | Identity without a namespace, with uppercase letters, with spaces, or with an empty part | Identity diagnostic per malformed identity | INV-001 |
| NS-002 | Two Loci with the same identity in one Fabric | Duplicate-identity diagnostic naming the identity | INV-002 |
| NS-003 | Blank or whitespace-only purpose | Charter purpose diagnostic | INV-004 |
| NS-004 | Charter with no responsibilities, a blank responsibility, or a duplicated responsibility | One charter diagnostic per problem | INV-004 |
| NS-005 | Owner that is not in the Fabric | Missing-owner diagnostic | INV-005 |
| NS-006 | Locus that names itself as owner | Self-ownership diagnostic | INV-005 |
| NS-007 | Ownership cycle of two and of three Loci | One cycle diagnostic per cycle, listing its members in a fixed order | INV-006 |
| NS-008 | Relation of an unknown kind in external input | Decode error, not a diagnostic | INV-007 |
| NS-009 | Relation to a missing target, to the Locus itself, or duplicated | One relation diagnostic per problem | INV-007 |
| NS-010 | `refines` cycle | Cycle diagnostic | INV-008 |
| NS-011 | `depends-on` cycle | Valid (allowed in Stage 0) | INV-008 |
| NS-012 | Fabric with several unrelated violations | All are reported, none suppressed | INV-009 |
| NS-013 | Attempt to modify a Revision or definition after creation | Modification has no effect; the Revision id still matches its content | INV-010 |
| NS-014 | Append with a stale expected head | Refused; history unchanged | INV-011 |
| NS-015 | Append to an empty history with an expected head that is not "empty" | Refused; history unchanged | INV-011 |
| NS-016 | Diff of Revisions of two different Loci | Refused with a mismatch error | INV-012 |
| NS-017 | External input that is not valid JSON, or valid JSON of the wrong shape | Decode error with the location of the problem; nothing is validated or shown as valid | INV-009, INV-013 |
| NS-018 | Verification page built without a spec report | Page shows "not run"; nothing is shown as passing | INV-013 |
| NS-019 | Core package importing a specification, the runner, an adapter or a test runner | Dependency check fails | INV-014 |
| NS-020 | Foundation document with missing front matter field, unknown kind, duplicate id, unresolved `related` id or broken internal link | Site build fails naming the file and problem | — (FR-014) |

### Edge Cases

- An empty Fabric is valid.
- A Fabric of one Locus with no owner and no Relations is valid.
- A Locus whose owner is invalid in another way (for example has a blank purpose) still resolves as an existing owner; each problem is reported once, on the Locus where it occurs.
- Ownership chains deeper than 100 levels validate without stack exhaustion.
- Unicode text in charters is preserved exactly and contributes to the Revision id; identities stay ASCII.
- Appending a Revision identical to the current head leaves the history unchanged and reports that nothing was appended.
- Very large playground input (over 1 MB of JSON) is rejected with a clear message instead of freezing the page.
- A reader with JavaScript disabled can read every content page; the playground states that it needs JavaScript.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Locus definitions | As a contributor, I want to define a Locus as plain immutable data with an identity, a charter, an optional owner, a set of Relations and optional non-semantic metadata, so that definitions can be shared, compared and hashed. Accepted when a definition cannot be changed after creation and carries exactly these parts. | High | Open |
| FR-002 | Identity grammar | As a contributor, I want identities of the form `namespace:name`, each part lowercase letters, digits and single hyphens, starting with a letter, so that names are readable and unambiguous. Accepted when NS-001 inputs are reported and well-formed identities are not. | High | Open |
| FR-003 | Charter rules | As a contributor, I want a charter to require a non-blank purpose and at least one non-blank responsibility, with optional exclusions and success conditions and no duplicates in any part, so that every Locus states why it exists. Accepted when NS-003 and NS-004 are reported. | High | Open |
| FR-004 | Fabric | As a contributor, I want to group Loci into a named Fabric that is validated as a whole, so that uniqueness and references have a scope. Accepted when a Fabric has an identity and members and validation takes a Fabric. | High | Open |
| FR-005 | Complete, deterministic validation | As an agent, I want validation to report every violation as a diagnostic with a stable code, the identity of the Locus concerned and a readable message, in an order that depends only on content, so that I can fix all problems in one pass and compare results. Accepted when NS-012 reports all violations and reordered inputs give identical output. | High | Open |
| FR-006 | Ownership rules | As a contributor, I want each Locus to have at most one owner that exists in the Fabric, is not itself and does not form a cycle, so that ownership is a tree. Accepted when NS-005 to NS-007 are reported. | High | Open |
| FR-007 | Typed Relations | As a contributor, I want Relations of exactly four kinds (`depends-on`, `refines`, `satisfies`, `verifies`) whose target exists, is not the source and is not duplicated, with `refines` acyclic, so that links between Loci carry checkable meaning. Accepted when NS-009 and NS-010 are reported and NS-011 is valid. | High | Open |
| FR-008 | Decoding external input | As a reader, I want structured input (JSON) to be decoded into definitions with errors that state where the input is wrong, kept separate from rule diagnostics, so that I can tell malformed input from an invalid model. Accepted when NS-008 and NS-017 yield decode errors with a location. | High | Open |
| FR-009 | Content-addressed Revisions | As a contributor, I want a Revision's id to be a digest of a canonical form of the definition's semantic content, ignoring set order and metadata, so that equal meaning gives equal ids everywhere. Accepted when User Story 2 scenarios 1–3 pass in Bun and in a browser with identical ids. | High | Open |
| FR-010 | Protected history | As a contributor, I want a per-Locus append-only history that accepts a new head only when I state the current head, and ignores an append equal to the head, so that concurrent changes cannot silently overwrite each other. Accepted when User Story 2 scenarios 4–5, NS-014 and NS-015 pass. | High | Open |
| FR-011 | Change sets | As a contributor, I want to compare two Revisions of the same Locus and get a structured list of added, removed and changed parts, empty exactly when the ids are equal, so that I can see what a change did. Accepted when User Story 2 scenarios 2–3 and NS-016 pass. | High | Open |
| FR-012 | Executable specifications | As a contributor, I want the checks for INV-001 to INV-014 to be data records with stable ids (`LOC-###`), linked invariants, a positive or negative polarity and an expected outcome, run by the repository test command and by the playground from the same records, so that both always run the same checks. Accepted when the test command runs every record, the playground runs every record, and NS-019 holds. | High | Open |
| FR-013 | Documentation sections | As a reader, I want sections Introduction, Philosophy, Principles, Terminology, Architecture (conceptual and technical), First Locus tutorial, Examples, Playground, Verification, Roadmap, Decisions and Agent Reference, so that I can learn Telos in order. Accepted when each section is reachable from navigation. | High | Open |
| FR-014 | Content from the repository | As a contributor, I want site pages generated at build time from `docs/foundation`, `docs/decisions` and `docs/research`, with the build failing on invalid content, so that the site never drifts from the doctrine. Accepted when User Story 3 scenarios 1–2 and NS-020 pass. | High | Open |
| FR-015 | Themes | As a reader, I want light and dark themes that follow my system setting, with a toggle that is remembered, so that the site is comfortable to read. Accepted when User Story 3 scenario 4 passes. | Medium | Open |
| FR-016 | Search | As a reader, I want to search titles, summaries and text of all content, so that I can find a term or principle quickly. Accepted when User Story 3 scenario 3 passes. | Medium | Open |
| FR-017 | Machine-readable content | As an agent, I want `/llms.txt` and a JSON index listing every document with id, title, kind, status, maturity, summary, related ids and URL, so that I can consume the doctrine without scraping. Accepted when User Story 3 scenario 5 passes. | High | Open |
| FR-018 | Maturity display | As a reader, I want each page to show the maturity of its content (vision, proposed, implemented) from its front matter, and never a hand-written "verified", so that I know what is real. Accepted when every page shows its maturity and no content file contains a hand-written verification claim. | Medium | Open |
| FR-019 | Playground scenarios | As a reader, I want playground scenarios A–E (define, invalid definition, Relations, Revisions and history, run specifications), so that I can exercise the whole Stage 0 model. Accepted when User Story 4 scenarios pass. | High | Open |
| FR-020 | Controlled execution | As a reader, I want the playground to call the real package on structured input only and never execute code I type, so that it is safe and its results are genuine. Accepted when the playground contains no code evaluation and its results match Bun results for the same inputs. | High | Open |
| FR-021 | Provenance of results | As a reader, I want every displayed result labelled with its origin (run in this browser with time and package version; run by Bun at build time with git commit and time; CI, shown as unavailable; or historical), so that I can judge the evidence. Accepted when every result element in the site carries one of these labels. | High | Open |
| FR-022 | Verification page | As a reader, I want a Verification page showing the specification report from the build-time Bun run with its provenance, or "not run" if there is none, so that I can see the current state of the checks. Accepted when NS-018 holds and a normal build shows the report. | High | Open |
| FR-023 | Agent Reference | As an agent, I want a page listing the repository entry points, state queries and check commands, so that I can reconstruct the project state from the repository alone. Accepted when User Story 5 scenario 2 passes. | Medium | Open |
| FR-024 | AGENTS.md pointer | As an agent, I want `AGENTS.md` to point to the foundation entry point and state that foundation docs own product terminology, without removing existing rules, so that I find the doctrine first. Accepted when the section exists with owner-approved wording and all prior rules are unchanged. | Medium | Open |
| FR-025 | GRACE synchronisation | As a contributor, I want every new code module recorded in the GRACE graph and verification register, with file-level markup, so that architecture knowledge stays current. Accepted when `grace lint --path . --assertions current` reports no errors. | High | Open |
| FR-026 | Maturity follow-through | As a reader, I want foundation documents updated after merge so that their maturity reflects what was built, so that the doctrine does not overstate or understate. Accepted when every document describing an implemented Stage 0 element is marked implemented and nothing unimplemented is. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Determinism | Validating the same Fabric 100 times produces byte-identical serialised results; Revision ids for every specification fixture are identical in Bun and in Chromium. | Reliability | High | Open |
| NFR-002 | Validation speed | Validating a generated Fabric of 1,000 Loci with 3 Relations each completes in under 1 second in Bun on the development machine, measured by a benchmark check. | Performance | Medium | Open |
| NFR-003 | Portability | The Locus package uses no runtime-specific API (only web-standard APIs) and is bundled for the browser without polyfills; checked by a build for the browser target and by the browser tests. | Portability | High | Open |
| NFR-004 | Accessibility | The home, a principle, a term, a decision and the playground pages have 0 serious or critical automated accessibility violations in both themes; every playground action is operable by keyboard alone. | Usability | Medium | Open |
| NFR-005 | Static, fast build | The site builds to static files in under 60 seconds on the development machine; every content page is readable without JavaScript. | Performance | Medium | Open |
| NFR-006 | Documented public surface | 100% of exported package symbols have documentation comments and a GRACE contract. | Maintainability | Medium | Open |
| NFR-007 | Invariant coverage | Each of INV-001 to INV-012 has at least one positive and one negative executable specification; INV-013 and INV-014 each have at least one automated check that fails when violated. | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Stack | TypeScript (strict) with Effect 4 for the package; Bun as toolchain; TanStack Start, React, shadcn/ui and Tailwind for the site; Playwright with Chromium only for browser tests. | Technical | High | Open |
| C-002 | No code execution | No `eval`, `new Function`, dynamic import of user content, or insertion of user text as raw HTML anywhere in the site. | Security | High | Open |
| C-003 | Single source of content | `docs/` is the only source of doctrine content; the site holds no hand-maintained copies. | Technical | High | Open |
| C-004 | Core independence | The Locus package depends on nothing in `apps/`, on no test runner and on no runtime-specific API. | Technical | High | Open |
| C-005 | Approved dependencies | Every new dependency is pinned to an exact version and approved by the owner in the plan before installation. | Governance | High | Open |
| C-006 | Out of scope | Agent orchestration, sandboxing, risk modelling, deployment, graph databases, compilers, native compilation, persistent revision storage, Facets, Acts, Mandates, Witness and Verdict types. | Business | High | Open |
| C-007 | Gates | All Spec Kitty and GRACE gates and repository hooks apply; none is bypassed. | Governance | High | Open |
| C-008 | Local only | The site is built and served locally; it is not deployed or published. | Business | Medium | Open |

### Key Entities

- **Identity**: the declared name of a Locus or Fabric; namespace and name.
- **Locus definition**: identity, charter, optional owner identity, set of Relations, optional metadata (not semantic).
- **Charter**: purpose; set of responsibilities; optional sets of exclusions and success conditions.
- **Relation**: kind (one of four) and target identity; declared on its source Locus.
- **Fabric**: identity and a set of Locus definitions.
- **Diagnostic**: code, Locus identity, message, and optional details (such as cycle members).
- **Decode error**: location in the input and message.
- **Revision**: id (digest), Locus identity, frozen semantic definition.
- **History**: Locus identity and ordered Revision ids; the last is the head.
- **Change set**: Locus identity, the two Revision ids and a list of changes (part, kind of change, old and new value).
- **Executable specification**: id, title, linked invariants, polarity, input, expected outcome.
- **Specification result**: specification id, outcome (passed or failed), observed result, provenance.
- **Provenance**: origin (browser, build-time Bun, CI, historical), time, package version, and git commit where applicable.
- **Content document**: a foundation, decision or research file with its front matter and body.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Stage 0 invariants (INV-001 to INV-014) have automated checks, and all of them run on every repository check.
- **SC-002**: For every executable specification, the browser and the build-time run produce the same outcome and the same Revision ids (0 mismatches).
- **SC-003**: A new contributor following the First Locus tutorial defines, validates and revises a Locus in under 15 minutes without reading source code.
- **SC-004**: 0 results on the site are displayed without a provenance label; 0 hand-written "verified" claims exist in content.
- **SC-005**: Every one of the 60+ foundation, decision and research documents is reachable on the site and listed in the machine-readable index (0 missing).
- **SC-006**: An agent given only the repository locates the doctrine entry point, the decision register, open questions and mission status within 5 file reads from `AGENTS.md`.

## Assumptions

- The Stage 0 model, invariants and decisions in `docs/` are the intended design; the proposed decision records are approved together with this mission's plan or adjusted in it.
- Revisions and histories live in memory only during this mission; persistence is Stage 1.
- Diagnostic codes, the canonical form and the JSON input shape are fixed in the plan's contracts, not here.
- Browser tests run locally; there is no CI in this repository yet, so CI provenance is shown as unavailable.
- The Spec Kitty glossary and charter wording about Telos (discovery report conflicts C2 and C4) are adjusted only with owner approval and are not a precondition for this mission.
- Content pages are prerendered; the playground runs entirely in the browser with no server component.

## Dependencies

- Owner approval of the plan, including the dependency list and versions (C-005), the `AGENTS.md` wording (FR-024) and work-package model routing.
- Foundation documents in `docs/foundation`, `docs/decisions` and `docs/research` as committed on `feat/locus-foundation`.

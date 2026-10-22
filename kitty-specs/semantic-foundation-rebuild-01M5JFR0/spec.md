# Mission Specification: Semantic Foundation Rebuild

**Mission Branch**: `feat/semantic-foundation-rebuild` (planning base and merge target)
**Created**: 2026-10-22
**Status**: Draft, awaiting owner approval
**Input**: Owner directive "TELOS — Rebuild the Foundation" (copy in [research/owner-directive.md](research/owner-directive.md)).

## Context

The first Telos code (missions 001–003) implements an older conceptual model. It has a fixed Locus record with a mandatory Charter, a closed set of four relation kinds, a separate Fabric entity, a fixed executable-specification runner and a documentation playground built on that model. The owner's directive makes Telos a semantic-first programming system for agent-native software engineering. Software built with Telos exposes its own meaning, structure, relationships, operations and verification through executable interfaces. This means agents do not have to rebuild the architecture from source files.

This mission replaces the old model with a small semantic kernel and proves it with a calculator. The calculator exposes one arithmetic implementation through a command line, a web page and agent tools. The existing code is not authoritative. Every substantial component was audited (see "Audit outcome"), and old decisions are superseded explicitly rather than erased.

### Intent Summary

- **Primary actors**: a developer who defines software with Telos, and an AI agent that discovers and operates that software through Telos interfaces.
- **Trigger**: a developer describes a system as Loci with composed semantic extensions, or an agent needs to understand or call that system.
- **Desired outcome**: the meaning, ownership, relationships, operations, contracts, applicable rules and verification state of a system come from its executable TypeScript definitions. People, tools and agents can query them, and agents can use them.
- **Rules**:
  - Locus is the only fundamental entity.
  - Extensions compose and conflicts are detected.
  - Declared, verified and unknown knowledge stay distinguishable.
  - Discovering a relationship never grants authority to modify or invoke.
- **Boundary**: there is no universal correctness algorithm. Specialized checks come from Archetypes. Ownership analysis works at file and module granularity, and that limit is documented.

Discovery was minimized on the owner's explicit instruction (directive §10: "invent no extra approvals for routine design decisions"). The owner approves this specification and the plan before implementation starts. Framework-level choices that the directive leaves open are listed under "Open owner decisions", each with a recommended default.

## Domain Language

| Term | Meaning in this mission | Avoid |
| --- | --- | --- |
| Locus (plural Loci) | The only fundamental semantic entity: an identifiable context responsible for part of a system. It has an identity and, optionally, a description, contained Loci, relations, capabilities and properties. No other field is mandatory. | node, component, entity, Fabric |
| Identity | The declared name of a Locus, `namespace:name` (grammar kept from ADR-0003) | path, key |
| Semantic extension | A reusable definition that specializes a Locus with typed properties, relation types, Archetypes and new meaning | facet, plugin, mixin |
| Composition | Combining extensions into a Locus kind. Incompatible definitions are reported, never silently overwritten | inheritance, merge |
| Locus kind | The result of composing zero or more extensions; it makes Loci | class, type (in prose) |
| Containment | The structural ownership of one Locus by another. Each Locus has at most one container. A root has none. | parent (in prose), Fabric |
| Relation type | A named meaning of a relation, defined by an extension (for example "CLI command maps to capability") | edge kind, link |
| Relation | One typed, directed statement from a Locus to a Locus or to a capability | edge, link |
| Capability | A named operation a Locus provides, with an input contract, an output contract, declared errors and an effect class (pure, read, write) | act, tool (for the operation itself), endpoint |
| Contract | The input, output and error schemas of a capability, plus their digest | spec, signature |
| Archetype | A named set of verification rules that applies to Loci whose composition includes given extensions | law, lens, validator |
| Rule | One check of an Archetype, with a method (static or execution) | test case |
| Diagnostic | A structural problem in a model (identity, ownership, composition, relation), with a stable code | error (for rule findings) |
| Finding | The outcome of one Rule on one Locus: passed, failed or error | diagnostic |
| Knowledge status | Whether a fact is declared, derived, verified, failed, not run or unknown | confidence |
| Semantic model | All Loci reachable from a root Locus, with the checked structure | Fabric, graph |
| Semantic Closure | The property that every managed code file belongs to a discoverable Locus owner | coverage (alone) |
| Pack | An ordinary TypeScript package that distributes extensions, Archetypes and adapters | plugin, module |
| Interface Locus | A Locus that exposes capabilities of another Locus through a medium (CLI, Web, Agent tools) | adapter (in prose) |
| Impact | The Loci, relations and rules affected by a change to a Locus or capability, computed from the model | blast radius |
| Grant | Permission to invoke a capability, derived only from a relation whose type grants invocation | access, privilege |

"Verified" is used only for a rule result produced by a real execution in this repository. It is never used for something a person or definition declares.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Developer**: writes TypeScript with Telos in this repository.
- **Agent**: an AI coding agent, or a deterministic stand-in, with access to Telos interfaces only.
- **Reader**: a person using the documentation site.
- **End user**: a person using the calculator through the CLI or the web page.

### User Story 1 — Define and compose Loci (Priority: P1)

A developer defines semantic extensions independently and composes them into Locus kinds. With those kinds they define a root Locus that contains other Loci and states typed relations between them. They then build the semantic model and receive either a clean model or a complete, ordered list of diagnostics.

**Why this priority**: the minimal Locus, extension composition and typed relations are the foundation that every other story uses.

**Independent Test**: kernel tests define two extensions, compose them, build a model, and assert both the clean case and every diagnostic case.

**Acceptance Scenarios**:

1. **Given** two extensions defined in separate files and composed into one kind, **When** a Locus of that kind is made with properties from both, **Then** the Locus carries both extensions and their decoded properties, and the model has no diagnostics.
2. **Given** two extensions that define the same property name with different schemas, **When** they are composed, **Then** the composition reports a property conflict naming both extensions, and no property is silently overwritten.
3. **Given** a Locus with no description, no properties, no relations and no capabilities, **When** the model is built, **Then** the model is valid, because no field other than identity is mandatory.
4. **Given** a model with a malformed identity, a duplicate identity, a Locus contained by two Loci, a relation to a missing Locus and a relation whose type no extension of the Locus declares, **When** the model is built, **Then** one diagnostic per problem is reported with a stable code and the Locus identity. The order is fixed and does not depend on declaration order.

---

### User Story 2 — Introspect a system as an agent (Priority: P1)

An agent resolves a Locus by identity. Without opening any implementation file, it reads the Locus description, its relations in both directions, its capabilities with input, output and error contracts, and its verification state.

**Why this priority**: agent-native access is the main strategic reason for Telos (directive §1, L2).

**Independent Test**: a test resolves calculator Loci through the introspection API and compares the returned structures with the definitions.

**Acceptance Scenarios**:

1. **Given** the calculator model, **When** an agent resolves `calculator:arithmetic` and asks for its capabilities, **Then** it receives add, subtract, multiply and divide, each with JSON Schema input and output, declared error tags, effect class and contract digest.
2. **Given** the same model, **When** the agent asks for the incoming relations of `calculator:arithmetic`, **Then** it sees the CLI, Web and Agent interface Loci and the relation type each one uses.
3. **Given** an identity that does not exist, **When** the agent resolves it, **Then** it receives a typed "not found" failure, not a defect.
4. **Given** a Locus whose applicable rules have not run, **When** the agent asks for its verifications, **Then** each rule is reported as "not run" and never as passed.

---

### User Story 3 — Use the calculator through three interfaces (Priority: P1)

An end user adds, subtracts, multiplies and divides through the CLI, the web page or an agent tool. All three call the same arithmetic implementation and report the same errors in the same form.

**Why this priority**: the directive requires a working proof (§11).

**Independent Test**: run the CLI binary, render the web page in a browser test, and call the agent tool through the MCP stdio protocol. Compare results and errors.

**Acceptance Scenarios**:

1. **Given** each interface, **When** the user asks for 2 + 3, 5 − 3, 4 × 2.5 and 10 ÷ 4, **Then** each interface returns 5, 2, 10 and 2.5.
2. **Given** each interface, **When** the user divides by zero, **Then** each interface reports error tag `DivisionByZero` with the same message.
3. **Given** each interface, **When** the user gives a non-numeric operand, **Then** each interface reports error tag `InvalidInput` with the offending field.
4. **Given** each interface, **When** a result is not finite (for example 1e308 × 10), **Then** each interface reports error tag `NonFiniteResult`.

---

### User Story 4 — Discover and invoke tools as an agent without an LLM (Priority: P1)

A deterministic agent client starts the calculator's agent server. It lists the available tools, reads each tool's contract and its link to the Telos capability, and calls a tool. It needs no external credentials and reads no implementation files.

**Why this priority**: it proves capability discovery and that tool definitions derive from Locus contracts (directive §6, §15).

**Independent Test**: an automated test runs the client against the real server process and asserts the full exchange.

**Acceptance Scenarios**:

1. **Given** the agent server, **When** the client lists tools, **Then** it receives one tool per capability exposed by the agent interface Locus, plus read-only introspection tools. Each calculator tool's input schema equals the capability's input contract.
2. **Given** the tool list, **When** the client calls `divide` with 10 and 4, **Then** it receives 2.5.
3. **Given** an introspection tool, **When** the client inspects `calculator:arithmetic`, **Then** it receives the same description as the in-process introspection API.
4. **Given** a capability that no agent relation exposes, **When** the client asks to invoke it, **Then** the call is refused with `NotGranted`, even though the client could discover it.

---

### User Story 5 — Verify with Archetypes (Priority: P2)

A developer runs verification. The kernel finds every Archetype that applies to each Locus from its composition and runs its rules. It reports passed, failed and error findings with their method and provenance. Local and cross-Locus rules both run.

**Why this priority**: specialized verification replaces a universal correctness claim (directive §4).

**Independent Test**: run verification on the calculator model and on deliberately broken variants.

**Acceptance Scenarios**:

1. **Given** the calculator model, **When** verification runs, **Then** the arithmetic behavior rules, the CLI, Web and agent-tool interface rules and the cross-interface parity rule all pass. Each finding names its Archetype, rule, Locus and method.
2. **Given** a variant where the Web interface does not expose `divide`, **When** verification runs, **Then** the cross-interface parity rule fails and names the missing capability and interface.
3. **Given** a variant whose agent tool name breaks the tool-name rule, **When** verification runs, **Then** the agent-tool Archetype fails for that Locus.
4. **Given** a rule that throws, **When** verification runs, **Then** the finding is "error", not "passed", and other rules still run.

---

### User Story 6 — See the impact of a contract change (Priority: P2)

A developer changes the shared arithmetic contract. Telos compares the old and the new model and reports which Loci, relations and rules are affected. All of this is derived from the real model, with no list of consumers written anywhere.

**Why this priority**: the directive requires change impact (§11).

**Independent Test**: build two model versions in a test that differ only in the input contract of `add`, then compare.

**Acceptance Scenarios**:

1. **Given** two calculator models where only the `add` input contract differs, **When** they are compared, **Then** the change is reported as a contract change of `calculator:arithmetic#add` with a structural patch.
2. **Given** that change, **When** impact is computed, **Then** the CLI, Web and Agent interface Loci are listed with the relation type that links them. The applicable rules on those Loci and on the arithmetic Locus are listed as checks to run.
3. **Given** a new interface Locus added to the model with a relation to `add`, **When** impact is computed again, **Then** the new Locus appears without any other code change.

---

### User Story 7 — Check that no code is outside semantics (Priority: P2)

A developer or agent runs the closure check on the repository. Every managed TypeScript file is matched to exactly one owning Locus, the most specific one. The check also reports cross-Locus imports that no relation declares, and imports of packages that no Locus declares as external.

**Why this priority**: Semantic Closure is a core principle (directive §3) and makes Telos describe itself (ADR-0017).

**Independent Test**: run the closure check on fixture trees and on the repository.

**Acceptance Scenarios**:

1. **Given** the repository, **When** the closure check runs, **Then** no managed file is unowned or ambiguously owned. The command succeeds and prints the number of files and owners.
2. **Given** a fixture with a file no Locus claims, **When** the check runs, **Then** it reports `closure.unowned` for that file and fails.
3. **Given** a fixture where a file of one Locus imports a file of an unrelated Locus, **When** the check runs, **Then** it reports an undeclared dependency naming both Loci.
4. **Given** a fixture that imports a package no Locus declares, **When** the check runs, **Then** it reports an unknown external.

---

### User Story 8 — Read and experiment on the documentation site (Priority: P2)

A reader learns the new model on the documentation site. They browse a semantic inspector of the real repository model, read the verification report produced by the real kernel at build time, use the calculator page, and type valid or invalid Locus definitions into a playground that the real kernel checks in the browser.

**Why this priority**: the directive requires living documentation with a real inspector (§12).

**Independent Test**: build the site and run the browser tests.

**Acceptance Scenarios**:

1. **Given** the built site, **When** the reader opens the inspector, **Then** it lists the Loci of the repository model with their extensions, relations, capabilities, contracts and verification state.
2. **Given** the playground, **When** the reader enters a definition with a relation to a missing Locus, **Then** the kernel diagnostic appears with its code. **When** they fix it, **Then** the model is valid.
3. **Given** the calculator page, **When** the reader divides by zero, **Then** the page shows `DivisionByZero` from the shared implementation.
4. **Given** any documentation page about the model, **When** it shows a verification result, **Then** the result carries provenance (when and where it ran). No page claims a result that was not produced by a real run.

---

### User Story 9 — Find a clean, coherent repository (Priority: P3)

A developer or agent reading the repository finds one coherent architecture, with no obsolete model left behind. Old decisions are marked as superseded and link to the new ones. The principles and terminology match the directive.

**Why this priority**: directive §9 requires one coherent result, without compatibility layers.

**Independent Test**: the repository contains no reference to removed concepts outside superseded ADRs and history, and all checks pass.

**Acceptance Scenarios**:

1. **Given** the merged mission, **When** the repository is searched for the removed package and the removed public names, **Then** they appear only in superseded ADRs, the research history and earlier mission records.
2. **Given** each superseded ADR, **When** it is read, **Then** its status is "superseded" and it links to the ADR that replaces it.

### Negative Scenarios

- Composing an extension with itself, or the same extension through two paths, is not a conflict.
- Two different extensions with the same extension identity are a conflict.
- A relation whose target is a capability, used where the type expects a Locus (or the reverse), is a diagnostic.
- A cycle in a relation type declared acyclic is a diagnostic. Cycles in other relation types are allowed.
- An invocation with input that does not match the contract never reaches the implementation.
- An implementation defect during invocation is reported as `Defect` and is never shown as a declared domain error.
- A playground definition is data. It is decoded and is never evaluated as code.

### Edge Cases

- An empty root Locus with no contained Loci is a valid model.
- A relation type with a target that is a capability on the same Locus is allowed. A relation from a Locus to itself is a diagnostic.
- Cycle search on acyclic relation types is bounded: beyond the limit, one limit diagnostic is reported, as the old validator did.
- The closure check treats `node:` and `bun` imports as platform imports, never as unknown externals. Dynamic imports with non-literal specifiers are reported as unknown, not ignored.
- A file matched by a Locus and by its contained Locus belongs to the contained (more specific) Locus. Matches from two unrelated Loci are ambiguous.
- Floating-point results such as 0.1 + 0.2 are returned as computed. The calculator does not round.
- Negative zero and very small results are valid finite results.

## Audit outcome *(requirements and scope input)*

Each substantial existing component was audited against the directive (§9). The decision is binding for this mission.

| Component | Decision | Notes |
| --- | --- | --- |
| Identity grammar and check (`identity.ts`) | Keep | moves into the kernel |
| Deep freeze (`freeze.ts`) | Keep | moves into the kernel |
| Canonical JSON (`specs/canonical-json.ts`) | Keep | moves into the kernel |
| SHA-256 digest (`revision.ts` digest part) | Generalize | digest of any description and of capability contracts |
| Revision record and RevisionHistory service | Remove | no consumer; digests and model comparison cover future revisioning (open decision D1) |
| Charter-specific diff (`diff.ts`) | Replace | general structural model comparison |
| Mandatory Charter | Replace | optional Purpose extension |
| Closed relation kinds | Replace | relation types defined by extensions |
| Fabric | Remove | a root Locus plus containment replaces it |
| `owner` field | Generalize | structural containment with a single-container check |
| Fabric validation (INV-001..008) | Generalize | kernel model diagnostics; reuses the bounded cycle search and the diagnostic ordering |
| JSON decode of definitions | Generalize | decoding JSON Locus definitions against registered extensions (playground, agents) |
| Executable specification runner, catalogue, goldens, examples | Remove | Archetype verification and ordinary tests replace them |
| Docs playground scenarios A–E and spec-report Verification page | Replace | inspector, playground and verification report from the real kernel |
| Docs content pipeline, site shell, search, theme, static server, browser-test setup | Keep | |
| Review gate, Bun version guard, git hooks | Keep | the review gate gains the Telos model check |
| ADR-0001, 0004, 0011, 0012, 0015, 0016, 0017 | Keep | |
| ADR-0003 (identity independent of paths) | Keep | grammar kept |
| ADR-0002, 0005, 0006, 0007, 0008, 0009, 0010, 0013, 0014 | Supersede | by new ADRs |
| Principles P01–P16 | Replace | the directive's 16 principles |
| Terminology | Rework | Fabric, Facet, Lens and Law are removed. Act becomes Capability, and Charter becomes the Purpose extension. Vision terms move to one Future Semantic Evolution page (open decision D2). |
| Conceptual model, capability map, technical direction, roadmap, open questions | Rewrite | for the new model |
| GRACE knowledge in `.grace/` | Keep and sync | it overlaps with the Telos self-description (open decision D4) |

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | Minimal Locus | As a developer, I want a Locus whose only mandatory field is its identity, so that no domain is forced on every Locus. | High | Open |
| FR-002 | Semantic extensions | As a developer, I want to define an extension with typed properties, relation types and Archetypes in its own module, so that I can reuse it in many kinds. | High | Open |
| FR-003 | Composition with conflict detection | As a developer, I want `Locus.extend(A, B, …)` to produce a kind with the combined meaning, and to report property, relation-type and extension-identity conflicts, so that nothing is silently overwritten. | High | Open |
| FR-004 | Typed properties | As a developer, I want Locus properties typed and decoded by the schemas of the composed extensions, so that both the compiler and the runtime check them. | High | Open |
| FR-005 | Containment | As a developer, I want a Locus to contain other Loci, with at most one container per Locus, so that ownership is structural and discoverable. | High | Open |
| FR-006 | User-defined relation types | As a developer, I want extensions to define relation types, each with a meaning, a target kind (Locus or capability), an optional acyclicity rule and an optional invocation grant, so that relationships carry meaning beyond untyped edges. | High | Open |
| FR-007 | Capabilities | As a developer, I want a Locus to provide named capabilities with input, output and error contracts, an effect class and one implementation, so that every interface uses the same operation. | High | Open |
| FR-008 | Semantic model and diagnostics | As a developer, I want to build a model from a root Locus and receive every structural problem as a diagnostic with a stable code, in an order that does not depend on declaration order. | High | Open |
| FR-009 | Archetypes | As a developer, I want Archetypes with static and execution rules that apply to Loci whose composition includes given extensions, so that verification is specialized. | High | Open |
| FR-010 | Verification report | As a developer, I want a verification run to report every applicable rule per Locus as passed, failed or error, with method and provenance, so that verified knowledge is distinguishable from declared knowledge. | High | Open |
| FR-011 | Introspection API | As an agent, I want `resolve(id)` with `inspect()`, `relations()`, `capabilities()` and `verifications()` returning structured JSON-compatible descriptions, so that I never need to read implementation files for this information. | High | Open |
| FR-012 | Knowledge status | As an agent, I want each described fact marked declared, derived, verified, failed, not run or unknown, so that unverified claims never look like guarantees. | High | Open |
| FR-013 | Governed invocation | As an interface, I want to invoke a capability only through a relation whose type grants invocation, with raw input decoded against the contract and a total outcome (output or typed error), so that discovery never grants authority. | High | Open |
| FR-014 | Change impact | As a developer, I want to compare two models and compute the affected Loci, relations and rules for a changed Locus or capability from the model itself. | High | Open |
| FR-015 | Semantic Closure check | As a developer, I want a file-level check that reports unowned files, ambiguous ownership, claims that match no file, undeclared cross-Locus imports and unknown external packages, with its limits documented. | High | Open |
| FR-016 | JSON definitions | As a reader or agent, I want to submit a Locus definition as JSON, decoded against registered extensions and never evaluated, and receive the same diagnostics as code definitions. | Medium | Open |
| FR-017 | CLI pack | As a developer, I want a reusable CLI extension, a CLI Archetype and a runner that derives commands from the capabilities a CLI Locus exposes. | High | Open |
| FR-018 | Agent pack | As a developer, I want a reusable agent extension, an agent-tool Archetype, tool definitions derived from capabilities, an MCP stdio server, read-only introspection tools and a deterministic client. | High | Open |
| FR-019 | Web pack | As a developer, I want a reusable web extension, a web Archetype and a form model derived from capabilities, without a dependency on a UI library. | High | Open |
| FR-020 | Calculator | As an end user, I want add, subtract, multiply and divide through CLI, Web and Agent tools, backed by one arithmetic implementation with errors `DivisionByZero`, `NonFiniteResult` and `InvalidInput`. | High | Open |
| FR-021 | Calculator Archetypes | As a developer, I want arithmetic behavior rules and cross-interface rules (every interface exposes every arithmetic capability and reports identical errors) to run against the real model. | High | Open |
| FR-022 | Repository self-description | As an agent, I want the repository itself described as a Telos model (packages, apps, scripts) with sources and externals, so that Telos is used to describe Telos. | Medium | Open |
| FR-023 | Developer command | As a developer or agent, I want one repository command to list, inspect, verify, check closure and compute impact, with JSON output. | Medium | Open |
| FR-024 | Gate integration | As a maintainer, I want the model diagnostics, the verification and the closure check to run in `bun run verify` and in the review gate. | High | Open |
| FR-025 | Documentation inspector and verification page | As a reader, I want the site to show the real repository model and a verification report built at site build time, with provenance. | Medium | Open |
| FR-026 | Documentation playground and calculator page | As a reader, I want to check valid and invalid definitions with the real kernel in the browser, and to use the calculator web interface. | Medium | Open |
| FR-027 | Rewritten foundation documents | As a reader, I want the foundation README, the 16 principles, the terminology and the conceptual documents to describe the new model and its limits, including a Future Semantic Evolution page. | Medium | Open |
| FR-028 | Superseding decisions | As a reader, I want new ADRs that record the new model and mark each replaced ADR as superseded with a link. | Medium | Open |
| FR-029 | Removal of the old model | As a maintainer, I want the old package, its specification runner, the old playground, the old spec report and their tests removed, with no compatibility aliases. | High | Open |
| FR-030 | GRACE sync | As a maintainer, I want `.grace/` graph and verification entries and file markup to match the new modules, and `grace lint --path . --assertions current` to pass. | High | Open |
| FR-031 | Guides | As a reader, I want guides for defining a first Locus, for the calculator reference implementation and for agent-native access. Their examples are checked against the real code. | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | Kernel independence | The kernel main entry imports no AI, UI, CLI or platform-specific module, and runs unchanged in Bun and in a browser (checked by a browser test that builds a model and runs static verification). | Portability | High | Open |
| NFR-002 | Determinism | Building the same model twice, or with containment and relations declared in a different order, gives identical diagnostics, descriptions and digests (byte-identical JSON). | Reliability | High | Open |
| NFR-003 | Responsiveness | Building the repository model and running all static rules completes in under 2 seconds on the development machine. Running the closure check on the repository completes in under 10 seconds. | Performance | Medium | Open |
| NFR-004 | Error consistency | For the same input, the CLI, Web and Agent interfaces report the same error tag and message in 100% of the calculator test cases. | Reliability | High | Open |
| NFR-005 | Test coverage of rules | Every diagnostic code and every Archetype rule has at least one passing and one failing test. | Quality | High | Open |
| NFR-006 | Clean gates | `bun run verify` (format, lint, typecheck, tests, docs build, browser tests, grace lint, Telos check) passes at the end of every work package. | Quality | High | Open |
| NFR-007 | Agent credentials | The deterministic agent client and its tests need no network access and no API credentials. | Security | High | Open |
| NFR-008 | Ergonomics | Defining the calculator arithmetic Locus with four capabilities takes no more than 80 lines of TypeScript, excluding comments and the arithmetic itself, with no type annotations needed at call sites. | Usability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | Stack | TypeScript, Effect 4.0.4 and Bun 1.4.4-canary.1, using installed versions only. No Rust, no custom language and no graph database. | Technical | High | Open |
| C-002 | No new dependencies | No dependency is added or upgraded unless the owner approves it (charter). The plan uses only packages already in `bun.lock`. | Technical | High | Open |
| C-003 | One fundamental entity | No Node, Fabric, Component, Resource or Agent entity system. Everything specialized is a Locus with extensions. | Architecture | High | Open |
| C-004 | No compatibility layers | No aliases, deprecated namespaces or wrappers for removed concepts. | Architecture | High | Open |
| C-005 | Code is the source of truth | Tool schemas, documentation data, inspector data and verification plans are derived from the TypeScript definitions. No manually maintained duplicate. | Architecture | High | Open |
| C-006 | Docs content source | Site content is generated from `docs/`. Content is never edited inside `apps/docs`. | Process | High | Open |
| C-007 | Workflow | Spec Kitty owns the lifecycle and GRACE owns architecture knowledge. Conventional Commits, with no AI attribution. | Process | High | Open |
| C-008 | No autonomous factory | No autonomous change agents, runtime isolation or authority delegation in this mission. The design must not prevent them later. | Scope | Medium | Open |
| C-009 | English | All documentation, specifications, comments and reports are in English. | Process | High | Open |

### Key Entities

- **Extension**: identity, description, property fields, relation types, Archetypes.
- **Locus kind**: the extensions it composes and their composition conflicts.
- **Locus definition**: identity, kind, optional description, contained Loci, relations, capabilities, properties.
- **Relation type**: identity, description, target kind, acyclic flag, invocation grant flag.
- **Relation**: type, source Locus, target Locus or capability.
- **Capability**: name, description, input, output and error contracts, effect class, implementation.
- **Archetype**: identity, description, the extensions it applies to, rules.
- **Rule**: identity, description, method, check.
- **Semantic model**: root, Loci by identity, container of each Locus, relations, diagnostics.
- **Diagnostic**: code, severity, Locus, message, related identities.
- **Finding and verification report**: Archetype, rule, Locus, method, outcome, message, provenance.
- **Description**: the JSON-compatible view of a Locus, relation, capability or verification, with knowledge status and digest.
- **Impact report**: changed target, affected Loci with relation paths, rules to run.
- **Closure report**: files with owners, findings, analysed scope and limits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An agent obtains the purpose, relations, capabilities with full contracts and verification state of every calculator Locus through Telos interfaces alone, and the test that does this opens no source file.
- **SC-002**: The deterministic agent client completes discovery and a successful invocation of all four calculator tools in one automated run, without network or credentials.
- **SC-003**: The CLI, Web and Agent interfaces agree on results and error tags for 100% of a shared table of at least 12 calculator cases.
- **SC-004**: Changing the `add` contract in a test produces an impact report listing all three interface Loci and their applicable rules, and no consumer list appears anywhere in the code.
- **SC-005**: The closure check reports zero unowned and zero ambiguous files in the repository, and each closure finding type has a fixture that triggers it.
- **SC-006**: The removed package and its public names appear in no file outside superseded ADRs, research history and earlier mission records.
- **SC-007**: `bun run verify` passes on the merged mission branch, including the new Telos check.
- **SC-008**: A reader can open the inspector, the verification report, the playground and the calculator page on the built site, and the browser tests cover each.

## Assumptions

- Recommended defaults for the open owner decisions below apply unless the owner changes them at spec approval.
- The calculator uses IEEE-754 double arithmetic. A non-finite result is an error, and no rounding is applied.
- "File and module granularity" is the declared scope of Semantic Closure. Function-level ownership is out of scope and documented as a limit.
- Model Context Protocol over stdio is the agent tool transport. The installed Effect AI modules provide it.
- The calculator web interface is a page of the documentation site (allowed by directive §11).
- "Observed" knowledge (runtime observation) is a status value of the model. No observation source is built in this mission, and this is documented as future work.

## Open owner decisions

Each has a recommended default. The owner may accept all defaults by approving this specification.

- **D1 Revision history**: remove the RevisionHistory service, keeping digests and model comparison as the base for later revisioning. *Recommended: remove.*
- **D2 Principles and terms**: replace P01–P16 with the directive's 16 principles. Move the vision terms (Mandate, Variant, Witness, Verdict, Evolution) into one Future Semantic Evolution page. *Recommended: yes.*
- **D3 Package names**: `@telos/kernel` (packages/kernel), Packs `@telos/cli`, `@telos/agent`, `@telos/web` (packages/), and `@telos/calculator` (apps/calculator). *Recommended: yes.*
- **D4 GRACE overlap**: `.grace/` keeps a hand-written module graph that overlaps with the Telos self-description (principle 12, no duplicate models). *Recommended: keep GRACE in sync in this mission, and decide later whether to derive `.grace/` from Telos or retire parts of it. That later decision is an AGENTS.md change.*
- **D5 Property namespace**: extension properties share one flat namespace per Locus, and a name defined by two different extensions is a composition conflict. The alternative is a namespace per extension, where conflicts are impossible but access is more verbose. *Recommended: flat with conflict detection.*
- **D6 Invocation authority**: a capability may be invoked only by its own Locus, or through a relation whose type grants invocation. Introspection never grants invocation. *Recommended: yes.*
- **D7 Repository gate**: the repository describes itself as a Telos model, and the review gate fails on model diagnostics, failed rules or closure findings. *Recommended: yes.*
- **D8 ADR status**: one accepted ADR records the owner directive. The detailed design ADRs stay "proposed" until the owner accepts them. *Recommended: yes.*

## Dependencies

- Spec Kitty 3.2.7, GRACE CLI 4.2.1 and Bun 1.4.4-canary.1 as installed (see `docs/tooling.md`).
- Effect 4.0.4 modules already installed: Schema, cli, ai (McpServer, McpSchema), JsonPatch.
- The existing documentation app toolchain (TanStack Start, React, Playwright) as pinned in `apps/docs/package.json`.

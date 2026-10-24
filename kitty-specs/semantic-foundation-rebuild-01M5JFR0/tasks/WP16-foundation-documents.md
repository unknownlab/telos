---
work_package_id: WP16
title: Foundation documents, principles and terminology
dependencies: []
requirement_refs:
- FR-027
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T090
- T091
- T092
- T093
- T094
- T095
- T096
phase: Phase 6 – Doctrine
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: curator-carla
authoritative_surface: docs/foundation/
create_intent: []
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- docs/foundation/**
- apps/docs/test/content.test.ts
- apps/docs/test/site.test.ts
- apps/docs/test/search.test.ts
- .grace/context/principles.xml
- .grace/context/requirements.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP16 – Foundation documents, principles and terminology

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `curator-carla`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Objective

Rewrite the Telos doctrine in `docs/foundation/` for the new semantic model: 16 new principles, the new terminology (deleting the old vocabulary), the foundation README, the conceptual model, the capability map, the technical direction, the roadmap, the open questions, the philosophy update and a new document on future semantic evolution. Keep every link and `related` id in `docs/` resolving, and update the docs tests that name deleted documents.

This WP writes documents only. It changes no code except the test assertions named below. The code that the documents describe is being written in parallel by WP01–WP15; describe the design in the spec and the contracts, and name the modules by their planned paths (for example `packages/kernel/src/model.ts`).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

# Contract: documentation (WP16, WP17, WP18, WP19, WP20)

Repository rule (C-006): site content is generated from `docs/`. Prose is never edited inside `apps/docs`. The app owns only pages that render data (inspector, verification, playground, calculator) and the pipeline.

## Document content (WP16 foundation, WP17 decisions)

The front matter schemas in `apps/docs/scripts/content.ts` stay **unchanged** in this mission. Terms keep `order`, `classification`, `fundamental`, `engine` and `stage0`. New terms use `engine: false` and `stage0: "in-scope"`, or `"deferred"` for future-only concepts.

### Principles (WP16, spec D2)

Delete `docs/foundation/principles/P01-*.md` … `P16-*.md`, then write these 16 files (`kind: principle`, `number`, `code`, `status: provisional`, `maturity: proposed`). Each has the sections `## Definition`, `## Motivation`, `## In practice` (how the kernel, Packs or gate apply it, naming real modules), and `## Limits`.

| File | Title |
| --- | --- |
| `P01-one-fundamental-entity.md` | One Fundamental Entity: Locus |
| `P02-composable-extensions.md` | Extensions Are Composable |
| `P03-no-code-outside-semantics.md` | No Code Outside Semantics |
| `P04-code-is-the-source-of-truth.md` | Executable Code Is the Source of Semantic Truth |
| `P05-agents-use-semantic-apis.md` | Agents Access Knowledge Through Semantic APIs |
| `P06-archetypes-specialize-verification.md` | Archetypes Provide Specialized Verification |
| `P07-no-universal-correctness.md` | No Universal Correctness Algorithm |
| `P08-no-mandatory-architecture.md` | No Mandatory Application Architecture |
| `P09-no-duplicated-frameworks.md` | No Duplication of Existing Frameworks |
| `P10-no-unnecessary-layers.md` | No Unnecessary Abstraction Layers |
| `P11-no-compatibility-for-mistakes.md` | No Compatibility for Obsolete Mistakes |
| `P12-no-duplicate-semantic-models.md` | No Manually Synchronized Duplicate Models |
| `P13-no-unverified-guarantees.md` | No Unverified Claims as Guarantees |
| `P14-no-ai-in-the-kernel.md` | No AI Dependency in the Semantic Kernel |
| `P15-no-arbitrary-agent-privileges.md` | No Arbitrary Agent Privileges |
| `P16-no-speculative-implementation.md` | No Speculative Implementation |

`docs/foundation/principles/README.md` lists them in this order. P12 states the GRACE overlap (spec D4) as a known limit.

### Terms (WP16)

- **Delete**: `fabric.md`, `facet.md`, `lens.md`, `law.md`, `act.md`, `charter.md`, `mandate.md`, `variant.md`, `witness.md`, `verdict.md`, `evolution.md`, `revision.md`.
- **Rewrite**: `locus.md` (order 1), `identity.md`, `relation.md`, `archetype.md`.
- **Add** (`order` in this sequence after locus): `semantic-extension.md`, `composition.md`, `locus-kind.md`, `containment.md`, `relation-type.md`, `capability.md`, `contract.md`, `rule.md`, `diagnostic.md`, `finding.md`, `knowledge-status.md`, `semantic-model.md`, `semantic-closure.md`, `pack.md`, `interface-locus.md`, `impact.md`, `grant.md`, `purpose.md`, `semantic-first-programming.md`, `agent-native-development.md`, `executable-introspection.md`. The last three cover the directive §12 topics that are not single model terms; `pack.md`, `semantic-closure.md` and the calculator guide cover the rest.
- Each term uses the spec's Domain Language definition and the "Avoid" column. `fundamental: true` only for `locus`.
- `docs/foundation/terminology/README.md` lists them.

### Other foundation documents (WP16)

| File | Action |
| --- | --- |
| `docs/foundation/README.md` | Rewrite. Telos as semantic-first, agent-native programming. Covers: the Locus and extension model, introspection, Packs, Semantic Closure, the calculator proof, what is implemented vs. future, and links to the principles, terms and ADR-0018. |
| `docs/foundation/conceptual-model/README.md` | Rewrite with Mermaid diagrams of Locus, extensions, relations, capabilities, Archetypes and the knowledge statuses. |
| `docs/foundation/architecture/capabilities.md` | Rewrite as the capability map of the kernel, Packs and calculator (what exists, with module names). |
| `docs/foundation/architecture/technical-direction.md` | Rewrite: TS + Effect + Bun, kernel browser-safe, Packs, no new dependencies. |
| `docs/foundation/roadmap/README.md` | Rewrite: done in this mission, next candidates, kept as direction only (ADR-0016). |
| `docs/foundation/open-questions.md` | Rewrite: spec D4, closure limits, revisioning, the autonomous factory being out of scope (C-008). |
| `docs/foundation/philosophy/evolution-of-determinism.md` | Update its terms to the new model. Keep its argument. |
| `docs/foundation/future-semantic-evolution.md` (new, `kind: direction`, `maturity: vision`) | Mandate, Variant, Witness, Verdict, Evolution and Revision as future concepts. For each: what it would mean as an extension of the current model, and why it is not built now. |

**Link integrity** (WP16 owns it across all of `docs/`): every `related` id and every Markdown link in `docs/**` that points to a deleted document is changed to the replacement (fabric → semantic-model, facet → semantic-extension, lens/law → archetype, act → capability, charter → purpose, the vision terms → future-semantic-evolution, old principle ids → the new principle with the closest meaning). This includes ADRs and guides, where only the `related` lists and link targets change. Their prose is WP17's (ADRs) and WP20's (guides).

WP16 also updates the docs tests that name removed document ids (`apps/docs/test/content.test.ts`, `site.test.ts`, `search.test.ts`, and any e2e test that names a removed id). It also updates `.grace/context/principles.xml` and `.grace/context/requirements.xml` to the new principles.

The terms come from the spec's Domain Language table:

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/spec.md` (authoritative).

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
| Knowledge status | Whether a fact is declared, derived, verified, failed, not run, observed, invalidated or unknown | confidence |
| Semantic model | All Loci reachable from a root Locus, with the checked structure | Fabric, graph |
| Semantic Closure | The property that every managed code file belongs to a discoverable Locus owner | coverage (alone) |
| Pack | An ordinary TypeScript package that distributes extensions, Archetypes and adapters | plugin, module |
| Interface Locus | A Locus that exposes capabilities of another Locus through a medium (CLI, Web, Agent tools) | adapter (in prose) |
| Impact | The Loci, relations and rules affected by a change to a Locus or capability, computed from the model | blast radius |
| Grant | Permission to invoke a capability, derived only from a relation whose type grants invocation | access, privilege |

"Verified" is used only for a rule result produced by a real execution in this repository. It is never used for something a person or definition declares.

### Front matter shapes (validated by `apps/docs/scripts/content.ts`; do not change that file)

Allowed values: `status` is one of `provisional, proposed, accepted, open, superseded, deprecated`; `maturity` is one of `vision, proposed, implemented`. `kind: principle` needs `number` (1–16) and `code` (`P01`…`P16`). `kind: term` needs `order` (number), `classification` (non-blank), `fundamental`, `engine` (booleans) and `stage0` (`in-scope`, `minimal` or `deferred`). No other keys are allowed.

Principle (copy this shape):

```yaml
---
id: P01-one-fundamental-entity
title: "One Fundamental Entity: Locus"
kind: principle
number: 1
code: P01
status: provisional
maturity: proposed
summary: <one sentence>
related: [P02-composable-extensions, locus, semantic-extension]
---

# P01 — One Fundamental Entity: Locus
```

YAML note: a `title` that contains `: ` must be quoted, as above.

Term (copy this shape):

```yaml
---
id: semantic-extension
title: Semantic extension
kind: term
order: 2
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: <the Domain Language meaning, one sentence>
related: [locus, composition, locus-kind]
---
```

Term `order`, `classification` and file (use exactly these; `fundamental: true` only for `locus`; `engine: false` and `stage0: in-scope` for all; `maturity: proposed` for all, because the code is not on your branch yet; WP21 raises it to `implemented` after the code is merged):

| order | file | classification |
| --- | --- | --- |
| 1 | `locus.md` | `semantic-primitive` |
| 2 | `semantic-extension.md` | `extension-model` |
| 3 | `composition.md` | `extension-model` |
| 4 | `locus-kind.md` | `extension-model` |
| 5 | `containment.md` | `semantic-primitive` |
| 6 | `relation-type.md` | `extension-model` |
| 7 | `capability.md` | `execution-model` |
| 8 | `contract.md` | `execution-model` |
| 9 | `rule.md` | `verification-model` |
| 10 | `diagnostic.md` | `verification-model` |
| 11 | `finding.md` | `verification-model` |
| 12 | `knowledge-status.md` | `verification-model` |
| 13 | `semantic-model.md` | `derived-composition` |
| 14 | `semantic-closure.md` | `derived-composition` |
| 15 | `pack.md` | `extension-model` |
| 16 | `interface-locus.md` | `execution-model` |
| 17 | `impact.md` | `derived-composition` |
| 18 | `grant.md` | `execution-model` |
| 19 | `purpose.md` | `extension-model` |
| 20 | `semantic-first-programming.md` | `approach` |
| 21 | `agent-native-development.md` | `approach` |
| 22 | `executable-introspection.md` | `approach` |
| 23 | `identity.md` | `semantic-primitive` |
| 24 | `relation.md` | `semantic-primitive` |
| 25 | `archetype.md` | `verification-model` |

`purpose.md` describes the kernel's built-in `telos.purpose` extension (properties `purpose`, `responsibilities`, `excluded`); it replaces the old Charter. `knowledge-status.md` lists the eight statuses and says that `observed` and `invalidated` are reserved: the model defines them, nothing in this mission produces them.

### Old id → replacement (use for every `related` id and link target)

| Deleted id | Replacement |
| --- | --- |
| `fabric` | `semantic-model` |
| `facet` | `semantic-extension` |
| `lens`, `law` | `archetype` |
| `act` | `capability` |
| `charter` | `purpose` |
| `mandate`, `variant`, `witness`, `verdict`, `evolution`, `revision` | `future-semantic-evolution` |
| `P01-everything-is-code` | `P04-code-is-the-source-of-truth` |
| `P02-everything-has-meaning` | `P03-no-code-outside-semantics` |
| `P03-semantic-ownership` | `P01-one-fundamental-entity` |
| `P04-explicit-composition` | `P02-composable-extensions` |
| `P05-capabilities-instead-of-arbitrary-tools` | `P15-no-arbitrary-agent-privileges` |
| `P06-authority-is-explicit` | `P15-no-arbitrary-agent-privileges` |
| `P07-evolution-is-fundamental` | `P11-no-compatibility-for-mistakes` |
| `P08-preserve-the-baseline` | `P13-no-unverified-guarantees` |
| `P09-evidence-before-acceptance` | `P13-no-unverified-guarantees` |
| `P10-uncertainty-must-be-explicit` | `P13-no-unverified-guarantees` |
| `P11-verification-is-contextual` | `P07-no-universal-correctness` |
| `P12-independent-governance` | `P06-archetypes-specialize-verification` |
| `P13-human-as-strategic-authority` | `P15-no-arbitrary-agent-privileges` |
| `P14-incremental-formalization` | `P16-no-speculative-implementation` |
| `P15-engine-independence` | `P14-no-ai-in-the-kernel` |
| `P16-self-application` | `P04-code-is-the-source-of-truth` |

In a Markdown link, the file name changes the same way (for example `../terminology/charter.md` → `../terminology/purpose.md`, `../foundation/principles/P05-capabilities-instead-of-arbitrary-tools.md` → `../foundation/principles/P15-no-arbitrary-agent-privileges.md`, `terminology/revision.md` → `future-semantic-evolution.md` with the right relative path). If a `related` list then names the same id twice, keep one. The link text stays as it is in ADRs, guides and research documents (their prose is not yours).

### Anchors that other documents link to

The content build checks `#anchor` parts of links: a link to a heading that no longer exists fails with `broken link "<href>": no heading "<anchor>" in <file>`. These headings in files you rewrite are linked from documents you do not rewrite. Keep each heading text so its anchor stays the same, or change the link (sanctioned) to a heading that exists:

- `docs/foundation/README.md`: `## Maturity vocabulary` (keep it **and its table** unchanged: `scripts/content.ts` exempts exactly this table from the forbidden-claim check), `## Who owns which artifact`, `## Front matter schema`.
- `docs/foundation/open-questions.md`: `## OQ-001` … `## OQ-020`. Keep every one of these 20 headings. Under each, write the question's current state in the new model (resolved by which ADR or design, still open, or out of scope), then the new questions (from `## OQ-021` on): spec D4, closure limits, revisioning, the autonomous factory being out of scope (C-008).
- `docs/foundation/architecture/capabilities.md`: keep all 14 headings `## CAP-01 Semantic Foundation` … `## CAP-14 Software Factory` with their current text. Under each, write what exists after this mission (kernel, Pack or calculator modules by path) or "Not built in this mission" with a link to the roadmap. Anchors `cap-01-semantic-foundation`, `cap-02-architecture`, `cap-03-requirements`, `cap-05-verification-and-assurance`, `cap-06-agents`, `cap-07-evolution`, `cap-08-processes` and `cap-14-software-factory` are linked from other documents.
- `docs/foundation/conceptual-model/README.md`: keep the headings `## 3. The minimal-model hypothesis`, `### 3.1 Representative cases`, `## 5. Invariants` and `## 6. Key questions` with exactly this text (anchors `3-the-minimal-model-hypothesis`, `31-representative-cases`, `5-invariants`, `6-key-questions`). Their content is rewritten for the new model.
- `docs/foundation/philosophy/evolution-of-determinism.md`: keep all headings (you only update terms).
- `docs/foundation/architecture/technical-direction.md`: keep the headings `## Runtime and toolchain: Bun` and `## Semantic intermediate representation`, and keep the link to `https://github.com/unknownlab/telos/blob/main/docs/tooling.md` (a test asserts it).

Run `bun run --cwd apps/docs content` after each document group; it prints every problem with its file.

## Rules for this work package

Read these rules before you write anything. They are part of the acceptance criteria.

1. **Baseline first.** Before you change a file, run `bun run verify` in your worktree and note the result of each step. If the baseline is not green, stop and report it; do not fix unrelated failures.
2. **Only your files.** Edit only the files in `owned_files` (frontmatter) and the sanctioned edits listed below. If you need any other change, stop and report it. Never edit `kitty-specs/**`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` or the charter.
3. **Content lives in `docs/`.** Site content is generated from `docs/` (C-006). Never edit prose inside `apps/docs`.
4. **Front matter.** Keep the front matter schema of each document kind exactly as the existing documents of that kind use it (`apps/docs/scripts/content.ts` validates it). Copy the shape from an existing file of the same kind before you write a new one.
5. **Forbidden claims.** The content build rejects the words `verified`, `passing` and `all tests pass` (case-insensitive) in front matter and in Status or Maturity table columns. Use them in body prose only when they describe a real rule result, and never as a status.
6. **Terms.** Use the terms of the spec's Domain Language table exactly; never use the words in its "Avoid" column for the new model. English only (C-009). No emojis.
7. **Links.** Every Markdown link and every `related` id must resolve. `bun run docs:build` fails on a broken one, so run it often.
8. **Shell.** The shell is fish. Use `echo '-----'` as a separator.
9. **Report exactly.** In your final message, list every check you ran and its exact result. Never claim a check passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Commands

| Purpose | Command |
| --- | --- |
| Full gate (run before handing a WP to review, and it must pass) | `bun run verify` |
| Fast loop while working | `bun run typecheck`, `bun test <paths>`, `bun run lint`, `bun run format` (writes), `bun run grace:lint` |
| One package's tests | `bun test packages/kernel/test` (example) |

`bun run verify` = `check:bun && format:check && lint && typecheck && test && docs:build && test:e2e && grace:lint`, plus `&& telos:check` from WP15 on. Report each step's result exactly. Never claim a step passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Git

- Spec Kitty creates your worktree and branch. Commit only inside it.
- Commit messages follow Conventional Commits 1.0.0: `feat(kernel): build the semantic model`, `docs(foundation): ...`, `test(cli): ...`.
- No AI names, and no author, co-author or session lines. The `.githooks/commit-msg` hook enforces this. Never use `--no-verify`.
- Never edit files that another WP owns (see each WP's "Owned files"). If a needed change falls outside your files, stop and report it.

**Sanctioned edits outside `owned_files`** (name each one in your commit body):

- `docs/decisions/**`, `docs/guides/**` and `docs/research/**`: change only `related` ids and Markdown link targets (including `#anchor` parts) that point to deleted documents or removed headings.
- `apps/docs/e2e/navigation.e2e.ts` and `apps/docs/e2e/search.e2e.ts`: replace only document ids that this WP deletes.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP16 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T090 – Principles

Delete the 16 files `docs/foundation/principles/P01-*.md` … `P16-*.md` (`git rm`). Write the 16 files of the contract table. Each has front matter as shown above, the heading `# PNN — <Title>`, and the sections `## Definition`, `## Motivation`, `## In practice` and `## Limits`. "In practice" names the real modules and checks that apply the principle (planned paths from the contracts), for example:

- P01: `Locus.make` in `packages/kernel/src/locus.ts`; `buildModel` in `packages/kernel/src/model.ts`.
- P03 and P12: the Semantic Closure check `packages/kernel/src/closure.ts` and `bun run telos check`.
- P05: the introspection tools of `packages/agent/src/tools.ts` and `bun run telos inspect`.
- P06 and P07: `Archetype.make` and `verify` in `packages/kernel/src/verify.ts`.
- P12 states the GRACE overlap as a known limit: `.grace/` keeps an architecture description next to the kernel model, and this mission does not merge them (spec D4).
- P14: the kernel imports only `effect`; no model provider is called anywhere in `packages/kernel`.
- P15: `invoke` returns `NotGranted` unless a relation whose type grants invocation exists (`packages/kernel/src/invoke.ts`).

Rewrite `docs/foundation/principles/README.md` (keep its front matter keys; `related: [terminology, conceptual-model, foundation]`): a table of the 16 principles in contract order, with number, title (linked to its file) and one-line summary.

### T091 – Terms

`git rm` the 12 deleted term files. Rewrite `locus.md`, `identity.md`, `relation.md`, `archetype.md`, and write the 21 new term files, with the front matter table above. Each term file has `# <Title>`, `## Definition` (the Domain Language meaning), `## Avoid` (the Avoid words, and why), `## In the model` (which kernel API or Pack represents it, by planned path) and `## Related`. `identity.md` keeps the `namespace:name` grammar of ADR-0003. Rewrite `docs/foundation/terminology/README.md`: a table of all 25 terms in `order`, with term (linked), one-line definition and class.

### T092 – Other foundation documents

Write each row of the "Other foundation documents" table. `future-semantic-evolution.md` lives at `docs/foundation/future-semantic-evolution.md` with front matter `id: future-semantic-evolution`, `title: Future semantic evolution`, `kind: direction`, `status: provisional`, `maturity: vision`, a summary and `related: [foundation, knowledge-status, archetype]`. The foundation README links to the principles README, the terminology README, `future-semantic-evolution.md` and `../decisions/ADR-0018-semantic-foundation-rebuild.md`.

`ADR-0018` is written by WP17, which runs after you. Until then that link and any `related: [ADR-0018]` would break the build. Therefore write the ADR-0018 links and ids **only in this exact form** and leave them out for now: put the sentence "The decision record for this rebuild is ADR-0018 (written next)." as plain text without a link, and do not put `ADR-0018` in any `related` list. WP17 adds the links.

Use Mermaid fenced blocks (```` ```mermaid ````) for the conceptual model diagrams; the existing documents show the style.

### T093 – Links and related ids across `docs/`

Apply the replacement table to every `related` list and every Markdown link in `docs/foundation/**` (yours), and, as sanctioned edits, in `docs/decisions/**`, `docs/guides/**` and `docs/research/**`. Find them with:

```fish
git grep -nwE "(fabric|facet|lens|law|act|charter|mandate|variant|witness|verdict|evolution|revision)(\.md)?" -- docs
git grep -nE "P(0[1-9]|1[0-6])-[a-z]" -- docs
```

The first command also lists prose words; change only `related` entries and link targets. Then run `bun run --cwd apps/docs content` until it reports no problem. In ADRs, guides and research documents change only `related` ids and link targets; never their prose.

### T094 – Tests and e2e ids

Change only assertions about the **real** docs. Fixture documents created inside a test (for example `makeDoc({ id: "act", ... })` in `site.test.ts`, or files under `apps/docs/test/fixtures/`) stay as they are.

- `apps/docs/test/content.test.ts`, `describe("real docs tree")`: `expect(ofKind("term").length).toBe(16)` → `25`; in "principles and terms sort by number and order", the term orders become `Array.from({ length: 25 }, (_, i) => i + 1)` (principles stay 16). Replace the test "searching for baseline finds P08 and revision" with "searching for archetype finds P06 and the archetype term": search `"archetype"` and expect ids starting with `/principles/P06-archetypes-specialize-verification` and `/terminology/archetype`.
- `apps/docs/test/search.test.ts`, `describe("createSearch over the real docs index")`: the two "baseline" tests search `"archetype"`; expected routes `/principles/P06-archetypes-specialize-verification` and `/terminology/archetype`. Rename the tests to match.
- `apps/docs/test/site.test.ts`: in `SECTION_CASES`, `"/principles/P01-everything-is-code"` → `"/principles/P01-one-fundamental-entity"`; in `describe("real content")`, `"/principles/P08-preserve-the-baseline"` → `"/principles/P01-one-fundamental-entity"` and `"/terminology/revision"` → `"/terminology/semantic-extension"`.
- Sanctioned: `apps/docs/e2e/navigation.e2e.ts` `kinds` list: `"P01-everything-is-code"` → `"P01-one-fundamental-entity"`, `"revision"` → `"semantic-extension"`. `apps/docs/e2e/search.e2e.ts` first test: type `"archetype"`, expect `a[data-search-result="/terminology/archetype"]` and `a[data-search-result="/principles/P06-archetypes-specialize-verification"]`; rename the test to "slash opens the dialog, and a search for archetype finds the Archetype term and P06". Do not touch the playground tests in these files (WP18 owns them).

If the archetype search does not find both pages, make sure the word "archetype" appears in the body text of both documents; do not weaken the test.

### T095 – GRACE context

Rewrite `.grace/context/requirements.xml`: `Annotation` "Telos is a semantic-first, agent-native programming framework: systems are Loci composed from semantic extensions, verified by Archetypes and exposed through Packs.", `Keywords` "bun, typescript, effect, semantic model, locus, archetype, packs, agent-native", one `Goal` per spec user story (9 goals, one sentence each), keep `Users` and `Constraints`. In `.grace/context/principles.xml` keep the four existing `<Principle>` lines and add one line per new principle: `<Principle>PNN <Title>: <summary></Principle>`. Run `bun run grace:lint`.

### T096 – Verify

Run `bun run format`, then `bun run verify`. Record each step's result exactly.

## Definition of Done

- [ ] Every subtask of this WP is done.
- [ ] Every document uses the existing front matter shape of its kind, and every link and `related` id resolves.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly).
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope (for example `docs(foundation): ...`), with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP16 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- A link to a removed heading anchor fails the build; keep the headings listed above.
- Never write `verified` or `passing` in front matter or in Status/Maturity table columns (the content build rejects it).
- Do not link to `ADR-0018` (it does not exist until WP17).

## Reviewer guidance

- 16 principles with the contract titles and the four sections; 25 terms with the order table; the 12 old terms are gone.
- `git grep -nE "\b(Fabric|Facet|Lens|Mandate|Witness|Verdict)\b" -- docs/foundation` finds only `future-semantic-evolution.md`, the `## OQ-0NN` history notes and the philosophy document's history notes.
- Only the listed test assertions changed.

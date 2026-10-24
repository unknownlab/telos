---
id: open-questions
title: Open questions
kind: questions
status: open
maturity: proposed
summary: The register of unresolved questions about the Telos semantic model, with the state of each under the rebuilt model, what is known, the alternatives and the evidence that would settle it.
related:
  [conceptual-model, decisions, research, future-semantic-evolution, principles]
---

# Open questions

Every unresolved question about the Telos model has an entry here with a stable id. A question is closed by an architecture decision record, which then links back. Ids are never reused. Each entry states its **current state** under the rebuilt model first, then what is known, the alternatives and the evidence needed.

Earlier entries used the retired terms Fabric, Facet, Lens and Witness. Their meaning is now carried by the [semantic model](terminology/semantic-model.md), [semantic extensions](terminology/semantic-extension.md), [Archetypes](terminology/archetype.md) and [future semantic evolution](future-semantic-evolution.md).

To find what is still undecided: read this file, then [decision records](../decisions/README.md) with status `proposed`.

| ID     | Question                                                              | Blocks            | Current state                         |
| ------ | --------------------------------------------------------------------- | ----------------- | ------------------------------------- |
| OQ-001 | What makes a good Locus boundary?                                     | Archetypes        | Open                                  |
| OQ-002 | Can a Locus belong to more than one semantic model?                   | Multi-root models | Open                                  |
| OQ-003 | How should nested and renamed Loci be named?                          | Identity v2       | Open                                  |
| OQ-004 | Is ownership unique per model or across models?                       | Multi-view        | Open                                  |
| OQ-005 | Who decides relation cycle policy: the kernel or Archetypes?          | Archetypes        | Partly resolved (kernel rules)        |
| OQ-006 | Can an extension own independent state?                               | Extensions        | Open                                  |
| OQ-007 | Is a semantic model an entity with history or a derived composition?  | Semantic model    | Resolved: derived composition         |
| OQ-008 | Where does a purpose end and a requirement begin?                     | Requirements      | Open                                  |
| OQ-009 | What besides the definition belongs to a revision?                    | Evolution         | Open, future concept                  |
| OQ-010 | What makes a Locus well formed beyond the kernel checks?              | Extensions        | Open                                  |
| OQ-011 | How stable must the canonical form and digest be?                     | Persistence       | Open                                  |
| OQ-012 | How is drift between the model and code detected?                     | Analysis          | Partly resolved (closure check)       |
| OQ-013 | Is the set of relation kinds closed or extensible?                    | Archetypes        | Resolved: extensions define types     |
| OQ-014 | What is the semantic intermediate representation?                     | Tooling           | Open                                  |
| OQ-015 | What is the minimum provenance of verification evidence?              | Verification      | Open, future concept                  |
| OQ-016 | What runtime substrate enforces grants beyond the kernel check?       | Agents            | Open                                  |
| OQ-017 | How does an Archetype express and check its scope?                    | Archetypes        | Open                                  |
| OQ-018 | When can Telos govern its own development?                            | Self-application  | Open                                  |
| OQ-019 | Who allocates identity namespaces?                                    | Identity v2       | Open                                  |
| OQ-020 | Can the playground run arbitrary user code safely?                    | Docs              | Open                                  |
| OQ-021 | How do the GRACE architecture description and the Telos model relate? | GRACE and model   | Open (spec D4)                        |
| OQ-022 | Which correctness claims does Semantic Closure not cover?             | Closure           | Open                                  |
| OQ-023 | How are revisions identified and recorded over time?                  | Revisioning       | Open                                  |
| OQ-024 | When, if ever, does an autonomous software factory belong to Telos?   | Scope             | Out of scope for this mission (C-008) |

## OQ-001

**What makes a good Locus boundary?**

Current state: open. The kernel checks identity, containment and composition, but it does not decide where a Locus should end.

Known: domain-driven design's bounded contexts give a linguistic criterion (one consistent model and vocabulary); modular design gives information hiding and change locality. The mission uses a heuristic: one purpose, one owner, limited change effect.

Alternatives: linguistic boundary; ownership boundary; change-coupling boundary measured from history; deployment boundary.

Evidence needed: modelling several real systems and comparing which criterion produces Loci whose changes stay local.

## OQ-002

**Can a Locus belong to more than one semantic model?**

Current state: open. A model is built from one root, so a Locus is in exactly one model today.

Known: real resources are shared (one database serving two systems). The current model validates one root at a time.

Alternatives: (a) one home model, with other models referring to it through cross-model relations; (b) free membership, with each model validating its own view; (c) views computed over one global set of Loci.

Evidence needed: a prototype of cross-model relations and how duplicate-identity checks behave across models.

## OQ-003

**How should nested and renamed Loci be named?**

Current state: open. Identities are flat (`namespace:name`) and independent of the container, so re-parenting does not rename.

Alternatives: hierarchical names with no semantic meaning; hierarchical names that must match containment; flat names plus aliases for renames.

Evidence needed: how often real models re-parent and rename, and what breaks.

## OQ-004

**Is ownership unique per model or across models?**

Current state: open. Containment is unique within one model.

Known: a team-ownership view and a runtime view may disagree.

Alternatives: one canonical containment tree; one per declared model with an explicit mapping.

Evidence needed: a second model view in practice.

## OQ-005

**Who decides relation cycle policy?**

Current state: partly resolved. The kernel rejects containment cycles, which are part of its structural checks. Other cycles are reported, and no Archetype decides them yet.

Alternatives: the kernel forbids dependency cycles; Archetype rules decide; cycles are allowed but reported as findings.

Evidence needed: the first Archetype that needs a different policy; real dependency graphs.

## OQ-006

**Can an extension own independent state?**

Current state: open. Extension properties are part of the Locus definition.

Alternatives: definitions only; definitions plus attached observations (metrics, verification results) that are not part of the definition.

Evidence needed: the first observability extension.

## OQ-007

**Is a semantic model an entity with history or a derived composition?**

Current state: resolved. The semantic model is a derived composition: it is computed from the Loci reachable from a root, and it has no history of its own. History belongs to revisions, which are future direction ([future semantic evolution](future-semantic-evolution.md)).

## OQ-008

**Where does a purpose end and a requirement begin?**

Current state: open. The `telos.purpose` extension holds the purpose, responsibilities and excluded scope as narrative properties. Requirements are not modelled yet.

Alternatives: success conditions migrate into requirements; purpose stays narrative; purpose parts become typed requirements over time.

Evidence needed: the design of a requirements extension.

## OQ-009

**What besides the definition belongs to a revision?**

Current state: open, and a future concept. The model has no revisions yet. See [future semantic evolution](future-semantic-evolution.md).

Alternatives: add author, time, reason and parent to a revision with a separate content digest; keep them in history entries; keep them in evolution records.

Evidence needed: the evolution design and audit needs.

## OQ-010

**What makes a Locus well formed beyond the kernel checks?**

Current state: open. The kernel checks identity, containment, composition and relation shape. Extensions and Archetypes may add more, but none is defined beyond the calculator's proof.

Alternatives: extension schema validity; Archetype conformance; minimum formality levels per kind of Locus.

Evidence needed: the first extensions and Archetypes beyond the calculator.

## OQ-011

**How stable must the canonical form and digest be?**

Current state: open. The kernel uses a canonical JSON form and SHA-256 for contracts. Any change to either changes every digest.

Alternatives: version the canonical form inside the digest; never change it; migrate with mapping tables.

Evidence needed: the first need to persist digests across Telos versions.

## OQ-012

**How is drift between the model and code detected?**

Current state: partly resolved. The Semantic Closure check reports managed files without an owner. It does not detect a Locus whose declared capabilities no longer match the code behind them.

Alternatives: import-graph comparison; markup that names Loci in source; declarations colocated with code; types generated from declarations.

Evidence needed: a prototype on the Telos packages themselves.

## OQ-013

**Is the set of relation kinds closed or extensible?**

Current state: resolved. Relation types are declared by extensions, so the set is extensible by definition. A relation type that grants invocation is the only kind that produces grants.

## OQ-014

**What is the semantic intermediate representation?**

Current state: open. The kernel uses TypeScript values and a canonical JSON form. A portable representation would let other languages and tools read the model. Requirements are in [technical direction](architecture/technical-direction.md#semantic-intermediate-representation).

Alternatives: JSON with a published schema; a graph format; a typed binary format.

Evidence needed: the first non-TypeScript consumer.

## OQ-015

**What is the minimum provenance of verification evidence?**

Current state: open, and a future concept. The documentation site records origin, runtime, revision and time for each displayed result; the kernel does not yet record evidence beyond the finding and its knowledge status.

Alternatives: in-toto or SLSA-style attestations; a Telos-specific record.

Evidence needed: the design of evidence records and their first consumer.

## OQ-016

**What runtime substrate enforces grants beyond the kernel check?**

Current state: open. `invoke` enforces grants inside the kernel, but a declared grant without isolation is still a convention outside the kernel.

Known: candidates are capability-passing in Effect services, process sandboxes, WebAssembly components and containers or micro-VMs.

Evidence needed: a threat model and an agent runtime prototype.

## OQ-017

**How does an Archetype express and check its scope?**

Current state: open. An Archetype applies to Loci whose composition includes the extensions it names; a finer scope is not defined.

Alternatives: scope by extension membership alone; by a query over the model; by explicit Locus lists.

Evidence needed: the first Archetypes beyond the calculator.

## OQ-018

**When can Telos govern its own development?**

Current state: open. Spec Kitty and GRACE govern development today ([ADR-0011](../decisions/ADR-0011-temporary-engineering-tools.md)).

Alternatives: per-responsibility handover as each Telos mechanism matures; a single switch-over.

Evidence needed: a Telos mechanism that matches an external tool's behaviour on real changes.

## OQ-019

**Who allocates identity namespaces?**

Current state: open. Namespaces are free text in the identity grammar.

Alternatives: per-repository registry; per-model; organisational registry.

Evidence needed: a second team or repository using Telos.

## OQ-020

**Can the playground run arbitrary user code safely?**

Current state: open. The playground uses structured inputs only ([ADR-0014](../decisions/ADR-0014-controlled-playground.md)).

Alternatives: sandboxed iframe with a strict content security policy; Web Worker without network; WebAssembly-hosted interpreter.

Evidence needed: a threat model and a prototype that passes it.

## OQ-021

**How do the GRACE architecture description and the Telos model relate?**

Current state: open, decision D4 of the rebuild mission. The `.grace/` directory keeps a description of modules, contracts and verification next to the kernel model. This mission does not merge the two.

Alternatives: keep both, with a checked mapping between them; generate one from the other; move the architecture description into the Telos model once the model can represent it.

Evidence needed: a mapping of the current `.grace/` modules to Loci, and a check of where they disagree.

## OQ-022

**Which correctness claims does Semantic Closure not cover?**

Current state: open. Semantic Closure states that every managed file has an owner. It says nothing about whether the owner's description is correct, and it does not cover unmanaged files.

Alternatives: state the excluded trees explicitly in the model; require a purpose for each owner; add a rule that checks each owner's declared capabilities against code.

Evidence needed: a list of unowned or badly owned files from a real repository.

## OQ-023

**How are revisions identified and recorded over time?**

Current state: open, and a future concept. The model has no revisions yet. The question is about the design of [future semantic evolution](future-semantic-evolution.md).

Alternatives: content-addressed revisions; sequential revisions with parents; both.

Evidence needed: the first case that needs to compare two states of one Locus.

## OQ-024

**When, if ever, does an autonomous software factory belong to Telos?**

Current state: out of scope for this mission. Constraint C-008 of the mission spec excludes it. The question is kept so that the boundary is visible.

Alternatives: keep it outside Telos and integrate through capabilities; add it as an Archetype and a Pack once the semantic model is proven.

Evidence needed: a working semantic model used by real teams, and a decision record that reopens the question.

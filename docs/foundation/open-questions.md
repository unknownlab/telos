---
id: open-questions
title: Open questions
kind: questions
status: open
maturity: proposed
summary: The register of unresolved conceptual and architectural questions, with what is known, the alternatives and the evidence that would settle each.
related: [conceptual-model, decisions, research]
---

# Open questions

Every unresolved question about the Telos model has an entry here with a stable id. A question is closed by an architecture decision record, which then links back. Ids are never reused.

To find what is still undecided: read this file, then [decision records](../decisions/README.md) with status `proposed`.

| ID     | Question                                                     | Blocks           |
| ------ | ------------------------------------------------------------ | ---------------- |
| OQ-001 | What makes a good Locus boundary?                            | Archetypes       |
| OQ-002 | Can a Locus belong to more than one Fabric?                  | Fabric design    |
| OQ-003 | How should nested and renamed Loci be named?                 | Identity v2      |
| OQ-004 | Is ownership unique per model or across models?              | Multi-view       |
| OQ-005 | Who decides relation cycle policy: the core or Archetypes?   | Archetypes       |
| OQ-006 | Can Facets own independent state?                            | Facets           |
| OQ-007 | Is a Fabric an entity with history or a derived composition? | Fabric design    |
| OQ-008 | Where does a Charter end and a requirement begin?            | Requirements     |
| OQ-009 | What besides the definition belongs to a Revision?           | Evolution        |
| OQ-010 | What makes a Locus well formed beyond Stage 0?               | Facets           |
| OQ-011 | How stable must the canonical form and digest be?            | Persistence      |
| OQ-012 | How is drift between definitions and code detected?          | Analysis         |
| OQ-013 | Is the set of Relation kinds closed or extensible?           | Archetypes       |
| OQ-014 | What is the semantic intermediate representation?            | Tooling          |
| OQ-015 | What is the minimum provenance of a Witness?                 | Verification     |
| OQ-016 | What runtime substrate enforces Mandates?                    | Agents           |
| OQ-017 | How does a Law express and check its scope?                  | Laws             |
| OQ-018 | When can Telos govern its own development?                   | Self-application |
| OQ-019 | Who allocates identity namespaces?                           | Identity v2      |
| OQ-020 | Can the playground run arbitrary user code safely?           | Docs             |

## OQ-001

**What makes a good Locus boundary?**

Known: DDD's bounded contexts give a linguistic criterion (one consistent model and vocabulary); modular design gives information hiding and change locality. Stage 0 uses a heuristic: one purpose, one owner, limited change effect.

Alternatives: linguistic boundary; ownership boundary; change-coupling boundary measured from history; deployment boundary.

Evidence needed: modelling several real systems and comparing which criterion produces Loci whose changes stay local.

## OQ-002

**Can a Locus belong to more than one Fabric?**

Known: real resources are shared (one database serving two systems). Stage 0 validates one Fabric at a time.

Alternatives: (a) one home Fabric, others reference it through cross-Fabric Relations; (b) free membership, with each Fabric validating its view; (c) Fabrics as Lenses over a global graph.

Evidence needed: a prototype of cross-Fabric Relations and how duplicate-identity checks behave across Fabrics.

## OQ-003

**How should nested and renamed Loci be named?**

Known: Stage 0 identities are flat (`namespace:name`) and independent of owner, so re-parenting does not rename.

Alternatives: hierarchical names with no semantic meaning; hierarchical names that must match ownership; flat names plus aliases for renames.

Evidence needed: how often real models re-parent and rename, and what breaks.

## OQ-004

**Is ownership unique per model or across models?**

Known: P03 says unique "within the applicable model". A team-ownership view and a runtime view may disagree.

Alternatives: one canonical ownership tree; one per declared model with explicit mapping.

Evidence needed: a second model view in practice.

## OQ-005

**Who decides relation cycle policy?**

Known: Stage 0 forbids ownership and `refines` cycles in the core and allows the rest.

Alternatives: core forbids `depends-on` cycles; Archetype Laws decide; cycles allowed but reported as warnings.

Evidence needed: the first Archetype implementation; real dependency graphs.

## OQ-006

**Can Facets own independent state?**

Known: Facets are part of a Locus's definition and Revision.

Alternatives: definitions only; definitions plus attached observations (metrics, Witnesses) that are not part of the Revision.

Evidence needed: the first observability or verification Facet.

## OQ-007

**Is a Fabric an entity with history or a derived composition?**

Known: Stage 0 Fabrics have an Identity and members but no history.

Alternatives: versioned entity with Revisions; pure computation over Loci; both (a definition plus derived views).

Evidence needed: the first case where a Fabric-level constraint changes independently of its members.

## OQ-008

**Where does a Charter end and a requirement begin?**

Known: Charter = purpose and accountability, narrative; requirement = addressable, testable obligation.

Alternatives: success conditions migrate into requirements; Charter stays narrative forever; Charter parts become typed requirements over time.

Evidence needed: the requirements Facet design.

## OQ-009

**What besides the definition belongs to a Revision?**

Known: Stage 0 Revisions hold only the semantic definition, so ids are deterministic.

Alternatives: add author, time, reason and parent to the Revision (git-commit style) with a separate content digest; keep them in history entries; keep them in Evolutions.

Evidence needed: Evolution design; audit needs.

## OQ-010

**What makes a Locus well formed beyond Stage 0?**

Known: Stage 0 well-formedness is INV-001 to INV-008.

Alternatives: Facet schema validity; Archetype conformance; minimum formality levels per kind of Locus.

Evidence needed: the first Facets and Archetypes.

## OQ-011

**How stable must the canonical form and digest be?**

Known: Stage 0 uses a canonical JSON form and SHA-256. Any change to either changes every Revision id.

Alternatives: version the canonical form inside the id (`sha256-c1:…`); never change it; migrate with mapping tables.

Evidence needed: the first need to persist Revisions across Telos versions.

## OQ-012

**How is drift between definitions and code detected?**

Known: nothing detects it in Stage 0. GRACE markup links code to modules in this repository today.

Alternatives: import-graph comparison; markup that names Loci in source; definitions colocated with code; types compiled from definitions.

Evidence needed: a prototype on the Telos packages themselves.

## OQ-013

**Is the set of Relation kinds closed or extensible?**

Known: Stage 0 has four kinds, closed.

Alternatives: closed core set; Archetype-defined kinds with rules; open kinds with a required meaning.

Evidence needed: the first Archetype that needs a new kind.

## OQ-014

**What is the semantic intermediate representation?**

Known: Stage 0 uses TypeScript values and a canonical JSON form. A portable IR would let other languages and tools read the model. Requirements are in [technical direction](architecture/technical-direction.md#semantic-intermediate-representation).

Alternatives: JSON with a published schema; a graph format; a typed binary format.

Evidence needed: the first non-TypeScript consumer.

## OQ-015

**What is the minimum provenance of a Witness?**

Known: the Stage 0 docs site records origin, runtime, revision and time for each displayed result.

Alternatives: in-toto or SLSA-style attestations; a Telos-specific record.

Evidence needed: the Witness design and its first consumer (a Verdict).

## OQ-016

**What runtime substrate enforces Mandates?**

Known: declared authority without isolation is a convention. Candidates: capability-passing in Effect services; process sandboxes; WebAssembly components; containers or micro-VMs.

Evidence needed: a threat model and an agent runtime prototype.

## OQ-017

**How does a Law express and check its scope?**

Known: a Law without scope is incomplete.

Alternatives: scope by Fabric or Archetype membership; by Lens query; by explicit Locus lists.

Evidence needed: the first Laws beyond the core rules.

## OQ-018

**When can Telos govern its own development?**

Known: Spec Kitty and GRACE govern it today ([ADR-0011](../decisions/ADR-0011-temporary-engineering-tools.md)).

Alternatives: per-responsibility handover as each Telos mechanism matures; a single switch-over.

Evidence needed: a Telos mechanism that matches an external tool's behaviour on real changes.

## OQ-019

**Who allocates identity namespaces?**

Known: Stage 0 namespaces are free text in a grammar.

Alternatives: per-repository registry; per-Fabric; organisational registry.

Evidence needed: a second team or repository using Telos.

## OQ-020

**Can the playground run arbitrary user code safely?**

Known: Stage 0 uses structured inputs only ([ADR-0014](../decisions/ADR-0014-controlled-playground.md)).

Alternatives: sandboxed iframe with a strict content security policy; Web Worker without network; WebAssembly-hosted interpreter.

Evidence needed: a threat model and a prototype that passes it.

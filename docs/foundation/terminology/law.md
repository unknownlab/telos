---
id: law
title: Law
kind: term
order: 9
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A formalised normative constraint on structure, behaviour, interaction, authority or evolution within a defined scope, distinct from the mechanism that enforces it.
related: [archetype, fabric, charter, witness, evolution-of-determinism]
---

# Law

## Definition

A formalised normative constraint governing permissible structure, behaviour, interaction, authority or evolution within a defined scope.

## Responsibility

Laws are where accepted knowledge becomes executable constraint ([Evolution of Determinism](../philosophy/evolution-of-determinism.md#3-the-cycle)). A Law states what must hold; its enforcement makes sure future change keeps it.

## Boundaries

- A Law is **distinct from its enforcement mechanism**. "Domain Loci never depend on infrastructure Loci" is the Law; a graph check on every Revision is one enforcement; a reviewer checklist is another. The Law survives a change of mechanism.
- A Law is **not** a [Charter](charter.md). It constrains; it does not state purpose.
- A Law has a **scope**. A Law without stated applicability is incomplete.

## Kinds of enforcement

Static (checked on definitions), dynamic (checked at run time), experimental (checked by test or simulation), controlled review (checked by an authorised reviewer). A Law may have several.

## Relationships

Belongs to an [Archetype](archetype.md), a [Fabric](fabric.md) or a [Locus](locus.md), which fixes its scope. Checking it produces [Witnesses](witness.md). Changing it is an [Evolution](evolution.md).

## Invariants (proposed)

- Every Law has an identity, a scope and at least one enforcement or an explicit "unenforced" marker.
- Every Law records its origin: which decision or discovery produced it.

## Lifecycle

Proposed, enforced, deprecated, retired. Each step is a governed change. A retired Law stays in history.

## Examples

"Every instant exchanged in the billing Fabric is UTC." "No Act with external effects runs without a Mandate." "`refines` Relations are acyclic" (a Law the Stage 0 core hard-codes).

## Non-examples

A guideline nobody can check or review ("write clean code"), a test case (one enforcement of a Law, not the Law).

## Open questions

- How is a Law's scope expressed and checked ([OQ-017](../open-questions.md#oq-017))?
- When should a Law be promoted from a Locus to a Fabric or Archetype?

## Classification

Governance model. Not fundamental. Needs enforcement engines. Definition provisional. Stage 0: deferred. Stage 0 hard-codes a few structural rules in the core; they are Laws in spirit but not modelled as Law values.

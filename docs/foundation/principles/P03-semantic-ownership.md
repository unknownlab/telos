---
id: P03-semantic-ownership
title: Semantic Ownership
kind: principle
number: 3
code: P03
status: provisional
maturity: proposed
summary: Each managed artifact has exactly one owning semantic unit; shared use does not imply shared ownership, and cross-boundary dependencies are explicit.
related:
  [
    P02-everything-has-meaning,
    P04-explicit-composition,
    locus,
    relation,
    ADR-0007,
  ]
---

# P03 — Semantic Ownership

## Definition

Within a given model, each managed artifact has exactly one owning semantic unit. Many units may **use** an artifact; only one **owns** it, meaning it is accountable for its definition, its correctness and its evolution. When one unit depends on something owned by another, that dependency is declared explicitly as a [Relation](../terminology/relation.md).

## Motivation

Shared ownership is no ownership. When two teams or two agents both "own" a module, each assumes the other checks it. Single ownership gives every change a responsible party, every question a place to ask, and every artifact an unambiguous place in the graph.

## Scope

Applies to managed artifacts and to Loci themselves: a nested Locus has one owner Locus. "Within the applicable model" matters: a later version of Telos may have several models (for example a runtime view and a team view), and ownership is unique within each, not necessarily across them ([OQ-004](../open-questions.md#oq-004)).

## Consequences

- Ownership is a structural property with one value, not a relation that can be added many times ([ADR-0007](../../decisions/ADR-0007-ownership-is-structural.md)).
- Ownership forms a forest: no unit owns itself, directly or through a cycle.
- Use across boundaries goes through declared Relations and, later, through contracts ([P04](P04-explicit-composition.md)).

## Known limitations

- Some real artifacts are co-owned in practice, for example a shared schema negotiated between teams. The model forces a choice; the losing side's interest has to be expressed as a Relation or a Law.
- Ownership says who is accountable, not who may change something. That is authority ([P06](P06-authority-is-explicit.md)).

## Enforcement

- Potential: validation rejects artifacts with zero or several owners; change governance requires the owner's acceptance policy.
- Today: not enforced. Stage 0 proposes INV-005 and INV-006: a declared owner must exist, must not be the Locus itself, and ownership must be acyclic.

## Relationships

Refines [P02](P02-everything-has-meaning.md). Enables [P04](P04-explicit-composition.md) and [P06](P06-authority-is-explicit.md).

## Commitment vs. current invariant

Commitment: one owner per managed artifact per model. Current invariant: none on `main`.

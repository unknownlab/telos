---
id: P04-explicit-composition
title: Explicit Composition
kind: principle
number: 4
code: P04
status: provisional
maturity: proposed
summary: Independent semantic units interact only through declared, typed relationships and contracts, so composition can be inspected, analysed and governed.
related:
  [
    P03-semantic-ownership,
    P11-verification-is-contextual,
    relation,
    fabric,
    act,
    ADR-0006,
    ADR-0008,
  ]
---

# P04 — Explicit Composition

## Definition

Independent semantic units interact through declared relationships and contracts. A system's composition, which unit relies on which and in what way, is part of the model. It can be listed, analysed and governed without reading every line of code.

## Motivation

Implicit coupling is the main reason a change has surprising effects. If dependencies exist only as import statements, network calls and shared tables, nobody can say what a change affects without reading everything. Declared composition makes impact analysis, targeted verification ([P11](P11-verification-is-contextual.md)) and architectural rules ([Laws](../terminology/law.md)) possible.

## Scope

Applies between Loci and, later, between their elements (Acts, Facets). It does not forbid implementation details inside a Locus: what happens inside a boundary is the owner's business. It requires that what crosses a boundary is declared.

## Consequences

- Relations are typed. A dependency, a refinement, a verification link and a satisfaction link are different kinds with different rules ([ADR-0008](../../decisions/ADR-0008-typed-relations.md)).
- A Relation must point at something that exists in the model. Dangling Relations are errors.
- A [Fabric](../terminology/fabric.md) is the unit in which composition is checked ([ADR-0006](../../decisions/ADR-0006-locus-and-fabric-are-distinct.md)).

## Known limitations

- Declared composition can disagree with actual code. Until Telos can compare the two, declarations are claims, not facts ([OQ-012](../open-questions.md#oq-012)).
- Fine-grained declaration is costly. Telos has to find the level of detail where declaration pays for itself.

## Enforcement

- Potential: compare declared Relations with observed imports and calls; reject undeclared cross-boundary use; Archetype Laws restrict which Relations are allowed.
- Today: not enforced. Stage 0 proposes INV-007 and INV-008: typed Relations whose targets exist, no self-relations, no duplicates, no refinement cycles.

## Relationships

Requires [P03](P03-semantic-ownership.md) (boundaries must exist before they can be crossed explicitly). Enables [P05](P05-capabilities-instead-of-arbitrary-tools.md), [P11](P11-verification-is-contextual.md) and [P15](P15-engine-independence.md).

## Commitment vs. current invariant

Commitment: all cross-boundary interaction is declared. Current invariant: none on `main`.

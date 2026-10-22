---
id: relation
title: Relation
kind: term
order: 4
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A typed semantic relationship between Loci or their elements, with kind-specific rules that support architectural analysis and change propagation.
related: [locus, fabric, law, archetype, ADR-0008]
---

# Relation

## Definition

A typed semantic relationship between Loci or their constituent elements. The type, or **kind**, says what the relationship means and which rules apply to it. Not all connections are dependencies, and Telos does not treat them as equivalent.

## Responsibility

Relations make composition explicit ([P04](../principles/P04-explicit-composition.md)). They are the edges of the semantic graph that impact analysis, targeted verification and architectural Laws work on.

## Boundaries

- A Relation is **declared**, not observed. An import statement is evidence that a Relation may exist, not the Relation itself.
- **Ownership is not a Relation.** It is a single structural property of a Locus ([ADR-0007](../../decisions/ADR-0007-ownership-is-structural.md)).
- A Relation in Stage 0 connects whole Loci. Relations between elements (an Act to a requirement) are deferred.

## Stage 0 kinds

A closed set of four kinds, as set out in [ADR-0008](../../decisions/ADR-0008-typed-relations.md):

| Kind         | Meaning: source → target                                                                | Extra rule                |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------- |
| `depends-on` | The source cannot fulfil its Charter without the target.                                | None (cycles are allowed) |
| `refines`    | The source is a more specific form of the target's responsibility.                      | Acyclic                   |
| `satisfies`  | The source fulfils obligations stated by the target (for example a requirements Locus). | None                      |
| `verifies`   | The source produces evidence about the target.                                          | None                      |

Rules for every kind: the target exists in the same Fabric; a Locus does not relate to itself; the same kind and target appear at most once per source.

Why only `refines` is acyclic: refinement is a strict order by definition, so a cycle is a contradiction. Dependency cycles are architecturally questionable but real, and whether they are forbidden is an architecture choice that belongs to an [Archetype](archetype.md) [Law](law.md), not to the core ([OQ-005](../open-questions.md#oq-005)).

## Relationships

Connects [Loci](locus.md) within a [Fabric](fabric.md). Constrained by [Laws](law.md) (deferred). Used by [Lenses](lens.md) and impact analysis (deferred).

## Invariants

- INV-007: kind is known, target exists, no self-relation, no duplicate.
- INV-008: `refines` is acyclic.

## Lifecycle

Part of the source Locus's definition. Adding or removing a Relation is a semantic change visible in the change set between Revisions. Relations form a set: their order has no meaning.

## Examples

`shop:checkout-page depends-on shop:payment-authorization`; `shop:payment-tests verifies shop:payment-authorization`; `shop:card-authorization refines shop:payment-authorization`.

## Non-examples

"Is in the same folder as", "was edited in the same commit as", "is owned by".

## Open questions

- Should the kind set be extensible by Archetypes ([OQ-013](../open-questions.md#oq-013))?
- Who decides cycle policy ([OQ-005](../open-questions.md#oq-005))?

## Classification

Fundamental semantic primitive. Definition provisional. Stage 0: in scope.

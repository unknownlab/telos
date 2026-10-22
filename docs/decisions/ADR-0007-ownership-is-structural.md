---
id: ADR-0007
title: Ownership is a single structural property, not a Relation
kind: decision
status: proposed
maturity: implemented
date: 2026-10-21
summary: Each Locus has at most one owner, declared as a property; the owner must exist in the Fabric, cannot be the Locus itself and ownership cannot form a cycle.
related: [locus, relation, P03-semantic-ownership, open-questions]
---

# ADR-0007 — Ownership is a single structural property, not a Relation

## Context

[P03](../foundation/principles/P03-semantic-ownership.md) requires every managed artefact to have one semantic owner. The minimal-model hypothesis lists only Identity, Locus, Charter, Relation and Revision, so ownership could be one more Relation kind. The [conceptual model](../foundation/conceptual-model/README.md#3-the-minimal-model-hypothesis) found that treating it as a Relation makes "at most one owner" a cross-Relation rule instead of a shape, and makes every query for "the owner" a search.

## Decision

1. Ownership is a property `owner?: Identity` of the Locus definition.
2. A Locus without an owner is a root.
3. Validation rejects an owner that does not exist in the Fabric (INV-005), an owner equal to the Locus itself and any ownership cycle (INV-006).
4. Ownership is part of the Revision content: re-parenting changes the Revision but not the Identity ([ADR-0003](ADR-0003-identity-independent-of-paths.md)).

## Alternatives

- **An `owned-by` Relation kind** with a uniqueness rule: fits the five-concept hypothesis literally, but the rule lives outside the type.
- **Owner lists children (`contains`)**: makes the parent's Revision change whenever a child is added; the child then cannot declare its own place.
- **Multiple owners**: contradicts P03.

## Consequences

- The minimal model is the five concepts plus a structural owner field and a minimal Fabric, as recorded in the conceptual model.
- Whether ownership is unique per model or across models is [OQ-004](../foundation/open-questions.md#oq-004).

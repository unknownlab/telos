---
id: fabric
title: Fabric
kind: term
order: 6
classification: derived-composition
fundamental: false
engine: false
stage0: minimal
status: provisional
maturity: proposed
summary: A coherent composition of related Loci, their Relations and shared constraints, representing a software system or a meaningful subsystem.
related: [locus, relation, law, archetype, lens, ADR-0006]
---

# Fabric

## Definition

A coherent composition of related Loci, their Relations and shared constraints, representing a software system or a meaningful subsystem. A Fabric describes composition; it is not just a collection.

## Responsibility

A Fabric is the scope in which a set of Loci is checked as a whole: identities are unique, Relations resolve, shared constraints hold. Later it is the scope in which an [Archetype](archetype.md) applies and from which [Lenses](lens.md) are computed.

## Boundaries

- A Fabric is **not** a Locus. A Locus has a purpose and responsibility; a Fabric has members and constraints ([ADR-0006](../../decisions/ADR-0006-locus-and-fabric-are-distinct.md)). A system may well have both: a Locus `shop:shop` that states the shop's purpose, and a Fabric that composes the shop's Loci.
- A Fabric is **not** a repository, a workspace or a deployment unit.

## Stage 0 form

Minimal: a Fabric has an [Identity](identity.md) in the same form as a Locus and a set of member Locus definitions. Validating a Fabric checks every Stage 0 invariant over its members and produces either a validated Fabric value or the complete list of diagnostics. Shared constraints, Fabric Revisions and membership in several Fabrics are deferred.

## Relationships

Contains [Loci](locus.md) and, through them, [Relations](relation.md). Constrained by [Laws](law.md) and [Archetypes](archetype.md) (deferred). Viewed through [Lenses](lens.md) (deferred).

## Invariants

All Stage 0 invariants that span more than one Locus are checked per Fabric: INV-002, INV-005 to INV-008.

## Lifecycle

Stage 0: a value created and validated on demand. Later: possibly versioned, with its own Revisions ([OQ-007](../open-questions.md#oq-007)).

## Examples

`shop:checkout` composing `shop:checkout-page`, `shop:payment-authorization` and `ops:orders-database`.

## Non-examples

"All Loci in this repository" (an inventory; may be a Lens), "the payments team" (an organisation).

## Open questions

- Is a Fabric an entity with its own identity and history, or a derived composition computed from Loci ([OQ-007](../open-questions.md#oq-007))? Stage 0 gives it an identity but no history.
- Can a Locus belong to several Fabrics, and if so, which one checks it ([OQ-002](../open-questions.md#oq-002))?
- How do Relations across Fabric boundaries work?

## Classification

Derived composition. Definition provisional. Stage 0: minimal (validation scope only).

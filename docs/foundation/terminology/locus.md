---
id: locus
title: Locus
kind: term
order: 1
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: An identifiable, bounded semantic unit with a defined responsibility, specification state, ownership boundaries, relationships and provided capabilities.
related: [identity, charter, relation, revision, fabric, facet, act, ADR-0002]
---

# Locus

Plural: **Loci**.

## Definition

An identifiable, bounded semantic unit with a defined responsibility, specification state, ownership boundaries, relationships and provided capabilities.

## Responsibility

A Locus is the place where meaning lives. It answers: what is this, why does it exist, who owns it, what does it rely on and what does it offer. Every managed artifact belongs to exactly one Locus ([P02](../principles/P02-everything-has-meaning.md), [P03](../principles/P03-semantic-ownership.md)).

## Boundaries

- A Locus is **semantic**, not physical. It is not a file, a directory, a package or a process, though it may be realised by any of them, or by several.
- A Locus is **not necessarily a runtime actor**. A Locus for a pure function never runs on its own.
- What is inside a Locus is its owner's business; what crosses its boundary is declared through [Relations](relation.md) and, later, [Acts](act.md).

## Relationships

- Has exactly one [Identity](identity.md).
- Has exactly one [Charter](charter.md).
- Has at most one owner Locus (nesting). Ownership is structural, not a Relation ([ADR-0007](../../decisions/ADR-0007-ownership-is-structural.md)).
- Has zero or more outgoing [Relations](relation.md).
- Is versioned by [Revisions](revision.md).
- Is composed with other Loci in a [Fabric](fabric.md).
- Is extended by [Facets](facet.md) and exposes [Acts](act.md) (both deferred).

## Invariants

Proposed for Stage 0 (see [conceptual model](../conceptual-model/README.md#5-invariants)):

- INV-001: its identity is well formed.
- INV-002: its identity is unique within its Fabric.
- INV-003: its identity does not depend on where its definition is stored.
- INV-004: it has a Charter with a purpose and at least one responsibility.
- INV-005, INV-006: its owner, if any, exists, is not itself, and ownership is acyclic.

## Lifecycle

A Locus is introduced by an accepted Revision of its definition, evolves through further Revisions, and may be retired by a Revision that marks it retired. Retirement is not deletion: its history stays ([P08](../principles/P08-preserve-the-baseline.md)). Stage 0 implements introduction and change; retirement is deferred.

## Examples

- `shop:payment-authorization`, the business capability of authorising card payments.
- `shop:checkout-page`, a UI component.
- `ops:orders-database`, an infrastructure resource.
- `agents:release-notes-writer`, an AI agent.
- `telos:locus-foundation`, the Stage 0 package itself.

## Non-examples

- `src/utils/` (a directory, not a responsibility).
- "Everything the payments team owns" (an organisational grouping; it may be a Lens or a Fabric, not a Locus).
- A single function call at run time (an execution event, not a semantic unit).

## Open questions

- What exactly makes a good Locus boundary ([OQ-001](../open-questions.md#oq-001))?
- Can one Locus belong to several Fabrics ([OQ-002](../open-questions.md#oq-002))?
- How should nested Loci be named ([OQ-003](../open-questions.md#oq-003))?

## Classification

Fundamental semantic primitive. Definition provisional. Stage 0: in scope.

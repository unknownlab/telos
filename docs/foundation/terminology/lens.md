---
id: lens
title: Lens
kind: term
order: 12
classification: derived-composition
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A computed, purpose-specific view of a Locus or Fabric that selects and organises relevant information for a task, agent or process, without granting authority.
related: [fabric, locus, mandate, relation]
---

# Lens

## Definition

A computed, purpose-specific view of a Locus or Fabric for a particular task, agent or process. A Lens selects and organises relevant information.

## Responsibility

Lenses give each actor the context it needs and no more: an agent fixing a bug in one Locus sees that Locus, its Relations, the relevant Laws and recent Witnesses, not the whole system.

## Boundaries

- A Lens **never grants authority**. Authority comes only from a [Mandate](mandate.md).
- A Lens is **derived**. It holds no definitions of its own; it is computed from the model and can be recomputed.
- A Lens is **not** a security filter. Hiding information in a Lens does not make it secret.

## Relationships

Computed from [Fabrics](fabric.md), [Loci](locus.md), [Relations](relation.md) and other records. Typically paired with a Mandate for an agent task.

## Invariants (proposed)

- A Lens is a deterministic function of the model Revision it was computed from and its parameters.
- A Lens records that Revision, so stale context is detectable.

## Lifecycle

Computed on demand; discarded or cached; invalidated when its source Revision changes.

## Examples

"Everything within two `depends-on` hops of `shop:payment-authorization`, with Charters and open Verdicts." The Stage 0 documentation site's agent reference is a hand-built ancestor of a Lens.

## Non-examples

A permission set, a copy of the repository.

## Open questions

- How are Lenses specified: as queries, as code, as both?

## Classification

Derived composition. Not fundamental. Needs a context engine. Definition provisional. Stage 0: deferred.

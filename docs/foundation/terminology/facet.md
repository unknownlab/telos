---
id: facet
title: Facet
kind: term
order: 7
classification: facet
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A typed aspect of a Locus that adds a specification, interpretation, analytical perspective or execution capability without changing the Locus's identity.
related: [locus, charter, act, law, witness]
---

# Facet

## Definition

A typed aspect of a Locus that provides a particular specification, interpretation, analytical perspective or execution capability without changing the Locus's fundamental identity.

## Responsibility

Facets are how a Locus grows richer without the core model growing heavier. Requirements, risk, verification, infrastructure, observability and agent integration each attach as a Facet, interpreted by its own engine.

## Boundaries

- A Facet is **not** automatically a Locus. It has no Charter of its own and no independent ownership; it belongs to its Locus.
- A Facet does **not** change its Locus's Identity. Adding a risk Facet to `shop:payment-authorization` produces a new Revision of the same Locus.
- A Facet is **not** a plugin with arbitrary power. Its type defines what it may contain and which engine interprets it.

## Relationships

Attached to exactly one [Locus](locus.md). Interpreted by an engine. May contain or refer to [Laws](law.md), requirements, [Acts](act.md) and verification procedures that produce [Witnesses](witness.md).

## Invariants (proposed, not Stage 0)

- A Facet's type is known to the framework or to a declared extension.
- A Facet's content validates against its type's schema.
- A Facet is part of its Locus's Revision.

## Lifecycle

Added, changed and removed through Revisions of its Locus.

## Examples

Behaviour (Act contracts), Requirements (FR and NFR entries with ids), Risk (scenarios and ratings), Verification (procedures and evidence policies), Infrastructure (resource specs), Observability (signals and SLOs), Agent integration (prompts, model choices, budgets).

## Non-examples

A sub-Locus (that is nesting through ownership), a Relation (that is composition), a comment in source code.

## Open questions

- Can a Facet own independent state, such as run-time metrics, or only definitions ([OQ-006](../open-questions.md#oq-006))?
- When should an aspect become a Locus instead of a Facet?

## Classification

Facet mechanism. Not fundamental. Definition provisional. Stage 0: deferred. An extension point may be added in Stage 0 only if the vertical slice needs it; the current plan does not.

---
id: ADR-0002
title: Locus is the primary semantic unit
kind: decision
status: proposed
maturity: proposed
date: 2026-10-21
summary: The Locus, a bounded semantic unit with identity, Charter, single owner and typed Relations, is the unit every other Telos concept attaches to.
related:
  [
    locus,
    purpose,
    conceptual-model,
    P03-no-code-outside-semantics,
    open-questions,
  ]
---

# ADR-0002 — Locus is the primary semantic unit

## Context

Telos needs one unit to which meaning, ownership, relationships, evidence and authority attach. Candidates in existing practice are files, packages, services, bounded contexts, SysML parts and C4 containers. Each is tied to a particular level or technology: files and packages to storage, services to deployment, C4 containers to runtime, bounded contexts to domain language.

## Decision

The [Locus](../foundation/terminology/locus.md) is the primary semantic unit: an identifiable, bounded unit with a Charter, at most one owner, typed Relations and, later, Facets and Acts. It is independent of storage, deployment and runtime. Everything else in the model either composes Loci (Fabric, Lens), extends them (Facet), constrains them (Law, Archetype), acts through them (Act, Mandate) or records their change (Revision, Variant, Witness, Verdict, Evolution).

The [conceptual model](../foundation/conceptual-model/README.md#3-the-minimal-model-hypothesis) tests this against seven representative cases and finds it sufficient for identity, purpose, ownership and structure.

## Alternatives

- **Package or module as the unit**: ties meaning to storage, which [P02](../foundation/principles/P03-no-code-outside-semantics.md) rejects.
- **Bounded context as the unit**: too coarse; a bounded context typically contains many Loci. A bounded context may be modelled as a Locus with nested Loci, or as a Fabric.
- **No primary unit, a general graph of typed nodes**: maximally flexible, but every tool would have to rediscover which nodes carry responsibility.

## Consequences

- One abstraction must serve UI components, processes, agents and infrastructure. Facets carry what differs.
- Boundary choice becomes the central modelling skill ([OQ-001](../foundation/open-questions.md#oq-001)).

## Evidence that would reopen it

A representative case that cannot be identified, bounded or owned as a Locus without distortion.

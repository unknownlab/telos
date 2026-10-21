---
id: archetype
title: Archetype
kind: term
order: 8
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A reusable programmable architecture specification that defines allowed structures, responsibilities, relationships, constraints and composition rules.
related: [law, fabric, relation, locus]
---

# Archetype

## Definition

A reusable, programmable architecture specification defining allowed structures, responsibilities, relationships, constraints and composition rules.

## Responsibility

An Archetype turns an architectural style into something the framework can check and help build. Applied to a [Fabric](fabric.md), it says which kinds of Loci may exist, which [Relations](relation.md) between them are allowed and which [Laws](law.md) hold.

## Boundaries

- An Archetype is **not** a code template or scaffold generator. It may come with generators, but its essence is the rules.
- An Archetype is **not** a Law. It is a coherent bundle of Laws, structural roles and composition rules.
- An Archetype does **not** change the core model. It constrains it.

## Relationships

Applied to [Fabrics](fabric.md). Composed of [Laws](law.md) and roles for [Loci](locus.md). May restrict or extend [Relation](relation.md) kinds ([OQ-013](../open-questions.md#oq-013)).

## Invariants (proposed)

- Applying an Archetype to a Fabric yields a deterministic list of violations.
- Archetypes are versioned; a Fabric records which version it follows.

## Lifecycle

Defined, versioned, applied to Fabrics, revised through governed change, possibly deprecated.

## Examples

Functional DDD (aggregates, domain services, no infrastructure in the domain layer), Hexagonal Architecture (ports and adapters, dependencies point inward), Event-Driven Architecture, Actor Systems, Modular Monolith (modules communicate only through public interfaces).

## Non-examples

A Yeoman template, a folder convention, a lint rule on its own.

## Open questions

- How are Archetypes composed, for example Hexagonal inside a Modular Monolith?
- Does dependency acyclicity belong in Archetypes rather than the core ([OQ-005](../open-questions.md#oq-005))?

## Classification

Governance model. Not fundamental. Needs a dedicated engine (architecture checker). Definition provisional. Stage 0: deferred.

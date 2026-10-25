---
id: P01-one-fundamental-entity
title: "One Fundamental Entity: Locus"
kind: principle
number: 1
code: P01
status: provisional
maturity: proposed
summary: A system is described by one fundamental entity, the Locus, and every other semantic concept is defined as an extension, a relation, a capability or a derived view of Loci.
related:
  [
    P02-composable-extensions,
    P12-no-duplicate-semantic-models,
    locus,
    identity,
    containment,
    semantic-model,
  ]
---

# P01 — One Fundamental Entity: Locus

## Definition

The only fundamental semantic entity in Telos is the [Locus](../terminology/locus.md): an identifiable context responsible for part of a system. A Locus has an [Identity](../terminology/identity.md) and, optionally, a description, contained Loci, relations, capabilities and properties. No other field is mandatory. Every other concept is either defined by an extension, expressed as a relation or capability, or derived from Loci.

## Motivation

Systems are described in many vocabularies at once: components, services, modules, files, requirements, owners. Each vocabulary adds a separate model that must be kept in step with the others. A single entity removes the need to decide which kind of thing a description is about before it can be written down, and it gives the kernel one structure to check.

## In practice

- `Locus.make` in `packages/kernel/src/locus.ts` is the only constructor for the semantic entity; it requires an identity and nothing else.
- `buildModel` in `packages/kernel/src/model.ts` collects every Locus reachable from a root and produces the [semantic model](../terminology/semantic-model.md).
- Containment is a single structural field on the Locus, checked by the kernel (`packages/kernel/src/model.ts`), not a relation type.

## Limits

- A single entity does not make all descriptions equally precise. Some Loci stay sparse until an extension gives them typed properties.
- Choosing where one Locus ends and another begins is a design decision the kernel cannot make ([OQ-001](../open-questions.md#oq-001)).

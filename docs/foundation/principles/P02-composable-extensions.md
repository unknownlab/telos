---
id: P02-composable-extensions
title: Extensions Are Composable
kind: principle
number: 2
code: P02
status: provisional
maturity: proposed
summary: Meaning is added to Loci through semantic extensions that combine explicitly into a Locus kind, and an incompatible combination is reported rather than silently merged.
related:
  [
    P01-one-fundamental-entity,
    P06-archetypes-specialize-verification,
    semantic-extension,
    composition,
    locus-kind,
    relation-type,
  ]
---

# P02 — Extensions Are Composable

## Definition

A [semantic extension](../terminology/semantic-extension.md) is a reusable definition that specializes a Locus with typed properties, [relation types](../terminology/relation-type.md), [Archetypes](../terminology/archetype.md) and new meaning. Extensions are combined by [composition](../terminology/composition.md) into a [Locus kind](../terminology/locus-kind.md). When two extensions define the same property or relation type differently, the composition reports a conflict. It never overwrites one definition with the other.

## Motivation

Inheritance hierarchies force a single taxonomy on every concept, and mixins hide which behaviour came from where. Explicit composition lets a team add a concern, such as a command surface or a purpose statement, without rewriting the Loci that already exist, and it keeps the origin of each property visible to the reader and to the checker.

## In practice

- The `Extension` definition and the composition function live in `packages/kernel/src/extension.ts` and `packages/kernel/src/composition.ts`.
- A composition with conflicting definitions returns a diagnostic from `packages/kernel/src/diagnostic.ts` with a stable code, and no Locus kind is produced.
- The built-in `telos.purpose` extension is defined in `packages/kernel/src/extensions/purpose.ts` and is composed like any other extension.

## Limits

- Composition order does not matter by design. Two extensions that define the same name with the same meaning are accepted, but a definition that differs only in wording is still a conflict.
- Composition checks structure. It does not check whether the meaning of two extensions is compatible in practice.

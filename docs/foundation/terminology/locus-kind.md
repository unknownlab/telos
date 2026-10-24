---
id: locus-kind
title: Locus kind
kind: term
order: 4
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The result of composing zero or more semantic extensions, which is the definition used to make Loci.
related: [composition, semantic-extension, locus]
---

# Locus kind

## Definition

The result of [composing](composition.md) zero or more [semantic extensions](semantic-extension.md). A Locus kind is the definition from which [Loci](locus.md) are made.

## Avoid

"class" and "type" in prose. Those words suggest object-oriented inheritance or a programming-language type; a Locus kind is a composed definition that carries no behaviour of its own.

## In the model

A Locus kind is produced by the composition function in `packages/kernel/src/composition.ts` and used by `Locus.make` in `packages/kernel/src/locus.ts`. A Locus made from a kind records the kind's extensions as part of its composition.

## Related

- [Composition](composition.md), [semantic extension](semantic-extension.md), [Locus](locus.md).

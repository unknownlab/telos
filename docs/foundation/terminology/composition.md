---
id: composition
title: Composition
kind: term
order: 3
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The combination of semantic extensions into a Locus kind, where incompatible definitions are reported and never silently overwritten.
related: [semantic-extension, locus-kind, diagnostic, P02-composable-extensions]
---

# Composition

## Definition

Combining [semantic extensions](semantic-extension.md) into a [Locus kind](locus-kind.md). When two extensions define the same name differently, the composition reports a conflict. It never overwrites one definition with the other.

## Avoid

"inheritance" and "merge". Inheritance implies a single ordered chain; merge implies that one definition silently wins. Composition is explicit and order-independent.

## In the model

The composition function is in `packages/kernel/src/composition.ts`. A conflict is returned as a [diagnostic](diagnostic.md) with a stable code, and no Locus kind is produced for it.

## Related

- [Semantic extension](semantic-extension.md) and [Locus kind](locus-kind.md).
- [Principle P02](../principles/P02-composable-extensions.md).

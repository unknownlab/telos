---
id: semantic-extension
title: Semantic extension
kind: term
order: 2
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: A reusable definition that specializes a Locus with typed properties, relation types, Archetypes and new meaning.
related:
  [
    locus,
    composition,
    locus-kind,
    relation-type,
    archetype,
    P02-composable-extensions,
  ]
---

# Semantic extension

## Definition

A reusable definition that specializes a Locus with typed properties, [relation types](relation-type.md), [Archetypes](archetype.md) and new meaning.

## Avoid

"facet", "plugin" and "mixin". A facet suggests a view on an existing thing; a plugin suggests running code at load time; a mixin hides where a behaviour came from. An extension is a declared definition that is composed explicitly.

## In the model

The `Extension` definition is in `packages/kernel/src/extension.ts`. The built-in `telos.purpose` extension is in `packages/kernel/src/extensions/purpose.ts`. Packs distribute extensions; see [Pack](pack.md).

## Related

- [Composition](composition.md): how extensions combine.
- [Locus kind](locus-kind.md): the result of composing extensions.
- [Principle P02](../principles/P02-composable-extensions.md).

---
id: pack
title: Pack
kind: term
order: 15
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: An ordinary TypeScript package that distributes semantic extensions, Archetypes and adapters.
related:
  [
    semantic-extension,
    archetype,
    interface-locus,
    P08-no-mandatory-architecture,
  ]
---

# Pack

## Definition

An ordinary TypeScript package that distributes [semantic extensions](semantic-extension.md), [Archetypes](archetype.md) and adapters. A Pack adds meaning to a project without changing the kernel.

## Avoid

"plugin" and "module". A plugin suggests a loader with hidden hooks; a module is a code unit, and a Pack is a distribution of semantic definitions.

## In the model

The Packs in this repository are `packages/cli`, `packages/agent` and `packages/web`, each of which provides [interface Loci](interface-locus.md) over the kernel. A Pack imports the kernel's public API and has no access to its internals.

## Related

- [Semantic extension](semantic-extension.md), [interface Locus](interface-locus.md), [principle P08](../principles/P08-no-mandatory-architecture.md).

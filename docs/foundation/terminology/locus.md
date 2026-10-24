---
id: locus
title: Locus
kind: term
order: 1
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: "The only fundamental semantic entity: an identifiable context responsible for part of a system, with an identity and optional description, containment, relations, capabilities and properties."
related:
  [
    identity,
    containment,
    relation,
    semantic-extension,
    locus-kind,
    P01-one-fundamental-entity,
  ]
---

# Locus

Plural: **Loci**.

## Definition

The only fundamental semantic entity: an identifiable context responsible for part of a system. It has an identity and, optionally, a description, contained Loci, relations, capabilities and properties. No other field is mandatory.

## Avoid

"node", "component", "entity" and "Fabric". Each suggests a file, a runtime unit or a grouping rather than a semantic context. A Locus may be realised by files, packages or processes, but it is not any of them.

## In the model

`Locus.make` in `packages/kernel/src/locus.ts` is the only constructor. `buildModel` in `packages/kernel/src/model.ts` collects every Locus reachable from a root. Extensions add typed properties to a Locus; see [semantic extension](semantic-extension.md) and [locus kind](locus-kind.md).

## Related

- [Identity](identity.md): every Locus has exactly one.
- [Containment](containment.md): a Locus has at most one container.
- [Relation](relation.md): typed, directed statements from a Locus.
- [Principle P01](../principles/P01-one-fundamental-entity.md).

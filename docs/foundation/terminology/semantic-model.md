---
id: semantic-model
title: Semantic model
kind: term
order: 13
classification: derived-composition
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: All Loci reachable from a root Locus, with the structure checked by the kernel.
related:
  [
    locus,
    containment,
    relation,
    semantic-closure,
    diagnostic,
    P04-code-is-the-source-of-truth,
  ]
---

# Semantic model

## Definition

All [Loci](locus.md) reachable from a root Locus, together with their [containment](containment.md), [relations](relation.md), [capabilities](capability.md) and the structure the kernel has checked.

## Avoid

"Fabric" and "graph". A semantic model is not a container of loose parts; it is the checked description of one root. "Graph" suggests a drawing, and the model is more than its edges.

## In the model

`buildModel` in `packages/kernel/src/model.ts` builds the model from a root. It runs the structural [diagnostics](diagnostic.md) and reports the result. `bun run telos inspect` prints it.

## Related

- [Principle P04](../principles/P04-code-is-the-source-of-truth.md): the model is computed from code.
- [Semantic closure](semantic-closure.md): the model must own every managed file.

---
id: containment
title: Containment
kind: term
order: 5
classification: semantic-primitive
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The structural ownership of one Locus by another, where each Locus has at most one container and a root has none.
related: [locus, identity, semantic-model, ADR-0007]
---

# Containment

## Definition

The structural ownership of one [Locus](locus.md) by another. Each Locus has at most one container. A root Locus has none.

## Avoid

"parent" in prose, and "Fabric" for a grouping. A parent suggests inheritance; a grouping has no ownership. Containment is ownership of responsibility, as set by [ADR-0007](../../decisions/ADR-0007-ownership-is-structural.md).

## In the model

Containment is a single structural field on the Locus. The kernel checks in `packages/kernel/src/containment.ts` that a container exists, is not the Locus itself, and that containment is acyclic. Containment is not a [relation](relation.md).

## Related

- [Locus](locus.md), [identity](identity.md), [semantic model](semantic-model.md).

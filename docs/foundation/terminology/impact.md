---
id: impact
title: Impact
kind: term
order: 17
classification: derived-composition
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The Loci, relations and rules affected by a change to a Locus or capability, computed from the model.
related: [semantic-model, locus, capability, rule]
---

# Impact

## Definition

The [Loci](locus.md), [relations](relation.md) and [rules](rule.md) affected by a change to a Locus or to a [capability](capability.md). Impact is computed from the [semantic model](semantic-model.md), not estimated.

## Avoid

"blast radius". That phrase describes damage in a physical sense; an impact is the set of model elements that a change touches, and it can be listed.

## In the model

The impact query is in `packages/kernel/src/impact.ts`. It walks valid incoming [relations](relation.md) breadth-first: first the relations that point at the changed Locus (or, for a capability target, at that capability), then the relations that point at each Locus found so far. Relations of every type count. Each affected Locus is reported with its shortest relation path and distance. The checks of the target, of the affected Loci and of their containers are listed. The introspection tools expose it to agents.

Known limitation: impact follows relations only. Containment is not followed, so a Locus that depends on a group containing the changed Locus is not listed. For example, the impact of `calculator:arithmetic#add` does not list `telos:docs-site`, which depends on the `telos:calculator` group.

## Related

- [Semantic model](semantic-model.md), [capability](capability.md), [executable introspection](executable-introspection.md).

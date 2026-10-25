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
maturity: proposed
summary: The Loci, relations and rules affected by a change to a Locus or capability, computed from the model.
related: [semantic-model, locus, capability, rule]
---

# Impact

## Definition

The [Loci](locus.md), [relations](relation.md) and [rules](rule.md) affected by a change to a Locus or to a [capability](capability.md). Impact is computed from the [semantic model](semantic-model.md), not estimated.

## Avoid

"blast radius". That phrase describes damage in a physical sense; an impact is the set of model elements that a change touches, and it can be listed.

## In the model

The impact query is in `packages/kernel/src/impact.ts`. It follows relations and containment outward from the changed element. The introspection tools expose it to agents.

## Related

- [Semantic model](semantic-model.md), [capability](capability.md), [executable introspection](executable-introspection.md).

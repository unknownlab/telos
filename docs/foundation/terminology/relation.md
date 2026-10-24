---
id: relation
title: Relation
kind: term
order: 24
classification: semantic-primitive
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: One typed, directed statement from a Locus to a Locus or to a capability, whose meaning is given by its relation type.
related: [locus, relation-type, capability, grant, identity]
---

# Relation

## Definition

One typed, directed statement from a Locus to a Locus or to a [capability](capability.md). The meaning of the statement is given by its [relation type](relation-type.md), not by the relation itself.

## Avoid

"edge" and "link". Those words describe a graph drawing; a relation carries a defined meaning and a type that the model checks.

## In the model

Relations are stored on the source Locus in `packages/kernel/src/relation.ts`. `buildModel` in `packages/kernel/src/model.ts` checks that each relation's target exists and that its relation type is declared by an extension in the composition of the source Locus. A relation whose type grants invocation is the only source of a [grant](grant.md).

## Related

- [Relation type](relation-type.md): the defined meaning of a relation.
- [Grant](grant.md): permission derived from an invocation relation.
- [Locus](locus.md) and [identity](identity.md): the ends of a relation.

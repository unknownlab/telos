---
id: relation-type
title: Relation type
kind: term
order: 6
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A named meaning of a relation, defined by a semantic extension, such as "CLI command maps to capability".
related:
  [relation, semantic-extension, grant, P15-no-arbitrary-agent-privileges]
---

# Relation type

## Definition

A named meaning of a [relation](relation.md), defined by a [semantic extension](semantic-extension.md). For example, the relation type "CLI command maps to capability" gives a meaning to a relation from a command Locus to a capability.

## Avoid

"edge kind" and "link". A relation type is a defined meaning with rules about its source and target, not a label on a drawing.

## In the model

Relation types are declared in an extension definition in `packages/kernel/src/extension.ts`. A relation type can mark that it grants invocation; only such a type can produce a [grant](grant.md).

## Related

- [Relation](relation.md), [semantic extension](semantic-extension.md), [grant](grant.md).

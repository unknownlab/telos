---
id: identity
title: Identity
kind: term
order: 23
classification: semantic-primitive
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The declared name of a Locus, written namespace:name, which stays the same while the Locus's definition and location change.
related: [locus, relation, containment, ADR-0003]
---

# Identity

## Definition

The declared name of a Locus, written `namespace:name`. The grammar is the one set by [ADR-0003](../../decisions/ADR-0003-identity-independent-of-paths.md): each part is lowercase kebab case, starts with a letter, and has no hyphen at the end.

## Avoid

"path" and "key". An identity is not a file path or a lookup key; it does not depend on where the definition is stored.

## In the model

`Identity.make` in `packages/kernel/src/identity.ts` validates the grammar and the length limit of 128 characters. `buildModel` in `packages/kernel/src/model.ts` rejects two Loci with the same identity in one model. Identity is not derived from the owner: re-parenting a Locus does not rename it.

## Related

- [Locus](locus.md): every Locus has exactly one identity.
- [Relation](relation.md) and [containment](containment.md) refer to Loci by identity.
- Examples: `shop:payment-authorization`, `telos:locus-foundation`.

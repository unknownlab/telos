---
id: archetype
title: Archetype
kind: term
order: 25
classification: verification-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A named set of verification rules that applies to every Locus whose composition includes the extensions the Archetype names.
related:
  [
    rule,
    finding,
    semantic-extension,
    composition,
    P06-archetypes-specialize-verification,
    P07-no-universal-correctness,
  ]
---

# Archetype

## Definition

A named set of verification [rules](rule.md) that applies to every Locus whose [composition](composition.md) includes given [semantic extensions](semantic-extension.md).

## Avoid

"law", "lens" and "validator". A law sounds normative and fixed; a lens is a view, not a check; a validator checks syntax. An Archetype groups rules that test a kind of Locus.

## In the model

`Archetype.make` in `packages/kernel/src/archetype.ts` builds an Archetype from named rules and the extensions it applies to. `verify` in `packages/kernel/src/verify.ts` runs the applicable rules and records one [finding](finding.md) per rule and Locus.

## Related

- [Rule](rule.md): one check of an Archetype.
- [Finding](finding.md): the outcome of one rule on one Locus.
- [Principle P06](../principles/P06-archetypes-specialize-verification.md) and [P07](../principles/P07-no-universal-correctness.md).

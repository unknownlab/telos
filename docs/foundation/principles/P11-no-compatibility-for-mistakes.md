---
id: P11-no-compatibility-for-mistakes
title: No Compatibility for Obsolete Mistakes
kind: principle
number: 11
code: P11
status: provisional
maturity: proposed
summary: Telos does not keep compatibility layers for an earlier model that was a mistake; it replaces the mistake and records the change.
related:
  [
    P07-no-universal-correctness,
    P16-no-speculative-implementation,
    semantic-model,
    future-semantic-evolution,
  ]
---

# P11 — No Compatibility for Obsolete Mistakes

## Definition

When an earlier concept, name or API was a mistake, Telos removes it and replaces it with the correct concept. It does not keep an alias, a deprecated shim or a compatibility mode for the old form. The change is recorded in a decision record and in the terminology, so the history stays available to readers.

## Motivation

A compatibility layer keeps two models alive at once. Every new feature must then reason about both, and the old model rarely gets removed. Because Telos is still in its foundation phase, removing a mistake now costs less than keeping it.

## In practice

- The rebuild of the foundation removed the old term set, such as Fabric, Facet and Charter, from `docs/foundation/terminology/`, and records each replacement in the terminology index.
- The model has no alias that maps an old name to a new one inside the kernel.
- Decision records in `docs/decisions/` keep the reasoning for each removal.

## Limits

- Removing a name breaks anyone who used it. This is accepted for unreleased work and must be re-examined before a public release.
- History is kept in the documents and in version control, not in the running model.

---
id: diagnostic
title: Diagnostic
kind: term
order: 10
classification: verification-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A structural problem in a model, in identity, ownership, composition or relation, with a stable code.
related: [finding, composition, containment, identity]
---

# Diagnostic

## Definition

A structural problem in a model: in identity, ownership, [composition](composition.md) or [relation](relation.md). Each diagnostic has a stable code, so that it can be referred to in documents and in tests.

## Avoid

"error" for rule results. A diagnostic describes the shape of the model. A [finding](finding.md) describes the outcome of a check on a Locus. Keeping the two apart stops a structural problem from being reported as a failed rule.

## In the model

Diagnostics are produced in `packages/kernel/src/diagnostic.ts`. Structural checks use them: identity grammar, uniqueness, containment cycles, composition conflicts and dangling relations. The `bun run telos check` command prints them.

## Related

- [Finding](finding.md), [composition](composition.md), [containment](containment.md), [identity](identity.md).

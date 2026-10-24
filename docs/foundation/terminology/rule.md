---
id: rule
title: Rule
kind: term
order: 9
classification: verification-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: One check of an Archetype, with a method that is either static or execution.
related: [archetype, finding, knowledge-status, P13-no-unverified-guarantees]
---

# Rule

## Definition

One check of an [Archetype](archetype.md), with a method. A static rule reads the model. An execution rule runs something in the repository and records what happened.

## Avoid

"test case". A rule is a declared check that produces a [finding](finding.md); a test case is an executable example. A rule can be implemented by tests, but it is defined by what it checks.

## In the model

Rules are declared with their Archetype in `packages/kernel/src/archetype.ts`. Execution rules are run by `verify` in `packages/kernel/src/verify.ts`, which records a [knowledge status](knowledge-status.md) for each result.

## Related

- [Archetype](archetype.md), [finding](finding.md), [knowledge status](knowledge-status.md).

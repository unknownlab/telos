---
id: knowledge-status
title: Knowledge status
kind: term
order: 12
classification: verification-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: "The state of a fact in the model, from declared and derived facts to execution results, not run, observed, invalidated and unknown."
related: [finding, rule, P13-no-unverified-guarantees]
---

# Knowledge status

## Definition

The state of a fact in the model. There are eight statuses: **declared** (written by a person or definition), **derived** (computed from declarations), **verified** (a rule result produced by a real execution in this repository), **failed**, **not run**, **observed** (reserved), **invalidated** (reserved) and **unknown**.

## Avoid

"confidence". A status records how a fact was obtained, not how sure anyone is about it. "Verified" is never used for something a person or definition declares.

## In the model

The statuses are the values of the type `Knowledge` in `packages/kernel/src/describe.ts`. Every [finding](finding.md) carries one. `observed` and `invalidated` are defined but nothing in this mission produces them.

## Related

- [Finding](finding.md), [rule](rule.md), [principle P13](../principles/P13-no-unverified-guarantees.md).

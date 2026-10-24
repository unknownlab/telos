---
id: P12-no-duplicate-semantic-models
title: No Manually Synchronized Duplicate Models
kind: principle
number: 12
code: P12
status: provisional
maturity: proposed
summary: Telos does not keep a hand-written copy of the semantic model beside the model computed from code, and it states where the architecture description kept in GRACE overlaps with the Telos model.
related:
  [
    P01-one-fundamental-entity,
    P03-no-code-outside-semantics,
    P04-code-is-the-source-of-truth,
    semantic-model,
    semantic-closure,
  ]
---

# P12 — No Manually Synchronized Duplicate Models

## Definition

A fact about the system is recorded once. A copy of the semantic model kept by hand and updated separately from the code is not allowed as a source of truth. Where a second description is needed for a reason, it is either generated from the first or checked against it by a tool that reports drift.

## Motivation

Two descriptions that must be updated by hand drift apart. The drift is silent until someone relies on the stale copy. Recording a fact once, and computing the rest, keeps the model trustworthy.

## In practice

- The [semantic model](../terminology/semantic-model.md) is computed by `buildModel` in `packages/kernel/src/model.ts`; no separate hand-written graph is kept.
- The Semantic Closure check in `packages/kernel/src/closure.ts` reports any managed file that the model does not own, which is a visible sign of drift.
- Known overlap: the `.grace/` directory keeps an architecture description (contracts, module graph and verification) next to the kernel model. This mission does not merge the two. The overlap is a known limit, recorded in [open questions](../open-questions.md), and the decision on how the two relate is left for a later mission (spec D4).

## Limits

- The GRACE overlap means that for now there are two descriptions of architecture. They are kept consistent by the mission process, not by a tool, until D4 is decided.
- Generated documents can be out of date between generations. The build regenerates them from `docs/`.

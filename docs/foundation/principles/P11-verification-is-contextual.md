---
id: P11-verification-is-contextual
title: Verification Is Contextual
kind: principle
number: 11
code: P11
status: provisional
maturity: vision
summary: Verification depth follows the affected semantics, requirements, risks, dependencies, uncertainty and mandatory constraints; skipping a non-mandatory check must be explainable.
related:
  [
    P04-explicit-composition,
    P09-evidence-before-acceptance,
    relation,
    law,
    witness,
  ]
---

# P11 — Verification Is Contextual

## Definition

How much verification a change needs depends on what it affects: the semantics it changes, the requirements involved, the associated risks, its dependencies, the uncertainty that remains and the constraints that are mandatory regardless. A full-system audit is not required for every small change. When a non-mandatory check is skipped, the system can explain why.

## Motivation

Running everything on every change is slow and expensive, and at scale becomes impossible. Running too little misses regressions. Declared composition ([P04](P04-explicit-composition.md)) and revision diffs make it possible to compute what a change touches and choose checks accordingly, the way incremental build systems rebuild only what changed.

## Scope

Applies to the selection of verification for a change. Mandatory constraints, such as security Laws or contractual obligations, are always checked; contextual selection applies only above that floor.

## Consequences

- Change impact is computed from Relations and semantic diffs.
- Check selection is itself a recorded decision, with a reason for each skipped check.
- Verification policies distinguish mandatory from contextual checks.

## Known limitations

- Impact analysis is only as good as the declared model; undeclared coupling defeats it.
- Explanations of skipped checks can be wrong. They need to be auditable after the fact.

## Enforcement

- Potential: impact analysis over the Relation graph; risk-weighted check selection; skip records with reasons.
- Today: not enforced. This repository runs the full check suite on every commit, which is correct while it is small.

## Relationships

Requires [P04](P04-explicit-composition.md) and [P08](P08-preserve-the-baseline.md) (a diff needs a baseline). Feeds [P09](P09-evidence-before-acceptance.md).

## Commitment vs. current invariant

Commitment: verification is selected by context, above a mandatory floor. Current invariant: none.

---
id: variant
title: Variant
kind: term
order: 13
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: An isolated candidate future state of a Locus or Fabric derived from a specific baseline; it is not an accepted Revision.
related: [revision, evolution, witness, verdict, P08-preserve-the-baseline]
---

# Variant

## Definition

An isolated candidate future state of a Locus or Fabric, derived from a particular baseline.

## Responsibility

A Variant is where change is built and tried without touching the accepted state ([P08](../principles/P08-preserve-the-baseline.md)). Several Variants may compete for the same baseline.

## Boundaries

- A Variant is **not** an accepted Revision. It may contain Revisions, but none of them is the baseline until a [Verdict](verdict.md) accepts the Variant.
- A Variant is **not** a git branch, though a branch may hold one. Spec Kitty lane worktrees are today's rough analogue.
- A Variant records its baseline. A Variant whose baseline has moved must be re-based or re-evaluated.

## Relationships

Derived from a baseline [Revision](revision.md). Built and evaluated within an [Evolution](evolution.md). Evaluated through [Witnesses](witness.md); accepted or rejected by a [Verdict](verdict.md).

## Invariants (proposed)

- Every Variant names exactly one baseline.
- Building a Variant never changes the baseline's history.

## Lifecycle

Created from a baseline; modified; evaluated; then accepted (its head becomes the new baseline by compare-and-set), rejected, abandoned or superseded.

## Examples

Two agents propose different fixes for one bug; each fix is a Variant of the same baseline. The Verdict accepts one.

## Non-examples

The current production state; an unrelated experiment with no baseline.

## Open questions

- How are Variants of a Fabric isolated when they touch several Loci?

## Classification

Governance model. Not fundamental. Definition provisional. Stage 0: deferred. Stage 0 Revision histories implement the compare-and-set step a Variant needs, nothing more.

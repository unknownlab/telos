---
id: P08-preserve-the-baseline
title: Preserve the Baseline
kind: principle
number: 8
code: P08
status: provisional
maturity: proposed
summary: A change preserves an identifiable previous accepted state; a proposed future state never silently overwrites the baseline.
related:
  [
    P07-evolution-is-fundamental,
    P09-evidence-before-acceptance,
    revision,
    variant,
    ADR-0005,
  ]
---

# P08 — Preserve the Baseline

## Definition

Every change preserves an identifiable previous accepted state, the baseline. A proposed future state may coexist with the baseline but never silently replaces it. Legacy implementations and their tests may run alongside new versions during migration. Whether a change can be rolled back is evaluated, not assumed.

## Motivation

A change that overwrites its baseline destroys the reference against which it should be judged. Without the baseline, "what changed?" cannot be answered precisely, regressions cannot be compared, and rollback becomes guesswork. Content-addressed, immutable history makes the baseline a value rather than a memory.

## Scope

Applies to accepted semantic state: Revisions of definitions. It does not promise that every effect is reversible. Data deletion, messages sent and money moved can be irreversible; for those, preserving the baseline means preserving the record of what was done, and evaluating rollback feasibility before acting.

## Consequences

- Revisions are immutable and content-addressed ([ADR-0005](../../decisions/ADR-0005-immutable-content-addressed-revisions.md)).
- The accepted state advances only from a named baseline: a new Revision must state which Revision it replaces, and the update fails if the baseline has moved since (compare-and-set).
- Several candidate futures ([Variants](../terminology/variant.md)) may exist at once against one baseline.

## Known limitations

- Keeping old versions running costs resources and adds complexity; migration has to end deliberately.
- Rollback feasibility depends on external systems Telos does not control.

## Enforcement

- Potential: revision stores that reject stale updates; migration tooling that keeps old and new implementations side by side; rollback analysis per Act effect.
- Today: not enforced. Stage 0 proposes INV-010 and INV-011: Revisions are immutable, and a history accepts a new head only from the current one.

## Relationships

Makes [P07](P07-evolution-is-fundamental.md) safe. Supplies the reference point for [P09](P09-evidence-before-acceptance.md) and [P11](P11-verification-is-contextual.md).

## Commitment vs. current invariant

Commitment: no change silently overwrites the accepted state. Current invariant: none on `main`.

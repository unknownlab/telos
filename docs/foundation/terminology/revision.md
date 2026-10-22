---
id: revision
title: Revision
kind: term
order: 5
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: An immutable, identifiable version of a managed semantic definition, the basis for baselines, comparison, provenance and history.
related: [locus, identity, variant, evolution, witness, ADR-0005]
---

# Revision

## Definition

An immutable, identifiable version of a framework-managed semantic definition or state. Revisions are the basis for baselines, comparisons, provenance and historical reasoning.

## Responsibility

A Revision fixes "what exactly was this, at that point" so that evidence, decisions and later changes can refer to it without ambiguity.

## Boundaries

- A Revision is **not** a git commit. A commit versions bytes in files; a Revision versions a semantic definition. One commit may contain many Revisions, and a formatting-only commit contains none.
- A Revision is **not** accepted by virtue of existing. A candidate future definition can be revised into existence inside a [Variant](variant.md) without being accepted. What is accepted is recorded by the history's head (the baseline).
- A Revision does **not** include storage details such as the source path ([INV-003](../conceptual-model/README.md#5-invariants)).

## Stage 0 form

As set out in [ADR-0005](../../decisions/ADR-0005-immutable-content-addressed-revisions.md):

- A Revision is content-addressed: its id is a cryptographic digest of the canonical form of the semantic definition.
- The canonical form is deterministic: sets (responsibilities, success conditions, Relations) are ordered canonically, so two definitions that mean the same thing get the same id.
- A Revision value cannot be modified after creation.
- A **history** per Locus is an append-only sequence of Revision ids. Its last entry is the head, the current baseline. A new head is accepted only if the caller names the current head as its expected baseline (compare-and-set). A stale expectation is rejected; nothing is silently overwritten.
- Comparing two Revisions of the same Locus yields a **change set**: which parts of the definition were added, removed or changed.

## Relationships

Versions a [Locus](locus.md) definition (Stage 0) and, later, other managed definitions. Referenced by [Witnesses](witness.md) and [Verdicts](verdict.md). Produced inside [Variants](variant.md) and accepted through [Evolution](evolution.md).

## Invariants

- INV-010: a Revision's content and id never change after creation.
- INV-011: a history accepts a new head only from its current head.
- INV-012: equal semantics give equal ids; any semantic difference gives a different id and a non-empty change set.

## Lifecycle

Created, then immutable forever. May become the head of a history, stop being head when a later Revision is accepted, and become head again if the history moves back to it (a revert is a new history entry, not an edit).

## Examples

`sha256:9f2c…` for the current definition of `shop:payment-authorization`; the previous Revision before a responsibility was added.

## Non-examples

A git SHA, a package version `1.2.0`, a mutable "latest" pointer (that is a history head, not a Revision).

## Open questions

- What else belongs in a Revision: author, time, reason ([OQ-009](../open-questions.md#oq-009))? Stage 0 leaves them out so ids stay deterministic.
- How stable must the canonical form and digest algorithm be ([OQ-011](../open-questions.md#oq-011))?
- Do Fabrics have Revisions of their own ([OQ-007](../open-questions.md#oq-007))?

## Classification

Fundamental semantic primitive. Definition provisional. Stage 0: in scope.

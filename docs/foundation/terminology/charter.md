---
id: charter
title: Charter
kind: term
order: 3
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: A formal declaration of a Locus's purpose, objectives, responsibilities, boundaries and success conditions; it explains why the Locus exists.
related: [locus, law, facet, ADR-0002]
---

# Charter

Also called **Locus Charter** where it could be confused with Spec Kitty's project charter (`.kittify/charter/`), which is unrelated.

## Definition

A formal declaration of a Locus's purpose, objectives, responsibilities, boundaries and success conditions. The Charter explains **why** a Locus exists. It is the Locus's _telos_.

## Responsibility

The Charter is the reference for every judgement about a Locus: whether a change fits its purpose, whether a responsibility belongs here or elsewhere, whether the Locus is succeeding.

## Boundaries

- A Charter is **not** a requirements list. Requirements are individually addressable obligations, functional or non-functional, with their own identity, status and verification; they belong to a requirements [Facet](facet.md) or a requirements Locus. A Charter states purpose and responsibility; requirements state testable obligations that serve it ([OQ-008](../open-questions.md#oq-008)).
- A Charter is **not** a [Law](law.md). Laws constrain; a Charter orients.
- A Charter is **not** documentation about a Locus; it is part of the Locus's definition and changes only through a Revision.

## Stage 0 form

Proposed contents:

| Part               | Required | Meaning                                                                 |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| Purpose            | yes      | One statement of why the Locus exists.                                  |
| Responsibilities   | yes (≥1) | What the Locus is accountable for. A set: order carries no meaning.     |
| Excluded concerns  | no       | What the Locus explicitly does not do (boundary).                       |
| Success conditions | no       | Observable conditions under which the Locus fulfils its purpose. A set. |

Objectives in the definition above are expressed as success conditions in Stage 0. All parts are plain text in Stage 0 ([P14](../principles/P14-incremental-formalization.md)).

## Relationships

Exactly one per [Locus](locus.md). Refined by requirements (deferred). Constrained by [Laws](law.md) and [Archetypes](archetype.md) (deferred).

## Invariants

- INV-004: a purpose that is not blank and at least one responsibility that is not blank.
- No duplicate entries within a part (part of the Stage 0 contracts).

## Lifecycle

Created with its Locus. Changes are semantic changes: a Revision whose Charter differs is a different Revision, and the difference shows in the change set.

## Examples

Purpose: "Authorise customer card payments before an order is confirmed." Responsibilities: "Request authorisation from the payment provider", "Record the authorisation outcome". Excluded: "Capturing funds". Success: "Every confirmed order has exactly one successful authorisation".

## Non-examples

"Uses Stripe" (an implementation detail), "Must respond in 200 ms" (a non-functional requirement), "Owned by the payments team" (ownership, not purpose).

## Open questions

- Where exactly does a Charter end and a requirement begin ([OQ-008](../open-questions.md#oq-008))?
- Should success conditions become checkable, and how?

## Classification

Fundamental semantic primitive. Definition provisional. Stage 0: in scope.

---
id: verdict
title: Verdict
kind: term
order: 15
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: An explicit decision produced by evaluating evidence and policy against a claim or a proposed transition.
related: [witness, evolution, mandate, variant, ADR-0010]
---

# Verdict

## Definition

An explicit decision produced by evaluating evidence and policy against a specified claim or proposed transition.

## Responsibility

A Verdict is the point at which a change is accepted, rejected or deferred. It records what was decided, by whom, under which authority, on which evidence and which policy.

## Boundaries

- A Verdict is **distinct from a [Witness](witness.md)**. Evidence informs a decision; it does not authorise acceptance on its own.
- A Verdict is made under authority: a human, or an automated policy acting under a [Mandate](mandate.md).
- A Verdict is about a specific claim or transition, not about a system in general.

## Outcomes (proposed)

Accepted, rejected, suspended (waiting for evidence or authority), returned for further analysis.

## Relationships

Consumes [Witnesses](witness.md) and a policy. Concludes an [Evolution](evolution.md) step. Accepting a [Variant](variant.md) advances the baseline [Revision](revision.md).

## Invariants (proposed)

- Every Verdict references the evidence and the policy version it used.
- A Verdict cannot be issued by an actor whose Mandate excludes it ([P12](../principles/P12-independent-governance.md)).

## Lifecycle

Issued once and immutable. May later be superseded by a new Verdict, never edited.

## Examples

"Variant V-17 of `shop:payment-authorization` accepted by the payments owner on Witnesses W-1…W-9 under acceptance policy AP-3 v2." Today, a Spec Kitty review approval is a rough analogue.

## Non-examples

A test run, a lint pass, an agent saying "done".

## Open questions

- How are acceptance policies expressed?

## Classification

Governance model. Not fundamental. Needs a policy evaluator. Definition provisional. Stage 0: deferred.

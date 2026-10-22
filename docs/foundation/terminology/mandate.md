---
id: mandate
title: Mandate
kind: term
order: 11
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A bounded, verifiable delegation of authority to perform specific Acts or to propose or apply specified changes within a defined scope.
related:
  [
    act,
    lens,
    verdict,
    P06-authority-is-explicit,
    P13-human-as-strategic-authority,
  ]
---

# Mandate

## Definition

A bounded, verifiable delegation of authority to perform specific Acts, or to propose or apply specified changes, within a defined scope.

## Responsibility

Mandates make authority explicit ([P06](../principles/P06-authority-is-explicit.md)): who may do what, where, until when, within which budget, delegated by whom.

## Boundaries

- A Mandate is **not** a role. Roles may be a convenient way to issue Mandates, but the Mandate is the actual grant.
- A Mandate is **not** a [Lens](lens.md). Seeing something does not authorise acting on it.
- A Mandate request is **not** a Mandate. Requests never grant themselves.

## Parts (proposed)

Grantor, grantee, permitted Acts or change kinds, scope (Loci, Fabric), validity period, budget (calls, cost, time), delegation rules (may it be sub-delegated, how far), revocation.

## Relationships

Authorises [Act](act.md) executions and [Evolution](evolution.md) steps. Traces back through grantors to a human ([P13](../principles/P13-human-as-strategic-authority.md)).

## Invariants (proposed)

- Every Mandate chain has a human root.
- A delegated Mandate is never wider than its parent.
- Revocation takes effect for every later use.

## Lifecycle

Requested, granted or refused, used, possibly sub-delegated, expired or revoked.

## Examples

"The release-notes agent may read Revisions of Loci in `shop:*` and propose changes to `docs:release-notes` until 2026-12-31, at most 50 proposals."

## Non-examples

A shell on a developer laptop; an API key with no stated scope.

## Open questions

- Which runtime substrate enforces Mandates ([OQ-016](../open-questions.md#oq-016))?
- How do budgets compose across delegation?

## Classification

Governance model. Not fundamental. Needs an authority engine. Definition provisional. Stage 0: deferred.

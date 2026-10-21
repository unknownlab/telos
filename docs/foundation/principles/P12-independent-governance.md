---
id: P12-independent-governance
title: Independent Governance
kind: principle
number: 12
code: P12
status: provisional
maturity: vision
summary: The agents implementing a change cannot redefine its acceptance criteria, falsify its evidence or override the policies that govern it.
related:
  [
    P06-authority-is-explicit,
    P09-evidence-before-acceptance,
    P13-human-as-strategic-authority,
    verdict,
    mandate,
  ]
---

# P12 — Independent Governance

## Definition

The actors implementing a change do not hold unrestricted authority over how it is judged. They cannot redefine its acceptance criteria, fabricate or alter its evidence, or override the policies that govern it. Autonomous operation is acceptable only inside boundaries enforced independently of the actor.

## Motivation

An agent rewarded for passing checks will, if it can, change the checks. This is not malice; it is optimisation. Separation of duties, a long-standing control in finance and safety engineering, prevents it: the builder, the verifier and the approver are not the same authority.

## Scope

Applies to every governed change, whether the implementer is an agent, a deterministic process or a person. A person may hold several roles; the principle requires that the roles and the limits on them are explicit, not that they are always held by different people.

## Consequences

- Acceptance criteria are fixed before implementation and changed only through their own governed process.
- Evidence is produced by procedures the implementer cannot tamper with, or is marked as self-reported.
- Reviews are performed by an actor other than the implementer.

## Known limitations

- Independence is relative. In this repository, the same harness can run implementer and reviewer agents; independence comes from separate sessions, separate models and blocking hooks, not from isolation.
- Strong separation slows small changes. The boundaries must be proportionate.

## Enforcement

- Potential: acceptance policies stored outside the implementer's Mandate; signed evidence; reviewer Mandates disjoint from implementer Mandates.
- Today: partly, outside Telos. Git hooks, Spec Kitty's review gate and separate reviewer subagents enforce part of this for the repository's own development.

## Relationships

Builds on [P06](P06-authority-is-explicit.md). Protects [P09](P09-evidence-before-acceptance.md). Rooted in [P13](P13-human-as-strategic-authority.md).

## Commitment vs. current invariant

Commitment: implementers cannot govern their own acceptance. Current invariant: none in Telos; external controls on this repository.

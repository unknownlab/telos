---
id: P06-authority-is-explicit
title: Authority Is Explicit
kind: principle
number: 6
code: P06
status: provisional
maturity: vision
summary: Every protected operation needs explicit authorisation; requests never grant themselves, and logical permissions must eventually be backed by real isolation.
related:
  [
    P05-capabilities-instead-of-arbitrary-tools,
    P12-independent-governance,
    P13-human-as-strategic-authority,
    mandate,
    act,
  ]
---

# P06 — Authority Is Explicit

## Definition

Every protected operation is authorised by an explicit, inspectable grant. An actor may **request** more knowledge, wider scope or more authority; a request never grants its own permission. Logical permissions in the model must eventually be enforced by runtime isolation and security boundaries suited to the risk.

## Motivation

Implicit authority ("it ran, so it was allowed") cannot be audited, revoked or bounded. Explicit grants make it possible to answer who allowed an operation, under which limits, and until when. Separating request from grant stops an agent from escalating itself.

## Scope

Applies to protected operations: anything that changes accepted state, reaches outside the system, spends budget or touches sensitive data. Read-only operations on public model data may be unprotected by policy. The principle distinguishes **declared** authority, a rule in the model, from **enforced** authority, a boundary the actor cannot cross. Telos must never present the first as the second.

## Consequences

- Authority is modelled as [Mandates](../terminology/mandate.md): bounded, verifiable delegations with scope, validity, budget and revocation.
- Authority requests are first-class records with an outcome.
- Documentation states for each restriction whether it is declared only or enforced, and by what.

## Known limitations

- Isolation is expensive and platform-specific. Early versions will have declared authority with weak or no enforcement, and must say so.
- Explicit authority adds friction. Delegation rules and standing Mandates must keep routine work routine ([P13](P13-human-as-strategic-authority.md)).

## Enforcement

- Potential: Mandate checks in every Act invocation; capability-based runtimes; OS or VM sandboxes for coarse capabilities.
- Today: not enforced by Telos. Repository governance uses advisory rules in `AGENTS.md` and blocking git hooks, which are external and partial.

## Relationships

Completes [P05](P05-capabilities-instead-of-arbitrary-tools.md). Required by [P12](P12-independent-governance.md). Bounded by [P13](P13-human-as-strategic-authority.md) (the root of authority is human).

## Commitment vs. current invariant

Commitment: every protected operation is explicitly authorised and, eventually, isolated. Current invariant: none in Telos.

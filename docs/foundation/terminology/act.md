---
id: act
title: Act
kind: term
order: 10
classification: execution-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: A typed capability or operation exposed by a Locus under a contract with inputs, outputs, errors, declared effects and authority requirements.
related:
  [locus, mandate, facet, P05-capabilities-instead-of-arbitrary-tools, ADR-0009]
---

# Act

## Definition

A typed capability or operation exposed by a Locus under a defined contract. The contract includes inputs, outputs, errors, declared effects and authority requirements.

## Responsibility

Acts are how anything, including an agent, does something through Telos ([P05](../principles/P05-capabilities-instead-of-arbitrary-tools.md)). Their contracts make actions inspectable and their effects predictable.

## Boundaries

- An **Act definition** is part of a Locus's specification. An **Act execution** is an event at run time. They are different things; executions are recorded with a reference to the definition and its Revision.
- An Act is **not** an arbitrary tool. "Run shell" is only an Act if someone declares it, with its effects and authority, and then it is visibly coarse.
- An Act's declared effects are a **claim**. Isolation that guarantees them is a separate concern ([P06](../principles/P06-authority-is-explicit.md)).

## Effect fit

An Act contract maps naturally onto an Effect type: success value, typed error and required services, where required services include the authority and resources the Act needs.

## Relationships

Exposed by a [Locus](locus.md), probably as a behaviour [Facet](facet.md). Invoked under a [Mandate](mandate.md). Executions may produce [Witnesses](witness.md).

## Invariants (proposed)

- Every Act has an identity unique within its Locus and a complete contract.
- Every execution references an Act definition Revision and a Mandate.

## Lifecycle

Definitions evolve with their Locus's Revisions. Executions are immutable records.

## Examples

`shop:payment-authorization#authorize(orderId, amount) → Authorization | Declined | ProviderUnavailable`, effects: calls the payment provider; authority: `payments.authorize`.

## Non-examples

A free function call inside a Locus's implementation, a shell command an agent happens to run.

## Open questions

- How fine-grained should Acts be?
- How do Act contracts relate to Effect services and Schema in code?

## Classification

Execution model. Not fundamental. Needs a runtime. Definition provisional. Stage 0: deferred ([ADR-0009](../../decisions/ADR-0009-capabilities-for-agents.md)).

---
id: ADR-0009
title: AI tools are modelled as bounded capabilities
kind: decision
status: proposed
maturity: vision
date: 2026-10-21
summary: Agents act only through declared Acts with typed contracts under explicit Mandates, never through general-purpose tools such as unrestricted shells; nothing of this is built in Stage 0.
related:
  [
    act,
    mandate,
    lens,
    P05-capabilities-instead-of-arbitrary-tools,
    P06-authority-is-explicit,
    open-questions,
  ]
---

# ADR-0009 — AI tools are modelled as bounded capabilities

## Context

Agents today usually receive general tools: a shell, file write access, network access. Their effective authority is everything those tools can do, which cannot be reviewed or verified per change. [P05](../foundation/principles/P05-capabilities-instead-of-arbitrary-tools.md) and [P06](../foundation/principles/P06-authority-is-explicit.md) commit Telos to the opposite.

## Decision

As a direction for the Agents capability ([CAP-06](../foundation/architecture/capabilities.md#cap-06-agents)):

1. An agent can only invoke [Acts](../foundation/terminology/act.md): named operations with typed inputs, outputs, errors and declared effects, owned by a Locus.
2. Invoking an Act requires a [Mandate](../foundation/terminology/mandate.md) naming the agent, the Acts, the scope and the expiry.
3. An agent sees the model through a [Lens](../foundation/terminology/lens.md), not the whole repository.
4. Enforcement needs a runtime substrate; until one exists, declared capabilities are a convention and the documentation says so.

Stage 0 builds none of this. The record exists so Stage 0 contracts do not preclude it: Locus operations are typed Effect programs that could later be exposed as Acts.

## Alternatives

- **General tools plus review of results**: today's practice; authority is unbounded and review is after the fact.
- **Allow-lists of shell commands**: bounded in name, but commands compose into arbitrary behaviour.

## Consequences

- Agent work is slower to set up: someone must define Acts before an agent can do something new.
- The substrate question ([OQ-016](../foundation/open-questions.md#oq-016)) gates any claim of enforcement.

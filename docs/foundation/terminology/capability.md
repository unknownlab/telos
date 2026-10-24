---
id: capability
title: Capability
kind: term
order: 7
classification: execution-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A named operation a Locus provides, with an input contract, an output contract, declared errors and an effect class of pure, read or write.
related:
  [
    contract,
    grant,
    interface-locus,
    P05-agents-use-semantic-apis,
    P15-no-arbitrary-agent-privileges,
  ]
---

# Capability

## Definition

A named operation that a [Locus](locus.md) provides. It has an input [contract](contract.md), an output contract, declared errors and an effect class: `pure`, `read` or `write`.

## Avoid

"act", "tool" (for the operation itself) and "endpoint". A capability is typed and declared; a tool suggests ambient power, and an endpoint suggests one medium only. See [P15](../principles/P15-no-arbitrary-agent-privileges.md).

## In the model

Capabilities are declared on a Locus in `packages/kernel/src/capability.ts`. `invoke` in `packages/kernel/src/invoke.ts` runs a capability only when a [grant](grant.md) allows it. Interface Loci expose capabilities through a medium; see [interface Locus](interface-locus.md).

## Related

- [Contract](contract.md), [grant](grant.md), [interface Locus](interface-locus.md).

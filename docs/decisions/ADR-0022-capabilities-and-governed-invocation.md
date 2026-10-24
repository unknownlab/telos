---
id: ADR-0022
title: Capabilities and governed invocation
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A capability is a named operation with contracts and an effect class. Invocation checks a grant, and the CLI, Web and Agent interfaces share one invoke function.
related:
  [
    ADR-0009,
    capability,
    contract,
    grant,
    interface-locus,
    P05-agents-use-semantic-apis,
    P15-no-arbitrary-agent-privileges,
  ]
---

# ADR-0022 — Capabilities and governed invocation

## Context

[ADR-0009](ADR-0009-capabilities-for-agents.md) modelled AI tools as bounded capabilities. The Stage 0 model also had Acts and Mandates for the same purpose, which made the authority to act hard to read. [P05](../foundation/principles/P05-agents-use-semantic-apis.md) and [P15](../foundation/principles/P15-no-arbitrary-agent-privileges.md) require that agents act only through semantic APIs with limits they can read.

## Decision

1. A [capability](../foundation/terminology/capability.md) is a named operation a Locus provides. It has an input [contract](../foundation/terminology/contract.md), an output contract, declared errors and an effect class: `pure`, `read` or `write`.
2. `invoke(model, ref, input, { via })` checks the [grant](../foundation/terminology/grant.md), decodes the input, runs the handler and encodes the outcome. A grant exists when the Locus invokes its own capability, or when a relation whose type grants invocation points to it (spec D6).
3. Introspection never grants invocation. Reading a capability's contract is allowed to anyone, and calling it is not (spec D6).
4. The CLI, Web and Agent [interface Loci](../foundation/terminology/interface-locus.md) all call the same `invoke`, so their errors are identical.
5. Capabilities replace Acts and Mandates.

## Alternatives

- **Give agents the general tools of the environment**, such as a shell and file write access. Rejected by [P15](../foundation/principles/P15-no-arbitrary-agent-privileges.md): the authority is everything the tools can do, and it cannot be reviewed per change.
- **Let each interface implement its own invocation.** Rejected: the errors would differ between the CLI, the Web and the Agent interfaces (NFR-004 of the spec).
- **Use the high-level MCP toolkit, which validates parameters itself.** Rejected: it answers with protocol errors that bypass the kernel's `InvalidInput`, so the errors would differ again (research R6).

## Consequences

- Every interface reports the same error for the same invalid call.
- A capability that a model lists is not thereby callable. Callability needs a grant in the model.
- The MCP and CLI adapters are thin: they decode their own input and call `invoke`.

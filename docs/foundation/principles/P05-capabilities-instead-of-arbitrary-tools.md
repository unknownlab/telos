---
id: P05-capabilities-instead-of-arbitrary-tools
title: Capabilities Instead of Arbitrary Tools
kind: principle
number: 5
code: P05
status: provisional
maturity: vision
summary: Agents act through typed capabilities provided by the semantic units they work in, never through ambient shell, file, network, database or deployment access.
related:
  [
    P06-authority-is-explicit,
    P12-independent-governance,
    act,
    mandate,
    lens,
    ADR-0009,
  ]
---

# P05 — Capabilities Instead of Arbitrary Tools

## Definition

An agent operates through capabilities that the semantic units it works in provide: [Acts](../terminology/act.md) with typed inputs, outputs, errors, declared effects and authority requirements. An agent does not automatically receive arbitrary shell, file system, network, database or deployment access. Any such access is itself a capability with a contract, granted by a [Mandate](../terminology/mandate.md).

## Motivation

A general-purpose tool such as a shell grants everything the host can do. An agent with a shell can edit its own acceptance criteria, read secrets and deploy to production, whatever its task. Object-capability security shows a better pattern: authority travels with explicit references, and a component can only affect what it was given. Typed capabilities also make agent actions inspectable and their effects predictable.

## Scope

Applies to AI agents and, by extension, to any automated actor operating inside Telos. Human developers using their own tools are outside the framework's control; when they act through Telos, the same capabilities apply. The principle governs what the framework grants. Real isolation is a separate concern ([P06](P06-authority-is-explicit.md)).

## Consequences

- Agent integrations are declared as Acts on Loci, not as raw tool lists.
- A coarse capability (for example "run any command") is allowed only as an explicit, visible, high-risk Act, never as a default.
- The context an agent sees ([Lens](../terminology/lens.md)) and the actions it may take (Mandate) are separate.

## Known limitations

- Today's agent harnesses, including the ones developing Telos, give agents shells. Telos cannot fix that from inside a repository. The principle describes Telos's own runtime, not the current development setup.
- Narrow capabilities can make exploration slow. The cost has to be measured, not assumed ([assumption A5](../philosophy/evolution-of-determinism.md#4-assumptions)).
- A declared capability without runtime isolation is a convention, not a security boundary.

## Enforcement

- Potential: agent runtimes that expose only Act implementations; capability references that cannot be forged; sandboxed execution for coarse capabilities.
- Today: not enforced. Out of scope for Stage 0 ([ADR-0009](../../decisions/ADR-0009-capabilities-for-agents.md)).

## Relationships

Depends on [P04](P04-explicit-composition.md) (capabilities are part of declared composition). Completed by [P06](P06-authority-is-explicit.md) (who may use a capability) and [P12](P12-independent-governance.md) (agents cannot change their own limits).

## Commitment vs. current invariant

Commitment: agents act only through granted capabilities. Current invariant: none.

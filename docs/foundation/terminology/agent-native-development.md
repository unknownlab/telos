---
id: agent-native-development
title: Agent-native development
kind: term
order: 21
classification: approach
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: An approach in which agents work with a system through its semantic model and granted capabilities, so that their access is typed, visible and limited.
related:
  [
    semantic-first-programming,
    executable-introspection,
    capability,
    grant,
    P05-agents-use-semantic-apis,
  ]
---

# Agent-native development

## Definition

An approach in which AI agents work on a system through its [semantic model](semantic-model.md) and through [capabilities](capability.md) that they have been [granted](grant.md). The agent reads the model with typed queries and acts only through declared operations.

## Avoid

"AI-assisted" as a substitute for the model. Agent-native development is about the interface an agent uses, not about how much an agent writes.

## In the model

The agent tools in `packages/agent/src/tools.ts` are built from the model's capabilities. `invoke` in `packages/kernel/src/invoke.ts` enforces grants. See [principle P05](../principles/P05-agents-use-semantic-apis.md) and [principle P14](../principles/P14-no-ai-in-the-kernel.md).

## Related

- [Semantic-first programming](semantic-first-programming.md), [executable introspection](executable-introspection.md), [grant](grant.md).

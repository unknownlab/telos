---
id: executable-introspection
title: Executable introspection
kind: term
order: 22
classification: approach
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The practice of answering questions about a system by running typed queries over its model, so that the answer is computed rather than copied from prose.
related:
  [
    semantic-model,
    impact,
    semantic-first-programming,
    P05-agents-use-semantic-apis,
  ]
---

# Executable introspection

## Definition

Answering questions about a system by running typed queries over its [semantic model](semantic-model.md). The answer is computed from the model, and it names what the model does not know.

## Avoid

"documentation lookup". A lookup returns text that someone wrote; an introspection query returns the current computed answer.

## In the model

The introspection API is in `packages/kernel/src/introspection.ts`. `bun run telos inspect` and the agent tools in `packages/agent/src/tools.ts` both call it. [Impact](impact.md) is one of its queries.

## Related

- [Semantic model](semantic-model.md), [impact](impact.md), [principle P05](../principles/P05-agents-use-semantic-apis.md).

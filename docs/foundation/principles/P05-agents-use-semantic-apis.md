---
id: P05-agents-use-semantic-apis
title: Agents Access Knowledge Through Semantic APIs
kind: principle
number: 5
code: P05
status: provisional
maturity: proposed
summary: Agents read and change a system through typed introspection and capability APIs over the semantic model, not by searching raw files or running untyped commands.
related:
  [
    P15-no-arbitrary-agent-privileges,
    P04-code-is-the-source-of-truth,
    executable-introspection,
    capability,
    agent-native-development,
  ]
---

# P05 — Agents Access Knowledge Through Semantic APIs

## Definition

An agent that needs to know about a system asks the semantic model: which Loci exist, what a Locus declares, which relations it has, what a [capability](../terminology/capability.md) needs and returns, and what an [impact](../terminology/impact.md) would be. The agent does not need to search raw files to answer these questions, and it does not need to parse prose to find them. Each question has a typed answer with a stable shape.

## Motivation

Agents work faster and make fewer errors when the answer has a known structure. Raw file search returns text that the agent must interpret every time, and it cannot say whether the answer is complete. A typed query answers the question from the model and reports what it does not know.

## In practice

- The introspection tools in `packages/agent/src/tools.ts` expose the model's queries as typed tools with input and output contracts.
- `bun run telos inspect` gives the same answers to a person in the terminal.
- The introspection API in `packages/kernel/src/introspection.ts` is the one source for both, so the agent and the person see the same model.

## Limits

- Introspection shows what is declared. An agent still has to read code to judge whether the declaration is right.
- Semantic APIs do not replace reading the code for behaviour that the model does not describe.

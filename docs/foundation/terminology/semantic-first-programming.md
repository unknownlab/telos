---
id: semantic-first-programming
title: Semantic-first programming
kind: term
order: 20
classification: approach
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: An approach in which the meaning of a system is declared and checked first, and code is written against that declared meaning.
related:
  [locus, semantic-model, agent-native-development, executable-introspection]
---

# Semantic-first programming

## Definition

An approach in which the meaning of a system is declared as [Loci](locus.md), extensions and [capabilities](capability.md) before, or together with, the code that implements it. The declared meaning is checked against the code, so the code cannot silently drift from it.

## Avoid

"low-code" and "model-driven generation". Semantic-first programming does not generate the program from the model; the code remains the source of truth ([principle P04](../principles/P04-code-is-the-source-of-truth.md)).

## In the model

The approach is supported by the kernel's model and checks in `packages/kernel/src`, and by the introspection tools in `packages/agent/src/tools.ts`.

## Related

- [Agent-native development](agent-native-development.md), [executable introspection](executable-introspection.md).

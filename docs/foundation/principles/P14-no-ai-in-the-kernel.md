---
id: P14-no-ai-in-the-kernel
title: No AI Dependency in the Semantic Kernel
kind: principle
number: 14
code: P14
status: provisional
maturity: proposed
summary: The semantic kernel is deterministic and imports no model provider; AI agents use the kernel through its APIs and never become a part of it.
related:
  [
    P05-agents-use-semantic-apis,
    P09-no-duplicated-frameworks,
    P15-no-arbitrary-agent-privileges,
    semantic-model,
  ]
---

# P14 — No AI Dependency in the Semantic Kernel

## Definition

The semantic kernel, `packages/kernel`, is deterministic. It depends only on `effect` and on the language runtime, and it calls no model provider. Its results depend only on its inputs. AI agents are clients of the kernel. They read the model and request capabilities through its APIs, and they are not inside its computation.

## Motivation

A kernel that calls a model cannot be trusted to give the same answer twice, cannot run offline and cannot be checked by a test that expects one result. Keeping the model deterministic makes its findings reproducible and makes the agent layer replaceable.

## In practice

- The `package.json` of `packages/kernel` lists `effect` as its only runtime dependency.
- No file in `packages/kernel/src` imports a model provider SDK. The Semantic Closure check of `bun run telos check` (the last step of `bun run verify`) rejects every package import in `packages/kernel` that `telos:kernel` does not declare in `telos.ts`, and `telos:kernel` declares only `effect`.
- The agent package `packages/agent` is the only place where model calls may appear, and it calls the kernel through its public API.

## Limits

- Some useful checks, such as judging the quality of a description, need judgement that a deterministic rule does not give. Those checks belong in an agent or a person, outside the kernel, and their results are recorded with a lower status.

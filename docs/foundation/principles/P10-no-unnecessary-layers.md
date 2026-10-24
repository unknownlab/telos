---
id: P10-no-unnecessary-layers
title: No Unnecessary Abstraction Layers
kind: principle
number: 10
code: P10
status: provisional
maturity: proposed
summary: Telos adds an abstraction only when a concrete need requires it, and each layer must have a caller that needs it, so the code stays direct and readable.
related:
  [
    P09-no-duplicated-frameworks,
    P16-no-speculative-implementation,
    P08-no-mandatory-architecture,
  ]
---

# P10 — No Unnecessary Abstraction Layers

## Definition

A layer of indirection is added only when at least one real caller needs the indirection. A wrapper that only forwards calls, a registry with one entry or an interface with one implementation is removed rather than kept for future flexibility. The number of steps between a semantic question and its answer stays as small as the problem allows.

## Motivation

Each layer costs reading time and hides the path from the question to the code. Frameworks often grow layers that look like architecture and do no work. Keeping the path short makes the semantic model easier to trace and to change.

## In practice

- The model is built by one function, `buildModel` in `packages/kernel/src/model.ts`, and not by a chain of builders.
- Introspection queries call the model directly; no separate query service sits between them.
- Interface Loci in `packages/agent` and `packages/cli` call the kernel's functions directly.

## Limits

- Some layers are needed for testing or for a second implementation. Those layers are named, and their caller is stated in the code.
- Removing a layer that a later feature needs costs a change later. That cost is accepted over speculative layers ([P16](P16-no-speculative-implementation.md)).

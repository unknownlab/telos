---
id: interface-locus
title: Interface Locus
kind: term
order: 16
classification: execution-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: A Locus that exposes the capabilities of another Locus through a medium such as the command line, the Web or agent tools.
related: [locus, capability, pack, grant]
---

# Interface Locus

## Definition

A [Locus](locus.md) that exposes the [capabilities](capability.md) of another Locus through a medium: the command line, the Web or agent tools.

## Avoid

"adapter" in prose. An adapter is an implementation detail; an interface Locus is a Locus of its own with its own identity, so its exposure can be inspected and granted.

## In the model

The command-line interface is in `packages/cli/src/index.ts`, the agent tools are in `packages/agent/src/tools.ts` and the Web surface is in `packages/web/src/index.ts`. Each is declared as an interface Locus over the kernel's capabilities. An invocation through an interface Locus still needs a [grant](grant.md).

## Related

- [Capability](capability.md), [Pack](pack.md), [grant](grant.md).

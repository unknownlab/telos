---
id: ADR-0027
title: Packs are ordinary packages
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A Pack is an ordinary TypeScript package that distributes extensions, Archetypes and adapters. It is built on Effect modules that already exist, with no plugin registry and no new dependency.
related:
  [
    pack,
    ADR-0004,
    ADR-0011,
    P08-no-mandatory-architecture,
    P09-no-duplicated-frameworks,
    P16-no-speculative-implementation,
  ]
---

# ADR-0027 — Packs are ordinary packages

## Context

The directive names the first Packs: `@telos/cli`, `@telos/agent` and `@telos/web` (spec D3). A [Pack](../foundation/terminology/pack.md) distributes extensions, Archetypes and adapters. The question is whether Packs need a mechanism of their own, such as a plugin registry or dynamic loading. [P09](../foundation/principles/P09-no-duplicated-frameworks.md) forbids a second framework, and [P16](../foundation/principles/P16-no-speculative-implementation.md) forbids building for needs that do not exist.

## Decision

1. A Pack is an ordinary TypeScript package in the workspace. It exports extensions, Archetypes and adapters as ordinary values.
2. The Packs build on Effect modules that already exist: `effect/cli` for the command line, and the Effect MCP server for agent tools ([ADR-0004](ADR-0004-typescript-and-effect.md) fixes Effect as the authoring model).
3. There is no plugin registry and no dynamic discovery. A Pack is used by importing it.
4. No new third-party dependency is added for Packs (research R12). Directive 051 is met by not changing third-party dependencies.

## Alternatives

- **A plugin registry with discovery at run time.** Rejected: it would be a second framework next to Effect, and no current use needs discovery (P09, P16).
- **An external plugin system.** Rejected: it adds a dependency, which this rebuild avoids.
- **Packs inside the kernel.** Rejected: the kernel would depend on the interfaces it is meant to serve, which is the layering P10 avoids.

## Consequences

- A Pack can be tested and built like any other package in the workspace.
- Adding a new Pack needs a workspace entry and an import, and no registration step.
- If real use shows a need for discovery, a later record can add it with its own evidence.

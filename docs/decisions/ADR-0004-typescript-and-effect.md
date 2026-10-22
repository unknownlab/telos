---
id: ADR-0004
title: TypeScript and Effect are the authoring model
kind: decision
status: accepted
maturity: implemented
date: 2026-10-21
summary: Telos is authored in ordinary TypeScript with Effect for everything that can fail, needs services, does I/O or takes time; pure data stays plain.
related: [technical-direction, P01-everything-is-code, P15-engine-independence]
---

# ADR-0004 — TypeScript and Effect are the authoring model

## Context

"Everything is code" needs one language in which applications, infrastructure, agents, requirements and policies can all be expressed and checked. The language should have a strong type system, run in browsers and servers, have a large ecosystem, and be one that AI agents read and write well. The computations Telos runs (validation, hashing, verification, orchestration) need typed errors, swappable services, resource safety and concurrency.

## Decision

1. TypeScript (strict) is the authoring language. Telos uses ordinary TypeScript values and functions, not a new syntax.
2. Effect is the computational foundation. Operations that can fail, need a service, do I/O or take time return `Effect` values. Untrusted input is decoded with Effect `Schema`. Engines are Effect services provided by layers.
3. Pure data (definitions) and total pure functions are not wrapped in Effect.
4. Telos starts on Effect 4 (stable since 2026-10-01).

## Alternatives

- **Plain TypeScript with exceptions and ad-hoc dependency injection**: smaller, but errors are untyped and engines are hard to swap and test.
- **A new DSL**: maximal expressiveness, but a compiler, an editor story and a learning curve before any value.
- **fp-ts or neverthrow**: narrower; Effect covers errors, services, resources, concurrency and schemas in one coherent system.
- **Effect 3**: more training data for agents, but Telos would start with a known migration.

## Consequences

- Contributors and agents must know Effect. The docs explain the subset Telos uses.
- Effect 4 is newer than many models' training data. Implementers must read the installed type definitions rather than rely on memory of Effect 3 APIs.
- Effect is a deliberate dependency of the foundation, not an accident ([P15](../foundation/principles/P15-engine-independence.md)).

---
id: P09-no-duplicated-frameworks
title: No Duplication of Existing Frameworks
kind: principle
number: 9
code: P09
status: provisional
maturity: proposed
summary: Telos does not reimplement general-purpose frameworks such as a type system, a test runner, a schema library or a build tool; it uses them and adds only the semantic layer they lack.
related:
  [
    P10-no-unnecessary-layers,
    P08-no-mandatory-architecture,
    P14-no-ai-in-the-kernel,
    semantic-model,
  ]
---

# P09 — No Duplication of Existing Frameworks

## Definition

When a general-purpose tool already solves a problem, Telos uses that tool. The kernel does not carry its own copy of a type checker, a parser framework, a test runner, a schema validator or a package manager. Telos adds code only where the problem is semantic: Loci, extensions, relations, Archetypes and their findings.

## Motivation

A framework that reimplements the tools around it doubles the maintenance and creates two sources of truth for the same behaviour. Reusing mature tools keeps the semantic layer small and lets the team change the tools without rewriting the model.

## In practice

- The kernel in `packages/kernel` depends on `effect` for its effects and typed errors, as recorded in [ADR-0004](../../decisions/ADR-0004-typescript-and-effect.md).
- Schemas for the model use the schema support already in `effect`; no separate validation library is added.
- Checks such as formatting, linting and type checking are run by the repository tools declared in `package.json`.

## Limits

- Reuse brings the dependency's own limits. Telos inherits them and reports them where they matter.
- Deciding whether a capability is general or semantic is a judgement; the boundary is recorded in the decision that adds the code.

---
id: P03-no-code-outside-semantics
title: No Code Outside Semantics
kind: principle
number: 3
code: P03
status: provisional
maturity: proposed
summary: Every managed code file belongs to a discoverable Locus owner, and a file without an owner is a reported finding, not a silent gap.
related:
  [
    P04-code-is-the-source-of-truth,
    P12-no-duplicate-semantic-models,
    semantic-closure,
    containment,
    finding,
  ]
---

# P03 — No Code Outside Semantics

## Definition

Every managed code file must belong to a discoverable Locus owner. This property is called [Semantic Closure](../terminology/semantic-closure.md). A file that no Locus owns is not hidden: it is reported as a [finding](../terminology/finding.md) against the model, so that the gap is visible and can be closed or accepted on purpose.

## Motivation

Code that no one owns accumulates without a stated purpose. Reviews, impact analysis and agent work all depend on knowing which Locus a file serves. A coverage percentage can be high while important files remain unowned, so the property is stated as closure over the whole managed tree.

## In practice

- The Semantic Closure check in `packages/kernel/src/closure.ts` walks the managed tree and matches each file to a Locus owner declared in the model.
- `bun run telos check` runs the closure check together with the structural diagnostics and prints each unowned file as a finding.
- The check is part of the repository gate that WP15 adds to `bun run verify`.

## Limits

- Closure is only as complete as the declared ownership. A file can be owned by a broad Locus that does not describe it well.
- The check covers managed trees. Generated files and external dependencies are excluded by configuration, and the exclusion is itself declared.

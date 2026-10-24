---
id: P04-code-is-the-source-of-truth
title: Executable Code Is the Source of Semantic Truth
kind: principle
number: 4
code: P04
status: provisional
maturity: proposed
summary: The description of what a system is comes from the code and its typed definitions, and prose documentation is derived from or linked to them, never the reverse.
related:
  [
    P03-no-code-outside-semantics,
    P12-no-duplicate-semantic-models,
    P13-no-unverified-guarantees,
    semantic-model,
    executable-introspection,
  ]
---

# P04 — Executable Code Is the Source of Semantic Truth

## Definition

The current semantic description of a system is what its code and typed definitions say. A [semantic model](../terminology/semantic-model.md) is computed from those sources. Prose documents about the system describe it for people, and they are either generated from the model or linked to the part of the model they explain. When prose and code disagree, the code is correct until someone changes it on purpose.

## Motivation

Documents written beside a system drift from it, and nothing detects the drift. A description that is computed from the code cannot disagree with the code without a tool reporting it. This keeps the question "what does the system do" answerable by reading one source.

## In practice

- `buildModel` in `packages/kernel/src/model.ts` derives the model from the Loci and definitions in the repository.
- `bun run telos inspect` prints the model as it is computed, so a reader sees the code's description rather than a copy of it.
- The documentation site in `apps/docs` renders data produced from the model for the inspector and verification pages; prose pages are generated from `docs/`.

## Limits

- Code cannot say why a decision was made. Rationale stays in decision records and principles, which are linked from the model.
- Executable code is not automatically well described. A Locus with no description is still in the model, but it says little.

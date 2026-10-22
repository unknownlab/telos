---
id: P02-everything-has-meaning
title: Everything Has Meaning
kind: principle
number: 2
code: P02
status: provisional
maturity: proposed
summary: Every managed artifact belongs to an identifiable semantic context; files and directories do not own meaning.
related:
  [
    P01-everything-is-code,
    P03-semantic-ownership,
    locus,
    identity,
    charter,
    ADR-0002,
    ADR-0003,
  ]
---

# P02 — Everything Has Meaning

## Definition

Every managed artifact belongs to an identifiable semantic context, a [Locus](../terminology/locus.md). The semantic model, not the file system, decides what an artifact means, why it exists and who is responsible for it. Source files and directories are storage. They may be organised to mirror the semantic model, but they are not its owners.

## Motivation

A directory named `utils` says nothing about purpose. A file can move, split or merge without its meaning changing, and two files in one folder can serve unrelated purposes. When meaning is attached to paths, refactoring storage silently rewrites architecture. When meaning is attached to a stable semantic identity, storage can change freely and the architecture stays inspectable.

## Scope

Applies to artifacts under framework management: code, definitions, specifications, evidence, documents about managed concepts. It does not claim that every byte in a repository has been modelled. Unmanaged files are allowed; they are simply outside the model and are reported as such.

## Consequences

- Every managed artifact can answer "which Locus is this for?".
- Identity is separate from location ([ADR-0003](../../decisions/ADR-0003-identity-independent-of-paths.md)). Moving a definition does not change what it is.
- Tools can list unmanaged artifacts, which makes the boundary of the model visible.

## Known limitations

- Assigning every artifact to a context costs effort; Telos must make it cheap or it will be skipped.
- Some artifacts genuinely serve several contexts. P03 handles this by separating use from ownership, but the boundary judgements remain human.
- Detecting that a file's content no longer matches the Locus it claims to serve (semantic drift) is an open research problem ([OQ-012](../open-questions.md#oq-012)).

## Enforcement

- Potential: every managed artifact carries or is mapped to a Locus identity; validation rejects managed artifacts without one; drift detection compares definitions with source.
- Today: not enforced. The Stage 0 mission makes the first part checkable for Locus definitions: a Locus without a valid identity or Charter is rejected.

## Relationships

Builds on [P01](P01-everything-is-code.md). Refined by [P03](P03-semantic-ownership.md) (each artifact has one owner) and [P04](P04-explicit-composition.md) (contexts relate explicitly).

## Commitment vs. current invariant

Commitment: all managed artifacts belong to a semantic context. Current invariant: none on `main`; Stage 0 proposes INV-001 to INV-004 of the [conceptual model](../conceptual-model/README.md#5-invariants).

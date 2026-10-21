---
id: ADR-0005
title: Revisions are immutable and content-addressed; baselines advance by compare-and-set
kind: decision
status: proposed
maturity: proposed
date: 2026-10-21
summary: A Revision id is the SHA-256 of a canonical JSON form of the semantic definition; histories are append-only and a new head is accepted only against the expected current head.
related:
  [
    revision,
    evolution,
    P07-evolution-is-fundamental,
    P08-preserve-the-baseline,
    open-questions,
  ]
---

# ADR-0005 — Revisions are immutable and content-addressed; baselines advance by compare-and-set

## Context

[P07](../foundation/principles/P07-evolution-is-fundamental.md) and [P08](../foundation/principles/P08-preserve-the-baseline.md) need a way to name a specific state of a Locus, to tell whether two states are the same, and to stop a change from silently overwriting a baseline that moved underneath it. Git commits name repository states, not semantic states of one unit, and change when unrelated files or formatting change.

## Decision

1. A [Revision](../foundation/terminology/revision.md) is an immutable value holding one Locus definition's semantic content.
2. Its id is `sha256:<hex>` of a canonical JSON form: object keys sorted, set-valued fields (responsibilities, exclusions, success conditions, relations) sorted and de-duplicated, no insignificant whitespace, metadata such as source location excluded.
3. Hashing uses Web Crypto (`crypto.subtle.digest`), so the same code runs in Bun and in browsers, and the operation returns an `Effect`.
4. A Locus history is append-only. Appending takes the expected current head; if it differs from the actual head, the append fails with a stale-baseline error and the history is unchanged.
5. Appending a Revision equal to the current head is a no-op, not a new entry.
6. Two Revisions can be diffed into a structured change set (fields added, removed, changed).

## Alternatives

- **Sequential version numbers**: simple, but two independent edits can produce the same number for different content.
- **Git commit ids**: not per-unit and not semantic.
- **Author, time and reason inside the Revision**: useful for audit, but makes ids non-deterministic. Deferred to [OQ-009](../foundation/open-questions.md#oq-009); history entries may carry them later.
- **Last-writer-wins history**: silently loses concurrent work, contrary to P08.

## Consequences

- Identical definitions have identical Revision ids wherever they are evaluated, which the specifications and the playground check against each other.
- Any change to the canonical form changes every id; stability is [OQ-011](../foundation/open-questions.md#oq-011).
- Stage 0 histories are in memory only; persistence is Stage 1.

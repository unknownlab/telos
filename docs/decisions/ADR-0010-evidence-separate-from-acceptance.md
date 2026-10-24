---
id: ADR-0010
title: Evidence is separate from acceptance
kind: decision
status: superseded
maturity: proposed
date: 2026-10-21
summary: A result of running a check (Witness) is a different record from the decision to accept a change (Verdict); in Stage 0 every displayed result carries its provenance and no result is written by hand.
related:
  [future-semantic-evolution, P13-no-unverified-guarantees, open-questions]
---

# ADR-0010 — Evidence is separate from acceptance

> Superseded by [ADR-0023](ADR-0023-archetypes-and-knowledge-status.md).

## Context

"Tests passed" is often treated as "change accepted". They are different: evidence can be incomplete, stale or about a different revision, and acceptance is a judgement that weighs evidence against policy. Documentation sites make this worse by showing static "passing" badges that no longer correspond to any run.

## Decision

1. A [Witness](../foundation/future-semantic-evolution.md) records that a specific check ran against a specific Revision with a specific result, and how (runner, runtime, time, source revision).
2. A [Verdict](../foundation/future-semantic-evolution.md) records an acceptance decision about a Variant or Revision, citing Witnesses and the policy applied.
3. In Stage 0 neither exists as a type yet. The rule applies to the documentation site: every result it displays comes from an actual execution and shows its provenance — run now in this browser, run by Bun at build time (with the git revision), from CI (unavailable in Stage 0), or historical. The word "verified" is never hand-written in content.

## Alternatives

- **Static status badges in docs**: cheap, and wrong as soon as code changes.
- **Treating CI success as acceptance**: conflates evidence with judgement; Spec Kitty review already keeps them separate for this repository.

## Consequences

- The docs site needs a build step that runs the specifications and stores the report with its provenance, and the playground must label live runs as such.
- Witness provenance format is [OQ-015](../foundation/open-questions.md#oq-015).

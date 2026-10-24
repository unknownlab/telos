---
id: ADR-0028
title: The repository describes itself and the gate checks it
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: The file telos.ts describes the repository as a Telos model. The review gate fails on model diagnostics, failed rules or closure findings.
related:
  [
    ADR-0017,
    P04-code-is-the-source-of-truth,
    P12-no-duplicate-semantic-models,
    P13-no-unverified-guarantees,
  ]
---

# ADR-0028 — The repository describes itself and the gate checks it

## Context

[ADR-0017](ADR-0017-north-star-telos-built-with-telos.md) sets the north star that Telos is developed with Telos. [P04](../foundation/principles/P04-code-is-the-source-of-truth.md) makes the code the source of truth, and the self-description must follow it. A description that nothing checks drifts from the code, which P13 does not allow.

## Decision

1. The file `telos.ts` at the repository root describes the repository as a Telos model: its Loci, relations, capabilities and Archetypes.
2. `bun run telos check` fails on model diagnostics, failed rules or closure findings. It is the last step of `bun run verify` and of the review gate (spec D7).
3. GRACE stays in sync by hand for now (spec D4). `.grace/` keeps its hand-written module graph, and a later decision may derive it from Telos or retire parts of it. That later decision changes `AGENTS.md`.

## Alternatives

- **Keep the self-description as documentation only.** Rejected: nothing would check it, so it could drift from the code.
- **Derive `.grace/` from Telos now.** Rejected for this rebuild (spec D4): it would change the GRACE workflow before the model has been used.
- **Run the check only in CI and not in the review gate.** Rejected: a change could pass review while the model is broken, and the owner would find the failure later.

## Consequences

- A change that breaks the model fails the gate before merge, with the diagnostic code that names the problem.
- The model has to be kept current with the code, which is the cost of having it at all.
- GRACE and the Telos model can disagree until the later decision, and the review checks both.

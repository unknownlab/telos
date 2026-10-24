---
id: ADR-0023
title: Archetypes verify Loci and findings carry a knowledge status
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: An Archetype is a set of rules that applies to Loci whose kind includes given extensions. Each rule produces one finding per Locus, and findings carry a knowledge status.
related:
  [
    ADR-0010,
    ADR-0013,
    archetype,
    rule,
    finding,
    knowledge-status,
    P06-archetypes-specialize-verification,
    P13-no-unverified-guarantees,
  ]
---

# ADR-0023 — Archetypes verify Loci and findings carry a knowledge status

## Context

[ADR-0010](ADR-0010-evidence-separate-from-acceptance.md) separated evidence from acceptance. [ADR-0013](ADR-0013-temporary-executable-specifications.md) kept temporary executable specifications next to the model. The Stage 0 model also had Laws and Lenses, two concepts for constraints and views. [P06](../foundation/principles/P06-archetypes-specialize-verification.md) and [P13](../foundation/principles/P13-no-unverified-guarantees.md) require that a checked property be shown by a real check, and that declared facts not look verified.

## Decision

1. An [Archetype](../foundation/terminology/archetype.md) is a set of [rules](../foundation/terminology/rule.md). It applies to Loci whose kind includes the extensions it names (`appliesTo`).
2. A rule has a method: `static`, which reads the model, or `execution`, which runs code.
3. `verify` records one [finding](../foundation/terminology/finding.md) per rule and Locus, with the outcome `passed`, `failed` or `error`.
4. A [knowledge status](../foundation/terminology/knowledge-status.md) is attached to each fact. The statuses are `declared`, `derived`, `verified`, `failed`, `not-run` and `unknown`; Semantic Closure gives `unknown` for a file it cannot parse. `verified` is used only for a rule result produced by a real execution in this repository. `observed` and `invalidated` are reserved for later use.
5. Archetypes replace Laws and Lenses, and the temporary executable specifications of ADR-0013.

## Alternatives

- **Keep Laws and Lenses as separate concepts.** Rejected: a constraint and a view are one set of checks with different output, so two concepts duplicate the model.
- **Keep executable specifications as a separate format.** Rejected: the same checks would be written in two places, and only one of them would be part of the model.
- **A boolean "accepted" flag on each Locus.** Rejected: a declared flag is not evidence, and P13 forbids presenting it as one.

## Consequences

- A fact declared by a person is never shown as verified.
- A rule that has not run is shown as `not run`, not as passed.
- Diagnostics from the model and findings from rules are kept apart: a finding always belongs to one rule and one Locus.

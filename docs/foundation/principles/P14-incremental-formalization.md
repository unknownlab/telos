---
id: P14-incremental-formalization
title: Incremental Formalization
kind: principle
number: 14
code: P14
status: provisional
maturity: proposed
summary: Telos works with incomplete knowledge and supports gradual refinement from narrative intent to formal contracts and executable verification.
related:
  [
    P01-everything-is-code,
    P10-uncertainty-must-be-explicit,
    evolution-of-determinism,
    charter,
    law,
  ]
---

# P14 — Incremental Formalization

## Definition

Telos works with incomplete knowledge. A concept may start as narrative intent, gain structure, then contracts, then executable verification, as understanding and need grow. Useful work does not wait for full formalisation.

## Motivation

Demanding complete formal models up front stops projects before they start and produces models nobody trusts. Most engineering knowledge begins informal. Evolution of Determinism describes a path, not an entry requirement: formalisation is where knowledge goes, not where it must begin.

## Scope

Applies to every managed concept. Each has a formality level that is visible ([P10](P10-uncertainty-must-be-explicit.md)). A Charter, for example, is required to have a purpose and responsibilities, but those are plain sentences in Stage 0; making them checkable is later work.

## Consequences

- Required fields are minimal; optional structure can be added later without breaking existing definitions.
- Narrative content is accepted and marked as narrative.
- The formality of a concept can increase in a governed change, like any other change.

## Known limitations

- Informal content can stay informal forever. Telos needs incentives, such as better analysis for formal content, not mandates.
- Partially formal models can mislead: a precise field next to a vague one suggests uniform precision.

## Enforcement

- Potential: formality levels per Facet; tools that report what is formal and what is narrative.
- Today: not enforced. The Stage 0 Locus model applies the principle by requiring only identity and a minimal Charter.

## Relationships

Balances [P01](P01-everything-is-code.md). Relies on [P10](P10-uncertainty-must-be-explicit.md).

## Commitment vs. current invariant

Commitment: formalisation is gradual and visible. Current invariant: none.

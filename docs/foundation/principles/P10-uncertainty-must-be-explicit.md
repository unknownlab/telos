---
id: P10-uncertainty-must-be-explicit
title: Uncertainty Must Be Explicit
kind: principle
number: 10
code: P10
status: provisional
maturity: proposed
summary: Missing information, uncertain dependencies, unresolved risks and insufficient evidence stay visible; unknown never silently becomes passed.
related:
  [
    P09-evidence-before-acceptance,
    P14-incremental-formalization,
    witness,
    verdict,
  ]
---

# P10 — Uncertainty Must Be Explicit

## Definition

Missing information, uncertain dependencies, unresolved risks and insufficient evidence remain visible in the model and in every view of it. **Unknown never silently becomes Passed.** A check that did not run is "not run", a result whose provenance is lost is "unavailable", and an open question is listed as open.

## Motivation

The most dangerous state in engineering is false confidence. A green badge that was hardcoded, a skipped test counted as passing or an assumption forgotten after review all turn uncertainty into apparent certainty. Making uncertainty explicit keeps it in front of the people and processes that must resolve or accept it.

## Scope

Applies to every status the framework reports: validation results, verification outcomes, maturity labels, documentation. It does not demand that uncertainty be resolved before work proceeds ([P14](P14-incremental-formalization.md)); it demands that it be visible.

## Consequences

- Result types have an explicit unknown or not-run state, distinct from pass and fail.
- Documentation separates vision, proposed design and implementation, and never claims verification it cannot show ([foundation maturity vocabulary](../README.md#maturity-vocabulary)).
- Open questions are recorded with identifiers ([open questions](../open-questions.md)).

## Known limitations

- Too much displayed uncertainty becomes noise and is ignored. Views must prioritise.
- Some uncertainty is unknown unknowns; it cannot be listed, only reduced by exploration.

## Enforcement

- Potential: type-level distinction between known and unknown outcomes; display components that cannot render a pass without a result.
- Today: not enforced. Stage 0 proposes that the documentation site derives every displayed result from an actual execution with its origin, and shows "not run" otherwise.

## Relationships

Precondition of [P09](P09-evidence-before-acceptance.md). Companion of [P14](P14-incremental-formalization.md). Expresses limitation 1 to 8 of the [philosophy](../philosophy/evolution-of-determinism.md#5-limitations).

## Commitment vs. current invariant

Commitment: uncertainty is always visible. Current invariant: none on `main`.

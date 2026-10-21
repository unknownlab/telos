---
id: evolution
title: Evolution
kind: term
order: 16
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: The governed process of proposing, analysing, constructing, verifying, evaluating and possibly accepting a change between Revisions.
related:
  [
    variant,
    witness,
    verdict,
    revision,
    mandate,
    P07-evolution-is-fundamental,
    evolution-of-determinism,
  ]
---

# Evolution

## Definition

The governed process of proposing, analysing, constructing, verifying, evaluating and potentially accepting a change between Revisions. It may include agents, deterministic processes, human decisions and delegated operations. It ends in acceptance, rejection, suspension or further analysis.

## Responsibility

Evolution is the mechanism of [P07](../principles/P07-evolution-is-fundamental.md) and the operational form of [Evolution of Determinism](../philosophy/evolution-of-determinism.md). Each Evolution should leave behind not only a changed system but recorded reasons, evidence and, where useful, new constraints.

## Boundaries

- "Evolution" (capitalised, the Telos process) is **not** the philosophy "Evolution of Determinism", though it implements part of it.
- An Evolution is **not** a Spec Kitty mission. A mission is today's external stand-in, with similar phases (specify, plan, implement, review, accept, merge) but without Telos semantics.
- An Evolution is **not** a single commit or pull request.

## Steps (proposed)

Proposal → analysis (impact, risk) → [Variant](variant.md) construction → verification ([Witnesses](witness.md)) → evaluation ([Verdict](verdict.md)) → acceptance (baseline advances) or another outcome.

## Relationships

Operates on [Revisions](revision.md) through Variants. Authorised by [Mandates](mandate.md). Concluded by Verdicts.

## Invariants (proposed)

- Every Evolution has a recorded outcome, even if abandoned.
- Every accepted Evolution references the Verdict that accepted it.

## Lifecycle

Opened, progressed through steps, concluded with an outcome. Concluded Evolutions are immutable history.

## Examples

The Stage 0 Locus foundation mission is the kind of change an Evolution will govern; today Spec Kitty governs it.

## Non-examples

An unrecorded edit, an automated formatter run.

## Open questions

- How small can an Evolution be before its overhead dominates?
- When does Telos govern its own Evolutions ([OQ-018](../open-questions.md#oq-018))?

## Classification

Governance model. Not fundamental. Needs an orchestration engine. Definition provisional. Stage 0: deferred.

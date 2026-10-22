---
id: witness
title: Witness
kind: term
order: 14
classification: governance-model
fundamental: false
engine: true
stage0: deferred
status: provisional
maturity: vision
summary: An identifiable piece of evidence produced by an observation, verification procedure or execution, with enough provenance to tell what it supports.
related:
  [
    verdict,
    revision,
    law,
    P09-evidence-before-acceptance,
    P10-uncertainty-must-be-explicit,
    ADR-0010,
  ]
---

# Witness

## Definition

An identifiable piece of evidence produced by an observation, a verification procedure or an execution. A Witness keeps enough provenance to determine what it actually supports.

## Responsibility

Witnesses are what decisions rest on ([P09](../principles/P09-evidence-before-acceptance.md)). Their provenance lets later readers know whether they still apply.

## Boundaries

- A Witness is **evidence, not a decision**. A passing Witness does not accept anything; a [Verdict](verdict.md) does ([ADR-0010](../../decisions/ADR-0010-evidence-separate-from-acceptance.md)).
- A Witness can say **pass, fail, inconclusive or not run**, and can become **obsolete** when its subject or conditions change. All of these are legitimate evidence states ([P10](../principles/P10-uncertainty-must-be-explicit.md)).
- A Witness is **not** a log line. It is a structured record with a subject and provenance.

## Minimum provenance (proposed)

Subject (which claim, which Revision), method (which procedure, which version), environment (runtime, platform), origin (where it ran: local, browser, CI), time, outcome, and for failures the observed difference.

## Relationships

About a [Revision](revision.md) and a claim, often a [Law](law.md) or a specification. Consumed by [Verdicts](verdict.md).

## Invariants (proposed)

- A Witness is immutable once recorded.
- A Witness without a subject Revision cannot support acceptance.

## Lifecycle

Produced; consumed by Verdicts; becomes obsolete when its subject is superseded or its validity conditions lapse; kept in history.

## Examples

"Specification LOC-002, case 'duplicate identity rejected', passed on Revision `sha256:…` of the Locus package, run by Bun 1.4.4 on macOS, 2026-10-21T10:00Z." The Stage 0 documentation site's verification records are Witness-shaped but are not yet Witness values.

## Non-examples

A green badge with no subject, "all tests pass" with no revision.

## Open questions

- What is the minimum provenance, and how is it checked ([OQ-015](../open-questions.md#oq-015))?
- How are Witnesses signed or otherwise protected from tampering ([P12](../principles/P12-independent-governance.md))?

## Classification

Governance model. Not fundamental. Produced by verification engines. Definition provisional. Stage 0: deferred.

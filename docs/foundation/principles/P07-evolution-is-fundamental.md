---
id: P07-evolution-is-fundamental
title: Evolution Is Fundamental
kind: principle
number: 7
code: P07
status: provisional
maturity: vision
summary: Software development is a governed transition between versions of semantic systems, and that applies to everything Telos manages, including Telos itself.
related:
  [
    evolution-of-determinism,
    P08-preserve-the-baseline,
    P16-self-application,
    evolution,
    revision,
    variant,
  ]
---

# P07 — Evolution Is Fundamental

## Definition

Software development is a controlled transition between versions of semantic systems. Change is not an exception to be minimised but the normal state, and it is modelled directly: a baseline [Revision](../terminology/revision.md), a candidate [Variant](../terminology/variant.md), evidence, a decision and, if accepted, a new Revision. This applies to applications and equally to requirements, agents, infrastructure, workflows, policies and the software factory itself.

## Motivation

Systems in use must keep changing (Lehman). Tools that treat a system as a static artifact, with history kept elsewhere in version control, lose the reasons for change and the evidence behind it. Modelling evolution makes change inspectable: what changed, why, on what evidence and with which consequences.

## Scope

Applies to every managed concept. It does not replace version control for bytes; git keeps storing files. Evolution operates on semantic definitions and their accepted states.

## Consequences

- Every managed definition has a history of Revisions.
- A change is an [Evolution](../terminology/evolution.md) with an outcome: accepted, rejected, suspended or sent back for analysis.
- Policies and processes are versioned like code, and changing them is itself governed.

## Known limitations

- Modelling every small edit as a governed transition would be unbearable. Evolution must scale from a typo to an architecture migration.
- External effects (a sent email, a deployed database migration) cannot always be versioned or undone ([P08](P08-preserve-the-baseline.md)).

## Enforcement

- Potential: an Evolution engine through which all accepted change flows.
- Today: not enforced by Telos. Spec Kitty missions approximate Evolutions for this repository's development.

## Relationships

Expresses the philosophy directly. Made safe by [P08](P08-preserve-the-baseline.md) and [P09](P09-evidence-before-acceptance.md). Applied reflexively by [P16](P16-self-application.md).

## Commitment vs. current invariant

Commitment: all change is governed transition between Revisions. Current invariant: none in Telos.

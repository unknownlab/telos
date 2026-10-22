---
id: P16-self-application
title: Self-Application
kind: principle
number: 16
code: P16
status: provisional
maturity: vision
summary: Telos will progressively use its own semantic and evolutionary mechanisms to develop itself, as fast as they become trustworthy and no faster.
related: [P07-evolution-is-fundamental, evolution-of-determinism, ADR-0011]
---

# P16 — Self-Application

## Definition

Telos will use its own semantic model and evolution mechanisms to develop Telos. This happens progressively: each mechanism takes over a responsibility from the temporary external tools only once it is trustworthy enough. Self-hosting is never simulated before it exists.

## Motivation

A framework that its makers do not use is untested where it matters most. Self-application is also the strongest test of Evolution of Determinism: if Telos cannot accumulate knowledge about itself, it will not do so for anyone else.

## Scope

Applies to Telos's own development. The order in which responsibilities move in is a roadmap decision ([roadmap](../roadmap/README.md)). Until a responsibility moves, the external tool keeps it, and the ownership table in the [foundation index](../README.md#who-owns-which-artifact) says so ([ADR-0011](../../decisions/ADR-0011-temporary-engineering-tools.md)).

## Consequences

- Telos's own packages are described as Loci as soon as Loci exist. The Stage 0 Locus package is expected to describe itself with its own API as an example.
- Each handover from Spec Kitty or GRACE to a Telos mechanism is an explicit decision, with the old mechanism kept until the new one is proven.
- Documentation never claims that Telos governs its own development before it does.

## Known limitations

- Bootstrapping is circular: a broken Telos cannot fix itself with itself. External tools stay as a fallback.
- Self-application can bias design toward framework-development needs. Other representative cases must keep being checked ([conceptual model](../conceptual-model/README.md#31-representative-cases)).

## Enforcement

- Potential: handover checklists; evidence that a Telos mechanism matches the external tool's behaviour before replacing it.
- Today: not applicable. Telos governs nothing yet.

## Relationships

Applies [P07](P07-evolution-is-fundamental.md) reflexively. Constrained by every other principle, in particular [P09](P09-evidence-before-acceptance.md).

## Commitment vs. current invariant

Commitment: Telos develops itself with itself, progressively. Current invariant: none.
